/** Dispatched when the user or app does something that should reset the inactivity timer. */
export const SESSION_ACTIVITY_EVENT = 'hotel:session-activity';

export function emitSessionActivity() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SESSION_ACTIVITY_EVENT));
}
