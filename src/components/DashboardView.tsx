import React from 'react';
import {
  LogIn,
  LogOut,
  Bed,
  Calendar,
  Plus,
  ArrowRight,
  Phone,
  MessageCircle,
  Map,
  WalletCards,
} from 'lucide-react';
import { usePms } from '../context/PmsContext';
import { getTodaySaoPaulo, formatDateFullBR, formatDateBR, formatDateShortBR, calculateDailyCount, addDays } from '../lib/dateUtils';
import { formatCurrencyBRL } from '../lib/currencyUtils';

export const DashboardView: React.FC = () => {
  const {
    accommodations,
    reservations,
    openNewReservationModal,
    openReservationDetails,
    setActiveTab,
    updateReservation,
    settings,
  } = usePms();

  const today = getTodaySaoPaulo();

  // Active accommodations
  const activeAccommodations = accommodations.filter((a) => a.ativo);
  const totalUnits = activeAccommodations.length;

  // Non-cancelled reservations
  const activeReservations = reservations.filter((r) => r.status !== 'Cancelada');

  // 1. Entradas Hoje
  const arrivalsToday = activeReservations.filter((r) => r.check_in === today);

  // 2. Saídas Hoje
  const departuresToday = activeReservations.filter((r) => r.check_out === today);

  // 3. Hospedados Agora
  const currentGuests = activeReservations.filter(
    (r) => r.check_in <= today && r.check_out > today
  );

  // 4. Ocupação Hoje
  const occupiedAccommodationsCount = new Set(currentGuests.map((r) => r.accommodation_id)).size;
  const occupancyPercentage =
    totalUnits > 0 ? Math.round((occupiedAccommodationsCount / totalUnits) * 100) : 0;

  // 5. Próximas reservas (próximos 7 dias)
  const nextWeekEnd = addDays(today, 7);
  const upcomingReservations = activeReservations
    .filter((r) => r.check_in > today && r.check_in <= nextWeekEnd)
    .sort((a, b) => a.check_in.localeCompare(b.check_in));

  const totalBooked = activeReservations.reduce((sum, reservation) => sum + reservation.total_value, 0);
  const totalPaid = activeReservations.reduce(
    (sum, reservation) => sum + (reservation.deposit_amount || 0) + (reservation.additional_payment_amount || 0),
    0
  );
  const totalOutstanding = Math.max(0, totalBooked - totalPaid);

  const getAccName = (id: string) => {
    const acc = accommodations.find((a) => a.id === id);
    return acc ? acc.nome : 'Chalé';
  };

  return (
    <div className="space-y-6">
      {/* Date Header & Quick Actions */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-stone-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="min-w-0 w-full lg:w-auto">
          <span className="text-xs sm:text-sm font-bold text-emerald-800 uppercase tracking-wide block mb-1">
            Recepção · {settings.inn_name}
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-stone-900 leading-tight break-words">
            {formatDateFullBR(today)}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Aqui está o resumo dos hóspedes e dos chalés para o dia de hoje.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0">
          <button
            onClick={() => setActiveTab('mapa')}
            className="w-full sm:w-auto px-5 py-3 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Map className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>Abrir Mapa de Reservas</span>
          </button>
        </div>
      </div>

      {/* 4 Main Big Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Chegadas */}
        <div
          onClick={() => {
            const el = document.getElementById('entradas-hoje-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white p-5 rounded-2xl border-2 border-amber-300 hover:border-amber-400 bg-amber-50/20 shadow-xs flex flex-col justify-between cursor-pointer transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm font-bold text-amber-900 block">
                Entradas de Hoje
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-800 mt-1 tabular-nums">
                {arrivalsToday.length}
              </div>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl text-amber-800">
              <LogIn className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-stone-600 mt-4 flex items-center justify-between">
            <span>{arrivalsToday.length === 1 ? '1 hóspede chegando' : `${arrivalsToday.length} hóspedes chegando`}</span>
            <ArrowRight className="w-4 h-4 text-amber-700" />
          </p>
        </div>

        {/* Card 2: Saídas */}
        <div
          onClick={() => {
            const el = document.getElementById('saidas-hoje-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white p-5 rounded-2xl border-2 border-indigo-200 hover:border-indigo-300 bg-indigo-50/20 shadow-xs flex flex-col justify-between cursor-pointer transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm font-bold text-indigo-900 block">
                Saídas de Hoje
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-800 mt-1 tabular-nums">
                {departuresToday.length}
              </div>
            </div>
            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-800">
              <LogOut className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-stone-600 mt-4 flex items-center justify-between">
            <span>{departuresToday.length === 1 ? '1 check-out hoje' : `${departuresToday.length} check-outs hoje`}</span>
            <ArrowRight className="w-4 h-4 text-indigo-700" />
          </p>
        </div>

        {/* Card 3: Hospedados */}
        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm font-bold text-emerald-950 block">
                Hospedados Agora
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-900 mt-1 tabular-nums">
                {currentGuests.length}
              </div>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-800">
              <Bed className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-stone-600 mt-4">
            Em andamento na pousada
          </p>
        </div>

        {/* Card 4: Ocupação */}
        <div className="bg-white p-5 rounded-2xl border-2 border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm font-bold text-stone-800 block">
                Ocupação dos Chalés
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-1 tabular-nums">
                {occupancyPercentage}%
              </div>
            </div>
            <div className="p-3 bg-stone-100 rounded-xl text-stone-700 font-bold text-sm">
              {occupiedAccommodationsCount}/{totalUnits}
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden border border-stone-200">
              <div
                className="bg-emerald-700 h-3 rounded-full transition-all duration-500"
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-stone-600 mt-2">
              {occupiedAccommodationsCount} de {totalUnits} chalés ocupados
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border-2 border-stone-200 bg-white p-5">
          <span className="text-xs font-bold uppercase tracking-wide text-stone-500">Total das reservas ativas</span>
          <div className="mt-1 text-2xl font-black text-stone-900 tabular-nums">{formatCurrencyBRL(totalBooked)}</div>
        </div>
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700"><WalletCards className="h-4 w-4" />Já recebido</span>
          <div className="mt-1 text-2xl font-black text-emerald-900 tabular-nums">{formatCurrencyBRL(totalPaid)}</div>
        </div>
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5">
          <span className="text-xs font-bold uppercase tracking-wide text-amber-700">Falta receber</span>
          <div className="mt-1 text-2xl font-black text-amber-900 tabular-nums">{formatCurrencyBRL(totalOutstanding)}</div>
        </div>
      </div>

      {/* Entradas & Saídas Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entradas Hoje */}
        <div
          id="entradas-hoje-section"
          className="bg-white rounded-2xl border-2 border-stone-200 shadow-xs overflow-hidden"
        >
          <div className="px-5 py-4.5 border-b-2 border-stone-200 bg-amber-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-900">
                <LogIn className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-extrabold text-stone-900 text-base sm:text-lg">
                  Entradas de Hoje
                </h2>
                <span className="text-xs text-stone-500 font-medium">
                  Hóspedes com check-in a partir das {settings.default_checkin_time}h
                </span>
              </div>
            </div>
            <span className="text-sm font-extrabold text-amber-900 bg-white px-3 py-1 rounded-xl border border-amber-300 tabular-nums">
              {arrivalsToday.length}
            </span>
          </div>

          <div className="divide-y-2 divide-stone-100">
            {arrivalsToday.length === 0 ? (
              <div className="p-10 text-center text-sm font-medium text-stone-500">
                Nenhum check-in previsto para o dia de hoje.
              </div>
            ) : (
              arrivalsToday.map((res) => {
                const dailyCount = calculateDailyCount(res.check_in, res.check_out);
                const cleanPhone = res.phone ? res.phone.replace(/\D/g, '') : '';

                return (
                  <div
                    key={res.id}
                    onClick={() => openReservationDetails(res)}
                    className="p-5 hover:bg-stone-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-extrabold text-stone-900 text-base sm:text-lg">
                          {res.guest_name}
                        </span>
                        {res.status === 'Hospedado' && (
                          <span className="text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-lg">
                            ✓ Check-in já realizado
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-stone-700 mt-1 font-semibold flex items-center gap-2 flex-wrap">
                        <span className="text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          {getAccName(res.accommodation_id)}
                        </span>
                        <span>·</span>
                        <span>{dailyCount} {dailyCount === 1 ? 'diária' : 'diárias'} (até {formatDateBR(res.check_out)})</span>
                      </div>

                      {res.phone && (
                        <div className="mt-1 text-xs text-stone-500 flex items-center gap-1.5 font-medium">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span>{res.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                            `Olá ${res.guest_name}, aguardamos você hoje na ${settings.inn_name}!`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition"
                          title="Enviar WhatsApp para o hóspede"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </a>
                      )}

                      {res.status !== 'Hospedado' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateReservation(res.id, { status: 'Hospedado' });
                          }}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition"
                        >
                          Realizar Check-in
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Saídas Hoje */}
        <div
          id="saidas-hoje-section"
          className="bg-white rounded-2xl border-2 border-stone-200 shadow-xs overflow-hidden"
        >
          <div className="px-5 py-4.5 border-b-2 border-stone-200 bg-indigo-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-100 rounded-xl text-indigo-900">
                <LogOut className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-extrabold text-stone-900 text-base sm:text-lg">
                  Saídas de Hoje
                </h2>
                <span className="text-xs text-stone-500 font-medium">
                  Check-out previsto até as {settings.default_checkout_time}h
                </span>
              </div>
            </div>
            <span className="text-sm font-extrabold text-indigo-900 bg-white px-3 py-1 rounded-xl border border-indigo-300 tabular-nums">
              {departuresToday.length}
            </span>
          </div>

          <div className="divide-y-2 divide-stone-100">
            {departuresToday.length === 0 ? (
              <div className="p-10 text-center text-sm font-medium text-stone-500">
                Nenhum check-out previsto para o dia de hoje.
              </div>
            ) : (
              departuresToday.map((res) => {
                return (
                  <div
                    key={res.id}
                    onClick={() => openReservationDetails(res)}
                    className="p-5 hover:bg-stone-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-extrabold text-stone-900 text-base sm:text-lg">
                          {res.guest_name}
                        </span>
                        {res.status === 'Finalizada' && (
                          <span className="text-xs font-bold bg-stone-100 text-stone-700 border border-stone-300 px-2 py-0.5 rounded-lg">
                            ✓ Check-out concluído
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-stone-700 mt-1 font-semibold flex items-center gap-2 flex-wrap">
                        <span className="text-stone-800 bg-stone-100 px-2.5 py-0.5 rounded-lg border border-stone-200">
                          {getAccName(res.accommodation_id)}
                        </span>
                        <span>·</span>
                        <span>Entrou dia {formatDateBR(res.check_in)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      {res.status !== 'Finalizada' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateReservation(res.id, { status: 'Finalizada' });
                          }}
                          className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition"
                        >
                          Concluir Check-out
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Próximas Reservas (Sem poluição visual) */}
      <div className="bg-white rounded-2xl border-2 border-stone-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b-2 border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-800" />
            <h2 className="font-bold text-stone-900 text-base sm:text-lg">
              Próximas Reservas da Semana
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('reservas')}
            className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todas as reservas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-stone-100">
          {upcomingReservations.length === 0 ? (
            <div className="p-8 text-center text-sm text-stone-500 font-medium">
              Nenhuma reserva futura cadastrada para os próximos 7 dias.
            </div>
          ) : (
            upcomingReservations.map((res) => (
              <div
                key={res.id}
                onClick={() => openReservationDetails(res)}
                className="p-4 hover:bg-stone-50 transition cursor-pointer flex items-center justify-between gap-3 text-sm"
              >
                <div>
                  <span className="font-bold text-stone-900 text-sm sm:text-base block">
                    {res.guest_name}
                  </span>
                  <span className="text-xs sm:text-sm text-stone-600 font-medium">
                    {getAccName(res.accommodation_id)} · Chega em {formatDateBR(res.check_in)} até {formatDateBR(res.check_out)}
                  </span>
                </div>
                <span className="font-bold text-emerald-900 text-sm sm:text-base tabular-nums">
                  {formatCurrencyBRL(res.total_value)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
