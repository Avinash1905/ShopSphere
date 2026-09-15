export class InputSanitizer {
  private static readonly HTML_ESCAPE_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  /**
   * Encodes HTML special characters to prevent XSS injection attacks
   */
  public static escapeHTML(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input.replace(/[&<>"'`=\/]/g, (char) => this.HTML_ESCAPE_MAP[char] || char);
  }

  /**
   * Strips dangerous executable script tags, event handlers, and iframe injections
   */
  public static sanitizeHTML(input: string): string {
    if (!input || typeof input !== 'string') return '';
    let clean = input;
    // Remove script tags and contents
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Remove iframe tags and contents
    clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    clean = clean.replace(/<embed\b[^>]*>/gi, '');
    clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
    // Remove inline javascript handlers (e.g. onclick=, onload=)
    clean = clean.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    clean = clean.replace(/on\w+\s*=\s*[^\s>]+/gi, '');
    // Remove javascript: URLs
    clean = clean.replace(/javascript\s*:\s*[^"'\s>]*/gi, '');
    // Remove data: text/html base64 payloads
    clean = clean.replace(/data\s*:\s*text\/html[^"'\s>]*/gi, '');
    return clean.trim();
  }

  /**
   * Sanitizes input to prevent Path Traversal attacks (../, ..\, null bytes)
   */
  public static sanitizeFilePath(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/\0/g, '') // Null byte injection
      .replace(/\.\.[\/\\]/g, '') // Path traversal ../ or ..\
      .replace(/[\/\\]\.\./g, '')
      .trim();
  }

  /**
   * Recursively sanitizes all string properties in a JSON payload
   */
  public static sanitizeObject<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      return this.sanitizeHTML(obj) as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized as T;
    }

    return obj;
  }
}
