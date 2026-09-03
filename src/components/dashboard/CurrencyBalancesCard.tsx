import React from 'react';
import { Banknote, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/src/utils/formatters';

interface CurrencyBalancesCardProps {
  currencySnapshot: {
    totalEur: number;
    ronContribution: number;
    rate: number;
  } | null;
  totalBalances: Record<string, number>;
}

export const CurrencyBalancesCard: React.FC<CurrencyBalancesCardProps> = ({
  currencySnapshot,
  totalBalances
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden relative group">
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-100">
              <Banknote size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-gray-900">Currency Snapshot</h2>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Consolidated EUR</p>
            </div>
          </div>
          {currencySnapshot && (
            <div className="bg-emerald-50 px-2 py-1 rounded text-[10px] font-bold text-emerald-700 border border-emerald-100 italic">
              Live Rate
            </div>
          )}
        </div>

        {currencySnapshot ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-gray-900 tracking-tighter">
                  {formatCurrency(currencySnapshot.totalEur, 'EUR')}
                </span>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Combined Capital</p>
            </div>
            
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500 font-medium uppercase">Direct EUR</span>
                <span className="font-bold text-gray-900">{formatCurrency(totalBalances['EUR'] || 0, 'EUR')}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500 font-medium uppercase">Converted RON</span>
                <span className="font-bold text-gray-900">{formatCurrency(currencySnapshot.ronContribution, 'EUR')}</span>
              </div>
              <div className="h-px bg-gray-200 mt-1" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-[9px] text-gray-400 font-bold uppercase">1 RON ≈</span>
                <span className="text-[10px] font-black text-emerald-600 italic">{(currencySnapshot.rate).toFixed(4)} EUR</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 opacity-40">
            <TrendingUp size={24} className="text-gray-300 animate-pulse" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Synching rates...</p>
          </div>
        )}
      </div>
    </div>
  );
};
