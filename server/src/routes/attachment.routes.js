import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { logAudit } from '../middleware/audit.middleware.js';
import { uploadAttachment, getPatientAttachments, deleteAttachment } from '../controllers/attachment.controller.js';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
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
