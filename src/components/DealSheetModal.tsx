import React from 'react';
import { formatCurrency } from '../utils/calculators';
import { Printer, Copy, Check, X, Building2, Share2, FileSpreadsheet } from 'lucide-react';

interface DealSheetData {
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
}

interface DealSheetModalProps {
  data: DealSheetData | null;
  onClose: () => void;
}

export const DealSheetModal: React.FC<DealSheetModalProps> = ({ data, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `📋 LIQUIDACIÓN INMOBILIARIA - RESUMEN DE OPERACIÓN
Inmueble: ${data.propertyTitulo || 'Operación Directa'}
Monto Operación: ${formatCurrency(data.montoOperacion, data.moneda)}
Comisión Inmobiliaria Bruta: ${formatCurrency(data.comisionBruta, data.moneda)}
IVA (22%): ${formatCurrency(data.ivaMonto, data.moneda)}
Total Comisión + IVA: ${formatCurrency(data.totalComision, data.moneda)}
${data.irpf ? `IRPF Estimado: ${formatCurrency(data.irpf, data.moneda)}\n` : ''}${
      data.itp ? `ITP Estimado: ${formatCurrency(data.itp, 'UYU')}\n` : ''
    }Calculado con Calculador Inmobiliario Pro (Firebase Sync)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Ficha Financiera de la Operación</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {data.propertyTitulo || 'Liquidación Inmobiliaria'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Fecha de emisión: {new Date().toLocaleDateString('es-UY', { dateStyle: 'long' })}
          </p>
        </div>

        {/* Content Sheet */}
        <div className="space-y-4 text-xs">
          {/* Main Price Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-slate-400 block text-[11px]">Valor de la Operación</span>
              <span className="text-2xl font-black text-white">
                {formatCurrency(data.montoOperacion, data.moneda)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Total Honorarios + IVA</span>
              <span className="text-2xl font-black text-amber-400">
                {formatCurrency(data.totalComision, data.moneda)}
              </span>
            </div>
          </div>

          {/* Breakdown Items */}
          <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Comisión Inmobiliaria Bruta:</span>
              <span className="font-semibold text-white">
                {formatCurrency(data.comisionBruta, data.moneda)}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">IVA Aplicable (22%):</span>
              <span className="font-semibold text-slate-300">
                {formatCurrency(data.ivaMonto, data.moneda)}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-amber-300 font-semibold">Total Honorarios Inmobiliarios:</span>
              <span className="font-bold text-amber-400 text-sm">
                {formatCurrency(data.totalComision, data.moneda)}
              </span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Tu Comisión Asesor (Mariano):</span>
              <span className="font-bold text-emerald-400">
                {formatCurrency(data.comisionAsesor, data.moneda)}
              </span>
            </div>
          </div>

          {/* Taxes Section if available */}
          {(data.irpf !== undefined || data.itp !== undefined) && (
            <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide block mb-1">
                Impuestos y Cargas Notariales Estimadas (DGI)
              </span>

              {data.irpf !== undefined && (
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">IRPF (Incrementos Patrimoniales):</span>
                  <span className="font-bold text-emerald-400">
                    {formatCurrency(data.irpf, data.moneda)}
                  </span>
                </div>
              )}

              {data.itp !== undefined && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">ITP (2% Valor Catastral):</span>
                  <span className="font-bold text-cyan-400">
                    {formatCurrency(data.itp, 'UYU')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Rentability if available */}
          {data.rentabilidadBruta !== undefined && (
            <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-500/30 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-indigo-300 block">Rentabilidad Bruta Estimada</span>
                <span className="text-lg font-black text-indigo-200">
                  {data.rentabilidadBruta.toFixed(2)}% anual
                </span>
              </div>
              {data.rentabilidadNeta !== undefined && (
                <div className="text-right">
                  <span className="text-[11px] text-indigo-300 block">Rentabilidad Neta (sin gastos)</span>
                  <span className="text-lg font-black text-indigo-400">
                    {data.rentabilidadNeta.toFixed(2)}% anual
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleCopySummary}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Copiar Resumen</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
