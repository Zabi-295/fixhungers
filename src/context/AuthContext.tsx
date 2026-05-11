import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import apiFetch from "@/lib/api";
import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from "firebase/auth";

interface AuthContextType {
  currentUser: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, name: string, role: "Provider" | "NGO") => Promise<void>;
  login: (email: string, password: string) => Promise<{ role: string; emailVerified: boolean }>;
  logout: () => Promise<void>;
  resendVerification: (email?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface UserProfile {
  id: string;
  uid: string; 
  name: string;
  email: string;
  role: "Provider" | "NGO" | "Admin";
  status: boolean;
  createdAt: any;
  emailVerified: boolean;
  profile?: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If email is verified, try to fetch MongoDB user data
        if (firebaseUser.emailVerified) {
          try {
            // We login to backend using the firebase UID to get our specific MongoDB JWT
            const res = await apiFetch('/auth/login', {
              method: 'POST',
              body: JSON.stringify({ firebaseUid: firebaseUser.uid, email: firebaseUser.email }),
            });
            localStorage.setItem('token', res.token);
            setCurrentUser({ ...res.user, uid: res.user.id, emailVerified: true });
          } catch (err) {
            console.error("MongoDB fetch error:", err);
            setCurrentUser(null);
          }
        } else {
          // User exists in firebase but not verified
          setCurrentUser(null);
        }
      } else {
        localStorage.removeItem('token');
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string, name: string, role: "Provider" | "NGO") => {
    // 1. Create user in Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // 2. Send Firebase verification email
    await sendEmailVerification(firebaseUser);

    // 3. Create placeholder user in MongoDB
    await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        name, 
        role, 
        firebaseUid: firebaseUser.uid,
        isActive: false // Will be set to true later or handled via firebase check
      }),
    });

    // Sign out from firebase immediately until they verify
    await signOut(auth);
  };

  const login = async (email: string, password: string) => {
    let firebaseUid = "";
    let isEmailVerified = false;

    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      firebaseUid = firebaseUser.uid;
      isEmailVerified = firebaseUser.emailVerified;

      if (!isEmailVerified && email !== "adminfixhunger@gmail.com") {
        await signOut(auth);
        throw new Error("Your email is not verified. Please check your inbox.");
      }
    } catch (fbErr: any) {
      console.log("Firebase login failed, checking if admin or legacy account...");
      if (email !== "adminfixhunger@gmail.com") {
        throw fbErr;
      }
      // For Admin, we allow continuing to MongoDB even if Firebase fails
      isEmailVerified = true; 
    }

    // 2. Login to MongoDB backend to get custom token and profile
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, firebaseUid }),
    });

    localStorage.setItem('token', res.token);
    const user = { ...res.user, uid: res.user.id, emailVerified: true };
    setCurrentUser(user);
    
    return {
      role: user.role,
      emailVerified: true, 
    };
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await apiFetch('/auth/me'); 
      setCurrentUser({ ...res, uid: res.id, emailVerified: true });
    } catch (err) {
      console.error("Refresh user error:", err);
    }
  };

  const resendVerification = async (email?: string) => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    } else {
      // If we don't have a session, we can't easily resend via firebase without logging in
      throw new Error("Please login first to resend verification email.");
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      userProfile: currentUser, 
      loading, 
      signup, 
      login, 
      logout, 
      resendVerification,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

