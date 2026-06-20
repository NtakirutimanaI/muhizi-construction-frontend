import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ProfileManagement from './pages/admin/ProfileManagement';
import ApiDocs from './pages/admin/ApiDocs';
import MessagesInbox from './pages/admin/MessagesInbox';
import MessagesSent from './pages/admin/MessagesSent';
import MessagesTrash from './pages/admin/MessagesTrash';
import Resources from './pages/admin/Resources';
import FooterSettings from './pages/admin/FooterSettings';
import Users from './pages/admin/Users';
import Permissions from './pages/admin/Permissions';
import Settings from './pages/admin/Settings';
import Projects from './pages/admin/Projects';
import Designs from './pages/admin/Designs';
import Partnerships from './pages/admin/Partnerships';
import Employees from './pages/admin/Employees';
import Attendance from './pages/admin/Attendance';
import Payroll from './pages/admin/Payroll';
import Incomes from './pages/admin/Incomes';
import Expenses from './pages/admin/Expenses';
import Reports from './pages/admin/Reports';
import AuditLogs from './pages/admin/AuditLogs';
import MlInsights from './pages/admin/MlInsights';
import SalaryHistory from './pages/admin/SalaryHistory';
import SiteActivities from './pages/admin/SiteActivities';
import MaterialRequests from './pages/admin/MaterialRequests';
import ProjectEvidence from './pages/admin/ProjectEvidence';
import SiteRules from './pages/admin/SiteRules';
import Approvals from './pages/admin/Approvals';
import Contracts from './pages/admin/Contracts';
import ProjectDetail from './pages/admin/ProjectDetail';

import Loading from './components/Loading';
import { profileService } from './services/profileService';
import type { Profile } from './services/profileService';
import './index.css';

function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getPublicProfile();
        setProfile(data);
        // Track this visit
        profileService.recordVisit({
          page: window.location.pathname,
          referrer: document.referrer || undefined,
        }).catch(() => {});
      } catch (err: any) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    const handleProfileUpdate = () => { fetchProfile(); };
    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, []);

  if (loading) {
    return <Loading />;
  }

  function RouteTracker() {
    const location = useLocation();
    useEffect(() => {
      profileService.recordVisit({
        page: location.pathname,
        referrer: document.referrer || undefined,
      }).catch(() => {});
    }, [location]);
    return null;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <RouteTracker />
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout profile={profile} />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
              </Route>

              {/* Auth Routes */}
              <Route element={<PublicLayout profile={profile} />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/profile" element={<ProfileManagement />} />
                  <Route path="/admin/api-docs" element={<ApiDocs />} />
                  <Route path="/admin/messages" element={<Navigate to="/admin/messages/inbox" replace />} />
                  <Route path="/admin/messages/inbox" element={<MessagesInbox />} />
                  <Route path="/admin/messages/sent" element={<MessagesSent />} />
                  <Route path="/admin/messages/trash" element={<MessagesTrash />} />
                  <Route path="/admin/resources" element={<Resources />} />
                  <Route path="/admin/footer-settings" element={<FooterSettings />} />
                  <Route path="/admin/users" element={<Users />} />
                  <Route path="/admin/permissions" element={<Permissions />} />
                  <Route path="/admin/settings" element={<Settings />} />
                  <Route path="/admin/projects" element={<Projects />} />
                  <Route path="/admin/designs" element={<Designs />} />
                  <Route path="/admin/partnerships" element={<Partnerships />} />
                  <Route path="/admin/employees" element={<Employees />} />
                  <Route path="/admin/attendance" element={<Attendance />} />
                  <Route path="/admin/payroll" element={<Payroll />} />
                  <Route path="/admin/incomes" element={<Incomes />} />
                  <Route path="/admin/expenses" element={<Expenses />} />
                  <Route path="/admin/reports" element={<Reports />} />
                  <Route path="/admin/audit-logs" element={<AuditLogs />} />
                  <Route path="/admin/ml-insights" element={<MlInsights />} />
                  <Route path="/admin/salary-history" element={<SalaryHistory />} />
                  <Route path="/admin/site-activities" element={<SiteActivities />} />
                  <Route path="/admin/material-requests" element={<MaterialRequests />} />
                  <Route path="/admin/project-evidence" element={<ProjectEvidence />} />
                  <Route path="/admin/site-rules" element={<SiteRules />} />
                  <Route path="/admin/approvals" element={<Approvals />} />
                  <Route path="/admin/contracts" element={<Contracts />} />
                  <Route path="/admin/projects/:id" element={<ProjectDetail />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
