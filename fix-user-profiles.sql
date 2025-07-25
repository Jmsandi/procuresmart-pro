-- Run this script in your Supabase SQL Editor to fix the user profiles issue

-- First, disable RLS temporarily to clean up
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.user_profiles;

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Drop the table if it exists
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'procurement_officer' CHECK (role IN ('admin', 'procurement_officer', 'auditor')),
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON public.user_profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'procurement_officer')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- If insert fails, just continue - the user can still log in
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive RLS policies
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow all authenticated users to read profiles (simplified for now)
CREATE POLICY "Authenticated users can read profiles" ON public.user_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow profile creation during signup
CREATE POLICY "Allow profile creation" ON public.user_profiles
  FOR INSERT WITH CHECK (true);

-- Insert a default admin user (optional - you can create this through the UI instead)
-- Make sure to create the auth user first in Supabase Auth, then uncomment and run this:
-- INSERT INTO public.user_profiles (id, email, full_name, role, department) 
-- VALUES ('your-user-id-here', 'admin@smartprocure.sl', 'System Administrator', 'admin', 'IT')
-- ON CONFLICT (id) DO NOTHING;
