import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  ChevronDown, 
  Search, 
  Check, 
  TrendingUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Account } from '@/src/types';
import { formatCurrency } from '@/src/utils/formatters';
import { toast } from 'sonner';

interface AddTransactionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newTx: {
    account_id: string;
    to_account_id: string;
    type: string;
    amount: number;
    interestAmount: number;
    description: string;
    date: string;
  };
  setNewTx: React.Dispatch<React.SetStateAction<{
    account_id: string;
    to_account_id: string;
    type: string;
    amount: number;
    interestAmount: number;
    description: string;
    date: string;
  }>>;
  accounts: Account[];
  handleAddTransaction: (e: React.FormEvent) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onOpenChange,
  newTx,
  setNewTx,
  accounts,
  handleAddTransaction
}) => {
  const [searchSourceQuery, setSearchSourceQuery] = useState('');
  const [searchTargetQuery, setSearchTargetQuery] = useState('');
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const targetDropdownRef = useRef<HTMLDivElement>(null);

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
    if (!isOpen) {
      setSearchSourceQuery('');
      setSearchTargetQuery('');
      setIsSourceDropdownOpen(false);
      setIsTargetDropdownOpen(false);
    }
  }, [isOpen]);

  const filteredSourceAccounts = accounts
    .filter(a => a.is_active)
    .filter(a => {
      if (!searchSourceQuery) return true;
      const q = searchSourceQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.bank_name.toLowerCase().includes(q) ||
        a.owner.toLowerCase().includes(q) ||
        a.currency.toLowerCase().includes(q)
      );
    });

  const selectedSourceAccount = accounts.find(a => String(a.id) === String(newTx.account_id));

  const filteredTargetAccounts = accounts
    .filter(a => a.is_active)
    .filter(a => String(a.id) !== String(newTx.account_id))
    .filter(a => !selectedSourceAccount || a.currency === selectedSourceAccount.currency)
    .filter(a => {
      if (!searchTargetQuery) return true;
      const q = searchTargetQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.bank_name.toLowerCase().includes(q) ||
        a.owner.toLowerCase().includes(q) ||
        a.currency.toLowerCase().includes(q)
      );
    });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              <Select value={newTx.type} onValueChange={(v: string) => setNewTx(prev => ({...prev, type: v}))}>
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
                                setNewTx(prev => ({ ...prev, account_id: String(acc.id), to_account_id: '' }));
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
                                  setNewTx(prev => ({ ...prev, to_account_id: String(acc.id) }));
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
                    setNewTx(prev => ({...prev, amount: val}));
                  }} 
                  onBlur={e => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      setNewTx(prev => ({...prev, amount: Math.round(val * 100) / 100}));
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
                      setNewTx(prev => ({...prev, interestAmount: val}));
                    }} 
                    onBlur={e => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setNewTx(prev => ({...prev, interestAmount: Math.round(val * 100) / 100}));
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
                onChange={e => setNewTx(prev => ({...prev, description: e.target.value}))} 
                placeholder="Monthly savings, interest bonus, etc." 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Transaction Date</Label>
              <Input 
                type="date" 
                className="rounded-lg bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-emerald-100 transition-all" 
                value={newTx.date} 
                onChange={e => setNewTx(prev => ({...prev, date: e.target.value}))} 
              />
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-3 flex-row sm:flex-row mt-6 pt-2">
            <Button 
              type="button"
              variant="outline" 
              className="flex-1 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer text-xs h-10 transition-colors font-medium" 
              onClick={() => onOpenChange(false)}
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
  );
};
