import React, { useState } from 'react';
import { X, Settings as SettingsIcon, Calendar, Zap, Euro, Check, RefreshCw } from 'lucide-react';
import { SolarSettings, SolarRecord } from '../types/solar';
import { MONTH_NAMES, getCycleDescription, getCycleLabelForMonth } from '../utils/cycleHelper';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: SolarSettings;
  onSaveSettings: (newSettings: SolarSettings) => Promise<void>;
  records: SolarRecord[];
  onBatchUpdateRecords?: (updatedRecords: SolarRecord[]) => Promise<void>;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  records,
  onBatchUpdateRecords,
}: Props) {
  const [formSettings, setFormSettings] = useState<SolarSettings>({ ...settings });
  const [recalculateExisting, setRecalculateExisting] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSaveSettings(formSettings);

      // If user checked recalculate existing cycles with the new start month:
      if (recalculateExisting && onBatchUpdateRecords) {
        const updatedRecords = records.map((r) => ({
          ...r,
          cycleLabel: getCycleLabelForMonth(r.year, r.month, formSettings.mesInicioCiclo),
        }));
        await onBatchUpdateRecords(updatedRecords);
      }

      onClose();
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div 
        id="modal-settings"
        className="relative w-full max-w-lg bg-[#121c13] rounded-2xl shadow-2xl border border-[#2b3e2d] p-6 max-h-[90vh] overflow-y-auto text-[#ecf5ea]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#233525]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-lime-950/70 text-lime-400 border border-lime-800/60">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#f1f7ef]">
                Configuración del Sistema y Ciclos
              </h2>
              <p className="text-xs text-[#8ca48a]">
                Personaliza el periodo del ciclo anual y precios por defecto
              </p>
            </div>
          </div>
          <button
            id="btn-close-settings-modal"
            onClick={onClose}
            className="p-1.5 text-[#8ca48a] hover:text-[#f1f7ef] hover:bg-[#1a291b] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Section 1: Annual Cycle Period Selection */}
          <div className="p-4 rounded-xl bg-[#162317] border border-[#2d4430] space-y-3">
            <div className="flex items-center gap-2 text-lime-400 text-sm font-bold">
              <Calendar className="w-4 h-4" />
              <span>Periodo del Ciclo Anual de Consumo</span>
            </div>
            <p className="text-xs text-[#8ca48a] leading-relaxed">
              Elige qué mes marca el inicio de tu año o ciclo de balance anual (por ejemplo, para ciclos de balance neto de junio a mayo, o años naturales de enero a diciembre).
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#8ca48a] mb-1.5">
                Mes de inicio del ciclo anual
              </label>
              <select
                id="select-cycle-start-month"
                value={formSettings.mesInicioCiclo ?? 6}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, mesInicioCiclo: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs bg-[#111a12] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 font-semibold text-lime-300"
              >
                {MONTH_NAMES.map((name, idx) => {
                  const m = idx + 1;
                  return (
                    <option key={m} value={m}>
                      {name} — {getCycleDescription(m)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Recalculate option */}
            <div className="pt-2 border-t border-[#233525]">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#d4e4cf]">
                <input
                  type="checkbox"
                  checked={recalculateExisting}
                  onChange={(e) => setRecalculateExisting(e.target.checked)}
                  className="mt-0.5 rounded-sm bg-[#111a12] border-[#314633] text-lime-500 focus:ring-lime-500"
                />
                <span>
                  Recalcular la etiqueta de ciclo de los {records.length} registros existentes con este nuevo mes de inicio.
                </span>
              </label>
            </div>
          </div>

          {/* Section 2: Default kWh Prices */}
          <div className="p-4 rounded-xl bg-[#162317] border border-[#2d4430] space-y-3">
            <div className="flex items-center gap-2 text-lime-400 text-sm font-bold">
              <Euro className="w-4 h-4" />
              <span>Precios por Defecto del kWh (€/kWh)</span>
            </div>
            <p className="text-xs text-[#8ca48a]">
              Precios sugeridos automáticamente al añadir nuevos meses (luego puedes modificarlos para cada mes individual):
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#8ca48a] font-medium mb-1">
                  Precio kWh Comprado (Red)
                </label>
                <div className="relative">
                  <input
                    id="input-setting-precio-red"
                    type="number"
                    step="0.001"
                    value={formSettings.precioKwhRedMedio}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        precioKwhRedMedio: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#111a12] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 font-bold text-white text-xs"
                  />
                  <span className="absolute right-3 top-2 text-xs text-[#789276]">€/kWh</span>
                </div>
              </div>

              <div>
                <label className="block text-[#8ca48a] font-medium mb-1">
                  Precio kWh Vendido (Excedente)
                </label>
                <div className="relative">
                  <input
                    id="input-setting-precio-excedente"
                    type="number"
                    step="0.001"
                    value={formSettings.precioKwhExcedenteMedio}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        precioKwhExcedenteMedio: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#111a12] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 font-bold text-teal-300 text-xs"
                  />
                  <span className="absolute right-3 top-2 text-xs text-[#789276]">€/kWh</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Installation Parameters */}
          <div className="p-4 rounded-xl bg-[#162317] border border-[#2d4430] space-y-3">
            <div className="flex items-center gap-2 text-lime-400 text-sm font-bold">
              <Zap className="w-4 h-4" />
              <span>Parámetros de la Instalación</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#8ca48a] font-medium mb-1">
                  Potencia Pico (kWp)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formSettings.potenciaPicoKw}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      potenciaPicoKw: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-[#111a12] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[#8ca48a] font-medium mb-1">
                  Inversión Total (€)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formSettings.inversionTotal}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      inversionTotal: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-[#111a12] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-white text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#233525] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8ca48a] hover:text-white"
            >
              Cancelar
            </button>
            <button
              id="btn-save-settings"
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-slate-950 rounded-xl text-xs font-extrabold transition-colors shadow-md disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
