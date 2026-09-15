import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import { B2BQuoteRFQTable, B2BQuoteRFQItemTable } from '../schema/b2b_wholesale.schema.js';

export interface CreateRFQItemInput {
  variantId: string;
  sku: string;
  quantityRequested: number;
  targetUnitPriceUsd: number;
  notes?: string;
}

export interface SubmitRFQQuoteInput {
  rfqId: string;
  quotedItems: Array<{ rfqItemId: string; quotedUnitPriceUsd: number }>;
  validUntilDate: string;
}

export class B2BQuoteRFQRepository {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Submits a new RFQ from corporate buyer to seller
   */
  public async submitRFQ(
    companyId: string,
    sellerId: string,
    items: CreateRFQItemInput[],
    validDays: number = 14
  ): Promise<{ rfq: B2BQuoteRFQTable; items: B2BQuoteRFQItemTable[] }> {
    if (items.length === 0) {
      throw new Error('An RFQ requires at least 1 item.');
    }

    const rfqId = `rfq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const rfqNum = `RFQ-${new Date().toISOString().substring(0, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const expiry = new Date(Date.now() + validDays * 86400000).toISOString();

    let totalRequested = 0;
    for (const item of items) {
      totalRequested += item.quantityRequested * item.targetUnitPriceUsd;
    }

    const rfq: B2BQuoteRFQTable = {
      id: rfqId,
      rfq_number: rfqNum,
      company_id: companyId,
      seller_id: sellerId,
      status: 'SUBMITTED',
      requested_total_usd: Math.round(totalRequested * 100) / 100,
      expires_at: expiry,
      created_at: now,
      updated_at: now,
    };

    await this.db.execute(
      `INSERT INTO b2b_quote_rfq_requests (
        id, rfq_number, company_id, seller_id, status,
        requested_total_usd, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rfq.id,
        rfq.rfq_number,
        rfq.company_id,
        rfq.seller_id,
        rfq.status,
        rfq.requested_total_usd,
        rfq.expires_at,
        rfq.created_at,
        rfq.updated_at,
      ]
    );

    const createdItems: B2BQuoteRFQItemTable[] = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const itemId = `rfq-item-${rfqId}-${i + 1}`;
      const itemRecord: B2BQuoteRFQItemTable = {
        id: itemId,
        rfq_id: rfqId,
        variant_id: it.variantId,
        sku: it.sku,
        quantity_requested: it.quantityRequested,
        target_unit_price_usd: it.targetUnitPriceUsd,
        notes: it.notes,
        created_at: now,
      };

      await this.db.execute(
        `INSERT INTO b2b_quote_rfq_items (
          id, rfq_id, variant_id, sku, quantity_requested,
          target_unit_price_usd, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemRecord.id,
          itemRecord.rfq_id,
          itemRecord.variant_id,
          itemRecord.sku,
          itemRecord.quantity_requested,
          itemRecord.target_unit_price_usd,
          itemRecord.notes || null,
          itemRecord.created_at,
        ]
      );

      createdItems.push(itemRecord);
    }

    return { rfq, items: createdItems };
  }

  /**
   * Seller provides formal quote prices for RFQ items
   */
  public async provideQuote(input: SubmitRFQQuoteInput): Promise<B2BQuoteRFQTable> {
    const rfqs = await this.db.query<B2BQuoteRFQTable>(
      'SELECT * FROM b2b_quote_rfq_requests WHERE id = ? LIMIT 1',
      [input.rfqId]
    );

    if (rfqs.length === 0) {
      throw new Error(`RFQ '${input.rfqId}' not found.`);
    }

    const rfq = rfqs[0];
    const items = await this.db.query<B2BQuoteRFQItemTable>(
      'SELECT * FROM b2b_quote_rfq_items WHERE rfq_id = ?',
      [input.rfqId]
    );

    let quotedTotal = 0;
    for (const qItem of input.quotedItems) {
      const match = items.find(it => it.id === qItem.rfqItemId);
      if (match) {
        quotedTotal += match.quantity_requested * qItem.quotedUnitPriceUsd;
        await this.db.execute(
          'UPDATE b2b_quote_rfq_items SET quoted_unit_price_usd = ? WHERE id = ?',
          [qItem.quotedUnitPriceUsd, qItem.rfqItemId]
        );
      }
    }

    const roundedQuotedTotal = Math.round(quotedTotal * 100) / 100;
    const now = new Date().toISOString();

    await this.db.execute(
      'UPDATE b2b_quote_rfq_requests SET status = ?, quoted_total_usd = ?, expires_at = ?, updated_at = ? WHERE id = ?',
      ['QUOTED', roundedQuotedTotal, input.validUntilDate, now, input.rfqId]
    );

    return {
      ...rfq,
      status: 'QUOTED',
      quoted_total_usd: roundedQuotedTotal,
      expires_at: input.validUntilDate,
      updated_at: now,
    };
  }

  /**
   * Buyer accepts seller's quote and converts to order
   */
  public async acceptQuoteAndConvertToOrder(rfqId: string): Promise<{ rfqId: string; orderId: string; totalAmountUsd: number }> {
    const rfqs = await this.db.query<B2BQuoteRFQTable>(
      'SELECT * FROM b2b_quote_rfq_requests WHERE id = ? LIMIT 1',
      [rfqId]
    );

    if (rfqs.length === 0) {
      throw new Error(`RFQ '${rfqId}' not found.`);
    }

    const rfq = rfqs[0];
    if (rfq.status !== 'QUOTED' || !rfq.quoted_total_usd) {
      throw new Error(`RFQ '${rfq.rfq_number}' cannot be accepted (Current status: ${rfq.status}).`);
    }

    const generatedOrderId = `ord-b2b-${Date.now()}`;
    const now = new Date().toISOString();

    await this.db.execute(
      'UPDATE b2b_quote_rfq_requests SET status = ?, converted_order_id = ?, updated_at = ? WHERE id = ?',
      ['CONVERTED_TO_ORDER', generatedOrderId, now, rfqId]
    );

    return {
      rfqId,
      orderId: generatedOrderId,
      totalAmountUsd: rfq.quoted_total_usd,
    };
  }
}
