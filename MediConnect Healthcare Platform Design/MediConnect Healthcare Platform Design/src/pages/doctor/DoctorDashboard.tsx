import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Stethoscope, FileText, CheckCircle, Clock, Settings, AlertCircle, Pill, Activity } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { projectId } from '../../utils/supabase/info';

interface DoctorDashboardProps {
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

export default function DoctorDashboard({ navigate, onLogout, accessToken, currentUser }: DoctorDashboardProps) {
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [reviewedReports, setReviewedReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    diagnosis: '',
    prescription: '',
    advice: '',
  });

  useEffect(() => {
    if (accessToken) {
      fetchData();
    }
  }, [accessToken]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch pending reports
      const pendingData = await apiCall('/reports/pending', accessToken!);
      setPendingReports(pendingData.reports || []);

      // Fetch reviewed reports
      const reviewedData = await apiCall('/reports/reviewed', accessToken!);
      setReviewedReports(reviewedData.reviews || []);
    } catch (error) {
      console.error('Error fetching doctor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedReport || !reviewData.diagnosis) {
      alert('Please provide at least a diagnosis');
      return;
    }

    try {
      await apiCall('/reviews/create', accessToken!, {
        method: 'POST',
        body: JSON.stringify({
          reportId: selectedReport.id,
          ...reviewData,
        }),
      });

      setShowReviewModal(false);
      setSelectedReport(null);
      setReviewData({ diagnosis: '', prescription: '', advice: '' });
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to submit review');
    }
  };

  const menuItems = [
    { 
      id: 'pending', 
      label: 'Pending Reports', 
      icon: Clock, 
      count: pendingReports.length 
    },
    { 
      id: 'reviewed', 
      label: 'Reviewed Reports', 
      icon: CheckCircle, 
      count: reviewedReports.length 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      route: 'settings' 
    },
  ];

