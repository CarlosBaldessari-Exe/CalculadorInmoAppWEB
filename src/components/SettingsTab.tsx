import React, { useState } from 'react';
import { AgencySettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { saveAgencySettings } from '../services/firestoreService';
import { DEFAULT_SETTINGS } from '../utils/calculators';
import { Settings, Save, RotateCcw, CheckCircle2, ShieldCheck, Info } from 'lucide-react';

interface SettingsTabProps {
  settings: AgencySettings;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ settings }) => {
  const { user, isAdmin } = useAuth();
  const [formData, setFormData] = useState<AgencySettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveAgencySettings(formData, user?.uid || 'admin');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving agency settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToConstants = () => {
    if (window.confirm('¿Restablecer los parámetros a los valores originales de Constants.java?')) {
      setFormData({ ...DEFAULT_SETTINGS });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-400" />
            Parámetros y Tasas de la Agencia
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configuración global sincronizada en Firebase basada en <code>Constants.java</code>. Afecta los cálculos de todo el equipo.
          </p>
        </div>
        <button
          onClick={handleResetToConstants}
          className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer Originales</span>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Section 1: Honorarios e IVA */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-2">
            <span>1. Comisiones Inmobiliarias e IVA</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                IVA General (Ley Uruguay)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.iva}
                  onChange={(e) => setFormData({ ...formData, iva: parseFloat(e.target.value) || 0.22 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
                <span className="text-amber-400 font-bold text-sm">{(formData.iva * 100).toFixed(0)}%</span>
              </div>
              <span className="text-[10px] text-slate-500">Constants.IVA = 0.22</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Comisión Venta (1 Punta)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.005"
                  min="0"
                  max="1"
                  value={formData.comisionVentaStandard}
                  onChange={(e) =>
                    setFormData({ ...formData, comisionVentaStandard: parseFloat(e.target.value) || 0.03 })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
                <span className="text-amber-400 font-bold text-sm">{(formData.comisionVentaStandard * 100).toFixed(0)}%</span>
              </div>
              <span className="text-[10px] text-slate-500">Constants.COMISION_VENTA = 0.03</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Comisión Venta (2 Puntas)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.comisionVentaAmbasPuntas}
                  onChange={(e) =>
                    setFormData({ ...formData, comisionVentaAmbasPuntas: parseFloat(e.target.value) || 0.06 })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
                <span className="text-amber-400 font-bold text-sm">
                  {(formData.comisionVentaAmbasPuntas * 100).toFixed(0)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Ambas puntas (3% + 3%)</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Alquiler Anual (Meses de honorario)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="3"
                value={formData.comisionAlquilerAnualMeses}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    comisionAlquilerAnualMeses: parseFloat(e.target.value) || 1,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
              <span className="text-[10px] text-slate-500">Constants.COMISION_ALQ_ANUAL = 1 mes</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Alquiler Temporal (% IVA inc.)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.comisionAlquilerTemporalPct}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      comisionAlquilerTemporalPct: parseFloat(e.target.value) || 0.10,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
                <span className="text-amber-400 font-bold text-sm">
                  {(formData.comisionAlquilerTemporalPct * 100).toFixed(0)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Constants.COMISION_ALQ_TEMPORAL = 0.10</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Comisión 3% fija (Opción 6)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.005"
                  min="0"
                  max="1"
                  value={formData.comisionTresPorciento}
                  onChange={(e) =>
                    setFormData({ ...formData, comisionTresPorciento: parseFloat(e.target.value) || 0.03 })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
                <span className="text-amber-400 font-bold text-sm">
                  {(formData.comisionTresPorciento * 100).toFixed(0)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Constants.COMISION_3_PORC = 0.03</span>
            </div>
          </div>
        </div>

        {/* Section 2: Impuestos (IRPF & ITP) */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-2">
            <span>2. Régimen Impositivo (DGI Uruguay)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                IRPF Anterior a 2007 (Ficto)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  value={formData.irpfAnt2007}
                  onChange={(e) => setFormData({ ...formData, irpfAnt2007: parseFloat(e.target.value) || 0.018 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
                <span className="text-emerald-400 font-bold text-sm">
                  {(formData.irpfAnt2007 * 100).toFixed(1)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Constants.IRPF_ANT_2007 = 0.018</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                IRPF Posterior a 2007 (Plusvalía)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.irpfPost2007}
                  onChange={(e) => setFormData({ ...formData, irpfPost2007: parseFloat(e.target.value) || 0.12 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
                <span className="text-emerald-400 font-bold text-sm">
                  {(formData.irpfPost2007 * 100).toFixed(0)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Constants.IRPF_POST_2007 = 0.12</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                ITP (Transmisiones Patrimoniales)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.005"
                  min="0"
                  max="1"
                  value={formData.itp}
                  onChange={(e) => setFormData({ ...formData, itp: parseFloat(e.target.value) || 0.02 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
                <span className="text-cyan-400 font-bold text-sm">{(formData.itp * 100).toFixed(0)}%</span>
              </div>
              <span className="text-[10px] text-slate-500">Constants.ITP = 0.02 (2% catastral)</span>
            </div>
          </div>
        </div>

        {/* Section 3: Split Personal Asesor */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-2">
            <span>3. Comisión Personal del Asesor (Mariano)</span>
          </h3>

          <div className="max-w-xs text-xs">
            <label className="block text-slate-300 font-medium mb-1">
              Split por Defecto para Asesores
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={formData.comisionPersonalDefault}
                onChange={(e) =>
                  setFormData({ ...formData, comisionPersonalDefault: parseFloat(e.target.value) || 0.45 })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
              <span className="text-amber-400 font-bold text-sm">
                {(formData.comisionPersonalDefault * 100).toFixed(0)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Constants.COMISION_PERSONAL_MARIANO = 0.45 (45%)</span>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Los cambios se guardan y sincronizan automáticamente en Firestore.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 text-xs transition-all disabled:opacity-50"
          >
            {saving ? (
              'Guardando en Firebase...'
            ) : saveSuccess ? (
              <span className="flex items-center gap-1.5 text-slate-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-900" />
                ¡Parámetros actualizados!
              </span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Parámetros en Firebase</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
