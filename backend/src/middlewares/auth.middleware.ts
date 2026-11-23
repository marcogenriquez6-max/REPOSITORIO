import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { ForbiddenError, UnauthorizedError } from '../shared/errors';
import { Role } from '../shared/constants';

export type TokenType = 'access' | 'refresh';

export interface AuthPayload {
  sub: string;
  email: string;
  role: Role;
  type?: TokenType;
  ver?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload & { id: string };
    }
  }
}

export function signAccessToken(u: { id: string; email: string; role: Role; tokenVersion: number }) {
  return jwt.sign({ sub: u.id, email: u.email, role: u.role, type: 'access', ver: u.tokenVersion }, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(u: { id: string; email: string; role: Role; tokenVersion: number }) {
  return jwt.sign({ sub: u.id, email: u.email, role: u.role, type: 'refresh', ver: u.tokenVersion }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'] });
}

export function verifyRefreshToken(token: string): AuthPayload & jwt.JwtPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as AuthPayload & jwt.JwtPayload;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new UnauthorizedError('Token requerido'));
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload & AuthPayload;
    if (decoded.type !== 'access') return next(new UnauthorizedError('Tipo de token inválido'));
    const dbUser = await prisma.user.findUnique({
      where: { id: String(decoded.sub) },
      select: { id: true, email: true, role: true, isActive: true, tokenVersion: true },
    });
    if (!dbUser || !dbUser.isActive) return next(new ForbiddenError('Usuario inactivo o inexistente'));
    if (decoded.ver !== dbUser.tokenVersion) return next(new UnauthorizedError('Sesión revocada'));
    req.user = { id: dbUser.id, sub: dbUser.id, email: dbUser.email, role: dbUser.role as Role, type: 'access', ver: dbUser.tokenVersion };
    next();
  } catch {
    next(new UnauthorizedError('Token inválido o expirado'));
  }
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const decoded = jwt.verify(header.slice(7), env.jwtSecret) as jwt.JwtPayload & AuthPayload;
    if (decoded.type !== 'access') return next();
    const dbUser = await prisma.user.findUnique({
      where: { id: String(decoded.sub) },
      select: { id: true, email: true, role: true, isActive: true, tokenVersion: true },
    });
    if (dbUser?.isActive && decoded.ver === dbUser.tokenVersion) {
      req.user = { id: dbUser.id, sub: dbUser.id, email: dbUser.email, role: dbUser.role as Role, type: 'access', ver: dbUser.tokenVersion };
    }
  } catch {
    // ignore invalid token for public endpoints
  }
  next();
}
