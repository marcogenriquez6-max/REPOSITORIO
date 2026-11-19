import { Prisma } from '@prisma/client';
import { ListItemsDto } from './items.dto';

export type Requester = { id: string; role: string };

export function buildItemsWhere(
  query: ListItemsDto,
  requester: Requester | undefined,
  visibility: Prisma.ItemWhereInput,
): Prisma.ItemWhereInput {
  const filters: Prisma.ItemWhereInput[] = [];

  if (Object.keys(visibility).length > 0) filters.push(visibility);
  if (query.status) filters.push({ status: query.status });
  if (query.mine) {
    filters.push({ creatorId: requester?.id ?? '00000000-0000-0000-0000-000000000000' });
  }
  if (query.collectionId) filters.push({ collectionId: query.collectionId });
  if (query.communityId) filters.push({ collection: { communityId: query.communityId } });
  if (query.year) {
    filters.push({
      metadata: {
        some: { schema: 'dc', element: 'date', qualifier: 'issued', value: { startsWith: query.year } },
      },
    });
  }
  if (query.q) {
    const contains = { contains: query.q, mode: 'insensitive' as const };
    filters.push({
      OR: [
        { metadata: { some: { element: 'title', value: contains } } },
        { metadata: { some: { element: 'contributor', qualifier: 'author', value: contains } } },
        { metadata: { some: { element: 'description', qualifier: 'abstract', value: contains } } },
      ],
    });
  }
  if (query.from || query.to) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (query.from) createdAt.gte = new Date(query.from);
    if (query.to) createdAt.lte = new Date(query.to);
    filters.push({ createdAt });
  }

  return filters.length > 0 ? { AND: filters } : {};
}
