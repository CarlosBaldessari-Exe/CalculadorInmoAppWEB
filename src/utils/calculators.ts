import { AgencySettings, CalculationResult, OperationType } from '../types';

export const DEFAULT_SETTINGS: AgencySettings = {
  iva: 0.22, // 22%
  comisionVentaStandard: 0.03, // 3% 1 punta
  comisionVentaAmbasPuntas: 0.06, // 6% 2 puntas
  comisionAlquilerAnualMeses: 1, // 1 mes
  comisionAlquilerTemporalPct: 0.10, // 10% IVA inc
  comisionTresPorciento: 0.03, // 3%
  irpfAnt2007: 0.018, // 1.8%
  irpfPost2007: 0.12, // 12%
  itp: 0.02, // 2%
  comisionPersonalDefault: 0.45, // 45% (Mariano)
};

/**
 * 1. Calcular comisión de venta
 * puntas: 1 (3%) o 2 (6%)
 * comision = valorVenta * (puntas == 2 ? 0.06 : 0.03)
 * IVA = comision * 0.22
 * Total = comision + IVA
 * Asesor = Total * split (0.45)
 */
export function calcularComisionVenta(
  valorVenta: number,
  puntas: 1 | 2 = 1,
  splitAsesor: number = DEFAULT_SETTINGS.comisionPersonalDefault,
  settings: AgencySettings = DEFAULT_SETTINGS
): CalculationResult {
  const pct = puntas === 2 ? settings.comisionVentaAmbasPuntas : settings.comisionVentaStandard;
  const comisionBruta = valorVenta * pct;
  const ivaMonto = comisionBruta * settings.iva;
  const totalComisionConIVA = comisionBruta + ivaMonto;
  const comisionAsesor = totalComisionConIVA * splitAsesor;
  const comisionAgencia = totalComisionConIVA - comisionAsesor;

  return {
    tipo: 'venta',
    baseAmount: valorVenta,
    moneda: 'USD',
    puntas,
    comisionBruta,
    ivaMonto,
    totalComisionConIVA,
    comisionAsesor,
    comisionAgencia,
    porcentajeAsesor: splitAsesor,
    detalles: {
      'Valor de Venta': valorVenta,
      'Puntas': puntas === 2 ? 'Ambas puntas (6%)' : 'Una sola punta (3%)',
      'Comisión Inmobiliaria': comisionBruta,
      'IVA (22%)': ivaMonto,
      'Total Comisión + IVA': totalComisionConIVA,
      'Tu Comisión Asesor': comisionAsesor,
      'Ingreso Agencia': comisionAgencia,
    },
  };
}

/**
 * 2. Calcular comisión de alquiler anual
 * valorAlquiler: valor mensual
 * comision = valorAlquiler * 1 mes
 * IVA = comision * 0.22
 * Total = comision + IVA
 * Asesor = Total * split (0.45)
 */
export function calcularComisionAlquilerAnual(
  valorAlquilerMensual: number,
  splitAsesor: number = DEFAULT_SETTINGS.comisionPersonalDefault,
  settings: AgencySettings = DEFAULT_SETTINGS
): CalculationResult {
  const comisionBruta = valorAlquilerMensual * settings.comisionAlquilerAnualMeses;
  const ivaMonto = comisionBruta * settings.iva;
  const totalComisionConIVA = comisionBruta + ivaMonto;
  const comisionAsesor = totalComisionConIVA * splitAsesor;
  const comisionAgencia = totalComisionConIVA - comisionAsesor;

  return {
    tipo: 'alquiler_anual',
    baseAmount: valorAlquilerMensual,
    moneda: 'UYU',
    comisionBruta,
    ivaMonto,
    totalComisionConIVA,
    comisionAsesor,
    comisionAgencia,
    porcentajeAsesor: splitAsesor,
    detalles: {
      'Alquiler Mensual': valorAlquilerMensual,
      'Honorarios (1 mes)': comisionBruta,
      'IVA (22%)': ivaMonto,
      'Total Comisión + IVA': totalComisionConIVA,
      'Tu Comisión Asesor': comisionAsesor,
      'Ingreso Agencia': comisionAgencia,
    },
  };
}

/**
 * 3. Calcular comisión de alquiler temporal
 * valorAlqTemp: valor total del contrato
 * comision = valorAlqTemp * 0.10 (IVA incluido)
 * Asesor = comision * split (0.45)
 */
export function calcularComisionAlquilerTemporal(
  valorTotalAlquiler: number,
  splitAsesor: number = DEFAULT_SETTINGS.comisionPersonalDefault,
  settings: AgencySettings = DEFAULT_SETTINGS
): CalculationResult {
  const comisionBruta = valorTotalAlquiler * settings.comisionAlquilerTemporalPct;
  // En Uruguay alquiler temporal 10% suele expresarse IVA inc.
  const ivaMonto = comisionBruta - (comisionBruta / (1 + settings.iva));
  const totalComisionConIVA = comisionBruta;
  const comisionAsesor = totalComisionConIVA * splitAsesor;
  const comisionAgencia = totalComisionConIVA - comisionAsesor;

  return {
    tipo: 'alquiler_temporal',
    baseAmount: valorTotalAlquiler,
    moneda: 'USD',
    comisionBruta,
    ivaMonto,
    totalComisionConIVA,
    comisionAsesor,
    comisionAgencia,
    porcentajeAsesor: splitAsesor,
    detalles: {
      'Total Alquiler Temporal': valorTotalAlquiler,
      'Comisión Inmobiliaria (10% IVA inc.)': comisionBruta,
      'IVA estimado discriminado': ivaMonto,
      'Total Comisión': totalComisionConIVA,
      'Tu Comisión Asesor': comisionAsesor,
      'Ingreso Agencia': comisionAgencia,
    },
  };
}

