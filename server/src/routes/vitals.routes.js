import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { logAudit } from '../middleware/audit.middleware.js';
import { vitalsSchema } from '../validators/schemas.js';
import { createVitals, getPatientVitals, getConsultationVitals } from '../controllers/vitals.controller.js';

const router = Router();

router.use(authenticateJWT);

router.post(
  '/',
  authorizeRoles('admin', 'medecin', 'secretaire'),
  validateBody(vitalsSchema),
  logAudit('CREATE_VITALS', 'vitals'),
  createVitals
);

router.get(
  '/patient/:patientId',
  authorizeRoles('admin', 'medecin', 'secretaire'),
  logAudit('READ_VITALS_PATIENT', 'vitals'),
  getPatientVitals
);

router.get(
  '/consultation/:consultationId',
  authorizeRoles('admin', 'medecin', 'secretaire'),
  logAudit('READ_VITALS_CONSULTATION', 'vitals'),
  getConsultationVitals
);

export default router;
