import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

const service = new AuthService();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.login(req.body);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.refresh(req.body);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.logout(req.user!.id);
      res.json(data);
    } catch (e) { next(e); }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.me(req.user!.id);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
}
