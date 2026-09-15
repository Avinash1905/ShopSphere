import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const ExtendedPaymentSeeder: Seeder = {
  name: 'ExtendedPaymentSeeder',
  order: 12,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    const payments = await db.query<{ id: string; amount: number; user_id?: string }>('SELECT id, amount FROM payments LIMIT 5');
    const users = await db.query<{ id: string }>('SELECT id FROM users LIMIT 5');
    let inserted = 0;

    // 1. Seed Payment Methods for Users
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      await db.execute(`
        INSERT INTO payment_methods (id, user_id, method_type, provider_token, card_brand, last4, expiry_month, expiry_year, is_default, created_at)
        VALUES (
          'pmeth-seed-${i + 1}',
          '${u.id}',
          'CARD',
          'tok_visa_seed_${i + 1}',
          'VISA',
          '4242',
          12,
          2029,
          1,
          datetime('now')
        );
      `);
      inserted++;
    }

    // 2. Seed Gateway Transactions
    for (let i = 0; i < payments.length; i++) {
      const p = payments[i];
      await db.execute(`
        INSERT INTO payment_transactions (id, payment_id, transaction_type, amount, currency, gateway_transaction_id, gateway_response_code, status, created_at)
        VALUES (
          'ptxn-seed-${i + 1}',
          '${p.id}',
          'CAPTURE',
          ${p.amount || 99.99},
          'USD',
          'ch_stripe_seed_${i + 1}_tx',
          'approved',
          'SUCCESS',
          datetime('now')
        );
      `);
      inserted++;
    }

    return { count: inserted, entityName: 'extended_payments' };
  },
};
