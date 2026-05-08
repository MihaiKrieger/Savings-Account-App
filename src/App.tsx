import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CreditCard, 
  History, 
  LayoutDashboard, 
  Plus, 
  ArrowRightLeft, 
  TrendingUp,
  Wallet,
  Building2,
  Trash2,
  Pencil
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
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedBank, setSelectedBank] = useState('all');
  const [dashboardAccountSort, setDashboardAccountSort] = useState<'balance' | 'name'>('balance');

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
    initial_balance: 0
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
    interest: 0,
    description: ''
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
        body: JSON.stringify(newAccount)
      });
      if (res.ok) {
        toast.success('Account created successfully');
        setIsAddAccountOpen(false);
        setNewAccount({ owner: '', bank_name: '', name: '', description: '', currency: 'RON', initial_balance: 0 });
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
          amount: parseFloat(newTx.amount.toString()),
          interest: parseFloat(newTx.interest.toString())
        })
      });
      if (res.ok) {
        toast.success('Transaction processed');
        setIsTransactionOpen(false);
        setNewTx({ account_id: '', to_account_id: '', type: 'DEPOSIT', amount: 0, interest: 0, description: '' });
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ro-RO', { style: 'currency', currency }).format(amount);
  };

  // Prepare Chart Data
  const getChartData = () => {
    const filteredAccounts = accounts.filter(a => {
      const matchesOwner = selectedOwner === 'all' || a.owner === selectedOwner;
      const matchesBank = selectedBank === 'all' || a.bank_name === selectedBank;
      return matchesOwner && matchesBank;
    });
    
    const filteredAnalytics = analytics.filter(ana => {
      const acc = accounts.find(a => a.id === ana.account_id);
      if (!acc) return false;
      const matchesOwner = selectedOwner === 'all' || acc.owner === selectedOwner;
      const matchesBank = selectedBank === 'all' || acc.bank_name === selectedBank;
      return matchesOwner && matchesBank;
    });

    // Group analytics by day and currency for the main chart
    const dailyData: any = {};
    const sortedData = [...filteredAnalytics].sort((a,b) => new Date(a.day).getTime() - new Date(b.day).getTime());
    
    // We need to accumulate balances over time
    const runningBalances: Record<string, number> = {};
    
    const result: any[] = [];
    const days = Array.from(new Set(sortedData.map(d => d.day)));
    const currencies = ['RON', 'EUR', 'USD'];

    days.forEach(day => {
      const dayPoint: any = { day };
      currencies.forEach(curr => {
        const changes = sortedData.filter(d => d.day === day && d.currency === curr);
        const totalChange = changes.reduce((sum, d) => sum + d.change, 0);
        
        // Find accounts of this currency and add their initial balance if this is the first day
        if (!runningBalances[curr]) {
          const initial = filteredAccounts
            .filter(a => a.currency === curr)
            .reduce((sum, a) => sum + a.initial_balance, 0);
          runningBalances[curr] = initial;
        }
        
        runningBalances[curr] += totalChange;
        dayPoint[curr] = runningBalances[curr];
      });
      result.push(dayPoint);
    });
    
    return result;
  };

  const chartData = getChartData();

  const filteredAccountsForStats = accounts.filter(a => {
    const matchesOwner = selectedOwner === 'all' || a.owner === selectedOwner;
    const matchesBank = selectedBank === 'all' || a.bank_name === selectedBank;
    return matchesOwner && matchesBank;
  });

  const totalBalances = filteredAccountsForStats.reduce((acc, curr) => {
    acc[curr.currency] = (acc[curr.currency] || 0) + curr.current_balance;
    return acc;
  }, {} as Record<string, number>);

  const owners = Array.from(new Set(accounts.map(a => a.owner))).sort();
  const banks = Array.from(new Set(accounts.map(a => a.bank_name))).sort();

  return (
    <div className="h-screen flex bg-[#F9FAFB] text-[#111827] font-sans overflow-hidden">
      <Toaster position="top-right" richColors />
      
      {/* Sidebar Navigation */}
      <aside className="w-[240px] border-r border-[#E5E7EB] bg-white flex flex-col flex-shrink-0">
        <div className="p-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg italic">SaverFlow</span>
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

        <div className="mt-auto p-4 border-t border-gray-50">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
              {accounts[0]?.owner.substring(0, 2).toUpperCase() || 'SA'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{accounts[0]?.owner || 'User'}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Savings Pro</p>
            </div>
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
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-400 uppercase">Owner:</span>
                          <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                            <SelectTrigger className="w-[140px] h-9 bg-white border-gray-100 shadow-sm text-xs font-medium">
                              <SelectValue placeholder="All Owners" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Owners</SelectItem>
                              {owners.map(owner => (
                                <SelectItem key={owner} value={owner} textValue={owner}>{owner}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-400 uppercase">Bank:</span>
                          <Select value={selectedBank} onValueChange={setSelectedBank}>
                            <SelectTrigger className="w-[140px] h-9 bg-white border-gray-100 shadow-sm text-xs font-medium">
                              <SelectValue placeholder="All Banks" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Banks</SelectItem>
                              {banks.map(bank => (
                                <SelectItem key={bank} value={bank} textValue={bank}>{bank}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                       </div>
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
                      <span className="text-2xl font-bold">{accounts.length}</span>
                      <span className="text-xs font-medium text-blue-600">Across {new Set(accounts.map(a => a.bank_name)).size} Banks</span>
                    </div>
                  </div>
                </div>

                {/* Grid Split */}
                <div className="grid grid-cols-12 gap-6 pb-8">
                  <div className="col-span-12 lg:col-span-8 space-y-6">
                    <Card className="shadow-sm border-gray-100 rounded-xl overflow-hidden">
                      <CardHeader className="bg-gray-50/50 border-b border-gray-50 pb-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg">Portfolio Evolution</CardTitle>
                            <CardDescription>Consolidated growth across currencies</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="h-[350px] pt-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis 
                              dataKey="day" 
                              stroke="#9CA3AF" 
                              fontSize={11} 
                              tickLine={false} 
                              axisLine={false} 
                              tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            />
                            <YAxis 
                              stroke="#9CA3AF" 
                              fontSize={11} 
                              tickLine={false} 
                              axisLine={false}
                              tickFormatter={(val: number) => val > 1000 ? `${(val/1000).toFixed(0)}k` : val.toString()}
                            />
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }} 
                            />
                            <Legend iconType="circle" />
                            <Area type="monotone" dataKey="RON" stroke="#2563EB" fillOpacity={1} fill="url(#colorPrimary)" strokeWidth={2} />
                            <Area type="monotone" dataKey="EUR" stroke="#10B981" fillOpacity={0} strokeWidth={2} />
                            <Area type="monotone" dataKey="USD" stroke="#6366F1" fillOpacity={0} strokeWidth={2} />
                          </AreaChart>
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
                                  <p className="text-[10px] text-gray-400 uppercase">{new Date(tx.date).toLocaleDateString()}</p>
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
                          onValueChange={(v: 'balance' | 'name') => setDashboardAccountSort(v)}
                        >
                          <SelectTrigger className="h-7 w-[110px] text-[10px] border-none bg-gray-50 shadow-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="balance">Sort: Balance</SelectItem>
                            <SelectItem value="name">Sort: Owner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-4">
                        {filteredAccountsForStats
                          .sort((a,b) => {
                            if (dashboardAccountSort === 'balance') return b.current_balance - a.current_balance;
                            return a.owner.localeCompare(b.owner);
                          })
                          .slice(0, 4)
                          .map(acc => (
                          <div key={acc.id} className="flex gap-3 group cursor-pointer" onClick={() => setActiveTab('accounts')}>
                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-800 font-semibold group-hover:text-blue-600 transition-colors">{acc.name}</p>
                              <div className="flex justify-between items-center mt-0.5">
                                <p className="text-[10px] text-gray-400 uppercase">{acc.bank_name}</p>
                                <p className="text-xs font-bold">{formatCurrency(acc.current_balance, acc.currency)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" className="w-full mt-6 border-gray-100 text-xs py-1" onClick={() => setActiveTab('accounts')}>
                        Manage All Accounts
                      </Button>
                    </div>

                    <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
                      <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Target Progress</h3>
                      <p className="text-xl font-medium leading-tight mb-4">You're making great progress this month.</p>
                      <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-white rounded-full"></div>
                      </div>
                      <p className="text-[10px] mt-3 opacity-70">65% of your ideal savings buffer achieved.</p>
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
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Your Accounts</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage connection details and specific descriptions.</p>
                  </div>
                  <Button onClick={() => setIsAddAccountOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg">
                    <Plus className="mr-2 h-4 w-4" /> Add Account
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accounts.map((acc) => (
                    <Card key={acc.id} className="shadow-sm hover:shadow-md transition-all border-[#E5E7EB] rounded-xl overflow-hidden group">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <Building2 size={24} />
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-gray-400 hover:text-blue-600"
                              onClick={() => {
                                setEditingAccount(acc);
                                setIsEditAccountOpen(true);
                              }}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-gray-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAccountToDelete(acc);
                                setIsDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4">
                          <CardTitle className="text-base font-bold">{acc.name}</CardTitle>
                          <CardDescription className="text-xs uppercase tracking-wider">{acc.bank_name} • {acc.owner}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mt-2">
                          <p className="text-2xl font-bold tracking-tight text-[#111827]">
                            {formatCurrency(acc.current_balance, acc.currency)}
                          </p>
                          <p className="text-xs text-gray-400 mt-2 line-clamp-2 min-h-[2.5rem] italic">
                            {acc.description || 'Financial pillar for long-term security.'}
                          </p>
                        </div>
                      </CardContent>
                      <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-50 flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${acc.current_balance > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{acc.currency} Active</span>
                      </div>
                    </Card>
                  ))}
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
                  <Button onClick={() => setIsTransactionOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg">
                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Log Transaction
                  </Button>
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
                              {new Date(tx.date).toLocaleDateString()} at {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell className={`px-6 text-right font-bold text-sm ${
                              tx.type === 'DEPOSIT' ? 'text-green-600' : 
                              tx.type === 'WITHDRAWAL' ? 'text-red-500' : 
                              'text-blue-600'
                            }`}>
                              {tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER' ? '-' : '+'}
                              {formatCurrency(tx.amount, tx.currency)}
                              {tx.interest > 0 && (
                               <div className="text-[9px] text-gray-400 font-normal italic">
                                 {tx.type === 'TRANSFER' ? 'Exc.' : 'Inc.'} {formatCurrency(tx.interest, tx.currency)} int.
                               </div>
                              )}
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
              <Input required className="bg-white border-gray-200" value={newAccount.owner} onChange={e => setNewAccount({...newAccount, owner: e.target.value})} placeholder="e.g. John Doe" />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={newAccount.currency} onValueChange={(v: Currency) => setNewAccount({...newAccount, currency: v})}>
                  <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RON">RON</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Initial Balance</Label>
                <Input type="number" step="0.01" className="bg-white border-gray-200" value={isNaN(newAccount.initial_balance) ? '' : newAccount.initial_balance} onChange={e => setNewAccount({...newAccount, initial_balance: e.target.value === '' ? 0 : parseFloat(e.target.value)})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input className="rounded-lg bg-white border-gray-200" value={newAccount.description} onChange={e => setNewAccount({...newAccount, description: e.target.value})} />
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
                  <SelectItem value="DEPOSIT">Deposit</SelectItem>
                  <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{newTx.type === 'TRANSFER' ? 'From Account' : 'Account'}</Label>
              <Select value={newTx.account_id} onValueChange={(v) => setNewTx({...newTx, account_id: v})}>
                <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id.toString()} textValue={acc.name}>{acc.name} ({acc.bank_name})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {newTx.type === 'TRANSFER' && (
              <div className="space-y-2">
                <Label>To Account</Label>
                <Select value={newTx.to_account_id} onValueChange={(v) => setNewTx({...newTx, to_account_id: v})}>
                  <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm"><SelectValue placeholder="Select target account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.filter(a => a.id.toString() !== newTx.account_id).map(acc => (
                      <SelectItem key={acc.id} value={acc.id.toString()} textValue={acc.name}>{acc.name} ({acc.bank_name})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" step="0.01" required className="bg-white border-gray-200" value={isNaN(newTx.amount) ? '' : newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value === '' ? 0 : parseFloat(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Interest (Optional)</Label>
                <Input type="number" step="0.01" className="bg-white border-gray-200" value={isNaN(newTx.interest) ? '' : newTx.interest} onChange={e => setNewTx({...newTx, interest: e.target.value === '' ? 0 : parseFloat(e.target.value)})} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Input className="rounded-lg bg-white border-gray-200" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} placeholder="Monthly savings, coffee, etc." />
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
                <Input required value={editingAccount.owner} onChange={e => setEditingAccount({...editingAccount, owner: e.target.value})} />
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
                <Label>Description</Label>
                <Input required className="rounded-lg bg-white border-gray-200" value={editingAccount.description} onChange={e => setEditingAccount({...editingAccount, description: e.target.value})} />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
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
