export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Calculates the cycle label based on year, month, and the chosen cycle start month (1-12).
 * e.g., if startMonth = 6 (June), and month is 5 (May) of 2023: "6_22-5_23"
 * e.g., if startMonth = 6, and month is 6 (June) of 2023: "6_23-5_24"
 * e.g., if startMonth = 1 (January, calendar year): "1_23-12_23"
 */
export function getCycleLabelForMonth(year: number, month: number, startMonth: number = 6): string {
  const shortYearNum = year % 100;
  const shortYear = shortYearNum < 10 ? `0${shortYearNum}` : `${shortYearNum}`;

  if (startMonth === 1) {
    return `1_${shortYear}-12_${shortYear}`;
  }

  const endMonth = startMonth - 1;

  if (month >= startMonth) {
    const nextYearNum = (year + 1) % 100;
    const nextYear = nextYearNum < 10 ? `0${nextYearNum}` : `${nextYearNum}`;
    return `${startMonth}_${shortYear}-${endMonth}_${nextYear}`;
  } else {
    const prevYearNum = (year - 1) % 100;
    const prevYear = prevYearNum < 10 ? `0${prevYearNum}` : `${prevYearNum}`;
    return `${startMonth}_${prevYear}-${endMonth}_${shortYear}`;
  }
}

/**
 * Generates user-friendly description of a cycle start month
 */
export function getCycleDescription(startMonth: number): string {
  const endMonth = startMonth === 1 ? 12 : startMonth - 1;
  const startName = MONTH_NAMES[startMonth - 1];
  const endName = MONTH_NAMES[endMonth - 1];
  if (startMonth === 1) {
    return `${startName} a ${endName} (Año natural)`;
  }
  if (startMonth === 6) {
    return `${startName} a ${endName} (Ciclo fotovoltaico habitual)`;
  }
  return `${startName} a ${endName}`;
}
