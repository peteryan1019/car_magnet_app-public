import { describe, it, expect } from 'vitest';
import { generateSalt, hashPassword } from './auth';

describe('Authentication Utilities', () => {
  describe('generateSalt', () => {
    it('should generate a 32-character hex salt', () => {
      const salt = generateSalt();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBe(32); // 16 bytes encoded as hex = 32 characters
    });

    it('should generate unique salts', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toBe(salt2);
    });
  });

  describe('hashPassword', () => {
    it('should consistently hash the same password and salt', () => {
      const password = 'mySecretPassword123';
      const salt = '5e884898da28047151d0e56f8dc62927';
      
      const hash1 = hashPassword(password, salt);
      const hash2 = hashPassword(password, salt);
      
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(128); // 64 bytes encoded as hex = 128 characters
    });

    it('should produce different hashes for the same password with different salts', () => {
      const password = 'mySecretPassword123';
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      
      const hash1 = hashPassword(password, salt1);
      const hash2 = hashPassword(password, salt2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for different passwords with the same salt', () => {
      const salt = generateSalt();
      
      const hash1 = hashPassword('passwordA', salt);
      const hash2 = hashPassword('passwordB', salt);
      
      expect(hash1).not.toBe(hash2);
    });
  });
});