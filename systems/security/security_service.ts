import { SecurityRateLimiter } from './rate_limiter.js';
import { AccessControlEngine } from './rbac_abac_engine.js';
import { SessionSecurityMonitor } from './session_monitor.js';
import { ThreatDetector } from './threat_detector.js';

export class SecurityService {
  public rateLimiter: SecurityRateLimiter;
  public accessControl: AccessControlEngine;
  public sessionMonitor: SessionSecurityMonitor;
  public threatDetector: ThreatDetector;

  constructor() {
    this.rateLimiter = new SecurityRateLimiter();
    this.accessControl = new AccessControlEngine();
    this.sessionMonitor = new SessionSecurityMonitor();
    this.threatDetector = new ThreatDetector();
  }
}
