import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, 
  query, where, orderBy, serverTimestamp, onSnapshot,
  Unsubscribe, getDoc, setDoc
} from "firebase/firestore";
import { db } from "./firebase";

// ===== DONATIONS =====
export const addDonationToFirestore = async (donation: any) => {
  const docRef = await addDoc(collection(db, "donations"), {
    ...donation,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getDonationsFromFirestore = async () => {
  const q = query(collection(db, "donations"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateDonationInFirestore = async (id: string, data: any) => {
  await updateDoc(doc(db, "donations", id), data);
};

export const deleteDonationFromFirestore = async (id: string) => {
  await deleteDoc(doc(db, "donations", id));
};

export const subscribeToDonations = (callback: (donations: any[]) => void): Unsubscribe => {
  const q = query(collection(db, "donations"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const donations = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(donations);
  });
};

// ===== USERS =====
export const getUsersFromFirestore = async () => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateUserInFirestore = async (id: string, data: any) => {
  await updateDoc(doc(db, "users", id), data);
};

export const deleteUserFromFirestore = async (id: string) => {
  await deleteDoc(doc(db, "users", id));
};

export const subscribeToUsers = (callback: (users: any[]) => void): Unsubscribe => {
  return onSnapshot(collection(db, "users"), (snapshot) => {
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(users);
  });
};

// ===== NOTIFICATIONS =====
export const addNotificationToFirestore = async (notification: any) => {
  const docRef = await addDoc(collection(db, "notifications"), {
    ...notification,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getNotificationsFromFirestore = async (userId?: string) => {
  const q = userId 
    ? query(collection(db, "notifications"), where("targetRole", "==", "NGO"), orderBy("createdAt", "desc"))
    : query(collection(db, "notifications"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateNotificationInFirestore = async (id: string, data: any) => {
  await updateDoc(doc(db, "notifications", id), data);
};

export const subscribeToNotifications = (callback: (notifs: any[]) => void): Unsubscribe => {
  const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(notifs);
  });
};

// ===== PROVIDER PROFILES =====
export const saveProviderProfile = async (uid: string, profile: any) => {
  await setDoc(doc(db, "providerProfiles", uid), profile, { merge: true });
};

export const getProviderProfile = async (uid: string) => {
  const docSnap = await getDoc(doc(db, "providerProfiles", uid));
  return docSnap.exists() ? docSnap.data() : null;
};

// ===== NGO PROFILES =====
export const saveNGOProfile = async (uid: string, profile: any) => {
  await setDoc(doc(db, "ngoProfiles", uid), profile, { merge: true });
};

export const getNGOProfile = async (uid: string) => {
  const docSnap = await getDoc(doc(db, "ngoProfiles", uid));
  return docSnap.exists() ? docSnap.data() : null;
};
