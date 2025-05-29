import {
  collection, addDoc, doc, getDoc, getDocs,
  setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

export class FirestoreClient {
  constructor(db) {
    this.db = db;
  }

  // 📄 Ambil semua dokumen dari koleksi
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

  // 🔍 Ambil satu dokumen berdasarkan ID
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

  // 🆕 Tambah dokumen dengan ID otomatis
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

  // ➕ Tambah atau replace dokumen
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

  // ✏️ Update sebagian isi dokumen
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

  // ❌ Hapus dokumen
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

  // 🔎 Query dengan filter (opsional: order & limit)
  async find(colName, filters = [], order = null, limitVal = null, callback) {
    try {
      let ref = collection(this.db, colName);
      let q = ref;

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

// 👂 Dengarkan realtime update dari koleksi
on(colName, callback, filters = [], order = null, limitVal = null) {
  try {
    let ref = collection(this.db, colName);
    let q = ref;

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

    return unsubscribe; // untuk disimpan dan digunakan nanti untuk stop
  } catch (err) {
    console.error('on (realtime listener) error:', err);
    throw err;
  }
}

  // 🛑 Stop realtime listener (tinggal panggil fungsi unsubscribe)
  off(unsubscribeFn) {
    try {
      unsubscribeFn?.(); // ini akan menghentikan listener
      return true;
    } catch (err) {
      console.error('off (stop listener) error:', err);
      throw err;
    }
  }

}
