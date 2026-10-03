import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  Trophy, 
  Users, 
  Shield, 
  AlertTriangle, 
  Sparkles,
  Shirt,
  Timer,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Home,
  Phone
} from 'lucide-react';
import { Match, Player, Callup, AbsenceReason } from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { formatCurrency, formatDateSpanish } from '../../utils/whatsapp';

interface PublicConfirmationViewProps {
  matchId: string;
  onNavigateHome?: () => void;
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

export const PublicConfirmationView: React.FC<PublicConfirmationViewProps> = ({
  matchId,
  onNavigateHome,
}) => {
  const { storage, teams } = useStorage();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [docDigits, setDocDigits] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [absenceReason, setAbsenceReason] = useState<AbsenceReason>('Trabajo');
  const [showAbsencePicker, setShowAbsencePicker] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to real-time updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, [storage]);

  const match = storage.getMatchById(matchId);
  const team = match ? storage.getTeamById(match.teamId) || teams[0] : teams[0];
  const allTeamPlayers = match ? storage.getPlayers(match.teamId) : [];
  const callups = match ? storage.getCallupsForMatch(match.id) : [];

  // Convocados list
  const convocadosMap = allTeamPlayers
    .filter((player) => {
      const callup = callups.find((c) => c.playerId === player.id);
      return callup && callup.status !== 'No Convocado';
    })
    .map((player) => {
      const callup = callups.find((c) => c.playerId === player.id);
      const confStatus = callup?.confirmationStatus || (callup?.status === 'Inasistencia' ? 'No Asiste' : 'Pendiente');
      return {
        player,
        callup,
        confirmationStatus: confStatus as 'Confirmado' | 'No Asiste' | 'Pendiente',
      };
    })
    .sort((a, b) => a.player.dorsal - b.player.dorsal);

  // Counters
  const confirmedCount = convocadosMap.filter((item) => item.confirmationStatus === 'Confirmado').length;
  const declinedCount = convocadosMap.filter((item) => item.confirmationStatus === 'No Asiste').length;
  const pendingCount = convocadosMap.filter((item) => item.confirmationStatus === 'Pendiente').length;

