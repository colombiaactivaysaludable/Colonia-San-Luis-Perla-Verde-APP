import {
  Team,
  Player,
  Match,
  Callup,
  Substitution,
  MatchPlayerStat,
  Payment,
  AppDataBackup,
  UserRole,
} from '../types';
import {
  initialTeams,
  initialPlayers,
  initialMatches,
  initialCallups,
  initialSubstitutions,
  initialMatchPlayerStats,
  initialPayments,
} from '../data/initialData';

const STORAGE_KEYS = {
  TEAMS: 'teammaster_teams_v1',
  PLAYERS: 'teammaster_players_v1',
  MATCHES: 'teammaster_matches_v1',
  CALLUPS: 'teammaster_callups_v1',
  SUBSTITUTIONS: 'teammaster_substitutions_v1',
  STATS: 'teammaster_stats_v1',
  PAYMENTS: 'teammaster_payments_v1',
  ACTIVE_TEAM_ID: 'teammaster_active_team_id_v1',
  USER_ROLE: 'teammaster_user_role_v1',
  CURRENT_PLAYER_ID: 'teammaster_current_player_id_v1',
};

// Generic storage helper
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error loading key ${key}:`, e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving key ${key}:`, e);
  }
}

export type CloudMutationAction = 'save' | 'delete';
export type CloudMutationEntity = 'team' | 'player' | 'match' | 'callup' | 'substitution' | 'stat' | 'payment';
export type CloudMutationHook = (action: CloudMutationAction, entity: CloudMutationEntity, payload: any) => void;

class StorageService {
  private teams: Team[] = [];
  private players: Player[] = [];
  private matches: Match[] = [];
  private callups: Callup[] = [];
  private substitutions: Substitution[] = [];
  private stats: MatchPlayerStat[] = [];
  private payments: Payment[] = [];
  private activeTeamId: string = '';
  private userRole: UserRole = 'ADMIN';
  private currentPlayerId: string = '';

  private listeners: Set<() => void> = new Set();
  private cloudHooks: Set<CloudMutationHook> = new Set();

  constructor() {
    this.init();
  }

  public onCloudMutation(hook: CloudMutationHook): () => void {
    this.cloudHooks.add(hook);
    return () => this.cloudHooks.delete(hook);
  }

  private dispatchCloudMutation(action: CloudMutationAction, entity: CloudMutationEntity, payload: any) {
    this.cloudHooks.forEach((fn) => {
      try {
        fn(action, entity, payload);
      } catch (err) {
        console.warn('Cloud sync dispatch warning:', err);
      }
    });
  }

  public mergeCloudTeams(cloudTeams: Team[]) {
    this.teams = cloudTeams;
    saveToStorage(STORAGE_KEYS.TEAMS, this.teams);
    if (!this.teams.some((t) => t.id === this.activeTeamId) && this.teams.length > 0) {
      this.activeTeamId = this.teams[0].id;
      saveToStorage(STORAGE_KEYS.ACTIVE_TEAM_ID, this.activeTeamId);
    }
    this.notify();
  }

  public mergeCloudPlayers(cloudPlayers: Player[]) {
    this.players = cloudPlayers;
    saveToStorage(STORAGE_KEYS.PLAYERS, this.players);
    this.notify();
  }

  public mergeCloudMatches(cloudMatches: Match[]) {
    this.matches = cloudMatches;
    saveToStorage(STORAGE_KEYS.MATCHES, this.matches);
    this.notify();
  }

  public mergeCloudCallups(cloudCallups: Callup[]) {
    this.callups = cloudCallups;
    saveToStorage(STORAGE_KEYS.CALLUPS, this.callups);
    this.notify();
  }

  public mergeCloudSubstitutions(cloudSubs: Substitution[]) {
    this.substitutions = cloudSubs;
    saveToStorage(STORAGE_KEYS.SUBSTITUTIONS, this.substitutions);
    this.notify();
  }

