# ShopSphere — Multi-Vendor E-Commerce Marketplace Platform

ShopSphere is an enterprise-grade, full-stack multi-vendor e-commerce marketplace platform built with React 18, TypeScript, Node.js, Express, Zustand, Tailwind CSS, and a modular monorepo architecture.

---

## 🏛️ Architecture & Highlights

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Zustand State Management, Recharts Visualizations, React Router v6.
- **Backend**: Node.js, Express, TypeScript REST API with 26 Domain Routers, Controllers, Query Builders, and Middleware.
- **Database & Data Access**: 30 Relational Repositories, Prisma Schema, 54 SQL Migration DDLs, and Seed Datasets.
- **Domain Subsystems**:
  - **Search Engine**: Inverted index, BM25 scoring algorithm, Levenshtein fuzzy distance, and multi-facet filtering.
  - **Pricing & Taxation Engine**: Tiered volume discounts, 50-state US & international tax matrix, coupon validation.
  - **Inventory Subsystem**: Multi-warehouse stock tracking, reservation queues with TTL expiry, and backorder guard.
  - **Order Lifecycle FSM**: 12 order states and transition audit trails.
  - **Payment Simulator**: Idempotency token manager, card Luhn algorithm validator, 3DS authentication flow.
  - **Security & RBAC**: JWT token management, PBKDF2/Argon2 hashing, rate limiters, role-permission matrix.
  - **Analytics Engine**: Real-time sales telemetry, GMV metrics, customer cohort analysis.
  - **Shipping Subsystem**: Zone-based shipping rate calculation for 8 global carriers (FedEx, UPS, DHL, USPS, etc.).

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Avinash1905/ShopSphere.git
cd ShopSphere

# Install dependencies
npm install
```

### 3. Running Locally
```bash
# Start both Backend API Server (:5000) and Frontend Dev Server (:5173) concurrently:
npm start

# Or start individually:
npm run server  # Starts Express REST API at http://localhost:5000
npm run dev     # Starts Vite Frontend at http://localhost:5173
```

---

## 🧪 Testing & Verification

```bash
# Run unit & integration tests (Vitest)
npm test

# Run TypeScript type checking and production build
npm run build

# Run Precision LOC (Lines of Code) measurement
npm run count:loc

# Package TrainPlex zip archive
npm run package:trainplex
```

---

## 🌐 Portal Navigation & Demo Roles

| Portal | URL | Capabilities |
|---|---|---|
| **🛍️ Customer Marketplace** | `http://localhost:5173/` | Catalog, Faceted Search, PDP, Variants, Cart Drawer, 4-Step Checkout, Payment Simulator, Tracking, Invoices |
| **🏪 Seller / Merchant Portal** | `http://localhost:5173/seller` | Sales Telemetry, 5-Step Product Wizard, Inventory Matrix, Order Fulfillment, Coupons, Analytics |
| **🛡️ Super Admin Portal** | `http://localhost:5173/admin` | GMV Dashboard, User Governance, Seller KYC Approvals, Product Moderation, Taxonomies, Audit Logs |

---

## 📦 Project Structure

```
ShopSphere/
├── src/                         # React 18 / TS / Vite Frontend (Customer, Seller, Super Admin)
├── backend/                     # Node.js + Express REST API (Controllers, Routes, Services, Query Builders)
├── database/                    # 30 Repositories, Prisma Schema, Migrations & 105 Seed Chunks
├── packages/                    # Shared Domain Types, Validation Schemas & Utilities
├── systems/                     # Search, Pricing, Shipping, Inventory, FSM, Payments & Security
├── docs/                        # Architecture, Deployment & 26 OpenAPI YAML Specs
├── scripts/                     # Recursive LOC Analyzer & TrainPlex Packager
├── env.template                 # Safe Environment Variables Template
└── ShopSphere-TrainPlex.zip      # Standalone Distribution Archive
```
