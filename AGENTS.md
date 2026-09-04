# Econosmishu — Master Agent Manual & Technical Specification

Welcome. This file acts as the primary source of truth (the complete context model) for the **Econosmishu** application. It is designed to be fully machine-readable, dense, and structured to allow any AI coding agent to instantly reload application context, understand architectural boundaries, and continue feature development seamlessly.

---

## 1. System Overview & Architecture

**Econosmishu** is a local full-stack personal finance application built to track multiple savings accounts, manage monetary transactions, and visualize financial assets across different banks, currencies (`RON`, `EUR`), and familial account owners.

### Technology Stack
- **Frontend Layer**: React 19 (Vite-driven SPA architecture)
- **Styling & UI**: Tailwind CSS v4, Lucide React (icon library), Motion (for smooth layout transitions and structural animations)
- **Charts / Dataviz**: Recharts (fully responsive canvas layout widgets)
- **Notification System**: Sonner (declarative toast notifications)
- **Backend Service**: Express.js server (Node.js runtime environment running behind a reverse proxy forwarding port `3000` with payload `compression` enabled)
- **Database Engine**: Local SQLite instance operated via `better-sqlite3`, reinforced with performance index schemas
- **Compiler / Bundler**: TypeScript Type Checking via `tsc`, production backend bundles via `esbuild` targeted directly to CommonJS (`.cjs`) to bypass native Node ES Module relative importing constraints.

### File Tree & Directory Map
```
/
├─ .env.example              # Environment variables template
├─ .gitignore                # Blocked build artifacts and DB files (savings.db is ignored in git, persists locally)
├─ AGENTS.md                 # [THIS FILE] Absolute master context specification for AI agents
├─ Dockerfile                # Multi-stage Docker build for production deployments (using Node 22-alpine)
├─ README.md                 # General project documentation and user overview
├─ components/               # Base UI primitives (Button, Card, Dialog, Input, Table, Sonner, etc.)
│  └─ ui/
├─ db.ts                     # Database driver, SQLite table schema definitions, and index setups
├─ index.html                # Vite HTML primary mount index
├─ package.json              # Node dependencies, scripts, and baseline version properties
├─ savings.db                # Local SQLite database binary (git-ignored, self-seeded if empty)
├─ server.ts                 # Express.js REST API service layer, asset compression, caching, & Vite middleware proxy
├─ tsconfig.json             # TypeScript structural compiler options
├─ vite.config.ts            # Vite compiler configuration utilizing @tailwindcss/vite plugins
└─ src/
   ├─ App.tsx                # Master Frontend UI shell coordinating global state, API queries, and modal controllers
   ├─ index.css              # Global styles entrypoint loading Tailwind imports
   ├─ main.tsx               # Frontend client bootstrapping entrypoint
   ├─ types.ts               # Core shared TypeScript interface definitions
   ├─ utils/
   │  └─ formatters.ts       # Shared currency, date, and mathematical formatting helpers
   └─ components/
      ├─ layout/             # Top-level shell layouts
      │  ├─ Header.tsx              # Top bar, quick actions, and mobile drawer trigger
      │  ├─ Sidebar.tsx             # Main navigation sidebar and owner/bank management triggers
      │  └─ PrivacyWelcomeModal.tsx # First-time user onboarding modal
      ├─ views/              # Primary tab views
      │  ├─ DashboardView.tsx       # Financial overview, interactive Recharts graphs, and summary cards
      │  ├─ AccountsView.tsx        # Accounts directory (desktop table & mobile cards) with sorting and filters
      │  └─ TransactionsView.tsx    # Paginated ledger with date presets, filters, search, and delete actions
      ├─ dashboard/          # Specialized Dashboard widgets & cards
      │  ├─ SummaryCards.tsx        # Total assets (RON, EUR, and aggregate portfolio valuation)
      │  ├─ PortfolioChartCard.tsx  # Recharts portfolio evolution (Area/Line with currency baseline scaling)
      │  ├─ RecentActivityCard.tsx  # Quick transaction log with badges
      │  ├─ CurrencyBalancesCard.tsx# Breakdown of liquid and invested assets by currency
      │  ├─ MaturingDepositsCard.tsx# Near-term term deposit and savings maturity countdown alerts
      │  └─ OwnerPulseCard.tsx      # Asset distribution and account ownership metrics
      └─ modals/             # Action dialogs and forms
         ├─ AddAccountModal.tsx     # Account creation modal with initial balance logging
         ├─ EditAccountModal.tsx    # Account editing modal (status, bank, maturity date, description)
         ├─ DeleteAccountModal.tsx  # Destructive account deletion confirmation dialog
         ├─ AddTransactionModal.tsx # Transaction logging modal (deposit, withdrawal, internal transfer)
         ├─ ManageOwnersModal.tsx   # Owner entity management modal (create, edit, cascade delete)
         └─ ManageBanksModal.tsx    # Bank institution entity management modal (create, edit, cascade delete)
```

