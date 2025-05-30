function ckArr(data) {
  const rsA = Array.isArray(data)
  const rsB = rsA ? _.uniq(data) : data;
  return rsB.length === 1 ? rsB[0] : rsB;
}

function findX(data, path) {
  const value = _.get(data, path);

  if (Array.isArray(value)) {
    // Kalau array, cari semua x
    return value.map(item => item?.x).filter(x => x !== undefined);
  } else if (_.isObject(value)) {
    // Kalau objek langsung
    return value.x !== undefined ? [value.x] : [];
  }

  // Kalau bukan array/objek, return kosong
  return [];
}

function convertToIndoTime(isoString) {
  const date = new Date(isoString);
  const options = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  const localeDate = new Intl.DateTimeFormat('en-GB', options).format(date);
  
  // Konversi "DD/MM/YYYY, HH:MM:SS" jadi "YYYY-MM-DD HH:MM:SS"
  const [d, m, y, time] = localeDate.replace(',', '').split(/[/\s]+/);
  return `${y}-${m}-${d} ${time}`;
}

var dtA = {};
axios.get('https://diarcourse-b4b67-default-rtdb.asia-southeast1.firebasedatabase.app/x-course.json')
  .then(response => {
    dtA = response.data["data-engineering-fundamental"]["sesi-1"];

    // console.log(dtA);
    const dtRes = _.map(dtA, (v, k) => {
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

    // console.log(dtRes);
    return dtRes;
  })
  .then(dataA => {
    const dtRs = _.map(dataA, (v,k) => {
      return {
        nama: v.fullName || '',
        age: v.age || '',
        country: (v.ipInfo ? v.ipInfo.country : ''),
        language: v.language || '',
        cityA: v.city || '',
        cityB: (v.ipInfo ? v.ipInfo.city : ''),
        region: (v.ipInfo ? v.ipInfo.region : ''),
        hostname: (v.ipInfo ? v.ipInfo.hostname : ''),
        postal: (v.ipInfo ? v.ipInfo.postal : ''),
        isp: (v.ipInfo ? v.ipInfo.org : ''),
        ip: (v.ipInfo ? v.ipInfo.ip : ''),
        screenH: (v.screenResolution ? v.screenResolution.height : ''),
        screenW: (v.screenResolution ? v.screenResolution.width : ''),
        whatsapp: v.whatsapp || '',
        email: v.email || '',
        field: v.field || '',
        status: v.status || '',
        DayOfWeek: (v.visitTime ? v.visitTime.dayOfWeek : ''),
        LocalTime: (v.visitTime ? v.visitTime.localTime : ''),
        stamp: _.min(_.flatten([
          v.time_end || [],
          v.time_start || [],
          v.timestamp || []
        ])
        .filter(Boolean)),
        form: (v.form ? v.form.length : v.form)
      }
    })
    // console.log(dtRs);
    return dtRs;
  })
  .then(dataB => {
    const filtered = dataB.filter(obj => obj.nama !== '' && obj.nama !== null && obj.nama !== undefined);
    const dtRsA = _.map(filtered,(v,k)=>{
      return {
        nama: ckArr(v.nama),
        age: ckArr(v.age),
        country: ckArr(v.country),
        language: ckArr(v.language),
        cityA: ckArr(v.cityA),
        cityB: ckArr(v.cityB),
        region: ckArr(v.region),
        hostname: v.hostname || '',
        postal: ckArr(v.postal),
        isp: ckArr(v.isp),
        ip: ckArr(v.ip),
        screenH: v.screenH,
        screenW: v.screenW,
        whatsapp: ckArr(v.whatsapp),
        email: ckArr(v.email),
        field: ckArr(v.field),
        status: ckArr(v.status),
        DayOfWeek: ckArr(v.DayOfWeek),
        LocalTime: ckArr(v.LocalTime),
        stamp: ckArr(v.stamp),
      };
    });
    console.log(dtRsA);
  })
  .catch(error => {
    console.error('Gagal fetch data:', error);
  });
