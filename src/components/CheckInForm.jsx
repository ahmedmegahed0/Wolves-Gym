import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LogIn, 
  QrCode, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Zap,
  Grid,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { attendanceService, lockerService, customerService } from '../services/apiClient';
import { useToast } from '../context/ToastContext';

import LockerModal from './LockerModal';

export const CheckInForm = ({ onCheckInSuccess }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [code, setCode] = useState('');
  const [lockerId, setLockerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLockerModalOpen, setIsLockerModalOpen] = useState(false);

  // Active lockers for fast dropdown selection (Requirement 5)
  const [activeLockers, setActiveLockers] = useState([]);
  const [loadingLockers, setLoadingLockers] = useState(false);

  // Live member preview
  const [matchedCustomerPreview, setMatchedCustomerPreview] = useState(null);
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  // Debounced lookup for member preview by ID, code, phone, or name
  useEffect(() => {
    const trimmed = (code || '').trim();
    if (!trimmed || trimmed.length < 1) {
      setMatchedCustomerPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingCustomer(true);
      try {
        const isId = /^ID-\d+$/i.test(trimmed) || /^\d+$/.test(trimmed);
        if (isId) {
          const numId = parseInt(trimmed.replace(/^ID-/i, '').trim(), 10);
          try {
            const cust = await customerService.getCustomerById(numId);
            if (cust) {
              setMatchedCustomerPreview(cust);
              setSearchingCustomer(false);
              return;
            }
          } catch {}
        }

        // Fallback search across customers
        const q = trimmed.replace(/^ID-/i, '').trim();
        const res = await customerService.getCustomers({ search: q, pageSize: 5 });
        const list = Array.isArray(res?.items) ? res.items : [];
        const found = list.find(
          (c) =>
            String(c.code || '').toLowerCase() === trimmed.toLowerCase() ||
            String(c.id) === q ||
            String(c.customerId) === q ||
            (c.phoneNumber && c.phoneNumber.includes(q)) ||
            (c.name && c.name.toLowerCase().includes(q.toLowerCase()))
        );
        setMatchedCustomerPreview(found || null);
      } catch {
        setMatchedCustomerPreview(null);
      } finally {
        setSearchingCustomer(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [code]);

  const fetchActiveLockers = async () => {
    setLoadingLockers(true);
    try {
      const data = await lockerService.getLockers(true);
      setActiveLockers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to fetch active lockers for check-in:', e);
    } finally {
      setLoadingLockers(false);
    }
  };

  useEffect(() => {
    fetchActiveLockers();
  }, []);

  // Form validation
  const validate = () => {
    const errs = {};
    if (!code || !code.trim()) {
      errs.code = 'برجاء إدخال كود العضو أو مسح الباركود';
    } else if (code.trim().length < 2) {
      errs.code = 'الكود لازم يكون حرفين على الأقل';
    }

    if (lockerId === '' || lockerId === null || lockerId === undefined) {
      errs.lockerId = 'برجاء تحديد رقم لوكر للعضو';
    } else if (isNaN(Number(lockerId)) || Number(lockerId) <= 0) {
      errs.lockerId = 'رقم اللوكر لازم يكون رقم صحيح وموجب';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Find selected locker object by ID first, then fallback to match by number
      const selectedLockerObj = activeLockers.find(
        (l) => String(l.id) === String(lockerId)
      ) || activeLockers.find(
        (l) => String(l.number) === String(lockerId) || String(l.lockerNumber) === String(lockerId)
      );
      
      const targetLockerId = selectedLockerObj ? Number(selectedLockerObj.id) : Number(lockerId);
      const displayLockerNumber = selectedLockerObj ? (selectedLockerObj.number || selectedLockerObj.lockerNumber || targetLockerId) : targetLockerId;

      // 1. Resolve actual member by ID, code, phone, or preview
      let finalCode = code.trim();
      let matchedCustomer = matchedCustomerPreview;

      if (!matchedCustomer) {
        const isIdPattern = /^ID-\d+$/i.test(finalCode);
        const isNumeric = /^\d+$/.test(finalCode);

        if (isIdPattern || isNumeric) {
          const numericId = parseInt(finalCode.replace(/^ID-/i, '').trim(), 10);
          try {
            matchedCustomer = await customerService.getCustomerById(numericId);
          } catch (idErr) {
            console.warn(`Direct customer lookup by ID ${numericId} failed:`, idErr);
          }
        }

        if (!matchedCustomer) {
          try {
            const searchClean = finalCode.replace(/^ID-/i, '').trim();
            const custRes = await customerService.getCustomers({ search: searchClean, pageSize: 10 });
            const list = Array.isArray(custRes?.items) ? custRes.items : [];
            matchedCustomer = list.find(
              (c) =>
                String(c.code || '').toLowerCase() === finalCode.toLowerCase() ||
                String(c.id) === searchClean ||
                String(c.customerId) === searchClean ||
                (c.phoneNumber && c.phoneNumber.includes(searchClean)) ||
                (c.name && c.name.toLowerCase().includes(searchClean.toLowerCase()))
            );
          } catch (searchErr) {
            console.warn('Customer resolution fallback:', searchErr);
          }
        }
      }

      // 2. Validate member status & match exact code
      if (matchedCustomer) {
        if (matchedCustomer.approvalStatus === 0 || matchedCustomer.approvalStatus === 'Pending') {
          toastError(
            'العضو معلق وغير معتمد',
            `الكابتن (${matchedCustomer.name || 'العضو'}) في انتظار الموافقة (Pending Approval). يرجى اعتماده أولاً من قائمة الأعضاء لتسجيل دخوله.`
          );
          setLoading(false);
          return;
        }

        if (matchedCustomer.isActive === false) {
          toastError(
            'حساب العضو غير نشط',
            `حساب الكابتن (${matchedCustomer.name || 'العضو'}) موقوف أو غير نشط في النظام.`
          );
          setLoading(false);
          return;
        }

        // Use registered code if exists, otherwise sync code: `ID-${id}` to DB so checkIn recognizes it
        if (matchedCustomer.code && String(matchedCustomer.code).trim()) {
          finalCode = String(matchedCustomer.code).trim();
        } else {
          const generatedCode = `ID-${matchedCustomer.id}`;
          try {
            console.log(`Customer #${matchedCustomer.id} has no code in DB. Assigning code: ${generatedCode}`);
            await customerService.updateCustomer(matchedCustomer.id, {
              ...matchedCustomer,
              code: generatedCode,
            });
            finalCode = generatedCode;
          } catch (assignErr) {
            console.warn('Failed to assign code to customer in DB:', assignErr);
            finalCode = generatedCode;
          }
        }
      }

      // CheckIn payload strictly matching Swagger CheckInRequest schema
      const payload = {
        code: finalCode,
        lockerId: Number(targetLockerId),
      };

      console.log('Check-in Payload:', payload);

      const response = await attendanceService.checkIn(payload);

      // Trigger Confetti in gold/amber tones
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#F59E0B', '#FBBF24', '#FDE68A', '#D97706', '#FFFFFF']
      });

      setIsSuccess(true);
      toastSuccess(
        'تم تسجيل الدخول بنجاح.. عاش يا وحش!',
        `تم تسليم اللوكر رقم #${displayLockerNumber} للكابتن (${(matchedCustomer?.name || finalCode).toUpperCase()}). تمرين موفق!`
      );

      if (onCheckInSuccess) {
        onCheckInSuccess({
          code: finalCode.toUpperCase(),
          memberName: matchedCustomer?.name,
          lockerId: Number(targetLockerId),
          lockerNumber: displayLockerNumber,
          timestamp: new Date().toISOString(),
          type: 'check-in',
        });
      }

      // Reset form and refresh available lockers list after success
      setTimeout(() => {
        setCode('');
        setLockerId('');
        setMatchedCustomerPreview(null);
        setIsSuccess(false);
        fetchActiveLockers();
      }, 2000);
    } catch (err) {
      console.error('Check-in error:', err);
      if (err.response) {
        console.error('Check-in 404/API Response Data:', err.response.data);
        console.error('Status code:', err.response.status);
      }

      const serverData = err.response?.data;
      const rawError = Array.isArray(serverData?.errors) 
        ? serverData.errors[0] 
        : serverData?.errors;
      const extractedErrorMsg = typeof rawError === 'string'
        ? rawError
        : typeof rawError === 'object' && rawError !== null
        ? (rawError.description || rawError.message || Object.values(rawError)[0])
        : null;

      let serverMsg = 
        extractedErrorMsg ||
        serverData?.message || 
        serverData?.detail || 
        (typeof serverData === 'string' ? serverData : null) ||
        (serverData?.title && serverData.title !== 'Not Found' ? serverData.title : null) ||
        err.friendlyMessage || 
        err.message || 
        'تأكد من كود العضو وتوفر اللوكر، أو تحقق من صلاحية الدخول.';

      if (err.response?.status === 404) {
        console.warn('Check-in 404 Not Found Analysis:', {
          isLockerMissing: typeof serverData === 'string' && serverData.includes('اللوكر'),
          isMemberMissing: typeof serverData === 'string' && (serverData.includes('العضو') || serverData.includes('العميل')),
          extractedErrorMsg,
          serverData,
        });
      }

      toastError('فشل تسجيل الدخول', serverMsg);
    } finally {
      setLoading(false);
    }

  };

  return (
    <>
      <div className="wolf-glass rounded-3xl p-4 sm:p-6 lg:p-7 relative overflow-hidden border border-amber-500/20 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.85)] flex flex-col justify-between">
        {/* Subtle Gold Accent Line */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 opacity-90" />

        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-amber-400">
                <LogIn className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  تسجيل الدخول
                  <span className="text-[9px] font-mono uppercase bg-white/5 text-zinc-400 border border-white/10 px-1.5 py-0.5 rounded font-semibold">
                    CHECK-IN
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  مسح الباركود وتسليم اللوكر
                </p>
              </div>
            </div>
            
            {/* Quick reset */}
            {(code || lockerId) && (
              <button
                type="button"
                onClick={() => {
                  setCode('');
                  setLockerId('');
                  setErrors({});
                }}
                className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                title="تفريغ الحقول"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* 1. Member Code Field (AutoFocus for barcode scanners) */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                كود العضو:
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
                  <QrCode className="w-4 h-4 text-amber-500/70" />
                </div>
                <input
                  type="text"
                  autoFocus
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (errors.code) setErrors((prev) => ({ ...prev, code: null }));
                  }}
                  placeholder="امسح الباركود أو أدخل الكود (مثال: ID-2)..."
                  className={`w-full bg-[#0e0e11] text-white placeholder-zinc-500 text-xs sm:text-sm rounded-xl pr-9 pl-3.5 py-2.5 border font-mono transition-colors focus:outline-none ${
                    errors.code
                      ? 'border-rose-500/80 focus:border-rose-400'
                      : 'border-white/10 focus:border-amber-500/50 focus:bg-black/80'
                  }`}
                  disabled={loading}
                />
              </div>

              {/* Live Member Preview Card */}
              {searchingCustomer && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                  <span>جاري البحث عن العضو...</span>
                </div>
              )}

              {matchedCustomerPreview && !searchingCustomer && (
                <div className="mt-2 p-2 sm:p-2.5 rounded-xl bg-zinc-900/90 border border-amber-500/30 flex items-center justify-between text-xs transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      matchedCustomerPreview.approvalStatus === 1 && matchedCustomerPreview.isActive !== false
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-amber-400'
                    }`} />
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{matchedCustomerPreview.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          ({matchedCustomerPreview.code || `ID-${matchedCustomerPreview.id}`})
                        </span>
                      </div>
                      {matchedCustomerPreview.phoneNumber && (
                        <div className="text-[10px] text-zinc-400 font-mono" dir="ltr">
                          {matchedCustomerPreview.phoneNumber}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                    matchedCustomerPreview.approvalStatus === 1 && matchedCustomerPreview.isActive !== false
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : matchedCustomerPreview.approvalStatus === 0
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {matchedCustomerPreview.approvalStatus === 1 && matchedCustomerPreview.isActive !== false
                      ? 'معتمد ✓'
                      : matchedCustomerPreview.approvalStatus === 0
                      ? 'معلق (Pending)'
                      : 'غير نشط'}
                  </span>
                </div>
              )}

              {errors.code && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.code}
                </p>
              )}
            </div>

            {/* 2. Smart Locker Selection (Only Available Lockers) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-300">
                  اللوكر المتاح:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLockerModalOpen(true)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                    title="فتح مخطط اللوكرات التفاعلي"
                  >
                    <Grid className="w-3 h-3" />
                    <span>مخطط اللوكرات</span>
                  </button>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {loadingLockers ? 'جاري الفحص...' : `${activeLockers.filter(l => l.isAvailable).length} متاح`}
                  </span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
                  <KeyRound className="w-4 h-4 text-amber-500/70" />
                </div>
                <select
                  value={lockerId}
                  onChange={(e) => {
                    setLockerId(e.target.value);
                    if (errors.lockerId) setErrors((prev) => ({ ...prev, lockerId: null }));
                  }}
                  disabled={loading || loadingLockers}
                  className={`w-full bg-[#0e0e11] text-zinc-200 text-xs sm:text-sm rounded-xl pr-9 pl-3 py-2.5 border font-mono transition-colors focus:outline-none cursor-pointer ${
                    errors.lockerId
                      ? 'border-rose-500/80 focus:border-rose-400'
                      : 'border-white/10 focus:border-amber-500/50'
                  }`}
                >
                  <option value="">-- اختر لوكر متاح --</option>
                  {activeLockers
                    .filter((locker) => locker.isAvailable)
                    .map((locker) => (
                      <option key={locker.id} value={locker.id} className="bg-[#121216] text-white">
                        لوكر #{locker.number || locker.lockerNumber} (متاح)
                      </option>
                    ))}

                  {activeLockers.filter((l) => l.isAvailable).length === 0 && !loadingLockers && (
                    <option value="" disabled className="bg-[#121216] text-zinc-500">
                      لا توجد لوكرات متاحة حالياً
                    </option>
                  )}
                </select>
              </div>

              {errors.lockerId && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.lockerId}
                </p>
              )}
            </div>

            {/* Action CTA Button */}
            <div className="pt-1.5">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isSuccess
                    ? 'bg-emerald-500 text-black'
                    : 'bg-gradient-to-r from-amber-600/90 to-yellow-600/90 hover:from-amber-500 hover:to-yellow-500 text-black font-semibold'
                } disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>جاري التأكيد...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>تم الدخول بنجاح</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-black" />
                    <span>تسجيل دخول وتسليم لوكر</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>


      </div>

      {/* Visual Locker Selection Modal */}
      <LockerModal
        isOpen={isLockerModalOpen}
        onClose={() => setIsLockerModalOpen(false)}
        selectedLockerId={Number(lockerId)}
        initialLockers={activeLockers}
        onSelectLocker={(id) => {
          setLockerId(id);
          if (errors.lockerId) setErrors((prev) => ({ ...prev, lockerId: null }));
        }}
      />
    </>
  );
};

export default CheckInForm;
