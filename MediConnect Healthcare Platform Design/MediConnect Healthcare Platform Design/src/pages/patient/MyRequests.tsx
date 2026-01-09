import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Clock, CheckCircle, XCircle, Calendar, User, ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { projectId } from '../../utils/supabase/info';

interface MyRequestsProps {
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

export default function MyRequests({ navigate, onLogout, accessToken, currentUser }: MyRequestsProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      fetchRequests();
    }
  }, [accessToken]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const data = await apiCall('/requests/my-requests', accessToken!);
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) {
      return;
    }

    try {
      await apiCall('/requests/cancel', accessToken!, {
        method: 'POST',
        body: JSON.stringify({ requestId }),
      });
      
      fetchRequests(); // Refresh the list
    } catch (error: any) {
      alert(error.message || 'Failed to cancel request');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'sent':
        return {
          color: 'bg-blue-100 text-blue-700',
          icon: <Clock className="w-4 h-4" />,
          label: 'Sent',
        };
      case 'accepted':
        return {
          color: 'bg-green-100 text-green-700',
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Accepted',
        };
      case 'completed':
        return {
          color: 'bg-purple-100 text-purple-700',
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Completed',
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-700',
          icon: <XCircle className="w-4 h-4" />,
          label: 'Cancelled',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-700',
          icon: <Clock className="w-4 h-4" />,
          label: status,
        };
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Heart, route: 'patient-dashboard' },
    { id: 'search', label: 'Search Assistants', icon: User, route: 'search-assistant' },
  ];

 
    /* ================= ONLY SORTING ================= */

    const activeRequests = requests
    .filter(r => r.status !== 'cancelled' && r.status !== 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pastRequests = requests
    .filter(r => r.status === 'cancelled' || r.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <DashboardLayout
      userRole="patient"
      userName={currentUser?.name || 'Patient'}
      onLogout={onLogout}
      navigate={navigate}
    >
      <div className="p-8">
        <div className="space-y-6">
          {/* Active Requests */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
              <h3 className="font-semibold text-gray-900">
                Active Requests
                {activeRequests.length > 0 && (
                  <span className="ml-2 text-sm text-gray-600">({activeRequests.length})</span>
                )}
              </h3>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600">Loading requests...</p>
              </div>
            ) : activeRequests.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No active requests</p>
                <p className="text-sm mb-4">Send a request to a medical assistant to get started</p>
                <button
                  onClick={() => navigate('search-assistant')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Search Assistants
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {activeRequests.map((request) => {
                  const statusConfig = getStatusConfig(request.status);

                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{request.assistantName}</h4>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Requested: {new Date(request.createdAt).toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>

                            {request.scheduledDate && (
                              <p className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="w-4 h-4" />
                                Scheduled: {new Date(request.scheduledDate).toLocaleDateString('en-US', { 
                                  month: 'long', 
                                  day: 'numeric', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}

                            {request.acceptedAt && (
                              <p className="text-green-600">
                                Accepted on {new Date(request.acceptedAt).toLocaleDateString('en-US', { 
                                  month: 'long', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </p>
                            )}
                          </div>
                        </div>

                        {request.status === 'sent' && (
                          <button
                            onClick={() => handleCancelRequest(request.id)}
                            className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                          >
                            Cancel Request
                          </button>
                        )}
                      </div>

                      {request.status === 'sent' && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            ⏳ Waiting for {request.assistantName} to accept this request
                          </p>
                        </div>
                      )}

                      {request.status === 'accepted' && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            ✅ Visit scheduled! The medical assistant will visit you soon.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Requests */}
          {pastRequests.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  Past Requests
                  <span className="ml-2 text-sm text-gray-600">({pastRequests.length})</span>
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {pastRequests.map((request) => {
                  const statusConfig = getStatusConfig(request.status);

                  return (
                    <div key={request.id} className="p-6 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">{request.assistantName}</h4>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600">
                            {new Date(request.createdAt).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}