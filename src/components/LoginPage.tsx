import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Mail, Lock, User, Building } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'procurement_officer' as UserRole,
  });
  
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(loginData.email, loginData.password);
      
      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Welcome back!',
          description: 'You have been successfully logged in.',
        });
      }
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    if (signupData.password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(
        signupData.email,
        signupData.password,
        signupData.fullName,
        signupData.role
      );
      
      if (error) {
        toast({
          title: 'Signup Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Account Created!',
          description: 'Please check your email to verify your account.',
        });
      }
    } catch (error) {
      toast({
        title: 'Signup Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">SmartProcure</h1>
              <p className="text-sm text-muted-foreground">Inventory Management System</p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login" className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            {/* Signup Tab */}
            <TabsContent value="signup" className="p-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      className="pl-10"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={signupData.email}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Role</Label>
                  <Select 
                    value={signupData.role} 
                    onValueChange={(value: UserRole) => setSignupData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="procurement_officer">Procurement Officer</SelectItem>
                      <SelectItem value="auditor">Auditor</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      className="pl-10"
                      value={signupData.password}
                      onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      className="pl-10"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
        
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>© 2025 SmartProcure Solutions Ltd. All rights reserved. Powered by Team Keke
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
