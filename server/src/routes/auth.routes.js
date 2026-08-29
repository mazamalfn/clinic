/**
 * ==============================================================================
 * ROUTES D'AUTHENTIFICATION (server/src/routes/auth.routes.js)
 * ==============================================================================
 * Rôle : Définit les endpoints d'authentification et d'accès au profil.
 * 
 * Endpoints :
 *  - POST /api/auth/login : Connexion utilisateur (email, mot de passe) -> retourne le jeton JWT
 *  - GET  /api/auth/me    : Récupère les données de l'utilisateur actuellement connecté
 */

import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { loginSchema } from '../validators/schemas.js';

const router = Router();

// POST /api/auth/login - Connexion publique avec validation du schéma JSON
router.post('/login', validateBody(loginSchema), login);

// GET /api/auth/me - Récupération du profil protégé par jeton JWT
router.get('/me', authenticateJWT, getMe);

export default router;
