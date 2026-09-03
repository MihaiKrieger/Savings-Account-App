import React from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { SummaryCards } from '@/src/components/dashboard/SummaryCards';
import { PortfolioChartCard } from '@/src/components/dashboard/PortfolioChartCard';
import { RecentActivityCard } from '@/src/components/dashboard/RecentActivityCard';
import { CurrencyBalancesCard } from '@/src/components/dashboard/CurrencyBalancesCard';
import { MaturingDepositsCard } from '@/src/components/dashboard/MaturingDepositsCard';
import { OwnerPulseCard } from '@/src/components/dashboard/OwnerPulseCard';
import { Account, Transaction } from '@/src/types';

interface DueAccount {
  id: number;
  name: string;
  bank_name: string;
  owner: string;
  current_balance: number;
  currency: string;
  due_date: string;
  daysLeft: number;
}

interface OwnerPulseItem {
  owner: string;
  RON: number;
  EUR: number;
  totalRON: number;
  percentage: number;
}

interface DashboardViewProps {
  totalBalances: Record<string, number>;
  accounts: Account[];
  accountsMap: Map<number, Account>;
  transactions: Transaction[];
  chartData: any[];
  isChartReady: boolean;
  getRangeLabel: () => string;
  chartCurrencyFilter: 'all' | 'TOTAL' | 'RON' | 'EUR';
  setChartCurrencyFilter: (filter: 'all' | 'TOTAL' | 'RON' | 'EUR') => void;
  searchQuery: string;
  currencySnapshot: {
    totalEur: number;
    ronContribution: number;
    rate: number;
  } | null;
  dueSoonAccounts: DueAccount[];
  ownerPulse: OwnerPulseItem[];
  // Filters
  isRangeFilterOpen: boolean;
  setIsRangeFilterOpen: (open: boolean) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  filterByMonths: boolean;
  setFilterByMonths: (filter: boolean) => void;
  startMonth: string;
  setStartMonth: (m: string) => void;
  endMonth: string;
  setEndMonth: (m: string) => void;
  years: string[];
  filteredAvailableMonths: { value: string; label: string }[];
  handleYearSelect: (year: string) => void;
  isOwnerFilterOpen: boolean;
  setIsOwnerFilterOpen: (open: boolean) => void;
  selectedOwners: string[];
  setSelectedOwners: (owners: string[]) => void;
  toggleOwner: (owner: string) => void;
  owners: string[];
  selectedBank: string;
  setSelectedBank: (bank: string) => void;
  banks: string[];
  // Navigation
  onNavigateToAccounts: () => void;
  onNavigateToTransactions: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  totalBalances,
  accounts,
  accountsMap,
  transactions,
  chartData,
  isChartReady,
  getRangeLabel,
  chartCurrencyFilter,
  setChartCurrencyFilter,
  searchQuery,
  currencySnapshot,
  dueSoonAccounts,
  ownerPulse,
  isRangeFilterOpen,
  setIsRangeFilterOpen,
  selectedYear,
  setSelectedYear,
  filterByMonths,
  setFilterByMonths,
  startMonth,
  setStartMonth,
  endMonth,
  setEndMonth,
  years,
  filteredAvailableMonths,
  handleYearSelect,
  isOwnerFilterOpen,
  setIsOwnerFilterOpen,
  selectedOwners,
  setSelectedOwners,
  toggleOwner,
  owners,
  selectedBank,
  setSelectedBank,
  banks,
  onNavigateToAccounts,
  onNavigateToTransactions
}) => {
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time status of your global savings accounts.</p>
        </div>
        <div className="flex flex-col gap-3 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-start md:justify-end">
            <div className="flex items-center gap-2 relative">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Period:</span>
              <div className="relative">
                <button 
                  onClick={() => setIsRangeFilterOpen(!isRangeFilterOpen)}
                  className="flex items-center justify-between min-w-[140px] h-8 bg-white border border-gray-100 shadow-sm px-3 text-[11px] font-semibold rounded-md hover:bg-gray-50 transition-colors shrink-0 cursor-pointer"
                >
                  <span className="truncate max-w-[150px]">
                    {getRangeLabel()}
                  </span>
                  <ChevronDown size={12} className={`text-gray-400 transition-transform ${isRangeFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isRangeFilterOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsRangeFilterOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-1 w-[280px] bg-white border border-gray-100 rounded-lg shadow-lg z-50 p-4 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <span className="text-[11px] font-bold text-gray-700">Filter Period</span>
                        <button 
                          onClick={() => {
                            setSelectedYear('all');
                            setFilterByMonths(false);
                            setStartMonth('all');
                            setEndMonth('all');
                            setIsRangeFilterOpen(false);
                          }}
                          className="text-[9px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Reset All Time
                        </button>
                      </div>

                      {/* Year Selection */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Select Year</label>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleYearSelect('all')}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                              selectedYear === 'all'
                                ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                                : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            All Time
                          </button>
                          {years.map(yr => (
                            <button
                              key={yr}
                              type="button"
                              onClick={() => handleYearSelect(yr)}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                                selectedYear === yr
                                  ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                                  : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {yr}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Refine by month toggle */}
                      <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                        <input
                          type="checkbox"
                          id="filterByMonths"
                          checked={filterByMonths}
                          onChange={(e) => setFilterByMonths(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 border-gray-200 cursor-pointer w-3.5 h-3.5"
                        />
                        <label htmlFor="filterByMonths" className="text-[10px] font-bold text-gray-600 cursor-pointer select-none">
                          Refine by months {selectedYear !== 'all' ? `of ${selectedYear}` : ''}
                        </label>
                      </div>

                      {/* Month inputs */}
                      {filterByMonths && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">From Month</label>
                            <select 
                              value={startMonth} 
                              onChange={(e) => setStartMonth(e.target.value)}
                              className="w-full text-[11px] bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none font-semibold focus:ring-1 focus:ring-blue-500"
                            >
                              {selectedYear === 'all' && <option value="all">Earliest</option>}
                              {filteredAvailableMonths.map(m => (
                                <option key={`start-${m.value}`} value={m.value}>{m.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">To Month</label>
                            <select 
                              value={endMonth} 
                              onChange={(e) => setEndMonth(e.target.value)}
                              className="w-full text-[11px] bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none font-semibold focus:ring-1 focus:ring-blue-500"
                            >
                              {selectedYear === 'all' && <option value="all">Latest (Today)</option>}
                              {filteredAvailableMonths.map(m => (
                                <option key={`end-${m.value}`} value={m.value}>{m.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {filterByMonths && startMonth !== 'all' && endMonth !== 'all' && startMonth > endMonth && (
                        <p className="text-[9px] text-red-500 font-bold">
                          * Start month is after end month.
                        </p>
                      )}

                      <button 
                        onClick={() => setIsRangeFilterOpen(false)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-[10px] transition-colors shadow-sm cursor-pointer"
                      >
                        Apply Filter
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 relative">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Owner:</span>
              <div className="relative">
                <button 
                  onClick={() => setIsOwnerFilterOpen(!isOwnerFilterOpen)}
                  className="flex items-center justify-between w-[130px] h-8 bg-white border border-gray-100 shadow-sm px-3 text-[11px] font-medium rounded-md hover:bg-gray-50 transition-colors shrink-0 cursor-pointer"
                >
                  <span className="truncate max-w-[90px]">
                    {selectedOwners.length === 0 ? 'All Owners' : 
                     selectedOwners.length === 1 ? selectedOwners[0] : 
                     `${selectedOwners.length} Selected`}
                  </span>
                  <ChevronDown size={12} className={`text-gray-400 transition-transform ${isOwnerFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isOwnerFilterOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsOwnerFilterOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 w-[160px] bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
                      <button 
                        className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedOwners([]);
                          setIsOwnerFilterOpen(false);
                        }}
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          {selectedOwners.length === 0 && <Check size={12} className="text-blue-600" />}
                        </div>
                        <span className={selectedOwners.length === 0 ? 'font-bold text-blue-600' : ''}>All Owners</span>
                      </button>
                      
                      <div className="h-px bg-gray-100 my-1" />
                      
                      {owners.map(owner => (
                        <button 
                          key={owner}
                          className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-[11px] hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => toggleOwner(owner)}
                        >
                          <div className="w-4 h-4 flex items-center justify-center border border-gray-200 rounded-sm bg-gray-50">
                            {selectedOwners.includes(owner) && <Check size={12} className="text-blue-600" />}
                          </div>
                          <span className={selectedOwners.includes(owner) ? 'font-bold text-blue-600' : ''}>{owner}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Bank:</span>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger className="w-[120px] h-8 bg-white border-gray-100 shadow-sm text-[11px] font-medium rounded-md">
                  <SelectValue placeholder="All Banks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Banks</SelectItem>
                  {banks.map(bank => (
                    <SelectItem key={bank} value={bank} label={bank}>{bank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <SummaryCards totalBalances={totalBalances} accounts={accounts} />

      {/* Grid Split */}
      <div className="grid grid-cols-12 gap-6 pb-8">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <PortfolioChartCard
            chartData={chartData}
            isChartReady={isChartReady}
            getRangeLabel={getRangeLabel}
            chartCurrencyFilter={chartCurrencyFilter}
            setChartCurrencyFilter={setChartCurrencyFilter}
          />
          <RecentActivityCard
            transactions={transactions}
            accountsMap={accountsMap}
            searchQuery={searchQuery}
            onNavigateToActivity={onNavigateToTransactions}
          />
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <CurrencyBalancesCard
            currencySnapshot={currencySnapshot}
            totalBalances={totalBalances}
          />
          <MaturingDepositsCard
            dueSoonAccounts={dueSoonAccounts}
            onNavigateToAccounts={onNavigateToAccounts}
          />
          <OwnerPulseCard
            ownerPulse={ownerPulse}
          />
        </div>
      </div>
    </motion.div>
  );
};
