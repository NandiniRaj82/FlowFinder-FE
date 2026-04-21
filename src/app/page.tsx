'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from './components/splashScreen';
import SignIn from './components/Signin';
import SignUp from './components/Signup';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<'signin' | 'signup'>('signin');
  const { user, loading } = useAuth();
  const router = useRouter();

  // If already signed in, skip auth flow and go straight to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return null; // Brief flicker prevention

  return (
    <>
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} duration={4000} />
      ) : (
        <>
          {currentView === 'signin' ? (
            <SignIn onSwitchToSignUp={() => setCurrentView('signup')} />
          ) : (
            <SignUp onSwitchToSignIn={() => setCurrentView('signin')} />
          )}
        </>
      )}
    </>
  );
}