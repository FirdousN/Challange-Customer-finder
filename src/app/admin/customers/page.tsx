'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface Customer {
  _id: string;
  instagramUsername: string;
  instagramProfileUrl: string;
  firstScannedAt: string;
  lastScannedAt: string;
  scanCount: number;
  participationCount: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        status: statusFilter,
      });
      const res = await fetch(`/api/admin/customers?${query.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setCustomers(json.data);
        setTotalPages(json.meta.totalPages);
      } else {
        setError(json.message || 'Failed to fetch customers');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomers();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Customers</h1>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black outline-none bg-white"
          >
            <option value="">All Statuses</option>
            <option value="played">Played</option>
            <option value="unplayed">Unplayed</option>
          </select>
          <button 
            type="submit"
            className="px-6 py-2 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
          >
            Search
          </button>
        </form>
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
                <th className="px-6 py-3 font-medium">Instagram</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Scans</th>
                <th className="px-6 py-3 font-medium">First Scanned (IST)</th>
                <th className="px-6 py-3 font-medium">Last Scanned (IST)</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">@{c.instagramUsername}</div>
                      <a 
                        href={c.instagramProfileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View Profile
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      {c.participationCount > 0 ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Played ({c.participationCount})
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          Unplayed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">{c.scanCount}</td>
                    <td className="px-6 py-4 text-gray-500">{formatISTDate(c.firstScannedAt)}</td>
                    <td className="px-6 py-4 text-gray-500">{formatISTDate(c.lastScannedAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/customers/${c._id}`}
                        className="inline-flex items-center gap-1 text-black hover:text-gray-600 font-medium bg-gray-100 px-3 py-1.5 rounded-md transition-colors"
                      >
                        <Eye size={16} />
                        View
                      </Link>
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
