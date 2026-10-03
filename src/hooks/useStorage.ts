import { useState, useEffect } from 'react';
import { Match, Player, Team } from '../types';
import { db } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

export function useStorage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>({ id: 'default-team', name: 'Mi Equipo', code: 'MIE' });
  const [userRole, setUserRole] = useState<'ADMIN' | 'PLAYER'>('ADMIN');

  useEffect(() => {
    // Escuchador en tiempo real de Partidos
    const unsubMatches = onSnapshot(collection(db, 'matches'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Match[];
      setMatches(data);
    });

    // Escuchador en tiempo real de Jugadores
    const unsubPlayers = onSnapshot(collection(db, 'players'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Player[];
      setPlayers(data);
    });

    return () => {
      unsubMatches();
      unsubPlayers();
    };
  }, []);

  const getTeamFinancialOverview = (teamId?: string) => {
    return { debtors: [] };
  };

  return {
    storage: {
      matches,
      players,
      getTeamFinancialOverview
    },
    activeTeam,
    userRole
  };
}
