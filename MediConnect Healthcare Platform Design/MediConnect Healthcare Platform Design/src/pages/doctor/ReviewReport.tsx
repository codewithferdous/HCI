import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Pill,
  Stethoscope,
} from 'lucide-react';
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
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default function ReviewReport({
  navigate,
  onLogout,
  accessToken,
  currentUser,
}: DoctorDashboardProps) {
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [reviewData, setReviewData] = useState({
    diagnosis: '',
    prescription: '',
    advice: '',
  });

  useEffect(() => {
    if (accessToken) fetchReports();
  }, [accessToken]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/reports/pending', accessToken!);
      setPendingReports(data.reports || []);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!reviewData.diagnosis) return alert('Diagnosis required');

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
      fetchReports();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <DashboardLayout
      userRole="doctor"
      userName={
        currentUser?.user_metadata?.name ||
        currentUser?.name ||
        currentUser?.email?.split('@')[0] ||
        'Doctor'
      }
      onLogout={onLogout}
      navigate={navigate}
    >
      {/* ================= PENDING LIST ================= */}
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Pending Medical Reports
        </h1>

        {loading ? (
          <div className="text-center py-16 text-gray-600">Loading…</div>
        ) : pendingReports.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No pending reports
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-gray-200 p-6 flex justify-between items-center hover:shadow-md transition"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {report.patientName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Uploaded by {report.assistantName} on{' '}
                    {new Date(report.uploadedAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedReport(report);
                    setShowReviewModal(true);
                  }}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= REVIEW MODAL ================= */}
      {showReviewModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-4xl w-full"
          >
            {/* Header */}
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {selectedReport.patientName}
            </h2>
            <p className="text-gray-600 mb-6">
              Uploaded by {selectedReport.assistantName} on{' '}
              {new Date(selectedReport.uploadedAt).toLocaleDateString()}
            </p>

            {/* ================= VITALS (LIKE SCREENSHOT) ================= */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-blue-600">Blood Pressure</p>
                <p className="text-lg font-semibold">
                  {selectedReport.medicalData?.bloodPressure}
                </p>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs text-green-600">Blood Sugar</p>
                <p className="text-lg font-semibold">
                  {selectedReport.medicalData?.bloodSugar}
                </p>
              </div>

              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-xs text-red-600">Heart Rate</p>
                <p className="text-lg font-semibold">
                  {selectedReport.medicalData?.heartRate}
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-xs text-purple-600">Temperature</p>
                <p className="text-lg font-semibold">
                  {selectedReport.medicalData?.temperature}
                </p>
              </div>
            </div>

            {selectedReport.medicalData?.notes && (
              <div className="mb-8">
                <p className="text-sm text-gray-600">Notes:</p>
                <p className="text-gray-800">{selectedReport.medicalData.notes}</p>
              </div>
            )}

            {/* ================= REVIEW FORM ================= */}
            <div className="max-w-2xl mx-auto space-y-5 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertCircle className="inline w-4 h-4 mr-1" />
                  Diagnosis *
                </label>
                <textarea
                  rows={3}
                  value={reviewData.diagnosis}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, diagnosis: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Pill className="inline w-4 h-4 mr-1" />
                  Prescription
                </label>
                <textarea
                  rows={3}
                  value={reviewData.prescription}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, prescription: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Stethoscope className="inline w-4 h-4 mr-1" />
                  Medical Advice
                </label>
                <textarea
                  rows={3}
                  value={reviewData.advice}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, advice: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedReport(null);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={submitReview}
                disabled={!reviewData.diagnosis}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
              >
                <CheckCircle className="inline w-4 h-4 mr-1" />
                Submit Review
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
