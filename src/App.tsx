import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { PmsProvider, usePms } from './context/PmsContext';
import { supabase } from './lib/supabase';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { OccupancyMapView } from './components/OccupancyMapView';
import { ReservationsListView } from './components/ReservationsListView';
import { AccommodationsView } from './components/AccommodationsView';
import { SettingsView } from './components/SettingsView';
import { ReservationModal } from './components/ReservationModal';
import { ReservationDetailsModal } from './components/ReservationDetailsModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, toast, loading, loadError } = usePms();
  if (loading) return <div className="min-h-screen grid place-items-center bg-stone-50 text-sm font-semibold text-stone-600">Carregando sua pousada…</div>;
  if (loadError) return <div className="min-h-screen grid place-items-center bg-stone-50 p-5"><div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center"><h1 className="font-bold text-rose-900">Não foi possível abrir a pousada</h1><p className="mt-2 text-sm text-stone-600">{loadError}</p><button className="mt-5 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white" onClick={() => window.location.reload()}>Tentar novamente</button></div></div>;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 pb-24 lg:pb-10 overflow-x-hidden">
      <Navbar />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-fadeIn">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-xs font-semibold ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : toast.type === 'info'
                ? 'bg-stone-900 text-white border-stone-800'
                : 'bg-emerald-900 text-white border-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-stone-300 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* View Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5 sm:pt-6 flex-1">
        {activeTab === 'mapa' && <OccupancyMapView />}
        {activeTab === 'reservas' && <ReservationsListView />}
        {activeTab === 'acomodacoes' && <AccommodationsView />}
        {activeTab === 'configuracoes' && <SettingsView />}
        {activeTab === 'dashboard' && <DashboardView />}
      </main>

      {/* Modals */}
      <ReservationModal />
      <ReservationDetailsModal />
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState<Session | null>();
  useEffect(() => {
    const setSafeSession = (nextSession: Session | null) => {
      if (nextSession?.user.is_anonymous) { void supabase.auth.signOut(); setSession(null); return; }
      setSession(nextSession);
    };
    void supabase.auth.getSession().then(({ data }) => setSafeSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSafeSession(nextSession));
    return () => subscription.unsubscribe();
  }, []);
  if (session === undefined) return <div className="min-h-screen bg-stone-50" />;
  if (!session) return <AuthScreen />;
  return (
    <PmsProvider user={session.user}>
      <MainContent />
    </PmsProvider>
  );
}
