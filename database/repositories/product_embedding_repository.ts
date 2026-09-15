import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import { MLProductEmbeddingTable } from '../schema/ml_recommendations.schema.js';

export interface VectorSearchResult {
  variantId: string;
  cosineSimilarity: number;
  modelName: string;
}

export class ProductEmbeddingRepository {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Computes exact cosine similarity between two float vectors
   */
  public static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Upserts dense embedding vector for a product variant
   */
  public async upsertEmbedding(
    variantId: string,
    vector: number[],
    modelName: string = 'embedding-ecommerce-v2'
  ): Promise<MLProductEmbeddingTable> {
    const rows = await this.db.query<MLProductEmbeddingTable>(
      'SELECT * FROM ml_product_embeddings WHERE variant_id = ? AND model_name = ? LIMIT 1',
      [variantId, modelName]
    );

    const now = new Date().toISOString();
    const vectorJson = JSON.stringify(vector);

    if (rows.length > 0) {
      await this.db.execute(
        'UPDATE ml_product_embeddings SET embedding_vector_json = ?, dimensions = ?, updated_at = ? WHERE id = ?',
        [vectorJson, vector.length, now, rows[0].id]
      );
      return { ...rows[0], embedding_vector_json: vectorJson, dimensions: vector.length, updated_at: now };
    }

    const id = `emb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record: MLProductEmbeddingTable = {
      id,
      variant_id: variantId,
      model_name: modelName,
      dimensions: vector.length,
      embedding_vector_json: vectorJson,
      created_at: now,
      updated_at: now,
    };

    await this.db.execute(
      `INSERT INTO ml_product_embeddings (
        id, variant_id, model_name, dimensions,
        embedding_vector_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.variant_id,
        record.model_name,
        record.dimensions,
        record.embedding_vector_json,
        record.created_at,
        record.updated_at,
      ]
    );

    return record;
  }

  /**
   * Finds Top-K nearest neighbors using cosine similarity
   */
  public async findNearestNeighbors(
    queryVector: number[],
    topK: number = 10,
    modelName: string = 'embedding-ecommerce-v2'
  ): Promise<VectorSearchResult[]> {
    const rows = await this.db.query<MLProductEmbeddingTable>(
      'SELECT * FROM ml_product_embeddings WHERE model_name = ?',
      [modelName]
    );

    const results: VectorSearchResult[] = [];

    for (const r of rows) {
      try {
        const vec = JSON.parse(r.embedding_vector_json) as number[];
        const sim = ProductEmbeddingRepository.cosineSimilarity(queryVector, vec);
        results.push({
          variantId: r.variant_id,
          cosineSimilarity: Math.round(sim * 10000) / 10000,
          modelName: r.model_name,
        });
      } catch (err) {
        // Ignore unparseable vector
      }
    }

    results.sort((a, b) => b.cosineSimilarity - a.cosineSimilarity);
    return results.slice(0, topK);
  }
}
