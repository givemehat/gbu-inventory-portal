import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      {/* Header */}
      <div>
        <h1 className="font-serif text-[28px] font-medium text-ink leading-tight">
          Audit Trail
        </h1>
        <p className="text-[14px] text-ink-muted mt-1">
          Immutable event log of all store transactions, sanctions, and procurements.
        </p>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-surface p-4 rounded-panel border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by user, document, or action..."
            className="w-full h-9 pl-9 pr-3 text-[13px] rounded border border-line bg-surface text-ink outline-none focus:border-primary placeholder:text-ink-subtle"
          />
        </div>

        <span className="text-[13px] text-ink-muted">
          Showing <span className="font-medium text-ink tabular-nums">{filteredLogs.length}</span> of <span className="tabular-nums">{logs.length}</span> records
        </span>
      </div>

      {/* Audit Table */}
      <div className="bg-surface rounded-panel border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-paper text-ink-muted font-medium border-b border-line text-[12px]">
              <tr>
                <th className="px-4 py-2.5 w-48">Timestamp</th>
                <th className="px-4 py-2.5 w-44">User</th>
                <th className="px-4 py-2.5">Action description</th>
                <th className="px-4 py-2.5 text-center w-32">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-ink-muted">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-ink-muted">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isApproved = log.action.includes('APPROVED');
                  const isRejected = log.action.includes('REJECTED');
                  const isIssued = log.action.includes('Issued');
                  const isReceived = log.action.includes('Received');

                  return (
                    <tr key={log.id} className="h-10 hover:bg-paper/40 transition-colors">
                      <td className="px-4 py-2 whitespace-nowrap text-ink-muted text-[12px] tabular-nums">
                        {new Date(log.at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      <td className="px-4 py-2 whitespace-nowrap font-medium text-ink">
                        {log.user}
                      </td>

                      <td className="px-4 py-2 text-ink">
                        {log.action}
                      </td>

                      <td className="px-4 py-2 text-center whitespace-nowrap">
                        {isApproved ? (
                          <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded bg-green/10 text-green border border-green/20">
                            Sanctioned
                          </span>
                        ) : isRejected ? (
                          <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded bg-red/10 text-red border border-red/20">
                            Rejected
                          </span>
                        ) : isReceived ? (
                          <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded bg-primary-light text-primary border border-blue-200">
                            Goods Inward
                          </span>
                        ) : isIssued ? (
                          <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded bg-paper text-ink border border-line">
                            Stock Issue
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded bg-paper text-ink-muted border border-line">
                            Event Log
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
