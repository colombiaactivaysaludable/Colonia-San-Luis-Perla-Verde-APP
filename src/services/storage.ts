import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Match, Player, Callup } from '../types';

// 1. LIMPIEZA ABSOLUTA DE MEMORIA LOCAL OBSOLETA
if (typeof window !== 'undefined') {
  localStorage.removeItem('matches');
  localStorage.removeItem('players');
  localStorage.removeItem('callups');
  localStorage.removeItem('app_data');
}

// 2. ESCUCHADORES EN TIEMPO REAL (FIRESTORE)

/**
 * Suscripción en tiempo real a la colección de Partidos
 */
export const subscribeToMatches = (callback: (matches: Match[]) => void) => {
  return onSnapshot(
    collection(db, 'matches'),
    (snapshot) => {
      const matches = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      })) as Match[];
      callback(matches);
    },
    (error) => {
      console.error('Error al escuchar partidos desde Firestore:', error);
    }
  );
};

/**
 * Suscripción en tiempo real a la colección de Jugadores
 */
export const subscribeToPlayers = (callback: (players: Player[]) => void) => {
  return onSnapshot(
    collection(db, 'players'),
    (snapshot) => {
      const players = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      })) as Player[];
      callback(players);
    },
    (error) => {
      console.error('Error al escuchar jugadores desde Firestore:', error);
    }
  );
};

/**
 * Suscripción en tiempo real a la colección de Convocatorias
 */
export const subscribeToCallups = (callback: (callups: Callup[]) => void) => {
  return onSnapshot(
    collection(db, 'callups'),
    (snapshot) => {
      const callups = snapshot.docs.map((document) => document.data() as Callup);
      callback(callups);
    },
    (error) => {
      console.error('Error al escuchar convocatorias desde Firestore:', error);
    }
  );
};

// 3. OPERACIONES DE ESCRITURA EN LA NUBE

/**
 * Guarda o actualiza un partido directamente en Firestore
 */
export const saveMatch = async (matchData: Partial<Match> & { id?: string }) => {
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

/**
 * Elimina un partido de Firestore
 */
export const deleteMatch = async (matchId: string) => {
  await deleteDoc(doc(db, 'matches', matchId));
};

/**
 * Registra o actualiza la asistencia de un jugador
 */
export const saveAttendance = async (matchId: string, playerId: string, confirmed: boolean) => {
  const docId = `${matchId}_${playerId}`;
  const callupRef = doc(db, 'callups', docId);

  await setDoc(
    callupRef,
    {
      matchId,
      playerId,
      confirmed,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};
