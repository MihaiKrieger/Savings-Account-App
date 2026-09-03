import React from 'react';
import { PiggyBank } from 'lucide-react';
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
import { Currency } from '@/src/types';

interface AddAccountModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newAccount: {
    owner: string;
    bank_name: string;
    name: string;
    description: string;
    currency: Currency;
    initial_balance: number;
    is_active: boolean;
    due_date: string;
  };
  setNewAccount: React.Dispatch<React.SetStateAction<{
    owner: string;
    bank_name: string;
    name: string;
    description: string;
    currency: Currency;
    initial_balance: number;
    is_active: boolean;
    due_date: string;
  }>>;
  owners: string[];
  banks: string[];
  handleAddAccount: (e: React.FormEvent) => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onOpenChange,
  newAccount,
  setNewAccount,
  owners,
  banks,
  handleAddAccount
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                onValueChange={(v) => setNewAccount(prev => ({...prev, owner: v}))}
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
                  onValueChange={(v) => setNewAccount(prev => ({...prev, bank_name: v}))}
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
                  onChange={e => setNewAccount(prev => ({...prev, name: e.target.value}))} 
                  placeholder="e.g. Holiday Fund" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Currency</Label>
                <Select value={newAccount.currency} onValueChange={(v: Currency) => setNewAccount(prev => ({...prev, currency: v}))}>
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
                  onChange={e => setNewAccount(prev => ({...prev, initial_balance: parseFloat(e.target.value) || 0}))} 
                  placeholder="0.00" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Description (Optional)</Label>
              <Input 
                className="rounded-lg bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-blue-100 transition-all" 
                value={newAccount.description} 
                onChange={e => setNewAccount(prev => ({...prev, description: e.target.value}))} 
                placeholder="What is this account used for?"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Due Date (Optional)</Label>
              <Input 
                type="date" 
                className="rounded-lg bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-blue-100 transition-all" 
                value={newAccount.due_date} 
                onChange={e => setNewAccount(prev => ({...prev, due_date: e.target.value}))} 
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-100 cursor-pointer text-xs h-10 transition-all font-semibold active:scale-[0.98]" 
            >
              Create Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
