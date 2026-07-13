import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // --- API Routes ---

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
    try {
      const info = db.prepare(`
        INSERT INTO accounts (owner, bank_name, name, description, currency, initial_balance, current_balance, is_active, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(owner, bank_name, name, description, currency, initial_balance, initial_balance, is_active === false ? 0 : 1, due_date || null);
      
      const newAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json(newAccount);
    } catch (error) {
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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
