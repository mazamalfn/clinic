import { PatientService } from '../services/index.js';

export const getAllPatients = async (req, res, next) => {
  try {
    const { q } = req.query;
    const patients = await PatientService.getAllPatients(q);
    res.json({ patients });
  } catch (err) {
    next(err);
  }
};

export const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patientData = await PatientService.getPatientWithHistory(id);

    if (!patientData) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    res.json(patientData);
  } catch (err) {
    next(err);
  }
};

export const createPatient = async (req, res, next) => {
  try {
    const newPatient = await PatientService.createPatient(req.body);
    res.status(201).json({
      message: 'Patient créé avec succès',
      patient: newPatient,
    });
  } catch (err) {
    next(err);
  }
};

export const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedPatient = await PatientService.updatePatient(id, req.body);
    res.json({
      message: 'Patient mis à jour avec succès',
      patient: updatedPatient,
    });
  } catch (err) {
    next(err);
  }
};

export const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    await PatientService.deletePatient(id);
    res.json({ message: 'Patient supprimé avec succès' });
  } catch (err) {
    next(err);
  }
};
