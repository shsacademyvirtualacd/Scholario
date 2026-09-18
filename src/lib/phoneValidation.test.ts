import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePakistaniPhoneNumber,
  normalizePakistaniPhoneNumber,
  PAKISTANI_PHONE_ERROR,
} from './phoneValidation';

describe('validatePakistaniPhoneNumber', () => {
  describe('empty / null / undefined inputs', () => {
    it('should return invalid with required error when input is null and isRequired is true', () => {
      const result = validatePakistaniPhoneNumber(null, true);
      assert.deepEqual(result, {
        isValid: false,
        error: 'Phone number is required.',
        normalized: '',
        digitsCount: 0,
      });
    });

    it('should return invalid with required error when input is undefined and isRequired is default (true)', () => {
      const result = validatePakistaniPhoneNumber(undefined);
      assert.deepEqual(result, {
        isValid: false,
        error: 'Phone number is required.',
        normalized: '',
        digitsCount: 0,
      });
    });

    it('should return invalid when input is whitespace string and isRequired is true', () => {
      const result = validatePakistaniPhoneNumber('   ', true);
      assert.deepEqual(result, {
        isValid: false,
        error: 'Phone number is required.',
        normalized: '',
        digitsCount: 0,
      });
    });

    it('should return valid with no error when input is empty and isRequired is false', () => {
      const resultNull = validatePakistaniPhoneNumber(null, false);
      assert.deepEqual(resultNull, {
        isValid: true,
        error: null,
        normalized: '',
        digitsCount: 0,
      });

      const resultEmptyStr = validatePakistaniPhoneNumber('', false);
      assert.deepEqual(resultEmptyStr, {
        isValid: true,
        error: null,
        normalized: '',
        digitsCount: 0,
      });
    });
  });

  describe('valid Pakistani phone numbers', () => {
    it('should validate standard +92 3XXXXXXXXX format with space', () => {
      const result = validatePakistaniPhoneNumber('+92 3058969050');
      assert.deepEqual(result, {
        isValid: true,
        error: null,
        normalized: '+92 3058969050',
        digitsCount: 10,
      });
    });

    it('should validate +923XXXXXXXXX format without spaces', () => {
      const result = validatePakistaniPhoneNumber('+923058969050');
      assert.deepEqual(result, {
        isValid: true,
        error: null,
        normalized: '+92 3058969050',
        digitsCount: 10,
      });
    });

    it('should validate numbers containing hyphens, spaces, and parentheses', () => {
      const result = validatePakistaniPhoneNumber('+92 (305) 896-9050');
      assert.deepEqual(result, {
        isValid: true,
        error: null,
        normalized: '+92 3058969050',
        digitsCount: 10,
      });
    });
  });

  describe('suggested fix for common local inputs', () => {
    it('should suggest fix for local 03XX format', () => {
      const result = validatePakistaniPhoneNumber('03058969050');
      assert.deepEqual(result, {
        isValid: false,
        error: PAKISTANI_PHONE_ERROR,
        normalized: '03058969050',
        suggestedFix: '+92 3058969050',
        digitsCount: 11,
      });
    });

    it('should suggest fix for raw 3XX format (missing +92)', () => {
      const result = validatePakistaniPhoneNumber('3058969050');
      assert.deepEqual(result, {
        isValid: false,
        error: PAKISTANI_PHONE_ERROR,
        normalized: '3058969050',
        suggestedFix: '+92 3058969050',
        digitsCount: 10,
      });
    });

    it('should suggest fix for 03XX format containing formatting characters', () => {
      const result = validatePakistaniPhoneNumber('0305-8969050');
      assert.deepEqual(result, {
        isValid: false,
        error: PAKISTANI_PHONE_ERROR,
        normalized: '03058969050',
        suggestedFix: '+92 3058969050',
        digitsCount: 11,
      });
    });
  });

  describe('invalid phone number formats', () => {
    it('should fail when country code is missing or incorrect', () => {
      const result = validatePakistaniPhoneNumber('+13058969050');
      assert.deepEqual(result, {
        isValid: false,
        error: PAKISTANI_PHONE_ERROR,
        normalized: '+13058969050',
        suggestedFix: undefined,
        digitsCount: 11,
      });
    });

    it('should fail when number after +92 contains non-digits', () => {
      const result = validatePakistaniPhoneNumber('+92305896905a');
      assert.deepEqual(result, {
        isValid: false,
        error: PAKISTANI_PHONE_ERROR,
        normalized: '+92305896905a',
        suggestedFix: undefined,
        digitsCount: 9, // '305896905' digits count
      });
    });

    it('should fail when digits after +92 do not start with 3', () => {
      const result = validatePakistaniPhoneNumber('+92 4058969050');
      assert.deepEqual(result, {
        isValid: false,
        error: PAKISTANI_PHONE_ERROR,
        normalized: '+924058969050',
        suggestedFix: undefined,
        digitsCount: 10,
      });
    });

    it('should fail when digits after +92 are less than 10 digits', () => {
      const result = validatePakistaniPhoneNumber('+9230589690');
      assert.deepEqual(result, {
        isValid: false,
        error: PAKISTANI_PHONE_ERROR,
        normalized: '+9230589690',
        suggestedFix: undefined,
        digitsCount: 8, // '30589690' is 8 digits
      });
    });

    it('should fail when digits after +92 are more than 10 digits', () => {
      const result = validatePakistaniPhoneNumber('+9230589690500');
      assert.deepEqual(result, {
        isValid: false,
        error: PAKISTANI_PHONE_ERROR,
        normalized: '+9230589690500',
        suggestedFix: undefined,
        digitsCount: 11,
      });
    });
  });
});

describe('normalizePakistaniPhoneNumber', () => {
  it('should return normalized format +92 3XXXXXXXXX for valid input', () => {
    assert.strictEqual(
      normalizePakistaniPhoneNumber('+923058969050'),
      '+92 3058969050'
    );
    assert.strictEqual(
      normalizePakistaniPhoneNumber('+92 (305) 896-9050'),
      '+92 3058969050'
    );
  });

  it('should return trimmed raw input for invalid input', () => {
    assert.strictEqual(
      normalizePakistaniPhoneNumber('03058969050'),
      '03058969050'
    );
    assert.strictEqual(
      normalizePakistaniPhoneNumber('  invalid-number  '),
      'invalid-number'
    );
  });
});
