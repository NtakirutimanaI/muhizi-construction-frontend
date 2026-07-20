const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function loadPageCache<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem('pgcache_' + key);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL) return null;
        return data as T;
    } catch { return null; }
}

export function savePageCache(key: string, data: any) {
    try {
        localStorage.setItem('pgcache_' + key, JSON.stringify({ data, ts: Date.now() }));
    } catch { /* ignore quota errors */ }
}
