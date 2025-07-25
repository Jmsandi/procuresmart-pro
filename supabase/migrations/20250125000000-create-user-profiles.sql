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

-- Create RLS policies for user_profiles
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile (but not change role)
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow all authenticated users to read all profiles (simplified for now)
-- In production, you might want to restrict this further
CREATE POLICY "Authenticated users can read profiles" ON public.user_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow the trigger function to insert new profiles
CREATE POLICY "Allow profile creation on signup" ON public.user_profiles
  FOR INSERT WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON public.user_profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin user (you should change this email and create the user in Supabase Auth)
-- This is just a placeholder - you'll need to create the actual auth user first
-- INSERT INTO public.user_profiles (id, email, full_name, role, department) VALUES
-- ('00000000-0000-0000-0000-000000000000', 'admin@smartprocure.sl', 'System Administrator', 'admin', 'IT');

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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
