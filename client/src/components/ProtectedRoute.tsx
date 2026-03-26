import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredType?: 'agency' | 'admin' | 'candidate';
}

export function ProtectedRoute({ children, requiredType }: ProtectedRouteProps) {
  const { isAuthenticated, userType, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
    } else if (!isLoading && requiredType && userType !== requiredType) {
      setLocation('/');
    }
  }, [isLoading, isAuthenticated, userType, requiredType, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredType && userType !== requiredType) {
    return null;
  }

  return <>{children}</>;
}
