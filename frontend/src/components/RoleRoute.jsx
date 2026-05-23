import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authstore';

/**
 * Requires login with a non-empty role. All tabs allow any such staff (ACL is open for now).
 */
export default function RoleRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const raw = typeof user?.role === 'string' ? user.role.trim() : '';

  if (!raw) {
    return <Navigate to="/dashboard" state={{ accessDenied: 'no-role' }} replace />;
  }

  return children;
}
