'use client';

import React, { useState } from 'react';

interface ChoiceCardsProps {
  fileName: string;
  onChoiceSelect: (choice: 'suggestions' | 'full-correction') => void;
  onReset: () => void;
  isProcessing?: boolean; // Added this prop
}

const ChoiceCards: React.FC<ChoiceCardsProps> = ({ 
  fileName, 
  onChoiceSelect, 
  onReset,
  isProcessing: externalIsProcessing = false // Renamed to avoid conflict
}) => {
  const [selectedChoice, setSelectedChoice] = useState<'suggestions' | 'full-correction' | null>(null);

  // Use external processing state if provided, otherwise use local state
  const isProcessing = externalIsProcessing;

  const handleChoiceClick = (choice: 'suggestions' | 'full-correction') => {
    if (!isProcessing) {
      setSelectedChoice(choice);
    }
  };

  const handleProceed = () => {
    if (selectedChoice && !isProcessing) {
      onChoiceSelect(selectedChoice);
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes float-up {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0.95);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(249, 115, 22, 0.6);
          }
        }

        .animate-float-up {
          animation: float-up 0.6s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.8) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 animate-float-up">
          <div className="inline-flex items-center space-x-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-200 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-700">File uploaded: {fileName}</span>
          </div>

          <h2 
            className="text-5xl font-black mb-4 bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 bg-clip-text text-transparent"
            style={{ fontFamily: '"Playfair Display", serif', letterSpacing: '-0.02em' }}
          >
            Choose Your Path
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto" style={{ fontFamily: '"DM Sans", sans-serif' }}>
            How would you like us to help you improve your code?
          </p>
        </div>

        {/* Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Suggestions Card */}
          <div
            onClick={() => handleChoiceClick('suggestions')}
            className={`
              relative group cursor-pointer transform transition-all duration-300 animate-scale-in
              ${selectedChoice === 'suggestions' 
                ? 'scale-105 -translate-y-2' 
                : 'hover:scale-[1.02] hover:-translate-y-1'
              }
              ${isProcessing ? 'pointer-events-none opacity-50' : ''}
            `}
            style={{ animationDelay: '0.1s' }}
          >
            <div
              className={`
                relative bg-white rounded-3xl p-8 shadow-xl border-4 transition-all duration-300 overflow-hidden
                ${selectedChoice === 'suggestions' 
                  ? 'border-blue-500 shadow-2xl shadow-blue-500/30' 
                  : 'border-blue-200 group-hover:border-blue-400'
                }
              `}
            >
              {/* Shimmer effect for selected card */}
              {selectedChoice === 'suggestions' && (
                <div className="absolute inset-0 shimmer pointer-events-none" />
              )}

              {/* Icon */}
              <div className="mb-6 relative">
                <div className={`
                  w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300
                  ${selectedChoice === 'suggestions'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50'
                    : 'bg-gradient-to-br from-blue-400 to-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/30'
                  }
                `}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                {selectedChoice === 'suggestions' && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <h3 className="text-3xl font-bold text-slate-800 mb-4" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                Get Suggestions
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Receive AI-powered recommendations and insights on how to improve your code. 
                Perfect for learning and understanding best practices.
              </p>

              {/* Features List */}
              <ul className="space-y-3 mb-6">
                {[
                  'Detailed code analysis',
                  'Best practice recommendations',
                  'Performance optimization tips',
                  'Security vulnerability detection',
                  'Learn as you code'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm font-semibold text-blue-700">For Learning</span>
              </div>
            </div>
          </div>

          {/* Full Correction Card */}
          <div
            onClick={() => handleChoiceClick('full-correction')}
            className={`
              relative group cursor-pointer transform transition-all duration-300 animate-scale-in
              ${selectedChoice === 'full-correction' 
                ? 'scale-105 -translate-y-2' 
                : 'hover:scale-[1.02] hover:-translate-y-1'
              }
              ${isProcessing ? 'pointer-events-none opacity-50' : ''}
            `}
            style={{ animationDelay: '0.2s' }}
          >
            <div
              className={`
                relative bg-white rounded-3xl p-8 shadow-xl border-4 transition-all duration-300 overflow-hidden
                ${selectedChoice === 'full-correction' 
                  ? 'border-orange-500 shadow-2xl shadow-orange-500/30' 
                  : 'border-orange-200 group-hover:border-orange-400'
                }
              `}
            >
              {/* Shimmer effect for selected card */}
              {selectedChoice === 'full-correction' && (
                <div className="absolute inset-0 shimmer pointer-events-none" />
              )}

              {/* Popular Badge */}
              <div className="absolute top-6 right-6">
                <div className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-bold rounded-full shadow-lg">
                  POPULAR
                </div>
              </div>

              {/* Icon */}
              <div className="mb-6 relative">
                <div className={`
                  w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300
                  ${selectedChoice === 'full-correction'
                    ? 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/50'
                    : 'bg-gradient-to-br from-orange-400 to-amber-500 group-hover:shadow-lg group-hover:shadow-orange-500/30'
                  }
                `}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                {selectedChoice === 'full-correction' && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <h3 className="text-3xl font-bold text-slate-800 mb-4" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                Full AI Correction
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Let AI automatically fix and optimize your entire codebase. 
                Download a production-ready zip file with all improvements applied.
              </p>

              {/* Features List */}
              <ul className="space-y-3 mb-6">
                {[
                  'Automatic bug fixes',
                  'Code optimization & refactoring',
                  'Best practices implementation',
                  'Download as ZIP file',
                  'Ready to deploy'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-50 rounded-full">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-orange-700">Time Saver</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 animate-float-up" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={onReset}
            disabled={isProcessing}
            className="px-8 py-4 bg-white border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Upload Different File
          </button>
          
          <button
            onClick={handleProceed}
            disabled={!selectedChoice || isProcessing}
            className={`
              px-12 py-4 font-bold rounded-xl transition-all duration-300 shadow-lg
              ${selectedChoice && !isProcessing
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-xl hover:-translate-y-0.5'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </div>
            ) : (
              `Proceed with ${selectedChoice === 'suggestions' ? 'Suggestions' : 'Full Correction'} →`
            )}
          </button>
        </div>

        {/* Info Note */}
        {selectedChoice && !isProcessing && (
          <div className="mt-8 max-w-2xl mx-auto p-6 bg-blue-50 border border-blue-200 rounded-2xl animate-float-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-bold text-blue-900 mb-1">What happens next?</h4>
                <p className="text-sm text-blue-800">
                  {selectedChoice === 'suggestions' 
                    ? 'Our AI will analyze your code and provide detailed suggestions for improvements. You\'ll receive a comprehensive report with actionable recommendations.'
                    : 'Our AI will automatically correct and optimize your code. You\'ll receive a downloadable ZIP file with all improvements applied and a detailed changelog.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChoiceCards;