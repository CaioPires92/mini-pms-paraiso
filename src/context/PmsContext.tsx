import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Accommodation, InnSettings, Reservation, ReservationStatus } from '../types';
import { isDateRangeOverlapping, isReservationPast, getTodaySaoPaulo } from '../lib/dateUtils';
import { supabase } from '../lib/supabase';

type Result = { success: boolean; error?: string };
type Tab = 'dashboard' | 'mapa' | 'reservas' | 'acomodacoes' | 'configuracoes';
interface ModalReservationState { isOpen: boolean; mode: 'create' | 'edit'; initialData?: Partial<Reservation>; }
interface PmsContextType {
  accommodations: Accommodation[]; reservations: Reservation[]; settings: InnSettings; loading: boolean;
  activeTab: Tab; setActiveTab: (tab: Tab) => void; modalReservation: ModalReservationState;
  openNewReservationModal: (prefill?: Partial<Reservation>) => void; openEditReservationModal: (reservation: Reservation) => void; closeReservationModal: () => void;
  selectedReservationDetails: Reservation | null; openReservationDetails: (reservation: Reservation) => void; closeReservationDetails: () => void;
  checkAccommodationConflict: (accommodationId: string, checkIn: string, checkOut: string, excludeReservationId?: string) => { hasConflict: boolean; conflictingReservation?: Reservation };
  getAvailableAccommodations: (checkIn: string, checkOut: string, excludeReservationId?: string) => Accommodation[];
  createReservation: (data: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>) => Promise<Result>;
  updateReservation: (id: string, data: Partial<Reservation>) => Promise<Result>;
  cancelReservation: (id: string) => Promise<void>; deleteReservation: (id: string) => Promise<void>;
  createAccommodation: (data: Omit<Accommodation, 'id' | 'created_at'>) => Promise<Result>;
  batchCreateAccommodations: (baseName: string, tipo: string, count: number) => Promise<Result>;
  updateAccommodation: (id: string, data: Partial<Accommodation>) => Promise<void>;
  moveAccommodation: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => Promise<void>;
  reorderAccommodation: (draggedId: string, targetId: string) => Promise<void>;
  deleteAccommodation: (id: string) => Promise<Result>;
  updateSettings: (data: Partial<InnSettings>) => Promise<void>; exportData: () => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null; showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const DEFAULT_SETTINGS: InnSettings = { inn_name: 'Minha Pousada', phone: '', whatsapp: '', address: '', default_checkin_time: '14:00', default_checkout_time: '12:00' };
const PmsContext = createContext<PmsContextType | undefined>(undefined);
const messageFrom = (error: { message?: string } | null) => error?.message || 'Não foi possível salvar. Tente novamente.';

export const PmsProvider: React.FC<{ children: React.ReactNode; user: User }> = ({ children, user }) => {
  const [innId, setInnId] = useState<string>();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<InnSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('mapa');
  const [modalReservation, setModalReservation] = useState<ModalReservationState>({ isOpen: false, mode: 'create' });
  const [selectedReservationDetails, setSelectedReservationDetails] = useState<Reservation | null>(null);
  const [toast, setToast] = useState<PmsContextType['toast']>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => { setToast({ message, type }); window.setTimeout(() => setToast(null), 4000); }, []);

  const refresh = useCallback(async (targetInnId: string) => {
    const [settingsResult, accommodationsResult, reservationsResult] = await Promise.all([
      supabase.from('inn_settings').select('*').eq('inn_id', targetInnId).single(),
      supabase.from('pms_accommodations').select('*').eq('inn_id', targetInnId).order('sort_order').order('created_at'),
      supabase.from('pms_reservations').select('*').eq('inn_id', targetInnId).order('check_in', { ascending: false }),
    ]);
    if (settingsResult.error || accommodationsResult.error || reservationsResult.error) throw new Error(messageFrom(settingsResult.error || accommodationsResult.error || reservationsResult.error));
    setSettings(settingsResult.data as InnSettings);
    setAccommodations(accommodationsResult.data as Accommodation[]);
    setReservations(reservationsResult.data as Reservation[]);
  }, []);

