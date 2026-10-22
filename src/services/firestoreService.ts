import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, FirestoreOperationType } from '../firebase/config';
import { Property, CommissionRecord, UserProfile, AgencySettings } from '../types';
import { DEFAULT_SETTINGS } from '../utils/calculators';

// Collection paths
export const USERS_COLLECTION = 'users';
export const PROPERTIES_COLLECTION = 'properties';
export const COMMISSIONS_COLLECTION = 'commissions';
export const SETTINGS_COLLECTION = 'settings';
export const SETTINGS_DOC_ID = 'agency_config';

// --- Users Service ---
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, FirestoreOperationType.GET, path);
  }
}

export async function saveUserProfile(userProfile: UserProfile): Promise<void> {
  const path = `${USERS_COLLECTION}/${userProfile.uid}`;
  try {
    const cleanData: Record<string, unknown> = {
      uid: userProfile.uid,
      nombre: userProfile.nombre,
      email: userProfile.email,
      porcentajeComisionPersonal: Number(userProfile.porcentajeComisionPersonal),
      rol: userProfile.rol,
      updatedAt: new Date().toISOString(),
    };
    if (userProfile.telefono) cleanData.telefono = userProfile.telefono;
    if (userProfile.fotoUrl) cleanData.fotoUrl = userProfile.fotoUrl;
    if (userProfile.createdAt) cleanData.createdAt = userProfile.createdAt;
    else cleanData.createdAt = new Date().toISOString();

    await setDoc(doc(db, USERS_COLLECTION, userProfile.uid), cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, FirestoreOperationType.WRITE, path);
  }
}

export function subscribeUsers(
  onSuccess: (users: UserProfile[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((d) => users.push(d.data() as UserProfile));
      onSuccess(users);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, FirestoreOperationType.LIST, USERS_COLLECTION);
    }
  );
}

// --- Properties Service ---
export function subscribeProperties(
  onSuccess: (properties: Property[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, PROPERTIES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const properties: Property[] = [];
      snapshot.forEach((d) => {
        properties.push({ id: d.id, ...(d.data() as Omit<Property, 'id'>) });
      });
      // Sort in memory by updatedAt or createdAt desc
      properties.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      onSuccess(properties);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, FirestoreOperationType.LIST, PROPERTIES_COLLECTION);
    }
  );
}

export async function addProperty(property: Omit<Property, 'id'>): Promise<string> {
  const colRef = collection(db, PROPERTIES_COLLECTION);
  const newDocRef = doc(colRef);
  const path = `${PROPERTIES_COLLECTION}/${newDocRef.id}`;
  try {
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      titulo: property.titulo,
      tipoOperacion: property.tipoOperacion,
      precio: Number(property.precio),
      moneda: property.moneda,
      asesorId: property.asesorId,
      estado: property.estado,
      createdAt: now,
      updatedAt: now,
    };
    if (property.direccion) payload.direccion = property.direccion;
    if (property.ciudad) payload.ciudad = property.ciudad;
    if (property.barrio) payload.barrio = property.barrio;
    if (typeof property.dormitorios === 'number') payload.dormitorios = property.dormitorios;
    if (typeof property.banios === 'number') payload.banios = property.banios;
    if (typeof property.metraje === 'number') payload.metraje = property.metraje;
    if (typeof property.anioCompra === 'number') payload.anioCompra = property.anioCompra;
    if (typeof property.valorCompra === 'number') payload.valorCompra = property.valorCompra;
    if (typeof property.valorCatastral === 'number') payload.valorCatastral = property.valorCatastral;
    if (typeof property.alquilerMensualEstimado === 'number') payload.alquilerMensualEstimado = property.alquilerMensualEstimado;
    if (typeof property.gastosAnualesEstimados === 'number') payload.gastosAnualesEstimados = property.gastosAnualesEstimados;
    if (property.propietarioNombre) payload.propietarioNombre = property.propietarioNombre;
    if (property.propietarioContacto) payload.propietarioContacto = property.propietarioContacto;
    if (property.asesorNombre) payload.asesorNombre = property.asesorNombre;
    if (property.notas) payload.notas = property.notas;

    await setDoc(newDocRef, payload);
    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, FirestoreOperationType.CREATE, path);
  }
}

export async function updateProperty(id: string, property: Partial<Property>): Promise<void> {
  const path = `${PROPERTIES_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, PROPERTIES_COLLECTION, id);
    const payload: Record<string, unknown> = {
      ...property,
      updatedAt: new Date().toISOString(),
    };
    delete payload.id;
    await updateDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, FirestoreOperationType.UPDATE, path);
  }
}

export async function deleteProperty(id: string): Promise<void> {
  const path = `${PROPERTIES_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, PROPERTIES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, FirestoreOperationType.DELETE, path);
  }
}

