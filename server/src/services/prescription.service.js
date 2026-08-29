import { supabase } from '../config/supabase.js';

export class PrescriptionService {
  /**
   * Récupère la liste des ordonnances
   */
  static async getAllPrescriptions({ consultation_id }) {
    let query = supabase.from('prescriptions').select(`
      id,
      date_creation,
      statut,
      consultations (
        id,
        date,
        motif,
        patients (id, nom, prenom),
        users!consultations_medecin_id_fkey (id, nom)
      ),
      prescription_items (*)
    `);

    if (consultation_id) query = query.eq('consultation_id', consultation_id);

    const { data: prescriptions, error } = await query.order('date_creation', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des ordonnances: ${error.message}`);
    }

    return prescriptions || [];
  }

  /**
   * Récupère une ordonnance par son ID
   */
  static async getPrescriptionById(id) {
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .select(`
        id,
        date_creation,
        statut,
        consultations (
          id,
          date,
          motif,
          diagnostic,
          notes,
          patients (*),
          users!consultations_medecin_id_fkey (id, nom, email)
        ),
        prescription_items (*)
      `)
      .eq('id', id)
      .single();

    if (error || !prescription) {
      return null;
    }

    return prescription;
  }

  /**
   * Crée une nouvelle ordonnance avec ses éléments de médication
   */
  static async createPrescription({ consultation_id, statut, items }) {
    const { data: consultation } = await supabase
      .from('consultations')
      .select('id')
      .eq('id', consultation_id)
      .single();

    if (!consultation) {
      const err = new Error('Consultation parente non trouvée.');
      err.statusCode = 404;
      throw err;
    }

    const { data: newPrescription, error: prescError } = await supabase
      .from('prescriptions')
      .insert([{ consultation_id, statut: statut || 'en_cours' }])
      .select()
      .single();

    if (prescError) {
      throw new Error(`Échec de création de l'ordonnance: ${prescError.message}`);
    }

    let insertedItems = [];
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item) => ({
        prescription_id: newPrescription.id,
        medicament: item.medicament,
        dosage: item.dosage,
        frequence: item.frequence,
        duree: item.duree,
      }));

      const { data: itemsData, error: itemsError } = await supabase
        .from('prescription_items')
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        console.error('Erreur lors de l\'insertion des médicaments :', itemsError);
      } else {
        insertedItems = itemsData || [];
      }
    }

    return {
      ...newPrescription,
      items: insertedItems,
    };
  }

  /**
   * Met à jour le statut d'une ordonnance
   */
  static async updatePrescriptionStatus(id, statut) {
    const { data: updated, error } = await supabase
      .from('prescriptions')
      .update({ statut })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }

    return updated;
  }

  /**
   * Supprime une ordonnance
   */
  static async deletePrescription(id) {
    const { error } = await supabase.from('prescriptions').delete().eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }

    return true;
  }
}
