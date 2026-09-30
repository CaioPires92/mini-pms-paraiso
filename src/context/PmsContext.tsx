import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Accommodation, Reservation, InnSettings, ReservationStatus } from '../types';
import {
  getStoredAccommodations,
  saveAccommodations,
  getStoredReservations,
  saveReservations,
  getStoredSettings,
  saveSettings,
  resetAllDataToDefault,
  DEFAULT_SETTINGS,
} from '../lib/storage';
import { isDateRangeOverlapping, getTodaySaoPaulo, calculateDailyCount, isReservationPast } from '../lib/dateUtils';
import { supabase } from '../lib/supabase';

interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingReservation?: Reservation;
}

interface ModalReservationState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: Partial<Reservation>;
}

interface PmsContextType {
  accommodations: Accommodation[];
  reservations: Reservation[];
  settings: InnSettings;
  activeTab: 'dashboard' | 'mapa' | 'reservas' | 'acomodacoes' | 'configuracoes';
  setActiveTab: (tab: 'dashboard' | 'mapa' | 'reservas' | 'acomodacoes' | 'configuracoes') => void;
  
  // Modals
  modalReservation: ModalReservationState;
  openNewReservationModal: (prefill?: Partial<Reservation>) => void;
  openEditReservationModal: (reservation: Reservation) => void;
  closeReservationModal: () => void;
  
  selectedReservationDetails: Reservation | null;
  openReservationDetails: (reservation: Reservation) => void;
  closeReservationDetails: () => void;

  // Validation & Queries
  checkAccommodationConflict: (
    accommodationId: string,
    checkIn: string,
    checkOut: string,
    excludeReservationId?: string
  ) => ConflictCheckResult;
  getAvailableAccommodations: (
    checkIn: string,
    checkOut: string,
    excludeReservationId?: string
  ) => Accommodation[];

  // Mutations
  createReservation: (data: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>) => {
    success: boolean;
    error?: string;
    reservation?: Reservation;
  };
  updateReservation: (
    id: string,
    data: Partial<Reservation>
  ) => { success: boolean; error?: string };
  cancelReservation: (id: string) => void;
  deleteReservation: (id: string) => void;

  createAccommodation: (data: Omit<Accommodation, 'id' | 'created_at'>) => Accommodation;
  batchCreateAccommodations: (baseName: string, tipo: string, count: number) => void;
  updateAccommodation: (id: string, data: Partial<Accommodation>) => void;
  deleteAccommodation: (id: string) => { success: boolean; error?: string };

  updateSettings: (data: Partial<InnSettings>) => void;
  exportData: () => void;
  importData: (jsonData: string) => { success: boolean; error?: string };
  resetData: () => void;

