import { MigrationStep, MigrationDatabaseAdapter } from './runner.js';

export const Migration024CreateMLRecommendationsTables: MigrationStep = {
  name: '024_create_ml_recommendations_tables',
  version: '20260915000024',
  description: 'Create ML product embeddings, taste profiles, recommendation campaigns, and bandit arms',

  async up(db: MigrationDatabaseAdapter): Promise<void> {
    // 1. ml_product_embeddings
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ml_product_embeddings (
        id VARCHAR(36) PRIMARY KEY,
        variant_id VARCHAR(36) NOT NULL,
        model_name VARCHAR(64) NOT NULL,
        dimensions INT NOT NULL DEFAULT 64,
        embedding_vector_json TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. ml_user_taste_profiles
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ml_user_taste_profiles (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL UNIQUE,
        affinity_vector_json TEXT NOT NULL,
        top_categories_json TEXT NOT NULL,
        engagement_decay_factor DECIMAL(5, 4) NOT NULL DEFAULT 0.9500,
        last_interaction_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. ml_recommendation_campaigns
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ml_recommendation_campaigns (
        id VARCHAR(36) PRIMARY KEY,
        campaign_name VARCHAR(128) NOT NULL,
        algorithm_type VARCHAR(64) NOT NULL DEFAULT 'HYBRID_ENSEMBLE',
        traffic_split_percentage DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. ml_bandit_arms
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ml_bandit_arms (
        id VARCHAR(36) PRIMARY KEY,
        campaign_id VARCHAR(36) NOT NULL,
        arm_key VARCHAR(64) NOT NULL,
        alpha_successes INT NOT NULL DEFAULT 1,
        beta_failures INT NOT NULL DEFAULT 1,
        total_impressions INT NOT NULL DEFAULT 0,
        total_conversions INT NOT NULL DEFAULT 0,
        cumulative_reward_usd DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  async down(db: MigrationDatabaseAdapter): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS ml_bandit_arms');
    await db.execute('DROP TABLE IF EXISTS ml_recommendation_campaigns');
    await db.execute('DROP TABLE IF EXISTS ml_user_taste_profiles');
    await db.execute('DROP TABLE IF EXISTS ml_product_embeddings');
  },
};
