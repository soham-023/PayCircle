import React, { useState } from 'react';
import { CircleDollarSign, ArrowRight, AlertCircle, Smartphone, Lock, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('soham@paycircle.app');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please check your email/phone and password.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (userIdentifier) => {
    setIdentifier(userIdentifier);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <CircleDollarSign className="w-8 h-8 text-white stroke-[2.2]" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Welcome to PayCircle</h2>
          <p className="text-xs text-slate-600 font-medium">Split Smart. Pay Fair. Stay Connected.</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Accounts Quick-fill Pills */}
        <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-2xl">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Quick Demo Accounts (1-Click Login):
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setDemoUser('soham@paycircle.app')}
              className="px-2 py-1.5 text-[11px] font-semibold bg-white text-emerald-800 border border-emerald-200 rounded-xl hover:bg-emerald-100/60 transition truncate text-left"
            >
              👑 Soham (Admin)
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('priya@paycircle.app')}
              className="px-2 py-1.5 text-[11px] font-semibold bg-white text-emerald-800 border border-emerald-200 rounded-xl hover:bg-emerald-100/60 transition truncate text-left"
            >
              👩 Priya (+919876543211)
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('+919876543212')}
              className="px-2 py-1.5 text-[11px] font-semibold bg-white text-emerald-800 border border-emerald-200 rounded-xl hover:bg-emerald-100/60 transition truncate text-left"
            >
              📱 Rahul (Phone login)
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('ananya@paycircle.app')}
              className="px-2 py-1.5 text-[11px] font-semibold bg-white text-emerald-800 border border-emerald-200 rounded-xl hover:bg-emerald-100/60 transition truncate text-left"
            >
              🎨 Ananya (Member)
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email or Registered Phone
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 absolute left-3.5 top-3 text-slate-600" />
              <input
                type="text"
                placeholder="name@email.com or +919876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-600" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In to PayCircle'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-600">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="font-bold text-emerald-600 hover:text-emerald-700"
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
}
