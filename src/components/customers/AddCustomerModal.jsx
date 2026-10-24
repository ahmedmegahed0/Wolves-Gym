import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  QrCode, 
  Sparkles, 
  Dumbbell, 
  Ruler, 
  Scale, 
  Calendar, 
  Activity, 
  HeartPulse, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Flame
} from 'lucide-react';
import { createCustomerDirectly } from '../../services/customersService';
import { usersService } from '../../services/usersService';
import { useToast } from '../../context/ToastContext';

const INITIAL_FORM_DATA = {
  // Tab 1: Basic & Account
  name: '',
  email: '',
  phoneNumber: '',
  code: '',
  password: '',
  confirmPassword: '',
  isActive: true,

  // Tab 2: Physical & Health
  height: '',
  weight: '',
  age: '',
  musclePercentage: '',
  fatPercentage: '',
  injuries: '',
  chronicDiseases: '',
  notes: ''
};

export const AddCustomerModal = ({ isOpen, onClose, onCustomerAdded }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'physical'
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Real-time Email Availability Check state
  const [emailStatus, setEmailStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  const [emailStatusMsg, setEmailStatusMsg] = useState('');
  const emailCheckAbortRef = useRef(null);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // Auto-generate initial membership code on open
      const randomCode = `WOLF-${Math.floor(100 + Math.random() * 900)}`;
      setFormData({
        ...INITIAL_FORM_DATA,
        code: randomCode
      });
      setActiveTab('account');
      setErrors({});
      setEmailStatus('idle');
      setEmailStatusMsg('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    } else {
      if (emailCheckAbortRef.current) {
        emailCheckAbortRef.current.abort();
      }
    }
  }, [isOpen]);

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalVal = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: finalVal
    }));

    // Clear field-specific error
    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }

    // Trigger debounced email availability check
    if (name === 'email') {
      triggerEmailCheck(value);
    }
  };

  // Real-time email check with debounce and AbortController
  const triggerEmailCheck = useCallback((emailVal) => {
    const trimmed = (emailVal || '').trim();

    if (emailCheckAbortRef.current) {
      emailCheckAbortRef.current.abort();
    }

    if (!trimmed) {
      setEmailStatus('idle');
      setEmailStatusMsg('');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailStatus('invalid');
      setEmailStatusMsg('صيغة البريد الإلكتروني غير صحيحة');
      return;
    }

    setEmailStatus('checking');
    setEmailStatusMsg('جارٍ التحقق من توفر البريد...');

    const controller = new AbortController();
    emailCheckAbortRef.current = controller;

    const timerId = setTimeout(async () => {
      try {
        const result = await usersService.checkEmailAvailability(trimmed, { signal: controller.signal });
        if (result && result.isAvailable === false) {
          setEmailStatus('taken');
          setEmailStatusMsg('هذا البريد مسجل بالفعل في السيستم!');
          setErrors(prev => ({ ...prev, email: 'البريد الإلكتروني مسجل بالفعل لمشترك آخر' }));
        } else {
          setEmailStatus('available');
          setEmailStatusMsg('البريد الإلكتروني متاح للاستخدام ✓');
          setErrors(prev => {
            const next = { ...prev };
            if (next.email?.includes('مسجل بالفعل')) delete next.email;
            return next;
          });
        }
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        // On server check failure, allow user to submit and let backend validate
        setEmailStatus('idle');
        setEmailStatusMsg('');
      }
    }, 450);

    return () => clearTimeout(timerId);
  }, []);

  // Quick Auto-Generate Membership Code (e.g. WOLF-105)
  const handleGenerateCode = () => {
    const generated = `WOLF-${Math.floor(100 + Math.random() * 900)}`;
    setFormData(prev => ({ ...prev, code: generated }));
    if (errors.code) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.code;
        return copy;
      });
    }
  };

  // Quick Auto-Generate Password
  const handleGeneratePassword = () => {
    const generated = `Wolf@${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData(prev => ({
      ...prev,
      password: generated,
      confirmPassword: generated
    }));
    setShowPassword(true);
    setShowConfirmPassword(true);
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.password;
      delete copy.confirmPassword;
      return copy;
    });
  };

  // Calculate live BMI
  const heightM = Number(formData.height) / 100;
  const weightKg = Number(formData.weight);
  const calculatedBmi = (heightM > 0.5 && weightKg > 20) 
    ? (weightKg / (heightM * heightM)).toFixed(1) 
    : null;

  const getBmiCategory = (bmi) => {
    const val = parseFloat(bmi);
    if (!val) return null;
    if (val < 18.5) return { label: 'نحافة', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (val < 25) return { label: 'وزن مثالي', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (val < 30) return { label: 'زيادة وزن', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
    return { label: 'سمنة رياضية / عامة', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  };

  const bmiInfo = calculatedBmi ? getBmiCategory(calculatedBmi) : null;

  // Validation
  const validateForm = () => {
    const newErrors = {};

    // Name
    if (!formData.name.trim()) {
      newErrors.name = 'اسم المشترك مطلوب بالكامل';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'اسم المشترك يجب أن لا يقل عن 3 أحرف';
    }

    // Phone
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'رقم هاتف المشترك مطلوب';
    } else if (formData.phoneNumber.trim().length < 8) {
      newErrors.phoneNumber = 'رقم الهاتف قصير جداً وغير صحيح';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'يرجى كتابة بريد إلكتروني صحيح';
    } else if (emailStatus === 'taken') {
      newErrors.email = 'هذا البريد مسجل بالفعل في السيستم';
    }

    // Code
    if (!formData.code.trim()) {
      newErrors.code = 'كود العضوية مطلوب (يمكنك التوليد التلقائي)';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن لا تقل عن 6 أحرف';
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'يرجى تأكيد كلمة المرور';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمتا المرور غير متطابقتين';
    }

    // Physical numbers check (if entered)
    if (formData.height && (Number(formData.height) < 50 || Number(formData.height) > 260)) {
      newErrors.height = 'الطول بالسم غير منطقي (50 - 260)';
    }
    if (formData.weight && (Number(formData.weight) < 20 || Number(formData.weight) > 350)) {
      newErrors.weight = 'الوزن بالكجم غير منطقي (20 - 350)';
    }
    if (formData.age && (Number(formData.age) < 10 || Number(formData.age) > 100)) {
      newErrors.age = 'السن يجب أن يكون بين 10 و 100 سنة';
    }
    if (formData.musclePercentage && (Number(formData.musclePercentage) < 0 || Number(formData.musclePercentage) > 100)) {
      newErrors.musclePercentage = 'نسبة العضلات يجب أن تكون بين 0 و 100%';
    }
    if (formData.fatPercentage && (Number(formData.fatPercentage) < 0 || Number(formData.fatPercentage) > 100)) {
      newErrors.fatPercentage = 'نسبة الدهون يجب أن تكون بين 0 و 100%';
    }

    setErrors(newErrors);

    // If there are errors in Tab 1, switch back to Tab 1 so user sees them
    if (newErrors.name || newErrors.email || newErrors.phoneNumber || newErrors.code || newErrors.password || newErrors.confirmPassword) {
      setActiveTab('account');
    }

    return Object.keys(newErrors).length === 0;
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      toastError(
        'يرجى مراجعة البيانات المدخلة',
        'تأكد من ملء جميع الحقول المطلوبة بشكل صحيح.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        isActive: Boolean(formData.isActive),
        code: formData.code.trim().toUpperCase(),
        height: formData.height ? Number(formData.height) : 0,
        weight: formData.weight ? Number(formData.weight) : 0,
        age: formData.age ? Number(formData.age) : 0,
        injuries: formData.injuries ? formData.injuries.trim() : '',
        chronicDiseases: formData.chronicDiseases ? formData.chronicDiseases.trim() : '',
        musclePercentage: formData.musclePercentage ? Number(formData.musclePercentage) : 0,
        fatPercentage: formData.fatPercentage ? Number(formData.fatPercentage) : 0,
        notes: formData.notes ? formData.notes.trim() : ''
      };

      const result = await createCustomerDirectly(payload);

      const createdCode = payload.code;
      const createdName = payload.name;

      // 201 Success Feedback
      toastSuccess(
        `تم تسجيل المشترك (${createdName}) بنجاح! 🐺`,
        `كود العضوية: ${createdCode} | الحساب جاهز ومُفعّل للاستخدام.`
      );

      // Auto update parent list without reload
      if (onCustomerAdded) {
        onCustomerAdded(result || { ...payload, id: result?.id || Date.now() });
      }

      // Close modal and reset
      onClose();
    } catch (err) {
      console.error('Failed to create customer directly:', err);

      const status = err.response?.status;
      const data = err.response?.data;

      // Conflict handling (409)
      if (status === 409) {
        const errorDesc = typeof data === 'string' ? data : (data?.detail || data?.message || data?.title || '');
        const isEmailConflict = errorDesc.toLowerCase().includes('email') || errorDesc.includes('البريد');
        const isCodeConflict = errorDesc.toLowerCase().includes('code') || errorDesc.includes('الكود');

        if (isEmailConflict) {
          setErrors(prev => ({ ...prev, email: 'البريد الإلكتروني مسجل بالفعل لمشترك آخر' }));
          setActiveTab('account');
          toastError('البريد الإلكتروني مسجل مسبقاً', 'يرجى كتابة بريد إلكتروني آخر للاعب.');
        } else if (isCodeConflict) {
          setErrors(prev => ({ ...prev, code: 'كود العضوية مسجل بالفعل، يرجى توليد كود جديد' }));
          setActiveTab('account');
          toastError('كود العضوية مكرر', 'هذا الكود مستخدم بالفعل، اضغط على زر توليد كود لاختيار كود جديد.');
        } else {
          setActiveTab('account');
          toastError(
            'بيانات مكررة (409 Conflict)',
            'البريد الإلكتروني أو كود العضوية مسجل مسبقاً لمشترك آخر في النظام.'
          );
        }
        return;
      }

      // Bad Request (400)
      if (status === 400 && data?.errors) {
        let fieldErrors = {};
        let descriptions = [];

        if (Array.isArray(data.errors)) {
          descriptions = data.errors.map(e => e.description || e.code || JSON.stringify(e));
        } else if (typeof data.errors === 'object') {
          Object.keys(data.errors).forEach(key => {
            const lowerKey = key.charAt(0).toLowerCase() + key.slice(1);
            const msg = Array.isArray(data.errors[key]) ? data.errors[key].join(', ') : data.errors[key];
            fieldErrors[lowerKey] = msg;
            descriptions.push(msg);
          });
        }

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...fieldErrors }));
          setActiveTab('account');
        }

        toastError(
          'خطأ في التحقق من البيانات',
          descriptions.length > 0 ? descriptions.join(' • ') : 'يرجى التأكد من صحة بيانات الحساب.'
        );
        return;
      }

      // Generic fallback
      const fallbackMsg = data?.detail || data?.title || err.friendlyMessage || 'حدث خطأ أثناء حفظ بيانات المشترك بالسيرفر.';
      toastError('فشل إضافة المشترك', fallbackMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        dir="rtl" 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md font-cairo"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="wolf-glass bg-[#0c0c0e]/98 border border-white/10 rounded-3xl max-w-2xl lg:max-w-3xl w-full shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] relative overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Subtle Luxury Gold Accent */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-600/70 via-yellow-500/80 to-amber-600/70" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/10 bg-[#141417]/70 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    إضافة مشترك جديد مباشرة
                  </h3>
                  <span className="text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold">
                    RECEPTION
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  تسجيل لاعب جديد في صالة WOLVES وتفعيل حسابه فوراً
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer disabled:opacity-50"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper / Tabs Header */}
          <div className="px-5 sm:px-7 pt-4 pb-3 bg-[#101013] border-b border-white/5 shrink-0">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Tab 1 Pill */}
              <button
                type="button"
                onClick={() => setActiveTab('account')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                  activeTab === 'account'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
                    : 'bg-[#141417] text-zinc-400 border-white/5 hover:text-zinc-200 hover:border-white/10'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-black ${
                  activeTab === 'account' ? 'bg-amber-400 text-black' : 'bg-white/10 text-zinc-300'
                }`}>
                  1
                </div>
                <span>البيانات الأساسية والحساب</span>
                <span className="text-[10px] text-amber-400/80 mr-auto hidden sm:inline">*مطلوب</span>
              </button>

              {/* Tab 2 Pill */}
              <button
                type="button"
                onClick={() => setActiveTab('physical')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                  activeTab === 'physical'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
                    : 'bg-[#141417] text-zinc-400 border-white/5 hover:text-zinc-200 hover:border-white/10'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-black ${
                  activeTab === 'physical' ? 'bg-amber-400 text-black' : 'bg-white/10 text-zinc-300'
                }`}>
                  2
                </div>
                <span>القياسات والحالة الصحية</span>
                <span className="text-[10px] text-zinc-500 mr-auto hidden sm:inline">(اختياري)</span>
              </button>
            </div>
          </div>

          {/* Form Scrollable Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-5 gold-scrollbar">
            {/* ======================================================== */}
            {/* TAB 1: BASIC INFO & ACCOUNT                             */}
            {/* ======================================================== */}
            {activeTab === 'account' && (
              <motion.div
                key="tab-account"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                {/* Section Notice */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#141417] border border-white/5">
                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>يتم إنشاء حساب اللاعب وتوليد كود الحضور فوراً بمجرد الحفظ.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>توليد باسورد سريع</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>الاسم الكامل</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="مثلاً: محمد أحمد إبراهيم"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#141417] border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${
                        errors.name ? 'border-rose-500/60 focus:border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-amber-500/60'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>رقم الهاتف</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        dir="ltr"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="01012345678"
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-[#141417] border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-right ${
                          errors.phoneNumber ? 'border-rose-500/60 focus:border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-amber-500/60'
                        }`}
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.phoneNumber}</span>
                      </p>
                    )}
                  </div>

                  {/* Membership Code + Auto-generate */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-amber-400" />
                        <span>كود العضوية (ID)</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                        title="توليد كود عشوائي جديد"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>توليد تلقائي</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        dir="ltr"
                        name="code"
                        value={formData.code}
                        onChange={(e) => {
                          e.target.value = e.target.value.toUpperCase();
                          handleChange(e);
                        }}
                        placeholder="WOLF-105"
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-[#141417] border text-xs sm:text-sm font-mono font-bold text-amber-300 placeholder-zinc-500 focus:outline-none transition-all text-left uppercase ${
                          errors.code ? 'border-rose-500/60 focus:border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-amber-500/60'
                        }`}
                      />
                    </div>
                    {errors.code && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.code}</span>
                      </p>
                    )}
                  </div>

                  {/* Email with Instant Availability Check */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        <span>البريد الإلكتروني</span>
                        <span className="text-rose-400">*</span>
                      </label>

                      {/* Email Status Indicator */}
                      <div className="text-[11px] font-medium flex items-center gap-1">
                        {emailStatus === 'checking' && (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>جارٍ فحص التوفر...</span>
                          </span>
                        )}
                        {emailStatus === 'available' && (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>متاح للاستخدام</span>
                          </span>
                        )}
                        {emailStatus === 'taken' && (
                          <span className="text-rose-400 flex items-center gap-1 font-bold">
                            <AlertCircle className="w-3 h-3" />
                            <span>مسجل مسبقاً!</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="email"
                        dir="ltr"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="player@wolves.com"
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-[#141417] border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-left ${
                          errors.email || emailStatus === 'taken' 
                            ? 'border-rose-500/60 focus:border-rose-500 bg-rose-500/5' 
                            : emailStatus === 'available' 
                            ? 'border-emerald-500/50 focus:border-emerald-500 bg-emerald-500/5' 
                            : 'border-white/10 focus:border-amber-500/60'
                        }`}
                      />
                    </div>
                    {errors.email ? (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.email}</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-zinc-500">
                        يُستخدم لتسجيل دخول اللاعب في تطبيق المشتركين واستلام الإشعارات.
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>كلمة المرور</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        dir="ltr"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#141417] border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-left ${
                          errors.password ? 'border-rose-500/60 focus:border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-amber-500/60'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        title={showPassword ? 'إخفاء' : 'عرض'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.password}</span>
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>تأكيد كلمة المرور</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        dir="ltr"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#141417] border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-left ${
                          errors.confirmPassword ? 'border-rose-500/60 focus:border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-amber-500/60'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        title={showConfirmPassword ? 'إخفاء' : 'عرض'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.confirmPassword}</span>
                      </p>
                    )}
                  </div>

                  {/* Active Status Switch */}
                  <div className="sm:col-span-2 pt-1">
                    <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141417] border border-white/10 hover:border-white/20 transition-all cursor-pointer">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-white">تفعيل الحساب فورياً</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            formData.isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {formData.isActive ? 'حساب نشط ومفعل' : 'حساب معطل مؤقتاً'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          عند التفعيل، يستطيع اللاعب تسجيل الدخول وتمرير كود الحضور فوراً.
                        </p>
                      </div>

                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      </div>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: PHYSICAL MEASUREMENTS & HEALTH (OPTIONAL)        */}
            {/* ======================================================== */}
            {activeTab === 'physical' && (
              <motion.div
                key="tab-physical"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                {/* Physical Banner & Live BMI */}
                <div className="p-3.5 rounded-2xl bg-[#141417] border border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">بيانات القياسات البدنية</h4>
                      <p className="text-[11px] text-zinc-400">جميع هذه الحقول اختيارية ويمكن إضافتها أو تعديلها لاحقاً.</p>
                    </div>
                  </div>

                  {calculatedBmi && bmiInfo && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[11px] text-zinc-400">مؤشر كتلة الجسم (BMI):</span>
                      <span className="text-xs font-mono font-bold text-amber-300">{calculatedBmi}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${bmiInfo.color}`}>
                        {bmiInfo.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Measurements: Height, Weight, Age */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Height */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-amber-400" />
                      <span>الطول (سم)</span>
                    </label>
                    <input
                      type="number"
                      dir="ltr"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      placeholder="175"
                      min="50"
                      max="260"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#141417] border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-center ${
                        errors.height ? 'border-rose-500/60 focus:border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-amber-500/60'
                      }`}
                    />
                    {errors.height && (
                      <p className="text-[10px] text-rose-400 mt-0.5">{errors.height}</p>
                    )}
                  </div>

                  {/* Weight */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-amber-400" />
                      <span>الوزن (كجم)</span>
                    </label>
                    <input
                      type="number"
                      dir="ltr"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="78"
                      min="20"
                      max="350"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#141417] border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-center ${
                        errors.weight ? 'border-rose-500/60 focus:border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-amber-500/60'
                      }`}
                    />
                    {errors.weight && (
                      <p className="text-[10px] text-rose-400 mt-0.5">{errors.weight}</p>
                    )}
                  </div>

                  {/* Age */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>السن (سنة)</span>
                    </label>
                    <input
                      type="number"
                      dir="ltr"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="26"
                      min="10"
                      max="100"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#141417] border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-center ${
                        errors.age ? 'border-rose-500/60 focus:border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-amber-500/60'
                      }`}
                    />
                    {errors.age && (
                      <p className="text-[10px] text-rose-400 mt-0.5">{errors.age}</p>
                    )}
                  </div>
                </div>

                {/* InBody: Muscle & Fat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Muscle Percentage */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      <span>نسبة العضلات (%)</span>
                    </label>
                    <input
                      type="number"
                      dir="ltr"
                      name="musclePercentage"
                      value={formData.musclePercentage}
                      onChange={handleChange}
                      placeholder="42.5"
                      min="0"
                      max="100"
                      step="0.1"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#141417] border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-center ${
                        errors.musclePercentage ? 'border-rose-500/60 focus:border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-amber-500/60'
                      }`}
                    />
                    {errors.musclePercentage && (
                      <p className="text-[10px] text-rose-400 mt-0.5">{errors.musclePercentage}</p>
                    )}
                  </div>

                  {/* Fat Percentage */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-amber-400" />
                      <span>نسبة الدهون (%)</span>
                    </label>
                    <input
                      type="number"
                      dir="ltr"
                      name="fatPercentage"
                      value={formData.fatPercentage}
                      onChange={handleChange}
                      placeholder="16.2"
                      min="0"
                      max="100"
                      step="0.1"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#141417] border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-center ${
                        errors.fatPercentage ? 'border-rose-500/60 focus:border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-amber-500/60'
                      }`}
                    />
                    {errors.fatPercentage && (
                      <p className="text-[10px] text-rose-400 mt-0.5">{errors.fatPercentage}</p>
                    )}
                  </div>
                </div>

                {/* Medical & Health Records */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Injuries */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>إصابات سابقة (إن وجدت)</span>
                    </label>
                    <textarea
                      name="injuries"
                      rows={2}
                      value={formData.injuries}
                      onChange={handleChange}
                      placeholder="مثال: تمزق خفيف في أربطة الكتف، غضروف ركبة سابق..."
                      className="w-full px-3.5 py-2 rounded-xl bg-[#141417] border border-white/10 focus:border-amber-500/60 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Chronic Diseases */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-amber-400" />
                      <span>أمراض مزمنة أو محاذير طبية</span>
                    </label>
                    <textarea
                      name="chronicDiseases"
                      rows={2}
                      value={formData.chronicDiseases}
                      onChange={handleChange}
                      placeholder="مثال: ضغط دم، ربو، حساسية معينة..."
                      className="w-full px-3.5 py-2 rounded-xl bg-[#141417] border border-white/10 focus:border-amber-500/60 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>ملاحظات إضافية عن المشترك</span>
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="أي ملاحظات خاصة برغبات التمرين أو الكابتن المفضل أو ساعات الحضور..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#141417] border border-white/10 focus:border-amber-500/60 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all resize-none"
                  />
                </div>
              </motion.div>
            )}
          </form>

          {/* Modal Footer */}
          <div className="px-5 sm:px-7 py-4 bg-[#141417] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Step navigation / Cancel */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                إلغاء
              </button>

              {activeTab === 'physical' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('account')}
                  disabled={submitting}
                  className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-bold border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>السابق</span>
                </button>
              )}
            </div>

            {/* Next or Submit */}
            <div className="flex items-center gap-2">
              {activeTab === 'account' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('physical')}
                    className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-bold border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>القياسات البدنية (اختياري)</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || emailStatus === 'checking'}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black text-xs font-black shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جارٍ إنشاء الحساب...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>حفظ المشترك مباشرة</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || emailStatus === 'checking'}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black text-xs font-black shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جارٍ إنشاء الحساب...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>تأكيد وإنشاء الحساب</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddCustomerModal;
