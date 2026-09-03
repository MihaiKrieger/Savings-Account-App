import React from 'react';
import { 
  Menu, 
  BarChart3, 
  CreditCard, 
  Plus 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (c: boolean | ((prev: boolean) => boolean)) => void;
  setIsMobileMenuOpen: (o: boolean) => void;
  onOpenAddAccount: () => void;
  onOpenAddTransaction: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  setIsMobileMenuOpen,
  onOpenAddAccount,
  onOpenAddTransaction
}) => {
  return (
    <header className="h-16 border-b border-[#E5E7EB] bg-white flex items-center justify-between px-3 sm:px-4 lg:px-8 flex-shrink-0 gap-2">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 -ml-1 sm:-ml-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          aria-label="Open sidebar menu"
        >
          <Menu size={20} />
        </button>
        <button 
          onClick={() => setIsSidebarCollapsed(prev => !prev)}
          className="hidden lg:flex p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors shrink-0"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu size={18} />
        </button>
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md min-w-0">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
            <BarChart3 className="w-4 h-4" />
          </span>
          <input 
            type="text" 
            className="block w-full pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2 border-none bg-gray-50 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none truncate" 
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {/* Data Management Stack */}
        <Button 
          className="h-9 px-3 sm:px-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 hover:border-blue-300 transition-all rounded-lg shadow-2xs font-semibold text-xs flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95"
          onClick={onOpenAddAccount}
          title="Add Account"
        >
          <CreditCard size={15} className="text-blue-600 shrink-0" />
          <span className="hidden sm:inline">Add Account</span>
          <span className="sm:hidden">Account</span>
        </Button>
        <Button 
          className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white transition-all rounded-lg shadow-sm font-semibold text-xs flex items-center gap-2 cursor-pointer active:scale-95"
          onClick={onOpenAddTransaction}
          title="New Transaction"
        >
          <Plus size={16} className="shrink-0" />
          <span className="hidden sm:inline">New Transaction</span>
          <span className="sm:hidden">Transaction</span>
        </Button>
      </div>
    </header>
  );
};
