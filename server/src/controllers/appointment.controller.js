import { supabase } from '../config/supabase.js';

export const getAllAppointments = async (req, res, next) => {
  try {
    const { medecin_id, patient_id, statut, date } = req.query;

    let query = supabase.from('appointments').select(`
      id,
      date_heure,
      statut,
      created_at,
      patients (id, nom, prenom, telephone),
      users!appointments_medecin_id_fkey (id, nom, email, role)
    `);

    if (medecin_id) query = query.eq('medecin_id', medecin_id);
    if (patient_id) query = query.eq('patient_id', patient_id);
    if (statut) query = query.eq('statut', statut);

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query = query
        .gte('date_heure', startDate.toISOString())
        .lte('date_heure', endDate.toISOString());
    }

    const { data: appointments, error } = await query.order('date_heure', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Erreur de récupération des rendez-vous', details: error.message });
    }

    res.json({ appointments });
  } catch (err) {
    next(err);
  }
};

export const getWaitingQueue = async (req, res, next) => {
  try {
    const { medecin_id } = req.query;

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    let query = supabase
      .from('appointments')
      .select(`
        id,
        date_heure,
        statut,
        patients (id, nom, prenom, telephone),
        users!appointments_medecin_id_fkey (id, nom)
      `)
      .in('statut', ['en_attente', 'en_cours', 'planifie'])
      .gte('date_heure', startDate.toISOString())
      .lte('date_heure', endDate.toISOString())
      .order('date_heure', { ascending: true });

    if (medecin_id) query = query.eq('medecin_id', medecin_id);

    const { data: queue, error } = await query;
    if (error) throw error;

    res.json({
      message: 'File d attente de la journée récupérée',
      queue,
      count_en_attente: (queue || []).filter((q) => q.statut === 'en_attente').length,
    });
  } catch (err) {
    next(err);
  }
};

export const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        date_heure,
        statut,
        created_at,
        patients (*),
        users!appointments_medecin_id_fkey (id, nom, email)
      `)
      .eq('id', id)
      .single();

    if (error || !appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    res.json({ appointment });
  } catch (err) {
    next(err);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    const { patient_id, medecin_id, date_heure, statut } = req.body;

    // Vérifier l'existence du patient
    const { data: patient } = await supabase.from('patients').select('id').eq('id', patient_id).single();
    if (!patient) return res.status(404).json({ error: 'Patient non trouvé' });

    // Vérifier l'existence du médecin
    const { data: medecin } = await supabase.from('users').select('id, role').eq('id', medecin_id).single();
    if (!medecin || medecin.role !== 'medecin') {
      return res.status(400).json({ error: 'Le médecin sélectionné est invalide ou n\'a pas le rôle medecin.' });
    }

    const { data: newAppointment, error } = await supabase
      .from('appointments')
      .insert([{ patient_id, medecin_id, date_heure, statut: statut || 'planifie' }])
      .select(`
        id,
        date_heure,
        statut,
        patients (id, nom, prenom),
        users!appointments_medecin_id_fkey (id, nom)
      `)
      .single();

    if (error) {
      if (error.code === '23P01' || error.message?.includes('overlap')) {
        return res.status(409).json({ error: 'Collision de rendez-vous : le médecin est déjà réservé sur ce créneau horaire.' });
      }
      return res.status(500).json({ error: 'Erreur de création du rendez-vous', details: error.message });
    }

    res.status(201).json({
      message: 'Rendez-vous créé avec succès',
      appointment: newAppointment,
    });
  } catch (err) {
    next(err);
  }
};

export const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { patient_id, medecin_id, date_heure, statut } = req.body;

    const { data: updated, error } = await supabase
      .from('appointments')
      .update({ patient_id, medecin_id, date_heure, statut })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour', details: error.message });
    }

    res.json({
      message: 'Rendez-vous mis à jour avec succès',
      appointment: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const { data: updated, error } = await supabase
      .from('appointments')
      .update({ statut })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Erreur lors du changement de statut', details: error.message });
    }

    res.json({
      message: 'Statut du rendez-vous mis à jour avec succès',
      appointment: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('appointments').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la suppression', details: error.message });
    }

    res.json({ message: 'Rendez-vous supprimé avec succès' });
  } catch (err) {
    next(err);
  }
};
