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
import { getTodaySaoPaulo, formatDateFullBR, formatDateBR, calculateDailyCount, addDays } from '../lib/dateUtils';
import { formatCurrencyBRL } from '../lib/currencyUtils';
import { getPaidAmount } from '../lib/paymentUtils';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const SectionHead: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; count: number }> = ({ icon, title, subtitle, count }) => (
  <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone-100 text-emerald-800">{icon}</span>
      <div className="min-w-0">
        <h2 className="font-display text-lg font-extrabold leading-tight text-emerald-900">{title}</h2>
        <p className="truncate text-xs text-stone-500">{subtitle}</p>
      </div>
    </div>
    <span className="font-serif text-4xl leading-none text-emerald-900 tabular-nums">{count}</span>
  </div>
);

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
    (sum, reservation) => sum + getPaidAmount(reservation),
    0
  );
  const totalOutstanding = Math.max(0, totalBooked - totalPaid);

  const getAccName = (id: string) => {
    const acc = accommodations.find((a) => a.id === id);
    return acc ? acc.nome : 'Chalé';
  };

  const circumference = 2 * Math.PI * 52;

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="space-y-5 pb-4">
      {/* Hero: data, saudação e anel de ocupação */}
      <section className="relative overflow-hidden rounded-[28px] bg-emerald-900 p-6 text-stone-50 sm:p-9">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-300">
              Recepção · {settings.inn_name}
            </p>
            <h1 className="mt-3 font-serif text-4xl font-normal capitalize leading-[1.05] tracking-tight sm:text-6xl">
              {formatDateFullBR(today)}
            </h1>
            <p className="mt-3 max-w-md text-sm text-stone-200/70">
              {arrivalsToday.length + departuresToday.length === 0
                ? 'Dia tranquilo: nenhuma chegada nem saída prevista.'
                : `${arrivalsToday.length} ${arrivalsToday.length === 1 ? 'chegada' : 'chegadas'} e ${departuresToday.length} ${departuresToday.length === 1 ? 'saída' : 'saídas'} para hoje.`}
            </p>
            <button
              onClick={() => setActiveTab('mapa')}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-bold text-emerald-900 transition hover:bg-amber-200 active:scale-[0.98]"
            >
              <Map className="h-4 w-4" />
              Abrir mapa de reservas
            </button>
          </div>

          <div className="flex items-center gap-5 self-start md:self-auto">
            <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label={`Ocupação de ${occupancyPercentage}%`}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="9" />
                <circle
                  cx="60" cy="60" r="52" fill="none" stroke="var(--color-amber-300)" strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - occupancyPercentage / 100)}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="font-serif text-4xl leading-none tabular-nums">{occupancyPercentage}<span className="text-xl">%</span></div>
                  <div className="mt-1 text-xs font-medium text-stone-200/60">ocupação</div>
                </div>
              </div>
            </div>
            <p className="max-w-[9rem] text-sm leading-snug text-stone-200/70">
              <span className="font-bold text-stone-50">{occupiedAccommodationsCount} de {totalUnits}</span> chalés ocupados hoje
            </p>
          </div>
        </div>
      </section>

      {/* Números do dia */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Entradas', value: arrivalsToday.length, icon: <LogIn className="h-4 w-4" />, target: 'entradas-hoje-section', accent: 'bg-amber-300 text-emerald-900' },
          { label: 'Saídas', value: departuresToday.length, icon: <LogOut className="h-4 w-4" />, target: 'saidas-hoje-section', accent: 'bg-indigo-100 text-indigo-700' },
          { label: 'Hospedados', value: currentGuests.length, icon: <Bed className="h-4 w-4" />, target: undefined, accent: 'bg-emerald-100 text-emerald-700' },
        ].map((card) => (
          <button
            key={card.label}
            type="button"
            disabled={!card.target}
            onClick={() => card.target && scrollTo(card.target)}
            className="group rounded-3xl border border-stone-200 bg-white p-4 text-left transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_10px_28px_rgba(12,34,16,0.08)] sm:p-6"
          >
            <span className={`grid h-9 w-9 place-items-center rounded-full ${card.accent}`}>{card.icon}</span>
            <div className="mt-4 font-serif text-5xl leading-none text-emerald-900 tabular-nums sm:text-6xl">{card.value}</div>
            <div className="mt-2 text-sm font-semibold text-stone-600">{card.label}</div>
          </button>
        ))}
      </div>

      {/* Financeiro */}
      <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-stone-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-stone-200">
        <div className="border-b border-stone-200 p-5 sm:border-b-0 sm:p-6">
          <span className="text-sm font-semibold text-stone-600">Reservas ativas</span>
          <div className="mt-1 font-display text-2xl font-extrabold text-emerald-900 tabular-nums">{formatCurrencyBRL(totalBooked)}</div>
        </div>
        <div className="border-b border-stone-200 p-5 sm:border-b-0 sm:p-6">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><WalletCards className="h-3.5 w-3.5" />Já recebido</span>
          <div className="mt-1 font-display text-2xl font-extrabold text-emerald-700 tabular-nums">{formatCurrencyBRL(totalPaid)}</div>
        </div>
        <div className="p-5 sm:p-6">
          <span className="text-sm font-semibold text-amber-700">Falta receber</span>
          <div className="mt-1 font-display text-2xl font-extrabold text-amber-700 tabular-nums">{formatCurrencyBRL(totalOutstanding)}</div>
        </div>
      </div>

      {/* Entradas & saídas */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section id="entradas-hoje-section" className="scroll-mt-24 overflow-hidden rounded-3xl border border-stone-200 bg-white">
          <SectionHead
            icon={<LogIn className="h-5 w-5" />}
            title="Entradas de hoje"
            subtitle={`Check-in a partir das ${settings.default_checkin_time}h`}
            count={arrivalsToday.length}
          />
          <div className="divide-y divide-stone-100">
            {arrivalsToday.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-stone-500">Nenhum check-in previsto para hoje.</p>
            ) : (
              arrivalsToday.map((res) => {
                const dailyCount = calculateDailyCount(res.check_in, res.check_out);
                const cleanPhone = res.phone ? res.phone.replace(/\D/g, '') : '';
                return (
                  <div
                    key={res.id}
                    onClick={() => openReservationDetails(res)}
                    className="flex cursor-pointer flex-col gap-3 px-5 py-4 transition hover:bg-stone-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-base font-bold text-emerald-900">{res.guest_name}</span>
                        {res.status === 'Hospedado' && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">✓ Check-in feito</span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-600">
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">{getAccName(res.accommodation_id)}</span>
                        <span>{dailyCount} {dailyCount === 1 ? 'diária' : 'diárias'} · até {formatDateBR(res.check_out)}</span>
                      </div>
                      {res.phone && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-500"><Phone className="h-3.5 w-3.5" />{res.phone}</div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(`Olá ${res.guest_name}, aguardamos você hoje na ${settings.inn_name}!`)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200"
                          title="Enviar WhatsApp para o hóspede"
                        >
                          <MessageCircle className="h-5 w-5" />
                        </a>
                      )}
                      {res.status !== 'Hospedado' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateReservation(res.id, { status: 'Hospedado' }); }}
                          className="rounded-full bg-emerald-900 px-4 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-emerald-700 sm:text-sm"
                        >
                          Registrar check-in
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section id="saidas-hoje-section" className="scroll-mt-24 overflow-hidden rounded-3xl border border-stone-200 bg-white">
          <SectionHead
            icon={<LogOut className="h-5 w-5" />}
            title="Saídas de hoje"
            subtitle={`Check-out até as ${settings.default_checkout_time}h`}
            count={departuresToday.length}
          />
          <div className="divide-y divide-stone-100">
            {departuresToday.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-stone-500">Nenhum check-out previsto para hoje.</p>
            ) : (
              departuresToday.map((res) => (
                <div
                  key={res.id}
                  onClick={() => openReservationDetails(res)}
                  className="flex cursor-pointer flex-col gap-3 px-5 py-4 transition hover:bg-stone-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-bold text-emerald-900">{res.guest_name}</span>
                      {res.status === 'Finalizada' && (
                        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-bold text-stone-600">✓ Check-out feito</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-600">
                      <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">{getAccName(res.accommodation_id)}</span>
                      <span>Entrou dia {formatDateBR(res.check_in)}</span>
                    </div>
                  </div>
                  {res.status !== 'Finalizada' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateReservation(res.id, { status: 'Finalizada' }); }}
                      className="shrink-0 self-end rounded-full border border-emerald-900 px-4 py-2.5 text-xs font-bold text-emerald-900 transition hover:bg-emerald-900 hover:text-amber-300 sm:self-center sm:text-sm"
                    >
                      Registrar check-out
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Próximas reservas */}
      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-stone-100 text-emerald-800"><Calendar className="h-5 w-5" /></span>
            <h2 className="font-display text-lg font-extrabold text-emerald-900">Próximos 7 dias</h2>
          </div>
          <button onClick={() => setActiveTab('reservas')} className="flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-900">
            Ver todas <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="divide-y divide-stone-100">
          {upcomingReservations.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-stone-500">Nenhuma reserva para os próximos 7 dias.</p>
          ) : (
            upcomingReservations.map((res) => (
              <div
                key={res.id}
                onClick={() => openReservationDetails(res)}
                className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 transition hover:bg-stone-50 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="w-14 shrink-0 rounded-2xl bg-stone-100 py-1.5 text-center">
                    <div className="font-serif text-2xl leading-none text-emerald-900 tabular-nums">{res.check_in.slice(8, 10)}</div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-500">{MONTHS[Number(res.check_in.slice(5, 7)) - 1]}</div>
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate font-display font-bold text-emerald-900">{res.guest_name}</span>
                    <span className="text-xs text-stone-500">{getAccName(res.accommodation_id)} · até {formatDateBR(res.check_out)}</span>
                  </div>
                </div>
                <span className="shrink-0 font-display font-bold text-emerald-900 tabular-nums">{formatCurrencyBRL(res.total_value)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
