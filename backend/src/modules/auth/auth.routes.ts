import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { loginSchema, refreshSchema } from './auth.dto';

const router = Router();
const controller = new AuthController();

router.post('/login', validate(loginSchema), (req, res, next) => controller.login(req, res, next));
router.post('/refresh', validate(refreshSchema), (req, res, next) => controller.refresh(req, res, next));
router.get('/me', authenticate, (req, res, next) => controller.me(req, res, next));

export default router;
