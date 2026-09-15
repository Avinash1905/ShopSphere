import { BaseRepository } from './base.repository.js';
import { PaymentEntity } from '../schema/payment.schema.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export class PaymentRepository extends BaseRepository<PaymentEntity> {
  constructor(db: MigrationDatabaseAdapter) {
    super('payments', db);
  }

  public async findByReference(ref: string): Promise<PaymentEntity | null> {
    return this.findOne({ payment_reference: ref.trim() });
  }

  public async findByIdempotencyKey(key: string): Promise<PaymentEntity | null> {
    return this.findOne({ idempotency_key: key });
  }

  public async findByOrderId(orderId: string): Promise<PaymentEntity[]> {
    const sql = `SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC`;
    const rows = await this.db.query<PaymentEntity>(sql, [orderId]);
    return rows.map((r) => this.mapRow(r));
  }

  public async recordRefund(paymentId: string, refundAmount: number, reason: string): Promise<PaymentEntity> {
    const payment = await this.findById(paymentId);
    if (!payment) throw new Error(`Payment with ID ${paymentId} not found`);

    const newRefunded = (payment.refunded_amount || 0) + refundAmount;
    if (newRefunded > payment.amount) {
      throw new Error(`Refund amount ${newRefunded} exceeds original payment amount ${payment.amount}`);
    }

    const newStatus: PaymentEntity['status'] = newRefunded === payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    return await this.update(paymentId, {
      refunded_amount: newRefunded,
      refund_reason: reason,
      status: newStatus,
    });
  }
}
