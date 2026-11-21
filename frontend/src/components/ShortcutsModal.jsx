import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

/**
 * Shadcn-style Keyboard Shortcuts Dialog
 */
export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Global Navigation',
      shortcuts: [
        { keys: ['⌘', 'K'], altKeys: ['/'], description: 'Open Command Palette' },
        { keys: ['?'], description: 'Open Keyboard Shortcuts cheat sheet' },
        { keys: ['Esc'], description: 'Close modal, drawer, or search' },
      ],
    },
    {
      title: 'Quick Page Jumps',
      shortcuts: [
        { keys: ['G', 'D'], description: 'Go to Home Dashboard' },
        { keys: ['G', 'I'], description: 'Go to Stock Register' },
        { keys: ['G', 'N'], description: 'Go to Indents & Requisitions' },
        { keys: ['G', 'P'], description: 'Go to Purchase Orders' },
        { keys: ['G', 'W'], description: 'Go to Condemnations (Write-offs)' },
        { keys: ['G', 'R'], description: 'Go to Reports & Statements' },
        { keys: ['G', 'F'], description: 'Go to Forms & Slips' },
      ],
    },
    {
      title: 'Data & Printing',
      shortcuts: [
        { keys: ['⌘', 'P'], description: 'Print active slip or report (A4)' },
        { keys: ['Tab'], description: 'Navigate accessible form fields' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-surface w-full max-w-lg rounded-panel border border-line shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-paper/50">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-primary" />
            <h3 className="font-serif font-semibold text-ink text-[16px]">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink rounded hover:bg-line/40 transition-colors"
            aria-label="Close shortcuts modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                {group.title}
              </span>
              <div className="border border-line rounded-md divide-y divide-line/60 bg-paper/20">
                {group.shortcuts.map((sc, i) => (
                  <div key={i} className="p-2.5 px-3 flex items-center justify-between gap-4 text-[13px]">
                    <span className="text-ink">{sc.description}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="px-2 py-0.5 font-mono text-[11px] font-semibold text-ink bg-surface border border-line rounded shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                      {sc.altKeys && (
                        <>
                          <span className="text-[11px] text-ink-muted px-0.5">or</span>
                          {sc.altKeys.map((ak, aki) => (
                            <kbd
                              key={aki}
                              className="px-2 py-0.5 font-mono text-[11px] font-semibold text-ink bg-surface border border-line rounded shadow-2xs"
                            >
                              {ak}
                            </kbd>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-paper border-t border-line text-center text-[11px] text-ink-muted flex items-center justify-between px-4">
          <span>Press <kbd className="px-1 py-0.2 font-mono text-[10px] bg-surface border border-line rounded">?</kbd> anywhere to open</span>
          <button
            type="button"
            onClick={onClose}
            className="text-primary hover:underline font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