---

## 2. Shared Type Interfaces (`src/types.ts`)

These TypeScript interfaces are the contract between backend API payloads and frontend React components.

```typescript
export type Currency = 'RON' | 'EUR';

export interface Account {
  id: number;
  owner: string;
  bank_name: string;
  name: string;
  description: string;
  currency: Currency;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;      // Maps to 0 or 1 in SQLite
  due_date?: string;        // Optional ISO Date/String representation of maturity
  created_at: string;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';

export interface Transaction {
  id: number;
  account_id: number;
  from_account_id?: number | null;
  to_account_id?: number | null;
  type: TransactionType;
  amount: number;
  currency: Currency;
  description: string;
  date: string;              // ISO-8601 string representation
}

export interface AnalyticsData {
  day: string;               // Format: YYYY-MM-DD
  change: number;
  currency: Currency;
  bank_name: string;
  owner: string;
}
```

---

## 3. Database Schema & Persistence Blueprint (`db.ts`)

The project uses a standard SQLite database running on `better-sqlite3` saved directly at the path defined by the `DATABASE_URL` environment variable (defaults to `savings.db`).

### Table 1: `accounts`
```sql
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL CHECK(currency IN ('RON', 'EUR')),
  initial_balance REAL DEFAULT 0,
  current_balance REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  due_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table 2: `transactions`
```sql
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER,
  from_account_id INTEGER,
  to_account_id INTEGER,
  type TEXT NOT NULL CHECK(type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER')),
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  description TEXT,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE CASCADE
);
```

### Table 3: `owners`
```sql
CREATE TABLE IF NOT EXISTS owners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table 4: `banks`
```sql
CREATE TABLE IF NOT EXISTS banks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Database Performance Optimization Indexes
To ensure high-speed query operations during heavy transactional logging, analytics groupings, and JOIN operations, the database maintains the following indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_account_id ON transactions (from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account_id ON transactions (to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
```

### Automatic Database Seeding Checks
If the `accounts` table is initialized empty on container boot or first installation:
1. Inserts seven diverse seed accounts showcasing all application capabilities:
   - Primary Savings (RON / Owner: Mihai / Institution: Banca Transilvania / High-yield liquid fund)
   - Digital Wallet & Vault (RON / Owner: Mihai / Institution: Revolut / Pocket stash & card buffers)
   - Family Emergency Fund (RON / Owner: Elena / Institution: ING Romania / 6-month safety net)
   - 12-Month Term Deposit (RON / Owner: Elena / Institution: BCR / Fixed 6.5% APY deposit with near-term maturity date)
   - EUR Holidays & Travel (EUR / Owner: Elena / Institution: Banca Transilvania / Vacation fund with future maturity date)
   - Global Investment Portfolio (EUR / Owner: Mihai / Institution: Wise / Index & ETF accumulation)
   - Auto Upgrade Stash (Closed) (RON / Owner: Mihai / Institution: ING Romania / Inactive settled account demonstrating soft-deactivation filter)
2. Automatically pre-populates `owners` and `banks` catalog tables.
3. Executes realistic multi-month transaction logs (`DEPOSIT`, `WITHDRAWAL`, `TRANSFER`) spanning across 10 distinct months, showcasing:
   - Historical multi-month chart evolution, individual currency curves, and aggregate total net worth (`Total in RON`).
   - Multi-year and month range selector capabilities in the analytics and evolution modules.
   - Internal transfer linking between accounts of the same currency (`from_account_id` and `to_account_id`).
   - Dynamic account balance tracking with exact penny rounding precision (`ROUND(x, 2)`).

