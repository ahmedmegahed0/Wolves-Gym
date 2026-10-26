import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  QrCode, 
  Activity, 
  Scale, 
  Ruler, 
  Calendar, 
  Flame, 
  HeartPulse, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { customerService } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import CustomerBehaviorNotesTab from './CustomerBehaviorNotesTab';
import CustomerAttendanceCalendar from './CustomerAttendanceCalendar';

export const CustomerEditModal = ({ isOpen, onClose, customer, onCustomerUpdated }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    code: '',
    isActive: true,
    height: '',
    weight: '',
    age: '',
    musclePercentage: '',
    fatPercentage: '',
    injuries: '',
    chronicDiseases: '',
    notes: '',
    approvalStatus: 0,
  });

  const [activeSection, setActiveSection] = useState('basic'); // 'basic', 'physical', 'health', 'notes', 'attendance'
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || customer.Name || '',
        phoneNumber: customer.phoneNumber || customer.PhoneNumber || '',
        code: customer.code || customer.Code || '',
        isActive: customer.isActive ?? customer.IsActive ?? true,
        height: customer.height ?? customer.Height ?? '',
        weight: customer.weight ?? customer.Weight ?? '',
        age: customer.age ?? customer.Age ?? '',
        musclePercentage: customer.musclePercentage ?? customer.MusclePercentage ?? '',
        fatPercentage: customer.fatPercentage ?? customer.FatPercentage ?? '',
        injuries: customer.injuries ?? customer.Injuries ?? '',
        chronicDiseases: customer.chronicDiseases ?? customer.ChronicDiseases ?? '',
        notes: customer.notes ?? customer.Notes ?? '',
        approvalStatus: customer.approvalStatus ?? customer.ApprovalStatus ?? 0,
      });
      setErrors({});
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const targetId = customer.id ?? customer.customerId ?? customer.Id;

  // Handle local approval status selection (applied only when clicking Save)
  const handleApprovalStatusChange = (newStatus) => {
    setFormData(prev => ({ ...prev, approvalStatus: Number(newStatus) }));
  };

  // Calculate BMI on the fly
  const heightMeters = Number(formData.height) / 100;
  const calculatedBmi =
    heightMeters > 0 && Number(formData.weight) > 0
      ? (Number(formData.weight) / (heightMeters * heightMeters)).toFixed(1)
      : null;

  const validate = () => {
    const errs = {};
    if (!formData.name?.trim()) {
      errs.name = 'اسم العضو مطلوب';
      setActiveSection('basic');
    } else if (!formData.phoneNumber?.trim()) {
      errs.phoneNumber = 'رقم الهاتف مطلوب';
      setActiveSection('basic');
    }

    if (formData.weight && Number(formData.weight) <= 0) {
      errs.weight = 'الوزن يجب أن يكون رقماً موجباً';
      setActiveSection('physical');
    }
    if (formData.height && Number(formData.height) <= 0) {
      errs.height = 'الطول يجب أن يكون رقماً موجباً';
      setActiveSection('physical');
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toastError('يرجى تصحيح البيانات', Object.values(errs)[0]);
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      // 1. Update customer profile details
      await customerService.updateCustomer(targetId, formData);

      // 2. If approval status was changed by the user in this form, sync approval status via API
      const originalStatus = Number(customer.approvalStatus ?? customer.ApprovalStatus ?? 0);
      const newStatus = Number(formData.approvalStatus);
      if (newStatus !== originalStatus) {
        await customerService.changeApprovalStatus(targetId, { status: newStatus });
      }

      toastSuccess(
        'تم حفظ التعديلات بنجاح',
        `تم تحديث بيانات العضو (${formData.name}) وحالته بنجاح.`
      );
      if (onCustomerUpdated) {
        onCustomerUpdated({ ...customer, ...formData, id: targetId });
      }
      onClose();
    } catch (err) {
      console.error('Update customer error:', err);
      toastError(
        'فشل تحديث بيانات العضو',
        err.friendlyMessage || 'حدث خطأ أثناء حفظ التعديلات بالسيرفر.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div dir="rtl" className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md font-cairo">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="wolf-glass bg-zinc-950/95 border border-amber-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 lg:p-7 max-w-2xl lg:max-w-4xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Gold Accent Line */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 opacity-90" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-gold-glow shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  ملف وتعديل الوحش
                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-lg">
                    #{targetId}
                  </span>
                </h3>
                <p className="text-[10px] sm:text-xs text-zinc-400">
                  تحديث البيانات، حالة الاعتماد، ملاحظات السلوك، وسجل الحضور
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Navigation Section Tabs */}
          <div className="grid grid-cols-5 rounded-xl sm:rounded-2xl bg-black/60 p-1 border border-zinc-800 my-2.5 sm:my-3.5 gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSection('basic')}
              className={`py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                activeSection === 'basic'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">الأساسية</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('physical')}
              className={`py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                activeSection === 'physical'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Scale className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">القياسات</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('health')}
              className={`py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                activeSection === 'health'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <HeartPulse className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">الصحي</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('notes')}
              className={`py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                activeSection === 'notes'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">السلوك</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('attendance')}
              className={`py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                activeSection === 'attendance'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">الحضور</span>
            </button>
          </div>

          {/* Form Body / Content with Smooth Transitions */}
          <div className="flex-1 overflow-y-auto space-y-4 px-1 py-1 gold-scrollbar">
            {/* 1. BASIC INFO SECTION */}
            {activeSection === 'basic' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-3.5"
              >
                {/* Member Name */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    اسم العضو بالكامل:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-500">
                      <User className="w-4 h-4 text-amber-400/80" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="مثال: أحمد محمد علي"
                      className={`w-full bg-black/70 text-white placeholder-zinc-500 text-xs sm:text-sm rounded-xl pr-10 pl-4 py-2.5 sm:py-3 border ${
                        errors.name ? 'border-rose-500' : 'border-zinc-800 focus:border-amber-400'
                      } focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Phone & Code Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      رقم الموبايل:
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-500">
                        <Phone className="w-4 h-4 text-amber-400/80" />
                      </div>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="010XXXXXXXX"
                        dir="ltr"
                        className={`w-full bg-black/70 text-white placeholder-zinc-500 text-xs sm:text-sm rounded-xl pr-10 pl-4 py-2.5 sm:py-3 border font-mono text-right ${
                          errors.phoneNumber ? 'border-rose-500' : 'border-zinc-800 focus:border-amber-400'
                        } focus:outline-none focus:ring-1 focus:ring-amber-400`}
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-[11px] text-rose-400 mt-1">{errors.phoneNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      كود الدخول (Member Code):
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-500">
                        <QrCode className="w-4 h-4 text-amber-400/80" />
                      </div>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="WOLF-001"
                        dir="ltr"
                        className={`w-full bg-black/70 text-white placeholder-zinc-500 text-xs sm:text-sm rounded-xl pr-10 pl-4 py-2.5 sm:py-3 border font-mono text-right uppercase tracking-wider ${
                          errors.code ? 'border-rose-500' : 'border-zinc-800 focus:border-amber-400'
                        } focus:outline-none focus:ring-1 focus:ring-amber-400`}
                      />
                    </div>
                    {errors.code && (
                      <p className="text-[11px] text-rose-400 mt-1">{errors.code}</p>
                    )}
                  </div>
                </div>

                {/* Approval Status Selector */}
                <div className="bg-zinc-900/90 rounded-2xl p-3.5 border border-amber-500/20">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black text-white">حالة اعتماد المشترك (Approval Status):</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleApprovalStatusChange(0)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        Number(formData.approvalStatus) === 0
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-black shadow-gold-glow'
                          : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-[11px] font-bold">قيد الانتظار</div>
                      <div className="text-[9px] text-zinc-500 font-mono mt-0.5">معلق (0)</div>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleApprovalStatusChange(1)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        Number(formData.approvalStatus) === 1
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                          : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-[11px] font-bold">معتمد ونشط</div>
                      <div className="text-[9px] text-emerald-500/70 font-mono mt-0.5">مقبول (1)</div>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleApprovalStatusChange(2)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        Number(formData.approvalStatus) === 2
                          ? 'bg-rose-500/20 border-rose-500 text-rose-400 font-black shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                          : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-[11px] font-bold">مرفوض / موقوف</div>
                      <div className="text-[9px] text-rose-500/70 font-mono mt-0.5">غير مؤهل (2)</div>
                    </button>
                  </div>
                </div>

                {/* Account Active Status Toggle */}
                <div className="bg-zinc-900/80 rounded-2xl p-3.5 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${formData.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">حالة تفعيل الحساب</div>
                      <div className="text-[11px] text-zinc-400">
                        {formData.isActive ? 'الحساب نشط ويستطيع العضو الدخول للجيم' : 'الحساب معطل وموقوف مؤقتاً'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, isActive: !p.isActive }))}
                    className="text-amber-400 hover:text-amber-300 transition-colors p-1"
                  >
                    {formData.isActive ? (
                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-600" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. PHYSICAL MEASUREMENTS SECTION */}
            {activeSection === 'physical' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                  {/* Height */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      الطول (سم):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="50"
                        max="260"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        placeholder="180"
                        className="w-full bg-black/70 text-white rounded-xl px-3 py-2.5 sm:py-3 border border-zinc-800 focus:border-amber-400 focus:outline-none font-mono text-center text-sm font-bold"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold">
                        cm
                      </span>
                    </div>
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      الوزن (كجم):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="20"
                        max="350"
                        step="0.5"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="80"
                        className="w-full bg-black/70 text-white rounded-xl px-3 py-2.5 sm:py-3 border border-zinc-800 focus:border-amber-400 focus:outline-none font-mono text-center text-sm font-bold"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold">
                        kg
                      </span>
                    </div>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      السن (سنة):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        max="100"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="25"
                        className="w-full bg-black/70 text-white rounded-xl px-3 py-2.5 sm:py-3 border border-zinc-800 focus:border-amber-400 focus:outline-none font-mono text-center text-sm font-bold"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold">
                        سنة
                      </span>
                    </div>
                  </div>
                </div>

                {/* BMI Quick Meter Display */}
                {calculatedBmi && (
                  <div className="bg-zinc-900/90 rounded-2xl p-4 border border-amber-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">مؤشر كتلة الجسم (BMI المحسوب)</div>
                        <div className="text-[11px] text-zinc-400">
                          {calculatedBmi < 18.5
                            ? 'نحافة (تحت الوزن الطبيعي)'
                            : calculatedBmi < 25
                            ? 'وزن مثالي متناسق'
                            : calculatedBmi < 30
                            ? 'وزن زائد خفيف / كتلة عضلية'
                            : 'سمنة / كتلة عضلية ضخمة'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                      {calculatedBmi}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. HEALTH & FITNESS PROFILE SECTION */}
            {activeSection === 'health' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-3.5"
              >
                {/* Muscle & Fat Percentages */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      نسبة العضلات (%):
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="75"
                      step="0.1"
                      name="musclePercentage"
                      value={formData.musclePercentage}
                      onChange={handleChange}
                      placeholder="42.5"
                      className="w-full bg-black/70 text-white rounded-xl px-3 py-2.5 sm:py-3 border border-zinc-800 focus:border-amber-400 focus:outline-none font-mono text-center text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-yellow-400" />
                      نسبة الدهون (%):
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="60"
                      step="0.1"
                      name="fatPercentage"
                      value={formData.fatPercentage}
                      onChange={handleChange}
                      placeholder="14.0"
                      className="w-full bg-black/70 text-white rounded-xl px-3 py-2.5 sm:py-3 border border-zinc-800 focus:border-amber-400 focus:outline-none font-mono text-center text-sm font-bold"
                    />
                  </div>
                </div>

                {/* Injuries */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    الإصابات والعمليات السابقة:
                  </label>
                  <input
                    type="text"
                    name="injuries"
                    value={formData.injuries}
                    onChange={handleChange}
                    placeholder="مثال: إصابة قديمة في الكتف، تمزق غضروف..."
                    className="w-full bg-black/70 text-white placeholder-zinc-500 text-xs sm:text-sm rounded-xl px-3 py-2.5 sm:py-3 border border-zinc-800 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Chronic Diseases */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    الأمراض المزمنة (إن وجدت):
                  </label>
                  <input
                    type="text"
                    name="chronicDiseases"
                    value={formData.chronicDiseases}
                    onChange={handleChange}
                    placeholder="مثال: حساسية صدر، ضغط دم، سكر..."
                    className="w-full bg-black/70 text-white placeholder-zinc-500 text-xs sm:text-sm rounded-xl px-3 py-2.5 sm:py-3 border border-zinc-800 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    ملاحظات الكابتن والاستقبال:
                  </label>
                  <textarea
                    rows={2}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="أي ملاحظات خاصة ببرنامج التمرين أو التغذية..."
                    className="w-full bg-black/70 text-white placeholder-zinc-500 text-xs sm:text-sm rounded-xl px-3 py-2.5 border border-zinc-800 focus:border-amber-400 focus:outline-none resize-none font-cairo"
                  />
                </div>
              </motion.div>
            )}

            {/* 4. BEHAVIOR NOTES TAB */}
            {activeSection === 'notes' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="py-1"
              >
                <CustomerBehaviorNotesTab
                  customerId={targetId}
                  customerName={formData.name}
                />
              </motion.div>
            )}

            {/* 5. ATTENDANCE CALENDAR TAB */}
            {activeSection === 'attendance' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="py-1"
              >
                <CustomerAttendanceCalendar
                  customerId={targetId}
                  customerName={formData.name}
                />
              </motion.div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-zinc-800/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
              <div className="text-[11px] text-zinc-500">
                {activeSection === 'notes' || activeSection === 'attendance' ? (
                  <span>يتم حفظ وتحديث الملاحظات والحضور مباشرة وفورياً مع السيرفر.</span>
                ) : (
                  <span>تأكد من مراجعة القياسات والبيانات قبل الحفظ النهائي.</span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 sm:py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-bold transition-colors text-center"
                >
                  إغلاق
                </button>

                {(activeSection === 'basic' || activeSection === 'physical' || activeSection === 'health') && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-gold-glow flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>جاري الحفظ...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-black" />
                        <span>حفظ التعديلات</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CustomerEditModal;
