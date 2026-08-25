-- ========================================================
-- DONNÉES ET STRUCTURES INITIALES (SEED TOUT-EN-UN) POUR SUPABASE
-- GESTION DE CLINIQUE
-- ========================================================

-- Mots de passe hashés avec bcrypt (salt rounds = 10) :
-- Le mot de passe par défaut pour tous les comptes de test est : Secretaire123!
-- Hash bcrypt : $2b$10$BbVw5nzdUU0rZrYJq32XseuipqfHikxsF6tVHkBhYG6zEfqzXzWya

-- --------------------------------------------------------
-- 1. EXTENSIONS ET FONCTIONS UTILITAIRES
-- --------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION appointment_range(dt TIMESTAMP WITH TIME ZONE)
RETURNS tstzrange AS $$
  SELECT tstzrange(dt, dt + INTERVAL '30 minutes', '[)');
$$ LANGUAGE sql IMMUTABLE;

-- --------------------------------------------------------
-- 2. CRÉATION DES TABLES DE LA BASE DE DONNÉES
-- --------------------------------------------------------

-- Table: users (Personnel de la clinique)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'medecin', 'secretaire')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: patients
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    telephone VARCHAR(30),
    adresse TEXT,
    antecedents TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: consultations
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medecin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    motif VARCHAR(255) NOT NULL,
    diagnostic TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    statut VARCHAR(50) NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'delivree', 'annulee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: prescription_items
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicament VARCHAR(150) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequence VARCHAR(100) NOT NULL,
    duree VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: appointments (Rendez-vous)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medecin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    date_heure TIMESTAMP WITH TIME ZONE NOT NULL,
    statut VARCHAR(50) NOT NULL DEFAULT 'planifie',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contrainte de statut dynamique sur appointments
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_statut_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_statut_check 
    CHECK (statut IN ('planifie', 'en_attente', 'en_cours', 'honore', 'annule'));

-- Table: vitals (Constantes vitales)
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

-- Table: invoices (Factures)
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

