import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Stethoscope,
  Pill,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { projectId } from '../../utils/supabase/info';

interface ViewReportsProps {
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

export default function ViewReports({
  navigate,
  onLogout,
  accessToken,
  currentUser,
}: ViewReportsProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (accessToken) fetchReviews();
  }, [accessToken]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const data = await apiCall('/reports/my-reviews', accessToken!);

      // ✅ Sort latest first
      const sorted = (data.reviews || []).sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setReviews(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Safe vitals getter (supports multiple backend shapes)
  const vitals =
    selectedReview?.medicalData ||
    selectedReview?.report?.medicalData ||
    {};

  return (
    <DashboardLayout
      userRole="patient"
      userName={currentUser?.name || 'Patient'}
      onLogout={onLogout}
      navigate={navigate}
    >
      <motion.div className="p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ================= LEFT: REPORT LIST ================= */}
          <div className="lg:col-span-1 bg-white rounded-2xl border overflow-hidden shadow-sm">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <h3 className="font-semibold">
                Medical Reports ({reviews.length})
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Latest reports appear first
              </p>
            </div>

            {isLoading && (
              <div className="p-10 text-center text-gray-500">
                Loading reports...
              </div>
            )}

            {!isLoading && reviews.length === 0 && (
              <div className="p-10 text-center">
                <FileText className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                No reports available
              </div>
            )}

            <div className="max-h-[620px] overflow-y-auto divide-y">
              {reviews.map((review) => (
                <button
                  key={review.id}
                  onClick={() => setSelectedReview(review)}
                  className={`w-full p-4 text-left transition ${
                    selectedReview?.id === review.id
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        Dr. {review.doctorName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ================= RIGHT: REPORT DETAILS ================= */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {!selectedReview && (
                <motion.div
                  key="empty"
                  className="bg-white border rounded-2xl p-14 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  Select a report to view details
                </motion.div>
              )}

              {selectedReview && (
                <motion.div
                  key="details"
                  className="space-y-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Header */}
                  <div className="bg-white border rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                          Medical Report
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </h3>
                        <p className="text-sm text-gray-500">
                          Reviewed on {new Date(selectedReview.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Doctor</p>
                        <p className="font-semibold">
                          Dr. {selectedReview.doctorName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ================= VITALS ================= */}
                  {Object.keys(vitals).length > 0 && (
                    <div className="bg-white border rounded-2xl p-6 shadow-sm">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Patient Vitals (Recorded by Assistant)
                      </h4>

                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <Vital label="Blood Pressure" value={vitals.bloodPressure} unit="mmHg" />
                        <Vital label="Heart Rate" value={vitals.heartRate} unit="bpm" />
                        <Vital label="Temperature" value={vitals.temperature} unit="°C" />
                        <Vital label="Blood Sugar" value={vitals.bloodSugar} unit="mg/dL" />
                      </div>

                      {vitals.notes && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-xl border">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Assistant Notes
                          </p>
                          <p className="text-sm text-gray-600">{vitals.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <Section icon={AlertCircle} title="Diagnosis" color="blue" content={selectedReview.diagnosis || 'No diagnosis provided'} />

                  {selectedReview.prescription && (
                    <Section icon={Pill} title="Prescription" color="green" content={selectedReview.prescription} />
                  )}

                  {selectedReview.advice && (
                    <Section icon={Stethoscope} title="Medical Advice" color="purple" content={selectedReview.advice} />
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-sm text-yellow-800">
                      This report is for informational purposes only. Consult your healthcare provider.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </motion.div>
    </DashboardLayout>
  );
}

/* ================= Reusable Components ================= */

function Vital({ label, value, unit }: any) {
  if (!value) return null;
  return (
    <div className="p-4 bg-gray-50 border rounded-xl">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        <span className="text-sm text-gray-500 ml-1">{unit}</span>
      </p>
    </div>
  );
}

function Section({ icon: Icon, title, content, color }: any) {
  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
    </div>
  );
}
