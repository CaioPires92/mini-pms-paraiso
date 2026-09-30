import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Bed,
  Phone,
  ChevronRight,
  X,
} from 'lucide-react';
import { usePms } from '../context/PmsContext';
import { formatDateBR, calculateDailyCount, getTodaySaoPaulo, addDays } from '../lib/dateUtils';
import { formatCurrencyBRL } from '../lib/currencyUtils';
import { ReservationStatus } from '../types';

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

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'Reservada':
        return 'bg-amber-100 text-amber-950 border-amber-300';
      case 'Hospedado':
        return 'bg-emerald-100 text-emerald-950 border-emerald-300';
      case 'Finalizada':
        return 'bg-stone-100 text-stone-800 border-stone-300';
      case 'Cancelada':
        return 'bg-rose-100 text-rose-950 border-rose-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
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

  return (
    <div className="space-y-4">
      {/* Top Header & Search Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900">Lista de Reservas</h1>
            <p className="text-sm text-stone-600 mt-0.5">
              Consulte e localize qualquer reserva cadastrada na pousada
            </p>
          </div>

          <div className="text-xs font-bold text-stone-600 bg-stone-100 px-3.5 py-2 rounded-xl border border-stone-200">
            Total de <strong className="text-stone-950 font-extrabold">{reservations.length}</strong> reservas
          </div>
        </div>

        {/* Live Search Input - Big and visible */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite o nome do hóspede, telefone ou placa..."
            className="w-full px-4 py-3.5 pl-12 text-stone-900 bg-stone-50 border-2 border-stone-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-base font-medium transition"
          />
          <Search className="w-5 h-5 text-stone-500 absolute left-4 top-4" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1.5 text-stone-500 hover:text-stone-900 absolute right-4 top-3.5 cursor-pointer"
              title="Limpar busca"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-sm">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Situação</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border-2 border-stone-300 rounded-xl text-stone-900 text-sm font-semibold focus:bg-white cursor-pointer"
            >
              <option value="all">Todas</option>
              <option value="Reservada">Reservada</option>
              <option value="Hospedado">Hospedado</option>
              <option value="Finalizada">Finalizada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>

          {/* Accommodation Filter */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Chalé</label>
            <select
              value={accommodationFilter}
              onChange={(e) => setAccommodationFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border-2 border-stone-300 rounded-xl text-stone-900 text-sm font-semibold focus:bg-white truncate cursor-pointer"
            >
              <option value="all">Todos os Chalés</option>
              {accommodations.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Período</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border-2 border-stone-300 rounded-xl text-stone-900 text-sm font-semibold focus:bg-white cursor-pointer"
            >
              <option value="all">Todo o Histórico</option>
              <option value="today">Hoje</option>
              <option value="next7">Próximos 7 Dias</option>
              <option value="current_month">Este Mês</option>
              <option value="custom">Escolher Datas...</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Ordenar</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-stone-50 border-2 border-stone-300 rounded-xl text-stone-900 text-sm font-semibold focus:bg-white cursor-pointer"
            >
              <option value="check_in_desc">Data (Mais Recentes)</option>
              <option value="check_in_asc">Data (Mais Antigos)</option>
              <option value="guest_name">Nome (A a Z)</option>
              <option value="total_value">Maior Valor</option>
            </select>
          </div>
        </div>

        {/* Custom Period Dates */}
        {periodFilter === 'custom' && (
          <div className="p-4 bg-stone-50 rounded-xl border-2 border-stone-200 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-700">De:</span>
              <input
                type="date"
                value={customCheckIn}
                onChange={(e) => setCustomCheckIn(e.target.value)}
                className="px-3 py-2 bg-white border-2 border-stone-300 rounded-xl text-sm font-semibold"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-700">Até:</span>
              <input
                type="date"
                value={customCheckOut}
                onChange={(e) => setCustomCheckOut(e.target.value)}
                className="px-3 py-2 bg-white border-2 border-stone-300 rounded-xl text-sm font-semibold"
              />
            </div>
          </div>
        )}

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-sm text-stone-600 pt-1 font-medium">
          <span>
            Mostrando <strong className="text-stone-900 font-extrabold">{filteredReservations.length}</strong> reservas
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
            >
              Limpar busca e filtros
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table View - Clean and High Contrast */}
      <div className="hidden md:block bg-white rounded-2xl border-2 border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-800">
            <thead className="bg-stone-100 text-xs uppercase tracking-wider text-stone-700 border-b-2 border-stone-200 font-bold">
              <tr>
                <th className="py-3.5 px-4">Hóspede</th>
                <th className="py-3.5 px-4">Chalé</th>
                <th className="py-3.5 px-4">Entrada</th>
                <th className="py-3.5 px-4">Saída</th>
                <th className="py-3.5 px-4 text-center">Diárias</th>
                <th className="py-3.5 px-4 text-right">Valor Total</th>
                <th className="py-3.5 px-4">Canal</th>
                <th className="py-3.5 px-4 text-right">Saldo</th>
                <th className="py-3.5 px-4 text-center">Situação</th>
                <th className="py-3.5 px-4 text-right">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-stone-100">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-stone-500 text-base font-medium">
                    Nenhuma reserva encontrada com os critérios informados.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res) => {
                  const dailyCount = calculateDailyCount(res.check_in, res.check_out);

                  return (
                    <tr
                      key={res.id}
                      onClick={() => openReservationDetails(res)}
                      className="hover:bg-stone-50 transition cursor-pointer group"
                    >
                      <td className="py-4 px-4 font-bold text-stone-900 text-base">
                        <div className="truncate max-w-[200px]">{res.guest_name}</div>
                        {res.phone && (
                          <div className="text-xs text-stone-500 font-normal">{res.phone}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-semibold text-emerald-900">
                        {getAccName(res.accommodation_id)}
                      </td>
                      <td className="py-4 px-4 font-bold tabular-nums text-stone-900">
                        {formatDateBR(res.check_in)}
                      </td>
                      <td className="py-4 px-4 font-bold tabular-nums text-stone-900">
                        {formatDateBR(res.check_out)}
                      </td>
                      <td className="py-4 px-4 text-center tabular-nums font-bold text-stone-800">
                        {dailyCount}
                      </td>
                      <td className="py-4 px-4 text-right font-extrabold text-stone-900 text-base tabular-nums">
                        {formatCurrencyBRL(res.total_value)}
                      </td>
                      <td className="py-4 px-4 font-semibold text-stone-700">
                        {res.sales_channel || '—'}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-amber-800 tabular-nums">
                        {formatCurrencyBRL(Math.max(0, res.total_value - (res.deposit_amount || 0) - (res.additional_payment_amount || 0)))}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-xl text-xs font-bold border-2 ${getStatusBadge(
                            res.status
                          )}`}
                        >
                          {res.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-emerald-800 group-hover:text-emerald-950 font-bold text-sm flex items-center justify-end gap-1">
                          <span>Detalhes</span>
                          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Responsive Cards View */}
      <div className="md:hidden space-y-3">
        {filteredReservations.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border-2 border-stone-200 text-center text-stone-500 font-medium">
            Nenhuma reserva encontrada.
          </div>
        ) : (
          filteredReservations.map((res) => {
            const dailyCount = calculateDailyCount(res.check_in, res.check_out);

            return (
              <div
                key={res.id}
                onClick={() => openReservationDetails(res)}
                className="bg-white p-4.5 rounded-2xl border-2 border-stone-200 shadow-xs active:bg-stone-50 transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-base">{res.guest_name}</h3>
                    <p className="text-sm font-bold text-emerald-900 mt-0.5">
                      {getAccName(res.accommodation_id)}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold border-2 ${getStatusBadge(
                      res.status
                    )}`}
                  >
                    {res.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <div>
                    <span className="block text-xs font-bold text-stone-500">Período</span>
                    <span className="font-bold text-stone-900 tabular-nums">
                      {formatDateBR(res.check_in)} a {formatDateBR(res.check_out)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-stone-500">{dailyCount} diárias</span>
                    <span className="font-extrabold text-emerald-950 text-base tabular-nums">
                      {formatCurrencyBRL(res.total_value)}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-stone-600">Canal: {res.sales_channel || 'Não informado'}</span>
                  <span className="text-amber-800">
                    Saldo: {formatCurrencyBRL(Math.max(0, res.total_value - (res.deposit_amount || 0) - (res.additional_payment_amount || 0)))}
                  </span>
                </div>

                {res.phone && (
                  <div className="mt-2 text-xs font-medium text-stone-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{res.phone}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
