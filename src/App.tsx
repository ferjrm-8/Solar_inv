import { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { DataTable } from './components/DataTable';
import { EcoBackground } from './components/EcoBackground';
import { UserSyncModal } from './components/UserSyncModal';
import { SafeDeleteModal } from './components/SafeDeleteModal';
import { AddMonthModal } from './components/AddMonthModal';
import { EditRecordModal } from './components/EditRecordModal';
import { SettingsModal } from './components/SettingsModal';
import { 
  ensureAuth, 
  subscribeToSolarRecords, 
  subscribeToSettings, 
  saveRecord, 
  deleteRecord, 
  saveSettings,
  batchSaveRecords,
  clearAllRecords, 
  restoreInitialRecords,
  getSystemId,
  setSystemId,
  getLocalRecords,
  getLocalSettings,
  SyncStatus
} from './services/firebaseService';
import { SolarRecord, SolarSettings } from './types/solar';
import { DEFAULT_SOLAR_SETTINGS, INITIAL_SOLAR_RECORDS } from './data/initialData';
import { Leaf, ShieldCheck, Sun, BarChart3 } from 'lucide-react';

// Lazy load heavy chart modules (recharts) so the core app loads instantly on mobile roaming
const SolarCharts = lazy(() =>
  import('./components/SolarCharts').then((module) => ({ default: module.SolarCharts }))
);

export default function App() {
  // Check URL params for system code (e.g. ?system=...)
  const urlParams = new URLSearchParams(window.location.search);
  const initialSystem = urlParams.get('system') || getSystemId();

  const [systemKey, setSystemState] = useState<string>(initialSystem);
  const [records, setRecords] = useState<SolarRecord[]>(INITIAL_SOLAR_RECORDS);
  const [settings, setSettings] = useState<SolarSettings>(DEFAULT_SOLAR_SETTINGS);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Modals state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSafeDeleteModalOpen, setIsSafeDeleteModalOpen] = useState(false);
  const [isAddMonthModalOpen, setIsAddMonthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SolarRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Initialize Auth and Real-time listener immediately
  useEffect(() => {
    let unsubscribeRecords: (() => void) | null = null;
    let unsubscribeSettings: (() => void) | null = null;

    // Load local cached records & settings for this key immediately
    const localRecords = getLocalRecords(systemKey);
    if (localRecords.length > 0) {
      setRecords(localRecords);
    }
    const localSettings = getLocalSettings(systemKey);
    setSettings(localSettings);

    // Connect immediately with real-time sync from Firestore
    unsubscribeRecords = subscribeToSolarRecords(
      systemKey,
      (newRecords) => {
        setRecords(newRecords);
      },
      (status) => {
        setSyncStatus(status);
      }
    );

    unsubscribeSettings = subscribeToSettings(systemKey, (newSettings) => {
      setSettings(newSettings);
    });

    // Ensure auth in background
    ensureAuth().catch((err) => {
      console.warn('Background auth notice:', err);
    });

    return () => {
      if (unsubscribeRecords) unsubscribeRecords();
      if (unsubscribeSettings) unsubscribeSettings();
    };
  }, [systemKey]);

  // Handler: Change active system
  const handleUpdateSystemKey = (newKey: string) => {
    setSystemId(newKey);
    setSystemState(newKey);
  };

  // Handler: Save / Edit record (Optimistic UI: Updates screen and local cache immediately)
  const handleSaveRecord = async (updated: SolarRecord) => {
    // 1. Immediately update React state so the UI reflects the new month instantly
    setRecords((prev) => {
      const exists = prev.some((r) => r.id === updated.id);
      const nextList = exists
        ? prev.map((r) => (r.id === updated.id ? updated : r))
        : [...prev, updated];
      return nextList.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
    });

    // 2. Show brief confirmation
    showToast(`Mes ${updated.periodLabel} guardado correctamente`);

    // 3. Persist locally and sync with Firestore in background
    try {
      setSyncStatus('syncing');
      await saveRecord(systemKey, updated);
      setSyncStatus('connected');
    } catch (err) {
      console.warn('Sync notice: Record saved in local storage, cloud pending:', err);
      // Keep connected status since data is preserved in local storage
      setSyncStatus('connected');
    }
  };

  // Handler: Save Settings
  const handleSaveSettings = async (newSettings: SolarSettings) => {
    setSettings(newSettings);
    showToast('Ajustes guardados');
    try {
      setSyncStatus('syncing');
      await saveSettings(systemKey, newSettings);
      setSyncStatus('connected');
    } catch (err) {
      console.warn('Error saving settings to cloud (saved locally):', err);
      setSyncStatus('connected');
    }
  };

  // Handler: Batch update records (e.g. recalculating cycle labels)
  const handleBatchUpdateRecords = async (updatedRecords: SolarRecord[]) => {
    setRecords(updatedRecords);
    showToast('Ciclos actualizados');
    try {
      setSyncStatus('syncing');
      await batchSaveRecords(systemKey, updatedRecords);
      setSyncStatus('connected');
    } catch (err) {
      console.warn('Error in batch update to cloud (saved locally):', err);
      setSyncStatus('connected');
    }
  };

  // Handler: Quick update single field directly from table
  const handleQuickUpdateField = async (recordId: string, field: keyof SolarRecord, value: number) => {
    const target = records.find((r) => r.id === recordId);
    if (!target) return;

    const updated: SolarRecord = { ...target, [field]: value };

    const pCompra = field === 'precioKwhComprado' 
      ? value 
      : (updated.precioKwhComprado ?? (target.autoconsumo > 0 ? target.valorAutoconsumo / target.autoconsumo : settings.precioKwhRedMedio));
    const pVenta = field === 'precioKwhVendido' 
      ? value 
      : (updated.precioKwhVendido ?? (target.excedentes > 0 ? target.valorExcedentes / target.excedentes : settings.precioKwhExcedenteMedio));

    if (
      field === 'consumoTotalReal' || 
      field === 'autoconsumo' || 
      field === 'produccionReal' ||
      field === 'precioKwhComprado' ||
      field === 'precioKwhVendido'
    ) {
      updated.consumoRed = Number(Math.max(0, updated.consumoTotalReal - updated.autoconsumo).toFixed(2));
      updated.excedentes = Number(Math.max(0, updated.produccionReal - updated.autoconsumo).toFixed(2));
      updated.diferenciaKwh = Number((updated.produccionReal - updated.consumoTotalReal).toFixed(2));

      // Recalculate economics
      updated.precioKwhComprado = Number(pCompra.toFixed(4));
      updated.precioKwhVendido = Number(pVenta.toFixed(4));
      updated.valorAutoconsumo = Number((updated.autoconsumo * pCompra).toFixed(2));
      updated.valorConsumoRed = Number((updated.consumoRed * pCompra).toFixed(2));
      updated.valorExcedentes = Number((updated.excedentes * pVenta).toFixed(2));
      updated.diferenciaEuros = Number((updated.valorExcedentes - updated.valorConsumoRed).toFixed(2));
      updated.ahorroDirecto = Number((updated.valorAutoconsumo + updated.valorExcedentes).toFixed(2));
    }

    await handleSaveRecord(updated);
  };

  // Handler: Delete single record
  const handleDeleteRecord = async (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    showToast('Mes eliminado');
    try {
      setSyncStatus('syncing');
      await deleteRecord(systemKey, recordId);
      setSyncStatus('connected');
    } catch (err) {
      console.warn('Error deleting record from cloud (deleted locally):', err);
      setSyncStatus('connected');
    }
  };

  // Handler: Safe clear all records
  const handleConfirmClearAll = async () => {
    setRecords([]);
    showToast('Registros vaciados');
    try {
      setSyncStatus('syncing');
      await clearAllRecords(systemKey);
      setSyncStatus('connected');
    } catch (err) {
      console.warn('Error clearing all records from cloud (cleared locally):', err);
      setSyncStatus('connected');
    }
  };

  // Handler: Restore default records
  const handleRestoreDefaults = async () => {
    setRecords(INITIAL_SOLAR_RECORDS);
    showToast('Datos originales restaurados');
    try {
      setSyncStatus('syncing');
      await restoreInitialRecords(systemKey);
      setSyncStatus('connected');
    } catch (err) {
      console.warn('Error restoring default records in cloud (restored locally):', err);
      setSyncStatus('connected');
    }
  };

  return (
    <div className="min-h-screen relative text-[#ecf5ea] flex flex-col font-sans selection:bg-lime-900 selection:text-lime-200">
      {/* Monochromatic background with solar and ecological symbols */}
      <EcoBackground />

      {/* Floating toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#172519] border border-lime-500/70 text-[#ecf5ea] px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Foreground application content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <Header
          syncStatus={syncStatus}
          systemKey={systemKey}
          settings={settings}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          onOpenSafeDelete={() => setIsSafeDeleteModalOpen(true)}
          onOpenAddMonth={() => setIsAddMonthModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* 1. KPIs & Key Metrics Overview */}
          <section aria-label="Métricas Principales de Sostenibilidad">
            <MetricsOverview records={records} settings={settings} />
          </section>

          {/* 2. Interactive Solar Charts */}
          <section aria-label="Gráficas Interactivas">
            <Suspense
              fallback={
                <div className="bg-[#142015] border border-[#233525] rounded-xl p-6 flex flex-col items-center justify-center min-h-[320px] text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#1b2b1d] border border-[#2e4331] flex items-center justify-center mb-3 animate-pulse">
                    <BarChart3 className="w-5 h-5 text-lime-400" />
                  </div>
                  <p className="text-sm font-semibold text-[#f1f7ef]">Cargando visualización gráfica...</p>
                  <p className="text-xs text-[#8ca48a] mt-1">Sincronizando curvas de producción y ahorro</p>
                </div>
              }
            >
              <SolarCharts
                records={records}
                selectedYear={selectedPeriod}
                onSelectYear={setSelectedPeriod}
              />
            </Suspense>
          </section>

          {/* 3. Interactive & Editable Data Table */}
          <section aria-label="Tabla de Seguimiento Mensual">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-base font-bold text-[#f1f7ef] flex items-center gap-2">
                  <span>Histórico y Seguimiento Mensual</span>
                  <Leaf className="w-4 h-4 text-lime-400" />
                </h2>
                <p className="text-xs text-[#8ca48a]">
                  Haz clic sobre cualquier celda numérica (producción, consumo, autoconsumo o precios €/kWh) para editar directamente
                </p>
              </div>
            </div>
            <DataTable
              records={records}
              selectedPeriod={selectedPeriod}
              onEditRecord={(record) => setEditingRecord(record)}
              onQuickUpdateField={handleQuickUpdateField}
              onDeleteRecord={handleDeleteRecord}
              settings={settings}
            />
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#233525] bg-[#0c140d]/90 backdrop-blur-sm py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8ca48a]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#f1f7ef]">Seguimiento Solar & Rentabilidad</span>
              <span>•</span>
              <span className="text-[#a1ba9f]">Instalación {settings.potenciaPicoKw} kWp</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-lime-400 font-medium">
                <ShieldCheck className="w-4 h-4 text-lime-400" />
                Sincronización en tiempo real multidispositivo activa
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <UserSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        systemKey={systemKey}
        onUpdateSystemKey={handleUpdateSystemKey}
      />

      <SafeDeleteModal
        isOpen={isSafeDeleteModalOpen}
        onClose={() => setIsSafeDeleteModalOpen(false)}
        onConfirmClearAll={handleConfirmClearAll}
        onRestoreDefaults={handleRestoreDefaults}
      />

      <AddMonthModal
        isOpen={isAddMonthModalOpen}
        onClose={() => setIsAddMonthModalOpen(false)}
        onSave={handleSaveRecord}
        existingRecords={records}
        settings={settings}
      />

      <EditRecordModal
        isOpen={Boolean(editingRecord)}
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleSaveRecord}
        onDeleteRecord={handleDeleteRecord}
        settings={settings}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        records={records}
        onBatchUpdateRecords={handleBatchUpdateRecords}
      />
    </div>
  );
}

