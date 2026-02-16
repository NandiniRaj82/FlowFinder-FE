'use client';

import React, { useState } from 'react';
import UploadSection from './uploadSection';
import ChoiceCards from './choiceSection';

interface DashboardProps {
  user?: {
    fullName: string;
    email: string;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showChoices, setShowChoices] = useState(false);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setShowChoices(true);
  };

  const handleChoiceSelect = (choice: 'suggestions' | 'full-correction') => {
    console.log('Selected:', choice, 'for file:', uploadedFile?.name);
    // Handle the choice - send to backend for processing
  };

  const handleReset = () => {
    setUploadedFile(null);
    setShowChoices(false);
  };

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slideUp 0.6s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-orange-400/20 to-amber-500/20 blur-3xl animate-float" />
          <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-rose-400/20 to-orange-500/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full bg-gradient-to-br from-amber-400/20 to-yellow-500/20 blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        </div>

        {/* Header */}
        <header className="relative z-10 glass-effect border-b border-orange-200/50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent" style={{ fontFamily: '"Playfair Display", serif' }}>
                Flow Finder
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">{user?.fullName || 'User'}</p>
                <p className="text-xs text-slate-600">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/signin';
                }}
                className="px-4 py-2 bg-white/80 hover:bg-white border border-orange-200 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
          {!showChoices ? (
            <div className="animate-slide-up">
              <UploadSection onFileUpload={handleFileUpload} />
            </div>
          ) : (
            <div className="animate-fade-in">
              <ChoiceCards
                fileName={uploadedFile?.name || ''}
                onChoiceSelect={handleChoiceSelect}
                onReset={handleReset}
              />
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Dashboard;