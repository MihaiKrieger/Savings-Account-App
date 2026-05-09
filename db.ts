import 'dotenv/config';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL.replace('file:', '') 
  : 'savings.db';

// Ensure directory exists if path contains '/'
const dbDir = path.dirname(dbPath);
if (dbDir !== '.' && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

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

// Seed initial accounts if empty
const count = db.prepare('SELECT count(*) as count FROM accounts').get() as { count: number };
if (count.count === 0) {
  const accountsData = [
    { owner: 'Mihai', bank_name: 'Main Bank', name: 'Primary Savings', description: 'Main savings account', currency: 'RON', initial_balance: 5000, current_balance: 5000, due_date: '2026-12-31' },
    { owner: 'Mihai', bank_name: 'Revolut', name: 'Digital Wallet', description: 'Daily expenses and subscriptions', currency: 'RON', initial_balance: 1200, current_balance: 1200, due_date: null },
    { owner: 'Elena', bank_name: 'ING Romania', name: 'Family Savings', description: 'Shared family emergency fund', currency: 'RON', initial_balance: 8500, current_balance: 8500, due_date: '2026-06-15' },
    { owner: 'Elena', bank_name: 'BT (Banca Transilvania)', name: 'EUR Holidays', description: 'Vacation and travel fund', currency: 'EUR', initial_balance: 2000, current_balance: 2000, due_date: '2026-07-20' },
    { owner: 'Mihai', bank_name: 'Wise', name: 'Global Investment', description: 'International investment portofolio', currency: 'EUR', initial_balance: 4500, current_balance: 4500, due_date: '2027-01-10' }
  ];

  const insertAccount = db.prepare(`
    INSERT INTO accounts (owner, bank_name, name, description, currency, initial_balance, current_balance, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const accountIds: number[] = [];
  accountsData.forEach(acc => {
    const info = insertAccount.run(acc.owner, acc.bank_name, acc.name, acc.description, acc.currency, acc.initial_balance, acc.current_balance, acc.due_date);
    accountIds.push(info.lastInsertRowid as number);
  });

  // Add some initial transactions to populate charts
  const insertTx = db.prepare(`
    INSERT INTO transactions (account_id, type, amount, currency, description, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const updateBalance = (id: number, amount: number, type: 'DEPOSIT' | 'WITHDRAWAL') => {
    if (type === 'DEPOSIT') {
      db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?').run(amount, id);
    } else {
      db.prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?').run(amount, id);
    }
  };

  const now = new Date();
  
  // Account 1: Primary Savings growth
  for (let i = 25; i >= 0; i -= 5) {
    const txDate = new Date(now);
    txDate.setDate(now.getDate() - i);
    const amount = 500 + Math.random() * 200;
    insertTx.run(accountIds[0], 'DEPOSIT', amount, 'RON', 'Monthly Contribution', txDate.toISOString());
    updateBalance(accountIds[0], amount, 'DEPOSIT');
  }

  // Account 2: Revolut activity
  for (let i = 20; i >= 0; i -= 3) {
    const txDate = new Date(now);
    txDate.setDate(now.getDate() - i);
    const isWithdrawal = Math.random() > 0.4;
    const amount = 50 + Math.random() * 150;
    const type = isWithdrawal ? 'WITHDRAWAL' : 'DEPOSIT';
    insertTx.run(accountIds[1], type, amount, 'RON', isWithdrawal ? 'Supermarket' : 'Pocket money', txDate.toISOString());
    updateBalance(accountIds[1], amount, type);
  }

  // Account 3: Family Savings
  const bonusDate = new Date(now);
  bonusDate.setDate(now.getDate() - 15);
  insertTx.run(accountIds[2], 'DEPOSIT', 2500, 'RON', 'Annual Bonus', bonusDate.toISOString());
  updateBalance(accountIds[2], 2500, 'DEPOSIT');

  // Account 4: EUR Holiday growth
  const holidayDate = new Date(now);
  holidayDate.setDate(now.getDate() - 10);
  insertTx.run(accountIds[3], 'DEPOSIT', 300, 'EUR', 'Holiday savings', holidayDate.toISOString());
  updateBalance(accountIds[3], 300, 'DEPOSIT');
}

export default db;
