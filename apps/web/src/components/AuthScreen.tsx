import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  X
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { Contrast } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';

interface AuthScreenProps {
  isOpen?: boolean;
  onAuthenticated: () => void | Promise<void>;
  onClose?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ isOpen = true, onAuthenticated, onClose }) => {
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose && !loading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const nextErrors: { email?: string; password?: string } = {};
    if (!email.trim()) nextErrors.email = 'Enter your administrator email.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!password) nextErrors.password = 'Enter your password.';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await ApiClient.request<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      ApiClient.setToken(response.accessToken);
      await onAuthenticated();
    } catch {
      setError('The email or password is incorrect, or this account no longer has access.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-theme-shell fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-[#050505]/82 px-4 py-6 backdrop-blur-xl sm:py-10" role="dialog" aria-modal="true" aria-labelledby="admin-login-title">
      <button type="button" aria-label="Close sign in" onClick={onClose} className="absolute inset-0 cursor-default" />

      <section className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b0c0f] shadow-[0_32px_100px_rgba(0,0,0,0.62)] lg:grid-cols-[0.88fr_1.12fr]">
        <aside className="relative hidden min-h-[36rem] overflow-hidden border-r border-white/10 bg-[#101114] p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_18%_12%,rgba(255,106,0,0.24),transparent_34%),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:auto,32px_32px,32px_32px]" />
          <div className="relative">
            <div className="mb-10 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#ff7a00]/40 bg-[#ff6a00]/10 text-[#ff8a22] shadow-[0_0_26px_rgba(255,106,0,0.14)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-white">DocVault X</p>
                <p className="text-[10px] tracking-[0.18em] text-neutral-500">ADMINISTRATION CONSOLE</p>
              </div>
            </div>
            <p className="mb-3 text-xs font-medium tracking-[0.16em] text-[#ff8a22]">RESTRICTED ACCESS</p>
            <h2 className="max-w-sm text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-white">Your document controls stay behind one verified identity.</h2>
            <p className="mt-5 max-w-xs text-sm leading-6 text-neutral-400">Sign in to manage encrypted files, viewing policies, access links and the immutable audit trail.</p>
          </div>
          <div className="relative space-y-3 text-xs text-neutral-400">
            {['Signed, one-hour administrator session', 'Tenant and role checks on every request', 'Server-enforced document permissions'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <span className="grid h-5 w-5 place-items-center rounded-md bg-white/5 text-[#ff8a22]"><Check className="h-3 w-3" /></span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="relative px-6 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-8 lg:px-12 lg:pb-12 lg:pt-10">
          <button type="button" onClick={toggleTheme} aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`} className={`absolute top-5 grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.035] text-neutral-500 transition hover:border-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00] ${onClose ? 'right-16' : 'right-5'}`}>
            <Contrast className="h-4 w-4" />
          </button>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close sign in" className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.035] text-neutral-500 transition hover:border-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00] active:scale-95">
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="mb-8 pr-12">
            <div className="mb-6 grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-200 lg:hidden"><Fingerprint className="h-5 w-5" /></div>
            <p className="mb-2 text-xs font-medium tracking-[0.14em] text-neutral-500">IDENTITY VERIFICATION</p>
            <h1 id="admin-login-title" className="text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">Sign in to the vault</h1>
            <p className="mt-2 text-sm leading-6 text-neutral-400">Use the administrator credentials assigned to this workspace.</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-xs leading-5 text-red-200" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-xs font-medium text-neutral-300">Administrator email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
                <input id="admin-email" type="email" autoComplete="username" autoFocus value={email} onChange={event => { setEmail(event.target.value); setFieldErrors(current => ({ ...current, email: undefined })); }} placeholder="admin@docvaultx.com" aria-invalid={Boolean(fieldErrors.email)} className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-600 hover:border-white/20 focus:border-[#ff7a00]/70 focus:ring-4 focus:ring-[#ff6a00]/10" />
              </div>
              {fieldErrors.email && <p className="mt-2 text-xs text-red-300">{fieldErrors.email}</p>}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="admin-password" className="text-xs font-medium text-neutral-300">Password</label>
                <span className="text-[10px] tracking-wide text-neutral-600">CASE SENSITIVE</span>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
                <input id="admin-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => { setPassword(event.target.value); setFieldErrors(current => ({ ...current, password: undefined })); }} placeholder="Enter your password" aria-invalid={Boolean(fieldErrors.password)} className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-neutral-600 hover:border-white/20 focus:border-[#ff7a00]/70 focus:ring-4 focus:ring-[#ff6a00]/10" />
                <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-neutral-600 transition hover:bg-white/5 hover:text-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-2 text-xs text-red-300">{fieldErrors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ff6a00] px-5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(255,106,0,0.18)] transition hover:bg-[#ff7a00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a22] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c0f] active:scale-[0.985] disabled:cursor-wait disabled:opacity-60">
              {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /><span>Verifying access</span></> : <><LockKeyhole className="h-4 w-4" /><span>Continue securely</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
            </button>
          </form>

          <div className="mt-7 flex items-start gap-3 border-t border-white/10 pt-5 text-[11px] leading-5 text-neutral-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
            <p>Access attempts are validated by the server and recorded in the security audit trail.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
