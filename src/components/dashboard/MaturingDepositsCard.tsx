import React from 'react';
import { Radar, ArrowRight, CalendarDays, Pencil } from 'lucide-react';
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { Account } from '@/src/types';

export interface DueAccount extends Account {
  daysLeft: number;
}

interface MaturingDepositsCardProps {
  dueSoonAccounts: DueAccount[];
  onNavigateToAccounts: () => void;
  onEditAccount: (account: Account) => void;
}

export const MaturingDepositsCard: React.FC<MaturingDepositsCardProps> = ({
  dueSoonAccounts,
  onNavigateToAccounts,
  onEditAccount
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden relative group">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-100">
              <Radar size={16} className="text-white animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight">The Due Radar</h2>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Priority Watchlist</p>
            </div>
          </div>
          <div className="flex -space-x-2">
            {dueSoonAccounts.slice(0, 3).map((a) => (
              <div key={a.id} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400" title={a.owner}>
                {a.owner.substring(0, 1)}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {dueSoonAccounts.slice(0, 3).map(acc => (
            <div 
              key={acc.id} 
              className="relative p-3 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:border-gray-200 hover:shadow-xs transition-all group/item" 
            >
              <div className="flex justify-between items-start mb-2">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{acc.bank_name}</p>
                    <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-gray-100 leading-none shrink-0">
                      {acc.owner}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-tight truncate">{acc.name}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-black italic shadow-xs ${
                    acc.daysLeft <= 0 ? 'bg-red-500 text-white animate-elegant-pulse' :
                    acc.daysLeft <= 10 ? 'bg-orange-500 text-white' :
                    acc.daysLeft <= 31 ? 'bg-blue-600 text-white' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {acc.daysLeft === 0 ? 'DUE TODAY' : acc.daysLeft < 0 ? 'OVERDUE' : `T-MINUS ${acc.daysLeft}D`}
                  </div>
                  <button
                    type="button"
                    onClick={() => onEditAccount(acc)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 bg-white border border-slate-200/90 shadow-2xs transition-colors cursor-pointer"
                    title={`Edit ${acc.name} directly`}
                    aria-label={`Edit ${acc.name}`}
                  >
                    <Pencil size={11} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CalendarDays size={10} className="text-gray-400" />
                  <span className="text-[10px] font-medium text-gray-500">{formatDate(acc.due_date, 'long')}</span>
                </div>
                <p className="text-xs font-black text-gray-900">{formatCurrency(acc.current_balance, acc.currency)}</p>
              </div>
            </div>
          ))}
          {dueSoonAccounts.length === 0 && (
            <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No active targets on radar</p>
            </div>
          )}
        </div>
        {dueSoonAccounts.length > 3 && (
          <button 
            onClick={onNavigateToAccounts}
            className="w-full mt-4 py-2 text-[10px] font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            View all {dueSoonAccounts.length} scheduled items <ArrowRight size={10} />
          </button>
        )}
      </div>
    </div>
  );
};
