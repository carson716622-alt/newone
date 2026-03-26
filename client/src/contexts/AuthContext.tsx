import React, { createContext, useContext, useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

interface UserData {
  id: number;
  email: string;
  name: string;
  type: 'candidate' | 'admin' | 'agency';
  agencyId?: number;
}

interface AuthContextType {
  user: UserData | null;
  session: UserData | null;
  userType: 'candidate' | 'admin' | 'agency' | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, type: 'candidate' | 'admin' | 'agency') => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string, type: 'candidate' | 'admin' | 'agency', agencyData?: any) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  // Check current user on mount — auth.me returns the JWT payload which includes agencyId
  const { data: currentUser } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (currentUser !== undefined) {
      if (currentUser) {
        // The JWT payload from auth.me already contains agencyId for agency users
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          type: currentUser.type,
          agencyId: (currentUser as any).agencyId,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [currentUser]);

  const login = async (email: string, password: string, type: 'candidate' | 'admin' | 'agency') => {
    setIsLoading(true);
    setError(null);
    try {
      let result: any;
      
      if (type === 'candidate') {
        result = await utils.client.candidateAuth.login.mutate({ email, password });
      } else if (type === 'admin') {
        result = await utils.client.adminAuth.login.mutate({ email, password });
      } else if (type === 'agency') {
        result = await utils.client.agencyAuth.login.mutate({ email, password });
      }

      if (result?.success) {
        // Build user data from the login response
        // Agency login returns { admin: { id, email, name, agencyId }, agency: { ... } }
        // Candidate login returns { candidate: { id, email, name } }
        // Admin login returns { admin: { id, email, name } }
        const userData: UserData = {
          id: result.candidate?.id || result.admin?.id,
          email: result.candidate?.email || result.admin?.email,
          name: result.candidate?.name || result.admin?.name,
          type: type,
        };

        // For agency logins, the agencyId is in result.admin.agencyId
        if (type === 'agency' && result.admin?.agencyId) {
          userData.agencyId = result.admin.agencyId;
        }

        setUser(userData);

        // Invalidate auth.me so it refetches with the new cookie
        utils.auth.me.invalidate();

        return { success: true, message: 'Login successful' };
      } else {
        const message = result?.message || 'Login failed';
        setError(message);
        return { success: false, message };
      }
    } catch (err: any) {
      const message = err?.message || 'Login failed';
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, type: 'candidate' | 'admin' | 'agency', agencyData?: any) => {
    setIsLoading(true);
    setError(null);
    try {
      let result: any;
      
      if (type === 'candidate') {
        result = await utils.client.candidateAuth.register.mutate({ name, email, password });
      } else if (type === 'admin') {
        result = await utils.client.adminAuth.register.mutate({ name, email, password });
      } else if (type === 'agency') {
        result = await utils.client.agencyAuth.register.mutate({
          departmentName: agencyData?.departmentName,
          address: agencyData?.address,
          phone: agencyData?.phone,
          email,
          website: agencyData?.website,
          numberOfOfficers: agencyData?.numberOfOfficers,
          adminName: name,
          password
        });
      }

      if (result?.success) {
        return { success: true, message: 'Registration successful' };
      } else {
        const message = result?.message || 'Registration failed';
        setError(message);
        return { success: false, message };
      }
    } catch (err: any) {
      const message = err?.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await utils.client.auth.logout.mutate();
      setUser(null);
      setError(null);
    } catch (err: any) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session: user,
        userType: user?.type ?? null,
        isLoading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
