import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminAccount } from '../types';
import { supabase } from '../lib/supabase';

const SESSION_TOKEN_KEY = 'sessionToken';

interface AuthContextType {
  isAuthenticated: boolean;
  isSessionLoading: boolean;
  currentUser: AdminAccount | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => boolean;
  hasAccessToBarber: (barberId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

function generateToken(): string {
  const array = new Uint8Array(48);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

async function fetchAccountWithPermissions(accountId: string): Promise<AdminAccount | null> {
  const { data: account, error } = await supabase
    .from('admin_accounts')
    .select('id, username, role, is_active, created_at, updated_at')
    .eq('id', accountId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !account) return null;

  const { data: permissions } = await supabase
    .from('account_barber_permissions')
    .select('barber_id')
    .eq('account_id', accountId);

  const barberIds = permissions?.map(p => p.barber_id) ?? [];
  return { ...account, barber_ids: barberIds };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AdminAccount | null>(null);

  useEffect(() => {
    validateStoredSession();
  }, []);

  const validateStoredSession = async () => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);

    if (!token) {
      setIsSessionLoading(false);
      return;
    }

    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('id, account_id, expires_at')
        .eq('token', token)
        .maybeSingle();

      if (error || !session) {
        localStorage.removeItem(SESSION_TOKEN_KEY);
        setIsSessionLoading(false);
        return;
      }

      if (session.expires_at && new Date(session.expires_at) < new Date()) {
        await supabase.from('sessions').delete().eq('token', token);
        localStorage.removeItem(SESSION_TOKEN_KEY);
        setIsSessionLoading(false);
        return;
      }

      const user = await fetchAccountWithPermissions(session.account_id);

      if (!user) {
        await supabase.from('sessions').delete().eq('token', token);
        localStorage.removeItem(SESSION_TOKEN_KEY);
        setIsSessionLoading(false);
        return;
      }

      await supabase
        .from('sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('token', token);

      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('[Auth] Error validating session:', err);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    } finally {
      setIsSessionLoading(false);
    }
  };

  const checkAuth = (): boolean => {
    return isAuthenticated && currentUser !== null;
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { db } = await import('../lib/database');
      const user = await db.validateLogin(username, password);

      if (!user) return false;

      const token = generateToken();

      const { error } = await supabase.from('sessions').insert({
        account_id: user.id,
        token,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        expires_at: null,
      });

      if (error) {
        console.error('[Auth] Error creating session:', error);
        return false;
      }

      localStorage.setItem(SESSION_TOKEN_KEY, token);
      setCurrentUser(user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('[Auth] Error during login:', error);
      return false;
    }
  };

  const logout = async () => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);

    if (token) {
      await supabase.from('sessions').delete().eq('token', token);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }

    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const hasAccessToBarber = (barberId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.barber_ids?.includes(barberId) || false;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isSessionLoading, currentUser, login, logout, checkAuth, hasAccessToBarber }}>
      {children}
    </AuthContext.Provider>
  );
};
