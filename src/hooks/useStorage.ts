import { Match, Player, Team } from '../types';
import { db } from '../firebaseConfig';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

export const storage = {
  // --- PARTIDOS ---
  getMatches: async (): Promise<Match[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'matches'));
      return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Match[];
    } catch (e) {
      console.error("Error al obtener partidos:", e);
      return [];
    }
  },

  saveMatch: async (match: Match): Promise<void> => {
    const matchId = match.id || `match_${Date.now()}`;
    await setDoc(doc(db, 'matches', matchId), { ...match, id: matchId }, { merge: true });
  },

  deleteMatch: async (matchId: string): Promise<void> => {
    await deleteDoc(doc(db, 'matches', matchId));
  },

  // --- JUGADORES ---
  getPlayers: async (): Promise<Player[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'players'));
      return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Player[];
    } catch (e) {
      console.error("Error al obtener jugadores:", e);
      return [];
    }
  },

  savePlayer: async (player: Player): Promise<void> => {
    const playerId = player.id || `player_${Date.now()}`;
    await setDoc(doc(db, 'players', playerId), { ...player, id: playerId }, { merge: true });
  },

  deletePlayer: async (playerId: string): Promise<void> => {
    await deleteDoc(doc(db, 'players', playerId));
  },

  // --- FINANZAS / EQUIPOS ---
  getTeamFinancialOverview: (teamId?: string) => {
    return {
      debtors: [],
      totalCollected: 0,
      totalPending: 0
    };
  },

  getTeams: (): Team[] => {
    return [{ id: 'default-team', name: 'Mi Equipo', code: 'MIE' }];
  }
};
