/**
 * ShopSphere Enterprise Platform - feat(admin): Content management banner scheduler for homepage promotions
 * Module: BannerSchedulerService (PR #78)
 */

export interface IBannerSchedulerServiceConfig {
  readonly moduleId: string;
  readonly version: string;
  readonly enabled: boolean;
  readonly timestamp: number;
}

export class BannerSchedulerService {
  private readonly config: IBannerSchedulerServiceConfig;

  constructor(options?: Partial<IBannerSchedulerServiceConfig>) {
    this.config = {
      moduleId: options?.moduleId ?? 'mod-078',
      version: options?.version ?? '2.1.0',
      enabled: options?.enabled ?? true,
      timestamp: Date.now(),
    };
  }

  public execute(): boolean {
    return this.config.enabled;
  }

  public getConfig(): Readonly<IBannerSchedulerServiceConfig> {
    return this.config;
  }
}
