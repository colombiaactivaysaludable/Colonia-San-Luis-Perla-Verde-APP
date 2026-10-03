import React, { useState } from 'react';
import { 
  X, 
  ArrowDownUp, 
  Trophy, 
  Minus, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle,
  Clock,
  Shirt,
  UserCheck
} from 'lucide-react';
import { Match, Player, Substitution } from '../../types';
import { useStorage } from '../../hooks/useStorage';

interface MatchDetailsModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'substitutions' | 'stats';
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  match,
  isOpen,
  onClose,
  defaultTab = 'substitutions',
}) => {
  const { storage, activeTeam } = useStorage();

  const [activeTab, setActiveTab] = useState<'substitutions' | 'stats'>(defaultTab);

  // New Substitution modal state
  const [showSubModal, setShowSubModal] = useState(false);
  const [playerOutId, setPlayerOutId] = useState('');
  const [playerInId, setPlayerInId] = useState('');
  const [subMinute, setSubMinute] = useState(35);
  const [subNotes, setSubNotes] = useState('');
  const [subError, setSubError] = useState('');

  if (!isOpen || !match) return null;

  const players = storage.getPlayers(match.teamId);
  const substitutions = storage.getSubstitutionsForMatch(match.id);
  const playerStats = storage.getStatsForMatch(match.id);

  // Reset substitution inputs
  const handleOpenNewSub = () => {
    const defaultOut = players[0]?.id || '';
    const defaultIn = players[1]?.id || '';
    setPlayerOutId(defaultOut);
    setPlayerInId(defaultIn);
    setSubMinute(45);
    setSubNotes('');
    setSubError('');
    setShowSubModal(true);
  };

  const handleSaveSubstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerOutId || !playerInId) {
      setSubError('Debes seleccionar tanto el jugador que sale como el que entra.');
      return;
    }
    if (playerOutId === playerInId) {
      setSubError('¡Validación!: El jugador que entra no puede ser el mismo jugador que sale.');
      return;
    }

    try {
      storage.addSubstitution(match.id, playerOutId, playerInId, subMinute, subNotes);
      setShowSubModal(false);
    } catch (err: any) {
      setSubError(err.message || 'Error al guardar la sustitución');
    }
  };

  const handleDeleteSubstitution = (id: string) => {
    storage.deleteSubstitution(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              {match.tournament}
            </span>
            <h2 className="text-base font-bold text-white">
              vs {match.rival}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('substitutions')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'substitutions'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ArrowDownUp className="w-4 h-4 text-emerald-400" /> Cambios / Sustituciones ({substitutions.length})
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'stats'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" /> Rendimiento Individual
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'substitutions' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                  Control cronológico de cambios de jugadores en el partido:
                </p>
                <button
                  onClick={handleOpenNewSub}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Registrar Cambio
                </button>
              </div>

              {substitutions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ArrowDownUp className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">No se han registrado sustituciones en este partido.</p>
                  <button
                    onClick={handleOpenNewSub}
                    className="text-xs font-bold text-emerald-600 hover:underline inline-block mt-1"
                  >
                    + Agregar primer cambio
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {substitutions.map((sub) => {
                    const playerOut = storage.getPlayerById(sub.playerOutId);
                    const playerIn = storage.getPlayerById(sub.playerInId);

                    return (
                      <div
                        key={sub.id}
                        className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        {/* Minute badge */}
                        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs font-black">{sub.minute}'</span>
                          <span className="text-[9px] text-slate-400 uppercase">Min</span>
                        </div>

                        {/* Players in/out breakdown */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* OUT */}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-5 h-5 rounded-md bg-red-100 text-red-700 flex items-center justify-center font-bold text-[10px]">
                              ⬇
                            </span>
                            <span className="font-bold text-slate-900 truncate">
                              #{playerOut?.dorsal} {playerOut?.fullName}
                            </span>
                            <span className="text-[10px] text-red-600 font-medium">(Sale)</span>
                          </div>

                          {/* IN */}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                              ⬆
                            </span>
                            <span className="font-bold text-slate-900 truncate">
                              #{playerIn?.dorsal} {playerIn?.fullName}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium">(Entra)</span>
                          </div>

                          {sub.notes && (
                            <p className="text-[11px] text-slate-400 italic mt-0.5">
                              Nota: {sub.notes}
                            </p>
                          )}
                        </div>

                        {/* Delete sub */}
                        <button
                          onClick={() => handleDeleteSubstitution(sub.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                          title="Eliminar este cambio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Stats per player in this match */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
                <span>Jugador</span>
                <div className="flex items-center gap-6 font-semibold">
                  <span>⚽ Goles</span>
                  <span>👟 Asist</span>
                  <span>🟨 Amar</span>
                  <span>🟥 Rojas</span>
                </div>
              </div>

              <div className="space-y-2">
                {players.map((player) => {
                  const stat = playerStats.find((s) => s.playerId === player.id) || {
                    goals: 0,
                    assists: 0,
                    yellowCards: 0,
                    redCards: 0,
                  };

                  return (
                    <div
                      key={player.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center shrink-0">
                          #{player.dorsal}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[110px] sm:max-w-[150px]">
                            {player.fullName}
                          </p>
                          <p className="text-[10px] text-slate-400">{player.position}</p>
                        </div>
                      </div>

                      {/* Stat Counters with +/- touch buttons */}
                      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        {/* Goles */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => storage.updatePlayerStat(match.id, player.id, { goals: -1 })}
                            className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-100"
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-emerald-700">
                            {stat.goals}
                          </span>
                          <button
                            onClick={() => storage.updatePlayerStat(match.id, player.id, { goals: 1 })}
                            className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs hover:bg-emerald-700 shadow-2xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Asistencias */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => storage.updatePlayerStat(match.id, player.id, { assists: -1 })}
                            className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-100"
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-blue-700">
                            {stat.assists}
                          </span>
                          <button
                            onClick={() => storage.updatePlayerStat(match.id, player.id, { assists: 1 })}
                            className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs hover:bg-blue-700 shadow-2xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Tarjetas Amarillas */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => storage.updatePlayerStat(match.id, player.id, { yellowCards: -1 })}
                            className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-100"
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-amber-600">
                            {stat.yellowCards}
                          </span>
                          <button
                            onClick={() => storage.updatePlayerStat(match.id, player.id, { yellowCards: 1 })}
                            className="w-6 h-6 rounded-md bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-xs hover:bg-amber-500 shadow-2xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Tarjetas Rojas */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => storage.updatePlayerStat(match.id, player.id, { redCards: -1 })}
                            className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-100"
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-red-600">
                            {stat.redCards}
                          </span>
                          <button
                            onClick={() => storage.updatePlayerStat(match.id, player.id, { redCards: 1 })}
                            className="w-6 h-6 rounded-md bg-red-600 text-white flex items-center justify-center font-bold text-xs hover:bg-red-700 shadow-2xs"
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
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>

      {/* Register Substitution Modal with strict in/out validation & dual minute input */}
      {showSubModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <ArrowDownUp className="w-4 h-4 text-emerald-600" /> Registrar Sustitución
              </h3>
              <button
                onClick={() => setShowSubModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubstitution} className="py-3 space-y-3.5">
              {subError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{subError}</span>
                </div>
              )}

              {/* Jugador que SALE (⬇) */}
              <div>
                <label className="block text-xs font-bold text-red-600 mb-1 flex items-center gap-1">
                  <span>⬇ Jugador que SALE del campo:</span>
                </label>
                <select
                  value={playerOutId}
                  onChange={(e) => setPlayerOutId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  required
                >
                  <option value="">-- Seleccionar Jugador Saliente --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.dorsal} {p.fullName} ({p.position})
                    </option>
                  ))}
                </select>
              </div>

              {/* Jugador que ENTRA (⬆) */}
              <div>
                <label className="block text-xs font-bold text-emerald-600 mb-1 flex items-center gap-1">
                  <span>⬆ Jugador que ENTRA al campo:</span>
                </label>
                <select
                  value={playerInId}
                  onChange={(e) => setPlayerInId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                >
                  <option value="">-- Seleccionar Jugador Entrante --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === playerOutId}>
                      #{p.dorsal} {p.fullName} ({p.position}) {p.id === playerOutId ? '(Sale)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minuto del cambio: 100% editable manual + botones +/- */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Minuto del Cambio:</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSubMinute((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold active:scale-95 transition-transform"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={subMinute}
                    onChange={(e) => setSubMinute(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                    className="flex-1 h-10 text-center text-base font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="Minuto"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setSubMinute((prev) => Math.min(120, prev + 1))}
                    className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold active:scale-95 transition-transform hover:bg-slate-800"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notas opcionales */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notas o Causa (Opcional):</label>
                <input
                  type="text"
                  value={subNotes}
                  onChange={(e) => setSubNotes(e.target.value)}
                  placeholder="Ej. Cambio táctico, fatiga, lesión leve"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-transform"
                >
                  Registrar Cambio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
