import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Escuchar cambios en partidos en tiempo real desde Firestore
export const subscribeToMatches = (callback: (matches: any[]) => void) => {
  const matchesRef = collection(db, 'matches');
  return onSnapshot(matchesRef, (snapshot) => {
    const matches = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(matches);
  }, (error) => {
    console.error("Error leyendo partidos de Firestore:", error);
  });
};

// Guardar o actualizar un partido directamente en la nube
export const saveMatch = async (matchData: any) => {
  const matchId = matchData.id || `m_${Date.now()}`;
  const matchRef = doc(db, 'matches', matchId);
  
  const payload = {
    ...matchData,
    id: matchId,
    updatedAt: serverTimestamp(),
  };

  await setDoc(matchRef, payload, { merge: true });
  return matchId;
};

// Eliminar partido de la nube
export const deleteMatch = async (matchId: string) => {
  const matchRef = doc(db, 'matches', matchId);
  await deleteDoc(matchRef);
};

// Escuchar confirmaciones de asistencia (convocatorias) en tiempo real
export const subscribeToCallups = (callback: (callups: any[]) => void) => {
  const callupsRef = collection(db, 'callups');
  return onSnapshot(callupsRef, (snapshot) => {
    const callups = snapshot.docs.map((doc) => doc.data());
    callback(callups);
  }, (error) => {
    console.error("Error leyendo convocatorias de Firestore:", error);
  });
};

// Registrar respuesta de asistencia de un jugador
export const saveAttendance = async (matchId: string, playerId: string, confirmed: boolean) => {
  const docId = `${matchId}_${playerId}`;
  const callupRef = doc(db, 'callups', docId);

  await setDoc(callupRef, {
    matchId,
    playerId,
    confirmed,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};
