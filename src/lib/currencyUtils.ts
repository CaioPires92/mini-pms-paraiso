/**
 * Formats a number to Brazilian Real (BRL)
 * Example: 1500 -> "R$ 1.500,00"
 */
export function formatCurrencyBRL(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parses user input into a floating point number.
 * Handles both "1500.50" and "1.500,50" or "1500,00".
 */
export function parseCurrencyInput(input: string): number {
  if (!input) return 0;
  // Remove currency symbol and whitespace
  let clean = input.replace(/[R$\s]/g, '').trim();
  // If Brazilian format with thousand dot and decimal comma: "1.500,50"
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}
