import { Request, Response, NextFunction } from 'express';
import { WorkflowService } from './workflow.service';

const service = new WorkflowService();

export class WorkflowController {
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.submit(req.params.itemId, req.user!.id);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.approve(req.params.itemId, req.user!.id, req.body);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async observe(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.observe(req.params.itemId, req.user!.id, req.body.comment);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
}
