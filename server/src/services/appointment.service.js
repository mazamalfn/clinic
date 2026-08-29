import { supabase } from '../config/supabase.js';
import { NotificationService } from './notification.service.js';

export class AppointmentService {
  /**
   * Récupère tous les rendez-vous selon les filtres (médecin, patient, statut, date)
   */
  static async getAllAppointments({ medecin_id, patient_id, statut, date }) {
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
      throw new Error(`Erreur de récupération des rendez-vous: ${error.message}`);
    }

    return appointments || [];
  }

  /**
   * Récupère la file d'attente du jour pour un médecin
   */
  static async getWaitingQueue(medecin_id = null) {
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

    return {
      queue: queue || [],
      count_en_attente: (queue || []).filter((q) => q.statut === 'en_attente').length,
    };
  }

  /**
   * Récupère un rendez-vous par son ID
   */
  static async getAppointmentById(id) {
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
      return null;
    }

    return appointment;
  }

  /**
   * Crée un nouveau rendez-vous, vérifie l'existence du patient et du médecin, et déclenche une notification
   */
  static async createAppointment({ patient_id, medecin_id, date_heure, statut }) {
    // Vérifier l'existence du patient
    const { data: patient } = await supabase.from('patients').select('id, nom, prenom').eq('id', patient_id).single();
    if (!patient) {
      const err = new Error('Patient non trouvé');
      err.statusCode = 404;
      throw err;
    }

    // Vérifier l'existence du médecin
    const { data: medecin } = await supabase.from('users').select('id, role, nom').eq('id', medecin_id).single();
    if (!medecin || medecin.role !== 'medecin') {
      const err = new Error('Le médecin sélectionné est invalide ou n\'a pas le rôle medecin.');
      err.statusCode = 400;
      throw err;
    }

    const { data: newAppointment, error } = await supabase
      .from('appointments')
      .insert([{ patient_id, medecin_id, date_heure, statut: statut || 'planifie' }])
      .select(`
        id,
        date_heure,
        statut,
        patient_id,
        medecin_id,
        patients (id, nom, prenom),
        users!appointments_medecin_id_fkey (id, nom)
      `)
      .single();

    if (error) {
      if (error.code === '23P01' || error.message?.includes('overlap')) {
        const err = new Error('Collision de rendez-vous : le médecin est déjà réservé sur ce créneau horaire.');
        err.statusCode = 409;
        throw err;
      }
      throw new Error(`Erreur de création du rendez-vous: ${error.message}`);
    }

    // Déclencher automatiquement une notification via NotificationService
    try {
      await NotificationService.notifyAppointmentCreated(newAppointment);
    } catch (notifErr) {
      console.warn('Impossible d\'envoyer la notification de rendez-vous:', notifErr.message);
    }

    return newAppointment;
  }

  /**
   * Mettre à jour un rendez-vous
   */
  static async updateAppointment(id, { patient_id, medecin_id, date_heure, statut }) {
    const { data: updated, error } = await supabase
      .from('appointments')
      .update({ patient_id, medecin_id, date_heure, statut })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }

    return updated;
  }

  /**
   * Mettre à jour le statut d'un rendez-vous
   */
  static async updateAppointmentStatus(id, statut) {
    const { data: updated, error } = await supabase
      .from('appointments')
      .update({ statut })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors du changement de statut: ${error.message}`);
    }

    return updated;
  }

  /**
   * Supprimer un rendez-vous
   */
  static async deleteAppointment(id) {
    const { error } = await supabase.from('appointments').delete().eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }

    return true;
  }
}
