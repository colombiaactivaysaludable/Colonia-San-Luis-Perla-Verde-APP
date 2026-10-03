import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Database, 
  ShieldCheck, 
  Cloud, 
  RefreshCw, 
  Copy, 
  ClipboardCheck, 
  FileText 
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { cloudSync } from '../services/cloudSync';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { storage } = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncState, setSyncState] = useState(cloudSync.getState());
  const [copiedJson, setCopiedJson] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedJsonText, setPastedJsonText] = useState('');

  useEffect(() => {
    return cloudSync.subscribe((state) => {
      setSyncState(state);
    });
  }, []);

  if (!isOpen) return null;

  const handleCloudUpload = async () => {
    try {
      setIsSyncingCloud(true);
      await cloudSync.uploadAllLocalDataToCloud();
      setFeedback({
        type: 'success',
        message: '¡Todos los datos han sido guardados y sincronizados en Google Cloud Firestore con éxito!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al guardar los datos en la nube.',
      });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleExport = () => {
    try {
      const backupData = storage.exportBackup();
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `ColoniaSanLuis_Respaldo_${dateStr}.json`;

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = filename;
      downloadAnchor.target = '_blank';
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();

      setTimeout(() => {
        if (downloadAnchor.parentNode) {
          downloadAnchor.parentNode.removeChild(downloadAnchor);
        }
        URL.revokeObjectURL(url);
      }, 500);

      setFeedback({
        type: 'success',
        message: '¡Archivo JSON generado y descargado correctamente! Contiene todos los equipos, jugadores, partidos y finanzas.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al exportar los datos.',
      });
    }
  };

  const handleCopyJson = async () => {
    try {
      const backupData = storage.exportBackup();
      const jsonStr = JSON.stringify(backupData, null, 2);
      await navigator.clipboard.writeText(jsonStr);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2500);
      setFeedback({
        type: 'success',
        message: '¡Texto JSON copiado al portapapeles! Puedes guardarlo en tus notas o enviarlo por WhatsApp.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'No se pudo copiar automáticamente. Puedes usar el botón de descarga de archivo.',
      });
    }
  };

  const handleApplyImport = async (jsonString: string) => {
    try {
      const sanitized = jsonString.replace(/^\uFEFF/, '').trim();
      if (!sanitized) {
        throw new Error('El archivo o texto seleccionado está completamente vacío.');
      }

      let parsed: any;
      try {
        parsed = JSON.parse(sanitized);
      } catch (parseErr: any) {
        throw new Error(`El archivo no tiene formato JSON válido: ${parseErr.message}`);
      }

      const result = storage.importBackup(parsed);

      // Immediately synchronize newly imported data to Google Cloud Firestore
      setIsSyncingCloud(true);
      try {
        await cloudSync.uploadAllLocalDataToCloud();
      } catch (cloudErr) {
        console.warn('Could not auto-sync newly imported data to cloud:', cloudErr);
      }

      setFeedback({
        type: 'success',
        message: `¡Copia restaurada y sincronizada en la nube con éxito! Se cargaron ${result.teamsCount} equipo(s), ${result.playersCount} jugadores y ${result.matchesCount} partidos.`,
      });
      setShowPasteModal(false);
      setPastedJsonText('');
    } catch (err: any) {
      console.error('Error importing backup:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Error al procesar el archivo de respaldo.',
      });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = (event.target?.result as string) || '';
      await handleApplyImport(content);
    };
    reader.onerror = () => {
      setFeedback({
        type: 'error',
        message: 'No se pudo leer el archivo desde el almacenamiento del dispositivo.',
      });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    storage.resetToDefault();
    setShowConfirmReset(false);
    setFeedback({
      type: 'success',
      message: 'Base de datos restablecida a los valores iniciales.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">Copia de Seguridad & Nube</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex items-center gap-2.5 p-3 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>Respaldo Nube & Local:</strong> Los datos se guardan tanto en Google Cloud Firestore como en tu dispositivo para que funcione sin conexión.
            </span>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${
                feedback.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="space-y-3 pt-1">
            {/* Cloud Sync to Google Firestore */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-2xl border border-emerald-600/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Nube Google Cloud Firestore</h3>
                    <p className="text-[11px] text-emerald-300">
                      {syncState.status === 'synced'
                        ? `Sincronizado · ${syncState.lastSyncedAt || 'Ahora'}`
                        : syncState.status === 'saving'
                        ? 'Guardando en la nube...'
                        : 'Conectado a Firestore'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCloudUpload}
                disabled={isSyncingCloud}
                className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span>{isSyncingCloud ? 'Guardando en la nube...' : 'Sincronizar Todo a la Nube'}</span>
              </button>
            </div>

            {/* Export Section */}
            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex items-center gap-3 transition-colors group"
              >
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Download className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">Descargar Archivo JSON</h3>
                  <p className="text-xs text-slate-500">Descarga el archivo completo a tu teléfono o computadora.</p>
                </div>
              </button>

              <button
                onClick={handleCopyJson}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center justify-center gap-1.5 border border-dashed border-slate-300 transition-colors"
              >
                {copiedJson ? <ClipboardCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedJson ? '¡JSON Copiado!' : 'Copiar texto JSON al portapapeles'}</span>
              </button>
            </div>

            {/* Import Section */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json,text/plain,*/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex items-center gap-3 transition-colors group"
              >
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">Seleccionar Archivo de Respaldo</h3>
                  <p className="text-xs text-slate-500">Carga un archivo .json guardado previamente.</p>
                </div>
              </button>

              <button
                onClick={() => setShowPasteModal(!showPasteModal)}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl flex items-center justify-center gap-1.5 border border-dashed border-slate-300 transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>{showPasteModal ? 'Ocultar caja de texto' : 'Pegar texto JSON directamente'}</span>
              </button>

              {showPasteModal && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in">
                  <p className="text-xs text-slate-600 font-medium">
                    Pega aquí el contenido JSON copiado desde otro dispositivo:
                  </p>
                  <textarea
                    value={pastedJsonText}
                    onChange={(e) => setPastedJsonText(e.target.value)}
                    placeholder='{"version": "1.0.0", "teams": [...], ...}'
                    rows={4}
                    className="w-full p-2.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                  <button
                    onClick={() => handleApplyImport(pastedJsonText)}
                    disabled={!pastedJsonText.trim()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Restaurar desde texto pegado
                  </button>
                </div>
              )}
            </div>

            {/* Reset */}
            {showConfirmReset ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs text-red-800">
                <p className="font-bold">¿Deseas restaurar los datos iniciales de prueba?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="flex-1 py-1.5 px-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    Sí, Restablecer
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="w-full p-3 text-left flex items-center gap-2.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-2"
              >
                <RotateCcw className="w-4 h-4" /> Restablecer datos de prueba iniciales
              </button>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
