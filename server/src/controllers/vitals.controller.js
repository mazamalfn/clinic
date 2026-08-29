import { VitalsService } from '../services/index.js';

export const createVitals = async (req, res, next) => {
  try {
    const result = await VitalsService.createVitals(req.body, req.user.id);
    res.status(201).json({
      message: 'Constantes vitales enregistrées avec succès',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getPatientVitals = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const vitals = await VitalsService.getPatientVitals(patientId);
    res.json({ data: vitals });
  } catch (err) {
    next(err);
  }
};

export const getConsultationVitals = async (req, res, next) => {
  try {
    const { consultationId } = req.params;
    const vitals = await VitalsService.getConsultationVitals(consultationId);
    res.json({ data: vitals });
  } catch (err) {
    next(err);
  }
};
