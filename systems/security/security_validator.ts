export interface PasswordStrengthResult {
  isStrong: boolean;
  score: number; // 0 to 4
  feedback: string[];
}

export class SecurityValidator {
  private static readonly COMMON_PASSWORDS = new Set([
    'password',
    'password123',
    '12345678',
    'qwerty1234',
    'admin123',
    'welcome1',
    'letmein123',
  ]);

  /**
   * Evaluates password complexity and strength against NIST guidelines
   */
  public static evaluatePasswordStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = [];
    let score = 0;

    if (!password || password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
      return { isStrong: false, score: 0, feedback };
    }

    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Include at least one uppercase letter');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('Include at least one lowercase letter');

    if (/[0-9]/.test(password)) score++;
    else feedback.push('Include at least one digit');

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('Include at least one special symbol');

    if (this.COMMON_PASSWORDS.has(password.toLowerCase())) {
      return { isStrong: false, score: 0, feedback: ['Password is too common and easily guessable'] };
    }

    return {
      isStrong: score >= 4,
      score: Math.min(4, score),
      feedback,
    };
  }

  public static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email.trim());
  }
}
