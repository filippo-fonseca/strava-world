"use client";

import type { RunActivity } from "@/lib/types";

const DB_NAME = "strava-world";
const STORE = "runs";
const DB_VERSION = 2;

/** Bump when cached shape changes so old IndexedDB rows are discarded. */
export const RUNS_CACHE_SCHEMA_VERSION = 2;

export type CachedRuns = {
  athleteId: number | "demo";
  isDemo: boolean;
  syncedAt: string;
  /** Newest activity startDate at last successful sync (for incremental cursor). */
  newestStartDate?: string | null;
  schemaVersion: number;
  activities: RunActivity[];
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "athleteId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("idb open failed"));
  });
}

function cacheKey(athleteId: number | null | undefined, isDemo: boolean) {
  if (isDemo) return "demo" as const;
  if (!athleteId) return null;
  return athleteId;
}

export async function readRunsCache(
  athleteId: number | null | undefined,
  isDemo: boolean,
): Promise<CachedRuns | null> {
  if (typeof indexedDB === "undefined") return null;
  const key = cacheKey(athleteId, isDemo);
  if (key == null) return null;

  try {
    const db = await openDb();
    const row = await new Promise<CachedRuns | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () =>
        resolve((req.result as CachedRuns | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error("idb read failed"));
    });

    if (!row) return null;
    if ((row.schemaVersion ?? 1) < RUNS_CACHE_SCHEMA_VERSION) {
      await clearRunsCache(athleteId, isDemo);
      return null;
    }
    return row;
  } catch {
    return null;
  }
}

export async function writeRunsCache(payload: CachedRuns): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({
        ...payload,
        schemaVersion: RUNS_CACHE_SCHEMA_VERSION,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb write failed"));
    });
  } catch {
    // Ignore quota / private-mode failures; network path still works.
  }
}

export async function clearRunsCache(
  athleteId?: number | null,
  isDemo = false,
): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      if (athleteId != null || isDemo) {
        const key = cacheKey(athleteId, isDemo);
        if (key != null) store.delete(key);
      } else {
        store.clear();
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb clear failed"));
    });
  } catch {
    // no-op
  }
}

export function isCacheFresh(syncedAt: string, maxAgeMs: number) {
  const ts = Date.parse(syncedAt);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < maxAgeMs;
}

export function formatSyncedAt(syncedAt: string | null | undefined) {
  if (!syncedAt) return "Never synced";
  const ts = Date.parse(syncedAt);
  if (!Number.isFinite(ts)) return "Never synced";

  const deltaSec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (deltaSec < 60) return "Synced just now";
  if (deltaSec < 3600) return `Synced ${Math.floor(deltaSec / 60)}m ago`;
  if (deltaSec < 86400) return `Synced ${Math.floor(deltaSec / 3600)}h ago`;
  return `Synced ${Math.floor(deltaSec / 86400)}d ago`;
}

/** Soft freshness window — background incremental sync after this. */
export const RUNS_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 6;

/** Force a full rebuild if the local atlas is older than this. */
export const RUNS_FULL_REBUILD_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;
