/**
 * Normalizes an Instagram username by trimming whitespace,
 * converting to lowercase, and removing leading '@' characters.
 * Validates against allowed Instagram username characters.
 * 
 * @param username The raw username to normalize
 * @returns The normalized username
 * @throws Error if the username is invalid
 */
export function normalizeInstagramUsername(username: string): string {
  if (!username || typeof username !== 'string') {
    throw new Error('Invalid username provided');
  }

  let normalized = username.trim().toLowerCase();

  // Strip leading '@'
  if (normalized.startsWith('@')) {
    normalized = normalized.substring(1);
  }

  if (normalized.length === 0) {
    throw new Error('Username cannot be empty');
  }

  if (normalized.length > 30) {
    throw new Error('Username exceeds maximum allowed length');
  }

  // Instagram username rules: letters, numbers, periods, and underscores.
  if (!/^[a-z0-9._]+$/.test(normalized)) {
    throw new Error('Username contains invalid characters');
  }

  return normalized;
}

/**
 * Generates the permanent database identity key for an Instagram user.
 * 
 * @param username The raw username to generate an identity for
 * @returns The canonical identity string (e.g. 'instagram:username')
 */
export function getInstagramIdentityKey(username: string): string {
  const normalized = normalizeInstagramUsername(username);
  return `instagram:${normalized}`;
}
