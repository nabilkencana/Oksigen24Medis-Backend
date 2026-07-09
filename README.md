# Oxygen Rental Management System - Backend REST API

This is the production-ready NestJS backend for the **Oxygen Rental Management System**. It features a robust, normalized database design using Prisma ORM, role-based access control (RBAC), and a unified **Stock Movement engine** as the single source of truth for physical inventory.

---

## Technical Stack
- **Framework**: NestJS (v11)
- **Language**: TypeScript
- **ORM**: Prisma (v6)
- **Database**: PostgreSQL (Supabase Ready)
- **Authentication**: JWT & Refresh Tokens with Passport
- **Documentation**: Swagger API Specs
- **Security**: Helmet, Throttler (Rate Limiting), ValidationPipe
- **Performance**: Compression (Gzip)
- **Containerization**: Docker & Docker Compose

---

## Directory Architecture
The project is built using a feature-based architecture and adheres to the Controller-Service-Repository pattern:
```
src/
├── auth/                  # Authentication endpoints (login, refresh, logout, change-password)
├── users/                 # User management CRUD & Role mappings
├── dashboard/             # Statistics aggregate API (KPIs, graphs, active rentals counts)
├── inventory/             # Customers, Vendors, Products, Cylinders, and OxygenTypes CRUD
├── transactions/          # Lease, Return, Refill, Sale, Restock + StockMovement logs
├── finance/               # Incomes, Expenses, and Cash Flow summaries
├── reports/               # Custom reporting API (date range aggregates, timeline charts)
├── settings/              # Company configuration key-value store
├── common/                # Shared filters, interceptors, decorators, guards, pagination DTOs
├── config/                # Environment variables schema and validation
├── database/              # Global PrismaService container
└── main.ts                # App entrypoint and global middlewares
```

---

## Database Design: Stock Movement Engine
Unlike traditional architectures where rentals, sales, and refills exist as disconnected datasets, this system uses a **Stock Movement** center:
- Every action (Rental, Return, Sale, Restock, Vendor Refill) writes a record into `StockMovement`.
- This ensures 100% accurate historical stock tracing and makes audits effortless.
- **Strict Validations**: Product stocks can never drop below zero. Cylinders must be in the `AVAILABLE` state to be leased.

---

## Installation & Setup

### 1. Prerequisites
- Node.js (v18 or v20+)
- Docker (optional, for local PostgreSQL database)

### 2. Configure Environment
Clone the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Ensure that the `DATABASE_URL` is set correctly. If you want to spin up a local PostgreSQL database using Docker, you can run:
```bash
docker-compose up -d
```
Then use the following connection string:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/oxygen_db?schema=public"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seeding
Run Prisma migrations to create the database schemas:
```bash
npx prisma db push
```
*(Note: Use `npx prisma migrate dev` in staging/production for official migration files)*.

To populate the database with seed data (Default roles, Owner/Admin/Finance/Warehouse users, initial products, and cylinder records):
```bash
npx prisma db seed
```
**Seed User Logins (Password for all: `Password123!`):**
- **Owner**: `owner@medis24.com`
- **Admin**: `admin@medis24.com`
- **Finance**: `finance@medis24.com`
- **Warehouse**: `warehouse@medis24.com`

---

## Running the Application

```bash
# Start in development (hot reload watch mode)
npm run start:dev

# Build compilation
npm run build

# Start in production mode
npm run start:prod
```

Once running, access the Interactive Swagger documentation at:
**[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

---

## Docker Execution
To run the entire NestJS application and PostgreSQL container under Docker:
```bash
docker build -t oxygen-backend .
docker-compose up -d
```
