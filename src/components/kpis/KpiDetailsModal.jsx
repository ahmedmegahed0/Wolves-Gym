import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  X, 
  Edit3, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Loader2, 
  AlertCircle,
  Hash
} from 'lucide-react';
import { kpisService, extractKpiErrorMessage } from '../../services/kpisService';

/**
 * KpiDetailsModal Component
 * Fetches and displays detailed KPI information via GET /api/Kpis/{id}
 */
export const KpiDetailsModal = ({ isOpen, onClose, kpiId, onEdit }) => {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && kpiId) {
      setLoading(true);
      setError('');
      kpisService
        .getKpiById(kpiId)
        .then((data) => {
          setKpi(data);
        })
        .catch((err) => {
          console.error('Failed to load KPI details:', err);
          setError(extractKpiErrorMessage(err, 'تعذر تحميل تفاصيل مؤشر الأداء.'));
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setKpi(null);
    }
  }, [isOpen, kpiId]);

  if (!isOpen) return null;

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto font-cairo"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg mx-auto bg-gradient-to-b from-[#141419] via-[#0f0f13] to-black rounded-3xl border border-amber-500/30 p-5 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.2)] my-auto max-h-[90vh] overflow-y-auto gold-scrollbar"
        >
          {/* Top Line Accent */}
          <div className="absolute top-0 right-10 left-10 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-amber-500/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm shadow-gold-glow">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">تفاصيل مؤشر الأداء</h3>
                <p className="text-xs text-zinc-400">معايير القياس وسجل التحديثات</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-xs text-zinc-400">جاري جلب تفاصيل المؤشر من الخادم...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          ) : kpi ? (
            <div className="space-y-4">
              {/* ID & Status Pill */}
              <div className="flex items-center justify-between bg-zinc-950/80 rounded-2xl p-3 border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-zinc-400 font-bold">معرّف المؤشر:</span>
                  <span className="text-xs font-mono font-bold text-white bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
                    #{kpi.id}
                  </span>
                </div>

                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  kpi.isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}>
                  {kpi.isActive ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>مفعل ومعتمد</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>معطل مؤقتاً</span>
                    </>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span>اسم المؤشر</span>
                </div>
                <h4 className="text-base font-black text-white">{kpi.name}</h4>
              </div>

              {/* Description */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>وصف المؤشر ومعايير القياس</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {kpi.description || 'لا يوجد وصف مدون لهذا المؤشر.'}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/70">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-1">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    <span>تاريخ الاعتماد:</span>
                  </div>
                  <div className="text-xs text-zinc-200 font-mono">
                    {formatDate(kpi.createdAt)}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/70">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>آخر تعديل:</span>
                  </div>
                  <div className="text-xs text-zinc-200 font-mono">
                    {formatDate(kpi.updatedAt || kpi.createdAt)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                >
                  إغلاق
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onEdit) onEdit(kpi);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 flex items-center gap-2 transition-all cursor-pointer shadow-gold-glow"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل هذا المؤشر</span>
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default KpiDetailsModal;
