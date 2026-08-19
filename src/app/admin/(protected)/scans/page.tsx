'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';

interface ScanEvent {
  _id: string;
  createdAt: string;
  result: string;
  riskLevel: string;
  customerId?: {
    _id: string;
    instagramUsername: string;
  };
  staffId?: {
    name: string;
    email: string;
  };
  campaignId?: {
    name: string;
  };
}

export default function ScansPage() {
  const [scans, setScans] = useState<ScanEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchScans = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter,
      });
      const res = await fetch(`/api/admin/scans?${query.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setScans(json.data);
        setTotalPages(json.meta.totalPages);
      } else {
        setError(json.message || 'Failed to fetch scans');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchScans();
  }, [page, statusFilter]);

  const formatISTDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'ALREADY_PLAYED': return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
      case 'INVALID_QR':
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Global Scan History</h1>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none bg-white w-full sm:w-auto"
          >
            <option value="">All Scan Results</option>
            <option value="NEW">New (Eligible)</option>
            <option value="ALREADY_PLAYED">Already Played</option>
            <option value="INVALID_QR">Invalid QR</option>
            <option value="ERROR">Error</option>
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
                <th className="px-6 py-3 font-medium">Result</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Staff</th>
                <th className="px-6 py-3 font-medium">Campaign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading scans...
                  </td>
                </tr>
              ) : scans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No scans found.
                  </td>
                </tr>
              ) : (
                scans.map((scan) => (
                  <tr key={scan._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{formatISTDate(scan.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResultColor(scan.result)}`}>
                        {scan.result}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {scan.customerId ? (
                        <Link href={`/admin/customers/${scan.customerId._id}`} className="text-blue-600 hover:underline font-medium">
                          @{scan.customerId.instagramUsername}
                        </Link>
                      ) : (
                        <span className="text-gray-400 italic">Unidentified</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {scan.staffId ? scan.staffId.name : <span className="text-gray-400 italic">System</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {scan.campaignId ? scan.campaignId.name : <span className="text-gray-400 italic">N/A</span>}
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
