import { Seeder, SeedPRNG } from './seed_runner.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export const ExtendedEngagementSeeder: Seeder = {
  name: 'ExtendedEngagementSeeder',
  order: 13,

  async run(db: MigrationDatabaseAdapter, rng: SeedPRNG): Promise<{ count: number; entityName: string }> {
    const reviews = await db.query<{ id: string }>('SELECT id FROM reviews LIMIT 5');
    const users = await db.query<{ id: string }>('SELECT id FROM users LIMIT 5');
    let inserted = 0;

    for (let i = 0; i < reviews.length; i++) {
      const r = reviews[i];
      const u = users[i % users.length];

      // 1. Seed Review Media
      await db.execute(`
        INSERT INTO review_media (id, review_id, media_type, url, thumbnail_url, created_at)
        VALUES (
          'revmed-seed-${i + 1}',
          '${r.id}',
          'IMAGE',
          'https://images.shopsphere.com/reviews/${r.id}/photo.jpg',
          'https://images.shopsphere.com/reviews/${r.id}/thumb.jpg',
          datetime('now')
        );
      `);
      inserted++;

      // 2. Seed Helpful Votes
      await db.execute(`
        INSERT INTO review_helpful_votes (id, review_id, user_id, is_helpful, created_at)
        VALUES (
          'revvote-seed-${i + 1}',
          '${r.id}',
          '${u.id}',
          1,
          datetime('now')
        );
      `);
      inserted++;
    }

    return { count: inserted, entityName: 'extended_engagement' };
  },
};