  public mergeCloudStats(cloudStats: MatchPlayerStat[]) {
    this.stats = cloudStats;
    saveToStorage(STORAGE_KEYS.STATS, this.stats);
    this.notify();
  }

  public mergeCloudPayments(cloudPayments: Payment[]) {
    this.payments = cloudPayments;
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    this.notify();
  }

  private init() {
    this.teams = loadFromStorage<Team[]>(STORAGE_KEYS.TEAMS, initialTeams);

    // Ensure the primary team branding is updated to Colonia San Luis - Perla Verde
    const primaryTeam = this.teams.find((t) => t.id === 'team_titanes_01') || this.teams[0];
    if (primaryTeam && (primaryTeam.name !== 'Colonia San Luis - Perla Verde' || !primaryTeam.slogan)) {
      primaryTeam.name = 'Colonia San Luis - Perla Verde';
      primaryTeam.slogan = 'La Perla Bonita de Antioquia';
      primaryTeam.category = 'Libre / Oriente Antioqueño';
      primaryTeam.primaryColor = '#059669';
      primaryTeam.shieldIcon = '🌲';
      saveToStorage(STORAGE_KEYS.TEAMS, this.teams);
    }

    this.players = loadFromStorage<Player[]>(STORAGE_KEYS.PLAYERS, initialPlayers);
    this.matches = loadFromStorage<Match[]>(STORAGE_KEYS.MATCHES, initialMatches);
    this.callups = loadFromStorage<Callup[]>(STORAGE_KEYS.CALLUPS, initialCallups);
    this.substitutions = loadFromStorage<Substitution[]>(STORAGE_KEYS.SUBSTITUTIONS, initialSubstitutions);
    this.stats = loadFromStorage<MatchPlayerStat[]>(STORAGE_KEYS.STATS, initialMatchPlayerStats);
    this.payments = loadFromStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, initialPayments);

