import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Phone, 
  QrCode, 
  Scale, 
  Ruler, 
  Flame, 
  HeartPulse, 
  Activity, 
  RefreshCw, 
  ShieldCheck, 
  Crown,
  FileText
} from 'lucide-react';
import { customerService } from '../../services/apiClient';
import ApprovalBadge from './ApprovalBadge';

export const CustomerProfileCard = ({ onRefresh }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomerMe();
      setProfile(data);
    } catch (err) {
      console.error('Fetch customer me error:', err);
      setError('تعذر تحميل بيانات العضو الشخصية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="wolf-glass rounded-3xl p-5 border border-amber-500/20 animate-pulse space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-zinc-800 rounded" />
            <div className="h-3 w-24 bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="wolf-glass rounded-3xl p-4 sm:p-5 border border-zinc-800 flex items-center justify-between text-xs">
        <span className="text-zinc-400">{error || 'مفيش بيانات للعضو حالياً'}</span>
        <button
          onClick={fetchProfile}
          className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>إعادة المحاولة</span>
        </button>
      </div>
    );
  }

  // Calculate BMI
  const heightMeters = Number(profile.height) / 100;
  const bmi =
    heightMeters > 0 && Number(profile.weight) > 0
      ? (Number(profile.weight) / (heightMeters * heightMeters)).toFixed(1)
      : null;

  return (
    <div className="wolf-glass rounded-3xl p-5 sm:p-6 border border-amber-500/25 shadow-gold-glow relative overflow-hidden group">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700" />
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/30 to-yellow-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xl font-mono shadow-gold-glow">
              {profile.name ? profile.name.slice(0, 1).toUpperCase() : 'W'}
            </div>
            <div className="absolute -bottom-1 -left-1 p-1 rounded-lg bg-black border border-amber-500/30 text-amber-400">
              <Crown className="w-3 h-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                {profile.name || 'وحش الذئاب'}
              </h3>
              <ApprovalBadge status={profile.approvalStatus} size="sm" />
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 font-mono">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <QrCode className="w-3.5 h-3.5" />
                {profile.code || 'بدون كود'}
              </span>
              <span className="text-zinc-600">|</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-zinc-500" />
                {profile.phoneNumber || 'لا يوجد هاتف'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={fetchProfile}
          title="تحديث البيانات"
          className="self-end sm:self-auto p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors border border-zinc-800"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 text-center">
        {/* Weight */}
        <div className="bg-black/60 rounded-2xl p-2.5 border border-zinc-800/80">
          <div className="text-[10px] text-zinc-500 font-bold flex items-center justify-center gap-1">
            <Scale className="w-3 h-3 text-amber-400" />
            الوزن
          </div>
          <div className="text-base font-black text-white font-mono mt-0.5">
            {profile.weight ? `${profile.weight} kg` : '--'}
          </div>
        </div>

        {/* Height */}
        <div className="bg-black/60 rounded-2xl p-2.5 border border-zinc-800/80">
          <div className="text-[10px] text-zinc-500 font-bold flex items-center justify-center gap-1">
            <Ruler className="w-3 h-3 text-yellow-400" />
            الطول
          </div>
          <div className="text-base font-black text-white font-mono mt-0.5">
            {profile.height ? `${profile.height} cm` : '--'}
          </div>
        </div>

        {/* Muscle */}
        <div className="bg-black/60 rounded-2xl p-2.5 border border-zinc-800/80">
          <div className="text-[10px] text-zinc-500 font-bold flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" />
            العضلات
          </div>
          <div className="text-base font-black text-amber-400 font-mono mt-0.5">
            {profile.musclePercentage ? `${profile.musclePercentage}%` : '--'}
          </div>
        </div>

        {/* BMI */}
        <div className="bg-black/60 rounded-2xl p-2.5 border border-zinc-800/80">
          <div className="text-[10px] text-zinc-500 font-bold flex items-center justify-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" />
            BMI
          </div>
          <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
            {bmi || '--'}
          </div>
        </div>
      </div>

      {/* Health Conditions / Notes notice */}
      {(profile.injuries || profile.chronicDiseases || profile.notes) && (
        <div className="mt-3.5 pt-3 border-t border-zinc-800/70 text-xs space-y-1.5">
          {profile.injuries && (
            <div className="flex items-center gap-2 text-rose-300 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
              <span className="font-bold">الإصابات:</span>
              <span>{profile.injuries}</span>
            </div>
          )}
          {profile.chronicDiseases && (
            <div className="flex items-center gap-2 text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              <span className="font-bold">الأمراض المزمنة:</span>
              <span>{profile.chronicDiseases}</span>
            </div>
          )}
          {profile.notes && (
            <div className="flex items-center gap-2 text-zinc-300 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>{profile.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerProfileCard;
