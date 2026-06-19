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
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ProfileManagement from './pages/admin/ProfileManagement';
import ApiDocs from './pages/admin/ApiDocs';
import Messages from './pages/admin/Messages';
import Resources from './pages/admin/Resources';
import FooterSettings from './pages/admin/FooterSettings';
import Users from './pages/admin/Users';

import Settings from './pages/admin/Settings';

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

  // Allow the app to render even if public profile fetch fails, 
  // so the admin login can still be accessed, but show error for public routes if needed.
  // Ideally, we might want separate error boundary for public part.

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
                  {/* Projects is now part of Profile Management */}
                  <Route path="/admin/projects" element={<Navigate to="/admin/profile" replace />} />
                  <Route path="/admin/api-docs" element={<ApiDocs />} />
                  <Route path="/admin/messages" element={<Messages />} />
                  <Route path="/admin/resources" element={<Resources />} />
                  <Route path="/admin/footer-settings" element={<FooterSettings />} />
                  <Route path="/admin/users" element={<Users />} />
                  <Route path="/admin/settings" element={<Settings />} />
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
