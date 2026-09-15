import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import { MLBanditArmTable } from '../schema/ml_recommendations.schema.js';

export interface BanditArmSelection {
  selectedArmKey: string;
  sampledScore: number;
  expectedConversionRate: number;
  totalImpressions: number;
}

export class MultiArmedBanditRepository {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Samples a random value from a Beta(alpha, beta) distribution using standard gamma approximation
   */
  public static sampleBeta(alpha: number, beta: number): number {
    // Generate Gamma(alpha, 1) and Gamma(beta, 1) approximations
    const gammaAlpha = this.sampleGamma(alpha);
    const gammaBeta = this.sampleGamma(beta);
    if (gammaAlpha + gammaBeta === 0) return 0.5;
    return gammaAlpha / (gammaAlpha + gammaBeta);
  }

  private static sampleGamma(k: number): number {
    // Marsaglia and Tsang method for k >= 1
    if (k < 1) {
      return this.sampleGamma(k + 1) * Math.pow(Math.random(), 1 / k);
    }
    const d = k - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      let z = 0;
      let v = 0;
      do {
        z = (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.732; // Normal approx
        v = 1 + c * z;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();
      if (u < 1 - 0.0331 * z * z * z * z) {
        return d * v;
      }
      if (Math.log(u) < 0.5 * z * z + d * (1 - v + Math.log(v))) {
        return d * v;
      }
    }
  }

  /**
   * Selects best arm using Thompson Sampling across all registered arms in a campaign
   */
  public async selectArmThompsonSampling(campaignId: string): Promise<BanditArmSelection> {
    const arms = await this.db.query<MLBanditArmTable>(
      'SELECT * FROM ml_bandit_arms WHERE campaign_id = ?',
      [campaignId]
    );

    if (arms.length === 0) {
      throw new Error(`No arms found for bandit campaign '${campaignId}'.`);
    }

    let bestArm = arms[0];
    let highestSample = -1;

    for (const arm of arms) {
      const sample = MultiArmedBanditRepository.sampleBeta(arm.alpha_successes, arm.beta_failures);
      if (sample > highestSample) {
        highestSample = sample;
        bestArm = arm;
      }
    }

    const expRate = Math.round((bestArm.alpha_successes / (bestArm.alpha_successes + bestArm.beta_failures)) * 10000) / 10000;

    return {
      selectedArmKey: bestArm.arm_key,
      sampledScore: Math.round(highestSample * 10000) / 10000,
      expectedConversionRate: expRate,
      totalImpressions: bestArm.total_impressions,
    };
  }

  /**
   * Updates arm posterior after user feedback (impression or conversion)
   */
  public async recordFeedback(
    campaignId: string,
    armKey: string,
    isConversion: boolean,
    rewardUsd: number = 0
  ): Promise<void> {
    const rows = await this.db.query<MLBanditArmTable>(
      'SELECT * FROM ml_bandit_arms WHERE campaign_id = ? AND arm_key = ? LIMIT 1',
      [campaignId, armKey]
    );

    const now = new Date().toISOString();

    if (rows.length === 0) {
      const id = `arm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const alpha = isConversion ? 2 : 1;
      const beta = isConversion ? 1 : 2;
      await this.db.execute(
        `INSERT INTO ml_bandit_arms (
          id, campaign_id, arm_key, alpha_successes, beta_failures,
          total_impressions, total_conversions, cumulative_reward_usd, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [id, campaignId, armKey, alpha, beta, isConversion ? 1 : 0, rewardUsd, now]
      );
      return;
    }

    const arm = rows[0];
    const newAlpha = arm.alpha_successes + (isConversion ? 1 : 0);
    const newBeta = arm.beta_failures + (isConversion ? 0 : 1);
    const newImpressions = arm.total_impressions + 1;
    const newConversions = arm.total_conversions + (isConversion ? 1 : 0);
    const newReward = Math.round((arm.cumulative_reward_usd + rewardUsd) * 100) / 100;

    await this.db.execute(
      `UPDATE ml_bandit_arms SET
        alpha_successes = ?, beta_failures = ?, total_impressions = ?,
        total_conversions = ?, cumulative_reward_usd = ?, updated_at = ?
      WHERE id = ?`,
      [newAlpha, newBeta, newImpressions, newConversions, newReward, now, arm.id]
    );
  }
}
