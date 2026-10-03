import React, { useState } from 'react';
import { Calendar, Plus, Filter, Trophy } from 'lucide-react';
import { Match } from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { MatchCard } from './MatchCard';

interface MatchesViewProps {
  onOpenNewMatch: () => void;
  onOpenCallup: (match: Match) => void;
  onOpenScore: (match: Match) => void;
  onOpenDetails: (match: Match, tab?: 'substitutions' | 'stats') => void;
  onEditMatch: (match: Match) => void;
  onOpenConfirmationDashboard?: (match: Match) => void;
  onOpenMatchdayGraphic?: (match: Match) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  onOpenNewMatch,
  onOpenCallup,
  onOpenScore,
  onOpenDetails,
  onEditMatch,
  onOpenConfirmationDashboard,
  onOpenMatchdayGraphic,
}) => {
  const { storage, activeTeam, userRole } = useStorage();

  const [filter, setFilter] = useState<'ALL' | 'Programado' | 'Finalizado'>('ALL');

  const matches = storage.getMatches(activeTeam?.id);

  const filteredMatches = matches.filter((m) => {
    if (filter === 'ALL') return true;
    if (filter === 'Programado') return m.status === 'Programado' || m.status === 'En Juego';
    if (filter === 'Finalizado') return m.status === 'Finalizado';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" /> Calendario de Partidos ({matches.length})
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Fixture, convocatorias, marcadores y arbitrajes de {activeTeam?.name}
          </p>
        </div>

        {userRole !== 'PLAYER' && (
          <button
            onClick={onOpenNewMatch}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" /> Crear Partido
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
            filter === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todos los Partidos ({matches.length})
        </button>
        <button
          onClick={() => setFilter('Programado')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
            filter === 'Programado'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Próximos / Programados
        </button>
        <button
          onClick={() => setFilter('Finalizado')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
            filter === 'Finalizado'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Finalizados / Historial
        </button>
      </div>

      {/* Matches Cards List */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No hay partidos en esta categoría</h3>
            <p className="text-xs text-slate-500">Agrega un nuevo encuentro para iniciar la gestión deportiva.</p>
            {userRole !== 'PLAYER' && (
              <button
                onClick={onOpenNewMatch}
                className="mt-2 py-2 px-4 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                + Crear Partido
              </button>
            )}
          </div>
        ) : (
          filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onOpenCallup={onOpenCallup}
              onOpenScore={onOpenScore}
              onOpenDetails={onOpenDetails}
              onEditMatch={onEditMatch}
              onOpenConfirmationDashboard={onOpenConfirmationDashboard}
              onOpenMatchdayGraphic={onOpenMatchdayGraphic}
            />
          ))
        )}
      </div>
    </div>
  );
};
