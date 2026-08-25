import { supabase } from '../config/supabase.js';
import fs from 'fs';
import path from 'path';

export const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const { patient_id, consultation_id, description } = req.body;
    if (!patient_id) {
      return res.status(400).json({ error: 'L ID du patient est requis' });
    }

    const file = req.file;
    const storagePath = `attachments/${patient_id}/${Date.now()}_${file.originalname}`;
    const url = `/uploads/${file.filename}`;

    const { data: attachment, error } = await supabase
      .from('attachments')
      .insert({
        patient_id,
        consultation_id: consultation_id || null,
        uploaded_by_id: req.user.id,
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

    res.status(201).json({
      message: 'Document téléversé avec succès (GED)',
      data: attachment,
    });
  } catch (err) {
    next(err);
  }
};

export const getPatientAttachments = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const { data: attachments, error } = await supabase
      .from('attachments')
      .select('*, users!attachments_uploaded_by_id_fkey(nom, role)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ data: attachments });
  } catch (err) {
    next(err);
  }
};

export const deleteAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: attachment, error: fetchErr } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !attachment) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    const { error: delErr } = await supabase
      .from('attachments')
      .delete()
      .eq('id', id);

    if (delErr) throw delErr;

    res.json({ message: 'Document supprimé avec succès' });
  } catch (err) {
    next(err);
  }
};
