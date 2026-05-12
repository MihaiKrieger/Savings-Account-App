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
  Wallet,
  Building2,
  Trash2,
  Pencil,
  Check,
  ChevronDown,
  CalendarDays,
  Filter,
  Banknote
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

const APP_VERSION = '1.5.3';

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
  const [accountStatusFilter, setAccountStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isOwnerFilterOpen, setIsOwnerFilterOpen] = useState(false);
  const [dashboardAccountSort, setDashboardAccountSort] = useState<'balance' | 'name' | 'due_date'>('balance');

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
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTx,
          account_id: parseInt(newTx.account_id),
          to_account_id: newTx.to_account_id ? parseInt(newTx.to_account_id) : null,
          amount: Math.round(parseFloat(newTx.amount.toString()) * 100) / 100,
          date: newTx.date
        })
      });
      if (res.ok) {
        toast.success('Transaction processed');
        setIsTransactionOpen(false);
        setNewTx({ 
          account_id: '', 
          to_account_id: '', 
          type: 'DEPOSIT', 
          amount: 0, 
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        fetchData();
      }
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
    
    if (diffMonths < 2) return "bg-red-50 text-red-600 border-red-100/50";
    if (diffMonths < 3) return "bg-amber-50 text-amber-600 border-amber-100/50";
    return "bg-blue-50 text-blue-600 border-blue-100/50";
  };

  const formatCurrency = (amount: number, currency: string) => {
    // Normalize small values and handle negative zero to avoid "-0.00" display
    const normalized = Math.abs(amount) < 0.001 ? 0 : amount;
    return new Intl.NumberFormat('ro-RO', { style: 'currency', currency }).format(normalized);
  };

  // Prepare Chart Data
  const getChartData = () => {
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
  };

  const chartData = getChartData();
  
  const years = Array.from(new Set(analytics.map(ana => new Date(ana.day).getFullYear().toString()))).sort().reverse();

  const filteredAccountsForStats = accounts.filter(a => {
    const matchesOwner = selectedOwners.length === 0 || selectedOwners.includes(a.owner);
    const matchesBank = selectedBank === 'all' || a.bank_name === selectedBank;
    return matchesOwner && matchesBank;
  });

  const totalBalances = filteredAccountsForStats
    .filter(a => a.is_active)
    .reduce((acc, curr) => {
    if (curr.currency as string === 'USD') return acc;
    const currentVal = acc[curr.currency] || 0;
    acc[curr.currency] = Math.round((currentVal + curr.current_balance) * 100) / 100;
    return acc;
  }, {} as Record<string, number>);

  const owners = Array.from(new Set(accounts.map(a => a.owner))).sort() as string[];
  const banks = Array.from(new Set(accounts.map(a => a.bank_name))).sort() as string[];

  return (
    <div className="h-screen flex bg-[#F9FAFB] text-[#111827] font-sans overflow-hidden">
      <Toaster position="top-center" richColors />
      
      {/* Sidebar Navigation */}
      <aside className="w-[240px] border-r border-[#E5E7EB] bg-white flex flex-col flex-shrink-0">
        <div className="p-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg italic">Econosmishu</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
          />
          <NavItem 
            active={activeTab === 'accounts'} 
            onClick={() => setActiveTab('accounts')} 
            icon={<CreditCard size={20} />} 
            label="Accounts" 
          />
          <NavItem 
            active={activeTab === 'transactions'} 
            onClick={() => setActiveTab('transactions')} 
            icon={<History size={20} />} 
            label="Activity" 
          />
        </nav>

        <div className="mt-auto p-6 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">v{APP_VERSION}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-[#E5E7EB] bg-white flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <BarChart3 className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                className="block w-full pl-10 pr-3 py-2 border-none bg-gray-50 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg"
              onClick={() => setIsTransactionOpen(true)}
            >
              <Plus size={18} className="mr-2" /> New Transaction
            </Button>
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-end justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Financial Overview</h1>
                    <p className="text-gray-500 text-sm mt-1">Real-time status of your global savings accounts.</p>
                  </div>
                        <div className="flex items-center gap-4">
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

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                          <div className="flex bg-gray-100 p-1 rounded-lg">
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
                      </CardHeader>
                      <CardContent className="h-[380px] pt-8">
                        <ResponsiveContainer width="100%" height="100%">
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
                              <Bar 
                                dataKey="RON" 
                                fill="#F97316" 
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                              />
                              <Bar 
                                dataKey="EUR" 
                                fill="#2563EB" 
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                              />
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
                              <Line 
                                type="monotone" 
                                dataKey="RON" 
                                stroke="#F97316" 
                                strokeWidth={2.5} 
                                dot={{ r: 4, fill: '#F97316', strokeWidth: 2, stroke: '#fff' }} 
                                activeDot={{ r: 6 }} 
                              />
                              <Line 
                                type="monotone" 
                                dataKey="EUR" 
                                stroke="#2563EB" 
                                strokeWidth={2.5} 
                                dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} 
                                activeDot={{ r: 6 }} 
                              />
                            </LineChart>
                          )}
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-100 rounded-xl overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h2 className="font-semibold">Recent Transactions</h2>
                        <button className="text-xs text-blue-600 font-medium hover:underline" onClick={() => setActiveTab('transactions')}>View All Activity</button>
                      </div>
                      <div className="overflow-hidden">
                        <Table>
                          <TableHeader className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/50">
                            <TableRow>
                              <TableHead className="px-6">Description</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead className="text-right px-6">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions
                              .filter(tx => 
                                tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                accounts.find(a => a.id === tx.account_id)?.name.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                              .slice(0, 5).map((tx) => (
                              <TableRow key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="text-sm font-medium">{tx.description || 'System Entry'}</p>
                                  <p className="text-[10px] text-gray-400 uppercase">
                                    {formatDate(tx.date)}
                                  </p>
                                </td>
                                <td className="py-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    tx.type === 'DEPOSIT' ? 'bg-green-50 text-green-700' : 
                                    tx.type === 'WITHDRAWAL' ? 'bg-red-50 text-red-700' : 
                                    'bg-blue-50 text-blue-700'
                                  }`}>
                                    {tx.type}
                                  </span>
                                </td>
                                <td className={`px-6 py-4 text-right text-sm font-semibold ${
                                  tx.type === 'DEPOSIT' ? 'text-green-600' : tx.type === 'WITHDRAWAL' ? 'text-red-500' : 'text-blue-600'
                                }`}>
                                  {tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER' ? '-' : '+'}
                                  {formatCurrency(tx.amount, tx.currency)}
                                </td>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </Card>
                  </div>

                  <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                          <CreditCard size={16} className="text-blue-600" /> Accounts
                        </h2>
                        <Select 
                          value={dashboardAccountSort} 
                          onValueChange={(v: 'balance' | 'name' | 'due_date') => setDashboardAccountSort(v)}
                        >
                          <SelectTrigger className="h-7 w-[110px] text-[10px] border-none bg-gray-50 shadow-none">
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
                          <div key={acc.id} className="flex gap-3 group cursor-pointer" onClick={() => setActiveTab('accounts')}>
                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <p className="text-xs text-gray-800 font-semibold group-hover:text-blue-600 transition-colors uppercase tracking-tight">{acc.name}</p>
                                <p className="text-xs font-bold whitespace-nowrap">{formatCurrency(acc.current_balance, acc.currency)}</p>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <p className="text-[10px] text-gray-400 uppercase font-medium">{acc.bank_name}</p>
                                {acc.due_date && (
                                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${getDueDateTheme(acc.due_date)}`}>
                                    <CalendarDays size={10} />
                                    <span className="text-[9px] font-bold whitespace-nowrap">{formatDate(acc.due_date, 'long')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" className="w-full mt-6 border-gray-100 text-xs py-1" onClick={() => setActiveTab('accounts')}>
                        Manage All Accounts
                      </Button>
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
                    <Button onClick={() => setIsAddAccountOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg h-9">
                      <Plus className="mr-2 h-4 w-4" /> Add Account
                    </Button>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
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
                                <div>
                                  <div className="text-sm font-bold text-gray-900 leading-none mb-1">{acc.name}</div>
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
                                    <div>
                                      <div className="text-sm font-bold text-gray-500 leading-none mb-1 line-through">{acc.name}</div>
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
                    <Button onClick={() => setIsTransactionOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg">
                      <ArrowRightLeft className="mr-2 h-4 w-4" /> Log Transaction
                    </Button>
                  </div>
                </div>

                <Card className="shadow-sm border-gray-100 rounded-xl overflow-hidden mb-8">
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
                              {account?.name}
                              {targetAccount && (
                                <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                  <ArrowRightLeft size={10} /> {targetAccount.name}
                                </div>
                              )}
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
                </Card>
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
                  {accounts.map(acc => (
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
                    {accounts.filter(a => String(a.id) !== String(newTx.account_id)).map(acc => (
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

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span className={active ? 'text-blue-700' : 'text-gray-400'}>{icon}</span>
      {label}
    </button>
  );
}
