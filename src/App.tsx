import { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import ClientLayout from './layouts/ClientLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages — lazy loaded
const Home = lazy(() => import('./pages/public/Home'));
const About = lazy(() => import('./pages/public/About'));
const Team = lazy(() => import('./pages/public/Team'));
const NewsList = lazy(() => import('./pages/public/NewsList'));
const NewsArticle = lazy(() => import('./pages/public/NewsArticle'));
const Unsubscribe = lazy(() => import('./pages/public/Unsubscribe'));
const VisionMissionValues = lazy(() => import('./pages/public/VisionMissionValues'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const GoogleCallback = lazy(() => import('./pages/auth/GoogleCallback'));

// Admin Pages — lazy loaded
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProfileManagement = lazy(() => import('./pages/admin/ProfileManagement'));
const Subscribers = lazy(() => import('./pages/admin/Subscribers'));
const MessagesInbox = lazy(() => import('./pages/admin/MessagesInbox'));
const MessagesSent = lazy(() => import('./pages/admin/MessagesSent'));
const MessagesTrash = lazy(() => import('./pages/admin/MessagesTrash'));
const Resources = lazy(() => import('./pages/admin/Resources'));
const Users = lazy(() => import('./pages/admin/Users'));
const Registration = lazy(() => import('./pages/admin/Registration'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const Projects = lazy(() => import('./pages/admin/Projects'));
const Designs = lazy(() => import('./pages/admin/Designs'));
const Partnerships = lazy(() => import('./pages/admin/Partnerships'));
const Employees = lazy(() => import('./pages/admin/Employees'));
const Attendance = lazy(() => import('./pages/admin/Attendance'));
const Payroll = lazy(() => import('./pages/admin/Payroll'));
const Incomes = lazy(() => import('./pages/admin/Incomes'));
const Expenses = lazy(() => import('./pages/admin/Expenses'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const SalaryHistory = lazy(() => import('./pages/admin/SalaryHistory'));
const SiteActivities = lazy(() => import('./pages/admin/SiteActivities'));
const MaterialRequests = lazy(() => import('./pages/admin/MaterialRequests'));
const ProjectEvidence = lazy(() => import('./pages/admin/ProjectEvidence'));
const SiteRules = lazy(() => import('./pages/admin/SiteRules'));
const EmployeeAssignments = lazy(() => import('./pages/admin/EmployeeAssignments'));
const Requests = lazy(() => import('./pages/admin/Requests'));
const EngineeringSubmissions = lazy(() => import('./pages/admin/EngineeringSubmissions'));
const DailyReports = lazy(() => import('./pages/admin/DailyReports'));
const CreateContract = lazy(() => import('./pages/admin/CreateContract'));
const InsuranceSettings = lazy(() => import('./pages/admin/InsuranceSettings'));
const MoneyRequisitions = lazy(() => import('./pages/admin/MoneyRequisitions'));
const ClientReports = lazy(() => import('./pages/admin/ClientReports'));
const PettyCash = lazy(() => import('./pages/admin/PettyCash'));
const PettyCashVoucher = lazy(() => import('./pages/admin/PettyCashVoucher'));
const AdminUpdates = lazy(() => import('./pages/admin/AdminUpdates'));
const Stock = lazy(() => import('./pages/admin/Stock'));
const StockCategories = lazy(() => import('./pages/admin/StockCategories'));
const DailyTasks = lazy(() => import('./pages/admin/DailyTasks'));
const AssignTasks = lazy(() => import('./pages/admin/AssignTasks'));
const EngineeringStudio = lazy(() => import('./pages/admin/EngineeringStudio'));
const ReportToAdmin = lazy(() => import('./pages/admin/ReportToAdmin'));
const ShareFiles = lazy(() => import('./pages/admin/ShareFiles'));
const ProjectDetail = lazy(() => import('./pages/admin/ProjectDetail'));
const ProjectProgress = lazy(() => import('./pages/partner/ProjectProgress'));
const PartnerUpdates = lazy(() => import('./pages/partner/PartnerUpdates'));
const ClientDashboard = lazy(() => import('./pages/client-panel/ClientDashboard'));
const ClientProfile = lazy(() => import('./pages/client-panel/ClientProfile'));
const ClientSites = lazy(() => import('./pages/client-panel/ClientSites'));
const ClientUpdates = lazy(() => import('./pages/client-panel/ClientUpdates'));
const ClientSiteRules = lazy(() => import('./pages/client-panel/ClientSiteRules'));
const ClientProgressReports = lazy(() => import('./pages/client-panel/ClientProgressReports'));

import { profileService } from './services/profileService';
import type { Profile } from './services/profileService';
import './index.css';

const defaultProfile: Profile = {
  id: '', firstName: 'MUHIZI', lastName: 'CONSTRUCTION',
  email: 'info@muhiziconstruction.rw',
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

const PageSpinner = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500" />
  </div>
);

function App() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const data = token ? await profileService.getMyProfile() : await profileService.getPublicProfile();
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfile();

    const handleProfileUpdate = () => { fetchProfile(); };
    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout profile={profile} />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/news" element={<NewsList />} />
                  <Route path="/news/:slug" element={<NewsArticle />} />
                  <Route path="/vision-mission-values" element={<VisionMissionValues />} />
                  <Route path="/unsubscribe/:id" element={<Unsubscribe />} />
                </Route>

                {/* Auth Routes */}
                <Route element={<PublicLayout profile={profile} />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Route>
                <Route path="/auth/google/callback" element={<GoogleCallback />} />

                {/* Admin Routes */}
                <Route element={<ProtectedRoute />}>
                  {['admin', 'storekeeper', 'employee', 'partner', 'managingdirector', 'directorfinance', 'siteengineer', 'engineeringstudio'].map(base => {
                    const b = `/${base}`;
                    return (
                      <Route key={base} path={b} element={<AdminLayout basePath={b} />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="profile" element={<ProfileManagement />} />
                        <Route path="subscribers" element={<Subscribers />} />
                        <Route path="messages" element={<Navigate to={`${b}/messages/inbox`} replace />} />
                        <Route path="messages/inbox" element={<MessagesInbox />} />
                        <Route path="messages/sent" element={<MessagesSent />} />
                        <Route path="messages/trash" element={<MessagesTrash />} />
                        <Route path="resources" element={<Resources />} />
                        <Route path="users" element={<Users />} />
                        <Route path="registration" element={<Registration />} />
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
                        <Route path="salary-history" element={<SalaryHistory />} />
                        <Route path="site-activities" element={<SiteActivities />} />
                        <Route path="material-requests" element={<MaterialRequests />} />
                        <Route path="requests" element={<Requests />} />
                        <Route path="engineering-submissions" element={<EngineeringSubmissions />} />
                        <Route path="daily-reports" element={<DailyReports />} />
                        <Route path="insurance" element={<InsuranceSettings />} />
                        <Route path="money-requisition" element={<MoneyRequisitions />} />
                        <Route path="client-reports" element={<ClientReports />} />
                        <Route path="petty-cash" element={<PettyCash />} />
                        <Route path="petty-cash-voucher" element={<PettyCashVoucher />} />
                        <Route path="admin-updates" element={<AdminUpdates />} />
                        <Route path="create-contract" element={<CreateContract />} />
                        <Route path="project-evidence" element={<ProjectEvidence />} />
                    <Route path="site-rules" element={<SiteRules />} />
                        <Route path="approvals" element={<Navigate to="../requests" replace />} />
                        <Route path="contracts" element={<CreateContract />} />
                        <Route path="project-progress" element={<ProjectProgress />} />
                        <Route path="updates" element={<PartnerUpdates />} />
                        <Route path="approvements" element={<Navigate to="../requests" replace />} />
                        <Route path="stock/in" element={<Stock />} />
                        <Route path="stock/out" element={<Stock />} />
                        <Route path="stock/categories" element={<StockCategories />} />
                        <Route path="sites/:id" element={<ProjectDetail />} />
                        <Route path="projects/:id" element={<Navigate to="../sites" replace />} />
                        <Route path="daily-tasks" element={<DailyTasks />} />
                        <Route path="assign-tasks" element={<AssignTasks />} />
                        <Route path="engineering-studio" element={<EngineeringStudio />} />
                        <Route path="engineering-studio/submissions" element={<EngineeringSubmissions />} />
                        <Route path="engineering-studio/designs" element={<Designs />} />
                        <Route path="engineering-studio/create-tasks" element={<AssignTasks />} />
                        <Route path="engineering-studio/report-to-admin" element={<ReportToAdmin />} />
                        <Route path="engineering-studio/share" element={<ShareFiles />} />
                      </Route>
                    );
                  })}
                </Route>

                {/* Client Panel Route */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/client-panel" element={<ClientLayout basePath="/client-panel" />}>
                    <Route index element={<ClientDashboard />} />
                    <Route path="profile" element={<ClientProfile />} />
                    <Route path="sites" element={<ClientSites />} />
                    <Route path="updates" element={<ClientUpdates />} />
                    <Route path="progress-reports" element={<ClientProgressReports />} />
                    <Route path="site-rules" element={<ClientSiteRules />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
