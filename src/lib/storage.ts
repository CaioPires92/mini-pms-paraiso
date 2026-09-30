import { Accommodation, Reservation, InnSettings } from '../types';
import { getTodaySaoPaulo, addDays, isReservationPast } from './dateUtils';

const STORAGE_KEYS = {
  ACCOMMODATIONS: 'pousada_paraiso_accommodations_v3',
  RESERVATIONS: 'pousada_paraiso_reservations_v3',
  SETTINGS: 'pousada_paraiso_settings_v1',
};

export const DEFAULT_SETTINGS: InnSettings = {
  inn_name: 'Pousada Paraíso',
  phone: '(12) 3894-1234',
  whatsapp: '(12) 99876-5432',
  address: 'Rua das Bromélias, 150 - Praia Grande, Ubatuba - SP',
  default_checkin_time: '14:00',
  default_checkout_time: '12:00',
};

export const INITIAL_ACCOMMODATIONS: Accommodation[] = [
  // 3 Suítes de 1 Quarto
  {
    id: 'acc_suite_1q_01',
    nome: 'Suíte 01',
    tipo: 'Suíte de 1 Quarto',
    ativo: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'acc_suite_1q_02',
    nome: 'Suíte 02',
    tipo: 'Suíte de 1 Quarto',
    ativo: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'acc_suite_1q_03',
    nome: 'Suíte 03',
    tipo: 'Suíte de 1 Quarto',
    ativo: true,
    created_at: new Date('2026-01-01').toISOString(),
  },

  // 3 Chalés Casal / Cozinha Completa
  {
    id: 'acc_chale_casal_01',
    nome: 'Chalé Casal 01',
    tipo: 'Chalé Casal / Cozinha Completa',
    ativo: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'acc_chale_casal_02',
    nome: 'Chalé Casal 02',
    tipo: 'Chalé Casal / Cozinha Completa',
    ativo: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'acc_chale_casal_03',
    nome: 'Chalé Casal 03',
    tipo: 'Chalé Casal / Cozinha Completa',
    ativo: true,
    created_at: new Date('2026-01-01').toISOString(),
  },

  // 2 Chalés Familiar 4 Pessoas / Cozinha Completa
  {
    id: 'acc_chale_familia_01',
    nome: 'Chalé Familiar 01',
    tipo: 'Chalé Familiar 4 Pessoas / Cozinha Completa',
    ativo: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'acc_chale_familia_02',
    nome: 'Chalé Familiar 02',
    tipo: 'Chalé Familiar 4 Pessoas / Cozinha Completa',
    ativo: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
];

export function generateInitialReservations(): Reservation[] {
  const today = getTodaySaoPaulo();

  return [
    {
      id: 'res_01',
      guest_name: 'João Silva',
      document: '234.567.890-12',
      phone: '(11) 98765-4321',
      email: 'joao.silva@email.com',
      vehicle_plate: 'ABC-1234',
      accommodation_id: 'acc_suite_1q_01',
      check_in: addDays(today, -2),
      check_out: addDays(today, 1),
      total_value: 1200.0,
      notes: 'Solicitou berço extra e cama de casal queen.',
      status: 'Hospedado',
      created_at: new Date('2026-09-20').toISOString(),
      updated_at: new Date('2026-09-20').toISOString(),
    },
    {
      id: 'res_02',
      guest_name: 'Maria Santos',
      document: '345.678.901-23',
      phone: '(11) 97654-3210',
      email: 'maria.santos@email.com',
      vehicle_plate: 'XYZ-9876',
      accommodation_id: 'acc_suite_1q_02',
      check_in: addDays(today, -3),
      check_out: today, // Saída hoje até às 12h
      total_value: 1350.0,
      notes: 'Check-out previsto para as 11:30.',
      status: 'Hospedado',
      created_at: new Date('2026-09-18').toISOString(),
      updated_at: new Date('2026-09-18').toISOString(),
    },
    {
      id: 'res_03',
      guest_name: 'Pedro Henrique Oliveira',
      document: '456.789.012-34',
      phone: '(19) 99123-4567',
      email: 'pedro.oliveira@email.com',
      vehicle_plate: 'BRA-2E19',
      accommodation_id: 'acc_suite_1q_02',
      check_in: today, // Entrada hoje a partir das 14h (Encaixe no mesmo dia!)
      check_out: addDays(today, 3),
      total_value: 1500.0,
      notes: 'Chegada prevista após as 15:00. Comemoração de aniversário.',
      status: 'Reservada',
      created_at: new Date('2026-09-22').toISOString(),
      updated_at: new Date('2026-09-22').toISOString(),
    },
    {
      id: 'res_04',
      guest_name: 'Carlos Eduardo Lima',
      document: '567.890.123-45',
      phone: '(21) 98888-7777',
      email: 'carlos.lima@email.com',
      vehicle_plate: 'RIO-4F50',
      accommodation_id: 'acc_chale_casal_01',
      check_in: today,
      check_out: addDays(today, 4),
      total_value: 2800.0,
      notes: 'Casal em viagem romântica.',
      status: 'Reservada',
      created_at: new Date('2026-09-24').toISOString(),
      updated_at: new Date('2026-09-24').toISOString(),
    },
    {
      id: 'res_05',
      guest_name: 'Roberto Mendes',
      document: '678.901.234-56',
      phone: '(12) 99777-6655',
      email: 'roberto.mendes@email.com',
      vehicle_plate: 'UBT-8822',
      accommodation_id: 'acc_chale_casal_02',
      check_in: addDays(today, -1),
      check_out: addDays(today, 2),
      total_value: 1650.0,
      notes: 'Hóspede frequente.',
      status: 'Hospedado',
      created_at: new Date('2026-09-25').toISOString(),
      updated_at: new Date('2026-09-25').toISOString(),
    },
    {
      id: 'res_06',
      guest_name: 'Ana Paula Rocha',
      document: '789.012.345-67',
      phone: '(31) 99222-3344',
      email: 'anapaula@email.com',
      vehicle_plate: 'BHZ-3030',
      accommodation_id: 'acc_chale_familia_01',
      check_in: addDays(today, 2),
      check_out: addDays(today, 6),
      total_value: 3200.0,
      notes: 'Família com 4 pessoas. Solicitou late check-in se possível.',
      status: 'Reservada',
      created_at: new Date('2026-09-26').toISOString(),
      updated_at: new Date('2026-09-26').toISOString(),
    },
  ];
}

export function getStoredAccommodations(): Accommodation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOMMODATIONS);
    if (!raw) {
      saveAccommodations(INITIAL_ACCOMMODATIONS);
      return INITIAL_ACCOMMODATIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_ACCOMMODATIONS;
  } catch (e) {
    console.error('Error reading accommodations from localStorage:', e);
    return INITIAL_ACCOMMODATIONS;
  }
}

