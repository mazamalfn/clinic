import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { loginSchema } from '../validators/schemas.js';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticateJWT, getMe);

export default router;
