import { AppointmentService } from '../services/index.js';

export const getAllAppointments = async (req, res, next) => {
  try {
    const appointments = await AppointmentService.getAllAppointments(req.query);
    res.json({ appointments });
  } catch (err) {
    next(err);
  }
};

export const getWaitingQueue = async (req, res, next) => {
  try {
    const { medecin_id } = req.query;
    const queueData = await AppointmentService.getWaitingQueue(medecin_id);

    res.json({
      message: 'File d attente de la journée récupérée',
      ...queueData,
    });
  } catch (err) {
    next(err);
  }
};

export const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await AppointmentService.getAppointmentById(id);

    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    res.json({ appointment });
  } catch (err) {
    next(err);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    const newAppointment = await AppointmentService.createAppointment(req.body);
    res.status(201).json({
      message: 'Rendez-vous créé avec succès',
      appointment: newAppointment,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};

export const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await AppointmentService.updateAppointment(id, req.body);
    res.json({
      message: 'Rendez-vous mis à jour avec succès',
      appointment: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const updated = await AppointmentService.updateAppointmentStatus(id, statut);
    res.json({
      message: 'Statut du rendez-vous mis à jour avec succès',
      appointment: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    await AppointmentService.deleteAppointment(id);
    res.json({ message: 'Rendez-vous supprimé avec succès' });
  } catch (err) {
    next(err);
  }
};
