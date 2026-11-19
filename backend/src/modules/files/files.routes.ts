import { Router } from 'express';
import { FilesController } from './files.controller';
import { uploadPdf } from '../../config/multer';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/roles.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploadBitstreamSchema } from './files.dto';

const router = Router();
const controller = new FilesController();

// upload bitstream for an item (owner/admin; further checks in service)
router.post('/items/:itemId', authenticate, authorize('ADMIN', 'DEPOSITANTE', 'REVISOR'), uploadPdf.single('file'), validate(uploadBitstreamSchema), (req, res, next) => controller.upload(req, res, next));

// controlled download (enforces PUBLICADO/EMBARGADO and scope)
router.get('/:bitstreamId/download', optionalAuthenticate, (req, res, next) => controller.download(req, res, next));
router.get('/:bitstreamId/preview', optionalAuthenticate, (req, res, next) => controller.preview(req, res, next));

export default router;
