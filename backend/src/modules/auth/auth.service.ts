import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../middlewares/auth.middleware';
import { AppError, UnauthorizedError, ForbiddenError } from '../../shared/errors';
import { Role } from '../../shared/constants';
import { LoginDto, RefreshDto } from './auth.dto';

export class AuthService {
  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) throw new UnauthorizedError('Credenciales inválidas');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Credenciales inválidas');

    const payload = { id: user.id, email: user.email, role: user.role as Role };
    const token = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return {
      token,
      refreshToken,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    };
  }

  async refresh(dto: RefreshDto) {
    let decoded;
    try {
      decoded = verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }
    if (decoded.type !== 'refresh') throw new UnauthorizedError('Tipo de token inválido');

    const user = await prisma.user.findUnique({ where: { id: String(decoded.sub) } });
    if (!user || !user.isActive) throw new ForbiddenError('Usuario inactivo o inexistente');

    const payload = { id: user.id, email: user.email, role: user.role as Role };
    return {
      token: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    };
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, fullName: true, role: true, isActive: true } });
    if (!user || !user.isActive) throw new UnauthorizedError('Usuario no autorizado');
    return user;
  }
}
