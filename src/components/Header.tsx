import { Sun, Cloud, RefreshCw, Trash2, Plus, Leaf, Settings, UserCheck, User } from 'lucide-react';
import { SyncStatus } from '../services/firebaseService';

interface Props {
  syncStatus: SyncStatus;
  systemKey: string;
  onOpenSyncModal: () => void;
  onOpenSafeDelete: () => void;
  onOpenAddMonth: () => void;
  onOpenSettings: () => void;
}

export function Header({
  syncStatus,
  systemKey,
  onOpenSyncModal,
  onOpenSafeDelete,
  onOpenAddMonth,
  onOpenSettings,
}: Props) {
  const isCustomUser = systemKey !== 'mi_sistema_solar';

  // Smart login and cloud status button
  const renderSmartAuthButton = (isMobileTop: boolean = false) => {
    if (syncStatus === 'syncing') {
      return (
        <button
          id={isMobileTop ? 'btn-open-sync-mobile' : 'btn-open-sync'}
          onClick={onOpenSyncModal}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold bg-amber-950/50 hover:bg-amber-900/60 border border-amber-700/60 text-amber-200 transition-colors shadow-2xs"
          title="Sincronizando cambios con Firestore en tiempo real..."
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin flex-shrink-0" />
          <span className="font-mono text-amber-300 max-w-[100px] sm:max-w-[140px] truncate">
            {isCustomUser ? systemKey : 'Sincronizando'}
          </span>
        </button>
      );
    }

    if (syncStatus === 'error') {
      return (
        <button
          id={isMobileTop ? 'btn-open-sync-mobile' : 'btn-open-sync'}
          onClick={onOpenSyncModal}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 text-rose-200 transition-colors shadow-2xs"
          title="Modo local (sin conexión activa). Haz clic para revisar tu cuenta o reconectar"
        >
          <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
          <User className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
          <span className="font-mono text-rose-300 max-w-[100px] sm:max-w-[140px] truncate">
            {isCustomUser ? systemKey : 'Modo local'}
          </span>
        </button>
      );
    }

    // Connected with custom user
    if (isCustomUser) {
      return (
        <button
          id={isMobileTop ? 'btn-open-sync-mobile' : 'btn-open-sync'}
          onClick={onOpenSyncModal}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-600/70 text-emerald-200 transition-all shadow-2xs group"
          title={`Conectado como: ${systemKey} (Sincronización activa con Firestore)`}
        >
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <UserCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0" />
          <span className="font-mono text-emerald-300 max-w-[95px] xs:max-w-[130px] sm:max-w-[160px] truncate">
            {systemKey}
          </span>
        </button>
      );
    }

    // Default system (not yet linked)
    return (
      <button
        id={isMobileTop ? 'btn-open-sync-mobile' : 'btn-open-sync'}
        onClick={onOpenSyncModal}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold bg-[#1a261c] hover:bg-[#243527] border border-[#2e4230] hover:border-lime-600/50 text-[#d4e4cf] transition-colors shadow-2xs"
        title="Haz clic para iniciar sesión o sincronizar con tu correo"
      >
        <span className="w-2 h-2 rounded-full bg-lime-400 flex-shrink-0" />
        <Cloud className="w-3.5 h-3.5 text-lime-400 flex-shrink-0" />
        <span className="text-[#c6dbc3]">Conectar cuenta</span>
      </button>
    );
  };

  return (
    <header className="bg-[#111912]/90 backdrop-blur-md border-b border-[#253627] sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* ROW 1: Brand & User Identity */}
        <div className="flex items-center justify-between gap-3">
          {/* Brand Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-lime-600 via-emerald-600 to-amber-500 flex items-center justify-center text-white shadow-sm ring-1 ring-lime-400/30 flex-shrink-0">
              <Sun className="w-5 h-5 text-amber-100" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-extrabold text-[#f2f7ef] tracking-tight truncate flex items-center gap-1.5">
                  <span>Seguimiento Solar</span>
                  <span className="hidden sm:inline">& Rentabilidad</span>
                  <Leaf className="w-3.5 h-3.5 text-lime-400 flex-shrink-0" />
                </h1>
              </div>
              <p className="text-[11px] sm:text-xs text-[#9bb19a] font-medium flex items-center gap-1.5 truncate">
                <span>5,34 kWp</span>
                <span className="text-[#3d543f]">•</span>
                <span className="text-lime-300 font-semibold">Inversión 7.526 €</span>
              </p>
            </div>
          </div>

          {/* Desktop Toolbar (md:flex) */}
          <div className="hidden md:flex items-center gap-2">
            {/* Settings & Annual Cycle */}
            <button
              id="btn-open-settings"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-[#d4e4cf] bg-[#1a261c] hover:bg-[#243527] border border-[#2e4230] transition-colors shadow-2xs"
              title="Configuración de ciclo anual y parámetros del sistema"
            >
              <Settings className="w-3.5 h-3.5 text-lime-400" />
              <span>Ciclo & Ajustes</span>
            </button>

            {/* Smart Account / Status Button */}
            {renderSmartAuthButton(false)}

            {/* Safe Delete button */}
            <button
              id="btn-open-safe-delete"
              onClick={onOpenSafeDelete}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/40 transition-colors"
              title="Borrar todo con seguridad o restaurar datos iniciales"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden lg:inline">Borrar</span>
            </button>

            {/* Add month button */}
            <button
              id="btn-open-add-month"
              onClick={onOpenAddMonth}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-bold bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-slate-950 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Añadir Mes</span>
            </button>
          </div>

          {/* Mobile Right: Account / Login pill */}
          <div className="md:hidden flex-shrink-0">
            {renderSmartAuthButton(true)}
          </div>
        </div>

        {/* ROW 2: Mobile Action Toolbar (md:hidden) */}
        <div className="md:hidden mt-2.5 pt-2 border-t border-[#1d2b1f] flex items-center justify-between gap-2">
          {/* Secondary Utilities: Settings & Delete */}
          <div className="flex items-center gap-2">
            <button
              id="btn-open-settings-mobile"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold text-[#d4e4cf] bg-[#1a261c] hover:bg-[#243527] border border-[#2e4230] transition-colors"
              title="Configuración de ciclo anual y parámetros del sistema"
            >
              <Settings className="w-3.5 h-3.5 text-lime-400" />
              <span>Ajustes</span>
            </button>

            <button
              id="btn-open-safe-delete-mobile"
              onClick={onOpenSafeDelete}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/40 transition-colors"
              title="Borrar todo con seguridad o restaurar datos iniciales"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            </button>
          </div>

          {/* Primary Action: Add Month */}
          <button
            id="btn-open-add-month-mobile"
            onClick={onOpenAddMonth}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-bold bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-slate-950 shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
            <span>Añadir Mes</span>
          </button>
        </div>
      </div>
    </header>
  );
}