// --- Commissions Service ---
export function subscribeCommissions(
  userId: string,
  isAdmin: boolean,
  onSuccess: (commissions: CommissionRecord[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COMMISSIONS_COLLECTION);
  // If not admin, Firestore rules enforce querying where asesorId == userId
  const q = isAdmin ? colRef : query(colRef, where('asesorId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: CommissionRecord[] = [];
      snapshot.forEach((d) => {
        records.push({ id: d.id, ...(d.data() as Omit<CommissionRecord, 'id'>) });
      });
      records.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      onSuccess(records);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, FirestoreOperationType.LIST, COMMISSIONS_COLLECTION);
    }
  );
}

export async function addCommission(commission: Omit<CommissionRecord, 'id'>): Promise<string> {
  const colRef = collection(db, COMMISSIONS_COLLECTION);
  const newDocRef = doc(colRef);
  const path = `${COMMISSIONS_COLLECTION}/${newDocRef.id}`;
  try {
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      tipoOperacion: commission.tipoOperacion,
      montoOperacion: Number(commission.montoOperacion),
      moneda: commission.moneda,
      asesorId: commission.asesorId,
      asesorNombre: commission.asesorNombre,
      totalComisionConIVA: Number(commission.totalComisionConIVA),
      estado: commission.estado || 'borrador',
      createdAt: now,
      updatedAt: now,
    };
    if (commission.propertyId) payload.propertyId = commission.propertyId;
    if (commission.propertyTitulo) payload.propertyTitulo = commission.propertyTitulo;
    if (typeof commission.puntas === 'number') payload.puntas = commission.puntas;
    if (typeof commission.porcentajeComision === 'number') payload.porcentajeComision = commission.porcentajeComision;
    if (typeof commission.comisionInmobiliaria === 'number') payload.comisionInmobiliaria = commission.comisionInmobiliaria;
    if (typeof commission.ivaMonto === 'number') payload.ivaMonto = commission.ivaMonto;
    if (typeof commission.porcentajeAsesor === 'number') payload.porcentajeAsesor = commission.porcentajeAsesor;
    if (typeof commission.comisionAsesor === 'number') payload.comisionAsesor = commission.comisionAsesor;
    if (typeof commission.comisionAgencia === 'number') payload.comisionAgencia = commission.comisionAgencia;
    if (typeof commission.irpfCalculado === 'number') payload.irpfCalculado = commission.irpfCalculado;
    if (typeof commission.itpCalculado === 'number') payload.itpCalculado = commission.itpCalculado;
    if (typeof commission.rentabilidadBruta === 'number') payload.rentabilidadBruta = commission.rentabilidadBruta;
    if (typeof commission.rentabilidadNeta === 'number') payload.rentabilidadNeta = commission.rentabilidadNeta;
    if (commission.clienteNombre) payload.clienteNombre = commission.clienteNombre;
    if (commission.fechaOperacion) payload.fechaOperacion = commission.fechaOperacion;
    if (commission.notas) payload.notas = commission.notas;

    await setDoc(newDocRef, payload);
    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, FirestoreOperationType.CREATE, path);
  }
}

export async function updateCommission(id: string, commission: Partial<CommissionRecord>): Promise<void> {
  const path = `${COMMISSIONS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, COMMISSIONS_COLLECTION, id);
    const payload: Record<string, unknown> = {
      ...commission,
      updatedAt: new Date().toISOString(),
    };
    delete payload.id;
    await updateDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, FirestoreOperationType.UPDATE, path);
  }
}

export async function deleteCommission(id: string): Promise<void> {
  const path = `${COMMISSIONS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, COMMISSIONS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, FirestoreOperationType.DELETE, path);
  }
}

// --- Agency Settings Service ---
export function subscribeAgencySettings(
  onSuccess: (settings: AgencySettings) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onSuccess(snapshot.data() as AgencySettings);
      } else {
        onSuccess(DEFAULT_SETTINGS);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, FirestoreOperationType.GET, `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`);
    }
  );
}

