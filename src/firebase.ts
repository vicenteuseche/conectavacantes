import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB3zT1n9ARefEQaDEQutMgNoM55gL97byg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "conectavacantes-2026.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "conectavacantes-2026",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "conectavacantes-2026.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "10328160989",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:10328160989:web:77f90f7087b93ac854b934",
};

const app = firebaseConfig.projectId ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;

export const isFirebaseReady = Boolean(db);

const getCurrentUser = async () => {
  if (!auth?.currentUser) return null;
  return auth.currentUser;
};

export const ensureUserProfile = async (userEmail: string, profile: Record<string, unknown> = {}) => {
  const user = await getCurrentUser();
  if (!db || !user) return null;

  const normalizedEmail = userEmail.trim().toLowerCase();
  const payload = {
    userId: user.uid,
    email: normalizedEmail,
    updatedAt: new Date().toISOString(),
    ...profile,
  };

  await setDoc(doc(db, "users", user.uid), payload, { merge: true });
  await setDoc(doc(db, "profiles", user.uid), payload, { merge: true });
  return user.uid;
};

export const saveProcessToFirestore = async (userEmail: string, process: any) => {
  const user = await getCurrentUser();
  if (!db || !user) return null;

  await ensureUserProfile(userEmail);
  const ref = await addDoc(collection(db, "processes"), {
    userId: user.uid,
    userEmail: userEmail.trim().toLowerCase(),
    ...process,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
};

export const listProcessesFromFirestore = async (userEmail: string) => {
  const user = await getCurrentUser();
  if (!db || !user) return [];

  const q = query(collection(db, "processes"), where("userId", "==", user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
};

export const updateProcessInFirestore = async (processId: string, updates: Record<string, unknown>) => {
  if (!db) return;
  await updateDoc(doc(db, "processes", processId), updates);
};

export const deleteProcessFromFirestore = async (processId: string) => {
  if (!db) return;
  await deleteDoc(doc(db, "processes", processId));
};

export const saveMetricToFirestore = async (userEmail: string, metric: Record<string, unknown>) => {
  const user = await getCurrentUser();
  if (!db || !user) return null;

  await ensureUserProfile(userEmail);
  const ref = await addDoc(collection(db, "metrics"), {
    userId: user.uid,
    userEmail: userEmail.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
    ...metric,
  });
  return ref.id;
};

export const saveSearchEventToFirestore = async (userEmail: string, event: Record<string, unknown>) => {
  const user = await getCurrentUser();
  if (!db || !user) return null;

  await ensureUserProfile(userEmail);
  const ref = await addDoc(collection(db, "searchEvents"), {
    userId: user.uid,
    userEmail: userEmail.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
    ...event,
  });
  return ref.id;
};
