import { ConsultationService } from '../services/index.js';

export const getAllConsultations = async (req, res, next) => {
  try {
    const consultations = await ConsultationService.getAllConsultations(req.query, req.user?.role);
    res.json({ consultations });
  } catch (err) {
    next(err);
  }
};

export const getConsultationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const consultation = await ConsultationService.getConsultationById(id, req.user?.role);

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation non trouvée' });
    }

    res.json({ consultation });
  } catch (err) {
    next(err);
  }
};

export const createConsultation = async (req, res, next) => {
  try {
    const newConsultation = await ConsultationService.createConsultation(req.body);
    res.status(201).json({
      message: 'Consultation enregistrée avec succès',
      consultation: newConsultation,
    });
  } catch (err) {
    next(err);
  }
};

export const updateConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await ConsultationService.updateConsultation(id, req.body);
    res.json({
      message: 'Consultation mise à jour avec succès',
      consultation: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await ConsultationService.deleteConsultation(id);
    res.json({ message: 'Consultation supprimée avec succès' });
  } catch (err) {
    next(err);
  }
};
