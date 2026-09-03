import React from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Info, 
  Pencil, 
  Trash2, 
  CalendarDays, 
  ChevronDown, 
  Check 
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Account } from '@/src/types';
import { formatCurrency, formatDate, getDueDateTheme } from '@/src/utils/formatters';

interface AccountsViewProps {
  accounts: Account[];
  accountStatusFilter: 'all' | 'active' | 'inactive';
  setAccountStatusFilter: (filter: 'all' | 'active' | 'inactive') => void;
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  isOwnerFilterOpen: boolean;
  setIsOwnerFilterOpen: (open: boolean) => void;
  selectedOwners: string[];
  setSelectedOwners: (owners: string[]) => void;
  toggleOwner: (owner: string) => void;
  owners: string[];
  selectedBank: string;
  setSelectedBank: (bank: string) => void;
  banks: string[];
  accountsSortField: 'balance' | 'owner' | 'bank' | 'currency' | 'due_date';
  setAccountsSortField: (field: 'balance' | 'owner' | 'bank' | 'currency' | 'due_date') => void;
  accountsSortOrder: 'asc' | 'desc';
  setAccountsSortOrder: (order: 'asc' | 'desc') => void;
  searchQuery: string;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (account: Account) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  accountStatusFilter,
  setAccountStatusFilter,
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
  accountsSortField,
  setAccountsSortField,
  accountsSortOrder,
  setAccountsSortOrder,
  searchQuery,
  onEditAccount,
  onDeleteAccount
}) => {
  return (
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
                          className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                          onClick={() => onEditAccount(acc)}
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAccount(acc);
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
                      .sort((a, b) => b.current_balance - a.current_balance)
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
                              className="h-7 w-7 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                              onClick={() => onEditAccount(acc)}
                            >
                              <Pencil size={12} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAccount(acc);
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => onEditAccount(acc)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 cursor-pointer" onClick={() => onDeleteAccount(acc)}>
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
  );
};
