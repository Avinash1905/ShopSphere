import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const MLRecommendationsSeeder: Seeder = {
  name: 'MLRecommendationsSeeder',
  order: 19,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    let count = 0;
    const now = new Date().toISOString();

    // 1. Seed Product Embeddings (8-dimensional sample vectors)
    const productEmbeddings = [
      { id: 'emb_laptop_01', varId: 'var-laptop-001', vec: [0.82, 0.15, -0.44, 0.73, -0.12, 0.91, 0.33, -0.28] },
      { id: 'emb_laptop_02', varId: 'var-laptop-002', vec: [0.79, 0.18, -0.40, 0.69, -0.09, 0.88, 0.31, -0.25] },
      { id: 'emb_phone_01', varId: 'var-phone-001', vec: [0.12, 0.88, 0.65, -0.32, 0.44, 0.15, -0.71, 0.52] },
      { id: 'emb_audio_01', varId: 'var-audio-001', vec: [0.25, 0.72, 0.51, -0.18, 0.38, 0.22, -0.60, 0.45] },
    ];

    for (const pe of productEmbeddings) {
      await db.execute(
        `INSERT INTO ml_product_embeddings (
          id, variant_id, model_name, dimensions,
          embedding_vector_json, created_at, updated_at
        ) VALUES ('${pe.id}', '${pe.varId}', 'embedding-ecommerce-v2', ${pe.vec.length}, '${JSON.stringify(pe.vec)}', '${now}', '${now}')`
      );
      count++;
    }

    // 2. Seed User Taste Profiles
    const tasteProfiles = [
      {
        id: 'taste_user_01',
        userId: 'user_buyer_01',
        vec: [0.80, 0.20, -0.42, 0.70, -0.10, 0.89, 0.30, -0.26],
        cats: ['cat_electronics', 'cat_computers'],
      },
      {
        id: 'taste_user_02',
        userId: 'user_buyer_02',
        vec: [0.15, 0.85, 0.60, -0.28, 0.40, 0.18, -0.68, 0.50],
        cats: ['cat_smartphones', 'cat_audio'],
      },
    ];

    for (const tp of tasteProfiles) {
      await db.execute(
        `INSERT INTO ml_user_taste_profiles (
          id, user_id, affinity_vector_json, top_categories_json,
          engagement_decay_factor, last_interaction_at, created_at, updated_at
        ) VALUES ('${tp.id}', '${tp.userId}', '${JSON.stringify(tp.vec)}', '${JSON.stringify(tp.cats)}', 0.95, '${now}', '${now}', '${now}')`
      );
      count++;
    }

    // 3. Seed ML Recommendation Campaign & Bandit Arms
    const campaignId = 'camp_home_recs_01';
    await db.execute(
      `INSERT INTO ml_recommendation_campaigns (
        id, campaign_name, algorithm_type, traffic_split_percentage,
        is_active, created_at, updated_at
      ) VALUES ('${campaignId}', 'Homepage Personalized Dynamic Feed', 'THOMPSON_SAMPLING', 100.0, TRUE, '${now}', '${now}')`
    );
    count++;

    const banditArms = [
      { id: 'arm_01', key: 'var-laptop-001', alpha: 45, beta: 155, imps: 200, convs: 45, rew: 45000.0 },
      { id: 'arm_02', key: 'var-phone-001', alpha: 70, beta: 230, imps: 300, convs: 70, rew: 56000.0 },
      { id: 'arm_03', key: 'var-audio-001', alpha: 30, beta: 170, imps: 200, convs: 30, rew: 15000.0 },
    ];

    for (const a of banditArms) {
      await db.execute(
        `INSERT INTO ml_bandit_arms (
          id, campaign_id, arm_key, alpha_successes, beta_failures,
          total_impressions, total_conversions, cumulative_reward_usd, updated_at
        ) VALUES ('${a.id}', '${campaignId}', '${a.key}', ${a.alpha}, ${a.beta}, ${a.imps}, ${a.convs}, ${a.rew}, '${now}')`
      );
      count++;
    }

    return { count, entityName: 'ml_recommendations_and_bandit_arms' };
  },
};
