import { supabase } from '../config/supabase.js';

export const getAllPatients = async (req, res, next) => {
  try {
    const { q } = req.query;

    let query = supabase.from('patients').select('*');

    if (q) {
      query = query.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,telephone.ilike.%${q}%`);
    }

    const { data: patients, error } = await query.order('nom', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération des patients', details: error.message });
    }

    res.json({ patients });
  } catch (err) {
    next(err);
  }
};

export const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !patient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    // Récupérer l'historique des rendez-vous
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, date_heure, statut, medecin_id, users (nom, email)')
      .eq('patient_id', id)
      .order('date_heure', { ascending: false });

    // Récupérer l'historique des consultations
    const { data: consultations } = await supabase
      .from('consultations')
      .select('id, date, motif, diagnostic, notes, medecin_id, users (nom), prescriptions (id, statut, prescription_items (*))')
      .eq('patient_id', id)
      .order('date', { ascending: false });

    res.json({
      patient,
      history: {
        appointments: appointments || [],
        consultations: consultations || [],
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createPatient = async (req, res, next) => {
  try {
    const { nom, prenom, date_naissance, telephone, adresse, antecedents } = req.body;

    const { data: newPatient, error } = await supabase
      .from('patients')
      .insert([{ nom, prenom, date_naissance, telephone, adresse, antecedents }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Échec de la création du patient', details: error.message });
    }

    res.status(201).json({
      message: 'Patient créé avec succès',
      patient: newPatient,
    });
  } catch (err) {
    next(err);
  }
};

export const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nom, prenom, date_naissance, telephone, adresse, antecedents } = req.body;

    const { data: updatedPatient, error } = await supabase
      .from('patients')
      .update({ nom, prenom, date_naissance, telephone, adresse, antecedents })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour', details: error.message });
    }

    res.json({
      message: 'Patient mis à jour avec succès',
      patient: updatedPatient,
    });
  } catch (err) {
    next(err);
  }
};

export const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('patients').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la suppression', details: error.message });
    }

    res.json({ message: 'Patient supprimé avec succès' });
  } catch (err) {
    next(err);
  }
};
