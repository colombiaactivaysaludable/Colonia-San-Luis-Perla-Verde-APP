import React, { useState, useRef } from 'react';
import { X, Download, Upload, RotateCcw, Check, AlertCircle, Database, ShieldCheck } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { AppDataBackup } from '../types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { storage } = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const backupData = storage.exportBackup();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `TeamMaster_Backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setFeedback({
        type: 'success',
        message: '¡Copia de seguridad JSON descargada exitosamente! Puedes guardarla o transferirla a otro celular.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al exportar los datos.',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as AppDataBackup;
        storage.importBackup(parsed);
        setFeedback({
          type: 'success',
          message: '¡Datos restaurados con éxito! Todos los equipos, partidos y jugadores han sido importados.',
        });
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: 'El archivo seleccionado no es un respaldo válido de TeamMaster.',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    storage.resetToDefault();
    setShowConfirmReset(false);
    setFeedback({
      type: 'success',
      message: 'Base de datos restablecida a los valores de demostración iniciales.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">Copia de Seguridad & Offline</h2>
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
          <div className="flex items-center gap-2.5 p-3 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>100% Funcional Sin Conexión:</strong> Todos los datos se guardan en el almacenamiento local seguro de tu dispositivo. No necesitas datos en la cancha.
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
            {/* Export */}
            <button
              onClick={handleExport}
              className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex items-center gap-3 transition-colors group"
            >
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Download className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">Exportar Copia de Seguridad JSON</h3>
                <p className="text-xs text-slate-500">Descarga un archivo con todos los equipos, partidos y pagos.</p>
              </div>
            </button>

            {/* Import */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
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
                  <h3 className="text-sm font-bold text-slate-900">Importar / Restaurar Respaldo JSON</h3>
                  <p className="text-xs text-slate-500">Carga un archivo de respaldo desde otro teléfono o PC.</p>
                </div>
              </button>
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