  return (
    <DashboardLayout
      userRole="doctor"
      userName={
        currentUser?.user_metadata?.name ||
        currentUser?.name ||
        (currentUser?.email ? currentUser.email.split('@')[0] : 'Doctor')
      }
      onLogout={onLogout}
      navigate={navigate}
    >
      <div className="p-8">
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Pending Reports</span>
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{pendingReports.length}</div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Reviewed</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{reviewedReports.length}</div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Total Reviews</span>
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{pendingReports.length + reviewedReports.length}</div>
            </div>
          </div>

          {/* Pending Reports */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
              <h3 className="font-semibold text-gray-900">
                Pending Reports for Review
                {pendingReports.length > 0 && (
                  <span className="ml-2 text-sm text-gray-600">({pendingReports.length})</span>
                )}
              </h3>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600">Loading reports...</p>
              </div>
            ) : pendingReports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">No pending reports</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pendingReports.map((report) => (
                  <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">{report.patientName}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Uploaded by {report.assistantName} on {new Date(report.uploadedAt).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>

                        {report.medicalData && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            {report.medicalData.bloodPressure && (
                              <div className="bg-blue-50 px-3 py-2 rounded-lg">
                                <p className="text-xs text-blue-600">Blood Pressure</p>
                                <p className="font-medium text-gray-900 text-sm">{report.medicalData.bloodPressure}</p>
                              </div>
                            )}
                            {report.medicalData.bloodSugar && (
                              <div className="bg-green-50 px-3 py-2 rounded-lg">
                                <p className="text-xs text-green-600">Blood Sugar</p>
                                <p className="font-medium text-gray-900 text-sm">{report.medicalData.bloodSugar}</p>
                              </div>
                            )}
                            {report.medicalData.heartRate && (
                              <div className="bg-red-50 px-3 py-2 rounded-lg">
                                <p className="text-xs text-red-600">Heart Rate</p>
                                <p className="font-medium text-gray-900 text-sm">{report.medicalData.heartRate}</p>
                              </div>
                            )}
                            {report.medicalData.temperature && (
                              <div className="bg-purple-50 px-3 py-2 rounded-lg">
                                <p className="text-xs text-purple-600">Temperature</p>
                                <p className="font-medium text-gray-900 text-sm">{report.medicalData.temperature}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {report.medicalData?.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Notes:</p>
                            <p className="text-sm text-gray-800">{report.medicalData.notes}</p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowReviewModal(true);
                        }}
                        className="ml-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviewed Reports */}
          {reviewedReports.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
                <h3 className="font-semibold text-gray-900">
                  Recently Reviewed
                  <span className="ml-2 text-sm text-gray-600">({reviewedReports.length})</span>
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {reviewedReports.slice(0, 5).map((review) => (
                  <div key={review.id} className="p-6 bg-green-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{review.patientName}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Reviewed on {new Date(review.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                        {review.diagnosis && (
                          <p className="text-sm text-gray-700 line-clamp-2">{review.diagnosis}</p>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Reviewed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-3xl w-full my-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Medical Report</h3>
            <p className="text-gray-600 mb-6">
              Patient: <strong>{selectedReport.patientName}</strong> | 
              Uploaded by: <strong>{selectedReport.assistantName}</strong>
            </p>

            {/* Patient Data Summary */}
            {selectedReport.medicalData && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-3">Patient Vitals</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedReport.medicalData.bloodPressure && (
                    <div>
                      <p className="text-xs text-gray-600">Blood Pressure</p>
                      <p className="font-medium text-gray-900">{selectedReport.medicalData.bloodPressure}</p>
                    </div>
                  )}
                  {selectedReport.medicalData.bloodSugar && (
                    <div>
                      <p className="text-xs text-gray-600">Blood Sugar</p>
                      <p className="font-medium text-gray-900">{selectedReport.medicalData.bloodSugar}</p>
                    </div>
                  )}
                  {selectedReport.medicalData.heartRate && (
                    <div>
                      <p className="text-xs text-gray-600">Heart Rate</p>
                      <p className="font-medium text-gray-900">{selectedReport.medicalData.heartRate}</p>
                    </div>
                  )}
                  {selectedReport.medicalData.temperature && (
                    <div>
                      <p className="text-xs text-gray-600">Temperature</p>
                      <p className="font-medium text-gray-900">{selectedReport.medicalData.temperature}</p>
                    </div>
                  )}
                </div>
                {selectedReport.medicalData.notes && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-1">Notes:</p>
                    <p className="text-sm text-gray-800">{selectedReport.medicalData.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Review Form */}
           {/* Review Form */}{/* Review Form */}
<div className="max-w-2xl mx-auto ">

{/* Diagnosis */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    <AlertCircle className="w-4 h-4 inline mr-1" />
    Diagnosis <span className="text-red-500">*</span>
  </label>
  <textarea
    value={reviewData.diagnosis}
    onChange={(e) =>
      setReviewData({ ...reviewData, diagnosis: e.target.value })
    }
    placeholder="Provide your diagnosis based on the patient data..."
    rows={3}
    className="
      w-full px-4 py-3
      border border-gray-300
      rounded-xl
      focus:ring-2 focus:ring-blue-500
      focus:border-transparent
      resize-none
    "
    required
  />
</div>

{/* Prescription */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    <Pill className="w-4 h-4 inline mr-1" />
    Prescription
  </label>
  <textarea
    value={reviewData.prescription}
    onChange={(e) =>
      setReviewData({ ...reviewData, prescription: e.target.value })
    }
    placeholder="Medication details and dosage instructions..."
    rows={3}
    className="
      w-full px-4 py-3
      border border-gray-300
      rounded-xl
      focus:ring-2 focus:ring-blue-500
      focus:border-transparent
      resize-none
    "
  />
</div>

{/* Medical Advice */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    <Stethoscope className="w-4 h-4 inline mr-1" />
    Medical Advice
  </label>
  <textarea
    value={reviewData.advice}
    onChange={(e) =>
      setReviewData({ ...reviewData, advice: e.target.value })
    }
    placeholder="General health advice and follow-up recommendations..."
    rows={3}
    className="
      w-full px-4 py-3
      border border-gray-300
      rounded-xl
      focus:ring-2 focus:ring-blue-500
      focus:border-transparent
      resize-none
    "
  />
</div>

</div>


            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedReport(null);
                  setReviewData({ diagnosis: '', prescription: '', advice: '' });
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={!reviewData.diagnosis}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Submit Review
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}