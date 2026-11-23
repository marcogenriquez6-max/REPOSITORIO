import { Router } from 'express';
import { ReviewController } from './review.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize, authorizeReviewerScope } from '../../middlewares/roles.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  checksSchema, decisionSchema, inboxSchema, observationSchema, resolveObservationSchema,
} from './review.dto';

const router = Router();
const controller = new ReviewController();
const reviewOnly = authorize('REVISOR', 'ADMIN');
const scoped = authorizeReviewerScope();

router.use(authenticate);

router.get('/inbox', reviewOnly, validate(inboxSchema, 'query'), (req, res, next) => controller.inbox(req, res, next));
router.get('/items/:itemId', reviewOnly, scoped, (req, res, next) => controller.detail(req, res, next));
router.get('/items/:itemId/checks', reviewOnly, scoped, (req, res, next) => controller.checks(req, res, next));
router.post('/items/:itemId/checks', reviewOnly, scoped, validate(checksSchema), (req, res, next) => controller.saveChecks(req, res, next));
router.get('/items/:itemId/observations', reviewOnly, scoped, (req, res, next) => controller.observations(req, res, next));
router.post('/items/:itemId/observations', reviewOnly, scoped, validate(observationSchema), (req, res, next) => controller.createObservation(req, res, next));
router.patch('/observations/:id/resolve', reviewOnly, validate(resolveObservationSchema), (req, res, next) => controller.resolveObservation(req, res, next));
router.patch('/observations/:id/respond', validate(resolveObservationSchema), (req, res, next) => controller.respondObservation(req, res, next));
router.post('/items/:itemId/start', reviewOnly, scoped, (req, res, next) => controller.startReview(req, res, next));
router.post('/items/:itemId/return', reviewOnly, scoped, validate(decisionSchema), (req, res, next) => controller.returnForCorrection(req, res, next));
router.post('/items/:itemId/reject', reviewOnly, scoped, validate(decisionSchema), (req, res, next) => controller.reject(req, res, next));
router.post('/items/:itemId/approve', reviewOnly, scoped, validate(decisionSchema), (req, res, next) => controller.approve(req, res, next));
router.get('/items/:itemId/history', reviewOnly, scoped, (req, res, next) => controller.history(req, res, next));

export default router;
