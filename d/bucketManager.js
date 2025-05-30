export class BucketManager {
    constructor(bucketName, cacheName) {
        this.bucketName = bucketName;
        this.cacheName = cacheName;
        this.bucket = null;
    }

    async init() {
        if (!('storageBuckets' in navigator)) {
            throw new Error('Storage Buckets API not supported.');
        }
        this.bucket = await navigator.storageBuckets.open(this.bucketName);
        console.log(`[INFO] Bucket "${this.bucketName}" opened.`);
    }

    async cacheResources(resources) {
        const cache = await this.bucket.caches.open(this.cacheName);
        console.log(`[INFO] Caching resources into: ${this.cacheName}`);

        for (const { url } of resources) {
            const cached = await cache.match(url);
            if (!cached) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        await cache.put(url, response.clone());
                        console.log(`[INFO] Cached: ${url}`);
                    } else {
                        console.warn(`[WARN] Fetch failed: ${url} - ${response.status}`);
                    }
                } catch (err) {
                    console.error(`[ERROR] Fetch error for ${url}: ${err.message}`);
                }
            } else {
                console.log(`[INFO] Already cached: ${url}`);
            }
        }
    }

    async loadJSON(url) {
        const cache = await this.bucket.caches.open(this.cacheName);
        const response = await cache.match(url);
        if (!response) throw new Error(`JSON not cached: ${url}`);
        const data = await response.json();
        console.log(`[INFO] Loaded JSON from cache: ${url}`);
        return data;
    }

    async loadScriptFromCache(url) {
        const cache = await this.bucket.caches.open(this.cacheName);
        const response = await cache.match(url);
        if (!response) throw new Error(`Script not cached: ${url}`);
        const scriptContent = await response.text();
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.textContent = scriptContent;
            script.onload = () => {
                console.log(`[INFO] Loaded script: ${url}`);
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.body.appendChild(script);
        });
    }
}
