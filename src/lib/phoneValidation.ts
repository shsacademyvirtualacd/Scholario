/**
 * Pakistani Mobile Number Validation Utilities
 * 
 * Rules:
 * - Country code must be +92
 * - Followed by exactly 10 digits
 * - Digits after +92 must start with 3 (matching standard 03XX-XXXXXXX with leading 0 dropped)
 * - Example of a valid number: +92 3058969050
 */

export const PAKISTANI_PHONE_ERROR =
  'Enter a valid Pakistani mobile number in the format +92 3XXXXXXXXX (10 digits after +92)';

export interface PhoneValidationResult {
  isValid: boolean;
  error: string | null;
  normalized: string;
  suggestedFix?: string;
  digitsCount: number;
}

/**
 * Validates whether a phone number string conforms to the Pakistani mobile format:
 * +92 followed by exactly 10 digits, starting with 3.
 * 
 * Tolerates spaces, hyphens, and parentheses during typing, but validates the exact structure.
 */
export function validatePakistaniPhoneNumber(
  input: string | null | undefined,
  isRequired: boolean = true
): PhoneValidationResult {
  const trimmed = (input || '').trim();

  // If empty
  if (!trimmed) {
    return {
      isValid: !isRequired,
      error: isRequired ? 'Phone number is required.' : null,
      normalized: '',
      digitsCount: 0,
    };
  }

  // Strip spaces, dashes, parentheses
  const cleaned = trimmed.replace(/[\s\-()]/g, '');

  // Detect local 03XX format or raw 3XX format to offer a one-click suggestion
  let suggestedFix: string | undefined;
  if (/^03\d{9}$/.test(cleaned)) {
    suggestedFix = `+92 ${cleaned.slice(1)}`;
  } else if (/^3\d{9}$/.test(cleaned)) {
    suggestedFix = `+92 ${cleaned}`;
  }

  // 1. Must start with +92
  if (!cleaned.startsWith('+92')) {
    return {
      isValid: false,
      error: PAKISTANI_PHONE_ERROR,
      normalized: cleaned,
      suggestedFix,
      digitsCount: cleaned.replace(/\D/g, '').length,
    };
  }

  // Extract everything after +92
  const afterCode = cleaned.slice(3);

  // 2. Must only contain digits after +92
  if (!/^\d+$/.test(afterCode)) {
    return {
      isValid: false,
      error: PAKISTANI_PHONE_ERROR,
      normalized: cleaned,
      suggestedFix,
      digitsCount: afterCode.replace(/\D/g, '').length,
    };
  }

  // 3. Must start with 3
  if (!afterCode.startsWith('3')) {
    return {
      isValid: false,
      error: PAKISTANI_PHONE_ERROR,
      normalized: cleaned,
      suggestedFix,
      digitsCount: afterCode.length,
    };
  }

  // 4. Must be exactly 10 digits
  if (afterCode.length !== 10) {
    return {
      isValid: false,
      error: PAKISTANI_PHONE_ERROR,
      normalized: cleaned,
      suggestedFix,
      digitsCount: afterCode.length,
    };
  }

  // Valid! Normalized format: +92 3XXXXXXXXX
  return {
    isValid: true,
    error: null,
    normalized: `+92 ${afterCode}`,
    digitsCount: 10,
  };
}

/**
 * Normalizes a valid phone number into standard storage format (+92 3XXXXXXXXX)
 */
export function normalizePakistaniPhoneNumber(input: string): string {
  const res = validatePakistaniPhoneNumber(input, false);
  return res.isValid ? res.normalized : input.trim();
}
