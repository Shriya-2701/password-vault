import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and anon public API key
const supabaseUrl = 'https://loqytcvtfvbinclebpnn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvcXl0Y3Z0ZnZiaW5jbGVicG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Nzg5MDQsImV4cCI6MjA3NTE1NDkwNH0.NT3LwKteVyyR44JK0Xuyr4XQkNBonbh0QJw-JUk3k20';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
