import React from 'react';
import { motion } from 'motion/react';
import { 
  CalendarDays, 
  ChevronDown, 
  Check, 
  Filter, 
  X, 
  History, 
  TrendingUp, 
  CreditCard, 
  ArrowRightLeft, 
  ArrowRight, 
  Trash2 
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Transaction, Account } from '@/src/types';
import { formatCurrency, formatDate } from '@/src/utils/formatters';

interface TransactionsViewProps {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  visibleTransactions: Transaction[];
  visibleTxCount: number;
  setVisibleTxCount: React.Dispatch<React.SetStateAction<number>>;
  accountsMap: Map<number, Account>;
  // Date filter
  isTxDateFilterOpen: boolean;
  setIsTxDateFilterOpen: (open: boolean) => void;
  isTxDateFilterActive: boolean;
  getTxDateFilterLabel: () => string;
  txDatePreset: string;
  applyTxDatePreset: (preset: string) => void;
  clearTxDateFilter: () => void;
  txStartDate: string;
  setTxStartDate: (date: string) => void;
  txEndDate: string;
  setTxEndDate: (date: string) => void;
  setTxDatePreset: (preset: string) => void;
  // Type filter
  txTypeFilter: string;
  setTxTypeFilter: (filter: any) => void;
  // Currency filter
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  // Owner filter
  isOwnerFilterOpen: boolean;
  setIsOwnerFilterOpen: (open: boolean) => void;
  selectedOwners: string[];
  setSelectedOwners: (owners: string[]) => void;
  toggleOwner: (owner: string) => void;
  owners: string[];
  // Bank filter
  selectedBank: string;
  setSelectedBank: (bank: string) => void;
  banks: string[];
  // Sort
  txSortOrder: 'newest' | 'oldest';
  setTxSortOrder: (order: 'newest' | 'oldest') => void;
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  // Delete
  deletingTxId: number | null;
  setDeletingTxId: (id: number | null) => void;
  deleteTransaction: (id: number) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  filteredTransactions,
  visibleTransactions,
  visibleTxCount,
  setVisibleTxCount,
  accountsMap,
  isTxDateFilterOpen,
  setIsTxDateFilterOpen,
  isTxDateFilterActive,
  getTxDateFilterLabel,
  txDatePreset,
  applyTxDatePreset,
  clearTxDateFilter,
  txStartDate,
  setTxStartDate,
  txEndDate,
  setTxEndDate,
  setTxDatePreset,
  txTypeFilter,
  setTxTypeFilter,
  selectedCurrency,
  setSelectedCurrency,
  isOwnerFilterOpen,
  setIsOwnerFilterOpen,
  selectedOwners,
  setSelectedOwners,
  toggleOwner,
  owners,
  selectedBank,
  setSelectedBank,
  banks,
  txSortOrder,
  setTxSortOrder,
  searchQuery,
  setSearchQuery,
  deletingTxId,
  setDeletingTxId,
  deleteTransaction
}) => {
  return (
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
                className="flex items-center justify-between min-w-[110px] max-w-[150px] h-9 bg-white border border-gray-200 shadow-sm px-3 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors shrink-0 cursor-pointer"
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
                      className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] hover:bg-gray-50 transition-colors cursor-pointer"
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
                        className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] hover:bg-gray-50 transition-colors cursor-pointer"
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
  );
};
