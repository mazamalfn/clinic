/**
 * ==============================================================================
 * ROUTES ORDONNANCES ET IMPRESSION PDF (server/src/routes/prescription.routes.js)
 * ==============================================================================
 * Rôle : Gère les prescriptions médicales et l'export PDF prêt à imprimer.
 * 
 * Endpoints :
 *  - GET   /api/prescriptions          : Liste des ordonnances
 *  - GET   /api/prescriptions/:id/pdf  : Télécharger le PDF officiel de l'ordonnance (PDFKit)
 *  - GET   /api/prescriptions/:id      : Détails d'une ordonnance et médicaments
 *  - POST  /api/prescriptions          : Créer une nouvelle ordonnance avec médicaments
 *  - PATCH /api/prescriptions/:id/statut : Changer le statut (en_cours, delivree, annulee)
 *  - DELETE /api/prescriptions/:id     : Supprimer une ordonnance
 */

import { Router } from 'express';
import {
  getAllPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescriptionStatus,
  deletePrescription,
} from '../controllers/prescription.controller.js';
import { downloadPrescriptionPDF } from '../controllers/pdf.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { logAudit } from '../middleware/audit.middleware.js';
import { prescriptionSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', authorizeRoles('admin', 'medecin', 'secretaire'), logAudit('READ_PRESCRIPTIONS', 'prescriptions'), getAllPrescriptions);
router.get('/:id/pdf', authorizeRoles('admin', 'medecin', 'secretaire'), logAudit('EXPORT_PRESCRIPTION_PDF', 'prescriptions'), downloadPrescriptionPDF);
router.get('/:id', authorizeRoles('admin', 'medecin', 'secretaire'), logAudit('READ_PRESCRIPTION_BY_ID', 'prescriptions'), getPrescriptionById);
router.post('/', authorizeRoles('admin', 'medecin'), validateBody(prescriptionSchema), logAudit('CREATE_PRESCRIPTION', 'prescriptions'), createPrescription);
router.patch('/:id/statut', authorizeRoles('admin', 'medecin'), logAudit('UPDATE_PRESCRIPTION_STATUS', 'prescriptions'), updatePrescriptionStatus);
router.delete('/:id', authorizeRoles('admin', 'medecin'), logAudit('DELETE_PRESCRIPTION', 'prescriptions'), deletePrescription);

export default router;
