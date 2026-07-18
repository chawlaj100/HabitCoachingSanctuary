import { describe, it, expect } from 'vitest';
import { validateEmail, checkPasswordStrength } from './validation';

describe('validateEmail', () => {
  it('returns true for valid standard emails', () => {
    expect(validateEmail('alex@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    expect(validateEmail('first123@sub.domain.org')).toBe(true);
  });

  it('returns false for invalid emails', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('plain_text')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('user@domain')).toBe(false);
    expect(validateEmail('user@domain.')).toBe(false);
    expect(validateEmail('user name@domain.com')).toBe(false);
  });
});

describe('checkPasswordStrength', () => {
  it('identifies weak passwords', () => {
    const result = checkPasswordStrength('short');
    expect(result.isValid).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback).toContain('at least 8 characters');
  });

  it('validates minimum enterprise length requirement of 8 characters', () => {
    const result = checkPasswordStrength('12345678');
    expect(result.isValid).toBe(true);
    expect(result.score).toBe(2); // Length + Numbers
    expect(result.feedback).toContain('Moderate');
  });

  it('rates fully varied secure passwords as strong', () => {
    const result = checkPasswordStrength('Secur3_Pa$$word');
    expect(result.isValid).toBe(true);
    expect(result.score).toBe(4);
    expect(result.feedback).toBe('Strong password!');
  });

  it('handles empty input gracefully', () => {
    const result = checkPasswordStrength('');
    expect(result.isValid).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback).toBe('Password is required.');
  });
});