---

## 4. API Endpoints Specification

Below are the operational backend API handles declared in `server.ts`. Every endpoint handles JSON payloads with proper response codes.

### Owners Resource
- **`GET /api/owners`**
  - **Returns**: `200 OK` — `Owner[]` ordered alphabetically by `name`.
- **`POST /api/owners`**
  - **Payload**: `{ name: string }`
  - **Returns**: `201 Created` — `Owner` record.
- **`PUT /api/owners/:id`**
  - **Payload**: `{ name: string }`
  - **Action**: Updates owner name and cascades to matching `accounts.owner`.
  - **Returns**: `200 OK` — Updated `Owner` record.
- **`DELETE /api/owners/:id`**
  - **Action**: Deletes owner if no active accounts are assigned to them.
  - **Returns**: `200 OK` — `{ success: true }`.

### Banks Resource
- **`GET /api/banks`**
  - **Returns**: `200 OK` — `Bank[]` ordered alphabetically by `name`.
- **`POST /api/banks`**
  - **Payload**: `{ name: string }`
  - **Returns**: `201 Created` — `Bank` record.
- **`PUT /api/banks/:id`**
  - **Payload**: `{ name: string }`
  - **Action**: Updates bank name and cascades to matching `accounts.bank_name`.
  - **Returns**: `200 OK` — Updated `Bank` record.
- **`DELETE /api/banks/:id`**
  - **Action**: Deletes bank if no active accounts are assigned to it.
  - **Returns**: `200 OK` — `{ success: true }`.

### Accounts Resource
- **`GET /api/accounts`**
  - **Returns**: `200 OK` — `Account[]` ordered strictly alphabetically by account `name`.
- **`POST /api/accounts`**
  - **Payload**: `Omit<Account, "id" | "current_balance" | "created_at">` (with optional `initial_balance` amount)
  - **Action**: Persists record inside an atomic `db.transaction`. If `initial_balance` > 0, automatically creates an initial `DEPOSIT` transaction of amount `initial_balance` with description `'Initial deposit'`, and sets `current_balance` equal to `initial_balance`. If `initial_balance` is 0 or omitted, sets `initial_balance` and `current_balance` to 0. Automatically parses boolean `is_active` flags to integers (0 or 1).
  - **Returns**: `201 Created` — The fully instantiated `Account` record.
- **`PUT /api/accounts/:id`**
  - **Payload**: `Pick<Account, "owner" | "bank_name" | "name" | "description" | "is_active" | "due_date">`
  - **Action**: Updates specified fields.
  - **Returns**: `200 OK` — `{ success: true }`
- **`DELETE /api/accounts/:id`**
  - **Action**: Removes account constraint (Cascading triggers nested transaction deletes).
  - **Returns**: `200 OK` — `{ success: true }`

### Transactions Resource
- **`GET /api/transactions`**
  - **Returns**: `200 OK` — `Transaction[]` ordered descending by date and ID.
