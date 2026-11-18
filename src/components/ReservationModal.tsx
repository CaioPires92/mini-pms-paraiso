import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Bed, Phone, Mail, Car, Check, ChevronDown, Plus, Trash2, ArrowRight, Moon, AlertCircle } from 'lucide-react';
import { usePms } from '../context/PmsContext';
import { calculateDailyCount, formatDateBR, getTodaySaoPaulo, addDays } from '../lib/dateUtils';
import { formatCurrencyBRL, parseCurrencyInput } from '../lib/currencyUtils';
import { ConflictAlert } from './ConflictAlert';
import { PaymentMethod, PaymentType, ReservationPayment, ReservationStatus, SalesChannel } from '../types';
import { getReservationPayments } from '../lib/paymentUtils';

const inputCls =
  'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-[15px] font-medium text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-4 focus:ring-amber-300/40';
const labelCls = 'mb-1.5 block text-xs font-bold text-stone-600';

const Section: React.FC<{ title: string; hint?: string; aside?: React.ReactNode; id?: string; children: React.ReactNode }> = ({ title, hint, aside, id, children }) => (
  <section id={id} className="scroll-mt-4 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-display text-base font-extrabold text-emerald-900">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-stone-500">{hint}</p>}
      </div>
      {aside}
    </div>
    {children}
  </section>
);

const CHANNELS: SalesChannel[] = ['WhatsApp', 'Site', 'Booking', 'Instagram', 'Telefone', 'Recepção'];
const STATUSES: { value: ReservationStatus; label: string }[] = [
  { value: 'Reservada', label: 'Reservada' },
  { value: 'Hospedado', label: 'Hospedado' },
  { value: 'Finalizada', label: 'Finalizada' },
  { value: 'Cancelada', label: 'Cancelada' },
];

