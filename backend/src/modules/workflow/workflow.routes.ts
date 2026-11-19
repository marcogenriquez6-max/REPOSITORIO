import { Router } from 'express';
import { WorkflowController } from './workflow.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize, authorizeReviewerScope } from '../../middlewares/roles.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { approveSchema, observeSchema } from './workflow.dto';

const router = Router();
const controller = new WorkflowController();

// Depositante/Admin submits their item (ownership checked in service)
router.post('/items/:itemId/submit', authenticate, authorize('DEPOSITANTE', 'ADMIN', 'REVISOR'), (req, res, next) => controller.submit(req, res, next));

// Reviewer/Admin actions scoped to assigned faculty/community hierarchy
router.post('/items/:itemId/approve', authenticate, authorize('REVISOR', 'ADMIN'), authorizeReviewerScope('itemId'), validate(approveSchema), (req, res, next) => controller.approve(req, res, next));
router.post('/items/:itemId/observe', authenticate, authorize('REVISOR', 'ADMIN'), authorizeReviewerScope('itemId'), validate(observeSchema), (req, res, next) => controller.observe(req, res, next));

export default router;
