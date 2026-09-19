import React, { useState } from 'react';
import { X, Cloud, Smartphone, Copy, Check, ShieldCheck, RefreshCw, Key, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  systemKey: string;
  onUpdateSystemKey: (newKey: string) => void;
}

export function UserSyncModal({ isOpen, onClose, systemKey, onUpdateSystemKey }: Props) {
  const [copied, setCopied] = useState(false);
  const [newKeyInput, setNewKeyInput] = useState(systemKey);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate complete link with current path (supporting GitHub Pages /docs/ or root)
  const getShareableUrl = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?system=${encodeURIComponent(systemKey)}`;
  };

  const handleCopyLink = () => {
    const url = getShareableUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApplyKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = newKeyInput.trim().toLowerCase();
    if (cleanKey) {
      onUpdateSystemKey(cleanKey);
      setSuccessMsg(`¡Conectado con éxito a "${cleanKey}"!`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    }
  };

  const handleUseDefaultKey = () => {
    setNewKeyInput('mi_sistema_solar');
    onUpdateSystemKey('mi_sistema_solar');
    setSuccessMsg('Conectado al sistema principal.');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div 
        id="modal-sync-user" 
        className="relative w-full max-w-lg bg-[#121c13] rounded-2xl shadow-2xl border border-[#2b3e2d] p-6 max-h-[90vh] overflow-y-auto text-[#ecf5ea]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#233525]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-lime-950/70 text-lime-400 border border-lime-800/60">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#f1f7ef]">
                Sincronización Multidispositivo
              </h2>
              <p className="text-xs text-[#8ca48a]">
                Conexión en tiempo real con Firestore sin contraseñas ni bloqueos
              </p>
            </div>
          </div>
          <button
            id="btn-close-sync-modal"
            onClick={onClose}
            className="p-1.5 text-[#8ca48a] hover:text-[#f1f7ef] hover:bg-[#1a291b] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Main Sync Key / Email connection (like Inversion_app) */}
          <div className="p-4 rounded-xl bg-[#162317] border border-[#2d4430]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-semibold text-[#f1f7ef] text-sm">
                <Smartphone className="w-4 h-4 text-lime-400" />
                Tu Correo o Código de Instalación
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                Sincronización Activa
              </span>
            </div>

            <p className="text-xs text-[#8ca48a] mb-3 leading-relaxed">
              Introduce tu correo electrónico (ej. <strong className="text-slate-200">ferjrm@hotmail.com</strong>) o un identificador propio. Todos tus dispositivos que usen esta misma clave compartirán exactamente los mismos datos en tiempo real.
            </p>

            <form onSubmit={handleApplyKey} className="space-y-2.5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5c7a5a]">
                    <Key className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="input-system-key"
                    type="text"
                    value={newKeyInput}
                    onChange={(e) => setNewKeyInput(e.target.value)}
                    placeholder="Tu correo o código personal (ej. ferjrm@hotmail.com)"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#0e160f] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 font-mono text-white placeholder:text-neutral-600"
                    required
                  />
                </div>
                <button
                  id="btn-save-system-key"
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-slate-950 font-bold rounded-lg text-xs sm:text-sm transition-all shadow-md active:scale-95"
                >
                  Conectar
                </button>
              </div>

              {successMsg && (
                <div className="p-2.5 bg-emerald-950/70 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}
            </form>

            <div className="mt-4 pt-3 border-t border-[#233525] flex flex-wrap items-center justify-between gap-2 text-xs text-[#8ca48a]">
              <span>Sistema activo actualmente: <strong className="text-lime-400 font-mono">{systemKey}</strong></span>
              {systemKey !== 'mi_sistema_solar' && (
                <button
                  type="button"
                  onClick={handleUseDefaultKey}
                  className="text-xs text-[#8ca48a] hover:text-white underline"
                >
                  Volver al predeterminado
                </button>
              )}
            </div>
          </div>

          {/* Direct link sharing for mobile / other devices */}
          <div className="p-4 rounded-xl bg-[#162317] border border-[#2d4430]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-semibold text-[#f1f7ef] text-sm">
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                Enlace Directo para Abrir en tu Móvil o Tablet
              </div>
            </div>
            <p className="text-xs text-[#8ca48a] mb-3 leading-relaxed">
              Copia este enlace directo. Al abrirlo en el navegador de cualquier teléfono, tablet u ordenador, se abrirá ya conectado automáticamente a tu clave:
            </p>

            <div className="p-2.5 bg-[#0e160f] rounded-lg border border-[#2b3e2d] flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-lime-300 truncate max-w-[280px] sm:max-w-xs">
                {getShareableUrl()}
              </span>
              <button
                id="btn-copy-sync-link"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#203322] hover:bg-[#2b442e] text-lime-300 font-semibold rounded-md text-xs transition-colors flex-shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '¡Copiado!' : 'Copiar enlace'}
              </button>
            </div>
          </div>

          {/* Database information notice */}
          <div className="p-3.5 rounded-xl bg-lime-950/20 border border-lime-800/30 flex items-start gap-3 text-xs text-[#9eb69c]">
            <RefreshCw className="w-4 h-4 text-lime-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-lime-300">Sincronización en la Nube con Firestore:</strong> Al igual que en <span className="text-white font-medium">Inversion_app</span>, tus datos se guardan y leen directamente en tiempo real. No necesitas crear usuarios ni recordar contraseñas; basta con usar tu correo o código en cualquier dispositivo.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#233525] flex justify-end">
          <button
            id="btn-close-sync-done"
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
