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