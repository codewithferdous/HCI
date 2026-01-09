import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Users, Clock, CheckCircle, XCircle, Settings, Activity, 
  Stethoscope, ClipboardList, User, TrendingUp, AlertCircle, 
  RefreshCw, ArrowUpDown, FileText, LogIn, UserPlus, UserMinus
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { DashboardLayout } from '../../components/DashboardLayout';
import { projectId } from '../../utils/supabase/info';

interface AdminDashboardProps {
  navigate: (route: string) => void;
  onLogout: () => void;
  accessToken: string | null;
  currentUser: any;
}

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6a2478ef`;

// Healthcare color palette
const CHART_COLORS = {
  primary: '#3B82F6',      // Blue
  secondary: '#10B981',    // Green
  accent: '#06B6D4',       // Teal
  warning: '#F59E0B',      // Amber
  danger: '#EF4444',       // Red
  purple: '#8B5CF6',       // Purple
  gradient: ['#3B82F6', '#10B981', '#06B6D4', '#8B5CF6', '#F59E0B'],
};

const PIE_COLORS = ['#3B82F6', '#10B981', '#06B6D4', '#8B5CF6', '#F59E0B'];

async function apiCall(endpoint: string, accessToken: string, options: RequestInit = {}) {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${normalizedEndpoint}`;
  
  console.log(`[API Call] ${options.method || 'GET'} ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  const raw = await response.text();
  console.log(`[API Response] Status: ${response.status}, Length: ${raw.length}`);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const parsed = JSON.parse(raw);
      message = parsed.error || message;
    } catch {
      if (raw) message = raw || message;
    }
    const error = new Error(message) as any;
    error.status = response.status;
    throw error;
  }

  try {
    const parsed = JSON.parse(raw);
    console.log(`[API Success] Response keys:`, Object.keys(parsed));
    return parsed;
  } catch (err) {
    console.error('[API Error] JSON parse error for', endpoint, 'Raw:', raw.substring(0, 200));
    throw new Error('Unexpected response format from server.');
  }
}

export default function AdminDashboard({ navigate, onLogout, accessToken, currentUser }: AdminDashboardProps) {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'all' | 'audit'>('overview');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasDataSourceFallback, setHasDataSourceFallback] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (accessToken) {
      fetchData();
    }
  }, [accessToken]);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setHasDataSourceFallback(false);
      
      // Fetch all users with comprehensive error handling
      let users: any[] = [];
      let fetchError: string | null = null;
      let usersFetchedSuccessfully = false;
      
      // Primary attempt: Fetch all users
      try {
        console.log('Fetching all users from /users/all endpoint...');
        let allUsersData;
        
        try {
          // Try the standard endpoint first
          allUsersData = await apiCall('/users/all', accessToken!);
        } catch (firstError: any) {
          // If that fails with 404, try with the full path (in case routing is different)
          if (firstError?.message?.includes('404') || firstError?.status === 404) {
            console.log('Standard endpoint failed, trying alternative path...');
            try {
              allUsersData = await apiCall('/make-server-6a2478ef/users/all', accessToken!);
            } catch (secondError: any) {
              // If both fail, throw the original error
              throw firstError;
            }
          } else {
            throw firstError;
          }
        }
        
        console.log('Received response from /users/all:', allUsersData);
        
        // Handle both array and object response formats
        if (Array.isArray(allUsersData)) {
          users = allUsersData;
          console.log(`✓ Loaded ${users.length} users from array response`);
        } else if (allUsersData?.users !== undefined) {
          if (Array.isArray(allUsersData.users)) {
            users = allUsersData.users;
            console.log(`✓ Loaded ${users.length} users from users array`);
          } else if (typeof allUsersData.users === 'object' && allUsersData.users !== null) {
            // If users is an object, convert to array
            users = Object.values(allUsersData.users);
            console.log(`✓ Loaded ${users.length} users from users object`);
          } else {
            console.warn('⚠ Unexpected users format:', typeof allUsersData.users, allUsersData.users);
            users = [];
          }
        } else {
          console.warn('⚠ No users property found in response:', allUsersData);
          users = [];
        }
        
        // Validate users array
        if (!Array.isArray(users)) {
          console.error('✗ Users is not an array:', users);
          users = [];
        } else if (users.length > 0) {
          usersFetchedSuccessfully = true;
          console.log(`✓ Successfully fetched ${users.length} total users`);
        }
        
      } catch (err: any) {
        fetchError = err?.message || 'Unknown error';
        console.error('✗ Error fetching all users:', {
          message: err?.message,
          status: err?.status,
          error: err
        });
        
        // Provide specific error context
        const errorMsg = err?.message || '';
        if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
          console.warn('⚠ Endpoint /users/all returned 404. The function may not be deployed.');
        } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
          console.error('✗ Authentication failed. Please check your access token.');
        } else if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
          console.error('✗ Access forbidden. Your account may not have admin privileges.');
        } else if (errorMsg.includes('500') || errorMsg.includes('Internal Server Error')) {
          console.error('✗ Server error occurred. Please try again later.');
        }
      }
      
      // Filter pending users from the fetched users
      let pending = users.filter((u: any) => u?.status === 'pending');
      console.log(`Found ${pending.length} pending users out of ${users.length} total users`);

      // Fallback: If primary fetch failed, try pending endpoint to at least get some data
      if (!usersFetchedSuccessfully && users.length === 0) {
        console.log('Attempting fallback: Fetching from /users/pending endpoint...');
        try {
          const pendingData = await apiCall('/users/pending', accessToken!);
          console.log('Received response from /users/pending:', pendingData);
          
          let pendingUsersList: any[] = [];
          
          if (Array.isArray(pendingData)) {
            pendingUsersList = pendingData;
          } else if (pendingData?.users) {
            if (Array.isArray(pendingData.users)) {
              pendingUsersList = pendingData.users;
            } else if (typeof pendingData.users === 'object') {
              pendingUsersList = Object.values(pendingData.users);
            }
          }
          
          if (pendingUsersList.length > 0) {
            // Use pending users as the full list if that's all we can get
            users = pendingUsersList;
            pending = pendingUsersList;
            console.log(`✓ Fallback successful: Loaded ${users.length} users from pending endpoint`);
            setHasDataSourceFallback(true);
            setErrorMessage('Note: Only pending users are available. Full user list endpoint may not be accessible.');
          } else {
            console.warn('⚠ No users found even from pending endpoint');
            if (fetchError) {
              setErrorMessage(`Unable to load users. Error: ${fetchError}`);
            } else {
              setErrorMessage('No users found in the system.');
            }
          }
        } catch (pendingError: any) {
          console.error('✗ Fallback also failed:', pendingError);
          const errorMsg = fetchError 
            ? `Failed to load users. Primary error: ${fetchError}. Fallback error: ${pendingError?.message || 'Unknown'}`
            : `Failed to load users: ${pendingError?.message || 'Unknown error'}`;
          setErrorMessage(errorMsg);
        }
      } else if (usersFetchedSuccessfully) {
        // Successfully fetched all users - clear any error messages
        setErrorMessage(null);
        setHasDataSourceFallback(false);
        console.log(`✓ All users loaded successfully: ${users.length} total, ${pending.length} pending`);
      }

      // Final check: If we still have no users, show appropriate message
      if (users.length === 0 && !errorMessage) {
        setErrorMessage('No users found in the system. This may be normal if no users have registered yet.');
      }

      // Sort users by creation date (newest first)
      users.sort((a: any, b: any) => {
        const dateA = new Date(a?.createdAt || 0).getTime();
        const dateB = new Date(b?.createdAt || 0).getTime();
        return dateB - dateA;
      });

      // Sort pending users by date (newest first)
      pending.sort((a: any, b: any) => {
        const dateA = new Date(a?.createdAt || 0).getTime();
        const dateB = new Date(b?.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setAllUsers(users);
      setPendingUsers(pending);

      // Fetch audit logs
      try {
        const logsData = await apiCall('/audit/logs', accessToken!);
        let logs: any[] = [];
        if (Array.isArray(logsData)) {
          logs = logsData;
        } else if (logsData?.logs && Array.isArray(logsData.logs)) {
          logs = logsData.logs;
        } else if (logsData?.logs) {
          logs = Object.values(logsData.logs);
        }
        
        // Sort by timestamp descending (newest first)
        logs.sort((a: any, b: any) => {
          const dateA = new Date(a?.timestamp || 0).getTime();
          const dateB = new Date(b?.timestamp || 0).getTime();
          return dateB - dateA;
        });
        
        setAuditLogs(logs);
      } catch (logsError: any) {
        console.error('Error fetching audit logs:', logsError);
        setErrorMessage((prev) => prev || logsError?.message || 'Could not load audit logs.');
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setErrorMessage((error as Error)?.message || 'Could not load admin data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string, userName?: string) => {
    if (!confirm(`Are you sure you want to approve ${userName || 'this user'}?`)) return;

    setActionLoading({ ...actionLoading, [userId]: true });

    // Optimistic update
    const originalUsers = [...allUsers];
    const originalPending = [...pendingUsers];
    
    setAllUsers(users => users.map(u => u.id === userId ? { ...u, status: 'approved' } : u));
    setPendingUsers(users => users.filter(u => u.id !== userId));

    try {
      await apiCall('/users/approve', accessToken!, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      
      showToast(`${userName || 'User'} approved successfully!`, 'success');
      await fetchData(); // Refresh to get latest data
    } catch (error: any) {
      // Revert optimistic update
      setAllUsers(originalUsers);
      setPendingUsers(originalPending);
      showToast(error.message || 'Failed to approve user. Please try again.', 'error');
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false });
    }
  };

  const handleReject = async (userId: string, userName?: string) => {
    const reason = prompt(`Enter rejection reason for ${userName || 'this user'} (optional):`);
    if (reason === null) return; // User cancelled
    
    if (!confirm(`Are you sure you want to reject ${userName || 'this user'}?`)) return;

    setActionLoading({ ...actionLoading, [userId]: true });

    // Optimistic update
    const originalUsers = [...allUsers];
    const originalPending = [...pendingUsers];
    
    setAllUsers(users => users.map(u => u.id === userId ? { ...u, status: 'rejected' } : u));
    setPendingUsers(users => users.filter(u => u.id !== userId));

    try {
      await apiCall('/users/reject', accessToken!, {
        method: 'POST',
        body: JSON.stringify({ userId, reason: reason || undefined }),
      });
      
      showToast(`${userName || 'User'} rejected successfully.`, 'success');
      await fetchData(); // Refresh to get latest data
    } catch (error: any) {
      // Revert optimistic update
      setAllUsers(originalUsers);
      setPendingUsers(originalPending);
      showToast(error.message || 'Failed to reject user. Please try again.', 'error');
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor': return <Stethoscope className="w-4 h-4" />;
      case 'assistant': return <ClipboardList className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor': return 'bg-green-100 text-green-700 border-green-200';
      case 'assistant': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'patient': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionBadge = (action: string) => {
    const actionMap: Record<string, { label: string; color: string; icon: any }> = {
      'approve_user': { label: 'APPROVE', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      'reject_user': { label: 'REJECT', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
      'create_user': { label: 'CREATE', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: UserPlus },
      'update_user': { label: 'UPDATE', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Settings },
      'delete_user': { label: 'DELETE', color: 'bg-red-100 text-red-700 border-red-200', icon: UserMinus },
      'login': { label: 'LOGIN', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: LogIn },
    };

    const config = actionMap[action] || { label: action.toUpperCase().replace(/_/g, ' '), color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Activity };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = allUsers.length;
    const pending = pendingUsers.length;
    const approved = allUsers.filter((u: any) => u?.status === 'approved').length;
    const rejected = allUsers.filter((u: any) => u?.status === 'rejected').length;
    const doctors = allUsers.filter((u: any) => u?.role === 'doctor').length;
    const assistants = allUsers.filter((u: any) => u?.role === 'assistant').length;
    const patients = allUsers.filter((u: any) => u?.role === 'patient').length;
    const admins = allUsers.filter((u: any) => u?.role === 'admin').length;

    return { total, pending, approved, rejected, doctors, assistants, patients, admins };
  }, [allUsers, pendingUsers]);

  // Chart data for user activity over time
  const activityChartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: 0,
        approvals: 0,
      };
    });

    allUsers.forEach((user: any) => {
      const userDate = new Date(user?.createdAt || 0);
      const daysAgo = Math.floor((Date.now() - userDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo >= 0 && daysAgo < 30) {
        last30Days[29 - daysAgo].users++;
      }
    });

    auditLogs.forEach((log: any) => {
      if (log?.action === 'approve_user') {
        const logDate = new Date(log?.timestamp || 0);
        const daysAgo = Math.floor((Date.now() - logDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo >= 0 && daysAgo < 30) {
          last30Days[29 - daysAgo].approvals++;
        }
      }
    });

    return last30Days;
  }, [allUsers, auditLogs]);

  // Role distribution data for pie chart
  const roleDistributionData = useMemo(() => {
    return [
      { name: 'Patients', value: stats.patients, color: CHART_COLORS.primary },
      { name: 'Doctors', value: stats.doctors, color: CHART_COLORS.secondary },
      { name: 'Assistants', value: stats.assistants, color: CHART_COLORS.accent },
      { name: 'Admins', value: stats.admins, color: CHART_COLORS.purple },
    ].filter(item => item.value > 0);
  }, [stats]);

  // Status distribution data for bar chart
  const statusChartData = useMemo(() => {
    return [
      { status: 'Approved', count: stats.approved, color: CHART_COLORS.secondary },
      { status: 'Pending', count: stats.pending, color: CHART_COLORS.warning },
      { status: 'Rejected', count: stats.rejected, color: CHART_COLORS.danger },
    ];
  }, [stats]);

  // Handle table sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAuditLogs = useMemo(() => {
    if (!sortConfig) return auditLogs;

    return [...auditLogs].sort((a: any, b: any) => {
      let aVal: any;
      let bVal: any;

      switch (sortConfig.key) {
        case 'date':
          aVal = new Date(a?.timestamp || 0).getTime();
          bVal = new Date(b?.timestamp || 0).getTime();
          break;
        case 'user':
          aVal = (a?.userEmail || a?.targetUserEmail || '').toLowerCase();
          bVal = (b?.userEmail || b?.targetUserEmail || '').toLowerCase();
          break;
        case 'action':
          aVal = (a?.action || '').toLowerCase();
          bVal = (b?.action || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [auditLogs, sortConfig]);

  return (
    <DashboardLayout
      userRole="admin"
      userName={
        currentUser?.user_metadata?.name ||
        currentUser?.name ||
        (currentUser?.email ? currentUser.email.split('@')[0] : 'Admin')
      }
      onLogout={onLogout}
      navigate={navigate}
    >
      <div className="p-6 lg:p-8 bg-gradient-to-br from-blue-50/50 via-white to-teal-50/50 min-h-screen">
        <div className="space-y-6">
          {/* Toast Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg border ${
                  toast.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {toast.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="font-semibold">{toast.message}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Manage users and monitor system activity</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchData}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </motion.div>

          {/* Error banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 flex items-center gap-2"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
            {hasDataSourceFallback && !errorMessage && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 flex items-center gap-2"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>Some data is temporarily limited. Pending approvals are still shown.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Pending Approval', value: stats.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Approved Users', value: stats.approved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'System Events', value: auditLogs.length, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm font-medium">{stat.label}</span>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stat.label === 'Total Users' && 'All registered users'}
                  {stat.label === 'Pending Approval' && 'Awaiting review'}
                  {stat.label === 'Approved Users' && 'Active accounts'}
                  {stat.label === 'System Events' && 'Activity logs'}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50/50">
              <div className="flex overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'pending', label: 'Pending Approvals', badge: stats.pending },
                  { id: 'all', label: 'All Users' },
                  { id: 'audit', label: 'Audit Logs' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap relative ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-600">Loading data...</p>
                </div>
              ) : activeTab === 'pending' ? (
                <div className="space-y-4">
                  {pendingUsers.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No pending approvals</p>
                      <p className="text-sm text-gray-400 mt-1">All users have been reviewed</p>
                    </motion.div>
                  ) : (
                    pendingUsers.map((user, idx) => (
                      <motion.div
                        key={user?.id || idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-5 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-blue-50/30"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h4 className="font-semibold text-gray-900">{user?.name || 'Unknown'}</h4>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleColor(user?.role || '')}`}>
                                {getRoleIcon(user?.role || '')}
                                {user?.role || 'unknown'}
                              </span>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(user?.status || '')}`}>
                                {user?.status || 'unknown'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{user?.email || 'No email'}</p>
                            {user?.phone && <p className="text-sm text-gray-600 mb-1">Phone: {user.phone}</p>}
                            {user?.area && <p className="text-sm text-gray-600 mb-1">Area: {user.area}</p>}
                            <p className="text-xs text-gray-500 mt-2">
                              Registered: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                                month: 'short',
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Unknown date'}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4 flex-shrink-0">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleApprove(user?.id, user?.name)}
                              disabled={actionLoading[user?.id]}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading[user?.id] ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              Approve
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleReject(user?.id, user?.name)}
                              disabled={actionLoading[user?.id]}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading[user?.id] ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              Reject
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              ) : activeTab === 'all' ? (
                <div className="space-y-4">
                  {allUsers.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No users found</p>
                    </motion.div>
                  ) : (
                    allUsers.map((user, idx) => (
                      <motion.div
                        key={user?.id || idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="p-5 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h4 className="font-semibold text-gray-900">{user?.name || 'Unknown'}</h4>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleColor(user?.role || '')}`}>
                                {getRoleIcon(user?.role || '')}
                                {user?.role || 'unknown'}
                              </span>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(user?.status || '')}`}>
                                {user?.status || 'unknown'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{user?.email || 'No email'}</p>
                            {user?.phone && <p className="text-sm text-gray-600 mb-1">Phone: {user.phone}</p>}
                            {user?.area && <p className="text-sm text-gray-600 mb-1">Area: {user.area}</p>}
                            <p className="text-xs text-gray-500 mt-2">
                              Registered: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Unknown date'}
                            </p>
                            {user?.approvedAt && (
                              <p className="text-xs text-green-600 mt-1">
                                Approved: {new Date(user.approvedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            )}
                          </div>
                          {user?.status === 'pending' && (
                            <div className="flex gap-2 ml-4 flex-shrink-0">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleApprove(user?.id, user?.name)}
                                disabled={actionLoading[user?.id]}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading[user?.id] ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Approve
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleReject(user?.id, user?.name)}
                                disabled={actionLoading[user?.id]}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading[user?.id] ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                Reject
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              ) : activeTab === 'audit' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">System Audit Logs</h3>
                    <span className="text-sm text-gray-500">{auditLogs.length} total events</span>
                  </div>
                  
                  {auditLogs.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No audit logs found</p>
                    </motion.div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            {[
                              { key: 'date', label: 'Date & Time', sortable: true },
                              { key: 'user', label: 'User Name', sortable: true },
                              { key: 'role', label: 'User Role', sortable: false },
                              { key: 'action', label: 'Action', sortable: true },
                              { key: 'target', label: 'Target', sortable: false },
                            ].map((col) => (
                              <th
                                key={col.key}
                                className={`px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${
                                  col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                                }`}
                                onClick={() => col.sortable && handleSort(col.key)}
                              >
                                <div className="flex items-center gap-2">
                                  {col.label}
                                  {col.sortable && (
                                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedAuditLogs.map((log: any, idx: number) => {
                            const logDate = log?.timestamp ? new Date(log.timestamp) : new Date();
                            const userName = log?.userEmail || log?.targetUserEmail || 'System';
                            const userRole = log?.userRole || 'N/A';
                            
                            return (
                              <motion.tr
                                key={idx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.01 }}
                                className="hover:bg-blue-50/50 transition-colors"
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {logDate.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {logDate.toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{userName}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getRoleColor(userRole)}`}>
                                    {getRoleIcon(userRole)}
                                    {userRole}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {getActionBadge(log?.action || 'unknown')}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {log?.targetUserEmail || log?.target || 'N/A'}
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Charts Section */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Activity Over Time - Line Chart */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 rounded-xl border border-gray-200"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Activity Over Time (30 Days)
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={activityChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#6B7280"
                            fontSize={12}
                            tick={{ fill: '#6B7280' }}
                          />
                          <YAxis 
                            stroke="#6B7280"
                            fontSize={12}
                            tick={{ fill: '#6B7280' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="users" 
                            stroke={CHART_COLORS.primary} 
                            strokeWidth={2}
                            name="New Users"
                            dot={{ fill: CHART_COLORS.primary, r: 4 }}
                            animationDuration={1000}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="approvals" 
                            stroke={CHART_COLORS.secondary} 
                            strokeWidth={2}
                            name="Approvals"
                            dot={{ fill: CHART_COLORS.secondary, r: 4 }}
                            animationDuration={1000}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </motion.div>

                    {/* Status Distribution - Bar Chart */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white p-6 rounded-xl border border-gray-200"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-600" />
                        User Status Distribution
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statusChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="status" 
                            stroke="#6B7280"
                            fontSize={12}
                            tick={{ fill: '#6B7280' }}
                          />
                          <YAxis 
                            stroke="#6B7280"
                            fontSize={12}
                            tick={{ fill: '#6B7280' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Bar 
                            dataKey="count" 
                            radius={[8, 8, 0, 0]}
                            animationDuration={1000}
                          >
                            {statusChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </div>

                  {/* Role Distribution - Pie Chart */}
                  {roleDistributionData.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white p-6 rounded-xl border border-gray-200"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-teal-600" />
                        User Role Distribution
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={roleDistributionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            animationDuration={1000}
                          >
                            {roleDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Doctors', value: stats.doctors, color: 'text-green-700', bg: 'bg-green-50' },
                      { label: 'Assistants', value: stats.assistants, color: 'text-teal-700', bg: 'bg-teal-50' },
                      { label: 'Patients', value: stats.patients, color: 'text-blue-700', bg: 'bg-blue-50' },
                      { label: 'Admins', value: stats.admins, color: 'text-purple-700', bg: 'bg-purple-50' },
                    ].map((stat, idx) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        className={`text-center p-4 rounded-lg border ${stat.bg} border-opacity-50`}
                      >
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className={`text-sm ${stat.color} mt-1 font-medium`}>{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-600" />
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {auditLogs.slice(0, 5).map((log: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            log?.action === 'approve_user' ? 'bg-green-100 text-green-700' :
                            log?.action === 'reject_user' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {log?.action === 'approve_user' ? <CheckCircle className="w-4 h-4" /> :
                             log?.action === 'reject_user' ? <XCircle className="w-4 h-4" /> :
                             <Activity className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {log?.action?.replace(/_/g, ' ') || 'Unknown action'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {log?.userEmail || log?.targetUserEmail || 'System'} • {log?.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown time'}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
