export interface UserSession {
  sessionId: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  latitude?: number;
  longitude?: number;
  lastActiveAt: number;
  createdAt: number;
  isRevoked: boolean;
}

export class SessionSecurityMonitor {
  private sessions: Map<string, UserSession> = new Map(); // sessionId -> session
  private userSessions: Map<string, Set<string>> = new Map(); // userId -> Set<sessionId>
  private maxConcurrentSessions: number = 5;

  public registerSession(session: Omit<UserSession, 'isRevoked'>): { isAnomaly: boolean; reason?: string } {
    const fullSession: UserSession = { ...session, isRevoked: false };
    this.sessions.set(session.sessionId, fullSession);

    let set = this.userSessions.get(session.userId);
    if (!set) {
      set = new Set();
      this.userSessions.set(session.userId, set);
    }
    set.add(session.sessionId);

    // Check concurrent session cap
    if (set.size > this.maxConcurrentSessions) {
      // Revoke oldest session
      const oldestId = Array.from(set)[0];
      this.revokeSession(oldestId);
    }

    // Geovelocity anomaly check
    return this.checkGeovelocityAnomaly(session.userId, session.ipAddress, session.latitude, session.longitude);
  }

  public validateSession(sessionId: string): boolean {
    const s = this.sessions.get(sessionId);
    if (!s || s.isRevoked) return false;
    s.lastActiveAt = Date.now();
    return true;
  }

  public revokeSession(sessionId: string): void {
    const s = this.sessions.get(sessionId);
    if (s) {
      s.isRevoked = true;
      const set = this.userSessions.get(s.userId);
      if (set) {
        set.delete(sessionId);
      }
    }
  }

  public revokeAllUserSessions(userId: string): void {
    const set = this.userSessions.get(userId);
    if (set) {
      for (const sId of set) {
        const s = this.sessions.get(sId);
        if (s) s.isRevoked = true;
      }
      set.clear();
    }
  }

  private checkGeovelocityAnomaly(
    userId: string,
    currentIp: string,
    currentLat?: number,
    currentLon?: number
  ): { isAnomaly: boolean; reason?: string } {
    if (currentLat === undefined || currentLon === undefined) return { isAnomaly: false };

    const set = this.userSessions.get(userId);
    if (!set) return { isAnomaly: false };

    for (const sId of set) {
      const priorSession = this.sessions.get(sId);
      if (priorSession && !priorSession.isRevoked && priorSession.latitude && priorSession.longitude) {
        const distanceKm = this.calculateHaversineDistance(
          priorSession.latitude,
          priorSession.longitude,
          currentLat,
          currentLon
        );
        const elapsedHours = (Date.now() - priorSession.lastActiveAt) / (1000 * 3600);

        if (elapsedHours > 0 && elapsedHours < 2 && distanceKm > 1000) {
          const speedKmh = distanceKm / elapsedHours;
          if (speedKmh > 900) {
            // Speed exceeds commercial passenger plane (impossible travel)
            return {
              isAnomaly: true,
              reason: `Impossible geovelocity travel detected: ${Math.round(distanceKm)}km in ${Math.round(elapsedHours * 60)}min (${Math.round(speedKmh)} km/h)`,
            };
          }
        }
      }
    }

    return { isAnomaly: false };
  }

  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
