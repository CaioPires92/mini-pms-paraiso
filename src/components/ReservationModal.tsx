import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, User, DollarSign, Bed, Phone, Mail, Car, CheckCircle2, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { usePms } from '../context/PmsContext';
import { calculateDailyCount, formatDateBR, getTodaySaoPaulo, addDays } from '../lib/dateUtils';
import { formatCurrencyBRL, parseCurrencyInput } from '../lib/currencyUtils';
import { ConflictAlert } from './ConflictAlert';
import { PaymentMethod, PaymentType, ReservationPayment, ReservationStatus, SalesChannel } from '../types';
import { getReservationPayments } from '../lib/paymentUtils';

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
  const [paymentType, setPaymentType] = useState<PaymentType>('Sinal');
  const [paymentDate, setPaymentDate] = useState(defaultToday);
  const [paymentNote, setPaymentNote] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ReservationStatus>('Reservada');

  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Available accommodations strictly for the selected period
  const availableAccommodations = useMemo(() => {
    return getAvailableAccommodations(checkIn, checkOut, editingId);
  }, [getAvailableAccommodations, checkIn, checkOut, editingId]);

  // Populate form when modal opens
  useEffect(() => {
    if (modalReservation.isOpen) {
      setFormError(null);
      const init = modalReservation.initialData;
      const initialCheckIn = init?.check_in || defaultToday;
      const initialCheckOut = init?.check_out || defaultTomorrow;
      const available = getAvailableAccommodations(initialCheckIn, initialCheckOut, init?.id);

      if (init) {
        setGuestName(init.guest_name || '');
        setDocument(init.document || '');
        setPhone(init.phone || '');
        setEmail(init.email || '');
        setVehiclePlate(init.vehicle_plate || '');
        setCheckIn(initialCheckIn);
        setCheckOut(initialCheckOut);
        const chosenAccId =
          init.accommodation_id && available.some((a) => a.id === init.accommodation_id)
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
        setPaymentAmountInput('');
        setPaymentMethod('Pix');
        setPaymentType('Sinal');
        setPaymentDate(defaultToday);
        setPaymentNote('');
        setNotes('');
        setStatus('Reservada');
        setShowOptionalFields(false);
      }
    }
  }, [modalReservation.isOpen, modalReservation.initialData, getAvailableAccommodations, defaultToday, defaultTomorrow]);

  // Keep accommodationId valid if dates change
  useEffect(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return;
    if (availableAccommodations.length > 0) {
      const isStillAvailable = availableAccommodations.some((a) => a.id === accommodationId);
      if (!isStillAvailable) {
        setAccommodationId(availableAccommodations[0].id);
      }
    } else {
      setAccommodationId('');
    }
  }, [availableAccommodations, accommodationId, checkIn, checkOut]);

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
    setPaymentType('Parcela');
    setPaymentNote('');
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

  if (!modalReservation.isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
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
      const res = updateReservation(editingId, {
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
      const res = createReservation({
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border-2 border-stone-300 overflow-hidden my-auto animate-fadeIn max-h-[94vh] flex flex-col">
        {/* Header - Warm, clear and friendly */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b-2 border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
              {isEdit ? 'Editar Reserva' : 'Cadastrar Nova Reserva'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Preencha os dados abaixo de forma simples e rápida
            </p>
          </div>
          <button
            type="button"
            onClick={closeReservationModal}
            className="p-2 sm:p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200 rounded-2xl transition cursor-pointer"
            title="Fechar janela"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Form Body - Large, easy to read fields */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 text-sm sm:text-base overflow-y-auto flex-1">
          {formError && (
            <div className="p-4 bg-red-50 border-2 border-red-300 text-red-900 font-semibold text-sm rounded-2xl">
              {formError}
            </div>
          )}

          {/* 1. Nome do Hóspede */}
          <div>
            <label className="block text-sm sm:text-base font-bold text-stone-900 mb-1.5">
              1. Nome do Hóspede <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Digite o nome (Ex: Carlos Eduardo)"
                className="w-full px-4 py-3 pl-11 text-stone-900 bg-stone-50 border-2 border-stone-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-base font-medium transition"
                autoFocus
                required
              />
              <User className="w-5 h-5 text-stone-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* 2. Datas de Check-in e Check-out */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm sm:text-base font-bold text-stone-900 mb-1.5">
                2. Data de Entrada <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => {
                    const newCheckIn = e.target.value;
                    setCheckIn(newCheckIn);
                    if (newCheckIn >= checkOut) {
                      setCheckOut(addDays(newCheckIn, 1));
                    }
                  }}
                  className="w-full px-4 py-3 pl-11 text-stone-900 bg-stone-50 border-2 border-stone-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-base font-medium transition cursor-pointer"
                  required
                />
                <Calendar className="w-5 h-5 text-stone-500 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-bold text-stone-900 mb-1.5">
                Data de Saída <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={checkOut}
                  min={addDays(checkIn, 1)}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-4 py-3 pl-11 text-stone-900 bg-stone-50 border-2 border-stone-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-base font-medium transition cursor-pointer"
                  required
                />
                <Calendar className="w-5 h-5 text-stone-500 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 3. Acomodação (Somente disponíveis) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm sm:text-base font-bold text-stone-900">
                3. Escolha o Chalé <span className="text-red-600">*</span>
              </label>
              {availableAccommodations.length > 0 && (
                <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  {availableAccommodations.length} {availableAccommodations.length === 1 ? 'chalé livre' : 'chalés livres'}
                </span>
              )}
            </div>

            <div className="relative">
              {availableAccommodations.length > 0 ? (
                <>
                  <select
                    value={accommodationId}
                    onChange={(e) => setAccommodationId(e.target.value)}
                    className="w-full px-4 py-3.5 pl-11 pr-10 text-stone-900 bg-stone-50 border-2 border-stone-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-base font-bold transition appearance-none cursor-pointer"
                    required
                  >
                    {availableAccommodations.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.nome} ({acc.tipo})
                      </option>
                    ))}
                  </select>
                  <Bed className="w-5 h-5 text-stone-500 absolute left-3.5 top-4 pointer-events-none" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-600">
                    <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </>
              ) : (
                <div className="w-full px-4 py-3.5 pl-11 text-stone-500 bg-stone-100 border-2 border-stone-300 rounded-2xl text-sm sm:text-base italic flex items-center">
                  <Bed className="w-5 h-5 text-stone-400 absolute left-3.5 top-4" />
                  <span>Nenhum chalé disponível para as datas selecionadas</span>
                </div>
              )}
            </div>

            {availableAccommodations.length === 0 && (
              <p className="mt-2 text-xs sm:text-sm text-amber-900 bg-amber-50 border-2 border-amber-300 p-3 rounded-xl font-medium">
                Todos os chalés já estão reservados entre <strong>{formatDateBR(checkIn)}</strong> e <strong>{formatDateBR(checkOut)}</strong>. Por favor, escolha outra data acima.
              </p>
            )}
          </div>

          {/* Conflict Alert if any */}
          {conflictResult.hasConflict && (
            <ConflictAlert conflictingReservation={conflictResult.conflictingReservation} />
          )}

          {/* 4. Valor Total e Cálculos Automáticos */}
          <div>
            <label className="block text-sm sm:text-base font-bold text-stone-900 mb-1.5">
              4. Valor Total da Reserva (R$) <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={totalValueInput}
                onChange={(e) => setTotalValueInput(e.target.value)}
                placeholder="Ex: 1500,00"
                className="w-full px-4 py-3 pl-11 text-stone-900 bg-stone-50 border-2 border-stone-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-lg font-bold transition"
                required
              />
              <DollarSign className="w-5 h-5 text-stone-500 absolute left-3.5 top-3.5" />
            </div>

            {/* Painel Grande de Cálculos Automáticos (Diárias e Média) */}
            <div className="mt-3 p-3 sm:p-3.5 bg-emerald-50/90 rounded-2xl border-2 border-emerald-200 flex items-center justify-between gap-2 overflow-hidden">
              <div className="min-w-0">
                <span className="block text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wider truncate">Valor Total</span>
                <span className="text-lg sm:text-2xl font-black text-emerald-950 tabular-nums truncate block">
                  {formatCurrencyBRL(totalValue)}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5 bg-white/95 border border-emerald-200/90 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 shrink-0 shadow-2xs">
                <div className="text-center sm:text-left">
                  <span className="block text-[9px] sm:text-[10px] font-bold text-stone-500 uppercase tracking-wide">Diárias</span>
                  <span className="text-xs sm:text-sm font-extrabold text-stone-900 tabular-nums">
                    {dailyCount} {dailyCount === 1 ? 'dia' : 'dias'}
                  </span>
                </div>
                <div className="h-6 w-px bg-emerald-200" />
                <div className="text-center sm:text-left">
                  <span className="block text-[9px] sm:text-[10px] font-bold text-stone-500 uppercase tracking-wide">Média/Dia</span>
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-900 tabular-nums">
                    {dailyCount > 0 && totalValue > 0 ? formatCurrencyBRL(averageDaily) : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Canal de venda */}
          <div>
            <label className="block text-sm sm:text-base font-bold text-stone-900 mb-1.5">
              5. Canal de Venda <span className="text-red-600">*</span>
            </label>
            <select
              value={salesChannel}
              onChange={(e) => setSalesChannel(e.target.value as SalesChannel)}
              className="w-full px-4 py-3 text-stone-900 bg-stone-50 border-2 border-stone-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-base font-bold"
            >
              {(['WhatsApp', 'Site', 'Booking', 'Instagram', 'Telefone', 'Recepção'] as SalesChannel[]).map((channel) => (
                <option key={channel} value={channel}>{channel}</option>
              ))}
            </select>
          </div>

          {/* Controle de pagamentos */}
          <div id="payments-section" className="space-y-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-3 sm:p-4 scroll-mt-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-emerald-950">Pagamentos recebidos</h3>
              <p className="text-xs text-stone-500">Adicione o sinal e quantas parcelas forem necessárias.</p>
            </div>

            {payments.length > 0 && (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <div className="min-w-0">
                      <div className="font-bold text-stone-900">{payment.type} · {payment.method}</div>
                      <div className="text-xs text-stone-500">{formatDateBR(payment.paid_at)}{payment.note ? ` · ${payment.note}` : ''}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <strong className="text-emerald-800 tabular-nums">{formatCurrencyBRL(payment.amount)}</strong>
                      <button type="button" onClick={() => removePayment(payment.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" aria-label="Excluir pagamento" title="Excluir pagamento">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-4 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="min-w-0 text-xs font-bold text-stone-700">
                  Tipo do pagamento
                  <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)} className="mt-1.5 w-full rounded-xl border-2 border-stone-300 bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-900">
                    <option value="Sinal">Sinal</option>
                    <option value="Parcela">Parcela</option>
                    <option value="Pagamento final">Pagamento final</option>
                    <option value="Outro">Outro</option>
                  </select>
                </label>
                <label className="min-w-0 text-xs font-bold text-stone-700">
                  Forma de pagamento
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="mt-1.5 w-full rounded-xl border-2 border-stone-300 bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-900">
                    <option value="Pix">Pix</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </label>
                <label className="min-w-0 text-xs font-bold text-stone-700">
                  Data do pagamento
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="mt-1.5 w-full rounded-xl border-2 border-stone-300 bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-900" />
                </label>
                <label className="min-w-0 text-xs font-bold text-stone-700">
                  Valor recebido
                  <input type="text" inputMode="decimal" value={paymentAmountInput} onChange={(e) => setPaymentAmountInput(e.target.value)} placeholder="R$ 0,00" className="mt-1.5 w-full rounded-xl border-2 border-stone-300 bg-stone-50 px-3 py-3 text-sm font-bold text-stone-900" />
                </label>
              </div>
              <label className="block text-xs font-bold text-stone-700">
                Observação (opcional)
                <input type="text" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="Ex.: parcela 1/3" className="mt-1.5 w-full rounded-xl border-2 border-stone-300 bg-stone-50 px-3 py-3 text-sm font-medium text-stone-900" />
              </label>
              <button type="button" onClick={addPayment} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 font-extrabold text-white transition hover:bg-emerald-900">
                <Plus className="h-5 w-5" /> Adicionar pagamento
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-2xl border-2 border-stone-200 bg-stone-50 p-3">
              <div>
                <span className="block text-[10px] font-bold uppercase text-stone-500">Total pago</span>
                <strong className="text-emerald-800 tabular-nums">{formatCurrencyBRL(paidAmount)}</strong>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-stone-500">Falta receber</span>
                <strong className={remainingAmount > 0 ? 'text-amber-800 tabular-nums' : 'text-emerald-800 tabular-nums'}>
                  {formatCurrencyBRL(remainingAmount)}
                </strong>
              </div>
            </div>
          </div>

          {/* Status (when editing) */}
          {isEdit && (
            <div>
              <label className="block text-sm font-bold text-stone-900 mb-1.5">
                Situação da Reserva
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReservationStatus)}
                className="w-full px-4 py-3 text-stone-900 bg-stone-50 border-2 border-stone-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm sm:text-base font-bold"
              >
                <option value="Reservada">Reservada</option>
                <option value="Hospedado">Hospedado (Hóspede já chegou)</option>
                <option value="Finalizada">Finalizada (Hóspede já saiu)</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          )}

          {/* Botão para abrir dados opcionais (Telefone, Documento, etc.) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="flex items-center justify-between w-full py-3 px-4 bg-stone-100 hover:bg-stone-200/80 rounded-2xl text-sm font-bold text-stone-800 border border-stone-300 transition cursor-pointer"
            >
              <span>{showOptionalFields ? '▲ Ocultar dados adicionais' : '▼ Preencher telefone, documento ou placa (opcional)'}</span>
              {showOptionalFields ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {showOptionalFields && (
              <div className="space-y-4 pt-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Telefone / WhatsApp</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="w-full px-4 py-2.5 pl-10 bg-stone-50 border-2 border-stone-300 rounded-xl focus:bg-white text-sm font-medium"
                      />
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">CPF ou RG</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={document}
                        onChange={(e) => setDocument(e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full px-4 py-2.5 pl-10 bg-stone-50 border-2 border-stone-300 rounded-xl focus:bg-white text-sm font-medium"
                      />
                      <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">E-mail do Hóspede</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="hospede@email.com"
                        className="w-full px-4 py-2.5 pl-10 bg-stone-50 border-2 border-stone-300 rounded-xl focus:bg-white text-sm font-medium"
                      />
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Placa do Veículo</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                        placeholder="ABC-1234"
                        className="w-full px-4 py-2.5 pl-10 bg-stone-50 border-2 border-stone-300 rounded-xl focus:bg-white text-sm font-medium uppercase"
                      />
                      <Car className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Observações e Pedidos</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Ex: Cama extra de casal, horário previsto de chegada..."
                    className="w-full px-4 py-2.5 bg-stone-50 border-2 border-stone-300 rounded-xl focus:bg-white text-sm font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação - Grandes e Fáceis */}
          <div className="pt-4 border-t-2 border-stone-200 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeReservationModal}
              className="w-full sm:w-auto px-6 py-3 text-sm sm:text-base font-bold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-2xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                conflictResult.hasConflict ||
                totalValue <= 0 ||
                !guestName.trim() ||
                !accommodationId ||
                availableAccommodations.length === 0
              }
              className="w-full sm:w-auto px-8 py-3.5 text-base sm:text-lg font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              <span>{isEdit ? 'Salvar Alterações' : 'Concluir Reserva'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
