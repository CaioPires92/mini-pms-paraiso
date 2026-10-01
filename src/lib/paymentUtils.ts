import type { Reservation, ReservationPayment } from '../types';

export function getReservationPayments(reservation: Partial<Reservation>): ReservationPayment[] {
  if (Array.isArray(reservation.payments)) {
    return reservation.payments.map((payment) =>
      payment.type === 'Pagamento final' ? { ...payment, type: 'Pagamento' } : payment,
    );
  }

  const paidAt = reservation.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  const legacy: ReservationPayment[] = [];
  if ((reservation.deposit_amount || 0) > 0) {
    legacy.push({
      id: 'legacy-deposit',
      amount: reservation.deposit_amount || 0,
      method: 'Pix',
      type: 'Sinal',
      paid_at: paidAt,
      note: 'Importado do campo antigo de sinal',
    });
  }
  if ((reservation.additional_payment_amount || 0) > 0) {
    legacy.push({
      id: 'legacy-additional',
      amount: reservation.additional_payment_amount || 0,
      method: 'Pix',
      type: 'Parcela',
      paid_at: paidAt,
      note: 'Importado do campo antigo de pagamento',
    });
  }
  return legacy;
}

export function getPaidAmount(reservation: Partial<Reservation>): number {
  return getReservationPayments(reservation).reduce((sum, payment) => sum + payment.amount, 0);
}

export function getOutstandingAmount(reservation: Partial<Reservation>): number {
  return Math.max(0, (reservation.total_value || 0) - getPaidAmount(reservation));
}
