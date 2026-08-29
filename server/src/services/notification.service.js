import { supabase } from '../config/supabase.js';

export class NotificationService {
  /**
   * Enregistre une notification dans le système
   */
  static async sendNotification({ user_id, patient_id, titre, message, type = 'info', link = null }) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id,
          patient_id,
          titre,
          message,
          type,
          link,
          lu: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        // Si la table notifications n'existe pas encore ou erreur Supabase, log de secours
        console.log(`[NOTIFICATION SYSTEM] (${type.toUpperCase()}) ${titre}: ${message}`);
        return { success: false, fallbackLogged: true, error: error.message };
      }

      return { success: true, notification: data };
    } catch (err) {
      console.log(`[NOTIFICATION SYSTEM LOG] (${type.toUpperCase()}) ${titre}: ${message}`);
      return { success: false, fallbackLogged: true, error: err.message };
    }
  }

  /**
   * Génère une notification lors de la prise d'un rendez-vous
   */
  static async notifyAppointmentCreated(appointment) {
    const medecinId = appointment.medecin_id;
    const patientNom = appointment.patients ? `${appointment.patients.nom} ${appointment.patients.prenom || ''}` : 'le patient';
    const dateStr = new Date(appointment.date_heure).toLocaleString('fr-FR');

    return this.sendNotification({
      user_id: medecinId,
      patient_id: appointment.patient_id,
      titre: 'Nouveau rendez-vous planifié',
      message: `Un rendez-vous avec ${patientNom} a été réservé pour le ${dateStr}.`,
      type: 'appointment',
      link: `/appointments/${appointment.id}`
    });
  }

  /**
   * Génère une alerte en cas de constantes vitales anormales
   */
  static async notifyAbnormalVitals({ patient, vitals, alertReason }) {
    return this.sendNotification({
      patient_id: patient.id,
      titre: '⚠️ Alerte Constantes Vitales',
      message: `Constantes anormales enregistrées pour ${patient.nom} ${patient.prenom} : ${alertReason}`,
      type: 'warning',
      link: `/patients/${patient.id}/vitals`
    });
  }

  /**
   * Récupère la liste des notifications pour un utilisateur
   */
  static async getUserNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }
    return data || [];
  }
}
