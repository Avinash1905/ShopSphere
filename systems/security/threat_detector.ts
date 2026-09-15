export interface ThreatAssessment {
  ipAddress: string;
  threatScore: number; // 0 to 100
  isBlocked: boolean;
  detectedThreats: string[];
}

export class ThreatDetector {
  private failedAttempts: Map<string, number> = new Map(); // IP/Target -> count
  private rapidRequests: Map<string, number[]> = new Map();

  public recordFailedAttempt(identifier: string): { totalFailed: number; shouldLockout: boolean } {
    const current = (this.failedAttempts.get(identifier) || 0) + 1;
    this.failedAttempts.set(identifier, current);

    return {
      totalFailed: current,
      shouldLockout: current >= 5,
    };
  }

  public recordSuccess(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }

  public assessThreat(ip: string, userAgent?: string, payload?: string): ThreatAssessment {
    let score = 0;
    const threats: string[] = [];

    // 1. Check failed login attempt count
    const failed = this.failedAttempts.get(ip) || 0;
    if (failed >= 10) {
      score += 60;
      threats.push(`High failed authentication attempts (${failed})`);
    } else if (failed >= 5) {
      score += 30;
      threats.push(`Repeated failed authentication attempts (${failed})`);
    }

    // 2. Suspicious user agent analysis
    if (!userAgent || userAgent.trim() === '') {
      score += 20;
      threats.push('Missing or empty User-Agent header');
    } else if (/sqlmap|nikto|curl|python-requests|nmap|gobuster|wpscan/i.test(userAgent)) {
      score += 70;
      threats.push(`Known automated vulnerability scanner User-Agent: ${userAgent}`);
    }

    // 3. Payload inspection for attack vectors
    if (payload) {
      if (/(union\s+select|select\s+.*\s+from|sleep\(\d+\)|benchmark\()/i.test(payload)) {
        score += 80;
        threats.push('SQL injection signature detected in payload');
      }
      if (/<script\b|javascript:|onerror\s*=|onload\s*=/i.test(payload)) {
        score += 60;
        threats.push('Cross-Site Scripting (XSS) signature detected in payload');
      }
      if (/(\.\.\/|\.\.\\)/.test(payload)) {
        score += 50;
        threats.push('Path traversal attempt detected in payload');
      }
    }

    return {
      ipAddress: ip,
      threatScore: Math.min(100, score),
      isBlocked: score >= 70,
      detectedThreats: threats,
    };
  }
}
