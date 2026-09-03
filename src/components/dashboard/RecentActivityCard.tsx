import React from 'react';
import { 
  History, 
  ArrowRight, 
  TrendingUp, 
  CreditCard, 
  ArrowRightLeft 
} from 'lucide-react';
import { Transaction, Account } from '@/src/types';
import { formatCurrency, formatDate } from '@/src/utils/formatters';

interface RecentActivityCardProps {
  transactions: Transaction[];
  accountsMap: Map<number, Account>;
  searchQuery: string;
  onNavigateToActivity: () => void;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  transactions,
  accountsMap,
  searchQuery,
  onNavigateToActivity
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden relative group">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-800 rounded-lg shadow-sm shadow-slate-100">
              <History size={14} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-slate-900">Recent Activity</h2>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Latest transactions</p>
            </div>
          </div>
          <button 
            onClick={onNavigateToActivity}
            className="text-[10px] font-extrabold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors flex items-center gap-1 cursor-pointer"
          >
            Full Board <ArrowRight size={10} />
          </button>
        </div>

        <div className="divide-y divide-gray-100/80">
          {transactions
            .filter(tx => 
              tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
              tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
              accountsMap.get(tx.account_id)?.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 5).map((tx) => {
              const account = accountsMap.get(tx.account_id);
              const targetAccount = tx.to_account_id ? accountsMap.get(tx.to_account_id) : null;
              
              return (
                <div 
                  key={tx.id} 
                  className="py-2 px-1 flex items-center justify-between gap-3" 
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[10px] font-black ${
                      tx.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      tx.type === 'WITHDRAWAL' ? 'bg-rose-50 text-rose-500 border border-rose-100' :
                      'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {tx.type === 'DEPOSIT' && <TrendingUp size={12} />}
                      {tx.type === 'WITHDRAWAL' && <CreditCard size={12} />}
                      {tx.type === 'TRANSFER' && <ArrowRightLeft size={12} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                        {tx.description || 'System Entry'}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        <span className="truncate">
                          {tx.type === 'TRANSFER' ? `${account?.name || 'Vault'} → ${targetAccount?.name || 'Vault'}` : (account?.name || 'Vault')}
                        </span>
                        <span>•</span>
                        <span className="shrink-0">{formatDate(tx.date)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-bold ${
                      tx.type === 'DEPOSIT' ? 'text-emerald-600' : tx.type === 'WITHDRAWAL' ? 'text-rose-500' : 'text-blue-600'
                    }`}>
                      {tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER' ? '-' : '+'}
                      {formatCurrency(tx.amount, tx.currency)}
                    </div>
                    <span className={`text-[9px] font-black tracking-tighter uppercase ${
                      tx.type === 'DEPOSIT' ? 'text-emerald-600/80' : 
                      tx.type === 'WITHDRAWAL' ? 'text-rose-500/80' : 
                      'text-blue-600/80'
                    }`}>
                      {tx.type}
                    </span>
                  </div>
                </div>
              );
            })}
          {transactions.length === 0 && (
            <div className="py-6 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No activity recorded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
