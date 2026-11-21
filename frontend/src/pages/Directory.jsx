import React, { useState, useEffect } from 'react';
import { Building2, Search, Truck, Mail, Phone, MapPin, UserCheck, School } from 'lucide-react';
import { GBU_DEPARTMENTS } from '../constants/departments';
import { api } from '../api';

export default function Directory() {
  const [activeTab, setActiveTab] = useState('departments'); // 'departments' | 'vendors'
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  useEffect(() => {
    if (activeTab === 'vendors' && vendors.length === 0) {
      setLoadingVendors(true);
      api.getVendors()
        .then((data) => setVendors(data))
        .catch(() => {})
        .finally(() => setLoadingVendors(false));
    }
  }, [activeTab]);

  const filteredDepts = GBU_DEPARTMENTS.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.location.toLowerCase().includes(search.toLowerCase()) ||
      d.contactRole.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.email && v.email.toLowerCase().includes(search.toLowerCase())) ||
      (v.phone && v.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-[28px] font-medium text-ink leading-tight">
          University Directory
        </h1>
        <p className="text-[14px] text-ink-muted mt-1">
          Official departmental contact directory, academic schools, research centres, and approved university suppliers.
        </p>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-surface p-4 rounded-panel border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-paper p-1 rounded border border-line">
          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'departments'
                ? 'bg-surface text-primary shadow-xs font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <School className="w-3.5 h-3.5 text-primary" />
            <span>Schools & Facilities ({GBU_DEPARTMENTS.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vendors')}
            className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'vendors'
                ? 'bg-surface text-primary shadow-xs font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-primary" />
            <span>Authorized Vendors ({vendors.length || '...'})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'departments' ? 'Search school, lab, or office...' : 'Search vendor name or contact...'}
            className="w-full h-9 pl-9 pr-3 text-[13px] rounded border border-line bg-surface text-ink outline-none focus:border-primary placeholder:text-ink-subtle"
          />
        </div>
      </div>

      {/* Content Section: Departments */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDepts.map((d, idx) => (
            <div
              key={idx}
              className="bg-surface rounded-panel border border-line p-5 hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-primary bg-primary-light px-2 py-0.5 rounded border border-blue-200">
                      {d.shortName}
                    </span>
                    <span className="text-[11px] font-medium text-ink-muted px-2 py-0.5 rounded bg-paper border border-line">
                      {d.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-subtle">{d.type}</span>
                </div>

                <h2 className="font-serif text-[17px] font-semibold text-ink mt-2.5 leading-snug">
                  {d.name}
                </h2>

                <div className="mt-3 space-y-1.5 text-[12px] text-ink-muted">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                    <span>{d.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                    <span>{d.contactRole}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[11px] text-ink-subtle">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-ink-muted" />
                  <span className="font-mono">{d.phone}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-ink-muted" />
                  <span>{d.email}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Section: Vendors */}
      {activeTab === 'vendors' && (
        <div className="bg-surface rounded-panel border border-line overflow-hidden">
          {loadingVendors ? (
            <div className="py-16 text-center text-[13px] text-ink-muted">
              Loading approved university vendors...
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-ink-muted">
              No vendors found matching search.
            </div>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead className="bg-paper text-ink-muted font-medium border-b border-line text-[12px]">
                <tr>
                  <th className="px-4 py-2.5 w-12 text-center">#</th>
                  <th className="px-4 py-2.5">Registered Firm / Vendor Name</th>
                  <th className="px-4 py-2.5">Telephone / Contact</th>
                  <th className="px-4 py-2.5">Email Address</th>
                  <th className="px-4 py-2.5 text-center">Rate Contract</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink">
                {filteredVendors.map((v, i) => (
                  <tr key={v.id} className="hover:bg-paper/40 transition-colors">
                    <td className="px-4 py-3 text-center text-ink-muted font-mono text-[11px]">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-ink flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary shrink-0" />
                      <span>{v.name}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted tabular-nums font-mono text-[12px]">
                      {v.phone || '0120-2344000'}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {v.email || 'vendor@gbu.partner'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 text-[11px] font-semibold text-green bg-green-light border border-green-border rounded">
                        Active Empanelled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
