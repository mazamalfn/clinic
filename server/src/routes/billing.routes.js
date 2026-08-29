/**
 * ==============================================================================
 * ROUTES FACTURATION ET PAIEMENTS (server/src/routes/billing.routes.js)
 * ==============================================================================
 * Rôle : Gère l'émission des factures, le suivi des impayés et les encaissements de règlements.
 * 
 * Endpoints :
 *  - POST /api/invoices        : Créer une nouvelle facture (`FAC-YYYY-XXXX`)
 *  - GET  /api/invoices        : Lister les factures (filtrable par patient/statut)
 *  - GET  /api/invoices/:id/pdf: Générer le document PDF de la facture/reçu
 *  - GET  /api/invoices/:id    : Détails d'une facture et règlements
 *  - POST /api/payments        : Enregistrer un paiement et émettre une quittance (`RECU-XXXX`)
 */

import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { logAudit } from '../middleware/audit.middleware.js';
import { invoiceCreateSchema, paymentCreateSchema } from '../validators/schemas.js';
import { createInvoice, getInvoices, getInvoiceById, createPayment } from '../controllers/billing.controller.js';
import { downloadInvoicePDF } from '../controllers/pdf.controller.js';

const router = Router();

router.use(authenticateJWT);

router.post(
  '/invoices',
  authorizeRoles('admin', 'secretaire'),
  validateBody(invoiceCreateSchema),
  logAudit('CREATE_INVOICE', 'invoices'),
  createInvoice
);

router.get(
  '/invoices',
  authorizeRoles('admin', 'medecin', 'secretaire'),
  logAudit('READ_INVOICES', 'invoices'),
  getInvoices
);

router.get(
  '/invoices/:id/pdf',
  authorizeRoles('admin', 'medecin', 'secretaire'),
  logAudit('EXPORT_INVOICE_PDF', 'invoices'),
  downloadInvoicePDF
);

router.get(
  '/invoices/:id',
  authorizeRoles('admin', 'medecin', 'secretaire'),
  logAudit('READ_INVOICE_BY_ID', 'invoices'),
  getInvoiceById
);

router.post(
  '/payments',
  authorizeRoles('admin', 'secretaire'),
  validateBody(paymentCreateSchema),
  logAudit('CREATE_PAYMENT', 'payments'),
  createPayment
);

export default router;
