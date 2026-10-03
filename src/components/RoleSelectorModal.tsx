import React, { useState } from 'react';
import { X, ShieldAlert, Award, User, CheckCircle2 } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { UserRole } from '../types';

interface RoleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSelectorModal: React.FC<RoleSelectorModalProps> = ({ isOpen, onClose }) => {
  const { storage, userRole, currentPlayerId, activeTeam } = useStorage();
  const players = storage.getPlayers(activeTeam?.id);

  const [selectedRole, setSelectedRole] = useState<UserRole>(userRole);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(currentPlayerId || (players[0]?.id || ''));

  if (!isOpen) return null;

  const handleApply = () => {
    storage.setUserRole(selectedRole);
    if (selectedRole === 'PLAYER' && selectedPlayerId) {
      storage.setCurrentPlayerId(selectedPlayerId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">Perfil y Roles de Usuario</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Cambia de perspectiva para gestionar el equipo como delegado o simular la experiencia de un jugador en su móvil.
          </p>

          <div className="space-y-3">
            {/* Admin */}
            <div
              onClick={() => setSelectedRole('ADMIN')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                selectedRole === 'ADMIN'
                  ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Administrador</h3>
                  {selectedRole === 'ADMIN' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Acceso total: gestión multiequipo, finanzas, copias de seguridad, borrar y crear registros.
                </p>
              </div>
            </div>

            {/* Coach */}
            <div
              onClick={() => setSelectedRole('COACH')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                selectedRole === 'COACH'
                  ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Director Técnico / Delegado</h3>
                  {selectedRole === 'COACH' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gestión deportiva en cancha: convocatoria masiva, cambios en tiempo real, marcador y estadísticas.
                </p>
              </div>
            </div>

            {/* Player */}
            <div
              onClick={() => setSelectedRole('PLAYER')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                selectedRole === 'PLAYER'
                  ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Jugador (Modo Consulta)</h3>
                  {selectedRole === 'PLAYER' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Portal personal: consulta de partidos convocados, estado de cuenta de arbitrajes y goles propios.
                </p>
              </div>
            </div>
          </div>

          {/* Player Selector if role is PLAYER */}
          {selectedRole === 'PLAYER' && (
            <div className="pt-2 border-t border-slate-200 animate-in fade-in">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Selecciona tu perfil de jugador ({activeTeam?.name}):
              </label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.dorsal} {p.fullName} {p.nickname ? `(${p.nickname})` : ''} - {p.position}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition-transform active:scale-95"
            >
              Aplicar Rol
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
