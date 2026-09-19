import React, { useState } from 'react';
import { X, Cloud, Smartphone, ShieldCheck, Key } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  systemKey: string;
  onUpdateSystemKey: (newKey: string) => void;
}

export function UserSyncModal({ isOpen, onClose, systemKey, onUpdateSystemKey }: Props) {
  const [newKeyInput, setNewKeyInput] = useState(systemKey);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = newKeyInput.trim().toLowerCase();
    if (cleanKey) {
      onUpdateSystemKey(cleanKey);
      setSuccessMsg(`¡Conectado con éxito a "${cleanKey}"!`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    }
  };

  const handleUseDefaultKey = () => {
    setNewKeyInput('mi_sistema_solar');
    onUpdateSystemKey('mi_sistema_solar');
    setSuccessMsg('Conectado al sistema principal.');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1000);
  };

  const isCustomUser = systemKey !== 'mi_sistema_solar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div 
        id="modal-sync-user" 
        className="relative w-full max-w-md bg-[#121c13] rounded-2xl shadow-2xl border border-[#2b3e2d] p-6 text-[#ecf5ea]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#233525]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-lime-950/70 text-lime-400 border border-lime-800/60">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#f1f7ef]">
                Conexión & Cuenta
              </h2>
              <p className="text-xs text-[#8ca48a]">
                Sincronización en tiempo real con Firestore
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

        {/* Main Sync & Login section */}
        <div className="mt-5 space-y-4">
          <div className="p-4 rounded-xl bg-[#162317] border border-[#2d4430]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-semibold text-[#f1f7ef] text-sm">
                <Smartphone className="w-4 h-4 text-lime-400" />
                <span>Correo o Identificador</span>
              </div>
              {isCustomUser ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Conectado
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/80 font-medium">
                  Sistema base
                </span>
              )}
            </div>

            <p className="text-xs text-[#8ca48a] mb-3 leading-relaxed">
              Introduce tu correo electrónico (ej. <strong className="text-slate-200">ferjrm@hotmail.com</strong>) o tu código. Tus dispositivos que usen este identificador sincronizarán los datos automáticamente.
            </p>

            <form onSubmit={handleApplyKey} className="space-y-3">
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
                    placeholder="ej. ferjrm@hotmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#0e160f] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 font-mono text-white placeholder:text-neutral-600"
                    required
                  />
                </div>
                <button
                  id="btn-save-system-key"
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-slate-950 font-bold rounded-lg text-xs sm:text-sm transition-all shadow-md active:scale-95 whitespace-nowrap"
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
              <span>Cuenta activa: <strong className="text-lime-300 font-mono">{systemKey}</strong></span>
              {isCustomUser && (
                <button
                  type="button"
                  onClick={handleUseDefaultKey}
                  className="text-xs text-[#8ca48a] hover:text-white underline transition-colors"
                >
                  Volver a predeterminado
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-[#233525] flex justify-end">
          <button
            id="btn-close-sync-done"
            onClick={onClose}
            className="px-5 py-2 bg-[#1b2b1d] hover:bg-[#243b27] text-[#ecf5ea] font-semibold rounded-xl text-xs transition-colors border border-[#2d4430]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
