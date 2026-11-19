import { Request, Response, NextFunction } from 'express';
import { ItemsService } from './items.service';

const service = new ItemsService();

export class ItemsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const data = await service.list(req.query as any, requester);
      res.json({ success: true, ...data });
    } catch (e) { next(e); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const data = await service.getById(req.params.id, requester);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.create(req.body, req.user!.id);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  async updateMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.updateMetadata(req.params.id, req.body, req.user!.id, req.user!.role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async assignReviewer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.assignReviewer(req.params.id, req.body.reviewerId);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
}
