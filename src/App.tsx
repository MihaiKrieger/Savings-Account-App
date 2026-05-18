import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  LineChart as LineChartIcon,
  CreditCard, 
  History, 
  LayoutDashboard, 
  Plus, 
  ArrowRightLeft, 
  TrendingUp,
  PiggyBank,
  Building2,
  Trash2,
  Pencil,
  Check,
  ChevronDown,
  CalendarDays,
  Filter,
  Banknote,
  ArrowRight,
  Menu,
  X,
  Radar
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

import { Account, Transaction, Currency, AnalyticsData } from './types';
import { 
  BarChart, 
  Bar, 
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

const APP_VERSION = '1.7.1';

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [chartCurrencyFilter, setChartCurrencyFilter] = useState<'all' | 'RON' | 'EUR'>('all');
  const [accountStatusFilter, setAccountStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isOwnerFilterOpen, setIsOwnerFilterOpen] = useState(false);
  const [dashboardAccountSort, setDashboardAccountSort] = useState<'balance' | 'name' | 'due_date'>('balance');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWelcomeDismissed, setIsWelcomeDismissed] = useState(false);
  const [ronToEurRate, setRonToEurRate] = useState<number | null>(null);

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
  const [txSortOrder, setTxSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [chartView, setChartView] = useState<'bar' | 'line'>('bar');
  const [accountsSortField, setAccountsSortField] = useState<'owner' | 'bank' | 'currency' | 'balance'>('balance');
  const [accountsSortOrder, setAccountsSortOrder] = useState<'asc' | 'desc'>('desc');

  // Form states
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  
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

  const fetchData = async () => {
    try {
      const [accRes, txRes, anaRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/transactions'),
        fetch('/api/analytics')
      ]);
      const [accData, txData, anaData] = await Promise.all([
        accRes.json(),
        txRes.json(),
        anaRes.json()
      ]);
      setAccounts(accData);
      setTransactions(txData);
      setAnalytics(anaData);
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

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAccount, initial_balance: 0, is_active: true })
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
    const yearStartStr = selectedYear !== 'all' ? `${selectedYear}-01-01` : '1970-01-01';
    const yearStartTime = new Date(yearStartStr).getTime();

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
          return matchesOwner && matchesBank && new Date(ana.day).getTime() < yearStartTime;
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

      if (selectedYear === 'all') return true;
      const year = new Date(ana.day).getFullYear().toString();
      return year === selectedYear;
    });

    // 3. Group by day
    const dailyChanges: Record<string, Record<string, number>> = {};
    
    // Ensure we have a data point for "Today" and potentially the start of the year
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear().toString();
    
    if (selectedYear === 'all' || selectedYear === currentYear) {
      dailyChanges[today] = { RON: 0, EUR: 0 };
    }
    
    if (selectedYear !== 'all') {
      const startOfYear = `${selectedYear}-01-01`;
      if (!dailyChanges[startOfYear]) dailyChanges[startOfYear] = { RON: 0, EUR: 0 };
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

    if (days.length === 0 && selectedYear === 'all') {
       // No transactions ever, just show today
       result.push({
         day: today,
         ...currentBalances
       });
       return result;
    }

    days.forEach(day => {
      currencies.forEach(curr => {
        currentBalances[curr] += dailyChanges[day][curr] || 0;
      });
      result.push({
        day,
        RON: Math.round(currentBalances.RON * 100) / 100,
        EUR: Math.round(currentBalances.EUR * 100) / 100
      });
    });

    return result;
  }, [accounts, analytics, selectedOwners, selectedBank, selectedYear]);
  
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

  const owners = React.useMemo(() => 
    Array.from(new Set(accounts.map(a => a.owner))).sort() as string[]
  , [accounts]);

  const banks = React.useMemo(() => 
    Array.from(new Set(accounts.map(a => a.bank_name))).sort() as string[]
  , [accounts]);

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
        <header className="h-16 border-b border-[#E5E7EB] bg-white flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu size={18} />
            </button>
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <BarChart3 className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                className="block w-full pl-10 pr-3 py-2 border-none bg-gray-50 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <Button 
              variant="outline"
              size="icon"
              className="h-9 w-9 border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-lg shadow-sm"
              onClick={() => setIsAddAccountOpen(true)}
              title="Add Account"
            >
              <CreditCard size={18} />
            </Button>
            <Button 
              size="icon"
              className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg"
              onClick={() => setIsTransactionOpen(true)}
              title="New Transaction"
            >
              <Plus size={18} />
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
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Financial Overview</h1>
                    <p className="text-gray-500 text-sm mt-1">Real-time status of your global savings accounts.</p>
                  </div>
                  <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4 justify-end">
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Year:</span>
                              <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[100px] h-8 bg-white border-gray-100 shadow-sm text-[11px] font-medium rounded-md">
                                  <SelectValue placeholder="All Years" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Time</SelectItem>
                                  {years.map(year => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                    <div key={curr} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-hover hover:border-blue-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total {curr}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{formatCurrency(amount, curr)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Active Accounts</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{accounts.filter(a => a.is_active).length}</span>
                      <span className="text-xs font-medium text-blue-600">Across {new Set(accounts.filter(a => a.is_active).map(a => a.bank_name)).size} Banks</span>
                    </div>
                  </div>
                </div>

                {/* Grid Split */}
                <div className="grid grid-cols-12 gap-6 pb-8">
                  <div className="col-span-12 lg:col-span-8 space-y-6">
                    <Card className="shadow-sm border-gray-100 rounded-xl overflow-hidden">
                      <CardHeader className="bg-gray-50/30 border-b border-gray-100 pb-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-base font-bold text-gray-800">Portfolio Evolution</CardTitle>
                            <CardDescription className="text-xs">Growth across {selectedYear === 'all' ? 'all time' : selectedYear}</CardDescription>
                          </div>
                          <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                            <div className="flex bg-white/50 p-0.5 rounded-md mr-2">
                              <button 
                                onClick={() => setChartCurrencyFilter('all')}
                                className={`px-2 py-1 text-[10px] font-bold rounded-sm transition-all ${chartCurrencyFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                              >
                                ALL
                              </button>
                              <button 
                                onClick={() => setChartCurrencyFilter('RON')}
                                className={`px-2 py-1 text-[10px] font-bold rounded-sm transition-all ${chartCurrencyFilter === 'RON' ? 'bg-[#F97316] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                              >
                                RON
                              </button>
                              <button 
                                onClick={() => setChartCurrencyFilter('EUR')}
                                className={`px-2 py-1 text-[10px] font-bold rounded-sm transition-all ${chartCurrencyFilter === 'EUR' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                              >
                                EUR
                              </button>
                            </div>
                            <div className="flex items-center">
                              <button 
                                onClick={() => setChartView('bar')}
                                className={`p-1.5 rounded-md transition-all ${chartView === 'bar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Bar Chart"
                              >
                                <BarChart3 size={16} />
                              </button>
                              <button 
                                onClick={() => setChartView('line')}
                                className={`p-1.5 rounded-md transition-all ${chartView === 'line' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Line Chart"
                              >
                                <LineChartIcon size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="h-[300px] sm:h-[380px] pt-8">
                        <ResponsiveContainer width="100%" height="100%" debounce={250}>
                          {chartView === 'bar' ? (
                            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: selectedYear === 'all' ? '2-digit' : 'numeric'
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
                                  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
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
                              {(chartCurrencyFilter === 'all' || chartCurrencyFilter === 'RON') && (
                                <Bar 
                                  dataKey="RON" 
                                  fill="#F97316" 
                                  radius={[4, 4, 0, 0]}
                                  maxBarSize={40}
                                />
                              )}
                              {(chartCurrencyFilter === 'all' || chartCurrencyFilter === 'EUR') && (
                                <Bar 
                                  dataKey="EUR" 
                                  fill="#2563EB" 
                                  radius={[4, 4, 0, 0]}
                                  maxBarSize={40}
                                />
                              )}
                            </BarChart>
                          ) : (
                            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: selectedYear === 'all' ? '2-digit' : 'numeric'
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
                                  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
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
                              {(chartCurrencyFilter === 'all' || chartCurrencyFilter === 'RON') && (
                                <Line 
                                  type="monotone" 
                                  dataKey="RON" 
                                  stroke="#F97316" 
                                  strokeWidth={2.5} 
                                  dot={{ r: 4, fill: '#F97316', strokeWidth: 2, stroke: '#fff' }} 
                                  activeDot={{ r: 6 }} 
                                />
                              )}
                              {(chartCurrencyFilter === 'all' || chartCurrencyFilter === 'EUR') && (
                                <Line 
                                  type="monotone" 
                                  dataKey="EUR" 
                                  stroke="#2563EB" 
                                  strokeWidth={2.5} 
                                  dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} 
                                  activeDot={{ r: 6 }} 
                                />
                              )}
                            </LineChart>
                          )}
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden relative group">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-2">
                             <div className="p-2 bg-slate-800 rounded-lg shadow-lg shadow-slate-100">
                               <History size={16} className="text-white" />
                             </div>
                             <div>
                               <h2 className="font-bold text-sm tracking-tight text-slate-900">Recent Activity</h2>
                               <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Latest transactions</p>
                             </div>
                           </div>
                           <button 
                             onClick={() => setActiveTab('transactions')}
                             className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors flex items-center gap-1"
                           >
                             Full Board <ArrowRight size={10} />
                           </button>
                        </div>

                        <div className="space-y-3">
                          {transactions
                            .filter(tx => 
                              tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              accounts.find(a => a.id === tx.account_id)?.name.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .slice(0, 5).map((tx) => (
                            <div key={tx.id} className="relative p-3 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-white hover:border-slate-100 hover:shadow-md transition-all cursor-pointer group/item" onClick={() => setActiveTab('transactions')}>
                              <div className="flex justify-between items-start mb-1">
                                <div className="min-w-0 flex-1 pr-4">
                                  <p className="text-xs font-bold text-slate-900 group-hover/item:text-blue-700 transition-colors uppercase tracking-tight truncate">
                                    {tx.description || 'System Entry'}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`text-[9px] font-black italic tracking-tighter ${
                                      tx.type === 'DEPOSIT' ? 'text-emerald-600' : 
                                      tx.type === 'WITHDRAWAL' ? 'text-rose-500' : 
                                      'text-blue-600'
                                    }`}>
                                      {tx.type}
                                    </span>
                                    <span className="text-slate-200">•</span>
                                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">
                                      {formatDate(tx.date)}
                                    </span>
                                  </div>
                                </div>
                                <div className={`text-sm font-black shrink-0 ${
                                  tx.type === 'DEPOSIT' ? 'text-emerald-600' : tx.type === 'WITHDRAWAL' ? 'text-rose-500' : 'text-blue-600'
                                }`}>
                                  {tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER' ? '-' : '+'}
                                  {formatCurrency(tx.amount, tx.currency)}
                                </div>
                              </div>
                            </div>
                          ))}
                          {transactions.length === 0 && (
                            <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
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
                                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mb-0.5">{acc.bank_name}</p>
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

                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden relative group">
                      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-2">
                             <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-100">
                               <Building2 size={16} className="text-white" />
                             </div>
                             <div>
                               <h2 className="font-bold text-sm tracking-tight text-indigo-900">Accounts</h2>
                               <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Managed Balances</p>
                             </div>
                           </div>
                           <Select 
                            value={dashboardAccountSort} 
                            onValueChange={(v: 'balance' | 'name' | 'due_date') => setDashboardAccountSort(v)}
                          >
                            <SelectTrigger className="h-7 w-[110px] text-[10px] border-none bg-gray-50 shadow-none font-bold uppercase tracking-tighter">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="balance" label="Sort: Balance">Sort: Balance</SelectItem>
                              <SelectItem value="name" label="Sort: Owner">Sort: Owner</SelectItem>
                              <SelectItem value="due_date" label="Sort: Due Date">Sort: Due Date</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-4">
                          {filteredAccountsForStats
                            .filter(a => a.is_active)
                            .sort((a,b) => {
                              if (dashboardAccountSort === 'balance') return b.current_balance - a.current_balance;
                              if (dashboardAccountSort === 'due_date') {
                                if (!a.due_date) return 1;
                                if (!b.due_date) return -1;
                                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                              }
                              return a.owner.localeCompare(b.owner);
                            })
                            .map(acc => (
                            <div key={acc.id} className="relative p-3 rounded-xl border border-gray-50 bg-gray-50/30 transition-all">
                              <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-1">
                                    <p className="text-xs font-bold text-indigo-900 uppercase tracking-tight truncate pr-2">{acc.name}</p>
                                    <p className="text-xs font-black text-gray-900 shrink-0">{formatCurrency(acc.current_balance, acc.currency)}</p>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <p className="text-[10px] text-gray-400 uppercase font-medium tracking-tighter">{acc.bank_name}</p>
                                    {acc.due_date && (
                                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${getDueDateTheme(acc.due_date)}`}>
                                        <CalendarDays size={10} />
                                        <span className="text-[9px] font-bold whitespace-nowrap">{formatDate(acc.due_date, 'long')}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
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
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ledger Activity</h1>
                    <p className="text-gray-500 text-sm mt-1">Audit trail of all money movements.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Select 
                      value={txSortOrder} 
                      onValueChange={(v: 'newest' | 'oldest') => setTxSortOrder(v)}
                    >
                      <SelectTrigger className="h-9 w-[130px] text-xs bg-white border-gray-200">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest" label="Newest first">Newest first</SelectItem>
                        <SelectItem value="oldest" label="Oldest first">Oldest first</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-8">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="px-6 py-4 uppercase text-[11px] font-bold tracking-wider text-gray-400">Type</TableHead>
                          <TableHead className="px-6 py-4 uppercase text-[11px] font-bold tracking-wider text-gray-400">Account</TableHead>
                          <TableHead className="px-6 py-4 uppercase text-[11px] font-bold tracking-wider text-gray-400">Label/Description</TableHead>
                          <TableHead className="px-6 py-4 uppercase text-[11px] font-bold tracking-wider text-gray-400">Timestamp</TableHead>
                          <TableHead className="px-6 py-4 uppercase text-[11px] font-bold tracking-wider text-gray-400 text-right">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions
                          .filter(tx => 
                            tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            accounts.find(a => a.id === tx.account_id)?.name.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .sort((a, b) => {
                            const timeA = new Date(a.date).getTime();
                            const timeB = new Date(b.date).getTime();
                            if (txSortOrder === 'newest') return timeB - timeA;
                            return timeA - timeB;
                          })
                          .map((tx) => {
                          const account = accounts.find(a => a.id === tx.account_id);
                          const targetAccount = tx.to_account_id ? accounts.find(a => a.id === tx.to_account_id) : null;
                          
                          return (
                            <TableRow key={tx.id} className="hover:bg-gray-50/30 transition-colors">
                              <TableCell className="px-6">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest ${
                                  tx.type === 'DEPOSIT' ? 'bg-green-50 text-green-700' : 
                                  tx.type === 'WITHDRAWAL' ? 'bg-red-50 text-red-700' : 
                                  'bg-blue-50 text-blue-700'
                                }`}>
                                  {tx.type}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 font-medium text-sm">
                                <div className="flex flex-col gap-1">
                                  {tx.type === 'DEPOSIT' && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                                        <ArrowRight size={10} className="rotate-[135deg]" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-bold text-gray-400 tracking-tight leading-none mb-0.5">To Account</span>
                                        <span className="text-gray-900">{account?.name}</span>
                                      </div>
                                    </div>
                                  )}
                                  {tx.type === 'WITHDRAWAL' && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                                        <ArrowRight size={10} className="rotate-[-45deg]" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-bold text-gray-400 tracking-tight leading-none mb-0.5">From Account</span>
                                        <span className="text-gray-900">{account?.name}</span>
                                      </div>
                                    </div>
                                  )}
                                  {tx.type === 'TRANSFER' && (
                                    <div className="flex items-center gap-2">
                                      <div className="flex flex-col min-w-[80px]">
                                        <span className="text-[9px] uppercase font-bold text-gray-400 tracking-tight leading-none mb-0.5">From</span>
                                        <span className="text-gray-900 truncate max-w-[100px]">{account?.name}</span>
                                      </div>
                                      <ArrowRight size={12} className="text-blue-400 shrink-0 mx-1 mt-3" />
                                      <div className="flex flex-col min-w-[80px]">
                                        <span className="text-[9px] uppercase font-bold text-gray-400 tracking-tight leading-none mb-0.5">To</span>
                                        <span className="text-gray-900 truncate max-w-[100px]">{targetAccount?.name}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="px-6 text-gray-600 text-sm font-normal truncate max-w-[200px]">{tx.description || 'Manual entry'}</TableCell>
                              <TableCell className="px-6 text-gray-400 text-[10px]">
                                {formatDate(tx.date)}
                              </TableCell>
                              <TableCell className={`px-6 text-right font-bold text-sm ${
                                tx.type === 'DEPOSIT' ? 'text-green-600' : 
                                tx.type === 'WITHDRAWAL' ? 'text-red-500' : 
                                'text-blue-600'
                              }`}>
                                {tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER' ? '-' : '+'}
                                {formatCurrency(tx.amount, tx.currency)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3 pb-8">
                    {transactions
                      .filter(tx => 
                        tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        accounts.find(a => a.id === tx.account_id)?.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .sort((a, b) => {
                        const timeA = new Date(a.date).getTime();
                        const timeB = new Date(b.date).getTime();
                        if (txSortOrder === 'newest') return timeB - timeA;
                        return timeA - timeB;
                      })
                      .map((tx) => {
                        const account = accounts.find(a => a.id === tx.account_id);
                        const targetAccount = tx.to_account_id ? accounts.find(a => a.id === tx.to_account_id) : null;
                        
                        return (
                          <Card key={tx.id} className="shadow-sm border-gray-100">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase ${
                                  tx.type === 'DEPOSIT' ? 'bg-green-50 text-green-700' : 
                                  tx.type === 'WITHDRAWAL' ? 'bg-red-50 text-red-700' : 
                                  'bg-blue-50 text-blue-700'
                                }`}>
                                  {tx.type}
                                </span>
                                <span className="text-[10px] text-gray-400">{formatDate(tx.date)}</span>
                              </div>
                              
                              <div className="mb-3">
                                {tx.type === 'TRANSFER' ? (
                                  <div className="flex items-center gap-2">
                                     <span className="text-[11px] font-medium text-gray-900">{account?.name}</span>
                                     <ArrowRight size={12} className="text-blue-400" />
                                     <span className="text-[11px] font-medium text-gray-900">{targetAccount?.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] font-medium text-gray-900">{account?.name}</span>
                                )}
                                <p className="text-xs text-gray-500 mt-1">{tx.description || 'System Entry'}</p>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Amount</span>
                                <span className={`text-sm font-bold ${
                                  tx.type === 'DEPOSIT' ? 'text-green-600' : 
                                  tx.type === 'WITHDRAWAL' ? 'text-red-500' : 
                                  'text-blue-600'
                                }`}>
                                  {tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER' ? '-' : '+'}
                                  {formatCurrency(tx.amount, tx.currency)}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
            <DialogDescription>Create a new savings record for tracking.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAccount} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Owner Name</Label>
              <Input 
                required 
                className="bg-white border-gray-200" 
                value={newAccount.owner} 
                onChange={e => setNewAccount({...newAccount, owner: e.target.value})} 
                placeholder="e.g. John Doe"
                list="owners-list"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input required className="bg-white border-gray-200" value={newAccount.bank_name} onChange={e => setNewAccount({...newAccount, bank_name: e.target.value})} placeholder="BT, ING..." />
              </div>
              <div className="space-y-2">
                <Label>Account Nickname</Label>
                <Input required className="bg-white border-gray-200" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} placeholder="Emergency Fund" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={newAccount.currency} onValueChange={(v: Currency) => setNewAccount({...newAccount, currency: v})}>
                <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RON" label="RON">RON</SelectItem>
                  <SelectItem value="EUR" label="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input className="rounded-lg bg-white border-gray-200" value={newAccount.description} onChange={e => setNewAccount({...newAccount, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Input type="date" className="rounded-lg bg-white border-gray-200" value={newAccount.due_date} onChange={e => setNewAccount({...newAccount, due_date: e.target.value})} />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Create Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
            <DialogDescription>Log a new movement on your accounts.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTransaction} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newTx.type} onValueChange={(v: string) => setNewTx({...newTx, type: v})}>
                <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEPOSIT" label="Deposit">Deposit</SelectItem>
                  <SelectItem value="WITHDRAWAL" label="Withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="TRANSFER" label="Transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{newTx.type === 'TRANSFER' ? 'From Account' : 'Account'}</Label>
                <Select value={String(newTx.account_id)} onValueChange={(v) => setNewTx({...newTx, account_id: v})}>
                <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {sortedAccountsForDropdown.map(acc => (
                    <SelectItem key={acc.id} value={String(acc.id)} label={`${acc.owner}: ${acc.name} • ${acc.bank_name}`}>
                      {acc.owner}: {acc.name} • {acc.bank_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newTx.account_id && (
                <div className="text-[11px] font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded border border-gray-100 flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-200">
                  <span>Current Balance:</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(
                      accounts.find(a => String(a.id) === String(newTx.account_id))?.current_balance || 0,
                      accounts.find(a => String(a.id) === String(newTx.account_id))?.currency || 'RON'
                    )}
                  </span>
                </div>
              )}
            </div>
            
            {newTx.type === 'TRANSFER' && (
              <div className="space-y-2">
                <Label>To Account</Label>
                <Select value={String(newTx.to_account_id)} onValueChange={(v) => setNewTx({...newTx, to_account_id: v})}>
                  <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm"><SelectValue placeholder="Select target account" /></SelectTrigger>
                  <SelectContent>
                    {sortedAccountsForDropdown
                      .filter(a => String(a.id) !== String(newTx.account_id))
                      .filter(a => {
                        const sourceAcc = accounts.find(sa => String(sa.id) === String(newTx.account_id));
                        return !sourceAcc || a.currency === sourceAcc.currency;
                      })
                      .map(acc => (
                      <SelectItem key={acc.id} value={String(acc.id)} label={`${acc.owner}: ${acc.name} • ${acc.bank_name}`}>
                        {acc.owner}: {acc.name} • {acc.bank_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newTx.to_account_id && (
                  <div className="text-[11px] font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded border border-gray-100 flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-200">
                    <span>Current Balance:</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(
                        accounts.find(a => String(a.id) === String(newTx.to_account_id))?.current_balance || 0,
                        accounts.find(a => String(a.id) === String(newTx.to_account_id))?.currency || 'RON'
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

              <Label>Amount</Label>
              <Input 
                type="number" 
                step="0.01" 
                required 
                className="bg-white border-gray-200" 
                value={isNaN(newTx.amount) ? '' : newTx.amount} 
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

            {newTx.type === 'TRANSFER' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="flex items-center justify-between">
                  <Label className="text-emerald-600 flex items-center gap-1.5">
                    <TrendingUp size={14} /> Interest Amount (Optional)
                  </Label>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-1.5 rounded">Separate Ledger Entry</span>
                </div>
                <Input 
                  type="number" 
                  step="0.01" 
                  className="bg-white border-emerald-100 focus:ring-emerald-100 text-emerald-900 font-semibold" 
                  value={isNaN(newTx.interestAmount) ? '' : (newTx.interestAmount === 0 ? '' : newTx.interestAmount)} 
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
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Input className="rounded-lg bg-white border-gray-200" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} placeholder="Monthly savings, coffee, etc." />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" className="rounded-lg bg-white border-gray-200" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} />
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Confirm Action</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete account <strong>"{accountToDelete?.name}"</strong>?
              This action is permanent and will delete all associated transactions and analytics data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white" 
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>Update your bank account information.</DialogDescription>
          </DialogHeader>
          {editingAccount && (
            <form onSubmit={handleEditAccount} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Owner Name</Label>
                <Input 
                  required 
                  value={editingAccount.owner} 
                  onChange={e => setEditingAccount({...editingAccount, owner: e.target.value})}
                  list="owners-list"
                />
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input required value={editingAccount.bank_name} onChange={e => setEditingAccount({...editingAccount, bank_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Account Nickname</Label>
                <Input required value={editingAccount.name} onChange={e => setEditingAccount({...editingAccount, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Input className="rounded-lg bg-white border-gray-200" value={editingAccount.description} onChange={e => setEditingAccount({...editingAccount, description: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Due Date (Optional)</Label>
                <Input type="date" className="rounded-lg bg-white border-gray-200" value={editingAccount.due_date || ''} onChange={e => setEditingAccount({...editingAccount, due_date: e.target.value})} />
              </div>
              <div 
                className="flex items-center gap-2 pt-2 cursor-pointer" 
                onClick={() => {
                  if (editingAccount.is_active && Math.abs(Number(editingAccount.current_balance)) > 0.001) {
                    toast.error('Only accounts with 0 balance can be marked as inactive');
                    return;
                  }
                  setEditingAccount({...editingAccount, is_active: editingAccount.is_active ? false : true});
                }}
              >
                <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-1 ${editingAccount.is_active ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${editingAccount.is_active ? 'translate-x-[20px]' : 'translate-x-0'}`}></div>
                </div>
                <Label className="cursor-pointer text-xs font-semibold text-gray-600">Active Account</Label>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      <datalist id="owners-list">
        {owners.map(owner => (
          <option key={owner} value={owner} />
        ))}
      </datalist>
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
