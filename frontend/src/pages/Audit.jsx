import React, { useEffect, useState } from 'react';
import {
  History,
  Shield,
  Search,
  User,
  Clock,
  Filter,
  CheckCircle,
  FileCheck2,
  Trash2,
  Package,
  Layers
} from 'lucide-react';
import { api, getCurrentUser } from '../api';
import { useToast } from '../components/Toast';

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const user = getCurrentUser() || {};
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    api.getAuditLogs()
      .then((data) => setLogs(data))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter((l) =>
    (l.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.user || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Audit & Governance
            </span>
            <span className="text-xs text-slate-400">Strictly Approver & Admin Only</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">University Audit Trail & Compliance Log</h2>
          <p className="text-xs text-slate-500">
            Immutable log of all storekeeper issuances, director approvals, purchase orders, and material write-offs.
          </p>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by user, action, or document reference..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredLogs.length}</strong> of {logs.length} audit records
        </span>
      </div>

      {/* Audit Timeline Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Event Timestamp</th>
                <th className="px-4 py-3">Authorized User</th>
                <th className="px-4 py-3">Action Description</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-gbu-800 border-t-transparent rounded-full animate-spin" />
                      <span>Loading immutable audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No audit records match the search query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isApproved = log.action.includes('APPROVED');
                  const isRejected = log.action.includes('REJECTED');
                  const isCreated = log.action.includes('Created') || log.action.includes('Raised');
                  const isIssued = log.action.includes('Issued');
                  const isReceived = log.action.includes('Received');

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {log.user ? log.user.charAt(0) : 'U'}
                          </div>
                          <span className="font-semibold text-slate-900">{log.user}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{log.action}</span>
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Sanctioned
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            Rejected
                          </span>
                        ) : isReceived ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                            Goods Inward
                          </span>
                        ) : isIssued ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            Dispatched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            Logged
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
