import React from 'react';
import { Pencil } from 'lucide-react';
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

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-semibold text-slate-700">Account Active</span>
              <input 
                type="checkbox" 
                checked={editingAccount.is_active} 
                onChange={e => setEditingAccount({...editingAccount, is_active: e.target.checked})} 
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
