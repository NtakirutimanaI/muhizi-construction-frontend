import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Team from './pages/public/Team';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ProfileManagement from './pages/admin/ProfileManagement';
import ApiDocs from './pages/admin/ApiDocs';
import Subscribers from './pages/admin/Subscribers';
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
import Requests from './pages/admin/Requests';
import Approvements from './pages/admin/Approvements';
import Stock from './pages/admin/Stock';
import StockCategories from './pages/admin/StockCategories';
import Contracts from './pages/admin/Contracts';
import ProjectDetail from './pages/admin/ProjectDetail';
import ProjectProgress from './pages/client/ProjectProgress';

import { profileService } from './services/profileService';
import type { Profile } from './services/profileService';
import './index.css';

const defaultProfile: Profile = {
  id: '', firstName: 'MUHIZI', lastName: 'CONSTRUCTION',
  username: 'muhizi_construction', email: 'info@muhiziconstruction.rw',
  bio: 'Leading construction company in Rwanda', greeting: 'Welcome',
  aboutMeTitle: 'About Us', title: 'Real Estate & Construction',
  location: 'Kigali, Rwanda', phone: '', website: '',
  avatar: '', cvUrl: '', yearsOfExperience: 6, availableForHire: false,
  isPublic: true, education: [], about: '', experience: [],
  skills: { backend: [], frontend: [], databases: [], tools: [] },
  projects: [], certifications: [], languages: [], teamMembers: [],
  socialLinks: {}, services: [], createdAt: '', updatedAt: '',
  pageContent: {
    heroSlides: [{ title: 'MUHIZI CONSTRUCTION', body: "Building Rwanda's Future", color: 'emerald' }],
    services: { heading: 'Our Services', items: [] },
    aboutSection: { heading: 'About Muhizi Construction', subtitle: 'Excellence in construction' },
    contactSection: { heading: 'Contact Us' },
  },
};

function App() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loading, setLoading] = useState(() => !!localStorage.getItem('accessToken'));

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const fetchProfile = async (retriesLeft = 3, delayMs = 1500): Promise<void> => {
      try {
        const data = await profileService.getMyProfile();
        setProfile(data);
        setLoading(false);
      } catch (err: any) {
        if (retriesLeft > 0) {
          console.warn(`Profile fetch failed, retrying in ${delayMs}ms... (${retriesLeft} left)`, err);
          await sleep(delayMs);
          return fetchProfile(retriesLeft - 1, delayMs * 2);
        }
        console.error('Error fetching profile:', err);
        setLoading(false);
      }
    };

    fetchProfile();

    const handleProfileUpdate = () => { fetchProfile(); };
    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
    </div>;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout profile={profile} />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/team" element={<Team />} />
              </Route>

              {/* Auth Routes */}
              <Route element={<PublicLayout profile={profile} />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Admin Routes — shared across all roles under their respective base paths */}
              <Route element={<ProtectedRoute />}>
                {['admin', 'manager', 'sitemanager', 'site-manager', 'employee', 'client', 'managingdirector', 'directorfinance', 'siteengineer', 'engineeringstudio'].map(base => {
                  const b = `/${base}`;
                  return (
                    <Route key={base} path={b} element={<AdminLayout basePath={b} />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="profile" element={<ProfileManagement />} />
                      <Route path="api-docs" element={<ApiDocs />} />
                      <Route path="subscribers" element={<Subscribers />} />
                      <Route path="messages" element={<Navigate to={`${b}/messages/inbox`} replace />} />
                      <Route path="messages/inbox" element={<MessagesInbox />} />
                      <Route path="messages/sent" element={<MessagesSent />} />
                      <Route path="messages/trash" element={<MessagesTrash />} />
                      <Route path="resources" element={<Resources />} />
                      <Route path="users" element={<Users />} />
                      <Route path="permissions" element={<Permissions />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="sites" element={<Projects />} />
                      <Route path="projects" element={<Navigate to="../sites" replace />} />
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
                      <Route path="requests" element={<Requests />} />
                      <Route path="project-evidence" element={<ProjectEvidence />} />
                      <Route path="site-rules" element={<SiteRules />} />
                      <Route path="approvals" element={<Approvals />} />
                      <Route path="contracts" element={<Contracts />} />
                      <Route path="project-progress" element={<ProjectProgress />} />
                      <Route path="approvements" element={<Approvements />} />
                      <Route path="stock/in" element={<Stock />} />
                      <Route path="stock/out" element={<Stock />} />
                      <Route path="stock/categories" element={<StockCategories />} />
                      <Route path="sites/:id" element={<ProjectDetail />} />
                      <Route path="projects/:id" element={<Navigate to="../sites" replace />} />
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
