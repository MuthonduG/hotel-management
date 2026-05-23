/** Navigation entries (paths must match routers). Icons resolved in shell. */
export const SIDEBAR_DEFS = [
  { path: '/dashboard', label: 'Overview', icon: 'dashboard' },
  { path: '/guests', label: 'Guests & arrivals', icon: 'guests' },
  { path: '/rooms', label: 'Rooms', icon: 'rooms' },
  { path: '/reports', label: 'Reports', icon: 'reports' },
  { path: '/admin/staff', label: 'Staff accounts', icon: 'staff' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

/** Every tab is shown for authenticated users with a role. */
export function getSidebarDefsForUser(user) {
  if (!hasRole(user)) {
    return SIDEBAR_DEFS.filter((d) => d.path === '/dashboard');
  }
  return SIDEBAR_DEFS;
}

function hasRole(user) {
  return user?.role != null && String(user.role).trim() !== '';
}
