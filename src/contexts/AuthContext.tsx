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
import { getGravatarUrl } from '../utils/gravatarUtils'; // Import the new utility

interface UserProfile {
  id: string;
  email?: string | null;
  display_name?: string | null;
  theme_preference?: 'light' | 'dark';
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !currentUser.photoURL && currentUser.email) {
        const gravatarUrl = getGravatarUrl(currentUser.email);
        try {
            await updateProfile(currentUser, { photoURL: gravatarUrl });
            // Force a refresh of the user object to reflect the change immediately
            // Note: In some Firebase versions, we might need to reload, but usually object update works for local state
        } catch (e) {
            console.error("Failed to set Gravatar", e);
        }
      }

      setUser(currentUser);
      
      if (currentUser) {
        try {
          // MIGRATION FIX: Use currentUser.uid
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              id: currentUser.uid,
              email: currentUser.email,
              display_name: currentUser.displayName,
              theme_preference: 'light'
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
    
    // Assign Gravatar immediately on signup
    if (newUser.email) {
        const gravatarUrl = getGravatarUrl(newUser.email);
        await updateProfile(newUser, { photoURL: gravatarUrl });
    }

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
    if (updates.display_name) {
      await updateProfile(user, { displayName: updates.display_name });
    }
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, updates);
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