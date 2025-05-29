var dtA = {};
axios.get('https://diarcourse-b4b67-default-rtdb.asia-southeast1.firebasedatabase.app/x-course.json')
  .then(response => {
    dtA = response.data["data-engineering-fundamental"]["sesi-1"];

    const dtB = _.map(dtA, (v, k) => {
      const merged = {};

      _.forEach(v, obj => {
        _.forEach(obj, (val, key) => {
          if (merged[key]) {
            // Kalau sudah ada, ubah jadi array (jika belum) lalu push value baru
            if (!Array.isArray(merged[key])) {
              merged[key] = [merged[key]];
            }
            merged[key].push(val);
          } else {
            // Kalau belum ada, langsung simpan
            merged[key] = val;
          }
        });
      });

      return merged;
    });

    console.log(dtB);
  })
  .catch(error => {
    console.error('Gagal fetch data:', error);
  });
