import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  summary,
  confirmText = 'Confirm',
  confirmVariant = 'primary', // 'primary' | 'danger' | 'success'
  remarkLabel = 'Remarks (optional)',
  remarkPlaceholder = 'Enter notes or justification...',
  requireRemark = false,
}) {
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      await onConfirm(remark);
      setRemark('');
      onClose();
    } catch {
      // Handled by caller
    } finally {
      setLoading(false);
    }
  };

  const btnVariants = {
    primary: 'bg-primary hover:bg-primary-hover text-white',
    danger: 'bg-red hover:bg-red/90 text-white',
    success: 'bg-green hover:bg-green/90 text-white',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-surface rounded-panel max-w-md w-full border border-line shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-line flex items-center justify-between">
          <h3 className="font-serif text-[18px] font-semibold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-ink-muted hover:text-ink p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-4 space-y-3">
          {summary && (
            <div className="p-3 bg-paper border border-line rounded text-[13px] text-ink leading-relaxed">
              <span className="font-semibold block text-[11px] uppercase tracking-wide text-ink-muted mb-0.5">
                Expected outcome
              </span>
              {summary}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-ink mb-1">
              {remarkLabel} {requireRemark && <span className="text-red">*</span>}
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder={remarkPlaceholder}
              required={requireRemark}
              rows={3}
              autoFocus
              className="w-full text-[13px] p-2.5 rounded border border-line focus:border-primary outline-none placeholder:text-ink-subtle"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 h-9 text-[13px] font-medium text-ink-muted hover:bg-paper rounded border border-line"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 h-9 text-[13px] font-semibold rounded transition-colors disabled:opacity-50 ${btnVariants[confirmVariant] || btnVariants.primary}`}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
