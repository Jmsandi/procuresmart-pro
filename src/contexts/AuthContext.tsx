import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'procurement_officer' | 'auditor';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const roleHierarchy: Record<UserRole, number> = {
  admin: 3,
  procurement_officer: 2,
  auditor: 1,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // If profile doesn't exist or there's a policy error, create a default one
        if (error.code === 'PGRST116' || error.message.includes('policy') || error.message.includes('recursion')) {
          await createDefaultProfile(userId);
        } else {
          // For any other error, create a temporary profile
          const { data: userData } = await supabase.auth.getUser();
          const email = userData.user?.email || '';
          setProfile({
            id: userId,
            email: email,
            full_name: email.split('@')[0],
            role: 'procurement_officer' as UserRole,
            created_at: new Date().toISOString()
          });
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Fallback: create a temporary profile
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email || '';
      setProfile({
        id: userId,
        email: email,
        full_name: email.split('@')[0],
        role: 'procurement_officer' as UserRole,
        created_at: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email || '';

      // First, disable RLS temporarily for this operation
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: userId,
            email: email,
            full_name: email.split('@')[0], // Use email prefix as default name
            role: 'procurement_officer' as UserRole, // Default role
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating default profile:', error);
        // If we can't create the profile, set a temporary one
        setProfile({
          id: userId,
          email: email,
          full_name: email.split('@')[0],
          role: 'procurement_officer' as UserRole,
          created_at: new Date().toISOString()
        });
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in createDefaultProfile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        }
      }
    });

    if (!error && data.user) {
      // Try to create user profile, but don't fail if it doesn't work
      // The trigger should handle this, but we'll try manually as backup
      try {
        await supabase
          .from('user_profiles')
          .insert([
            {
              id: data.user.id,
              email: email,
              full_name: fullName,
              role: role,
            },
          ]);
      } catch (profileError) {
        console.log('Profile creation handled by trigger or will be created on first login');
      }
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const hasPermission = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!profile) return false;

    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRoleLevel = roleHierarchy[profile.role];

    return requiredRoles.some(role => {
      const requiredLevel = roleHierarchy[role];
      return userRoleLevel >= requiredLevel;
    });
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
