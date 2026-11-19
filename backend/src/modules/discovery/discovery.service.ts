import { prisma } from '../../config/prisma';
import { ItemsService } from '../items/items.service';
import { SearchDto } from './discovery.dto';

const items = new ItemsService();

export class DiscoveryService {
  async search(query: SearchDto, requester?: { id: string; role: string }) {
    return items.list(query, requester);
  }

  async facets() {
    const [communities, collections, years] = await Promise.all([
      prisma.community.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, shortDescription: true, parentId: true, _count: { select: { collections: true, children: true } } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.collection.findMany({
        where: { isActive: true },
        select: { id: true, name: true, communityId: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.$queryRaw<Array<{ year: string; count: bigint }>>`
        SELECT substring(mv.value from 1 for 4) AS year, COUNT(DISTINCT mv.item_id)::bigint AS count
        FROM metadata_values mv
        JOIN items i ON i.id = mv.item_id
        WHERE mv.schema = 'dc' AND mv.element = 'date' AND mv.qualifier = 'issued'
          AND i.status IN ('PUBLICADO', 'EMBARGADO')
        GROUP BY 1 ORDER BY 1 DESC LIMIT 20
      `,
    ]);
    return {
      communities,
      collections,
      years: years.map((y) => ({ year: y.year, count: Number(y.count) })),
    };
  }
}
