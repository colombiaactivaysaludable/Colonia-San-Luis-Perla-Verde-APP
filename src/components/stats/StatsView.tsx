import React, { useState } from 'react';
import { Trophy, Medal, Flame, Zap, Shield, AlertTriangle } from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { Player } from '../../types';

interface StatsViewProps {
  onSelectPlayer?: (player: Player) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ onSelectPlayer }) => {
  const { storage, activeTeam } = useStorage();

  const [filterType, setFilterType] = useState<'goals' | 'assists' | 'cards'>('goals');

  const leaderboard = storage.getTeamLeaderboard(activeTeam?.id);
  const matches = storage.getMatches(activeTeam?.id);
  const finishedMatches = matches.filter((m) => m.status === 'Finalizado');

  const totalGoals = leaderboard.reduce((sum, item) => sum + item.goals, 0);
  const totalAssists = leaderboard.reduce((sum, item) => sum + item.assists, 0);
  const totalYellows = leaderboard.reduce((sum, item) => sum + item.yellowCards, 0);
  const totalReds = leaderboard.reduce((sum, item) => sum + item.redCards, 0);

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (filterType === 'goals') return b.goals - a.goals || b.assists - a.assists;
    if (filterType === 'assists') return b.assists - a.assists || b.goals - a.goals;
    return (b.yellowCards + b.redCards * 2) - (a.yellowCards + a.redCards * 2);
  });

  const topScorers = leaderboard.filter((item) => item.goals > 0).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Estadísticas y Goleadores
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Rendimiento individual y colectivo de {activeTeam?.name}
        </p>
      </div>

      {/* Global Team Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs text-center">
          <span className="block text-2xl font-black text-slate-900">{finishedMatches.length}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase">Partidos Jugados</span>
        </div>
        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-2xs text-center">
          <span className="block text-2xl font-black text-emerald-700">{totalGoals}</span>
          <span className="text-[10px] font-bold text-emerald-800 uppercase">⚽ Goles Marcados</span>
        </div>
        <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 shadow-2xs text-center">
          <span className="block text-2xl font-black text-blue-700">{totalAssists}</span>
          <span className="text-[10px] font-bold text-blue-800 uppercase">👟 Asistencias</span>
        </div>
        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 shadow-2xs text-center">
          <div className="flex items-center justify-center gap-2 text-xl font-black">
            <span className="text-amber-600">{totalYellows}🟨</span>
            <span className="text-red-600">{totalReds}🟥</span>
          </div>
          <span className="text-[10px] font-bold text-amber-800 uppercase">Tarjetas</span>
        </div>
      </div>

      {/* Podio de Goleadores (Top 3) */}
      {topScorers.length > 0 && (
        <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl shadow-md border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-amber-400">
              <Flame className="w-4 h-4" /> Podio de Goleadores de la Temporada
            </h3>
            <span className="text-[11px] text-slate-400">Pichichi del Plantel</span>
          </div>

          <div className="grid grid-cols-3 gap-2 items-end pt-3">
            {/* 2nd Place */}
            {topScorers[1] ? (
              <div
                onClick={() => onSelectPlayer && onSelectPlayer(topScorers[1].player)}
                className="flex flex-col items-center cursor-pointer group"
              >
                <span className="text-xl mb-1">🥈</span>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold mb-1 shadow-sm group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: activeTeam?.primaryColor || '#10B981' }}
                >
                  #{topScorers[1].player.dorsal}
                </div>
                <span className="text-xs font-bold text-slate-200 text-center truncate max-w-[85px]">
                  {topScorers[1].player.nickname || topScorers[1].player.fullName.split(' ')[0]}
                </span>
                <span className="text-sm font-black text-amber-400 mt-0.5">
                  {topScorers[1].goals} <span className="text-[10px] font-normal text-slate-400">goles</span>
                </span>
                <div className="w-full h-12 bg-slate-800/80 rounded-t-xl mt-2 flex items-center justify-center text-slate-500 font-bold text-xs">
                  2°
                </div>
              </div>
            ) : (
              <div />
            )}

            {/* 1st Place (Leader) */}
            {topScorers[0] && (
              <div
                onClick={() => onSelectPlayer && onSelectPlayer(topScorers[0].player)}
                className="flex flex-col items-center cursor-pointer group -translate-y-2"
              >
                <span className="text-3xl mb-1 animate-bounce">👑</span>
                <div
                  className="w-13 h-13 rounded-2xl flex items-center justify-center text-sm font-black mb-1 shadow-md ring-2 ring-amber-400 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: activeTeam?.primaryColor || '#10B981' }}
                >
                  #{topScorers[0].player.dorsal}
                </div>
                <span className="text-sm font-bold text-white text-center truncate max-w-[100px]">
                  {topScorers[0].player.nickname || topScorers[0].player.fullName.split(' ')[0]}
                </span>
                <span className="text-base font-black text-amber-400 mt-0.5">
                  {topScorers[0].goals} <span className="text-xs font-normal text-amber-200">goles</span>
                </span>
                <div className="w-full h-18 bg-amber-500/20 border-t-2 border-amber-400 rounded-t-2xl mt-2 flex items-center justify-center text-amber-300 font-black text-sm">
                  1° Puesto
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {topScorers[2] ? (
              <div
                onClick={() => onSelectPlayer && onSelectPlayer(topScorers[2].player)}
                className="flex flex-col items-center cursor-pointer group"
              >
                <span className="text-xl mb-1">🥉</span>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold mb-1 shadow-sm group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: activeTeam?.primaryColor || '#10B981' }}
                >
                  #{topScorers[2].player.dorsal}
                </div>
                <span className="text-xs font-bold text-slate-200 text-center truncate max-w-[85px]">
                  {topScorers[2].player.nickname || topScorers[2].player.fullName.split(' ')[0]}
                </span>
                <span className="text-sm font-black text-amber-400 mt-0.5">
                  {topScorers[2].goals} <span className="text-[10px] font-normal text-slate-400">goles</span>
                </span>
                <div className="w-full h-8 bg-slate-800/80 rounded-t-xl mt-2 flex items-center justify-center text-slate-500 font-bold text-xs">
                  3°
                </div>
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs for Leaderboard */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterType('goals')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-colors ${
            filterType === 'goals'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          ⚽ Goleadores
        </button>
        <button
          onClick={() => setFilterType('assists')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-colors ${
            filterType === 'assists'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          👟 Asistencias (Pasegol)
        </button>
        <button
          onClick={() => setFilterType('cards')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-colors ${
            filterType === 'cards'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          🟨 Disciplina / Tarjetas
        </button>
      </div>

      {/* Complete Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
          <div className="flex items-center gap-3">
            <span className="w-6 text-center">#</span>
            <span>Jugador</span>
          </div>
          <div className="flex items-center gap-6 font-mono">
            <span className="w-8 text-center" title="Partidos Jugados">PJ</span>
            <span className={`w-8 text-center ${filterType === 'goals' ? 'text-emerald-700 font-black' : ''}`}>G</span>
            <span className={`w-8 text-center ${filterType === 'assists' ? 'text-blue-700 font-black' : ''}`}>A</span>
            <span className={`w-8 text-center ${filterType === 'cards' ? 'text-amber-700 font-black' : ''}`}>🟨</span>
            <span className={`w-8 text-center ${filterType === 'cards' ? 'text-red-700 font-black' : ''}`}>🟥</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {sortedLeaderboard.map((item, idx) => (
            <div
              key={item.player.id}
              onClick={() => onSelectPlayer && onSelectPlayer(item.player)}
              className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-center text-xs font-black text-slate-400">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}°`}
                </span>
                <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center shrink-0">
                  #{item.player.dorsal}
                </span>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {item.player.fullName}
                  </p>
                  <p className="text-[10px] text-slate-400">{item.player.position}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 font-mono text-xs shrink-0">
                <span className="w-8 text-center text-slate-500">{item.matchesPlayed}</span>
                <span className={`w-8 text-center font-bold ${item.goals > 0 ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>
                  {item.goals}
                </span>
                <span className={`w-8 text-center font-bold ${item.assists > 0 ? 'text-blue-700 font-black' : 'text-slate-400'}`}>
                  {item.assists}
                </span>
                <span className="w-8 text-center text-amber-600">{item.yellowCards}</span>
                <span className="w-8 text-center text-red-600">{item.redCards}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
