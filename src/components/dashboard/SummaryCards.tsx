import React from 'react';
import { Banknote, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/src/utils/formatters';
import { Account } from '@/src/types';

interface SummaryCardsProps {
  totalBalances: Record<string, number>;
  accounts: Account[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalBalances,
  accounts
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {(Object.entries(totalBalances) as [string, number][]).map(([curr, amount]) => (
        <div key={curr} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden relative group">
          <div className={`absolute -top-10 -right-10 w-32 h-32 ${curr === 'RON' ? 'bg-orange-50' : 'bg-blue-50'} rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700`}></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 ${curr === 'RON' ? 'bg-[#F97316]' : 'bg-blue-600'} rounded-lg shadow-lg ${curr === 'RON' ? 'shadow-orange-100' : 'shadow-blue-100'}`}>
                <Banknote size={16} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-sm tracking-tight">Total {curr}</h2>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Liquid Assets</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{formatCurrency(amount, curr)}</span>
            </div>
          </div>
        </div>
      ))}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden relative group">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-100">
              <CreditCard size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight">Active Accounts</h2>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Connected Vaults</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{accounts.filter(a => a.is_active).length}</span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
              Across {new Set(accounts.filter(a => a.is_active).map(a => a.bank_name)).size} Banks
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
