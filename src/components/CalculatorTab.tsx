import React, { useState, useEffect } from 'react';
import { Property, AgencySettings, OperationType, CommissionRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  calcularComisionVenta,
  calcularComisionAlquilerAnual,
  calcularComisionAlquilerTemporal,
  calcularComisionTresPorciento,
  calcularIRPF,
  calcularITP,
  calcularRentabilidadAnual,
  formatCurrency,
  formatPct,
} from '../utils/calculators';
import { addCommission } from '../services/firestoreService';
import {
  Calculator,
  Save,
  CheckCircle,
  TrendingUp,
  Percent,
  FileSpreadsheet,
  Building,
  DollarSign,
  Receipt,
  FileCheck,
  Share2,
} from 'lucide-react';

interface CalculatorTabProps {
  properties: Property[];
  settings: AgencySettings;
  onOpenDealSheet: (data: {
    propertyTitulo?: string;
    montoOperacion: number;
    moneda: 'USD' | 'UYU';
    comisionBruta: number;
    ivaMonto: number;
    totalComision: number;
    comisionAsesor: number;
    irpf?: number;
    itp?: number;
    rentabilidadBruta?: number;
    rentabilidadNeta?: number;
    detalles: Record<string, string | number>;
  }) => void;
  preselectedProperty?: Property | null;
  onNavigateToYield?: () => void;
}

