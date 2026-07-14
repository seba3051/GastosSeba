// Formateo de moneda y fechas. Cambiá `LOCALE` / `CURRENCY` a tu preferencia.
const LOCALE = 'es-AR';
const CURRENCY = 'ARS';

const currencyFmt = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 2,
});

export function money(value) {
  return currencyFmt.format(Number(value) || 0);
}

export function shortDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function firstOfMonthISO(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}
