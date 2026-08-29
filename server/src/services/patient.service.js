import { supabase } from '../config/supabase.js';

export class PatientService {
  /**
   * Récupère la liste des patients (avec recherche par nom, prénom, téléphone)
   */
  static async getAllPatients(searchQuery = null) {
    let query = supabase.from('patients').select('*');

    if (searchQuery) {
      query = query.or(`nom.ilike.%${searchQuery}%,prenom.ilike.%${searchQuery}%,telephone.ilike.%${searchQuery}%`);
    }

    const { data: patients, error } = await query.order('nom', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération des patients: ${error.message}`);
    }

    return patients || [];
  }

  /**
   * Récupère la fiche complète d'un patient avec l'historique des rendez-vous et consultations
   */
  static async getPatientWithHistory(id) {
    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !patient) {
      return null;
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

    return {
      patient,
      history: {
        appointments: appointments || [],
        consultations: consultations || [],
      },
    };
  }

  /**
   * Crée un nouveau patient dans la base de données
   */
  static async createPatient(patientData) {
    const { nom, prenom, date_naissance, telephone, adresse, antecedents } = patientData;

    const { data: newPatient, error } = await supabase
      .from('patients')
      .insert([{ nom, prenom, date_naissance, telephone, adresse, antecedents }])
      .select()
      .single();

    if (error) {
      throw new Error(`Échec de la création du patient: ${error.message}`);
    }

    return newPatient;
  }

  /**
   * Met à jour les informations d'un patient
   */
  static async updatePatient(id, patientData) {
    const { nom, prenom, date_naissance, telephone, adresse, antecedents } = patientData;

    const { data: updatedPatient, error } = await supabase
      .from('patients')
      .update({ nom, prenom, date_naissance, telephone, adresse, antecedents })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du patient: ${error.message}`);
    }

    return updatedPatient;
  }

  /**
   * Supprime un patient
   */
  static async deletePatient(id) {
    const { error } = await supabase.from('patients').delete().eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la suppression du patient: ${error.message}`);
    }

    return true;
  }
}
