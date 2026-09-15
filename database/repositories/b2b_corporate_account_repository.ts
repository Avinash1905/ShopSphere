import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import { B2BCompanyAccountTable, B2BCorporateInvoiceTable } from '../schema/b2b_wholesale.schema.js';

export class B2BCorporateAccountRepository {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Registers a new corporate buyer with credit limits and net terms
   */
  public async registerCompanyAccount(
    companyName: string,
    registrationNumber: string,
    creditLimitUsd: number,
    paymentTerms: B2BCompanyAccountTable['payment_terms'],
    primaryContactEmail: string,
    taxExemptionId?: string
  ): Promise<B2BCompanyAccountTable> {
    const id = `corp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const company: B2BCompanyAccountTable = {
      id,
      company_name: companyName,
      registration_number: registrationNumber,
      credit_limit_usd: creditLimitUsd,
      available_credit_usd: creditLimitUsd,
      payment_terms: paymentTerms,
      account_status: 'ACTIVE',
      tax_exemption_certificate_id: taxExemptionId,
      is_tax_exempt: !!taxExemptionId,
      primary_contact_email: primaryContactEmail,
      created_at: now,
      updated_at: now,
    };

    await this.db.execute(
      `INSERT INTO b2b_company_accounts (
        id, company_name, registration_number, credit_limit_usd,
        available_credit_usd, payment_terms, account_status,
        tax_exemption_certificate_id, is_tax_exempt, primary_contact_email,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company.id,
        company.company_name,
        company.registration_number,
        company.credit_limit_usd,
        company.available_credit_usd,
        company.payment_terms,
        company.account_status,
        company.tax_exemption_certificate_id || null,
        company.is_tax_exempt,
        company.primary_contact_email,
        company.created_at,
        company.updated_at,
      ]
    );

    return company;
  }

  /**
   * Authorizes and reserves credit for a new purchase order
   */
  public async authorizeCreditDrawdown(companyId: string, orderAmountUsd: number): Promise<boolean> {
    const rows = await this.db.query<B2BCompanyAccountTable>(
      'SELECT * FROM b2b_company_accounts WHERE id = ? LIMIT 1',
      [companyId]
    );

    if (rows.length === 0) {
      throw new Error(`Corporate account '${companyId}' not found.`);
    }

    const company = rows[0];
    if (company.account_status !== 'ACTIVE') {
      throw new Error(`Corporate account '${company.company_name}' is on ${company.account_status}. Orders blocked.`);
    }

    if (company.available_credit_usd < orderAmountUsd) {
      throw new Error(
        `Insufficient credit limit. Available: $${company.available_credit_usd.toFixed(2)}, Requested: $${orderAmountUsd.toFixed(2)}.`
      );
    }

    const newAvailable = Math.round((company.available_credit_usd - orderAmountUsd) * 100) / 100;
    await this.db.execute(
      'UPDATE b2b_company_accounts SET available_credit_usd = ?, updated_at = ? WHERE id = ?',
      [newAvailable, new Date().toISOString(), companyId]
    );

    return true;
  }

  /**
   * Restores available credit upon invoice payment
   */
  public async restoreCreditOnPayment(companyId: string, paymentAmountUsd: number): Promise<number> {
    const rows = await this.db.query<B2BCompanyAccountTable>(
      'SELECT * FROM b2b_company_accounts WHERE id = ? LIMIT 1',
      [companyId]
    );

    if (rows.length === 0) {
      throw new Error(`Corporate account '${companyId}' not found.`);
    }

    const company = rows[0];
    const newAvailable = Math.min(company.credit_limit_usd, Math.round((company.available_credit_usd + paymentAmountUsd) * 100) / 100);

    await this.db.execute(
      'UPDATE b2b_company_accounts SET available_credit_usd = ?, updated_at = ? WHERE id = ?',
      [newAvailable, new Date().toISOString(), companyId]
    );

    return newAvailable;
  }
}
