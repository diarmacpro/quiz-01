function ensureString(val) {
  if (Array.isArray(val)) return val[0] || '';
  return typeof val === 'string' ? val : '';
}

function toProperCase(str) {
  return (str || '')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

async function fetchAndMergeData() {
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
    const [d, m, y, time] = localeDate.replace(',', '').split(/[/\s]+/);
    return `${y}-${m}-${d} ${time}`;
  }

  function ckArr(data) {
    const rsA = Array.isArray(data)
    const rsB = rsA ? _.uniq(data) : data;
    return rsB.length === 1 ? rsB[0] : rsB;
  }

  // === Fetch Script A ===
  const dataA = await axios.get('https://diarcourse-b4b67-default-rtdb.asia-southeast1.firebasedatabase.app/course.json')
    .then(response => {
      return _.map(response.data["data-engineering-fundamental"]["sesi-1"], (v, k) => {
        return {
          nama: v.fullName || '',
          age: v.age || '',
          country: v.passive.ipInfo.country || '',
          language: v.passive.language || '',
          cityA: v.city || '',
          cityB: v.passive.ipInfo.city || '',
          region: v.passive.ipInfo.region || '',
          hostname: v.passive.ipInfo.hostname || '',
          postal: v.passive.ipInfo.postal || '',
          isp: v.passive.ipInfo.org || '',
          ip: v.passive.ipInfo.ip || '',
          screenH: v.passive.screenResolution.height || '',
          screenW: v.passive.screenResolution.width || '',
          whatsapp: v.whatsapp || '',
          email: v.email || '',
          field: v.field || '',
          status: v.status || '',
          DayOfWeek: v.passive.visitTime.dayOfWeek || '',
          LocalTime: v.passive.visitTime.localTime || '',
          stamp: convertToIndoTime(v.passive.timestamp) || '',
        };
      });
    });

  // === Fetch Script B ===
  const dataB = await axios.get('https://diarcourse-b4b67-default-rtdb.asia-southeast1.firebasedatabase.app/x-course.json')
    .then(response => {
      const dtA = response.data["data-engineering-fundamental"]["sesi-1"];
      const dtRes = _.map(dtA, (v, k) => {
        const merged = {};
        _.forEach(v, obj => {
          _.forEach(obj, (val, key) => {
            if (merged[key]) {
              if (!Array.isArray(merged[key])) {
                merged[key] = [merged[key]];
              }
              merged[key].push(val);
            } else {
              merged[key] = val;
            }
          });
        });
        return merged;
      });

      const dtMapped = _.map(dtRes, (v, k) => {
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
          stamp: _.min(_.flatten([v.time_end || [], v.time_start || [], v.timestamp || []]).filter(Boolean)),
        };
      });

      return dtMapped
        .filter(obj => obj.nama !== '' && obj.nama !== null && obj.nama !== undefined)
        .map(v => ({
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
          stamp: ckArr(v.stamp)
        }));
    });

  // === Merge keduanya berdasarkan nama ===
  const mergedMap = new Map();

  dataA.forEach(entry => {
    if (entry.nama) {
      mergedMap.set(entry.nama, { ...entry });
    }
  });

  dataB.forEach(entry => {
    if (entry.nama) {
      const existing = mergedMap.get(entry.nama) || {};
      mergedMap.set(entry.nama, { ...existing, ...entry });
    }
  });

  const finalData = Array.from(mergedMap.values()).map(item => {
    return {
      ...item,
      cityA: toProperCase(ensureString(item.cityA)),
      cityB: toProperCase(ensureString(item.cityB)),
      nama: toProperCase(ensureString(item.nama)),
      email: ensureString(item.email).toLowerCase()
    };
  });

  console.log(finalData);
}
fetchAndMergeData();