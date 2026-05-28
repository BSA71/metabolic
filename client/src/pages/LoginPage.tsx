import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { login, loginWithGoogle, signUp } from '../services/auth';
import { isFirebaseConfigured } from '../services/firebase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import type { AppUser } from '../types';

const inputClass =
  'w-full rounded-2xl border border-app-border bg-app-bg p-3 text-app-text placeholder:text-app-text-muted';

export function LoginPage({ authenticated }: { authenticated: boolean; appUser?: AppUser | null }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('user@metabolic.local');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  if (authenticated) return <Navigate to="/" replace />;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      if (mode === 'signup') {
        await signUp(email, password, `${firstName} ${lastName}`.trim());
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `${mode === 'signup' ? 'Sign up' : 'Login'} failed`);
    }
  }

  async function googleLogin() {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center bg-app-bg p-4 text-app-text">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <img src="/logo.png" alt="Master Metabolic" className="h-12 w-auto object-contain object-left" />
          <p className="mt-2 text-sm text-app-text-muted">
            {mode === 'signup' ? 'Create your account' : 'Sign in with Firebase Auth'}
          </p>
        </div>
        {!isFirebaseConfigured && (
          <div className="mb-4 rounded-2xl border border-brand/40 bg-brand/10 p-4 text-sm">
            <p className="font-semibold">Firebase is not configured yet.</p>
            <p className="mt-1 text-app-text-muted">
              Add your Firebase web app values to <code>client/.env</code>, then restart{' '}
              <code>npm run dev</code>.
            </p>
          </div>
        )}
        <button
          type="button"
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm font-semibold shadow-sm transition hover:bg-app-muted disabled:opacity-50"
          disabled={!isFirebaseConfigured}
          onClick={googleLogin}
        >
          Continue with Google
        </button>
        <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-wide text-app-text-muted">
          <div className="h-px flex-1 bg-app-border" />
          or use email
          <div className="h-px flex-1 bg-app-border" />
        </div>
        <div className="mb-4 grid grid-cols-2 rounded-2xl bg-app-muted p-1 text-sm font-semibold">
          <button
            type="button"
            className={`rounded-xl px-3 py-2 ${mode === 'login' ? 'bg-app-surface text-app-text shadow-sm' : 'text-app-text-muted'}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`rounded-xl px-3 py-2 ${mode === 'signup' ? 'bg-app-surface text-app-text shadow-sm' : 'text-app-text-muted'}`}
            onClick={() => setMode('signup')}
          >
            Create account
          </button>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          {mode === 'signup' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
            </div>
          )}
          <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
          <Button className="w-full" disabled={!isFirebaseConfigured}>
            {mode === 'signup' ? 'Create account' : 'Login'}
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </Card>
    </main>
  );
}
