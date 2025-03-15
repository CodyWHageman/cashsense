import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

interface UserProfile {
  id: string;
  email?: string | null;
  display_name?: string | null;
  theme_preference?: 'light' | 'dark';
}

interface AuthContextType {
  user: any;
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
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
  
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
          setUser(session?.user ?? null);
        });
  
        return () => {
          subscription.unsubscribe();
        };
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    setUser(data.user);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password
    });
    
    if (error) throw error;
    setUser(data.user);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    
    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: updates.display_name,
        ...(updates.theme_preference && { theme_preference: updates.theme_preference })
      }
    });
    
    if (error) throw error;
    
    // Update the local user state with the new metadata
    setUser(data.user);
  };

  // Get the user's theme preference from metadata
  const getUserThemePreference = (): 'light' | 'dark' | null => {
    if (!user) return null;
    return user.user_metadata?.theme_preference || null;
  };

  // Update just the theme preference
  const updateUserThemePreference = async (theme: 'light' | 'dark'): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    
    const { data, error } = await supabase.auth.updateUser({
      data: {
        theme_preference: theme
      }
    });
    
    if (error) throw error;
    
    // Update the local user state with the new metadata
    setUser(data.user);
  };

  const value = {
    user,
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
