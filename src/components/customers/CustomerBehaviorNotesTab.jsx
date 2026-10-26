import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Send, 
  Search, 
  Clock, 
  User, 
  ShieldAlert, 
  Plus, 
  RotateCw, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  Loader2,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { customersService } from '../../services/customersService';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';

/**
 * CustomerBehaviorNotesTab Component
 * Integrates:
 * - POST /api/customers/{id}/behavior-notes
 * - GET /api/customers/{id}/behavior-notes (with Search, Pagination, SortBy)
 */
export const CustomerBehaviorNotesTab = ({ customerId, customerName = '', canAddNote = true }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  // Pagination
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // New Note Form
  const [newNote, setNewNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch Notes
  const fetchNotes = useCallback(async (isManualRefresh = false, signal = null) => {
    if (!customerId) return;
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await customersService.getCustomerBehaviorNotes(
        customerId,
        {
          pageNumber,
          pageSize,
          search: debouncedSearch.trim(),
        },
        { signal }
      );

      const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.items) ? res.items : []);
      setNotes(items);
      setTotalCount(res?.totalCount !== undefined ? res.totalCount : items.length);
      setTotalPages(res?.totalPages || Math.ceil((res?.totalCount || items.length || 1) / pageSize) || 1);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      console.error('Failed to load behavior notes:', err);
      toastError('تعذر جلب ملاحظات السلوك', err.friendlyMessage || 'حدث خطأ أثناء تحميل السجل.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId, pageNumber, pageSize, debouncedSearch, toastError]);

  useEffect(() => {
    const controller = new AbortController();
    fetchNotes(false, controller.signal);
    return () => controller.abort();
  }, [fetchNotes]);

  // Handle Add Note
  const handleAddNote = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const clean = newNote.trim();
    if (!clean) {
      setFormError('يرجى كتابة نص الملاحظة السلوكية أولاً.');
      return;
    }
    if (clean.length < 3) {
      setFormError('الملاحظة قصيرة جداً (3 أحرف على الأقل).');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      await customersService.addBehaviorNote(customerId, clean);
      toastSuccess(
        'تم تسجيل الملاحظة بنجاح',
        `تمت إضافة الملاحظة السلوكية في ملف اللاعب ${customerName || ''}.`
      );
      setNewNote('');
      setShowAddForm(false);
      // Refresh list
      setPageNumber(1);
      fetchNotes(true);
    } catch (err) {
      console.error('Add behavior note error:', err);
      const msg = err.response?.data?.detail || err.friendlyMessage || 'فشل حفظ الملاحظة السلوكية.';
      setFormError(msg);
      toastError('خطأ أثناء التسجيل', msg);
    } finally {
      setSubmitting(false);
    }
  };

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
    <div dir="rtl" className="space-y-4 font-cairo">
      {/* Header Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-zinc-950/70 border border-amber-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              سجل ملاحظات السلوك والانضباط
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {totalCount} ملاحظة
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              توثيق ملاحظات الريسبشن، المدربين، والإدارة حول التزام وسلوك العضو داخل الصالة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchNotes(true)}
            disabled={refreshing || loading}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 transition-all cursor-pointer"
            title="تحديث القائمة"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {canAddNote && (
            <button
              type="button"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setFormError('');
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-gold-glow flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[3]" />}
              <span>{showAddForm ? 'إلغاء' : 'إضافة ملاحظة سلوك'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Note Collapsible Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-[#16161d] to-[#0c0c10] border border-amber-500/30 shadow-lg space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                تدوين ملاحظة سلوكية جديدة على اللاعب
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {newNote.length}/500 حرف
              </span>
            </div>

            <textarea
              rows={3}
              value={newNote}
              onChange={(e) => {
                setNewNote(e.target.value);
                if (formError) setFormError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleAddNote(e);
                }
              }}
              maxLength={500}
              placeholder="اكتب تفاصيل الملاحظة (مثال: عدم الالتزام بوضع الأوزان في أماكنها، مشادة كلامية مع أحد الأعضاء، الالتزام الممتاز بالتعليمات...)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/70 border border-zinc-800 text-white text-xs sm:text-sm placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-all resize-none"
              disabled={submitting}
              autoFocus
            />

            {formError && (
              <p className="text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {formError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewNote('');
                  setFormError('');
                }}
                disabled={submitting}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleAddNote}
                disabled={submitting || !newNote.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-gold-glow flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                    <span>جاري التدوين...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 fill-black" />
                    <span>حفظ الملاحظة بالسجل</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPageNumber(1);
          }}
          placeholder="ابحث داخل الملاحظات السلوكية..."
          className="w-full pr-10 pl-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setPageNumber(1);
            }}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Timeline Notes List */}
      <div className="space-y-3 min-h-[160px]">
        {loading && !refreshing ? (
          // Skeleton Loading
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`skel-note-${idx}`}
              className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 animate-pulse space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-zinc-800 rounded" />
                <div className="h-3 w-24 bg-zinc-900 rounded" />
              </div>
              <div className="h-3.5 w-3/4 bg-zinc-800 rounded" />
              <div className="h-3.5 w-1/2 bg-zinc-900 rounded" />
            </div>
          ))
        ) : notes.length === 0 ? (
          // Empty State
          <div className="py-10 text-center p-6 rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h5 className="text-xs sm:text-sm font-bold text-white mb-1">
              {search ? 'لا توجد ملاحظات تطابق كلمة البحث' : 'سجل العضو نظيف تماماً!'}
            </h5>
            <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
              {search
                ? 'جرب البحث بكلمات أخرى أو مسح شريط البحث.'
                : 'لا توجد أي مخالفات أو ملاحظات سلوكية مسجلة على هذا اللاعب حتى الآن.'}
            </p>
          </div>
        ) : (
          // Notes Cards
          notes.map((note) => (
            <div
              key={note.id}
              className="p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 transition-all text-right space-y-2 relative group"
            >
              {/* Header: Employee & Date */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-zinc-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center text-[10px] font-bold">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-zinc-200">
                    كُتبت بواسطة:{' '}
                    <strong className="text-amber-400">
                      {note.employeeName || 'موظف بالصالة'}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                  <Clock className="w-3 h-3 text-amber-500/70" />
                  <span>{formatDate(note.createdAt)}</span>
                </div>
              </div>

              {/* Body Note Content */}
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap pt-0.5">
                {note.description}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 px-1 text-xs">
          <span className="text-zinc-500 text-[11px]">
            صفحة <strong className="text-white font-mono">{pageNumber}</strong> من{' '}
            <strong className="text-amber-400 font-mono">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pageNumber <= 1 || loading}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 disabled:opacity-40 transition-colors"
              title="السابق"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={pageNumber >= totalPages || loading}
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 disabled:opacity-40 transition-colors"
              title="التالي"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerBehaviorNotesTab;
