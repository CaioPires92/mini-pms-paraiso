import React, { FormEvent, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LockKeyhole } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setChecking(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
    setSubmitting(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (mode === 'signup' && !result.data.session) {
      setMessage('Conta criada. Confirme o e-mail recebido antes de entrar.');
    }
  };

  if (checking) {
    return <div className="min-h-screen grid place-items-center bg-stone-50 text-stone-600">Carregando…</div>;
  }
  if (session) return <>{children}</>;

  return (
    <div className="min-h-screen grid place-items-center bg-stone-100 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl border border-stone-200">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-900 p-3 text-white"><LockKeyhole className="h-5 w-5" /></div>
          <div><h1 className="text-xl font-bold">Pousada Paraíso</h1><p className="text-sm text-stone-500">Acesso seguro ao PMS</p></div>
        </div>
        <label className="block text-sm font-semibold text-stone-700">E-mail</label>
        <input className="mt-1 mb-4 w-full rounded-xl border border-stone-300 px-3 py-2.5" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="block text-sm font-semibold text-stone-700">Senha</label>
        <input className="mt-1 mb-4 w-full rounded-xl border border-stone-300 px-3 py-2.5" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        {message && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}
        <button disabled={submitting} className="w-full rounded-xl bg-emerald-900 px-4 py-3 font-semibold text-white disabled:opacity-60">
          {submitting ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
        <button type="button" className="mt-4 w-full text-sm font-semibold text-emerald-800" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }}>
          {mode === 'login' ? 'Primeiro acesso? Criar conta' : 'Já tenho conta'}
        </button>
      </form>
    </div>
  );
};
