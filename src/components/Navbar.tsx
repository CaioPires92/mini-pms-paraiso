import React from 'react';
import {
  LayoutDashboard,
  Map,
  CalendarDays,
  Bed,
  Settings,
  Plus,
  Compass,
  LogOut,
} from 'lucide-react';
import { usePms } from '../context/PmsContext';
import { supabase } from '../lib/supabase';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, openNewReservationModal, settings } = usePms();

  const navItems = [
    { id: 'mapa' as const, label: 'Mapa de Reservas', icon: Map, isSpecial: true },
    { id: 'reservas' as const, label: 'Lista de Reservas', icon: CalendarDays },
    { id: 'acomodacoes' as const, label: 'Chalés', icon: Bed },
    { id: 'configuracoes' as const, label: 'Configurações', icon: Settings },
    { id: 'dashboard' as const, label: 'Resumo', icon: LayoutDashboard },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand */}
          <div
            onClick={() => setActiveTab('mapa')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-xs shrink-0">
              <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
            </div>
            <div className="truncate min-w-0">
              <span className="text-base sm:text-xl font-bold tracking-tight text-stone-900 block leading-tight truncate">
                {settings.inn_name || 'Pousada Paraíso'}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-500 font-medium block truncate">
                Controle de Reservas
              </span>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-2 text-sm font-semibold">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-stone-100 text-stone-950 font-bold border border-stone-300/80 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? (item.isSpecial ? 'text-emerald-700' : 'text-stone-900') : 'text-stone-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => openNewReservationModal()}
              className="px-3 sm:px-5 py-2 sm:py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 stroke-[2.5]" />
              <span>Nova Reserva</span>
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Large touch targets, high contrast) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t-2 border-stone-200 px-2 py-2 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition min-w-[56px] ${
                isActive
                  ? 'text-emerald-900 font-extrabold bg-emerald-50/80'
                  : 'text-stone-600 font-medium'
              }`}
            >
              <Icon
                className={`w-6 h-6 mb-1 ${
                  isActive ? 'text-emerald-800 stroke-[2.5]' : 'text-stone-500'
                }`}
              />
              <span className="text-[11px] truncate max-w-[70px] leading-tight">
                {item.id === 'mapa'
                  ? 'Mapa'
                  : item.id === 'reservas'
                  ? 'Reservas'
                  : item.id === 'acomodacoes'
                  ? 'Chalés'
                  : item.id === 'configuracoes'
                  ? 'Config'
                  : 'Resumo'}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
