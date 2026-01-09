import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  UserPlus, 
  Users, 
  Settings, 
  LogOut,
  Search,
  ClipboardList,
  Stethoscope,
  Shield
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: 'patient' | 'assistant' | 'doctor' | 'admin';
  userName: string;
  onLogout: () => void;
  navigate: (route: string) => void;
}

export function DashboardLayout({
  children,
  userRole,
  userName,
  onLogout,
  navigate,
}: DashboardLayoutProps) {

  const navigationItems = {
    patient: [
      { label: 'Dashboard', icon: LayoutDashboard, route: 'patient-dashboard' },
      { label: 'Search Assistants', icon: Search, route: 'search-assistant' },
      { label: 'My Requests', icon: ClipboardList, route: 'my-requests' },
      { label: 'Medical Reports', icon: FileText, route: 'view-reports' },
    ],
    assistant: [
      { label: 'Dashboard', icon: LayoutDashboard, route: 'assistant-dashboard' },
      { label: 'Patient Requests', icon: ClipboardList, route: 'patient-requests' },
      { label: 'Upload Readings', icon: ClipboardList, route: 'upload-readings' },
    ],
    doctor: [
      { label: 'Dashboard', icon: LayoutDashboard, route: 'doctor-dashboard' },
      { label: 'Review Report', icon: FileText, route: 'review-report' },
    ],
    admin: [
      { label: 'Dashboard', icon: LayoutDashboard, route: 'admin-dashboard' },
      { label: 'User Management', icon: Users, route: 'user-management' },
    ],
  };

  const roleColors = {
    patient: 'from-blue-600 to-blue-400',
    assistant: 'from-teal-600 to-teal-400',
    doctor: 'from-green-600 to-green-400',
    admin: 'from-purple-600 to-purple-400',
  };

  const roleIcons = {
    patient: UserPlus,
    assistant: ClipboardList,
    doctor: Stethoscope,
    admin: Shield,
  };

  const RoleIcon = roleIcons[userRole];
  const currentRoute = window.location.hash.slice(1);
  const navItems = navigationItems[userRole] || [];

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >

      {/* TOP BAR */}
      <motion.nav
        className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        <div className="h-full px-6 flex items-center justify-between">

          {/* LOGO */}
          <div className="flex items-center gap-3">
            <motion.div
              className={`w-10 h-10 bg-gradient-to-br ${roleColors[userRole]} rounded-xl flex items-center justify-center`}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Stethoscope className="w-6 h-6 text-white" />
            </motion.div>

            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              MediConnect
            </span>
          </div>

          {/* USER ACTIONS */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ rotate: 20 }}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => navigate('settings')}
            >
              <Settings className="w-5 h-5" />
            </motion.button>

            <div className="w-px h-8 bg-gray-200"></div>

            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${roleColors[userRole]} rounded-lg flex items-center justify-center`}>
                <RoleIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Welcome back, {userName}
                </div>
                <div className="text-xs text-gray-500 capitalize">{userRole}</div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="w-10 h-10 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* SIDEBAR */}
      <motion.aside
        className="fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-30"
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="p-6 space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;

            return (
              <motion.button
                key={index}
                onClick={() => navigate(item.route)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${roleColors[userRole]} text-white shadow-xl`
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.aside>

      {/* MAIN CONTENT */}
      <main className="pt-16 pl-64">
        <motion.div
          className="min-h-[calc(100vh-4rem)] p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {children}
        </motion.div>
      </main>
    </motion.div>
  );
}
