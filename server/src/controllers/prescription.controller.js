import { supabase } from '../config/supabase.js';

export const getAllPrescriptions = async (req, res, next) => {
  try {
    const { consultation_id } = req.query;

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
      return res.status(500).json({ error: 'Erreur lors de la récupération des ordonnances', details: error.message });
    }

    res.json({ prescriptions });
  } catch (err) {
    next(err);
  }
};

export const getPrescriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;

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
      return res.status(404).json({ error: 'Ordonnance non trouvée' });
    }

    res.json({ prescription });
  } catch (err) {
    next(err);
  }
};

export const createPrescription = async (req, res, next) => {
  try {
    const { consultation_id, statut, items } = req.body;

    // Vérifier si la consultation existe
    const { data: consultation } = await supabase
      .from('consultations')
      .select('id')
      .eq('id', consultation_id)
      .single();

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation parente non trouvée.' });
    }

    // Insérer l'ordonnance
    const { data: newPrescription, error: prescError } = await supabase
      .from('prescriptions')
      .insert([{ consultation_id, statut: statut || 'en_cours' }])
      .select()
      .single();

    if (prescError) {
      return res.status(500).json({ error: 'Échec de création de l\'ordonnance', details: prescError.message });
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
        insertedItems = itemsData;
      }
    }

    res.status(201).json({
      message: 'Ordonnance créée avec succès',
      prescription: {
        ...newPrescription,
        items: insertedItems,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updatePrescriptionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const { data: updated, error } = await supabase
      .from('prescriptions')
      .update({ statut })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du statut', details: error.message });
    }

    res.json({
      message: 'Statut de l\'ordonnance mis à jour avec succès',
      prescription: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const deletePrescription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('prescriptions').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la suppression', details: error.message });
    }

    res.json({ message: 'Ordonnance supprimée avec succès' });
  } catch (err) {
    next(err);
  }
};
