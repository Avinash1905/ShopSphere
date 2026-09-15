export interface MLProductEmbeddingTable {
  id: string; // UUID
  variant_id: string;
  model_name: string; // e.g. 'embedding-ecommerce-v2'
  dimensions: number; // e.g. 64 or 128
  embedding_vector_json: string; // JSON array of numbers
  created_at: string;
  updated_at: string;
}

export interface MLUserTasteProfileTable {
  id: string; // UUID
  user_id: string;
  affinity_vector_json: string; // JSON array representing user latent vector
  top_categories_json: string; // JSON array of string category IDs
  engagement_decay_factor: number; // e.g. 0.95
  last_interaction_at: string;
  created_at: string;
  updated_at: string;
}

export interface MLRecommendationCampaignTable {
  id: string; // UUID
  campaign_name: string;
  algorithm_type: 'MATRIX_FACTORIZATION' | 'VECTOR_ANN' | 'THOMPSON_SAMPLING' | 'HYBRID_ENSEMBLE';
  traffic_split_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MLBanditArmTable {
  id: string; // UUID
  campaign_id: string;
  arm_key: string; // e.g. product_id or banner_id
  alpha_successes: number; // Beta distribution parameter
  beta_failures: number; // Beta distribution parameter
  total_impressions: number;
  total_conversions: number;
  cumulative_reward_usd: number;
  updated_at: string;
}
