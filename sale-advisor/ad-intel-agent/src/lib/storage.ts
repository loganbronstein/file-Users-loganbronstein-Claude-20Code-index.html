import type { SavedCreative, GenerateResponse } from "./types";

const STORAGE_KEY = "sale-advisor-creatives";

export function getCreatives(): SavedCreative[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCreative(response: GenerateResponse): SavedCreative {
  const creative: SavedCreative = {
    ...response,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    starred: false,
  };
  const existing = getCreatives();
  existing.unshift(creative);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return creative;
}

export function toggleStar(id: string): void {
  const creatives = getCreatives();
  const idx = creatives.findIndex((c) => c.id === id);
  if (idx !== -1) {
    creatives[idx].starred = !creatives[idx].starred;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(creatives));
  }
}

export function deleteCreative(id: string): void {
  const creatives = getCreatives().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creatives));
}
