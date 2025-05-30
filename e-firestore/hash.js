async function hashString(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Konversi ke base36 dari byte array
  const base36 = hashArray.map(b => b.toString(36).padStart(2, '0')).join('');

  // Ambil 8 karakter acak dari hasil hash dan format jadi xxxx-xxxx
  const slice = base36.slice(0, 8);
  return `${slice.slice(0, 4)}-${slice.slice(4, 8)}`;
}

function hashPassword(plainTextPassword, saltRounds = 10) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(saltRounds, (err, salt) => {
      if (err) return reject(err);
      bcrypt.hash(plainTextPassword, salt, (err, hash) => {
        if (err) return reject(err);
        resolve(hash);
      });
    });
  });
}

function verifyPassword(plainTextPassword, hashedPassword) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(plainTextPassword, hashedPassword, (err, result) => {
      if (err) return reject(err);
      resolve(result); // true jika cocok, false jika tidak
    });
  });
}
