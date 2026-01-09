import React from 'react';
import { motion } from 'motion/react';
import { ClipboardList, MapPin, Clock, User, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';

interface AssistantDashboardProps {
  navigate: (route: string) => void;
  onLogout: () => void;
  onSelectRequest: (request: any) => void;
  assistantRequests: any[];
  pendingVisits: any[];
  completedVisits: any[];
  onAcceptRequest: (request: any, scheduledDate: string) => void;
}

export default function AssistantDashboard({
  navigate,
  onLogout,
  onSelectRequest,
  assistantRequests,
  pendingVisits,
  completedVisits,
  onAcceptRequest,
}: AssistantDashboardProps) {
  const handleAccept = (request: any) => {
    const scheduledDate = 'Dec 14, 2025 • 10:00 AM';
    onAcceptRequest(request, scheduledDate);
  };

  const handleStartVisit = (visit: any) => {
    onSelectRequest(visit);
    navigate('upload-readings');
  };

  const stats = {
    completedToday: completedVisits.length,
    pendingCount: assistantRequests.length,
    scheduledVisits: pendingVisits.length,
  };

  return (
    <DashboardLayout userRole="assistant" userName="Sarah Williams" onLogout={onLogout} navigate={navigate}>
      <div className="p-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-teal-600 to-cyan-500 rounded-2xl p-8 mb-8 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Welcome, Sarah!</h1>
            <p className="text-teal-100 text-lg">
              You have {stats.pendingCount} new requests and {stats.scheduledVisits} scheduled visits
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">New</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingCount}</div>
            <div className="text-sm text-gray-600">New Requests</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium px-3 py-1 bg-blue-100 text-blue-700 rounded-full">Scheduled</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.scheduledVisits}</div>
            <div className="text-sm text-gray-600">Pending Visits</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full">Completed</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.completedToday}</div>
            <div className="text-sm text-gray-600">Completed Today</div>
          </motion.div>
        </div>

        {/* New Requests Section */}
        {assistantRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">New Patient Requests</h2>
              <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                {assistantRequests.length} Pending
              </span>
            </div>

            <div className="grid gap-6">
              {assistantRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl border-2 border-yellow-200 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">John Smith</h3>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{request.area}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Requested {request.requestDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAccept(request)}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-600 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                      >
                        Accept Request
                      </button>
                      <button className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all">
                        Decline
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Pending Visits Section */}
        {pendingVisits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Scheduled Visits</h2>
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {pendingVisits.length} Scheduled
              </span>
            </div>

            <div className="grid gap-6">
              {pendingVisits.map((visit, index) => (
                <motion.div
                  key={visit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl border-2 border-blue-200 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">John Smith</h3>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{visit.area}</span>
                          </div>
                          <div className="flex items-center gap-2 text-blue-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">{visit.scheduledDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl mb-4">
                      <p className="text-sm text-blue-800">
                        📋 Visit scheduled - Ready to upload medical readings when you complete the visit
                      </p>
                    </div>

                    <button
                      onClick={() => handleStartVisit(visit)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-teal-600 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                      Start Visit & Upload Readings
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Completed Visits Section */}
        {completedVisits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Completed Visits</h2>
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                {completedVisits.length} Completed
              </span>
            </div>

            <div className="grid gap-6">
              {completedVisits.map((visit, index) => (
                <motion.div
                  key={visit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">John Smith</h3>
                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{visit.area}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{visit.scheduledDate}</span>
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl">
                          <p className="text-sm text-green-800">
                            ✓ Visit completed and readings uploaded. Report submitted to doctor for review.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {assistantRequests.length === 0 && pendingVisits.length === 0 && completedVisits.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Requests</h3>
            <p className="text-gray-600">You don't have any pending requests or scheduled visits at the moment.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}