export const CalculatorTab: React.FC<CalculatorTabProps> = ({
  properties,
  settings,
  onOpenDealSheet,
  preselectedProperty,
  onNavigateToYield,
}) => {
  const { user, userProfile, signInWithGoogle } = useAuth();
  const personalSplit = userProfile?.porcentajeComisionPersonal ?? settings.comisionPersonalDefault;

  // Selected calculation mode (matches Principal.java menu)
  const [activeMode, setActiveMode] = useState<OperationType>('venta');

  // Input fields
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [montoVenta, setMontoVenta] = useState<number>(250000);
  const [puntas, setPuntas] = useState<1 | 2>(1); // 1 = 3%, 2 = 6%
  const [moneda, setMoneda] = useState<'USD' | 'UYU'>('USD');

  const [alquilerMensual, setAlquilerMensual] = useState<number>(35000);
  const [monedaAlquiler, setMonedaAlquiler] = useState<'USD' | 'UYU'>('UYU');

  const [alquilerTemporalMonto, setAlquilerTemporalMonto] = useState<number>(4500);

  const [anioCompra, setAnioCompra] = useState<number>(2015);
  const [valorCompra, setValorCompra] = useState<number>(180000);

  const [valorCatastral, setValorCatastral] = useState<number>(2500000);

  const [gastosAnuales, setGastosAnuales] = useState<number>(2000);

  // Notes and customer name for saving to Firebase
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // If a property was preselected (e.g. from the properties tab "Calcular")
  useEffect(() => {
    if (preselectedProperty) {
      setSelectedPropertyId(preselectedProperty.id);
      if (preselectedProperty.tipoOperacion === 'venta') {
        setActiveMode('venta');
        setMontoVenta(preselectedProperty.precio);
        setMoneda(preselectedProperty.moneda);
      } else if (preselectedProperty.tipoOperacion === 'alquiler_anual') {
        setActiveMode('alquiler_anual');
        setAlquilerMensual(preselectedProperty.precio);
        setMonedaAlquiler(preselectedProperty.moneda);
      } else if (preselectedProperty.tipoOperacion === 'alquiler_temporal') {
        setActiveMode('alquiler_temporal');
        setAlquilerTemporalMonto(preselectedProperty.precio);
      }

      if (preselectedProperty.anioCompra) setAnioCompra(preselectedProperty.anioCompra);
      if (preselectedProperty.valorCompra) setValorCompra(preselectedProperty.valorCompra);
      if (preselectedProperty.valorCatastral) setValorCatastral(preselectedProperty.valorCatastral);
      if (preselectedProperty.alquilerMensualEstimado) setAlquilerMensual(preselectedProperty.alquilerMensualEstimado);
      if (preselectedProperty.gastosAnualesEstimados) setGastosAnuales(preselectedProperty.gastosAnualesEstimados);
    }
  }, [preselectedProperty]);

  // When dropdown property changes
  const handlePropertySelect = (propId: string) => {
    setSelectedPropertyId(propId);
    const prop = properties.find((p) => p.id === propId);
    if (!prop) return;

    if (prop.tipoOperacion === 'venta') {
      setActiveMode('venta');
      setMontoVenta(prop.precio);
      setMoneda(prop.moneda);
    } else if (prop.tipoOperacion === 'alquiler_anual') {
      setActiveMode('alquiler_anual');
      setAlquilerMensual(prop.precio);
      setMonedaAlquiler(prop.moneda);
    } else if (prop.tipoOperacion === 'alquiler_temporal') {
      setActiveMode('alquiler_temporal');
      setAlquilerTemporalMonto(prop.precio);
    }

    if (prop.anioCompra) setAnioCompra(prop.anioCompra);
    if (prop.valorCompra) setValorCompra(prop.valorCompra);
    if (prop.valorCatastral) setValorCatastral(prop.valorCatastral);
    if (prop.alquilerMensualEstimado) setAlquilerMensual(prop.alquilerMensualEstimado);
    if (prop.gastosAnualesEstimados) setGastosAnuales(prop.gastosAnualesEstimados);
  };

  // Calculations
  const ventaCalc = calcularComisionVenta(montoVenta, puntas, personalSplit, settings);
  const alqAnualCalc = calcularComisionAlquilerAnual(alquilerMensual, personalSplit, settings);
  const alqTempCalc = calcularComisionAlquilerTemporal(alquilerTemporalMonto, personalSplit, settings);
  const tresPorcCalc = calcularComisionTresPorciento(montoVenta, personalSplit, settings);
  const irpfCalc = calcularIRPF(montoVenta, anioCompra, valorCompra, settings);
  const itpCalc = calcularITP(valorCatastral, settings);
  const rentabilidadCalc = calcularRentabilidadAnual(alquilerMensual, montoVenta, gastosAnuales);

  // Save current calculation to Firebase
  const handleSaveToFirebase = async () => {
    if (!user) {
      try {
        await signInWithGoogle();
      } catch (err) {
        console.warn('Sign-in cancelled or failed:', err);
        return;
      }
    }
    setSaving(true);
    try {
      const selectedProp = properties.find((p) => p.id === selectedPropertyId);
      const advisorId = user?.uid || userProfile?.uid || 'asesor_local';
      const advisorName = userProfile?.nombre || user?.displayName || 'Mariano Baldessari';

      let payload: Omit<CommissionRecord, 'id'>;

      if (activeMode === 'venta') {
        payload = {
          propertyId: selectedProp?.id,
          propertyTitulo: selectedProp?.titulo || `Venta ${formatCurrency(montoVenta, moneda)}`,
          tipoOperacion: 'venta',
          montoOperacion: montoVenta,
          moneda,
          puntas,
          porcentajeComision: puntas === 2 ? settings.comisionVentaAmbasPuntas : settings.comisionVentaStandard,
          comisionInmobiliaria: ventaCalc.comisionBruta,
          ivaMonto: ventaCalc.ivaMonto,
          totalComisionConIVA: ventaCalc.totalComisionConIVA,
          porcentajeAsesor: personalSplit,
          comisionAsesor: ventaCalc.comisionAsesor,
          comisionAgencia: ventaCalc.comisionAgencia,
          irpfCalculado: irpfCalc.montoIRPF,
          itpCalculado: itpCalc.itpMonto,
          estado: 'pendiente',
          asesorId: advisorId,
          asesorNombre: advisorName,
          clienteNombre: clienteNombre || undefined,
          fechaOperacion: new Date().toISOString().split('T')[0],
          notas: notas || undefined,
        };
      } else if (activeMode === 'alquiler_anual') {
        payload = {
          propertyId: selectedProp?.id,
          propertyTitulo: selectedProp?.titulo || `Alquiler Anual ${formatCurrency(alquilerMensual, monedaAlquiler)}`,
          tipoOperacion: 'alquiler_anual',
          montoOperacion: alquilerMensual,
          moneda: monedaAlquiler,
          comisionInmobiliaria: alqAnualCalc.comisionBruta,
          ivaMonto: alqAnualCalc.ivaMonto,
          totalComisionConIVA: alqAnualCalc.totalComisionConIVA,
          porcentajeAsesor: personalSplit,
          comisionAsesor: alqAnualCalc.comisionAsesor,
          comisionAgencia: alqAnualCalc.comisionAgencia,
          rentabilidadBruta: rentabilidadCalc.rentabilidadBrutaPct,
          estado: 'pendiente',
          asesorId: advisorId,
          asesorNombre: advisorName,
          clienteNombre: clienteNombre || undefined,
          fechaOperacion: new Date().toISOString().split('T')[0],
          notas: notas || undefined,
        };
      } else if (activeMode === 'alquiler_temporal') {
        payload = {
          propertyId: selectedProp?.id,
          propertyTitulo: selectedProp?.titulo || `Alquiler Temporal ${formatCurrency(alquilerTemporalMonto, 'USD')}`,
          tipoOperacion: 'alquiler_temporal',
          montoOperacion: alquilerTemporalMonto,
          moneda: 'USD',
          comisionInmobiliaria: alqTempCalc.comisionBruta,
          ivaMonto: alqTempCalc.ivaMonto,
          totalComisionConIVA: alqTempCalc.totalComisionConIVA,
          porcentajeAsesor: personalSplit,
          comisionAsesor: alqTempCalc.comisionAsesor,
          comisionAgencia: alqTempCalc.comisionAgencia,
          estado: 'pendiente',
          asesorId: advisorId,
          asesorNombre: advisorName,
          clienteNombre: clienteNombre || undefined,
          fechaOperacion: new Date().toISOString().split('T')[0],
          notas: notas || undefined,
        };
      } else {
        // tres_porciento
        payload = {
          propertyId: selectedProp?.id,
          propertyTitulo: selectedProp?.titulo || `Comisión 3% sobre ${formatCurrency(montoVenta, moneda)}`,
          tipoOperacion: 'tres_porciento',
          montoOperacion: montoVenta,
          moneda,
          comisionInmobiliaria: tresPorcCalc.comisionBruta,
          ivaMonto: tresPorcCalc.ivaMonto,
          totalComisionConIVA: tresPorcCalc.totalComisionConIVA,
          porcentajeAsesor: personalSplit,
          comisionAsesor: tresPorcCalc.comisionAsesor,
          comisionAgencia: tresPorcCalc.comisionAgencia,
          estado: 'pendiente',
          asesorId: advisorId,
          asesorNombre: advisorName,
          clienteNombre: clienteNombre || undefined,
          fechaOperacion: new Date().toISOString().split('T')[0],
          notas: notas || undefined,
        };
      }

      await addCommission(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Error saving commission to Firebase:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPrintModal = () => {
    const selectedProp = properties.find((p) => p.id === selectedPropertyId);
    let result = ventaCalc;
    let base = montoVenta;
    let curr = moneda;

    if (activeMode === 'alquiler_anual') {
      result = alqAnualCalc;
      base = alquilerMensual;
      curr = monedaAlquiler;
    } else if (activeMode === 'alquiler_temporal') {
      result = alqTempCalc;
      base = alquilerTemporalMonto;
      curr = 'USD';
    } else if (activeMode === 'tres_porciento') {
      result = tresPorcCalc;
      base = montoVenta;
      curr = moneda;
    }

    onOpenDealSheet({
      propertyTitulo: selectedProp?.titulo,
      montoOperacion: base,
      moneda: curr,
      comisionBruta: result.comisionBruta,
      ivaMonto: result.ivaMonto,
      totalComision: result.totalComisionConIVA,
      comisionAsesor: result.comisionAsesor,
      irpf: activeMode === 'venta' || activeMode === 'irpf' ? irpfCalc.montoIRPF : undefined,
      itp: activeMode === 'venta' || activeMode === 'itp' ? itpCalc.itpMonto : undefined,
      rentabilidadBruta: activeMode === 'rentabilidad' ? rentabilidadCalc.rentabilidadBrutaPct : undefined,
      rentabilidadNeta: activeMode === 'rentabilidad' ? rentabilidadCalc.rentabilidadNetaPct : undefined,
      detalles: result.detalles,
    });
  };

  const menuOptions = [
    { id: 'venta' as const, label: '1. Comisión de Venta', icon: DollarSign, sub: '3% o 6% + IVA' },
    { id: 'alquiler_anual' as const, label: '2. Alquiler Anual', icon: Building, sub: '1 mes + IVA' },
    { id: 'alquiler_temporal' as const, label: '3. Alquiler Temporal', icon: Receipt, sub: '10% IVA inc.' },
    { id: 'irpf' as const, label: '4. Impuesto IRPF', icon: FileCheck, sub: '1.8% ficto / 12%' },
    { id: 'itp' as const, label: '5. Impuesto ITP', icon: Receipt, sub: '2% Catastral' },
    { id: 'tres_porciento' as const, label: '6. Comisión 3%', icon: Percent, sub: '3% s/precio + IVA' },
    { id: 'rentabilidad' as const, label: '7. Rentabilidad Anual', icon: TrendingUp, sub: 'Bruta y Neta' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Calculator className="w-6 h-6 text-amber-400" />
              Calculador de Operaciones Inmobiliarias
            </h2>
            <p className="text-sm text-slate-400">
              Estructura idéntica al CLI original de Mariano, potenciada con sincronización Firebase en tiempo real.
            </p>
          </div>

          {/* Vincular Propiedad de Cartera Dropdown */}
          <div className="w-full lg:w-72">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Vincular propiedad existente (opcional):
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertySelect(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Cálculo libre (sin propiedad) --</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo} ({p.moneda} {p.precio.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 7 Menu Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-4">
          {menuOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = activeMode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setActiveMode(opt.id)}
                className={`p-3 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 scale-[1.02]'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                <div className="text-xs font-semibold truncate leading-tight">{opt.label}</div>
                <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                  {opt.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Inputs on Left, Real-time Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="font-bold text-base text-white flex items-center justify-between">
              <span>Parámetros de la Operación</span>
              <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-amber-400 border border-slate-700">
                IVA Ley: {(settings.iva * 100).toFixed(0)}%
              </span>
            </h3>

            {/* Mode 1 & 6: Venta / 3% */}
            {(activeMode === 'venta' || activeMode === 'tres_porciento' || activeMode === 'irpf' || activeMode === 'rentabilidad') && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Valor de Venta / Precio de la Propiedad:
                </label>
                <div className="flex gap-2">
                  <select
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value as 'USD' | 'UYU')}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="USD">USD (Dólares)</option>
                    <option value="UYU">$U (Pesos)</option>
                  </select>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={montoVenta}
                      onChange={(e) => setMontoVenta(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Puntas selector for Venta */}
            {activeMode === 'venta' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  ¿Tiene una sola punta (1) o ambas puntas (2)?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPuntas(1)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      puntas === 1
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>1 Punta (3% Venta)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPuntas(2)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      puntas === 2
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>2 Puntas (6% Ambas)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2 & 7: Alquiler Anual */}
            {(activeMode === 'alquiler_anual' || activeMode === 'rentabilidad') && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Valor Mensual del Alquiler:
                </label>
                <div className="flex gap-2">
                  <select
                    value={monedaAlquiler}
                    onChange={(e) => setMonedaAlquiler(e.target.value as 'USD' | 'UYU')}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="UYU">$U (Pesos)</option>
                    <option value="USD">USD (Dólares)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={alquilerMensual}
                    onChange={(e) => setAlquilerMensual(parseFloat(e.target.value) || 0)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Mode 3: Alquiler Temporal */}
            {activeMode === 'alquiler_temporal' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Valor Total del Alquiler Temporal (USD):
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={alquilerTemporalMonto}
                  onChange={(e) => setAlquilerTemporalMonto(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Comisión estándar de temporada: 10% IVA incluido.
                </p>
              </div>
            )}

            {/* Mode 4: IRPF Parameters */}
            {(activeMode === 'irpf' || activeMode === 'venta') && (
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                    Cálculo IRPF (Incrementos Patrimoniales)
                  </span>
                  <span className="text-[11px] text-slate-400">Uruguay DGI</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      Año de Compra / Adquisición:
                    </label>
                    <input
                      type="number"
                      value={anioCompra}
                      onChange={(e) => setAnioCompra(parseInt(e.target.value) || 2010)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  {anioCompra >= 2007 && (
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        Valor de Compra Original ({moneda}):
                      </label>
                      <input
                        type="number"
                        value={valorCompra}
                        onChange={(e) => setValorCompra(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg">
                  {anioCompra < 2007 ? (
                    <span className="text-emerald-400">
                      ✓ Comprado antes de 2007: Se aplica régimen ficto del <strong>1.8%</strong> sobre el precio de venta.
                    </span>
                  ) : (
                    <span className="text-blue-400">
                      ✓ Comprado a partir de 2007: Se aplica el <strong>12%</strong> sobre la plusvalía real (Venta - Compra).
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Mode 5: ITP Parameters */}
            {(activeMode === 'itp' || activeMode === 'venta') && (
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                    Cálculo ITP (Transmisiones Patrimoniales)
                  </span>
                  <span className="text-[11px] text-slate-400">2% s/Catastro</span>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Valor Catastral Fijado ($U / Moneda local):
                  </label>
                  <input
                    type="number"
                    value={valorCatastral}
                    onChange={(e) => setValorCatastral(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Mode 7: Rentabilidad Extra Parameters */}
            {activeMode === 'rentabilidad' && (
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <label className="block text-[11px] text-slate-300 mb-1">
                  Gastos Anuales Estimados (Contribución, Primaria, Mantenimiento):
                </label>
                <input
                  type="number"
                  value={gastosAnuales}
                  onChange={(e) => setGastosAnuales(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold"
                />
              </div>
            )}

            {/* Client name & notes for Firebase Sync */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Cliente / Comprador / Inquilino (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ing. Marcelo González"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notas u Observaciones del Cierre:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Acordado pago en 2 cheques, retención IRPF en escribanía."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Breakdown Column */}
        <div className="lg:col-span-6 space-y-5">
          {/* Main Financial Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4" /> Desglose de Liquidación
              </span>
              <span className="text-xs text-slate-400">
                Tu Split Asesor: <strong className="text-amber-400">{formatPct(personalSplit)}</strong>
              </span>
            </div>

            {/* Primary KPI: Tu Comisión Asesor (Mariano) */}
            <div className="my-5 p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30">
              <div className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
                Tu Comisión Personal Mariano ({(personalSplit * 100).toFixed(0)}%)
              </div>
              <div className="text-3xl sm:text-4xl font-black text-amber-400 mt-1 tracking-tight">
                {activeMode === 'venta' && formatCurrency(ventaCalc.comisionAsesor, moneda)}
                {activeMode === 'alquiler_anual' && formatCurrency(alqAnualCalc.comisionAsesor, monedaAlquiler)}
                {activeMode === 'alquiler_temporal' && formatCurrency(alqTempCalc.comisionAsesor, 'USD')}
                {activeMode === 'tres_porciento' && formatCurrency(tresPorcCalc.comisionAsesor, moneda)}
                {activeMode === 'irpf' && formatCurrency(ventaCalc.comisionAsesor, moneda)}
                {activeMode === 'itp' && formatCurrency(ventaCalc.comisionAsesor, moneda)}
                {activeMode === 'rentabilidad' && formatCurrency(alqAnualCalc.comisionAsesor, monedaAlquiler)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Calculado sobre el total de honorarios + IVA de la inmobiliaria
              </div>
            </div>

            {/* Detailed Row Cards */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-400">Comisión Inmobiliaria Bruta:</span>
                <span className="font-bold text-white text-sm">
                  {activeMode === 'venta' && formatCurrency(ventaCalc.comisionBruta, moneda)}
                  {activeMode === 'alquiler_anual' && formatCurrency(alqAnualCalc.comisionBruta, monedaAlquiler)}
                  {activeMode === 'alquiler_temporal' && formatCurrency(alqTempCalc.comisionBruta, 'USD')}
                  {activeMode === 'tres_porciento' && formatCurrency(tresPorcCalc.comisionBruta, moneda)}
                  {activeMode === 'irpf' && formatCurrency(ventaCalc.comisionBruta, moneda)}
                  {activeMode === 'itp' && formatCurrency(ventaCalc.comisionBruta, moneda)}
                  {activeMode === 'rentabilidad' && formatCurrency(alqAnualCalc.comisionBruta, monedaAlquiler)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-800/60 border border-slate-800">
                <span className="text-slate-400">IVA Honorarios ({(settings.iva * 100).toFixed(0)}%):</span>
                <span className="font-bold text-slate-300">
                  {activeMode === 'venta' && formatCurrency(ventaCalc.ivaMonto, moneda)}
                  {activeMode === 'alquiler_anual' && formatCurrency(alqAnualCalc.ivaMonto, monedaAlquiler)}
                  {activeMode === 'alquiler_temporal' && formatCurrency(alqTempCalc.ivaMonto, 'USD')}
                  {activeMode === 'tres_porciento' && formatCurrency(tresPorcCalc.ivaMonto, moneda)}
                  {activeMode === 'irpf' && formatCurrency(ventaCalc.ivaMonto, moneda)}
                  {activeMode === 'itp' && formatCurrency(ventaCalc.ivaMonto, moneda)}
                  {activeMode === 'rentabilidad' && formatCurrency(alqAnualCalc.ivaMonto, monedaAlquiler)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-amber-950/30 border border-amber-500/20 font-bold">
                <span className="text-amber-200">Total Comisión Facturada (con IVA):</span>
                <span className="text-amber-400 text-sm">
                  {activeMode === 'venta' && formatCurrency(ventaCalc.totalComisionConIVA, moneda)}
                  {activeMode === 'alquiler_anual' && formatCurrency(alqAnualCalc.totalComisionConIVA, monedaAlquiler)}
                  {activeMode === 'alquiler_temporal' && formatCurrency(alqTempCalc.totalComisionConIVA, 'USD')}
                  {activeMode === 'tres_porciento' && formatCurrency(tresPorcCalc.totalComisionConIVA, moneda)}
                  {activeMode === 'irpf' && formatCurrency(ventaCalc.totalComisionConIVA, moneda)}
                  {activeMode === 'itp' && formatCurrency(ventaCalc.totalComisionConIVA, moneda)}
                  {activeMode === 'rentabilidad' && formatCurrency(alqAnualCalc.totalComisionConIVA, monedaAlquiler)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Retención / Margen Agencia ({((1 - personalSplit) * 100).toFixed(0)}%):</span>
                <span className="font-semibold text-slate-300">
                  {activeMode === 'venta' && formatCurrency(ventaCalc.comisionAgencia, moneda)}
                  {activeMode === 'alquiler_anual' && formatCurrency(alqAnualCalc.comisionAgencia, monedaAlquiler)}
                  {activeMode === 'alquiler_temporal' && formatCurrency(alqTempCalc.comisionAgencia, 'USD')}
                  {activeMode === 'tres_porciento' && formatCurrency(tresPorcCalc.comisionAgencia, moneda)}
                  {activeMode === 'irpf' && formatCurrency(ventaCalc.comisionAgencia, moneda)}
                  {activeMode === 'itp' && formatCurrency(ventaCalc.comisionAgencia, moneda)}
                  {activeMode === 'rentabilidad' && formatCurrency(alqAnualCalc.comisionAgencia, monedaAlquiler)}
                </span>
              </div>

              {/* Tributary and ROI widgets */}
              {(activeMode === 'venta' || activeMode === 'irpf') && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                    <span className="text-emerald-300 font-medium">IRPF Estimado ({irpfCalc.tasaAplicada}):</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(irpfCalc.montoIRPF, moneda)}</span>
                  </div>
                </div>
              )}

              {(activeMode === 'venta' || activeMode === 'itp') && (
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20">
                  <span className="text-cyan-300 font-medium">ITP Estimado ({itpCalc.tasa} Catastral):</span>
                  <span className="font-bold text-cyan-400">{formatCurrency(itpCalc.itpMonto, 'UYU')}</span>
                </div>
              )}

              {activeMode === 'rentabilidad' && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20">
                    <span className="text-indigo-300 font-medium">Rentabilidad Bruta Anual:</span>
                    <span className="font-bold text-indigo-400">{rentabilidadCalc.rentabilidadBrutaPct.toFixed(2)}% anual</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-indigo-950/50 border border-indigo-500/30">
                    <span className="text-indigo-200 font-medium">Rentabilidad Neta Anual (libre de gastos):</span>
                    <span className="font-bold text-indigo-300">{rentabilidadCalc.rentabilidadNetaPct.toFixed(2)}% anual</span>
                  </div>
                  {onNavigateToYield && (
                    <button
                      type="button"
                      onClick={onNavigateToYield}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <TrendingUp className="w-4 h-4 text-amber-300" />
                      <span>Ver Gráficas Completas de Rentabilidad (Curva a 20 Años y Sensibilidad)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons: Save to Firebase & Print Deal Sheet */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSaveToFirebase}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-50"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    Sincronizando con Firebase...
                  </span>
                ) : saveSuccess ? (
                  <span className="flex items-center gap-1.5 text-slate-950">
                    <CheckCircle className="w-4 h-4 text-emerald-800" />
                    ¡Guardado en Firestore!
                  </span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Comisión en Firebase</span>
                  </>
                )}
              </button>

              <button
                onClick={handleOpenPrintModal}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-xs transition-colors"
                title="Generar ficha imprimible para cliente o escribano"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <span>Ver Ficha Resumen</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
