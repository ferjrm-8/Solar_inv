import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { SolarCharts } from './components/SolarCharts';
import { DataTable } from './components/DataTable';
import { EcoBackground } from './components/EcoBackground';
import { UserSyncModal } from './components/UserSyncModal';
import { SafeDeleteModal } from './components/SafeDeleteModal';
import { AddMonthModal } from './components/AddMonthModal';
import { EditRecordModal } from './components/EditRecordModal';
import { 
  ensureAuth, 
  subscribeToSolarRecords, 
  subscribeToSettings, 
  saveRecord, 
  deleteRecord, 
  clearAllRecords, 
  restoreInitialRecords,
  getSystemId,
  setSystemId,
  SyncStatus
} from './services/firebaseService';
import { SolarRecord, SolarSettings } from './types/solar';
import { DEFAULT_SOLAR_SETTINGS, INITIAL_SOLAR_RECORDS } from './data/initialData';
import { Leaf, ShieldCheck, Sun } from 'lucide-react';

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
  const [editingRecord, setEditingRecord] = useState<SolarRecord | null>(null);

  // Initialize Auth and Real-time listener
  useEffect(() => {
    let unsubscribeRecords: (() => void) | null = null;
    let unsubscribeSettings: (() => void) | null = null;

    const connectListeners = () => {
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
    };

    ensureAuth()
      .then(() => {
        connectListeners();
      })
      .catch((err) => {
        console.warn('Auth init notice:', err);
        connectListeners();
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

  // Handler: Save / Edit record
  const handleSaveRecord = async (updated: SolarRecord) => {
    try {
      setSyncStatus('syncing');
      await saveRecord(systemKey, updated);
      setRecords((prev) => {
        const exists = prev.some((r) => r.id === updated.id);
        if (exists) {
          return prev.map((r) => (r.id === updated.id ? updated : r));
        }
        return [...prev, updated].sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });
      });
      setSyncStatus('connected');
    } catch (err) {
      console.error('Error saving record:', err);
      setSyncStatus('error');
    }
  };

  // Handler: Quick update single field directly from table
  const handleQuickUpdateField = async (recordId: string, field: keyof SolarRecord, value: number) => {
    const target = records.find((r) => r.id === recordId);
    if (!target) return;

    const updated: SolarRecord = { ...target, [field]: value };

    if (field === 'consumoTotalReal' || field === 'autoconsumo' || field === 'produccionReal') {
      updated.consumoRed = Number(Math.max(0, updated.consumoTotalReal - updated.autoconsumo).toFixed(2));
      updated.excedentes = Number(Math.max(0, updated.produccionReal - updated.autoconsumo).toFixed(2));
      updated.diferenciaKwh = Number((updated.produccionReal - updated.consumoTotalReal).toFixed(2));
    }

    await handleSaveRecord(updated);
  };

  // Handler: Delete single record
  const handleDeleteRecord = async (recordId: string) => {
    try {
      setSyncStatus('syncing');
      await deleteRecord(systemKey, recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      setSyncStatus('connected');
    } catch (err) {
      console.error('Error deleting record:', err);
      setSyncStatus('error');
    }
  };

  // Handler: Safe clear all records
  const handleConfirmClearAll = async () => {
    try {
      setSyncStatus('syncing');
      await clearAllRecords(systemKey);
      setRecords([]);
      setSyncStatus('connected');
    } catch (err) {
      console.error('Error clearing all records:', err);
      setSyncStatus('error');
    }
  };

  // Handler: Restore default records
  const handleRestoreDefaults = async () => {
    try {
      setSyncStatus('syncing');
      await restoreInitialRecords(systemKey);
      setRecords(INITIAL_SOLAR_RECORDS);
      setSyncStatus('connected');
    } catch (err) {
      console.error('Error restoring default records:', err);
      setSyncStatus('error');
    }
  };

  return (
    <div className="min-h-screen relative text-[#ecf5ea] flex flex-col font-sans selection:bg-lime-900 selection:text-lime-200">
      {/* Monochromatic background with solar and ecological symbols */}
      <EcoBackground />

      {/* Foreground application content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <Header
          syncStatus={syncStatus}
          systemKey={systemKey}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          onOpenSafeDelete={() => setIsSafeDeleteModalOpen(true)}
          onOpenAddMonth={() => setIsAddMonthModalOpen(true)}
        />

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* 1. KPIs & Key Metrics Overview */}
          <section aria-label="Métricas Principales de Sostenibilidad">
            <MetricsOverview records={records} settings={settings} />
          </section>

          {/* 2. Interactive Solar Charts */}
          <section aria-label="Gráficas Interactivas">
            <SolarCharts
              records={records}
              selectedYear={selectedPeriod}
              onSelectYear={setSelectedPeriod}
            />
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
                  Haz clic sobre cualquier celda numérica para editar su valor directamente o pulsa el icono de edición
                </p>
              </div>
            </div>
            <DataTable
              records={records}
              selectedPeriod={selectedPeriod}
              onEditRecord={(record) => setEditingRecord(record)}
              onQuickUpdateField={handleQuickUpdateField}
              onDeleteRecord={handleDeleteRecord}
            />
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#233525] bg-[#0c140d]/90 backdrop-blur-sm py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8ca48a]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#f1f7ef]">Seguimiento Solar & Rentabilidad</span>
              <span>•</span>
              <span className="text-[#a1ba9f]">Instalación 5,34 kWp (+100° / -80°)</span>
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
      />

      <EditRecordModal
        isOpen={Boolean(editingRecord)}
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleSaveRecord}
        onDeleteRecord={handleDeleteRecord}
      />
    </div>
  );
}
