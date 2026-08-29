/**
 * ==============================================================================
 * ROUTES GESTION DU PERSONNEL ET UTILISATEURS (server/src/routes/user.routes.js)
 * ==============================================================================
 * Rôle : Définit les endpoints de gestion des comptes utilisateurs (Administrateurs, Médecins, Secrétaires).
 * Accès strict : Réservé exclusivement au rôle `admin`.
 * 
 * Endpoints :
 *  - GET    /api/users     : Liste tous les utilisateurs (filtrable par rôle)
 *  - GET    /api/users/:id : Détails d'un utilisateur
 *  - POST   /api/users     : Créer un nouvel utilisateur avec mot de passe haché
 *  - PUT    /api/users/:id : Mettre à jour un utilisateur
 *  - DELETE /api/users/:id : Supprimer un compte utilisateur
 */

import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { userCreateSchema, userUpdateSchema } from '../validators/schemas.js';

const router = Router();

// Protection globale de la route : Authentification JWT + Rôle ADMIN obligatoire
router.use(authenticateJWT, authorizeRoles('admin'));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', validateBody(userCreateSchema), createUser);
router.put('/:id', validateBody(userUpdateSchema), updateUser);
router.delete('/:id', deleteUser);

export default router;
