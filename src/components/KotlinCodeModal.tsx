import React, { useState } from 'react';
import { X, Copy, Check, Code2, Layers, Cpu, Smartphone } from 'lucide-react';
import { kotlinSourceCode } from '../data/kotlinCode';

interface KotlinCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KotlinCodeModal: React.FC<KotlinCodeModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'entities' | 'daos' | 'compose' | 'db'>('entities');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getCode = () => {
    switch (tab) {
      case 'entities':
        return kotlinSourceCode.roomEntities;
      case 'daos':
        return kotlinSourceCode.roomDaos;
      case 'compose':
        return kotlinSourceCode.composeUi;
      case 'db':
        return kotlinSourceCode.databaseRoom;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono font-bold">
              Kt
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Código Fuente Nativo Android (Kotlin + Room + Compose)
              </h2>
              <p className="text-xs text-slate-400">
                Arquitectura Android nativa con Material Design 3 y SQLite local
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <button
              onClick={() => setTab('entities')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                tab === 'entities'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              1. Room Entities (@Entity)
            </button>
            <button
              onClick={() => setTab('daos')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                tab === 'daos'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              2. Room DAOs (@Dao)
            </button>
            <button
              onClick={() => setTab('compose')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                tab === 'compose'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              3. Jetpack Compose UI
            </button>
            <button
              onClick={() => setTab('db')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                tab === 'db'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              4. AppDatabase.kt
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '¡Copiado!' : 'Copiar Código'}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed">
          <pre className="whitespace-pre overflow-x-auto selection:bg-emerald-800 selection:text-white">
            <code>{getCode()}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Compatible con Android Studio Ladybug / Koala / Hedgehog · Kotlin 2.0+</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
