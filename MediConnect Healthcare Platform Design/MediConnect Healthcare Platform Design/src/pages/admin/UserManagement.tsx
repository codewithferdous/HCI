import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Search, CheckCircle, XCircle, Clock, User, Stethoscope, ClipboardList } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { projectId } from '../../utils/supabase/info';

interface UserManagementProps {
  navigate: (route: string) => void;
  onLogout: () => void;
  accessToken: string | null;
  currentUser: any;
}

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6a2478ef`;

async function apiCall(endpoint: string, accessToken: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export default function UserManagement({ navigate, onLogout, accessToken, currentUser }: UserManagementProps) {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, doctor, assistant, pending, approved

  useEffect(() => {
    if (accessToken) {
      fetchUsers();
    }
  }, [accessToken]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await apiCall('/users/pending', accessToken!);
      setPendingUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!confirm('Approve this user?')) return;

    try {
      await apiCall('/users/approve', accessToken!, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      fetchUsers();
    } catch (error: any) {
      alert(error.message || 'Failed to approve user');
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Reject this user?')) return;

    try {
      await apiCall('/users/reject', accessToken!, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      fetchUsers();
    } catch (error: any) {
      alert(error.message || 'Failed to reject user');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor': return <Stethoscope className="w-4 h-4" />;
      case 'assistant': return <ClipboardList className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor': return 'bg-green-100 text-green-700';
      case 'assistant': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredUsers = pendingUsers.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'pending') return user.status === 'pending';
    if (filter === 'approved') return user.status === 'approved';
    if (filter === 'doctor' || filter === 'assistant') return user.role === filter;
    return true;
  });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Shield, route: 'admin-dashboard' },
  ];

  return (
    <DashboardLayout
      userRole="admin"
      userName={
        currentUser?.user_metadata?.name ||
        currentUser?.name ||
        (currentUser?.email ? currentUser.email.split('@')[0] : 'Admin')
      }
      onLogout={onLogout}
      navigate={navigate}
    >
      <div className="p-8">
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Users' },
                { id: 'pending', label: 'Pending' },
                { id: 'doctor', label: 'Doctors' },
                { id: 'assistant', label: 'Assistants' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === f.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Total Users</span>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{pendingUsers.length}</div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Pending</span>
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {pendingUsers.filter(u => u.status === 'pending').length}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Doctors</span>
                <Stethoscope className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {pendingUsers.filter(u => u.role === 'doctor').length}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Assistants</span>
                <ClipboardList className="w-5 h-5 text-teal-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {pendingUsers.filter(u => u.role === 'assistant').length}
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                {filter === 'all' ? 'All Users' : 
                 filter === 'pending' ? 'Pending Approvals' :
                 filter === 'doctor' ? 'Doctors' :
                 filter === 'assistant' ? 'Medical Assistants' : 'Users'}
                {filteredUsers.length > 0 && (
                  <span className="ml-2 text-sm text-gray-600">({filteredUsers.length})</span>
                )}
              </h3>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No users found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{user.name}</h4>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            {user.role}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {user.status === 'pending' && <Clock className="w-3 h-3" />}
                            {user.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                            {user.status === 'rejected' && <XCircle className="w-3 h-3" />}
                            {user.status}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-1">{user.email}</p>
                        
                        {user.phone && (
                          <p className="text-sm text-gray-600">Phone: {user.phone}</p>
                        )}
                        
                        {user.area && (
                          <p className="text-sm text-gray-600">Area: {user.area}</p>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                          Registered: {new Date(user.createdAt).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>

                        {user.approvedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Approved: {new Date(user.approvedAt).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        )}

                        {user.rejectedAt && (
                          <p className="text-xs text-red-600 mt-1">
                            Rejected: {new Date(user.rejectedAt).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        )}
                      </div>

                      {user.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleApprove(user.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(user.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}