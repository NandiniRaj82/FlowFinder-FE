'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface SignUpProps {
  onSwitchToSignIn?: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSwitchToSignIn }) => {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, signInWithGitHub } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.');
    if (!agreedToTerms) return setError('Please agree to the terms and conditions.');
    if (formData.password.length < 6) return setError('Password must be at least 6 characters.');
    setIsLoading(true);
    try {
      await signUpWithEmail(formData.email, formData.password, formData.fullName);
      setSuccess('Account created! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists.'
        : err.message || 'Sign up failed.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocial = async (provider: 'google' | 'github') => {
    setError(null);
    setSocialLoading(provider);
    try {
      if (provider === 'google') await signInWithGoogle();
      else await signInWithGitHub();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || `${provider} sign up failed.`);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(20px,-20px) scale(1.05); }
          66% { transform: translate(-15px,15px) scale(0.95); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ff-fade-up { animation: fadeInUp 0.6s ease-out both; }
        .ff-float { animation: float 20s ease-in-out infinite; }
        .ff-float-2 { animation: float 25s ease-in-out infinite 4s; }
        .ff-input { width:100%; padding:12px 44px 12px 16px; border:2px solid #e2e8f0; border-radius:12px; outline:none; font-size:14px; color:#1e293b; background:#fff; transition:border-color 0.2s,box-shadow 0.2s; font-family:Inter,sans-serif; box-sizing:border-box; }
        .ff-input:focus { border-color:#ea580c; box-shadow:0 0 0 4px rgba(234,88,12,0.12); }
        .ff-btn-primary { width:100%; padding:13px; background:linear-gradient(135deg,#ea580c,#f59e0b); color:#fff; font-weight:700; border:none; border-radius:12px; cursor:pointer; font-size:15px; transition:transform 0.15s,box-shadow 0.15s; box-shadow:0 4px 16px rgba(234,88,12,0.3); }
        .ff-btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(234,88,12,0.4); }
        .ff-btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
        .ff-btn-social { flex:1; display:flex; align-items:center; justify-content:center; gap:8px; padding:11px; border:2px solid #e2e8f0; border-radius:12px; background:#fff; cursor:pointer; font-weight:600; font-size:13px; color:#475569; transition:all 0.2s; }
        .ff-btn-social:hover:not(:disabled) { border-color:#ea580c; background:#fff7ed; color:#1e293b; }
        .ff-btn-social:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>

      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#fff7ed,#fffbeb,#fff)', position:'relative', overflow:'hidden', padding:'40px 0' }}>
        <div className="ff-float" style={{ position:'absolute', top:'-100px', left:'-100px', width:'280px', height:'280px', borderRadius:'50%', background:'linear-gradient(135deg,#fb923c,#f59e0b)', opacity:0.08, pointerEvents:'none' }} />
        <div className="ff-float-2" style={{ position:'absolute', bottom:'-80px', right:'-60px', width:'220px', height:'220px', borderRadius:'50%', background:'linear-gradient(135deg,#f59e0b,#ea580c)', opacity:0.07, pointerEvents:'none' }} />

        <div className="ff-fade-up" style={{ width:'100%', maxWidth:'440px', padding:'0 24px', position:'relative', zIndex:10 }}>
          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:'28px' }}>
            <div style={{ width:'48px', height:'48px', background:'linear-gradient(135deg,#ea580c,#f59e0b)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', boxShadow:'0 8px 24px rgba(234,88,12,0.3)' }}>
              <svg width="24" height="24" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'28px', fontWeight:900, background:'linear-gradient(135deg,#ea580c,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 4px' }}>Flow Finder</h1>
            <p style={{ color:'#64748b', fontSize:'14px', margin:0, fontFamily:'Inter,sans-serif' }}>Create your account</p>
          </div>

          <div style={{ background:'#fff', borderRadius:'20px', padding:'28px 32px', boxShadow:'0 20px 60px rgba(0,0,0,0.08)', border:'1px solid #fde68a' }}>
            {/* Alerts */}
            {error && (
              <div style={{ marginBottom:'16px', padding:'12px 16px', background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:'10px', display:'flex', alignItems:'center', gap:'10px' }}>
                <svg width="16" height="16" fill="#ef4444" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
                <span style={{ fontSize:'13px', color:'#b91c1c', fontWeight:500 }}>{error}</span>
              </div>
            )}
            {success && (
              <div style={{ marginBottom:'16px', padding:'12px 16px', background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:'10px', display:'flex', alignItems:'center', gap:'10px' }}>
                <svg width="16" height="16" fill="#22c55e" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                <span style={{ fontSize:'13px', color:'#15803d', fontWeight:500 }}>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              {/* Full Name */}
              <div>
                <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'7px', fontFamily:'Inter,sans-serif' }}>Full Name</label>
                <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} className="ff-input" placeholder="John Doe" required style={{ paddingRight:'16px' }} />
              </div>

              {/* Email */}
              <div>
                <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'7px', fontFamily:'Inter,sans-serif' }}>Email Address</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} className="ff-input" placeholder="you@example.com" required style={{ paddingRight:'16px' }} />
              </div>

              {/* Password */}
              <div>
                <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'7px', fontFamily:'Inter,sans-serif' }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} className="ff-input" placeholder="Min. 6 characters" required />
                  <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'7px', fontFamily:'Inter,sans-serif' }}>Confirm Password</label>
                <div style={{ position:'relative' }}>
                  <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} className="ff-input" placeholder="Repeat password" required />
                  <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                </div>
              </div>

              {/* Terms */}
              <label style={{ display:'flex', alignItems:'flex-start', gap:'10px', cursor:'pointer' }}>
                <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} style={{ marginTop:'2px', accentColor:'#ea580c' }} />
                <span style={{ fontSize:'13px', color:'#64748b', fontFamily:'Inter,sans-serif' }}>
                  I agree to the <button type="button" style={{ color:'#ea580c', fontWeight:600, background:'none', border:'none', cursor:'pointer', fontSize:'13px', padding:0 }}>Terms</button> and <button type="button" style={{ color:'#ea580c', fontWeight:600, background:'none', border:'none', cursor:'pointer', fontSize:'13px', padding:0 }}>Privacy Policy</button>
                </span>
              </label>

              <button type="submit" disabled={isLoading} className="ff-btn-primary">
                {isLoading ? (
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                    <svg style={{ animation:'spin 1s linear infinite' }} width="18" height="18" fill="none" viewBox="0 0 24 24"><circle style={{ opacity:0.25 }} cx="12" cy="12" r="10" stroke="#fff" strokeWidth="4"/><path style={{ opacity:0.75 }} fill="#fff" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'18px 0' }}>
              <div style={{ flex:1, height:'1px', background:'#e2e8f0' }} />
              <span style={{ fontSize:'12px', color:'#94a3b8', fontWeight:500 }}>Or sign up with</span>
              <div style={{ flex:1, height:'1px', background:'#e2e8f0' }} />
            </div>
            <div style={{ display:'flex', gap:'12px' }}>
              <button type="button" onClick={() => handleSocial('google')} disabled={!!socialLoading} className="ff-btn-social">
                <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </button>
              <button type="button" onClick={() => handleSocial('github')} disabled={!!socialLoading} className="ff-btn-social">
                <svg width="17" height="17" fill="#1e293b" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                GitHub
              </button>
            </div>
          </div>

          <p style={{ textAlign:'center', marginTop:'20px', fontSize:'14px', color:'#64748b', fontFamily:'Inter,sans-serif' }}>
            Already have an account?{' '}
            <button onClick={onSwitchToSignIn} style={{ fontWeight:700, color:'#ea580c', background:'none', border:'none', cursor:'pointer', fontSize:'14px' }}>Sign in</button>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignUp;