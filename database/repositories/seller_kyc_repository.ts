/**
 * ShopSphere Database Repositories - Seller KYC, Payout Accounts, Badges & Vacation Repository
 */

import { BaseRepository } from './base.repository.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface SellerKycVerification {
  id: string;
  seller_id: string;
  document_type: string;
  document_number_hash: string;
  document_url_encrypted: string;
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  rejection_reason?: string;
  verified_by_user_id?: string;
  verified_at?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SellerPayoutAccount {
  id: string;
  seller_id: string;
  account_type: 'BANK_ACCOUNT' | 'STRIPE_CONNECT' | 'PAYPAL';
  account_holder_name: string;
  routing_number_encrypted?: string;
  account_number_last4: string;
  account_number_encrypted: string;
  currency: string;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface SellerCommissionTier {
  id: string;
  tier_name: string;
  min_monthly_volume: number;
  max_monthly_volume?: number;
  commission_rate_percentage: number;
  flat_fee_per_order: number;
  is_active: boolean;
  created_at: string;
}

export interface SellerBadge {
  id: string;
  seller_id: string;
  badge_code: string;
  badge_title: string;
  awarded_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface SellerVacationMode {
  id: string;
  seller_id: string;
  start_date: string;
  end_date: string;
  pause_listings: boolean;
  auto_response_message?: string;
  is_active: boolean;
  created_at: string;
}

export class SellerKycRepository extends BaseRepository<SellerKycVerification> {
  constructor(db: MigrationDatabaseAdapter) {
    super('seller_kyc_verifications', db);
  }

  public async submitKyc(data: Omit<SellerKycVerification, 'id' | 'verification_status' | 'created_at' | 'updated_at'> & { id?: string }): Promise<SellerKycVerification> {
    const now = new Date().toISOString();
    const id = data.id || `kyc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return this.create({
      id,
      ...data,
      verification_status: 'PENDING',
      created_at: now,
      updated_at: now,
    });
  }

  public async reviewKyc(id: string, reviewerUserId: string, approved: boolean, rejectionReason?: string): Promise<SellerKycVerification> {
    const now = new Date().toISOString();
    return this.update(id, {
      verification_status: approved ? 'APPROVED' : 'REJECTED',
      verified_by_user_id: reviewerUserId,
      verified_at: now,
      rejection_reason: approved ? undefined : rejectionReason,
      updated_at: now,
    } as any);
  }

  public async getPrimaryPayoutAccount(sellerId: string): Promise<SellerPayoutAccount | null> {
    const sql = `SELECT * FROM seller_payout_accounts WHERE seller_id = ? AND is_primary = 1 LIMIT 1`;
    const rows = await this.db.query<SellerPayoutAccount>(sql, [sellerId]);
    return rows.length > 0 ? (this.mapRow(rows[0]) as unknown as SellerPayoutAccount) : null;
  }

  public async registerPayoutAccount(account: Omit<SellerPayoutAccount, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<SellerPayoutAccount> {
    const id = account.id || `payout-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    if (account.is_primary) {
      await this.db.execute(`UPDATE seller_payout_accounts SET is_primary = 0 WHERE seller_id = ?`, [account.seller_id]);
    }

    const clean = this.unmapEntity({
      id,
      ...account,
      created_at: now,
      updated_at: now,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO seller_payout_accounts (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );

    const rows = await this.db.query<SellerPayoutAccount>('SELECT * FROM seller_payout_accounts WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as SellerPayoutAccount;
  }

  public async getApplicableCommissionTier(monthlyVolume: number): Promise<SellerCommissionTier | null> {
    const sql = `
      SELECT * FROM seller_commission_tiers
      WHERE is_active = 1
        AND min_monthly_volume <= ?
        AND (max_monthly_volume IS NULL OR max_monthly_volume >= ?)
      ORDER BY min_monthly_volume DESC
      LIMIT 1
    `;
    const rows = await this.db.query<SellerCommissionTier>(sql, [monthlyVolume, monthlyVolume]);
    return rows.length > 0 ? (this.mapRow(rows[0]) as unknown as SellerCommissionTier) : null;
  }

  public async awardBadge(sellerId: string, badgeCode: string, badgeTitle: string, expiresAt?: string): Promise<SellerBadge> {
    const id = `badge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const clean = this.unmapEntity({
      id,
      seller_id: sellerId,
      badge_code: badgeCode,
      badge_title: badgeTitle,
      awarded_at: now,
      expires_at: expiresAt,
      is_active: 1,
    });
    const keys = Object.keys(clean);
    const placeholders = keys.map(() => '?').join(', ');
    await this.db.execute(
      `INSERT INTO seller_badges (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(k => clean[k])
    );
    const rows = await this.db.query<SellerBadge>('SELECT * FROM seller_badges WHERE id = ?', [id]);
    return this.mapRow(rows[0]) as unknown as SellerBadge;
  }

  public async getActiveVacationMode(sellerId: string): Promise<SellerVacationMode | null> {
    const now = new Date().toISOString();
    const sql = `
      SELECT * FROM seller_vacation_modes
      WHERE seller_id = ?
        AND is_active = 1
        AND start_date <= ?
        AND end_date >= ?
      LIMIT 1
    `;
    const rows = await this.db.query<SellerVacationMode>(sql, [sellerId, now, now]);
    return rows.length > 0 ? (this.mapRow(rows[0]) as unknown as SellerVacationMode) : null;
  }
}
