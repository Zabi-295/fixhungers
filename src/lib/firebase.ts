import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCutWQXD1BIbDw8_iu5nOvMh-x92D0XYhU",
  authDomain: "fix-hunger-a73f6.firebaseapp.com",
  projectId: "fix-hunger-a73f6",
  storageBucket: "fix-hunger-a73f6.firebasestorage.app",
  messagingSenderId: "170134903085",
  appId: "1:170134903085:web:effadd1c978dfd9ea7dba4",
  measurementId: "G-BNTB4R0JV9",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
