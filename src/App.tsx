import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { CalculatorTab } from './components/CalculatorTab';
import { PropertiesTab } from './components/PropertiesTab';
import { CommissionsTab } from './components/CommissionsTab';
import { UsersTab } from './components/UsersTab';
import { SettingsTab } from './components/SettingsTab';
import { YieldAnalyticsTab } from './components/YieldAnalyticsTab';
import { DealSheetModal } from './components/DealSheetModal';
import { Property, CommissionRecord, UserProfile, AgencySettings } from './types';
import { DEFAULT_SETTINGS } from './utils/calculators';
import { SAMPLE_PROPERTIES_LOCAL, SAMPLE_COMMISSIONS_LOCAL } from './data/sampleData';
import {
  subscribeProperties,
  subscribeCommissions,
  subscribeUsers,
  subscribeAgencySettings,
} from './services/firestoreService';
import { Database, AlertCircle, LogIn, Cloud, Sparkles } from 'lucide-react';

function MainApp() {
  const { user, userProfile, loading, isAdmin, signInWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<'calculator' | 'properties' | 'commissions' | 'yield' | 'users' | 'settings'>('calculator');

  // Firestore & local state
  const [properties, setProperties] = useState<Property[]>(SAMPLE_PROPERTIES_LOCAL);
  const [commissions, setCommissions] = useState<CommissionRecord[]>(SAMPLE_COMMISSIONS_LOCAL);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<AgencySettings>(DEFAULT_SETTINGS);

  const [loadingInitial, setLoadingInitial] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Cross-tab interaction: preselected property from properties tab
  const [preselectedProperty, setPreselectedProperty] = useState<Property | null>(null);

  // Deal sheet modal
  const [dealSheetData, setDealSheetData] = useState<any | null>(null);

  // 1. Subscribe to Properties - CRITICAL: Only attach onSnapshot when user is authenticated
  useEffect(() => {
    if (!user) {
      setProperties(SAMPLE_PROPERTIES_LOCAL);
      return;
    }

    setLoadingInitial(true);
    const unsubProps = subscribeProperties(
      (props) => {
        if (props.length > 0) {
          setProperties(props);
        } else {
          setProperties(SAMPLE_PROPERTIES_LOCAL);
        }
        setLoadingInitial(false);
      },
      (err) => {
        console.error('Properties subscription error:', err);
        setLoadingInitial(false);
      }
    );

    return () => unsubProps();
  }, [user]);

  // 2. Subscribe to Commissions - CRITICAL: Only attach onSnapshot when user is authenticated
  useEffect(() => {
    if (!user) {
      setCommissions(SAMPLE_COMMISSIONS_LOCAL);
      return;
    }

    const unsubComms = subscribeCommissions(
      user.uid,
      isAdmin,
      (comms) => {
        if (comms.length > 0) {
          setCommissions(comms);
        } else {
          setCommissions(SAMPLE_COMMISSIONS_LOCAL);
        }
      },
      (err) => {
        console.error('Commissions subscription error:', err);
      }
    );

    return () => unsubComms();
  }, [user, isAdmin]);

  // 3. Subscribe to Users - CRITICAL: Only attach onSnapshot when user is authenticated
  useEffect(() => {
    if (!user) {
      if (userProfile) setUsers([userProfile]);
      return;
    }

    const unsubUsers = subscribeUsers(
      (usrList) => {
        if (usrList.length > 0) {
          setUsers(usrList);
        } else if (userProfile) {
          setUsers([userProfile]);
        }
      },
      (err) => {
        console.error('Users subscription error:', err);
      }
    );

    return () => unsubUsers();
  }, [user, userProfile]);

  // 4. Subscribe to Agency Settings - CRITICAL: Only attach onSnapshot when user is authenticated
  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      return;
    }

    const unsubSettings = subscribeAgencySettings(
      (newSettings) => {
        setSettings(newSettings);
      },
      (err) => {
        console.error('Settings subscription error:', err);
      }
    );

    return () => unsubSettings();
  }, [user]);

  // Handle select property from Properties tab and jump to calculator
  const handleSelectPropertyToCalculate = (property: Property) => {
    setPreselectedProperty(property);
    setActiveTab('calculator');
  };

  // If initial auth is still bootstrapping
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-4 animate-pulse">
          <Database className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
        <h2 className="text-base font-bold tracking-tight">Calculador Inmobiliario Pro</h2>
        <p className="text-xs text-slate-400 mt-1">Conectando con Firebase...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation & Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        propertiesCount={properties.length}
        commissionsCount={commissions.length}
      />

      {/* Guest Mode Banner if not authenticated */}
      {!user && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border-b border-amber-500/25 py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <Cloud className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Modo Vista Previa:</strong> Puedes probar la calculadora de comisiones e impuestos en modo local. Inicia sesión con Google para sincronizar tus datos en tiempo real con Firebase Firestore.
              </span>
            </div>
            <button
              onClick={() => signInWithGoogle()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Conectar con Google</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Firestore Alert if any */}
        {firestoreError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{firestoreError}</span>
            </div>
            <button
              onClick={() => setFirestoreError(null)}
              className="text-rose-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'calculator' && (
          <CalculatorTab
            properties={properties}
            settings={settings}
            preselectedProperty={preselectedProperty}
            onOpenDealSheet={(data) => setDealSheetData(data)}
            onNavigateToYield={() => setActiveTab('yield')}
          />
        )}

        {activeTab === 'properties' && (
          <PropertiesTab
            properties={properties}
            onSelectPropertyToCalculate={handleSelectPropertyToCalculate}
            onSelectPropertyForYield={(prop) => {
              setPreselectedProperty(prop);
              setActiveTab('yield');
            }}
          />
        )}

        {activeTab === 'commissions' && (
          <CommissionsTab commissions={commissions} />
        )}

        {activeTab === 'yield' && (
          <YieldAnalyticsTab properties={properties} settings={settings} />
        )}

        {activeTab === 'users' && (
          <UsersTab users={users.length > 0 ? users : userProfile ? [userProfile] : []} />
        )}

        {activeTab === 'settings' && (
          <SettingsTab settings={settings} />
        )}
      </main>

      {/* Deal Sheet Modal for Printing & Sharing */}
      <DealSheetModal data={dealSheetData} onClose={() => setDealSheetData(null)} />

      {/* Footer with Firebase synchronization info */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-xs py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span>
              Calculador Inmobiliario App &bull; {user ? 'Sincronizado con Google Cloud Firestore' : 'Modo local interactivo'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Regulado por normativa inmobiliaria y tributaria de Uruguay (IVA 22%, IRPF, ITP)
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
