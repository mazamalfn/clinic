import { Router } from 'express';
import {
  getAllAppointments,
  getWaitingQueue,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from '../controllers/appointment.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { logAudit } from '../middleware/audit.middleware.js';
import { appointmentSchema, appointmentStatusSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticateJWT, authorizeRoles('admin', 'medecin', 'secretaire'));

router.get('/', getAllAppointments);
router.get('/queue', logAudit('READ_WAITING_QUEUE', 'appointments'), getWaitingQueue);
router.get('/:id', getAppointmentById);
router.post('/', validateBody(appointmentSchema), logAudit('CREATE_APPOINTMENT', 'appointments'), createAppointment);
router.put('/:id', validateBody(appointmentSchema), logAudit('UPDATE_APPOINTMENT', 'appointments'), updateAppointment);
router.patch('/:id/statut', validateBody(appointmentStatusSchema), logAudit('UPDATE_APPOINTMENT_STATUS', 'appointments'), updateAppointmentStatus);
router.delete('/:id', logAudit('DELETE_APPOINTMENT', 'appointments'), deleteAppointment);

export default router;
