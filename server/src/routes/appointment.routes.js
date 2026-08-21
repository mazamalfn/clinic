import { Router } from 'express';
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from '../controllers/appointment.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { appointmentSchema, appointmentStatusSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticateJWT, authorizeRoles('admin', 'medecin', 'secretaire'));

router.get('/', getAllAppointments);
router.get('/:id', getAppointmentById);
router.post('/', validateBody(appointmentSchema), createAppointment);
router.put('/:id', validateBody(appointmentSchema), updateAppointment);
router.patch('/:id/statut', validateBody(appointmentStatusSchema), updateAppointmentStatus);
router.delete('/:id', deleteAppointment);

export default router;
