import React from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  fallback 
}) => {
  const { user, profile, loading, hasPermission } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // User not authenticated
  if (!user || !profile) {
    return fallback || (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">
            Please log in to access this page.
          </p>
        </Card>
      </div>
    );
  }

  // Check role-based permissions
  if (requiredRole && !hasPermission(requiredRole)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access this page.
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Your role: <span className="font-medium capitalize">{profile.role.replace('_', ' ')}</span></p>
            <p>Required role: <span className="font-medium capitalize">
              {Array.isArray(requiredRole) 
                ? requiredRole.map(r => r.replace('_', ' ')).join(' or ')
                : requiredRole.replace('_', ' ')
              }
            </span></p>
          </div>
        </Card>
      </div>
    );
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};

export default ProtectedRoute;
