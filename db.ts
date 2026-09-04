import 'dotenv/config';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let dbPath = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL.replace('file:', '') 
  : 'savings.db';

let db: InstanceType<typeof Database>;

try {
  const dbDir = path.dirname(dbPath);
  if (dbDir !== '.' && !fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  db = new Database(dbPath);
} catch (err) {
  console.warn(`Could not open database at "${dbPath}", falling back to "./savings.db":`, err);
  dbPath = 'savings.db';
  try {
    db = new Database(dbPath);
  } catch (fallbackErr) {
    console.warn('Could not open "./savings.db", falling back to "/tmp/savings.db":', fallbackErr);
    dbPath = path.join('/tmp', 'savings.db');
    db = new Database(dbPath);
  }
}

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
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

  CREATE TABLE IF NOT EXISTS owners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS banks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Populate owners and banks tables with any existing account owners and banks
db.exec(`
  INSERT OR IGNORE INTO owners (name)
  SELECT DISTINCT owner FROM accounts WHERE owner IS NOT NULL AND TRIM(owner) != '';

  INSERT OR IGNORE INTO banks (name)
  SELECT DISTINCT bank_name FROM accounts WHERE bank_name IS NOT NULL AND TRIM(bank_name) != '';
`);

// Migration for existing tables
const tableInfo = db.prepare("PRAGMA table_info(accounts)").all() as any[];
if (!tableInfo.some(col => (col as any).name === 'is_active')) {
  db.exec("ALTER TABLE accounts ADD COLUMN is_active INTEGER DEFAULT 1");
}
if (!tableInfo.some(col => (col as any).name === 'due_date')) {
  db.exec("ALTER TABLE accounts ADD COLUMN due_date TEXT");
}

db.exec(`
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
`);

// Add indexes to optimize JOIN operations, foreign key constraints, and analytics grouping
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions (account_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_from_account_id ON transactions (from_account_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_to_account_id ON transactions (to_account_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
`);

// Seed initial accounts if empty
const count = db.prepare('SELECT count(*) as count FROM accounts').get() as { count: number };
if (count.count === 0) {
  // Helper functions to generate realistic dates across previous months and future maturities
  const getHistoricalDate = (monthsAgo: number, dayOfMonth: number, hour: number = 10, minute: number = 0): string => {
    const d = new Date();
    d.setDate(1); // avoid month rollover
    d.setMonth(d.getMonth() - monthsAgo);
    const maxDay = monthsAgo === 0 
      ? Math.max(1, Math.min(dayOfMonth, new Date().getDate())) 
      : Math.min(dayOfMonth, 28);
    d.setDate(maxDay);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  const getFutureDate = (monthsAhead: number, dayOfMonth: number): string => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthsAhead);
    d.setDate(Math.min(dayOfMonth, 28));
    return d.toISOString().split('T')[0];
  };

  const getPastDate = (monthsAgo: number, dayOfMonth: number): string => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - monthsAgo);
    d.setDate(Math.min(dayOfMonth, 28));
    return d.toISOString().split('T')[0];
  };

  const accountsData = [
    {
      owner: 'Mihai',
      bank_name: 'Banca Transilvania',
      name: 'Primary Savings',
      description: 'High-yield liquid savings fund for planned projects',
      currency: 'RON',
      initial_balance: 6500,
      current_balance: 6500,
      is_active: 1,
      due_date: null
    },
    {
      owner: 'Mihai',
      bank_name: 'Revolut',
      name: 'Digital Wallet & Vault',
      description: 'Daily expenses, roundups & card buffers',
      currency: 'RON',
      initial_balance: 1400,
      current_balance: 1400,
      is_active: 1,
      due_date: null
    },
    {
      owner: 'Elena',
      bank_name: 'ING Romania',
      name: 'Family Emergency Fund',
      description: '6-month living expenses safety net',
      currency: 'RON',
      initial_balance: 12000,
      current_balance: 12000,
      is_active: 1,
      due_date: null
    },
    {
      owner: 'Elena',
      bank_name: 'BCR',
      name: '12-Month Term Deposit',
      description: 'Fixed 6.5% APY deposit maturing soon',
      currency: 'RON',
      initial_balance: 25000,
      current_balance: 25000,
      is_active: 1,
      due_date: getFutureDate(3, 15)
    },
    {
      owner: 'Elena',
      bank_name: 'Banca Transilvania',
      name: 'EUR Holidays & Travel',
      description: 'Dedicated vacation, flights & city breaks stash',
      currency: 'EUR',
      initial_balance: 2400,
      current_balance: 2400,
      is_active: 1,
      due_date: getFutureDate(10, 20)
    },
    {
      owner: 'Mihai',
      bank_name: 'Wise',
      name: 'Global Investment Portfolio',
      description: 'Diversified European ETF & index accumulation vault',
      currency: 'EUR',
      initial_balance: 4500,
      current_balance: 4500,
      is_active: 1,
      due_date: null
    },
    {
      owner: 'Mihai',
      bank_name: 'ING Romania',
      name: 'Auto Upgrade Stash (Closed)',
      description: 'Completed savings goal; settled upon vehicle purchase',
      currency: 'RON',
      initial_balance: 0,
      current_balance: 0,
      is_active: 0,
      due_date: getPastDate(8, 1)
    }
  ];

  const insertAccount = db.prepare(`
    INSERT INTO accounts (owner, bank_name, name, description, currency, initial_balance, current_balance, is_active, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const accountIds: number[] = [];
  accountsData.forEach(acc => {
    const info = insertAccount.run(
      acc.owner, 
      acc.bank_name, 
      acc.name, 
      acc.description, 
      acc.currency, 
      acc.initial_balance, 
      acc.current_balance, 
      acc.is_active, 
      acc.due_date
    );
    accountIds.push(info.lastInsertRowid as number);
  });

  // Ensure owners and banks tables are fully populated
  db.exec(`
    INSERT OR IGNORE INTO owners (name)
    SELECT DISTINCT owner FROM accounts WHERE owner IS NOT NULL AND TRIM(owner) != '';

    INSERT OR IGNORE INTO banks (name)
    SELECT DISTINCT bank_name FROM accounts WHERE bank_name IS NOT NULL AND TRIM(bank_name) != '';
  `);

  // Transaction insertion and balance updating helpers
  const insertTx = db.prepare(`
    INSERT INTO transactions (account_id, from_account_id, to_account_id, type, amount, currency, description, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateAccountBalance = (id: number, delta: number) => {
    db.prepare('UPDATE accounts SET current_balance = ROUND(current_balance + ?, 2) WHERE id = ?').run(delta, id);
  };

  const addDeposit = (accId: number, amount: number, currency: string, description: string, date: string) => {
    insertTx.run(accId, null, null, 'DEPOSIT', amount, currency, description, date);
    updateAccountBalance(accId, amount);
  };

  const addWithdrawal = (accId: number, amount: number, currency: string, description: string, date: string) => {
    insertTx.run(accId, null, null, 'WITHDRAWAL', amount, currency, description, date);
    updateAccountBalance(accId, -amount);
  };

  const addTransfer = (fromAccId: number, toAccId: number, amount: number, currency: string, description: string, date: string) => {
    insertTx.run(fromAccId, fromAccId, toAccId, 'TRANSFER', amount, currency, description, date);
    updateAccountBalance(fromAccId, -amount);
    updateAccountBalance(toAccId, amount);
  };

  const [accPrimary, accRevolut, accFamily, accTerm, accEurHolidays, accEurInvest] = accountIds;

  // -------------------------------------------------------------
  // Pre-populated transactions spanning multiple past months
  // to showcase multi-month graph evolution, filtering, & categories
  // -------------------------------------------------------------

  // 9 Months Ago
  addDeposit(accPrimary, 850, 'RON', 'Monthly savings contribution', getHistoricalDate(9, 8, 9, 30));
  addDeposit(accEurHolidays, 250, 'EUR', 'Holiday savings allocation', getHistoricalDate(9, 14, 11, 15));
  addTransfer(accPrimary, accRevolut, 300, 'RON', 'Monthly wallet replenishment', getHistoricalDate(9, 22, 16, 0));

  // 8 Months Ago
  addDeposit(accFamily, 1200, 'RON', 'New Year emergency fund boost', getHistoricalDate(8, 5, 10, 0));
  addDeposit(accPrimary, 900, 'RON', 'Monthly savings contribution', getHistoricalDate(8, 12, 14, 20));
  addWithdrawal(accRevolut, 180, 'RON', 'Household maintenance & repairs', getHistoricalDate(8, 18, 18, 45));
  addDeposit(accEurInvest, 400, 'EUR', 'Quarterly ETF allocation', getHistoricalDate(8, 26, 12, 10));

  // 7 Months Ago
  addDeposit(accPrimary, 1500, 'RON', 'Annual performance bonus', getHistoricalDate(7, 9, 11, 0));
  addWithdrawal(accEurHolidays, 320, 'EUR', 'Ski weekend trip booking', getHistoricalDate(7, 14, 15, 30));
  addTransfer(accRevolut, accFamily, 250, 'RON', 'Budget surplus transfer', getHistoricalDate(7, 20, 17, 0));
  addDeposit(accFamily, 800, 'RON', 'Regular monthly savings', getHistoricalDate(7, 27, 9, 45));

  // 6 Months Ago
  addDeposit(accPrimary, 850, 'RON', 'Monthly savings contribution', getHistoricalDate(6, 7, 10, 15));
  addDeposit(accEurHolidays, 300, 'EUR', 'Spring holiday savings boost', getHistoricalDate(6, 15, 13, 0));
  addWithdrawal(accPrimary, 450, 'RON', 'Annual vehicle tax & insurance', getHistoricalDate(6, 21, 16, 30));
  addDeposit(accEurInvest, 350, 'EUR', 'Monthly ETF index investment', getHistoricalDate(6, 27, 12, 0));

  // 5 Months Ago
  addDeposit(accFamily, 1000, 'RON', 'Family savings allocation', getHistoricalDate(5, 6, 11, 15));
  addTransfer(accPrimary, accRevolut, 400, 'RON', 'Easter family shopping buffer', getHistoricalDate(5, 14, 14, 45));
  addWithdrawal(accRevolut, 220, 'RON', 'Home decor & gardening supplies', getHistoricalDate(5, 18, 17, 20));
  addDeposit(accPrimary, 850, 'RON', 'Monthly savings contribution', getHistoricalDate(5, 25, 9, 30));

  // 4 Months Ago
  addDeposit(accPrimary, 1200, 'RON', 'Freelance consulting milestone', getHistoricalDate(4, 8, 10, 45));
  addDeposit(accEurHolidays, 400, 'EUR', 'Summer holiday fund allocation', getHistoricalDate(4, 15, 13, 10));
  addWithdrawal(accEurHolidays, 550, 'EUR', 'Summer flight tickets booking', getHistoricalDate(4, 22, 19, 0));
  addDeposit(accEurInvest, 500, 'EUR', 'Semi-annual portfolio rebalance', getHistoricalDate(4, 28, 12, 30));

  // 3 Months Ago
  addDeposit(accFamily, 1400, 'RON', 'Mid-year family bonus', getHistoricalDate(3, 5, 9, 15));
  addDeposit(accPrimary, 950, 'RON', 'Monthly savings contribution', getHistoricalDate(3, 12, 14, 0));
  addWithdrawal(accRevolut, 160, 'RON', 'Summer sports gear', getHistoricalDate(3, 18, 16, 40));
  addTransfer(accPrimary, accFamily, 600, 'RON', 'Emergency fund top-up', getHistoricalDate(3, 24, 11, 30));

  // 2 Months Ago
  addWithdrawal(accEurHolidays, 650, 'EUR', 'Holiday accommodation & resort stay', getHistoricalDate(2, 8, 12, 20));
  addDeposit(accPrimary, 950, 'RON', 'Monthly savings contribution', getHistoricalDate(2, 15, 10, 0));
  addDeposit(accFamily, 800, 'RON', 'Monthly family contribution', getHistoricalDate(2, 21, 15, 15));
  addDeposit(accEurInvest, 350, 'EUR', 'Monthly ETF index investment', getHistoricalDate(2, 27, 13, 0));

  // 1 Month Ago
  addDeposit(accEurHolidays, 300, 'EUR', 'Late summer getaway savings', getHistoricalDate(1, 5, 11, 30));
  addDeposit(accPrimary, 1000, 'RON', 'Monthly savings contribution', getHistoricalDate(1, 11, 10, 15));
  addTransfer(accPrimary, accRevolut, 350, 'RON', 'Back-to-school buffer', getHistoricalDate(1, 17, 14, 45));
  addWithdrawal(accRevolut, 190, 'RON', 'Stationery & books', getHistoricalDate(1, 22, 16, 0));
  addDeposit(accFamily, 850, 'RON', 'Monthly emergency buffer deposit', getHistoricalDate(1, 28, 9, 30));

  // Current Month (Past few days)
  addDeposit(accPrimary, 1100, 'RON', 'Salary savings allocation', getHistoricalDate(0, 1, 9, 0));
  addDeposit(accEurInvest, 450, 'EUR', 'Monthly ETF accumulation', getHistoricalDate(0, 2, 12, 15));
  addDeposit(accEurHolidays, 200, 'EUR', 'Autumn weekend trip savings', getHistoricalDate(0, 3, 15, 0));
}

export default db;
