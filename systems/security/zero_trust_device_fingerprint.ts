import crypto from 'crypto';

export interface DeviceSignals {
  userAgent: string;
  screenResolution: string; // e.g. '1920x1080'
  colorDepth: number;
  timezoneOffsetMinutes: number;
  language: string;
  platform: string;
  hardwareConcurrency: number;
  canvasHash?: string;
}

export interface StoredDeviceProfile {
  fingerprintHash: string;
  userId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  lastKnownIp: string;
  lastKnownCity?: string;
  trustScore: number; // 0 to 100
  isTrustedDevice: boolean;
}

export interface DeviceTrustEvaluation {
  fingerprintHash: string;
  isRecognizedDevice: boolean;
  trustScore: number;
  stepUpMfaRequired: boolean;
  riskFlags: string[];
}

export class ZeroTrustDeviceFingerprint {
  private devices: Map<string, StoredDeviceProfile> = new Map();

  /**
   * Generates a deterministic SHA-256 fingerprint hash from multi-signal entropy components
   */
  public static computeFingerprint(signals: DeviceSignals): string {
    const raw = [
      signals.userAgent,
      signals.screenResolution,
      signals.colorDepth,
      signals.timezoneOffsetMinutes,
      signals.language,
      signals.platform,
      signals.hardwareConcurrency,
      signals.canvasHash || 'default-canvas',
    ].join(':::');

    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Registers a trusted device for a user
   */
  public registerDevice(userId: string, signals: DeviceSignals, ip: string): StoredDeviceProfile {
    const hash = ZeroTrustDeviceFingerprint.computeFingerprint(signals);
    const key = `${userId}:${hash}`;

    const profile: StoredDeviceProfile = {
      fingerprintHash: hash,
      userId,
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      lastKnownIp: ip,
      trustScore: 85,
      isTrustedDevice: true,
    };

    this.devices.set(key, profile);
    return profile;
  }

  /**
   * Evaluates incoming request device trust and checks for session anomalies
   */
  public evaluateDevice(
    userId: string,
    signals: DeviceSignals,
    currentIp: string
  ): DeviceTrustEvaluation {
    const hash = ZeroTrustDeviceFingerprint.computeFingerprint(signals);
    const key = `${userId}:${hash}`;
    const stored = this.devices.get(key);

    const flags: string[] = [];
    let trustScore = 50;

    if (!stored) {
      flags.push('UNRECOGNIZED_NEW_DEVICE');
      trustScore = 30;
    } else {
      trustScore = stored.trustScore;
      // Check IP change
      if (stored.lastKnownIp !== currentIp) {
        flags.push('IP_ADDRESS_MUTATION');
        trustScore -= 20;
      }
    }

    const stepUpRequired = trustScore < 60 || flags.length > 0;

    return {
      fingerprintHash: hash,
      isRecognizedDevice: stored !== undefined,
      trustScore: Math.max(0, trustScore),
      stepUpMfaRequired: stepUpRequired,
      riskFlags: flags,
    };
  }
}
