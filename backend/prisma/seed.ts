import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const INSECURE_SEED_PASSWORDS = new Set(['Admin123!', 'Revisor123!', 'Deposito123!']);

function requiredSeedPassword(name: string): string {
  const password = process.env[name]?.trim();
  if (!password) throw new Error(`Missing required env var: ${name}`);
  if (password.length < 12) throw new Error(`${name} must be at least 12 characters long`);
  if (INSECURE_SEED_PASSWORDS.has(password) || /^(replace|change|example)/i.test(password)) {
    throw new Error(`${name} must not use a default or placeholder value`);
  }
  return password;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function upsertUser(email: string, fullName: string, role: UserRole, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { fullName, role, passwordHash, isActive: true },
    create: { email, fullName, role, passwordHash, isActive: true },
  });
}

async function upsertCommunity(name: string, parentId: string | null, sortOrder = 0) {
  const slug = slugify(name);
  const existing = await prisma.community.findFirst({ where: { slug, parentId } });
  if (existing) return existing;
  return prisma.community.create({ data: { name, slug, parentId, sortOrder, isActive: true } });
}

async function upsertCollection(name: string, communityId: string, sortOrder = 0) {
  const slug = slugify(name);
  const existing = await prisma.collection.findFirst({ where: { slug, communityId } });
  if (existing) return existing;
  return prisma.collection.create({
    data: { name, slug, communityId, sortOrder, isActive: true, workflowEnabled: true },
  });
}

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error('Refusing to run the seed in production without ALLOW_PRODUCTION_SEED=true');
  }

  const adminPassword = requiredSeedPassword('SEED_ADMIN_PASSWORD');
  const reviewerPassword = requiredSeedPassword('SEED_REVIEWER_PASSWORD');
  const depositorPassword = requiredSeedPassword('SEED_DEPOSITOR_PASSWORD');

  const admin = await upsertUser(
    'admin@unior.edu.bo',
    'Administrador General',
    'ADMIN',
    adminPassword
  );
  const reviewer = await upsertUser(
    'postgrado@unior.edu.bo',
    'Revisor Postgrado',
    'REVISOR',
    reviewerPassword
  );
  const biblioteca = await upsertUser(
    'biblioteca@unior.edu.bo',
    'Biblioteca UNIOR',
    'DEPOSITANTE',
    depositorPassword
  );

  const fit = await upsertCommunity('Facultad de Ingeniería y Tecnología', null, 1);
  const ingSistemas = await upsertCommunity('Ingeniería de Sistemas', fit.id, 1);

  const postgrado = await upsertCommunity('Dirección de Postgrado', null, 2);

  // Asignar facultad/comunidad al revisor
  await prisma.userFaculty.upsert({
    where: { userId_communityId: { userId: reviewer.id, communityId: postgrado.id } },
    update: {},
    create: { userId: reviewer.id, communityId: postgrado.id },
  });

  await upsertCollection('Tesis de Grado', postgrado.id, 1);
  await upsertCollection('Proyectos de Grado', postgrado.id, 2);
  await upsertCollection('Trabajos de Diplomado', postgrado.id, 3);

  // Colección de ejemplo en subcomunidad
  await upsertCollection('Trabajos de Titulación', ingSistemas.id, 1);

  const carreras = await upsertCommunity('Carreras de Grado', null, 3);
  await upsertCollection('Ingeniería de Sistemas', carreras.id, 1);
  await upsertCollection('Administración de Empresas', carreras.id, 2);
  await upsertCollection('Gastronomía', carreras.id, 3);
  await upsertCollection('Turismo y Hotelería', carreras.id, 4);
  await upsertCollection('Auditoría', carreras.id, 5);
  await upsertCollection('Derecho', carreras.id, 6);

  type SeedStatus = 'BORRADOR' | 'EN_REVISION' | 'PUBLICADO' | 'EMBARGADO';

  const seedItem = async (
    status: SeedStatus,
    title: string,
    options: {
      author?: string;
      advisor?: string;
      year?: string;
      abstract?: string;
      keywords?: string[];
      type?: string;
      collection?: string;
      submittedAt?: Date;
      publishedAt?: Date;
      embargoDate?: Date;
      viewCount?: number;
    } = {},
  ) => {
    const existing = await prisma.item.findFirst({
      where: { metadata: { some: { element: 'title', value: title } } },
    });
    if (existing) return existing;
    const collection = await prisma.collection.findFirst({
      where: { name: options.collection ?? 'Tesis de Grado' },
    });
    if (!collection) return null;
    const keywords = options.keywords ?? ['repositorio institucional', 'gestión documental'];
    return prisma.item.create({
      data: {
        creatorId: biblioteca.id,
        collectionId: collection.id,
        status,
        submittedAt: options.submittedAt ?? (status === 'BORRADOR' ? null : new Date()),
        publishedAt:
          options.publishedAt ?? (status === 'PUBLICADO' || status === 'EMBARGADO' ? new Date() : null),
        embargoDate: options.embargoDate ?? null,
        viewCount: options.viewCount ?? 0,
        metadata: {
          create: [
            { schema: 'dc', element: 'title', value: title, place: 0 },
            {
              schema: 'dc',
              element: 'contributor',
              qualifier: 'author',
              value: options.author ?? 'Ana Pérez Mamani',
              place: 0,
            },
            ...(options.advisor
              ? [{ schema: 'dc', element: 'contributor', qualifier: 'advisor', value: options.advisor, place: 0 }]
              : []),
            { schema: 'dc', element: 'date', qualifier: 'issued', value: options.year ?? '2026', place: 0 },
            {
              schema: 'dc',
              element: 'description',
              qualifier: 'abstract',
              value: options.abstract ?? 'Estudio de caso sobre la gestión documental universitaria.',
              place: 0,
            },
            ...keywords.map((keyword, index) => ({ schema: 'dc', element: 'subject', value: keyword, place: index })),
            { schema: 'dc', element: 'type', value: options.type ?? 'Tesis de Grado', place: 0 },
            { schema: 'dc', element: 'rights', value: 'Uso académico', place: 0 },
          ],
        },
      },
    });
  };

  await seedItem('BORRADOR', 'Diseño de un repositorio institucional');
  await seedItem('EN_REVISION', 'Evaluación de metadatos Dublin Core', {
    author: 'Ana Pérez Mamani',
    advisor: 'Dr. Carlos Vargas',
  });

  const daysAgo = (value: number) => new Date(Date.now() - value * 24 * 60 * 60 * 1000);

  await seedItem('PUBLICADO', 'Sistema de riego automatizado con IoT para comunidades andinas', {
    author: 'Luis Quispe Flores',
    advisor: 'Ing. Marco Silva',
    year: '2026',
    type: 'Tesis de Grado',
    collection: 'Trabajos de Titulación',
    abstract:
      'Diseño e implementación de un sistema de riego automatizado con sensores IoT para optimizar el uso del agua en comunidades andinas de Oruro.',
    keywords: ['IoT', 'riego automatizado', 'comunidades andinas'],
    submittedAt: daysAgo(90),
    publishedAt: daysAgo(5),
    viewCount: 128,
  });
  await seedItem('PUBLICADO', 'Diagnóstico de la calidad del servicio de agua potable en Oruro', {
    author: 'María Choque Vargas',
    advisor: 'PhD. Elena Morales',
    year: '2025',
    type: 'Tesis de Grado',
    collection: 'Tesis de Grado',
    abstract:
      'Evaluación de la calidad del servicio de agua potable en diferentes zonas de la ciudad de Oruro y su impacto en la salud pública.',
    keywords: ['agua potable', 'calidad del servicio', 'Oruro'],
    submittedAt: daysAgo(120),
    publishedAt: daysAgo(35),
    viewCount: 96,
  });
  await seedItem('PUBLICADO', 'Propuesta de modelo de gestión documental para la Universidad Privada de Oruro', {
    author: 'Jorge Flores Tola',
    advisor: 'Mg. Rosa Lima',
    year: '2025',
    type: 'Proyecto de Grado',
    collection: 'Proyectos de Grado',
    abstract:
      'Propuesta de un modelo de gestión documental basado en normas ISO para mejorar los flujos de información administrativa universitaria.',
    keywords: ['gestión documental', 'ISO 15489', 'universidad'],
    submittedAt: daysAgo(200),
    publishedAt: daysAgo(80),
    viewCount: 74,
  });
  await seedItem('PUBLICADO', 'Estrategias de marketing digital para pymes de Oruro', {
    author: 'Carla Mendizábal Peñaloza',
    advisor: 'Lic. Pablo Rojas',
    year: '2024',
    type: 'Proyecto de Grado',
    collection: 'Proyectos de Grado',
    abstract:
      'Identificación de estrategias de marketing digital aplicables a pequeñas y medianas empresas comerciales de la ciudad de Oruro.',
    keywords: ['marketing digital', 'pymes', 'desarrollo comercial'],
    submittedAt: daysAgo(280),
    publishedAt: daysAgo(150),
    viewCount: 61,
  });
  await seedItem('PUBLICADO', 'Evaluación de metadatos Dublin Core en repositorios institucionales', {
    author: 'Ana Pérez Mamani',
    advisor: 'Dr. Carlos Vargas',
    year: '2025',
    type: 'Trabajo de Diplomado',
    collection: 'Trabajos de Diplomado',
    abstract:
      'Comparación del uso de metadatos Dublin Core en repositorios institucionales universitarios y su efecto en la recuperación de documentos.',
    keywords: ['Dublin Core', 'metadatos', 'recuperación de información'],
    submittedAt: daysAgo(300),
    publishedAt: daysAgo(220),
    viewCount: 45,
  });
  await seedItem('PUBLICADO', 'Metodologías ágiles aplicadas a proyectos de software universitarios', {
    author: 'Diego Huanca Morales',
    advisor: 'Ing. Marco Silva',
    year: '2024',
    type: 'Trabajo de Diplomado',
    collection: 'Trabajos de Diplomado',
    abstract:
      'Aplicación de metodologías ágiles en el desarrollo de proyectos de software gestionados por equipos universitarios.',
    keywords: ['metodologías ágiles', 'desarrollo de software', 'equipos universitarios'],
    submittedAt: daysAgo(420),
    publishedAt: daysAgo(320),
    viewCount: 38,
  });
  await seedItem('EMBARGADO', 'Diagnóstico socioeconómico de productores de quinua del Altiplano', {
    author: 'Rosa Quispe Condori',
    advisor: 'PhD. Elena Morales',
    year: '2026',
    type: 'Tesis de Grado',
    collection: 'Tesis de Grado',
    abstract:
      'Diagnóstico socioeconómico de productores de quinua del Altiplano con datos primarios y recomendaciones de política pública.',
    keywords: ['quinua', 'Altiplano', 'desarrollo rural'],
    submittedAt: daysAgo(60),
    publishedAt: daysAgo(10),
    embargoDate: new Date('2027-06-01'),
    viewCount: 22,
  });

  const enRevision = await prisma.item.findFirst({
    where: { status: 'EN_REVISION', metadata: { some: { element: 'title', value: 'Evaluación de metadatos Dublin Core' } } },
  });
  if (enRevision) {
    await prisma.item.update({ where: { id: enRevision.id }, data: { assignedReviewerId: reviewer.id } });
  }

  console.log('Seed completed:', {
    admin: admin.email,
    reviewer: reviewer.email,
    communities: ['Facultad de Ingeniería y Tecnología', 'Ingeniería de Sistemas', 'Dirección de Postgrado'],
  });
}

main()
  .catch((e) => {
    console.error('Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
