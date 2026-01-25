// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface UserProfile {
  id: string;
  email?: string | null;
  display_name?: string | null;
  theme_preference?: 'light' | 'dark';
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null; // Extended data from Firestore
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  getUserThemePreference: () => 'light' | 'dark' | null;
  updateUserThemePreference: (theme: 'light' | 'dark') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync Auth State and fetch extra Firestore Profile data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            // Create initial profile if it doesn't exist
            const newProfile: UserProfile = {
              id: currentUser.uid,
              email: currentUser.email,
              display_name: currentUser.displayName,
              theme_preference: 'light' // default
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create the user document in Firestore immediately
    const newProfile: UserProfile = {
        id: newUser.uid,
        email: newUser.email,
        display_name: '',
        theme_preference: 'light'
    };
    await setDoc(doc(db, 'users', newUser.uid), newProfile);
    setUserProfile(newProfile);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) throw new Error('No user logged in');
    await firebaseUpdatePassword(user, newPassword);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    
    // Update Auth Profile (Display Name)
    if (updates.display_name) {
      await updateProfile(user, { displayName: updates.display_name });
    }

    // Update Firestore Profile (Theme, etc)
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, updates);
    
    // Update local state
    setUserProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const getUserThemePreference = (): 'light' | 'dark' | null => {
    return userProfile?.theme_preference || null;
  };

  const updateUserThemePreference = async (theme: 'light' | 'dark'): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    await updateUserProfile({ theme_preference: theme });
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateUserProfile,
    getUserThemePreference,
    updateUserThemePreference
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};