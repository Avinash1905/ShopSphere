export interface RawSecurityEvent {
  eventId: string;
  source: 'AUTH_SERVICE' | 'AUDIT_LOG' | 'RATE_LIMITER' | 'DATABASE_GUARD' | 'API_GATEWAY';
  timestampMs: number;
  actorIp?: string;
  actorUserId?: string;
  action: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: Record<string, any>;
}

export interface IncidentForensicReport {
  incidentId: string;
  threatCategory: 'CREDENTIAL_STUFFING' | 'SQL_INJECTION' | 'PRIVILEGE_ESCALATION' | 'DATA_EXFILTRATION' | 'UNKNOWN';
  timelineStart: string;
  timelineEnd: string;
  totalEventsInvolved: number;
  involvedIps: string[];
  involvedUserIds: string[];
  estimatedBlastRadius: {
    affectedAccountsCount: number;
    compromisedEntitiesCount: number;
    potentialDataLeak: boolean;
  };
  chronologicalTimeline: Array<{
    timestamp: string;
    source: string;
    action: string;
    severity: string;
    narrative: string;
  }>;
}

export class ForensicTimelineReconstructor {
  /**
   * Correlates security telemetry events into a structured forensic investigation report
   */
  public static reconstruct(events: RawSecurityEvent[]): IncidentForensicReport {
    if (events.length === 0) {
      const now = new Date().toISOString();
      return {
        incidentId: `INC-${Date.now()}`,
        threatCategory: 'UNKNOWN',
        timelineStart: now,
        timelineEnd: now,
        totalEventsInvolved: 0,
        involvedIps: [],
        involvedUserIds: [],
        estimatedBlastRadius: {
          affectedAccountsCount: 0,
          compromisedEntitiesCount: 0,
          potentialDataLeak: false,
        },
        chronologicalTimeline: [],
      };
    }

    const sorted = [...events].sort((a, b) => a.timestampMs - b.timestampMs);
    const ips = new Set<string>();
    const users = new Set<string>();

    let hasSqlInject = false;
    let hasBruteForce = false;
    let hasPrivilegeEscalation = false;

    for (const e of sorted) {
      if (e.actorIp) ips.add(e.actorIp);
      if (e.actorUserId) users.add(e.actorUserId);

      if (/sql|injection|union|select/i.test(e.action)) hasSqlInject = true;
      if (/failed_login|throttle|rate_limit|ban/i.test(e.action)) hasBruteForce = true;
      if (/privilege|role_grant|admin_override/i.test(e.action)) hasPrivilegeEscalation = true;
    }

    let threat: IncidentForensicReport['threatCategory'] = 'UNKNOWN';
    if (hasSqlInject) threat = 'SQL_INJECTION';
    else if (hasPrivilegeEscalation) threat = 'PRIVILEGE_ESCALATION';
    else if (hasBruteForce) threat = 'CREDENTIAL_STUFFING';

    const timeline = sorted.map((e) => ({
      timestamp: new Date(e.timestampMs).toISOString(),
      source: e.source,
      action: e.action,
      severity: e.severity,
      narrative: `[${e.severity}] Event from ${e.source}: '${e.action}' executed by actor ${e.actorUserId || e.actorIp || 'ANONYMOUS'}`,
    }));

    return {
      incidentId: `INC-${Date.now()}`,
      threatCategory: threat,
      timelineStart: new Date(sorted[0].timestampMs).toISOString(),
      timelineEnd: new Date(sorted[sorted.length - 1].timestampMs).toISOString(),
      totalEventsInvolved: sorted.length,
      involvedIps: Array.from(ips),
      involvedUserIds: Array.from(users),
      estimatedBlastRadius: {
        affectedAccountsCount: users.size,
        compromisedEntitiesCount: sorted.length,
        potentialDataLeak: hasSqlInject || hasPrivilegeEscalation,
      },
      chronologicalTimeline: timeline,
    };
  }
}
