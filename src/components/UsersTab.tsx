import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { saveUserProfile } from '../services/firestoreService';
import { formatPct } from '../utils/calculators';
import { Users, UserPlus, Shield, Percent, Mail, Phone, Edit2, Check, X } from 'lucide-react';

interface UsersTabProps {
  users: UserProfile[];
}

export const UsersTab: React.FC<UsersTabProps> = ({ users }) => {
  const { user, userProfile, isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editSplitVal, setEditSplitVal] = useState<string>('45');
  const [saving, setSaving] = useState(false);

  // New user form state
  const [newUserData, setNewUserData] = useState<{
    nombre: string;
    email: string;
    porcentajeComisionPersonal: number;
    rol: UserRole;
    telefono: string;
  }>({
    nombre: '',
    email: '',
    porcentajeComisionPersonal: 0.45,
    rol: 'asesor',
    telefono: '',
  });

  const handleStartEdit = (u: UserProfile) => {
    setEditingUserId(u.uid);
    setEditSplitVal((u.porcentajeComisionPersonal * 100).toFixed(0));
  };

  const handleSaveEditSplit = async (u: UserProfile) => {
    const val = parseFloat(editSplitVal);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setSaving(true);
      try {
        await saveUserProfile({
          ...u,
          porcentajeComisionPersonal: val / 100,
          updatedAt: new Date().toISOString(),
        });
        setEditingUserId(null);
      } catch (err) {
        console.error('Error updating user split:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.nombre.trim() || !newUserData.email.trim()) return;

    setSaving(true);
    try {
      // Create user profile in Firestore
      const dummyUid = 'user_' + Math.random().toString(36).substring(2, 9);
      const profileToSave: UserProfile = {
        uid: dummyUid,
        nombre: newUserData.nombre,
        email: newUserData.email,
        porcentajeComisionPersonal: Number(newUserData.porcentajeComisionPersonal),
        rol: newUserData.rol,
        telefono: newUserData.telefono || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveUserProfile(profileToSave);
      setIsModalOpen(false);
      setNewUserData({
        nombre: '',
        email: '',
        porcentajeComisionPersonal: 0.45,
        rol: 'asesor',
        telefono: '',
      });
    } catch (err) {
      console.error('Error creating user profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            Equipo y Asesores Inmobiliarios
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mapeo directo de la clase <code>Usuario.java</code>: nombre, split de comisión asignado y sincronización en Firebase.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Agregar Asesor</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.map((u) => {
          const isCurrentUser = u.uid === user?.uid || u.uid === userProfile?.uid;
          const isEditing = editingUserId === u.uid;

          return (
            <div
              key={u.uid}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-lg relative flex flex-col justify-between transition-all ${
                isCurrentUser
                  ? 'border-amber-500/50 shadow-amber-500/5 ring-1 ring-amber-500/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                      u.rol === 'administrador'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : u.rol === 'broker'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {u.rol}
                  </span>

                  {isCurrentUser && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                      Tú (Activo)
                    </span>
                  )}
                </div>

                {/* User Avatar + Name */}
                <div className="flex items-center gap-3">
                  {u.fotoUrl ? (
                    <img
                      src={u.fotoUrl}
                      alt={u.nombre}
                      className="w-12 h-12 rounded-full border border-amber-500/40 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black flex items-center justify-center text-lg shadow-md">
                      {u.nombre ? u.nombre[0].toUpperCase() : 'U'}
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">{u.nombre}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span className="truncate max-w-[170px]">{u.email}</span>
                    </p>
                  </div>
                </div>

                {/* Split Commission Metric Card */}
                <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Porcentaje de Comisión
                    </span>
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editSplitVal}
                          onChange={(e) => setEditSplitVal(e.target.value)}
                          className="w-16 bg-slate-900 border border-amber-500 text-amber-300 font-bold px-2 py-0.5 rounded text-sm text-center"
                        />
                        <span className="text-amber-400 font-bold">%</span>
                        <button
                          onClick={() => handleSaveEditSplit(u)}
                          disabled={saving}
                          className="p-1 bg-amber-500 text-slate-950 rounded hover:bg-amber-400"
                          title="Guardar"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-xl font-black text-amber-400 mt-0.5">
                        {formatPct(u.porcentajeComisionPersonal)}
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <button
                      onClick={() => handleStartEdit(u)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
                      title="Modificar split de comisión"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Modificar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Footer info */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between items-center">
                <span>{u.telefono ? `Tel: ${u.telefono}` : 'Sin teléfono'}</span>
                <span>ID: {u.uid.slice(0, 8)}...</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Add New Advisor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" />
              Agregar Asesor al Equipo
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mariano Baldessari"
                  value={newUserData.nombre}
                  onChange={(e) => setNewUserData({ ...newUserData, nombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="mariano@inmobiliaria.com"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Split Comisión (0 - 1)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    required
                    value={newUserData.porcentajeComisionPersonal}
                    onChange={(e) =>
                      setNewUserData({
                        ...newUserData,
                        porcentajeComisionPersonal: parseFloat(e.target.value) || 0.45,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Ej: 0.45 = 45% (Mariano)
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Rol</label>
                  <select
                    value={newUserData.rol}
                    onChange={(e) => setNewUserData({ ...newUserData, rol: e.target.value as UserRole })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="asesor">Asesor</option>
                    <option value="broker">Broker</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+598 99 000 000"
                  value={newUserData.telefono}
                  onChange={(e) => setNewUserData({ ...newUserData, telefono: e.target.value })}
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
                  {saving ? 'Guardando en Firebase...' : 'Guardar Asesor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
