import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import * as crypto from 'crypto';

export const UserSellerSeeder: Seeder = {
  name: 'UserSellerSeeder',
  order: 2,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    const dummyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    let totalCount = 0;

    // 1. System SuperAdmin & Admin
    const admins = [
      { id: 'usr-admin-01', email: 'admin@shopsphere.io', fname: 'Super', lname: 'Admin', role: 'role-super-admin' },
      { id: 'usr-admin-02', email: 'moderator@shopsphere.io', fname: 'Platform', lname: 'Moderator', role: 'role-admin' },
      { id: 'usr-auditor-01', email: 'auditor@shopsphere.io', fname: 'Compliance', lname: 'Auditor', role: 'role-auditor' },
    ];

    for (const adm of admins) {
      await db.execute(
        `INSERT OR IGNORE INTO users (id, email, password_hash, salt, first_name, last_name, status, email_verified)
         VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', TRUE)`,
        [adm.id, adm.email, dummyHash, 'salt123', adm.fname, adm.lname]
      );
      await db.execute(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`, [adm.id, adm.role]);
      totalCount++;
    }

    // 2. Verified Marketplace Sellers
    const sellersData = [
      {
        userId: 'usr-seller-01',
        sellerId: 'seller-apple',
        email: 'store@apple-authorized.com',
        storeName: 'Apple Authorized Premium Reseller',
        slug: 'apple-authorized',
        businessName: 'Apple Retail Partner LLC',
        taxId: 'US-849201948',
        rating: 4.89,
        reviews: 1420,
        sales: 8500,
        revenue: 4250000.0,
      },
      {
        userId: 'usr-seller-02',
        sellerId: 'seller-sony',
        email: 'sales@sony-electronics.com',
        storeName: 'Sony Official Flagship Store',
        slug: 'sony-official',
        businessName: 'Sony Electronics Dist Corp',
        taxId: 'US-739103847',
        rating: 4.75,
        reviews: 980,
        sales: 5200,
        revenue: 2100000.0,
      },
      {
        userId: 'usr-seller-03',
        sellerId: 'seller-nike',
        email: 'merchant@nike-sports.com',
        storeName: 'Nike Official Store',
        slug: 'nike-official',
        businessName: 'Nike Retail Group Inc',
        taxId: 'US-928174019',
        rating: 4.82,
        reviews: 2150,
        sales: 12400,
        revenue: 1860000.0,
      },
      {
        userId: 'usr-seller-04',
        sellerId: 'seller-samsung',
        email: 'direct@samsung-galaxy.com',
        storeName: 'Samsung Galaxy Experience Store',
        slug: 'samsung-galaxy',
        businessName: 'Samsung Direct Retail LLC',
        taxId: 'US-619284019',
        rating: 4.68,
        reviews: 870,
        sales: 4600,
        revenue: 2300000.0,
      },
      {
        userId: 'usr-seller-05',
        sellerId: 'seller-kitchen',
        email: 'support@culinary-craft.com',
        storeName: 'Culinary Craft & Home',
        slug: 'culinary-craft',
        businessName: 'Culinary Craft Appliances Co',
        taxId: 'US-102938475',
        rating: 4.62,
        reviews: 430,
        sales: 2100,
        revenue: 650000.0,
      },
    ];

    for (const s of sellersData) {
      await db.execute(
        `INSERT OR IGNORE INTO users (id, email, password_hash, salt, first_name, last_name, status, email_verified)
         VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', TRUE)`,
        [s.userId, s.email, dummyHash, 'salt456', s.storeName.split(' ')[0], 'Merchant']
      );
      await db.execute(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`, [s.userId, 'role-seller']);

      await db.execute(
        `INSERT OR IGNORE INTO sellers (
          id, user_id, store_name, store_slug, business_name, tax_id, verification_status,
          commission_rate_percentage, rating_average, total_reviews_count, total_sales_count,
          total_revenue_amount, support_email, is_featured
        ) VALUES (?, ?, ?, ?, ?, ?, 'VERIFIED', 8.5, ?, ?, ?, ?, ?, TRUE)`,
        [s.sellerId, s.userId, s.storeName, s.slug, s.businessName, s.taxId, s.rating, s.reviews, s.sales, s.revenue, s.email]
      );
      totalCount += 2;
    }

    // 3. Customer accounts
    const customerNames = [
      ['Alex', 'Morgan', 'alex.morgan@example.com'],
      ['Emma', 'Watson', 'emma.watson@example.com'],
      ['David', 'Miller', 'david.miller@example.com'],
      ['Sophia', 'Taylor', 'sophia.taylor@example.com'],
      ['Lucas', 'Chen', 'lucas.chen@example.com'],
      ['Olivia', 'Martinez', 'olivia.martinez@example.com'],
      ['Liam', 'Johnson', 'liam.johnson@example.com'],
      ['Ava', 'Anderson', 'ava.anderson@example.com'],
      ['Noah', 'Thomas', 'noah.thomas@example.com'],
      ['Isabella', 'Jackson', 'isabella.jackson@example.com'],
    ];

    for (let i = 0; i < customerNames.length; i++) {
      const [fname, lname, email] = customerNames[i];
      const custId = `usr-cust-${(i + 1).toString().padStart(2, '0')}`;
      await db.execute(
        `INSERT OR IGNORE INTO users (id, email, password_hash, salt, first_name, last_name, status, email_verified)
         VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', TRUE)`,
        [custId, email, dummyHash, 'salt789', fname, lname]
      );
      await db.execute(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`, [custId, 'role-customer']);
      totalCount += 2;
    }

    return { count: totalCount, entityName: 'users_and_sellers' };
  },
};
