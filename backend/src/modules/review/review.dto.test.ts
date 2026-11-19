import { describe, expect, it } from 'vitest';
import { decisionSchema, observationSchema, checksSchema } from './review.dto';

describe('review DTO validation', () => {
  it('requires a justification for decisions', () => {
    expect(decisionSchema.safeParse({}).success).toBe(false);
    expect(decisionSchema.safeParse({ comment: 'Corregir título' }).success).toBe(true);
  });

  it('rejects malformed embargo dates', () => {
    expect(decisionSchema.safeParse({ comment: 'Aprobar', embargoDate: '2026-13-45' }).success).toBe(false);
  });

  it('rejects past embargo dates', () => {
    expect(decisionSchema.safeParse({ comment: 'Aprobar', embargoDate: '2020-01-01' }).success).toBe(false);
  });

  it('requires a description for observations', () => {
    expect(observationSchema.safeParse({ description: '' }).success).toBe(false);
    expect(observationSchema.safeParse({ description: 'Falta el resumen' }).success).toBe(true);
  });

  it('rejects unknown checks in the checklist payload', () => {
    expect(checksSchema.safeParse({ checks: [{ key: 'dc.title', passed: true }] }).success).toBe(true);
    expect(checksSchema.safeParse({ checks: [] }).success).toBe(false);
  });
});