  // Notifications
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const PmsContext = createContext<PmsContextType | undefined>(undefined);

export const PmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>(() => getStoredAccommodations());
  const [reservations, setReservations] = useState<Reservation[]>(() => getStoredReservations());
  const [settings, setSettings] = useState<InnSettings>(() => getStoredSettings());
  const [databaseReady, setDatabaseReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mapa' | 'reservas' | 'acomodacoes' | 'configuracoes'>('mapa');

  const [modalReservation, setModalReservation] = useState<ModalReservationState>({
    isOpen: false,
    mode: 'create',
  });

  const [selectedReservationDetails, setSelectedReservationDetails] = useState<Reservation | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Load the single shared state. Existing local data seeds the database only
  // when the shared row does not exist yet.
  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from('shared_pms_state')
        .select('accommodations,reservations,settings')
        .eq('id', 1)
        .maybeSingle();
      if (!active) return;
      if (error) {
        showToast(`Erro ao carregar o banco: ${error.message}`, 'error');
        return;
      }
      if (data) {
        setAccommodations(data.accommodations as Accommodation[]);
        setReservations(data.reservations as Reservation[]);
        setSettings({ ...DEFAULT_SETTINGS, ...(data.settings as InnSettings) });
      } else {
        const { error: seedError } = await supabase.from('shared_pms_state').insert({
          id: 1,
          accommodations,
          reservations,
          settings,
        });
        if (seedError) {
          showToast(`Erro ao iniciar o banco: ${seedError.message}`, 'error');
          return;
        }
      }
      setDatabaseReady(true);
    };
    load();
    return () => { active = false; };
  }, []);

  // Keep a local backup and synchronize the complete state after each change.
  useEffect(() => {
    saveAccommodations(accommodations);
  }, [accommodations]);

  useEffect(() => {
    saveReservations(reservations);
  }, [reservations]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!databaseReady) return;
    const timer = window.setTimeout(async () => {
      const { error } = await supabase.from('shared_pms_state').upsert({
        id: 1,
        accommodations,
        reservations,
        settings,
        updated_at: new Date().toISOString(),
      });
      if (error) showToast(`Erro ao salvar no banco: ${error.message}`, 'error');
    }, 400);
    return () => window.clearTimeout(timer);
  }, [accommodations, reservations, settings, databaseReady, showToast]);

  // Keep selectedReservationDetails fresh if updated
  useEffect(() => {
    if (selectedReservationDetails) {
      const fresh = reservations.find((r) => r.id === selectedReservationDetails.id);
      if (fresh) {
        setSelectedReservationDetails(fresh);
      } else {
        setSelectedReservationDetails(null);
      }
    }
  }, [reservations]);

  // Automatically mark reservations as Finalizada when their stay date/checkout has passed
  useEffect(() => {
    setReservations((prev) => {
      let changed = false;
      const updated = prev.map((r) => {
        if (r.status === 'Cancelada' || r.status === 'Finalizada') {
          return r;
        }
        if (isReservationPast(r.check_out, settings.default_checkout_time)) {
          changed = true;
          return {
            ...r,
            status: 'Finalizada' as const,
            updated_at: new Date().toISOString(),
          };
        }
        return r;
      });

      return changed ? updated : prev;
    });
  }, [settings.default_checkout_time]);

  // Conflict Checking
  const checkAccommodationConflict = useCallback(
    (
      accommodationId: string,
      checkIn: string,
      checkOut: string,
      excludeReservationId?: string
    ): ConflictCheckResult => {
      if (!accommodationId || !checkIn || !checkOut) {
        return { hasConflict: false };
      }

      // Find overlapping non-cancelled reservations for this accommodation
      const conflicting = reservations.find((res) => {
        if (res.accommodation_id !== accommodationId) return false;
        if (res.status === 'Cancelada') return false;
        if (excludeReservationId && res.id === excludeReservationId) return false;

        return isDateRangeOverlapping(checkIn, checkOut, res.check_in, res.check_out);
      });

      return {
        hasConflict: !!conflicting,
        conflictingReservation: conflicting,
      };
    },
    [reservations]
  );

  // Filter available accommodations for a given period
  const getAvailableAccommodations = useCallback(
    (checkIn: string, checkOut: string, excludeReservationId?: string): Accommodation[] => {
      const activeUnits = accommodations.filter((a) => a.ativo);
      if (!checkIn || !checkOut || checkIn >= checkOut) {
        return activeUnits;
      }

      return activeUnits.filter((unit) => {
        const { hasConflict } = checkAccommodationConflict(unit.id, checkIn, checkOut, excludeReservationId);
        return !hasConflict;
      });
    },
    [accommodations, checkAccommodationConflict]
  );

  // Auto-compute status based on dates if not Cancelada
  const resolveStatus = (checkIn: string, checkOut: string, currentStatus?: ReservationStatus): ReservationStatus => {
    if (currentStatus === 'Cancelada') return 'Cancelada';
    const today = getTodaySaoPaulo();
    if (today < checkIn) return 'Reservada';
    if (today >= checkIn && today < checkOut) return 'Hospedado';
    return 'Finalizada';
  };

  // Create Reservation
  const createReservation = useCallback(
    (data: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>) => {
      if (!data.guest_name || !data.guest_name.trim()) {
        return { success: false, error: 'O nome do hóspede é obrigatório.' };
      }
      if (!data.check_in || !data.check_out) {
        return { success: false, error: 'As datas de check-in e check-out são obrigatórias.' };
      }
      if (data.check_out <= data.check_in) {
        return { success: false, error: 'A data de check-out deve ser posterior ao check-in.' };
      }
      if (!data.accommodation_id) {
        return { success: false, error: 'Selecione uma acomodação.' };
      }
      if (data.total_value <= 0) {
        return { success: false, error: 'O valor total deve ser maior que zero.' };
      }

      // Check conflict
      const { hasConflict } = checkAccommodationConflict(data.accommodation_id, data.check_in, data.check_out);
      if (hasConflict) {
        return {
          success: false,
          error: 'Esta acomodação já possui uma reserva neste período.',
        };
      }

      const now = new Date().toISOString();
      let status = data.status || resolveStatus(data.check_in, data.check_out);
      if (status !== 'Cancelada' && isReservationPast(data.check_out, settings.default_checkout_time)) {
        status = 'Finalizada';
      }

      const newReservation: Reservation = {
        ...data,
        id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        status,
        created_at: now,
        updated_at: now,
      };

      setReservations((prev) => [newReservation, ...prev]);
      showToast(`Reserva para ${newReservation.guest_name} criada com sucesso!`);
      return { success: true, reservation: newReservation };
    },
    [checkAccommodationConflict, showToast, settings.default_checkout_time]
  );

  // Update Reservation
  const updateReservation = useCallback(
    (id: string, data: Partial<Reservation>) => {
      const existing = reservations.find((r) => r.id === id);
      if (!existing) {
        return { success: false, error: 'Reserva não encontrada.' };
      }

      const targetCheckIn = data.check_in ?? existing.check_in;
      const targetCheckOut = data.check_out ?? existing.check_out;
      const targetAccId = data.accommodation_id ?? existing.accommodation_id;
      let targetStatus = data.status ?? existing.status;
      if (targetStatus !== 'Cancelada' && isReservationPast(targetCheckOut, settings.default_checkout_time)) {
        targetStatus = 'Finalizada';
      }

      if (targetCheckOut <= targetCheckIn) {
        return { success: false, error: 'A data de check-out deve ser posterior ao check-in.' };
      }

      if (data.total_value !== undefined && data.total_value <= 0) {
        return { success: false, error: 'O valor total deve ser maior que zero.' };
      }

      // Check conflict only if dates or accommodation changed and not cancelled
      if (targetStatus !== 'Cancelada') {
        const { hasConflict } = checkAccommodationConflict(targetAccId, targetCheckIn, targetCheckOut, id);
        if (hasConflict) {
          return {
            success: false,
            error: 'Esta acomodação já possui uma reserva neste período.',
          };
        }
      }

      const now = new Date().toISOString();
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                ...data,
                status: targetStatus,
                updated_at: now,
              }
            : r
        )
      );

      showToast('Reserva atualizada com sucesso!');
      return { success: true };
    },
    [reservations, checkAccommodationConflict, showToast, settings.default_checkout_time]
  );

  // Cancel Reservation
  const cancelReservation = useCallback(
    (id: string) => {
      const res = reservations.find((r) => r.id === id);
      if (!res) return;

      const now = new Date().toISOString();
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'Cancelada',
                updated_at: now,
              }
            : r
        )
      );
      showToast(`Reserva de ${res.guest_name} cancelada.`, 'info');
    },
    [reservations, showToast]
  );

  // Delete Reservation
  const deleteReservation = useCallback(
    (id: string) => {
      setReservations((prev) => prev.filter((r) => r.id !== id));
      if (selectedReservationDetails?.id === id) {
        setSelectedReservationDetails(null);
      }
      showToast('Reserva excluída permanentemente.', 'info');
    },
    [selectedReservationDetails, showToast]
  );

  // Accommodations CRUD
  const createAccommodation = useCallback(
    (data: Omit<Accommodation, 'id' | 'created_at'>): Accommodation => {
      const newAcc: Accommodation = {
        ...data,
        id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        created_at: new Date().toISOString(),
      };
      setAccommodations((prev) => [...prev, newAcc]);
      showToast(`Acomodação "${newAcc.nome}" adicionada.`);
      return newAcc;
    },
    [showToast]
  );

  const batchCreateAccommodations = useCallback(
    (baseName: string, tipo: string, count: number) => {
      const newUnits: Accommodation[] = [];
      const timestamp = Date.now();
      for (let i = 1; i <= count; i++) {
        const numStr = i < 10 ? `0${i}` : `${i}`;
        newUnits.push({
          id: `acc_${timestamp}_${i}`,
          nome: `${baseName} ${numStr}`,
          tipo: tipo || baseName,
          ativo: true,
          created_at: new Date().toISOString(),
        });
      }
      setAccommodations((prev) => [...prev, ...newUnits]);
      showToast(`${count} unidades de "${baseName}" criadas com sucesso!`);
    },
    [showToast]
  );

  const updateAccommodation = useCallback(
    (id: string, data: Partial<Accommodation>) => {
      setAccommodations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...data } : a))
      );
      showToast('Acomodação atualizada com sucesso.');
    },
    [showToast]
  );

  const deleteAccommodation = useCallback(
    (id: string) => {
      // Check if there are active (non-cancelled) reservations for this accommodation
      const hasActiveReservations = reservations.some(
        (r) => r.accommodation_id === id && r.status !== 'Cancelada'
      );

      if (hasActiveReservations) {
        return {
          success: false,
          error: 'Esta acomodação possui reservas ativas vinculadas. Cancele ou remaneje as reservas antes de excluir.',
        };
      }

      setAccommodations((prev) => prev.filter((a) => a.id !== id));
      showToast('Acomodação removida com sucesso.', 'info');
      return { success: true };
    },
    [reservations, showToast]
  );

  // Settings
  const updateSettings = useCallback(
    (data: Partial<InnSettings>) => {
      setSettings((prev) => ({ ...prev, ...data }));
      showToast('Configurações salvas.');
    },
    [showToast]
  );

  // Backup & Restore
  const exportData = useCallback(() => {
    const backup = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      accommodations,
      reservations,
      settings,
    };
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_pousada_paraiso_${getTodaySaoPaulo()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado com sucesso!');
  }, [accommodations, reservations, settings, showToast]);

  const importData = useCallback(
    (jsonData: string) => {
      try {
        const parsed = JSON.parse(jsonData);
        if (!parsed.accommodations || !Array.isArray(parsed.accommodations)) {
          return { success: false, error: 'Arquivo inválido: lista de acomodações ausente.' };
        }
        if (!parsed.reservations || !Array.isArray(parsed.reservations)) {
          return { success: false, error: 'Arquivo inválido: lista de reservas ausente.' };
        }

        setAccommodations(parsed.accommodations);
        setReservations(parsed.reservations);
        if (parsed.settings) {
          setSettings(parsed.settings);
        }
        showToast('Dados restaurados com sucesso!');
        return { success: true };
      } catch (e) {
        return { success: false, error: 'Erro ao processar o arquivo JSON. Verifique o formato.' };
      }
    },
    [showToast]
  );

  const resetData = useCallback(() => {
    const res = resetAllDataToDefault();
    setAccommodations(res.accommodations);
    setReservations(res.reservations);
    setSettings(res.settings);
    showToast('Dados restaurados para o padrão inicial.', 'info');
  }, [showToast]);

  // Modal handlers
  const openNewReservationModal = useCallback((prefill?: Partial<Reservation>) => {
    setModalReservation({
      isOpen: true,
      mode: 'create',
      initialData: prefill,
    });
  }, []);

  const openEditReservationModal = useCallback((reservation: Reservation) => {
    setModalReservation({
      isOpen: true,
      mode: 'edit',
      initialData: reservation,
    });
  }, []);

  const closeReservationModal = useCallback(() => {
    setModalReservation({
      isOpen: false,
      mode: 'create',
    });
  }, []);

  const openReservationDetails = useCallback((reservation: Reservation) => {
    setSelectedReservationDetails(reservation);
  }, []);

  const closeReservationDetails = useCallback(() => {
    setSelectedReservationDetails(null);
  }, []);

  const value = useMemo(
    () => ({
      accommodations,
      reservations,
      settings,
      activeTab,
      setActiveTab,
      modalReservation,
      openNewReservationModal,
      openEditReservationModal,
      closeReservationModal,
      selectedReservationDetails,
      openReservationDetails,
      closeReservationDetails,
      checkAccommodationConflict,
      getAvailableAccommodations,
      createReservation,
      updateReservation,
      cancelReservation,
      deleteReservation,
      createAccommodation,
      batchCreateAccommodations,
      updateAccommodation,
      deleteAccommodation,
      updateSettings,
      exportData,
      importData,
      resetData,
      toast,
      showToast,
    }),
    [
      accommodations,
      reservations,
      settings,
      activeTab,
      modalReservation,
      openNewReservationModal,
      openEditReservationModal,
      closeReservationModal,
      selectedReservationDetails,
      openReservationDetails,
      closeReservationDetails,
      checkAccommodationConflict,
      getAvailableAccommodations,
      createReservation,
      updateReservation,
      cancelReservation,
      deleteReservation,
      createAccommodation,
      batchCreateAccommodations,
      updateAccommodation,
      deleteAccommodation,
      updateSettings,
      exportData,
      importData,
      resetData,
      toast,
      showToast,
    ]
  );

  return <PmsContext.Provider value={value}>{children}</PmsContext.Provider>;
};

export function usePms() {
  const context = useContext(PmsContext);
  if (!context) {
    throw new Error('usePms must be used within a PmsProvider');
  }
  return context;
}
