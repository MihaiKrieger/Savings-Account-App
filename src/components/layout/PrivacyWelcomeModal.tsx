import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrivacyWelcomeModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  appVersion: string;
}

export const PrivacyWelcomeModal: React.FC<PrivacyWelcomeModalProps> = ({
  isOpen,
  onDismiss,
  appVersion
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", damping: 20 }}
            className="max-w-md w-full space-y-8"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100">
                <PiggyBank className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-black italic tracking-tighter text-gray-900">Econosmishu</h1>
                <p className="text-gray-500 font-medium">Family Finance Dashboard</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 italic text-sm text-gray-600">
              "Money talks, but mine mostly just says 'Goodbye' as it leaves for the grocery store."
            </div>

            <Button 
              onClick={onDismiss}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Proceed to App
            </Button>

            <div className="pt-8 text-gray-300">
              <div className="flex items-center justify-center gap-2 mb-1">
                 <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse"></div>
                 <p className="text-[10px] font-bold uppercase tracking-widest">Secure Privacy Shield Enabled</p>
              </div>
              <p className="text-[9px] font-medium opacity-50">Local data access only • v{appVersion}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
