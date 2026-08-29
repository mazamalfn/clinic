import { AttachmentService } from '../services/index.js';

export const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const { patient_id, consultation_id, description } = req.body;
    const attachment = await AttachmentService.createAttachment({
      patient_id,
      consultation_id,
      file: req.file,
      user_id: req.user.id,
      description,
    });

    res.status(201).json({
      message: 'Document téléversé avec succès (GED)',
      data: attachment,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};

export const getPatientAttachments = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const attachments = await AttachmentService.getPatientAttachments(patientId);
    res.json({ data: attachments });
  } catch (err) {
    next(err);
  }
};

export const deleteAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    await AttachmentService.deleteAttachment(id);
    res.json({ message: 'Document supprimé avec succès' });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};
