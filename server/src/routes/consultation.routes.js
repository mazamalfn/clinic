import { Router } from 'express';
import {
  getAllConsultations,
  getConsultationById,
  createConsultation,
  updateConsultation,
  deleteConsultation,
} from '../controllers/consultation.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { consultationSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', authorizeRoles('admin', 'medecin', 'secretaire'), getAllConsultations);
router.get('/:id', authorizeRoles('admin', 'medecin', 'secretaire'), getConsultationById);
router.post('/', authorizeRoles('admin', 'medecin'), validateBody(consultationSchema), createConsultation);
router.put('/:id', authorizeRoles('admin', 'medecin'), updateConsultation);
router.delete('/:id', authorizeRoles('admin', 'medecin'), deleteConsultation);

export default router;
