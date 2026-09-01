const RATE_LIMIT_PATTERNS = [
  /rate limit exceeded/i,
  /too many attempts/i,
];

export function isRateLimitError(message: string): boolean {
  return RATE_LIMIT_PATTERNS.some((pattern) => pattern.test(message));
}

export function formatErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}
