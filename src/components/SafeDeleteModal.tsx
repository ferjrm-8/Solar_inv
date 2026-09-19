import React, { useState } from 'react';
import { AlertTriangle, Trash2, RotateCcw, X, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClearAll: () => Promise<void>;
  onRestoreDefaults: () => Promise<void>;
}

export function SafeDeleteModal({ isOpen, onClose, onConfirmClearAll, onRestoreDefaults }: Props) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [activeAction, setActiveAction] = useState<'options' | 'wipe'>('options');

  if (!isOpen) return null;

  const handleWipe = async () => {
    if (confirmationText.trim().toUpperCase() !== 'BORRAR') return;
    try {
      setIsDeleting(true);
      await onConfirmClearAll();
      setConfirmationText('');
      setActiveAction('options');
      onClose();
    } catch (err) {
      console.error('Error clearing records:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      await onRestoreDefaults();
      onClose();
    } catch (err) {
      console.error('Error restoring defaults:', err);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div 
        id="modal-safe-delete" 
        className="relative w-full max-w-md bg-[#121c13] rounded-2xl shadow-2xl border border-[#2b3e2d] p-6 text-[#ecf5ea]"
      >
        <div className="flex items-start justify-between pb-3 border-b border-[#233525]">
          <div className="flex items-center gap-2.5 text-rose-400">
            <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-900/60">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f1f7ef]">
                Gestión y Borrado Seguro
              </h3>
              <p className="text-xs text-[#8ca48a]">
                Opciones para reiniciar o vaciar los datos
              </p>
            </div>
          </div>
          <button
            id="btn-close-delete-modal"
            onClick={onClose}
            className="p-1.5 text-[#8ca48a] hover:text-[#f1f7ef] hover:bg-[#1a291b] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeAction === 'options' ? (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-[#8ca48a] leading-relaxed">
              Puedes restablecer los datos al estado original de tu hoja de cálculo o eliminar por completo todos los registros.
            </p>

            {/* Option 1: Restore default sheet data */}
            <div className="p-3.5 rounded-xl border border-lime-900/50 bg-lime-950/20 hover:bg-lime-950/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-lime-300 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-lime-400" />
                    Restaurar datos de la hoja original
                  </h4>
                  <p className="text-[11px] text-[#8ca48a] mt-1">
                    Vuelve a cargar los 51 meses históricos reales (2022-2026) con todos sus cálculos de generación, autoconsumo y rentabilidad.
                  </p>
                </div>
                <button
                  id="btn-restore-sheet-data"
                  onClick={handleRestore}
                  disabled={isRestoring}
                  className="px-3 py-1.5 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold whitespace-nowrap transition-colors"
                >
                  {isRestoring ? 'Restaurando...' : 'Restaurar'}
                </button>
              </div>
            </div>

            {/* Option 2: Wipe all completely */}
            <div className="p-3.5 rounded-xl border border-rose-900/50 bg-rose-950/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    Borrar todos los registros
                  </h4>
                  <p className="text-[11px] text-[#8ca48a] mt-1">
                    Elimina permanentemente todos los meses de la base de datos en la nube. Requiere confirmación escrita de seguridad.
                  </p>
                </div>
                <button
                  id="btn-proceed-wipe"
                  onClick={() => setActiveAction('wipe')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold whitespace-nowrap transition-colors"
                >
                  Borrar Todo
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-900/60 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Advertencia estricta:</strong> Esta acción no se puede deshacer. Se borrarán todos los registros mensuales sincronizados en la nube.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8ca48a]">
                Escribe <span className="text-rose-400 font-mono font-bold">BORRAR</span> para confirmar:
              </label>
              <input
                id="input-confirm-wipe"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Escribe BORRAR"
                className="w-full px-3 py-2 text-sm bg-[#111a12] border border-rose-800/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-white"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveAction('options');
                  setConfirmationText('');
                }}
                className="px-3 py-2 text-xs text-[#8ca48a] hover:text-white font-medium"
              >
                Volver
              </button>
              <button
                id="btn-execute-wipe"
                type="button"
                disabled={confirmationText.trim().toUpperCase() !== 'BORRAR' || isDeleting}
                onClick={handleWipe}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-[#253326] disabled:text-[#6e856c] disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-colors"
              >
                {isDeleting ? 'Borrando...' : 'Confirmar borrado total'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-[#233525] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#8ca48a] hover:text-white font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
