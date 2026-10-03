import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Check, 
  Share2, 
  Copy, 
  ExternalLink, 
  Bell, 
  Trophy, 
  Calendar, 
  Clock, 
  MapPin, 
  MessageSquare,
  Sparkles,
  Palette
} from 'lucide-react';
import { Match, Player, Callup } from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { 
  generateConfirmationBroadcastMessage, 
  generatePendingReminderMessage, 
  getConfirmationUrl, 
  openWhatsApp, 
  formatDateSpanish 
} from '../../utils/whatsapp';

interface ConfirmationDashboardModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenMatchdayGraphic: (match: Match) => void;
}

export const ConfirmationDashboardModal: React.FC<ConfirmationDashboardModalProps> = ({
  match,
  isOpen,
  onClose,
  onOpenMatchdayGraphic,
}) => {
  const { storage, activeTeam } = useStorage();

  const [copiedBroadcast, setCopiedBroadcast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Real-time re-render subscriber
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, [storage]);

  if (!isOpen || !match) return null;

  const allPlayers = storage.getPlayers(match.teamId);
  const callups = storage.getCallupsForMatch(match.id);

  // Map convocados with their confirmation status
  const convocados = allPlayers
    .filter((player) => {
      const c = callups.find((item) => item.playerId === player.id);
      return c && c.status !== 'No Convocado';
    })
    .map((player) => {
      const c = callups.find((item) => item.playerId === player.id);
      const confStatus = c?.confirmationStatus || (c?.status === 'Inasistencia' ? 'No Asiste' : 'Pendiente');
      return {
        player,
        callup: c,
        confirmationStatus: confStatus as 'Confirmado' | 'No Asiste' | 'Pendiente',
        absenceReason: c?.absenceReason,
        confirmedAt: c?.confirmedAt,
      };
    })
    .sort((a, b) => a.player.dorsal - b.player.dorsal);

  const confirmedList = convocados.filter((item) => item.confirmationStatus === 'Confirmado');
  const declinedList = convocados.filter((item) => item.confirmationStatus === 'No Asiste');
  const pendingList = convocados.filter((item) => item.confirmationStatus === 'Pendiente');

  const confirmationUrl = getConfirmationUrl(match.id);

  // Copy broadcast message following exact requested template
  const handleCopyBroadcast = () => {
    const msg = generateConfirmationBroadcastMessage(match, activeTeam?.name || 'COLONIA SAN LUIS – PERLA VERDE');
    navigator.clipboard.writeText(msg);
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 2500);
  };

  const handleShareBroadcastWhatsApp = () => {
    const msg = generateConfirmationBroadcastMessage(match, activeTeam?.name || 'COLONIA SAN LUIS – PERLA VERDE');
    openWhatsApp(msg);
  };

  // Send reminder to pending players
  const handleSendReminderToPending = () => {
    const pendingPlayers = pendingList.map((i) => i.player);
    const msg = generatePendingReminderMessage(match, pendingPlayers, activeTeam?.name || 'Colonia San Luis – Perla Verde');
    openWhatsApp(msg);
  };

  const handleCopyLinkOnly = () => {
    navigator.clipboard.writeText(confirmationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h2 className="text-base font-black leading-tight">Control de Confirmaciones en Vivo</h2>
              <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                Tiempo Real
              </span>
            </div>
            <p className="text-xs text-emerald-300 font-medium truncate max-w-md">
              {match.tournament} · vs {match.rival} ({formatDateSpanish(match.date)})
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
          {/* Big Live Counters */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-2xs">
              <span className="block text-3xl font-black text-emerald-700">{confirmedList.length}</span>
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                ✅ Confirmados
              </span>
            </div>

            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl shadow-2xs">
              <span className="block text-3xl font-black text-red-600">{declinedList.length}</span>
              <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider">
                ❌ No Asisten
              </span>
            </div>

            <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl shadow-2xs">
              <span className="block text-3xl font-black text-slate-700">{pendingList.length}</span>
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                ⚪ Sin Responder
              </span>
            </div>
          </div>

          {/* Broadcast Link Share Banner */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>Enlace Único de Confirmación (Lista de Difusión)</span>
              </span>
              <a
                href={confirmationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline"
              >
                <span>Probar Enlace</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Envía este mensaje con plantilla oficial a tu grupo o lista de difusión de WhatsApp para que cada jugador confirme en un solo toque.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleCopyBroadcast}
                className="py-2 px-3.5 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
              >
                {copiedBroadcast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBroadcast ? '¡Mensaje Copiado!' : 'Copiar Plantilla para WhatsApp'}</span>
              </button>

              <button
                onClick={handleShareBroadcastWhatsApp}
                className="py-2 px-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Enviar a Lista de Difusión</span>
              </button>

              <button
                onClick={handleCopyLinkOnly}
                className="py-2 px-3 bg-emerald-100/60 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
                title="Copiar solo URL"
              >
                <span>{copiedLink ? '¡Link copiado!' : 'Solo Link'}</span>
              </button>
            </div>
          </div>

          {/* Action Row: Remind Pending & Final Squad / Matchday Graphic */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Remind Pending */}
            <button
              onClick={handleSendReminderToPending}
              disabled={pendingList.length === 0}
              className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Bell className="w-4 h-4" />
              <span>Recordar a Pendientes ({pendingList.length})</span>
            </button>

            {/* Generate Final Squad / Matchday Graphic */}
            <button
              onClick={() => {
                onClose();
                onOpenMatchdayGraphic(match);
              }}
              className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Palette className="w-4 h-4 text-emerald-400" />
              <span>Generar Cartelera & Convocatoria Final</span>
            </button>
          </div>

          {/* Detailed Player Breakdown List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Detalle de Convocados ({convocados.length})</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {confirmedList.length} confirmaron · {declinedList.length} bajas
              </span>
            </h3>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {convocados.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No hay jugadores convocados aún para este partido.
                </div>
              ) : (
                convocados.map(({ player, confirmationStatus, absenceReason, confirmedAt }) => (
                  <div key={player.id} className="p-3 flex items-center justify-between gap-3 hover:bg-white transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xs font-black shrink-0">
                        #{player.dorsal}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {player.fullName}
                          {player.nickname ? ` "${player.nickname}"` : ''}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {player.position}
                          {absenceReason ? ` · Motivo: ${absenceReason}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {confirmationStatus === 'Confirmado' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Confirmado
                        </span>
                      )}
                      {confirmationStatus === 'No Asiste' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded-lg text-[10px] flex items-center gap-1">
                          <X className="w-3 h-3 text-red-600" /> No asiste
                        </span>
                      )}
                      {confirmationStatus === 'Pendiente' && (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-semibold rounded-lg text-[10px]">
                          ⚪ Sin responder
                        </span>
                      )}

                      <button
                        onClick={() => openWhatsApp(`¡Hola ${player.fullName}! Te escribimos para confirmar tu asistencia al partido vs ${match.rival}.`, player.phone)}
                        className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                        title="Escribir por WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
