'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, UserX, UserPlus } from 'lucide-react';

interface Staff {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'STAFF' });
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      const json = await res.json();
      if (res.ok && json.success) {
        setStaff(json.data);
      } else {
        setError(json.message || 'Failed to fetch staff');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStaff();
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;
    
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setStaff(staff.map(s => s._id === id ? { ...s, isActive: !currentStatus } : s));
      } else {
        alert(json.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Network error while updating status');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsCreating(false);
        setNewStaff({ name: '', email: '', password: '', role: 'STAFF' });
        fetchStaff();
      } else {
        setCreateError(json.message || 'Failed to create staff');
      }
    } catch (err) {
      setCreateError('Network error');
    }
  };

  const formatISTDate = (isoString?: string) => {
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
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Staff Management</h1>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
        >
          {isCreating ? 'Cancel' : <><UserPlus size={18} /> Add Staff</>}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {isCreating && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4">Create New User</h2>
          {createError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{createError}</div>}
          <form onSubmit={handleCreate} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                required
                type="text" 
                value={newStaff.name}
                onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-black focus:border-black outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                required
                type="email" 
                value={newStaff.email}
                onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-black focus:border-black outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                required
                type="password" 
                minLength={8}
                value={newStaff.password}
                onChange={e => setNewStaff({...newStaff, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-black focus:border-black outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select 
                value={newStaff.role}
                onChange={e => setNewStaff({...newStaff, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-black focus:border-black outline-none bg-white"
              >
                <option value="STAFF">Staff (Scanner Access)</option>
                <option value="ADMIN">Admin (Full Access)</option>
              </select>
            </div>
            <button type="submit" className="px-4 py-2 bg-black text-white rounded font-medium hover:bg-gray-800">
              Create User
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Last Login (IST)</th>
                <th className="px-6 py-3 font-medium">Created (IST)</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading staff...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No staff found.
                  </td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${s.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.isActive ? (
                        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium">
                          <UserCheck size={14} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-medium">
                          <UserX size={14} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatISTDate(s.lastLoginAt)}</td>
                    <td className="px-6 py-4 text-gray-500">{formatISTDate(s.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toggleStatus(s._id, s.isActive)}
                        className={`text-sm font-medium hover:underline ${s.isActive ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {s.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
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
