-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON public.user_profiles;

-- Drop the table if it exists and recreate it
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create user_profiles table for role-based access control
CREATE TABLE public.user_profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'procurement_officer' CHECK (role IN ('admin', 'procurement_officer', 'auditor')),
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies that avoid recursion
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to read all profiles (for now - can be restricted later)
CREATE POLICY "Authenticated users can read profiles" ON public.user_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow profile creation (needed for signup)
CREATE POLICY "Allow profile creation" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
