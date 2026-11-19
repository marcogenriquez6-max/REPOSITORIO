import { describe, expect, it } from 'vitest';
import { BitstreamBundle } from '@prisma/client';
import { CHECK_DEFS, computeChecks, type ItemForChecks } from './checks';

const sha = 'a'.repeat(64);

const metadata: ItemForChecks['metadata'] = [
  { schema: 'dc', element: 'title', qualifier: null, value: 'Tesis de prueba' },
  { schema: 'dc', element: 'contributor', qualifier: 'author', value: 'Ana Pérez' },
  { schema: 'dc', element: 'contributor', qualifier: 'advisor', value: 'Dr. Vargas' },
  { schema: 'dc', element: 'date', qualifier: 'issued', value: '2026' },
  { schema: 'dc', element: 'description', qualifier: 'abstract', value: 'Resumen de la investigación' },
  { schema: 'dc', element: 'subject', qualifier: null, value: 'repositorio' },
  { schema: 'dc', element: 'type', qualifier: null, value: 'Tesis' },
  { schema: 'dc', element: 'rights', qualifier: null, value: 'Uso académico' },
];

const bitstreams: ItemForChecks['bitstreams'] = [
  { bundle: BitstreamBundle.ORIGINAL, isPrimary: true, mimeType: 'application/pdf', sha256Hash: sha },
];

const complete: ItemForChecks = {
  metadata,
  bitstreams,
  collection: { isActive: true, community: { isActive: true } },
};

describe('computeChecks', () => {
  it('marks every check as satisfied for a complete document', () => {
    const result = computeChecks(complete);
    for (const def of CHECK_DEFS) expect(result[def.key], def.key).toBe(true);
  });

  it('fails the PDF check when there is no primary original bitstream', () => {
    const result = computeChecks({ ...complete, bitstreams: [] });
    expect(result.archivo_pdf).toBe(false);
  });

  it('fails the PDF check for an invalid sha256 hash', () => {
    const result = computeChecks({
      ...complete,
      bitstreams: [{ bundle: BitstreamBundle.ORIGINAL, isPrimary: true, mimeType: 'application/pdf', sha256Hash: 'bad' }],
    });
    expect(result.archivo_pdf).toBe(false);
  });

  it('fails the year check for an invalid year', () => {
    const result = computeChecks({
      ...complete,
      metadata: metadata.map((m) => m.element === 'date' ? { ...m, value: '18xx' } : m),
    });
    expect(result['dc.date.issued']).toBe(false);
  });

  it('fails mandatory metadata check when dc.rights is missing', () => {
    const result = computeChecks({ ...complete, metadata: metadata.filter((m) => m.element !== 'rights') });
    expect(result.metadatos_obligatorios).toBe(false);
  });

  it('allows the advisor check to be optional', () => {
    const result = computeChecks({ ...complete, metadata: metadata.filter((m) => m.qualifier !== 'advisor') });
    expect(result['dc.contributor.advisor']).toBe(false);
    expect(result.metadatos_obligatorios).toBe(true);
  });
});
