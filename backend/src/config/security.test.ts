import { describe, expect, it } from 'vitest';
import { assertStrongJwtSecret } from './security';

describe('assertStrongJwtSecret', () => {
  it('rejects missing, short and placeholder secrets', () => {
    expect(() => assertStrongJwtSecret('JWT_SECRET', undefined)).toThrow();
    expect(() => assertStrongJwtSecret('JWT_SECRET', 'short')).toThrow();
    expect(() => assertStrongJwtSecret('JWT_SECRET', 'dev_secret_change_me')).toThrow();
    expect(() => assertStrongJwtSecret('JWT_SECRET', 'change_this_to_a_long_random_secret')).toThrow();
    expect(() => assertStrongJwtSecret('JWT_SECRET', 'REPLACE_WITH_A_RANDOM_SECRET_VALUE')).toThrow();
  });

  it('accepts a sufficiently long random secret', () => {
    const secret = 'a1b2c3d4'.repeat(8);
    expect(assertStrongJwtSecret('JWT_SECRET', secret)).toBe(secret);
  });
});
