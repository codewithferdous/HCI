import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, MapPin, Phone, Clock, Calendar } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { projectId } from '../../utils/supabase/info';

interface PatientRequestsProps {
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

export default function PatientRequests({
  navigate,
  onLogout,
  accessToken,
  currentUser,
}: PatientRequestsProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [dateTime, setDateTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (accessToken) loadRequests();
  }, [accessToken]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/requests/for-assistant', accessToken!);
      setRequests((data.requests || []).filter((r: any) => r.status === 'sent'));
    } finally {
      setLoading(false);
    }
  };

  const confirmAccept = async () => {
    if (!dateTime || !selected) return;

    try {
      setSubmitting(true);
      await apiCall('/requests/accept', accessToken!, {
        method: 'POST',
        body: JSON.stringify({
          requestId: selected.id,
          scheduledDate: dateTime,
        }),
      });

      setShowModal(false);
      setSelected(null);
      setDateTime('');
      loadRequests();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Pending Patient Requests</h1>
        <p className="text-gray-500 mb-10">Requests awaiting your response</p>

        {loading ? (
          <div className="text-center py-20 text-gray-600 animate-pulse">
            Loading requests…
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No pending requests available
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="
                  bg-white rounded-2xl border border-gray-200
                  shadow-sm hover:shadow-md
                  transition-all p-6 grid md:grid-cols-2 gap-6
                "
              >
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
                    <User className="text-white w-7 h-7" />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {r.patientName}
                    </h3>

                    <div className="mt-2 text-sm space-y-1">
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        {r.address || 'Address not provided'}
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4 text-blue-600" />
                        {r.phone || 'Phone not available'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 font-medium text-gray-800">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Requested on {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setSelected(r);
                      setShowModal(true);
                    }}
                    className="
                      px-6 py-3 rounded-xl font-semibold text-white
                      bg-blue-600 hover:bg-blue-700
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      transition-all
                    "
                  >
                    Accept Request
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Confirm Visit Schedule
              </h2>

              <p className="text-gray-600 mb-6">
                Set visit time for <strong>{selected?.patientName}</strong>
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Date & Time
              </label>

              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="
                  w-full px-4 py-3 rounded-xl
                  border border-gray-300
                  focus:ring-2 focus:ring-blue-500 focus:outline-none
                "
              />

              <div className="flex gap-4 mt-8">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowModal(false)}
                  className="
                    flex-1 px-6 py-3 rounded-xl
                    border border-gray-300
                    hover:bg-gray-100 transition
                  "
                >
                  Cancel
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={confirmAccept}
                  disabled={!dateTime || submitting}
                  className="
                    flex-1 px-6 py-3 rounded-xl font-semibold text-white
                    bg-blue-600 hover:bg-blue-700
                    disabled:opacity-50 transition
                  "
                >
                  {submitting ? 'Confirming…' : 'Confirm'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
