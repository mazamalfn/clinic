/**
 * ==============================================================================
 * ROUTES GESTION ÉLECTRONIQUE DE DOCUMENTS / GED (server/src/routes/attachment.routes.js)
 * ==============================================================================
 * Rôle : Gère le téléversement de documents médicaux (Multer), radio, résultats d'analyses.
 * 
 * Endpoints :
 *  - POST   /api/attachments                    : Téléverser une pièce jointe (max 10MB)
 *  - GET    /api/attachments/patient/:patientId : Consulter la GED d'un patient
 *  - DELETE /api/attachments/:id                : Supprimer une pièce jointe (Médecin/Admin)
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { logAudit } from '../middleware/audit.middleware.js';
import { uploadAttachment, getPatientAttachments, deleteAttachment } from '../controllers/attachment.controller.js';

// Création automatique du répertoire /uploads s'il n'existe pas
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage de fichiers disque Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite fixée à 10 Mo par fichier
});

const router = Router();

router.use(authenticateJWT);

router.post(
  '/',
  authorizeRoles('admin', 'medecin', 'secretaire'),
  upload.single('file'),
  logAudit('UPLOAD_ATTACHMENT', 'attachments'),
  uploadAttachment
);

router.get(
  '/patient/:patientId',
  authorizeRoles('admin', 'medecin', 'secretaire'),
  logAudit('READ_ATTACHMENTS_PATIENT', 'attachments'),
  getPatientAttachments
);

router.delete(
  '/:id',
  authorizeRoles('admin', 'medecin'),
  logAudit('DELETE_ATTACHMENT', 'attachments'),
  deleteAttachment
);

export default router;
