/**
 * Storage Engine for Nabung Kuy!
 * Handles LocalStorage & IndexedDB for isolated multi-user data and receipt images.
 */

const STORAGE_KEYS = {
  USERS: 'nabungkuy_users',
  ACTIVE_SESSION: 'nabungkuy_session',
  USER_DATA_PREFIX: 'nabungkuy_data_'
};

// IndexedDB for Storing Receipts
const DB_NAME = 'NabungKuyReceiptsDB';
const DB_VERSION = 1;
const STORE_NAME = 'receipts';

let dbInstance = null;

function initReceiptsDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported, falling back to localStorage');
      return resolve(null);
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };
    request.onerror = (e) => {
      console.error('Failed to open IndexedDB', e);
      resolve(null);
    };
  });
}

const StorageEngine = {
  // Users management
  getUsers() {
    try {
      const users = localStorage.getItem(STORAGE_KEYS.USERS);
      return users ? JSON.parse(users) : [];
    } catch (e) {
      console.error('Failed to get users', e);
      return [];
    }
  },

  saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  // Active Session
  getActiveSession() {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  },

  setActiveSession(user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(user));
    }
  },

  // User-isolated data
  getUserData(username) {
    try {
      const key = STORAGE_KEYS.USER_DATA_PREFIX + username;
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
      // Return fresh default data clone
      return JSON.parse(JSON.stringify(window.DEFAULT_DATA));
    } catch (e) {
      console.error('Failed to load user data', e);
      return JSON.parse(JSON.stringify(window.DEFAULT_DATA));
    }
  },

  saveUserData(username, data) {
    try {
      const key = STORAGE_KEYS.USER_DATA_PREFIX + username;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save user data', e);
    }
  },

  // Receipt image storage (IndexedDB with LocalStorage fallback)
  async saveReceipt(txId, dataUrl) {
    const db = await initReceiptsDB();
    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put({ id: txId, dataUrl, timestamp: Date.now() });
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });
    } else {
      try {
        localStorage.setItem(`nabungkuy_receipt_${txId}`, dataUrl);
        return true;
      } catch (e) {
        console.warn('LocalStorage quota exceeded for receipt image');
        return false;
      }
    }
  },

  async getReceipt(txId) {
    const db = await initReceiptsDB();
    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(txId);
          req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    } else {
      return localStorage.getItem(`nabungkuy_receipt_${txId}`);
    }
  },

  async deleteReceipt(txId) {
    const db = await initReceiptsDB();
    if (db) {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(txId);
      } catch (e) {}
    }
    localStorage.removeItem(`nabungkuy_receipt_${txId}`);
  }
};

window.StorageEngine = StorageEngine;
