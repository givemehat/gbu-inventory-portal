import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Search,
  Filter,
  Plus,
  Edit2,
  History,
  AlertTriangle,
  FolderPlus,
  X,
  Layers,
  MapPin,
  Tag
} from 'lucide-react';
import { api, getCurrentUser } from '../api';
import ItemLedgerModal from '../components/ItemLedgerModal';
import { useToast } from '../components/Toast';

export default function Items() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCat, setSelectedCat] = useState(searchParams.get('category_id') || '');
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('low') === 'true');

  // Modals
  const [ledgerItem, setLedgerItem] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category_id: '',
    unit: 'pcs',
    min_stock: 5,
    price: 0,
    location: '',
    opening_qty: 0,
  });
  const [newCatName, setNewCatName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const user = getCurrentUser() || {};
  const isStore = ['store', 'admin'].includes(user.role);
  const toast = useToast();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getItems({
        q: searchQuery,
        category_id: selectedCat || undefined,
        low: lowStockOnly || undefined,
      }),
      api.getCategories(),
    ])
      .then(([itemsData, catsData]) => {
        setItems(itemsData);
        setCategories(catsData);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedCat, lowStockOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenAdd = () => {
    setFormData({
      code: '',
      name: '',
      category_id: categories[0]?.id || '',
      unit: 'pcs',
      min_stock: 5,
      price: 0,
      location: 'Rack A1',
      opening_qty: 10,
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      category_id: item.category_id,
      unit: item.unit,
      min_stock: item.min_stock,
      price: item.price,
      location: item.location || '',
      opening_qty: item.qty,
    });
    setIsEditOpen(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.addItem({
        ...formData,
        category_id: Number(formData.category_id),
        min_stock: Number(formData.min_stock),
        price: Number(formData.price),
        opening_qty: Number(formData.opening_qty),
      });
      toast.success(`Item "${formData.name}" added successfully.`);
      setIsAddOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.editItem(editingItem.id, {
        code: formData.code,
        name: formData.name,
        category_id: Number(formData.category_id),
        unit: formData.unit,
        min_stock: Number(formData.min_stock),
        price: Number(formData.price),
        location: formData.location,
        opening_qty: 0,
      });
      toast.success(`Item "${formData.name}" updated successfully.`);
      setIsEditOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      setSubmitting(true);
      const newCat = await api.addCategory(newCatName.trim());
      toast.success(`Category "${newCat.name}" added.`);
      setNewCatName('');
      setIsCatOpen(false);
      const updatedCats = await api.getCategories();
      setCategories(updatedCats);
      setFormData((prev) => ({ ...prev, category_id: newCat.id }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalValue = items.reduce((acc, i) => acc + (i.value || 0), 0);
  const lowCount = items.filter((i) => i.low).length;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">University Stock Catalog</h2>
          <p className="text-xs text-slate-500">
            {items.length} items cataloged • Total Inventory Valuation:{' '}
            <strong className="text-gbu-900">₹{totalValue.toLocaleString('en-IN')}</strong>
          </p>
        </div>

        {isStore && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCatOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-slate-500" />
              <span>Add Category</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gbu-900 hover:bg-gbu-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-gbu-950/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name or unique item code (e.g. STN-001, Toner)..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-gbu-600 focus:ring-2 focus:ring-gbu-600/20 outline-none transition-all placeholder:text-slate-400"
          />
        </form>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Category Dropdown */}
          <div className="relative min-w-[160px]">
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full text-xs font-medium py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 focus:border-gbu-600 outline-none appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Low Stock Toggle Button */}
          <button
            type="button"
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              lowStockOnly
                ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-200'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${lowStockOnly ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Low Stock ({lowCount})</span>
          </button>
        </div>
      </div>

      {/* Main Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3 text-right">In Stock</th>
                <th className="px-3 py-3 text-right">Min Level</th>
                <th className="px-3 py-3 text-right">Unit Price</th>
                <th className="px-3 py-3 text-right">Stock Valuation</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-gbu-800 border-t-transparent rounded-full animate-spin" />
                      <span>Loading inventory catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No items match the search or filter criteria.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-gbu-800 bg-gbu-50 px-2 py-0.5 rounded border border-gbu-100">
                        {item.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setLedgerItem(item)}
                        className="text-left font-semibold text-slate-900 hover:text-gbu-700 block transition-colors"
                      >
                        {item.name}
                      </button>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-slate-600 font-medium">
                      {item.category}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-slate-500 flex items-center gap-1 mt-2">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{item.location || 'Central Stores'}</span>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full ${
                          item.low
                            ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                            : 'text-slate-900'
                        }`}
                      >
                        {item.low && <AlertTriangle className="w-3 h-3" />}
                        {item.qty} {item.unit}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-slate-500 font-medium">
                      {item.min_stock} {item.unit}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap font-medium text-slate-800">
                      ₹{item.price.toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap font-bold text-gbu-900">
                      ₹{(item.value || item.qty * item.price).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setLedgerItem(item)}
                          title="View complete stock ledger"
                          className="px-2.5 py-1 text-[11px] font-semibold text-gbu-800 bg-gbu-50 hover:bg-gbu-100 rounded-lg border border-gbu-200 transition-colors flex items-center gap-1"
                        >
                          <History className="w-3 h-3" />
                          <span>Ledger</span>
                        </button>
                        {isStore && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Item Master"
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add New Inventory Item</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAdd} className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Item Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. STN-006, CMP-010"
                    className="w-full text-xs font-mono uppercase px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name & Specification *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Spiral Notebook 200 Pages"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pcs / box / ream"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Store Location / Rack</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Rack A3, Bin 4"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Opening Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.opening_qty}
                    onChange={(e) => setFormData({ ...formData, opening_qty: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gbu-900 hover:bg-gbu-800 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Adding Item...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Inventory Item</h3>
                <p className="text-xs font-mono text-gbu-800 mt-0.5">{editingItem?.code}</p>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name & Specification *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Store Location / Rack</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gbu-900 hover:bg-gbu-800 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving Changes...' : 'Update Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add New Category</h3>
              <button onClick={() => setIsCatOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Sports Equipment"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 bg-gbu-900 hover:bg-gbu-800 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Ledger Modal */}
      <ItemLedgerModal
        item={ledgerItem}
        isOpen={!!ledgerItem}
        onClose={() => setLedgerItem(null)}
      />
    </div>
  );
}
