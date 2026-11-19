const INSECURE_SECRETS = new Set([
  'dev_secret_change_me',
  'dev_refresh_change_me',
  'change_this_to_a_long_random_secret',
  'change_this_to_another_long_random_secret',
]);

const PLACEHOLDER_PATTERN = /^(change|replace|example|dev[_-]?secret)/i;

export function assertStrongJwtSecret(name: string, value: string | undefined): string {
  const secret = value?.trim();
  if (!secret) throw new Error(`Missing required env var: ${name}`);
  if (secret.length < 32) throw new Error(`${name} must be at least 32 characters long`);
  if (INSECURE_SECRETS.has(secret) || PLACEHOLDER_PATTERN.test(secret)) {
    throw new Error(`${name} must not use an example or placeholder value`);
  }
  return secret;
}
