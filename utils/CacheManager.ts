export class CacheManager {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  set(key: string, value: any, ttl: number = 3600) {
    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): any {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
    this.cache.delete(key);
    return null;
  }


  remove(key: string) {
    this.cache.delete(key);
  }

  clear(prefix: string) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clearAll() {
    this.cache.clear();
  }

}