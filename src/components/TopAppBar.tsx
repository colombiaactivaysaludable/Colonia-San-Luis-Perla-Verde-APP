import React, { useState } from 'react';
import { 
  ChevronDown, 
  Smartphone, 
  Monitor, 
  Database, 
  Code2, 
  UserCheck, 
  Plus, 
  Edit3, 
  Trash2,
  Shield,
  Sparkles,
  Download
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { Team, UserRole } from '../types';

interface TopAppBarProps {
  onOpenTeamModal: () => void;
  onOpenRoleModal: () => void;
  onOpenBackupModal: () => void;
  onOpenKotlinModal: () => void;
  onOpenInstallModal: () => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onOpenTeamModal,
  onOpenRoleModal,
  onOpenBackupModal,
  onOpenKotlinModal,
  onOpenInstallModal,
  isMobileFrame,
  onToggleMobileFrame,
}) => {
  const { activeTeam, teams, storage, userRole } = useStorage();
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Admin', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'COACH':
        return { label: 'Director Técnico', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'PLAYER':
        return { label: 'Modo Jugador', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
  };

  const roleInfo = getRoleBadge(userRole);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
        {/* Team Selector / Active Team Brand & Logo */}
        <div className="relative">
          <button
            onClick={() => setShowTeamDropdown(!showTeamDropdown)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-2xl hover:bg-slate-800/80 active:scale-95 transition-all text-left"
            title="Cambiar o gestionar equipo"
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner font-bold border border-white/20 shrink-0"
              style={{ backgroundColor: activeTeam?.primaryColor || '#059669' }}
            >
              {activeTeam?.shieldIcon || '🌲'}
            </div>
            
            <div className="flex flex-col min-w-0 max-w-[130px] sm:max-w-[210px]">
              <div className="flex items-center gap-1">
                <span className="font-black text-xs sm:text-sm text-white truncate leading-tight">
                  {activeTeam?.name || 'Colonia San Luis'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>
              <span className="text-[10px] sm:text-[11px] text-emerald-300 font-semibold italic truncate">
                "{activeTeam?.slogan || 'La Perla Bonita de Antioquia'}"
              </span>
            </div>
          </button>

          {/* Quick Dropdown */}
          {showTeamDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowTeamDropdown(false)} 
              />
              <div className="absolute left-0 mt-2 w-72 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Equipos Registrados ({teams.length})
                </div>
                
                <div className="max-h-60 overflow-y-auto py-1">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => {
                        storage.setActiveTeamId(team.id);
                        setShowTeamDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-700/60 transition-colors ${
                        team.id === activeTeam?.id ? 'bg-emerald-950/60 border-l-4 border-emerald-400' : ''
                      }`}
                    >
                      <span 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                        style={{ backgroundColor: team.primaryColor }}
                      >
                        {team.shieldIcon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{team.name}</p>
                        <p className="text-[11px] text-slate-400">{team.category}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 px-2 border-t border-slate-700 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setShowTeamDropdown(false);
                      onOpenTeamModal();
                    }}
                    className="w-full py-2 px-3 text-xs font-medium text-emerald-400 bg-emerald-950/50 hover:bg-emerald-900/60 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Administrar & Crear Equipos
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Actions & Role Selector */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Direct Install Button for Android, Apple, Mac */}
          <button
            onClick={onOpenInstallModal}
            className="py-1 px-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition-all active:scale-95 ring-1 ring-emerald-300/30"
            title="Instalar App directamente a Android, Apple o Mac de una"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Instalar</span>
          </button>

          {/* Role Pill Switcher */}
          <button
            onClick={onOpenRoleModal}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-95 ${roleInfo.color}`}
            title="Cambiar rol: Administrador, Director Técnico o Jugador"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{roleInfo.label}</span>
          </button>

          {/* Backup / Room DB JSON */}
          <button
            onClick={onOpenBackupModal}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Copia de Seguridad y Sincronización JSON (Room Offline)"
          >
            <Database className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          </button>

          {/* Native Kotlin Code Reference */}
          <button
            onClick={onOpenKotlinModal}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors hidden sm:flex items-center gap-1 text-xs"
            title="Ver código fuente nativo Android Kotlin, Room y Jetpack Compose"
          >
            <Code2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            <span className="text-[11px] font-mono text-cyan-300 hidden md:inline">Kotlin</span>
          </button>

          {/* Toggle Mobile Android Phone Frame vs Responsive */}
          <button
            onClick={onToggleMobileFrame}
            className={`p-2 rounded-xl transition-colors ${
              isMobileFrame 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isMobileFrame ? 'Cambiar a vista completa de escritorio' : 'Simular marco de celular Android'}
          >
            {isMobileFrame ? <Monitor className="w-4 h-4 sm:w-5 sm:h-5" /> : <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
