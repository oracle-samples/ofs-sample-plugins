import { BucketRow } from "./types";

const CACHE_KEY = "crewManagement.buckets.cache";
const RESOURCE_CACHE_KEY = "crewManagement.resources.cache";

interface BucketCachePayload {
  sessionId: string;
  buckets: BucketRow[];
}

interface ResourceCachePayload {
  sessionId: string;
  resources: BucketRow[];
}

function getSessionId(): string {
  const key = "crewManagement.session.id";
  const existing = window.sessionStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const created = `${Date.now()}`;
  window.sessionStorage.setItem(key, created);
  return created;
}

export class BucketCache {
  get(): BucketRow[] | null {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as BucketCachePayload;
      if (parsed.sessionId !== getSessionId()) {
        return null;
      }
      return Array.isArray(parsed.buckets) ? parsed.buckets : null;
    } catch (_error) {
      return null;
    }
  }

  set(buckets: BucketRow[]): void {
    const payload: BucketCachePayload = {
      sessionId: getSessionId(),
      buckets,
    };
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  }
}

export class ResourceCache {
  get(): BucketRow[] | null {
    const raw = window.sessionStorage.getItem(RESOURCE_CACHE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as ResourceCachePayload;
      if (parsed.sessionId !== getSessionId()) {
        return null;
      }
      return Array.isArray(parsed.resources) ? parsed.resources : null;
    } catch (_error) {
      return null;
    }
  }

  set(resources: BucketRow[]): void {
    const payload: ResourceCachePayload = {
      sessionId: getSessionId(),
      resources,
    };
    window.sessionStorage.setItem(RESOURCE_CACHE_KEY, JSON.stringify(payload));
  }
}
