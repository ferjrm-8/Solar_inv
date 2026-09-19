import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch, 
  query, 
  getDocs,
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { SolarRecord, SolarSettings } from '../types/solar';
import { INITIAL_SOLAR_RECORDS, DEFAULT_SOLAR_SETTINGS } from '../data/initialData';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export type SyncStatus = 'connecting' | 'connected' | 'syncing' | 'offline' | 'error';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to determine active sync collection
// If user selects a shared system key, all devices with that key sync together!
const DEFAULT_SYSTEM_KEY = 'mi_sistema_solar';

export function getSystemId(customKey?: string): string {
  return customKey?.trim() || localStorage.getItem('solar_sync_key') || DEFAULT_SYSTEM_KEY;
}

export function setSystemId(key: string) {
  localStorage.setItem('solar_sync_key', key.trim() || DEFAULT_SYSTEM_KEY);
}

// Safe check or initial login
export async function ensureAuth(): Promise<User | null> {
  return new Promise((resolve) => {
    // 2-second timeout guard to ensure the app never waits on slow network or restricted domains
    const timeout = setTimeout(() => {
      resolve(null);
    }, 2000);

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          clearTimeout(timeout);
          if (user) {
            unsubscribe();
            resolve(user);
          } else {
            try {
              const cred = await signInAnonymously(auth);
              unsubscribe();
              resolve(cred.user);
            } catch (err: any) {
              unsubscribe();
              resolve(null);
            }
          }
        },
        (err) => {
          clearTimeout(timeout);
          resolve(null);
        }
      );
    } catch (e) {
      clearTimeout(timeout);
      resolve(null);
    }
  });
}

// Google Login with popup
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  return res.user;
}

// LocalStorage cache keys
const getStorageKeyRecords = (key: string) => `solar_records_cache_${key}`;
const getStorageKeySettings = (key: string) => `solar_settings_cache_${key}`;

export function getLocalRecords(systemKey: string): SolarRecord[] {
  try {
    const raw = localStorage.getItem(getStorageKeyRecords(systemKey));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading local records cache:', e);
  }
  return INITIAL_SOLAR_RECORDS;
}

export function saveLocalRecords(systemKey: string, records: SolarRecord[]): void {
  try {
    localStorage.setItem(getStorageKeyRecords(systemKey), JSON.stringify(records));
  } catch (e) {
    console.warn('Error saving local records cache:', e);
  }
}

export function getLocalSettings(systemKey: string): SolarSettings {
  try {
    const raw = localStorage.getItem(getStorageKeySettings(systemKey));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return { ...DEFAULT_SOLAR_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Error reading local settings cache:', e);
  }
  return DEFAULT_SOLAR_SETTINGS;
}

export function saveLocalSettings(systemKey: string, settings: SolarSettings): void {
  try {
    localStorage.setItem(getStorageKeySettings(systemKey), JSON.stringify(settings));
  } catch (e) {
    console.warn('Error saving local settings cache:', e);
  }
}

// Subscribe to real-time solar records with offline-first support
export function subscribeToSolarRecords(
  systemKey: string,
  onData: (records: SolarRecord[]) => void,
  onStatusChange?: (status: SyncStatus, error?: string) => void
) {
  // 1. Immediately emit cached data so the UI is instantaneous
  const cached = getLocalRecords(systemKey);
  if (cached.length > 0) {
    onData(cached);
  }

  const recordsCol = collection(db, 'shared_systems', systemKey, 'records');
  const q = query(recordsCol);

  onStatusChange?.('connecting');

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      onStatusChange?.('syncing');
      if (snapshot.empty) {
        // If empty in cloud, initialize with initial historical dataset
        initializeDefaultRecords(systemKey)
          .then(() => {
            saveLocalRecords(systemKey, INITIAL_SOLAR_RECORDS);
            onData(INITIAL_SOLAR_RECORDS);
            onStatusChange?.('connected');
          })
          .catch((err) => {
            console.warn('Notice auto-seeding cloud records:', err?.message || err);
            // Fallback to local
            const local = getLocalRecords(systemKey);
            onData(local.length > 0 ? local : INITIAL_SOLAR_RECORDS);
            onStatusChange?.('connected');
          });
      } else {
        const records: SolarRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push(docSnap.data() as SolarRecord);
        });
        
        // Sort chronologically (year ascending, month ascending)
        records.sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });

        // Save to cache and emit
        saveLocalRecords(systemKey, records);
        onData(records);
        onStatusChange?.('connected');
      }
    },
    (error) => {
      console.warn('Firestore subscription notice (running offline/local mode):', error.message);
      onStatusChange?.('offline', error.message);
      const fallback = getLocalRecords(systemKey);
      onData(fallback.length > 0 ? fallback : INITIAL_SOLAR_RECORDS);
    }
  );

  return unsubscribe;
}

