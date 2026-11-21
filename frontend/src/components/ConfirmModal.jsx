import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'primary', // 'primary' | 'danger' | 'success'
  requireRemark = false,
  remarkLabel = 'Remarks / Comments',
  remarkPlaceholder = 'Enter reason or notes...',
}) {
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm(remark);
      setRemark('');
      onClose();
    } catch (err) {
      // Handled by caller
    } finally {
      setLoading(false);
    }
  };

  const btnColors = {
    primary: 'bg-gbu-900 hover:bg-gbu-800 text-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {confirmVariant === 'danger' ? (
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed">{message}</p>

          {requireRemark !== undefined && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">{remarkLabel}</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder={remarkPlaceholder}
                rows={3}
                className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-gbu-600 focus:ring-2 focus:ring-gbu-600/20 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 ${btnColors[confirmVariant] || btnColors.primary}`}
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
