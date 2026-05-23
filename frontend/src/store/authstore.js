import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { emitSessionActivity } from '../auth/sessionEvents';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      sessionStartedAt: null,
      setSession: (token, user) => {
        set({ token, user, sessionStartedAt: Date.now() });
        emitSessionActivity();
      },
      clearSession: () => set({ token: null, user: null, sessionStartedAt: null }),
    }),
    { name: 'hotel-auth' },
  ),
);
