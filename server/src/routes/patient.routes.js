/**
 * ==============================================================================
 * ROUTES DOSSIERS PATIENTS (server/src/routes/patient.routes.js)
 * ==============================================================================
 * Rôle : Définit les endpoints de création, consultation, modification et suppression des patients.
 * Accès : Accessible à l'ensemble du personnel (Admin, Médecin, Secrétaire).
 * 
 * Endpoints :
 *  - GET    /api/patients     : Rechercher/Lister les patients
 *  - GET    /api/patients/:id : Consulter le dossier d'un patient et son historique complet
 *  - POST   /api/patients     : Enregistrer un nouveau patient
 *  - PUT    /api/patients/:id : Mettre à jour les coordonnées du patient
 *  - DELETE /api/patients/:id : Supprimer la fiche patient (Admin / Secrétaire)
 */

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

// Middleware d'authentification pour toutes les routes patients
router.use(authenticateJWT, authorizeRoles('admin', 'medecin', 'secretaire'));

router.get('/', getAllPatients);
router.get('/:id', getPatientById);
router.post('/', validateBody(patientSchema), createPatient);
router.put('/:id', validateBody(patientSchema), updatePatient);
router.delete('/:id', authorizeRoles('admin', 'secretaire'), deletePatient);

export default router;
