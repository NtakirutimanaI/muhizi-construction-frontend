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
import EmployeeAssignments from './pages/admin/EmployeeAssignments';
import Approvals from './pages/admin/Approvals';
import Contracts from './pages/admin/Contracts';
import ProjectDetail from './pages/admin/ProjectDetail';
import ProjectProgress from './pages/client/ProjectProgress';

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

              {/* Admin Routes — shared across all roles under their respective base paths */}
              <Route element={<ProtectedRoute />}>
                {['admin', 'manager', 'site-manager', 'employee', 'client'].map(base => {
                  const b = `/${base}`;
                  return (
                    <Route key={base} path={b} element={<AdminLayout basePath={b} />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="profile" element={<ProfileManagement />} />
                      <Route path="api-docs" element={<ApiDocs />} />
                      <Route path="messages" element={<Navigate to={`${b}/messages/inbox`} replace />} />
                      <Route path="messages/inbox" element={<MessagesInbox />} />
                      <Route path="messages/sent" element={<MessagesSent />} />
                      <Route path="messages/trash" element={<MessagesTrash />} />
                      <Route path="resources" element={<Resources />} />
                      <Route path="users" element={<Users />} />
                      <Route path="permissions" element={<Permissions />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="projects" element={<Projects />} />
                      <Route path="designs" element={<Designs />} />
                      <Route path="partnerships" element={<Partnerships />} />
                      <Route path="employees" element={<Employees />} />
                      <Route path="attendance" element={<Attendance />} />
                      <Route path="employee-assignments" element={<EmployeeAssignments />} />
                      <Route path="payroll" element={<Payroll />} />
                      <Route path="incomes" element={<Incomes />} />
                      <Route path="expenses" element={<Expenses />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="audit-logs" element={<AuditLogs />} />
                      <Route path="ml-insights" element={<MlInsights />} />
                      <Route path="salary-history" element={<SalaryHistory />} />
                      <Route path="site-activities" element={<SiteActivities />} />
                      <Route path="material-requests" element={<MaterialRequests />} />
                      <Route path="project-evidence" element={<ProjectEvidence />} />
                      <Route path="site-rules" element={<SiteRules />} />
                      <Route path="approvals" element={<Approvals />} />
                      <Route path="contracts" element={<Contracts />} />
                      <Route path="project-progress" element={<ProjectProgress />} />
                      <Route path="projects/:id" element={<ProjectDetail />} />
                    </Route>
                  );
                })}
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
