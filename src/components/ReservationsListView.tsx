import React, { useState, useMemo } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { usePms } from '../context/PmsContext';
import { formatDateBR, calculateDailyCount, getTodaySaoPaulo, addDays } from '../lib/dateUtils';
import { formatCurrencyBRL } from '../lib/currencyUtils';
import { ReservationStatus } from '../types';
import { getOutstandingAmount } from '../lib/paymentUtils';

export const ReservationsListView: React.FC = () => {
  const {
    reservations,
    accommodations,
    openNewReservationModal,
    openReservationDetails,
  } = usePms();

  const today = getTodaySaoPaulo();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [accommodationFilter, setAccommodationFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [customCheckIn, setCustomCheckIn] = useState('');
  const [customCheckOut, setCustomCheckOut] = useState('');
  const [sortBy, setSortBy] = useState<'check_in_desc' | 'check_in_asc' | 'guest_name' | 'total_value'>('check_in_desc');

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      // 1. Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = r.guest_name.toLowerCase().includes(query);
        const matchPhone = r.phone?.toLowerCase().includes(query);
        const matchDoc = r.document?.toLowerCase().includes(query);
        const matchPlate = r.vehicle_plate?.toLowerCase().includes(query);
        if (!matchName && !matchPhone && !matchDoc && !matchPlate) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== 'all') {
        if (r.status !== statusFilter) return false;
      }

      // 3. Accommodation filter
      if (accommodationFilter !== 'all') {
        if (r.accommodation_id !== accommodationFilter) return false;
      }

      // 4. Period filter
      if (periodFilter === 'today') {
        const isTodayIn = r.check_in === today;
        const isTodayOut = r.check_out === today;
        const isStaying = r.check_in <= today && r.check_out >= today;
        if (!isTodayIn && !isTodayOut && !isStaying) return false;
      } else if (periodFilter === 'next7') {
        const next7 = addDays(today, 7);
        if (r.check_in < today || r.check_in > next7) return false;
      } else if (periodFilter === 'current_month') {
        const currentYearMonth = today.substring(0, 7);
        if (!r.check_in.startsWith(currentYearMonth) && !r.check_out.startsWith(currentYearMonth)) {
          return false;
        }
      } else if (periodFilter === 'custom') {
        if (customCheckIn && r.check_in < customCheckIn) return false;
        if (customCheckOut && r.check_out > customCheckOut) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'check_in_asc') {
        return a.check_in.localeCompare(b.check_in);
      }
      if (sortBy === 'check_in_desc') {
        return b.check_in.localeCompare(a.check_in);
      }
      if (sortBy === 'guest_name') {
        return a.guest_name.localeCompare(b.guest_name);
      }
      if (sortBy === 'total_value') {
        return b.total_value - a.total_value;
      }
      return 0;
    });
  }, [
    reservations,
    searchTerm,
    statusFilter,
    accommodationFilter,
    periodFilter,
    customCheckIn,
    customCheckOut,
    sortBy,
    today,
  ]);

  const getAccName = (id: string) => {
    const acc = accommodations.find((a) => a.id === id);
    return acc ? acc.nome : 'Chalé';
  };

  const getStatusStyle = (status: ReservationStatus) => {
    switch (status) {
      case 'Reservada':
        return { pill: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' };
      case 'Hospedado':
        return { pill: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' };
      case 'Cancelada':
        return { pill: 'bg-red-50 text-red-700', dot: 'bg-red-500' };
      default:
        return { pill: 'bg-stone-100 text-stone-600', dot: 'bg-stone-400' };
    }
  };

  const StatusPill: React.FC<{ status: ReservationStatus }> = ({ status }) => {
    const style = getStatusStyle(status);
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.pill}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        {status}
      </span>
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAccommodationFilter('all');
    setPeriodFilter('all');
    setCustomCheckIn('');
    setCustomCheckOut('');
  };

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== 'all' ||
    accommodationFilter !== 'all' ||
    periodFilter !== 'all';

  const selectCls =
    'w-full rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-amber-300/40 cursor-pointer';

  const STATUS_CHIPS: { value: string; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'Reservada', label: 'Reservadas' },
    { value: 'Hospedado', label: 'Hospedados' },
    { value: 'Finalizada', label: 'Finalizadas' },
    { value: 'Cancelada', label: 'Canceladas' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl font-normal leading-none text-emerald-900 sm:text-5xl">Reservas</h1>
          <p className="mt-2 text-sm text-stone-600">
            {hasActiveFilters
              ? `${filteredReservations.length} de ${reservations.length} reservas`
              : `${reservations.length} ${reservations.length === 1 ? 'reserva cadastrada' : 'reservas cadastradas'}`}
          </p>
        </div>
        <button
          onClick={() => openNewReservationModal()}
          className="rounded-full bg-emerald-900 px-5 py-3 text-sm font-bold text-amber-300 transition hover:bg-emerald-700 active:scale-[0.98]"
        >
          Nova reserva
        </button>
      </div>

      {/* Busca e filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, telefone, documento ou placa"
            aria-label="Buscar reservas"
            className="w-full rounded-full border border-stone-300 bg-white py-3 pl-11 pr-11 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-4 focus:ring-amber-300/40"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-stone-500 hover:bg-stone-100"
              title="Limpar busca"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div role="radiogroup" aria-label="Situação" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {STATUS_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              role="radio"
              aria-checked={statusFilter === chip.value}
              onClick={() => setStatusFilter(chip.value)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                statusFilter === chip.value
                  ? 'border-emerald-900 bg-emerald-900 text-amber-300'
                  : 'border-stone-300 bg-white text-stone-700 hover:border-emerald-500'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select aria-label="Chalé" value={accommodationFilter} onChange={(e) => setAccommodationFilter(e.target.value)} className={selectCls}>
            <option value="all">Todos os chalés</option>
            {accommodations.map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.nome}</option>
            ))}
          </select>
          <select aria-label="Período" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className={selectCls}>
            <option value="all">Todo o histórico</option>
            <option value="today">Hoje</option>
            <option value="next7">Próximos 7 dias</option>
            <option value="current_month">Este mês</option>
            <option value="custom">Escolher datas</option>
          </select>
          <select aria-label="Ordenar" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className={selectCls}>
            <option value="check_in_desc">Entrada: mais recentes</option>
            <option value="check_in_asc">Entrada: mais antigas</option>
            <option value="guest_name">Nome (A a Z)</option>
            <option value="total_value">Maior valor</option>
          </select>
        </div>

        {periodFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 text-sm ring-1 ring-stone-200">
            <label className="flex items-center gap-2 font-semibold text-stone-600">
              De
              <input type="date" value={customCheckIn} onChange={(e) => setCustomCheckIn(e.target.value)} className="rounded-full border border-stone-300 px-3 py-2 font-medium text-stone-800" />
            </label>
            <label className="flex items-center gap-2 font-semibold text-stone-600">
              Até
              <input type="date" value={customCheckOut} onChange={(e) => setCustomCheckOut(e.target.value)} className="rounded-full border border-stone-300 px-3 py-2 font-medium text-stone-800" />
            </label>
          </div>
        )}

        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-900">
            Limpar busca e filtros
          </button>
        )}
      </div>

      {/* Tabela (desktop) */}
      <div className="hidden overflow-hidden rounded-3xl border border-stone-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-800">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-stone-500">
                <th className="px-5 py-3.5">Hóspede</th>
                <th className="px-4 py-3.5">Chalé</th>
                <th className="px-4 py-3.5">Estadia</th>
                <th className="px-4 py-3.5">Canal</th>
                <th className="px-4 py-3.5 text-right">Total</th>
                <th className="px-4 py-3.5 text-right">Falta receber</th>
                <th className="px-4 py-3.5">Situação</th>
                <th className="w-8 px-3 py-3.5"><span className="sr-only">Abrir</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-stone-500">
                    {hasActiveFilters ? 'Nenhuma reserva com esses filtros.' : 'Nenhuma reserva cadastrada ainda.'}
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res) => {
                  const dailyCount = calculateDailyCount(res.check_in, res.check_out);
                  const outstanding = getOutstandingAmount(res);
                  return (
                    <tr
                      key={res.id}
                      onClick={() => openReservationDetails(res)}
                      className="group cursor-pointer transition hover:bg-stone-50"
                    >
                      <td className="px-5 py-4">
                        <div className="max-w-[220px] truncate font-display text-[15px] font-bold text-emerald-900">{res.guest_name}</div>
                        {res.phone && <div className="text-xs text-stone-500">{res.phone}</div>}
                      </td>
                      <td className="px-4 py-4 font-medium">{getAccName(res.accommodation_id)}</td>
                      <td className="whitespace-nowrap px-4 py-4 tabular-nums">
                        <div className="font-semibold">{formatDateBR(res.check_in)} a {formatDateBR(res.check_out)}</div>
                        <div className="text-xs text-stone-500">{dailyCount} {dailyCount === 1 ? 'diária' : 'diárias'}</div>
                      </td>
                      <td className="px-4 py-4 text-stone-600">{res.sales_channel || '—'}</td>
                      <td className="px-4 py-4 text-right font-display font-bold tabular-nums text-emerald-900">{formatCurrencyBRL(res.total_value)}</td>
                      <td className={`px-4 py-4 text-right font-semibold tabular-nums ${outstanding > 0 ? 'text-amber-700' : 'text-stone-400'}`}>
                        {outstanding > 0 ? formatCurrencyBRL(outstanding) : 'Quitado'}
                      </td>
                      <td className="px-4 py-4"><StatusPill status={res.status} /></td>
                      <td className="px-3 py-4 text-stone-300 transition group-hover:text-emerald-700"><ChevronRight className="h-4 w-4" /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cartões (celular) */}
      <div className="space-y-3 md:hidden">
        {filteredReservations.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center text-stone-500">
            {hasActiveFilters ? 'Nenhuma reserva com esses filtros.' : 'Nenhuma reserva cadastrada ainda.'}
          </div>
        ) : (
          filteredReservations.map((res) => {
            const dailyCount = calculateDailyCount(res.check_in, res.check_out);
            const outstanding = getOutstandingAmount(res);
            return (
              <button
                key={res.id}
                type="button"
                onClick={() => openReservationDetails(res)}
                className="block w-full rounded-3xl border border-stone-200 bg-white p-4 text-left transition active:bg-stone-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-bold text-emerald-900">{res.guest_name}</h3>
                    <p className="mt-0.5 text-sm text-stone-600">{getAccName(res.accommodation_id)}</p>
                  </div>
                  <StatusPill status={res.status} />
                </div>
                <div className="mt-3 flex items-end justify-between gap-3 border-t border-stone-100 pt-3">
                  <div className="text-sm tabular-nums">
                    <div className="font-semibold text-stone-800">{formatDateBR(res.check_in)} a {formatDateBR(res.check_out)}</div>
                    <div className="text-xs text-stone-500">{dailyCount} {dailyCount === 1 ? 'diária' : 'diárias'} · {res.sales_channel || 'canal não informado'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-bold tabular-nums text-emerald-900">{formatCurrencyBRL(res.total_value)}</div>
                    <div className={`text-xs font-semibold tabular-nums ${outstanding > 0 ? 'text-amber-700' : 'text-stone-400'}`}>
                      {outstanding > 0 ? `Falta ${formatCurrencyBRL(outstanding)}` : 'Quitado'}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
