import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PiggyBank, 
  LayoutDashboard, 
  CreditCard, 
  History, 
  Users, 
  Building2, 
  X 
} from 'lucide-react';

export function NavItem({ 
  active, 
  onClick, 
  icon, 
  label, 
  collapsed 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
  collapsed?: boolean; 
}) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
        active 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-gray-600 hover:bg-gray-50'
      } ${collapsed ? 'justify-center px-0 h-10' : ''}`}
      title={collapsed ? label : undefined}
    >
      <span className={`${active ? 'text-blue-700' : 'text-gray-400'} shrink-0`}>{icon}</span>
      <AnimatePresence>
        {!collapsed && (
          <motion.span 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="truncate overflow-hidden"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onOpenManageOwners: () => void;
  onOpenManageBanks: () => void;
  appVersion: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onOpenManageOwners,
  onOpenManageBanks,
  appVersion
}) => {
  return (
    <>
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 transition-[width,transform] duration-300 ease-in-out border-r border-[#E5E7EB] bg-white flex flex-col flex-shrink-0 will-change-[width]
        ${isSidebarCollapsed ? 'lg:w-[80px]' : 'lg:w-[240px]'}
        ${isMobileMenuOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className={`p-6 mb-4 flex items-center ${isSidebarCollapsed ? 'justify-center px-4' : 'justify-between'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <PiggyBank className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.span 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-bold tracking-tight text-lg italic whitespace-nowrap overflow-hidden"
                >
                  Econosmishu
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={`flex-1 space-y-1 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard"
            collapsed={isSidebarCollapsed}
          />
          <NavItem 
            active={activeTab === 'accounts'} 
            onClick={() => { setActiveTab('accounts'); setIsMobileMenuOpen(false); }} 
            icon={<CreditCard size={20} />} 
            label="Accounts"
            collapsed={isSidebarCollapsed}
          />
          <NavItem 
            active={activeTab === 'transactions'} 
            onClick={() => { setActiveTab('transactions'); setIsMobileMenuOpen(false); }} 
            icon={<History size={20} />} 
            label="Activity"
            collapsed={isSidebarCollapsed}
          />

          <div className="pt-3 mt-3 border-t border-gray-100 space-y-1">
            {!isSidebarCollapsed && (
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1">
                Settings
              </div>
            )}
            <NavItem 
              active={false} 
              onClick={() => { onOpenManageOwners(); setIsMobileMenuOpen(false); }} 
              icon={<Users size={20} />} 
              label="Manage Owners"
              collapsed={isSidebarCollapsed}
            />
            <NavItem 
              active={false} 
              onClick={() => { onOpenManageBanks(); setIsMobileMenuOpen(false); }} 
              icon={<Building2 size={20} />} 
              label="Manage Banks"
              collapsed={isSidebarCollapsed}
            />
          </div>
        </nav>

        <div className={`mt-auto p-6 border-t border-gray-50 flex items-center ${isSidebarCollapsed ? 'justify-center px-4' : 'gap-2'}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0"></div>
          {!isSidebarCollapsed && (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">v{appVersion}</span>
          )}
        </div>
      </aside>
    </>
  );
};
