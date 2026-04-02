import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { trpc } from "@/lib/trpc";

const TOKEN_KEY = "lovesync_token";
const USER_KEY = "lovesync_user";

export interface AppUserInfo {
  id: number;
  email: string;
  displayName: string;
  inviteCode: string;
  coupleId: number | null;
  partnerName?: string | null;
}

interface AppAuthContextType {
  user: AppUserInfo | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isPaired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserData: (user: AppUserInfo, token: string) => Promise<void>;
}

const AppAuthContext = createContext<AppAuthContextType | null>(null);

// Token storage helpers
async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return await AsyncStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function setToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
}

async function removeToken(): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

async function getCachedUser(): Promise<AppUserInfo | null> {
  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function setCachedUser(user: AppUserInfo): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function removeCachedUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUserInfo | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const utils = trpc.useUtils();

  // Load cached auth on mount
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await getToken();
        const savedUser = await getCachedUser();
        if (savedToken && savedUser) {
          setTokenState(savedToken);
          setUser(savedUser);
        }
      } catch (e) {
        console.error("[AppAuth] Failed to load cached auth:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setUserData = useCallback(async (userData: AppUserInfo, authToken: string) => {
    setTokenState(authToken);
    setUser(userData);
    await setToken(authToken);
    await setCachedUser(userData);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await utils.client.appAuth.login.mutate({ email, password });
    if (result.user) {
      await setUserData(result.user as AppUserInfo, result.token);
    }
  }, [utils.client, setUserData]);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const result = await utils.client.appAuth.register.mutate({ email, password, displayName });
    if (result.user) {
      await setUserData(result.user as AppUserInfo, result.token);
    }
  }, [utils.client, setUserData]);

  const logout = useCallback(async () => {
    setUser(null);
    setTokenState(null);
    await removeToken();
    await removeCachedUser();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await utils.client.appAuth.me.query();
      if (me) {
        const updatedUser: AppUserInfo = {
          id: me.id,
          email: me.email,
          displayName: me.displayName,
          inviteCode: me.inviteCode,
          coupleId: me.coupleId,
          partnerName: me.partnerName,
        };
        setUser(updatedUser);
        await setCachedUser(updatedUser);
      }
    } catch (e) {
      console.error("[AppAuth] Failed to refresh user:", e);
    }
  }, [utils.client]);

  const isAuthenticated = useMemo(() => Boolean(user && token), [user, token]);
  const isPaired = useMemo(() => Boolean(user?.coupleId), [user]);

  const value = useMemo(() => ({
    user, token, loading, isAuthenticated, isPaired,
    login, register, logout, refreshUser, setUserData,
  }), [user, token, loading, isAuthenticated, isPaired, login, register, logout, refreshUser, setUserData]);

  return (
    <AppAuthContext.Provider value={value}>
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const ctx = useContext(AppAuthContext);
  if (!ctx) throw new Error("useAppAuth must be used within AppAuthProvider");
  return ctx;
}
