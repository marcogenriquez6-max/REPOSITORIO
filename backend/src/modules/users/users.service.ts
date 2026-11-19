import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError, NotFoundError } from '../../shared/errors';
import { CreateUserDto, ListUsersDto, UpdateUserDto } from './users.dto';

export class UsersService {
  async list(query: ListUsersDto) {
    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role;
    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { fullName: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: { id: true, email: true, fullName: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
        orderBy: { fullName: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);
    return { users, pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, fullName: true, role: true, isActive: true, lastLoginAt: true,
        assignedFaculties: { include: { community: { select: { id: true, name: true } } } },
      },
    });
    if (!user) throw new NotFoundError('Usuario no encontrado');
    return user;
  }

  async create(dto: CreateUserDto) {
    const exists = await prisma.user.findUnique({ where: { email: dto.email }, select: { id: true } });
    if (exists) throw new AppError('El correo ya está registrado', 409, 'DUPLICATE_EMAIL');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return prisma.user.create({
      data: { email: dto.email, fullName: dto.fullName, role: dto.role, passwordHash },
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.getById(id);
    return prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });
  }

  async assignFaculties(id: string, communityIds: string[]) {
    await this.getById(id);
    const communities = await prisma.community.findMany({ where: { id: { in: communityIds } }, select: { id: true } });
    if (communities.length !== communityIds.length) throw new NotFoundError('Una o más comunidades no existen');
    return prisma.$transaction(async (tx) => {
      await tx.userFaculty.deleteMany({ where: { userId: id } });
      await tx.userFaculty.createMany({ data: communityIds.map((communityId) => ({ userId: id, communityId })) });
      return this.getById(id);
    });
  }
}
