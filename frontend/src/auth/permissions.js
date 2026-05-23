function hasAssignableRole(user) {
  const raw = user?.role;
  return raw != null && String(raw).trim() !== '';
}

/**
 * All main app tabs are available to every staff member who has any role assigned.
 */
export function canAccessRoute(pathname, user) {
  if (!hasAssignableRole(user)) {
    return pathname === '/dashboard' || pathname === '/';
  }
  return true;
}

/**
 * Dashboard cards / KPI rail: any logged-in staff with a role sees operational widgets.
 */
export function canUseFeature(_feature, user) {
  return hasAssignableRole(user);
}
