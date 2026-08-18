/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, User, QrCode, Clock, ShieldCheck, Activity } from 'lucide-react';
import { useParams } from 'next/navigation';

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

  const { customer, participations, recentScans } = data;

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
          {customer.participationCount > 0 ? (
            <span className="px-3 py-1 bg-green-100 text-green-800 font-medium rounded-full text-sm">
              Played ({customer.participationCount})
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
                {customer.rawQrPayload}
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
                <p className="font-medium text-gray-900 mt-1">{formatISTDate(customer.firstScannedAt)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-500">Last Scanned</p>
                <p className="font-medium text-gray-900 mt-1">{formatISTDate(customer.lastScannedAt)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 text-gray-500 pt-2 border-t border-gray-100">
              <span className="col-span-2">Total Scans</span>
              <span className="col-span-1 font-bold text-gray-900 text-right">{customer.scanCount}</span>
            </div>
            <div className="grid grid-cols-3 text-gray-500">
              <span className="col-span-2">Total Participations</span>
              <span className="col-span-1 font-bold text-gray-900 text-right">{customer.participationCount}</span>
            </div>
          </div>
        </div>

        {/* Participation History */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-gray-500" />
            Participation Records
          </h2>
          {participations.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No participation records found.</p>
          ) : (
            <div className="space-y-3">
              {participations.map((p: any) => (
                <div key={p._id} className="border border-gray-100 rounded p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-gray-900">{p.campaignId?.name || 'Unknown Campaign'}</span>
                    <span className="px-2 py-0.5 bg-green-200 text-green-800 text-[10px] font-bold rounded uppercase">
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{formatISTDate(p.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
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
                <th className="px-4 py-3 font-medium">Campaign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {recentScans.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500 italic">
                    No scans found.
                  </td>
                </tr>
              ) : (
                recentScans.map((scan: any) => (
                  <tr key={scan._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{formatISTDate(scan.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        scan.result === 'NEW' ? 'bg-blue-100 text-blue-800' :
                        scan.result === 'ALREADY_PLAYED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {scan.result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{scan.staffId?.name || 'System'}</td>
                    <td className="px-4 py-3 text-gray-600">{scan.campaignId?.name || 'N/A'}</td>
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
