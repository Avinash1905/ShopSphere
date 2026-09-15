export interface SecurityAlarmEvent {
  id: string;
  eventType: 'BRUTE_FORCE_LOCKOUT' | 'UNAUTHORIZED_ACCESS_ATTEMPT' | 'SUSPICIOUS_GEO_VELOCITY' | 'SQL_INJECTION_BLOCKED' | 'XSS_BLOCKED' | 'RATE_LIMIT_PENALTY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actorId?: string;
  ipAddress: string;
  details: Record<string, any>;
  timestamp: string;
}

export type SecurityAlarmHandler = (event: SecurityAlarmEvent) => Promise<void> | void;

export class SecurityEventDispatcher {
  private static handlers: SecurityAlarmHandler[] = [];
  private static eventHistory: SecurityAlarmEvent[] = [];

  public static subscribe(handler: SecurityAlarmHandler): void {
    this.handlers.push(handler);
  }

  public static async dispatch(event: Omit<SecurityAlarmEvent, 'id' | 'timestamp'>): Promise<SecurityAlarmEvent> {
    const fullEvent: SecurityAlarmEvent = {
      ...event,
      id: `sec-alarm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };

    this.eventHistory.push(fullEvent);
    if (this.eventHistory.length > 1000) {
      this.eventHistory.shift();
    }

    console.warn(`[SECURITY ALARM] [${fullEvent.severity}] ${fullEvent.eventType} from IP ${fullEvent.ipAddress}`);

    for (const h of this.handlers) {
      try {
        await h(fullEvent);
      } catch (err) {
        console.error('[SecurityEventDispatcher] Error in alarm handler:', err);
      }
    }

    return fullEvent;
  }

  public static getRecentAlarms(limit: number = 20): SecurityAlarmEvent[] {
    return this.eventHistory.slice(-limit);
  }
}
