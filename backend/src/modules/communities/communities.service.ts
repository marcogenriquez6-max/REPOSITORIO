import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError, NotFoundError } from '../../shared/errors';
import { slugify } from '../../shared/slug';
import { CreateCommunityDto, ListCommunitiesDto, UpdateCommunityDto } from './communities.dto';

export class CommunitiesService {
  async list(query: ListCommunitiesDto) {
    const where: Prisma.CommunityWhereInput = { isActive: query.active !== 'false' };
    if (query.parentId !== undefined) where.parentId = query.parentId;
    return prisma.community.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { collections: true, children: true } } },
    });
  }

  async getById(id: string) {
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        children: { orderBy: { sortOrder: 'asc' } },
        collections: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!community) throw new NotFoundError('Comunidad no encontrada');
    return community;
  }

  async create(dto: CreateCommunityDto) {
    const slug = slugify(dto.name);
    const exists = await prisma.community.findFirst({ where: { slug, parentId: dto.parentId ?? null } });
    if (exists) throw new AppError('Ya existe una comunidad con ese nombre en este nivel', 409, 'DUPLICATE_SLUG');
    return prisma.community.create({
      data: {
        name: dto.name,
        slug,
        parentId: dto.parentId ?? null,
        shortDescription: dto.shortDescription,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async update(id: string, dto: UpdateCommunityDto) {
    await this.getById(id);
    return prisma.community.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.name ? slugify(dto.name) : undefined,
        parentId: dto.parentId,
        shortDescription: dto.shortDescription,
        sortOrder: dto.sortOrder,
      },
    });
  }
}
