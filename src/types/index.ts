export type ReservationStatus = 'Reservada' | 'Hospedado' | 'Finalizada' | 'Cancelada';
export type SalesChannel = 'WhatsApp' | 'Site' | 'Booking' | 'Instagram' | 'Telefone' | 'Recepção';
export type PaymentMethod = 'Pix' | 'Cartão' | 'Dinheiro';
export type PaymentType = 'Pagamento' | 'Sinal' | 'Parcela' | 'Pagamento final' | 'Outro';

export interface ReservationPayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  type: PaymentType;
  paid_at: string; // YYYY-MM-DD
  note?: string;
}

export interface Accommodation {
  id: string;
  nome: string; // Ex: "Chalé Casal 01"
  tipo: string; // Ex: "Chalé Casal"
  ativo: boolean;
  created_at: string; // ISO
}

export interface Reservation {
  id: string;
  guest_name: string; // Obrigatório
  document?: string; // Opcional (CPF/RG)
  phone?: string; // Opcional
  email?: string; // Opcional
  vehicle_plate?: string; // Opcional
  accommodation_id: string; // Obrigatório
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  total_value: number; // Obrigatório (> 0)
  sales_channel?: SalesChannel;
  deposit_amount?: number; // Sinal recebido
  additional_payment_amount?: number; // Demais pagamentos recebidos
  payments?: ReservationPayment[];
  notes?: string; // Opcional
  status: ReservationStatus;
  created_at: string; // ISO
  updated_at: string; // ISO
}

export interface InnSettings {
  inn_name: string;
  phone: string;
  whatsapp: string;
  address: string;
  default_checkin_time: string; // Ex: "14:00"
  default_checkout_time: string; // Ex: "12:00"
}

export interface ReservationCalculations {
  daily_count: number;
  average_daily: number;
}
