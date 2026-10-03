import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  Trophy, 
  Users, 
  Check, 
  Sparkles, 
  Shirt,
  Timer,
  AlertCircle
} from 'lucide-react';
import { Match, Player } from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { formatCurrency } from '../../utils/whatsapp';

interface NewMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchToEdit?: Match | null;
}

const EQUIPMENT_PRESETS = [
  'Uniforme completo',
  'Espinilleras',
  'Medias',
  'Guayos',
  'Carnet EPS',
  'Documento de identidad',
  'Hidratación'
];

export const NewMatchModal: React.FC<NewMatchModalProps> = ({
  isOpen,
  onClose,
  matchToEdit,
}) => {
  const { storage, activeTeam } = useStorage();

  const [tournament, setTournament] = useState('Torneo Apertura 2026');
  const [rival, setRival] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('19:00');
  const [venue, setVenue] = useState('Cancha Sintética Principal');
  const [totalRefereeFee, setTotalRefereeFee] = useState<number>(60000);
  const [individualRefereeFee, setIndividualRefereeFee] = useState<number>(5000);
  const [arrivalMinutes, setArrivalMinutes] = useState<number>(activeTeam?.defaultArrivalMinutes || 30);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['Uniforme completo', 'Espinilleras', 'Hidratación']);
  const [customEquipment, setCustomEquipment] = useState('');
  const [confirmationDeadline, setConfirmationDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'callup'>('info');

  const teamPlayers = storage.getPlayers(activeTeam?.id);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      prevOpenRef.current = false;
      return;
    }

    // Only initialize form fields once when the modal opens; do not wipe user inputs on re-render
    if (prevOpenRef.current) return;
    prevOpenRef.current = true;

    if (matchToEdit) {
      setTournament(matchToEdit.tournament);
      setRival(matchToEdit.rival);
      setDate(matchToEdit.date);
      setTime(matchToEdit.time);
      setVenue(matchToEdit.venue);
      setTotalRefereeFee(matchToEdit.totalRefereeFee);
      setIndividualRefereeFee(matchToEdit.individualRefereeFee);
      setArrivalMinutes(matchToEdit.arrivalMinutes ?? (activeTeam?.defaultArrivalMinutes || 30));
      setSelectedEquipment(matchToEdit.requiredEquipment || ['Uniforme completo', 'Espinilleras', 'Hidratación']);
      setCustomEquipment(matchToEdit.customEquipment || '');
      setConfirmationDeadline(matchToEdit.confirmationDeadline || '');
      setNotes(matchToEdit.notes || '');

      // Load existing callups
      const existing = storage.getCallupsForMatch(matchToEdit.id);
      const convoked = existing.filter((c) => c.status === 'Convocado').map((c) => c.playerId);
      setSelectedPlayerIds(convoked.length > 0 ? convoked : teamPlayers.filter((p) => p.status === 'Activo').map((p) => p.id));
    } else {
      setTournament('Torneo Barrial 2026');
      setRival('');
      const todayStr = new Date().toISOString().split('T')[0];
      setDate(todayStr);
      setTime('20:00');
      setVenue('Cancha Sintética #1');
      setTotalRefereeFee(60000);
      setIndividualRefereeFee(5000);
      setArrivalMinutes(activeTeam?.defaultArrivalMinutes || 30);
      setSelectedEquipment(['Uniforme completo', 'Espinilleras', 'Hidratación']);
      setCustomEquipment('');
      // Default deadline: day before at 20:00
      setConfirmationDeadline(`${todayStr}T20:00`);
      setNotes('');
      // Auto-convoke all active players by default
      setSelectedPlayerIds(teamPlayers.filter((p) => p.status === 'Activo').map((p) => p.id));
    }
    setErrorMsg('');
    setActiveTab('info');
  }, [isOpen, matchToEdit?.id]);

  if (!isOpen) return null;

  const toggleEquipment = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const togglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const handleSelectAllActive = () => {
    const activeIds = teamPlayers.filter((p) => p.status === 'Activo').map((p) => p.id);
    setSelectedPlayerIds(activeIds);
  };

  const handleDeselectAll = () => {
    setSelectedPlayerIds([]);
  };

  const projectedCollection = selectedPlayerIds.length * individualRefereeFee;
  const coverageDifference = projectedCollection - totalRefereeFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament.trim() || !rival.trim() || !date || !time) {
      setErrorMsg('Por favor completa todos los campos obligatorios (*)');
      setActiveTab('info');
      return;
    }

    if (matchToEdit) {
      storage.updateMatch(matchToEdit.id, {
        tournament: tournament.trim(),
        rival: rival.trim(),
        date,
        time,
        venue: venue.trim(),
        totalRefereeFee,
        individualRefereeFee,
        arrivalMinutes: arrivalMinutes > 0 ? arrivalMinutes : undefined,
        requiredEquipment: selectedEquipment.length > 0 ? selectedEquipment : undefined,
        customEquipment: customEquipment.trim() || undefined,
        confirmationDeadline: confirmationDeadline || undefined,
        notes: notes.trim() || undefined,
      });
      storage.setCallupsForMatch(matchToEdit.id, selectedPlayerIds);
    } else {
      storage.createMatch(
        {
          teamId: activeTeam?.id || '',
          tournament: tournament.trim(),
          rival: rival.trim(),
          date,
          time,
          venue: venue.trim(),
          totalRefereeFee,
          individualRefereeFee,
          arrivalMinutes: arrivalMinutes > 0 ? arrivalMinutes : undefined,
          requiredEquipment: selectedEquipment.length > 0 ? selectedEquipment : undefined,
          customEquipment: customEquipment.trim() || undefined,
          confirmationDeadline: confirmationDeadline || undefined,
          status: 'Programado',
          notes: notes.trim() || undefined,
        },
        selectedPlayerIds
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-black leading-tight">
                {matchToEdit ? 'Editar Partido' : 'Programar Nuevo Partido'}
              </h2>
              <p className="text-[11px] text-emerald-300 italic font-medium">
                {activeTeam?.name} · "La Perla Bonita de Antioquia"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation: Info General vs Convocatoria Integrada */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'info'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Datos del Partido</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('callup')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'callup'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Convocatoria Inicial</span>
            <span className="ml-1 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {selectedPlayerIds.length}
            </span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: Información General del Partido */}
          {activeTab === 'info' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Línea 1: Torneo / Competición */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  🏆 Nombre del Torneo / Competición *
                </label>
                <input
                  type="text"
                  value={tournament}
                  onChange={(e) => setTournament(e.target.value)}
                  placeholder="Ej. Torneo Barrial Interbarrios 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Línea 2: vs Rival */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ⚽ Equipo Rival (vs ...) *
                </label>
                <input
                  type="text"
                  value={rival}
                  onChange={(e) => setRival(e.target.value)}
                  placeholder="Ej. Los Halcones F.C."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Fecha *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> Hora del Partido *
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Cancha / Lugar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> Cancha / Lugar
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Ej. Cancha Sintética San Luis #1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Minutos de anticipación & Fecha límite de confirmación */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-emerald-600" /> Llegar X min antes
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    step="5"
                    value={arrivalMinutes}
                    onChange={(e) => setArrivalMinutes(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Ej. 30"
                  />
                  <span className="text-[10px] text-slate-500">Minutos antes para calentar</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Límite de confirmación
                  </label>
                  <input
                    type="datetime-local"
                    value={confirmationDeadline}
                    onChange={(e) => setConfirmationDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-[11px] font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Cierre de asistencia</span>
                </div>
              </div>

              {/* Implementos a recordar */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5 text-emerald-600" />
                  <span>🎽 Implementos a recordar en la convocatoria:</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EQUIPMENT_PRESETS.map((item) => {
                    const isChecked = selectedEquipment.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleEquipment(item)}
                        className={`py-1 px-2.5 rounded-xl text-xs font-semibold transition-all border ${
                          isChecked
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '}
                        {item}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value)}
                  placeholder="Otro implemento puntual (ej: Petos, balón adicional, hidratación)..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Arbitraje Finanzas */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Control Financiero del Arbitraje
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Arbitraje Total Equipo
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={totalRefereeFee}
                      onChange={(e) => setTotalRefereeFee(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Cuota / Jugador
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={individualRefereeFee}
                      onChange={(e) => setIndividualRefereeFee(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Live coverage calculation */}
                <div className="text-[11px] font-semibold flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
                  <span>Convocados: <strong>{selectedPlayerIds.length}</strong></span>
                  <span>Recaudo estimado: <strong className={coverageDifference >= 0 ? 'text-emerald-700' : 'text-amber-700'}>{formatCurrency(projectedCollection)}</strong></span>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notas o Instrucciones</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Llevar uniforme titular verde, puntualidad de 25 minutos antes"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Quick switch to Callup tab button */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">
                    Convocatoria: {selectedPlayerIds.length} jugadores seleccionados
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Revisa y personaliza la lista de jugadores que recibirán el enlace.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('callup')}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-transform active:scale-95"
                >
                  Ver Convocados
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Convocatoria Integrada de Jugadores */}
          {activeTab === 'callup' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    Selecciona los jugadores convocados para este partido:
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Marca o desmarca con un toque. Aparecerán en la lista pública de confirmación.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAllActive}
                    className="py-1 px-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold hover:bg-emerald-100 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Activos ({teamPlayers.filter((p) => p.status === 'Activo').length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="py-1 px-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {/* Player Checklist */}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {teamPlayers.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No hay jugadores registrados en el equipo.
                  </p>
                ) : (
                  teamPlayers.map((player) => {
                    const isSelected = selectedPlayerIds.includes(player.id);
                    return (
                      <div
                        key={player.id}
                        onClick={() => togglePlayer(player.id)}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            #{player.dorsal}
                          </div>

                          <div className="min-w-0">
                            <span className="text-xs truncate block">
                              {player.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {player.position} {player.status !== 'Activo' ? `(${player.status})` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-lg border-2 border-slate-300" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Real-time Summary Card */}
              <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-emerald-400 font-bold block">
                    👥 {selectedPlayerIds.length} Convocados seleccionados
                  </span>
                  <span className="text-[11px] text-slate-300">
                    Cuota: {formatCurrency(individualRefereeFee)} c/u
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-white font-black text-sm block">
                    {formatCurrency(projectedCollection)}
                  </span>
                  <span className={`text-[10px] font-bold ${coverageDifference >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {coverageDifference >= 0 ? '✅ Arbitraje cubierto' : `⚠️ Faltan ${formatCurrency(Math.abs(coverageDifference))}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{matchToEdit ? 'Guardar Cambios' : 'Programar con Convocados'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
