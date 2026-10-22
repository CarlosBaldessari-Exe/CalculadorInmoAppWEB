import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Calculator,
  DollarSign,
  Users,
  Settings,
  CheckCircle2,
  LogOut,
  LogIn,
  Percent,
  Sparkles,
  Database,
  TrendingUp,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'calculator' | 'properties' | 'commissions' | 'yield' | 'users' | 'settings';
  setActiveTab: (tab: 'calculator' | 'properties' | 'commissions' | 'yield' | 'users' | 'settings') => void;
  propertiesCount: number;
  commissionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  propertiesCount,
  commissionsCount,
}) => {
  const { user, userProfile, isAdmin, signInWithGoogle, signOut, updatePersonalSplit } = useAuth();
  const [editingSplit, setEditingSplit] = useState(false);
  const [customSplit, setCustomSplit] = useState(
    ((userProfile?.porcentajeComisionPersonal ?? 0.45) * 100).toString()
  );

  const handleSaveSplit = async () => {
    const num = parseFloat(customSplit);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      await updatePersonalSplit(num / 100);
      setEditingSplit(false);
    }
  };

  const navItems = [
    {
      id: 'calculator' as const,
      label: 'Calculadora',
      icon: Calculator,
      badge: null,
    },
    {
      id: 'properties' as const,
      label: 'Propiedades',
      icon: Building2,
      badge: propertiesCount > 0 ? propertiesCount : null,
    },
    {
      id: 'commissions' as const,
      label: 'Comisiones',
      icon: DollarSign,
      badge: commissionsCount > 0 ? commissionsCount : null,
    },
    {
      id: 'yield' as const,
      label: 'Gráficas Rentabilidad',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'users' as const,
      label: 'Equipo / Asesores',
      icon: Users,
      badge: null,
    },
    {
      id: 'settings' as const,
      label: 'Parámetros',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      {/* Top Banner with branding & auth */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl">
              CI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                  Calculador Inmobiliario
                </h1>
                <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Firebase Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Gestión de propiedades, liquidación de comisiones e impuestos en tiempo real
              </p>
            </div>
          </div>

          {/* Right section: Sync Badge, User info & Auth */}
          <div className="flex items-center gap-3">
            {/* Firebase Live Status */}
            <div className="hidden md:flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <Database className="w-3.5 h-3.5" />
              <span className="font-medium">Firestore Conectado</span>
            </div>

            {/* Advisor Personal Split widget */}
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1 rounded-lg text-xs">
              <span className="text-slate-400">Tu Split:</span>
              {editingSplit ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={customSplit}
                    onChange={(e) => setCustomSplit(e.target.value)}
                    className="w-12 bg-slate-950 text-amber-300 font-bold px-1 py-0.5 rounded border border-amber-500 text-center text-xs"
                    autoFocus
                  />
                  <span className="text-amber-300 font-bold">%</span>
                  <button
                    onClick={handleSaveSplit}
                    className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-bold hover:bg-amber-400 text-[10px]"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingSplit(true)}
                  className="font-bold text-amber-400 hover:text-amber-300 underline decoration-dotted flex items-center gap-1"
                  title="Haz clic para ajustar tu porcentaje personal de comisión"
                >
                  {((userProfile?.porcentajeComisionPersonal ?? 0.45) * 100).toFixed(0)}%
                  <Percent className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Auth / Profile */}
            {user ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-white leading-tight">
                    {userProfile?.nombre || user.displayName || 'Mariano'}
                  </p>
                  <span className="text-[10px] text-amber-400 font-medium capitalize">
                    {userProfile?.rol || 'Asesor'}
                  </span>
                </div>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="w-8 h-8 rounded-full border border-amber-500/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                    {(user.displayName || userProfile?.nombre || 'M')[0]}
                  </div>
                )}
                <button
                  onClick={() => signOut()}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-md shadow-amber-500/20 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Acceder con Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-slate-950 text-amber-300'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
