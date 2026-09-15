/**
 * Enterprise Password Hashing, Verification, and Policy Validation
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import bcrypt from 'bcryptjs';
import { PasswordPolicyConfig, defaultSecurityConfig, COMMON_PASSWORDS_DICTIONARY, LEET_SPEAK_MAPPINGS } from '../../config/security.config';

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0 to 4
  entropyBits: number;
  violations: string[];
  recommendations: string[];
}

export class PasswordUtils {
  /**
   * Hashes password using bcrypt with configurable salt rounds
   */
  public static async hashPassword(password: string, saltRounds = defaultSecurityConfig.password.saltRounds): Promise<string> {
    const salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(password, salt);
  }

  /**
   * Constant-time verification of password against bcrypt hash
   */
  public static async verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
    if (!plainPassword || !passwordHash) return false;
    try {
      return await bcrypt.compare(plainPassword, passwordHash);
    } catch {
      return false;
    }
  }

  /**
   * Evaluates comprehensive password strength against enterprise policies
   */
  public static evaluateStrength(
    password: string,
    options: {
      username?: string;
      email?: string;
      policy?: PasswordPolicyConfig;
    } = {}
  ): PasswordStrengthResult {
    const policy = options.policy || defaultSecurityConfig.password;
    const violations: string[] = [];
    const recommendations: string[] = [];

    if (!password || typeof password !== 'string') {
      return {
        isValid: false,
        score: 0,
        entropyBits: 0,
        violations: ['Password is required and cannot be empty.'],
        recommendations: ['Provide a non-empty password.'],
      };
    }

    // 1. Length checks
    if (password.length < policy.minLength) {
      violations.push(`Password must be at least ${policy.minLength} characters long.`);
      recommendations.push(`Increase password length to at least ${policy.minLength} characters.`);
    }

    if (password.length > policy.maxLength) {
      violations.push(`Password cannot exceed ${policy.maxLength} characters.`);
    }

    // 2. Character set checks
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    if (policy.requireUppercase && !hasUpper) {
      violations.push('Password must include at least one uppercase letter (A-Z).');
      recommendations.push('Add an uppercase letter.');
    }

    if (policy.requireLowercase && !hasLower) {
      violations.push('Password must include at least one lowercase letter (a-z).');
      recommendations.push('Add a lowercase letter.');
    }

    if (policy.requireNumbers && !hasNumber) {
      violations.push('Password must include at least one number (0-9).');
      recommendations.push('Add a numeric digit.');
    }

    if (policy.requireSymbols && !hasSymbol) {
      violations.push('Password must include at least one special character (!@#$%^&*...).');
      recommendations.push('Add a special character.');
    }

    // 3. Consecutive identical characters (e.g., 'aaa', '1111')
    let maxConsecutive = 1;
    let currentConsecutive = 1;
    for (let i = 1; i < password.length; i++) {
      if (password[i] === password[i - 1]) {
        currentConsecutive++;
        if (currentConsecutive > maxConsecutive) {
          maxConsecutive = currentConsecutive;
        }
      } else {
        currentConsecutive = 1;
      }
    }
    if (maxConsecutive > policy.maxConsecutiveIdenticalChars) {
      violations.push(`Password cannot contain more than ${policy.maxConsecutiveIdenticalChars} identical characters in a row.`);
    }

    // 4. Sequential characters (e.g., '1234', 'abcd')
    let sequentialCount = 1;
    for (let i = 1; i < password.length; i++) {
      const diff = password.charCodeAt(i) - password.charCodeAt(i - 1);
      if (diff === 1 || diff === -1) {
        sequentialCount++;
        if (sequentialCount > policy.maxSequentialChars) {
          violations.push(`Password contains sequential characters exceeding ${policy.maxSequentialChars} characters.`);
          break;
        }
      } else {
        sequentialCount = 1;
      }
    }

    // 5. Dictionary check and normalized leetspeak check
    const normalized = this.normalizeLeetSpeak(password.toLowerCase());
    const strippedLetters = password.toLowerCase().replace(/[^a-z]/g, '');
    const strippedNormalized = normalized.replace(/[^a-z]/g, '');

    if (policy.disallowCommonPasswords) {
      for (const common of COMMON_PASSWORDS_DICTIONARY) {
        if (
          password.toLowerCase() === common ||
          normalized === common ||
          strippedLetters === common ||
          strippedNormalized === common ||
          normalized.includes(common)
        ) {
          violations.push('Password is in the list of commonly compromised passwords.');
          recommendations.push('Choose a more unique passphrase.');
          break;
        }
      }
    }

    // 6. Username / Email similarity checks
    if (options.username && policy.disallowUsernameSimilarity) {
      const u = options.username.toLowerCase();
      if (u.length >= 3 && (password.toLowerCase().includes(u) || normalized.includes(u))) {
        violations.push('Password cannot contain your username.');
        recommendations.push('Remove personal identifiers from your password.');
      }
    }

    if (options.email && policy.disallowEmailSimilarity) {
      const emailPrefix = options.email.split('@')[0].toLowerCase();
      if (emailPrefix.length >= 3 && (password.toLowerCase().includes(emailPrefix) || normalized.includes(emailPrefix))) {
        violations.push('Password cannot contain your email username prefix.');
        recommendations.push('Remove parts of your email address from your password.');
      }
    }

    // 7. Calculate Entropy
    const entropyBits = this.calculateEntropy(password);
    if (entropyBits < policy.minEntropyBits) {
      violations.push(`Password entropy is too low (${Math.round(entropyBits)} bits). Minimum required is ${policy.minEntropyBits} bits.`);
    }

    // Calculate score (0-4)
    let score = 0;
    if (password.length >= 8) score++;
    if (hasUpper && hasLower) score++;
    if (hasNumber && hasSymbol) score++;
    if (password.length >= 12 && entropyBits >= 45) score++;

    return {
      isValid: violations.length === 0,
      score,
      entropyBits: Math.round(entropyBits),
      violations,
      recommendations,
    };
  }

  private static calculateEntropy(password: string): number {
    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^A-Za-z0-9]/.test(password)) poolSize += 32;

    if (poolSize === 0) return 0;
    return password.length * Math.log2(poolSize);
  }

  private static normalizeLeetSpeak(str: string): string {
    let result = str;
    for (const [char, leetVariants] of Object.entries(LEET_SPEAK_MAPPINGS)) {
      for (const variant of leetVariants) {
        result = result.split(variant).join(char);
      }
    }
    return result;
  }
}
