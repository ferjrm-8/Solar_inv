export interface SolarRecord {
  id: string; // e.g. "2023-05" or "Mayo 23"
  periodLabel: string; // e.g. "Mayo 23"
  year: number; // 2023
  month: number; // 1 to 12
  monthName: string; // "Mayo"
  cycleLabel?: string; // e.g. "6_23-5_24"
  
  // Generación teórica (kWh)
  string1Teorica: number; // 2,670 kWp (+100°)
  string2Teorica: number; // 2,670 kWp (-80°)
  produccionTeoricaTotal: number; // String 1 + String 2

  // Consumo y expectativas históricas
  realAnterior: number; // Consumo histórico / año anterior (kWh)
  expectativaGasto: number; // Expectativa de gasto (€ o kWh según tabla)

  // Energía real del sistema (kWh)
  consumoTotalReal: number; // Consumo total de la vivienda (kWh)
  produccionReal: number; // Generación solar real de las placas (kWh)
  autoconsumo: number; // Energía solar consumida directamente en el hogar (kWh)
  consumoRed: number; // Energía importada de la red (kWh) = Consumo Total - Autoconsumo
  excedentes: number; // Energía solar vertida a la red (kWh) = Producción Real - Autoconsumo
  diferenciaKwh: number; // Balance energético = Producción Real - Consumo Total

  // Economía y Rentabilidad (€)
  valorAutoconsumo: number; // Valor € del autoconsumo (ahorro en factura por no comprar a la red)
  valorConsumoRed: number; // Coste € de la energía consumida de la red
  valorExcedentes: number; // Ingreso/compensación € por los excedentes inyectados
  diferenciaEuros: number; // Diferencia € = Valor Excedentes - Valor Consumo Red
  quedaBateriaSb: number; // Saldo remanente en Batería Virtual / Solar Bank (€)
  facturaReal: number; // Importe pagado en la factura de la luz (€)
  ahorroDirecto: number; // Ahorro neto directo mensual (€)
  
  // Metadatos
  notas?: string;
  updatedAt?: string;
}

export interface SolarSettings {
  potenciaPicoKw: number; // Potencia instalada (e.g. 5.34 kWp)
  inversionTotal: number; // Inversión total en euros (e.g. 7526 €)
  precioKwhRedMedio: number; // Estimación coste kWh de red (e.g. 0.18 €/kWh)
  precioKwhExcedenteMedio: number; // Estimación remuneración excedentes (e.g. 0.08 €/kWh)
  capacidadBateriaKwh?: number; // Capacidad si tiene batería física o virtual
  nombreSistema: string;
}
