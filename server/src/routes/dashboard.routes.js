/**
 * ==============================================================================
 * ROUTES TABLEAU DE BORD (server/src/routes/dashboard.routes.js)
 * ==============================================================================
 * Rôle : Fournit les données d'analyse et statistiques agrégées pour l'interface principale.
 * 
 * Endpoints :
 *  - GET /api/dashboard/stats : Statistiques (patients, médecins, RDV du jour, consultations du jour, top 5 RDV)
 */

import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/stats', authenticateJWT, getDashboardStats);

export default router;
