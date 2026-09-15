/**
 * ShopSphere Database Repositories - Dynamic Product Attributes, Media, Pricing Tiers & Bundles Repository
 */

import { BaseRepository } from './base.repository.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface ProductAttribute {
  id: string;
  name: string;
  code: string;
  attribute_type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'MULTISELECT' | 'COLOR';
  is_filterable: boolean;
  is_searchable: boolean;
  display_order: number;
  created_at: string;
}

export interface ProductAttributeValue {
  id: string;
  product_id: string;
  attribute_id: string;
  text_value?: string;
  numeric_value?: number;
  boolean_value?: boolean;
  json_value?: any;
  created_at: string;
}

export interface ProductMediaItem {
  id: string;
  product_id: string;
  variant_id?: string;
  media_type: 'IMAGE' | 'VIDEO' | '3D_MODEL' | 'DOCUMENT';
  url: string;
  thumbnail_url?: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductPricingTier {
  id: string;
  product_id: string;
  variant_id?: string;
  min_quantity: number;
  unit_price: number;
  currency: string;
  customer_group: string;
  created_at: string;
}

export interface ProductBundleItem {
  id: string;
  parent_product_id: string;
  child_product_id: string;
  quantity: number;
  discount_rate: number;
  created_at: string;
}

export class ProductAttributeRepository extends BaseRepository<ProductAttribute> {
  constructor(db: MigrationDatabaseAdapter) {
    super('product_attributes', db);
  }

  public async getAttributeByCode(code: string): Promise<ProductAttribute | null> {
    return this.findOne({ code });
  }

  public async setProductAttributeValue(
    productId: string,
    attributeId: string,
    value: { text?: string; numeric?: number; boolean?: boolean; json?: any }
  ): Promise<ProductAttributeValue> {
    const existing = await this.db.query<ProductAttributeValue>(
      'SELECT * FROM product_attribute_values WHERE product_id = ? AND attribute_id = ? LIMIT 1',
      [productId, attributeId]
    );

    const now = new Date().toISOString();
    if (existing.length > 0) {
      const id = existing[0].id;
      const clean = this.unmapEntity({
        text_value: value.text,
        numeric_value: value.numeric,
        boolean_value: value.boolean,
        json_value: value.json,
      });
      const keys = Object.keys(clean);
      const setClauses = keys.map(k => `${k} = ?`).join(', ');
      await this.db.execute(
        `UPDATE product_attribute_values SET ${setClauses} WHERE id = ?`,
        [...keys.map(k => clean[k]), id]
      );
      const rows = await this.db.query<ProductAttributeValue>('SELECT * FROM product_attribute_values WHERE id = ?', [id]);
      return this.mapRow(rows[0]) as unknown as ProductAttributeValue;
    } else {
      const id = `attrval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const clean = this.unmapEntity({
        id,
        product_id: productId,
        attribute_id: attributeId,
        text_value: value.text,
        numeric_value: value.numeric,
        boolean_value: value.boolean,
        json_value: value.json,
        created_at: now,
      });
      const keys = Object.keys(clean);
      const placeholders = keys.map(() => '?').join(', ');
      await this.db.execute(
        `INSERT INTO product_attribute_values (${keys.join(', ')}) VALUES (${placeholders})`,
        keys.map(k => clean[k])
      );
      const rows = await this.db.query<ProductAttributeValue>('SELECT * FROM product_attribute_values WHERE id = ?', [id]);
      return this.mapRow(rows[0]) as unknown as ProductAttributeValue;
    }
  }

  public async getProductAttributeValues(productId: string): Promise<Array<ProductAttributeValue & { attribute_name: string; attribute_code: string }>> {
    const sql = `
      SELECT pav.*, pa.name as attribute_name, pa.code as attribute_code
      FROM product_attribute_values pav
      JOIN product_attributes pa ON pav.attribute_id = pa.id
      WHERE pav.product_id = ?
      ORDER BY pa.display_order ASC
    `;
    const rows = await this.db.query<any>(sql, [productId]);
    return rows.map(r => this.mapRow(r) as unknown as ProductAttributeValue & { attribute_name: string; attribute_code: string });
  }

  public async addMedia(media: Omit<ProductMediaItem, 'id' | 'created_at'> & { id?: string }): Promise<ProductMediaItem> {
    const id = media.id || `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const clean = this.unmapEntity({
      id,
      ...media,
      created_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO product_media_gallery (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<ProductMediaItem>('SELECT * FROM product_media_gallery WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as ProductMediaItem;
  }

  public async getMediaForProduct(productId: string): Promise<ProductMediaItem[]> {
    const sql = `SELECT * FROM product_media_gallery WHERE product_id = ? ORDER BY sort_order ASC, is_primary DESC`;
    const rows = await this.db.query<ProductMediaItem>(sql, [productId]);
    return rows.map(r => this.mapRow(r) as unknown as ProductMediaItem);
  }

  public async getTierPrice(productId: string, quantity: number, customerGroup: string = 'DEFAULT'): Promise<number | null> {
    const sql = `
      SELECT unit_price FROM product_pricing_tiers
      WHERE product_id = ?
        AND customer_group = ?
        AND min_quantity <= ?
      ORDER BY min_quantity DESC
      LIMIT 1
    `;
    const rows = await this.db.query<{ unit_price: number }>(sql, [productId, customerGroup, quantity]);
    return rows.length > 0 ? Number(rows[0].unit_price) : null;
  }

  public async addBundleComponent(parentProductId: string, childProductId: string, quantity: number, discountRate: number = 0): Promise<ProductBundleItem> {
    const id = `bundle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const clean = this.unmapEntity({
      id,
      parent_product_id: parentProductId,
      child_product_id: childProductId,
      quantity,
      discount_rate: discountRate,
      created_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO product_bundles (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<ProductBundleItem>('SELECT * FROM product_bundles WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as ProductBundleItem;
  }

  public async getBundleComponents(parentProductId: string): Promise<ProductBundleItem[]> {
    const sql = `SELECT * FROM product_bundles WHERE parent_product_id = ?`;
    const rows = await this.db.query<ProductBundleItem>(sql, [parentProductId]);
    return rows.map(r => this.mapRow(r) as unknown as ProductBundleItem);
  }
}
