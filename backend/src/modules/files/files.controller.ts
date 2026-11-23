import { Request, Response, NextFunction } from 'express';
import { FilesService } from './files.service';
import { AppError } from '../../shared/errors';
import { BitstreamBundle } from '@prisma/client';

const service = new FilesService();

export class FilesController {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) throw new AppError('No se subió ningún archivo', 400, 'FILE_REQUIRED');
      const bundle = (req.body.bundle || 'ORIGINAL') as BitstreamBundle;
      const data = await service.attachToItem({
        itemId: req.params.itemId || req.params.id,
        actorId: req.user!.id,
        actorRole: req.user!.role,
        file,
        bundle,
        description: req.body.description,
      });
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const file = await service.getDownload(req.params.bitstreamId, requester);
      res.setHeader('Content-Type', file.mime);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Vary', 'Authorization');
      res.send(file.content);
    } catch (e) { next(e); }
  }

  async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const file = await service.getDownload(req.params.bitstreamId, requester, false);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Vary', 'Authorization');
      res.send(file.content);
    } catch (e) { next(e); }
  }
}
