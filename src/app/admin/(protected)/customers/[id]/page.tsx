/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, User, QrCode, Clock, Activity } from 'lucide-react';
import { useParams } from 'next/navigation';
import { formatIST } from '@/lib/utils/date';

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/admin/customers/${id}`);
        const json = await res.json();
        if (res.ok && json.success) {
          setData(json.data);
        } else {
          setError(json.message || 'Failed to load customer data.');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCustomer();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link href="/admin/customers" className="inline-flex items-center text-sm text-gray-500 hover:text-black">
          <ChevronLeft size={16} /> Back to Customers
        </Link>
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error || 'Customer not found.'}
        </div>
      </div>
    );
  }

  const { customer, recentScans } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/customers" className="inline-flex items-center text-sm text-gray-500 hover:text-black mb-4">
          <ChevronLeft size={16} /> Back to Customers
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <User className="text-gray-400" />
            @{customer.instagramUsername}
          </h1>
          {customer.firstPlayedAt ? (
            <span className="px-3 py-1 bg-green-100 text-green-800 font-medium rounded-full text-sm">
              Played
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-800 font-medium rounded-full text-sm">
              Unplayed
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Identity & Contact Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
            <User size={18} className="text-gray-500" />
            Identity
          </h2>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 text-gray-500">
              <span className="col-span-1">Username</span>
              <span className="col-span-2 font-medium text-gray-900">@{customer.instagramUsername}</span>
            </div>
            <div className="grid grid-cols-3 text-gray-500">
              <span className="col-span-1">Identity Key</span>
              <span className="col-span-2 font-medium text-gray-900 font-mono text-xs">{customer.instagramIdentityKey}</span>
            </div>
            <div className="grid grid-cols-3 text-gray-500 items-center">
              <span className="col-span-1">Profile Link</span>
              <span className="col-span-2">
                <a href={customer.instagramProfileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Open Instagram
                </a>
              </span>
            </div>
          </div>
        </div>

        {/* QR Data Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
            <QrCode size={18} className="text-gray-500" />
            QR Information
          </h2>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 text-gray-500">
              <span className="col-span-1">QR Source</span>
              <span className="col-span-2 font-medium text-gray-900">{customer.qrSource || 'Unknown'}</span>
            </div>
            <div className="grid grid-cols-3 text-gray-500">
              <span className="col-span-1">Payload Hash</span>
              <span className="col-span-2 font-medium text-gray-900 font-mono text-xs break-all">{customer.qrPayloadHash}</span>
            </div>
            <div className="grid grid-cols-1 text-gray-500 mt-2">
              <span className="mb-1">Raw Payload</span>
              <div className="bg-gray-50 p-2 rounded border border-gray-200 font-mono text-xs break-all text-gray-700 max-h-24 overflow-y-auto">
                {customer.instagramQrRawPayload}
              </div>
            </div>
          </div>
        </div>

        {/* Scanning & Participation Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-gray-500" />
            Timeline & Activity
          </h2>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-500">First Scanned</p>
                <p className="font-medium text-gray-900 mt-1">{formatIST(customer.firstSeenAt)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-500">Last Scanned</p>
                <p className="font-medium text-gray-900 mt-1">{formatIST(customer.lastSeenAt)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 text-gray-500 pt-2 border-t border-gray-100">
              <span className="col-span-2">Total Scans</span>
              <span className="col-span-1 font-bold text-gray-900 text-right">{customer.scanCount}</span>
            </div>
            <div className="grid grid-cols-3 text-gray-500">
              <span className="col-span-2">First Played At</span>
              <span className="col-span-1 font-medium text-gray-900 text-right">{formatIST(customer.firstPlayedAt)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Scans Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <Activity size={18} className="text-gray-500" />
          <h2 className="font-bold text-gray-900">Recent Scans</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">Time (IST)</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 font-medium">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {recentScans.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500 italic">
                    No scans found.
                  </td>
                </tr>
              ) : (
                recentScans.map((scan: any) => (
                  <tr key={scan._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{formatIST(scan.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        scan.result === 'NEW' ? 'bg-green-100 text-green-800' :
                        scan.result === 'ALREADY_PLAYED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {scan.result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{scan.staffId?.name || 'System'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
