import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Inbox, Clock, CheckCircle, Calendar, Upload, Settings, User, Activity } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { projectId } from '../../utils/supabase/info';

interface AssistantDashboardProps {
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

export default function AssistantDashboard({ navigate, onLogout, accessToken, currentUser }: AssistantDashboardProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [medicalData, setMedicalData] = useState({
    bloodPressure: '',
    bloodSugar: '',
    heartRate: '',
    temperature: '',
    notes: '',
  });

  useEffect(() => {
    if (accessToken) {
      fetchData();
    }
  }, [accessToken]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch requests for this assistant
      const requestsData = await apiCall('/requests/for-assistant', accessToken!);
      setRequests(requestsData.requests || []);

      // Fetch uploaded reports
      const reportsData = await apiCall('/reports/my-uploads', accessToken!);
      setReports(reportsData.reports || []);
    } catch (error) {
      console.error('Error fetching assistant data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest || !scheduledDate) return;

    try {
      await apiCall('/requests/accept', accessToken!, {
        method: 'POST',
        body: JSON.stringify({
          requestId: selectedRequest.id,
          scheduledDate,
        }),
      });

      setShowAcceptModal(false);
      setSelectedRequest(null);
      setScheduledDate('');
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to accept request');
    }
  };

  const handleUploadReport = async () => {
    if (!selectedRequest) return;

    // Validate required fields
    if (!medicalData.bloodPressure || !medicalData.bloodSugar || !medicalData.heartRate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await apiCall('/reports/upload', accessToken!, {
        method: 'POST',
        body: JSON.stringify({
          requestId: selectedRequest.id,
          medicalData,
        }),
      });

      setShowUploadModal(false);
      setSelectedRequest(null);
      setMedicalData({
        bloodPressure: '',
        bloodSugar: '',
        heartRate: '',
        temperature: '',
        notes: '',
      });
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to upload report');
    }
  };

  const menuItems = [
    { 
      id: 'requests', 
      label: 'New Requests', 
      icon: Inbox, 
      count: requests.filter(r => r.status === 'sent').length 
    },
    { 
      id: 'visits', 
      label: 'Pending Visits', 
      icon: Clock, 
      count: requests.filter(r => r.status === 'accepted').length 
    },
    { 
      id: 'completed', 
      label: 'Completed Visits', 
      icon: CheckCircle, 
      count: requests.filter(r => r.status === 'completed').length 
    },
    { 
      id: 'reports', 
      label: 'My Reports', 
      icon: Activity, 
      count: reports.length 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      route: 'settings' 
    },
  ];

  const newRequests = requests.filter(r => r.status === 'sent');
  const pendingVisits = requests.filter(r => r.status === 'accepted');
  const completedVisits = requests.filter(r => r.status === 'completed');

  return (
    <DashboardLayout
      userRole="assistant"
      userName={
        currentUser?.user_metadata?.name ||
        currentUser?.name ||
        (currentUser?.email ? currentUser.email.split('@')[0] : 'Assistant')
      }
      onLogout={onLogout}
      navigate={navigate}
    >
      <div className="p-8">
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">New Requests</span>
                <Inbox className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{newRequests.length}</div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Pending Visits</span>
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{pendingVisits.length}</div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Completed</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{completedVisits.length}</div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Reports</span>
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{reports.length}</div>
            </div>
          </div>

          {/* New Requests */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
              <h3 className="font-semibold text-gray-900">
                New Requests
                {newRequests.length > 0 && (
                  <span className="ml-2 text-sm text-gray-600">({newRequests.length})</span>
                )}
              </h3>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600">Loading requests...</p>
              </div>
            ) : newRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">No new requests</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {newRequests.map((request) => (
                  <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{request.patientName}</h4>
                        <p className="text-sm text-gray-600">
                          Requested on {new Date(request.createdAt).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowAcceptModal(true);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Visits */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
              <h3 className="font-semibold text-gray-900">
                Pending Visits
                {pendingVisits.length > 0 && (
                  <span className="ml-2 text-sm text-gray-600">({pendingVisits.length})</span>
                )}
              </h3>
            </div>

            {pendingVisits.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">No pending visits</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pendingVisits.map((visit) => (
                  <div key={visit.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{visit.patientName}</h4>
                        <p className="text-sm text-gray-600">
                          Scheduled: {new Date(visit.scheduledDate).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRequest(visit);
                          setShowUploadModal(true);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Data
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Visits */}
          {completedVisits.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  Completed Visits
                  <span className="ml-2 text-sm text-gray-600">({completedVisits.length})</span>
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {completedVisits.slice(0, 5).map((visit) => (
                  <div key={visit.id} className="p-6 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">{visit.patientName}</h4>
                        <p className="text-sm text-gray-600">
                          Completed on {new Date(visit.completedAt || visit.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accept Request Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Accept Request</h3>
            <p className="text-gray-600 mb-6">
              Schedule a visit for <strong>{selectedRequest?.patientName}</strong>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAcceptModal(false);
                  setSelectedRequest(null);
                  setScheduledDate('');
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptRequest}
                disabled={!scheduledDate}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Upload Medical Data Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full my-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Medical Data</h3>
            <p className="text-gray-600 mb-6">
              Patient: <strong>{selectedRequest?.patientName}</strong>
            </p>

            <div className="space-y-4 mb-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Pressure <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={medicalData.bloodPressure}
                    onChange={(e) => setMedicalData({ ...medicalData, bloodPressure: e.target.value })}
                    placeholder="e.g., 120/80"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Sugar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={medicalData.bloodSugar}
                    onChange={(e) => setMedicalData({ ...medicalData, bloodSugar: e.target.value })}
                    placeholder="e.g., 95 mg/dL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heart Rate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={medicalData.heartRate}
                    onChange={(e) => setMedicalData({ ...medicalData, heartRate: e.target.value })}
                    placeholder="e.g., 72 BPM"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature
                  </label>
                  <input
                    type="text"
                    value={medicalData.temperature}
                    onChange={(e) => setMedicalData({ ...medicalData, temperature: e.target.value })}
                    placeholder="e.g., 98.6°F"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes / Observations
                </label>
                <textarea
                  value={medicalData.notes}
                  onChange={(e) => setMedicalData({ ...medicalData, notes: e.target.value })}
                  placeholder="Any additional observations or patient complaints..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedRequest(null);
                  setMedicalData({
                    bloodPressure: '',
                    bloodSugar: '',
                    heartRate: '',
                    temperature: '',
                    notes: '',
                  });
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadReport}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Report
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}