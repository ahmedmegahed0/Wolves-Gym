import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Users,
  Home
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
export const PackagesDashboard = ({ isEmbedded = false, onOpenNewSubscription = null }) => {
  // Standalone subscription modal state
  const [standaloneSubModalOpen, setStandaloneSubModalOpen] = useState(false);
  const handleOpenSub = onOpenNewSubscription || (() => setStandaloneSubModalOpen(true));

  return (
    <div dir="rtl" className="w-full text-zinc-100 font-cairo">
      {/* Unified Management Table Only */}
      <PackagesAdminManagement
        isEmbedded={isEmbedded}
        onOpenNewSubscription={handleOpenSub}
      />

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
