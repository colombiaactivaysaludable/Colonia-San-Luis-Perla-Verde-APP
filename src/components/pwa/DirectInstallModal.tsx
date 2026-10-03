import React, { useState } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Smartphone, 
  Monitor, 
  Sparkles, 
  Apple, 
  Globe, 
  ShieldCheck, 
  WifiOff 
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface DirectInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectInstallModal: React.FC<DirectInstallModalProps> = ({ isOpen, onClose }) => {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isInIframe, 
    appUrl, 
    install, 
    openInStandaloneTab 
  } = usePWAInstall();

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        setInstallSuccess(false);
        onClose();
      }, 2500);
    }
  };

  const handleCopy = () => {
    const targetUrl = appUrl || window.location.href;
    navigator.clipboard.writeText(targetUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-2xl shadow-inner">
              🌲
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black tracking-tight">Colonia San Luis</h2>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500 text-white uppercase tracking-wider">
                  PWA Web
                </span>
              </div>
              <p className="text-[11px] text-emerald-300 italic font-medium">"La Perla Bonita de Antioquia"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {installSuccess ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xl font-bold shadow-md shadow-emerald-600/30">
                ✓
              </div>
              <h3 className="text-sm font-black text-emerald-950">¡Aplicación Web Instalada!</h3>
              <p className="text-xs text-emerald-700">
                Ya tienes Colonia San Luis en tu pantalla principal como una app nativa.
              </p>
            </div>
          ) : isInstalled ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-lg font-bold">
                ✓
              </div>
              <h3 className="text-xs font-bold text-emerald-950">App ya instalada</h3>
              <p className="text-[11px] text-emerald-700">
                Estás ejecutando la aplicación en modo autónomo (standalone).
              </p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-black text-slate-900">
                  Instala la App Web Progresiva (PWA)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Disfruta de la app directamente en tu teléfono o computador sin ocupar espacio de tienda y con soporte 100% offline.
                </p>
              </div>

              {/* Main Primary Action */}
              {isInstallable ? (
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar en este Navegador</span>
                </button>
              ) : isInIframe ? (
                <div className="space-y-2">
                  <button
                    onClick={openInStandaloneTab}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir en Pestaña Completa para Instalar</span>
                  </button>
                  <p className="text-[11px] text-slate-500 text-center">
                    Al abrir en pestaña completa, tu navegador (Chrome, Edge o Safari) te ofrecerá el botón directo de instalación en la barra de direcciones.
                  </p>
                </div>
              ) : null}

              {/* iOS Guide */}
              {isIOS && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Apple className="w-4 h-4 text-slate-900" />
                    <span>Instalación en iPhone / iPad (Safari):</span>
                  </div>
                  <ol className="text-xs text-slate-600 space-y-1.5 pl-4 list-decimal leading-relaxed">
                    <li>
                      Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) en la barra inferior de Safari.
                    </li>
                    <li>
                      Desliza hacia abajo y selecciona <strong>"Agregar al inicio"</strong>.
                    </li>
                    <li>
                      Toca <strong>"Agregar"</strong> en la esquina superior derecha. ¡Listo!
                    </li>
                  </ol>
                </div>
              )}

              {/* Desktop / Android Chrome Guide */}
              {!isIOS && !isInstallable && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>Instalación manual desde el navegador:</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc leading-relaxed">
                    <li>
                      <strong>Google Chrome / Edge (PC o Android):</strong> Toca el menú de tres puntos (⋮) y selecciona <strong>"Instalar aplicación"</strong> o el icono de instalación en la barra de URL.
                    </li>
                    <li>
                      <strong>Samsung Internet:</strong> Toca el menú (☰) y selecciona <strong>"Agregar página a" → "Pantalla de inicio"</strong>.
                    </li>
                  </ul>
                </div>
              )}

              {/* URL Sharing / Copying */}
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Enlace público de la aplicación:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={appUrl || (typeof window !== 'undefined' ? window.location.href : '')}
                    className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 truncate font-mono focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* PWA Features Highlights */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <WifiOff className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-700 block">Modo Offline</span>
              <span className="text-[9px] text-slate-400">Funciona sin internet</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-700 block">Datos Seguros</span>
              <span className="text-[9px] text-slate-400">Guardado local</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <Sparkles className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-700 block">Sin Tiendas</span>
              <span className="text-[9px] text-slate-400">Instalación 100% Web</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">PWA Manifest · Service Worker Activo</span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
