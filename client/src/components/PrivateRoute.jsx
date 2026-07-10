import { useAuth } from '../context/AuthContext';
import { useRouter } from '../App';
import { useEffect } from 'react';

/**
 * PrivateRoute — redirects to login if the user is not authenticated.
 * Usage: wrap a page component with <PrivateRoute> in App.jsx route definitions.
 */
export default function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('login');
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      navigate('login');
    }
  }, [user, loading, allowedRoles, navigate]);

  if (loading || !user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return children ?? null;
}
