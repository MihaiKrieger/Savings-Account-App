import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/src/utils/formatters';

interface OwnerPulseItem {
  owner: string;
  RON: number;
  EUR: number;
  totalRON: number;
  percentage: number;
}

interface OwnerPulseCardProps {
  ownerPulse: OwnerPulseItem[];
}

export const OwnerPulseCard: React.FC<OwnerPulseCardProps> = ({
  ownerPulse
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden relative group">
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-100">
              <TrendingUp size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight">The Owner Pulse</h2>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Contribution Breakdown</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {ownerPulse.map((op, idx) => (
            <div key={op.owner} className="space-y-1.5">
              <div className="flex justify-between items-end">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{op.owner}</span>
                  <span className="text-[9px] font-bold text-gray-400">{op.percentage.toFixed(1)}%</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-900 leading-none">
                    {op.EUR > 0 && formatCurrency(op.EUR, 'EUR')}
                    {op.EUR > 0 && op.RON > 0 && <span className="mx-1 text-gray-300">|</span>}
                    {op.RON > 0 && formatCurrency(op.RON, 'RON')}
                  </p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${op.percentage}%` }}
                  transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    idx === 0 ? 'bg-blue-600' : 
                    idx === 1 ? 'bg-blue-400' : 
                    'bg-blue-200'
                  }`}
                />
              </div>
            </div>
          ))}
          {ownerPulse.length === 0 && (
            <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No active data points</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
