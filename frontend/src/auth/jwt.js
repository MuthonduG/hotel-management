import { jwtDecode } from 'jwt-decode';

/**
 * Reads JWT `exp` (seconds since epoch) without verifying the signature.
 * Used only for client-side session UX; authorization must still happen on the server.
 */
export function getJwtExpiryMs(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const decoded = jwtDecode(token);
    if (typeof decoded.exp !== 'number') return null;
    return decoded.exp * 1000;
  } catch {
    return null;
  }
}
