import React from 'react';
import { Building2, Pencil, Trash2 } from 'lucide-react';
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
import { Account } from '@/src/types';

interface ManageBanksModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  allBanks: { id: number; name: string }[];
  accounts: Account[];
  newBankName: string;
  setNewBankName: (name: string) => void;
  handleCreateBank: (e: React.FormEvent) => void;
  editingBankId: number | null;
  setEditingBankId: (id: number | null) => void;
  editingBankName: string;
  setEditingBankName: (name: string) => void;
  handleEditBank: (e: React.FormEvent) => void;
  handleDeleteBank: (id: number, name: string, count: number) => void;
}

export const ManageBanksModal: React.FC<ManageBanksModalProps> = ({
  isOpen,
  onOpenChange,
  allBanks,
  accounts,
  newBankName,
  setNewBankName,
  handleCreateBank,
  editingBankId,
  setEditingBankId,
  editingBankName,
  setEditingBankName,
  handleEditBank,
  handleDeleteBank
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-xl overflow-hidden">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-slate-900 font-semibold text-base leading-tight">Manage Banks</DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Create, Edit, and Delete Financial Institutions</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Create Bank Form */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
              <Building2 size={14} className="text-blue-600" /> Create Bank
            </Label>
            <form onSubmit={handleCreateBank} className="flex gap-2">
              <Input 
                type="text" 
                placeholder="Enter new bank name..." 
                value={newBankName} 
                onChange={e => setNewBankName(e.target.value)} 
                className="flex-1 bg-white border-slate-200 text-sm h-9 rounded-lg focus:ring-2 focus:ring-blue-100 font-medium"
              />
              <Button 
                type="submit" 
                className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer shadow-xs"
              >
                Create
              </Button>
            </form>
          </div>

          {/* Existing Banks List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Existing Banks ({allBanks.length})
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {allBanks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  No banks found. Add one above!
                </div>
              ) : (
                allBanks.map(bank => {
                  const accountCount = accounts.filter(a => a.bank_name === bank.name).length;
                  const isEditing = editingBankId === bank.id;

                  return (
                    <div key={bank.id} className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl shadow-xs transition-all hover:border-slate-300">
                      {isEditing ? (
                        <form onSubmit={handleEditBank} className="flex-1 flex items-center gap-2 mr-2">
                          <Input 
                            type="text" 
                            value={editingBankName} 
                            onChange={e => setEditingBankName(e.target.value)} 
                            className="flex-1 h-8 text-xs bg-white border-blue-300 focus:ring-1 focus:ring-blue-500 rounded-md font-medium"
                            autoFocus
                          />
                          <Button type="submit" size="sm" className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-md cursor-pointer">
                            Save
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingBankId(null); setEditingBankName(''); }} className="h-8 px-2 text-slate-500 text-[11px] rounded-md cursor-pointer">
                            Cancel
                          </Button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                              {bank.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 text-xs block truncate">{bank.name}</span>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {accountCount} {accountCount === 1 ? 'account' : 'accounts'} assigned
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBankId(bank.id);
                                setEditingBankName(bank.name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Bank"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBank(bank.id, bank.name, accountCount)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Bank"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 pt-2 border-t border-slate-100">
          <Button 
            type="button"
            variant="outline" 
            className="w-full rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer text-xs h-9 transition-colors font-medium" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
