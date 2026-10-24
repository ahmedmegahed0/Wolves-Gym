import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
  Layers, 
  DollarSign, 
  FileText, 
  Wallet,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users
} from 'lucide-react';
import PackagesPricingGrid from './PackagesPricingGrid';
import PackagesAdminManagement from './PackagesAdminManagement';
import SubscriptionsManagementTable from '../subscriptions/SubscriptionsManagementTable';
import FinancialSummaryWidget from '../subscriptions/FinancialSummaryWidget';
import CreateSubscriptionModal from '../subscriptions/CreateSubscriptionModal';
import { useAuth } from '../../context/AuthContext';
import { getRoleMeta } from '../../services/apiClient';

/**
 * PackagesDashboard Component
 * Central Hub for Gym Membership Packages, Subscriptions Lifecycle & Financial Summary.
 */
export const PackagesDashboard = ({ 
  isEmbedded = false, 
  onOpenNewSubscription = null,
  initialTab = 'subscriptions'
}) => {
  const { user } = useAuth();
  const roleMeta = getRoleMeta(user?.role);
  const isCustomer = roleMeta.role === 'Customer';
  const canAccessFinancial = ['OperationManager', 'Manager', 'SuperAdmin'].includes(roleMeta.role);

  // Active sub-tab: 'subscriptions' | 'financial' | 'packages'
  const [activeTab, setActiveTab] = useState(() => {
    if (isCustomer) return 'packages';
    return initialTab;
  });

  // Standalone subscription modal state
  const [standaloneSubModalOpen, setStandaloneSubModalOpen] = useState(false);
  const handleOpenSub = onOpenNewSubscription || (() => setStandaloneSubModalOpen(true));

  return (
    <div dir="rtl" className="w-full text-zinc-100 font-cairo space-y-6">
      {/* Top Segmented Navigation Tabs (for non-customer staff) */}
      {!isCustomer && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-2.5 rounded-3xl bg-[#141417] border border-white/10 shadow-xl">
          <div className="flex items-center gap-2">
            {/* Subscriptions Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('subscriptions')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'subscriptions'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>إدارة الاشتراكات</span>
            </button>

            {/* Financial Summary Tab (OperationManager / Manager / SuperAdmin) */}
            {canAccessFinancial && (
              <button
                type="button"
                onClick={() => setActiveTab('financial')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'financial'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>الخزينة والملخص المالي</span>
              </button>
            )}

            {/* Packages Management Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('packages')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'packages'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>كتالوج الباقات والعروض</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Views */}
      <AnimatePresence mode="wait">
        {activeTab === 'subscriptions' && !isCustomer && (
          <motion.div
            key="tab-subscriptions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <SubscriptionsManagementTable
              isEmbedded={isEmbedded}
              onOpenNewSubscription={handleOpenSub}
            />
          </motion.div>
        )}

        {activeTab === 'financial' && canAccessFinancial && (
          <motion.div
            key="tab-financial"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <FinancialSummaryWidget />
          </motion.div>
        )}

        {(activeTab === 'packages' || isCustomer) && (
          <motion.div
            key="tab-packages"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {isCustomer ? (
              <PackagesPricingGrid onOpenNewSubscription={handleOpenSub} />
            ) : (
              <PackagesAdminManagement
                isEmbedded={isEmbedded}
                onOpenNewSubscription={handleOpenSub}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Standalone CreateSubscriptionModal if triggered outside AttendanceDashboard */}
      {!onOpenNewSubscription && (
        <CreateSubscriptionModal
          isOpen={standaloneSubModalOpen}
          onClose={() => setStandaloneSubModalOpen(false)}
        />
      )}
    </div>
  );
};

export default PackagesDashboard;
