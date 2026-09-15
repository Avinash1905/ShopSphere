import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import {
  SchemaRegistry,
  SchemaValidator,
  MySqlDdlGenerator,
  TemporalTableManager,
  OrderFulfillmentsSchema,
  PaymentTransactionsSchema,
} from '../../database/schema/index.js';

describe('Phase 1: Extended Enterprise Schemas & DDL Engines', () => {
  it('should have registered all extended schemas in the global registry', () => {
    const allSchemas = SchemaRegistry.getAll();
    Assert.greaterThanOrEqual(allSchemas.length, 45, 'Expected at least 45 schemas registered');

    // Verify key extended schemas are present
    Assert.isTrue(!!SchemaRegistry.get('user_mfa_devices'), 'user_mfa_devices should be registered');
    Assert.isTrue(!!SchemaRegistry.get('seller_kyc_verifications'), 'seller_kyc_verifications should be registered');
    Assert.isTrue(!!SchemaRegistry.get('product_attributes'), 'product_attributes should be registered');
    Assert.isTrue(!!SchemaRegistry.get('warehouses'), 'warehouses should be registered');
    Assert.isTrue(!!SchemaRegistry.get('order_fulfillments'), 'order_fulfillments should be registered');
    Assert.isTrue(!!SchemaRegistry.get('payment_transactions'), 'payment_transactions should be registered');
    Assert.isTrue(!!SchemaRegistry.get('review_media'), 'review_media should be registered');
    Assert.isTrue(!!SchemaRegistry.get('notification_templates'), 'notification_templates should be registered');
    Assert.isTrue(!!SchemaRegistry.get('security_events_ledger'), 'security_events_ledger should be registered');
  });

  it('should pass referential integrity and constraint validation across all schemas', () => {
    const validationResult = SchemaValidator.validateAll();
    const errorCount = validationResult.errors.filter(e => e.severity === 'ERROR').length;
    Assert.equal(errorCount, 0, 'No validation errors across all schemas');
    Assert.isTrue(validationResult.valid, 'Schema validation result is valid');
  });

  it('should generate valid MySQL 8.0 DDL statements for extended tables', () => {
    const ddl = MySqlDdlGenerator.generateCreateTable(PaymentTransactionsSchema);
    Assert.isTrue(ddl.includes('CREATE TABLE IF NOT EXISTS `payment_transactions`'), 'MySQL DDL creates table');
    Assert.isTrue(ddl.includes('ENGINE=InnoDB'), 'MySQL DDL has InnoDB engine');
    Assert.isTrue(ddl.includes('DEFAULT CHARSET=utf8mb4'), 'MySQL DDL has utf8mb4');
    Assert.isTrue(ddl.includes('CONSTRAINT `pk_payment_transactions` PRIMARY KEY (`id`)'), 'MySQL DDL has primary key');
    Assert.isTrue(ddl.includes('CONSTRAINT `fk_payment_transactions_payment_id` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`)'), 'MySQL DDL has foreign key');
  });

  it('should generate temporal history table schemas and AS OF queries', () => {
    const temporalManager = new TemporalTableManager();
    const historySchema = temporalManager.generateHistorySchema(OrderFulfillmentsSchema);

    Assert.equal(historySchema.tableName, 'order_fulfillments_history', 'Temporal history table name matches');
    Assert.isTrue(!!historySchema.columns.valid_from, 'History table has valid_from');
    Assert.isTrue(!!historySchema.columns.valid_to, 'History table has valid_to');
    Assert.isTrue(!!historySchema.columns.payload_snapshot, 'History table has payload_snapshot');

    const asOfQuery = temporalManager.buildAsOfQuery('order_fulfillments', 'ord-fulf-123', new Date('2026-01-01T00:00:00Z'));
    Assert.isTrue(asOfQuery.query.includes('FROM order_fulfillments_history'), 'AS OF query references history table');
    Assert.equal(asOfQuery.params[0], 'ord-fulf-123', 'Param 0 is entity id');
  });
});
