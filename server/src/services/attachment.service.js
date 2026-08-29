import { supabase } from '../config/supabase.js';

export class AttachmentService {
  /**
   * Enregistre un document joint GED dans la base de données
   */
  static async createAttachment({ patient_id, consultation_id, file, user_id, description }) {
    if (!patient_id) {
      const err = new Error('L ID du patient est requis');
      err.statusCode = 400;
      throw err;
    }

    const storagePath = `attachments/${patient_id}/${Date.now()}_${file.originalname}`;
    const url = `/uploads/${file.filename}`;

    const { data: attachment, error } = await supabase
      .from('attachments')
      .insert({
        patient_id,
        consultation_id: consultation_id || null,
        uploaded_by_id: user_id,
        nom_fichier: file.originalname,
        type_mime: file.mimetype,
        taille: file.size,
        storage_path: storagePath,
        url,
        description: description || null,
      })
      .select('*, users!attachments_uploaded_by_id_fkey(nom, role)')
      .single();

    if (error) throw error;

    return attachment;
  }

  /**
   * Récupère les pièces jointes d'un patient
   */
  static async getPatientAttachments(patientId) {
    const { data: attachments, error } = await supabase
      .from('attachments')
      .select('*, users!attachments_uploaded_by_id_fkey(nom, role)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return attachments || [];
  }

  /**
   * Supprime une pièce jointe
   */
  static async deleteAttachment(id) {
    const { data: attachment, error: fetchErr } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !attachment) {
      const err = new Error('Document non trouvé');
      err.statusCode = 404;
      throw err;
    }

    const { error: delErr } = await supabase
      .from('attachments')
      .delete()
      .eq('id', id);

    if (delErr) throw delErr;

    return true;
  }
}