export function saveAccommodations(data: Accommodation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOMMODATIONS, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving accommodations to localStorage:', e);
  }
}

export function getStoredReservations(): Reservation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    if (!raw) {
      const initial = generateInitialReservations();
      saveReservations(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      let needsSave = false;
      const normalized = parsed.map((res: Reservation) => {
        if (res.status !== 'Cancelada' && res.status !== 'Finalizada' && isReservationPast(res.check_out)) {
          needsSave = true;
          return { ...res, status: 'Finalizada' as const };
        }
        return res;
      });
      if (needsSave) {
        saveReservations(normalized);
      }
      return normalized;
    }
    return [];
  } catch (e) {
    console.error('Error reading reservations from localStorage:', e);
    return [];
  }
}

export function saveReservations(data: Reservation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving reservations to localStorage:', e);
  }
}

export function getStoredSettings(): InnSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error reading settings from localStorage:', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(data: InnSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving settings to localStorage:', e);
  }
}

export function resetAllDataToDefault(): {
  accommodations: Accommodation[];
  reservations: Reservation[];
  settings: InnSettings;
} {
  saveAccommodations(INITIAL_ACCOMMODATIONS);
  const initialReservations = generateInitialReservations();
  saveReservations(initialReservations);
  saveSettings(DEFAULT_SETTINGS);

  return {
    accommodations: INITIAL_ACCOMMODATIONS,
    reservations: initialReservations,
    settings: DEFAULT_SETTINGS,
  };
}
