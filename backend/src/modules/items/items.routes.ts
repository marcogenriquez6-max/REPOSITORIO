import { Router } from 'express';
import { ItemsController } from './items.controller';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/roles.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { assignReviewerSchema, createItemSchema, listItemsSchema, updateMetadataSchema } from './items.dto';

const router = Router();
const controller = new ItemsController();

router.get('/', optionalAuthenticate, validate(listItemsSchema, 'query'), (req, res, next) => controller.list(req, res, next));
router.get('/:id', optionalAuthenticate, (req, res, next) => controller.getById(req, res, next));
router.post('/', authenticate, authorize('DEPOSITANTE', 'REVISOR', 'ADMIN'), validate(createItemSchema), (req, res, next) => controller.create(req, res, next));
router.patch('/:id/metadata', authenticate, authorize('DEPOSITANTE', 'REVISOR', 'ADMIN'), validate(updateMetadataSchema), (req, res, next) => controller.updateMetadata(req, res, next));
router.patch('/:id/assign-reviewer', authenticate, authorize('ADMIN'), validate(assignReviewerSchema), (req, res, next) => controller.assignReviewer(req, res, next));

export default router;
