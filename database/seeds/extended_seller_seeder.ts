import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const ExtendedSellerSeeder: Seeder = {
  name: 'ExtendedSellerSeeder',
  order: 8,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    const sellers = await db.query<{ id: string; store_name: string }>('SELECT id, store_name FROM sellers LIMIT 5');
    let inserted = 0;

    // Seed Commission Tiers
    const tiers = [
      { id: 'comm-tier-bronze', name: 'Bronze Starter', min: 0.00, rate: 12.00, fee: 0.50 },
      { id: 'comm-tier-silver', name: 'Silver Growth', min: 10000.01, rate: 9.50, fee: 0.35 },
      { id: 'comm-tier-gold', name: 'Gold Enterprise', min: 50000.01, rate: 6.00, fee: 0.20 },
    ];
    for (const t of tiers) {
      await db.execute(`
        INSERT INTO seller_commission_tiers (id, tier_name, min_monthly_volume, commission_rate_percentage, flat_fee_per_order, is_active)
        VALUES ('${t.id}', '${t.name}', ${t.min}, ${t.rate}, ${t.fee}, 1)
      `);
      inserted++;
    }

    for (let i = 0; i < sellers.length; i++) {
      const s = sellers[i];

      // 1. Seed KYC Verification
      await db.execute(`
        INSERT INTO seller_kyc_verifications (id, seller_id, document_type, document_number_hash, document_url_encrypted, verification_status, verified_at, created_at, updated_at)
        VALUES (
          'kyc-seed-${i + 1}',
          '${s.id}',
          'BUSINESS_EIN_TAX_CERTIFICATE',
          'DOC_HASH_${i + 1}_EIN',
          's3://shopsphere-vault/kyc/${s.id}/cert.enc',
          'APPROVED',
          datetime('now'),
          datetime('now'),
          datetime('now')
        );
      `);
      inserted++;

      // 2. Seed Payout Account
      await db.execute(`
        INSERT INTO seller_payout_accounts (id, seller_id, account_type, account_holder_name, account_number_last4, account_number_encrypted, currency, is_primary, is_verified, created_at, updated_at)
        VALUES (
          'payout-seed-${i + 1}',
          '${s.id}',
          'STRIPE_CONNECT',
          '${s.store_name} Treasury',
          '${9000 + i}',
          'ENC_STRIPE_ACCT_NUM_${i + 1}',
          'USD',
          1,
          1,
          datetime('now'),
          datetime('now')
        );
      `);
      inserted++;

      // 3. Seed Seller Badge
      await db.execute(`
        INSERT INTO seller_badges (id, seller_id, badge_code, badge_title, awarded_at, is_active)
        VALUES (
          'badge-seed-${i + 1}',
          '${s.id}',
          'VERIFIED_TOP_RATED_SELLER',
          'Top Rated Merchant 2026',
          datetime('now'),
          1
        );
      `);
      inserted++;
    }

    return { count: inserted, entityName: 'extended_sellers' };
  },
};
