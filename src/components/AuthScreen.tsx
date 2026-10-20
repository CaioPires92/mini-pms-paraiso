import React, { useState } from 'react';
import { KeyRound, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(undefined);
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (mode === 'signup' && !result.data.session) setMessage('Conta criada. Confirme o e-mail e entre com a mesma conta em qualquer aparelho.');
  };
  return <main className="min-h-screen bg-stone-50 grid place-items-center p-5"><section className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"><div className="mb-6 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-800 text-white"><KeyRound className="h-5 w-5" /></div><div><h1 className="font-bold text-stone-900">PMS da Pousada</h1><p className="text-xs text-stone-500">Dados protegidos por conta</p></div></div><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-medium text-stone-700">E-mail<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5" /></label><label className="block text-sm font-medium text-stone-700">Senha<input required minLength={8} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5" /></label>{message && <p className="rounded-xl bg-stone-100 p-3 text-xs text-stone-700">{message}</p>}<button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button></form><button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(undefined); }} className="mt-4 w-full text-center text-xs font-semibold text-emerald-800">{mode === 'login' ? 'Primeiro acesso? Criar conta' : 'Já tenho conta'}</button></section></main>;
};
