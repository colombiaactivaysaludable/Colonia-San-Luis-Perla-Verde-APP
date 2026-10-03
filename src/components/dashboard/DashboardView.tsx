import React from 'react';
import { 
  Trophy, 
  Calendar, 
  Users, 
  DollarSign, 
  AlertCircle, 
  Plus, 
  Sparkles, 
  Share2, 
  ArrowRight,
  Shield,
  CheckCircle2,
  Clock,
  MapPin,
  Flame,
  ChevronRight,
  Download
} from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { Match, Player } from '../../types';
import { formatCurrency, formatDateSpanish, generateConfirmationBroadcastMessage, openWhatsApp } from '../../utils/whatsapp';
import { DirectInstallBar } from '../pwa/DirectInstallBar';
import { CheckSquare, Palette } from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: 'matches' | 'players' | 'finances' | 'stats') => void;
  onOpenNewMatch: () => void;
  onOpenNewPlayer: () => void;
  onOpenCallup: (match: Match) => void;
  onOpenScore: (match: Match) => void;
  onOpenDetails: (match: Match, tab?: 'substitutions' | 'stats') => void;
  onSelectPlayer: (player: Player) => void;
  onOpenInstallModal?: () => void;
  onOpenConfirmationDashboard?: (match: Match) => void;
  onOpenMatchdayGraphic?: (match: Match) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenNewMatch,
  onOpenNewPlayer,
  onOpenCallup,
  onOpenScore,
  onOpenDetails,
  onSelectPlayer,
  onOpenInstallModal,
  onOpenConfirmationDashboard,
  onOpenMatchdayGraphic,
}) => {
  const { storage, activeTeam, userRole } = useStorage();

  const nextMatch = storage.getNextScheduledMatch(activeTeam?.id);
  const financialOverview = storage.getTeamFinancialOverview(activeTeam?.id);
  const leaderboard = storage.getTeamLeaderboard(activeTeam?.id);
  const topScorers = leaderboard.filter((item) => item.goals > 0).slice(0, 3);
  const players = storage.getPlayers(activeTeam?.id);
  const matches = storage.getMatches(activeTeam?.id);

  const handle1ClickMassActive = (e: React.MouseEvent, match: Match) => {
    e.stopPropagation();
    storage.callUpAllActivePlayers(match.id);
  };

  const handleShareWhatsApp = (e: React.MouseEvent, match: Match) => {
    e.stopPropagation();
    const msg = generateConfirmationBroadcastMessage(
      match,
      activeTeam?.name || 'COLONIA SAN LUIS – PERLA VERDE'
    );
    openWhatsApp(msg);
  };

  return (
    <div className="space-y-6">
      {/* 1-Click PWA Web Install Bar */}
      <DirectInstallBar variant="banner" onOpenModal={onOpenInstallModal} />

      {/* Team Welcome Banner */}
      <div 
        className="p-6 rounded-3xl text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ 
          background: `linear-gradient(135deg, ${activeTeam?.primaryColor || '#059669'}, #064e3b 60%, #0f172a)` 
        }}
      >
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-3xl font-black shadow-inner border border-white/20 shrink-0">
            {activeTeam?.shieldIcon || '🌲'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-white uppercase tracking-wider">
                {activeTeam?.category}
              </span>
              <span className="text-xs text-emerald-200 font-bold italic">
                "{activeTeam?.slogan || 'La Perla Bonita de Antioquia'}"
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white">
              {activeTeam?.name}
            </h1>
            <p className="text-xs text-white/80 mt-0.5">
              {players.length} jugadores en plantilla · {matches.length} partidos agendados
            </p>
          </div>
        </div>

        {/* Quick actions for Coach / Admin */}
        <div className="flex items-center gap-2 z-10 shrink-0 flex-wrap">
          {onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1 active:scale-95"
              title="Descargar e instalar directamente"
            >
              <Download className="w-3.5 h-3.5" /> Instalar App
            </button>
          )}

          {userRole !== 'PLAYER' && (
            <>
              <button
                onClick={onOpenNewMatch}
                className="py-2 px-3 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-100 transition-all flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Partido
              </button>
              <button
                onClick={onOpenNewPlayer}
                className="py-2 px-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95 border border-white/20"
              >
                <Plus className="w-3.5 h-3.5" /> Jugador
              </button>
            </>
          )}
        </div>
      </div>

      {/* Featured Card: PRÓXIMO PARTIDO */}
      {nextMatch ? (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2.5">
            {/* Línea 1: 🏆 Torneo (Chip Verde) */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold max-w-[70%] truncate">
              <span>🏆</span>
              <span className="truncate">{nextMatch.tournament}</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase">
              Próximo Encuentro
            </span>
          </div>

          {/* Línea 2: ⚽ vs Rival (En Negrita Prominente) */}
          <div className="mb-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-400">vs</span>
              <span className="truncate">{nextMatch.rival}</span>
            </h2>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-800 capitalize">
                {formatDateSpanish(nextMatch.date)}
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-bold text-slate-700">{nextMatch.time} hrs</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate">{nextMatch.venue}</span>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2 text-slate-700">
              <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Arbitraje: <strong>{formatCurrency(nextMatch.individualRefereeFee)}</strong> por jugador
              </span>
            </div>
          </div>

          {/* Quick Action Buttons on Next Match */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => onOpenConfirmationDashboard && onOpenConfirmationDashboard(nextMatch)}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              title="Ver confirmaciones de asistencia y enlace único"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="truncate">Confirmaciones</span>
            </button>

            <button
              onClick={() => onOpenMatchdayGraphic && onOpenMatchdayGraphic(nextMatch)}
              className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95"
              title="Generar cartelera oficial y convocatoria final"
            >
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate">Cartelera</span>
            </button>

            <button
              onClick={() => onOpenScore(nextMatch)}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <span>⚽</span>
              <span className="truncate">Marcador</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                const msg = generateConfirmationBroadcastMessage(nextMatch, activeTeam?.name || 'COLONIA SAN LUIS – PERLA VERDE');
                openWhatsApp(msg);
              }}
              className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-[#25D366]/20 transition-all active:scale-95"
              title="Enviar plantilla oficial a lista de difusión de WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="truncate">WhatsApp</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No hay partidos programados</h3>
          <p className="text-xs text-slate-500">Agenda el próximo encuentro para gestionar convocatorias y arbitrajes.</p>
          {userRole !== 'PLAYER' && (
            <button
              onClick={onOpenNewMatch}
              className="py-2.5 px-4 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-700"
            >
              + Crear Partido
            </button>
          )}
        </div>
      )}

      {/* Alerta Visual de Deudores en el Dashboard */}
      {financialOverview.debtors.length > 0 ? (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 rounded-3xl p-5 border border-red-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 animate-pulse shrink-0" />
              <span>Atención: {financialOverview.debtors.length} Jugadores con Saldo Pendiente</span>
            </div>
            <button
              onClick={() => onNavigateTab('finances')}
              className="text-xs font-bold text-red-700 hover:text-red-900 flex items-center gap-1 hover:underline"
            >
              Ver Finanzas <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-600">
            Hay un total de <strong className="text-red-600 font-black">{formatCurrency(financialOverview.totalPendiente)}</strong> pendiente por recaudar de cuotas de arbitraje.
          </p>

          {/* Quick list of top debtors with 1-click WhatsApp collection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {financialOverview.debtors.slice(0, 4).map(({ player, balance }) => (
              <div
                key={player.id}
                className="p-2.5 bg-white/90 backdrop-blur-xs rounded-xl border border-red-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-red-100 text-red-800 font-black flex items-center justify-center text-[10px]">
                    #{player.dorsal}
                  </span>
                  <span className="font-bold text-slate-900 truncate">{player.fullName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-red-600">{formatCurrency(balance)}</span>
                  <button
                    onClick={() => {
                      const msg = `Hola *${player.fullName}*, tienes un saldo pendiente de arbitrajes de *${formatCurrency(balance)}*. Por favor envía el comprobante de pago cuando puedas. ⚽🙌`;
                      openWhatsApp(msg, player.phone);
                    }}
                    className="p-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded-lg"
                    title="Cobrar por WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">¡Finanzas al día! No hay jugadores con deudas pendientes.</span>
          </div>
          <button
            onClick={() => onNavigateTab('finances')}
            className="font-bold text-emerald-700 hover:underline"
          >
            Ver Caja
          </button>
        </div>
      )}

      {/* Podio Rápido de Goleadores */}
      {topScorers.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Máximos Anotadores del Equipo
            </h3>
            <button
              onClick={() => onNavigateTab('stats')}
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
            >
              Tabla Completa <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {topScorers.map((item, idx) => (
              <div
                key={item.player.id}
                onClick={() => onSelectPlayer(item.player)}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      #{item.player.dorsal} {item.player.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400">{item.player.position}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-emerald-700">{item.goals}</span>
                  <span className="text-[10px] text-slate-500 block">goles</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
