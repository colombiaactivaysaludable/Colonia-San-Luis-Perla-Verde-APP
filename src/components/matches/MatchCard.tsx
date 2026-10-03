import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Share2, 
  Edit3, 
  Trash2, 
  Users, 
  ArrowDownUp, 
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  X,
  Palette,
  CheckSquare,
  Link as LinkIcon
} from 'lucide-react';
import { Match, Callup, Substitution } from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { 
  formatCurrency, 
  formatDateSpanish, 
  generateConfirmationBroadcastMessage, 
  openWhatsApp 
} from '../../utils/whatsapp';

interface MatchCardProps {
  match: Match;
  onOpenCallup: (match: Match) => void;
  onOpenScore: (match: Match) => void;
  onOpenDetails: (match: Match, defaultTab?: 'substitutions' | 'stats') => void;
  onEditMatch?: (match: Match) => void;
  onOpenConfirmationDashboard?: (match: Match) => void;
  onOpenMatchdayGraphic?: (match: Match) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onOpenCallup,
  onOpenScore,
  onOpenDetails,
  onEditMatch,
  onOpenConfirmationDashboard,
  onOpenMatchdayGraphic,
}) => {
  const { storage, activeTeam, userRole } = useStorage();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const players = storage.getPlayers(match.teamId);
  const callups = storage.getCallupsForMatch(match.id);
  const substitutions = storage.getSubstitutionsForMatch(match.id);
  const stats = storage.getStatsForMatch(match.id);

  const convocadosCount = callups.filter((c) => c.status === 'Convocado').length;
  const inasistenciasCount = callups.filter((c) => c.status === 'Inasistencia' || c.confirmationStatus === 'No Asiste').length;
  const confirmedCount = callups.filter((c) => c.confirmationStatus === 'Confirmado').length;
  const substitutionsCount = substitutions.length;

  // Goalscorers list for quick display
  const goalscorers = stats
    .filter((s) => s.goals > 0)
    .map((s) => {
      const p = players.find((pl) => pl.id === s.playerId);
      return `${p?.nickname || p?.fullName?.split(' ')[0] || 'Jugador'} (${s.goals})`;
    });

  // 1-Click Mass Callup (all active players)
  const handle1ClickMassActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    storage.callUpAllActivePlayers(match.id);
  };

  // Share Broadcast message with official confirmation template
  const handleShareWhatsAppBroadcast = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = generateConfirmationBroadcastMessage(match, activeTeam?.name || 'COLONIA SAN LUIS – PERLA VERDE');
    openWhatsApp(msg);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    storage.deleteMatch(match.id);
    setShowDeleteConfirm(false);
  };

  const getStatusBadge = () => {
    switch (match.status) {
      case 'Finalizado':
        return { label: 'Finalizado 🏁', class: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'En Juego':
        return { label: 'En Juego ⚡', class: 'bg-emerald-500 text-white font-bold animate-pulse' };
      case 'Programado':
        return { label: 'Programado 📅', class: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'Cancelado':
        return { label: 'Cancelado 🚫', class: 'bg-red-100 text-red-700 border-red-200' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
      {/* Delete confirmation banner */}
      {showDeleteConfirm && (
        <div className="p-3.5 mb-3 bg-red-50 border-2 border-red-300 rounded-2xl space-y-2 animate-in fade-in z-20">
          <p className="text-xs font-bold text-red-900">
            ¿Eliminar el partido vs {match.rival}?
          </p>
          <p className="text-[11px] text-red-700">
            Se eliminarán las convocatorias y estadísticas registradas de este partido.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-1.5 px-3 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-transform active:scale-95"
            >
              Sí, Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Top Header Row: Status and Admin Controls */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        {/* LÍNEA 1: 🏆 Nombre del Torneo / Competición */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold max-w-[75%] truncate shadow-2xs">
          <span>🏆</span>
          <span className="truncate">{match.tournament}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.class}`}>
            {statusBadge.label}
          </span>
          {userRole !== 'PLAYER' && (
            <>
              {onEditMatch && (
                <button
                  onClick={() => onEditMatch(match)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Editar partido y convocatoria"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Eliminar partido"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* LÍNEA 2: ⚽ vs Nombre del Equipo Rival & Scoreboard */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="text-base text-slate-400 font-semibold">vs</span>
            <span className="truncate text-slate-900">{match.rival}</span>
          </h3>
          {goalscorers.length > 0 && (
            <p className="text-[11px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
              <span>⚽</span>
              <span className="truncate">{goalscorers.join(', ')}</span>
            </p>
          )}
        </div>

        {/* Score Board Display */}
        {(match.status === 'Finalizado' || match.status === 'En Juego') && (
          <div className="px-3 py-1.5 bg-slate-900 text-white rounded-2xl flex items-center gap-2 shrink-0 shadow-sm border border-slate-700">
            <span className="text-base sm:text-lg font-black text-emerald-400">{match.homeScore ?? 0}</span>
            <span className="text-xs text-slate-400 font-bold">-</span>
            <span className="text-base sm:text-lg font-black text-white">{match.awayScore ?? 0}</span>
          </div>
        )}
      </div>

      {/* Metadata Line: Date, Time, Venue, Fee */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mb-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-slate-800 capitalize truncate">
            {formatDateSpanish(match.date)}
          </span>
          <span className="text-slate-400">·</span>
          <span className="font-bold text-slate-700">{match.time} hrs</span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">{match.venue}</span>
        </div>

        <div className="flex items-center gap-2 sm:col-span-2 text-slate-700">
          <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Arbitraje: <strong>{formatCurrency(match.individualRefereeFee)}</strong> / jugador
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500 text-[11px]">
            Total equipo: {formatCurrency(match.totalRefereeFee)}
          </span>
        </div>
      </div>

      {/* Convocatoria Summary Pills with Live Confirmation Counters */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-xl">
            👥 {convocadosCount} Convocados
          </span>
          {confirmedCount > 0 && (
            <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-xl">
              ✅ {confirmedCount} confirmaron
            </span>
          )}
          {inasistenciasCount > 0 && (
            <span className="font-bold text-red-800 bg-red-100/60 px-2 py-1 rounded-xl">
              ❌ {inasistenciasCount} Bajas
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
        {/* Open Confirmation Dashboard */}
        <button
          onClick={() => onOpenConfirmationDashboard && onOpenConfirmationDashboard(match)}
          className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          title="Ver control de confirmaciones en vivo y enlace"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span className="truncate">Confirmaciones</span>
        </button>

        {/* Generate Matchday Squad Graphic */}
        <button
          onClick={() => onOpenMatchdayGraphic && onOpenMatchdayGraphic(match)}
          className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
          title="Generar cartelera oficial matchday e imagen para redes"
        >
          <Palette className="w-3.5 h-3.5 text-emerald-400" />
          <span className="truncate">Cartelera Oficial</span>
        </button>

        {/* Editar Marcador & Estadísticas */}
        <button
          onClick={() => onOpenScore(match)}
          className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
          title="Registrar marcador y estadísticas de jugadores"
        >
          <span>⚽</span>
          <span className="truncate">Marcador & Goles</span>
        </button>

        {/* WhatsApp Broadcast Share Button */}
        <button
          onClick={handleShareWhatsAppBroadcast}
          className="py-2.5 px-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-[#25D366]/20 transition-all active:scale-95"
          title="Enviar plantilla oficial con enlace a lista de difusión de WhatsApp"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="truncate">WhatsApp</span>
        </button>
      </div>

      {/* Secondary Controls: Substitutions & Details */}
      <div className="mt-2.5 flex items-center justify-between pt-1">
        <button
          onClick={() => onOpenDetails(match, 'substitutions')}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowDownUp className="w-3.5 h-3.5 text-blue-600" /> Control de Cambios ({substitutionsCount})
        </button>

        <button
          onClick={() => onOpenCallup(match)}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 p-1 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          <Users className="w-3.5 h-3.5" /> Lista de Convocados
        </button>
      </div>
    </div>
  );
};
