import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  Upload,
  User,
  Activity,
  TrendingUp,
  Heart,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { projectId } from '../../utils/supabase/info';

interface UploadReadingsProps {
  navigate: (route: string) => void;
  onLogout: () => void;
  accessToken: string | null;
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

export default function UploadReadings({
  navigate,
  onLogout,
  accessToken,
}: UploadReadingsProps) {
  const [pendingVisits, setPendingVisits] = useState<any[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const [medicalData, setMedicalData] = useState({
    bloodPressure: '',
    bloodSugar: '',
    heartRate: '',
    temperature: '',
    notes: '',
  });

  useEffect(() => {
    if (accessToken) fetchPendingVisits();
  }, [accessToken]);

  const fetchPendingVisits = async () => {
    try {
      setIsLoading(true);
      const data = await apiCall('/requests/for-assistant', accessToken!);
      setPendingVisits((data.requests || []).filter((r: any) => r.status === 'accepted'));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const submitReadings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;

    await apiCall('/reports/upload', accessToken!, {
      method: 'POST',
      body: JSON.stringify({
        requestId: selectedVisit.id,
        medicalData,
      }),
    });

    setSubmitted(true);
    setTimeout(() => navigate('assistant-dashboard'), 2500);
  };

 /* ================= SUCCESS ================= */
if (submitted) {
  return (
    <DashboardLayout
      userRole="assistant"
      userName="Assistant"
      onLogout={onLogout}
      navigate={navigate}
    >
      <div className="min-h-[75vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="
            bg-white rounded-3xl
            p-12 max-w-md w-full
            shadow-xl border border-gray-200
            text-center relative overflow-hidden
          "
        >
          {/* subtle success glow */}
          <div className="
            absolute inset-0
            bg-green-500/5
            pointer-events-none
          " />

          {/* Animated success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            className="
              w-24 h-24
              bg-green-600
              rounded-full
              flex items-center justify-center
              mx-auto mb-6
              shadow-lg
            "
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-bold text-gray-900 mb-3"
          >
            Report Uploaded Successfully
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-gray-600 leading-relaxed mb-8"
          >
            The patient’s medical readings have been securely submitted.
            A doctor will review the report shortly.
          </motion.p>

          {/* Progress feedback */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.5 }}
            className="h-1 bg-green-600 rounded-full mb-4"
          />

          <p className="text-sm text-gray-500">
            Redirecting you back to the dashboard…
          </p>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}


  return (
    <DashboardLayout userRole="assistant" userName="Assistant" onLogout={onLogout} navigate={navigate}>
      <div className="p-8 max-w-6xl mx-auto space-y-10">

        {/* ================= PENDING VISITS (EXTRACTED) ================= */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Pending Visits
            </h3>
            <p className="text-sm text-gray-600">
              Accepted visits waiting for readings
            </p>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading visits…</div>
          ) : pendingVisits.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No pending visits available
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingVisits.map((visit) => (
                <motion.div
                  key={visit.id}
                  whileHover={{ scale: 1.01 }}
                  className="p-6 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {visit.patientName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Scheduled: {new Date(visit.scheduledDate).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <motion.button
  onClick={() => setSelectedVisit(visit)}
  whileHover={{
    scale: 1.05,
    boxShadow: '0px 8px 24px rgba(37, 99, 235, 0.35)',
  }}
  whileTap={{
    scale: 0.95,
  }}
  transition={{
    type: 'spring',
    stiffness: 300,
    damping: 18,
  }}
  className="
    relative overflow-hidden
    px-6 py-2.5 rounded-xl
    bg-blue-600 text-white
    font-semibold
    focus:outline-none
    focus:ring-2 focus:ring-blue-400
  "
>
  {/* subtle shine animation */}
  <span className="
    absolute inset-0
    bg-white/10
    opacity-0
    hover:opacity-100
    transition-opacity
  " />

  <span className="relative z-10 flex items-center gap-2">
    <Upload className="w-4 h-4" />
    Upload Readings
  </span>
</motion.button>

                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ================= UPLOAD FORM ================= */}
        {selectedVisit && (
          <motion.form
            onSubmit={submitReadings}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-md p-8 space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900">
              Upload Readings for {selectedVisit.patientName}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Input label="Blood Pressure" icon={<Activity />} value={medicalData.bloodPressure}
                onChange={(v) => setMedicalData({ ...medicalData, bloodPressure: v })} />
              <Input label="Blood Sugar" icon={<TrendingUp />} value={medicalData.bloodSugar}
                onChange={(v) => setMedicalData({ ...medicalData, bloodSugar: v })} />
              <Input label="Heart Rate" icon={<Heart />} value={medicalData.heartRate}
                onChange={(v) => setMedicalData({ ...medicalData, heartRate: v })} />
              <Input label="Temperature" icon={<TrendingUp />} value={medicalData.temperature}
                onChange={(v) => setMedicalData({ ...medicalData, temperature: v })} />
            </div>

            <textarea
              rows={4}
              placeholder="Additional notes"
              value={medicalData.notes}
              onChange={(e) => setMedicalData({ ...medicalData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setSelectedVisit(null)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                Submit Readings
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ================= INPUT ================= */
function Input({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        {icon}
        {label}
      </label>
      <input
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
