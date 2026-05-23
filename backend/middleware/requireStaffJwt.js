import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../lib/jwt.js';
import { canAccessUserManagement, normalizeJwtRole } from '../lib/roles.js';

/**
 * Valid JWT; sets req.auth = { staffId, role, username } with role normalized (Admin → SystemAdmin).
 */
export function requireStaffJwt(req, res, next) {
  const header = req.get('Authorization');
  const raw = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!raw) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }
  try {
    const payload = jwt.verify(raw, getJwtSecret());
    const role = normalizeJwtRole(payload.role);
    const staffId = Number(payload.sub);
    if (!Number.isFinite(staffId)) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token.' });
    }
    req.auth = {
      staffId,
      role,
      username: payload.username,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired session.' });
  }
}

/** User management (hierarchy-based staff CRUD). */
export function requireUserManagementJwt(req, res, next) {
  const header = req.get('Authorization');
  const raw = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!raw) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }
  try {
    const payload = jwt.verify(raw, getJwtSecret());
    const role = normalizeJwtRole(payload.role);
    if (!canAccessUserManagement(role)) {
      return res.status(403).json({ error: 'Forbidden', message: 'You cannot manage staff accounts.' });
    }
    const staffId = Number(payload.sub);
    if (!Number.isFinite(staffId)) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token.' });
    }
    req.auth = {
      staffId,
      role,
      username: payload.username,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired session.' });
  }
}
