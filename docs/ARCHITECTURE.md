# ShopSphere Enterprise Monorepo Architecture

ShopSphere is a multi-vendor e-commerce marketplace platform built on a modular monorepo architecture.

## 🏛️ System Layers

1. **Frontend UI Layer** (`src/`): React 18, Vite, Zustand, Tailwind CSS, Recharts.
2. **API Layer** (`backend/`): Node.js, Express, TypeScript REST controllers for 26 domains.
3. **Subsystems & Domain Engines** (`systems/`):
   - **Search Engine**: Inverted index, BM25 relevance scoring, Levenshtein fuzzy distance.
   - **Pricing Engine**: Multi-tier volume discounts, regional tax engine (GST/VAT/US).
   - **Inventory State Machine**: Multi-warehouse stock tracking, reservation queues with TTL.
   - **Order Lifecycle FSM**: 12 order states and transition audit trails.
   - **Payment Simulator**: Idempotency token manager, Luhn validator, 3DS authentication.
   - **Security Engine**: RBAC matrix, PBKDF2/Argon2 hashing, rate limiters.
   - **Analytics Engine**: Real-time sales telemetry, GMV metrics, customer cohort analysis.
4. **Data Access Layer** (`database/`): 30+ relational repositories, Prisma schema, and seed datasets.
