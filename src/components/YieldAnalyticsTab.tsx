import React, { useState, useMemo } from 'react';
import { Property, AgencySettings } from '../types';
import { formatCurrency, formatPct } from '../utils/calculators';
import {
  TrendingUp,
  Building2,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';

interface YieldAnalyticsTabProps {
  properties: Property[];
  settings: AgencySettings;
}

export const YieldAnalyticsTab: React.FC<YieldAnalyticsTabProps> = ({ properties, settings }) => {
  // Select property to inspect, or 'custom'
  const [selectedPropId, setSelectedPropId] = useState<string>(
    properties[0]?.id || 'custom'
  );

  // Simulation parameters
  const [precioInmueble, setPrecioInmueble] = useState<number>(240000);
  const [moneda, setMoneda] = useState<'USD' | 'UYU'>('USD');
  const [alquilerMensual, setAlquilerMensual] = useState<number>(1400);
  const [gastosAnuales, setGastosAnuales] = useState<number>(2200);
  const [mesesVacancia, setMesesVacancia] = useState<number>(0.5); // 0.5 month per year avg
  const [tasaPlusvaliaAnual, setTasaPlusvaliaAnual] = useState<number>(2.5); // 2.5% appreciation
  const [tasaIRPFAlquiler, setTasaIRPFAlquiler] = useState<number>(10.5); // 10.5% Uruguay standard rent tax

  // Tooltip hover state for charts
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // When dropdown property changes, prefill simulation values
  const handleSelectProperty = (id: string) => {
    setSelectedPropId(id);
    if (id === 'custom') return;
    const prop = properties.find((p) => p.id === id);
    if (!prop) return;

    setPrecioInmueble(prop.precio);
    setMoneda(prop.moneda);
    if (prop.alquilerMensualEstimado) {
      setAlquilerMensual(prop.alquilerMensualEstimado);
    } else if (prop.tipoOperacion === 'alquiler_anual') {
      setAlquilerMensual(prop.precio);
    } else {
      // Default estimate if not set: ~0.55% of price
      setAlquilerMensual(Math.round(prop.precio * 0.0055));
    }

    if (prop.gastosAnualesEstimados) {
      setGastosAnuales(prop.gastosAnualesEstimados);
    } else {
      // Default ~1% of property price
      setGastosAnuales(Math.round(prop.precio * 0.01));
    }
  };

  // Financial Calculations for current simulation
  const financialMetrics = useMemo(() => {
    // Effective months rented per year
    const mesesEfectivos = Math.max(0, 12 - mesesVacancia);
    const rentaBrutaAnualTeorica = alquilerMensual * 12;
    const rentaBrutaEfectiva = alquilerMensual * mesesEfectivos;

    // Taxes & Costs
    const costoVacancia = alquilerMensual * mesesVacancia;
    const impuestoIRPF = (rentaBrutaEfectiva * tasaIRPFAlquiler) / 100;
    const totalCostosOperativos = gastosAnuales + impuestoIRPF;

    // Net Operating Income (NOI)
    const rentaNetaAnual = Math.max(0, rentaBrutaEfectiva - totalCostosOperativos);

    // Yields %
    const rentabilidadBrutaPct = precioInmueble > 0 ? (rentaBrutaAnualTeorica / precioInmueble) * 100 : 0;
    const rentabilidadNetaPct = precioInmueble > 0 ? (rentaNetaAnual / precioInmueble) * 100 : 0;

    // Multipliers
    const grm = rentaBrutaAnualTeorica > 0 ? precioInmueble / rentaBrutaAnualTeorica : 0;
    const paybackYears = rentaNetaAnual > 0 ? precioInmueble / rentaNetaAnual : 0;

    return {
      rentaBrutaAnualTeorica,
      rentaBrutaEfectiva,
      costoVacancia,
      impuestoIRPF,
      gastosAnuales,
      totalCostosOperativos,
      rentaNetaAnual,
      rentabilidadBrutaPct,
      rentabilidadNetaPct,
      grm,
      paybackYears,
    };
  }, [precioInmueble, alquilerMensual, gastosAnuales, mesesVacancia, tasaIRPFAlquiler]);

  // Multi-year projection (Year 1 to Year 20)
  const projection20Years = useMemo(() => {
    const data = [];
    let acumuladoFlujo = 0;
    const inflacionAlquiler = 0.02; // 2% rental growth per year
    const plusvalia = tasaPlusvaliaAnual / 100;

    for (let yr = 1; yr <= 20; yr++) {
      const rentaNetaAnio = financialMetrics.rentaNetaAnual * Math.pow(1 + inflacionAlquiler, yr - 1);
      acumuladoFlujo += rentaNetaAnio;
      const valorPropiedadAnio = precioInmueble * Math.pow(1 + plusvalia, yr);
      const retornoTotal = acumuladoFlujo + (valorPropiedadAnio - precioInmueble);
      const roiTotalPct = precioInmueble > 0 ? (retornoTotal / precioInmueble) * 100 : 0;

      data.push({
        year: yr,
        rentaNetaAnio,
        acumuladoFlujo,
        valorPropiedadAnio,
        retornoTotal,
        roiTotalPct,
      });
    }
    return data;
  }, [financialMetrics.rentaNetaAnual, precioInmueble, tasaPlusvaliaAnual]);

  // Portfolio Comparison Data
  const portfolioYields = useMemo(() => {
    return properties.map((prop) => {
      const price = prop.precio;
      const monthlyRent =
        prop.alquilerMensualEstimado ||
        (prop.tipoOperacion === 'alquiler_anual' ? prop.precio : Math.round(prop.precio * 0.0055));
      const annualExpenses =
        prop.gastosAnualesEstimados || Math.round(prop.precio * 0.01);

      const grossIncome = monthlyRent * 12;
      const netIncome = Math.max(0, grossIncome - annualExpenses - (grossIncome * 0.105)); // minus 10.5% IRPF

      const brutaPct = price > 0 ? (grossIncome / price) * 100 : 0;
      const netaPct = price > 0 ? (netIncome / price) * 100 : 0;

      return {
        id: prop.id,
        titulo: prop.titulo,
        barrio: prop.barrio || prop.ciudad || 'Uruguay',
        moneda: prop.moneda,
        precio: price,
        monthlyRent,
        brutaPct,
        netaPct,
      };
    });
  }, [properties]);

  // Donut chart angles for expense breakdown
  const donutData = useMemo(() => {
    const total = financialMetrics.rentaBrutaAnualTeorica || 1;
    const neta = financialMetrics.rentaNetaAnual;
    const gastos = financialMetrics.gastosAnuales;
    const irpf = financialMetrics.impuestoIRPF;
    const vacancia = financialMetrics.costoVacancia;

    return [
      { label: 'Renta Neta Líquida', value: neta, color: '#10b981', pct: (neta / total) * 100 },
      { label: 'Gastos Mantenimiento & Expensas', value: gastos, color: '#f59e0b', pct: (gastos / total) * 100 },
      { label: 'IRPF Alquileres (10.5%)', value: irpf, color: '#3b82f6', pct: (irpf / total) * 100 },
      { label: 'Reserva Vacancia', value: vacancia, color: '#ec4899', pct: (vacancia / total) * 100 },
    ];
  }, [financialMetrics]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Property Picker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                Gráficas y Análisis de Rentabilidad Inmobiliaria
              </h2>
              <p className="text-xs text-slate-400">
                Visualización financiera de rendimientos brutos vs netos, curvas de amortización y sensibilidad de inversión.
              </p>
            </div>
          </div>
        </div>

        {/* Property Selector */}
        <div className="w-full lg:w-80">
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Propiedad a Analizar:
          </label>
          <select
            value={selectedPropId}
            onChange={(e) => handleSelectProperty(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          >
            <option value="custom">⚡ Simulación Libre / Parámetros Personalizados</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titulo} ({formatCurrency(p.precio, p.moneda)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Rentabilidad Bruta */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Rentabilidad Bruta Anual</span>
            <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-blue-400 mt-2">
            {financialMetrics.rentabilidadBrutaPct.toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Renta bruta: {formatCurrency(financialMetrics.rentaBrutaAnualTeorica, moneda)}/año
          </div>
        </div>

        {/* KPI 2: Rentabilidad Neta (Cap Rate) */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden bg-gradient-to-br from-slate-900 to-emerald-950/20">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Rentabilidad Neta (Cap Rate)</span>
            <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-2">
            {financialMetrics.rentabilidadNetaPct.toFixed(2)}%
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">
            Ingreso Neto (NOI): {formatCurrency(financialMetrics.rentaNetaAnual, moneda)}/año
          </div>
        </div>

        {/* KPI 3: Payback Period */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Período de Recupero (Payback)</span>
            <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2">
            {financialMetrics.paybackYears > 0
              ? `${financialMetrics.paybackYears.toFixed(1)} años`
              : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Amortización al 100% de la compra
          </div>
        </div>

        {/* KPI 4: Multiplicador Renta Bruta (GRM) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Multiplicador Renta Bruta (GRM)</span>
            <span className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-purple-400 mt-2">
            {financialMetrics.grm > 0 ? `${financialMetrics.grm.toFixed(1)}x` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Años de renta bruta equivalentes al valor
          </div>
        </div>
      </div>

      {/* Grid: Interactive Controls & Donut Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Simulation Sliders */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Parámetros de Simulación en Tiempo Real
            </span>
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Dinámico
            </span>
          </h3>

          {/* Slider 1: Precio Inmueble */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Precio Inmueble ({moneda}):</span>
              <span className="font-bold text-white">{formatCurrency(precioInmueble, moneda)}</span>
            </div>
            <input
              type="range"
              min="50000"
              max="1500000"
              step="5000"
              value={precioInmueble}
              onChange={(e) => setPrecioInmueble(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Slider 2: Alquiler Mensual */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Alquiler Mensual Estimado:</span>
              <span className="font-bold text-amber-400">{formatCurrency(alquilerMensual, moneda)}/mes</span>
            </div>
            <input
              type="range"
              min="300"
              max="15000"
              step="50"
              value={alquilerMensual}
              onChange={(e) => setAlquilerMensual(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Slider 3: Gastos Anuales */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Gastos Anuales (Contribución, Expensas, Mantenimiento):</span>
              <span className="font-bold text-rose-400">{formatCurrency(gastosAnuales, moneda)}/año</span>
            </div>
            <input
              type="range"
              min="0"
              max="15000"
              step="100"
              value={gastosAnuales}
              onChange={(e) => setGastosAnuales(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Slider 4: Meses de Vacancia */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Meses de Vacancia / Recambio por Año:</span>
              <span className="font-bold text-pink-400">{mesesVacancia} meses</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.25"
              value={mesesVacancia}
              onChange={(e) => setMesesVacancia(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Slider 5: Tasa IRPF Alquiler */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Tasa Impuesto IRPF s/Alquiler (DGI Uruguay):</span>
              <span className="font-bold text-blue-400">{tasaIRPFAlquiler}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={tasaIRPFAlquiler}
              onChange={(e) => setTasaIRPFAlquiler(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">
              10.5% con retención de inmobiliaria/inmobiliaria agente
            </span>
          </div>

          {/* Slider 6: Plusvalía Anual */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Plusvalía / Apreciación Anual del Inmueble:</span>
              <span className="font-bold text-emerald-400">{tasaPlusvaliaAnual}% anual</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="0.5"
              value={tasaPlusvaliaAnual}
              onChange={(e) => setTasaPlusvaliaAnual(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: Donut Breakdown of Gross Rent Income */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <h3 className="font-bold text-white text-sm flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-emerald-400" />
              Distribución de la Renta Bruta Anual (Flujo de Caja)
            </span>
            <span className="text-xs text-slate-400">
              Total Bruto: {formatCurrency(financialMetrics.rentaBrutaAnualTeorica, moneda)}
            </span>
          </h3>

          {/* Donut and Legend row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-4">
            {/* Donut Graphic */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background ring */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1e293b" strokeWidth="14" />
                  {/* Slices calculated with strokeDasharray */}
                  {(() => {
                    const circumference = 2 * Math.PI * 38; // ~238.76
                    let offsetAccum = 0;
                    return donutData.map((slice, i) => {
                      const strokeLen = (slice.pct / 100) * circumference;
                      const element = (
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="14"
                          strokeDasharray={`${strokeLen} ${circumference - strokeLen}`}
                          strokeDashoffset={-offsetAccum}
                          className="transition-all duration-500 hover:opacity-80"
                        />
                      );
                      offsetAccum += strokeLen;
                      return element;
                    });
                  })()}
                </svg>

                {/* Inner center text */}
                <div className="absolute text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rendimiento</span>
                  <span className="text-xl font-black text-emerald-400">
                    {financialMetrics.rentabilidadNetaPct.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">Neto Anual</span>
                </div>
              </div>
            </div>

            {/* Breakdown Bars & Legend */}
            <div className="md:col-span-7 space-y-3">
              {donutData.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="flex items-center gap-2 text-slate-300 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="font-bold text-white">
                      {formatCurrency(item.value, moneda)}
                      <span className="text-[10px] text-slate-400 ml-1">({item.pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(2, item.pct))}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Ingreso neto de bolsillo mensual estimado: <strong className="text-emerald-400">{formatCurrency(financialMetrics.rentaNetaAnual / 12, moneda)}/mes</strong> libre de gastos e impuestos.
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico 2: Curva de Amortización & Crecimiento Patrimonial a 20 Años */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              Proyección de Flujo Acumulado y Retorno Total a 20 Años
            </h3>
            <p className="text-xs text-slate-400">
              Visualiza en qué año recuperas el 100% de la inversión y cómo crece tu patrimonio con plusvalía.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              Flujo de Alquiler Acumulado
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-amber-500" />
              Valor del Inmueble (+{tasaPlusvaliaAnual}%)
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-0.5 bg-rose-500 border-dashed" />
              Inversión Inicial ({formatCurrency(precioInmueble, moneda)})
            </span>
          </div>
        </div>

        {/* SVG Interactive Timeline Chart */}
        <div className="h-64 sm:h-72 w-full pt-4 relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240">
            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = 200 - pct * 180;
              const maxVal = projection20Years[19]?.valorPropiedadAnio + projection20Years[19]?.acumuladoFlujo || 1;
              const val = maxVal * pct;
              return (
                <g key={i}>
                  <line x1="50" y1={y} x2="780" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x="45" y={y + 4} textAnchor="end" fill="#64748b" fontSize="9">
                    {formatCurrency(val, moneda).replace(/\sUSD|\s\$U/, '')}
                  </text>
                </g>
              );
            })}

            {/* Baseline purchase price marker */}
            {(() => {
              const maxVal = projection20Years[19]?.valorPropiedadAnio + projection20Years[19]?.acumuladoFlujo || 1;
              const yBase = 200 - (precioInmueble / maxVal) * 180;
              return (
                <g>
                  <line x1="50" y1={yBase} x2="780" y2={yBase} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="785" y={yBase + 3} fill="#ef4444" fontSize="9" fontWeight="bold">
                    Compra: {formatCurrency(precioInmueble, moneda)}
                  </text>
                </g>
              );
            })()}

            {/* Bars for each year */}
            {projection20Years.map((d, idx) => {
              const maxVal = projection20Years[19]?.valorPropiedadAnio + projection20Years[19]?.acumuladoFlujo || 1;
              const x = 60 + idx * 35;
              const barWidth = 24;

              // Heights
              const hFlujo = (d.acumuladoFlujo / maxVal) * 180;
              const yFlujo = 200 - hFlujo;

              const isHovered = hoveredYear === d.year;
              const isPaybackAchieved = d.acumuladoFlujo >= precioInmueble;

              return (
                <g
                  key={d.year}
                  onMouseEnter={() => setHoveredYear(d.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                  className="cursor-pointer transition-all"
                >
                  {/* Flujo Acumulado Bar */}
                  <rect
                    x={x}
                    y={yFlujo}
                    width={barWidth}
                    height={hFlujo}
                    rx="3"
                    fill={isPaybackAchieved ? '#10b981' : isHovered ? '#34d399' : '#059669'}
                    opacity={isHovered ? 1 : 0.85}
                  />

                  {/* Year label */}
                  <text
                    x={x + barWidth / 2}
                    y="218"
                    textAnchor="middle"
                    fill={isHovered ? '#f59e0b' : '#94a3b8'}
                    fontSize="9"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                  >
                    A{d.year}
                  </text>

                  {/* Break-even badge if first year to achieve payback */}
                  {isPaybackAchieved && projection20Years[idx - 1]?.acumuladoFlujo < precioInmueble && (
                    <g>
                      <circle cx={x + barWidth / 2} cy={yFlujo - 10} r="4" fill="#f59e0b" />
                      <text x={x + barWidth / 2} y={yFlujo - 18} textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="black">
                        ★ Payback
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hovered details tooltip preview */}
        {hoveredYear !== null && (
          <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/40 flex flex-wrap justify-between items-center text-xs animate-in fade-in">
            <span className="font-bold text-amber-400">Año {hoveredYear}:</span>
            <span className="text-slate-300">
              Renta neta anual: <strong>{formatCurrency(projection20Years[hoveredYear - 1].rentaNetaAnio, moneda)}</strong>
            </span>
            <span className="text-emerald-400">
              Alquiler acumulado: <strong>{formatCurrency(projection20Years[hoveredYear - 1].acumuladoFlujo, moneda)}</strong>
            </span>
            <span className="text-amber-300">
              Valor inmueble (+plusvalía): <strong>{formatCurrency(projection20Years[hoveredYear - 1].valorPropiedadAnio, moneda)}</strong>
            </span>
            <span className="text-purple-400">
              Retorno total neto: <strong>+{projection20Years[hoveredYear - 1].roiTotalPct.toFixed(0)}%</strong>
            </span>
          </div>
        )}
      </div>

      {/* Gráfico 3: Comparativa de Rentabilidades de la Cartera (Ranking) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Ranking de Rentabilidad por Propiedad en Cartera
            </h3>
            <p className="text-xs text-slate-400">
              Compara el rendimiento Bruto (azul) vs Neto (verde) de cada propiedad registrada en Firebase.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-blue-500" />
              Rentabilidad Bruta (%)
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              Rentabilidad Neta (%)
            </span>
          </div>
        </div>

        {/* Grouped Horizontal Bars */}
        <div className="space-y-4 pt-2">
          {portfolioYields.map((p, idx) => {
            const isSelected = p.id === selectedPropId;
            return (
              <div
                key={p.id}
                onClick={() => handleSelectProperty(p.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className="font-bold text-white truncate max-w-xs">{p.titulo}</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                      {p.barrio}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px] block">{formatCurrency(p.precio, p.moneda)}</span>
                  </div>
                </div>

                {/* Progress bars (Gross vs Net) */}
                <div className="space-y-1.5">
                  {/* Gross Bar */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-20 text-[10px] text-blue-400 font-semibold">Bruta: {p.brutaPct.toFixed(2)}%</span>
                    <div className="flex-1 bg-slate-900 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, p.brutaPct * 10)}%` }} // scale: 10% yield = 100% width
                      />
                    </div>
                  </div>

                  {/* Net Bar */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-20 text-[10px] text-emerald-400 font-semibold">Neta: {p.netaPct.toFixed(2)}%</span>
                    <div className="flex-1 bg-slate-900 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, p.netaPct * 10)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