export async function saveAgencySettings(settings: AgencySettings, userId: string): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`;
  try {
    const payload: AgencySettings = {
      ...settings,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, FirestoreOperationType.WRITE, path);
  }
}

// --- Auto-seed initial demo portfolio if database is brand new ---
export async function seedSampleData(advisorId: string, advisorName: string): Promise<void> {
  try {
    const propsSnap = await getDocs(collection(db, PROPERTIES_COLLECTION));
    if (propsSnap.size > 0) return; // already has data

    const sampleProperties: Omit<Property, 'id'>[] = [
      {
        titulo: 'Apartamento de Lujo frente al mar en Pocitos',
        tipoOperacion: 'venta',
        precio: 285000,
        moneda: 'USD',
        direccion: 'Rambla República del Perú y Gabriel Pereira',
        ciudad: 'Montevideo',
        barrio: 'Pocitos',
        dormitorios: 3,
        banios: 2,
        metraje: 110,
        anioCompra: 2004,
        valorCatastral: 3200000,
        alquilerMensualEstimado: 1400,
        gastosAnualesEstimados: 2200,
        estado: 'disponible',
        propietarioNombre: 'Gonzalo Silva',
        propietarioContacto: '+598 99 123 456',
        asesorId: advisorId,
        asesorNombre: advisorName,
        notas: 'Excelente estado, vista despejada. Comprado antes de 2007 (IRPF ficto 1.8%).',
      },
      {
        titulo: 'Casa moderna con piscina en San Rafael',
        tipoOperacion: 'venta',
        precio: 450000,
        moneda: 'USD',
        direccion: 'Av. Pedragosa Sierra y Shakespeare',
        ciudad: 'Punta del Este',
        barrio: 'San Rafael',
        dormitorios: 4,
        banios: 3,
        metraje: 260,
        anioCompra: 2016,
        valorCompra: 340000,
        valorCatastral: 5800000,
        alquilerMensualEstimado: 2500,
        gastosAnualesEstimados: 4000,
        estado: 'reservada',
        propietarioNombre: 'Lucía Fernández',
        propietarioContacto: '+598 98 654 321',
        asesorId: advisorId,
        asesorNombre: advisorName,
        notas: 'Ambas puntas en negociación (6% total). Ganancia estimada: USD 110.000.',
      },
      {
        titulo: 'Penthouse con terraza parrillero en Punta Carretas',
        tipoOperacion: 'alquiler_anual',
        precio: 48000,
        moneda: 'UYU',
        direccion: 'Solano Antuña y Ellauri',
        ciudad: 'Montevideo',
        barrio: 'Punta Carretas',
        dormitorios: 2,
        banios: 2,
        metraje: 85,
        estado: 'disponible',
        propietarioNombre: 'Martín Rodríguez',
        propietarioContacto: '+598 94 888 999',
        asesorId: advisorId,
        asesorNombre: advisorName,
        notas: 'Honorarios correspondientes a 1 mes de alquiler + IVA.',
      },
      {
        titulo: 'Chalet de Verano frente al mar en La Barra',
        tipoOperacion: 'alquiler_temporal',
        precio: 12000,
        moneda: 'USD',
        direccion: 'Ruta 10 km 160',
        ciudad: 'Maldonado',
        barrio: 'La Barra',
        dormitorios: 3,
        banios: 2,
        metraje: 140,
        estado: 'disponible',
        propietarioNombre: 'Esteban Méndez',
        propietarioContacto: '+598 91 333 444',
        asesorId: advisorId,
        asesorNombre: advisorName,
        notas: 'Alquiler quincena de enero. Comisión 10% IVA incluido.',
      },
    ];

    for (const prop of sampleProperties) {
      await addProperty(prop);
    }

    // Add a couple of initial sample commission records
    const sampleCommission1: Omit<CommissionRecord, 'id'> = {
      propertyTitulo: 'Apartamento de Lujo frente al mar en Pocitos',
      tipoOperacion: 'venta',
      montoOperacion: 285000,
      moneda: 'USD',
      puntas: 2,
      porcentajeComision: 0.06,
      comisionInmobiliaria: 17100,
      ivaMonto: 3762,
      totalComisionConIVA: 20862,
      porcentajeAsesor: 0.45,
      comisionAsesor: 9387.90,
      comisionAgencia: 11474.10,
      irpfCalculado: 5130, // 1.8%
      itpCalculado: 64000,
      estado: 'pendiente',
      asesorId: advisorId,
      asesorNombre: advisorName,
      clienteNombre: 'Familia Larrosa (Comprador) y Gonzalo Silva (Vendedor)',
      fechaOperacion: new Date().toISOString().split('T')[0],
      notas: 'Cierre acordado en escribanía. Se pactaron 2 puntas completas (6% + IVA).',
    };

    const sampleCommission2: Omit<CommissionRecord, 'id'> = {
      propertyTitulo: 'Penthouse con terraza parrillero en Punta Carretas',
      tipoOperacion: 'alquiler_anual',
      montoOperacion: 48000,
      moneda: 'UYU',
      comisionInmobiliaria: 48000,
      ivaMonto: 10560,
      totalComisionConIVA: 58560,
      porcentajeAsesor: 0.45,
      comisionAsesor: 26352,
      comisionAgencia: 32208,
      estado: 'cobrada',
      asesorId: advisorId,
      asesorNombre: advisorName,
      clienteNombre: 'Dr. Alejandro Bianchi',
      fechaOperacion: new Date().toISOString().split('T')[0],
      notas: 'Contrato firmado a 2 años con garantía de ANDA.',
    };

    await addCommission(sampleCommission1);
    await addCommission(sampleCommission2);
  } catch (err) {
    console.error('Initial sample seeding skipped:', err);
  }
}
