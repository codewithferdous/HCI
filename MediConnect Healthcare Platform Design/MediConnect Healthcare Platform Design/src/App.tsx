import React, { useState, useEffect } from 'react';
import { createClient } from './utils/supabase/client';
import { projectId, publicAnonKey } from './utils/supabase/info';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import PatientDashboard from './pages/patient/PatientDashboard';
import ViewReports from './pages/patient/ViewReports';
import SearchAssistant from './pages/patient/SearchAssistant';
import MyRequests from './pages/patient/MyRequests';
import AssistantDashboard from './pages/assistant/AssistantDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Settings from './pages/Settings';
import SetupInstructions from './components/SetupInstructions';
import UploadReadings from './pages/assistant/UploadReadings';
import ReviewReport from './pages/doctor/ReviewReport';
import PatientRequests from './pages/assistant/PatientRequests';
import AssistantDashboardEnhanced from './pages/assistant/AssistantDashboardEnhanced';


// API helper
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6a2478ef`;

async function apiCall(endpoint: string, options: RequestInit = {}, accessToken?: string) {
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else {
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('landing');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'landing';
      setCurrentRoute(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          const userData = await apiCall('/auth/me', {}, session.access_token);
          setAccessToken(session.access_token);
          setCurrentUser(userData.user);
          
          // Navigate to appropriate dashboard
          if (userData.user?.role) {
            navigate(`${userData.user.role}-dashboard`);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();
  }, []);

  const navigate = (route: string) => {
    window.location.hash = route;
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      const response = await apiCall('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAccessToken(response.accessToken);
      setCurrentUser(response.user);

      const displayName =
        response.user?.name ||
        response.user?.user_metadata?.name ||
        response.user?.email ||
        'User';
      const displayRole = response.user?.role || 'user';
      setWelcomeMessage(`Welcome back, ${displayName} (${displayRole})`);
      setTimeout(() => {
        setWelcomeMessage(null);
      }, 1000);

      // Navigate to appropriate dashboard
      switch (response.user.role) {
        case 'patient':
          navigate('patient-dashboard');
          break;
        case 'assistant':
          navigate('assistant-dashboard');
          break;
        case 'doctor':
          navigate('doctor-dashboard');
          break;
        case 'admin':
          navigate('admin-dashboard');
          break;
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string, name: string, role: string) => {
    try {
      const response = await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role }),
      });

      if (response.needsApproval) {
        // Return success but don't auto-login
        return { success: true, needsApproval: true };
      }

      // For patients, auto-login
      if (role === 'patient') {
        await handleSignIn(email, password);
      }

      return { success: true, needsApproval: false };
    } catch (error: any) {
      throw error;
    }
  };

  const confirmLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      
      if (accessToken) {
        await apiCall('/auth/signout', { method: 'POST' }, accessToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAccessToken(null);
      setCurrentUser(null);
      setShowLogoutConfirm(false);
      navigate('landing');
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const renderPage = () => {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading MediConnect...</p>
          </div>
        </div>
      );
    }

    switch (currentRoute) {
      case 'landing':
        return <Landing navigate={navigate} />;
      case 'signin':
        return <SignIn navigate={navigate} onSignIn={handleSignIn} />;
      case 'signup':
        return <SignUp navigate={navigate} onSignUp={handleSignUp} />;
      case 'patient-dashboard':
        return <PatientDashboard navigate={navigate} onLogout={handleLogout} accessToken={accessToken} currentUser={currentUser} />;
      case 'view-reports':
        return <ViewReports navigate={navigate} onLogout={handleLogout} accessToken={accessToken} currentUser={currentUser} />;
      case 'search-assistant':
        return <SearchAssistant navigate={navigate} onLogout={handleLogout} accessToken={accessToken} currentUser={currentUser} />;
      case 'my-requests':
        return <MyRequests navigate={navigate} onLogout={handleLogout} accessToken={accessToken} currentUser={currentUser} />;
      case 'assistant-dashboard':
        return <AssistantDashboard navigate={navigate} onLogout={handleLogout} accessToken={accessToken} currentUser={currentUser} />;
      case 'doctor-dashboard':
        return <DoctorDashboard navigate={navigate} onLogout={handleLogout} accessToken={accessToken} currentUser={currentUser} />;
      case 'admin-dashboard':
        return <AdminDashboard navigate={navigate} onLogout={handleLogout} accessToken={accessToken} currentUser={currentUser} />;
      case 'user-management':
        return <UserManagement navigate={navigate} onLogout={handleLogout} accessToken={accessToken} currentUser={currentUser} />;
      case 'settings':
        return <Settings navigate={navigate} onLogout={handleLogout} accessToken={accessToken} currentUser={currentUser} />;
      case 'setup':
        return <SetupInstructions />;
      case 'upload-readings':
        return <UploadReadings navigate={navigate} onLogout={handleLogout} accessToken={accessToken} />;
      case 'review-report':
        return <ReviewReport navigate={navigate} onLogout={handleLogout} accessToken={accessToken} currentUser={currentUser} />;
      case 'patient-requests':
        return <PatientRequests navigate={navigate} onLogout={handleLogout} accessToken={accessToken} currentUser={currentUser} />;
      case 'assistant-dashboard-enhanced':
        return (
          <AssistantDashboardEnhanced
            navigate={navigate}
            onLogout={handleLogout}
            onSelectRequest={() => {}}
            assistantRequests={[]}
            pendingVisits={[]}
            completedVisits={[]}
            onAcceptRequest={() => {}}
          />
        );
      default:
        return <Landing navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen relative">
      {renderPage()}
      {welcomeMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
          <div className="px-6 py-3 rounded-xl bg-blue-600 text-white shadow-lg border border-blue-300">
            <span className="font-semibold">{welcomeMessage}</span>
          </div>
        </div>
      )}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold">
                !
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Confirm sign out</h3>
                <p className="text-sm text-gray-600">You’re about to sign out of MediConnect.</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Your session will end and you’ll return to the landing page. Continue?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Stay signed in
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
