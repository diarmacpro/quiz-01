function ensureString(val) {
  if (Array.isArray(val)) return val[0] || '';
  return typeof val === 'string' ? val : '';
}

function toProperCase(str) {
  return (str || '').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

async function fetchAndMergeData() {
  function convertToIndoTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const options = {
      timeZone: 'Asia/Jakarta',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    };
    const localeDate = new Intl.DateTimeFormat('en-GB', options).format(date);
    const [d, m, y, time] = localeDate.replace(',', '').split(/[/\s]+/);
    return `${y}-${m}-${d} ${time}`;
  }

  function ckArr(data) {
    if (Array.isArray(data)) {
      const uniq = _.uniq(data.filter(Boolean));
      return uniq.length === 1 ? uniq[0] : uniq;
    }
    return data ?? '';
  }

  // Gabungkan dengan logika ambil data terbaru jika ada properti yang bentrok
  function mergePreferLatest(obj1, obj2) {
    const result = { ...obj1 };
    const time1 = new Date(obj1.stamp || 0).getTime();
    const time2 = new Date(obj2.stamp || 0).getTime();

    for (const key in obj2) {
      if (!result[key] || result[key] === '') {
        result[key] = obj2[key]; // ambil kalau kosong
      } else if (obj2[key] && obj2[key] !== '' && obj2[key] !== result[key]) {
        // Kalau bentrok, pilih yang timestamp-nya terbaru
        if (time2 > time1) {
          result[key] = obj2[key];
        }
      }
    }
    return result;
  }

  const dataA = await axios.get('https://diarcourse-b4b67-default-rtdb.asia-southeast1.firebasedatabase.app/course.json')
    .then(res => _.map(res.data["data-engineering-fundamental"]["sesi-1"], v => ({
      nama: v.fullName || '',
      ip: v.passive?.ipInfo?.ip || '',
      age: v.age || '',
      country: v.passive?.ipInfo?.country || '',
      language: v.passive?.language || '',
      cityA: v.city || '',
      cityB: v.passive?.ipInfo?.city || '',
      region: v.passive?.ipInfo?.region || '',
      hostname: v.passive?.ipInfo?.hostname || '',
      postal: v.passive?.ipInfo?.postal || '',
      isp: v.passive?.ipInfo?.org || '',
      screen : `${v.passive?.screenResolution?.height || ''} x ${v.passive?.screenResolution?.width || ''}`,
      whatsapp: v.whatsapp || '',
      email: v.email || '',
      field: v.field || '',
      status: v.status || '',
      DayOfWeek: v.passive?.visitTime?.dayOfWeek || '',
      LocalTime: v.passive?.visitTime?.localTime || '',
      stamp: v.passive?.timestamp || ''
    })));

  const dataB = await axios.get('https://diarcourse-b4b67-default-rtdb.asia-southeast1.firebasedatabase.app/x-course.json')
    .then(res => {
      const dtA = res.data["data-engineering-fundamental"]["sesi-1"];
      return _.map(dtA, v => {
        const merged = {};
        _.forEach(v, obj => {
          _.forEach(obj, (val, key) => {
            if (merged[key]) {
              if (!Array.isArray(merged[key])) merged[key] = [merged[key]];
              merged[key].push(val);
            } else {
              merged[key] = val;
            }
          });
        });
        return {
          nama: ckArr(merged.fullName),
          ip: ckArr(merged.ipInfo?.ip),
          age: ckArr(merged.age),
          country: ckArr(merged.ipInfo?.country),
          language: ckArr(merged.language),
          cityA: ckArr(merged.city),
          cityB: ckArr(merged.ipInfo?.city),
          region: ckArr(merged.ipInfo?.region),
          hostname: ckArr(merged.ipInfo?.hostname),
          postal: ckArr(merged.ipInfo?.postal),
          isp: ckArr(merged.ipInfo?.org),
          screen : `${ckArr(merged.screenResolution?.height)} x ${ckArr(merged.screenResolution?.width)}`,
          whatsapp: ckArr(merged.whatsapp),
          email: ckArr(merged.email),
          field: ckArr(merged.field),
          status: ckArr(merged.status),
          DayOfWeek: ckArr(merged.visitTime?.dayOfWeek),
          LocalTime: ckArr(merged.visitTime?.localTime),
          stamp: ckArr(_.min(_.flatten([merged.time_end, merged.time_start, merged.timestamp]).filter(Boolean)))
        };
      });
    });

  const allData = [...dataA, ...dataB];
  const merged = [];

for (const entry of allData) {
  const ipKey = ensureString(entry.ip).trim();
  const emailKey = ensureString(entry.email).trim().toLowerCase();
  const nameKey = ensureString(entry.nama).trim().toLowerCase();

  if (!ipKey && !emailKey && !nameKey) continue; // skip jika semua kosong

  let foundIdx = merged.findIndex(e => {
    const eIp = ensureString(e.ip).trim();
    const eEmail = ensureString(e.email).trim().toLowerCase();
    const eName = ensureString(e.nama).trim().toLowerCase();

    return (
      (ipKey && ipKey === eIp) ||
      (emailKey && emailKey === eEmail) ||
      (!ipKey && !emailKey && nameKey && nameKey === eName)
    );
  });

  if (foundIdx >= 0) {
    merged[foundIdx] = mergePreferLatest(merged[foundIdx], entry);
  } else {
    merged.push({ ...entry });
  }
}



  // Filter hanya data yang lengkap: punya nama dan ip
  const finalData = merged
    .filter(item => ensureString(item.nama).trim() !== '' && ensureString(item.ip).trim() !== '')
    .map(item => ({
      ...item,
      nama: toProperCase(ensureString(item.nama)),
      email: ensureString(item.email).toLowerCase(),
      cityA: toProperCase(ensureString(item.cityA)),
      cityB: toProperCase(ensureString(item.cityB)),
    }));

  // console.log(finalData);

  const finalDataCleaned = finalData.map(item => {
    const newItem = { ...item };
    for (const key in newItem) {
      if (Array.isArray(newItem[key])) {
        newItem[key] = newItem[key].join(', ');
      }
    }
    return newItem;
  });

  console.log(finalDataCleaned);
}

fetchAndMergeData();
