// unit.test.js — Tests for individual logic units (e.g. password validation, hashing)
const bcrypt = require('bcrypt');
const { describe, it, expect } = require('@jest/globals');

/**
 * Checks whether a password is considered strong.
 * Conditions: min 8 chars, includes uppercase, lowercase, number, and symbol.
 */
function isStrongPassword(password) {
  const minLength = 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return password.length >= minLength && hasUpper && hasLower && hasNumber && hasSymbol;
}

describe('Password strength validation', () => {
  it('should reject passwords that are too short', () => {
    expect(isStrongPassword('A1!b')).toBe(false);
  });

  it('should reject passwords with no symbols', () => {
    expect(isStrongPassword('Password1')).toBe(false);
  });

  it('should reject passwords missing uppercase letters', () => {
    expect(isStrongPassword('strong1!pass')).toBe(false);
  });

  it('should reject passwords missing numbers', () => {
    expect(isStrongPassword('Strong!Pass')).toBe(false);
  });

  it('should accept passwords that meet all criteria', () => {
    expect(isStrongPassword('Strong1!Pass')).toBe(true);
  });
});

describe('Bcrypt hashing logic', () => {
  it('should hash and verify a password correctly', async () => {
    const password = 'MyStrongPass1!';
    const hashed = await bcrypt.hash(password, 10);
    const match = await bcrypt.compare(password, hashed);
    expect(match).toBe(true);
  });

  it('should fail to match incorrect password', async () => {
    const password = 'MyStrongPass1!';
    const wrongPassword = 'Wrong1!Pass';
    const hashed = await bcrypt.hash(password, 10);
    const match = await bcrypt.compare(wrongPassword, hashed);
    expect(match).toBe(false);
  });
});


