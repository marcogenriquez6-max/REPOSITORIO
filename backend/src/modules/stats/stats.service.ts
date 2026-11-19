import { prisma } from '../../config/prisma';

export class StatsService {
  async overview() {
    const [byStatus, users, checks, pendingObservations, totalDownloads, topViewed, topDownloaded] = await Promise.all([
      prisma.item.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.reviewCheck.count({ where: { passed: true } }),
      prisma.observation.count({ where: { status: 'PENDIENTE' } }),
      prisma.bitstream.aggregate({ _sum: { downloadCount: true } }),
      prisma.item.findMany({
        where: { status: { in: ['PUBLICADO', 'EMBARGADO'] } },
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: { id: true, viewCount: true, metadata: { where: { element: 'title' }, take: 1 } },
      }),
      prisma.bitstream.findMany({
        where: { downloadCount: { gt: 0 } },
        orderBy: { downloadCount: 'desc' },
        take: 5,
        select: { id: true, downloadCount: true, originalName: true, item: { select: { id: true, metadata: { where: { element: 'title' }, take: 1 } } } },
      }),
    ]);
    return {
      byStatus: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
      activeUsers: users,
      passedChecks: checks,
      pendingObservations,
      totalDownloads: totalDownloads._sum.downloadCount ?? 0,
      topViewed: topViewed.map((item) => ({ id: item.id, title: item.metadata[0]?.value ?? 'Sin título', views: item.viewCount })),
      topDownloaded: topDownloaded.map((b) => ({ id: b.item.id, title: b.item.metadata[0]?.value ?? b.originalName, downloads: b.downloadCount })),
    };
  }
}
