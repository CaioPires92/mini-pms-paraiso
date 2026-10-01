import React, { useState } from 'react';
import {
  X,
  Calendar,
  User,
  Phone,
  Mail,
  Car,
  Bed,
  DollarSign,
  Edit3,
  Ban,
  Trash2,
  Printer,
  MessageCircle,
  Store,
  PlusCircle,
} from 'lucide-react';
import { usePms } from '../context/PmsContext';
import { formatDateBR, calculateDailyCount, formatDateFullBR } from '../lib/dateUtils';
import { formatCurrencyBRL } from '../lib/currencyUtils';
import { ReservationStatus } from '../types';
import { getOutstandingAmount, getReservationPayments } from '../lib/paymentUtils';

export const ReservationDetailsModal: React.FC = () => {
  const {
    selectedReservationDetails,
    closeReservationDetails,
    accommodations,
    openEditReservationModal,
    cancelReservation,
    deleteReservation,
    settings,
  } = usePms();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!selectedReservationDetails) return null;

  const res = selectedReservationDetails;
  const acc = accommodations.find((a) => a.id === res.accommodation_id);
  const dailyCount = calculateDailyCount(res.check_in, res.check_out);
  const averageDaily = dailyCount > 0 ? res.total_value / dailyCount : 0;
  const paymentRecords = getReservationPayments(res);
  const remainingAmount = getOutstandingAmount(res);

  const handleEdit = () => {
    closeReservationDetails();
    openEditReservationModal(res);
  };

  const handleAddPayment = () => {
    sessionStorage.setItem('open-payment-form', '1');
    closeReservationDetails();
    openEditReservationModal(res);
    window.setTimeout(() => {
      document.getElementById('payments-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const handleCancel = () => {
    cancelReservation(res.id);
    setConfirmCancel(false);
  };

  const handleDelete = () => {
    deleteReservation(res.id);
    setConfirmDelete(false);
    closeReservationDetails();
  };

  const handlePrint = () => {
    window.print();
  };

  const cleanPhone = res.phone ? res.phone.replace(/\D/g, '') : '';
  const whatsappUrl = cleanPhone
    ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
        `Olá ${res.guest_name}, confirmamos sua reserva na ${settings.inn_name}! Chalé: ${acc?.nome || ''}. Check-in: ${formatDateBR(res.check_in)} a partir das ${settings.default_checkin_time}h.`
      )}`
    : null;

  const statusStyles: Record<ReservationStatus, { bg: string; text: string; label: string }> = {
    Reservada: { bg: 'bg-amber-100 border-amber-400', text: 'text-amber-950', label: 'Em Aberto / Espera' },
    Hospedado: { bg: 'bg-emerald-100 border-emerald-400', text: 'text-emerald-950', label: 'Hospedado Agora' },
    Finalizada: { bg: 'bg-stone-200 border-stone-400', text: 'text-stone-900', label: 'Finalizada' },
    Cancelada: { bg: 'bg-rose-100 border-rose-400', text: 'text-rose-950', label: 'Cancelada' },
  };

  const currentStatusStyle = statusStyles[res.status] || statusStyles['Reservada'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-stone-300 overflow-hidden my-auto animate-fadeIn print:shadow-none print:border-none max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b-2 border-stone-200 flex items-start justify-between bg-stone-50 shrink-0">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">{res.guest_name}</h2>
              <span
                className={`text-xs sm:text-sm px-3.5 py-1.5 rounded-xl border-2 font-black ${currentStatusStyle.bg} ${currentStatusStyle.text}`}
              >
                {currentStatusStyle.label}
              </span>
            </div>
            <p className="text-base font-bold text-emerald-900 mt-1">
              {acc?.nome || 'Chalé'} · <span className="text-stone-600 font-semibold">{acc?.tipo || ''}</span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-stone-500">
              <Store className="h-3.5 w-3.5" /> Canal: {res.sales_channel || 'Não informado'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeReservationDetails}
            className="p-2 sm:p-2.5 text-stone-600 hover:text-stone-950 hover:bg-stone-200 rounded-2xl transition print:hidden cursor-pointer"
            title="Fechar"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 text-sm sm:text-base overflow-y-auto flex-1">
          {/* Período da Hospedagem */}
          <div className="bg-stone-50 border-2 border-stone-200 rounded-2xl p-4 sm:p-5">
            <span className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              Período da Hospedagem
            </span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-medium text-stone-500">Data de Entrada</span>
                <span className="text-lg sm:text-xl font-extrabold text-stone-900 tabular-nums">
                  {formatDateBR(res.check_in)}
                </span>
                <span className="block text-xs text-stone-500 font-medium">a partir de {settings.default_checkin_time}h</span>
              </div>
              <div className="border-l-2 border-stone-200 pl-4">
                <span className="block text-xs font-medium text-stone-500">Data de Saída</span>
                <span className="text-lg sm:text-xl font-extrabold text-stone-900 tabular-nums">
                  {formatDateBR(res.check_out)}
                </span>
                <span className="block text-xs text-stone-500 font-medium">até as {settings.default_checkout_time}h</span>
              </div>
            </div>
          </div>

          {/* Valores financeiros principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <DollarSign className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Valor Total
                  </span>
                  <span className="text-2xl font-black text-emerald-950 tabular-nums block">
                    {formatCurrencyBRL(res.total_value)}
                  </span>
                </div>
            </div>
            <div className={`rounded-2xl border-2 p-4 ${remainingAmount > 0 ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <span className={`block text-xs font-bold uppercase tracking-wider ${remainingAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>Falta receber</span>
              <span className={`block text-2xl font-black tabular-nums ${remainingAmount > 0 ? 'text-amber-950' : 'text-emerald-950'}`}>{formatCurrencyBRL(remainingAmount)}</span>
              <span className="mt-1 block text-xs font-semibold text-stone-600">{dailyCount} {dailyCount === 1 ? 'diária' : 'diárias'} · média {formatCurrencyBRL(averageDaily)}/dia</span>
            </div>
          </div>

          {paymentRecords.length > 0 && (
            <div className="rounded-2xl border-2 border-stone-200 overflow-hidden">
              <div className="bg-stone-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-stone-600">Histórico de pagamentos</div>
              <div className="divide-y divide-stone-200">
                {paymentRecords.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <div className="font-bold text-stone-900">{payment.type} · {payment.method}</div>
                      <div className="text-xs text-stone-500">{formatDateBR(payment.paid_at)}{payment.note ? ` · ${payment.note}` : ''}</div>
                    </div>
                    <strong className="text-emerald-800 tabular-nums">{formatCurrencyBRL(payment.amount)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddPayment}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3.5 font-extrabold text-white shadow-sm transition hover:bg-emerald-800 print:hidden"
          >
            <PlusCircle className="h-5 w-5" />
            Adicionar pagamento
          </button>

          {/* Detalhes de Contato do Hóspede */}
          <div className="space-y-3 border-t-2 border-stone-200 pt-4">
            <span className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
              Contato e Veículo
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center gap-2 text-stone-800">
                  <Phone className="w-5 h-5 text-stone-500 shrink-0" />
                  <div>
                    <span className="block text-xs text-stone-500">Telefone</span>
                    <span className="font-bold text-stone-900">{res.phone || 'Não informado'}</span>
                  </div>
                </div>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl transition"
                    title="Enviar WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                )}
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-2">
                <User className="w-5 h-5 text-stone-500 shrink-0" />
                <div>
                  <span className="block text-xs text-stone-500">Documento / CPF</span>
                  <span className="font-bold text-stone-900">{res.document || 'Não informado'}</span>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-2">
                <Car className="w-5 h-5 text-stone-500 shrink-0" />
                <div>
                  <span className="block text-xs text-stone-500">Placa do Veículo</span>
                  <span className="font-bold text-stone-900">{res.vehicle_plate || 'Não informada'}</span>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-2">
                <Mail className="w-5 h-5 text-stone-500 shrink-0" />
                <div className="truncate">
                  <span className="block text-xs text-stone-500">E-mail</span>
                  <span className="font-bold text-stone-900 truncate block">{res.email || 'Não informado'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          {res.notes && (
            <div className="border-t-2 border-stone-200 pt-4">
              <span className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                Observações
              </span>
              <p className="text-sm font-medium text-stone-800 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                {res.notes}
              </p>
            </div>
          )}

          {/* Confirmações de Cancelar / Excluir */}
          {confirmCancel && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-950 text-sm">
              <p className="font-bold text-base">Deseja realmente cancelar esta reserva?</p>
              <p className="mt-1 text-amber-900">
                O chalé ficará livre para novas reservas no período.
              </p>
              <div className="mt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="px-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Sim, Cancelar Reserva
                </button>
              </div>
            </div>
          )}

          {confirmDelete && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-950 text-sm">
              <p className="font-bold text-base">Tem certeza que deseja excluir esta reserva?</p>
              <p className="mt-1 text-red-900">Esta ação apagará a reserva permanentemente.</p>
              <div className="mt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Sim, Excluir Definitivamente
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions - Lado a lado de forma intuitiva e sem quebras */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-t-2 border-stone-200 bg-stone-50 flex items-center justify-between gap-1.5 sm:gap-2 print:hidden shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 sm:p-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200/80 rounded-xl transition cursor-pointer shrink-0"
              title="Imprimir resumo da reserva"
              aria-label="Imprimir"
            >
              <Printer className="w-5 h-5" />
            </button>

            {res.status !== 'Cancelada' && (
              <button
                type="button"
                onClick={() => {
                  setConfirmCancel(true);
                  setConfirmDelete(false);
                }}
                className="px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-bold text-rose-700 hover:bg-rose-50 bg-white border-2 border-rose-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Cancelar reserva"
              >
                <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Cancelar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setConfirmDelete(true);
                setConfirmCancel(false);
              }}
              className="px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-bold text-stone-600 hover:text-red-700 hover:bg-red-50 bg-white border-2 border-stone-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Excluir reserva do sistema"
            >
              <Trash2 className="w-4 h-4 text-stone-500 shrink-0" />
              <span>Excluir</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleEdit}
            className="px-3.5 sm:px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 rounded-xl transition flex items-center gap-1.5 sm:gap-2 shadow-xs cursor-pointer shrink-0"
            title="Editar dados da reserva"
          >
            <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>Editar<span className="hidden sm:inline"> Reserva</span></span>
          </button>
        </div>
      </div>
    </div>
  );
};
