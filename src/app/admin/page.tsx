'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  ScanLine, 
  CheckCircle, 
  AlertTriangle,
  PlayCircle,
  Megaphone
} from 'lucide-react';

interface DashboardData {
  todaysScans: number;
  todaysPlayers: number;
  totalCustomers: number;
  alreadyPlayed: number;
  eligiblePlayers: number;
  suspiciousScans: number;
  activeCampaign: {
    name: string;
    status: string;
  } | null;
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: React.ElementType, color: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        const json = await res.json();
        
        if (res.ok && json.success) {
          setData(json.data);
        } else {
          setError(json.message || 'Failed to load dashboard data');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        <p className="font-bold">Error Loading Dashboard</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Overview</h1>
        
        {data.activeCampaign ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {data.activeCampaign.name}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium border border-yellow-200">
            <AlertTriangle size={14} />
            No Active Campaign
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Today's Scans" 
          value={data.todaysScans} 
          icon={ScanLine} 
          color="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          title="Today's Players" 
          value={data.todaysPlayers} 
          icon={PlayCircle} 
          color="bg-green-100 text-green-600" 
        />
        <StatCard 
          title="Suspicious/Rejected" 
          value={data.suspiciousScans} 
          icon={AlertTriangle} 
          color="bg-red-100 text-red-600" 
        />
        <StatCard 
          title="Total Customers" 
          value={data.totalCustomers} 
          icon={Users} 
          color="bg-purple-100 text-purple-600" 
        />
        <StatCard 
          title="Eligible (Unplayed)" 
          value={data.eligiblePlayers} 
          icon={CheckCircle} 
          color="bg-emerald-100 text-emerald-600" 
        />
        <StatCard 
          title="Already Played" 
          value={data.alreadyPlayed} 
          icon={Megaphone} 
          color="bg-orange-100 text-orange-600" 
        />
      </div>
    </div>
  );
}
