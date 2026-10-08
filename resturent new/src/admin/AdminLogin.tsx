import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Lock, Mail, AlertCircle, ArrowLeft, Coffee, Sparkles } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          navigate(from, { replace: true });
        } else {
          setSuccessMsg('Account created! If email confirmation is enabled, please verify your email or sign in directly.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          navigate(from, { replace: true });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#14120E] text-[#F6EFE3] flex flex-col justify-between p-6 md:p-12 selection:bg-[#C8321F] selection:text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <a
          href="/"
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#A89E90] hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Café
        </a>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C8321F] font-bold">
          <Coffee size={16} />
          Management Portal
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-12 bg-[#1C1814] border border-[#2D2822] rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#C8321F]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative">
          <div className="w-14 h-14 bg-[#C8321F]/20 text-[#C8321F] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#C8321F]/30 shadow-inner">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl md:text-3xl font-serif text-[#F6EFE3]">
            {isSignUp ? 'Create Staff Access' : 'Café Host Sign In'}
          </h1>
          <p className="text-xs text-[#A89E90] mt-2 tracking-wide">
            {isSignUp
              ? 'Register credentials for café management access'
              : 'Enter your credentials to manage tables and live bookings'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-start gap-3">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-950/40 border border-green-800/60 rounded-xl text-green-200 text-xs flex items-start gap-3">
            <Sparkles size={16} className="shrink-0 mt-0.5 text-green-400" />
            <div>{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A89E90] mb-2 font-medium">
              Admin Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7C7267]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="host@cafedelights.com"
                className="w-full bg-[#14120E] border border-[#2D2822] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F6EFE3] placeholder-[#5C5348] focus:outline-none focus:border-[#C8321F] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A89E90] mb-2 font-medium">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7C7267]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#14120E] border border-[#2D2822] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F6EFE3] placeholder-[#5C5348] focus:outline-none focus:border-[#C8321F] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#C8321F] hover:bg-[#A82515] text-white font-medium text-sm rounded-xl tracking-wide transition-all shadow-lg shadow-[#C8321F]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              'Create Admin Account'
            ) : (
              'Enter Admin Dashboard'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#2D2822] text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-xs text-[#A89E90] hover:text-[#F6EFE3] transition-colors underline cursor-pointer"
          >
            {isSignUp
              ? 'Already registered? Sign in here'
              : 'First time setup? Create an admin account'}
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-[#5C5348] tracking-widest uppercase">
        Secured by Supabase Auth &bull; Café Management Suite
      </div>
    </div>
  );
};
