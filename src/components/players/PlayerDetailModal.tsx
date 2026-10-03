import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  MessageSquare, 
  Trophy, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Share2, 
  Edit3, 
  Trash2,
  Plus
} from 'lucide-react';
import { Player } from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { formatCurrency, generatePaymentReminderMessage, openWhatsApp } from '../../utils/whatsapp';

interface PlayerDetailModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onEditPlayer: (player: Player) => void;
  onRecordPaymentForPlayer?: (player: Player) => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  isOpen,
  onClose,
  onEditPlayer,
  onRecordPaymentForPlayer,
}) => {
  const { storage, activeTeam, userRole } = useStorage();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isOpen || !player) return null;

  const financialSummary = storage.getPlayerFinancialSummary(player.id, player.teamId);
  const teamLeaderboard = storage.getTeamLeaderboard(player.teamId);
  const playerStats = teamLeaderboard.find((item) => item.player.id === player.id) || {
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    matchesPlayed: 0,
  };

  const handleWhatsAppChat = () => {
    openWhatsApp('¡Hola! Te escribo desde la delegación de ' + (activeTeam?.name || 'el equipo') + '.', player.phone);
  };

  const handleWhatsAppPaymentReminder = () => {
    if (financialSummary.balance > 0) {
      const msg = generatePaymentReminderMessage(
        activeTeam?.name || 'Equipo',
        player,
        financialSummary.balance
      );
      openWhatsApp(msg, player.phone);
    }
  };

  const handleConfirmDelete = () => {
    storage.deletePlayer(player.id);
    onClose();
  };

  const getStatusBadge = (status: Player['status']) => {
    switch (status) {
      case 'Activo':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Lesionado':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Sancionado':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Inactivo':
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header with Player Card Identity */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-start justify-between relative overflow-hidden">
          {/* Background dorsal watermark */}
          <div className="absolute right-4 -bottom-6 text-8xl font-black text-white/5 pointer-events-none select-none font-mono">
            {player.dorsal}
          </div>

          <div className="flex items-center gap-3.5 z-10">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-md border-2 border-white/20"
              style={{ backgroundColor: activeTeam?.primaryColor || '#10B981' }}
            >
              #{player.dorsal}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white truncate max-w-[200px]">
                  {player.fullName}
                </h2>
              </div>
              {player.nickname && (
                <p className="text-xs text-emerald-400 font-semibold">"{player.nickname}"</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-300 font-medium">{player.position}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(player.status)}`}>
                  {player.status}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick WhatsApp Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppChat}
              className="flex-1 py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#25D366]/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <MessageSquare className="w-4 h-4" /> Escribir por WhatsApp
            </button>

            {userRole === 'ADMIN' && (
              <button
                onClick={() => {
                  onClose();
                  onEditPlayer(player);
                }}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Editar información"
              >
                <Edit3 className="w-4 h-4" /> Editar
              </button>
            )}
          </div>

          {/* Individual Sports Performance Stats */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> Rendimiento Deportivo Acumulado
            </h3>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="block text-2xl font-black text-slate-900">{playerStats.matchesPlayed}</span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Partidos</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="block text-2xl font-black text-emerald-700">{playerStats.goals}</span>
                <span className="text-[10px] font-semibold text-emerald-800 uppercase">⚽ Goles</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                <span className="block text-2xl font-black text-blue-700">{playerStats.assists}</span>
                <span className="text-[10px] font-semibold text-blue-800 uppercase">👟 Pasegol</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-center gap-1 text-base font-black">
                  <span className="text-amber-600">{playerStats.yellowCards}🟨</span>
                  <span className="text-red-600">{playerStats.redCards}🟥</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Tarjetas</span>
              </div>
            </div>
          </div>

          {/* Financial Account Statement (Estado de Cuenta Arbitrajes) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Estado de Cuenta (Arbitrajes)
              </h3>
              {financialSummary.isDebtor ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Debe dinero
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Al Día
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div>
                <span className="text-[10px] text-slate-500 block">Total Cobrado</span>
                <span className="text-xs font-bold text-slate-800">{formatCurrency(financialSummary.totalOwed)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Total Pagado</span>
                <span className="text-xs font-bold text-emerald-700">{formatCurrency(financialSummary.totalPaid)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Saldo Pendiente</span>
                <span className={`text-sm font-black ${financialSummary.balance > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                  {formatCurrency(financialSummary.balance)}
                </span>
              </div>
            </div>

            {/* Actions for debt */}
            {financialSummary.isDebtor && (
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleWhatsAppPaymentReminder}
                  className="flex-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" /> Cobrar por WhatsApp
                </button>

                {onRecordPaymentForPlayer && (
                  <button
                    onClick={() => {
                      onClose();
                      onRecordPaymentForPlayer(player);
                    }}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> Registrar Abono
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Details & Notes */}
          <div className="text-xs space-y-1 text-slate-600">
            <p>
              <strong>Teléfono:</strong> {player.phone}
            </p>
            {player.notes && (
              <p>
                <strong>Observaciones:</strong> {player.notes}
              </p>
            )}
          </div>

          {/* Delete action */}
          {userRole !== 'PLAYER' && (
            <div className="pt-2 border-t border-slate-100">
              {showConfirmDelete ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl space-y-2 animate-in fade-in">
                  <p className="text-xs font-bold text-red-800">
                    ¿Confirmas eliminar a {player.fullName} del plantel?
                  </p>
                  <p className="text-[11px] text-red-600">
                    Se borrarán sus convocatorias y registros del equipo.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowConfirmDelete(false)}
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
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar jugador del equipo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
