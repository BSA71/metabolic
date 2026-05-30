import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { listenForAuth } from './services/auth';
import { api } from './services/api';
import type { AppUser } from './types';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ProgramPage } from './pages/ProgramPage';
import { NutritionPage } from './pages/NutritionPage';
import { ExercisePage } from './pages/ExercisePage';
import { ProgressPage } from './pages/ProgressPage';
import { AssistantPage } from './pages/AssistantPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';

function Protected({ firebaseUser, appUser }: { firebaseUser: User | null; appUser: AppUser | null }) {
  if (!firebaseUser) return <Navigate to="/login" replace />;
  return <AppShell user={appUser} />;
}

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  useEffect(() => listenForAuth(async (user) => { setFirebaseUser(user); if (user) { try { const me = await api<{ user: AppUser }>('/api/me'); setAppUser(me.user); } catch { setAppUser(null); } } else setAppUser(null); }), []);
  return <BrowserRouter><Routes><Route path="/login" element={<LoginPage authenticated={Boolean(firebaseUser)} appUser={appUser} />} /><Route element={<Protected firebaseUser={firebaseUser} appUser={appUser} />}><Route index element={<DashboardPage user={appUser} />} /><Route path="program" element={<ProgramPage />} /><Route path="nutrition" element={<NutritionPage />} /><Route path="exercise" element={<ExercisePage />} /><Route path="progress" element={<ProgressPage />} /><Route path="assistant" element={<AssistantPage />} /><Route path="admin" element={<AdminPage />} /></Route></Routes></BrowserRouter>;
}
