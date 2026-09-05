'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// सुरक्षित डिफ़ॉल्ट वैल्यू ताकि ऐप कभी क्रैश न हो
const defaultAuthValue: AuthContextType = {
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthValue);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. एक्टिव सेशन चेक करें
    const initializeAuth = async () => {
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        setSession(activeSession);
        setUser(activeSession?.user ?? null);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // 2. ऑथ स्टेट बदलाव सुनें (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, updatedSession) => {
        setSession(updatedSession);
        setUser(updatedSession?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Safe Hook: यह एरर फेंकने के बजाय हमेशा वैध वैल्यू लौटाएगा
export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || defaultAuthValue;
};