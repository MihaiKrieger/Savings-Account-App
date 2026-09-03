import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CreditCard, 
  History, 
  LayoutDashboard, 
  Plus, 
  ArrowRightLeft, 
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Building2,
  Trash2,
  Pencil,
  Check,
  ChevronDown,
  Search,
  CalendarDays,
  Filter,
  Banknote,
  ArrowRight,
  Menu,
  X,
  Radar,
  Users,
  UserPlus,
  UserCheck,
  UserCog
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { Account, Transaction, Currency, AnalyticsData, Owner, Bank } from './types';
import { 
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { Info } from 'lucide-react';

const APP_VERSION = '2026.9.0';

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
                <p className="text-[9px] font-medium opacity-50">Local data access only • v{APP_VERSION}</p>
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

        <div className={`mt-auto p-6 border-t border-gray-50 flex items-center ${isSidebarCollapsed ? 'justify-center px-4' : 'gap-2'}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0"></div>
          {!isSidebarCollapsed && (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">v{APP_VERSION}</span>
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
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Financial Overview</h1>
                    <p className="text-gray-500 text-sm mt-1">Real-time status of your global savings accounts.</p>
                  </div>
                  <div className="flex flex-col gap-3 w-full md:w-auto">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-start md:justify-end">
                           <div className="flex items-center gap-2 relative">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Period:</span>
                              <div className="relative">
                                <button 
                                  onClick={() => setIsRangeFilterOpen(!isRangeFilterOpen)}
                                  className="flex items-center justify-between min-w-[140px] h-8 bg-white border border-gray-100 shadow-sm px-3 text-[11px] font-semibold rounded-md hover:bg-gray-50 transition-colors shrink-0"
                                >
                                  <span className="truncate max-w-[150px]">
                                    {getRangeLabel()}
                                  </span>
                                  <ChevronDown size={12} className={`text-gray-400 transition-transform ${isRangeFilterOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isRangeFilterOpen && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-40" 
                                      onClick={() => setIsRangeFilterOpen(false)}
                                    />
                                    <div className="absolute top-full right-0 mt-1 w-[280px] bg-white border border-gray-100 rounded-lg shadow-lg z-50 p-4 space-y-4">
                                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                        <span className="text-[11px] font-bold text-gray-700">Filter Period</span>
                                        <button 
                                          onClick={() => {
                                            setSelectedYear('all');
                                            setFilterByMonths(false);
                                            setStartMonth('all');
                                            setEndMonth('all');
                                            setIsRangeFilterOpen(false);
                                          }}
                                          className="text-[9px] font-bold text-blue-600 hover:underline cursor-pointer"
                                        >
                                          Reset All Time
                                        </button>
                                      </div>

                                      {/* Year Selection */}
                                      <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Select Year</label>
                                        <div className="flex flex-wrap gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleYearSelect('all')}
                                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                                              selectedYear === 'all'
                                                ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                                                : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                                            }`}
                                          >
                                            All Time
                                          </button>
                                          {years.map(yr => (
                                            <button
                                              key={yr}
                                              type="button"
                                              onClick={() => handleYearSelect(yr)}
                                              className={`px-2.5 py-1 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                                                selectedYear === yr
                                                  ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                                                  : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                                              }`}
                                            >
                                              {yr}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Refine by month toggle */}
                                      <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                                        <input
                                          type="checkbox"
                                          id="filterByMonths"
                                          checked={filterByMonths}
                                          onChange={(e) => setFilterByMonths(e.target.checked)}
                                          className="rounded text-blue-600 focus:ring-blue-500 border-gray-200 cursor-pointer w-3.5 h-3.5"
                                        />
                                        <label htmlFor="filterByMonths" className="text-[10px] font-bold text-gray-600 cursor-pointer select-none">
                                          Refine by months {selectedYear !== 'all' ? `of ${selectedYear}` : ''}
                                        </label>
                                      </div>

                                      {/* Month inputs */}
                                      {filterByMonths && (
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                          <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">From Month</label>
                                            <select 
                                              value={startMonth} 
                                              onChange={(e) => setStartMonth(e.target.value)}
                                              className="w-full text-[11px] bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none font-semibold focus:ring-1 focus:ring-blue-500"
                                            >
                                              {selectedYear === 'all' && <option value="all">Earliest</option>}
                                              {filteredAvailableMonths.map(m => (
                                                <option key={`start-${m.value}`} value={m.value}>{m.label}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">To Month</label>
                                            <select 
                                              value={endMonth} 
                                              onChange={(e) => setEndMonth(e.target.value)}
                                              className="w-full text-[11px] bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none font-semibold focus:ring-1 focus:ring-blue-500"
                                            >
                                              {selectedYear === 'all' && <option value="all">Latest (Today)</option>}
                                              {filteredAvailableMonths.map(m => (
                                                <option key={`end-${m.value}`} value={m.value}>{m.label}</option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>
                                      )}

                                      {filterByMonths && startMonth !== 'all' && endMonth !== 'all' && startMonth > endMonth && (
                                        <p className="text-[9px] text-red-500 font-bold">
                                          * Start month is after end month.
                                        </p>
                                      )}

                                      <button 
                                        onClick={() => setIsRangeFilterOpen(false)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-[10px] transition-colors shadow-sm cursor-pointer"
                                      >
                                        Apply Filter
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                           </div>
                           <div className="flex items-center gap-2 relative">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Owner:</span>
                              <div className="relative">
                                <button 
                                  onClick={() => setIsOwnerFilterOpen(!isOwnerFilterOpen)}
                                  className="flex items-center justify-between w-[130px] h-8 bg-white border border-gray-100 shadow-sm px-3 text-[11px] font-medium rounded-md hover:bg-gray-50 transition-colors shrink-0"
                                >
                                  <span className="truncate max-w-[90px]">
                                    {selectedOwners.length === 0 ? 'All Owners' : 
                                     selectedOwners.length === 1 ? selectedOwners[0] : 
                                     `${selectedOwners.length} Selected`}
                                  </span>
                                  <ChevronDown size={12} className={`text-gray-400 transition-transform ${isOwnerFilterOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isOwnerFilterOpen && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-40" 
                                      onClick={() => setIsOwnerFilterOpen(false)}
                                    />
                                    <div className="absolute top-full left-0 mt-1 w-[160px] bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
                                      <button 
                                        className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] hover:bg-gray-50 transition-colors"
                                        onClick={() => {
                                          setSelectedOwners([]);
                                          setIsOwnerFilterOpen(false);
                                        }}
                                      >
                                        <div className="w-4 h-4 flex items-center justify-center">
                                          {selectedOwners.length === 0 && <Check size={12} className="text-blue-600" />}
                                        </div>
                                        <span className={selectedOwners.length === 0 ? 'font-bold text-blue-600' : ''}>All Owners</span>
                                      </button>
                                      
                                      <div className="h-px bg-gray-100 my-1" />
                                      
                                      {owners.map(owner => (
                                        <button 
                                          key={owner}
                                          className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] hover:bg-gray-50 transition-colors"
                                          onClick={() => toggleOwner(owner)}
                                        >
                                          <div className="w-4 h-4 flex items-center justify-center border border-gray-200 rounded-sm bg-gray-50">
                                            {selectedOwners.includes(owner) && <Check size={12} className="text-blue-600" />}
                                          </div>
                                          <span className={selectedOwners.includes(owner) ? 'font-bold text-blue-600' : ''}>{owner}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Bank:</span>
                              <Select value={selectedBank} onValueChange={setSelectedBank}>
                                <SelectTrigger className="w-[120px] h-8 bg-white border-gray-100 shadow-sm text-[11px] font-medium rounded-md">
                                  <SelectValue placeholder="All Banks" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Banks</SelectItem>
                                  {banks.map(bank => (
                                    <SelectItem key={bank} value={bank} label={bank}>{bank}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                           </div>
                        </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {(Object.entries(totalBalances) as [string, number][]).map(([curr, amount]) => (
                    <div key={curr} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden relative group">
                      <div className={`absolute -top-10 -right-10 w-32 h-32 ${curr === 'RON' ? 'bg-orange-50' : 'bg-blue-50'} rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700`}></div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-2 ${curr === 'RON' ? 'bg-[#F97316]' : 'bg-blue-600'} rounded-lg shadow-lg ${curr === 'RON' ? 'shadow-orange-100' : 'shadow-blue-100'}`}>
                            <Banknote size={16} className="text-white" />
                          </div>
                          <div>
                            <h2 className="font-bold text-sm tracking-tight">Total {curr}</h2>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Liquid Assets</p>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{formatCurrency(amount, curr)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden relative group">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-100">
                          <CreditCard size={16} className="text-white" />
                        </div>
                        <div>
                          <h2 className="font-bold text-sm tracking-tight">Active Accounts</h2>
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Connected Vaults</p>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{accounts.filter(a => a.is_active).length}</span>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                          Across {new Set(accounts.filter(a => a.is_active).map(a => a.bank_name)).size} Banks
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid Split */}
                <div className="grid grid-cols-12 gap-6 pb-8">
                  <div className="col-span-12 lg:col-span-8 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden relative group">
                      <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-100">
                              <TrendingUp size={16} className="text-white" />
                            </div>
                            <div>
                              <h2 className="font-bold text-sm tracking-tight">Portfolio Evolution</h2>
                              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Growth across {getRangeLabel()} • EUR scaled to RON baseline for visual proportion</p>
                            </div>
                          </div>
                          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                            <button 
                              onClick={() => setChartCurrencyFilter('all')}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${chartCurrencyFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              ALL
                            </button>
                            <button 
                              onClick={() => setChartCurrencyFilter('TOTAL')}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${chartCurrencyFilter === 'TOTAL' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              TOTAL
                            </button>
                            <button 
                              onClick={() => setChartCurrencyFilter('RON')}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${chartCurrencyFilter === 'RON' ? 'bg-[#F97316] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              RON
                            </button>
                            <button 
                              onClick={() => setChartCurrencyFilter('EUR')}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${chartCurrencyFilter === 'EUR' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              EUR
                            </button>
                          </div>
                        </div>
                        <div className="h-[280px] sm:h-[400px] lg:h-[500px] w-full min-w-0">
                          {isChartReady ? (
                            <ResponsiveContainer width="100%" height="100%" debounce={250}>
                              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                                  </linearGradient>
                                  <linearGradient id="colorRon" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.0}/>
                                  </linearGradient>
                                  <linearGradient id="colorEur" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis 
                                  dataKey="day" 
                                  stroke="#94A3B8" 
                                  fontSize={10} 
                                  tickLine={false} 
                                  axisLine={false} 
                                  dy={10}
                                  tickFormatter={(str) => {
                                    const date = new Date(str);
                                    return date.toLocaleDateString('en-GB', { 
                                      month: 'short',
                                      year: '2-digit'
                                    });
                                  }}
                                />
                                <YAxis 
                                  stroke="#94A3B8" 
                                  fontSize={10} 
                                  tickLine={false} 
                                  axisLine={false}
                                  dx={-10}
                                  tickFormatter={(val: number) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val.toString()}
                                />
                                <Tooltip 
                                  formatter={(value: any, name: string, props: any) => {
                                    if (name === 'Total (in RON)' || name === 'Total (RON)' || name === 'Total_RON') {
                                      return [formatCurrency(value ?? 0, 'RON'), 'Total (in RON)'];
                                    }
                                    if (name === 'EUR') {
                                      const rawEur = props.payload?.EUR;
                                      return [
                                        `${formatCurrency(rawEur ?? 0, 'EUR')} (~${formatCurrency(value ?? 0, 'RON')} equivalent)`,
                                        'EUR'
                                      ];
                                    }
                                    if (name === 'RON') {
                                      return [formatCurrency(value, 'RON'), 'RON'];
                                    }
                                    return [value, name];
                                  }}
                                  contentStyle={{ 
                                    borderRadius: '12px', 
                                    border: 'none', 
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                    fontSize: '12px',
                                    padding: '12px'
                                  }} 
                                  itemStyle={{ padding: '2px 0' }}
                                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#1E293B' }}
                                  labelFormatter={(label) => {
                                    const d = new Date(label);
                                    return d.toLocaleDateString('en-GB', {
                                      month: 'long',
                                      year: 'numeric'
                                    });
                                  }}
                                />
                                <Legend 
                                  verticalAlign="top" 
                                  align="right" 
                                  height={36} 
                                  iconType="circle" 
                                  iconSize={8}
                                  wrapperStyle={{ fontSize: '11px', fontWeight: 500, paddingBottom: '20px' }}
                                />
                                {(chartCurrencyFilter === 'all' || chartCurrencyFilter === 'TOTAL') && (
                                  <Area 
                                    type="monotone" 
                                    dataKey="Total_RON" 
                                    name="Total (in RON)"
                                    stroke="#10B981" 
                                    strokeWidth={2.5} 
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                    dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} 
                                    activeDot={{ r: 6 }} 
                                  />
                                )}
                                {(chartCurrencyFilter === 'all' || chartCurrencyFilter === 'RON') && (
                                  <Area 
                                    type="monotone" 
                                    dataKey="RON" 
                                    name="RON"
                                    stroke="#F97316" 
                                    strokeWidth={2.5} 
                                    fillOpacity={1}
                                    fill="url(#colorRon)"
                                    dot={{ r: 4, fill: '#F97316', strokeWidth: 2, stroke: '#fff' }} 
                                    activeDot={{ r: 6 }} 
                                  />
                                )}
                                {(chartCurrencyFilter === 'all' || chartCurrencyFilter === 'EUR') && (
                                  <Area 
                                    type="monotone" 
                                    dataKey="EUR_scaled" 
                                    name="EUR"
                                    stroke="#2563EB" 
                                    strokeWidth={2.5} 
                                    fillOpacity={1}
                                    fill="url(#colorEur)"
                                    dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} 
                                    activeDot={{ r: 6 }} 
                                  />
                                )}
                              </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-lg animate-pulse gap-2 border border-slate-100/50">
                            <p className="text-[11px] font-medium text-slate-400">Loading chart view...</p>
                          </div>
                        )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden relative group">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-slate-800 rounded-lg shadow-sm shadow-slate-100">
                               <History size={14} className="text-white" />
                             </div>
                             <div>
                               <h2 className="font-bold text-sm tracking-tight text-slate-900">Recent Activity</h2>
                               <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Latest transactions</p>
                             </div>
                           </div>
                           <button 
                             onClick={() => setActiveTab('transactions')}
                             className="text-[10px] font-extrabold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors flex items-center gap-1"
                           >
                             Full Board <ArrowRight size={10} />
                           </button>
                        </div>

                        <div className="divide-y divide-gray-100/80">
                          {transactions
                            .filter(tx => 
                              tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              accounts.find(a => a.id === tx.account_id)?.name.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .slice(0, 5).map((tx) => {
                              const account = accountsMap.get(tx.account_id);
                              const targetAccount = tx.to_account_id ? accountsMap.get(tx.to_account_id) : null;
                              
                              return (
                                <div 
                                  key={tx.id} 
                                  className="py-2 px-1 flex items-center justify-between gap-3" 
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[10px] font-black ${
                                      tx.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                      tx.type === 'WITHDRAWAL' ? 'bg-rose-50 text-rose-500 border border-rose-100' :
                                      'bg-blue-50 text-blue-600 border border-blue-100'
                                    }`}>
                                      {tx.type === 'DEPOSIT' && <TrendingUp size={12} />}
                                      {tx.type === 'WITHDRAWAL' && <CreditCard size={12} />}
                                      {tx.type === 'TRANSFER' && <ArrowRightLeft size={12} />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                                        {tx.description || 'System Entry'}
                                      </p>
                                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                        <span className="truncate">
                                          {tx.type === 'TRANSFER' ? `${account?.name || 'Vault'} → ${targetAccount?.name || 'Vault'}` : (account?.name || 'Vault')}
                                        </span>
                                        <span>•</span>
                                        <span className="shrink-0">{formatDate(tx.date)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-right shrink-0">
                                    <div className={`text-xs font-bold ${
                                      tx.type === 'DEPOSIT' ? 'text-emerald-600' : tx.type === 'WITHDRAWAL' ? 'text-rose-500' : 'text-blue-600'
                                    }`}>
                                      {tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER' ? '-' : '+'}
                                      {formatCurrency(tx.amount, tx.currency)}
                                    </div>
                                    <span className={`text-[9px] font-black tracking-tighter uppercase ${
                                      tx.type === 'DEPOSIT' ? 'text-emerald-600/80' : 
                                      tx.type === 'WITHDRAWAL' ? 'text-rose-500/80' : 
                                      'text-blue-600/80'
                                    }`}>
                                      {tx.type}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          {transactions.length === 0 && (
                            <div className="py-6 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No activity recorded</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-12 lg:col-span-4 space-y-6">


                    {/* Currency Snapshot */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden relative group">
                      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-2">
                             <div className="p-2 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-100">
                               <Banknote size={16} className="text-white" />
                             </div>
                             <div>
                               <h2 className="font-bold text-sm tracking-tight text-gray-900">Currency Snapshot</h2>
                               <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Consolidated EUR</p>
                             </div>
                           </div>
                           {currencySnapshot && (
                             <div className="bg-emerald-50 px-2 py-1 rounded text-[10px] font-bold text-emerald-700 border border-emerald-100 italic">
                               Live Rate
                             </div>
                           )}
                        </div>

                        {currencySnapshot ? (
                          <div className="space-y-4">
                            <div>
                               <div className="flex items-baseline gap-2 mb-1">
                                  <span className="text-3xl font-black text-gray-900 tracking-tighter">
                                    {formatCurrency(currencySnapshot.totalEur, 'EUR')}
                                  </span>
                               </div>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Combined Capital</p>
                            </div>
                            
                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                               <div className="flex justify-between items-center text-[10px]">
                                 <span className="text-gray-500 font-medium uppercase">Direct EUR</span>
                                 <span className="font-bold text-gray-900">{formatCurrency(totalBalances['EUR'] || 0, 'EUR')}</span>
                               </div>
                               <div className="flex justify-between items-center text-[10px]">
                                 <span className="text-gray-500 font-medium uppercase">Converted RON</span>
                                 <span className="font-bold text-gray-900">{formatCurrency(currencySnapshot.ronContribution, 'EUR')}</span>
                               </div>
                               <div className="h-px bg-gray-200 mt-1" />
                               <div className="flex justify-between items-center pt-1">
                                 <span className="text-[9px] text-gray-400 font-bold uppercase">1 RON ≈</span>
                                 <span className="text-[10px] font-black text-emerald-600 italic">{(currencySnapshot.rate).toFixed(4)} EUR</span>
                               </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-12 flex flex-col items-center justify-center space-y-3 opacity-40">
                             <TrendingUp size={24} className="text-gray-300 animate-pulse" />
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Synching rates...</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* The Due Radar */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden relative group">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-2">
                             <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-100">
                               <Radar size={16} className="text-white animate-pulse" />
                             </div>
                             <div>
                               <h2 className="font-bold text-sm tracking-tight">The Due Radar</h2>
                               <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Priority Watchlist</p>
                             </div>
                           </div>
                           <div className="flex -space-x-2">
                             {dueSoonAccounts.slice(0, 3).map((a, i) => (
                               <div key={a.id} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400" title={a.owner}>
                                 {a.owner.substring(0, 1)}
                               </div>
                             ))}
                           </div>
                        </div>

                        <div className="space-y-3">
                          {dueSoonAccounts.slice(0, 3).map(acc => (
                            <div key={acc.id} className="relative p-3 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-white hover:border-blue-100 hover:shadow-md transition-all cursor-pointer group/item" onClick={() => setActiveTab('accounts')}>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{acc.bank_name}</p>
                                    <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-gray-100 leading-none shrink-0">
                                      {acc.owner}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-gray-900 group-hover/item:text-blue-700 transition-colors uppercase tracking-tight">{acc.name}</p>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-[10px] font-black italic shadow-sm ${
                                  acc.daysLeft <= 0 ? 'bg-red-500 text-white animate-elegant-pulse' :
                                  acc.daysLeft <= 10 ? 'bg-orange-500 text-white' :
                                  acc.daysLeft <= 31 ? 'bg-blue-600 text-white' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {acc.daysLeft === 0 ? 'DUE TODAY' : acc.daysLeft < 0 ? 'OVERDUE' : `T-MINUS ${acc.daysLeft}D`}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-1.5">
                                   <CalendarDays size={10} className="text-gray-400" />
                                   <span className="text-[10px] font-medium text-gray-500">{formatDate(acc.due_date, 'long')}</span>
                                 </div>
                                 <p className="text-xs font-black text-gray-900">{formatCurrency(acc.current_balance, acc.currency)}</p>
                              </div>
                            </div>
                          ))}
                          {dueSoonAccounts.length === 0 && (
                            <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No active targets on radar</p>
                            </div>
                          )}
                        </div>
                        {dueSoonAccounts.length > 3 && (
                          <button 
                            onClick={() => setActiveTab('accounts')}
                            className="w-full mt-4 py-2 text-[10px] font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                          >
                            View all {dueSoonAccounts.length} scheduled items <ArrowRight size={10} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* The Owner Pulse */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden relative group">
                      <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-2">
                             <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-100">
                               <TrendingUp size={16} className="text-white" />
                             </div>
                             <div>
                               <h2 className="font-bold text-sm tracking-tight">The Owner Pulse</h2>
                               <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Contribution Breakdown</p>
                             </div>
                           </div>
                        </div>

                        <div className="space-y-5">
                          {ownerPulse.map((op, idx) => (
                            <div key={op.owner} className="space-y-1.5">
                              <div className="flex justify-between items-end">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{op.owner}</span>
                                  <span className="text-[9px] font-bold text-gray-400">{op.percentage.toFixed(1)}%</span>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-gray-900 leading-none">
                                    {op.EUR > 0 && formatCurrency(op.EUR, 'EUR')}
                                    {op.EUR > 0 && op.RON > 0 && <span className="mx-1 text-gray-300">|</span>}
                                    {op.RON > 0 && formatCurrency(op.RON, 'RON')}
                                  </p>
                                </div>
                              </div>
                              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${op.percentage}%` }}
                                  transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                                  className={`h-full rounded-full ${
                                    idx === 0 ? 'bg-blue-600' : 
                                    idx === 1 ? 'bg-blue-400' : 
                                    'bg-blue-200'
                                  }`}
                                />
                              </div>
                            </div>
                          ))}
                          {ownerPulse.length === 0 && (
                            <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No active data points</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'accounts' && (
              <motion.div
                key="accounts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Your Accounts</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage connection details and specific descriptions.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Status:</span>
                      <Select value={accountStatusFilter} onValueChange={(v: any) => setAccountStatusFilter(v)}>
                        <SelectTrigger className="w-[90px] h-9 bg-white border-gray-200 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Currency:</span>
                       <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                         <SelectTrigger className="w-[85px] h-9 bg-white border-gray-200 text-xs">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All</SelectItem>
                           <SelectItem value="RON">RON</SelectItem>
                           <SelectItem value="EUR">EUR</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Owner:</span>
                       <div className="relative">
                        <button 
                          onClick={() => setIsOwnerFilterOpen(!isOwnerFilterOpen)}
                          className="flex items-center justify-between min-w-[110px] max-w-[150px] h-9 bg-white border border-gray-200 shadow-sm px-3 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors shrink-0"
                        >
                          <span className="truncate">
                            {selectedOwners.length === 0 ? 'All Owners' : 
                             selectedOwners.length === 1 ? selectedOwners[0] : 
                             `${selectedOwners.length} Selected`}
                          </span>
                          <ChevronDown size={14} className={`text-gray-400 transition-transform ml-2 ${isOwnerFilterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isOwnerFilterOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setIsOwnerFilterOpen(false)}
                            />
                            <div className="absolute top-full left-0 mt-1 w-[160px] bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1 overflow-hidden animate-in fade-in zoom-in duration-100">
                              <button 
                                className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] hover:bg-gray-50 transition-colors"
                                onClick={() => {
                                  setSelectedOwners([]);
                                  setIsOwnerFilterOpen(false);
                                }}
                              >
                                <div className="w-4 h-4 flex items-center justify-center">
                                  {selectedOwners.length === 0 && <Check size={12} className="text-blue-600" />}
                                </div>
                                <span className={selectedOwners.length === 0 ? 'font-bold text-blue-600' : ''}>All Owners</span>
                              </button>
                              
                              <div className="h-px bg-gray-100 my-1" />
                              
                              {owners.map(owner => (
                                <button 
                                  key={owner}
                                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] hover:bg-gray-50 transition-colors"
                                  onClick={() => toggleOwner(owner)}
                                >
                                  <div className="w-4 h-4 flex items-center justify-center border border-gray-200 rounded-sm bg-gray-50">
                                    {selectedOwners.includes(owner) && <Check size={12} className="text-blue-600" />}
                                  </div>
                                  <span className={selectedOwners.includes(owner) ? 'font-bold text-blue-600' : ''}>{owner}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Bank:</span>
                       <Select value={selectedBank} onValueChange={setSelectedBank}>
                         <SelectTrigger className="w-[110px] h-9 bg-white border-gray-200 text-xs">
                           <SelectValue placeholder="All" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All Banks</SelectItem>
                           {banks.map(bank => (
                             <SelectItem key={bank} value={bank} label={bank}>{bank}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="h-6 w-px bg-gray-200 mx-1 hidden md:block" />
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Sort:</span>
                       <Select value={accountsSortField} onValueChange={(v: any) => setAccountsSortField(v)}>
                         <SelectTrigger className="w-[110px] h-9 bg-white border-gray-200 text-xs">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="balance">Balance</SelectItem>
                           <SelectItem value="owner">Owner</SelectItem>
                           <SelectItem value="bank">Bank</SelectItem>
                           <SelectItem value="currency">Currency</SelectItem>
                           <SelectItem value="due_date">Due Date</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="flex items-center gap-2">
                       <Select value={accountsSortOrder} onValueChange={(v: any) => setAccountsSortOrder(v)}>
                         <SelectTrigger className="w-[100px] h-9 bg-white border-gray-200 text-xs">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="desc">High-Low</SelectItem>
                           <SelectItem value="asc">Low-High</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>

                  </div>
                </div>

                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Accounts</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Owner</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Due Date</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Balance</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {accounts
                            .filter(a => a.is_active && (accountStatusFilter === 'all' || accountStatusFilter === 'active'))
                            .filter(a => selectedOwners.length === 0 || selectedOwners.includes(a.owner))
                            .filter(a => selectedBank === 'all' || a.bank_name === selectedBank)
                            .filter(a => selectedCurrency === 'all' || a.currency === selectedCurrency)
                            .filter(a => searchQuery === '' || a.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .sort((a, b) => {
                              let comparison = 0;
                              if (accountsSortField === 'balance') comparison = a.current_balance - b.current_balance;
                              else if (accountsSortField === 'owner') comparison = a.owner.localeCompare(b.owner);
                              else if (accountsSortField === 'bank') comparison = a.bank_name.localeCompare(b.bank_name);
                              else if (accountsSortField === 'currency') comparison = a.currency.localeCompare(b.currency);
                              else if (accountsSortField === 'due_date') {
                                if (!a.due_date && !b.due_date) comparison = 0;
                                else if (!a.due_date) comparison = 1;
                                else if (!b.due_date) comparison = -1;
                                else comparison = a.due_date.localeCompare(b.due_date);
                              }
                              
                              return accountsSortOrder === 'desc' ? -comparison : comparison;
                            })
                            .map((acc) => (
                            <tr key={acc.id} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                    <Building2 size={16} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <div className="text-sm font-bold text-gray-900 leading-none truncate">{acc.name}</div>
                                      {acc.description && (
                                        <div className="group/info relative">
                                          <Info size={12} className="text-gray-300 hover:text-blue-500 cursor-help transition-colors" />
                                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50 shadow-xl pointer-events-none normal-case font-normal">
                                            {acc.description}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{acc.bank_name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{acc.owner}</span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {acc.due_date ? (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getDueDateTheme(acc.due_date)}`}>
                                    {formatDate(acc.due_date, 'long')}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-300">—</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    <span className="text-[9px] font-bold uppercase tracking-tight text-gray-400">{acc.currency}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(acc.current_balance, acc.currency)}</span>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                    onClick={() => {
                                      setEditingAccount(acc);
                                      setIsEditAccountOpen(true);
                                    }}
                                  >
                                    <Pencil size={12} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAccountToDelete(acc);
                                      setIsDeleteConfirmOpen(true);
                                    }}
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        
                        {/* Inactive Accounts Section */}
                        {accounts.some(a => !a.is_active) && (accountStatusFilter === 'all' || accountStatusFilter === 'inactive') && (
                          <>
                            <thead className="bg-gray-50/80 border-t border-b border-gray-100">
                              <tr>
                                <th colSpan={6} className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">
                                  Inactive Accounts
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-gray-50/30">
                              {accounts
                                .filter(a => !a.is_active && (accountStatusFilter === 'all' || accountStatusFilter === 'inactive'))
                                .filter(a => selectedOwners.length === 0 || selectedOwners.includes(a.owner))
                                .filter(a => selectedBank === 'all' || a.bank_name === selectedBank)
                                .filter(a => selectedCurrency === 'all' || a.currency === selectedCurrency)
                                .filter(a => searchQuery === '' || a.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                .sort((a, b) => b.current_balance - a.current_balance) // Simple sort for inactive
                                .map((acc) => (
                                <tr key={acc.id} className="hover:bg-gray-100/50 transition-colors group opacity-70">
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 italic">
                                        <Building2 size={16} />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <div className="text-sm font-bold text-gray-500 leading-none truncate line-through">{acc.name}</div>
                                          {acc.description && (
                                            <div className="group/info relative">
                                              <Info size={12} className="text-gray-300 hover:text-blue-500 cursor-help transition-colors" />
                                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50 shadow-xl pointer-events-none normal-case font-normal no-underline">
                                                {acc.description}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-gray-300 font-medium uppercase tracking-tight">{acc.bank_name}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100/50 px-2 py-0.5 rounded-full">{acc.owner}</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className="text-[10px] text-gray-300">—</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                      <span className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter bg-gray-100 px-1 rounded">Archived</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <span className="text-sm font-medium text-gray-400">{formatCurrency(acc.current_balance, acc.currency)}</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 hover:text-blue-600 hover:bg-blue-50"
                                        onClick={() => {
                                          setEditingAccount(acc);
                                          setIsEditAccountOpen(true);
                                        }}
                                      >
                                        <Pencil size={12} />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 hover:text-red-500 hover:bg-red-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setAccountToDelete(acc);
                                          setIsDeleteConfirmOpen(true);
                                        }}
                                      >
                                        <Trash2 size={12} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {accounts
                      .filter(a => (accountStatusFilter === 'all' || (a.is_active && accountStatusFilter === 'active') || (!a.is_active && accountStatusFilter === 'inactive')))
                      .filter(a => selectedOwners.length === 0 || selectedOwners.includes(a.owner))
                      .filter(a => selectedBank === 'all' || a.bank_name === selectedBank)
                      .filter(a => selectedCurrency === 'all' || a.currency === selectedCurrency)
                      .filter(a => searchQuery === '' || a.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .sort((a, b) => {
                        let comparison = 0;
                        if (accountsSortField === 'balance') comparison = a.current_balance - b.current_balance;
                        else if (accountsSortField === 'owner') comparison = a.owner.localeCompare(b.owner);
                        else if (accountsSortField === 'bank') comparison = a.bank_name.localeCompare(b.bank_name);
                        else if (accountsSortField === 'currency') comparison = a.currency.localeCompare(b.currency);
                        else if (accountsSortField === 'due_date') {
                          if (!a.due_date && !b.due_date) comparison = 0;
                          else if (!a.due_date) comparison = 1;
                          else if (!b.due_date) comparison = -1;
                          else comparison = a.due_date.localeCompare(b.due_date);
                        }
                        return accountsSortOrder === 'desc' ? -comparison : comparison;
                      })
                      .map((acc) => (
                      <Card key={acc.id} className={`shadow-sm border-gray-100 flex flex-col ${!acc.is_active ? 'opacity-70 bg-gray-50/50' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${acc.is_active ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                <Building2 size={16} />
                              </div>
                              <div className="min-w-0">
                                <div className={`text-sm font-bold truncate ${acc.is_active ? 'text-gray-900' : 'text-gray-500 line-through'}`}>{acc.name}</div>
                                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight mb-1">{acc.bank_name}</div>
                                {acc.description && (
                                  <p className="text-[10px] text-gray-400 italic line-clamp-1">{acc.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingAccount(acc); setIsEditAccountOpen(true); }}>
                                <Pencil size={14} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => { setAccountToDelete(acc); setIsDeleteConfirmOpen(true); }}>
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-2">
                             <div>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Owner</p>
                                <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{acc.owner}</span>
                             </div>
                             <div>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Balance</p>
                                <p className="text-sm font-bold text-gray-900">{formatCurrency(acc.current_balance, acc.currency)}</p>
                             </div>
                          </div>

                          {acc.due_date && (
                            <div className="mt-3 pt-3 border-t border-gray-50">
                              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Due Date</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${getDueDateTheme(acc.due_date)}`}>
                                <CalendarDays size={10} /> {formatDate(acc.due_date, 'long')}
                              </span>
                            </div>
                          )}
                          {!acc.is_active && (
                            <div className="mt-3 text-center">
                               <span className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter bg-gray-100 px-2 py-0.5 rounded">Archived Account</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ledger Activity</h1>
                    <p className="text-gray-500 text-sm mt-1">Audit trail of all money movements across connected bank vaults.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Date Range Filter */}
                    <div className="flex items-center gap-2 relative">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Date:</span>
                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => setIsTxDateFilterOpen(!isTxDateFilterOpen)}
                          className={`flex items-center justify-between min-w-[130px] max-w-[200px] h-9 border shadow-2xs px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                            isTxDateFilterActive
                              ? 'bg-blue-50/90 border-blue-300 text-blue-700 font-semibold'
                              : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <CalendarDays size={13} className={isTxDateFilterActive ? 'text-blue-600 shrink-0' : 'text-gray-400 shrink-0'} />
                            <span className="truncate">{getTxDateFilterLabel()}</span>
                          </div>
                          <ChevronDown size={14} className={`text-gray-400 transition-transform ml-1.5 shrink-0 ${isTxDateFilterOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isTxDateFilterOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setIsTxDateFilterOpen(false)}
                            />
                            <div className="absolute top-full left-0 mt-1.5 w-[310px] sm:w-[330px] bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-4 space-y-3.5 animate-in fade-in zoom-in duration-100">
                              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                <div className="flex items-center gap-1.5">
                                  <CalendarDays size={15} className="text-blue-600" />
                                  <span className="text-xs font-bold text-slate-800">Filter by Date</span>
                                </div>
                                {isTxDateFilterActive && (
                                  <button
                                    type="button"
                                    onClick={clearTxDateFilter}
                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Quick Presets</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {[
                                    { id: 'all', label: 'All Time' },
                                    { id: 'today', label: 'Today' },
                                    { id: 'this_month', label: 'This Month' },
                                    { id: 'last_month', label: 'Last Month' },
                                    { id: 'last_30_days', label: 'Last 30d' },
                                    { id: 'last_90_days', label: 'Last 90d' },
                                    { id: 'this_year', label: 'This Year' }
                                  ].map(p => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => applyTxDatePreset(p.id)}
                                      className={`px-2 py-1.5 text-[10px] font-bold rounded-md border transition-all cursor-pointer text-center truncate ${
                                        txDatePreset === p.id && (p.id === 'all' ? !txStartDate && !txEndDate : true)
                                          ? 'bg-blue-50 border-blue-300 text-blue-600 shadow-2xs'
                                          : 'bg-gray-50/80 border-gray-200/70 text-gray-600 hover:bg-gray-100'
                                      }`}
                                    >
                                      {p.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2 pt-2 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Custom Range</label>
                                  {(txStartDate || txEndDate) && (
                                    <button
                                      type="button"
                                      onClick={clearTxDateFilter}
                                      className="text-[9px] font-bold text-rose-500 hover:underline cursor-pointer"
                                    >
                                      Clear Dates
                                    </button>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-semibold text-gray-500 block">From</span>
                                    <input
                                      type="date"
                                      value={txStartDate}
                                      onChange={(e) => {
                                        setTxStartDate(e.target.value);
                                        setTxDatePreset('custom');
                                      }}
                                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none font-medium focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-semibold text-gray-500 block">To</span>
                                    <input
                                      type="date"
                                      value={txEndDate}
                                      onChange={(e) => {
                                        setTxEndDate(e.target.value);
                                        setTxDatePreset('custom');
                                      }}
                                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none font-medium focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
                                    />
                                  </div>
                                </div>
                                {txStartDate && txEndDate && txStartDate > txEndDate && (
                                  <p className="text-[9px] text-red-500 font-semibold">
                                    * Start date cannot be after end date.
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setIsTxDateFilterOpen(false)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-2xs cursor-pointer"
                              >
                                Done
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Type:</span>
                      <Select value={txTypeFilter} onValueChange={(v: any) => setTxTypeFilter(v)}>
                        <SelectTrigger className="w-[110px] h-9 bg-white border-gray-200 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="DEPOSIT">Deposits</SelectItem>
                          <SelectItem value="WITHDRAWAL">Withdrawals</SelectItem>
                          <SelectItem value="TRANSFER">Transfers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Currency:</span>
                       <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                         <SelectTrigger className="w-[85px] h-9 bg-white border-gray-200 text-xs">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All</SelectItem>
                           <SelectItem value="RON">RON</SelectItem>
                           <SelectItem value="EUR">EUR</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>

                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Owner:</span>
                       <div className="relative">
                        <button 
                          onClick={() => setIsOwnerFilterOpen(!isOwnerFilterOpen)}
                          className="flex items-center justify-between min-w-[110px] max-w-[150px] h-9 bg-white border border-gray-200 shadow-sm px-3 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors shrink-0"
                        >
                          <span className="truncate">
                            {selectedOwners.length === 0 ? 'All Owners' : 
                             selectedOwners.length === 1 ? selectedOwners[0] : 
                             `${selectedOwners.length} Selected`}
                          </span>
                          <ChevronDown size={14} className={`text-gray-400 transition-transform ml-2 ${isOwnerFilterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isOwnerFilterOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setIsOwnerFilterOpen(false)}
                            />
                            <div className="absolute top-full left-0 mt-1 w-[160px] bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1 overflow-hidden animate-in fade-in zoom-in duration-100">
                              <button 
                                className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] hover:bg-gray-50 transition-colors"
                                onClick={() => {
                                  setSelectedOwners([]);
                                  setIsOwnerFilterOpen(false);
                                }}
                              >
                                <div className="w-4 h-4 flex items-center justify-center">
                                  {selectedOwners.length === 0 && <Check size={12} className="text-blue-600" />}
                                </div>
                                <span className={selectedOwners.length === 0 ? 'font-bold text-blue-600' : ''}>All Owners</span>
                              </button>
                              
                              <div className="h-px bg-gray-100 my-1" />
                              
                              {owners.map(owner => (
                                <button 
                                  key={owner}
                                  className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] hover:bg-gray-50 transition-colors"
                                  onClick={() => toggleOwner(owner)}
                                >
                                  <div className="w-4 h-4 flex items-center justify-center border border-gray-200 rounded-sm bg-gray-50">
                                    {selectedOwners.includes(owner) && <Check size={12} className="text-blue-600" />}
                                  </div>
                                  <span className={selectedOwners.includes(owner) ? 'font-bold text-blue-600' : ''}>{owner}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Bank:</span>
                       <Select value={selectedBank} onValueChange={setSelectedBank}>
                         <SelectTrigger className="w-[110px] h-9 bg-white border-gray-200 text-xs">
                           <SelectValue placeholder="All" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All Banks</SelectItem>
                           {banks.map(bank => (
                             <SelectItem key={bank} value={bank} label={bank}>{bank}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-1 hidden md:block" />
                    
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Sort:</span>
                       <Select value={txSortOrder} onValueChange={(v: 'newest' | 'oldest') => setTxSortOrder(v)}>
                         <SelectTrigger className="w-[110px] h-9 bg-white border-gray-200 text-xs">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="newest" label="Newest first">Newest first</SelectItem>
                           <SelectItem value="oldest" label="Oldest first">Oldest first</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                  </div>
                </div>

                {/* Active Filter Tags Bar */}
                {(isTxDateFilterActive || txTypeFilter !== 'all' || selectedCurrency !== 'all' || selectedOwners.length > 0 || selectedBank !== 'all' || searchQuery) && (
                  <div className="flex flex-wrap items-center gap-2 bg-blue-50/40 border border-blue-100 rounded-xl px-3.5 py-2">
                    <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1 mr-1">
                      <Filter size={11} className="text-blue-600" /> Filters:
                    </span>

                    {isTxDateFilterActive && (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-white text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
                        <CalendarDays size={11} className="text-blue-500" />
                        <span>{getTxDateFilterLabel()}</span>
                        <button
                          type="button"
                          onClick={clearTxDateFilter}
                          className="text-blue-400 hover:text-blue-700 cursor-pointer ml-0.5"
                          title="Clear date filter"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}

                    {txTypeFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-white text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
                        <span>Type: {txTypeFilter}</span>
                        <button
                          type="button"
                          onClick={() => setTxTypeFilter('all')}
                          className="text-blue-400 hover:text-blue-700 cursor-pointer ml-0.5"
                          title="Clear type filter"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}

                    {selectedCurrency !== 'all' && (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-white text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
                        <span>Currency: {selectedCurrency}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedCurrency('all')}
                          className="text-blue-400 hover:text-blue-700 cursor-pointer ml-0.5"
                          title="Clear currency filter"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}

                    {selectedOwners.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-white text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
                        <span>Owner: {selectedOwners.join(', ')}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedOwners([])}
                          className="text-blue-400 hover:text-blue-700 cursor-pointer ml-0.5"
                          title="Clear owner filter"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}

                    {selectedBank !== 'all' && (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-white text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
                        <span>Bank: {selectedBank}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedBank('all')}
                          className="text-blue-400 hover:text-blue-700 cursor-pointer ml-0.5"
                          title="Clear bank filter"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Showing <strong className="text-slate-800 font-semibold">{filteredTransactions.length}</strong> of {transactions.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          clearTxDateFilter();
                          setTxTypeFilter('all');
                          setSelectedCurrency('all');
                          setSelectedOwners([]);
                          setSelectedBank('all');
                          setSearchQuery('');
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ml-2"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-8">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Movement & Vaults</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Label / Description</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Owner</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Timestamp</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Value</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {visibleTransactions.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                <History size={32} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-sm font-semibold text-gray-600">No transactions match your filter criteria</p>
                                <p className="text-xs text-gray-400 mt-1">Try adjusting the date range or clearing active filters</p>
                                {(isTxDateFilterActive || txTypeFilter !== 'all' || selectedCurrency !== 'all' || selectedOwners.length > 0 || selectedBank !== 'all' || searchQuery) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      clearTxDateFilter();
                                      setTxTypeFilter('all');
                                      setSelectedCurrency('all');
                                      setSelectedOwners([]);
                                      setSelectedBank('all');
                                      setSearchQuery('');
                                    }}
                                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-blue-600 text-xs font-semibold rounded-lg shadow-2xs hover:bg-gray-50 cursor-pointer"
                                  >
                                    <X size={12} /> Reset all filters
                                  </button>
                                )}
                              </td>
                            </tr>
                          ) : (
                            visibleTransactions.map((tx) => {
                            const account = accountsMap.get(tx.account_id);
                            const targetAccount = tx.to_account_id ? accountsMap.get(tx.to_account_id) : null;
                            
                            return (
                              <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      {/* Beautiful status/direction icons */}
                                      {tx.type === 'DEPOSIT' && (
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                                          <TrendingUp size={16} />
                                        </div>
                                      )}
                                      {tx.type === 'WITHDRAWAL' && (
                                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shrink-0">
                                          <CreditCard size={16} />
                                        </div>
                                      )}
                                      {tx.type === 'TRANSFER' && (
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                                          <ArrowRightLeft size={16} />
                                        </div>
                                      )}

                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className={`text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                            tx.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                                            tx.type === 'WITHDRAWAL' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 
                                            'bg-blue-50 text-blue-700 border border-blue-100'
                                          }`}>
                                            {tx.type}
                                          </span>
                                        </div>

                                        <div className="text-sm font-bold text-slate-800 leading-tight">
                                          {tx.type === 'DEPOSIT' && (
                                            <span>To <span className="text-slate-900">{account?.name || 'Unknown Vault'}</span></span>
                                          )}
                                          {tx.type === 'WITHDRAWAL' && (
                                            <span>From <span className="text-slate-900">{account?.name || 'Unknown Vault'}</span></span>
                                          )}
                                          {tx.type === 'TRANSFER' && (
                                            <span className="inline-flex items-center gap-1.5 flex-wrap">
                                              <span>{account?.name}</span>
                                              <ArrowRight size={12} className="text-blue-500 shrink-0 inline-block" />
                                              <span>{targetAccount?.name || 'Target Vault'}</span>
                                            </span>
                                          )}
                                        </div>
                                        
                                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight mt-0.5">
                                          {tx.type === 'TRANSFER' ? (
                                            <span>{account?.bank_name} ➔ {targetAccount?.bank_name}</span>
                                          ) : (
                                            <span>{account?.bank_name}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  
                                  <td className="px-4 py-3 text-slate-600 text-xs font-normal max-w-[240px] truncate" title={tx.description || 'System entry'}>
                                    {tx.description || <span className="text-gray-300 italic">No note attached</span>}
                                  </td>

                                  <td className="px-4 py-3 text-center">
                                    {tx.type === 'TRANSFER' && account && targetAccount && account.owner !== targetAccount.owner ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{account.owner}</span>
                                        <ArrowRight size={10} className="text-gray-400" />
                                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{targetAccount.owner}</span>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                        {account?.owner || targetAccount?.owner || '—'}
                                      </span>
                                    )}
                                  </td>

                                  <td className="px-4 py-3 text-center">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-100 bg-gray-50 text-gray-500 inline-flex items-center gap-1">
                                      <CalendarDays size={10} /> {formatDate(tx.date, 'long')}
                                    </span>
                                  </td>

                                  <td className={`px-4 py-3 text-right font-mono text-sm font-bold tracking-tight ${
                                    tx.type === 'DEPOSIT' ? 'text-emerald-600' : 
                                    tx.type === 'WITHDRAWAL' ? 'text-rose-500' : 
                                    'text-blue-600'
                                  }`}>
                                    {tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER' ? '−' : '+'}
                                    {formatCurrency(tx.amount, tx.currency)}
                                  </td>

                                  <td className="px-4 py-3 text-center">
                                    {deletingTxId === tx.id ? (
                                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          onClick={() => {
                                            deleteTransaction(tx.id);
                                            setDeletingTxId(null);
                                          }}
                                          className="text-[10px] font-bold bg-rose-500 hover:bg-rose-600 text-white px-2 py-1 rounded shadow-sm transition-colors cursor-pointer"
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          onClick={() => setDeletingTxId(null)}
                                          className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeletingTxId(tx.id);
                                        }}
                                        className="text-gray-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Delete Transaction"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3 pb-8">
                    {visibleTransactions.length === 0 ? (
                      <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-400 shadow-2xs">
                        <History size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm font-semibold text-gray-600">No transactions match your filter criteria</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting the date range or clearing active filters</p>
                        {(isTxDateFilterActive || txTypeFilter !== 'all' || selectedCurrency !== 'all' || selectedOwners.length > 0 || selectedBank !== 'all' || searchQuery) && (
                          <button
                            type="button"
                            onClick={() => {
                              clearTxDateFilter();
                              setTxTypeFilter('all');
                              setSelectedCurrency('all');
                              setSelectedOwners([]);
                              setSelectedBank('all');
                              setSearchQuery('');
                            }}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-blue-600 text-xs font-semibold rounded-lg shadow-2xs hover:bg-gray-50 cursor-pointer"
                          >
                            <X size={12} /> Reset all filters
                          </button>
                        )}
                      </div>
                    ) : (
                      visibleTransactions.map((tx) => {
                      const account = accountsMap.get(tx.account_id);
                      const targetAccount = tx.to_account_id ? accountsMap.get(tx.to_account_id) : null;
                      
                      return (
                        <Card key={tx.id} className="shadow-sm border-gray-100">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                  tx.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                                  tx.type === 'WITHDRAWAL' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 
                                  'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                  {tx.type}
                                </span>
                                <span className="text-[10px] text-gray-400 font-semibold bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100/50 flex items-center gap-1">
                                  <CalendarDays size={10} /> {formatDate(tx.date)}
                                </span>
                              </div>
                              
                              <div className="mb-3 space-y-1">
                                <div className="text-sm font-bold text-slate-800">
                                  {tx.type === 'DEPOSIT' && (
                                    <span>To {account?.name}</span>
                                  )}
                                  {tx.type === 'WITHDRAWAL' && (
                                    <span>From {account?.name}</span>
                                  )}
                                  {tx.type === 'TRANSFER' && (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span>{account?.name}</span>
                                      <ArrowRight size={11} className="text-blue-500 shrink-0" />
                                      <span>{targetAccount?.name}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                  {tx.type === 'TRANSFER' ? (
                                    <span>{account?.bank_name} ➔ {targetAccount?.bank_name}</span>
                                  ) : (
                                    <span>{account?.bank_name}</span>
                                  )}
                                 </div>
                                 <p className="text-xs text-slate-500 italic mt-1.5">{tx.description || 'System entry'}</p>
                              </div>

                              <div className="flex justify-between items-center pt-2.5 border-t border-gray-100">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Owner:</span>
                                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full border border-gray-100">
                                    {account?.owner || targetAccount?.owner || '—'}
                                  </span>
                                  
                                  {deletingTxId === tx.id ? (
                                    <div className="flex items-center gap-1.5 ml-2">
                                      <button
                                        onClick={() => {
                                          deleteTransaction(tx.id);
                                          setDeletingTxId(null);
                                        }}
                                        className="text-[9px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded shadow-sm cursor-pointer"
                                      >
                                        Yes
                                      </button>
                                      <button
                                        onClick={() => setDeletingTxId(null)}
                                        className="text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded cursor-pointer"
                                      >
                                        No
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setDeletingTxId(tx.id)}
                                      className="text-gray-400 hover:text-rose-500 p-1 ml-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Delete Transaction"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                                <span className={`text-sm font-mono font-bold tracking-tight ${
                                  tx.type === 'DEPOSIT' ? 'text-emerald-600' : 
                                  tx.type === 'WITHDRAWAL' ? 'text-rose-500' : 
                                  'text-blue-600'
                                }`}>
                                  {tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER' ? '−' : '+'}
                                  {formatCurrency(tx.amount, tx.currency)}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>

                  {filteredTransactions.length > visibleTxCount && (
                    <div className="flex justify-center pt-4 pb-4">
                      <button
                        onClick={() => setVisibleTxCount(prev => prev + 50)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      >
                        Load More Transactions ({filteredTransactions.length - visibleTxCount} remaining)
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="sm:max-w-[460px] p-6 rounded-xl overflow-hidden">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                <PiggyBank className="h-5 w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-slate-900 font-semibold text-base leading-tight">Add Account</DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Create a new savings record</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleAddAccount} className="space-y-4 mt-2">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Account Holder</Label>
                <Select 
                  value={newAccount.owner} 
                  onValueChange={(v) => setNewAccount({...newAccount, owner: v})}
                >
                  <SelectTrigger className="w-full bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-blue-100 rounded-lg shadow-sm transition-all font-medium">
                    <SelectValue placeholder="Select account holder" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map(ownerName => (
                      <SelectItem key={ownerName} value={ownerName} label={ownerName}>
                        {ownerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Bank Name</Label>
                  <Select 
                    value={newAccount.bank_name} 
                    onValueChange={(v) => setNewAccount({...newAccount, bank_name: v})}
                  >
                    <SelectTrigger className="w-full bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-blue-100 rounded-lg shadow-sm transition-all font-medium">
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map(bankName => (
                        <SelectItem key={bankName} value={bankName} label={bankName}>
                          {bankName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Account Nickname</Label>
                  <Input 
                    required 
                    className="rounded-lg bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-blue-100 transition-all font-medium" 
                    value={newAccount.name} 
                    onChange={e => setNewAccount({...newAccount, name: e.target.value})} 
                    placeholder="e.g. Holiday Fund" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Currency</Label>
                  <Select value={newAccount.currency} onValueChange={(v: Currency) => setNewAccount({...newAccount, currency: v})}>
                    <SelectTrigger className="w-full bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-blue-100 rounded-lg shadow-sm transition-all font-medium"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RON" label="RON">RON</SelectItem>
                      <SelectItem value="EUR" label="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Initial Amount (Optional)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    className="rounded-lg bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-blue-100 transition-all font-medium font-mono" 
                    value={newAccount.initial_balance || ''} 
                    onChange={e => setNewAccount({...newAccount, initial_balance: parseFloat(e.target.value) || 0})} 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Description (Optional)</Label>
                <Input 
                  className="rounded-lg bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-blue-100 transition-all" 
                  value={newAccount.description} 
                  onChange={e => setNewAccount({...newAccount, description: e.target.value})} 
                  placeholder="What is this account used for?"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Due Date (Optional)</Label>
                <Input 
                  type="date" 
                  className="rounded-lg bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-blue-100 transition-all" 
                  value={newAccount.due_date} 
                  onChange={e => setNewAccount({...newAccount, due_date: e.target.value})} 
                />
              </div>
            </div>

            <DialogFooter className="gap-3 sm:gap-3 flex-row sm:flex-row mt-6 pt-2">
              <Button 
                type="button"
                variant="outline" 
                className="flex-1 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer text-xs h-10 transition-colors font-medium" 
                onClick={() => setIsAddAccountOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-100 cursor-pointer text-xs h-10 transition-all font-semibold active:scale-[0.98]" 
              >
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
        <DialogContent className="sm:max-w-[460px] p-6 rounded-xl overflow-hidden">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-slate-900 font-semibold text-base leading-tight">New Transaction</DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Log account movement</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleAddTransaction} className="space-y-4 mt-2">
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Transaction Type</Label>
                <Select value={newTx.type} onValueChange={(v: string) => setNewTx({...newTx, type: v})}>
                  <SelectTrigger className="w-full bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-emerald-100 rounded-lg shadow-sm transition-all font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEPOSIT" label="Deposit">Deposit</SelectItem>
                    <SelectItem value="WITHDRAWAL" label="Withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="TRANSFER" label="Transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {newTx.type === 'TRANSFER' ? 'From Account' : 'Account'}
                </Label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm h-10 px-3 flex items-center justify-between focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 rounded-lg shadow-sm transition-all font-medium text-left cursor-pointer"
                  >
                    <span className="truncate">
                      {newTx.account_id ? (
                        (() => {
                          const acc = accounts.find(a => String(a.id) === String(newTx.account_id));
                          return acc ? `${acc.owner}: ${acc.name} • ${acc.bank_name}` : 'Select account';
                        })()
                      ) : (
                        <span className="text-slate-400">Select account</span>
                      )}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </button>

                  {isSourceDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={searchSourceQuery}
                          onChange={(e) => setSearchSourceQuery(e.target.value)}
                          placeholder="Type to search..."
                          className="w-full bg-transparent border-0 outline-none text-xs text-slate-800 placeholder-slate-400 p-0 focus:ring-0"
                          autoFocus
                        />
                        {searchSourceQuery && (
                          <button 
                            type="button" 
                            onClick={() => setSearchSourceQuery('')} 
                            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto max-h-48 divide-y divide-slate-50">
                        {filteredSourceAccounts.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No accounts found matching "{searchSourceQuery}"
                          </div>
                        ) : (
                          filteredSourceAccounts.map(acc => {
                            const isSelected = String(newTx.account_id) === String(acc.id);
                            return (
                              <button
                                key={acc.id}
                                type="button"
                                onClick={() => {
                                  setNewTx({ ...newTx, account_id: String(acc.id), to_account_id: '' });
                                  setIsSourceDropdownOpen(false);
                                  setSearchSourceQuery('');
                                }}
                                className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                                  isSelected ? 'bg-emerald-50/50 hover:bg-emerald-100/30' : ''
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                    <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider leading-none">
                                      {acc.owner}
                                    </span>
                                    <span className="truncate">{acc.name}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {acc.bank_name} • <span className="font-mono">{acc.currency}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-mono font-bold text-slate-500">
                                    {formatCurrency(acc.current_balance, acc.currency)}
                                  </span>
                                  {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {newTx.account_id && (
                  <div className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-200 mt-1.5">
                    <span>Current Balance:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(
                        accounts.find(a => String(a.id) === String(newTx.account_id))?.current_balance || 0,
                        accounts.find(a => String(a.id) === String(newTx.account_id))?.currency || 'RON'
                      )}
                    </span>
                  </div>
                )}
              </div>

              {newTx.type === 'TRANSFER' && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">To Account</Label>
                  <div className="relative" ref={targetDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-sm h-10 px-3 flex items-center justify-between focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 rounded-lg shadow-sm transition-all font-medium text-left cursor-pointer"
                      disabled={!newTx.account_id}
                    >
                      <span className="truncate">
                        {newTx.to_account_id ? (
                          (() => {
                            const acc = accounts.find(a => String(a.id) === String(newTx.to_account_id));
                            return acc ? `${acc.owner}: ${acc.name} • ${acc.bank_name}` : 'Select target account';
                          })()
                        ) : (
                          <span className="text-slate-400">
                            {newTx.account_id ? 'Select target account' : 'Select origin account first'}
                          </span>
                        )}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </button>

                    {isTargetDropdownOpen && newTx.account_id && (
                      <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={searchTargetQuery}
                            onChange={(e) => setSearchTargetQuery(e.target.value)}
                            placeholder="Type to search..."
                            className="w-full bg-transparent border-0 outline-none text-xs text-slate-800 placeholder-slate-400 p-0 focus:ring-0"
                            autoFocus
                          />
                          {searchTargetQuery && (
                            <button 
                              type="button" 
                              onClick={() => setSearchTargetQuery('')} 
                              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="overflow-y-auto max-h-48 divide-y divide-slate-50">
                          {filteredTargetAccounts.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">
                              {searchTargetQuery 
                                ? `No matching destination accounts found for "${searchTargetQuery}"` 
                                : 'No active matching currency destination accounts available.'}
                            </div>
                          ) : (
                            filteredTargetAccounts.map(acc => {
                              const isSelected = String(newTx.to_account_id) === String(acc.id);
                              return (
                                <button
                                  key={acc.id}
                                  type="button"
                                  onClick={() => {
                                    setNewTx({ ...newTx, to_account_id: String(acc.id) });
                                    setIsTargetDropdownOpen(false);
                                    setSearchTargetQuery('');
                                  }}
                                  className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                                    isSelected ? 'bg-emerald-50/50 hover:bg-emerald-100/30' : ''
                                  }`}
                                >
                                  <div className="truncate pr-2">
                                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                      <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider leading-none">
                                        {acc.owner}
                                      </span>
                                      <span className="truncate">{acc.name}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                      {acc.bank_name} • <span className="font-mono">{acc.currency}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-mono font-bold text-slate-500">
                                      {formatCurrency(acc.current_balance, acc.currency)}
                                    </span>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {newTx.to_account_id && (
                    <div className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-200 mt-1.5">
                      <span>Current Balance:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(
                          accounts.find(a => String(a.id) === String(newTx.to_account_id))?.current_balance || 0,
                          accounts.find(a => String(a.id) === String(newTx.to_account_id))?.currency || 'RON'
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Amount</Label>
                  {newTx.type === 'TRANSFER' && newTx.account_id && (() => {
                    const srcAcc = accounts.find(a => String(a.id) === String(newTx.account_id));
                    if (srcAcc && srcAcc.current_balance > 0) {
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setNewTx(prev => ({ ...prev, amount: srcAcc.current_balance }));
                            toast.success(`Populated transfer amount with entire balance: ${formatCurrency(srcAcc.current_balance, srcAcc.currency)}`);
                          }}
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100/60 px-1.5 py-0.5 rounded transition-colors"
                        >
                          Transfer everything ({formatCurrency(srcAcc.current_balance, srcAcc.currency)})
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="relative">
                  <Input 
                    type="number" 
                    step="0.01" 
                    required 
                    className="rounded-lg bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-emerald-100 transition-all font-mono pl-3 pr-12 font-semibold" 
                    value={isNaN(newTx.amount) || newTx.amount === 0 ? '' : newTx.amount} 
                    placeholder="0.00"
                    onChange={e => {
                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      setNewTx({...newTx, amount: val});
                    }} 
                    onBlur={e => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setNewTx({...newTx, amount: Math.round(val * 100) / 100});
                      }
                    }}
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                    {accounts.find(a => String(a.id) === String(newTx.account_id))?.currency || 'RON'}
                  </div>
                </div>
              </div>

              {newTx.type === 'TRANSFER' && (
                <div className="space-y-2 p-3.5 rounded-xl border border-emerald-100/70 bg-emerald-50/10 relative overflow-hidden animate-in fade-in duration-300">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Label className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" /> Interest Amount (Optional)
                    </Label>
                    <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">Ledger Entry</span>
                  </div>
                  <div className="relative">
                    <Input 
                      type="number" 
                      step="0.01" 
                      className="rounded-lg bg-white border-emerald-100 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-emerald-100 transition-all font-mono pl-3 pr-12 font-semibold" 
                      value={isNaN(newTx.interestAmount) || newTx.interestAmount === 0 ? '' : newTx.interestAmount} 
                      placeholder="0.00"
                      onChange={e => {
                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setNewTx({...newTx, interestAmount: val});
                      }} 
                      onBlur={e => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          setNewTx({...newTx, interestAmount: Math.round(val * 100) / 100});
                        }
                      }}
                    />
                    <div className="absolute right-3 top-2.5 text-xs text-emerald-600 font-bold pointer-events-none">
                      {accounts.find(a => String(a.id) === String(newTx.account_id))?.currency || 'RON'}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Description</Label>
                <Input 
                  className="rounded-lg bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-emerald-100 transition-all" 
                  value={newTx.description} 
                  onChange={e => setNewTx({...newTx, description: e.target.value})} 
                  placeholder="Monthly savings, interest bonus, etc." 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Transaction Date</Label>
                <Input 
                  type="date" 
                  className="rounded-lg bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-emerald-100 transition-all" 
                  value={newTx.date} 
                  onChange={e => setNewTx({...newTx, date: e.target.value})} 
                />
              </div>
            </div>

            <DialogFooter className="gap-3 sm:gap-3 flex-row sm:flex-row mt-6 pt-2">
              <Button 
                type="button"
                variant="outline" 
                className="flex-1 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer text-xs h-10 transition-colors font-medium" 
                onClick={() => setIsTransactionOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm shadow-emerald-100 cursor-pointer text-xs h-10 transition-all font-semibold active:scale-[0.98]" 
              >
                Confirm Action
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-xl overflow-hidden">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-slate-900 font-semibold text-base leading-tight">Delete Account</DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Critical Action Required</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {accountToDelete && (
            <div className="my-2 rounded-xl border border-red-100/80 bg-red-50/20 p-4 font-sans relative overflow-hidden">
              <div className="absolute right-0 top-0 -mr-6 -mt-6 w-24 h-24 bg-red-100/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block leading-none">Selected Portfolio</span>
                  <h4 className="font-semibold text-slate-800 text-sm leading-tight mt-1">{accountToDelete.name}</h4>
                  <p className="text-xs text-slate-500">{accountToDelete.bank_name} • {accountToDelete.owner}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Ending Balance</span>
                  <span className="font-mono text-[13px] font-black text-slate-800 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/50 mt-1.5 inline-block">
                    {formatCurrency(accountToDelete.current_balance, accountToDelete.currency)}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-red-100/50 flex gap-2 text-xs text-red-600 leading-relaxed font-medium">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 animate-pulse" />
                <p>
                  Removing this account will permanently erase <strong>"{accountToDelete.name}"</strong>, along with its full ledger transaction logs and analytics metrics. This cannot be undone.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 sm:gap-3 flex-row sm:flex-row mt-4">
            <Button 
              variant="outline" 
              className="flex-1 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer text-xs h-10 transition-colors font-medium" 
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm shadow-red-100 cursor-pointer text-xs h-10 transition-all font-semibold active:scale-[0.98]" 
              onClick={() => {
                if (accountToDelete) {
                  deleteAccount(accountToDelete.id);
                  setIsDeleteConfirmOpen(false);
                }
              }}
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditAccountOpen} onOpenChange={setIsEditAccountOpen}>
        <DialogContent className="sm:max-w-[460px] p-6 rounded-xl overflow-hidden">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                <Pencil className="h-5 w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-slate-900 font-semibold text-base leading-tight">Edit Account</DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Configure Portfolio Settings</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {editingAccount && (
            <form onSubmit={handleEditAccount} className="space-y-4 mt-2">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Account Holder</Label>
                  <Select 
                    value={editingAccount.owner} 
                    onValueChange={(v) => setEditingAccount({...editingAccount, owner: v})}
                  >
                    <SelectTrigger className="w-full bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-blue-100 rounded-lg shadow-sm transition-all font-medium">
                      <SelectValue placeholder="Select account holder" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners.map(ownerName => (
                        <SelectItem key={ownerName} value={ownerName} label={ownerName}>
                          {ownerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Bank Name</Label>
                    <Select 
                      value={editingAccount.bank_name} 
                      onValueChange={(v) => setEditingAccount({...editingAccount, bank_name: v})}
                    >
                      <SelectTrigger className="w-full bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-blue-100 rounded-lg shadow-sm transition-all font-medium">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map(bankName => (
                          <SelectItem key={bankName} value={bankName} label={bankName}>
                            {bankName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Account Nickname</Label>
                    <Input 
                      required 
                      className="rounded-lg bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                      value={editingAccount.name} 
                      onChange={e => setEditingAccount({...editingAccount, name: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Description (Optional)</Label>
                  <Input 
                    className="rounded-lg bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-blue-100 transition-all"
                    value={editingAccount.description || ''} 
                    onChange={e => setEditingAccount({...editingAccount, description: e.target.value})} 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Due Date (Optional)</Label>
                  <Input 
                    type="date" 
                    className="rounded-lg bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-blue-100 transition-all"
                    value={editingAccount.due_date || ''} 
                    onChange={e => setEditingAccount({...editingAccount, due_date: e.target.value})} 
                  />
                </div>

                <div 
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer mt-4"
                  onClick={() => {
                    if (editingAccount.is_active && Math.abs(Number(editingAccount.current_balance)) > 0.001) {
                      toast.error('Only accounts with 0 balance can be marked as inactive');
                      return;
                    }
                    setEditingAccount({...editingAccount, is_active: editingAccount.is_active ? false : true});
                  }}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700 block">Active Status</span>
                    <span className="text-[11px] text-slate-400 block font-normal leading-normal">
                      Inactive accounts are hidden from transaction inputs and key aggregators.
                    </span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-1 shrink-0 ${editingAccount.is_active ? 'bg-blue-600' : 'bg-slate-200'}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${editingAccount.is_active ? 'translate-x-[20px]' : 'translate-x-[2px]'}`}></div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-3 sm:gap-3 flex-row sm:flex-row mt-6 pt-2">
                <Button 
                  type="button"
                  variant="outline" 
                  className="flex-1 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer text-xs h-10 transition-colors font-medium" 
                  onClick={() => setIsEditAccountOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-100 cursor-pointer text-xs h-10 transition-all font-semibold active:scale-[0.98]" 
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Manage Owners Dialog */}
      <Dialog open={isManageOwnersOpen} onOpenChange={setIsManageOwnersOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-xl overflow-hidden">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-slate-900 font-semibold text-base leading-tight">Manage Owners</DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Create, Edit, and Delete Account Holders</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Create Owner Form */}
            <div className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                <UserPlus size={14} className="text-blue-600" /> Create Owner
              </Label>
              <form onSubmit={handleCreateOwner} className="flex gap-2">
                <Input 
                  type="text" 
                  placeholder="Enter new owner name..." 
                  value={newOwnerName} 
                  onChange={e => setNewOwnerName(e.target.value)} 
                  className="flex-1 bg-white border-slate-200 text-sm h-9 rounded-lg focus:ring-2 focus:ring-blue-100 font-medium"
                />
                <Button 
                  type="submit" 
                  className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer shadow-xs"
                >
                  Create
                </Button>
              </form>
            </div>

            {/* Existing Owners List */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Existing Owners ({allOwners.length})
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {allOwners.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    No owners found. Add one above!
                  </div>
                ) : (
                  allOwners.map(owner => {
                    const accountCount = accounts.filter(a => a.owner === owner.name).length;
                    const isEditing = editingOwnerId === owner.id;

                    return (
                      <div key={owner.id} className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl shadow-xs transition-all hover:border-slate-300">
                        {isEditing ? (
                          <form onSubmit={handleEditOwner} className="flex-1 flex items-center gap-2 mr-2">
                            <Input 
                              type="text" 
                              value={editingOwnerName} 
                              onChange={e => setEditingOwnerName(e.target.value)} 
                              className="flex-1 h-8 text-xs bg-white border-blue-300 focus:ring-1 focus:ring-blue-500 rounded-md font-medium"
                              autoFocus
                            />
                            <Button type="submit" size="sm" className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-md cursor-pointer">
                              Save
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingOwnerId(null); setEditingOwnerName(''); }} className="h-8 px-2 text-slate-500 text-[11px] rounded-md cursor-pointer">
                              Cancel
                            </Button>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                                {owner.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-800 text-xs block truncate">{owner.name}</span>
                                <span className="text-[10px] text-slate-400 block font-medium">
                                  {accountCount} {accountCount === 1 ? 'account' : 'accounts'} assigned
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingOwnerId(owner.id);
                                  setEditingOwnerName(owner.name);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Owner"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteOwner(owner.id, owner.name, accountCount)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Owner"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 pt-2 border-t border-slate-100">
            <Button 
              type="button"
              variant="outline" 
              className="w-full rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer text-xs h-9 transition-colors font-medium" 
              onClick={() => setIsManageOwnersOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Banks Dialog */}
      <Dialog open={isManageBanksOpen} onOpenChange={setIsManageBanksOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-xl overflow-hidden">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-slate-900 font-semibold text-base leading-tight">Manage Banks</DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Create, Edit, and Delete Financial Institutions</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Create Bank Form */}
            <div className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                <Building2 size={14} className="text-blue-600" /> Create Bank
              </Label>
              <form onSubmit={handleCreateBank} className="flex gap-2">
                <Input 
                  type="text" 
                  placeholder="Enter new bank name..." 
                  value={newBankName} 
                  onChange={e => setNewBankName(e.target.value)} 
                  className="flex-1 bg-white border-slate-200 text-sm h-9 rounded-lg focus:ring-2 focus:ring-blue-100 font-medium"
                />
                <Button 
                  type="submit" 
                  className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer shadow-xs"
                >
                  Create
                </Button>
              </form>
            </div>

            {/* Existing Banks List */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Existing Banks ({allBanks.length})
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {allBanks.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    No banks found. Add one above!
                  </div>
                ) : (
                  allBanks.map(bank => {
                    const accountCount = accounts.filter(a => a.bank_name === bank.name).length;
                    const isEditing = editingBankId === bank.id;

                    return (
                      <div key={bank.id} className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl shadow-xs transition-all hover:border-slate-300">
                        {isEditing ? (
                          <form onSubmit={handleEditBank} className="flex-1 flex items-center gap-2 mr-2">
                            <Input 
                              type="text" 
                              value={editingBankName} 
                              onChange={e => setEditingBankName(e.target.value)} 
                              className="flex-1 h-8 text-xs bg-white border-blue-300 focus:ring-1 focus:ring-blue-500 rounded-md font-medium"
                              autoFocus
                            />
                            <Button type="submit" size="sm" className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-md cursor-pointer">
                              Save
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingBankId(null); setEditingBankName(''); }} className="h-8 px-2 text-slate-500 text-[11px] rounded-md cursor-pointer">
                              Cancel
                            </Button>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                                {bank.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-800 text-xs block truncate">{bank.name}</span>
                                <span className="text-[10px] text-slate-400 block font-medium">
                                  {accountCount} {accountCount === 1 ? 'account' : 'accounts'} assigned
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBankId(bank.id);
                                  setEditingBankName(bank.name);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Bank"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBank(bank.id, bank.name, accountCount)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Bank"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 pt-2 border-t border-slate-100">
            <Button 
              type="button"
              variant="outline" 
              className="w-full rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer text-xs h-9 transition-colors font-medium" 
              onClick={() => setIsManageBanksOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
