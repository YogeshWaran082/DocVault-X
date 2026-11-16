import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, User, Building, ArrowRight, AlertTriangle, ArrowLeft } from 'lucide-react';
import { ApiClient } from '../api/client';

interface AuthScreenProps {
  onAuthenticated: () => void;
  onBackToLanding?: () => void;
  isAdminMode?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated, onBackToLanding, isAdminMode }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister
        ? { email, password, name, organizationName: orgName || undefined }
        : { email, password };

      const res = await ApiClient.request<{ accessToken: string }>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      ApiClient.setToken(res.accessToken);
      onAuthenticated();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const demoEmail = 'admin@docvault-demo.com';
      const demoPass = 'DocVaultPass2026!';

      // Try login first
      try {
        const loginRes = await ApiClient.request<{ accessToken: string }>('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: demoEmail, password: demoPass })
        });
        ApiClient.setToken(loginRes.accessToken);
        onAuthenticated();
        return;
      } catch {
        // Register demo user if doesn't exist
        const regRes = await ApiClient.request<{ accessToken: string }>('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: demoEmail,
            name: 'Security Executive',
            password: demoPass,
            organizationName: 'Global Defense Labs'
          })
        });
        ApiClient.setToken(regRes.accessToken);
        onAuthenticated();
      }
    } catch {
      // Offline fallback: grant demo session directly so user can access the app immediately
      ApiClient.setToken('demo_token_admin_exec');
      onAuthenticated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#0A1222] to-[#17253A] text-slate-100">
      <div className="w-full max-w-md bg-[#111D30] rounded-3xl shadow-2xl border border-slate-700/80 p-8 space-y-6">
        {/* Back to Home / Landing Link */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#2DD4BF] transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Landing Page</span>
          </button>
        )}

        {/* Mode Badge */}
        {isAdminMode && (
          <div className="p-2.5 rounded-xl bg-[#2DD4BF]/10 border border-[#2DD4BF]/40 text-[#2DD4BF] text-xs flex items-center justify-center gap-2 font-mono font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Security Clearance Verification</span>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-[#2DD4BF] mx-auto flex items-center justify-center text-[#0A1222] font-black shadow-lg shadow-[#2DD4BF]/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            DocVault X Platform
          </h1>
          <p className="text-xs text-slate-400">
            {isRegister ? 'Create your tenant organization' : 'Sign in to your protected document vault'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alice Walker"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Organization / Tenant Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Security Corp"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@acme.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/20 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <span>{isRegister ? 'Create Organization & Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
          >
            Instant Demo Account (One-Click)
          </button>

          <div className="text-center">
            <button
              onClick={() => {
                setError(null);
                setIsRegister(!isRegister);
              }}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
