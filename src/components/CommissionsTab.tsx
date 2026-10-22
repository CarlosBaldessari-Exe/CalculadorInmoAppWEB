import React, { useState } from 'react';
import { CommissionRecord, CommissionStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { updateCommission, deleteCommission } from '../services/firestoreService';
import { formatCurrency, formatPct } from '../utils/calculators';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  Trash2,
  Filter,
  Search,
  Building,
  User,
  AlertCircle,
  Layers,
} from 'lucide-react';

interface CommissionsTabProps {
  commissions: CommissionRecord[];
}

export const CommissionsTab: React.FC<CommissionsTabProps> = ({ commissions }) => {
  const { user, userProfile, isAdmin } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Status transitions
  const handleStatusChange = async (id: string, newStatus: CommissionStatus) => {
    setUpdatingId(id);
    try {
      await updateCommission(id, { estado: newStatus });
    } catch (err) {
      console.error('Error updating commission status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, title?: string) => {
    if (window.confirm(`¿Eliminar este registro de comisión (${title || 'operación'}) de Firebase?`)) {
      try {
        await deleteCommission(id);
      } catch (err) {
        console.error('Error deleting commission:', err);
      }
    }
  };

  // KPIs
  const totalFacturadoUSD = commissions
    .filter((c) => c.moneda === 'USD')
    .reduce((sum, c) => sum + (c.totalComisionConIVA || 0), 0);

  const totalFacturadoUYU = commissions
    .filter((c) => c.moneda === 'UYU')
    .reduce((sum, c) => sum + (c.totalComisionConIVA || 0), 0);

  const tuComisionCobradaUSD = commissions
    .filter((c) => c.moneda === 'USD' && (c.estado === 'cobrada' || c.estado === 'liquidada'))
    .reduce((sum, c) => sum + (c.comisionAsesor || 0), 0);

  const tuComisionPendienteUSD = commissions
    .filter((c) => c.moneda === 'USD' && c.estado === 'pendiente')
    .reduce((sum, c) => sum + (c.comisionAsesor || 0), 0);

  // Filtered list
  const filteredCommissions = commissions.filter((c) => {
    const matchStatus = filterStatus === 'todos' || c.estado === filterStatus;
    const matchSearch =
      (c.propertyTitulo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (c.clienteNombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (c.asesorNombre?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusBadge = (estado: CommissionStatus) => {
    const styles: Record<CommissionStatus, string> = {
      borrador: 'bg-slate-700/60 text-slate-300 border-slate-600',
      pendiente: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      cobrada: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      liquidada: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${styles[estado]}`}>
        {estado}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tu Comisión Ganada (Cobrada) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Tu Comisión Cobrada</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {formatCurrency(tuComisionCobradaUSD, 'USD')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Liquidaciones recibidas</p>
        </div>

        {/* Card 2: Tu Comisión Pendiente */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Tu Comisión Pendiente</span>
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {formatCurrency(tuComisionPendienteUSD, 'USD')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">En proceso de cierre / escrituración</p>
        </div>

        {/* Card 3: Total Honorarios Facturados USD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Facturado (USD)</span>
            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {formatCurrency(totalFacturadoUSD, 'USD')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Comisiones + IVA totales</p>
        </div>

        {/* Card 4: Total Operaciones */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Operaciones en Firebase</span>
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-400 mt-2">
            {commissions.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Sincronizadas en la nube</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por propiedad, cliente o asesor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="todos">Todos los Estados</option>
            <option value="pendiente">Pendientes de Cobro</option>
            <option value="cobrada">Cobradas</option>
            <option value="liquidada">Liquidadas</option>
            <option value="borrador">Borradores</option>
          </select>
        </div>
      </div>

      {/* Commissions Table / Ledger */}
      {filteredCommissions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">No hay liquidaciones registradas</h3>
          <p className="text-xs max-w-sm mx-auto">
            Ve a la pestaña de la Calculadora, realiza una simulación y presiona "Guardar Comisión en Firebase".
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Operación / Propiedad</th>
                  <th className="py-3 px-3">Monto Base</th>
                  <th className="py-3 px-3">Comisión + IVA</th>
                  <th className="py-3 px-3">Tu Comisión (Asesor)</th>
                  <th className="py-3 px-3">Asesor</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCommissions.map((c) => {
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                      {/* Operation & Property */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">
                          {c.propertyTitulo || 'Operación Directa'}
                        </div>
                        <div className="text-[11px] text-amber-400 font-medium capitalize mt-0.5">
                          {c.tipoOperacion.replace('_', ' ')}
                          {c.puntas ? ` (${c.puntas} puntas - ${(c.porcentajeComision ?? 0.03) * 100}%)` : ''}
                        </div>
                        {c.clienteNombre && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Cliente: {c.clienteNombre}
                          </div>
                        )}
                      </td>

                      {/* Monto Operacion */}
                      <td className="py-3.5 px-3 font-semibold text-white whitespace-nowrap">
                        {formatCurrency(c.montoOperacion, c.moneda)}
                      </td>

                      {/* Total Inmobiliaria con IVA */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-amber-300">
                          {formatCurrency(c.totalComisionConIVA, c.moneda)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Bruta: {formatCurrency(c.comisionInmobiliaria || 0, c.moneda)} | IVA: {formatCurrency(c.ivaMonto || 0, c.moneda)}
                        </div>
                      </td>

                      {/* Tu Comisión Asesor (Mariano) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-black text-amber-400 text-sm">
                          {formatCurrency(c.comisionAsesor || 0, c.moneda)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Split: {formatPct(c.porcentajeAsesor || 0.45)}
                        </div>
                      </td>

                      {/* Asesor */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-300">
                        {c.asesorNombre || 'Mariano'}
                      </td>

                      {/* Status + quick change dropdown */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <select
                          value={c.estado}
                          disabled={updatingId === c.id}
                          onChange={(e) => handleStatusChange(c.id, e.target.value as CommissionStatus)}
                          className={`text-xs font-bold rounded-lg px-2 py-1 border focus:outline-none ${
                            c.estado === 'cobrada'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                              : c.estado === 'pendiente'
                              ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                              : c.estado === 'liquidada'
                              ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                              : 'bg-slate-900 text-slate-300 border-slate-700'
                          }`}
                        >
                          <option value="borrador">Borrador</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="cobrada">Cobrada</option>
                          <option value="liquidada">Liquidada</option>
                        </select>
                      </td>

                      {/* Fecha */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-400 text-[11px]">
                        {c.fechaOperacion || (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-')}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(c.id, c.propertyTitulo)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
