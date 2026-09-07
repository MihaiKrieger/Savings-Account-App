import React from 'react';
import { Pencil, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/src/utils/formatters';
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

interface EditAccountModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingAccount: Account | null;
  setEditingAccount: React.Dispatch<React.SetStateAction<Account | null>>;
  owners: string[];
  banks: string[];
  handleEditAccount: (e: React.FormEvent) => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  onOpenChange,
  editingAccount,
  setEditingAccount,
  owners,
  banks,
  handleEditAccount
}) => {
  if (!editingAccount) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Description</Label>
              <Input 
                className="rounded-lg bg-white border-slate-200 text-slate-800 text-sm h-10 focus:ring-2 focus:ring-blue-100 transition-all" 
                value={editingAccount.description || ''} 
                onChange={e => setEditingAccount({...editingAccount, description: e.target.value})} 
                placeholder="Account notes"
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

            <div className={`p-3 rounded-lg border transition-all ${
              editingAccount.current_balance && Math.abs(editingAccount.current_balance) > 0.001
                ? 'bg-slate-50/80 border-slate-200/80' 
                : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-700">Account Active</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      editingAccount.is_active 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {editingAccount.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Balance: <span className="font-semibold text-slate-700">{formatCurrency(editingAccount.current_balance || 0, editingAccount.currency)}</span>
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  id="edit-account-active-checkbox"
                  checked={editingAccount.is_active} 
                  disabled={Boolean(editingAccount.current_balance && Math.abs(editingAccount.current_balance) > 0.001)}
                  onChange={e => {
                    const hasNonZeroBalance = Boolean(editingAccount.current_balance && Math.abs(editingAccount.current_balance) > 0.001);
                    if (!e.target.checked && hasNonZeroBalance) return;
                    setEditingAccount({...editingAccount, is_active: e.target.checked});
                  }} 
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  title={
                    editingAccount.current_balance && Math.abs(editingAccount.current_balance) > 0.001
                      ? 'Only accounts with balance 0.00 can be marked as inactive'
                      : 'Toggle account active status'
                  }
                />
              </div>

              {Boolean(editingAccount.current_balance && Math.abs(editingAccount.current_balance) > 0.001) && (
                <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded-md border border-amber-200/60 leading-tight">
                  <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Only accounts with a balance of <strong>0.00</strong> can be deactivated. Transfer or withdraw the remaining balance before marking this account as inactive.
                  </span>
                </div>
              )}
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
