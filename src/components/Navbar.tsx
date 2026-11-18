import React from 'react';
import { LayoutDashboard, Map, CalendarDays, Bed, Settings, Plus, LogOut } from 'lucide-react';
import { usePms } from '../context/PmsContext';
import { supabase } from '../lib/supabase';

const navItems = [
  { id: 'dashboard' as const, label: 'Resumo', short: 'Resumo', icon: LayoutDashboard },
  { id: 'mapa' as const, label: 'Mapa', short: 'Mapa', icon: Map },
  { id: 'reservas' as const, label: 'Reservas', short: 'Reservas', icon: CalendarDays },
  { id: 'acomodacoes' as const, label: 'Chalés', short: 'Chalés', icon: Bed },
  { id: 'configuracoes' as const, label: 'Ajustes', short: 'Ajustes', icon: Settings },
];

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, openNewReservationModal, settings } = usePms();
  const innName = settings.inn_name || 'Pousada Paraíso';

  return (
    <>
      {/* Barra superior: verde-mata, marca à esquerda, abas em pílula ao centro, ações à direita */}
      <header className="sticky top-0 z-40 bg-emerald-900 text-stone-50 shadow-[0_1px_0_rgba(255,255,255,0.06)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="flex min-w-0 items-center gap-3 text-left"
            aria-label="Ir para o Resumo"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-300 font-display text-lg font-extrabold text-emerald-900">
              P
            </span>
            <span className="min-w-0 leading-none">
              <span className="block truncate font-display text-lg font-extrabold tracking-tight">{innName}</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
                Recepção
              </span>
            </span>
          </button>

          <nav
            aria-label="Seções"
            className="hidden items-center gap-1 rounded-full bg-white/[0.07] p-1 ring-1 ring-white/10 lg:flex"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-amber-300 text-emerald-900 shadow-sm'
                      : 'text-stone-200/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => openNewReservationModal()}
              className="flex items-center gap-1.5 rounded-full bg-amber-300 px-4 py-2.5 text-sm font-bold text-emerald-900 shadow-sm transition hover:bg-amber-200 active:scale-[0.97]"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span className="hidden sm:inline">Nova reserva</span>
              <span className="sm:hidden">Nova</span>
            </button>
            <button
              type="button"
              onClick={() => void supabase.auth.signOut()}
              className="rounded-full p-2.5 text-stone-200/70 transition hover:bg-white/10 hover:text-white"
              title="Sair da conta"
              aria-label="Sair da conta"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Dock flutuante no celular */}
      <nav
        aria-label="Seções"
        className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-full bg-emerald-900/95 p-1.5 shadow-[0_12px_32px_rgba(12,34,16,0.35)] ring-1 ring-white/10 backdrop-blur lg:hidden"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-full px-3 py-2 transition-colors ${
                isActive ? 'min-w-[72px] bg-amber-300 text-emerald-900' : 'min-w-[48px] text-stone-200/75'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className={`text-[10px] font-bold leading-none ${isActive ? '' : 'sr-only'}`}>{item.short}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
