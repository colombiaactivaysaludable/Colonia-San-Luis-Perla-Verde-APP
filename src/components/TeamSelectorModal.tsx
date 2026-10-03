import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, Shield, Palette, Camera, Timer } from 'lucide-react';
import { Team, TeamCategory } from '../types';
import { useStorage } from '../hooks/useStorage';

interface TeamSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: TeamCategory[] = [
  'Libre',
  'Veteranos (+35)',
  'Femenino',
  'Sub-20',
  'Senior (+45)',
  'Empresarial',
];

const SHIELD_ICONS = ['⚽', '🛡️', '⚡', '🦁', '👑', '🦅', '🏆', '🐯', '⚔️', '🔥', '🌟', '🎯'];
const COLOR_PRESETS = [
  '#10B981', // Emerald
  '#3B82F6', // Royal Blue
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#1E293B', // Slate Dark
];

export const TeamSelectorModal: React.FC<TeamSelectorModalProps> = ({ isOpen, onClose }) => {
  const { storage, teams, activeTeam } = useStorage();

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('La Perla Bonita de Antioquia');
  const [category, setCategory] = useState<string>('Libre');
  const [primaryColor, setPrimaryColor] = useState('#059669');
  const [shieldIcon, setShieldIcon] = useState('🌲');
  const [coachName, setCoachName] = useState('');
  const [defaultArrivalMinutes, setDefaultArrivalMinutes] = useState<number>(30);
  const [logoUrl, setLogoUrl] = useState('');
  const [customHashtag, setCustomHashtag] = useState('#VamosColonia');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const startCreate = () => {
    setName('');
    setSlogan('La Perla Bonita de Antioquia');
    setCategory('Libre');
    setPrimaryColor('#059669');
    setShieldIcon('🌲');
    setCoachName('');
    setDefaultArrivalMinutes(30);
    setLogoUrl('');
    setCustomHashtag('#VamosColonia');
    setErrorMsg('');
    setMode('create');
  };

  const startEdit = (team: Team) => {
    setEditingTeam(team);
    setName(team.name);
    setSlogan(team.slogan || 'La Perla Bonita de Antioquia');
    setCategory(team.category);
    setPrimaryColor(team.primaryColor);
    setShieldIcon(team.shieldIcon);
    setCoachName(team.coachName || '');
    setDefaultArrivalMinutes(team.defaultArrivalMinutes || 30);
    setLogoUrl(team.logoUrl || '');
    setCustomHashtag(team.customHashtag || '#VamosColonia');
    setErrorMsg('');
    setMode('edit');
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre del equipo es obligatorio.');
      return;
    }

    if (mode === 'create') {
      storage.createTeam({
        name: name.trim(),
        slogan: slogan.trim() || undefined,
        category,
        primaryColor,
        shieldIcon,
        coachName: coachName.trim() || undefined,
        defaultArrivalMinutes: defaultArrivalMinutes > 0 ? defaultArrivalMinutes : 30,
        logoUrl: logoUrl.trim() || undefined,
        customHashtag: customHashtag.trim() || undefined,
      });
    } else if (mode === 'edit' && editingTeam) {
      storage.updateTeam(editingTeam.id, {
        name: name.trim(),
        slogan: slogan.trim() || undefined,
        category,
        primaryColor,
        shieldIcon,
        coachName: coachName.trim() || undefined,
        defaultArrivalMinutes: defaultArrivalMinutes > 0 ? defaultArrivalMinutes : 30,
        logoUrl: logoUrl.trim() || undefined,
        customHashtag: customHashtag.trim() || undefined,
      });
    }

    setMode('list');
  };

  const [teamToDelete, setTeamToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = (teamId: string, teamName: string) => {
    if (teams.length <= 1) {
      setErrorMsg('No puedes eliminar el único equipo registrado.');
      return;
    }
    setTeamToDelete({ id: teamId, name: teamName });
  };

  const confirmDeleteTeam = () => {
    if (teamToDelete) {
      try {
        storage.deleteTeam(teamToDelete.id);
        setTeamToDelete(null);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al eliminar');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">
              {mode === 'list' && 'Gestión Multiequipo'}
              {mode === 'create' && 'Crear Nuevo Equipo'}
              {mode === 'edit' && 'Editar Equipo'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {mode === 'list' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Selecciona un equipo activo para administrar sus jugadores, convocatorias, partidos y pagos, o añade uno nuevo.
              </p>

              <div className="space-y-2.5">
                {teams.map((team) => {
                  const isSelected = team.id === activeTeam?.id;
                  const playersCount = storage.getPlayers(team.id).length;
                  const matchesCount = storage.getMatches(team.id).length;

                  return (
                    <div
                      key={team.id}
                      onClick={() => storage.setActiveTeamId(team.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white font-bold shadow-sm shrink-0"
                          style={{ backgroundColor: team.primaryColor }}
                        >
                          {team.shieldIcon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm truncate">{team.name}</h3>
                            {isSelected && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full">
                                Activo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{team.category}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {playersCount} jugadores · {matchesCount} partidos
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => startEdit(team)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Editar información del equipo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {teams.length > 1 && (
                          <button
                            onClick={() => handleDelete(team.id, team.name)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Eliminar equipo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={startCreate}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-md shadow-emerald-600/20"
              >
                <Plus className="w-5 h-5" /> Crear Nuevo Equipo
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Equipo *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Colonia San Luis - Perla Verde"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Eslogan o Lema Oficial</label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder='Ej. "La Perla Bonita de Antioquia"'
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoría / Rama *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Otra">Otra categoría personalizada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Director Técnico / Delegado</label>
                <input
                  type="text"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Escudo / Ícono</label>
                <div className="grid grid-cols-6 gap-2">
                  {SHIELD_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setShieldIcon(icon)}
                      className={`h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${
                        shieldIcon === icon
                          ? 'border-emerald-600 bg-emerald-50 scale-105 shadow-sm'
                          : 'border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Color Principal del Equipo</label>
                <div className="grid grid-cols-8 gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPrimaryColor(color)}
                      className={`h-8 rounded-lg transition-transform ${
                        primaryColor === color ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Minutos de anticipación por defecto & Hashtag Oficial */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Llegada Anticipada (min)</span>
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    step="5"
                    value={defaultArrivalMinutes}
                    onChange={(e) => setDefaultArrivalMinutes(parseInt(e.target.value) || 30)}
                    placeholder="Ej. 30"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Valor por defecto en partidos</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <span>Hashtag Redes</span>
                  </label>
                  <input
                    type="text"
                    value={customHashtag}
                    onChange={(e) => setCustomHashtag(e.target.value)}
                    placeholder="Ej. #VamosColonia"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Pie de la cartelera oficial</p>
                </div>
              </div>

              {/* Escudo o Logo Oficial Real */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Logo Real del Club (Para Cartelera Oficial)</span>
                  </span>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-[10px] text-red-600 hover:underline font-bold"
                    >
                      Quitar logo
                    </button>
                  )}
                </label>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white border-2 border-emerald-500 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-2xl">{shieldIcon}</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Cargar Imagen del Escudo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500">
                      Superpuesto con contraste en la parte superior del matchday graphic.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Vista Previa</p>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shadow-inner overflow-hidden"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      shieldIcon
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{name || 'Nombre del Equipo'}</h4>
                    <p className="text-xs text-slate-500">{category}</p>
                    {coachName && <p className="text-[11px] text-slate-400">DT: {coachName}</p>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-transform active:scale-95"
                >
                  {mode === 'create' ? 'Crear Equipo' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Confirmation Modal to Delete Team */}
      {teamToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                ¿Eliminar el equipo "{teamToDelete.name}"?
              </h3>
              <p className="text-xs text-slate-500">
                Esta acción eliminará el equipo y todos sus datos asociados.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setTeamToDelete(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteTeam}
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
