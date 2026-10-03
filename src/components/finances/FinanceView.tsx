import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Share2, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Calendar, 
  CreditCard,
  TrendingUp,
  Receipt,
  MessageSquare,
  X
} from 'lucide-react';
import { Player, PaymentMethod } from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { formatCurrency, generatePaymentReminderMessage, openWhatsApp } from '../../utils/whatsapp';

const PAYMENT_METHODS: PaymentMethod[] = ['Nequi', 'Daviplata', 'Efectivo', 'Transferencia', 'Otro'];

interface FinanceViewProps {
  initialPlayerForPayment?: Player | null;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ initialPlayerForPayment }) => {
  const { storage, activeTeam, userRole } = useStorage();

  const [showPaymentModal, setShowPaymentModal] = useState(!!initialPlayerForPayment);
  const [selectedPlayerId, setSelectedPlayerId] = useState(initialPlayerForPayment?.id || '');
  const [amount, setAmount] = useState(5000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Nequi');
  const [concept, setConcept] = useState('Arbitraje');
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [paymentToDeleteId, setPaymentToDeleteId] = useState<string | null>(null);

  const players = storage.getPlayers(activeTeam?.id);
  const matches = storage.getMatches(activeTeam?.id);
  const payments = storage.getPayments(activeTeam?.id);
  const financialOverview = storage.getTeamFinancialOverview(activeTeam?.id);

  // Set default selected player when opening modal
  const handleOpenPaymentModal = (player?: Player) => {
    const targetPlayer = player || players[0];
    if (targetPlayer) {
      setSelectedPlayerId(targetPlayer.id);
      const summary = storage.getPlayerFinancialSummary(targetPlayer.id, activeTeam?.id);
      setAmount(summary.balance > 0 ? summary.balance : 5000);
      setConcept('Abono arbitraje');
    }
    setErrorMsg('');
    setShowPaymentModal(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || amount <= 0) {
      setErrorMsg('Selecciona un jugador y especifica un monto mayor a 0.');
      return;
    }

    storage.recordPayment({
      teamId: activeTeam?.id || '',
      playerId: selectedPlayerId,
      matchId: selectedMatchId || undefined,
      amount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      concept: concept.trim() || 'Arbitraje',
      notes: notes.trim() || undefined,
    });

    setShowPaymentModal(false);
  };

  const handleDeletePayment = (paymentId: string) => {
    storage.deletePayment(paymentId);
    setPaymentToDeleteId(null);
  };

  const handleSendReminder = (debtor: { player: Player; balance: number }) => {
    const msg = generatePaymentReminderMessage(
      activeTeam?.name || 'Equipo',
      debtor.player,
      debtor.balance
    );
    openWhatsApp(msg, debtor.player.phone);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" /> Control de Arbitrajes & Finanzas
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Seguimiento de cuotas, deudas y recaudación de {activeTeam?.name}
          </p>
        </div>

        {userRole !== 'PLAYER' && (
          <button
            onClick={() => handleOpenPaymentModal()}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" /> Registrar Pago
          </button>
        )}
      </div>

      {/* Resumen en Caja (Overview Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-100 font-semibold">
            <span>Total Recaudado</span>
            <TrendingUp className="w-4 h-4 text-emerald-200" />
          </div>
          <p className="text-2xl font-black">{formatCurrency(financialOverview.totalRecaudado)}</p>
          <p className="text-[11px] text-emerald-100 font-medium">
            {financialOverview.percentageCollected}% del total proyectado
          </p>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Pendiente por Cobrar</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600">{formatCurrency(financialOverview.totalPendiente)}</p>
          <p className="text-[11px] text-slate-400 font-medium">
            {financialOverview.debtors.length} jugadores con saldo pendiente
          </p>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Total Cuotas Proyectadas</span>
            <Receipt className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(financialOverview.totalEsperado)}</p>
          <p className="text-[11px] text-slate-400 font-medium">Por partidos con convocatoria</p>
        </div>
      </div>

      {/* Collection Progress Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-700">Porcentaje de Recaudo de Arbitrajes</span>
          <span className="text-emerald-700 font-black">{financialOverview.percentageCollected}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${financialOverview.percentageCollected}%` }}
          />
        </div>
      </div>

      {/* Debtors Section (Jugadores con saldo pendiente) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" /> Jugadores con Saldo Pendiente ({financialOverview.debtors.length})
          </h3>
          <span className="text-xs text-slate-400 font-medium">Ordenados por monto adeudado</span>
        </div>

        {financialOverview.debtors.length === 0 ? (
          <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-200 text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-bold text-emerald-900">¡Planilla al día!</p>
            <p className="text-xs text-emerald-700">Todos los jugadores convocados han cancelado sus arbitrajes.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {financialOverview.debtors.map(({ player, balance, totalOwed, totalPaid }) => (
              <div
                key={player.id}
                className="p-3.5 bg-white rounded-2xl border border-red-200 hover:border-red-400 transition-colors flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-2xs shrink-0"
                    style={{ backgroundColor: activeTeam?.primaryColor || '#10B981' }}
                  >
                    #{player.dorsal}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{player.fullName}</p>
                    <p className="text-[11px] text-slate-500">
                      Cobrado: {formatCurrency(totalOwed)} · Pagado: {formatCurrency(totalPaid)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-black text-red-600 block">
                      {formatCurrency(balance)}
                    </span>
                    <span className="text-[10px] text-red-500 font-medium">Deuda</span>
                  </div>

                  {/* Cobrar WhatsApp */}
                  <button
                    onClick={() => handleSendReminder({ player, balance })}
                    className="py-1.5 px-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                    title="Enviar recordatorio de cobro por WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cobrar</span>
                  </button>

                  {/* Registrar Abono Directo */}
                  {userRole !== 'PLAYER' && (
                    <button
                      onClick={() => handleOpenPaymentModal(player)}
                      className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-transform active:scale-95"
                      title="Registrar abono de este jugador"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Abonar</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de Pagos y Abonos Registrados */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-600" /> Historial de Pagos Registrados ({payments.length})
        </h3>

        {payments.length === 0 ? (
          <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
            No se han registrado pagos aún en este equipo.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
            {payments.map((pay) => {
              const player = storage.getPlayerById(pay.playerId);

              return (
                <div key={pay.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black shrink-0">
                      #{player?.dorsal || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {player?.fullName || 'Jugador eliminado'}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {pay.paymentMethod}
                        </span>
                        <span>· {pay.concept}</span>
                        <span>· {pay.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs sm:text-sm font-black text-emerald-700">
                      +{formatCurrency(pay.amount)}
                    </span>
                    {userRole !== 'PLAYER' && (
                      <button
                        onClick={() => setPaymentToDeleteId(pay.id)}
                        className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar registro de pago"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal to Record Payment */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Registrar Abono o Pago
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-5 space-y-3.5">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200">
                  {errorMsg}
                </div>
              )}

              {/* Jugador */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jugador *</label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => {
                    setSelectedPlayerId(e.target.value);
                    const s = storage.getPlayerFinancialSummary(e.target.value, activeTeam?.id);
                    if (s.balance > 0) setAmount(s.balance);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                >
                  <option value="">-- Seleccionar Jugador --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.dorsal} {p.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monto del Pago (COP) *</label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Método de Pago */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Método de Pago</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                        paymentMethod === pm
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partido Asociado (Opcional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Partido Asociado (Opcional)</label>
                <select
                  value={selectedMatchId}
                  onChange={(e) => {
                    setSelectedMatchId(e.target.value);
                    const m = storage.getMatchById(e.target.value);
                    if (m) setConcept(`Arbitraje vs ${m.rival}`);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- General / Sin partido específico --</option>
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      vs {m.rival} ({m.date}) - {m.tournament}
                    </option>
                  ))}
                </select>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Concepto</label>
                <input
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Ej. Arbitraje vs San Martín"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notas / Comprobante</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Comprobante Nequi M19349"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-transform"
                >
                  Guardar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal to Delete Payment */}
      {paymentToDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                ¿Eliminar este registro de pago?
              </h3>
              <p className="text-xs text-slate-500">
                Esta acción revertirá el abono del saldo del jugador.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPaymentToDeleteId(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeletePayment(paymentToDeleteId)}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95"
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
