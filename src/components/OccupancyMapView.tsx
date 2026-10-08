import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Bed,
  LogIn,
  LogOut,
  Info,
  ArrowRight,
} from 'lucide-react';
import { usePms } from '../context/PmsContext';
import {
  getTodaySaoPaulo,
  generateDateRange,
  addDays,
  formatDateShortBR,
  getWeekdayShortBR,
  getDayNumber,
  getMonthShortBR,
  calculateDailyCount,
  formatDateBR,
  isToday,
  getDayOffset,
} from '../lib/dateUtils';
import { Reservation } from '../types';
import { formatCurrencyBRL } from '../lib/currencyUtils';

type ViewPeriodDays = 7 | 15 | 30;

export const OccupancyMapView: React.FC = () => {
  const {
    accommodations,
    reservations,
    openReservationDetails,
    openNewReservationModal,
  } = usePms();

  const today = getTodaySaoPaulo();

  // Current view period (default 7 days for maximum clarity and ease of use)
  const [viewDays, setViewDays] = useState<ViewPeriodDays>(7);
  // Start date of the view: starts yesterday so "today" is clearly visible in context
  const [startDate, setStartDate] = useState<string>(() => addDays(today, -1));

  // Date range array
  const dateRange = useMemo(() => {
    return generateDateRange(startDate, viewDays);
  }, [startDate, viewDays]);

  // Column width based on view period (px) - generous touch targets for easy viewing
  const colWidth = viewDays === 30 ? 76 : viewDays === 15 ? 100 : 130;

  // Navigation handlers
  const handlePrev = () => {
    const shift = viewDays === 30 ? -15 : viewDays === 15 ? -7 : -3;
    setStartDate((prev) => addDays(prev, shift));
  };

  const handleNext = () => {
    const shift = viewDays === 30 ? 15 : viewDays === 15 ? 7 : 3;
    setStartDate((prev) => addDays(prev, shift));
  };

  const handleToday = () => {
    setStartDate(addDays(today, -1));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setStartDate(e.target.value);
    }
  };

  const getReservationsForAcc = (accId: string) => {
    return reservations.filter(
      (r) => r.accommodation_id === accId && r.status !== 'Cancelada'
    );
  };

  const activeAccs = accommodations.filter((a) => a.ativo);
  const totalUnits = activeAccs.length;

  const getAvailableCountForDay = (dStr: string) => {
    const occupiedCount = reservations.filter(
      (r) =>
        r.status !== 'Cancelada' &&
        r.check_in <= dStr &&
        r.check_out > dStr
    ).length;
    return Math.max(0, totalUnits - occupiedCount);
  };

  const isAccOccupiedToday = (accId: string) => {
    return reservations.some(
      (r) =>
        r.accommodation_id === accId &&
        r.status !== 'Cancelada' &&
        r.check_in <= today &&
        r.check_out > today
    );
  };

  const totalGridWidth = dateRange.length * colWidth;

  return (
    <div className="space-y-4">
      {/* Top Controls Bar - Minimalist, large buttons easy for seniors to use */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-stone-300 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation & Date Picker */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Previous / Today / Next */}
          <div className="flex items-center bg-stone-100 rounded-2xl p-1.5 border-2 border-stone-300 shadow-2xs">
            <button
              onClick={handlePrev}
              className="px-3.5 py-2.5 text-stone-900 hover:bg-white rounded-xl transition font-extrabold text-sm flex items-center gap-1 cursor-pointer active:scale-95"
              title="Voltar período"
            >
              <ChevronLeft className="w-5 h-5 stroke-[3]" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2.5 text-sm font-black text-emerald-900 bg-white hover:bg-emerald-50 rounded-xl transition shadow-xs cursor-pointer border border-stone-300 active:scale-95"
            >
              Hoje
            </button>
            <button
              onClick={handleNext}
              className="px-3.5 py-2.5 text-stone-900 hover:bg-white rounded-xl transition font-extrabold text-sm flex items-center gap-1 cursor-pointer active:scale-95"
              title="Avançar período"
            >
              <span className="hidden sm:inline">Próximo</span>
              <ChevronRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>

          {/* Direct Date Input */}
          <div className="flex items-center gap-2 bg-stone-50 border-2 border-stone-300 rounded-2xl px-3.5 py-2 text-sm text-stone-800">
            <Calendar className="w-4 h-4 text-emerald-800 shrink-0" />
            <span className="font-bold text-xs sm:text-sm">A partir de:</span>
            <input
              type="date"
              value={startDate}
              onChange={handleDateChange}
              className="bg-transparent border-none text-sm text-stone-950 font-black focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* View Range Tabs: 7, 15, 30 days */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          <div className="flex items-center bg-stone-100 rounded-2xl p-1.5 border-2 border-stone-300 shadow-2xs w-full sm:w-auto justify-around">
            {([7, 15, 30] as ViewPeriodDays[]).map((days) => (
              <button
                key={days}
                onClick={() => setViewDays(days)}
                className={`px-4 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition cursor-pointer ${
                  viewDays === days
                    ? 'bg-white text-emerald-950 shadow-xs border-2 border-emerald-700/40'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                {days} dias
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Explanatory Legend & Quadriculado Helper */}
      <div className="bg-white px-4 sm:px-5 py-3.5 rounded-2xl border-2 border-stone-200 text-xs sm:text-sm text-stone-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-4 sm:gap-6 font-bold">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-sky-600 border border-sky-700 shadow-xs" />
            <span>Reserva</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-amber-500 border border-amber-600 shadow-xs" />
            <span>Chega hoje (Check-in)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-indigo-500 border border-indigo-600 shadow-xs" />
            <span>Sai hoje (Check-out)</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-600 font-semibold hidden md:flex">
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-stone-400 bg-stone-100 inline-block" />
            <span>Linha pontilhada: troca às 12h/14h (permite novo hóspede no mesmo dia)</span>
          </div>
        </div>

        <div className="text-xs text-stone-500 font-bold block sm:hidden">
          👉 Arraste para o lado para ver o calendário
        </div>
      </div>

      {/* Quadriculado Hospedin-Style Calendar Container */}
      <div className="bg-white rounded-3xl border-2 border-stone-300 shadow-md overflow-hidden">
        <div className="overflow-x-auto relative scrollbar-thin">
          <div className="flex flex-col min-w-max">
            {/* Header Row: Sticky Corner + Day Headers */}
            <div className="flex border-b-2 border-stone-300 bg-stone-100 select-none">
              {/* Sticky Corner Header */}
              <div className="w-[110px] sm:w-[170px] md:w-[210px] shrink-0 p-3 sm:p-4 sticky left-0 z-30 bg-stone-100 border-r-2 border-stone-300 flex items-center justify-between shadow-[3px_0_6px_rgba(0,0,0,0.06)]">
                <div>
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-900 block">
                    Chalé
                  </span>
                  <span className="text-[11px] text-stone-500 font-bold">
                    {activeAccs.length} ativos
                  </span>
                </div>
                <Bed className="w-5 h-5 text-stone-500 hidden sm:block" />
              </div>

              {/* Day Headers (With Quadriculado 12h/14h Indicator) */}
              <div className="flex shrink-0" style={{ width: `${totalGridWidth}px` }}>
                {dateRange.map((dStr) => {
                  const dayIsToday = isToday(dStr);
                  const dayNum = getDayNumber(dStr);
                  const month = getMonthShortBR(dStr);
                  const weekday = getWeekdayShortBR(dStr);
                  const freeCount = getAvailableCountForDay(dStr);

                  return (
                    <div
                      key={dStr}
                      style={{ width: `${colWidth}px` }}
                      className={`shrink-0 py-2 sm:py-3 px-1 text-center border-r-2 border-stone-300 flex flex-col justify-between transition-colors ${
                        dayIsToday ? 'bg-amber-100 font-extrabold border-amber-400' : 'bg-stone-50'
                      }`}
                    >
                      {/* Top Date Title */}
                      <div>
                        <div className="flex items-baseline justify-center gap-1">
                          <span
                            className={`text-xl sm:text-2xl font-black tracking-tight tabular-nums leading-none ${
                              dayIsToday ? 'text-amber-950' : 'text-stone-900'
                            }`}
                          >
                            {dayNum}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-extrabold text-stone-500 uppercase">
                            {month}
                          </span>
                        </div>
                        <div
                          className={`text-[11px] sm:text-xs font-black uppercase mt-0.5 ${
                            dayIsToday ? 'text-amber-900' : 'text-stone-700'
                          }`}
                        >
                          {weekday} {dayIsToday && '• HOJE'}
                        </div>
                      </div>

                      {/* Quadriculado Half-Day Guide (12h Saída | 14h Entrada) */}
                      <div className="mt-2 pt-1 border-t border-stone-200 grid grid-cols-2 text-[9px] sm:text-[10px] font-bold text-stone-600">
                        <div className="border-r border-dashed border-stone-300 pr-0.5">
                          12h <span className="hidden sm:inline">Sai</span>
                        </div>
                        <div className="pl-0.5 text-emerald-800">
                          14h <span className="hidden sm:inline">Entra</span>
                        </div>
                      </div>

                      {/* Available Count Badge */}
                      <div className="mt-1">
                        <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 bg-white rounded-md font-black text-emerald-900 border border-stone-300 tabular-nums">
                          {freeCount} {freeCount === 1 ? 'livre' : 'livres'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Accommodation Rows */}
            {accommodations
              .filter((a) => a.ativo)
              .map((acc, accIndex) => {
                const occupiedToday = isAccOccupiedToday(acc.id);
                const accReservations = getReservationsForAcc(acc.id);

                return (
                  <div
                    key={acc.id}
                    className={`flex border-b-2 border-stone-200 relative transition-colors ${
                      accIndex % 2 === 0 ? 'bg-white' : 'bg-stone-50/60'
                    } hover:bg-stone-100/70 group`}
                  >
                    {/* Sticky Accommodation Label */}
                    <div className="w-[110px] sm:w-[170px] md:w-[210px] shrink-0 p-2.5 sm:p-4 sticky left-0 z-20 bg-white group-hover:bg-stone-50 border-r-2 border-stone-300 transition-colors shadow-[3px_0_6px_rgba(0,0,0,0.06)] flex flex-col justify-center">
                      <div className="font-extrabold text-xs sm:text-base text-stone-900 leading-snug line-clamp-2">
                        {acc.nome}
                      </div>
                      <div className="text-[10px] sm:text-xs text-stone-600 truncate mt-0.5 font-medium">
                        {acc.tipo}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            occupiedToday ? 'bg-emerald-600 ring-2 ring-emerald-200' : 'bg-stone-300'
                          }`}
                        />
                        <span className="text-[10px] sm:text-xs font-bold text-stone-700 truncate">
                          {occupiedToday ? 'Ocupado' : 'Livre hoje'}
                        </span>
                      </div>
                    </div>

                    {/* Timeline Container for this Row (Quadriculado with 12h/14h split) */}
                    <div
                      className="relative flex h-20 sm:h-22 shrink-0"
                      style={{ width: `${totalGridWidth}px` }}
                    >
                      {/* Grid Background: Day Cells with Center Dashed Divider */}
                      {dateRange.map((dStr) => {
                        const dayIsToday = isToday(dStr);

                        return (
                          <div
                            key={dStr}
                            style={{ width: `${colWidth}px` }}
                            className={`shrink-0 border-r-2 border-stone-300 h-full relative cursor-pointer group/cell transition-colors ${
                              dayIsToday ? 'bg-amber-50/50' : 'hover:bg-emerald-50/50'
                            }`}
                            onClick={() =>
                              openNewReservationModal({
                                accommodation_id: acc.id,
                                check_in: dStr,
                                check_out: addDays(dStr, 1),
                              })
                            }
                            title={`Clique para reservar ${acc.nome} a partir de ${formatDateBR(dStr)}`}
                          >
                            {/* Quadriculado Center Dotted Turnover Line (12h saída / 14h entrada) */}
                            <div className="absolute top-0 bottom-0 left-1/2 border-r-2 border-dashed border-stone-300 pointer-events-none" />

                            {/* Left Half: Morning check-out area (subtle hover hint) */}
                            <div
                              className="absolute top-0 bottom-0 left-0 right-1/2 opacity-0 group-hover/cell:opacity-100 flex items-center justify-center pointer-events-none"
                              title="Manhã (Check-out até 12h)"
                            >
                              <span className="text-[9px] font-bold text-stone-500">12h</span>
                            </div>

                            {/* Right Half: Afternoon check-in area */}
                            <div
                              className="absolute top-0 bottom-0 left-1/2 right-0 opacity-0 group-hover/cell:opacity-100 flex items-center justify-center pointer-events-none"
                              title="Tarde (Check-in a partir das 14h)"
                            >
                              <span className="text-[9px] font-bold text-emerald-800">14h+</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Continuous Gantt Reservation Blocks (Hospedin style: starts at 14h, ends at 12h) */}
                      {accReservations.map((res) => {
                        const rangeStart = dateRange[0];
                        const totalCols = dateRange.length;

                        // Fractional day offsets (check-in at 14h is +0.5 of start day; check-out at 12h is +0.5 of end day)
                        const inOffset = getDayOffset(res.check_in, rangeStart);
                        const outOffset = getDayOffset(res.check_out, rangeStart);

                        // If check-in is before the visible range, start flush at left edge (0)
                        // If within visible range, start at middle of check-in day (+0.5)
                        const rawStartUnit = inOffset < 0 ? 0 : inOffset + 0.5;

                        // If check-out is after the visible range, extend flush to right edge (totalCols)
                        // If within visible range, end at middle of check-out day (+0.5)
                        const rawEndUnit = outOffset > totalCols ? totalCols : outOffset + 0.5;

                        // Skip if completely out of view
                        if (rawEndUnit <= 0 || rawStartUnit >= totalCols) {
                          return null;
                        }

                        const visibleStart = Math.max(0, rawStartUnit);
                        const visibleEnd = Math.min(totalCols, rawEndUnit);

                        if (visibleEnd <= visibleStart) return null;

                        // Pixel calculation with clean 2px gap at turnover boundary
                        const leftPx = visibleStart * colWidth + 2;
                        const widthPx = (visibleEnd - visibleStart) * colWidth - 4;

                        const checkInIsToday = res.check_in === today;
                        const checkOutIsToday = res.check_out === today;

                        let blockTheme = 'bg-sky-600 hover:bg-sky-700 text-white border-sky-700';
                        if (checkInIsToday) {
                          blockTheme = 'bg-amber-600 hover:bg-amber-700 text-white border-amber-800 ring-2 ring-amber-300';
                        } else if (checkOutIsToday) {
                          blockTheme = 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-800';
                        }

                        const dailyNights = calculateDailyCount(res.check_in, res.check_out);

                        return (
                          <div
                            key={res.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openReservationDetails(res);
                            }}
                            style={{
                              left: `${leftPx}px`,
                              width: `${Math.max(widthPx, 32)}px`,
                            }}
                            className={`absolute top-2.5 bottom-2.5 rounded-xl px-2.5 sm:px-3 flex flex-col justify-center text-xs cursor-pointer shadow-md border-2 transition-all z-10 select-none overflow-hidden active:scale-98 ${blockTheme}`}
                            title={`${res.guest_name}\nEntrada: ${formatDateBR(res.check_in)} às 14h\nSaída: ${formatDateBR(res.check_out)} às 12h\nDiárias: ${dailyNights}\nValor: ${formatCurrencyBRL(res.total_value)}`}
                          >
                            {/* Guest Name & Stay Count */}
                            <div className="flex items-center justify-between gap-1.5 min-w-0">
                              <div className="flex items-center gap-1.5 truncate">
                                {checkInIsToday ? (
                                  <LogIn className="w-4 h-4 text-amber-200 shrink-0" />
                                ) : checkOutIsToday ? (
                                  <LogOut className="w-4 h-4 text-indigo-200 shrink-0" />
                                ) : (
                                  <Bed className="w-4 h-4 text-sky-100 shrink-0" />
                                )}
                                <span className="font-black truncate text-xs sm:text-sm leading-tight tracking-tight">
                                  {res.guest_name}
                                </span>
                              </div>

                              {widthPx > 70 && (
                                <span className="text-[10px] sm:text-xs font-bold shrink-0 bg-black/25 px-1.5 py-0.5 rounded-md tabular-nums">
                                  {dailyNights}d
                                </span>
                              )}
                            </div>

                            {/* Dates subtitle */}
                            {widthPx > 80 && (
                              <div className="text-[10px] sm:text-[11px] opacity-95 truncate mt-0.5 font-bold flex items-center gap-1">
                                <span>{formatDateShortBR(res.check_in)}</span>
                                <ArrowRight className="w-3 h-3 shrink-0" />
                                <span>{formatDateShortBR(res.check_out)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
