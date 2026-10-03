import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2,
  Phone, 
  MessageSquare, 
  AlertCircle, 
  AlertTriangle,
  Shield, 
  CheckCircle2,
  ChevronRight,
  X
} from 'lucide-react';
import { Player, PlayerPosition } from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { openWhatsApp, formatCurrency } from '../../utils/whatsapp';

interface PlayerListProps {
  onOpenPlayerDetail: (player: Player) => void;
  onOpenNewPlayer: () => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  onOpenPlayerDetail,
  onOpenNewPlayer,
}) => {
  const { storage, activeTeam, userRole } = useStorage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

  const players = storage.getPlayers(activeTeam?.id);

  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nickname && p.nickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.dorsal.toString().includes(searchQuery);

    const matchesPos = selectedPosition === 'ALL' || p.position === selectedPosition;

    return matchesSearch && matchesPos;
  });

  const handleDeletePlayer = () => {
    if (!playerToDelete) return;
    storage.deletePlayer(playerToDelete.id);
    setPlayerToDelete(null);
  };

  const getPositionBadge = (pos: PlayerPosition) => {
    switch (pos) {
      case 'Arquero':
        return 'bg-amber-100 text-amber-800';
      case 'Defensa':
        return 'bg-blue-100 text-blue-800';
      case 'Volante':
        return 'bg-emerald-100 text-emerald-800';
      case 'Delantero':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" /> Plantel de Jugadores ({players.length})
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Equipo actual: <strong>{activeTeam?.name}</strong> · {activeTeam?.category}
          </p>
        </div>

        {userRole !== 'PLAYER' && (
          <button
            onClick={onOpenNewPlayer}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" /> Registrar Jugador
          </button>
        )}
      </div>

      {/* Search Bar & Position Filter */}
      <div className="flex flex-col gap-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, apodo o dorsal..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
          />
        </div>

        {/* Position Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {['ALL', 'Arquero', 'Defensa', 'Volante', 'Delantero'].map((pos) => (
            <button
              key={pos}
              onClick={() => setSelectedPosition(pos)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors font-semibold ${
                selectedPosition === pos
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {pos === 'ALL' ? 'Todos los Puestos' : pos}
            </button>
          ))}
        </div>
      </div>

      {/* Player List Cards */}
      <div className="space-y-2.5">
        {filteredPlayers.length === 0 ? (
          <div className="py-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 p-6 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No se encontraron jugadores</p>
            <p className="text-xs">
              {searchQuery ? 'Prueba con otro término de búsqueda' : 'Registra el primer jugador del equipo.'}
            </p>
            {userRole !== 'PLAYER' && !searchQuery && (
              <button
                onClick={onOpenNewPlayer}
                className="mt-2 py-2 px-4 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                + Registrar Jugador
              </button>
            )}
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const finSummary = storage.getPlayerFinancialSummary(player.id, player.teamId);

            return (
              <div
                key={player.id}
                onClick={() => onOpenPlayerDetail(player)}
                className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                {/* Left: Dorsal and Identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-2xs shrink-0 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: activeTeam?.primaryColor || '#10B981' }}
                  >
                    #{player.dorsal}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{player.fullName}</h3>
                      {player.nickname && (
                        <span className="text-[11px] text-emerald-600 font-semibold hidden sm:inline truncate">
                          "{player.nickname}"
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getPositionBadge(player.position)}`}>
                        {player.position}
                      </span>
                      {player.status !== 'Activo' && (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">
                          {player.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Debt Alert, WhatsApp trigger & Direct Delete Button */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {finSummary.isDebtor ? (
                    <div
                      className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-xl text-[11px] font-bold flex items-center gap-1"
                      title={`Debe ${formatCurrency(finSummary.balance)} en arbitrajes`}
                    >
                      <AlertCircle className="w-3 h-3 text-red-600" />
                      <span className="hidden sm:inline">Debe</span>
                      <span>{formatCurrency(finSummary.balance)}</span>
                    </div>
                  ) : (
                    <div className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-semibold hidden md:flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Al día</span>
                    </div>
                  )}

                  {/* Direct WhatsApp Message Button */}
                  <button
                    onClick={() => openWhatsApp('¡Hola! Te escribo de la delegación de ' + activeTeam?.name, player.phone)}
                    className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                    title="Escribir por WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4 text-[#25D366]" />
                  </button>

                  {/* Easy, Direct Delete Player Button */}
                  {userRole !== 'PLAYER' && (
                    <button
                      onClick={() => setPlayerToDelete(player)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors group/del"
                      title={`Eliminar a ${player.fullName} del plantel`}
                    >
                      <Trash2 className="w-4 h-4 transition-transform group-hover/del:scale-110" />
                    </button>
                  )}

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal to Delete Player safely without window.confirm */}
      {playerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                ¿Eliminar a {playerToDelete.fullName}?
              </h3>
              <p className="text-xs text-slate-500">
                #{playerToDelete.dorsal} · {playerToDelete.position}
              </p>
              <p className="text-xs text-slate-600 pt-2">
                Esta acción eliminará al jugador del plantel, así como sus convocatorias asociadas.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPlayerToDelete(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletePlayer}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/30 transition-transform active:scale-95"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
