import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

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
    const { owner, bank_name, name, description, currency, initial_balance } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO accounts (owner, bank_name, name, description, currency, initial_balance, current_balance)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(owner, bank_name, name, description, currency, initial_balance, initial_balance);
      
      const newAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json(newAccount);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create account' });
    }
  });

  app.put('/api/accounts/:id', (req, res) => {
    const { id } = req.params;
    const { owner, bank_name, name, description } = req.body;
    try {
      db.prepare(`
        UPDATE accounts SET owner = ?, bank_name = ?, name = ?, description = ?
        WHERE id = ?
      `).run(owner, bank_name, name, description, id);
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
      const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  app.post('/api/transactions', (req, res) => {
    const { account_id, type, amount, description, to_account_id, interest } = req.body;
    
    const transaction = db.transaction(() => {
      // 1. Log Transaction
      const info = db.prepare(`
        INSERT INTO transactions (account_id, from_account_id, to_account_id, type, amount, currency, description, interest)
        SELECT ?, ?, ?, ?, ?, currency, ?, ? FROM accounts WHERE id = ?
      `).run(account_id, type === 'TRANSFER' ? account_id : null, to_account_id || null, type, amount, description, interest || 0, account_id);

      // 2. Update Balances
      if (type === 'DEPOSIT') {
        db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?').run(amount, account_id);
      } else if (type === 'WITHDRAWAL') {
        db.prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?').run(amount, account_id);
      } else if (type === 'TRANSFER') {
        // Subtract from source
        db.prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?').run(amount, account_id);
        // Add to target (subtracting interest if any)
        db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?').run(amount - (interest || 0), to_account_id);
      }
      
      return info.lastInsertRowid;
    });

    try {
      const txId = transaction();
      const newTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
      res.status(201).json(newTx);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to process transaction' });
    }
  });

  // Analytics: Balance evolution (simplified: just summary per day)
  app.get('/api/analytics', (req, res) => {
    try {
      // Get all accounts and their history based on transactions
      // For simplicity, we'll return the history of transactions that affected balances
      const history = db.prepare(`
        SELECT 
          date(date) as day,
          SUM(CASE WHEN type = 'DEPOSIT' THEN amount WHEN type = 'WITHDRAWAL' THEN -amount WHEN type = 'TRANSFER' AND account_id = a.id THEN -amount WHEN type = 'TRANSFER' AND to_account_id = a.id THEN (amount - interest) ELSE 0 END) as change,
          a.currency,
          a.bank_name,
          a.owner
        FROM transactions t
        JOIN accounts a ON (t.account_id = a.id OR t.to_account_id = a.id)
        GROUP BY day, a.currency, a.bank_name, a.owner
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