-- Table: invoice_items (Lignes de facture)
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantite INT NOT NULL DEFAULT 1 CHECK (quantite > 0),
    prix_unitaire NUMERIC(10,2) NOT NULL CHECK (prix_unitaire >= 0),
    montant_total NUMERIC(10,2) NOT NULL CHECK (montant_total >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: payments (Paiements et encaissements)
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

-- Table: attachments (GED / Pièces jointes)
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

-- Table: audit_logs (Piste d'audit légale immuable)
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

-- --------------------------------------------------------
-- 3. INDEXATION ET TRIGGERS AUTOMATIQUES
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_patients_nom_prenom ON patients(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_medecin ON consultations(medecin_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_medecin ON appointments(medecin_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date_heure);
CREATE INDEX IF NOT EXISTS idx_vitals_patient ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

CREATE OR REPLACE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE OR REPLACE TRIGGER update_patients_modtime BEFORE UPDATE ON patients FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE OR REPLACE TRIGGER update_consultations_modtime BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE OR REPLACE TRIGGER update_prescriptions_modtime BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE OR REPLACE TRIGGER update_appointments_modtime BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE OR REPLACE TRIGGER update_invoices_modtime BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

-- --------------------------------------------------------
-- 4. NETTOYAGE ET RECHARGEMENT DES DONNÉES (SEED)
-- --------------------------------------------------------
TRUNCATE users, patients, consultations, prescriptions, prescription_items, appointments, vitals, invoices, invoice_items, payments, attachments, audit_logs CASCADE;

-- 4.1 Insertion du personnel de santé (Users)
INSERT INTO users (id, nom, email, mot_de_passe, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'Directeur Administrateur', 'admin@clinic.com', '$2b$10$BbVw5nzdUU0rZrYJq32XseuipqfHikxsF6tVHkBhYG6zEfqzXzWya', 'admin'),
('d0000000-0000-0000-0000-000000000001', 'Dr. Jean Dupont', 'dr.dupont@clinic.com', '$2b$10$BbVw5nzdUU0rZrYJq32XseuipqfHikxsF6tVHkBhYG6zEfqzXzWya', 'medecin'),
('d0000000-0000-0000-0000-000000000002', 'Dr. Sophie Martin', 'dr.martin@clinic.com', '$2b$10$BbVw5nzdUU0rZrYJq32XseuipqfHikxsF6tVHkBhYG6zEfqzXzWya', 'medecin'),
('e0000000-0000-0000-0000-000000000001', 'Marie Claire (Secrétaire)', 'secretaire@clinic.com', '$2b$10$BbVw5nzdUU0rZrYJq32XseuipqfHikxsF6tVHkBhYG6zEfqzXzWya', 'secretaire');

-- 4.2 Insertion des patients
INSERT INTO patients (id, nom, prenom, date_naissance, telephone, adresse, antecedents) VALUES
('f0000000-0000-0000-0000-000000000001', 'Kovacs', 'Alice', '1988-04-12', '+33612345678', '12 Rue de la Paix, Paris', 'Hypertension artérielle, Allergie Pénicilline'),
('f0000000-0000-0000-0000-000000000002', 'Bernard', 'Lucas', '1995-09-24', '+33698765432', '45 Avenue de la République, Lyon', 'Asthme modéré'),
('f0000000-0000-0000-0000-000000000003', 'Diop', 'Aminata', '1990-11-05', '+33700112233', '8 Boulevard Haussmann, Marseille', 'Aucun antécédent notable');

-- 4.3 Insertion des rendez-vous
INSERT INTO appointments (id, patient_id, medecin_id, date_heure, statut) VALUES
('b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', NOW() + INTERVAL '2 hours', 'en_attente'),
('b0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', NOW() + INTERVAL '1 day', 'planifie'),
('b0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 hours', 'honore');

-- 4.4 Insertion des constantes vitales (UUID valide: e1000000-0000-0000-0000-000000000001)
INSERT INTO vitals (id, patient_id, taken_by_id, ta_systolique, ta_diastolique, temperature, poids, taille, frequence_cardiaque, glycemie, imc, imc_classification, notes) VALUES
('e1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 120, 80, 38.2, 65.0, 168.0, 78, 0.95, 23.03, 'Normal', 'Légère fièvre détectée à l''accueil.');

-- 4.5 Insertion d'une consultation
INSERT INTO consultations (id, patient_id, medecin_id, date, motif, diagnostic, notes) VALUES
('c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 hours', 'Fièvre et toux persistante', 'Bronchite aiguë légère', 'Patient au repos pendant 5 jours. Hydratation recommandée.');

-- 4.6 Insertion d'une prescription pour la consultation
INSERT INTO prescriptions (id, consultation_id, date_creation, statut) VALUES
('fa000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 hours', 'en_cours');

-- 4.7 Items de la prescription
INSERT INTO prescription_items (id, prescription_id, medicament, dosage, frequence, duree) VALUES
('fb000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000001', 'Paracétamol', '1000 mg', '3 fois par jour', '5 jours'),
('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000001', 'Sirop Hélix', '15 ml', '2 fois par jour', '7 jours');

-- 4.8 Insertion d'une facture (UUID valide: ea000000-0000-0000-0000-000000000001)
INSERT INTO invoices (id, numero_facture, patient_id, consultation_id, montant_total, montant_paye, statut) VALUES
('ea000000-0000-0000-0000-000000000001', 'FAC-2026-0001', 'f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 25000.00, 25000.00, 'payee');

-- 4.9 Items de la facture (UUID valide: eb000000-0000-0000-0000-000000000001)
INSERT INTO invoice_items (id, invoice_id, description, quantite, prix_unitaire, montant_total) VALUES
('eb000000-0000-0000-0000-000000000001', 'ea000000-0000-0000-0000-000000000001', 'Consultation Médecine Générale', 1, 25000.00, 25000.00);

-- 4.10 Insertion d'un règlement / paiement (UUID valide: ec000000-0000-0000-0000-000000000001)
INSERT INTO payments (id, invoice_id, montant, mode_paiement, reference_transaction, encaisse_par_id) VALUES
('ec000000-0000-0000-0000-000000000001', 'ea000000-0000-0000-0000-000000000001', 25000.00, 'especes', 'CASH-001', 'e0000000-0000-0000-0000-000000000001');

-- 4.11 Piste d'audit initiale
INSERT INTO audit_logs (id, user_id, user_role, action, resource, resource_id, details) VALUES
('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'admin', 'SEED_INITIALIZATION', 'SYSTEM', NULL, '{"status": "Database structure and initial data loaded successfully"}');
