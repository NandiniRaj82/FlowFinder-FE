'use client';

import { useState, useEffect } from 'react';
import SplashScreen from './components/splashScreen';
import SignIn from './components/Signin';
import SignUp from './components/Signup';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    console.log('Home page mounted');
    console.log('showSplash:', showSplash);
  }, [showSplash]);

  const handleSplashComplete = () => {
    console.log('Splash complete callback triggered');
    setShowSplash(false);
  };

  const switchToSignUp = () => {
    setCurrentView('signup');
  };

  const switchToSignIn = () => {
    setCurrentView('signin');
  };

  return (
    <>
      {showSplash ? (
        <SplashScreen
          onComplete={handleSplashComplete}
          duration={4000} 
        />
      ) : (
        <>
          {currentView === 'signin' ? (
            <SignIn onSwitchToSignUp={switchToSignUp} />
          ) : (
            <SignUp onSwitchToSignIn={switchToSignIn} />
          )}
        </>
      )}
    </>
  );
}