  useEffect(() => {
    let alive = true;
    const boot = async () => {
      setLoading(true);
      const { data: memberships, error: membershipError } = await supabase.from('inn_members').select('inn_id').eq('user_id', user.id).limit(1);
      if (membershipError) { if (alive) showToast(messageFrom(membershipError), 'error'); return; }
      let nextInnId = memberships?.[0]?.inn_id;
      if (!nextInnId) {
        const { data, error } = await supabase.from('inns').insert({ owner_id: user.id, name: 'Minha Pousada' }).select('id').single();
        if (error || !data) { if (alive) showToast(messageFrom(error), 'error'); return; }
        nextInnId = data.id;
      }
      try { await refresh(nextInnId); if (alive) setInnId(nextInnId); }
      catch (error) { if (alive) showToast(error instanceof Error ? error.message : 'Erro ao carregar dados.', 'error'); }
      finally { if (alive) setLoading(false); }
    };
    void boot();
    return () => { alive = false; };
  }, [refresh, showToast, user.id]);

  useEffect(() => {
    if (!innId) return;
    const channel = supabase.channel(`pms-${innId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inn_settings', filter: `inn_id=eq.${innId}` }, () => void refresh(innId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pms_accommodations', filter: `inn_id=eq.${innId}` }, () => void refresh(innId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pms_reservations', filter: `inn_id=eq.${innId}` }, () => void refresh(innId))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [innId, refresh]);

  const checkAccommodationConflict = useCallback((accommodationId: string, checkIn: string, checkOut: string, excludeReservationId?: string) => {
    const conflictingReservation = reservations.find((res) => res.accommodation_id === accommodationId && res.status !== 'Cancelada' && res.id !== excludeReservationId && isDateRangeOverlapping(checkIn, checkOut, res.check_in, res.check_out));
    return { hasConflict: Boolean(conflictingReservation), conflictingReservation };
  }, [reservations]);
  const getAvailableAccommodations = useCallback((checkIn: string, checkOut: string, excludeReservationId?: string) => accommodations.filter((unit) => unit.ativo && (!checkIn || !checkOut || checkIn >= checkOut || !checkAccommodationConflict(unit.id, checkIn, checkOut, excludeReservationId).hasConflict)), [accommodations, checkAccommodationConflict]);
  const resolveStatus = (checkIn: string, checkOut: string, current?: ReservationStatus): ReservationStatus => current === 'Cancelada' ? 'Cancelada' : getTodaySaoPaulo() < checkIn ? 'Reservada' : getTodaySaoPaulo() < checkOut ? 'Hospedado' : 'Finalizada';

  const createReservation = useCallback(async (data: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>): Promise<Result> => {
    if (!innId) return { success: false, error: 'Pousada não carregada.' };
    if (checkAccommodationConflict(data.accommodation_id, data.check_in, data.check_out).hasConflict) return { success: false, error: 'Esta acomodação já possui uma reserva neste período.' };
    const status = isReservationPast(data.check_out, settings.default_checkout_time) ? 'Finalizada' : resolveStatus(data.check_in, data.check_out, data.status);
    const { error } = await supabase.from('pms_reservations').insert({ ...data, inn_id: innId, status });
    if (error) return { success: false, error: messageFrom(error) };
    await refresh(innId); showToast('Reserva criada com sucesso.'); return { success: true };
  }, [checkAccommodationConflict, innId, refresh, settings.default_checkout_time, showToast]);

  const updateReservation = useCallback(async (id: string, data: Partial<Reservation>): Promise<Result> => {
    if (!innId) return { success: false, error: 'Pousada não carregada.' };
    const existing = reservations.find((item) => item.id === id); if (!existing) return { success: false, error: 'Reserva não encontrada ou foi alterada em outro aparelho.' };
    const next = { ...existing, ...data }; if (checkAccommodationConflict(next.accommodation_id, next.check_in, next.check_out, id).hasConflict && next.status !== 'Cancelada') return { success: false, error: 'Esta acomodação já possui uma reserva neste período.' };
    const { data: updated, error } = await supabase.from('pms_reservations').update({ ...data, status: isReservationPast(next.check_out, settings.default_checkout_time) ? 'Finalizada' : resolveStatus(next.check_in, next.check_out, next.status) }).eq('id', id).eq('inn_id', innId).eq('row_version', (existing as Reservation & { row_version?: number }).row_version ?? 1).select('id');
    if (error) return { success: false, error: messageFrom(error) }; if (!updated?.length) return { success: false, error: 'A reserva foi alterada em outro aparelho. Atualize a tela e tente novamente.' };
    await refresh(innId); showToast('Reserva atualizada.'); return { success: true };
  }, [checkAccommodationConflict, innId, refresh, reservations, settings.default_checkout_time, showToast]);
  const cancelReservation = useCallback(async (id: string) => { await updateReservation(id, { status: 'Cancelada' }); }, [updateReservation]);
  const deleteReservation = useCallback(async (id: string) => { if (!innId) return; const { error } = await supabase.from('pms_reservations').delete().eq('id', id).eq('inn_id', innId); if (error) showToast(messageFrom(error), 'error'); else { await refresh(innId); showToast('Reserva excluída.'); } }, [innId, refresh, showToast]);

  const createAccommodation = useCallback(async (data: Omit<Accommodation, 'id' | 'created_at'>): Promise<Result> => { if (!innId) return { success: false, error: 'Pousada não carregada.' }; const { error } = await supabase.from('pms_accommodations').insert({ ...data, inn_id: innId, sort_order: accommodations.length }); if (error) return { success: false, error: messageFrom(error) }; await refresh(innId); showToast('Acomodação criada.'); return { success: true }; }, [accommodations.length, innId, refresh, showToast]);
  const batchCreateAccommodations = useCallback(async (baseName: string, tipo: string, count: number): Promise<Result> => { if (!innId) return { success: false, error: 'Pousada não carregada.' }; const rows = Array.from({ length: count }, (_, index) => ({ inn_id: innId, nome: `${baseName} ${String(index + 1).padStart(2, '0')}`, tipo: tipo || baseName, ativo: true, sort_order: accommodations.length + index })); const { error } = await supabase.from('pms_accommodations').insert(rows); if (error) return { success: false, error: messageFrom(error) }; await refresh(innId); showToast(`${count} acomodações criadas.`); return { success: true }; }, [accommodations.length, innId, refresh, showToast]);
  const updateAccommodation = useCallback(async (id: string, data: Partial<Accommodation>) => { if (!innId) return; const existing = accommodations.find((item) => item.id === id); if (!existing) return; const { data: updated, error } = await supabase.from('pms_accommodations').update(data).eq('id', id).eq('inn_id', innId).eq('row_version', (existing as Accommodation & { row_version?: number }).row_version ?? 1).select('id'); if (error || !updated?.length) showToast(error ? messageFrom(error) : 'Acomodação alterada em outro aparelho. Atualize a tela.', 'error'); else { await refresh(innId); showToast('Acomodação atualizada.'); } }, [accommodations, innId, refresh, showToast]);
  const reorderAccommodation = useCallback(async (draggedId: string, targetId: string) => {
    if (!innId || draggedId === targetId) return;
    const from = accommodations.findIndex((item) => item.id === draggedId);
    const to = accommodations.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const reordered = [...accommodations];
    const [item] = reordered.splice(from, 1);
    reordered.splice(to, 0, item);
    const results = await Promise.all(reordered.map((accommodation, index) => supabase
      .from('pms_accommodations')
      .update({ sort_order: index })
      .eq('id', accommodation.id)
      .eq('inn_id', innId)
      .eq('row_version', accommodation.row_version ?? 1)
      .select('id')));
    if (results.some(({ error, data }) => error || !data?.length)) {
      showToast('A ordem foi alterada em outro aparelho. Atualize a tela e tente novamente.', 'error');
      await refresh(innId);
      return;
    }
    await refresh(innId);
  }, [accommodations, innId, refresh, showToast]);
  const moveAccommodation = useCallback(async (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => { const from = accommodations.findIndex((item) => item.id === id); if (from < 0) return; const to = direction === 'top' ? 0 : direction === 'bottom' ? accommodations.length - 1 : direction === 'up' ? Math.max(0, from - 1) : Math.min(accommodations.length - 1, from + 1); if (to >= 0 && to !== from) await reorderAccommodation(id, accommodations[to].id); }, [accommodations, reorderAccommodation]);
  const deleteAccommodation = useCallback(async (id: string): Promise<Result> => { if (!innId) return { success: false, error: 'Pousada não carregada.' }; if (reservations.some((item) => item.accommodation_id === id && item.status !== 'Cancelada')) return { success: false, error: 'Esta acomodação possui reservas ativas.' }; const { error } = await supabase.from('pms_accommodations').delete().eq('id', id).eq('inn_id', innId); if (error) return { success: false, error: messageFrom(error) }; await refresh(innId); return { success: true }; }, [innId, refresh, reservations]);
  const updateSettings = useCallback(async (data: Partial<InnSettings>) => { if (!innId) return; const current = settings as InnSettings & { row_version?: number }; const { data: updated, error } = await supabase.from('inn_settings').update(data).eq('inn_id', innId).eq('row_version', current.row_version ?? 1).select('inn_id'); if (error || !updated?.length) showToast(error ? messageFrom(error) : 'Configurações alteradas em outro aparelho. Atualize a tela.', 'error'); else { await refresh(innId); showToast('Configurações salvas.'); } }, [innId, refresh, settings, showToast]);
  const exportData = useCallback(() => { const json = JSON.stringify({ version: '2.0', exported_at: new Date().toISOString(), accommodations, reservations, settings }, null, 2); const url = URL.createObjectURL(new Blob([json], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `backup_pousada_${getTodaySaoPaulo()}.json`; anchor.click(); URL.revokeObjectURL(url); showToast('Backup exportado.'); }, [accommodations, reservations, settings, showToast]);

  const value = useMemo(() => ({ accommodations, reservations, settings, loading, activeTab, setActiveTab, modalReservation, openNewReservationModal: (prefill?: Partial<Reservation>) => setModalReservation({ isOpen: true, mode: 'create', initialData: prefill }), openEditReservationModal: (reservation: Reservation) => setModalReservation({ isOpen: true, mode: 'edit', initialData: reservation }), closeReservationModal: () => setModalReservation({ isOpen: false, mode: 'create' }), selectedReservationDetails, openReservationDetails: setSelectedReservationDetails, closeReservationDetails: () => setSelectedReservationDetails(null), checkAccommodationConflict, getAvailableAccommodations, createReservation, updateReservation, cancelReservation, deleteReservation, createAccommodation, batchCreateAccommodations, updateAccommodation, moveAccommodation, reorderAccommodation, deleteAccommodation, updateSettings, exportData, toast, showToast }), [accommodations, reservations, settings, loading, activeTab, modalReservation, selectedReservationDetails, checkAccommodationConflict, getAvailableAccommodations, createReservation, updateReservation, cancelReservation, deleteReservation, createAccommodation, batchCreateAccommodations, updateAccommodation, moveAccommodation, reorderAccommodation, deleteAccommodation, updateSettings, exportData, toast, showToast]);
  return <PmsContext.Provider value={value}>{children}</PmsContext.Provider>;
};
export const usePms = () => { const context = useContext(PmsContext); if (!context) throw new Error('usePms must be used within PmsProvider'); return context; };
