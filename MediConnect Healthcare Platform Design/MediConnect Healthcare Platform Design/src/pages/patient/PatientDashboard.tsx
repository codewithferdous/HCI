import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  FileText,
  Clock,
  CheckCircle,
  Activity,
  User
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';


import { DashboardLayout } from '../../components/DashboardLayout';
import { projectId } from '../../utils/supabase/info';

interface PatientDashboardProps {
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

export default function PatientDashboard({
  navigate,
  onLogout,
  accessToken,
  currentUser,
}: PatientDashboardProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (accessToken) fetchData();
  }, [accessToken]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const req = await apiCall('/requests/my-requests', accessToken!);
      const rev = await apiCall('/reports/my-reviews', accessToken!);
      setRequests(req.requests || []);
      setReviews(rev.reviews || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  /* ===================== GRAPH DATA ===================== */

  const statusData = [
    { status: 'Sent', count: requests.filter(r => r.status === 'sent').length },
    { status: 'Accepted', count: requests.filter(r => r.status === 'accepted').length },
    { status: 'Completed', count: requests.filter(r => r.status === 'completed').length },
    { status: 'Cancelled', count: requests.filter(r => r.status === 'cancelled').length },
  ];

  const monthlyData = (() => {
    const map: any = {};
    requests.forEach(r => {
      const m = new Date(r.createdAt).toLocaleString('default', { month: 'short' });
      map[m] = map[m] || { month: m, requests: 0, reports: 0 };
      map[m].requests++;
    });
    reviews.forEach(r => {
      const m = new Date(r.createdAt).toLocaleString('default', { month: 'short' });
      map[m] = map[m] || { month: m, requests: 0, reports: 0 };
      map[m].reports++;
    });
    return Object.values(map);
  })();

  return (
    <DashboardLayout
      userRole="patient"
      userName={currentUser?.name || 'Patient'}
      onLogout={onLogout}
      navigate={navigate}
    >
      <motion.div
        className="p-8 space-y-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >

        {/* ================= STATS ================= */}
        <div className="grid md:grid-cols-4 gap-4">
          <StatCard title="Total Requests" value={requests.length} icon={User} />
          <StatCard title="Pending" value={requests.filter(r => r.status !== 'completed').length} icon={Clock} />
          <StatCard title="Completed" value={requests.filter(r => r.status === 'completed').length} icon={CheckCircle} />
          <StatCard title="Reports" value={reviews.length} icon={FileText} />
        </div>

        {/* ================= GRAPHS ================= */}
        {/* ================= GRAPHS ================= */}
<div className="grid lg:grid-cols-2 gap-6">

{/* Requests Status */}
<motion.div
  className="bg-white rounded-2xl border p-6"
  whileHover={{ scale: 1.01 }}
>
  <h3 className="font-semibold mb-4">Requests Status Overview</h3>

  <ResponsiveContainer width="100%" height={260}>
    <BarChart data={statusData}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
      <XAxis dataKey="status" />
      <YAxis />
      <Tooltip />

      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
        {statusData.map((_, index) => (
          <Cell
            key={index}
            fill={
              index === 0 ? '#3B82F6' :   // Sent - Blue
              index === 1 ? '#14B8A6' :   // Accepted - Teal
              index === 2 ? '#22C55E' :   // Completed - Green
              '#EF4444'                  // Cancelled - Red
            }
          />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</motion.div>

{/* Activity Trend */}
<motion.div
  className="bg-white rounded-2xl border p-6"
  whileHover={{ scale: 1.01 }}
>
  <h3 className="font-semibold mb-4">Monthly Activity Trend</h3>

  <ResponsiveContainer width="100%" height={260}>
    <LineChart data={monthlyData}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />

      <Line
        type="monotone"
        dataKey="requests"
        stroke="#3B82F6"
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />

      <Line
        type="monotone"
        dataKey="reports"
        stroke="#8B5CF6"
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />
    </LineChart>
  </ResponsiveContainer>
</motion.div>

</div>


        {/* ================= QUICK ACTIONS ================= */}
        <div className="grid md:grid-cols-3 gap-4">
          <ActionCard
            title="Search Assistants"
            subtitle="Find medical assistance near you"
            icon={Search}
            color="from-blue-500 to-blue-600"
            onClick={() => navigate('search-assistant')}
          />
          <ActionCard
            title="My Requests"
            subtitle="Track your active requests"
            icon={Clock}
            color="from-teal-500 to-teal-600"
            onClick={() => navigate('my-requests')}
          />
          <ActionCard
            title="Medical Reports"
            subtitle="View doctor-reviewed reports"
            icon={FileText}
            color="from-green-500 to-green-600"
            onClick={() => navigate('view-reports')}
          />
        </div>

      </motion.div>
    </DashboardLayout>
  );
}

/* ================= REUSABLE COMPONENTS ================= */

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <motion.div
      className="bg-white rounded-2xl border p-6"
      whileHover={{ y: -4 }}
    >
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-500">{title}</span>
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </motion.div>
  );
}

function ActionCard({ title, subtitle, icon: Icon, color, onClick }: any) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`p-6 rounded-2xl text-white text-left bg-gradient-to-br ${color} shadow-lg`}
    >
      <Icon className="w-8 h-8 mb-3" />
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm opacity-90">{subtitle}</p>
    </motion.button>
  );
}
