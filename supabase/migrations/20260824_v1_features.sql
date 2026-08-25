-- ========================================================
-- MIGRATION V1 - GESTION CLINIQUE
-- Ajout des modules Vitales, Facturation, GED, File d'attente et Audit
-- ========================================================

-- 1. Extension pour contraintes d'exclusion sur créneaux de RDV
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Fonction immutable pour la plage horaire d'un rendez-vous (durée standard 30 min)
CREATE OR REPLACE FUNCTION appointment_range(dt TIMESTAMP WITH TIME ZONE)
RETURNS tstzrange AS $$
  SELECT tstzrange(dt, dt + INTERVAL '30 minutes', '[)');
$$ LANGUAGE sql IMMUTABLE;

-- 3. Mise à jour de la contrainte CHECK sur le statut des rendez-vous
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_statut_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_statut_check 
    CHECK (statut IN ('planifie', 'en_attente', 'en_cours', 'honore', 'annule'));

-- 4. Contrainte anti-double réservation médecin
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS no_doctor_appointment_overlap;
ALTER TABLE appointments ADD CONSTRAINT no_doctor_appointment_overlap EXCLUDE USING gist (
    medecin_id WITH =,
    appointment_range(date_heure) WITH &&
) WHERE (statut NOT IN ('annule'));

-- 5. Table: vitals (Constantes vitales)
CREATE TABLE IF NOT EXISTS vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    taken_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ta_systolique INT CHECK (ta_systolique > 0 AND ta_systolique < 300),
    ta_diastolique INT CHECK (ta_diastolique > 0 AND ta_diastolique < 200),
    temperature NUMERIC(4,1) CHECK (temperature > 25 AND temperature < 45),
    poids NUMERIC(5,2) CHECK (poids > 0 AND poids < 500),
    taille NUMERIC(5,2) CHECK (taille > 0 AND taille < 300),
    frequence_cardiaque INT CHECK (frequence_cardiaque > 0 AND frequence_cardiaque < 300),
    glycemie NUMERIC(5,2) CHECK (glycemie >= 0),
    imc NUMERIC(4,2),
    imc_classification VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vitals_patient ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_consultation ON vitals(consultation_id);

-- 6. Table: invoices (Factures)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_facture VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    montant_total NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (montant_total >= 0),
    montant_paye NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (montant_paye >= 0),
    statut VARCHAR(50) NOT NULL DEFAULT 'impayee' CHECK (statut IN ('impayee', 'partielle', 'payee', 'annulee')),
    date_emission TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_consultation ON invoices(consultation_id);

-- 7. Table: invoice_items (Lignes de facture)
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantite INT NOT NULL DEFAULT 1 CHECK (quantite > 0),
    prix_unitaire NUMERIC(10,2) NOT NULL CHECK (prix_unitaire >= 0),
    montant_total NUMERIC(10,2) NOT NULL CHECK (montant_total >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- 8. Table: payments (Paiements et encaissements)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    montant NUMERIC(10,2) NOT NULL CHECK (montant > 0),
    mode_paiement VARCHAR(50) NOT NULL CHECK (mode_paiement IN ('especes', 'carte', 'mobile_money', 'virement')),
    reference_transaction VARCHAR(100),
    encaisse_par_id UUID REFERENCES users(id) ON DELETE SET NULL,
    date_paiement TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- 9. Table: attachments (GED / Pièces jointes)
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    uploaded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    type_mime VARCHAR(100) NOT NULL,
    taille INT NOT NULL,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attachments_patient ON attachments(patient_id);

-- 10. Table: audit_logs (Piste d'audit légale immuable)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- Trigger mis à jour pour invoices
CREATE OR REPLACE TRIGGER update_invoices_modtime BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
