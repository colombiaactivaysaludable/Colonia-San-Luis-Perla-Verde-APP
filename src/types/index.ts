export type UserRole = 'ADMIN' | 'COACH' | 'PLAYER';

export type TeamCategory = 
  | 'Libre'
  | 'Veteranos (+35)'
  | 'Femenino'
  | 'Sub-20'
  | 'Senior (+45)'
  | 'Empresarial';

export interface Team {
  id: string;
  name: string;
  category: TeamCategory | string;
  slogan?: string; // e.g. "La Perla Bonita de Antioquia"
  primaryColor: string; // Hex color code
  secondaryColor?: string;
  shieldIcon: string; // Emoji or crest code: '⚽', '🛡️', '⚡', '🦁', '🦅', '🏆', etc.
  coachName?: string;
  foundedYear?: string;
  defaultArrivalMinutes?: number; // Minutos de anticipación sugeridos por defecto
  logoUrl?: string; // URL o DataURL del escudo o logo oficial del club
  customHashtag?: string; // Ej: #VamosColonia
  createdAt: string;
}

export type PlayerPosition = 'Arquero' | 'Defensa' | 'Volante' | 'Delantero';
export type PlayerStatus = 'Activo' | 'Lesionado' | 'Sancionado' | 'Inactivo';

export interface Player {
  id: string;
  teamId: string;
  fullName: string;
  nickname?: string;
  dorsal: number;
  position: PlayerPosition;
  status: PlayerStatus;
  phone: string;
  documentNumber?: string; // Número de cédula / documento de identidad para verificación
  notes?: string;
  photoUrl?: string;
  createdAt: string;
}

export type MatchStatus = 'Programado' | 'En Juego' | 'Finalizado' | 'Cancelado';

export interface Match {
  id: string;
  teamId: string;
  tournament: string; // Line 1: 🏆 Torneo / Competición
  rival: string;     // Line 2: ⚽ vs Rival
  date: string;      // YYYY-MM-DD
  time: string;      // HH:MM
  venue: string;     // Cancha / Lugar
  totalRefereeFee: number;     // Cuota total de arbitraje
  individualRefereeFee: number; // Cuota por jugador convocado
  status: MatchStatus;
  arrivalMinutes?: number; // Minutos de anticipación para llegar antes del pitazo
  requiredEquipment?: string[]; // Implementos predefinidos marcados
  customEquipment?: string; // Implemento puntual extra
  confirmationDeadline?: string; // Fecha y hora límite para confirmar asistencia
  homeScore?: number; // Goles de nuestro equipo
  awayScore?: number; // Goles del equipo rival
  notes?: string;
  createdAt: string;
}

export type CallupStatus = 'Convocado' | 'No Convocado' | 'Inasistencia';
export type CallupConfirmationStatus = 'Confirmado' | 'No Asiste' | 'Pendiente';

export type AbsenceReason = 
  | 'Trabajo' 
  | 'Lesión' 
  | 'Viaje' 
  | 'Personal' 
  | 'Estudio' 
  | 'Falta de Dinero'
  | 'Compromiso Familiar'
  | 'Otro';

export interface Callup {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  status: CallupStatus;
  confirmationStatus?: CallupConfirmationStatus; // 'Confirmado' | 'No Asiste' | 'Pendiente'
  absenceReason?: AbsenceReason | string;
  confirmedAt?: string;
  attended?: boolean; // Asistió al partido efectivamente
}

export interface Substitution {
  id: string;
  matchId: string;
  teamId: string;
  playerOutId: string; // Jugador que SALE (⬇)
  playerInId: string;  // Jugador que ENTRA (⬆)
  minute: number;      // Minuto del cambio
  notes?: string;
}

export interface MatchPlayerStat {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed?: number;
}

export type PaymentMethod = 'Efectivo' | 'Nequi' | 'Daviplata' | 'Transferencia' | 'Otro';

export interface Payment {
  id: string;
  teamId: string;
  playerId: string;
  matchId?: string; // Partido asociado si corresponde a cuota de arbitraje
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  concept: string; // Ej: "Arbitraje vs Chelsea", "Abono cuota mensual", etc.
  createdAt: string;
}

export interface AppDataBackup {
  version: string;
  exportedAt: string;
  teams: Team[];
  players: Player[];
  matches: Match[];
  callups: Callup[];
  substitutions: Substitution[];
  matchPlayerStats: MatchPlayerStat[];
  payments: Payment[];
}
