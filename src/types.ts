export type Currency = 'RON' | 'EUR';

export interface Owner {
  id: number;
  name: string;
  created_at?: string;
}

export interface Bank {
  id: number;
  name: string;
  created_at?: string;
}

export interface Account {
  id: number;
  owner: string;
  bank_name: string;
  name: string;
  description: string;
  currency: Currency;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  due_date?: string;
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
  date: string;
}

export interface AnalyticsData {
  day: string;
  change: number;
  currency: Currency;
  bank_name: string;
  owner: string;
}