export const ReservationModal: React.FC = () => {
  const {
    modalReservation,
    closeReservationModal,
    accommodations,
    createReservation,
    updateReservation,
    checkAccommodationConflict,
    getAvailableAccommodations,
  } = usePms();

  const isEdit = modalReservation.mode === 'edit';
  const editingId = modalReservation.initialData?.id;

  const defaultToday = getTodaySaoPaulo();
  const defaultTomorrow = addDays(defaultToday, 1);

  // Form State
  const [guestName, setGuestName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [accommodationId, setAccommodationId] = useState('');
  const [checkIn, setCheckIn] = useState(defaultToday);
  const [checkOut, setCheckOut] = useState(defaultTomorrow);
  const [totalValueInput, setTotalValueInput] = useState('');
  const [salesChannel, setSalesChannel] = useState<SalesChannel>('WhatsApp');
  const [payments, setPayments] = useState<ReservationPayment[]>([]);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [paymentType, setPaymentType] = useState<PaymentType>('Pagamento');
  const [paymentDate, setPaymentDate] = useState(defaultToday);
  const [paymentNote, setPaymentNote] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ReservationStatus>('Reservada');

  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Available accommodations strictly for the selected period
  const availableAccommodations = useMemo(() => {
    return getAvailableAccommodations(checkIn, checkOut, editingId);
  }, [getAvailableAccommodations, checkIn, checkOut, editingId]);

  const activeAccommodations = useMemo(() => {
    return accommodations.filter((accommodation) => accommodation.ativo);
  }, [accommodations]);

  const availableAccommodationIds = useMemo(() => {
    return new Set(availableAccommodations.map((accommodation) => accommodation.id));
  }, [availableAccommodations]);

  // Populate form when modal opens
  useEffect(() => {
    if (modalReservation.isOpen) {
      setFormError(null);
      const openPaymentForm = sessionStorage.getItem('open-payment-form') === '1';
      sessionStorage.removeItem('open-payment-form');
      setShowPaymentForm(openPaymentForm);
      const init = modalReservation.initialData;
      const initialCheckIn = init?.check_in || defaultToday;
      const initialCheckOut = init?.check_out || defaultTomorrow;
      const available = getAvailableAccommodations(initialCheckIn, initialCheckOut, init?.id);
      setPaymentAmountInput('');
      setPaymentMethod('Pix');
      setPaymentType('Pagamento');
      setPaymentDate(defaultToday);
      setPaymentNote('');

      if (init) {
        setGuestName(init.guest_name || '');
        setDocument(init.document || '');
        setPhone(init.phone || '');
        setEmail(init.email || '');
        setVehiclePlate(init.vehicle_plate || '');
        setCheckIn(initialCheckIn);
        setCheckOut(initialCheckOut);
        const chosenAccId =
          init.accommodation_id && accommodations.some((a) => a.id === init.accommodation_id && a.ativo)
            ? init.accommodation_id
            : available[0]?.id || '';
        setAccommodationId(chosenAccId);
        setTotalValueInput(init.total_value ? init.total_value.toString() : '');
        setSalesChannel(init.sales_channel || 'WhatsApp');
        setPayments(getReservationPayments(init));
        setNotes(init.notes || '');
        setStatus(init.status || 'Reservada');
        if (init.document || init.phone || init.email || init.vehicle_plate || init.notes) {
          setShowOptionalFields(true);
        } else {
          setShowOptionalFields(false);
        }
      } else {
        setGuestName('');
        setDocument('');
        setPhone('');
        setEmail('');
        setVehiclePlate('');
        setCheckIn(defaultToday);
        setCheckOut(defaultTomorrow);
        setAccommodationId(available[0]?.id || '');
        setTotalValueInput('');
        setSalesChannel('WhatsApp');
        setPayments([]);
        setNotes('');
        setStatus('Reservada');
        setShowOptionalFields(false);
      }
    }
  }, [modalReservation.isOpen, modalReservation.initialData, getAvailableAccommodations, accommodations, defaultToday, defaultTomorrow]);

  // Preserve the user's choice when dates create a conflict. Only replace an
  // accommodation that no longer exists or is inactive.
  useEffect(() => {
    if (accommodationId && activeAccommodations.some((a) => a.id === accommodationId)) return;
    setAccommodationId(availableAccommodations[0]?.id || activeAccommodations[0]?.id || '');
  }, [activeAccommodations, availableAccommodations, accommodationId]);

  // Real-time calculations
  const dailyCount = useMemo(() => {
    return calculateDailyCount(checkIn, checkOut);
  }, [checkIn, checkOut]);

  const totalValue = useMemo(() => {
    return parseCurrencyInput(totalValueInput);
  }, [totalValueInput]);

  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = Math.max(0, totalValue - paidAmount);

  const averageDaily = useMemo(() => {
    if (dailyCount > 0 && totalValue > 0) {
      return totalValue / dailyCount;
    }
    return 0;
  }, [dailyCount, totalValue]);

  const addPayment = () => {
    const amount = parseCurrencyInput(paymentAmountInput);
    if (amount <= 0) {
      setFormError('Informe um valor válido para o pagamento.');
      return;
    }
    if (paidAmount + amount > totalValue) {
      setFormError('Este pagamento ultrapassa o saldo restante da reserva.');
      return;
    }
    setPayments((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        amount,
        method: paymentMethod,
        type: paymentType,
        paid_at: paymentDate,
        note: paymentNote.trim() || undefined,
      },
    ]);
    setPaymentAmountInput('');
    setPaymentType('Pagamento');
    setPaymentNote('');
    setShowPaymentForm(false);
    setFormError(null);
  };

  const removePayment = (id: string) => {
    setPayments((current) => current.filter((payment) => payment.id !== id));
  };

  // Conflict Checking
  const conflictResult = useMemo(() => {
    if (!accommodationId || !checkIn || !checkOut || checkOut <= checkIn) {
      return { hasConflict: false };
    }
    if (status === 'Cancelada') {
      return { hasConflict: false };
    }
    return checkAccommodationConflict(accommodationId, checkIn, checkOut, editingId);
  }, [accommodationId, checkIn, checkOut, status, checkAccommodationConflict, editingId]);

  useEffect(() => {
    if (!modalReservation.isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeReservationModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalReservation.isOpen, closeReservationModal]);

  if (!modalReservation.isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!guestName.trim()) {
      setFormError('Por favor, informe o nome do hóspede.');
      return;
    }

    if (!checkIn || !checkOut) {
      setFormError('Informe as datas de entrada e saída.');
      return;
    }

    if (checkOut <= checkIn) {
      setFormError('A data de saída deve ser depois da data de entrada.');
      return;
    }

    if (!accommodationId) {
      setFormError('Selecione um chalé disponível.');
      return;
    }

    if (totalValue <= 0) {
      setFormError('Informe o valor total da reserva.');
      return;
    }

    if (paidAmount > totalValue) {
      setFormError('Os pagamentos não podem ser negativos nem ultrapassar o valor total.');
      return;
    }

    if (conflictResult.hasConflict) {
      setFormError('Esta acomodação já possui uma reserva neste período.');
      return;
    }

    if (isEdit && editingId) {
      const res = await updateReservation(editingId, {
        guest_name: guestName.trim(),
        document: document.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        vehicle_plate: vehiclePlate.trim() || undefined,
        accommodation_id: accommodationId,
        check_in: checkIn,
        check_out: checkOut,
        total_value: totalValue,
        sales_channel: salesChannel,
        payments,
        deposit_amount: undefined,
        additional_payment_amount: undefined,
        notes: notes.trim() || undefined,
        status,
      });

      if (!res.success) {
        setFormError(res.error || 'Erro ao atualizar reserva.');
        return;
      }
    } else {
      const res = await createReservation({
        guest_name: guestName.trim(),
        document: document.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        vehicle_plate: vehiclePlate.trim() || undefined,
        accommodation_id: accommodationId,
        check_in: checkIn,
        check_out: checkOut,
        total_value: totalValue,
        sales_channel: salesChannel,
        payments,
        deposit_amount: undefined,
        additional_payment_amount: undefined,
        notes: notes.trim() || undefined,
        status,
      });

      if (!res.success) {
        setFormError(res.error || 'Erro ao criar reserva.');
        return;
      }
    }

    closeReservationModal();
  };

  const canSubmit =
    !conflictResult.hasConflict &&
    totalValue > 0 &&
    !!guestName.trim() &&
    !!accommodationId &&
    availableAccommodations.length > 0;
  const selectedAcc = accommodations.find((a) => a.id === accommodationId);
  const paidPct = totalValue > 0 ? Math.min(100, Math.round((paidAmount / totalValue) * 100)) : 0;
  const missing: string[] = [];
  if (!guestName.trim()) missing.push('nome do hóspede');
  if (!accommodationId || availableAccommodations.length === 0) missing.push('chalé livre');
  if (totalValue <= 0) missing.push('valor total');

  const submitLabel = isEdit ? 'Salvar alterações' : 'Concluir reserva';

  const renderSubmit = (className = '') => (
    <button
      type="submit"
      form="reservation-form"
      disabled={!canSubmit}
      className={`flex items-center justify-center gap-2 rounded-full bg-amber-300 px-6 py-3.5 text-sm font-extrabold text-emerald-900 transition hover:bg-amber-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <Check className="h-5 w-5 stroke-[3]" />
      {submitLabel}
    </button>
  );

  return (
    <div role="dialog" aria-modal="true" aria-label={isEdit ? 'Editar reserva' : 'Nova reserva'} className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-emerald-950/60 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="animate-fadeIn flex max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] bg-stone-50 shadow-2xl sm:max-h-[92vh] sm:rounded-[28px] md:flex-row">
        {/* Coluna do formulário */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-200 px-5 py-4 sm:px-7">
            <div>
              <h2 className="font-serif text-3xl font-normal leading-none text-emerald-900">
                {isEdit ? 'Editar reserva' : 'Nova reserva'}
              </h2>
              <p className="mt-1 text-xs text-stone-500">Os campos com * são obrigatórios.</p>
            </div>
            <button
              type="button"
              onClick={closeReservationModal}
              className="grid h-10 w-10 place-items-center rounded-full text-stone-500 transition hover:bg-stone-200 hover:text-stone-900"
              title="Fechar"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <form id="reservation-form" onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-7">
            {formError && (
              <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-red-300 bg-red-50 p-3.5 text-sm font-semibold text-red-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            {/* Hóspede */}
            <Section title="Hóspede">
              <label className={labelCls} htmlFor="guest-name">Nome completo *</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="guest-name"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Ex.: Carlos Eduardo"
                  className={`${inputCls} pl-10`}
                  autoFocus
                  required
                />
              </div>
            </Section>

            {/* Estadia */}
            <Section
              title="Estadia"
              hint="Escolha as datas e depois o chalé livre."
              aside={
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  <Moon className="h-3.5 w-3.5" />
                  {dailyCount} {dailyCount === 1 ? 'noite' : 'noites'}
                </span>
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="check-in">Entrada *</label>
                  <input
                    id="check-in"
                    type="date"
                    value={checkIn}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    onChange={(e) => {
                      const newCheckIn = e.target.value;
                      setCheckIn(newCheckIn);
                      if (newCheckIn >= checkOut) setCheckOut(addDays(newCheckIn, 1));
                    }}
                    className={`${inputCls} cursor-pointer font-bold`}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="check-out">Saída *</label>
                  <input
                    id="check-out"
                    type="date"
                    value={checkOut}
                    min={addDays(checkIn, 1)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className={`${inputCls} cursor-pointer font-bold`}
                    required
                  />
                </div>
              </div>

              <div className="mb-2 mt-5 flex items-center justify-between">
                <span className={`${labelCls} mb-0`}>Chalé *</span>
                <span className="text-xs font-bold text-emerald-700">
                  {availableAccommodations.length} de {activeAccommodations.length} livres
                </span>
              </div>

              {activeAccommodations.length > 0 ? (
                <div role="radiogroup" aria-label="Escolha o chalé" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {activeAccommodations.map((acc) => {
                    const isAvailable = availableAccommodationIds.has(acc.id);
                    const isSelected = accommodationId === acc.id;
                    const conflict = isAvailable
                      ? undefined
                      : checkAccommodationConflict(acc.id, checkIn, checkOut, editingId).conflictingReservation;

                    if (!isAvailable) {
                      return (
                        <div
                          key={acc.id}
                          role="radio"
                          aria-checked={isSelected}
                          aria-disabled="true"
                          className="flex items-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-100/70 p-3 opacity-80"
                        >
                          <Bed className="h-5 w-5 shrink-0 text-stone-400" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-stone-600">{acc.nome}</span>
                            <span className="block text-xs text-red-700">
                              {conflict ? `Ocupado ${formatDateBR(conflict.check_in)} a ${formatDateBR(conflict.check_out)}` : 'Ocupado'}
                            </span>
                          </span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={acc.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setAccommodationId(acc.id)}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? 'border-emerald-900 bg-emerald-900 text-stone-50 shadow-md'
                            : 'border-stone-200 bg-white hover:border-emerald-500'
                        }`}
                      >
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${isSelected ? 'bg-amber-300 text-emerald-900' : 'bg-emerald-100 text-emerald-700'}`}>
                          {isSelected ? <Check className="h-4 w-4 stroke-[3]" /> : <Bed className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold">{acc.nome}</span>
                          <span className={`block truncate text-xs ${isSelected ? 'text-stone-200/70' : 'text-stone-500'}`}>{acc.tipo} · Livre</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-100 px-4 py-3 text-sm italic text-stone-500">
                  <Bed className="h-4 w-4 shrink-0" /> Nenhum chalé ativo cadastrado
                </div>
              )}

              {availableAccommodations.length === 0 && (
                <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-900">
                  Todos os chalés estão reservados entre <strong>{formatDateBR(checkIn)}</strong> e <strong>{formatDateBR(checkOut)}</strong>. Mude as datas acima.
                </p>
              )}
              {conflictResult.hasConflict && (
                <div className="mt-3">
                  <ConflictAlert conflictingReservation={conflictResult.conflictingReservation} />
                </div>
              )}
            </Section>

            {/* Valor e origem */}
            <Section title="Valor e origem">
              <label className={labelCls} htmlFor="total-value">Valor total da reserva *</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">R$</span>
                <input
                  id="total-value"
                  type="text"
                  inputMode="decimal"
                  value={totalValueInput}
                  onChange={(e) => setTotalValueInput(e.target.value)}
                  placeholder="1500,00"
                  className={`${inputCls} pl-10 font-display text-xl font-bold tabular-nums`}
                  required
                />
              </div>
              <p className="mt-1.5 text-xs text-stone-500">
                {dailyCount > 0 && totalValue > 0
                  ? `Média de ${formatCurrencyBRL(averageDaily)} por noite.`
                  : 'Informe o total para ver a média por noite.'}
              </p>

              <span className={`${labelCls} mt-5`}>Canal de venda *</span>
              <div role="radiogroup" aria-label="Canal de venda" className="flex flex-wrap gap-2">
                {CHANNELS.map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    role="radio"
                    aria-checked={salesChannel === channel}
                    onClick={() => setSalesChannel(channel)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      salesChannel === channel
                        ? 'border-emerald-900 bg-emerald-900 text-amber-300'
                        : 'border-stone-300 bg-white text-stone-700 hover:border-emerald-500'
                    }`}
                  >
                    {channel}
                  </button>
                ))}
              </div>
            </Section>

            {/* Pagamentos */}
            <Section
              id="payments-section"
              title="Pagamentos recebidos"
              hint="Sinal e parcelas. Pode deixar vazio e lançar depois."
              aside={
                !showPaymentForm && (
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(true)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-900 px-3.5 py-1.5 text-xs font-bold text-emerald-900 transition hover:bg-emerald-900 hover:text-amber-300"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[3]" /> Adicionar
                  </button>
                )
              }
            >
              {payments.length === 0 && !showPaymentForm && (
                <p className="rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-500">Nenhum pagamento lançado.</p>
              )}

              {payments.length > 0 && (
                <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
                  {payments.map((payment) => (
                    <li key={payment.id} className="flex items-center justify-between gap-3 bg-white px-4 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-stone-900">{payment.type} · {payment.method}</div>
                        <div className="text-xs text-stone-500">{formatDateBR(payment.paid_at)}{payment.note ? ` · ${payment.note}` : ''}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <strong className="font-display tabular-nums text-emerald-700">{formatCurrencyBRL(payment.amount)}</strong>
                        <button type="button" onClick={() => removePayment(payment.id)} className="rounded-full p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-600" aria-label="Excluir pagamento" title="Excluir pagamento">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {showPaymentForm && (
                <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="col-span-2 sm:col-span-1">
                      <span className={labelCls}>Valor recebido</span>
                      <input type="text" inputMode="decimal" value={paymentAmountInput} onChange={(e) => setPaymentAmountInput(e.target.value)} placeholder="R$ 0,00" className={`${inputCls} font-bold`} />
                    </label>
                    <label className="col-span-2 sm:col-span-1">
                      <span className={labelCls}>Forma</span>
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className={inputCls}>
                        <option value="Pix">Pix</option>
                        <option value="Cartão de crédito">Cartão de crédito</option>
                        <option value="Cartão de débito">Cartão de débito</option>
                        <option value="Dinheiro">Dinheiro</option>
                      </select>
                    </label>
                    <label>
                      <span className={labelCls}>Tipo</span>
                      <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)} className={inputCls}>
                        <option value="Pagamento">Pagamento</option>
                        <option value="Sinal">Sinal</option>
                        <option value="Parcela">Parcela</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </label>
                    <label>
                      <span className={labelCls}>Data</span>
                      <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={inputCls} />
                    </label>
                  </div>
                  <label className="block">
                    <span className={labelCls}>Observação (opcional)</span>
                    <input type="text" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="Ex.: parcela 1/3" className={inputCls} />
                  </label>
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={() => setShowPaymentForm(false)} className="rounded-full px-4 py-2.5 text-sm font-bold text-stone-600 transition hover:bg-white">
                      Cancelar
                    </button>
                    <button type="button" onClick={addPayment} className="flex items-center gap-1.5 rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-bold text-amber-300 transition hover:bg-emerald-700">
                      <Plus className="h-4 w-4 stroke-[3]" /> Lançar pagamento
                    </button>
                  </div>
                </div>
              )}
            </Section>

            {/* Situação (somente edição) */}
            {isEdit && (
              <Section title="Situação da reserva">
                <div role="radiogroup" aria-label="Situação da reserva" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {STATUSES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={status === option.value}
                      onClick={() => setStatus(option.value)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                        status === option.value
                          ? option.value === 'Cancelada'
                            ? 'border-red-700 bg-red-700 text-white'
                            : 'border-emerald-900 bg-emerald-900 text-amber-300'
                          : 'border-stone-300 bg-white text-stone-700 hover:border-emerald-500'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* Contato e observações */}
            <section className="rounded-2xl border border-stone-200 bg-white">
              <button
                type="button"
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                aria-expanded={showOptionalFields}
                className="flex w-full items-center justify-between gap-3 p-4 text-left sm:px-5"
              >
                <span>
                  <span className="block font-display text-base font-extrabold text-emerald-900">Contato e observações</span>
                  <span className="block text-xs text-stone-500">Telefone, documento, e-mail, placa e pedidos. Opcional.</span>
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-stone-500 transition-transform ${showOptionalFields ? 'rotate-180' : ''}`} />
              </button>

              {showOptionalFields && (
                <div className="space-y-4 border-t border-stone-100 p-4 sm:p-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label>
                      <span className={labelCls}>Telefone / WhatsApp</span>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" className={`${inputCls} pl-10`} />
                      </div>
                    </label>
                    <label>
                      <span className={labelCls}>CPF ou RG</span>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input type="text" value={document} onChange={(e) => setDocument(e.target.value)} placeholder="000.000.000-00" className={`${inputCls} pl-10`} />
                      </div>
                    </label>
                    <label>
                      <span className={labelCls}>E-mail</span>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hospede@email.com" className={`${inputCls} pl-10`} />
                      </div>
                    </label>
                    <label>
                      <span className={labelCls}>Placa do veículo</span>
                      <div className="relative">
                        <Car className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input type="text" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())} placeholder="ABC-1234" className={`${inputCls} pl-10 uppercase`} />
                      </div>
                    </label>
                  </div>
                  <label className="block">
                    <span className={labelCls}>Observações e pedidos</span>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Ex.: cama extra, horário previsto de chegada..." className={inputCls} />
                  </label>
                </div>
              )}
            </section>
          </form>

          {/* Barra de ação no celular */}
          <div className="shrink-0 border-t border-stone-200 bg-white p-3 md:hidden">
            <div className="mb-2 flex items-center justify-between px-1 text-sm">
              <span className="text-stone-500">{dailyCount} {dailyCount === 1 ? 'noite' : 'noites'} · {selectedAcc?.nome ?? 'sem chalé'}</span>
              <strong className="font-display text-lg tabular-nums text-emerald-900">{formatCurrencyBRL(totalValue)}</strong>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={closeReservationModal} className="rounded-full px-5 py-3.5 text-sm font-bold text-stone-600 hover:bg-stone-100">
                Cancelar
              </button>
              {renderSubmit('flex-1')}
            </div>
          </div>
        </div>

        {/* Painel de resumo (desktop) */}
        <aside className="relative hidden w-[320px] shrink-0 flex-col justify-between overflow-hidden bg-emerald-900 p-7 text-stone-50 md:flex">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-300/15 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">Resumo</p>
            <h3 className="mt-3 min-h-[2.5rem] break-words font-serif text-3xl font-normal leading-tight">
              {guestName.trim() || <span className="text-stone-200/40">Nome do hóspede</span>}
            </h3>

            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-stone-200/50">Chalé</dt>
                <dd className="mt-0.5 font-semibold">{selectedAcc?.nome ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-stone-200/50">Período</dt>
                <dd className="mt-0.5 flex items-center gap-2 font-semibold">
                  {checkIn ? formatDateBR(checkIn) : '—'} <ArrowRight className="h-3.5 w-3.5 text-amber-300" /> {checkOut ? formatDateBR(checkOut) : '—'}
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-amber-300">{dailyCount}n</span>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-stone-200/50">Canal</dt>
                <dd className="mt-0.5 font-semibold">{salesChannel}</dd>
              </div>
            </dl>
          </div>

          <div className="relative mt-8">
            <div className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-200/50">Valor total</p>
              <p className="mt-1 font-serif text-5xl leading-none tabular-nums">{formatCurrencyBRL(totalValue)}</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-amber-300 transition-all duration-500" style={{ width: `${paidPct}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-stone-200/70">Recebido <strong className="text-stone-50">{formatCurrencyBRL(paidAmount)}</strong></span>
                <span className="text-stone-200/70">Falta <strong className={remainingAmount > 0 ? 'text-amber-300' : 'text-emerald-300'}>{formatCurrencyBRL(remainingAmount)}</strong></span>
              </div>
            </div>

            {!canSubmit && missing.length > 0 && (
              <p className="mt-3 text-xs text-stone-200/60">Falta preencher: {missing.join(', ')}.</p>
            )}

            <div className="mt-4 flex flex-col gap-2">
              {renderSubmit()}
              <button type="button" onClick={closeReservationModal} className="rounded-full px-6 py-3 text-sm font-bold text-stone-200/70 transition hover:bg-white/10 hover:text-white">
                Cancelar
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
