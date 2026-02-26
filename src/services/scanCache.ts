/**
 * In-memory LRU cache for wallet scan results
 * TTL: 60 seconds
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const TTL_MS = 60_000;
const MAX_ENTRIES = 200;

class ScanCache {
  private cache = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) { this.misses++; return null; }
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    // LRU: move to end
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;
    console.log(`[ScanCache] HIT for ${key.slice(0, 8)}... (${this.hits} hits, ${this.misses} misses)`);
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    // Evict oldest if at capacity
    if (this.cache.size >= MAX_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }
    this.cache.set(key, { data, expiresAt: Date.now() + TTL_MS });
  }

  getStats() {
    return { size: this.cache.size, hits: this.hits, misses: this.misses };
  }
}

export const scanCache = new ScanCache();
