import React from 'react';
import { 
  User, 
  Calendar, 
  DollarSign, 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Share2,
  Clock,
  MapPin
} from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { formatCurrency, formatDateSpanish, openWhatsApp } from '../../utils/whatsapp';

interface PlayerPortalViewProps {
  onOpenRoleModal: () => void;
}

export const PlayerPortalView: React.FC<PlayerPortalViewProps> = ({ onOpenRoleModal }) => {
  const { storage, activeTeam, currentPlayerId } = useStorage();

  const players = storage.getPlayers(activeTeam?.id);
  const player = players.find((p) => p.id === currentPlayerId) || players[0];

  if (!player) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
        <User className="w-12 h-12 mx-auto text-slate-300" />
        <h3 className="font-bold text-slate-800">No hay jugador seleccionado</h3>
        <p className="text-xs text-slate-500">Selecciona tu perfil de jugador para ver tus convocatorias y deudas.</p>
        <button
          onClick={onOpenRoleModal}
          className="py-2 px-4 bg-slate-900 text-white text-xs font-bold rounded-xl"
        >
          Seleccionar Mi Perfil
        </button>
      </div>
    );
  }

  const finSummary = storage.getPlayerFinancialSummary(player.id, activeTeam?.id);
  const nextMatch = storage.getNextScheduledMatch(activeTeam?.id);
  const nextCallup = nextMatch
    ? storage.getCallupsForMatch(nextMatch.id).find((c) => c.playerId === player.id)
    : null;

  const matches = storage.getMatches(activeTeam?.id);
  const myCallups = matches
    .map((m) => ({
      match: m,
      callup: storage.getCallupsForMatch(m.id).find((c) => c.playerId === player.id),
    }))
    .filter((item) => item.callup);

  const teamLeaderboard = storage.getTeamLeaderboard(activeTeam?.id);
  const myStats = teamLeaderboard.find((item) => item.player.id === player.id) || {
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    matchesPlayed: 0,
  };

  const handleNotifyPayment = () => {
    const coachPhone = activeTeam?.coachName ? '' : '';
    const text = `¡Hola! Soy *${player.fullName}* (#${player.dorsal} de ${activeTeam?.name}). Les notifico que realicé el pago de mi cuota de arbitraje por valor de ${formatCurrency(finSummary.balance > 0 ? finSummary.balance : 5000)}. Adjunto comprobante. 🙌⚽`;
    openWhatsApp(text);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Player Header Banner */}
      <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 z-10 relative">
          <div className="flex items-center gap-3.5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-md border-2 border-white/20"
              style={{ backgroundColor: activeTeam?.primaryColor || '#10B981' }}
            >
              #{player.dorsal}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded-md uppercase">
                  Modo Jugador
                </span>
                <span className="text-xs text-slate-300 font-semibold">{player.position}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                {player.fullName}
              </h2>
              {player.nickname && (
                <p className="text-xs text-emerald-400">"{player.nickname}" · {activeTeam?.name}</p>
              )}
            </div>
          </div>

          <button
            onClick={onOpenRoleModal}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Cambiar Perfil
          </button>
        </div>
      </div>

      {/* Featured Next Match Callup Card */}
      {nextMatch && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
              🏆 Próximo Partido
            </span>
            {nextCallup?.status === 'Convocado' ? (
              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> ¡Estás Convocado!
              </span>
            ) : nextCallup?.status === 'Inasistencia' ? (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-xl text-xs font-bold">
                Inasistencia Reportada ({nextCallup.absenceReason})
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold">
                No Convocado
              </span>
            )}
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium">{nextMatch.tournament}</p>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">vs {nextMatch.rival}</h3>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 p-3 bg-slate-50 rounded-2xl">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">{formatDateSpanish(nextMatch.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{nextMatch.time} hrs</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="truncate">{nextMatch.venue}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-500">Tu cuota de arbitraje:</span>
            <span className="text-sm font-black text-emerald-700">
              {formatCurrency(nextMatch.individualRefereeFee)}
            </span>
          </div>
        </div>
      )}

      {/* Financial Status (Estado de Cuenta Personal) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Mi Estado de Cuenta (Arbitrajes)
          </h3>
          {finSummary.isDebtor ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Saldo Pendiente
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Al Día
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <span className="text-[10px] text-slate-500 block">Total Cobrado</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800">{formatCurrency(finSummary.totalOwed)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Total Pagado</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-700">{formatCurrency(finSummary.totalPaid)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Saldo Actual</span>
            <span className={`text-xs sm:text-sm font-black ${finSummary.balance > 0 ? 'text-red-600' : 'text-slate-700'}`}>
              {formatCurrency(finSummary.balance)}
            </span>
          </div>
        </div>

        <button
          onClick={handleNotifyPayment}
          className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-2xl text-xs font-bold shadow-md shadow-[#25D366]/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Share2 className="w-4 h-4" /> Notificar Pago por WhatsApp
        </button>
      </div>

      {/* Personal Sports Stats */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Mis Estadísticas Personales
        </h3>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="block text-2xl font-black text-slate-900">{myStats.matchesPlayed}</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Partidos</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
            <span className="block text-2xl font-black text-emerald-700">{myStats.goals}</span>
            <span className="text-[10px] font-semibold text-emerald-800 uppercase">⚽ Goles</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
            <span className="block text-2xl font-black text-blue-700">{myStats.assists}</span>
            <span className="text-[10px] font-semibold text-blue-800 uppercase">👟 Asist</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
            <span className="block text-2xl font-black text-amber-700">{myStats.yellowCards}</span>
            <span className="text-[10px] font-semibold text-amber-800 uppercase">🟨 Amarillas</span>
          </div>
        </div>
      </div>
    </div>
  );
};
