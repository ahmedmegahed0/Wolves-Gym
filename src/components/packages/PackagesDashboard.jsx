import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
  Grid, 
  Table, 
  Sparkles, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users
} from 'lucide-react';
import PackagesPricingGrid from './PackagesPricingGrid';
import PackagesAdminManagement from './PackagesAdminManagement';
import { useAuth } from '../../context/AuthContext';
import { getRoleMeta } from '../../services/apiClient';
import wolfLogo from '../../assets/logo.png';

import CreateSubscriptionModal from '../subscriptions/CreateSubscriptionModal';

/**
 * PackagesDashboard Component
 * Central Hub for Gym Membership Packages & Plans
 * Seamlessly toggles between the Customer Pricing Cards Grid and Admin Data Table.
 */
export const PackagesDashboard = ({ isEmbedded = false, initialView = 'grid', onOpenNewSubscription = null }) => {
  const { user } = useAuth();
  const roleMeta = getRoleMeta(user?.role);

  const canManage = ['SuperAdmin', 'Manager', 'Receptionist', 'Reception'].includes(roleMeta.role);

  // Standalone subscription modal state
  const [standaloneSubModalOpen, setStandaloneSubModalOpen] = useState(false);
  const handleOpenSub = onOpenNewSubscription || (() => setStandaloneSubModalOpen(true));

  // Default view
  const [activeView, setActiveView] = useState(() => {
    if (initialView === 'management' && canManage) return 'management';
    return 'grid';
  });

  return (
    <div dir="rtl" className="w-full text-zinc-100 font-cairo">
      {/* Top Section Header & View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-black border border-amber-500/50 shadow-gold-glow overflow-hidden p-1.5">
              <img
                src={wolfLogo}
                alt="BE THE WOLF"
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                باقات واشتراكات كتيبة الذئاب
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                BE THE WOLF
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {activeView === 'grid'
                ? 'استعراض كروت التسعير الرياضية وتفاصيل اشتراكات الأعضاء'
                : 'لوحة التحكم الإدارية لتعديل وإضافة خطط التدريب والأسعار'}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs (Only if user has management permissions) */}
        {canManage && (
          <div className="flex items-center gap-1.5 bg-zinc-950/90 border border-amber-500/20 rounded-2xl p-1.5 shadow-md self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveView('grid')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeView === 'grid'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>كروت المشتركين</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('management')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeView === 'management'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>جدول إدارة الباقات</span>
            </button>
          </div>
        )}
      </div>

      {/* Main View Area */}
      <AnimatePresence mode="wait">
        {activeView === 'grid' ? (
          <motion.div
            key="grid-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <PackagesPricingGrid
              isEmbedded={true}
              onOpenAdminManagement={canManage ? () => setActiveView('management') : null}
            />
          </motion.div>
        ) : (
          <motion.div
            key="management-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <PackagesAdminManagement
              isEmbedded={true}
              onBackToPublicGrid={() => setActiveView('grid')}
              onOpenNewSubscription={handleOpenSub}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Standalone CreateSubscriptionModal if rendered outside AttendanceDashboard */}
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
