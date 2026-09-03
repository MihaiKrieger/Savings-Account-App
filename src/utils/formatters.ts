export const formatDate = (dateStr: string, format: 'short' | 'long' = 'short') => {
  const d = new Date(dateStr);
  if (format === 'long') {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return d.toLocaleDateString('en-GB'); // dd/mm/yyyy
};

export const getDueDateTheme = (dateStr: string) => {
  const dueDate = new Date(dateStr);
  const now = new Date();
  
  // Difference in months
  const diffTime = dueDate.getTime() - now.getTime();
  const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);
  
  const isPast = diffTime < 0;
  const animation = isPast ? "animate-elegant-pulse" : "";
  
  // 1 month or less (including overdue)
  if (diffMonths <= 1) return `bg-red-50 text-red-600 border-red-100/50 ${animation}`;
  // 2 months or less
  if (diffMonths <= 2) return `bg-amber-50 text-amber-600 border-amber-100/50 ${animation}`;
  // Later than 2 full months
  return `bg-blue-50 text-blue-600 border-blue-100/50 ${animation}`;
};

export const formatCurrency = (amount: number, currency: string) => {
  // Normalize small values and handle negative zero to avoid "-0.00" display
  const normalized = Math.abs(amount) < 0.001 ? 0 : amount;
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency }).format(normalized);
};
