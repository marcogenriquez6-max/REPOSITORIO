import { Router } from 'express';
import { ReviewController } from './review.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/roles.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  checksSchema, decisionSchema, inboxSchema, observationSchema, resolveObservationSchema,
} from './review.dto';

const router = Router();
const controller = new ReviewController();

router.use(authenticate, authorize('REVISOR', 'ADMIN'));

router.get('/inbox', validate(inboxSchema, 'query'), (req, res, next) => controller.inbox(req, res, next));
router.get('/items/:itemId', (req, res, next) => controller.detail(req, res, next));
router.get('/items/:itemId/checks', (req, res, next) => controller.checks(req, res, next));
router.post('/items/:itemId/checks', validate(checksSchema), (req, res, next) => controller.saveChecks(req, res, next));
router.get('/items/:itemId/observations', (req, res, next) => controller.observations(req, res, next));
router.post('/items/:itemId/observations', validate(observationSchema), (req, res, next) => controller.createObservation(req, res, next));
router.patch('/observations/:id/resolve', validate(resolveObservationSchema), (req, res, next) => controller.resolveObservation(req, res, next));
router.post('/items/:itemId/start', (req, res, next) => controller.startReview(req, res, next));
router.post('/items/:itemId/return', validate(decisionSchema), (req, res, next) => controller.returnForCorrection(req, res, next));
router.post('/items/:itemId/reject', validate(decisionSchema), (req, res, next) => controller.reject(req, res, next));
router.post('/items/:itemId/approve', validate(decisionSchema), (req, res, next) => controller.approve(req, res, next));
router.get('/items/:itemId/history', (req, res, next) => controller.history(req, res, next));

export default router;
