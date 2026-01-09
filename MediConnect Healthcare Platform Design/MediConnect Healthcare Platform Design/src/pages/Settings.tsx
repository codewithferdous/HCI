import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, User, Lock, ArrowLeft, Save, Heart, Stethoscope, ClipboardList, Shield } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { projectId } from '../utils/supabase/info';

interface SettingsProps {
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

export default function Settings({ navigate, onLogout, accessToken, currentUser }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    area: currentUser?.area || '',
    specialization: currentUser?.specialization || '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await apiCall('/settings/update-profile', accessToken!, {
        method: 'POST',
        body: JSON.stringify(profileData),
      });

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      setIsSaving(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      setIsSaving(false);
      return;
    }

    try {
      await apiCall('/settings/change-password', accessToken!, {
        method: 'POST',
        body: JSON.stringify({ newPassword: passwordData.newPassword }),
      });

      setSuccessMessage('Password changed successfully!');
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleIcon = () => {
    switch (currentUser?.role) {
      case 'patient': return Heart;
      case 'doctor': return Stethoscope;
      case 'assistant': return ClipboardList;
      case 'admin': return Shield;
      default: return User;
    }
  };

  const getRoleLabel = () => {
    switch (currentUser?.role) {
      case 'patient': return 'Patient';
      case 'doctor': return 'Doctor';
      case 'assistant': return 'Medical Assistant';
      case 'admin': return 'Administrator';
      default: return 'User';
    }
  };

  const getDashboardRoute = () => {
    switch (currentUser?.role) {
      case 'patient': return 'patient-dashboard';
      case 'doctor': return 'doctor-dashboard';
      case 'assistant': return 'assistant-dashboard';
      case 'admin': return 'admin-dashboard';
      default: return 'landing';
    }
  };

  const RoleIcon = getRoleIcon();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: RoleIcon, route: getDashboardRoute() },
  ];

  return (
    <DashboardLayout
      userRole={currentUser?.role || 'patient'}
      userName={
        currentUser?.user_metadata?.name ||
        currentUser?.name ||
        (currentUser?.email ? currentUser.email.split('@')[0] : 'User')
      }
      onLogout={onLogout}
      navigate={navigate}
    >
      <div className="p-8">
        <div className="space-y-6">
          {/* Success/Error Messages */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl"
            >
              {successMessage}
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* Account Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                <RoleIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{currentUser?.name}</h3>
                <p className="text-sm text-gray-600">{currentUser?.email}</p>
                <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {getRoleLabel()}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 px-6 py-4 font-medium transition-colors ${
                    activeTab === 'profile'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex-1 px-6 py-4 font-medium transition-colors ${
                    activeTab === 'security'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Lock className="w-4 h-4 inline mr-2" />
                  Security
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  {currentUser?.role === 'assistant' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Area
                      </label>
                      <input
                        type="text"
                        value={profileData.area}
                        onChange={(e) => setProfileData({ ...profileData, area: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Downtown, Northside"
                      />
                    </div>
                  )}

                  {currentUser?.role === 'doctor' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={profileData.specialization}
                        onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Cardiology, General Practice"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={currentUser?.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSaving}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                </form>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Choose a strong password to keep your account secure
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSaving}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    {isSaving ? 'Changing Password...' : 'Change Password'}
                  </motion.button>
                </form>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
            <div className="p-6 border-b border-red-200 bg-red-50">
              <h3 className="font-semibold text-red-900">Danger Zone</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Once you log out, you'll need to sign in again with your credentials.
              </p>
              <button
                onClick={onLogout}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}