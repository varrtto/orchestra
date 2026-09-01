/** Server-side auth rate limits (enforced in /api/auth/* routes). */
export const AUTH_RATE_LIMITS = {
  login: { maxCount: 5, windowSeconds: 60 },
  signup: { maxCount: 3, windowSeconds: 3600 },
  passwordRecovery: { maxCount: 3, windowSeconds: 3600 },
} as const;

/** Database-enforced per-user limits (see supabase/migrations/009_rate_limits.sql). */
export const BOARD_RATE_LIMITS = {
  createBoard: { maxCount: 5, windowSeconds: 60 },
  createList: { maxCount: 20, windowSeconds: 60 },
  createCard: { maxCount: 30, windowSeconds: 60 },
  createComment: { maxCount: 10, windowSeconds: 60 },
  createInvite: { maxCount: 5, windowSeconds: 60 },
} as const;
