import { PrescriptionService } from '../services/index.js';

export const getAllPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await PrescriptionService.getAllPrescriptions(req.query);
    res.json({ prescriptions });
  } catch (err) {
    next(err);
  }
};

export const getPrescriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prescription = await PrescriptionService.getPrescriptionById(id);

    if (!prescription) {
      return res.status(404).json({ error: 'Ordonnance non trouvée' });
    }

    res.json({ prescription });
  } catch (err) {
    next(err);
  }
};

export const createPrescription = async (req, res, next) => {
  try {
    const newPrescription = await PrescriptionService.createPrescription(req.body);
    res.status(201).json({
      message: 'Ordonnance créée avec succès',
      prescription: newPrescription,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};

export const updatePrescriptionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const updated = await PrescriptionService.updatePrescriptionStatus(id, statut);

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
    await PrescriptionService.deletePrescription(id);
    res.json({ message: 'Ordonnance supprimée avec succès' });
  } catch (err) {
    next(err);
  }
};
