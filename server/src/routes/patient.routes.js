import { Router } from 'express';
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patient.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { patientSchema } from '../validators/schemas.js';

const router = Router();

// Accessible aux rôles: admin, medecin, secretaire
router.use(authenticateJWT, authorizeRoles('admin', 'medecin', 'secretaire'));

router.get('/', getAllPatients);
router.get('/:id', getPatientById);
router.post('/', validateBody(patientSchema), createPatient);
router.put('/:id', validateBody(patientSchema), updatePatient);
router.delete('/:id', authorizeRoles('admin', 'secretaire'), deletePatient);

export default router;
