import { useState } from 'react';
import { Activity } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { login, loginWithGoogle, signUp } from '../services/auth';
import { isFirebaseConfigured } from '../services/firebase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import type { AppUser } from '../types';

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
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-4"><Card className="w-full max-w-md"><div className="mb-6 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white"><Activity /></div><div><h1 className="text-2xl font-bold">Metabolic</h1><p className="text-sm text-slate-500">{mode === 'signup' ? 'Create your account' : 'Sign in with Firebase Auth'}</p></div></div>{!isFirebaseConfigured && <div className="mb-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900"><p className="font-semibold">Firebase is not configured yet.</p><p className="mt-1">Add your Firebase web app values to <code>client/.env</code>, then restart <code>npm run dev</code>.</p></div>}<button type="button" className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm hover:bg-slate-50 disabled:opacity-50" disabled={!isFirebaseConfigured} onClick={googleLogin}>Continue with Google</button><div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400"><div className="h-px flex-1 bg-slate-200" />or use email<div className="h-px flex-1 bg-slate-200" /></div><div className="mb-4 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-semibold"><button type="button" className={`rounded-xl px-3 py-2 ${mode === 'login' ? 'bg-white shadow-sm' : 'text-slate-500'}`} onClick={() => setMode('login')}>Login</button><button type="button" className={`rounded-xl px-3 py-2 ${mode === 'signup' ? 'bg-white shadow-sm' : 'text-slate-500'}`} onClick={() => setMode('signup')}>Create account</button></div><form className="space-y-4" onSubmit={submit}>{mode === 'signup' && <div className="grid gap-3 sm:grid-cols-2"><input className="w-full rounded-2xl border border-slate-200 p-3" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" /><input className="w-full rounded-2xl border border-slate-200 p-3" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" /></div>}<input className="w-full rounded-2xl border border-slate-200 p-3" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" /><input className="w-full rounded-2xl border border-slate-200 p-3" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" /><Button className="w-full" disabled={!isFirebaseConfigured}>{mode === 'signup' ? 'Create account' : 'Login'}</Button>{error && <p className="text-sm text-red-600">{error}</p>}</form></Card></main>;
}
