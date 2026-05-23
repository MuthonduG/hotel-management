import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authstore';
import { getJwtExpiryMs } from '../auth/jwt';
import { SESSION_ACTIVITY_EVENT } from '../auth/sessionEvents';

const DEFAULT_INACTIVITY_MS = 15 * 60 * 1000;

function readInactivityMs() {
  const raw = import.meta.env.VITE_SESSION_INACTIVITY_MS;
  if (raw === undefined || raw === '') return DEFAULT_INACTIVITY_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_INACTIVITY_MS;
}

/**
 * Keeps the user signed in until logout, JWT expiry (if present), or inactivity timeout.
 */
export default function SessionManager() {
  const token = useAuthStore((s) => s.token);
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();
  const inactivityTimerRef = useRef(null);
  const jwtTimerRef = useRef(null);
  const inactivityMs = readInactivityMs();

  const endSession = useCallback(
    (reason) => {
      clearSession();
      if (reason === 'inactivity') {
        const mins = Math.max(1, Math.round(inactivityMs / 60_000));
        toast.error(`You were signed out after ${mins} minutes of inactivity.`, { id: 'session-end' });
      } else if (reason === 'jwt') {
        toast.error('Your session has expired. Please sign in again.', { id: 'session-end' });
      }
      navigate('/login', { replace: true });
    },
    [clearSession, navigate, inactivityMs],
  );

  const scheduleInactivity = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      endSession('inactivity');
    }, inactivityMs);
  }, [endSession, inactivityMs]);

  useEffect(() => {
    if (!token) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (jwtTimerRef.current) clearTimeout(jwtTimerRef.current);
      return;
    }

    const throttleMs = 750;
    let last = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - last < throttleMs) return;
      last = now;
      scheduleInactivity();
    };

    scheduleInactivity();

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    window.addEventListener(SESSION_ACTIVITY_EVENT, onActivity);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      window.removeEventListener(SESSION_ACTIVITY_EVENT, onActivity);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [token, scheduleInactivity]);

  useEffect(() => {
    if (!token) {
      if (jwtTimerRef.current) clearTimeout(jwtTimerRef.current);
      return;
    }

    const expMs = getJwtExpiryMs(token);
    if (!expMs) {
      return;
    }

    const now = Date.now();
    if (expMs <= now) {
      endSession('jwt');
      return;
    }

    jwtTimerRef.current = setTimeout(() => {
      endSession('jwt');
    }, expMs - now);

    return () => {
      if (jwtTimerRef.current) clearTimeout(jwtTimerRef.current);
    };
  }, [token, endSession]);

  return null;
}
