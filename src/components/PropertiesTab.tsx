import React, { useState } from 'react';
import { Property, PropertyStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { addProperty, updateProperty, deleteProperty } from '../services/firestoreService';
import { formatCurrency } from '../utils/calculators';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Calculator,
  Edit2,
  Trash2,
  MapPin,
  Home,
  CheckCircle2,
  Clock,
  Layers,
  Phone,
  User,
  X,
  TrendingUp,
} from 'lucide-react';

interface PropertiesTabProps {
  properties: Property[];
  onSelectPropertyToCalculate: (property: Property) => void;
  onSelectPropertyForYield?: (property: Property) => void;
}

export const PropertiesTab: React.FC<PropertiesTabProps> = ({
  properties,
  onSelectPropertyToCalculate,
  onSelectPropertyForYield,
}) => {
  const { user, userProfile, isAdmin, signInWithGoogle } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

  // Form inputs
  const [formData, setFormData] = useState<Omit<Property, 'id'>>({
    titulo: '',
    tipoOperacion: 'venta',
    precio: 200000,
    moneda: 'USD',
    direccion: '',
    ciudad: 'Montevideo',
    barrio: 'Pocitos',
    dormitorios: 2,
    banios: 1,
    metraje: 75,
    anioCompra: 2015,
    valorCompra: 150000,
    valorCatastral: 2000000,
    alquilerMensualEstimado: 1200,
    gastosAnualesEstimados: 1800,
    estado: 'disponible',
    propietarioNombre: '',
    propietarioContacto: '',
    asesorId: user?.uid || userProfile?.uid || 'asesor_1',
    asesorNombre: userProfile?.nombre || user?.displayName || 'Mariano Baldessari',
    notas: '',
  });

  const [saving, setSaving] = useState(false);

  const openNewModal = () => {
    setEditingPropertyId(null);
    setFormData({
      titulo: '',
      tipoOperacion: 'venta',
      precio: 220000,
      moneda: 'USD',
      direccion: '',
      ciudad: 'Montevideo',
      barrio: 'Pocitos',
      dormitorios: 2,
      banios: 1,
      metraje: 75,
      anioCompra: 2012,
      valorCompra: 160000,
      valorCatastral: 2200000,
      alquilerMensualEstimado: 1300,
      gastosAnualesEstimados: 2000,
      estado: 'disponible',
      propietarioNombre: '',
      propietarioContacto: '',
      asesorId: user?.uid || userProfile?.uid || 'asesor_1',
      asesorNombre: userProfile?.nombre || user?.displayName || 'Mariano Baldessari',
      notas: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Property) => {
    setEditingPropertyId(p.id);
    setFormData({
      titulo: p.titulo,
      tipoOperacion: p.tipoOperacion,
      precio: p.precio,
      moneda: p.moneda,
      direccion: p.direccion || '',
      ciudad: p.ciudad || 'Montevideo',
      barrio: p.barrio || '',
      dormitorios: p.dormitorios || 2,
      banios: p.banios || 1,
      metraje: p.metraje || 70,
      anioCompra: p.anioCompra || 2010,
      valorCompra: p.valorCompra || 0,
      valorCatastral: p.valorCatastral || 0,
      alquilerMensualEstimado: p.alquilerMensualEstimado || 0,
      gastosAnualesEstimados: p.gastosAnualesEstimados || 0,
      estado: p.estado,
      propietarioNombre: p.propietarioNombre || '',
      propietarioContacto: p.propietarioContacto || '',
      asesorId: p.asesorId,
      asesorNombre: p.asesorNombre || 'Mariano Baldessari',
      notas: p.notas || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || formData.precio <= 0) return;
    if (!user) {
      try {
        await signInWithGoogle();
      } catch (err) {
        console.warn('Sign-in cancelled:', err);
        return;
      }
    }
    setSaving(true);
    try {
      if (editingPropertyId) {
        await updateProperty(editingPropertyId, formData);
      } else {
        await addProperty({
          ...formData,
          asesorId: user?.uid || userProfile?.uid || 'asesor_1',
          asesorNombre: userProfile?.nombre || user?.displayName || 'Mariano Baldessari',
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving property:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la propiedad "${title}" de Firebase?`)) {
      try {
        await deleteProperty(id);
      } catch (err) {
        console.error('Error deleting property:', err);
      }
    }
  };

  // Filtering
  const filteredProperties = properties.filter((p) => {
    const matchSearch =
      p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barrio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ciudad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.direccion?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = filterType === 'todos' || p.tipoOperacion === filterType;
    const matchStatus = filterStatus === 'todos' || p.estado === filterStatus;

    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Filters, New Property */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por título, barrio, dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="todos">Todos los Tipos</option>
            <option value="venta">Venta</option>
            <option value="alquiler_anual">Alquiler Anual</option>
            <option value="alquiler_temporal">Alquiler Temporal</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="todos">Todos los Estados</option>
            <option value="disponible">Disponibles</option>
            <option value="reservada">Reservadas</option>
            <option value="vendida">Vendidas</option>
            <option value="alquilada">Alquiladas</option>
          </select>

          <button
            onClick={openNewModal}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all ml-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Propiedad</span>
          </button>
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Building2 className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">No se encontraron propiedades</h3>
          <p className="text-xs max-w-sm mx-auto">
            Ajusta los filtros de búsqueda o agrega una nueva propiedad para comenzar a gestionar tu cartera.
          </p>
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-1.5 bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-400"
          >
            <Plus className="w-4 h-4" /> Crear primera propiedad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((prop) => {
            const isVenta = prop.tipoOperacion === 'venta';
            const isAlquiler = prop.tipoOperacion === 'alquiler_anual';
            const isTemp = prop.tipoOperacion === 'alquiler_temporal';

            const statusColors: Record<PropertyStatus, string> = {
              disponible: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              reservada: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              vendida: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              alquilada: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            };

            return (
              <div
                key={prop.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group hover:shadow-2xl hover:shadow-amber-500/5"
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        isVenta
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : isAlquiler
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {isVenta ? 'Venta' : isAlquiler ? 'Alquiler Anual' : 'Alquiler Temporal'}
                    </span>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                        statusColors[prop.estado]
                      }`}
                    >
                      {prop.estado}
                    </span>
                  </div>

                  {/* Title & Price */}
                  <h3 className="font-bold text-white text-base line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors">
                    {prop.titulo}
                  </h3>

                  <div className="text-2xl font-black text-amber-400 mt-2">
                    {formatCurrency(prop.precio, prop.moneda)}
                    {isAlquiler && <span className="text-xs text-slate-400 font-normal"> /mes</span>}
                    {isTemp && <span className="text-xs text-slate-400 font-normal"> /total</span>}
                  </div>

                  {/* Location */}
                  {(prop.barrio || prop.ciudad || prop.direccion) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">
                        {[prop.direccion, prop.barrio, prop.ciudad].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Specs Pill list */}
                  <div className="flex flex-wrap gap-2 mt-3.5 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300">
                    {prop.dormitorios !== undefined && (
                      <span className="bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                        {prop.dormitorios} Dorms
                      </span>
                    )}
                    {prop.banios !== undefined && (
                      <span className="bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                        {prop.banios} Baños
                      </span>
                    )}
                    {prop.metraje !== undefined && (
                      <span className="bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                        {prop.metraje} m²
                      </span>
                    )}
                    {prop.anioCompra && (
                      <span className="bg-slate-950 px-2 py-1 rounded-md border border-slate-800 text-amber-400/90">
                        Adq: {prop.anioCompra} ({prop.anioCompra < 2007 ? 'IRPF 1.8%' : 'IRPF 12%'})
                      </span>
                    )}
                  </div>

                  {/* Owner & Advisor details */}
                  {(prop.propietarioNombre || prop.asesorNombre) && (
                    <div className="mt-3 text-[11px] text-slate-400 space-y-0.5">
                      {prop.propietarioNombre && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>Propietario: {prop.propietarioNombre}</span>
                        </div>
                      )}
                      {prop.asesorNombre && (
                        <div className="text-slate-500">
                          Asesor asignado: <strong className="text-slate-400">{prop.asesorNombre}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectPropertyToCalculate(prop)}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 transition-all"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Calcular Comisiones</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {onSelectPropertyForYield && (
                      <button
                        onClick={() => onSelectPropertyForYield(prop)}
                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Ver gráficas de rentabilidad de este inmueble"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(prop)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Editar propiedad"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(prop.id, prop.titulo)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Eliminar propiedad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Property Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              {editingPropertyId ? 'Editar Propiedad' : 'Registrar Nueva Propiedad'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Título de la Propiedad *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Apartamento frente al mar con terraza en Pocitos"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tipo de Operación *</label>
                  <select
                    value={formData.tipoOperacion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tipoOperacion: e.target.value as 'venta' | 'alquiler_anual' | 'alquiler_temporal',
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="venta">Venta</option>
                    <option value="alquiler_anual">Alquiler Anual</option>
                    <option value="alquiler_temporal">Alquiler Temporal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Moneda *</label>
                  <select
                    value={formData.moneda}
                    onChange={(e) => setFormData({ ...formData, moneda: e.target.value as 'USD' | 'UYU' })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="USD">USD (Dólares)</option>
                    <option value="UYU">$U (Pesos Uruguayos)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Precio *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Barrio / Zona</label>
                  <input
                    type="text"
                    placeholder="Pocitos, Carrasco, etc."
                    value={formData.barrio}
                    onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Dormitorios</label>
                  <input
                    type="number"
                    value={formData.dormitorios}
                    onChange={(e) => setFormData({ ...formData, dormitorios: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Baños</label>
                  <input
                    type="number"
                    value={formData.banios}
                    onChange={(e) => setFormData({ ...formData, banios: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Metros Totales (m²)</label>
                  <input
                    type="number"
                    value={formData.metraje}
                    onChange={(e) => setFormData({ ...formData, metraje: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Tributary & Tax inputs for IRPF and ITP */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <span className="font-bold text-amber-400">Datos Tributarios para IRPF e ITP</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Año de Compra</label>
                    <input
                      type="number"
                      value={formData.anioCompra}
                      onChange={(e) => setFormData({ ...formData, anioCompra: parseInt(e.target.value) || 2010 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Valor de Compra Original</label>
                    <input
                      type="number"
                      value={formData.valorCompra}
                      onChange={(e) => setFormData({ ...formData, valorCompra: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Valor Catastral ($U)</label>
                    <input
                      type="number"
                      value={formData.valorCatastral}
                      onChange={(e) => setFormData({ ...formData, valorCatastral: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Propietario / Dueño</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={formData.propietarioNombre}
                    onChange={(e) => setFormData({ ...formData, propietarioNombre: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Contacto Propietario</label>
                  <input
                    type="text"
                    placeholder="Teléfono o WhatsApp"
                    value={formData.propietarioContacto}
                    onChange={(e) => setFormData({ ...formData, propietarioContacto: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Estado en Cartera</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as PropertyStatus })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="disponible">Disponible</option>
                  <option value="reservada">Reservada</option>
                  <option value="vendida">Vendida</option>
                  <option value="alquilada">Alquilada</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notas Internas</label>
                <textarea
                  rows={2}
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {saving ? 'Guardando en Firebase...' : 'Guardar Propiedad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
