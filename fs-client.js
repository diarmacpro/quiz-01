import {
  collection, addDoc, doc, getDoc, getDocs,
  setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

/**
 * FirestoreClient
 * Abstraksi modular untuk CRUD dan realtime listener pada Firebase Firestore.
 */
export class FirestoreClient {
  /**
   * @param {Firestore} db - Instance Firestore dari inisialisasi Firebase
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * 📄 Ambil semua dokumen dalam koleksi
   * @param {string} colName - Nama koleksi
   * @param {function} [callback] - Callback opsional, menerima array dokumen
   * @returns {Promise<Array>} - Array dokumen dengan id
   *
   * 🔧 Usage:
   * client.getAll('users', data => console.log(data));
   */
  async getAll(colName, callback) {
    try {
      const snap = await getDocs(collection(this.db, colName));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback?.(data);
      return data;
    } catch (err) {
      console.error('getAll error:', err);
      throw err;
    }
  }

  /**
   * 🔍 Ambil satu dokumen berdasarkan ID
   * @param {string} colName - Nama koleksi
   * @param {string} docId - ID dokumen
   * @param {function} [callback] - Callback opsional, menerima 1 dokumen
   * @returns {Promise<Object|null>}
   *
   * 🔧 Usage:
   * client.getOne('users', 'abc123', data => console.log(data));
   */
  async getOne(colName, docId, callback) {
    try {
      const ref = doc(this.db, colName, docId);
      const snap = await getDoc(ref);
      const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      callback?.(data);
      return data;
    } catch (err) {
      console.error('getOne error:', err);
      throw err;
    }
  }

  /**
   * 🆕 Tambahkan dokumen baru (ID otomatis)
   * @param {string} colName - Nama koleksi
   * @param {Object} data - Isi dokumen
   * @param {function} [callback] - Callback opsional, menerima dokumen dengan id
   * @returns {Promise<Object>}
   */
  async add(colName, data, callback) {
    try {
      const colRef = collection(this.db, colName);
      const docRef = await addDoc(colRef, data);
      const result = { id: docRef.id, ...data };
      callback?.(result);
      return result;
    } catch (err) {
      console.error('add error:', err);
      throw err;
    }
  }

  /**
   * ➕ Tambahkan dokumen dengan ID spesifik (replace jika sudah ada)
   * @param {string} colName - Nama koleksi
   * @param {string} docId - ID dokumen
   * @param {Object} data - Isi dokumen
   * @param {function} [callback] - Callback opsional
   * @returns {Promise<boolean>}
   */
  async set(colName, docId, data, callback) {
    try {
      const ref = doc(this.db, colName, docId);
      await setDoc(ref, data);
      callback?.(true);
      return true;
    } catch (err) {
      console.error('set error:', err);
      throw err;
    }
  }

  /**
   * ✏️ Update sebagian isi dokumen
   * @param {string} colName - Nama koleksi
   * @param {string} docId - ID dokumen
   * @param {Object} partialData - Data yang akan diupdate
   * @param {function} [callback] - Callback opsional
   * @returns {Promise<boolean>}
   */
  async update(colName, docId, partialData, callback) {
    try {
      const ref = doc(this.db, colName, docId);
      await updateDoc(ref, partialData);
      callback?.(true);
      return true;
    } catch (err) {
      console.error('update error:', err);
      throw err;
    }
  }

  /**
   * ❌ Hapus dokumen berdasarkan ID
   * @param {string} colName - Nama koleksi
   * @param {string} docId - ID dokumen
   * @param {function} [callback] - Callback opsional
   * @returns {Promise<boolean>}
   */
  async remove(colName, docId, callback) {
    try {
      const ref = doc(this.db, colName, docId);
      await deleteDoc(ref);
      callback?.(true);
      return true;
    } catch (err) {
      console.error('remove error:', err);
      throw err;
    }
  }

  /**
   * 🔎 Query koleksi dengan filter, urutan dan batasan jumlah
   * @param {string} colName - Nama koleksi
   * @param {Array} [filters=[]] - Contoh: [['age', '>=', 20]]
   * @param {Array|null} [order=null] - Contoh: ['createdAt', 'desc']
   * @param {number|null} [limitVal=null] - Contoh: 10
   * @param {function} [callback] - Callback opsional
   * @returns {Promise<Array>}
   */
  async find(colName, filters = [], order = null, limitVal = null, callback) {
    try {
      let q = collection(this.db, colName);

      if (filters.length) {
        q = query(q, ...filters.map(([field, op, value]) => where(field, op, value)));
      }

      if (order) {
        q = query(q, orderBy(...order));
      }

      if (limitVal) {
        q = query(q, limit(limitVal));
      }

      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback?.(data);
      return data;
    } catch (err) {
      console.error('find error:', err);
      throw err;
    }
  }

  /**
   * 👂 Listener realtime untuk koleksi (onSnapshot)
   * @param {string} colName - Nama koleksi
   * @param {function} callback - Akan dipanggil saat data berubah
   * @param {Array} [filters=[]] - Sama seperti `find`
   * @param {Array|null} [order=null] - Sama seperti `find`
   * @param {number|null} [limitVal=null] - Sama seperti `find`
   * @returns {function} - Fungsi unsubscribe, dipakai untuk menghentikan listener
   *
   * 🔧 Usage:
   * const stop = client.on('users', data => console.log(data));
   * stop(); // untuk hentikan listener
   */
  on(colName, callback, filters = [], order = null, limitVal = null) {
    try {
      let q = collection(this.db, colName);

      if (filters.length) {
        q = query(q, ...filters.map(([field, op, value]) => where(field, op, value)));
      }

      if (order) {
        q = query(q, orderBy(...order));
      }

      if (limitVal) {
        q = query(q, limit(limitVal));
      }

      const unsubscribe = onSnapshot(q, (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      });

      return unsubscribe;
    } catch (err) {
      console.error('on (realtime listener) error:', err);
      throw err;
    }
  }

  /**
   * 🛑 Stop realtime listener (off)
   * @param {function} unsubscribeFn - Fungsi dari `on(...)` sebelumnya
   * @returns {boolean}
   */
  off(unsubscribeFn) {
    try {
      unsubscribeFn?.(); // hentikan listener
      return true;
    } catch (err) {
      console.error('off (stop listener) error:', err);
      throw err;
    }
  }
}
