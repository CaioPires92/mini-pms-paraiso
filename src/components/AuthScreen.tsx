import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
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

  const field = 'mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-amber-300/40';

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Painel de marca */}
      <section className="relative hidden overflow-hidden bg-emerald-900 p-12 text-stone-50 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-amber-300 font-display text-xl font-extrabold text-emerald-900">P</span>
          <span className="font-display text-xl font-extrabold">Pousada Paraíso</span>
        </div>
        <div className="relative max-w-md">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300">Recepção</p>
          <h1 className="font-serif text-6xl font-normal leading-[1.02] tracking-tight">
            Cada chalé, <em className="text-amber-300">cada hóspede</em>, num só lugar.
          </h1>
        </div>
        <p className="relative text-sm text-stone-200/60">Mapa de reservas, chegadas e saídas do dia.</p>
      </section>

      {/* Formulário */}
      <section className="grid place-items-center bg-stone-50 p-5">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-900 font-display text-xl font-extrabold text-amber-300">P</span>
            <span className="font-display text-xl font-extrabold text-emerald-900">Pousada Paraíso</span>
          </div>
          <h2 className="font-display text-3xl font-extrabold text-emerald-900">
            {mode === 'login' ? 'Bem-vindo de volta' : 'Criar acesso'}
          </h2>
          <p className="mt-1 text-sm text-stone-500">Seus dados ficam protegidos por conta, em qualquer aparelho.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block text-sm font-semibold text-stone-700">E-mail
              <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={field} />
            </label>
            <label className="block text-sm font-semibold text-stone-700">Senha
              <input required minLength={8} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className={field} />
            </label>
            {message && <p className="rounded-xl bg-amber-100 p-3 text-xs font-medium text-amber-900">{message}</p>}
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-900 px-4 py-3.5 text-sm font-bold text-amber-300 transition hover:bg-emerald-700 disabled:opacity-60">
              {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(undefined); }} className="mt-5 w-full text-center text-xs font-semibold text-emerald-700 hover:text-emerald-900">
            {mode === 'login' ? 'Primeiro acesso? Criar conta' : 'Já tenho conta'}
          </button>
        </div>
      </section>
    </main>
  );
};