- **`POST /api/transactions`**
  - **Payload**: `{ account_id: number; type: TransactionType; amount: number; description: string; to_account_id?: number; date?: string; }`
  - **Atomic Transaction Sequence**:
    1. Validates source and target accounts exist and are marked active (`is_active = 1`).
    2. Continues strict validation checking for `TRANSFER` operations (Requires identical currency checks. Cross-currency transfers are strictly prohibited to prevent currency conversion inaccuracies).
    3. Triggers balance updates on involved accounts based on operational transaction rules (`DEPOSIT` adds balance, `WITHDRAWAL` subtracts, `TRANSFER` deducts from source and pushes into target).
    4. Rounds numeric data parameters (`ROUND(x, 2)`) to avoid decimal float imprecision.
  - **Returns**: `201 Created` — Complete written node `Transaction`. `400 Bad Request` or `500 Server Error` on failure (atomic rollback guaranteed.

### Analytics Resource
- **`GET /api/analytics`**
  - **Payload**: Raw history aggregate.
  - **Formulated Query**:
    ```sql
    SELECT 
      date(t.date) as day,
      a.id as account_id,
      ROUND(SUM(CASE 
        WHEN type = 'DEPOSIT' THEN amount 
        WHEN type = 'WITHDRAWAL' THEN -amount 
        WHEN type = 'TRANSFER' AND account_id = a.id THEN -amount 
        WHEN type = 'TRANSFER' AND to_account_id = a.id THEN amount 
        ELSE 0 END), 2) as change,
      a.currency,
      a.bank_name,
      a.owner
    FROM transactions t
    JOIN accounts a ON (t.account_id = a.id OR t.to_account_id = a.id)
    GROUP BY day, a.id
    ORDER BY day ASC
    ```
  - **Returns**: `200 OK` — `AnalyticsData[]`.

---

## 5. Frontend & UI Engine Implementation Details

The frontend follows a clean, decoupled component architecture centered around a slim shell (`src/App.tsx`) delegating to dedicated view modules, specialized dashboard widgets, and focused action modals.

### Modular Directory Breakdown

#### 1. Application Shell (`src/App.tsx`)
`App.tsx` coordinates top-level state management, API synchronization, responsive layout transitions, and modal dialog lifecycles:
- **State Management**: Holds live lists of `accounts`, `transactions`, `analyticsData`, catalog entities (`owners`, `banks`), active navigation tab, global filter criteria, and modal visibility states.
- **REST Synchronization**: Provides atomic CRUD handler callbacks (`handleAddAccount`, `handleEditAccount`, `deleteAccount`, `handleAddTransaction`, `deleteTransaction`, `handleCreateOwner`, `handleEditOwner`, `handleDeleteOwner`, `handleCreateBank`, `handleEditBank`, `handleDeleteBank`) with Sonner toast feedback and optimistic error catching.
- **View Routing**: Renders active view panels (`DashboardView`, `AccountsView`, `TransactionsView`) within `AnimatePresence` layout transitions.

#### 2. View Modules (`src/components/views/`)
- **`DashboardView.tsx`**:
  - The primary financial control center.
  - Houses the top control bar with range filters, year selector (`All` vs specific years), month boundaries (`from` / `to`), owner toggles, and financial institution selectors.
  - Embeds key analytics widgets: `SummaryCards`, `PortfolioChartCard`, `RecentActivityCard`, `CurrencyBalancesCard`, `MaturingDepositsCard`, and `OwnerPulseCard`.
- **`AccountsView.tsx`**:
  - Comprehensive accounts management interface.
  - Dual presentation modes: Responsive desktop tabular directory and mobile card layout.
  - Advanced filtering and sorting: Filter by account status (`all`, `active`, `inactive/settled`), currency (`RON`, `EUR`), owner, or bank; sort by balance, account name, bank, owner, currency, or maturity due date.
  - Action hooks: Triggers `onEditAccount` and `onDeleteAccount` modal flows directly from rows and cards.
- **`TransactionsView.tsx`**:
  - Full-scale financial transaction ledger.
  - Incremental pagination via `visibleTxCount` ("Load More" button) to optimize DOM rendering under high transaction volumes.
  - Multi-criterion filters: Date presets (`All time`, `Last 30 days`, `Last 90 days`, `This year`, or custom date pickers), transaction types (`DEPOSIT`, `WITHDRAWAL`, `TRANSFER`), currency, owner, bank, and search keywords.
  - Safe transaction deletion with loading indicators and atomic rollback on error.

#### 3. Dashboard Component Suite (`src/components/dashboard/`)
- **`SummaryCards.tsx`**: Renders top-line summary stats: Total Holdings in RON (combining RON and EUR converted at baseline), Total EUR, and Active Account Counts with subtle trend indicators.
- **`PortfolioChartCard.tsx`**: Interactive Recharts timeline visualization supporting both Area and Line modes, currency display toggles, custom cursor tooltips, and dynamic monthly segment compression.
- **`RecentActivityCard.tsx`**: Compact chronological log displaying the latest transactions with custom iconography and color-coded amounts.
- **`CurrencyBalancesCard.tsx`**: Breakdown comparing liquid cash reserves and invested assets per currency.
- **`MaturingDepositsCard.tsx`**: Urgent alert list for term deposits maturing within 30, 60, or 90 days.
- **`OwnerPulseCard.tsx`**: Ownership distribution metrics displaying relative financial shares among family members.

#### 4. Action Modals Suite (`src/components/modals/`)
- **`AddAccountModal.tsx`**: Creates accounts with name, owner, bank, currency (`RON`/`EUR`), initial balance, and optional maturity date.
- **`EditAccountModal.tsx`**: Modifies existing account names, associated banks, owners, description notes, active status, and maturity dates.
- **`DeleteAccountModal.tsx`**: Confirmation dialog warning users about non-zero ending balances and cascaded transaction deletions before execution.
- **`AddTransactionModal.tsx`**: Logs `DEPOSIT`, `WITHDRAWAL`, or `TRANSFER` actions, automatically checking account balance sufficiency and enforcing single-currency transfer constraints.
- **`ManageOwnersModal.tsx`**: Entity manager for viewing, adding, renaming, and deleting account owners with account count safeguards.
- **`ManageBanksModal.tsx`**: Entity manager for viewing, adding, renaming, and deleting financial institutions with account count safeguards.

#### 5. Layout & Shell Components (`src/components/layout/`)
- **`Header.tsx`**: Sticky top navigation bar containing branding, quick-action transaction/account buttons, search toggle, and mobile menu toggle.
- **`Sidebar.tsx`**: Primary desktop side navigation supporting tab switching, owner filter shortcuts, and management dialog launchers.
- **`PrivacyWelcomeModal.tsx`**: Onboarding dialog highlighting local-first privacy, client storage encryption, and zero cloud tracking.

#### 6. Shared Helpers (`src/utils/formatters.ts`)
- Contains pure helper utilities: `formatCurrency(amount, currency)`, `formatDate(dateString)`, `formatShortDate(dateString)`, and `getRelativeTime(dateString)`.

---

### State Framework
- `accounts`: Complete listing of retrieved portfolios.
- `transactions`: Log history representation.
- `analyticsData`: Historic metrics array passed directly to charting utilities.
- Filters & UI Selectors:
  - `activeTab`: Dynamic toggles supporting views (`dashboard`, `saving-accounts`, `transactions`, `analytics`).
  - `selectedOwners`: Master system owner filter array supporting multi-selection.
  - `selectedBank` & `selectedCurrency`: System primary bank and currency indicators.
  - `accountsSortField`: Account sorting selector (`balance`, `owner`, `bank`, `currency`, `due_date`).
  - `accountsSortOrder`: Sort ordering (`asc` or `desc`).
  - `accountStatusFilter`: Status selector (`all`, `active`, `inactive`) allowing soft-deactivated accounts to remain in ledger history without cluttering active views.
  - `selectedYear`: Time slices supporting charting scopes (`all` or selected years).
  - `chartView`: Visualization layouts (`bar` or `line` representation).

### UI DOM & Rendering Optimizations
To ensure seamless interactions with high transaction volumes:
- **Transaction Pagination / Virtualization**: Rather than rendering the entire transaction log on a single screen, the UI uses `visibleTxCount` (starting at 50) and displays a "Load More" action button. `visibleTxCount` automatically resets to 50 when active filters (search query, types, currencies, owners, banks, sorting) change to prevent DOM overload and memory bloat.
- **Memoized Computing Engine**: Computations for statistics, account summaries, transaction filtering (`filteredTransactions`), and sliced transaction arrays (`visibleTransactions`) are wrapped inside robust `React.useMemo` Hooks. Redundant, heavy linear array scans are completely bypassed.
- **Account Dictionary Map**: Inside `src/App.tsx`, a pre-calculated `accountsMap` dictionary (`Map<number, Account>`) is computed and memoized to replace nested `.find()` operations with fast $O(1)$ key-value lookups when pairing transactions with their associated account data.

### Asset Aggregations Formulations
- **Individual Currency Balances**: Sum totals parsed from items sharing matching `currency` designations.
- **Portfolio Evolution Line & Bar Coordinates**:
    1. Instantiates baseline balance records for all registered accounts (`initial_balance` acting as day-0).
    2. Iterates chronologically through analytics records fetched from `/api/analytics`.
    3. Reconstructs day-by-day balance trajectories across owners, individual currencies (`RON`, `EUR`), and aggregate total holdings (`Total_RON`) to feed into the SVG Responsive Recharts grids.
- **Aggregate Total Valuation in RON**: Combines individual RON balances and EUR balances converted to RON (`EUR_scaled`) to produce a synchronized aggregate balance line (`Total_RON`), preventing graph skew when transferring/exchanging funds between currencies.
- **Visual Scale Proportioning (EUR to RON Baseline)**: Since EUR and RON balances have vastly different orders of magnitude, the graph converts EUR values to a RON baseline for display purposes (`EUR_scaled`) using the live API stream rate (or a `0.201` fallback). Tooltips are customized to render the original EUR balance while providing the RON-scaled display equivalent in parentheses.
- **Empty Timeline Curation**: To prevent visual clutter and long "flat-line" periods where no transaction or balance changes occurs, any monthly segment in the timeline without recorded transaction changes is filtered out dynamically under the "All Years" view.
- **Unified Charts**: The "Portfolio Evolution" card displays historical holdings, using custom cursor tools, grid patterns, soft colors, and a clean configuration.

---

## 6. Visual Design System

Econosmishu implements an elegant, responsive design philosophy built to represent financial assets cleanly.

- **Typography Core Rules**:
  - Main User Interface: **Inter** representation (`font-sans text-slate-800`). Highly balanced trackings and optimized contrasts.
  - Financial Balances & Codes: **JetBrains Mono** representation (`font-mono text-sm tracking-tight`) to ensure tabular visual precision of currency strings and math readouts.
- **Visual Grid System**: Custom margins, responsive spacing, and light panels using glassmorphism layouts (`bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden group`). Highly optimized for desktop screens while maintaining touch support targets (>44px) on mobile viewports.
- **Core Micro-Animations**: Interactive hover transforms (`hover:scale-[1.02] transition-transform duration-200`) and staggered element visual entrance fades.

---

## 7. Versioning & Operational Principles

### Versioning Rules
The application strictly follows **CalVer** (Calendar Versioning) using the format `YYYY.M.MICRO` (e.g. `2026.9.1`).
- **Format**: `YYYY` = 4-digit Year (e.g., `2026`), `M` = Month without leading zero (e.g., `9` for September), `MICRO` = Release index for that month starting at `.0` for the first release of the month.
- **First Release Indexing Rule**: The first update/release of any given calendar month resets the `MICRO` counter to `0` (e.g., `2026.9.0`).
- **Subsequent Monthly Releases**: Each subsequent update within the same month increments the `MICRO` index by 1 (`2026.9.1`, `2026.9.2`, etc.).
- **Synchronization**: Every version change must be updated concurrently in `/package.json` **AND** inside `src/App.tsx` (`APP_VERSION` constant).

### Production Environment Safety (Dockerfile & server.ts)
- **CJS Bundle Compatibility**: To handle esbuild's bundling of `server.ts` into a standalone CommonJS `dist/server.cjs` file, runtime path resolutions are secured by fallback try-catch scopes to prevent invalid global exceptions for `import.meta.url`, `__filename`, and `__dirname`.
- **Multi-Stage Docker Setup**: Docker-compose builds use a builder step (Alpine Node, build-essentials Python/Make/G++ for native SQLite compilations) and copy output assets onto a secure, minimal run stage running under Native Node (minimizing image size, cold-boot lag, and execution overhead).
- **Asset compression**: Network payload sizes are optimized through Gzip asset compression via the `compression` Express middleware.
- **Static asset cache policy**: Static static assets in production (`/dist`) are served with an immutable 1-year cache configuration, except for the HTML entrypoint (`index.html`) which remains fresh with `no-cache, no-store, must-revalidate`.

### Instructions for AI Session Continuation
If context has been wiped or a new session is being created:
1. Examine this file completely.
2. Read the current values of `/package.json` and ensure synchronization.
3. Call `lint_applet` followed by `compile_applet` to check that the container runtime environments are valid and ready.
4. Execute features directly, keeping types, validations, and SQLite data rounding operations strict.
