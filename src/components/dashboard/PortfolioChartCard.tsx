import React from 'react';
import { TrendingUp } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { formatCurrency } from '@/src/utils/formatters';

interface PortfolioChartCardProps {
  chartData: any[];
  isChartReady: boolean;
  getRangeLabel: () => string;
  chartCurrencyFilter: 'all' | 'TOTAL' | 'RON' | 'EUR';
  setChartCurrencyFilter: (filter: 'all' | 'TOTAL' | 'RON' | 'EUR') => void;
}

export const PortfolioChartCard: React.FC<PortfolioChartCardProps> = ({
  chartData,
  isChartReady,
  getRangeLabel,
  chartCurrencyFilter,
  setChartCurrencyFilter
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden relative group">
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-100">
              <TrendingUp size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight">Portfolio Evolution</h2>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Growth across {getRangeLabel()} • EUR scaled to RON baseline for visual proportion</p>
            </div>
          </div>
          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
            <button 
              onClick={() => setChartCurrencyFilter('all')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${chartCurrencyFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              ALL
            </button>
            <button 
              onClick={() => setChartCurrencyFilter('TOTAL')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${chartCurrencyFilter === 'TOTAL' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              TOTAL
            </button>
            <button 
              onClick={() => setChartCurrencyFilter('RON')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${chartCurrencyFilter === 'RON' ? 'bg-[#F97316] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              RON
            </button>
            <button 
              onClick={() => setChartCurrencyFilter('EUR')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${chartCurrencyFilter === 'EUR' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              EUR
            </button>
          </div>
        </div>
        <div className="h-[280px] sm:h-[400px] lg:h-[500px] w-full min-w-0">
          {isChartReady ? (
            <ResponsiveContainer width="100%" height="100%" debounce={250}>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorRon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorEur" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="day" 
                  stroke="#94A3B8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return date.toLocaleDateString('en-GB', { 
                      month: 'short',
                      year: '2-digit'
                    });
                  }}
                />
                <YAxis 
                  stroke="#94A3B8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-10}
                  tickFormatter={(val: number) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val.toString()}
                />
                <Tooltip 
                  formatter={(value: any, name: string, props: any) => {
                    if (name === 'Total (in RON)' || name === 'Total (RON)' || name === 'Total_RON') {
                      return [formatCurrency(value ?? 0, 'RON'), 'Total (in RON)'];
                    }
                    if (name === 'EUR') {
                      const rawEur = props.payload?.EUR;
                      return [
                        `${formatCurrency(rawEur ?? 0, 'EUR')} (~${formatCurrency(value ?? 0, 'RON')} equivalent)`,
                        'EUR'
                      ];
                    }
                    if (name === 'RON') {
                      return [formatCurrency(value, 'RON'), 'RON'];
                    }
                    return [value, name];
                  }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    fontSize: '12px',
                    padding: '12px'
                  }} 
                  itemStyle={{ padding: '2px 0' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#1E293B' }}
                  labelFormatter={(label) => {
                    const d = new Date(label);
                    return d.toLocaleDateString('en-GB', {
                      month: 'long',
                      year: 'numeric'
                    });
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  height={36} 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 500, paddingBottom: '20px' }}
                />
                {(chartCurrencyFilter === 'all' || chartCurrencyFilter === 'TOTAL') && (
                  <Area 
                    type="monotone" 
                    dataKey="Total_RON" 
                    name="Total (in RON)"
                    stroke="#10B981" 
                    strokeWidth={2.5} 
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6 }} 
                  />
                )}
                {(chartCurrencyFilter === 'all' || chartCurrencyFilter === 'RON') && (
                  <Area 
                    type="monotone" 
                    dataKey="RON" 
                    name="RON"
                    stroke="#F97316" 
                    strokeWidth={2.5} 
                    fillOpacity={1}
                    fill="url(#colorRon)"
                    dot={{ r: 4, fill: '#F97316', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6 }} 
                  />
                )}
                {(chartCurrencyFilter === 'all' || chartCurrencyFilter === 'EUR') && (
                  <Area 
                    type="monotone" 
                    dataKey="EUR_scaled" 
                    name="EUR"
                    stroke="#2563EB" 
                    strokeWidth={2.5} 
                    fillOpacity={1}
                    fill="url(#colorEur)"
                    dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6 }} 
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-lg animate-pulse gap-2 border border-slate-100/50">
              <p className="text-[11px] font-medium text-slate-400">Loading chart view...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
