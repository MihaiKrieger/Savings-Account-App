import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

let _filename = '';
let _dirname = '';

try {
  _filename = fileURLToPath(import.meta.url);
  _dirname = path.dirname(_filename);
} catch {
  try {
    _filename = __filename;
    _dirname = __dirname;
  } catch {}
}

async function startServer() {
  const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(compression());
  app.use(express.json());

  // --- API Routes ---

  // Owners
  app.get('/api/owners', (req, res) => {
    try {
      db.exec(`
        INSERT OR IGNORE INTO owners (name)
        SELECT DISTINCT owner FROM accounts WHERE owner IS NOT NULL AND TRIM(owner) != '';
      `);
      const owners = db.prepare('SELECT * FROM owners ORDER BY name ASC').all();
      res.json(owners);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch owners' });
    }
  });

  app.post('/api/owners', (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Owner name is required' });
    }
    const trimmed = name.trim();
    try {
      const info = db.prepare('INSERT INTO owners (name) VALUES (?)').run(trimmed);
      const newOwner = db.prepare('SELECT * FROM owners WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json(newOwner);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE')) {
        return res.status(400).json({ error: `An owner named "${trimmed}" already exists` });
      }
      res.status(500).json({ error: 'Failed to create owner' });
    }
  });

  app.put('/api/owners/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Owner name is required' });
    }
    const trimmed = name.trim();
    try {
      const updated = db.transaction(() => {
        const current = db.prepare('SELECT name FROM owners WHERE id = ?').get(id) as { name: string } | undefined;
        if (!current) {
          throw new Error('Owner not found');
        }
        const oldName = current.name;
        db.prepare('UPDATE owners SET name = ? WHERE id = ?').run(trimmed, id);
        db.prepare('UPDATE accounts SET owner = ? WHERE owner = ?').run(trimmed, oldName);
        return db.prepare('SELECT * FROM owners WHERE id = ?').get(id);
      })();
      res.json(updated);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE')) {
        return res.status(400).json({ error: `An owner named "${trimmed}" already exists` });
      }
      res.status(400).json({ error: error.message || 'Failed to update owner' });
    }
  });

  app.delete('/api/owners/:id', (req, res) => {
    const { id } = req.params;
    try {
      const current = db.prepare('SELECT name FROM owners WHERE id = ?').get(id) as { name: string } | undefined;
      if (!current) {
        return res.status(404).json({ error: 'Owner not found' });
      }
      const accountCount = db.prepare('SELECT count(*) as count FROM accounts WHERE owner = ?').get(current.name) as { count: number };
      if (accountCount.count > 0) {
        return res.status(400).json({ 
          error: `Cannot delete owner "${current.name}" because ${accountCount.count} account(s) are assigned to them.` 
        });
      }
      db.prepare('DELETE FROM owners WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete owner' });
    }
  });

  // Banks
  app.get('/api/banks', (req, res) => {
    try {
      db.exec(`
        INSERT OR IGNORE INTO banks (name)
        SELECT DISTINCT bank_name FROM accounts WHERE bank_name IS NOT NULL AND TRIM(bank_name) != '';
      `);
      const banks = db.prepare('SELECT * FROM banks ORDER BY name ASC').all();
      res.json(banks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch banks' });
    }
  });

  app.post('/api/banks', (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Bank name is required' });
    }
    const trimmed = name.trim();
    try {
      const info = db.prepare('INSERT INTO banks (name) VALUES (?)').run(trimmed);
      const newBank = db.prepare('SELECT * FROM banks WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json(newBank);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE')) {
        return res.status(400).json({ error: `A bank named "${trimmed}" already exists` });
      }
      res.status(500).json({ error: 'Failed to create bank' });
    }
  });

  app.put('/api/banks/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Bank name is required' });
    }
    const trimmed = name.trim();
    try {
      const updated = db.transaction(() => {
        const current = db.prepare('SELECT name FROM banks WHERE id = ?').get(id) as { name: string } | undefined;
        if (!current) {
          throw new Error('Bank not found');
        }
        const oldName = current.name;
        db.prepare('UPDATE banks SET name = ? WHERE id = ?').run(trimmed, id);
        db.prepare('UPDATE accounts SET bank_name = ? WHERE bank_name = ?').run(trimmed, oldName);
        return db.prepare('SELECT * FROM banks WHERE id = ?').get(id);
      })();
      res.json(updated);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE')) {
        return res.status(400).json({ error: `A bank named "${trimmed}" already exists` });
      }
      res.status(400).json({ error: error.message || 'Failed to update bank' });
    }
  });

  app.delete('/api/banks/:id', (req, res) => {
    const { id } = req.params;
    try {
      const current = db.prepare('SELECT name FROM banks WHERE id = ?').get(id) as { name: string } | undefined;
      if (!current) {
        return res.status(404).json({ error: 'Bank not found' });
      }
      const accountCount = db.prepare('SELECT count(*) as count FROM accounts WHERE bank_name = ?').get(current.name) as { count: number };
      if (accountCount.count > 0) {
        return res.status(400).json({ 
          error: `Cannot delete bank "${current.name}" because ${accountCount.count} account(s) are assigned to it.` 
        });
      }
      db.prepare('DELETE FROM banks WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete bank' });
    }
  });

  // Accounts
  app.get('/api/accounts', (req, res) => {
    try {
      const accounts = db.prepare('SELECT * FROM accounts ORDER BY name').all();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  });

  app.post('/api/accounts', (req, res) => {
    const { owner, bank_name, name, description, currency, initial_balance, is_active, due_date } = req.body;
    const initialAmount = Number(initial_balance) || 0;
    try {
      const newAccount = db.transaction(() => {
        const info = db.prepare(`
          INSERT INTO accounts (owner, bank_name, name, description, currency, initial_balance, current_balance, is_active, due_date)
          VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)
        `).run(owner, bank_name, name, description, currency, is_active === false ? 0 : 1, due_date || null);
        
        const accountId = info.lastInsertRowid;

        if (initialAmount > 0) {
          const nowISO = new Date().toISOString();
          db.prepare(`
            INSERT INTO transactions (account_id, type, amount, currency, description, date)
            VALUES (?, 'DEPOSIT', ?, ?, 'Initial deposit', ?)
          `).run(accountId, initialAmount, currency, nowISO);

          db.prepare(`
            UPDATE accounts SET current_balance = ROUND(?, 2) WHERE id = ?
          `).run(initialAmount, accountId);
        }

        return db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);
      })();

      res.status(201).json(newAccount);
    } catch (error) {
      console.error('Failed to create account:', error);
      res.status(500).json({ error: 'Failed to create account' });
    }
  });

  app.put('/api/accounts/:id', (req, res) => {
    const { id } = req.params;
    const { owner, bank_name, name, description, is_active, due_date } = req.body;
    try {
      db.prepare(`
        UPDATE accounts SET owner = ?, bank_name = ?, name = ?, description = ?, is_active = ?, due_date = ?
        WHERE id = ?
      `).run(owner, bank_name, name, description, is_active === false ? 0 : 1, due_date || null, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update account' });
    }
  });

  app.delete('/api/accounts/:id', (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete account' });
    }
  });

  // Transactions
  app.get('/api/transactions', (req, res) => {
    try {
      const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC, id DESC').all();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  app.post('/api/transactions', (req, res) => {
    const { account_id, type, amount, description, to_account_id, date } = req.body;
    
    const transaction = db.transaction(() => {
      // 1. Validate Account Existence, Activity and Currency
      const fromAcc = db.prepare('SELECT currency, is_active FROM accounts WHERE id = ?').get(account_id) as { currency: string, is_active: number } | undefined;
      if (!fromAcc) {
        throw new Error(`Source account (ID: ${account_id}) not found`);
      }
      if (!fromAcc.is_active) {
        throw new Error(`Source account is inactive`);
      }

      if (type === 'TRANSFER') {
        if (!to_account_id) {
          throw new Error('Target account is required for transfers');
        }
        const toAcc = db.prepare('SELECT currency, is_active FROM accounts WHERE id = ?').get(to_account_id) as { currency: string, is_active: number } | undefined;
        
        if (!toAcc) {
          throw new Error(`Target account (ID: ${to_account_id}) not found`);
        }
        if (!toAcc.is_active) {
          throw new Error(`Target account is inactive`);
        }
        
        if (fromAcc.currency !== toAcc.currency) {
          throw new Error(`Transfer between different currencies (${fromAcc.currency} to ${toAcc.currency}) is not allowed`);
        }
      }

      // 2. Log Transaction
      // If date is provided as YYYY-MM-DD, append the current time to ensure proper sorting
      const txDate = date 
        ? (date.length === 10 ? `${date}T${new Date().toISOString().split('T')[1]}` : date) 
        : new Date().toISOString();
      
      const info = db.prepare(`
        INSERT INTO transactions (account_id, from_account_id, to_account_id, type, amount, currency, description, date)
        SELECT ?, ?, ?, ?, ?, currency, ?, ? FROM accounts WHERE id = ?
      `).run(account_id, type === 'TRANSFER' ? account_id : null, to_account_id || null, type, amount, description, txDate, account_id);

      // 2. Update Balances
      if (type === 'DEPOSIT') {
        db.prepare('UPDATE accounts SET current_balance = ROUND(current_balance + ?, 2) WHERE id = ?').run(amount, account_id);
      } else if (type === 'WITHDRAWAL') {
        db.prepare('UPDATE accounts SET current_balance = ROUND(current_balance - ?, 2) WHERE id = ?').run(amount, account_id);
      } else if (type === 'TRANSFER') {
        // Subtract from source
        db.prepare('UPDATE accounts SET current_balance = ROUND(current_balance - ?, 2) WHERE id = ?').run(amount, account_id);
        // Add to target
        db.prepare('UPDATE accounts SET current_balance = ROUND(current_balance + ?, 2) WHERE id = ?').run(amount, to_account_id);
      }
      
      return info.lastInsertRowid;
    });

    try {
      const txId = transaction();
      const newTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
      res.status(201).json(newTx);
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ error: error.message || 'Failed to process transaction' });
    }
  });

  app.delete('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    
    const deletion = db.transaction(() => {
      // 1. Get transaction info
      const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as {
        id: number;
        account_id: number;
        to_account_id: number | null;
        type: string;
        amount: number;
      } | undefined;

      if (!tx) {
        throw new Error(`Transaction with ID ${id} not found`);
      }

      // 2. Reverse balance changes on accounts
      if (tx.type === 'DEPOSIT') {
        db.prepare('UPDATE accounts SET current_balance = ROUND(current_balance - ?, 2) WHERE id = ?').run(tx.amount, tx.account_id);
      } else if (tx.type === 'WITHDRAWAL') {
        db.prepare('UPDATE accounts SET current_balance = ROUND(current_balance + ?, 2) WHERE id = ?').run(tx.amount, tx.account_id);
      } else if (tx.type === 'TRANSFER') {
        // Refund source account
        db.prepare('UPDATE accounts SET current_balance = ROUND(current_balance + ?, 2) WHERE id = ?').run(tx.amount, tx.account_id);
        // Deduct from target account
        if (tx.to_account_id) {
          db.prepare('UPDATE accounts SET current_balance = ROUND(current_balance - ?, 2) WHERE id = ?').run(tx.amount, tx.to_account_id);
        }
      }

      // 3. Delete the transaction
      db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    });

    try {
      deletion();
      res.json({ success: true });
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ error: error.message || 'Failed to delete transaction' });
    }
  });

  // Analytics: Balance evolution (simplified: just summary per day)
  app.get('/api/analytics', (req, res) => {
    try {
      // Get all accounts and their history based on transactions
      const history = db.prepare(`
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
      `).all();
      
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // --- Vite Configuration ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
