import React, { useState } from 'react';
import { Download, Smartphone, Apple, Monitor, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface DirectInstallBarProps {
  variant?: 'topbar' | 'banner' | 'floating';
}

export const DirectInstallBar: React.FC<DirectInstallBarProps> = ({ variant = 'banner' }) => {
  const { 
    isInstalled, 
    installAndroidDirect, 
    installAppleDirect, 
    installDesktopDirect, 
    appUrl,
    isInIframe 
  } = usePWAInstall();

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (isInstalled) {
    return null;
  }

  const handleAndroid = async () => {
    const res = await installAndroidDirect();
    setFeedbackMessage(res.message);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleApple = () => {
    const res = installAppleDirect();
    setFeedbackMessage(res.message);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleDesktop = () => {
    const res = installDesktopDirect();
    setFeedbackMessage(res.message);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // TopAppBar compact version
  if (variant === 'topbar') {
    return (
      <button
        onClick={handleAndroid}
        className="py-1 px-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition-all active:scale-95 ring-1 ring-emerald-300/30"
        title="Instalar App directamente en tu dispositivo"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instalar</span>
      </button>
    );
  }

  // Banner version (prominent on Dashboard)
  return (
    <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-4 rounded-3xl shadow-lg border border-emerald-600/40 relative overflow-hidden space-y-3">
      {/* Background Glow */}
      <div className="absolute right-0 top-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-2xl border border-emerald-500/30 shrink-0">
            🌲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                Colonia San Luis - Perla Verde
              </span>
              <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                App Oficial
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 italic font-medium">
              "La Perla Bonita de Antioquia"
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Android Button */}
          <button
            onClick={handleAndroid}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-400/40"
            title="Instalar directamente en Android"
          >
            <Smartphone className="w-4 h-4" />
            <span>Instalar en Android</span>
          </button>

          {/* Apple iOS Button */}
          <button
            onClick={handleApple}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            title="Instalar en iPhone / iPad (Perfil Oficial)"
          >
            <Apple className="w-3.5 h-3.5" />
            <span>Apple (iOS)</span>
          </button>

          {/* Mac / PC Button */}
          <button
            onClick={handleDesktop}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            title="Instalar en PC / Mac"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>PC / Mac</span>
          </button>
        </div>
      </div>

      {/* Immediate Interactive Feedback */}
      {feedbackMessage && (
        <div className="p-3 bg-emerald-900/90 rounded-2xl border border-emerald-400/40 text-xs font-bold text-emerald-100 flex items-center gap-2.5 animate-in fade-in shadow-md">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* If inside iframe: Direct standalone link */}
      {isInIframe && (
        <div className="pt-1 flex items-center justify-between text-xs text-emerald-300/80 border-t border-emerald-800/60">
          <span>¿Estás probando en vista previa?</span>
          <a
            href={appUrl || window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 hover:underline"
          >
            <span>Abrir enlace directo en Google Chrome</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
};
