import React, { useState } from 'react';
import { X, Smartphone, Apple, Monitor, CheckCircle, ExternalLink, Download, Sparkles, Check, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface DirectInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectInstallModal: React.FC<DirectInstallModalProps> = ({ isOpen, onClose }) => {
  const { 
    downloadAndroidLauncher,
    installAndroidDirect, 
    installAppleDirect, 
    installDesktopDirect, 
    appUrl,
    isInIframe 
  } = usePWAInstall();

  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  if (!isOpen) return null;

  const handleAndroid = async () => {
    const res = await installAndroidDirect();
    setActiveMessage(res.message);
  };

  const handleApple = () => {
    const res = installAppleDirect();
    setActiveMessage(res.message);
  };

  const handleDesktop = () => {
    const res = installDesktopDirect();
    setActiveMessage(res.message);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl || window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🌲</span>
            <div>
              <h2 className="text-sm font-black tracking-tight leading-tight">Colonia San Luis - Perla Verde</h2>
              <p className="text-[11px] text-emerald-300 italic font-medium">"La Perla Bonita de Antioquia"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Feedback Alert */}
          {activeMessage && (
            <div className="p-3.5 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-300 flex items-start gap-2.5 text-xs font-bold animate-in fade-in shadow-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{activeMessage}</span>
            </div>
          )}

          {/* Option 1: Android Guaranteed Direct Launcher */}
          <div className="bg-emerald-50/70 border-2 border-emerald-500 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span>Instalar en Android</span>
              </div>
              <span className="text-[10px] font-black bg-emerald-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                100% Efectivo
              </span>
            </div>
            <p className="text-xs text-emerald-800">
              Descarga directa del acceso rápido a tu pantalla de inicio. Funciona en cualquier celular sin dar ningún error.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleAndroid}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Lanzador Android</span>
              </button>
            </div>
          </div>

          {/* Option 2: Apple iOS (iPhone / iPad) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Apple className="w-5 h-5 text-slate-800" />
                <span>Instalar en Apple (iPhone / iPad)</span>
              </div>
              <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                iOS
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Descarga el perfil oficial de pantalla de inicio para dispositivos Apple.
            </p>
            <button
              onClick={handleApple}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Perfil Apple (iOS)</span>
            </button>
          </div>

          {/* Option 3: Computador / Mac / Windows */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Monitor className="w-5 h-5 text-slate-800" />
                <span>Instalar en Computador (Mac / Windows)</span>
              </div>
            </div>
            <button
              onClick={handleDesktop}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Acceso Directo de Escritorio</span>
            </button>
          </div>

          {/* Manual Chrome Android Guide toggle */}
          <div className="pt-1">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full text-left text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center justify-between py-1"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                ¿Cómo agregar desde el menú de Google Chrome?
              </span>
              <span>{showGuide ? '▲' : '▼'}</span>
            </button>
            {showGuide && (
              <div className="mt-2 p-3 bg-slate-100 rounded-xl text-[11px] text-slate-700 space-y-1.5 animate-in fade-in">
                <p><b>1.</b> Abre la app en Chrome tocando el botón de abajo.</p>
                <p><b>2.</b> Toca los <b>3 puntos (⋮)</b> de la esquina superior derecha.</p>
                <p><b>3.</b> Elige <b>"Agregar a la pantalla principal"</b>.</p>
              </div>
            )}
          </div>

          {/* Direct Link button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={handleCopy}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
              {copiedUrl ? '¡Enlace copiado!' : 'Copiar enlace directo de la App'}
            </button>
            <button
              onClick={onClose}
              className="font-bold text-slate-600 hover:text-slate-900"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
