import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  Minus, 
  Plus, 
  Trophy, 
  Share2, 
  Users, 
  Sparkles,
  Award
} from 'lucide-react';
import { Match, MatchStatus, Player, MatchPlayerStat } from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { openWhatsApp } from '../../utils/whatsapp';

interface ScoreEditModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreEditModal: React.FC<ScoreEditModalProps> = ({ match, isOpen, onClose }) => {
  const { storage, activeTeam } = useStorage();

  const [homeScore, setHomeScore] = useState<number>(match?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState<number>(match?.awayScore ?? 0);
  const [status, setStatus] = useState<MatchStatus>(match?.status ?? 'Finalizado');
  const [statsMap, setStatsMap] = useState<Record<string, { goals: number; assists: number; yellowCards: number; redCards: number }>>({});
  const [showStatsSection, setShowStatsSection] = useState(true);

  const teamPlayers = storage.getPlayers(match?.teamId);
  const callups = match ? storage.getCallupsForMatch(match.id) : [];

  // Sort players: convocados first, then by dorsal
  const sortedPlayers = [...teamPlayers].sort((a, b) => {
    const aConv = callups.some((c) => c.playerId === a.id && c.status === 'Convocado');
    const bConv = callups.some((c) => c.playerId === b.id && c.status === 'Convocado');
    if (aConv && !bConv) return -1;
    if (!aConv && bConv) return 1;
    return a.dorsal - b.dorsal;
  });

  const prevOpenRef = useRef(false);

  // Sync state once when modal opens; do not wipe inputs on re-render
  useEffect(() => {
    if (!isOpen || !match) {
      prevOpenRef.current = false;
      return;
    }

    if (prevOpenRef.current) return;
    prevOpenRef.current = true;

    setHomeScore(match.homeScore ?? 0);
    setAwayScore(match.awayScore ?? 0);
    setStatus(match.status === 'Programado' ? 'Finalizado' : match.status);

    // Load existing stats
    const existingStats = storage.getStatsForMatch(match.id);
    const initialMap: Record<string, { goals: number; assists: number; yellowCards: number; redCards: number }> = {};
    
    teamPlayers.forEach((p) => {
      const found = existingStats.find((s) => s.playerId === p.id);
      initialMap[p.id] = {
        goals: found?.goals ?? 0,
        assists: found?.assists ?? 0,
        yellowCards: found?.yellowCards ?? 0,
        redCards: found?.redCards ?? 0,
      };
    });

    setStatsMap(initialMap);
  }, [isOpen, match?.id]);

  if (!isOpen || !match) return null;

  const updateStat = (
    playerId: string, 
    field: 'goals' | 'assists' | 'yellowCards' | 'redCards', 
    delta: number
  ) => {
    setStatsMap((prev) => {
      const current = prev[playerId] || { goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
      const newValue = Math.max(0, current[field] + delta);
      const updated = {
        ...prev,
        [playerId]: {
          ...current,
          [field]: newValue,
        },
      };

      // If goals changed, automatically update homeScore to match player goals total
      if (field === 'goals') {
        const totalPlayerGoals = Object.values(updated).reduce((sum, s) => sum + s.goals, 0);
        setHomeScore(totalPlayerGoals);
      }

      return updated;
    });
  };

  const handleSave = () => {
    // Save match score and status
    storage.updateMatchScore(match.id, homeScore, awayScore, status);

    // Save each player's individual stats
    Object.entries(statsMap).forEach(([playerId, s]) => {
      const existingStat = storage.getStatsForMatch(match.id).find((st) => st.playerId === playerId);
      const currentGoals = existingStat?.goals ?? 0;
      const currentAssists = existingStat?.assists ?? 0;
      const currentYellows = existingStat?.yellowCards ?? 0;
      const currentReds = existingStat?.redCards ?? 0;

      const deltaGoals = s.goals - currentGoals;
      const deltaAssists = s.assists - currentAssists;
      const deltaYellows = s.yellowCards - currentYellows;
      const deltaReds = s.redCards - currentReds;

      if (deltaGoals !== 0 || deltaAssists !== 0 || deltaYellows !== 0 || deltaReds !== 0) {
        storage.updatePlayerStat(match.id, playerId, {
          goals: deltaGoals,
          assists: deltaAssists,
          yellowCards: deltaYellows,
          redCards: deltaReds,
        });
      }
    });

    onClose();
  };

  // Generate Goalscorers summary string
  const goalscorers = Object.entries(statsMap)
    .filter(([_, s]) => s.goals > 0)
    .map(([playerId, s]) => {
      const p = teamPlayers.find((tp) => tp.id === playerId);
      return `${p?.fullName || 'Jugador'} (${s.goals})`;
    });

  const handleShareMatchResultWhatsApp = () => {
    const isWinner = homeScore > awayScore;
    const isTie = homeScore === awayScore;
    const outcomeText = isWinner ? '¡Victoria! 🏆⚽' : isTie ? 'Empate 🤝' : 'Resultado del partido ⚽';

    let msg = `*${outcomeText}*\n`;
    msg += `🏆 *${match.tournament}*\n`;
    msg += `📅 ${match.date} | ⏰ ${match.time}\n\n`;
    msg += `🟢 *${activeTeam?.name || 'Nuestro Equipo'}*: *${homeScore}*\n`;
    msg += `⚪ *${match.rival}*: *${awayScore}*\n`;
    msg += `🏁 Estado: *${status}*\n\n`;

    if (goalscorers.length > 0) {
      msg += `⚽ *Goles de nuestro equipo:*\n`;
      goalscorers.forEach((g) => {
        msg += `• ${g}\n`;
      });
      msg += `\n`;
    }

    const cardsList = Object.entries(statsMap)
      .filter(([_, s]) => s.yellowCards > 0 || s.redCards > 0)
      .map(([playerId, s]) => {
        const p = teamPlayers.find((tp) => tp.id === playerId);
        const yText = s.yellowCards > 0 ? `🟨x${s.yellowCards}` : '';
        const rText = s.redCards > 0 ? `🟥x${s.redCards}` : '';
        return `• ${p?.fullName}: ${[yText, rText].filter(Boolean).join(' ')}`;
      });

    if (cardsList.length > 0) {
      msg += `🟨 *Tarjetas:*\n${cardsList.join('\n')}\n\n`;
    }

    msg += `🌲 *Colonia San Luis - Perla Verde*\n_"La Perla Bonita de Antioquia"_`;

    openWhatsApp(msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-black truncate">Registrar Marcador & Estadísticas</h2>
            <p className="text-xs text-emerald-300 truncate max-w-[280px]">
              {match.tournament} · vs {match.rival}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Match Scoreboard */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner">
            <div className="grid grid-cols-2 gap-4 items-center text-center">
              {/* Home Team (Our Team) */}
              <div className="flex flex-col items-center">
                <span 
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-sm mb-1.5 border border-white/20"
                  style={{ backgroundColor: activeTeam?.primaryColor || '#059669' }}
                >
                  {activeTeam?.shieldIcon || '🌲'}
                </span>
                <span className="text-xs font-black text-slate-900 truncate max-w-[120px]">
                  {activeTeam?.name}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold uppercase">(Local)</span>

                {/* Score Controls */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setHomeScore((prev) => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold active:scale-95 shadow-sm hover:bg-slate-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={homeScore}
                    onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-14 h-12 text-center text-2xl font-black bg-white border-2 border-emerald-500 rounded-xl text-slate-900 shadow-inner focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setHomeScore((prev) => prev + 1)}
                    className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold active:scale-95 shadow-sm hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Away Team (Rival) */}
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center text-2xl shadow-sm mb-1.5">
                  ⚽
                </div>
                <span className="text-xs font-black text-slate-900 truncate max-w-[120px]">
                  {match.rival}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">(Rival)</span>

                {/* Score Controls */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setAwayScore((prev) => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold active:scale-95 shadow-sm hover:bg-slate-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={awayScore}
                    onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-14 h-12 text-center text-2xl font-black bg-white border-2 border-slate-300 rounded-xl text-slate-900 shadow-inner focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setAwayScore((prev) => prev + 1)}
                    className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold active:scale-95 shadow-sm hover:bg-slate-900"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Estado del Partido Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Estado del Partido:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Programado', 'En Juego', 'Finalizado'] as MatchStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                    status === st
                      ? st === 'Finalizado'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : st === 'En Juego'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st === 'En Juego' ? 'En Juego ⚡' : st === 'Finalizado' ? 'Finalizado 🏁' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Goleadores Summary Chip */}
          {goalscorers.length > 0 && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-900 animate-in fade-in">
              <span className="text-base">⚽</span>
              <div className="flex-1">
                <span>Goleadores del equipo: </span>
                <span className="text-emerald-700 font-semibold">{goalscorers.join(', ')}</span>
              </div>
            </div>
          )}

          {/* Individual Player Statistics Section */}
          <div className="space-y-3 pt-1 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" /> Registro Rápido de Estadísticas por Jugador
                </h3>
                <p className="text-[11px] text-slate-500">
                  Toca (+) para anotar gol, asistencia o tarjeta. El marcador del equipo se actualiza solo.
                </p>
              </div>
            </div>

            {/* Quick Header Indicators */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Jugador</span>
              <div className="flex items-center gap-6 pr-1">
                <span title="Goles">⚽ Gol</span>
                <span title="Asistencias">👟 Asist</span>
                <span title="Amarillas">🟨 Amar</span>
                <span title="Rojas">🟥 Roja</span>
              </div>
            </div>

            {/* Players Stat Rows */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {sortedPlayers.map((player) => {
                const s = statsMap[player.id] || { goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
                const isConvoked = callups.some((c) => c.playerId === player.id && c.status === 'Convocado');

                return (
                  <div
                    key={player.id}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                      s.goals > 0
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                        : isConvoked
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50/60 border-slate-200 opacity-80'
                    }`}
                  >
                    {/* Player Info */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        #{player.dorsal}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate block">
                          {player.fullName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {player.position} {isConvoked ? '· Convocado' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Stat Steppers: Goals, Assists, Yellows, Reds */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Goles (⚽) */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateStat(player.id, 'goals', -1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center active:scale-95"
                        >
                          -
                        </button>
                        <span className={`w-5 text-center text-xs font-black ${s.goals > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {s.goals}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateStat(player.id, 'goals', 1)}
                          className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center active:scale-95 shadow-sm"
                        >
                          +
                        </button>
                      </div>

                      {/* Asistencias (👟) */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateStat(player.id, 'assists', -1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center active:scale-95"
                        >
                          -
                        </button>
                        <span className={`w-5 text-center text-xs font-black ${s.assists > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
                          {s.assists}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateStat(player.id, 'assists', 1)}
                          className="w-6 h-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center active:scale-95 shadow-sm"
                        >
                          +
                        </button>
                      </div>

                      {/* Tarjetas Amarillas (🟨) */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateStat(player.id, 'yellowCards', -1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center active:scale-95"
                        >
                          -
                        </button>
                        <span className={`w-4 text-center text-xs font-black ${s.yellowCards > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {s.yellowCards}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateStat(player.id, 'yellowCards', 1)}
                          className="w-6 h-6 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs flex items-center justify-center active:scale-95 shadow-sm"
                        >
                          +
                        </button>
                      </div>

                      {/* Tarjetas Rojas (🟥) */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateStat(player.id, 'redCards', -1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center active:scale-95"
                        >
                          -
                        </button>
                        <span className={`w-4 text-center text-xs font-black ${s.redCards > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {s.redCards}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateStat(player.id, 'redCards', 1)}
                          className="w-6 h-6 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center active:scale-95 shadow-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2">
          {/* WhatsApp Share Match Report */}
          <button
            type="button"
            onClick={handleShareMatchResultWhatsApp}
            className="w-full sm:w-auto py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
            title="Compartir resultado y goleadores por WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir en WhatsApp</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial py-2.5 px-4 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-initial py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Guardar Marcador & Estadísticas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
