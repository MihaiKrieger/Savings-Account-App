import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeftRight, 
  RotateCw, 
  X, 
  Copy, 
  Check, 
  Coins, 
  TrendingUp, 
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Currency } from '@/src/types';
import { formatCurrency } from '@/src/utils/formatters';

interface FloatingCurrencyConverterProps {
  ronToEurRate: number | null;
  onRefreshRate: () => Promise<void>;
}

export const FloatingCurrencyConverter: React.FC<FloatingCurrencyConverterProps> = ({
  ronToEurRate,
  onRefreshRate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState<'RON_TO_EUR' | 'EUR_TO_RON'>('RON_TO_EUR');
  const [amount, setAmount] = useState<string>('100');
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Effective rate (EUR per 1 RON)
  const effectiveRate = ronToEurRate || 0.201;
  const eurToRonRate = 1 / effectiveRate;

  // Numeric parse
  const parsedAmount = parseFloat(amount.replace(/,/g, '')) || 0;

  // Converted value
  const convertedAmount = direction === 'RON_TO_EUR'
    ? parsedAmount * effectiveRate
    : parsedAmount * eurToRonRate;

  const sourceCurrency: Currency = direction === 'RON_TO_EUR' ? 'RON' : 'EUR';
  const targetCurrency: Currency = direction === 'RON_TO_EUR' ? 'EUR' : 'RON';

  const handleSwap = () => {
    // When swapping, take the current converted amount as the new input amount for intuitive workflow
    if (convertedAmount > 0) {
      setAmount(convertedAmount.toFixed(2));
    }
    setDirection(prev => prev === 'RON_TO_EUR' ? 'EUR_TO_RON' : 'RON_TO_EUR');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshRate();
      setLastRefreshed(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = `${convertedAmount.toFixed(2)} ${targetCurrency}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickPresets = [50, 100, 500, 1000];

  return (
    <aside 
      aria-label="Floating Currency Converter"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-30 select-none print:hidden"
    >
      <AnimatePresence mode="wait">
        {!isOpen ? (
          /* Collapsed Floating Trigger Pill */
          <motion.button
            key="converter-trigger"
            initial={{ scale: 0.85, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 10 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-lg hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group text-slate-800"
            title="Open Quick Currency Converter (RON ⇄ EUR)"
            aria-label="Open Currency Converter"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ArrowLeftRight size={15} />
            </div>
            
            <div className="text-left pr-1">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[11px] font-extrabold tracking-tight text-slate-900">RON ⇄ EUR</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live rate active" />
              </div>
              <p className="text-[10px] font-medium text-slate-500 mt-1">
                1 € ≈ <strong className="text-slate-800 font-semibold">{eurToRonRate.toFixed(4)} lei</strong>
              </p>
            </div>
          </motion.button>
        ) : (
          /* Expanded Floating Conversion Tool Panel */
          <motion.div
            key="converter-panel"
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-[330px] sm:w-[350px] bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 sm:p-5 text-slate-800 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80">
                  <Coins size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">Live Currency Converter</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-medium text-slate-500">Real-time rate</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Refresh latest exchange rate"
                  aria-label="Refresh rate"
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCw size={13} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Minimize tool panel"
                  aria-label="Close converter"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Current Rates Bar */}
            <div className="my-3 px-3 py-2 bg-slate-50/90 rounded-xl border border-slate-100 text-[11px] flex items-center justify-between">
              <div className="text-slate-600">
                <span>1 EUR = </span>
                <strong className="text-slate-900 font-bold">{eurToRonRate.toFixed(4)} RON</strong>
              </div>
              <div className="text-slate-400 text-[10px]">
                1 RON = {(effectiveRate).toFixed(4)} EUR
              </div>
            </div>

            {/* Source Input */}
            <div className="space-y-1 mb-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 px-0.5">
                <span>From</span>
                <span className="font-bold text-slate-700">{sourceCurrency === 'RON' ? 'Romanian Leu (RON)' : 'Euro (EUR)'}</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-3 pr-14 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  aria-label={`Amount in ${sourceCurrency}`}
                />
                <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">
                  {sourceCurrency}
                </span>
              </div>
            </div>

            {/* Direction Swap Button */}
            <div className="flex items-center justify-center my-1.5">
              <button
                type="button"
                onClick={handleSwap}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-[10px] font-bold rounded-full border border-slate-200/80 hover:border-blue-200 transition-all cursor-pointer group"
                title="Swap conversion direction"
                aria-label="Swap direction"
              >
                <ArrowUpDown size={11} className="group-hover:rotate-180 transition-transform duration-200" />
                <span>Swap ({sourceCurrency} ⇄ {targetCurrency})</span>
              </button>
            </div>

            {/* Target Converted Output */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 px-0.5">
                <span>Converted To</span>
                <span className="font-bold text-slate-700">{targetCurrency === 'RON' ? 'Romanian Leu (RON)' : 'Euro (EUR)'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl">
                <div className="min-w-0">
                  <div className="text-lg font-black text-blue-900 tracking-tight truncate">
                    {formatCurrency(convertedAmount, targetCurrency)}
                  </div>
                  <p className="text-[9px] text-blue-600/80 font-medium">
                    {parsedAmount > 0 
                      ? `${parsedAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${sourceCurrency} @ ${direction === 'RON_TO_EUR' ? effectiveRate.toFixed(4) : eurToRonRate.toFixed(4)}`
                      : 'Enter amount above'
                    }
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={parsedAmount <= 0}
                  className="p-1.5 rounded-lg bg-white border border-blue-200/80 text-blue-700 hover:bg-blue-100/50 shadow-2xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ml-2 shrink-0 flex items-center gap-1 text-[11px] font-semibold"
                  title="Copy result to clipboard"
                  aria-label="Copy result"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span className="text-[10px] text-emerald-600 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Amount Presets */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 shrink-0">Quick:</span>
              <div className="flex items-center gap-1 w-full">
                {quickPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset.toString())}
                    className={`flex-1 py-1 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer ${
                      amount === preset.toString()
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
