/**
 * Date utility functions for Pousada Paraíso
 * Enforces Brazilian format (DD/MM/AAAA) and America/Sao_Paulo timezone.
 */

// Pad single digits
export function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD in America/Sao_Paulo timezone.
 */
export function getTodaySaoPaulo(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

/**
 * Converts a YYYY-MM-DD string to a Date object at midnight local time.
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // Noon to prevent DST timezone edge cases
}

/**
 * Formats YYYY-MM-DD to Brazilian DD/MM/AAAA.
 * Example: "2026-09-29" -> "29/09/2026"
 */
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

/**
 * Formats YYYY-MM-DD to Brazilian short day/month DD/MM.
 * Example: "2026-09-29" -> "29/09"
 */
export function formatDateShortBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

/**
 * Formats date to full human readable Portuguese string:
 * "Terça-feira, 29 de setembro de 2026"
 */
export function formatDateFullBR(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseDateString(dateStr);
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Gets day of week abbreviation in Portuguese (Dom, Seg, Ter, Qua, Qui, Sex, Sáb).
 */
export function getWeekdayShortBR(dateStr: string): string {
  const date = parseDateString(dateStr);
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    timeZone: 'America/Sao_Paulo',
  });
  const text = formatter.format(date).replace('.', '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Calculates number of nights/diárias between check-in and check-out.
 * Formula: check_out - check_in in days.
 */
export function calculateDailyCount(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const dIn = parseDateString(checkIn);
  const dOut = parseDateString(checkOut);
  const diffTime = dOut.getTime() - dIn.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Adds N days to a YYYY-MM-DD string.
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = padZero(d.getMonth() + 1);
  const day = padZero(d.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * Generates an array of date strings [YYYY-MM-DD, ...] starting at startDate for numDays.
 */
export function generateDateRange(startDateStr: string, numDays: number): string[] {
  const dates: string[] = [];
  let current = startDateStr;
  for (let i = 0; i < numDays; i++) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

/**
 * Calculates day offset between targetDate and baseDate (can be positive or negative).
 */
export function getDayOffset(targetDate: string, baseDate: string): number {
  if (!targetDate || !baseDate) return 0;
  const dBase = parseDateString(baseDate);
  const dTarget = parseDateString(targetDate);
  const diffTime = dTarget.getTime() - dBase.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Gets day number string (e.g. "29", "01").
 */
export function getDayNumber(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return parts.length === 3 ? parts[2] : dateStr;
}

/**
 * Gets short month uppercase in Portuguese (e.g. "SET", "OUT", "NOV").
 */
export function getMonthShortBR(dateStr: string): string {
  const date = parseDateString(dateStr);
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  });
  return formatter.format(date).replace('.', '').toUpperCase();
}

/**
 * Checks if two date ranges overlap in a hotel PMS context.
 * A guest leaves on check-out day at 12:00, and next guest arrives on check-in day at 14:00.
 * Therefore, [A_in, A_out] overlaps with [B_in, B_out] only if:
 * A_in < B_out AND A_out > B_in.
 * If A_out == B_in, they do NOT overlap (same-day turnover).
 */
export function isDateRangeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Determines whether a date YYYY-MM-DD is today in São Paulo.
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodaySaoPaulo();
}

/**
 * Checks if a reservation's checkout date/time has passed.
 * Returns true if checkOut date is before today, or if today and past checkout time.
 */
export function isReservationPast(checkOut: string, checkoutTime: string = '12:00'): boolean {
  if (!checkOut) return false;
  const today = getTodaySaoPaulo();
  if (checkOut < today) {
    return true;
  }
  if (checkOut === today) {
    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const currentTimeStr = timeFormatter.format(now);
    return currentTimeStr >= checkoutTime;
  }
  return false;
}
