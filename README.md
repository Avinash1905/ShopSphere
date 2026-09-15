# ShopSphere - Database and Advanced Systems Engine (Member 3)

Welcome to the ShopSphere Database and Advanced Systems subsystem. This repository contains the complete production-grade database architecture and core advanced systems owned by **Member 3**.

## Directory Architecture

```
shopsphere/
├── database/
│   ├── schema/          # Domain schemas & type definitions for all 20 entities
│   ├── migrations/      # Version-controlled DDL migrations & rollback engine
│   ├── seeds/           # Deterministic & realistic test/staging seeders
│   ├── repositories/    # Generic Unit of Work, locks, and 20 domain repositories
│   └── queries/         # Optimized query builders, CTEs, and window functions
│
├── systems/
│   ├── search/          # Search engine (BM25, Fuzzy, Trie, Filters, Analytics)
│   ├── analytics/       # Customer, Seller, and Admin metrics & aggregations
│   ├── security/        # Sanitization, Token Bucket rate limiters, RBAC/ABAC, PII
│   ├── audit/           # Immutable audit ledger, diff engine, compliance reports
│   └── testing/         # Mock database, test factories, benchmarks, security fuzzers
│
└── tests/
    ├── integration/     # Database, repository, search, analytics, security integration
    ├── e2e/             # Full commerce lifecycle & checkout auditing E2E tests
    ├── performance/     # Concurrency, throughput, and latency benchmarks
    └── security/        # Injection, XSS, and authorization penetration tests
```

## System Modules

### 1. Database Layer (`database/`)
- **Entities**: `users`, `roles`, `permissions`, `sellers`, `products`, `categories`, `brands`, `variants`, `inventory`, `carts`, `cart_items`, `wishlists`, `orders`, `order_items`, `payments`, `coupons`, `reviews`, `addresses`, `notifications`, `audit_logs`.
- **Capabilities**:
  - Full relational integrity (Foreign keys, cascade policies).
  - Optimistic & pessimistic concurrency locking.
  - Multi-statement ACID transactions with savepoints.
  - Dynamic query generation with CTEs, window functions, and indexing hints.

### 2. Search Engine (`systems/search/`)
- **Pipeline**: Normalization → Tokenization (N-gram, Porter Stemmer, Phonetic Soundex) → Inverted Index Matching → Fuzzy Damerau-Levenshtein / Trigram Matching → Multi-attribute BM25 Ranking with dynamic boosting → Facet Filtering → Multi-criteria Sorting → Cursor/Offset Pagination.
- **Features**: Auto-complete Trie, Did-You-Mean suggestions, trending query tracker, search analytics with CTR, LRU search cache.

### 3. Analytics Engine (`systems/analytics/`)
- **Customer Analytics**: CLV, RFM segmentation, category affinities, churn probability, retention cohorts.
- **Seller Analytics**: Revenue, GMV, conversion funnels, SKU velocity, refund rates, fulfillment latency.
- **Admin Analytics**: Platform-wide GMV, revenue take-rate, seller leaderboard, category trees, system bottlenecks.
- **Reporting**: Time-series bucketing (hourly to yearly), percentile calculations, JSON/CSV dataset export.

### 4. Security System (`systems/security/`)
- **Protection**: HTML/XSS sanitization, SQLi AST inspection, Token Bucket / Sliding Window rate limiting, RBAC & ABAC policy evaluator, session geovelocity & anomaly detection, PII automated masking.

### 5. Audit System (`systems/audit/`)
- **Compliance**: Append-only immutable log, deep entity state diffing, JSON patch tracking, multi-dimensional audit queries, SOC2 / GDPR / PCI-DSS compliance audits.

### 6. Testing Infrastructure (`systems/testing/` & `tests/`)
- In-memory ACID mock database, entity factories for 20 models, benchmark harnesses, fuzzing tools, and integration/E2E test suites.
