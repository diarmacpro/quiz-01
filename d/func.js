/*
function gtDtUrl(url, callback) {
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Fetch gagal: ${response.status}`);
      }
      return response.json();
    })
    .then(data => callback(null, data))
    .catch(error => callback(error, null));
}
*/

// Misal BucketManager sudah diinisiasi dan ready sebagai bucketManager

async function gtDtUrl(url, callback) {
  try {
    const cache = await bucketManager.bucket.caches.open(bucketManager.cacheName);
    const cachedResponse = await cache.match(url);

    if (cachedResponse) {
      const data = await cachedResponse.json();
      callback(null, data);
      console.log('[INFO] Data diambil dari cache:', url);
    } else {
      // Kalau tidak ada di cache, fetch manual
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Fetch gagal: ${response.status}`);

      const data = await response.clone().json();

      // Simpan ke cache untuk penggunaan berikutnya
      await cache.put(url, response.clone());

      callback(null, data);
      console.log('[INFO] Data diambil dari fetch dan disimpan cache:', url);
    }
  } catch (err) {
    callback(err, null);
  }
}

