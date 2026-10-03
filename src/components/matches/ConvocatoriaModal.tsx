import React, { useState } from 'react';
import { 
  X, 
  CheckCheck, 
  UserCheck, 
  UserX, 
  Share2, 
  AlertCircle, 
  Sparkles, 
  Copy, 
  Check, 
  MessageSquare,
  DollarSign
} from 'lucide-react';
import { Match, Player, Callup, AbsenceReason } from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { 
  formatCurrency, 
  formatDateSpanish, 
  generateConvocatoriaWhatsAppMessage, 
  openWhatsApp 
} from '../../utils/whatsapp';

interface ConvocatoriaModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
}

const ABSENCE_REASONS: AbsenceReason[] = [
  'Trabajo',
  'Lesión',
  'Viaje',
  'Personal',
  'Estudio',
  'Falta de Dinero',
  'Compromiso Familiar',
  'Otro',
];

export const ConvocatoriaModal: React.FC<ConvocatoriaModalProps> = ({ match, isOpen, onClose }) => {
  const { storage, activeTeam } = useStorage();

  const [absenceModalPlayer, setAbsenceModalPlayer] = useState<Player | null>(null);
  const [selectedAbsenceReason, setSelectedAbsenceReason] = useState<AbsenceReason>('Trabajo');
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !match) return null;

  const players = storage.getPlayers(match.teamId);
  const callups = storage.getCallupsForMatch(match.id);

  // Map each player to their callup
  const playerCallupMap = players.map((player) => {
    const callup = callups.find((c) => c.playerId === player.id);
    return {
      player,
      callup: callup || {
        id: '',
        matchId: match.id,
        playerId: player.id,
        teamId: match.teamId,
        status: 'No Convocado' as const,
      },
    };
  });

  const convocados = playerCallupMap.filter((item) => item.callup.status === 'Convocado');
  const inasistencias = playerCallupMap.filter((item) => item.callup.status === 'Inasistencia');
  const allConvoked = players.length > 0 && convocados.length === players.length;

  const handleMasterToggle = () => {
    storage.setMasterCallupState(match.id, !allConvoked);
  };

  const handle1ClickMassActive = () => {
    storage.callUpAllActivePlayers(match.id);
  };

  const handleTogglePlayer = (player: Player, currentStatus: string) => {
    if (currentStatus === 'Convocado') {
      storage.updateCallupStatus(match.id, player.id, 'No Convocado');
    } else {
      storage.updateCallupStatus(match.id, player.id, 'Convocado');
    }
  };

  const handleOpenAbsenceModal = (player: Player) => {
    setAbsenceModalPlayer(player);
    setSelectedAbsenceReason('Trabajo');
  };

  const handleSaveAbsence = () => {
    if (absenceModalPlayer) {
      storage.updateCallupStatus(match.id, absenceModalPlayer.id, 'Inasistencia', selectedAbsenceReason);
      setAbsenceModalPlayer(null);
    }
  };

  const whatsAppMessage = generateConvocatoriaWhatsAppMessage(
    activeTeam?.name || 'Equipo',
    match,
    convocados,
    inasistencias
  );

  const handleShareWhatsApp = () => {
    openWhatsApp(whatsAppMessage);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsAppMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-md uppercase">
                Convocatoria
              </span>
              <span className="text-xs text-slate-400 truncate">
                {match.date} · {match.time}
              </span>
            </div>
            <h2 className="text-base font-bold text-white truncate mt-0.5">
              vs {match.rival}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          {/* Quick Stats Bar */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                ✅ Convocados: {convocados.length}
              </span>
              <span className="font-semibold text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-lg">
                ❌ Inasistencias: {inasistencias.length}
              </span>
            </div>
            <span className="text-slate-600 font-medium">
              Cuota: <strong>{formatCurrency(match.individualRefereeFee)}</strong>
            </span>
          </div>

          {/* Mass Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handle1ClickMassActive}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> 1-Clic: Convocar Activos
            </button>

            {/* Master Checkbox */}
            <button
              onClick={handleMasterToggle}
              className={`py-2 px-3 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                allConvoked
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <CheckCheck className="w-4 h-4" />
              {allConvoked ? 'Desconvocar Todos' : 'Marcar Todo el Plantel'}
            </button>
          </div>
        </div>

        {/* Player List */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
          {playerCallupMap.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No hay jugadores registrados en este equipo aún.
            </div>
          ) : (
            playerCallupMap.map(({ player, callup }) => {
              const isConvoked = callup.status === 'Convocado';
              const isAbsent = callup.status === 'Inasistencia';

              return (
                <div
                  key={player.id}
                  className={`py-2.5 px-3 rounded-2xl flex items-center justify-between gap-3 transition-colors ${
                    isConvoked
                      ? 'bg-emerald-50/40'
                      : isAbsent
                      ? 'bg-amber-50/40'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Player info & Dorsal */}
                  <div
                    onClick={() => handleTogglePlayer(player, callup.status)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isConvoked
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : isAbsent
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      #{player.dorsal}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {player.fullName}
                        </span>
                        {player.nickname && (
                          <span className="text-[11px] text-slate-400 truncate">
                            "{player.nickname}"
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{player.position}</span>
                        {isAbsent && (
                          <span className="text-amber-700 font-semibold">
                            · Motivo: {callup.absenceReason || 'Inasistencia'}
                          </span>
                        )}
                        {player.status !== 'Activo' && (
                          <span className="text-red-500 font-medium">({player.status})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this player */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Toggle Convocado button */}
                    <button
                      onClick={() => handleTogglePlayer(player, callup.status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isConvoked
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isConvoked ? 'Convocado ✓' : 'Convocar'}
                    </button>

                    {/* Report Absence button */}
                    <button
                      onClick={() => handleOpenAbsenceModal(player)}
                      className={`p-1.5 rounded-xl transition-colors ${
                        isAbsent
                          ? 'bg-amber-100 text-amber-700 font-bold'
                          : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                      }`}
                      title="Registrar inasistencia con motivo"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* WhatsApp & Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
          {showWhatsAppPreview && (
            <div className="p-3 bg-white rounded-2xl border border-slate-200 text-xs mb-1 animate-in fade-in">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Vista Previa Mensaje WhatsApp
                </span>
                <button
                  onClick={handleCopyMessage}
                  className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 hover:underline"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? '¡Copiado!' : 'Copiar texto'}
                </button>
              </div>
              <pre className="font-mono text-[11px] text-slate-700 whitespace-pre-wrap max-h-36 overflow-y-auto bg-slate-50 p-2 rounded-xl">
                {whatsAppMessage}
              </pre>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWhatsAppPreview(!showWhatsAppPreview)}
              className="py-2.5 px-3 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              {showWhatsAppPreview ? 'Ocultar Texto' : 'Ver Formato'}
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex-1 py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold shadow-md shadow-[#25D366]/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Share2 className="w-4 h-4" /> Enviar Convocatoria a WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Modal to Register Absence with predefined reasons */}
      {absenceModalPlayer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Registrar Inasistencia</h3>
              <button
                onClick={() => setAbsenceModalPlayer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-3">
              <p className="text-xs text-slate-600">
                Selecciona el motivo por el cual <strong>{absenceModalPlayer.fullName}</strong> no asistirá:
              </p>

              <div className="grid grid-cols-2 gap-2">
                {ABSENCE_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedAbsenceReason(reason)}
                    className={`py-2 px-2.5 text-xs font-medium rounded-xl border text-left transition-all ${
                      selectedAbsenceReason === reason
                        ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold ring-1 ring-amber-500'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    • {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAbsenceModalPlayer(null)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAbsence}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Guardar Motivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
