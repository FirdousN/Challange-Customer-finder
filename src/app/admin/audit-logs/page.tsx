'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface AuditLog {
  _id: string;
  action: string;
  actorRole?: string;
  actorId?: {
    name: string;
    email: string;
  };
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        action: actionFilter,
      });
      const res = await fetch(`/api/admin/audit-logs?${query.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setLogs(json.data);
        setTotalPages(json.meta.totalPages);
      } else {
        setError(json.message || 'Failed to fetch audit logs');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
  }, [page, actionFilter]);

  const formatISTDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Audit Logs</h1>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Filter className="text-gray-400 hidden sm:block" size={18} />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none bg-white"
          >
            <option value="">All Actions</option>
            <option value="STAFF_LOGIN">Staff Login</option>
            <option value="ADMIN_LOGIN">Admin Login</option>
            <option value="QR_SCANNED">QR Scanned</option>
            <option value="CUSTOMER_VIEWED">Customer Viewed</option>
            <option value="PARTICIPATION_CREATED">Participation Created</option>
            <option value="CAMPAIGN_CREATED">Campaign Created</option>
            <option value="CAMPAIGN_STARTED">Campaign Started</option>
            <option value="STAFF_CREATED">Staff Created</option>
            <option value="STAFF_ACTIVATED">Staff Activated</option>
            <option value="STAFF_DEACTIVATED">Staff Deactivated</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">Time (IST)</th>
                <th className="px-6 py-3 font-medium">Actor</th>
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Target</th>
                <th className="px-6 py-3 font-medium">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-mono text-xs">{formatISTDate(log.createdAt)}</td>
                    <td className="px-6 py-4">
                      {log.actorId ? (
                        <div>
                          <div className="font-medium text-gray-900">{log.actorId.name}</div>
                          <div className="text-xs text-gray-500">{log.actorRole || 'System'}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded font-bold text-xs uppercase tracking-wider">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {log.entityType ? (
                        <>
                          <span className="font-medium">{log.entityType}</span>
                          {log.entityId && <span className="font-mono ml-1 text-gray-400">({log.entityId.slice(-6)})</span>}
                        </>
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <div className="max-w-xs truncate text-xs font-mono text-gray-500 bg-gray-50 p-1.5 rounded">
                          {JSON.stringify(log.metadata)}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">None</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages || 1}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 border border-gray-300 rounded-md bg-white disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading || totalPages === 0}
              className="p-2 border border-gray-300 rounded-md bg-white disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
