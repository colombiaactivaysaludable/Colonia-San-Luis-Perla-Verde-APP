import React, { useState } from 'react';
import { X, User, Phone, Hash, Shield, Tag, Camera } from 'lucide-react';
import { Player, PlayerPosition, PlayerStatus } from '../../types';
import { useStorage } from '../../hooks/useStorage';

interface PlayerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerToEdit?: Player | null;
}

const POSITIONS: PlayerPosition[] = ['Arquero', 'Defensa', 'Volante', 'Delantero'];
const STATUSES: PlayerStatus[] = ['Activo', 'Lesionado', 'Sancionado', 'Inactivo'];

export const PlayerFormModal: React.FC<PlayerFormModalProps> = ({
  isOpen,
  onClose,
  playerToEdit,
}) => {
  const { storage, activeTeam } = useStorage();

  const [fullName, setFullName] = useState(playerToEdit?.fullName || '');
  const [nickname, setNickname] = useState(playerToEdit?.nickname || '');
  const [dorsal, setDorsal] = useState<number>(playerToEdit?.dorsal || 10);
  const [position, setPosition] = useState<PlayerPosition>(playerToEdit?.position || 'Volante');
  const [status, setStatus] = useState<PlayerStatus>(playerToEdit?.status || 'Activo');
  const [phone, setPhone] = useState(playerToEdit?.phone || '+573');
  const [documentNumber, setDocumentNumber] = useState(playerToEdit?.documentNumber || '');
  const [photoUrl, setPhotoUrl] = useState(playerToEdit?.photoUrl || '');
  const [notes, setNotes] = useState(playerToEdit?.notes || '');
  const [errorMsg, setErrorMsg] = useState('');
  const prevOpenRef = React.useRef(false);

  React.useEffect(() => {
    if (!isOpen) {
      prevOpenRef.current = false;
      return;
    }

    if (prevOpenRef.current) return;
    prevOpenRef.current = true;

    if (playerToEdit) {
      setFullName(playerToEdit.fullName);
      setNickname(playerToEdit.nickname || '');
      setDorsal(playerToEdit.dorsal);
      setPosition(playerToEdit.position);
      setStatus(playerToEdit.status);
      setPhone(playerToEdit.phone);
      setDocumentNumber(playerToEdit.documentNumber || '');
      setPhotoUrl(playerToEdit.photoUrl || '');
      setNotes(playerToEdit.notes || '');
    } else {
      setFullName('');
      setNickname('');
      setDorsal(10);
      setPosition('Volante');
      setStatus('Activo');
      setPhone('+573');
      setDocumentNumber('');
      setPhotoUrl('');
      setNotes('');
    }
  }, [isOpen, playerToEdit?.id]);

  if (!isOpen) return null;

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || dorsal <= 0) {
      setErrorMsg('Nombre completo, dorsal válido y teléfono son obligatorios.');
      return;
    }

    if (playerToEdit) {
      storage.updatePlayer(playerToEdit.id, {
        fullName: fullName.trim(),
        nickname: nickname.trim() || undefined,
        dorsal,
        position,
        status,
        phone: phone.trim(),
        documentNumber: documentNumber.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      storage.createPlayer({
        teamId: activeTeam?.id || '',
        fullName: fullName.trim(),
        nickname: nickname.trim() || undefined,
        dorsal,
        position,
        status,
        phone: phone.trim(),
        documentNumber: documentNumber.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">
              {playerToEdit ? 'Editar Jugador' : 'Registrar Nuevo Jugador'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Nombre Completo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. James David Rodríguez"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* Apodo y Dorsal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Apodo (Opcional)</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ej. El Diez"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-500" /> Número de Dorsal *
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={dorsal}
                onChange={(e) => setDorsal(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Posición */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Posición en el Campo *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPosition(pos)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                    position === pos
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Estado del Jugador */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Estado del Jugador *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STATUSES.map((st) => {
                const getColors = () => {
                  switch (st) {
                    case 'Activo':
                      return status === st ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-emerald-800';
                    case 'Lesionado':
                      return status === st ? 'bg-amber-600 text-white' : 'hover:bg-amber-50 text-amber-800';
                    case 'Sancionado':
                      return status === st ? 'bg-red-600 text-white' : 'hover:bg-red-50 text-red-800';
                    case 'Inactivo':
                      return status === st ? 'bg-slate-600 text-white' : 'hover:bg-slate-50 text-slate-800';
                  }
                };

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border border-slate-200 transition-all ${getColors()}`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Teléfono de Contacto (WhatsApp) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-600" /> Teléfono / WhatsApp *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+57 300 123 4567"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              El jugador usará los <strong>2 últimos dígitos de este número</strong> para confirmar su asistencia en el enlace público.
            </p>
          </div>

          {/* Número de Cédula / Documento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <span>🪪 Cédula / Documento de Identidad (Opcional)</span>
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej. 1037654321"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Dato opcional para la planilla oficial o seguro deportivo del torneo.
            </p>
          </div>

          {/* Foto del Jugador (Para la cartelera oficial matchday) */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>Foto de Ficha (Para Cartelera Oficial)</span>
              </span>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="text-[10px] text-red-600 hover:underline font-bold"
                >
                  Quitar foto
                </button>
              )}
            </label>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-200 border-2 border-emerald-500 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                {photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors">
                  <Camera className="w-3 h-3" />
                  <span>Subir Foto del Jugador</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-500">
                  Aparecerá en el badge circular de la alineación y cartelera matchday.
                </p>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notas Médicas o Tácticas</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Cobrador de penaltis, perfil zurdo, historial de rodilla"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-transform"
            >
              {playerToEdit ? 'Guardar Cambios' : 'Registrar Jugador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
