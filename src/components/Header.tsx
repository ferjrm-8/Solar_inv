import { Sun, Cloud, RefreshCw, Trash2, Plus, Leaf } from 'lucide-react';
import { SyncStatus } from '../services/firebaseService';

interface Props {
  syncStatus: SyncStatus;
  systemKey: string;
  onOpenSyncModal: () => void;
  onOpenSafeDelete: () => void;
  onOpenAddMonth: () => void;
}

export function Header({
  syncStatus,
  systemKey,
  onOpenSyncModal,
  onOpenSafeDelete,
  onOpenAddMonth,
}: Props) {
  const getStatusBadge = () => {
    switch (syncStatus) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Nube en vivo
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/60">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            Sincronizando...
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-800/60">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Modo local
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-700">
            <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
            Conectando...
          </span>
        );
    }
  };

  return (
    <header className="bg-[#111912]/90 backdrop-blur-md border-b border-[#253627] sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & System */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-600 via-emerald-600 to-amber-500 flex items-center justify-center text-white shadow-sm ring-1 ring-lime-400/30">
              <Sun className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-[#f2f7ef] tracking-tight flex items-center gap-1.5">
                  <span>Seguimiento Solar & Rentabilidad</span>
                  <Leaf className="w-3.5 h-3.5 text-lime-400" />
                </h1>
              </div>
              <p className="text-xs text-[#9bb19a] font-medium flex items-center gap-1.5">
                <span>Instalación 5,34 kWp (+100° / -80°)</span>
                <span className="text-[#3d543f]">•</span>
                <span className="text-lime-300 font-semibold">Inversión 7.526 €</span>
              </p>
            </div>
          </div>

          <div className="md:hidden">
            {getStatusBadge()}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="hidden md:block">
            {getStatusBadge()}
          </div>

          {/* Sync & Multi-device */}
          <button
            id="btn-open-sync"
            onClick={onOpenSyncModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#d4e4cf] bg-[#1a261c] hover:bg-[#243527] border border-[#2e4230] transition-colors shadow-2xs"
            title="Sincronización en la nube multidispositivo"
          >
            <Cloud className="w-3.5 h-3.5 text-lime-400" />
            <span className="hidden sm:inline">Multidispositivo:</span>
            <span className="font-mono text-lime-300 max-w-[90px] truncate">{systemKey}</span>
          </button>

          {/* Safe Delete button */}
          <button
            id="btn-open-safe-delete"
            onClick={onOpenSafeDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/40 transition-colors"
            title="Borrar todo con seguridad o restaurar datos iniciales"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden lg:inline">Borrar todo</span>
          </button>

          {/* Add month button */}
          <button
            id="btn-open-add-month"
            onClick={onOpenAddMonth}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-slate-950 shadow-md transition-all font-semibold"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span className="font-extrabold text-slate-950">Añadir Mes</span>
          </button>
        </div>
      </div>
    </header>
  );
}
