'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, Play, Pause, Square, Plus } from 'lucide-react';

interface Campaign {
  _id: string;
  name: string;
  slug: string;
  status: 'STARTED' | 'PAUSED' | 'ENDED';
  createdAt: string;
  instagramAccounts: { username: string; isRequired: boolean }[];
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/campaigns');
      const json = await res.json();
      if (res.ok && json.success) {
        setCampaigns(json.data);
      } else {
        setError(json.message || 'Failed to fetch campaigns');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCampaigns(campaigns.map(c => c._id === id ? { ...c, status: newStatus as any } : c));
      } else {
        alert(json.message || 'Failed to update campaign status');
      }
    } catch (err) {
      alert('Network error while updating status');
    }
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
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Campaigns</h1>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors">
          <Plus size={18} />
          Create Campaign
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <Megaphone className="mx-auto text-gray-400 mb-3" size={48} />
          <h3 className="text-lg font-medium text-gray-900">No campaigns found</h3>
          <p className="text-gray-500 mt-1">Get started by creating your first campaign.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((c) => (
            <div key={c._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-gray-900 truncate pr-2">{c.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    c.status === 'STARTED' ? 'bg-green-100 text-green-800' :
                    c.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {c.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">Created:</span> {formatISTDate(c.createdAt)}</p>
                  <p><span className="font-medium">Accounts:</span> {c.instagramAccounts?.length || 0}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 border-t border-gray-200 flex justify-between items-center">
                <div className="flex gap-2">
                  {c.status !== 'STARTED' && c.status !== 'ENDED' && (
                    <button
                      onClick={() => updateStatus(c._id, 'STARTED')}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                      title="Start Campaign"
                    >
                      <Play size={18} />
                    </button>
                  )}
                  {c.status === 'STARTED' && (
                    <button
                      onClick={() => updateStatus(c._id, 'PAUSED')}
                      className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"
                      title="Pause Campaign"
                    >
                      <Pause size={18} />
                    </button>
                  )}
                  {c.status !== 'ENDED' && (
                    <button
                      onClick={() => updateStatus(c._id, 'ENDED')}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      title="End Campaign"
                    >
                      <Square size={18} />
                    </button>
                  )}
                </div>
                <span className="text-xs text-gray-500 font-mono">ID: {c._id.slice(-6)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
