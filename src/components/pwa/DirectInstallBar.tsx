import React from 'react';
import { Download, Sparkles, ExternalLink, Globe } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface DirectInstallBarProps {
  variant?: 'topbar' | 'banner' | 'floating';
  onOpenModal?: () => void;
}

export const DirectInstallBar: React.FC<DirectInstallBarProps> = ({ 
  variant = 'banner',
  onOpenModal
}) => {
  const { 
    isInstalled, 
    isInstallable, 
    isInIframe, 
    install, 
    openInStandaloneTab 
  } = usePWAInstall();

  // If already installed and running standalone, hide the installation prompt
  if (isInstalled) {
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else if (isInIframe) {
      openInStandaloneTab();
    } else if (onOpenModal) {
      onOpenModal();
    }
  };

  // TopAppBar compact version
  if (variant === 'topbar') {
    return (
      <button
        onClick={handleAction}
        className="py-1 px-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition-all active:scale-95 ring-1 ring-emerald-300/30"
        title="Instalar App Web Progresiva (PWA)"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instalar PWA</span>
      </button>
    );
  }

  // Banner version (prominent on Dashboard)
  return (
    <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-4 rounded-3xl shadow-lg border border-emerald-600/40 relative overflow-hidden space-y-3">
      {/* Background Glow */}
      <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            🌲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white">Instalar App Web Oficial (PWA)</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wider flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> Web
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 mt-0.5 leading-snug">
              Guarda Colonia San Luis en tu pantalla de inicio con soporte sin conexión y carga instantánea.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAction}
            className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 transition-all active:scale-95"
          >
            {isInIframe ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{isInstallable ? 'Instalar Ahora' : isInIframe ? 'Abrir para Instalar' : 'Cómo Instalar'}</span>
          </button>

          {onOpenModal && (
            <button
              onClick={onOpenModal}
              className="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors"
              title="Ver instrucciones detalladas"
            >
              <Globe className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
