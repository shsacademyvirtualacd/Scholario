/**
 * Helper to map raw Supabase Auth error codes and messages to friendly, user-facing text.
 */
export function mapAuthError(err: any): { message: string; isUnconfirmedEmail?: boolean; isRateLimited?: boolean } {
  if (!err) return { message: 'An unexpected authentication error occurred. Please try again.' };

  const rawMsg = (typeof err === 'string' ? err : err.message || err.error_description || '').toLowerCase();
  const rawCode = (err.code || err.error || '').toLowerCase();
  const rawStatus = err.status || 0;

  // 1. Email Not Confirmed
  if (
    rawCode === 'email_not_confirmed' ||
    rawMsg.includes('email not confirmed') ||
    rawMsg.includes('not confirmed') ||
    rawMsg.includes('confirm your email')
  ) {
    return {
      message: 'Please verify your email address before signing in. Check your inbox for the confirmation link.',
      isUnconfirmedEmail: true,
    };
  }

  // 2. Invalid Credentials / Password Incorrect
  if (
    rawCode === 'invalid_credentials' ||
    rawCode === 'invalid_grant' ||
    rawMsg.includes('invalid login credentials') ||
    rawMsg.includes('invalid credentials') ||
    rawMsg.includes('invalid username or password') ||
    rawMsg.includes('password') && (rawMsg.includes('wrong') || rawMsg.includes('incorrect') || rawMsg.includes('invalid'))
  ) {
    return {
      message: 'Invalid email or password. Please verify your credentials and try again.',
    };
  }

  // 3. User Already Registered / Duplicate
  if (
    rawCode === 'user_already_exists' ||
    rawCode === 'email_exists' ||
    rawMsg.includes('user already registered') ||
    rawMsg.includes('already exists') ||
    rawMsg.includes('already registered') ||
    rawMsg.includes('email address is already in use')
  ) {
    return {
      message: 'An account with this email address already exists. Please sign in instead.',
    };
  }

  // 4. Weak Password
  if (
    rawCode === 'weak_password' ||
    rawMsg.includes('weak password') ||
    rawMsg.includes('password should be at least') ||
    rawMsg.includes('password must be at least')
  ) {
    return {
      message: 'Password is too weak. Please use at least 8 characters with letters, numbers, and symbols.',
    };
  }

  // 5. Rate Limit Exceeded
  if (
    rawStatus === 429 ||
    rawCode === 'over_email_send_rate_limit' ||
    rawCode === 'over_request_rate_limit' ||
    rawMsg.includes('rate limit') ||
    rawMsg.includes('too many requests') ||
    rawMsg.includes('security purposes')
  ) {
    return {
      message: 'Too many attempts. For security purposes, please wait a minute before trying again.',
      isRateLimited: true,
    };
  }

  // 6. Network / Offline / Unreachable
  if (
    rawMsg.includes('network') ||
    rawMsg.includes('failed to fetch') ||
    rawMsg.includes('timeout') ||
    rawMsg.includes('offline') ||
    rawMsg.includes('connection refused')
  ) {
    return {
      message: 'Network connection issue. Please check your internet connection and try again.',
    };
  }

  // 7. Expired or Invalid Recovery Token / Link
  if (
    rawCode === 'otp_expired' ||
    rawMsg.includes('token has expired') ||
    rawMsg.includes('token is expired') ||
    rawMsg.includes('invalid token') ||
    rawMsg.includes('otp expired')
  ) {
    return {
      message: 'The verification or reset link has expired or has already been used. Please request a new one.',
    };
  }

  // Fallback generic friendly message
  return {
    message: 'Unable to complete your request. Please double-check your information and try again.',
  };
}

/**
 * Normalizes email: trims and converts to lower case.
 */
export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Validates password rules:
 * - At least 8 characters
 * - Has both letters and numbers
 */
export function evaluatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0 to 4
  feedback: string;
  label: string;
  color: string;
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
} {
  const p = password || '';
  const hasMinLength = p.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  const hasSymbol = /[^a-zA-Z0-9]/.test(p);

  let score = 0;
  if (hasMinLength) score++;
  if (hasLetter) score++;
  if (hasNumber) score++;
  if (hasSymbol) score++;

  let feedback = 'Weak';
  let color = '#ef4444'; // red-500

  if (score >= 4) {
    feedback = 'Very Strong';
    color = '#10b981'; // emerald-500
  } else if (score === 3) {
    feedback = 'Strong';
    color = '#22c55e'; // green-500
  } else if (score === 2) {
    feedback = 'Fair';
    color = '#f59e0b'; // amber-500
  } else if (score === 1) {
    feedback = 'Weak';
    color = '#ef4444'; // red-500
  }

  return {
    isValid: hasMinLength,
    score,
    feedback,
    label: feedback,
    color,
    hasMinLength,
    hasLetter,
    hasNumber,
    hasSymbol,
  };
}
