import { Router } from 'express';
import {
  getAllPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescriptionStatus,
  deletePrescription,
} from '../controllers/prescription.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { prescriptionSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', authorizeRoles('admin', 'medecin', 'secretaire'), getAllPrescriptions);
router.get('/:id', authorizeRoles('admin', 'medecin', 'secretaire'), getPrescriptionById);
router.post('/', authorizeRoles('admin', 'medecin'), validateBody(prescriptionSchema), createPrescription);
router.patch('/:id/statut', authorizeRoles('admin', 'medecin'), updatePrescriptionStatus);
router.delete('/:id', authorizeRoles('admin', 'medecin'), deletePrescription);

export default router;
