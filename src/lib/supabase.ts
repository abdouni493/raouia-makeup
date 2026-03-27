import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uvwogiqozurbgiugrdpt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2d29naXFvenVyYmdpdWdyZHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0ODE0MjAsImV4cCI6MjA5MDA1NzQyMH0.8O2YZPdneNfku1f6yuBzCewJDjvJ96kCEW2PCL2r6Kw';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Using fallback values.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
