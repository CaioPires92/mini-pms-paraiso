import React from 'react';
import { PmsProvider, usePms } from './context/PmsContext';
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
  const { activeTab, toast } = usePms();

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
  return (
    <PmsProvider>
      <MainContent />
    </PmsProvider>
  );
}