    const savedTeamId = localStorage.getItem(STORAGE_KEYS.ACTIVE_TEAM_ID);
    if (savedTeamId && this.teams.some((t) => t.id === savedTeamId)) {
      this.activeTeamId = savedTeamId;
    } else if (this.teams.length > 0) {
      this.activeTeamId = this.teams[0].id;
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TEAM_ID, this.activeTeamId);
    }

    this.userRole = loadFromStorage<UserRole>(STORAGE_KEYS.USER_ROLE, 'ADMIN');
    this.currentPlayerId = loadFromStorage<string>(STORAGE_KEYS.CURRENT_PLAYER_ID, '');

    // Real-time synchronization across browser tabs and public confirmation pages
    if (typeof window !== 'undefined' && !(window as any).__teammaster_storage_listener) {
      (window as any).__teammaster_storage_listener = true;
      window.addEventListener('storage', (e) => {
        if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
          this.init();
          this.notify();
        }
      });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // --- Multi-Team Management ---
  public getTeams(): Team[] {
    return [...this.teams];
  }

  public getTeamById(teamId: string): Team | undefined {
    return this.teams.find((t) => t.id === teamId);
  }

  public getActiveTeam(): Team | undefined {
    return this.teams.find((t) => t.id === this.activeTeamId) || this.teams[0];
  }

  public getActiveTeamId(): string {
    return this.activeTeamId;
  }

  public setActiveTeamId(teamId: string): void {
    this.activeTeamId = teamId;
    saveToStorage(STORAGE_KEYS.ACTIVE_TEAM_ID, teamId);
    this.notify();
  }

  public createTeam(teamData: Omit<Team, 'id' | 'createdAt'>): Team {
    const newTeam: Team = {
      ...teamData,
      id: `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.teams.push(newTeam);
    saveToStorage(STORAGE_KEYS.TEAMS, this.teams);
    this.setActiveTeamId(newTeam.id);
    this.dispatchCloudMutation('save', 'team', newTeam);
    this.notify();
    return newTeam;
  }

  public updateTeam(id: string, updates: Partial<Team>): void {
    this.teams = this.teams.map((t) => (t.id === id ? { ...t, ...updates } : t));
    saveToStorage(STORAGE_KEYS.TEAMS, this.teams);
    const updated = this.teams.find((t) => t.id === id);
    if (updated) this.dispatchCloudMutation('save', 'team', updated);
    this.notify();
  }

  public deleteTeam(id: string): void {
    if (this.teams.length <= 1) {
      throw new Error('No puedes eliminar el único equipo registrado.');
    }
    this.teams = this.teams.filter((t) => t.id !== id);
    this.players = this.players.filter((p) => p.teamId !== id);
    this.matches = this.matches.filter((m) => m.teamId !== id);
    this.callups = this.callups.filter((c) => c.teamId !== id);
    this.substitutions = this.substitutions.filter((s) => s.teamId !== id);
    this.stats = this.stats.filter((st) => st.teamId !== id);
    this.payments = this.payments.filter((p) => p.teamId !== id);

    saveToStorage(STORAGE_KEYS.TEAMS, this.teams);
    saveToStorage(STORAGE_KEYS.PLAYERS, this.players);
    saveToStorage(STORAGE_KEYS.MATCHES, this.matches);
    saveToStorage(STORAGE_KEYS.CALLUPS, this.callups);
    saveToStorage(STORAGE_KEYS.SUBSTITUTIONS, this.substitutions);
    saveToStorage(STORAGE_KEYS.STATS, this.stats);
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);

    if (this.activeTeamId === id) {
      this.activeTeamId = this.teams[0].id;
      saveToStorage(STORAGE_KEYS.ACTIVE_TEAM_ID, this.activeTeamId);
    }
    this.dispatchCloudMutation('delete', 'team', id);
    this.notify();
  }

  // --- Roles & Current Player ---
  public getUserRole(): UserRole {
    return this.userRole;
  }

  public setUserRole(role: UserRole): void {
    this.userRole = role;
    saveToStorage(STORAGE_KEYS.USER_ROLE, role);
    this.notify();
  }

  public getCurrentPlayerId(): string {
    return this.currentPlayerId;
  }

  public setCurrentPlayerId(playerId: string): void {
    this.currentPlayerId = playerId;
    saveToStorage(STORAGE_KEYS.CURRENT_PLAYER_ID, playerId);
    this.notify();
  }

  // --- Players Module ---
  public getPlayers(teamId?: string): Player[] {
    const tid = teamId || this.activeTeamId;
    return this.players.filter((p) => p.teamId === tid);
  }

  public getPlayerById(playerId: string): Player | undefined {
    return this.players.find((p) => p.id === playerId);
  }

  public createPlayer(playerData: Omit<Player, 'id' | 'createdAt'>): Player {
    const newPlayer: Player = {
      ...playerData,
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.players.push(newPlayer);
    saveToStorage(STORAGE_KEYS.PLAYERS, this.players);
    this.dispatchCloudMutation('save', 'player', newPlayer);
    this.notify();
    return newPlayer;
  }

  public updatePlayer(id: string, updates: Partial<Player>): void {
    this.players = this.players.map((p) => (p.id === id ? { ...p, ...updates } : p));
    saveToStorage(STORAGE_KEYS.PLAYERS, this.players);
    const updated = this.players.find((p) => p.id === id);
    if (updated) this.dispatchCloudMutation('save', 'player', updated);
    this.notify();
  }

  public deletePlayer(id: string): void {
    this.players = this.players.filter((p) => p.id !== id);
    this.callups = this.callups.filter((c) => c.playerId !== id);
    this.stats = this.stats.filter((st) => st.playerId !== id);
    this.payments = this.payments.filter((pay) => pay.playerId !== id);

    saveToStorage(STORAGE_KEYS.PLAYERS, this.players);
    saveToStorage(STORAGE_KEYS.CALLUPS, this.callups);
    saveToStorage(STORAGE_KEYS.STATS, this.stats);
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    this.dispatchCloudMutation('delete', 'player', id);
    this.notify();
  }

  // --- Matches Module ---
  public getMatches(teamId?: string): Match[] {
    const tid = teamId || this.activeTeamId;
    return this.matches
      .filter((m) => m.teamId === tid)
      .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
  }

  public getMatchById(matchId: string): Match | undefined {
    return this.matches.find((m) => m.id === matchId);
  }

  public getNextScheduledMatch(teamId?: string): Match | undefined {
    const tid = teamId || this.activeTeamId;
    const now = new Date();
    const scheduled = this.matches
      .filter((m) => m.teamId === tid && m.status === 'Programado')
      .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime());
    return scheduled[0];
  }

  public createMatch(
    matchData: Omit<Match, 'id' | 'createdAt'>,
    initialCalledUpPlayerIds?: string[]
  ): Match {
    const newMatch: Match = {
      ...matchData,
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.matches.unshift(newMatch);
    saveToStorage(STORAGE_KEYS.MATCHES, this.matches);

    if (initialCalledUpPlayerIds && initialCalledUpPlayerIds.length > 0) {
      this.setCallupsForMatch(newMatch.id, initialCalledUpPlayerIds);
    }

    this.dispatchCloudMutation('save', 'match', newMatch);
    this.notify();
    return newMatch;
  }

  public updateMatch(id: string, updates: Partial<Match>): void {
    this.matches = this.matches.map((m) => (m.id === id ? { ...m, ...updates } : m));
    saveToStorage(STORAGE_KEYS.MATCHES, this.matches);
    const updated = this.matches.find((m) => m.id === id);
    if (updated) this.dispatchCloudMutation('save', 'match', updated);
    this.notify();
  }

  public updateMatchScore(matchId: string, homeScore: number, awayScore: number, status?: Match['status']): void {
    this.matches = this.matches.map((m) => {
      if (m.id === matchId) {
        return {
          ...m,
          homeScore: Math.max(0, homeScore),
          awayScore: Math.max(0, awayScore),
          status: status || m.status,
        };
      }
      return m;
    });
    saveToStorage(STORAGE_KEYS.MATCHES, this.matches);
    const updated = this.matches.find((m) => m.id === matchId);
    if (updated) this.dispatchCloudMutation('save', 'match', updated);
    this.notify();
  }

  public deleteMatch(matchId: string): void {
    this.matches = this.matches.filter((m) => m.id !== matchId);
    this.callups = this.callups.filter((c) => c.matchId !== matchId);
    this.substitutions = this.substitutions.filter((s) => s.matchId !== matchId);
    this.stats = this.stats.filter((st) => st.matchId !== matchId);

    saveToStorage(STORAGE_KEYS.MATCHES, this.matches);
    saveToStorage(STORAGE_KEYS.CALLUPS, this.callups);
    saveToStorage(STORAGE_KEYS.SUBSTITUTIONS, this.substitutions);
    saveToStorage(STORAGE_KEYS.STATS, this.stats);
    this.dispatchCloudMutation('delete', 'match', matchId);
    this.notify();
  }

  // --- Callups (Convocatorias) Module ---
  public getCallupsForMatch(matchId: string): Callup[] {
    return this.callups.filter((c) => c.matchId === matchId);
  }

  public callUpAllActivePlayers(matchId: string): void {
    const match = this.getMatchById(matchId);
    if (!match) return;

    const activePlayers = this.getPlayers(match.teamId).filter((p) => p.status === 'Activo');
    const existing = this.callups.filter((c) => c.matchId === matchId);

    const updated = [...this.callups];

    activePlayers.forEach((player) => {
      const idx = updated.findIndex((c) => c.matchId === matchId && c.playerId === player.id);
      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          status: 'Convocado',
          absenceReason: undefined,
        };
      } else {
        updated.push({
          id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          matchId,
          playerId: player.id,
          teamId: match.teamId,
          status: 'Convocado',
          attended: false,
        });
      }
    });

    this.callups = updated;
    saveToStorage(STORAGE_KEYS.CALLUPS, this.callups);
    this.notify();
  }

  public setMasterCallupState(matchId: string, convokeAll: boolean): void {
    const match = this.getMatchById(matchId);
    if (!match) return;

    const allPlayers = this.getPlayers(match.teamId);
    const updated = [...this.callups];

    allPlayers.forEach((player) => {
      const idx = updated.findIndex((c) => c.matchId === matchId && c.playerId === player.id);
      const targetStatus = convokeAll ? 'Convocado' : 'No Convocado';

      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          status: targetStatus,
          absenceReason: undefined,
        };
      } else if (convokeAll) {
        updated.push({
          id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          matchId,
          playerId: player.id,
          teamId: match.teamId,
          status: 'Convocado',
          attended: false,
        });
      }
    });

    this.callups = updated;
    saveToStorage(STORAGE_KEYS.CALLUPS, this.callups);
    this.notify();
  }

  public setCallupsForMatch(matchId: string, playerIds: string[]): void {
    const match = this.getMatchById(matchId);
    if (!match) return;

    const allPlayers = this.getPlayers(match.teamId);
    const updated = [...this.callups];

    allPlayers.forEach((player) => {
      const isSelected = playerIds.includes(player.id);
      const idx = updated.findIndex((c) => c.matchId === matchId && c.playerId === player.id);
      const targetStatus = isSelected ? 'Convocado' : 'No Convocado';

      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          status: targetStatus,
          absenceReason: isSelected ? undefined : updated[idx].absenceReason,
        };
      } else if (isSelected) {
        updated.push({
          id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          matchId,
          playerId: player.id,
          teamId: match.teamId,
          status: 'Convocado',
          attended: false,
        });
      }
    });

    this.callups = updated;
    saveToStorage(STORAGE_KEYS.CALLUPS, this.callups);
    this.notify();
  }

  public updateCallupStatus(
    matchId: string,
    playerId: string,
    status: Callup['status'],
    absenceReason?: string
  ): void {
    const match = this.getMatchById(matchId);
    if (!match) return;

    let targetCallup: Callup;
    const idx = this.callups.findIndex((c) => c.matchId === matchId && c.playerId === playerId);
    if (idx >= 0) {
      this.callups[idx] = {
        ...this.callups[idx],
        status,
        absenceReason: status === 'Inasistencia' ? absenceReason : undefined,
      };
      targetCallup = this.callups[idx];
    } else {
      targetCallup = {
        id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        matchId,
        playerId,
        teamId: match.teamId,
        status,
        absenceReason: status === 'Inasistencia' ? absenceReason : undefined,
        attended: false,
      };
      this.callups.push(targetCallup);
    }

    saveToStorage(STORAGE_KEYS.CALLUPS, this.callups);
    this.dispatchCloudMutation('save', 'callup', targetCallup);
    this.notify();
  }

  public confirmPlayerCallup(
    matchId: string,
    playerId: string,
    confirmation: 'Confirmado' | 'No Asiste',
    reason?: string
  ): void {
    const match = this.getMatchById(matchId);
    if (!match) return;

    let targetCallup: Callup;
    const idx = this.callups.findIndex((c) => c.matchId === matchId && c.playerId === playerId);
    const nowStr = new Date().toISOString();

    if (idx >= 0) {
      this.callups[idx] = {
        ...this.callups[idx],
        status: confirmation === 'Confirmado' ? 'Convocado' : 'Inasistencia',
        confirmationStatus: confirmation,
        absenceReason: confirmation === 'No Asiste' ? reason : undefined,
        confirmedAt: nowStr,
      };
      targetCallup = this.callups[idx];
    } else {
      targetCallup = {
        id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        matchId,
        playerId,
        teamId: match.teamId,
        status: confirmation === 'Confirmado' ? 'Convocado' : 'Inasistencia',
        confirmationStatus: confirmation,
        absenceReason: confirmation === 'No Asiste' ? reason : undefined,
        confirmedAt: nowStr,
        attended: false,
      };
      this.callups.push(targetCallup);
    }

    saveToStorage(STORAGE_KEYS.CALLUPS, this.callups);
    this.dispatchCloudMutation('save', 'callup', targetCallup);
    this.notify();
  }

  // --- Substitutions (Cambios) Module ---
  public getSubstitutionsForMatch(matchId: string): Substitution[] {
    return this.substitutions
      .filter((s) => s.matchId === matchId)
      .sort((a, b) => a.minute - b.minute);
  }

  public addSubstitution(
    matchId: string,
    playerOutId: string,
    playerInId: string,
    minute: number,
    notes?: string
  ): void {
    if (playerOutId === playerInId) {
      throw new Error('El jugador que entra no puede ser el mismo que sale.');
    }
    const match = this.getMatchById(matchId);
    if (!match) throw new Error('Partido no encontrado.');

    const newSub: Substitution = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      matchId,
      teamId: match.teamId,
      playerOutId,
      playerInId,
      minute: Math.max(1, Math.min(120, minute)),
      notes,
    };

    this.substitutions.push(newSub);
    saveToStorage(STORAGE_KEYS.SUBSTITUTIONS, this.substitutions);
    this.dispatchCloudMutation('save', 'substitution', newSub);
    this.notify();
  }

  public deleteSubstitution(id: string): void {
    this.substitutions = this.substitutions.filter((s) => s.id !== id);
    saveToStorage(STORAGE_KEYS.SUBSTITUTIONS, this.substitutions);
    this.dispatchCloudMutation('delete', 'substitution', id);
    this.notify();
  }

  // --- Player Match Stats Module ---
  public getStatsForMatch(matchId: string): MatchPlayerStat[] {
    return this.stats.filter((s) => s.matchId === matchId);
  }

  public updatePlayerStat(
    matchId: string,
    playerId: string,
    delta: { goals?: number; assists?: number; yellowCards?: number; redCards?: number }
  ): void {
    const match = this.getMatchById(matchId);
    if (!match) return;

    let stat = this.stats.find((s) => s.matchId === matchId && s.playerId === playerId);
    if (!stat) {
      stat = {
        id: `stat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        matchId,
        playerId,
        teamId: match.teamId,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
      };
      this.stats.push(stat);
    }

    if (delta.goals !== undefined) stat.goals = Math.max(0, stat.goals + delta.goals);
    if (delta.assists !== undefined) stat.assists = Math.max(0, stat.assists + delta.assists);
    if (delta.yellowCards !== undefined) stat.yellowCards = Math.max(0, stat.yellowCards + delta.yellowCards);
    if (delta.redCards !== undefined) stat.redCards = Math.max(0, stat.redCards + delta.redCards);

    // Auto update match homeScore if goals change for our team
    const totalGoalsInMatch = this.stats
      .filter((s) => s.matchId === matchId)
      .reduce((sum, s) => sum + s.goals, 0);

    if (match.status === 'Finalizado' || match.status === 'En Juego') {
      this.matches = this.matches.map((m) =>
        m.id === matchId ? { ...m, homeScore: totalGoalsInMatch } : m
      );
      saveToStorage(STORAGE_KEYS.MATCHES, this.matches);
      const updatedMatch = this.matches.find((m) => m.id === matchId);
      if (updatedMatch) this.dispatchCloudMutation('save', 'match', updatedMatch);
    }

    saveToStorage(STORAGE_KEYS.STATS, this.stats);
    this.dispatchCloudMutation('save', 'stat', stat);
    this.notify();
  }

  // --- Global Team Stats Aggregation ---
  public getTeamLeaderboard(teamId?: string) {
    const tid = teamId || this.activeTeamId;
    const players = this.getPlayers(tid);

    return players.map((player) => {
      const playerStats = this.stats.filter((s) => s.playerId === player.id && s.teamId === tid);
      const totalGoals = playerStats.reduce((sum, s) => sum + s.goals, 0);
      const totalAssists = playerStats.reduce((sum, s) => sum + s.assists, 0);
      const totalYellows = playerStats.reduce((sum, s) => sum + s.yellowCards, 0);
      const totalReds = playerStats.reduce((sum, s) => sum + s.redCards, 0);

      const matchesAttended = this.callups.filter(
        (c) => c.playerId === player.id && c.teamId === tid && (c.status === 'Convocado' || c.attended)
      ).length;

      return {
        player,
        goals: totalGoals,
        assists: totalAssists,
        yellowCards: totalYellows,
        redCards: totalReds,
        matchesPlayed: matchesAttended,
      };
    }).sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  }

  // --- Financial & Arbitration Module ---
  public getPayments(teamId?: string): Payment[] {
    const tid = teamId || this.activeTeamId;
    return this.payments
      .filter((p) => p.teamId === tid)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public recordPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Payment {
    const newPayment: Payment = {
      ...paymentData,
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.payments.unshift(newPayment);
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    this.dispatchCloudMutation('save', 'payment', newPayment);
    this.notify();
    return newPayment;
  }

  public deletePayment(id: string): void {
    this.payments = this.payments.filter((p) => p.id !== id);
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    this.dispatchCloudMutation('delete', 'payment', id);
    this.notify();
  }

  // Financial summary per player:
  // Each match that is played/finalizado or programado where player was 'Convocado' generates individualRefereeFee
  public getPlayerFinancialSummary(playerId: string, teamId?: string) {
    const tid = teamId || this.activeTeamId;
    const playerMatches = this.matches.filter((m) => m.teamId === tid);

    let totalOwed = 0;
    const matchBreakdown: { match: Match; fee: number; paidForMatch: number; pendingForMatch: number }[] = [];

    playerMatches.forEach((match) => {
      // Find callup
      const callup = this.callups.find((c) => c.matchId === match.id && c.playerId === playerId);
      if (callup && (callup.status === 'Convocado' || callup.attended)) {
        const fee = match.individualRefereeFee || 0;
        totalOwed += fee;

        const paidForMatch = this.payments
          .filter((p) => p.playerId === playerId && p.matchId === match.id)
          .reduce((sum, p) => sum + p.amount, 0);

        matchBreakdown.push({
          match,
          fee,
          paidForMatch,
          pendingForMatch: Math.max(0, fee - paidForMatch),
        });
      }
    });

    const totalPaid = this.payments
      .filter((p) => p.playerId === playerId && p.teamId === tid)
      .reduce((sum, p) => sum + p.amount, 0);

    const balance = totalOwed - totalPaid; // > 0 means debt

    return {
      playerId,
      totalOwed,
      totalPaid,
      balance, // Positive = owes money, 0 = al día, Negative = saldo a favor
      isDebtor: balance > 0,
      matchBreakdown,
    };
  }

  public getTeamFinancialOverview(teamId?: string) {
    const tid = teamId || this.activeTeamId;
    const players = this.getPlayers(tid);

    let totalRecaudado = 0;
    let totalEsperado = 0;
    const debtors: { player: Player; balance: number; totalOwed: number; totalPaid: number }[] = [];

    players.forEach((player) => {
      const summary = this.getPlayerFinancialSummary(player.id, tid);
      totalEsperado += summary.totalOwed;
      totalRecaudado += summary.totalPaid;
      if (summary.isDebtor) {
        debtors.push({
          player,
          balance: summary.balance,
          totalOwed: summary.totalOwed,
          totalPaid: summary.totalPaid,
        });
      }
    });

    const totalPendiente = Math.max(0, totalEsperado - totalRecaudado);

    return {
      totalRecaudado,
      totalPendiente,
      totalEsperado,
      percentageCollected: totalEsperado > 0 ? Math.min(100, Math.round((totalRecaudado / totalEsperado) * 100)) : 100,
      debtors: debtors.sort((a, b) => b.balance - a.balance),
    };
  }

  // --- Backup & Cloud Sync JSON ---
  public exportBackup(): AppDataBackup {
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      teams: this.teams,
      players: this.players,
      matches: this.matches,
      callups: this.callups,
      substitutions: this.substitutions,
      matchPlayerStats: this.stats,
      payments: this.payments,
    };
  }

  public importBackup(rawBackup: any): { teamsCount: number; playersCount: number; matchesCount: number } {
    if (!rawBackup || typeof rawBackup !== 'object') {
      throw new Error('El archivo no contiene un objeto JSON válido.');
    }

    // Unwrap if wrapped under 'data', 'backup', 'payload', or directly
    const backup = rawBackup.data || rawBackup.backup || rawBackup.payload || rawBackup;

    // Handle teams
    let importedTeams: Team[] = [];
    if (Array.isArray(backup.teams) && backup.teams.length > 0) {
      importedTeams = backup.teams;
    } else if (this.teams.length > 0) {
      importedTeams = this.teams;
    } else {
      importedTeams = initialTeams;
    }

    const importedPlayers: Player[] = Array.isArray(backup.players) ? backup.players : [];
    const importedMatches: Match[] = Array.isArray(backup.matches) ? backup.matches : [];
    const importedCallups: Callup[] = Array.isArray(backup.callups) ? backup.callups : [];
    const importedSubstitutions: Substitution[] = Array.isArray(backup.substitutions) ? backup.substitutions : [];
    const importedStats: MatchPlayerStat[] = Array.isArray(backup.matchPlayerStats) 
      ? backup.matchPlayerStats 
      : Array.isArray(backup.stats) 
      ? backup.stats 
      : [];
    const importedPayments: Payment[] = Array.isArray(backup.payments) ? backup.payments : [];

    if (importedTeams.length === 0 && importedPlayers.length === 0 && importedMatches.length === 0) {
      throw new Error('El archivo de respaldo no contiene datos de equipos, jugadores ni partidos.');
    }

    this.teams = importedTeams;
    this.players = importedPlayers;
    this.matches = importedMatches;
    this.callups = importedCallups;
    this.substitutions = importedSubstitutions;
    this.stats = importedStats;
    this.payments = importedPayments;

    saveToStorage(STORAGE_KEYS.TEAMS, this.teams);
    saveToStorage(STORAGE_KEYS.PLAYERS, this.players);
    saveToStorage(STORAGE_KEYS.MATCHES, this.matches);
    saveToStorage(STORAGE_KEYS.CALLUPS, this.callups);
    saveToStorage(STORAGE_KEYS.SUBSTITUTIONS, this.substitutions);
    saveToStorage(STORAGE_KEYS.STATS, this.stats);
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);

    if (this.teams.length > 0) {
      this.setActiveTeamId(this.teams[0].id);
    }
    this.notify();

    return {
      teamsCount: this.teams.length,
      playersCount: this.players.length,
      matchesCount: this.matches.length,
    };
  }

  public resetToDefault(): void {
    this.teams = initialTeams;
    this.players = initialPlayers;
    this.matches = initialMatches;
    this.callups = initialCallups;
    this.substitutions = initialSubstitutions;
    this.stats = initialMatchPlayerStats;
    this.payments = initialPayments;
    this.activeTeamId = initialTeams[0].id;

    saveToStorage(STORAGE_KEYS.TEAMS, this.teams);
    saveToStorage(STORAGE_KEYS.PLAYERS, this.players);
    saveToStorage(STORAGE_KEYS.MATCHES, this.matches);
    saveToStorage(STORAGE_KEYS.CALLUPS, this.callups);
    saveToStorage(STORAGE_KEYS.SUBSTITUTIONS, this.substitutions);
    saveToStorage(STORAGE_KEYS.STATS, this.stats);
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    saveToStorage(STORAGE_KEYS.ACTIVE_TEAM_ID, this.activeTeamId);

    this.notify();
  }
}

export const storage = new StorageService();
