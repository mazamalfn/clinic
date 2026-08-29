import { supabase } from '../config/supabase.js';

export class ConsultationService {
  /**
   * Masquage du Secret Médical pour le rôle Secrétaire
   */
  static maskMedicalSecrecy(consultation, userRole) {
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
  }

  /**
   * Récupère la liste des consultations selon les filtres
   */
  static async getAllConsultations({ patient_id, medecin_id }, userRole) {
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
      throw new Error(`Erreur lors de la récupération des consultations: ${error.message}`);
    }

    return (consultations || []).map((c) => this.maskMedicalSecrecy(c, userRole));
  }

  /**
   * Récupère une consultation par son ID
   */
  static async getConsultationById(id, userRole) {
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
      return null;
    }

    return this.maskMedicalSecrecy(consultation, userRole);
  }

  /**
   * Enregistre une nouvelle consultation
   */
  static async createConsultation({ patient_id, medecin_id, date, motif, diagnostic, notes }) {
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
      throw new Error(`Erreur lors de la création de la consultation: ${error.message}`);
    }

    return newConsultation;
  }

  /**
   * Met à jour une consultation
   */
  static async updateConsultation(id, { motif, diagnostic, notes }) {
    const { data: updated, error } = await supabase
      .from('consultations')
      .update({ motif, diagnostic, notes })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }

    return updated;
  }

  /**
   * Supprime une consultation
   */
  static async deleteConsultation(id) {
    const { error } = await supabase.from('consultations').delete().eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }

    return true;
  }
}
