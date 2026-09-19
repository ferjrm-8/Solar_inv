import React, { useState, useEffect } from 'react';
import { X, Edit3, Check, Trash2 } from 'lucide-react';
import { SolarRecord } from '../types/solar';

interface Props {
  isOpen: boolean;
  record: SolarRecord | null;
  onClose: () => void;
  onSave: (updatedRecord: SolarRecord) => Promise<void>;
  onDeleteRecord?: (recordId: string) => Promise<void>;
}

export function EditRecordModal({ isOpen, record, onClose, onSave, onDeleteRecord }: Props) {
  const [formData, setFormData] = useState<SolarRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (record) {
      setFormData({ ...record });
    }
  }, [record]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof SolarRecord, value: any) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };

      if (field === 'consumoTotalReal' || field === 'autoconsumo' || field === 'produccionReal') {
        const prod = field === 'produccionReal' ? Number(value) : updated.produccionReal;
        const cons = field === 'consumoTotalReal' ? Number(value) : updated.consumoTotalReal;
        const auto = field === 'autoconsumo' ? Number(value) : updated.autoconsumo;

        updated.consumoRed = Number(Math.max(0, cons - auto).toFixed(2));
        updated.excedentes = Number(Math.max(0, prod - auto).toFixed(2));
        updated.diferenciaKwh = Number((prod - cons).toFixed(2));
      }

      if (field === 'string1Teorica' || field === 'string2Teorica') {
        const s1 = field === 'string1Teorica' ? Number(value) : updated.string1Teorica;
        const s2 = field === 'string2Teorica' ? Number(value) : updated.string2Teorica;
        updated.produccionTeoricaTotal = Number((s1 + s2).toFixed(2));
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    try {
      setSaving(true);
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving record:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formData || !onDeleteRecord) return;
    if (window.confirm(`¿Estás seguro de eliminar el registro de ${formData.periodLabel}?`)) {
      try {
        setDeleting(true);
        await onDeleteRecord(formData.id);
        onClose();
      } catch (err) {
        console.error('Error deleting record:', err);
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div 
        id="modal-edit-record" 
        className="relative w-full max-w-3xl bg-[#121c13] rounded-2xl shadow-2xl border border-[#2b3e2d] p-6 max-h-[92vh] overflow-y-auto text-[#ecf5ea]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#233525]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-lime-950/70 text-lime-400 border border-lime-800/60">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#f1f7ef]">
                Editar Registro: {formData.periodLabel}
              </h2>
              <p className="text-xs text-[#8ca48a]">
                Todos los campos son editables y se sincronizan en tiempo real
              </p>
            </div>
          </div>
          <button
            id="btn-close-edit-modal"
            onClick={onClose}
            className="p-1.5 text-[#8ca48a] hover:text-[#f1f7ef] hover:bg-[#1a291b] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Main Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#172418] rounded-xl border border-[#2b3e2d] text-xs">
            <div>
              <label className="block text-[#8ca48a] font-medium mb-1">Etiqueta</label>
              <input
                type="text"
                value={formData.periodLabel}
                onChange={(e) => handleChange('periodLabel', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg font-semibold text-white"
              />
            </div>
            <div>
              <label className="block text-[#8ca48a] font-medium mb-1">Año</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleChange('year', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-[#8ca48a] font-medium mb-1">Mes (1-12)</label>
              <input
                type="number"
                min="1"
                max="12"
                value={formData.month}
                onChange={(e) => handleChange('month', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-[#8ca48a] font-medium mb-1">Ciclo Anual</label>
              <input
                type="text"
                value={formData.cycleLabel || ''}
                onChange={(e) => handleChange('cycleLabel', e.target.value)}
                placeholder="6_23-5_24"
                className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg text-white"
              />
            </div>
          </div>

          {/* Theoretical values */}
          <div className="p-3.5 rounded-xl border border-lime-900/50 bg-lime-950/20">
            <h4 className="text-xs font-bold text-lime-300 mb-2.5">
              Generación Teórica Estimada (kWh)
            </h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[#8ca48a] mb-1">String 1 (+100°)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.string1Teorica}
                  onChange={(e) => handleChange('string1Teorica', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-[#8ca48a] mb-1">String 2 (-80°)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.string2Teorica}
                  onChange={(e) => handleChange('string2Teorica', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-[#8ca48a] mb-1">Total Teórica</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.produccionTeoricaTotal}
                  onChange={(e) => handleChange('produccionTeoricaTotal', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-lime-500 rounded-lg font-bold text-lime-300"
                />
              </div>
            </div>
          </div>

          {/* Real Energy Values (kWh) */}
          <div className="p-3.5 rounded-xl border border-[#2d4430] bg-[#162317]">
            <h4 className="text-xs font-bold text-[#f1f7ef] mb-2.5">
              Energía Real Medida (kWh)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[#8ca48a] font-semibold mb-1">Producción Real</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.produccionReal}
                  onChange={(e) => handleChange('produccionReal', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-amber-400 rounded-lg font-bold text-amber-300"
                />
              </div>
              <div>
                <label className="block text-[#8ca48a] font-semibold mb-1">Consumo Total Real</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.consumoTotalReal}
                  onChange={(e) => handleChange('consumoTotalReal', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg font-semibold text-white"
                />
              </div>
              <div>
                <label className="block text-[#8ca48a] font-semibold mb-1">Autoconsumo</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.autoconsumo}
                  onChange={(e) => handleChange('autoconsumo', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-lime-400 rounded-lg font-bold text-lime-300"
                />
              </div>
              <div>
                <label className="block text-[#8ca48a] mb-1">Consumo Red (kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.consumoRed}
                  onChange={(e) => handleChange('consumoRed', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-[#8ca48a] mb-1">Excedentes (kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.excedentes}
                  onChange={(e) => handleChange('excedentes', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg font-medium text-teal-300"
                />
              </div>
              <div>
                <label className="block text-[#8ca48a] mb-1">Diferencia kWh</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.diferenciaKwh}
                  onChange={(e) => handleChange('diferenciaKwh', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          {/* Economic Metrics (€) */}
          <div className="p-3.5 rounded-xl border border-lime-900/50 bg-lime-950/20">
            <h4 className="text-xs font-bold text-lime-300 mb-2.5">
              Valores Económicos y Rentabilidad (€)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[#8ca48a] mb-1">Valor Autoconsumo (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valorAutoconsumo}
                  onChange={(e) => handleChange('valorAutoconsumo', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-[#8ca48a] mb-1">Valor Consumo Red (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valorConsumoRed}
                  onChange={(e) => handleChange('valorConsumoRed', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-[#8ca48a] mb-1">Valor Excedentes (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valorExcedentes}
                  onChange={(e) => handleChange('valorExcedentes', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-[#8ca48a] mb-1">Diferencia (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.diferenciaEuros}
                  onChange={(e) => handleChange('diferenciaEuros', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-[#8ca48a] font-semibold mb-1">Factura Real (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.facturaReal}
                  onChange={(e) => handleChange('facturaReal', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[#8ca48a] font-semibold mb-1">Queda en Batería SB (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quedaBateriaSb}
                  onChange={(e) => handleChange('quedaBateriaSb', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-[#314633] rounded-lg font-bold text-cyan-300"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-lime-300 font-semibold mb-1">Ahorro Directo (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.ahorroDirecto}
                  onChange={(e) => handleChange('ahorroDirecto', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#111a12] border border-lime-500 rounded-lg font-bold text-[#bef264]"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#233525] flex items-center justify-between">
            {onDeleteRecord && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Borrando...' : 'Borrar este mes'}
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#8ca48a] hover:text-white"
              >
                Cancelar
              </button>
              <button
                id="btn-submit-edit-record"
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-slate-950 rounded-xl text-xs font-extrabold transition-colors shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
