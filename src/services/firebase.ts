import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setLogLevel, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress non-critical Firestore SDK network warning logs
setLogLevel('error');

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with explicit database ID from config and reliable HTTP long-polling
const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || '(default)';
export const db: Firestore = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  databaseId
);
export const auth = getAuth(app);

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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection to Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDoc(doc(db, 'teams', 'team_titanes_01'));
    return true;
  } catch (error: any) {
    if (error?.code === 'unavailable' || (error instanceof Error && error.message.includes('offline'))) {
      console.warn('Firebase client operating in offline mode or network unavailable; offline cache will be used.');
    }
    return false;
  }
}
