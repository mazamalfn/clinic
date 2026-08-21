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

// Seul le rôle ADMIN peut gérer le personnel de la clinique
router.use(authenticateJWT, authorizeRoles('admin'));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', validateBody(userCreateSchema), createUser);
router.put('/:id', validateBody(userUpdateSchema), updateUser);
router.delete('/:id', deleteUser);

export default router;
