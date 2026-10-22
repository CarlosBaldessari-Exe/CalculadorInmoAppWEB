export type OperationType = 'venta' | 'alquiler_anual' | 'alquiler_temporal' | 'tres_porciento' | 'rentabilidad' | 'itp' | 'irpf';

export type PropertyStatus = 'disponible' | 'reservada' | 'vendida' | 'alquilada';

export type CommissionStatus = 'borrador' | 'pendiente' | 'cobrada' | 'liquidada';

export type UserRole = 'asesor' | 'administrador' | 'broker';

export interface UserProfile {
  uid: string;
  nombre: string;
  email: string;
  porcentajeComisionPersonal: number; // e.g. 0.45 = 45%
  rol: UserRole;
  telefono?: string;
  fotoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Property {
  id: string;
  titulo: string;
  tipoOperacion: 'venta' | 'alquiler_anual' | 'alquiler_temporal';
  precio: number;
  moneda: 'USD' | 'UYU';
  direccion?: string;
  ciudad?: string;
  barrio?: string;
  dormitorios?: number;
  banios?: number;
  metraje?: number;
  anioCompra?: number;
  valorCompra?: number;
  valorCatastral?: number;
  alquilerMensualEstimado?: number;
  gastosAnualesEstimados?: number;
  estado: PropertyStatus;
  propietarioNombre?: string;
  propietarioContacto?: string;
  asesorId: string;
  asesorNombre?: string;
  notas?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommissionRecord {
  id: string;
  propertyId?: string;
  propertyTitulo?: string;
  tipoOperacion: OperationType;
  montoOperacion: number;
  moneda: 'USD' | 'UYU';
  puntas?: number; // 1 o 2
  porcentajeComision?: number; // e.g. 0.03 o 0.06 o 0.10
  comisionInmobiliaria?: number;
  ivaMonto?: number;
  totalComisionConIVA: number;
  porcentajeAsesor?: number; // e.g. 0.45
  comisionAsesor?: number;
  comisionAgencia?: number;
  irpfCalculado?: number;
  itpCalculado?: number;
  rentabilidadBruta?: number;
  rentabilidadNeta?: number;
  estado: CommissionStatus;
  asesorId: string;
  asesorNombre: string;
  clienteNombre?: string;
  fechaOperacion?: string;
  notas?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgencySettings {
  id?: string;
  iva: number; // 0.22
  comisionVentaStandard: number; // 0.03 (1 punta)
  comisionVentaAmbasPuntas: number; // 0.06 (2 puntas)
  comisionAlquilerAnualMeses: number; // 1 mes
  comisionAlquilerTemporalPct: number; // 0.10 (10% IVA inc.)
  comisionTresPorciento: number; // 0.03
  irpfAnt2007: number; // 0.018 (1.8%)
  irpfPost2007: number; // 0.12 (12%)
  itp: number; // 0.02 (2%)
  comisionPersonalDefault: number; // 0.45 (45%)
  updatedBy?: string;
  updatedAt?: string;
}

export interface CalculationResult {
  tipo: OperationType;
  baseAmount: number;
  moneda: 'USD' | 'UYU';
  puntas?: number;
  comisionBruta: number;
  ivaMonto: number;
  totalComisionConIVA: number;
  comisionAsesor: number;
  comisionAgencia: number;
  porcentajeAsesor: number;
  irpf?: number;
  itp?: number;
  rentabilidadBrutaPct?: number;
  rentabilidadNetaPct?: number;
  rentaAnual?: number;
  detalles: { [key: string]: string | number };
}
