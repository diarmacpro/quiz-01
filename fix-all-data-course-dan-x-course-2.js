// Cloudflare Worker script

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    const result = await fetchAndMergeData();

    const timeNow = new Date().toISOString();
    const dataString = JSON.stringify(result);

    // Buat hash SHA-256 dalam hex
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(dataString)
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const responseBody = {
      data: result,
      time: timeNow,
      hash: hashHex
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { "Content-Type": "application/json;charset=UTF-8" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json;charset=UTF-8" }
    });
  }
}

// Utility functions

function ensureString(val) {
  if (Array.isArray(val)) return val[0] || '';
  return typeof val === 'string' ? val : '';
}

function toProperCase(str) {
  return (str || '').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function ckArr(data) {
  if (Array.isArray(data)) {
    // uniq function (simple)
    const uniq = [...new Set(data.filter(Boolean))];
    return uniq.length === 1 ? uniq[0] : uniq;
  }
  return data ?? '';
}

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

async function fetchAndMergeData() {
  // Fetch dataA dan dataB dengan fetch API (bukan axios, axios tidak ada di Cloudflare Worker)
  // NOTE: _.map dan _.forEach tidak tersedia di Worker, ganti dengan native JS map/forEach

  const resA = await fetch('https://diarcourse-b4b67-default-rtdb.asia-southeast1.firebasedatabase.app/course.json');
  const jsonA = await resA.json();
  const sesi1A = jsonA["data-engineering-fundamental"]["sesi-1"];
  const dataA = Object.values(sesi1A).map(v => ({
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
  }));

  const resB = await fetch('https://diarcourse-b4b67-default-rtdb.asia-southeast1.firebasedatabase.app/x-course.json');
  const jsonB = await resB.json();
  const sesi1B = jsonB["data-engineering-fundamental"]["sesi-1"];

  // Parsing dataB with native JS
  const dataB = Object.values(sesi1B).map(v => {
    const merged = {};
    v.forEach(obj => {
      for (const [key, val] of Object.entries(obj)) {
        if (merged[key]) {
          if (!Array.isArray(merged[key])) merged[key] = [merged[key]];
          merged[key].push(val);
        } else {
          merged[key] = val;
        }
      }
    });
    // min timestamp from keys time_end, time_start, timestamp (all possibly arrays)
    const timestamps = [].concat(
      merged.time_end || [],
      merged.time_start || [],
      merged.timestamp || []
    ).filter(Boolean);

    const minStamp = timestamps.length ? timestamps.reduce((a,b) => a < b ? a : b) : '';

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
      stamp: minStamp
    };
  });

  // Combine dataA and dataB, then merge by ip/email/name keys with prefer latest logic
  const allData = [...dataA, ...dataB];
  const merged = [];

  for (const entry of allData) {
    const ipKey = ensureString(entry.ip).trim();
    const emailKey = ensureString(entry.email).trim().toLowerCase();
    const nameKey = ensureString(entry.nama).trim().toLowerCase();

    if (!ipKey && !emailKey && !nameKey) continue;

    const foundIdx = merged.findIndex(e => {
      const eIp = ensureString(e.ip).trim();
      const eEmail = ensureString(e.email).trim().toLowerCase();
      const eName = ensureString(e.nama).trim().toLowerCase();
      return (ipKey && ipKey === eIp) ||
             (emailKey && emailKey === eEmail) ||
             (!ipKey && !emailKey && nameKey && nameKey === eName);
    });

    if (foundIdx >= 0) {
      merged[foundIdx] = mergePreferLatest(merged[foundIdx], entry);
    } else {
      merged.push({ ...entry });
    }
  }

  // Filter only complete data with nama and ip
  const finalData = merged
    .filter(item => ensureString(item.nama).trim() !== '' && ensureString(item.ip).trim() !== '')
    .map(item => ({
      ...item,
      nama: toProperCase(ensureString(item.nama)),
      email: ensureString(item.email).toLowerCase(),
      cityA: toProperCase(ensureString(item.cityA)),
      cityB: toProperCase(ensureString(item.cityB)),
    }));

  // Clean arrays to string joined by ", "
  const finalDataCleaned = finalData.map(item => {
    const newItem = { ...item };
    for (const key in newItem) {
      if (Array.isArray(newItem[key])) {
        newItem[key] = newItem[key].join(', ');
      }
    }
    return newItem;
  });

  return finalDataCleaned;
}
