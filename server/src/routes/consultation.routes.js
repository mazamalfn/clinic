/**
 * ==============================================================================
 * ROUTES CONSULTATIONS ET SECRET MÉDICAL (server/src/routes/consultation.routes.js)
 * ==============================================================================
 * Rôle : Gère l'enregistrement des actes médicaux et consultations.
 * Sécurité : Applique un masquage automatique du secret médical (diagnostics/notes)
 * pour le rôle Secrétaire lors de la consultation.
 * 
 * Endpoints :
 *  - GET    /api/consultations     : Lister les consultations
 *  - GET    /api/consultations/:id : Détails d'une consultation (avec masquage conditionnel)
 *  - POST   /api/consultations     : Enregistrer une nouvelle consultation (Médecin/Admin)
 *  - PUT    /api/consultations/:id : Mettre à jour une consultation
 *  - DELETE /api/consultations/:id : Supprimer une consultation
 */

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
