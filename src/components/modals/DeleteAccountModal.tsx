import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Account } from '@/src/types';
import { formatCurrency } from '@/src/utils/formatters';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  accountToDelete: Account | null;
  onConfirmDelete: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onOpenChange,
  accountToDelete,
  onConfirmDelete
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm shadow-red-100 cursor-pointer text-xs h-10 transition-all font-semibold active:scale-[0.98]" 
            onClick={onConfirmDelete}
          >
            Delete Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
