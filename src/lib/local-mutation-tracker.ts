const pending = new Set<string>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function markLocalMutation(key: string, ttlMs = 4000) {
  pending.add(key);
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);
  timers.set(
    key,
    setTimeout(() => {
      pending.delete(key);
      timers.delete(key);
    }, ttlMs),
  );
}

export function consumeLocalMutation(key: string) {
  if (!pending.has(key)) return false;
  pending.delete(key);
  const timer = timers.get(key);
  if (timer) {
    clearTimeout(timer);
    timers.delete(key);
  }
  return true;
}
