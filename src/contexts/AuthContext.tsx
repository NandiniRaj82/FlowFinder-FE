'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signInWithGitHub,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  type User,
} from '@/lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    const u = await signInWithGoogle();
    setUser(u);
  }, []);

  const handleSignInWithGitHub = useCallback(async () => {
    const u = await signInWithGitHub();
    setUser(u);
  }, []);

  const handleSignInWithEmail = useCallback(async (email: string, password: string) => {
    const u = await signInWithEmail(email, password);
    setUser(u);
  }, []);

  const handleSignUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
    const u = await signUpWithEmail(email, password, displayName);
    setUser(u);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle: handleSignInWithGoogle,
        signInWithGitHub: handleSignInWithGitHub,
        signInWithEmail: handleSignInWithEmail,
        signUpWithEmail: handleSignUpWithEmail,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
