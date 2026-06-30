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
  resendVerification: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
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
  verificationStatus?: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  verificationDocs?: {
    ngoCertificate?: string;
    cnicFront?: string;
    cnicBack?: string;
    submittedAt?: string;
    reviewedAt?: string;
    rejectionReason?: string;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubFn: (() => void) | undefined;

    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await apiFetch('/auth/me');
          const userId = res.id || res._id;
          setCurrentUser({ ...res, id: userId, uid: userId, emailVerified: true });
          setLoading(false);
          return;
        } catch (err) {
          console.error("Token restore failed, falling back to Firebase:", err);
          localStorage.removeItem('token');
        }
      }

      // Fallback: Listen for Firebase auth changes
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          if (firebaseUser.emailVerified) {
            try {
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
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });

      unsubFn = unsubscribe;
    };

    initializeAuth();

    return () => {
      if (unsubFn) unsubFn();
    };
  }, []);

  const signup = async (email: string, password: string, name: string, role: "Provider" | "NGO") => {
    // 1. Create user in Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // 2. Create user in MongoDB and send OTP through SMTP
    await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        name, 
        role, 
        firebaseUid: firebaseUser.uid,
        isAdminCreated: false
      }),
    });

    // Sign out from Firebase immediately until verified via OTP
    await signOut(auth);
  };

  const login = async (email: string, password: string, role?: string) => {
    let firebaseUid = "";
    let firebaseError = null;

    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      firebaseUid = firebaseUser.uid;
    } catch (fbErr: any) {
      console.log("Firebase login failed, proceeding to check MongoDB directly...");
      firebaseError = fbErr;
    }

    // 2. Login to MongoDB backend
    let res;
    try {
      res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, firebaseUid, role }),
      });
    } catch (mongoErr: any) {
      if (firebaseUid) await signOut(auth);
      throw firebaseError || mongoErr;
    }

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
      const userId = res.id || res._id;
      setCurrentUser({ ...res, id: userId, uid: userId, emailVerified: true });
    } catch (err) {
      console.error("Refresh user error:", err);
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    await apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  };

  const resendVerification = async (email: string) => {
    await apiFetch('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
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
      verifyOtp,
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

