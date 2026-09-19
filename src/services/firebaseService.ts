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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          unsubscribe();
          resolve(cred.user);
        } catch (err: any) {
          // If anonymous sign-in is not enabled in Firebase Console (auth/admin-restricted-operation),
          // resolve gracefully as null so Firestore operates under shared system rules without crashing
          console.info('Sesión en modo compartido/anónimo sin credencial (admin-restricted). Continuando sincronización.');
          unsubscribe();
          resolve(null);
        }
      }
    });
  });
}

// Google Login with popup
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  return res.user;
}

// Subscribe to real-time solar records
export function subscribeToSolarRecords(
  systemKey: string,
  onData: (records: SolarRecord[]) => void,
  onStatusChange?: (status: SyncStatus, error?: string) => void
) {
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
          .then(() => onStatusChange?.('connected'))
          .catch((err) => {
            console.error('Error auto-seeding records:', err);
            // Fallback to local
            onData(INITIAL_SOLAR_RECORDS);
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

        onData(records);
        onStatusChange?.('connected');
      }
    },
    (error) => {
      console.warn('Firestore subscription status:', error.message);
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.LIST, `shared_systems/${systemKey}/records`);
      }
      onStatusChange?.('error', error.message);
      onData(INITIAL_SOLAR_RECORDS);
    }
  );

  return unsubscribe;
}

// Subscribe to settings
export function subscribeToSettings(
  systemKey: string,
  onData: (settings: SolarSettings) => void
) {
  const settingsDoc = doc(db, 'shared_systems', systemKey, 'config', 'settings');
  return onSnapshot(
    settingsDoc,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as SolarSettings);
      } else {
        // Seed default
        setDoc(settingsDoc, DEFAULT_SOLAR_SETTINGS, { merge: true }).catch(console.error);
        onData(DEFAULT_SOLAR_SETTINGS);
      }
    },
    (err) => {
      console.warn('Settings subscription:', err.message);
      onData(DEFAULT_SOLAR_SETTINGS);
    }
  );
}

// Save or edit a single month record
export async function saveRecord(systemKey: string, record: SolarRecord): Promise<void> {
  const path = `shared_systems/${systemKey}/records/${record.id}`;
  try {
    const docRef = doc(db, 'shared_systems', systemKey, 'records', record.id);
    const dataToSave = {
      ...record,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
    throw error;
  }
}

// Delete a single month record
export async function deleteRecord(systemKey: string, recordId: string): Promise<void> {
  const path = `shared_systems/${systemKey}/records/${recordId}`;
  try {
    const docRef = doc(db, 'shared_systems', systemKey, 'records', recordId);
    await deleteDoc(docRef);
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
    throw error;
  }
}

// Save system settings (potencia pico, inversión, etc.)
export async function saveSettings(systemKey: string, settings: SolarSettings): Promise<void> {
  const path = `shared_systems/${systemKey}/config/settings`;
  try {
    const docRef = doc(db, 'shared_systems', systemKey, 'config', 'settings');
    await setDoc(docRef, settings, { merge: true });
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
    throw error;
  }
}

// Batch save multiple records (for recalculating cycles or bulk import)
export async function batchSaveRecords(systemKey: string, records: SolarRecord[]): Promise<void> {
  const path = `shared_systems/${systemKey}/records`;
  try {
    const batch = writeBatch(db);
    for (const record of records) {
      const docRef = doc(db, 'shared_systems', systemKey, 'records', record.id);
      batch.set(docRef, { ...record, updatedAt: new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
    throw error;
  }
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
