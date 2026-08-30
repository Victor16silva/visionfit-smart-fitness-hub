const storageKey = (userId: string) => `visionfit-favorites:${userId}`;

export function getFavoriteIds(userId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function isFavoriteId(userId: string, workoutId: string): boolean {
  return getFavoriteIds(userId).includes(workoutId);
}

export function toggleFavoriteId(userId: string, workoutId: string): string[] {
  const next = new Set(getFavoriteIds(userId));
  if (next.has(workoutId)) {
    next.delete(workoutId);
  } else {
    next.add(workoutId);
  }
  const ids = [...next];
  localStorage.setItem(storageKey(userId), JSON.stringify(ids));
  return ids;
}
