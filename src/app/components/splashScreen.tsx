'use client';

import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  duration = 4000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    console.log(' Splash Screen Mounted');
    console.log(' Duration set to:', duration, 'ms');

    const timer = setTimeout(() => {
      console.log('Timer complete, starting fade out');
      handleComplete();
    }, duration);

    return () => {
      console.log(' Cleaning up timer');
      clearTimeout(timer);
    };
  }, [duration, onComplete]);

  const handleComplete = () => {
    console.log('Fading out splash screen');
    setIsFadingOut(true);
    setTimeout(() => {
      console.log('Splash screen hidden');
      setIsVisible(false);
      onComplete?.();
    }, 800);
  };

  const handleSkip = () => {
    console.log('User clicked skip');
    handleComplete();
  };

  if (!isVisible) {
    console.log(' Splash not visible, returning null');
    return null;
  }

  console.log('Rendering splash screen');

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(25px, 30px) scale(1.05); }
        }
        
        @keyframes iconReveal {
          0% { opacity: 0; transform: scale(0.3) rotate(-180deg); }
          60% { opacity: 1; transform: scale(1.1) rotate(10deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        
        @keyframes headPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        
        @keyframes ringRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes nameSlideIn {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes taglineFadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes progressShow {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes progressFill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        @keyframes loadingPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .animate-float {
          animation: float 25s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float 30s ease-in-out infinite 3s;
        }
        
        .animate-float-slow {
          animation: float 28s ease-in-out infinite 6s;
        }
        
        .animate-icon-reveal {
          animation: iconReveal 1.5s ease-out forwards;
        }
        
        .animate-head-pulse {
          animation: headPulse 2s ease-in-out infinite 1.5s;
        }
        
        .animate-ring-rotate {
          animation: ringRotate 3s linear infinite;
        }
        
        .animate-ring-rotate-reverse {
          animation: ringRotate 3s linear infinite reverse;
          animation-delay: 0.5s;
        }
        
        .animate-name-slide-in {
          animation: nameSlideIn 1s ease-out forwards 1s;
        }
        
        .animate-tagline-fade-in {
          animation: taglineFadeIn 1s ease-out forwards 1.3s;
        }
        
        .animate-progress-show {
          animation: progressShow 0.5s ease-out forwards 1.8s;
        }
        
        .animate-progress-fill {
          animation: progressFill 2s ease-out forwards 1.8s;
        }
        
        .animate-loading-pulse {
          animation: loadingPulse 1.5s ease-in-out infinite 2s;
        }
      `}</style>

      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity ${
          isFadingOut ? 'opacity-0 duration-[800ms]' : 'opacity-100'
        }`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[150px] -left-[150px] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-orange-400 to-blue-500 opacity-[0.08] animate-float" />
          
          <div className="absolute top-[60%] -right-[100px] w-[200px] h-[200px] rounded-full bg-gradient-to-br from-purple-400 to-orange-600 opacity-[0.08] animate-float-delayed" />
          
          <div className="absolute -bottom-[125px] left-[30%] w-[250px] h-[250px] rounded-full bg-gradient-to-br from-orange-300 to-amber-400 opacity-[0.08] animate-float-slow" />
        </div>

        <button
          onClick={handleSkip}
          className="absolute top-[30px] right-[30px] z-10 px-6 py-2.5 border-2 border-slate-200 text-slate-600 rounded-full text-sm font-semibold transition-all duration-300 hover:bg-orange-500 hover:border-orange-500 hover:text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/30"
        >
          Skip Intro
        </button>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative w-[180px] h-[180px] mb-10 flex items-center justify-center">
            <div className="absolute left-1/2 top-1/2 w-[140px] h-[140px] -ml-[70px] -mt-[70px]">
              <div className="w-full h-full rounded-full border-2 border-transparent border-t-orange-500/40 border-r-orange-500/20 animate-ring-rotate" />
            </div>
            
            <div className="absolute left-1/2 top-1/2 w-[170px] h-[170px] -ml-[85px] -mt-[85px]">
              <div className="w-full h-full rounded-full border-2 border-transparent border-b-amber-600/40 border-l-amber-600/20 animate-ring-rotate-reverse" />
            </div>
            
            <div className="relative w-[90px] h-[90px] opacity-0 animate-icon-reveal">
              <div className="absolute left-1/2 top-[8px] w-[24px] h-[24px] -ml-[12px] rounded-full bg-gradient-to-br from-orange-500 to-amber-600 animate-head-pulse" />
              
              <div className="absolute left-1/2 top-[36px] w-[3px] h-[32px] -ml-[1.5px] rounded-sm bg-gradient-to-b from-orange-500 to-amber-600" />
              
              <div className="absolute left-1/2 top-[46px] -ml-[32px]">
                <div className="w-[64px] h-[3px] rounded-sm bg-gradient-to-r from-orange-500 to-amber-600" />
                <div className="absolute left-0 top-0 w-[14px] h-[3px] rounded-sm bg-gradient-to-r from-orange-500 to-amber-600 origin-left -rotate-[30deg]" />
                <div className="absolute right-0 top-0 w-[14px] h-[3px] rounded-sm bg-gradient-to-r from-orange-500 to-amber-600 origin-right rotate-[30deg]" />
              </div>
              
              <div className="absolute left-1/2 top-[68px] -ml-[1px]">
                <div className="absolute left-[6px] w-[3px] h-[26px] rounded-sm bg-gradient-to-r from-orange-500 to-amber-600 origin-top -rotate-[20deg]" />
                <div className="absolute right-[6px] w-[3px] h-[26px] rounded-sm bg-gradient-to-r from-orange-500 to-amber-600 origin-top rotate-[20deg]" />
              </div>
            </div>
          </div>

          <h1 
            className="text-5xl md:text-6xl font-black bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent mb-3 opacity-0 animate-name-slide-in"
            style={{ fontFamily: '"Playfair Display", serif', letterSpacing: '-0.025em' }}
          >
            Flow Finder
          </h1>

          <p 
            className="text-base md:text-lg text-slate-600 font-medium tracking-wide opacity-0 animate-tagline-fade-in"
            style={{ fontFamily: '"DM Sans", sans-serif' }}
          >
            Discover Accessibility, Elevate Experience
          </p>

          <div className="w-[300px] h-1 bg-slate-200 rounded-full mt-10 overflow-hidden opacity-0 animate-progress-show">
            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-600 rounded-full shadow-lg shadow-orange-500/50 animate-progress-fill" />
          </div>

          <p className="mt-5 text-sm text-slate-400 font-medium opacity-0 animate-loading-pulse">
            Initializing audit engine...
          </p>
        </div>
      </div>
    </>
  );
};

export default SplashScreen;