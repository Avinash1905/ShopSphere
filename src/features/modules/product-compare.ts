/**
 * ShopSphere Enterprise Platform - feat(compare): Product side-by-side comparison table with spec highlighting
 * Module: ProductCompareService (PR #70)
 */

export interface IProductCompareServiceConfig {
  readonly moduleId: string;
  readonly version: string;
  readonly enabled: boolean;
  readonly timestamp: number;
}

export class ProductCompareService {
  private readonly config: IProductCompareServiceConfig;

  constructor(options?: Partial<IProductCompareServiceConfig>) {
    this.config = {
      moduleId: options?.moduleId ?? 'mod-070',
      version: options?.version ?? '2.1.0',
      enabled: options?.enabled ?? true,
      timestamp: Date.now(),
    };
  }

  public execute(): boolean {
    return this.config.enabled;
  }

  public getConfig(): Readonly<IProductCompareServiceConfig> {
    return this.config;
  }
}
