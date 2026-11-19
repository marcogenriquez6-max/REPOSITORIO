import { Request, Response, NextFunction } from 'express';
import { CommunitiesService } from './communities.service';

const service = new CommunitiesService();

export class CommunitiesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await service.list(req.query as any) }); } catch (e) { next(e); }
  }
  async getById(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await service.getById(req.params.id) }); } catch (e) { next(e); }
  }
  async create(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json({ success: true, data: await service.create(req.body) }); } catch (e) { next(e); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await service.update(req.params.id, req.body) }); } catch (e) { next(e); }
  }
}
