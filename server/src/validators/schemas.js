import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Format email invalide'),
  mot_de_passe: z.string().min(1, 'Le mot de passe est requis'),
});

export const userCreateSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Format email invalide'),
  mot_de_passe: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  role: z.enum(['admin', 'medecin', 'secretaire'], {
    errorMap: () => ({ message: 'Le rôle doit être: admin, medecin ou secretaire' }),
  }),
});

export const userUpdateSchema = z.object({
  nom: z.string().min(2).optional(),
  email: z.string().email().optional(),
  mot_de_passe: z.string().min(6).optional(),
  role: z.enum(['admin', 'medecin', 'secretaire']).optional(),
});

export const patientSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  date_naissance: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Date de naissance invalide (ex: YYYY-MM-DD)',
  }),
  telephone: z.string().optional().nullable(),
  adresse: z.string().optional().nullable(),
  antecedents: z.string().optional().nullable(),
});

export const appointmentSchema = z.object({
  patient_id: z.string().uuid('ID Patient invalide'),
  medecin_id: z.string().uuid('ID Médecin invalide'),
  date_heure: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Date et heure invalides',
  }),
  statut: z.enum(['planifie', 'en_attente', 'en_cours', 'honore', 'annule']).default('planifie'),
});

export const appointmentStatusSchema = z.object({
  statut: z.enum(['planifie', 'en_attente', 'en_cours', 'honore', 'annule']),
});

export const consultationSchema = z.object({
  patient_id: z.string().uuid('ID Patient invalide'),
  medecin_id: z.string().uuid('ID Médecin invalide'),
  date: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Date invalide',
  }),
  motif: z.string().min(1, 'Le motif est requis'),
  diagnostic: z.string().min(1, 'Le diagnostic est requis'),
  notes: z.string().optional().nullable(),
});

export const prescriptionItemSchema = z.object({
  medicament: z.string().min(1, 'Le nom du médicament est requis'),
  dosage: z.string().min(1, 'Le dosage est requis'),
  frequence: z.string().min(1, 'La fréquence est requise'),
  duree: z.string().min(1, 'La durée est requise'),
});

export const prescriptionSchema = z.object({
  consultation_id: z.string().uuid('ID Consultation invalide'),
  statut: z.enum(['en_cours', 'delivree', 'annulee']).default('en_cours'),
  items: z.array(prescriptionItemSchema).optional().default([]),
});

export const vitalsSchema = z.object({
  patient_id: z.string().uuid('ID Patient invalide'),
  consultation_id: z.string().uuid().optional().nullable(),
  ta_systolique: z.number().int().positive().optional().nullable(),
  ta_diastolique: z.number().int().positive().optional().nullable(),
  temperature: z.number().positive().optional().nullable(),
  poids: z.number().positive().optional().nullable(),
  taille: z.number().positive().optional().nullable(),
  frequence_cardiaque: z.number().int().positive().optional().nullable(),
  glycemie: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'La description est requise'),
  quantite: z.number().int().positive().default(1),
  prix_unitaire: z.number().nonnegative('Le prix unitaire doit être positif'),
});

export const invoiceCreateSchema = z.object({
  patient_id: z.string().uuid('ID Patient invalide'),
  consultation_id: z.string().uuid().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'Au moins un article de facturation est requis'),
});

export const paymentCreateSchema = z.object({
  invoice_id: z.string().uuid('ID Facture invalide'),
  montant: z.number().positive('Le montant doit être supérieur à zéro'),
  mode_paiement: z.enum(['especes', 'carte', 'mobile_money', 'virement'], {
    errorMap: () => ({ message: 'Mode de paiement invalide (especes, carte, mobile_money, virement)' }),
  }),
  reference_transaction: z.string().optional().nullable(),
});
