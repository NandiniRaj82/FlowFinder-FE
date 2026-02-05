'use client';

import { useState, useEffect } from 'react';
import SplashScreen from './components/splashScreen';
export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    console.log('Home page mounted');
    console.log('showSplash:', showSplash);
  }, [showSplash]);

  const handleSplashComplete = () => {
    console.log('Splash complete callback triggered');
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && (
        <SplashScreen
          onComplete={handleSplashComplete}
          duration={4000} 
        />
      )}

      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Welcome to Flow Finder
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your accessibility audit tool is ready!
            </p>
          </div>
        </div>
      </main>
    </>
  );
}