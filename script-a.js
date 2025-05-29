/**
 * Hash deterministik dengan format 'xxxx-xxxx' (huruf kecil + angka).
 * Menggunakan SHA-256 → hasil acak tapi tetap untuk input sama.
 * 
 * @param {string} input
 * @returns {Promise<string>} hasil hash seperti 'k8p2-vz9q'
 */
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


/**
 * Hash password menggunakan bcrypt.js
 * @param {string} plainTextPassword - Password asli yang ingin di-hash
 * @param {number} saltRounds - Jumlah salt rounds (default: 12)
 * @returns {Promise<string>} Hash bcrypt
 */
function hashPassword(plainTextPassword, saltRounds = 12) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(saltRounds, function (err, salt) {
      if (err) return reject(err);
      bcrypt.hash(plainTextPassword, salt, function (err, hash) {
        if (err) return reject(err);
        resolve(hash);
      });
    });
  });
}

/**
 * Verifikasi password terhadap hash bcrypt
 * @param {string} plainTextPassword - Password asli yang dimasukkan pengguna
 * @param {string} hashedPassword - Hash bcrypt yang tersimpan
 * @returns {Promise<boolean>} Apakah cocok
 */
function verifyPassword(plainTextPassword, hashedPassword) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(plainTextPassword, hashedPassword, function (err, result) {
      if (err) return reject(err);
      resolve(result);
    });
  });
}
