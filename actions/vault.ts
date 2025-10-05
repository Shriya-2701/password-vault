import { supabase } from '../lib/supabaseClient';


 export interface PasswordEntry {
  id?: string;
  user_id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;


}

// Fetch all password entries for the logged-in user, ordered by creation date descending
export async function fetchPasswords(userId: string): Promise<PasswordEntry[]> {
  const { data, error } = await supabase
    .from('passwords')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  return data || [];
}

// Add a new password entry
export async function addPassword(entry: PasswordEntry): Promise<PasswordEntry[]> {
  const { data, error } = await supabase
    .from('passwords')
    .insert([entry]);

  if (error) {
    throw error;
  }
  return data || [];
}

// Update an existing password entry by id
export async function updatePassword(id: string, updatedEntry: Partial<PasswordEntry>): Promise<PasswordEntry[]> {
  const { data, error } = await supabase
    .from('passwords')
    .update(updatedEntry)
    .eq('id', id);

  if (error) {
    throw error;
  }
  return data || [];
}

// Delete a password entry by id
export async function deletePassword(id: string): Promise<void> {
  const { error } = await supabase
    .from('passwords')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}