// Subscribe to settings with cloud-first priority and offline fallback
export function subscribeToSettings(
  systemKey: string,
  onData: (settings: SolarSettings) => void
) {
  // 1. Emit local cached settings immediately for instant rendering
  const cachedSettings = getLocalSettings(systemKey);
  onData(cachedSettings);

  const settingsDoc = doc(db, 'shared_systems', systemKey, 'config', 'settings');
  return onSnapshot(
    settingsDoc,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SolarSettings;
        const merged: SolarSettings = { ...DEFAULT_SOLAR_SETTINGS, ...data };
        saveLocalSettings(systemKey, merged);
        onData(merged);
      } else {
        // Cloud does not have settings yet for this systemKey: seed with current local or default
        const toSeed = getLocalSettings(systemKey);
        setDoc(settingsDoc, { ...toSeed, updatedAt: new Date().toISOString() }, { merge: true }).catch((err) => {
          console.warn('Notice seeding settings to cloud:', err?.message || err);
        });
        saveLocalSettings(systemKey, toSeed);
        onData(toSeed);
      }
    },
    (err) => {
      console.warn('Settings subscription notice (using local cache):', err.message);
      onData(getLocalSettings(systemKey));
    }
  );
}

// Save or edit a single month record
export async function saveRecord(systemKey: string, record: SolarRecord): Promise<void> {
  // Always update local cache first
  const current = getLocalRecords(systemKey);
  const exists = current.some(r => r.id === record.id);
  const updatedLocal = exists 
    ? current.map(r => r.id === record.id ? record : r)
    : [...current, record];
  saveLocalRecords(systemKey, updatedLocal);

  const docRef = doc(db, 'shared_systems', systemKey, 'records', record.id);
  const dataToSave = {
    ...record,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(docRef, dataToSave, { merge: true });
}

// Delete a single month record
export async function deleteRecord(systemKey: string, recordId: string): Promise<void> {
  // Update local cache first
  const current = getLocalRecords(systemKey);
  saveLocalRecords(systemKey, current.filter(r => r.id !== recordId));

  const docRef = doc(db, 'shared_systems', systemKey, 'records', recordId);
  await deleteDoc(docRef);
}

// Save system settings (potencia pico, inversión, etc.)
export async function saveSettings(systemKey: string, settings: SolarSettings): Promise<void> {
  saveLocalSettings(systemKey, settings);
  const docRef = doc(db, 'shared_systems', systemKey, 'config', 'settings');
  await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
}

// Batch save multiple records (for recalculating cycles or bulk import)
export async function batchSaveRecords(systemKey: string, records: SolarRecord[]): Promise<void> {
  saveLocalRecords(systemKey, records);
  const batch = writeBatch(db);
  for (const record of records) {
    const docRef = doc(db, 'shared_systems', systemKey, 'records', record.id);
    batch.set(docRef, { ...record, updatedAt: new Date().toISOString() }, { merge: true });
  }
  await batch.commit();
}

// Initialize / Seed default records in batch
export async function initializeDefaultRecords(systemKey: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const record of INITIAL_SOLAR_RECORDS) {
      const docRef = doc(db, 'shared_systems', systemKey, 'records', record.id);
      batch.set(docRef, { ...record, updatedAt: new Date().toISOString() });
    }
    const settingsRef = doc(db, 'shared_systems', systemKey, 'config', 'settings');
    batch.set(settingsRef, DEFAULT_SOLAR_SETTINGS, { merge: true });
    await batch.commit();
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, `shared_systems/${systemKey}`);
    }
    throw error;
  }
}

// Danger: Clear all records with security check
export async function clearAllRecords(systemKey: string): Promise<void> {
  const path = `shared_systems/${systemKey}/records`;
  try {
    const recordsCol = collection(db, 'shared_systems', systemKey, 'records');
    const snapshot = await getDocs(recordsCol);
    
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
    throw error;
  }
}

// Restore default initial records
export async function restoreInitialRecords(systemKey: string): Promise<void> {
  await clearAllRecords(systemKey);
  await initializeDefaultRecords(systemKey);
}

// User authentication helper for multi-device login with email or Google
export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
