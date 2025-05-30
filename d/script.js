import { BucketManager } from './bucketManager.js';

(async () => {
    const bucketManager = new BucketManager('quis', 'cdn');
    const jsonURL = 'https://users-data.diarcourse.workers.dev/?x=data';

    try {
        await bucketManager.init();

        // Caching semua resource (JS dan JSON)
        const resources = [
            { url: 'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js', type: 'js' },
            { url: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js', type: 'js' },
            { url: 'https://cdn.jsdelivr.net/npm/axios@1.9.0/dist/axios.min.js', type: 'js' },
            { url: jsonURL, type: 'json' }
        ];
        await bucketManager.cacheResources(resources);

        // Load jQuery & Lodash dari cache dan tunggu selesai
        await bucketManager.loadScriptFromCache('https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js');
        await bucketManager.loadScriptFromCache('https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js');

        // Load JSON
        const jsonData = await bucketManager.loadJSON(jsonURL);
        window.dtA = jsonData.data;
        console.log('[INFO] Data loaded:', window.dtA);

        // Jalankan kode lokal setelah jQuery dan Lodash siap
        if (window.$ && window._) {
            $(document).ready(() => {
                console.log(`[INFO] jQuery ready, Lodash version: ${_.VERSION}`);
                // Tambahkan logika lokal di sini
            });
        } else {
            console.warn('[WARN] jQuery atau Lodash tidak tersedia.');
        }

    } catch (err) {
        console.error(`[ERROR] ${err.message}`);
    }
})();
