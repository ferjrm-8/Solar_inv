import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Sparkles, Calculator } from 'lucide-react';
import { SolarRecord } from '../types/solar';
import { MONTHLY_THEORETICAL } from '../data/initialData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: SolarRecord) => Promise<void>;
  existingRecords: SolarRecord[];
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function AddMonthModal({ isOpen, onClose, onSave, existingRecords }: Props) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Form states
  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);
  const [string1Teorica, setString1Teorica] = useState<number>(422.1);
  const [string2Teorica, setString2Teorica] = useState<number>(429.87);
  const [produccionReal, setProduccionReal] = useState<number>(850);
  const [consumoTotalReal, setConsumoTotalReal] = useState<number>(500);
  const [autoconsumo, setAutoconsumo] = useState<number>(420);
  const [facturaReal, setFacturaReal] = useState<number>(0);
  const [quedaBateriaSb, setQuedaBateriaSb] = useState<number>(15);
  const [expectativaGasto, setExpectativaGasto] = useState<number>(550);
  const [realAnterior, setRealAnterior] = useState<number>(480);
  const [notas, setNotas] = useState<string>('');

  // Derived unit prices for auto-estimation
  const [precioRedKwh] = useState<number>(0.16);
  const [precioExcedenteKwh] = useState<number>(0.08);

  const [saving, setSaving] = useState(false);

  // Auto update theoretical values when month changes
  useEffect(() => {
    const theoretical = MONTHLY_THEORETICAL[month];
    if (theoretical) {
      setString1Teorica(theoretical.s1);
      setString2Teorica(theoretical.s2);
    }
  }, [month]);

  // Derived values calculation
  const produccionTeoricaTotal = Number((string1Teorica + string2Teorica).toFixed(2));
  const consumoRed = Number(Math.max(0, consumoTotalReal - autoconsumo).toFixed(2));
  const excedentes = Number(Math.max(0, produccionReal - autoconsumo).toFixed(2));
  const diferenciaKwh = Number((produccionReal - consumoTotalReal).toFixed(2));

  const valorAutoconsumo = Number((autoconsumo * precioRedKwh).toFixed(2));
  const valorConsumoRed = Number((consumoRed * precioRedKwh).toFixed(2));
  const valorExcedentes = Number((excedentes * precioExcedenteKwh).toFixed(2));
  const diferenciaEuros = Number((valorExcedentes - valorConsumoRed).toFixed(2));
  const ahorroDirecto = Number((valorAutoconsumo + valorExcedentes).toFixed(2));

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const monthTwoDigits = month < 10 ? `0${month}` : `${month}`;
      const recordId = `${year}-${monthTwoDigits}`;
      const shortYear = `${year}`.slice(-2);
      const periodLabel = `${MONTH_NAMES[month - 1]} ${shortYear}`;
      
      const cycleStartYear = month >= 6 ? shortYear : `${Number(shortYear) - 1}`;
      const cycleEndYear = month >= 6 ? `${Number(shortYear) + 1}` : shortYear;
      const cycleLabel = `6_${cycleStartYear}-5_${cycleEndYear}`;

      const newRecord: SolarRecord = {
        id: recordId,
        periodLabel,
        year,
        month,
        monthName: MONTH_NAMES[month - 1],
        cycleLabel,
        string1Teorica,
        string2Teorica,
        produccionTeoricaTotal,
        realAnterior,
        expectativaGasto,
        consumoTotalReal,
        produccionReal,
        autoconsumo,
        consumoRed,
        excedentes,
        diferenciaKwh,
        valorAutoconsumo,
        valorConsumoRed,
        valorExcedentes,
        diferenciaEuros,
        quedaBateriaSb,
        facturaReal,
        ahorroDirecto,
        notas: notas.trim() || undefined,
      };

      await onSave(newRecord);
      onClose();
    } catch (err) {
      console.error('Error adding record:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div 
        id="modal-add-month" 
        className="relative w-full max-w-2xl bg-[#121c13] rounded-2xl shadow-2xl border border-[#2b3e2d] p-6 max-h-[92vh] overflow-y-auto text-[#ecf5ea]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#233525]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-lime-950/70 text-lime-400 border border-lime-800/60">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#f1f7ef]">
                Añadir Nuevo Mes al Seguimiento
              </h2>
              <p className="text-xs text-[#8ca48a]">
                Lecturas de generación solar, consumos y factura
              </p>
            </div>
          </div>
          <button
            id="btn-close-add-modal"
            onClick={onClose}
            className="p-1.5 text-[#8ca48a] hover:text-[#f1f7ef] hover:bg-[#1a291b] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Period selector */}
          <div className="p-3.5 bg-[#172418] rounded-xl border border-[#2b3e2d] grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8ca48a] mb-1">Mes</label>
              <select
                id="select-month"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-[#121c13] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 font-medium text-white"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8ca48a] mb-1">Año</label>
              <input
                id="input-year"
                type="number"
                min="2020"
                max="2035"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-[#121c13] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 font-medium text-white"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-[#8ca48a] mb-1">Teórica calculada</label>
              <div className="px-3 py-2 bg-lime-950/60 border border-lime-800/60 rounded-lg text-xs font-mono font-bold text-lime-300">
                {produccionTeoricaTotal} kWh
              </div>
            </div>
          </div>

          {/* Theoretical Strings */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[#8ca48a] mb-1">String 1 Teórica (+100°)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={string1Teorica}
                  onChange={(e) => setString1Teorica(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-[#172418] border border-[#2b3e2d] rounded-lg focus:outline-none focus:ring-1 focus:ring-lime-500 text-white"
                />
                <span className="absolute right-3 top-2 text-[10px] text-[#789276]">kWh</span>
              </div>
            </div>
            <div>
              <label className="block text-[#8ca48a] mb-1">String 2 Teórica (-80°)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={string2Teorica}
                  onChange={(e) => setString2Teorica(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-[#172418] border border-[#2b3e2d] rounded-lg focus:outline-none focus:ring-1 focus:ring-lime-500 text-white"
                />
                <span className="absolute right-3 top-2 text-[10px] text-[#789276]">kWh</span>
              </div>
            </div>
          </div>

          {/* Primary Energy Readings (kWh) */}
          <div className="p-4 rounded-xl border border-[#2d4430] bg-[#162317] space-y-3">
            <h3 className="text-xs font-bold text-[#f1f7ef] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-lime-400" />
              Lecturas de Energía del Mes (kWh)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#8ca48a] mb-1">
                  Producción Real
                </label>
                <div className="relative">
                  <input
                    id="input-produccion-real"
                    type="number"
                    step="0.1"
                    required
                    value={produccionReal}
                    onChange={(e) => setProduccionReal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#111a12] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 font-bold text-amber-300"
                  />
                  <span className="absolute right-3 top-2 text-xs text-[#789276]">kWh</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8ca48a] mb-1">
                  Consumo Total Vivienda
                </label>
                <div className="relative">
                  <input
                    id="input-consumo-real"
                    type="number"
                    step="0.1"
                    required
                    value={consumoTotalReal}
                    onChange={(e) => setConsumoTotalReal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#111a12] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 font-semibold text-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-[#789276]">kWh</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8ca48a] mb-1">
                  Autoconsumo Solar
                </label>
                <div className="relative">
                  <input
                    id="input-autoconsumo"
                    type="number"
                    step="0.1"
                    required
                    value={autoconsumo}
                    onChange={(e) => setAutoconsumo(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#111a12] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 font-bold text-lime-300"
                  />
                  <span className="absolute right-3 top-2 text-xs text-[#789276]">kWh</span>
                </div>
              </div>
            </div>

            {/* Auto-calculated indicators */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#233525] text-xs">
              <div className="p-2 bg-[#121c13] rounded-lg border border-[#253927]">
                <span className="text-[#789276] block text-[10px]">Consumo Red:</span>
                <span className="font-bold text-[#d3e3ce]">{consumoRed} kWh</span>
              </div>
              <div className="p-2 bg-[#121c13] rounded-lg border border-[#253927]">
                <span className="text-[#789276] block text-[10px]">Excedentes Vertidos:</span>
                <span className="font-bold text-teal-300">{excedentes} kWh</span>
              </div>
              <div className="p-2 bg-[#121c13] rounded-lg border border-[#253927]">
                <span className="text-[#789276] block text-[10px]">Balance Neto:</span>
                <span className={`font-bold ${diferenciaKwh >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {diferenciaKwh >= 0 ? `+${diferenciaKwh}` : diferenciaKwh} kWh
                </span>
              </div>
            </div>
          </div>

          {/* Economic values (€) */}
          <div className="p-4 rounded-xl border border-lime-900/50 bg-lime-950/20 space-y-3">
            <h3 className="text-xs font-bold text-lime-300 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-lime-400" />
              Métricas Económicas (€)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#8ca48a] mb-1">
                  Factura Real Pagada (€)
                </label>
                <div className="relative">
                  <input
                    id="input-factura-real"
                    type="number"
                    step="0.01"
                    value={facturaReal}
                    onChange={(e) => setFacturaReal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#111a12] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 font-bold text-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-[#789276]">€</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8ca48a] mb-1">
                  Saldo en Batería Virtual (Solar Bank)
                </label>
                <div className="relative">
                  <input
                    id="input-bateria-sb"
                    type="number"
                    step="0.01"
                    value={quedaBateriaSb}
                    onChange={(e) => setQuedaBateriaSb(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#111a12] border border-[#314633] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 font-bold text-cyan-300"
                  />
                  <span className="absolute right-3 top-2 text-xs text-[#789276]">€</span>
                </div>
              </div>
            </div>

            {/* Economic summary */}
            <div className="p-2.5 bg-[#121c13] rounded-lg border border-lime-800/40 flex items-center justify-between text-xs">
              <span className="text-[#8ca48a]">
                Ahorro directo estimado en el mes:
              </span>
              <span className="font-bold text-[#bef264] text-sm">
                {ahorroDirecto} €
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#233525] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8ca48a] hover:text-white"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-add-month"
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-slate-950 rounded-xl text-xs font-extrabold transition-colors shadow-md disabled:opacity-50"
            >
              {saving ? 'Guardando en la nube...' : 'Guardar Mes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
