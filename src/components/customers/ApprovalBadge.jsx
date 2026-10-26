import React from 'react';
import { Clock, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

export const ApprovalBadge = ({ status, size = 'md' }) => {
  const numericStatus = Number(status);

  // Status mapping
  if (numericStatus === 1) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold font-cairo bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
        }`}
      >
        <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>نشط ومقبول</span>
      </span>
    );
  }

  if (numericStatus === 2) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold font-cairo bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)] ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
        }`}
      >
        <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>مرفوض</span>
      </span>
    );
  }

  // Default: Pending (0)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold font-cairo bg-amber-500/15 text-amber-400 border border-amber-500/35 shadow-[0_0_15px_rgba(245,158,11,0.2)] ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      }`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </span>
      <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>طلب عضوية غير مفعل</span>
    </span>
  );
};

export default ApprovalBadge;
