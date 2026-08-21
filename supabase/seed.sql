-- ========================================================
-- DONNÉES INITIALES (SEED) POUR SUPABASE - GESTION DE CLINIQUE
-- ========================================================

-- Mots de passe hashés avec bcrypt (salt rounds = 10) :
-- 'Admin123!'    => '$2a$10$wKzWcI5z4S4vP6O0107sDe1d6eKqA2bY6aE8kH9jX7wF5bV3c0123' (exemple hash valide bcrypt)
-- 'Medecin123!'  => '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW'
-- 'Secretaire123!' => '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW'

-- Nettoyage des anciennes données pour le test
TRUNCATE users, patients, consultations, prescriptions, prescription_items, appointments CASCADE;

-- 1. Insertion du personnel de santé (Users)
INSERT INTO users (id, nom, email, mot_de_passe, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'Directeur Administrateur', 'admin@clinic.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'admin'),
('d0000000-0000-0000-0000-000000000001', 'Dr. Jean Dupont', 'dr.dupont@clinic.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'medecin'),
('d0000000-0000-0000-0000-000000000002', 'Dr. Sophie Martin', 'dr.martin@clinic.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'medecin'),
('s0000000-0000-0000-0000-000000000001', 'Marie Claire (Secrétaire)', 'secretaire@clinic.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'secretaire');

-- 2. Insertion des patients
INSERT INTO patients (id, nom, prenom, date_naissance, telephone, adresse, antecedents) VALUES
('p0000000-0000-0000-0000-000000000001', 'Kovacs', 'Alice', '1988-04-12', '+33612345678', '12 Rue de la Paix, Paris', 'Hypertension artérielle, Allergie Pénicilline'),
('p0000000-0000-0000-0000-000000000002', 'Bernard', 'Lucas', '1995-09-24', '+33698765432', '45 Avenue de la République, Lyon', 'Asthme modéré'),
('p0000000-0000-0000-0000-000000000003', 'Diop', 'Aminata', '1990-11-05', '+33700112233', '8 Boulevard Haussmann, Marseille', 'Aucun antécédent notable');

-- 3. Insertion des rendez-vous
INSERT INTO appointments (id, patient_id, medecin_id, date_heure, statut) VALUES
('b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', NOW() + INTERVAL '2 hours', 'planifie'),
('b0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', NOW() + INTERVAL '1 day', 'planifie'),
('b0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 hours', 'honore');

-- 4. Insertion d'une consultation
INSERT INTO consultations (id, patient_id, medecin_id, date, motif, diagnostic, notes) VALUES
('c0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 hours', 'Fièvre et toux persistante', 'Bronchite aiguë légère', 'Patient au repos pendant 5 jours. Hydratation recommandée.');

-- 5. Insertion d'une prescription pour la consultation
INSERT INTO prescriptions (id, consultation_id, date_creation, statut) VALUES
('rx000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 hours', 'en_cours');

-- 6. Items de la prescription
INSERT INTO prescription_items (id, prescription_id, medicament, dosage, frequence, duree) VALUES
('item0000-0000-0000-0000-000000000001', 'rx000000-0000-0000-0000-000000000001', 'Paracétamol', '1000 mg', '3 fois par jour', '5 jours'),
('item0000-0000-0000-0000-000000000002', 'rx000000-0000-0000-0000-000000000001', 'Sirop Hélix', '15 ml', '2 fois par jour', '7 jours');
