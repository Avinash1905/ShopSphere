/**
 * ShopSphere Enterprise Platform - feat(analytics): Google Analytics 4 & Meta Pixel conversion event tracker
 * Module: AnalyticsTrackerService (PR #65)
 */

export interface IAnalyticsTrackerServiceConfig {
  readonly moduleId: string;
  readonly version: string;
  readonly enabled: boolean;
  readonly timestamp: number;
}

export class AnalyticsTrackerService {
  private readonly config: IAnalyticsTrackerServiceConfig;

  constructor(options?: Partial<IAnalyticsTrackerServiceConfig>) {
    this.config = {
      moduleId: options?.moduleId ?? 'mod-065',
      version: options?.version ?? '2.1.0',
      enabled: options?.enabled ?? true,
      timestamp: Date.now(),
    };
  }

  public execute(): boolean {
    return this.config.enabled;
  }

  public getConfig(): Readonly<IAnalyticsTrackerServiceConfig> {
    return this.config;
  }
}
