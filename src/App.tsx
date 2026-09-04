import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CreditCard, 
  History, 
  LayoutDashboard, 
  Plus, 
  PiggyBank,
  Building2,
  Search,
  Filter,
  Menu,
  X,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';

import { Button } from '@/components/ui/button';

import { Account, Transaction, Currency, AnalyticsData, Owner, Bank } from './types';
import { DashboardView } from '@/src/components/views/DashboardView';
import { AccountsView } from '@/src/components/views/AccountsView';
import { TransactionsView } from '@/src/components/views/TransactionsView';
import { AddAccountModal } from '@/src/components/modals/AddAccountModal';
import { EditAccountModal } from '@/src/components/modals/EditAccountModal';
import { DeleteAccountModal } from '@/src/components/modals/DeleteAccountModal';
import { AddTransactionModal } from '@/src/components/modals/AddTransactionModal';
import { ManageOwnersModal } from '@/src/components/modals/ManageOwnersModal';
import { ManageBanksModal } from '@/src/components/modals/ManageBanksModal';

const APP_VERSION = '2026.9.1';
const APP_RELEASE_HIGHLIGHT = 'Modular View Architecture';
const APP_RELEASE_KEYWORD = 'Modular';

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState('all');
  const [startMonth, setStartMonth] = useState<string>('all');
  const [endMonth, setEndMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [filterByMonths, setFilterByMonths] = useState<boolean>(false);

  // Date range filter state for Ledger Activity
  const [txStartDate, setTxStartDate] = useState<string>('');
  const [txEndDate, setTxEndDate] = useState<string>('');
  const [txDatePreset, setTxDatePreset] = useState<string>('all');
  const [isTxDateFilterOpen, setIsTxDateFilterOpen] = useState(false);

  const { effectiveStartMonth, effectiveEndMonth } = React.useMemo(() => {
    if (selectedYear === 'all') {
      if (filterByMonths) {
        return { effectiveStartMonth: startMonth, effectiveEndMonth: endMonth };
      }
      return { effectiveStartMonth: 'all', effectiveEndMonth: 'all' };
    }
    
    // Specific year selected
    if (filterByMonths) {
      const start = startMonth !== 'all' && startMonth.startsWith(selectedYear) ? startMonth : `${selectedYear}-01`;
      const end = endMonth !== 'all' && endMonth.startsWith(selectedYear) ? endMonth : `${selectedYear}-12`;
      return { effectiveStartMonth: start, effectiveEndMonth: end };
    }
    
    // Whole year
    return { effectiveStartMonth: `${selectedYear}-01`, effectiveEndMonth: `${selectedYear}-12` };
  }, [selectedYear, filterByMonths, startMonth, endMonth]);

  const [isRangeFilterOpen, setIsRangeFilterOpen] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [chartCurrencyFilter, setChartCurrencyFilter] = useState<'all' | 'TOTAL' | 'RON' | 'EUR'>('all');
  const [accountStatusFilter, setAccountStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isOwnerFilterOpen, setIsOwnerFilterOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWelcomeDismissed, setIsWelcomeDismissed] = useState(false);
  const [ronToEurRate, setRonToEurRate] = useState<number | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<number | null>(null);
  const [visibleTxCount, setVisibleTxCount] = useState(50);

  const fetchExchangeRate = async () => {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/RON');
      const data = await res.json();
      if (data && data.rates && data.rates.EUR) {
        setRonToEurRate(data.rates.EUR);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate, using fallback');
      setRonToEurRate(0.201); // Fallback approximate rate
    }
  };

  const toggleOwner = (owner: string) => {
    setSelectedOwners(prev => {
      if (prev.includes(owner)) {
        return prev.filter(o => o !== owner);
      } else {
        return [...prev, owner];
      }
    });
  };

  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    if (year === 'all') {
      setStartMonth('all');
      setEndMonth('all');
    } else {
      setStartMonth(`${year}-01`);
      setEndMonth(`${year}-12`);
    }
  };
  const [txSortOrder, setTxSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'>('all');
  const [accountsSortField, setAccountsSortField] = useState<'owner' | 'bank' | 'currency' | 'balance' | 'due_date'>('balance');
  const [accountsSortOrder, setAccountsSortOrder] = useState<'asc' | 'desc'>('desc');

  // Reset transaction pagination when filters change
  useEffect(() => {
    setVisibleTxCount(50);
  }, [searchQuery, txTypeFilter, selectedCurrency, selectedOwners, selectedBank, txSortOrder, txStartDate, txEndDate, txDatePreset]);

  // Form states
  const [allOwners, setAllOwners] = useState<Owner[]>([]);
  const [isManageOwnersOpen, setIsManageOwnersOpen] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [editingOwnerId, setEditingOwnerId] = useState<number | null>(null);
  const [editingOwnerName, setEditingOwnerName] = useState('');

  const [allBanks, setAllBanks] = useState<Bank[]>([]);
  const [isManageBanksOpen, setIsManageBanksOpen] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [editingBankId, setEditingBankId] = useState<number | null>(null);
  const [editingBankName, setEditingBankName] = useState('');

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) {
      toast.error('Bank name cannot be empty');
      return;
    }
    try {
      const res = await fetch('/api/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBankName.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Bank "${data.name}" created`);
        setNewBankName('');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create bank');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const handleEditBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBankId || !editingBankName.trim()) {
      toast.error('Bank name cannot be empty');
      return;
    }
    try {
      const res = await fetch(`/api/banks/${editingBankId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingBankName.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Bank updated successfully');
        setEditingBankId(null);
        setEditingBankName('');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update bank');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const handleDeleteBank = async (id: number, name: string, accountCount: number) => {
    if (accountCount > 0) {
      toast.error(`Cannot delete "${name}" because ${accountCount} account(s) are assigned to it.`);
      return;
    }
    try {
      const res = await fetch(`/api/banks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Bank "${name}" deleted`);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to delete bank');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwnerName.trim()) {
      toast.error('Owner name cannot be empty');
      return;
    }
    try {
      const res = await fetch('/api/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOwnerName.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Owner "${data.name}" created`);
        setNewOwnerName('');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create owner');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const handleEditOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOwnerId || !editingOwnerName.trim()) {
      toast.error('Owner name cannot be empty');
      return;
    }
    try {
      const res = await fetch(`/api/owners/${editingOwnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingOwnerName.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Owner updated successfully');
        setEditingOwnerId(null);
        setEditingOwnerName('');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update owner');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const handleDeleteOwner = async (id: number, name: string, accountCount: number) => {
    if (accountCount > 0) {
      toast.error(`Cannot delete "${name}" because ${accountCount} account(s) are assigned to them.`);
      return;
    }
    try {
      const res = await fetch(`/api/owners/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Owner "${name}" deleted`);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to delete owner');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };
  
  const [newAccount, setNewAccount] = useState({
    owner: '',
    bank_name: '',
    name: '',
    description: '',
    currency: 'RON' as Currency,
    initial_balance: 0,
    is_active: true,
    due_date: ''
  });

  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    try {
      const res = await fetch(`/api/accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAccount)
      });
      if (res.ok) {
        toast.success('Account updated');
        setIsEditAccountOpen(false);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update account');
    }
  };
  const [newTx, setNewTx] = useState({
    account_id: '',
    to_account_id: '',
    type: 'DEPOSIT',
    amount: 0,
    interestAmount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [searchSourceQuery, setSearchSourceQuery] = useState('');
  const [searchTargetQuery, setSearchTargetQuery] = useState('');
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const targetDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSourceDropdownOpen(false);
      }
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(event.target as Node)) {
        setIsTargetDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isTransactionOpen) {
      setSearchSourceQuery('');
      setSearchTargetQuery('');
      setIsSourceDropdownOpen(false);
      setIsTargetDropdownOpen(false);
    }
  }, [isTransactionOpen]);

  const fetchData = async () => {
    try {
      const [accRes, txRes, anaRes, ownRes, bankRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/transactions'),
        fetch('/api/analytics'),
        fetch('/api/owners'),
        fetch('/api/banks')
      ]);
      const [accData, txData, anaData, ownData, bankData] = await Promise.all([
        accRes.json(),
        txRes.json(),
        anaRes.json(),
        ownRes.json(),
        bankRes.json()
      ]);
      setAccounts(accData);
      setTransactions(txData);
      setAnalytics(anaData);
      setAllOwners(ownData);
      setAllBanks(bankData);
    } catch (error) {
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchExchangeRate();
    // Refresh exchange rate every hour
    const interval = setInterval(fetchExchangeRate, 3600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      setIsChartReady(false);
      const timer = setTimeout(() => setIsChartReady(true), 150);
      return () => clearTimeout(timer);
    } else {
      setIsChartReady(false);
    }
  }, [activeTab]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAccount, initial_balance: Number(newAccount.initial_balance) || 0, is_active: true })
      });
      if (res.ok) {
        toast.success('Account created successfully');
        setIsAddAccountOpen(false);
        setNewAccount({ owner: '', bank_name: '', name: '', description: '', currency: 'RON', initial_balance: 0, is_active: true, due_date: '' });
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to create account');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sourceId = parseInt(newTx.account_id);
      const targetId = newTx.to_account_id ? parseInt(newTx.to_account_id) : null;

      if (isNaN(sourceId)) {
        toast.error('Please select a source account');
        return;
      }

      if (newTx.type === 'TRANSFER' && (targetId === null || isNaN(targetId))) {
        toast.error('Please select a target account for the transfer');
        return;
      }

      if (newTx.type === 'TRANSFER') {
        const fromAcc = accounts.find(a => a.id === sourceId);
        const toAcc = accounts.find(a => a.id === targetId);
        if (fromAcc && toAcc && fromAcc.currency !== toAcc.currency) {
          toast.error(`Cannot transfer between ${fromAcc.currency} and ${toAcc.currency} accounts`);
          return;
        }
      }

      // Step 1: Process main transaction
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: sourceId,
          to_account_id: targetId,
          type: newTx.type,
          amount: Math.round(parseFloat(newTx.amount.toString()) * 100) / 100,
          description: newTx.description || (newTx.type === 'TRANSFER' ? 'Transfer' : ''),
          date: newTx.date
        })
      });

      if (!res.ok) throw new Error('Primary transaction failed');

      // Step 2: Process interest if applicable (only for Transfers)
      if (newTx.type === 'TRANSFER' && newTx.interestAmount > 0 && targetId !== null) {
        const interestRes = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_id: targetId,
            to_account_id: null,
            type: 'DEPOSIT',
            amount: Math.round(parseFloat(newTx.interestAmount.toString()) * 100) / 100,
            description: `Interest: ${newTx.description || 'Transfer Component'}`,
            date: newTx.date
          })
        });
        if (!interestRes.ok) toast.error('Transfer succeeded, but interest logging failed');
      }

      toast.success(newTx.type === 'TRANSFER' && newTx.interestAmount > 0 ? 'Transfer and Interest processed' : 'Transaction processed');
      setIsTransactionOpen(false);
      setNewTx({ 
        account_id: '', 
        to_account_id: '', 
        type: 'DEPOSIT', 
        amount: 0, 
        interestAmount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to process transaction');
    }
  };

  const deleteAccount = async (id: number) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Account deleted');
        fetchData();
      } else {
        toast.error('Failed to delete account');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Transaction deleted');
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete transaction');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const formatDate = (dateStr: string, format: 'short' | 'long' = 'short') => {
    const d = new Date(dateStr);
    if (format === 'long') {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return d.toLocaleDateString('en-GB'); // dd/mm/yyyy
  };

  const getDueDateTheme = (dateStr: string) => {
    const dueDate = new Date(dateStr);
    const now = new Date();
    
    // Difference in months
    const diffTime = dueDate.getTime() - now.getTime();
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);
    
    const isPast = diffTime < 0;
    const animation = isPast ? "animate-elegant-pulse" : "";
    
    // 1 month or less (including overdue)
    if (diffMonths <= 1) return `bg-red-50 text-red-600 border-red-100/50 ${animation}`;
    // 2 months or less
    if (diffMonths <= 2) return `bg-amber-50 text-amber-600 border-amber-100/50 ${animation}`;
    // Later than 2 full months
    return `bg-blue-50 text-blue-600 border-blue-100/50 ${animation}`;
  };

  const formatCurrency = (amount: number, currency: string) => {
    // Normalize small values and handle negative zero to avoid "-0.00" display
    const normalized = Math.abs(amount) < 0.001 ? 0 : amount;
    return new Intl.NumberFormat('ro-RO', { style: 'currency', currency }).format(normalized);
  };

  const getRangeLabel = () => {
    if (selectedYear === 'all') {
      if (!filterByMonths) return 'All Time';
      
      const hasStart = startMonth && startMonth !== 'all';
      const hasEnd = endMonth && endMonth !== 'all';
      if (!hasStart && !hasEnd) return 'All Time';

      const formatYM = (ym: string) => {
        const [year, month] = ym.split('-');
        const d = new Date(Number(year), Number(month) - 1, 1);
        return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      };

      if (hasStart && hasEnd) {
        if (startMonth === endMonth) return formatYM(startMonth);
        return `${formatYM(startMonth)} - ${formatYM(endMonth)}`;
      }
      if (hasStart) return `From ${formatYM(startMonth)}`;
      return `Up to ${formatYM(endMonth)}`;
    }

    // Specific year selected
    if (!filterByMonths) {
      return `Year ${selectedYear}`;
    }

    // Month-level filter within that year
    const start = startMonth !== 'all' && startMonth.startsWith(selectedYear) ? startMonth : `${selectedYear}-01`;
    const end = endMonth !== 'all' && endMonth.startsWith(selectedYear) ? endMonth : `${selectedYear}-12`;
    
    const formatMonthOnly = (ym: string) => {
      const [, m] = ym.split('-');
      const d = new Date(2000, Number(m) - 1, 1);
      return d.toLocaleDateString('en-GB', { month: 'short' });
    };

    if (start === end) return `${formatMonthOnly(start)} ${selectedYear}`;
    if (start === `${selectedYear}-01` && end === `${selectedYear}-12`) return `Year ${selectedYear}`;
    return `${formatMonthOnly(start)} - ${formatMonthOnly(end)} ${selectedYear}`;
  };

  const applyTxDatePreset = (preset: string) => {
    setTxDatePreset(preset);
    const now = new Date();
    
    if (preset === 'all') {
      setTxStartDate('');
      setTxEndDate('');
      return;
    }
    
    if (preset === 'today') {
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      setTxStartDate(todayStr);
      setTxEndDate(todayStr);
      return;
    }

    if (preset === 'this_month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const startStr = `${year}-${month}-01`;
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      const endStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      setTxStartDate(startStr);
      setTxEndDate(endStr);
      return;
    }

    if (preset === 'last_month') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = prev.getFullYear();
      const month = String(prev.getMonth() + 1).padStart(2, '0');
      const startStr = `${year}-${month}-01`;
      const lastDay = new Date(year, prev.getMonth() + 1, 0).getDate();
      const endStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      setTxStartDate(startStr);
      setTxEndDate(endStr);
      return;
    }

    if (preset === 'last_30_days') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const startStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;
      const endStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      setTxStartDate(startStr);
      setTxEndDate(endStr);
      return;
    }

    if (preset === 'last_90_days') {
      const past = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const startStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;
      const endStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      setTxStartDate(startStr);
      setTxEndDate(endStr);
      return;
    }

    if (preset === 'this_year') {
      const year = now.getFullYear();
      setTxStartDate(`${year}-01-01`);
      setTxEndDate(`${year}-12-31`);
      return;
    }
  };

  const clearTxDateFilter = () => {
    setTxDatePreset('all');
    setTxStartDate('');
    setTxEndDate('');
  };

  const isTxDateFilterActive = Boolean(txStartDate || txEndDate || (txDatePreset !== 'all' && txDatePreset !== 'custom'));

  const getTxDateFilterLabel = () => {
    if (!txStartDate && !txEndDate) {
      return 'All Dates';
    }

    if (txDatePreset === 'today') return 'Today';
    if (txDatePreset === 'this_month') return 'This Month';
    if (txDatePreset === 'last_month') return 'Last Month';
    if (txDatePreset === 'last_30_days') return 'Last 30 Days';
    if (txDatePreset === 'last_90_days') return 'Last 90 Days';
    if (txDatePreset === 'this_year') return 'This Year';

    const formatLabelDate = (dateStr: string) => {
      try {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      } catch {
        return dateStr;
      }
    };

    if (txStartDate && txEndDate) {
      if (txStartDate === txEndDate) {
        return formatLabelDate(txStartDate);
      }
      return `${formatLabelDate(txStartDate)} – ${formatLabelDate(txEndDate)}`;
    }
    if (txStartDate) return `From ${formatLabelDate(txStartDate)}`;
    if (txEndDate) return `Until ${formatLabelDate(txEndDate)}`;
    return 'Date Range';
  };

  const availableMonths = React.useMemo(() => {
    if (analytics.length === 0) {
      const today = new Date();
      const currentYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      return [{ value: currentYM, label: today.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) }];
    }
    
    // Find earliest date
    const dates = analytics.map(a => new Date(a.day).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(); // include up to today
    
    const list: { value: string; label: string }[] = [];
    let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    
    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const value = `${y}-${m}`;
      const label = current.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      list.push({ value, label });
      current.setMonth(current.getMonth() + 1);
    }
    
    // Return descending order so newest months are on top
    return list.reverse();
  }, [analytics]);

  const filteredAvailableMonths = React.useMemo(() => {
    if (selectedYear === 'all') return availableMonths;
    return availableMonths.filter(m => m.value.startsWith(selectedYear));
  }, [availableMonths, selectedYear]);

  // Prepare Chart Data
  const chartData = React.useMemo(() => {
    const currencies = ['RON', 'EUR'] as const;
    const filteredAccounts = accounts.filter(a => {
      const matchesOwner = selectedOwners.length === 0 || selectedOwners.includes(a.owner);
      const matchesBank = selectedBank === 'all' || a.bank_name === selectedBank;
      return matchesOwner && matchesBank;
    });

    // 1. Calculate starting balances (balances before the selected period)
    const startBalances: Record<string, number> = { RON: 0, EUR: 0 };
    const periodStartStr = effectiveStartMonth && effectiveStartMonth !== 'all' ? `${effectiveStartMonth}-01` : '1970-01-01';
    const periodStartTime = new Date(periodStartStr).getTime();

    let periodEndTime = new Date().getTime();
    if (effectiveEndMonth && effectiveEndMonth !== 'all') {
      const [ey, em] = effectiveEndMonth.split('-').map(Number);
      periodEndTime = new Date(ey, em, 0, 23, 59, 59, 999).getTime();
    }

    currencies.forEach(curr => {
      const initial = filteredAccounts
        .filter(a => a.currency === curr)
        .reduce((sum, a) => sum + a.initial_balance, 0);
      
      const changesBefore = analytics
        .filter(ana => {
          const acc = accounts.find(a => a.id === ana.account_id);
          if (!acc || acc.currency !== curr) return false;
          const matchesOwner = selectedOwners.length === 0 || selectedOwners.includes(acc.owner);
          const matchesBank = selectedBank === 'all' || acc.bank_name === selectedBank;
          return matchesOwner && matchesBank && new Date(ana.day).getTime() < periodStartTime;
        })
        .reduce((sum, ana) => sum + ana.change, 0);
      
      startBalances[curr] = initial + changesBefore;
    });

    // 2. Filter analytics for the selected period
    const periodAnalytics = analytics.filter(ana => {
      const acc = accounts.find(a => a.id === ana.account_id);
      if (!acc) return false;
      const matchesOwner = selectedOwners.length === 0 || selectedOwners.includes(acc.owner);
      const matchesBank = selectedBank === 'all' || acc.bank_name === selectedBank;
      if (!(matchesOwner && matchesBank)) return false;

      const time = new Date(ana.day).getTime();
      return time >= periodStartTime && time <= periodEndTime;
    });

    // 3. Group by day
    const dailyChanges: Record<string, Record<string, number>> = {};
    
    // Ensure we have a data point for "Today" and potentially the start of the period
    const today = new Date().toISOString().split('T')[0];
    const todayTime = new Date(today).getTime();
    
    const isCustomRange = (effectiveStartMonth && effectiveStartMonth !== 'all') || (effectiveEndMonth && effectiveEndMonth !== 'all');

    if (todayTime >= periodStartTime && todayTime <= periodEndTime) {
      dailyChanges[today] = { RON: 0, EUR: 0 };
    }
    
    if (effectiveStartMonth && effectiveStartMonth !== 'all') {
      const startDay = `${effectiveStartMonth}-01`;
      if (!dailyChanges[startDay]) dailyChanges[startDay] = { RON: 0, EUR: 0 };
    }

    periodAnalytics.forEach(ana => {
      const day = ana.day;
      if (!dailyChanges[day]) dailyChanges[day] = { RON: 0, EUR: 0 };
      const acc = accounts.find(a => a.id === ana.account_id);
      if (acc && (acc.currency === 'RON' || acc.currency === 'EUR')) {
        dailyChanges[day][acc.currency] += ana.change;
      }
    });

    const days = Object.keys(dailyChanges).sort();
    
    // 4. Build the result array
    const result: any[] = [];
    let currentBalances = { ...startBalances };
    const rateVal = ronToEurRate || 0.201;

    if (days.length === 0 && !isCustomRange) {
       // No transactions ever, just show today
       const ronVal = Math.round(currentBalances.RON * 100) / 100;
       const eurVal = Math.round(currentBalances.EUR * 100) / 100;
       const eurScaled = Math.round((eurVal / rateVal) * 100) / 100;
       const totalRon = Math.round((ronVal + eurScaled) * 100) / 100;
       result.push({
         day: today,
         RON: ronVal,
         EUR: eurVal,
         EUR_scaled: eurScaled,
         Total_RON: totalRon
       });
       return result;
    }

    days.forEach(day => {
      currencies.forEach(curr => {
        currentBalances[curr] += dailyChanges[day][curr] || 0;
      });
      const ronVal = Math.round(currentBalances.RON * 100) / 100;
      const eurVal = Math.round(currentBalances.EUR * 100) / 100;
      const eurScaled = Math.round((eurVal / rateVal) * 100) / 100;
      const totalRon = Math.round((ronVal + eurScaled) * 100) / 100;
      result.push({
        day,
        RON: ronVal,
        EUR: eurVal,
        EUR_scaled: eurScaled,
        Total_RON: totalRon
      });
    });

    if (result.length > 0) {
      const monthlyResult: any[] = [];
      const firstDateText = result[0].day;
      const lastDateText = result[result.length - 1].day;
      
      const startDate = new Date(firstDateText);
      const endDate = new Date(lastDateText);
      
      let currentYear = startDate.getFullYear();
      let currentMonth = startDate.getMonth(); // 0-based
      
      const targetYear = endDate.getFullYear();
      const targetMonth = endDate.getMonth();
      
      let lastKnownRon = result[0].RON;
      let lastKnownEur = result[0].EUR;
      
      while (currentYear < targetYear || (currentYear === targetYear && currentMonth <= targetMonth)) {
        // Form the last day of this month
        const nextMonthDate = new Date(currentYear, currentMonth + 1, 0);
        const nextMonthStr = nextMonthDate.toISOString().split('T')[0];
        
        // Find the latest record within result whose date falls in or before this month
        const lastInMonth = [...result].reverse().find(r => r.day <= nextMonthStr);
        if (lastInMonth) {
          lastKnownRon = lastInMonth.RON;
          lastKnownEur = lastInMonth.EUR;
        }
        
        // Representative date of the month: YYYY-MM-01
        const repDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
        
        // Only include the month if there are recorded transaction/balance changes within it or if a specific range is selected
        const hasChangesInMonth = periodAnalytics.some(ana => {
          const anaDate = new Date(ana.day);
          return anaDate.getFullYear() === currentYear && anaDate.getMonth() === currentMonth;
        });
        
        const shouldInclude = hasChangesInMonth || isCustomRange;
        
        if (shouldInclude) {
          const eurScaled = Math.round((lastKnownEur / rateVal) * 100) / 100;
          const totalRon = Math.round((lastKnownRon + eurScaled) * 100) / 100;
          monthlyResult.push({
            day: repDate,
            RON: lastKnownRon,
            EUR: lastKnownEur,
            EUR_scaled: eurScaled,
            Total_RON: totalRon
          });
        }
        
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }
      return monthlyResult;
    }

    return result;
  }, [accounts, analytics, selectedOwners, selectedBank, effectiveStartMonth, effectiveEndMonth, ronToEurRate]);

  const years = React.useMemo(() => 
    Array.from(new Set(analytics.map(ana => new Date(ana.day).getFullYear().toString()))).sort().reverse()
  , [analytics]);

  const filteredAccountsForStats = React.useMemo(() => 
    accounts.filter(a => {
      const matchesOwner = selectedOwners.length === 0 || selectedOwners.includes(a.owner);
      const matchesBank = selectedBank === 'all' || a.bank_name === selectedBank;
      return matchesOwner && matchesBank;
    })
  , [accounts, selectedOwners, selectedBank]);

  const totalBalances = React.useMemo(() => 
    filteredAccountsForStats
      .filter(a => a.is_active)
      .reduce((acc, curr) => {
        if (curr.currency as string === 'USD') return acc;
        const currentVal = acc[curr.currency] || 0;
        acc[curr.currency] = Math.round((currentVal + curr.current_balance) * 100) / 100;
        return acc;
      }, {} as Record<string, number>)
  , [filteredAccountsForStats]);

  const owners = React.useMemo(() => {
    const nameSet = new Set<string>();
    allOwners.forEach(o => nameSet.add(o.name));
    accounts.forEach(a => nameSet.add(a.owner));
    return Array.from(nameSet).filter(Boolean).sort() as string[];
  }, [allOwners, accounts]);

  const banks = React.useMemo(() => {
    const nameSet = new Set<string>();
    allBanks.forEach(b => nameSet.add(b.name));
    accounts.forEach(a => nameSet.add(a.bank_name));
    return Array.from(nameSet).filter(Boolean).sort() as string[];
  }, [allBanks, accounts]);

  const dueSoonAccounts = React.useMemo(() => {
    return accounts
      .filter(a => a.is_active && a.due_date)
      .map(a => {
        const dueDate = new Date(a.due_date);
        const now = new Date();
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...a, daysLeft: diffDays };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [accounts]);

  const currencySnapshot = React.useMemo(() => {
    if (!ronToEurRate) return null;
    const ronTotal = totalBalances['RON'] || 0;
    const eurTotal = totalBalances['EUR'] || 0;
    const convertedRon = ronTotal * ronToEurRate;
    return {
      totalEur: eurTotal + convertedRon,
      rate: ronToEurRate,
      ronContribution: convertedRon
    };
  }, [totalBalances, ronToEurRate]);

  const sortedAccountsForDropdown = React.useMemo(() => {
    return [...accounts]
      .filter(a => a.is_active)
      .sort((a, b) => {
        // 1. Account owner
        const ownerCompare = a.owner.localeCompare(b.owner);
        if (ownerCompare !== 0) return ownerCompare;
        
        // 2. Bank Name
        const bankCompare = a.bank_name.localeCompare(b.bank_name);
        if (bankCompare !== 0) return bankCompare;
        
        // 3. Account name
        return a.name.localeCompare(b.name);
      });
  }, [accounts]);

  const filteredSourceAccounts = React.useMemo(() => {
    if (!searchSourceQuery) return sortedAccountsForDropdown;
    const query = searchSourceQuery.toLowerCase();
    return sortedAccountsForDropdown.filter(acc => 
      acc.owner.toLowerCase().includes(query) ||
      acc.name.toLowerCase().includes(query) ||
      acc.bank_name.toLowerCase().includes(query) ||
      (acc.description && acc.description.toLowerCase().includes(query))
    );
  }, [sortedAccountsForDropdown, searchSourceQuery]);

  const filteredTargetAccounts = React.useMemo(() => {
    const baseline = sortedAccountsForDropdown
      .filter(a => String(a.id) !== String(newTx.account_id))
      .filter(a => {
        const sourceAcc = accounts.find(sa => String(sa.id) === String(newTx.account_id));
        return !sourceAcc || a.currency === sourceAcc.currency;
      });

    if (!searchTargetQuery) return baseline;
    const query = searchTargetQuery.toLowerCase();
    return baseline.filter(acc => 
      acc.owner.toLowerCase().includes(query) ||
      acc.name.toLowerCase().includes(query) ||
      acc.bank_name.toLowerCase().includes(query) ||
      (acc.description && acc.description.toLowerCase().includes(query))
    );
  }, [sortedAccountsForDropdown, newTx.account_id, accounts, searchTargetQuery]);

  const ownerPulse = React.useMemo(() => {
    const breakdown: Record<string, { RON: number, EUR: number }> = {};
    
    filteredAccountsForStats
      .filter(a => a.is_active)
      .forEach(acc => {
        if (!breakdown[acc.owner]) {
          breakdown[acc.owner] = { RON: 0, EUR: 0 };
        }
        if (acc.currency === 'RON' || acc.currency === 'EUR') {
          breakdown[acc.owner][acc.currency] += acc.current_balance;
        }
      });
    
    const entries = Object.entries(breakdown).map(([owner, balances]) => ({
      owner,
      ...balances,
      totalNormalized: (balances.RON * (ronToEurRate || 0.201)) + balances.EUR
    }));
    
    const grandTotal = entries.reduce((sum, e) => sum + e.totalNormalized, 0);
    
    return entries.map(e => ({
      ...e,
      percentage: grandTotal > 0 ? (e.totalNormalized / grandTotal) * 100 : 0
    })).sort((a, b) => b.totalNormalized - a.totalNormalized);
  }, [filteredAccountsForStats, ronToEurRate]);

  const accountsMap = React.useMemo(() => {
    const map = new Map<number, Account>();
    accounts.forEach(a => map.set(a.id, a));
    return map;
  }, [accounts]);

  const filteredTransactions = React.useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    
    return transactions
      .filter(tx => {
        if (searchLower) {
          const account = accountsMap.get(tx.account_id);
          const targetAccount = tx.to_account_id ? accountsMap.get(tx.to_account_id) : null;
          const descMatch = tx.description?.toLowerCase().includes(searchLower);
          const typeMatch = tx.type.toLowerCase().includes(searchLower);
          const accMatch = account?.name.toLowerCase().includes(searchLower) || account?.bank_name.toLowerCase().includes(searchLower);
          const targetAccMatch = targetAccount?.name.toLowerCase().includes(searchLower) || targetAccount?.bank_name.toLowerCase().includes(searchLower);
          if (!descMatch && !typeMatch && !accMatch && !targetAccMatch) return false;
        }

        if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;
        if (selectedCurrency !== 'all' && tx.currency !== selectedCurrency) return false;

        if (selectedOwners.length > 0) {
          const account = accountsMap.get(tx.account_id);
          const targetAccount = tx.to_account_id ? accountsMap.get(tx.to_account_id) : null;
          const accOwnerMatch = account ? selectedOwners.includes(account.owner) : false;
          const targetOwnerMatch = targetAccount ? selectedOwners.includes(targetAccount.owner) : false;
          if (!accOwnerMatch && !targetOwnerMatch) return false;
        }

        if (selectedBank !== 'all') {
          const account = accountsMap.get(tx.account_id);
          const targetAccount = tx.to_account_id ? accountsMap.get(tx.to_account_id) : null;
          const accBankMatch = account ? account.bank_name === selectedBank : false;
          const targetBankMatch = targetAccount ? targetAccount.bank_name === selectedBank : false;
          if (!accBankMatch && !targetBankMatch) return false;
        }

        // Date range filter
        if (txStartDate) {
          const [sy, sm, sd] = txStartDate.split('-').map(Number);
          const startLimit = new Date(sy, sm - 1, sd, 0, 0, 0, 0).getTime();
          const txTime = new Date(tx.date).getTime();
          if (txTime < startLimit) return false;
        }

        if (txEndDate) {
          const [ey, em, ed] = txEndDate.split('-').map(Number);
          const endLimit = new Date(ey, em - 1, ed, 23, 59, 59, 999).getTime();
          const txTime = new Date(tx.date).getTime();
          if (txTime > endLimit) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (txSortOrder === 'newest') return timeB - timeA;
        return timeA - timeB;
      });
  }, [transactions, accountsMap, searchQuery, txTypeFilter, selectedCurrency, selectedOwners, selectedBank, txSortOrder, txStartDate, txEndDate]);

  const visibleTransactions = React.useMemo(() => {
    return filteredTransactions.slice(0, visibleTxCount);
  }, [filteredTransactions, visibleTxCount]);



  return (
    <div className="h-screen flex bg-[#F9FAFB] text-[#111827] font-sans overflow-hidden relative">
      <Toaster position="top-center" richColors />
      
      {/* Privacy Welcome Screen */}
      <AnimatePresence>
        {!isWelcomeDismissed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 20 }}
              className="max-w-md w-full space-y-8"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100">
                  <PiggyBank className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-black italic tracking-tighter text-gray-900">Econosmishu</h1>
                  <p className="text-gray-500 font-medium">Family Finance Dashboard</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 italic text-sm text-gray-600">
                "Money talks, but mine mostly just says 'Goodbye' as it leaves for the grocery store."
              </div>

              <Button 
                onClick={() => setIsWelcomeDismissed(true)}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Proceed to App
              </Button>

              <div className="pt-8 text-gray-300">
                <div className="flex items-center justify-center gap-2 mb-1">
                   <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse"></div>
                   <p className="text-[10px] font-bold uppercase tracking-widest">Secure Privacy Shield Enabled</p>
                </div>
                <p className="text-[9px] font-medium opacity-50 truncate max-w-xs mx-auto" title={`v${APP_VERSION} • ${APP_RELEASE_HIGHLIGHT}`}>
                  Local data access only • v{APP_VERSION} • {APP_RELEASE_HIGHLIGHT}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 transition-[width,transform] duration-300 ease-in-out border-r border-[#E5E7EB] bg-white flex flex-col flex-shrink-0 will-change-[width]
        ${isSidebarCollapsed ? 'lg:w-[80px]' : 'lg:w-[240px]'}
        ${isMobileMenuOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className={`p-6 mb-4 flex items-center ${isSidebarCollapsed ? 'justify-center px-4' : 'justify-between'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <PiggyBank className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.span 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-bold tracking-tight text-lg italic whitespace-nowrap overflow-hidden"
                >
                  Econosmishu
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={`flex-1 space-y-1 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard"
            collapsed={isSidebarCollapsed}
          />
          <NavItem 
            active={activeTab === 'accounts'} 
            onClick={() => { setActiveTab('accounts'); setIsMobileMenuOpen(false); }} 
            icon={<CreditCard size={20} />} 
            label="Accounts"
            collapsed={isSidebarCollapsed}
          />
          <NavItem 
            active={activeTab === 'transactions'} 
            onClick={() => { setActiveTab('transactions'); setIsMobileMenuOpen(false); }} 
            icon={<History size={20} />} 
            label="Activity"
            collapsed={isSidebarCollapsed}
          />

          <div className="pt-3 mt-3 border-t border-gray-100 space-y-1">
            {!isSidebarCollapsed && (
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1">
                Settings
              </div>
            )}
            <NavItem 
              active={false} 
              onClick={() => { setIsManageOwnersOpen(true); setIsMobileMenuOpen(false); }} 
              icon={<Users size={20} />} 
              label="Manage Owners"
              collapsed={isSidebarCollapsed}
            />
            <NavItem 
              active={false} 
              onClick={() => { setIsManageBanksOpen(true); setIsMobileMenuOpen(false); }} 
              icon={<Building2 size={20} />} 
              label="Manage Banks"
              collapsed={isSidebarCollapsed}
            />
          </div>
        </nav>

        <div 
          className={`mt-auto p-4 lg:p-5 border-t border-gray-100 flex items-center min-w-0 transition-all ${
            isSidebarCollapsed ? 'justify-center px-2 py-4' : 'gap-2'
          }`}
          title={`Econosmishu v${APP_VERSION} — ${APP_RELEASE_HIGHLIGHT}`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0"></div>
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center justify-center min-w-0 text-center">
              <span className="text-[9px] font-bold text-gray-500 tracking-wider uppercase font-mono">
                v9.1
              </span>
              <span 
                className="text-[8px] font-semibold text-blue-600 truncate max-w-[56px] tracking-tight leading-none"
                title={APP_RELEASE_HIGHLIGHT}
              >
                {APP_RELEASE_KEYWORD}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono shrink-0">
                v{APP_VERSION}
              </span>
              <span className="text-gray-300 shrink-0 select-none text-[10px]">•</span>
              <span 
                className="text-[10px] font-medium text-gray-600 truncate min-w-0 inline-block"
                title={`v${APP_VERSION} highlight: ${APP_RELEASE_HIGHLIGHT}`}
              >
                {APP_RELEASE_HIGHLIGHT}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-[#E5E7EB] bg-white flex items-center justify-between px-3 sm:px-4 lg:px-8 flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 sm:-ml-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors shrink-0"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu size={18} />
            </button>
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md min-w-0">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                <BarChart3 className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                className="block w-full pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2 border-none bg-gray-50 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none truncate" 
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Data Management Stack */}
            <Button 
              className="h-9 px-3 sm:px-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 hover:border-blue-300 transition-all rounded-lg shadow-2xs font-semibold text-xs flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95"
              onClick={() => {
                setNewAccount(prev => ({
                  ...prev,
                  owner: prev.owner || (owners.length > 0 ? owners[0] : ''),
                  bank_name: prev.bank_name || (banks.length > 0 ? banks[0] : '')
                }));
                setIsAddAccountOpen(true);
              }}
              title="Add Account"
            >
              <CreditCard size={15} className="text-blue-600 shrink-0" />
              <span className="hidden sm:inline">Add Account</span>
              <span className="sm:hidden">Account</span>
            </Button>
            <Button 
              className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white transition-all rounded-lg shadow-sm font-semibold text-xs flex items-center gap-2 cursor-pointer active:scale-95"
              onClick={() => setIsTransactionOpen(true)}
              title="New Transaction"
            >
              <Plus size={16} className="shrink-0" />
              <span className="hidden sm:inline">New Transaction</span>
              <span className="sm:hidden">Transaction</span>
            </Button>
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <DashboardView
                totalBalances={totalBalances}
                accounts={accounts}
                accountsMap={accountsMap}
                transactions={transactions}
                chartData={chartData}
                isChartReady={isChartReady}
                getRangeLabel={getRangeLabel}
                chartCurrencyFilter={chartCurrencyFilter}
                setChartCurrencyFilter={setChartCurrencyFilter}
                searchQuery={searchQuery}
                currencySnapshot={currencySnapshot}
                dueSoonAccounts={dueSoonAccounts}
                ownerPulse={ownerPulse}
                isRangeFilterOpen={isRangeFilterOpen}
                setIsRangeFilterOpen={setIsRangeFilterOpen}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                filterByMonths={filterByMonths}
                setFilterByMonths={setFilterByMonths}
                startMonth={startMonth}
                setStartMonth={setStartMonth}
                endMonth={endMonth}
                setEndMonth={setEndMonth}
                years={years}
                filteredAvailableMonths={filteredAvailableMonths}
                handleYearSelect={handleYearSelect}
                isOwnerFilterOpen={isOwnerFilterOpen}
                setIsOwnerFilterOpen={setIsOwnerFilterOpen}
                selectedOwners={selectedOwners}
                setSelectedOwners={setSelectedOwners}
                toggleOwner={toggleOwner}
                owners={owners}
                selectedBank={selectedBank}
                setSelectedBank={setSelectedBank}
                banks={banks}
                onNavigateToAccounts={() => setActiveTab('accounts')}
                onNavigateToTransactions={() => setActiveTab('transactions')}
              />
            )}

            {activeTab === 'accounts' && (
              <AccountsView
                accounts={accounts}
                accountStatusFilter={accountStatusFilter}
                setAccountStatusFilter={setAccountStatusFilter}
                selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency}
                isOwnerFilterOpen={isOwnerFilterOpen}
                setIsOwnerFilterOpen={setIsOwnerFilterOpen}
                selectedOwners={selectedOwners}
                setSelectedOwners={setSelectedOwners}
                toggleOwner={toggleOwner}
                owners={owners}
                selectedBank={selectedBank}
                setSelectedBank={setSelectedBank}
                banks={banks}
                accountsSortField={accountsSortField}
                setAccountsSortField={setAccountsSortField}
                accountsSortOrder={accountsSortOrder}
                setAccountsSortOrder={setAccountsSortOrder}
                searchQuery={searchQuery}
                onEditAccount={(acc) => {
                  setEditingAccount(acc);
                  setIsEditAccountOpen(true);
                }}
                onDeleteAccount={(acc) => {
                  setAccountToDelete(acc);
                  setIsDeleteConfirmOpen(true);
                }}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                filteredTransactions={filteredTransactions}
                visibleTransactions={visibleTransactions}
                visibleTxCount={visibleTxCount}
                setVisibleTxCount={setVisibleTxCount}
                accountsMap={accountsMap}
                isTxDateFilterOpen={isTxDateFilterOpen}
                setIsTxDateFilterOpen={setIsTxDateFilterOpen}
                isTxDateFilterActive={isTxDateFilterActive}
                getTxDateFilterLabel={getTxDateFilterLabel}
                txDatePreset={txDatePreset}
                applyTxDatePreset={applyTxDatePreset}
                clearTxDateFilter={clearTxDateFilter}
                txStartDate={txStartDate}
                setTxStartDate={setTxStartDate}
                txEndDate={txEndDate}
                setTxEndDate={setTxEndDate}
                setTxDatePreset={setTxDatePreset}
                txTypeFilter={txTypeFilter}
                setTxTypeFilter={setTxTypeFilter}
                selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency}
                isOwnerFilterOpen={isOwnerFilterOpen}
                setIsOwnerFilterOpen={setIsOwnerFilterOpen}
                selectedOwners={selectedOwners}
                setSelectedOwners={setSelectedOwners}
                toggleOwner={toggleOwner}
                owners={owners}
                selectedBank={selectedBank}
                setSelectedBank={setSelectedBank}
                banks={banks}
                txSortOrder={txSortOrder}
                setTxSortOrder={setTxSortOrder}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                deletingTxId={deletingTxId}
                setDeletingTxId={setDeletingTxId}
                deleteTransaction={deleteTransaction}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onOpenChange={setIsAddAccountOpen}
        newAccount={newAccount}
        setNewAccount={setNewAccount}
        owners={owners}
        banks={banks}
        handleAddAccount={handleAddAccount}
      />

      <EditAccountModal
        isOpen={isEditAccountOpen}
        onOpenChange={setIsEditAccountOpen}
        editingAccount={editingAccount}
        setEditingAccount={setEditingAccount}
        owners={owners}
        banks={banks}
        handleEditAccount={handleEditAccount}
      />

      <DeleteAccountModal
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        accountToDelete={accountToDelete}
        onConfirmDelete={() => {
          if (accountToDelete) {
            deleteAccount(accountToDelete.id);
            setIsDeleteConfirmOpen(false);
          }
        }}
      />

      <AddTransactionModal
        isOpen={isTransactionOpen}
        onOpenChange={setIsTransactionOpen}
        newTx={newTx}
        setNewTx={setNewTx}
        accounts={accounts}
        handleAddTransaction={handleAddTransaction}
      />

      <ManageOwnersModal
        isOpen={isManageOwnersOpen}
        onOpenChange={setIsManageOwnersOpen}
        allOwners={allOwners}
        accounts={accounts}
        newOwnerName={newOwnerName}
        setNewOwnerName={setNewOwnerName}
        handleCreateOwner={handleCreateOwner}
        editingOwnerId={editingOwnerId}
        setEditingOwnerId={setEditingOwnerId}
        editingOwnerName={editingOwnerName}
        setEditingOwnerName={setEditingOwnerName}
        handleEditOwner={handleEditOwner}
        handleDeleteOwner={handleDeleteOwner}
      />

      <ManageBanksModal
        isOpen={isManageBanksOpen}
        onOpenChange={setIsManageBanksOpen}
        allBanks={allBanks}
        accounts={accounts}
        newBankName={newBankName}
        setNewBankName={setNewBankName}
        handleCreateBank={handleCreateBank}
        editingBankId={editingBankId}
        setEditingBankId={setEditingBankId}
        editingBankName={editingBankName}
        setEditingBankName={setEditingBankName}
        handleEditBank={handleEditBank}
        handleDeleteBank={handleDeleteBank}
      />
    </div>
  );
}

function NavItem({ active, onClick, icon, label, collapsed }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, collapsed?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
        active 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-gray-600 hover:bg-gray-50'
      } ${collapsed ? 'justify-center px-0 h-10' : ''}`}
      title={collapsed ? label : undefined}
    >
      <span className={`${active ? 'text-blue-700' : 'text-gray-400'} shrink-0`}>{icon}</span>
      <AnimatePresence>
        {!collapsed && (
          <motion.span 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="truncate overflow-hidden"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
