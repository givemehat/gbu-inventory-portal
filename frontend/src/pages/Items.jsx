import React, { useEffect, useState } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight, X, ArrowUpDown, Layers } from 'lucide-react';
import { api, getCurrentUser } from '../api';
import StockLevelBar from '../components/StockLevelBar';
import { useToast } from '../components/Toast';
import { EmptyBoxIllustration } from '../components/Illustrations';
import WarehouseRackGrid from '../components/WarehouseRackGrid';

export default function Items() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & filter
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCat, setSelectedCat] = useState(searchParams.get('category_id') || '');
  const [lowOnly, setLowOnly] = useState(searchParams.get('low') === 'true');
  const [showWarehouseMap, setShowWarehouseMap] = useState(false);
  const [selectedRack, setSelectedRack] = useState(null);

  // Sorting
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination (15 rows)
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Add Item Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    code: '',
    name: '',
    category_id: '',
    unit: 'pcs',
    min_stock: 5,
    price: 0,
    location: '',
    opening_qty: 10,
  });
  const [formErrors, setFormErrors] = useState({});

  const user = getCurrentUser() || {};
  const isStore = ['store', 'admin'].includes(user.role);
  const toast = useToast();
  const { openItemDrawer } = useOutletContext() || {};

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getItems({
        q: query.trim() || undefined,
        category_id: selectedCat || undefined,
        low: lowOnly || undefined,
      }),
      api.getCategories(),
    ])
      .then(([itemsData, catsData]) => {
        setItems(itemsData);
        setCategories(catsData);
        if (catsData.length > 0 && !addForm.category_id) {
          setAddForm((prev) => ({ ...prev, category_id: catsData[0].id }));
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedCat, lowOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filter by selected warehouse rack if set, then sort and paginate
  const rackFiltered = selectedRack
    ? items.filter((it) => it.location === selectedRack)
    : items;

  const sortedItems = [...rackFiltered].sort((a, b) => {
    let vA = a[sortField];
    let vB = b[sortField];
    if (typeof vA === 'string') {
      vA = vA.toLowerCase();
      vB = vB.toLowerCase();
    }
    if (vA < vB) return sortAsc ? -1 : 1;
    if (vA > vB) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const paginatedItems = sortedItems.slice((page - 1) * pageSize, page * pageSize);

  // Form validation on blur
  const validateField = (field, value) => {
    const errs = { ...formErrors };
    if (field === 'code') {
      if (!value || value.trim().length < 2) errs.code = 'Enter a valid item code (min 2 characters).';
      else delete errs.code;
    }
    if (field === 'name') {
      if (!value || value.trim().length < 3) errs.name = 'Item name must be at least 3 characters.';
      else delete errs.name;
    }
    if (field === 'min_stock') {
      if (Number(value) < 0) errs.min_stock = 'Minimum stock threshold cannot be negative.';
      else delete errs.min_stock;
    }
    if (field === 'price') {
      if (Number(value) < 0) errs.price = 'Unit price cannot be negative.';
      else delete errs.price;
    }
    setFormErrors(errs);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.code.trim() || !addForm.name.trim()) {
      toast.error('Complete all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      await api.addItem({
        code: addForm.code.trim().toUpperCase(),
        name: addForm.name.trim(),
        category_id: Number(addForm.category_id),
        unit: addForm.unit.trim() || 'pcs',
        min_stock: Number(addForm.min_stock) || 0,
        price: Number(addForm.price) || 0,
        location: addForm.location.trim(),
        opening_qty: Number(addForm.opening_qty) || 0,
      });
      toast.success(`Added ${addForm.name} to store catalog`);
      setIsAddOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const lowCount = items.filter((i) => i.low).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Section Header (MIT Style) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[14px] text-slate-500 font-medium">
          <span>🏠</span>
          <span>/</span>
          <span>roadmaps</span>
          <span>/</span>
          <span className="font-semibold text-slate-800">Central_Stock_Register</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              Central Stock Register
            </h1>
            <div className="pt-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1565C0] pb-2 border-b-2 border-[#1565C0]">
                Catalog Items & Central Warehouse Storage
              </h2>
            </div>
            <p className="text-[15.5px] text-slate-600 mt-2">
              Master catalog with {items.length} SKUs across 5 commodity categories • {lowCount} items requiring refill.
            </p>
          </div>

          {isStore && (
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="h-10 px-4 bg-[#1565C0] hover:bg-blue-700 text-white text-[14px] font-semibold rounded-md flex items-center gap-2 transition-colors self-start sm:self-auto shadow-xs"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Add New Item SKU</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="p-3 bg-surface border border-line rounded flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items by name or code..."
            className="w-full h-8 pl-8 pr-3 text-[13px] bg-paper rounded border border-line focus:border-primary focus:bg-surface outline-none placeholder:text-ink-subtle"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCat}
            onChange={(e) => {
              setSelectedCat(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2.5 text-[13px] bg-surface rounded border border-line text-ink outline-none cursor-pointer"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setLowOnly(!lowOnly);
              setPage(1);
            }}
            className={`h-8 px-2.5 rounded text-[13px] font-medium border transition-colors flex items-center gap-1.5 ${
              lowOnly
                ? 'border-amber bg-amber-light text-amber font-semibold'
                : 'border-line bg-surface text-ink hover:bg-paper'
            }`}
          >
            <span>Below minimum</span>
            <span className="tabular-nums text-[11px] font-semibold">({lowCount})</span>
          </button>

          {/* Warehouse Rack Map Toggle (Origin UI / 21st.dev style) */}
          <button
            type="button"
            onClick={() => setShowWarehouseMap(!showWarehouseMap)}
            className={`h-8 px-2.5 rounded text-[13px] font-medium border transition-colors flex items-center gap-1.5 ${
              showWarehouseMap || selectedRack
                ? 'border-primary bg-primary-light text-primary font-semibold'
                : 'border-line bg-surface text-ink hover:bg-paper'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bay & Rack Map</span>
            {selectedRack && (
              <span className="font-mono text-[10px] bg-primary text-white px-1.5 py-0.2 rounded">
                {selectedRack}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Warehouse Visualizer Panel */}
      {showWarehouseMap && (
        <div className="p-4 bg-surface rounded-panel border border-line shadow-2xs space-y-3 animate-in fade-in duration-150">
          <WarehouseRackGrid
            items={items}
            activeRack={selectedRack}
            onSelectRack={(rackId) => {
              setSelectedRack(rackId);
              setPage(1);
            }}
          />
          {selectedRack && (
            <div className="flex items-center justify-between text-[12px] p-2 bg-blue-50/70 border border-blue-200 rounded text-primary">
              <span>
                Filtering stock items located in <strong>{selectedRack}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedRack(null)}
                className="text-[11px] underline font-medium hover:text-ink"
              >
                Clear rack filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Stock Register Table (Desktop / Tablet) */}
      <div className="bg-surface border border-line rounded overflow-hidden">
        {/* Table view (>= 640px) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-paper border-b border-line text-[12px] font-semibold text-ink-muted sticky top-0">
              <tr>
                <th className="px-3 py-2.5 cursor-pointer select-none" onClick={() => handleSort('code')}>
                  <span className="flex items-center gap-1">
                    Code <ArrowUpDown className="w-3 h-3 text-ink-subtle" />
                  </span>
                </th>
                <th className="px-3 py-2.5 cursor-pointer select-none" onClick={() => handleSort('name')}>
                  <span className="flex items-center gap-1">
                    Item name <ArrowUpDown className="w-3 h-3 text-ink-subtle" />
                  </span>
                </th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Stock level</th>
                <th className="px-3 py-2.5 text-right cursor-pointer select-none" onClick={() => handleSort('min_stock')}>
                  <span className="flex items-center justify-end gap-1">
                    Min <ArrowUpDown className="w-3 h-3 text-ink-subtle" />
                  </span>
                </th>
                <th className="px-3 py-2.5 text-right cursor-pointer select-none" onClick={() => handleSort('price')}>
                  <span className="flex items-center justify-end gap-1">
                    Rate <ArrowUpDown className="w-3 h-3 text-ink-subtle" />
                  </span>
                </th>
                <th className="px-3 py-2.5 text-right cursor-pointer select-none" onClick={() => handleSort('value')}>
                  <span className="flex items-center justify-end gap-1">
                    Value <ArrowUpDown className="w-3 h-3 text-ink-subtle" />
                  </span>
                </th>
                <th className="px-3 py-2.5">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 text-ink">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-ink-muted text-[13px]">
                    Loading stock register...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center">
                    <EmptyBoxIllustration message="No catalog items found matching your filters." />
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => openItemDrawer?.(item)}
                    className="h-10 hover:bg-paper cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2 font-mono text-[12px] text-ink-muted whitespace-nowrap">
                      {item.code}
                    </td>
                    <td className="px-3 py-2 font-medium text-ink hover:text-primary truncate max-w-xs">
                      {item.name}
                    </td>
                    <td className="px-3 py-2 text-ink-muted text-[12px] whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <StockLevelBar qty={item.qty} minStock={item.min_stock} unit={item.unit} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink-muted whitespace-nowrap text-[12px]">
                      {item.min_stock} {item.unit}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink whitespace-nowrap">
                      ₹{item.price.toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-ink whitespace-nowrap">
                      ₹{(item.value || item.qty * item.price).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2 text-ink-subtle text-[12px] whitespace-nowrap">
                      {item.location || 'Central Stores'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Stacked cards for mobile screens (< 640px) */}
        <div className="sm:hidden divide-y divide-line">
          {paginatedItems.map((item) => (
            <div
              key={item.id}
              onClick={() => openItemDrawer?.(item)}
              className="p-3.5 space-y-1.5 cursor-pointer hover:bg-paper"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-[14px] text-ink">{item.name}</span>
                <span className="font-mono text-[11px] text-ink-muted">[{item.code}]</span>
              </div>
              <div className="flex items-center justify-between text-[12px] pt-1">
                <StockLevelBar qty={item.qty} minStock={item.min_stock} unit={item.unit} />
                <span className="tabular-nums font-semibold text-ink">
                  ₹{(item.value || item.qty * item.price).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination controls */}
        <div className="p-3 border-t border-line bg-paper flex items-center justify-between text-[12px] text-ink-muted">
          <span>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, sortedItems.length)} of {sortedItems.length} items
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1 rounded border border-line bg-surface hover:bg-paper disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium tabular-nums text-ink">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1 rounded border border-line bg-surface hover:bg-paper disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-surface rounded-panel max-w-md w-full border border-line shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b border-line flex items-center justify-between">
              <h3 className="font-serif text-[18px] font-semibold text-ink">Add catalog item</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                aria-label="Close dialog"
                className="text-ink-muted hover:text-ink p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-ink mb-1">Item code *</label>
                  <input
                    type="text"
                    required
                    value={addForm.code}
                    onChange={(e) => setAddForm({ ...addForm, code: e.target.value.toUpperCase() })}
                    onBlur={(e) => validateField('code', e.target.value)}
                    placeholder="e.g. STN-006"
                    className="w-full h-8 px-2.5 font-mono uppercase text-[13px] rounded border border-line focus:border-primary outline-none"
                  />
                  {formErrors.code && <p className="text-[11px] text-red mt-0.5">{formErrors.code}</p>}
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-ink mb-1">Category *</label>
                  <select
                    value={addForm.category_id}
                    onChange={(e) => setAddForm({ ...addForm, category_id: e.target.value })}
                    className="w-full h-8 px-2 text-[13px] rounded border border-line focus:border-primary outline-none bg-surface"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-ink mb-1">Item name *</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  onBlur={(e) => validateField('name', e.target.value)}
                  placeholder="e.g. Spiral Notebook 200 Pages"
                  className="w-full h-8 px-2.5 text-[13px] rounded border border-line focus:border-primary outline-none"
                />
                {formErrors.name && <p className="text-[11px] text-red mt-0.5">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[13px] font-medium text-ink mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    placeholder="pcs / box"
                    className="w-full h-8 px-2 text-[13px] rounded border border-line focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-ink mb-1">Min threshold</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={addForm.min_stock}
                    onChange={(e) => setAddForm({ ...addForm, min_stock: e.target.value })}
                    onBlur={(e) => validateField('min_stock', e.target.value)}
                    className="w-full h-8 px-2 text-[13px] rounded border border-line focus:border-primary outline-none tabular-nums"
                  />
                  {formErrors.min_stock && <p className="text-[11px] text-red mt-0.5">{formErrors.min_stock}</p>}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-ink mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={addForm.price}
                    onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                    onBlur={(e) => validateField('price', e.target.value)}
                    className="w-full h-8 px-2 text-[13px] rounded border border-line focus:border-primary outline-none tabular-nums"
                  />
                  {formErrors.price && <p className="text-[11px] text-red mt-0.5">{formErrors.price}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-ink mb-1">Rack location</label>
                  <input
                    type="text"
                    value={addForm.location}
                    onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                    placeholder="e.g. Rack A3"
                    className="w-full h-8 px-2.5 text-[13px] rounded border border-line focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-ink mb-1">Opening balance</label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.opening_qty}
                    onChange={(e) => setAddForm({ ...addForm, opening_qty: e.target.value })}
                    className="w-full h-8 px-2.5 text-[13px] rounded border border-line focus:border-primary outline-none tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 h-8 text-[13px] font-medium text-ink-muted hover:bg-paper rounded border border-line"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || Object.keys(formErrors).length > 0}
                  className="px-4 h-8 bg-primary hover:bg-primary-hover text-white text-[13px] font-semibold rounded disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
