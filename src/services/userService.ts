import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  display_name: string | null;
  email: string;
  created_at: Date;
  updated_at: Date;
}

const mapUserProfile = (data: any): UserProfile => ({
  id: data.id,
  display_name: data.display_name,
  email: data.email,
  created_at: new Date(data.created_at),
  updated_at: new Date(data.updated_at)
});

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data ? mapUserProfile(data) : null;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: updates.display_name,
      updated_at: new Date()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapUserProfile(data);
}; 