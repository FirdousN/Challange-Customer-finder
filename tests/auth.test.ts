import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/auth/password';

describe('Password Hashing', () => {
  it('should hash a password and verify it correctly', async () => {
    const plaintext = 'SuperSecret123!';
    const hash = await hashPassword(plaintext);
    
    expect(hash).not.toBe(plaintext);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')).toBe(true);

    const isMatch = await verifyPassword(plaintext, hash);
    expect(isMatch).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const plaintext = 'SuperSecret123!';
    const hash = await hashPassword(plaintext);
    
    const isMatch = await verifyPassword('WrongPassword', hash);
    expect(isMatch).toBe(false);
  });

  it('should reject short passwords during hash', async () => {
    await expect(hashPassword('short')).rejects.toThrow('Password must be at least 8 characters long');
  });
});