/**
 * 4. Calcular comisión del 3% sobre el precio de la casa
 */
export function calcularComisionTresPorciento(
  valorCasa: number,
  splitAsesor: number = DEFAULT_SETTINGS.comisionPersonalDefault,
  settings: AgencySettings = DEFAULT_SETTINGS
): CalculationResult {
  const comisionBruta = valorCasa * settings.comisionTresPorciento;
  const ivaMonto = comisionBruta * settings.iva;
  const totalComisionConIVA = comisionBruta + ivaMonto;
  const comisionAsesor = totalComisionConIVA * splitAsesor;
  const comisionAgencia = totalComisionConIVA - comisionAsesor;

  return {
    tipo: 'tres_porciento',
    baseAmount: valorCasa,
    moneda: 'USD',
    comisionBruta,
    ivaMonto,
    totalComisionConIVA,
    comisionAsesor,
    comisionAgencia,
    porcentajeAsesor: splitAsesor,
    detalles: {
      'Precio de la Propiedad': valorCasa,
      'Comisión (3%)': comisionBruta,
      'IVA (22%)': ivaMonto,
      'Total Comisión + IVA': totalComisionConIVA,
      'Tu Comisión Asesor': comisionAsesor,
      'Ingreso Agencia': comisionAgencia,
    },
  };
}

/**
 * 5. Calcular IRPF (Incrementos Patrimoniales / Compraventa en Uruguay)
 * Si anioCompra < 2007: 1.8% sobre valor de venta (ficto)
 * Si anioCompra >= 2007: 12% sobre ganancia (venta - compra)
 */
export function calcularIRPF(
  valorVenta: number,
  anioCompra: number,
  valorCompra: number = 0,
  settings: AgencySettings = DEFAULT_SETTINGS
) {
  const esAnterior2007 = anioCompra < 2007;
  let montoIRPF = 0;
  let ganancia = 0;

  if (esAnterior2007) {
    montoIRPF = valorVenta * settings.irpfAnt2007;
  } else {
    ganancia = Math.max(0, valorVenta - valorCompra);
    montoIRPF = ganancia * settings.irpfPost2007;
  }

  return {
    tipo: 'irpf' as OperationType,
    montoIRPF,
    esAnterior2007,
    ganancia,
    anioCompra,
    valorVenta,
    valorCompra,
    tasaAplicada: esAnterior2007 ? `${(settings.irpfAnt2007 * 100).toFixed(1)}% (Ficto ant. 2007)` : `${(settings.irpfPost2007 * 100).toFixed(0)}% s/Ganancia`,
  };
}

/**
 * 6. Calcular ITP (Impuesto a las Transmisiones Patrimoniales)
 * 2% sobre el valor catastral del inmueble
 */
export function calcularITP(
  valorCatastral: number,
  settings: AgencySettings = DEFAULT_SETTINGS
) {
  const itpMonto = valorCatastral * settings.itp;
  return {
    tipo: 'itp' as OperationType,
    valorCatastral,
    itpMonto,
    tasa: `${(settings.itp * 100).toFixed(0)}%`,
  };
}

/**
 * 7. Calcular Rentabilidad Anual (Bruta y Neta)
 * Renta anual = valor mensual * 12
 * Rentabilidad bruta % = (renta anual / precio propiedad) * 100
 * Rentabilidad neta % = ((renta anual - gastos anuales) / precio propiedad) * 100
 */
export function calcularRentabilidadAnual(
  valorMensualAlquiler: number,
  precioPropiedad: number,
  gastosAnuales: number = 0
) {
  const rentaAnual = valorMensualAlquiler * 12;
  const rentabilidadBrutaPct = precioPropiedad > 0 ? (rentaAnual / precioPropiedad) * 100 : 0;
  const rentaNetaAnual = rentaAnual - gastosAnuales;
  const rentabilidadNetaPct = precioPropiedad > 0 ? (rentaNetaAnual / precioPropiedad) * 100 : 0;

  return {
    tipo: 'rentabilidad' as OperationType,
    valorMensualAlquiler,
    precioPropiedad,
    gastosAnuales,
    rentaAnual,
    rentaNetaAnual,
    rentabilidadBrutaPct,
    rentabilidadNetaPct,
  };
}

/**
 * Formateador de moneda en español
 */
export function formatCurrency(amount: number, moneda: 'USD' | 'UYU' = 'USD'): string {
  const symbol = moneda === 'USD' ? 'US$' : '$U';
  return `${symbol} ${Number(amount || 0).toLocaleString('es-UY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPct(val: number): string {
  return `${(Number(val || 0) * 100).toFixed(1)}%`;
}
