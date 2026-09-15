import { QueryBuilder } from './query_builder.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface CatalogFacetResult {
  categories: { id: string; name: string; count: number }[];
  brands: { id: string; name: string; count: number }[];
  priceStats: { minPrice: number; maxPrice: number; avgPrice: number };
  ratingDistribution: { rating: number; count: number }[];
}

export class CatalogQueries {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  public async getCatalogFacets(categoryId?: string, searchKeyword?: string): Promise<CatalogFacetResult> {
    // 1. Category Facets
    const catQb = QueryBuilder.select('c.id', 'c.name', 'COUNT(p.id) as count')
      .from('categories', 'c')
      .innerJoin('products', 'p.category_id = c.id', 'p')
      .where("p.status = 'PUBLISHED'")
      .where('p.deleted_at IS NULL');

    if (categoryId) {
      catQb.where('(c.id = ? OR c.parent_id = ?)', categoryId, categoryId);
    }
    if (searchKeyword) {
      catQb.where('(p.title LIKE ? OR p.description LIKE ?)', `%${searchKeyword}%`, `%${searchKeyword}%`);
    }
    catQb.groupBy('c.id', 'c.name').orderBy('count', 'DESC');

    const catSQL = catQb.toSQL();
    const categories = await this.db.query<{ id: string; name: string; count: number }>(catSQL.sql, catSQL.params);

    // 2. Brand Facets
    const brandQb = QueryBuilder.select('b.id', 'b.name', 'COUNT(p.id) as count')
      .from('brands', 'b')
      .innerJoin('products', 'p.brand_id = b.id', 'p')
      .where("p.status = 'PUBLISHED'")
      .where('p.deleted_at IS NULL');

    if (categoryId) {
      brandQb.where('p.category_id = ?', categoryId);
    }
    if (searchKeyword) {
      brandQb.where('(p.title LIKE ? OR p.description LIKE ?)', `%${searchKeyword}%`, `%${searchKeyword}%`);
    }
    brandQb.groupBy('b.id', 'b.name').orderBy('count', 'DESC');

    const brandSQL = brandQb.toSQL();
    const brands = await this.db.query<{ id: string; name: string; count: number }>(brandSQL.sql, brandSQL.params);

    // 3. Price Stats
    const priceQb = QueryBuilder.select(
      'MIN(p.base_price) as min_price',
      'MAX(p.base_price) as max_price',
      'AVG(p.base_price) as avg_price'
    )
      .from('products', 'p')
      .where("p.status = 'PUBLISHED'")
      .where('p.deleted_at IS NULL');

    if (categoryId) priceQb.where('p.category_id = ?', categoryId);
    const priceSQL = priceQb.toSQL();
    const priceRes = await this.db.query<{ min_price: number; max_price: number; avg_price: number }>(
      priceSQL.sql,
      priceSQL.params
    );

    // 4. Rating Distribution
    const ratingQb = QueryBuilder.select('CAST(ROUND(p.rating_average) AS INTEGER) as rating', 'COUNT(p.id) as count')
      .from('products', 'p')
      .where("p.status = 'PUBLISHED'")
      .where('p.deleted_at IS NULL')
      .groupBy('ROUND(p.rating_average)')
      .orderBy('rating', 'DESC');

    const ratingSQL = ratingQb.toSQL();
    const ratingRows = await this.db.query<{ rating: number; count: number }>(ratingSQL.sql, ratingSQL.params);

    return {
      categories: categories.map((c) => ({ id: c.id, name: c.name, count: Number(c.count) })),
      brands: brands.map((b) => ({ id: b.id, name: b.name, count: Number(b.count) })),
      priceStats: {
        minPrice: Number(priceRes[0]?.min_price || 0),
        maxPrice: Number(priceRes[0]?.max_price || 0),
        avgPrice: Math.round(Number(priceRes[0]?.avg_price || 0) * 100) / 100,
      },
      ratingDistribution: ratingRows.map((r) => ({ rating: Number(r.rating), count: Number(r.count) })),
    };
  }

  /**
   * Bestsellers ranked by time-decay popularity score
   */
  public async getRankedBestsellers(limit: number = 20): Promise<any[]> {
    const qb = QueryBuilder.select(
      'p.id',
      'p.title',
      'p.slug',
      'p.base_price',
      'p.rating_average',
      'p.total_sales_count',
      'b.name as brand_name',
      'c.name as category_name',
      '(p.total_sales_count * 0.7 + p.rating_average * 20.0 + p.reviews_count * 0.1) AS popularity_rank_score'
    )
      .from('products', 'p')
      .leftJoin('brands', 'b.id = p.brand_id', 'b')
      .innerJoin('categories', 'c.id = p.category_id', 'c')
      .where("p.status = 'PUBLISHED'")
      .where('p.deleted_at IS NULL')
      .orderBy('popularity_rank_score', 'DESC')
      .limit(limit);

    const { sql, params } = qb.toSQL();
    return await this.db.query(sql, params);
  }
}
