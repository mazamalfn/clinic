import { supabase } from '../config/supabase.js';

/**
 * Masquage du Secret Médical pour le rôle Secrétaire
 */
const maskMedicalSecrecy = (consultation, userRole) => {
  if (userRole !== 'secretaire' || !consultation) return consultation;

  return {
    ...consultation,
    diagnostic: '[Masqué - Secret Médical]',
    notes: '[Masqué - Secret Médical]',
    prescriptions: consultation.prescriptions ? consultation.prescriptions.map(p => ({
      ...p,
      prescription_items: p.prescription_items ? p.prescription_items.map(pi => ({
        ...pi,
        medicament: '[Masqué - Secret Médical]',
        dosage: '[Masqué]',
        frequence: '[Masqué]',
        duree: '[Masqué]',
      })) : p.prescription_items
    })) : consultation.prescriptions
  };
};

export const getAllConsultations = async (req, res, next) => {
  try {
    const { patient_id, medecin_id } = req.query;

    let query = supabase.from('consultations').select(`
      id,
      date,
      motif,
      diagnostic,
      notes,
      created_at,
      patients (id, nom, prenom, date_naissance, telephone),
      users!consultations_medecin_id_fkey (id, nom, email),
      prescriptions (id, statut)
    `);

    if (patient_id) query = query.eq('patient_id', patient_id);
    if (medecin_id) query = query.eq('medecin_id', medecin_id);

    const { data: consultations, error } = await query.order('date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération des consultations', details: error.message });
    }

    const result = (consultations || []).map((c) => maskMedicalSecrecy(c, req.user?.role));

    res.json({ consultations: result });
  } catch (err) {
    next(err);
  }
};

export const getConsultationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: consultation, error } = await supabase
      .from('consultations')
      .select(`
        id,
        date,
        motif,
        diagnostic,
        notes,
        created_at,
        patients (*),
        users!consultations_medecin_id_fkey (id, nom, email),
        prescriptions (
          id,
          date_creation,
          statut,
          prescription_items (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !consultation) {
      return res.status(404).json({ error: 'Consultation non trouvée' });
    }

    const result = maskMedicalSecrecy(consultation, req.user?.role);

    res.json({ consultation: result });
  } catch (err) {
    next(err);
  }
};

export const createConsultation = async (req, res, next) => {
  try {
    const { patient_id, medecin_id, date, motif, diagnostic, notes } = req.body;

    const { data: newConsultation, error } = await supabase
      .from('consultations')
      .insert([{
        patient_id,
        medecin_id,
        date: date || new Date().toISOString(),
        motif,
        diagnostic,
        notes,
      }])
      .select(`
        id,
        date,
        motif,
        diagnostic,
        notes,
        patients (id, nom, prenom),
        users!consultations_medecin_id_fkey (id, nom)
      `)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la création de la consultation', details: error.message });
    }

    res.status(201).json({
      message: 'Consultation enregistrée avec succès',
      consultation: newConsultation,
    });
  } catch (err) {
    next(err);
  }
};

export const updateConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motif, diagnostic, notes } = req.body;

    const { data: updated, error } = await supabase
      .from('consultations')
      .update({ motif, diagnostic, notes })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour', details: error.message });
    }

    res.json({
      message: 'Consultation mise à jour avec succès',
      consultation: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('consultations').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la suppression', details: error.message });
    }

    res.json({ message: 'Consultation supprimée avec succès' });
  } catch (err) {
    next(err);
  }
};
