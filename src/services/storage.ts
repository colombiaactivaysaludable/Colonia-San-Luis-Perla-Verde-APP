import { Match, Player, Team } from '../types';

export const storage = {
  // Retornan arreglos limpios sin fallback a datos antiguos
  getMatches: (teamId?: string): Match[] => [],
  getPlayers: (teamId?: string): Player[] => [],
  
  getNextScheduledMatch: (teamId?: string): Match | null => null,
  
  getTeamFinancialOverview: (teamId?: string) => ({
    debtors: [],
    totalPendiente: 0,
    totalRecaudado: 0
  }),

  getTeamLeaderboard: (teamId?: string) => [],

  callUpAllActivePlayers: (matchId: string) => {},

  getTeams: (): Team[] => [
    { id: 'default-team', name: 'Mi Equipo', code: 'MIE' }
  ]
};
