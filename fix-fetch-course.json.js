function findValueByKey(obj, keyToFind) {
  let result = null;
  function search(obj) {
    if (_.isObject(obj)) {
      _.forOwn(obj, (value, key) => {
        if (key === keyToFind) {
          result = value;
        } else if (_.isObject(value)) {
          search(value);
        }
      });
    }
  }
  search(obj);
  return result;
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

axios.get('https://diarcourse-b4b67-default-rtdb.asia-southeast1.firebasedatabase.app/course.json')
  .then(response => {
    const mappedData = _.map(response.data["data-engineering-fundamental"]["sesi-1"],(v,k)=>{
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
      }
        
    })

    console.log(mappedData);

  })
  .catch(error => {
    console.error('Gagal fetch data:', error);
  });

