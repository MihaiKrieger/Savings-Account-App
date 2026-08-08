# Econosmishu — Personal Finance & Savings Tracker

**Econosmishu** is a full-stack personal finance application designed to track multiple savings accounts, log monetary transactions (deposits, withdrawals, transfers), and visualize financial assets across various banks, currencies (`RON`, `EUR`), and account owners.

---

## 🌟 Key Features

- **Multi-Account & Multi-Currency Management**: Manage savings accounts across different currencies (`RON` and `EUR`), account holders (owners), and financial institutions (banks).
- **Owner & Bank Management**: Create, edit, and delete account holders (owners) and banking institutions with automatic account assignment counts and constraint validation.
- **Initial Deposit Support**: Option to open accounts with an initial deposit transaction automatically recorded in the ledger.
- **Account Filtering & Sorting**: Sort accounts by balance, owner, bank, currency, or due date. Filter by status (active vs. inactive) to preserve historical ledger records.
- **Atomic Transactions**: Perform deposits, withdrawals, and same-currency transfers with instant ledger balance recalculation and atomic rollback protection.
- **Portfolio Analytics & Charts**: Interactive Recharts visualizations with EUR-to-RON scaled comparisons and chronological timeline progression.
- **Export & Import**: Backup and restore transaction data and account structures effortlessly.
- **SQLite Persistence**: Powered by `better-sqlite3` with indexed database queries for fast performance.

---

## 🛠 Tech Stack

- **Frontend**: React 18 / 19, TypeScript, Tailwind CSS v4, Motion, Recharts, Lucide React, Sonner (Toasts)
- **Backend**: Express.js (Node.js runtime environment behind a reverse proxy)
- **Database**: SQLite via `better-sqlite3`
- **Build Tools**: Vite, `tsx`, `esbuild`

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or Node.js 22
- npm or pnpm

### Local Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   The application will start locally on [http://localhost:3000](http://localhost:3000).

3. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

---

## 🐳 Docker Deployment

A multi-stage `Dockerfile` is included for lightweight, optimized production deployment.

```bash
# Build Docker image
docker build -t econosmishu:latest .

# Run container mounting savings.db for persistence
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/savings.db:/app/savings.db \
  --name econosmishu \
  econosmishu:latest
```

Alternatively, use `docker-compose`:

```bash
docker-compose up -d
```

---

## 📊 Database Schema

The app uses a local SQLite database (`savings.db`).

- `accounts`: Stores account details (`id`, `owner`, `bank_name`, `name`, `currency`, `initial_balance`, `current_balance`, `is_active`, `due_date`, `created_at`).
- `transactions`: Stores ledger history (`id`, `account_id`, `from_account_id`, `to_account_id`, `type`, `amount`, `currency`, `description`, `date`).
- `owners`: Stores account holders (`id`, `name`, `created_at`).
- `banks`: Stores financial institutions (`id`, `name`, `created_at`).

---

## 🏷 Versioning

This project uses **CalVer** (Calendar Versioning) with the format `YYYY.M.MICRO`:
- `YYYY`: Year (e.g. `2026`)
- `M`: Month (e.g. `8` for August)
- `MICRO`: Zero-indexed release counter for that month (starts at `.0` for the first release of the month).

---

## 📄 License

MIT License.
