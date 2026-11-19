import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError, NotFoundError } from '../../shared/errors';
import { slugify } from '../../shared/slug';
import { CreateCollectionDto, ListCollectionsDto, UpdateCollectionDto } from './collections.dto';

export class CollectionsService {
  async list(query: ListCollectionsDto) {
    const where: Prisma.CollectionWhereInput = { isActive: query.active !== 'false' };
    if (query.communityId) where.communityId = query.communityId;
    return prisma.collection.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { community: { select: { id: true, name: true } }, _count: { select: { items: true } } },
    });
  }

  async getById(id: string) {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: { community: { select: { id: true, name: true, parentId: true } } },
    });
    if (!collection) throw new NotFoundError('Colección no encontrada');
    return collection;
  }

  async create(dto: CreateCollectionDto) {
    const community = await prisma.community.findUnique({ where: { id: dto.communityId }, select: { id: true } });
    if (!community) throw new NotFoundError('Comunidad no encontrada');
    const slug = slugify(dto.name);
    const exists = await prisma.collection.findFirst({ where: { slug, communityId: dto.communityId } });
    if (exists) throw new AppError('Ya existe una colección con ese nombre en la comunidad', 409, 'DUPLICATE_SLUG');
    return prisma.collection.create({
      data: {
        name: dto.name,
        slug,
        communityId: dto.communityId,
        shortDescription: dto.shortDescription,
        licenseText: dto.licenseText,
        workflowEnabled: dto.workflowEnabled,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async update(id: string, dto: UpdateCollectionDto) {
    await this.getById(id);
    return prisma.collection.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.name ? slugify(dto.name) : undefined,
        shortDescription: dto.shortDescription,
        licenseText: dto.licenseText,
        workflowEnabled: dto.workflowEnabled,
        sortOrder: dto.sortOrder,
      },
    });
  }
}