  if (!match) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl mb-4 shadow-xl">
          🌲
        </div>
        <h1 className="text-xl font-black mb-2">Partido no encontrado</h1>
        <p className="text-xs text-slate-400 max-w-sm mb-6">
          El enlace del partido no existe o ha expirado. Por favor solicita el enlace actualizado a la delegación.
        </p>
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
          >
            Ir a la Aplicación Principal
          </button>
        )}
      </div>
    );
  }

  // Equipment combined
  const allEquipment = [
    ...(match.requiredEquipment || []),
    ...(match.customEquipment?.trim() ? [match.customEquipment.trim()] : []),
  ];

  // Verification step check using player's cellphone number
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    const trimmedInput = docDigits.trim();
    if (trimmedInput.length < 2) {
      setVerificationError('Ingresa al menos 2 dígitos.');
      return;
    }

    // Clean phone number to digits only
    const cleanPhone = selectedPlayer.phone.replace(/\D/g, '');

    // Check if entered digits match the end of player's phone (e.g. last 2 digits, or last 3-4 digits)
    const phoneMatches = cleanPhone.endsWith(trimmedInput) || cleanPhone.slice(-2) === trimmedInput;

    if (phoneMatches) {
      setVerificationError('');
      setIsVerified(true);
      return;
    }

    // Friendly fallback: if player has no phone registered or entered their 2-digit dorsal
    const dorsalTwoDigits = String(selectedPlayer.dorsal).padStart(2, '0').slice(-2);
    if (!cleanPhone || cleanPhone.length < 2 || trimmedInput === dorsalTwoDigits) {
      setVerificationError('');
      setIsVerified(true);
      return;
    }

    // If player has document number and entered it as backup, also allow
    if (selectedPlayer.documentNumber && selectedPlayer.documentNumber.endsWith(trimmedInput)) {
      setVerificationError('');
      setIsVerified(true);
      return;
    }

    setVerificationError(
      `Los dígitos ingresados no coinciden con los últimos dígitos del celular registrado para ${selectedPlayer.fullName}.`
    );
  };

  // Confirm attendance
  const handleConfirmAttendance = (willAttend: boolean) => {
    if (!selectedPlayer) return;
    setIsSubmitting(true);

    const statusChoice = willAttend ? 'Confirmado' : 'No Asiste';
    const reason = willAttend ? undefined : absenceReason;

    try {
      storage.confirmPlayerCallup(match.id, selectedPlayer.id, statusChoice, reason);
      setFeedbackSuccess(
        willAttend
          ? `¡Excelente, ${selectedPlayer.fullName}! Tu asistencia ha sido confirmada. Nos vemos en la cancha.`
          : `Entendido, ${selectedPlayer.fullName}. Se registró tu inasistencia por motivo de "${reason}".`
      );
      setIsVerified(false);
      setSelectedPlayer(null);
      setDocDigits('');
      setShowAbsencePicker(false);
    } catch (err: any) {
      setVerificationError('Error al guardar la confirmación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPlayerToConfirm = (player: Player) => {
    setSelectedPlayer(player);
    setIsVerified(false);
    setDocDigits('');
    setVerificationError('');
    setShowAbsencePicker(false);
    setFeedbackSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 text-white flex flex-col items-center py-6 px-4 selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-lg space-y-5">
        {/* Top Header Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/15 shadow-2xl relative overflow-hidden text-center">
          {/* Ambient Glow */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Crest & Club Branding */}
          <div className="flex flex-col items-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-3xl shadow-lg border-2 border-white/30 mb-2.5">
              {team?.shieldIcon || '🌲'}
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-300">
              Convocatoria Oficial
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Colonia San Luis - Perla Verde
            </h1>
            <p className="text-xs text-emerald-200/80 italic font-medium">
              "La Perla Bonita de Antioquia"
            </p>
          </div>

          {/* Match Pill Details */}
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 gap-2.5 text-xs text-left relative z-10">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">Torneo</span>
                <span className="font-extrabold text-sm text-white">{match.tournament}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Rival</span>
                <span className="font-extrabold text-sm text-amber-300">vs {match.rival}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Fecha</span>
                  <span className="font-bold text-white capitalize">{formatDateSpanish(match.date)}</span>
                </div>
              </div>

              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Hora</span>
                  <span className="font-bold text-white">{match.time} hrs</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Lugar / Cancha</span>
                <span className="font-bold text-white">{match.venue}</span>
              </div>
            </div>

            {/* Additional details if present */}
            <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
              {match.arrivalMinutes && match.arrivalMinutes > 0 && (
                <div className="px-2.5 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 rounded-xl flex items-center gap-1 font-semibold">
                  <Timer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Llegar {match.arrivalMinutes} min antes</span>
                </div>
              )}

              {match.individualRefereeFee && match.individualRefereeFee > 0 && (
                <div className="px-2.5 py-1 bg-amber-500/20 text-amber-200 border border-amber-500/30 rounded-xl flex items-center gap-1 font-semibold">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span>Arbitraje: {formatCurrency(match.individualRefereeFee)}</span>
                </div>
              )}
            </div>

            {allEquipment.length > 0 && (
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-[11px] text-slate-300">
                <span className="text-emerald-400 font-bold block mb-1">🎽 Recordar traer:</span>
                <span>{allEquipment.join(' · ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl">
            <span className="block text-2xl font-black text-emerald-400">{confirmedCount}</span>
            <span className="text-[10px] font-bold text-emerald-200 uppercase">Confirmados</span>
          </div>

          <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-2xl">
            <span className="block text-2xl font-black text-red-400">{declinedCount}</span>
            <span className="text-[10px] font-bold text-red-200 uppercase">No Asisten</span>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-700/60 rounded-2xl">
            <span className="block text-2xl font-black text-slate-300">{pendingCount}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Pendientes</span>
          </div>
        </div>

        {/* Success Alert Banner */}
        {feedbackSuccess && (
          <div className="p-4 bg-emerald-500/20 border-2 border-emerald-400 rounded-3xl text-xs font-bold text-emerald-100 flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span>{feedbackSuccess}</span>
              <p className="text-[11px] text-emerald-300 font-normal">
                Tu estado se ha actualizado en tiempo real en la lista de abajo.
              </p>
            </div>
          </div>
        )}

        {/* Confirmation Action Card or Trigger */}
        <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>📋</span>
              <span>Lista de Convocados ({convocadosMap.length})</span>
            </h2>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
              En tiempo real
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Toca tu nombre en la lista o el botón para confirmar tu asistencia:
          </p>

          {/* List of Players with Live Status */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {convocadosMap.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Aún no hay jugadores en la convocatoria de este partido.
              </p>
            ) : (
              convocadosMap.map(({ player, confirmationStatus, callup }) => {
                const isConfirmed = confirmationStatus === 'Confirmado';
                const isDeclined = confirmationStatus === 'No Asiste';
                const isPending = confirmationStatus === 'Pendiente';

                return (
                  <div
                    key={player.id}
                    onClick={() => handleSelectPlayerToConfirm(player)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      selectedPlayer?.id === player.id
                        ? 'bg-emerald-500/20 border-emerald-400 shadow-md ring-2 ring-emerald-500/50'
                        : isConfirmed
                        ? 'bg-emerald-950/40 border-emerald-800/60 hover:bg-emerald-950/70'
                        : isDeclined
                        ? 'bg-red-950/30 border-red-900/60 hover:bg-red-950/50'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-white flex items-center justify-center text-xs font-black shrink-0">
                        #{player.dorsal}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white truncate block">
                          {player.fullName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {player.position}
                          {isDeclined && callup?.absenceReason ? ` · Motivo: ${callup.absenceReason}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {isConfirmed && (
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[10px] font-black flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" /> Confirmado
                        </span>
                      )}
                      {isDeclined && (
                        <span className="px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-[10px] font-black flex items-center gap-1">
                          <X className="w-3 h-3 text-red-400" /> No asiste
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold flex items-center gap-1">
                          ⚪ Pendiente
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal / Sheet for Player Verification & Confirmation */}
        {selectedPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-white space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-xs">
                    #{selectedPlayer.dorsal}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white truncate max-w-[200px]">
                      {selectedPlayer.fullName}
                    </h3>
                    <span className="text-[10px] text-slate-400">{selectedPlayer.position}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step 1: Verification with cellphone digits */}
              {!isVerified ? (
                <form onSubmit={handleVerify} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Verificación con tu Celular:</span>
                    </label>
                    <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                      Para confirmar que eres <strong>{selectedPlayer.fullName}</strong>, ingresa los <strong>2 últimos dígitos de tu número de celular</strong>:
                    </p>

                    {selectedPlayer.phone && (
                      <div className="text-center mb-2.5">
                        <span className="inline-block text-[11px] bg-slate-800 text-emerald-300 px-3 py-1 rounded-full border border-slate-700 font-mono tracking-widest">
                          📱 Cel: ••••••••{selectedPlayer.phone.replace(/\D/g, '').slice(-2)}
                        </span>
                      </div>
                    )}

                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={docDigits}
                      onChange={(e) => setDocDigits(e.target.value.replace(/\D/g, ''))}
                      placeholder="••"
                      className="w-28 h-14 text-center text-3xl font-black bg-slate-800 border-2 border-emerald-500 rounded-2xl text-white mx-auto block focus:outline-none focus:ring-4 focus:ring-emerald-500/30 tracking-widest"
                      autoFocus
                      required
                    />
                    <p className="text-[10px] text-slate-400 text-center mt-1.5">
                      Ingresa los últimos dígitos de tu teléfono registrado
                    </p>
                  </div>

                  {verificationError && (
                    <div className="p-2.5 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{verificationError}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPlayer(null)}
                      className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={docDigits.length < 2}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Verificar Celular</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Final Confirmation Buttons */
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                      ✓
                    </div>
                    <h4 className="text-sm font-black text-white">¿Asistirás al partido?</h4>
                    <p className="text-[11px] text-slate-400">
                      vs {match.rival} · {match.time} hrs
                    </p>
                  </div>

                  {!showAbsencePicker ? (
                    <div className="space-y-2.5">
                      {/* Big YES Button */}
                      <button
                        onClick={() => handleConfirmAttendance(true)}
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-black rounded-2xl shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all"
                      >
                        <Check className="w-5 h-5 text-white" />
                        <span>Sí, Confirmo Asistencia</span>
                      </button>

                      {/* Big NO Button */}
                      <button
                        onClick={() => setShowAbsencePicker(true)}
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-200 text-xs font-black rounded-2xl flex items-center justify-center gap-2 transition-all"
                      >
                        <X className="w-4 h-4 text-red-400" />
                        <span>No Puedo Ir</span>
                      </button>
                    </div>
                  ) : (
                    /* Absence Reason Selection */
                    <div className="space-y-3 p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                      <label className="block text-xs font-bold text-red-300">
                        Selecciona el motivo de inasistencia:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {ABSENCE_REASONS.map((reason) => (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => setAbsenceReason(reason)}
                            className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                              absenceReason === reason
                                ? 'bg-red-600 text-white border-red-500 shadow-sm'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {reason}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAbsencePicker(false)}
                          className="flex-1 py-2 bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                        >
                          Atrás
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmAttendance(false)}
                          disabled={isSubmitting}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl shadow-md"
                        >
                          Guardar Inasistencia
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 pt-2 space-y-1">
          <p>
            🌲 <strong>Colonia San Luis - Perla Verde</strong> · Sistema Oficial de Convocatorias
          </p>
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="text-[11px] text-emerald-400 hover:underline pt-1 inline-flex items-center gap-1 font-semibold"
            >
              <Home className="w-3 h-3" />
              <span>Volver a la App Principal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
