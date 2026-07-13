import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { canAccess, getRolePath } from '../config/roles';

const ProtectedRoute = () => {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return <Loading />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const role = user?.role || '';
    const rolePath = getRolePath(role);

    // Always allow the base role path (e.g. /client-panel)
    if (location.pathname === rolePath) {
        return <Outlet />;
    }

    if (!canAccess(location.pathname, role)) {
        return <Navigate to={rolePath} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
