import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Search,
  MapPin,
  User,
  Send,
  CheckCircle,
  X
} from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { projectId } from '../../utils/supabase/info';

interface SearchAssistantProps {
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

export default function SearchAssistant({
  navigate,
  onLogout,
  accessToken,
  currentUser,
}: SearchAssistantProps) {
  const [searchFilters, setSearchFilters] = useState({ area: '', name: '' });
  const [assistants, setAssistants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) searchAssistants();
  }, [accessToken]);

  const searchAssistants = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchFilters.area) params.append('area', searchFilters.area);
      if (searchFilters.name) params.append('name', searchFilters.name);

      const data = await apiCall(`/assistants/search?${params}`, accessToken!);
      setAssistants(data.assistants || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async (assistant: any) => {
    try {
      await apiCall('/requests/send', accessToken!, {
        method: 'POST',
        body: JSON.stringify({ assistantId: assistant.id }),
      });

      setSentRequests(prev => [...prev, assistant.id]);
      setToast(`Request successfully sent to ${assistant.name}`);

      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to send request');
    }
  };

  return (
    <DashboardLayout
      userRole="patient"
      userName={currentUser?.name || 'Patient'}
      onLogout={onLogout}
      navigate={navigate}
    >
      {/* ================= TOAST NOTIFICATION ================= */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-white border border-green-200 shadow-xl rounded-xl px-5 py-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Success</p>
              <p className="text-sm text-gray-600">{toast}</p>
            </div>
            <button onClick={() => setToast(null)}>
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= ORIGINAL UI (UNCHANGED) ================= */}
      <div className="p-8">
        <div className="space-y-6">

          {/* Search Filters */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Search Filters</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Area / Location
                </label>
                <input
                  value={searchFilters.area}
                  onChange={(e) => setSearchFilters({ ...searchFilters, area: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Assistant Name
                </label>
                <input
                  value={searchFilters.name}
                  onChange={(e) => setSearchFilters({ ...searchFilters, name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={searchAssistants}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl"
            >
              <Search className="inline w-4 h-4 mr-2" />
              Search
            </motion.button>
          </div>

          {/* Results */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="font-semibold">Available Medical Assistants</h3>
            </div>

            {assistants.map((assistant) => {
              const sent = sentRequests.includes(assistant.id);

              return (
                <div key={assistant.id} className="p-6 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <h4 className="font-semibold">{assistant.name}</h4>
                    <p className="text-sm text-gray-600">{assistant.email}</p>
                  </div>

                  <motion.button
                    disabled={sent}
                    onClick={() => !sent && handleSendRequest(assistant)}
                    className={`px-6 py-3 rounded-xl flex items-center gap-2 ${
                      sent
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gradient-to-r from-blue-600 to-teal-500 text-white'
                    }`}
                  >
                    {sent ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    {sent ? 'Request Sent' : 'Send Request'}
                  </motion.button>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
