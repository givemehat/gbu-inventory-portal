import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export default function Combobox({
  items = [],
  value = '',
  onChange,
  placeholder = 'Select an item...',
  disabled = false,
  error = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);

  const selectedItem = items.find((i) => String(i.id) === String(value));

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query.trim() === ''
    ? items
    : items.filter(
        (i) =>
          (i.name || '').toLowerCase().includes(query.toLowerCase()) ||
          (i.code || '').toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full h-9 px-3 text-left text-[14px] bg-surface rounded border flex items-center justify-between transition-colors outline-none focus:border-primary ${
          error ? 'border-red' : 'border-line hover:border-slate-400'
        } ${disabled ? 'bg-paper text-ink-subtle cursor-not-allowed' : 'text-ink'}`}
      >
        <span className="truncate">
          {selectedItem ? (
            <span>
              <span className="font-mono text-[12px] text-ink-muted mr-1.5">[{selectedItem.code}]</span>
              <span className="font-medium text-ink">{selectedItem.name}</span>
              <span className="text-[12px] text-ink-muted ml-1.5 tabular-nums">
                ({selectedItem.qty} {selectedItem.unit} in stock)
              </span>
            </span>
          ) : (
            <span className="text-ink-subtle">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="w-4 h-4 text-ink-muted shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-surface border border-line rounded shadow-sm overflow-hidden">
          <div className="p-2 border-b border-line bg-paper flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-ink-muted shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by code or name..."
              autoFocus
              className="w-full text-[13px] bg-transparent outline-none text-ink placeholder:text-ink-subtle"
            />
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-line/40">
            {filtered.length === 0 ? (
              <div className="p-3 text-[13px] text-ink-subtle text-center">
                No matching store items found.
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = String(item.id) === String(value);
                const isLow = item.qty <= item.min_stock;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange(item.id, item);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full p-2.5 text-left text-[13px] flex items-center justify-between hover:bg-paper transition-colors ${
                      isSelected ? 'bg-primary-light font-medium' : ''
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-ink-muted">[{item.code}]</span>
                        <span className="text-ink truncate">{item.name}</span>
                      </div>
                      <span className="text-[11px] text-ink-subtle">
                        Category: {item.category} • Location: {item.location || 'Central Stores'}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="tabular-nums font-medium text-[12px] block text-ink">
                        {item.qty} {item.unit}
                      </span>
                      {isLow && (
                        <span className="text-[10px] text-amber font-semibold">
                          Below min ({item.min_stock})
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
