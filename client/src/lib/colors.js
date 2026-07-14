// Paleta categórica validada (colorblind-safe) del sistema de dataviz.
// Orden fijo — nunca cíclico. Se asigna en orden a las series.
export const CATEGORICAL = [
  '#2a78d6', // blue
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
  '#e87ba4', // magenta
  '#eb6834', // orange
];

// Colores semánticos para ingresos / gastos / balance.
export const INCOME_COLOR = '#0ca30c'; // status good
export const EXPENSE_COLOR = '#d03b3b'; // status critical
export const BALANCE_COLOR = '#2a78d6'; // brand blue

// Devuelve el color por índice, con fallback al gris "Otros".
export function seriesColor(i) {
  return CATEGORICAL[i % CATEGORICAL.length] || '#94a3b8';
}
