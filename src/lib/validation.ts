/**
 * Validates whether an email format is valid.
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  // A clean, robust regex for standard email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  feedback: string;
  isValid: boolean;
}

/**
 * Checks password strength and provides a score and specific feedback.
 * Secure passwords must be at least 8 characters long and contain varied characters.
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { score: 0, feedback: 'Password is required.', isValid: false };
  }

  let score = 0;
  const feedbackParts: string[] = [];

  // Rule 1: Length
  if (password.length >= 8) {
    score += 1;
  } else {
    feedbackParts.push('at least 8 characters');
  }

  // Rule 2: Contains numbers
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedbackParts.push('at least one number');
  }

  // Rule 3: Contains mixed case (upper & lowercase)
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedbackParts.push('mixed case (upper & lower)');
  }

  // Rule 4: Contains special character
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedbackParts.push('at least one special character');
  }

  const isValid = password.length >= 8; // Enterprise threshold: minimum 8 characters

  let feedback = 'Strong password!';
  if (!isValid) {
    feedback = `Weak: Needs ${feedbackParts.join(', ')}.`;
  } else if (score < 4) {
    feedback = `Moderate: Could improve by adding ${feedbackParts.join(', ')}.`;
  }

  return {
    score,
    feedback,
    isValid
  };
}
