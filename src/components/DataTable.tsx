import React, { useState } from 'react';
import { Edit2, Trash2, Search, ArrowUpDown, Check, Download } from 'lucide-react';
import { SolarRecord } from '../types/solar';

interface Props {
  records: SolarRecord[];
  onEditRecord: (record: SolarRecord) => void;
  onQuickUpdateField: (recordId: string, field: keyof SolarRecord, value: number) => Promise<void>;
  onDeleteRecord: (recordId: string) => Promise<void>;
  selectedPeriod: string;
}

export function DataTable({
  records,
  onEditRecord,
  onQuickUpdateField,
  onDeleteRecord,
  selectedPeriod,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{ recordId: string; field: keyof SolarRecord } | null>(null);
  const [cellValue, setCellValue] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter by period & search
  const filteredRecords = records.filter((r) => {
    let matchesPeriod = true;
    if (selectedPeriod !== 'all') {
      if (selectedPeriod.startsWith('cycle:')) {
        matchesPeriod = r.cycleLabel === selectedPeriod.replace('cycle:', '');
      } else {
        matchesPeriod = r.year.toString() === selectedPeriod;
      }
    }
    if (!matchesPeriod) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.periodLabel.toLowerCase().includes(term) ||
      r.year.toString().includes(term) ||
      (r.cycleLabel && r.cycleLabel.toLowerCase().includes(term))
    );
  });

  // Sort records
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const comp = a.year !== b.year ? a.year - b.year : a.month - b.month;
    return sortOrder === 'asc' ? comp : -comp;
  });

  // Start inline cell edit
  const startInlineEdit = (record: SolarRecord, field: keyof SolarRecord) => {
    setEditingCell({ recordId: record.id, field });
    setCellValue(String(record[field] ?? ''));
  };

  // Submit inline cell edit
  const submitInlineEdit = async (recordId: string, field: keyof SolarRecord) => {
    const num = parseFloat(cellValue);
    if (!isNaN(num)) {
      await onQuickUpdateField(recordId, field, num);
    }
    setEditingCell(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Periodo', 'Año', 'Mes', 'Prod. Real (kWh)', 'Teorica (kWh)', 'Consumo Real (kWh)',
      'Autoconsumo (kWh)', 'Consumo Red (kWh)', 'Excedentes (kWh)', 'Balance kWh',
      'Ahorro Directo (€)', 'Factura Real (€)', 'Bateria Virtual SB (€)', 'Valor Excedentes (€)'
    ];
    const rows = sortedRecords.map((r) => [
      r.periodLabel, r.year, r.month, r.produccionReal, r.produccionTeoricaTotal,
      r.consumoTotalReal, r.autoconsumo, r.consumoRed, r.excedentes, r.diferenciaKwh,
      r.ahorroDirecto, r.facturaReal, r.quedaBateriaSb, r.valorExcedentes
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `seguimiento_solar_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Totals for filtered records
  const totals = sortedRecords.reduce(
    (acc, r) => ({
      produccionReal: acc.produccionReal + (r.produccionReal || 0),
      produccionTeorica: acc.produccionTeorica + (r.produccionTeoricaTotal || 0),
      consumoTotal: acc.consumoTotal + (r.consumoTotalReal || 0),
      autoconsumo: acc.autoconsumo + (r.autoconsumo || 0),
      consumoRed: acc.consumoRed + (r.consumoRed || 0),
      excedentes: acc.excedentes + (r.excedentes || 0),
      ahorroDirecto: acc.ahorroDirecto + (r.ahorroDirecto || 0),
      facturaReal: acc.facturaReal + (r.facturaReal || 0),
    }),
    {
      produccionReal: 0,
      produccionTeorica: 0,
      consumoTotal: 0,
      autoconsumo: 0,
      consumoRed: 0,
      excedentes: 0,
      ahorroDirecto: 0,
      facturaReal: 0,
    }
  );

  return (
    <div className="bg-[#141f16]/95 backdrop-blur-sm rounded-2xl border border-[#253927] shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-[#223324] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0f1710]/70">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#7f997d] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar mes o año..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#19271c] border border-[#2d422f] rounded-lg text-[#ecf5ea] focus:outline-none focus:ring-2 focus:ring-lime-500 placeholder-[#6e846c]"
            />
          </div>
          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#19271c] border border-[#2d422f] rounded-lg text-xs font-semibold text-[#d4e4cf] hover:bg-[#233527] transition-colors"
            title="Cambiar orden cronológico"
          >
            <ArrowUpDown className="w-3 h-3 text-lime-400" />
            <span>{sortOrder === 'desc' ? 'Más recientes' : 'Más antiguos'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-[#8ca48a] font-medium">
            Mostrando <strong className="text-[#f1f7ef]">{sortedRecords.length}</strong> meses
          </span>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#19271c] border border-[#2d422f] hover:border-lime-700/60 rounded-lg text-xs font-semibold text-[#d4e4cf] transition-colors shadow-2xs"
            title="Exportar datos a CSV"
          >
            <Download className="w-3.5 h-3.5 text-lime-400" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#111a12] text-[#8ca68a] font-bold sticky top-0 z-10 border-b border-[#233525] shadow-2xs">
            <tr>
              <th className="py-3 px-3.5 whitespace-nowrap text-[#e4eee1]">Periodo</th>
              <th className="py-3 px-3 whitespace-nowrap text-amber-300 bg-amber-950/20">Prod. Real (kWh)</th>
              <th className="py-3 px-3 whitespace-nowrap text-[#9bb198]">Teórica</th>
              <th className="py-3 px-3 whitespace-nowrap text-[#d3e3ce]">Consumo (kWh)</th>
              <th className="py-3 px-3 whitespace-nowrap text-lime-300 bg-lime-950/20">Autoconsumo</th>
              <th className="py-3 px-3 whitespace-nowrap text-[#8ca48a]">Consumo Red</th>
              <th className="py-3 px-3 whitespace-nowrap text-teal-300">Excedentes</th>
              <th className="py-3 px-3 whitespace-nowrap text-[#d3e3ce]">Balance kWh</th>
              <th className="py-3 px-3 whitespace-nowrap text-[#bef264] bg-lime-950/30">Ahorro Directo</th>
              <th className="py-3 px-3 whitespace-nowrap text-[#e4eee1]">Factura Real</th>
              <th className="py-3 px-3 whitespace-nowrap text-cyan-300">Batería SB</th>
              <th className="py-3 px-3 whitespace-nowrap text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2d20]">
            {sortedRecords.map((r) => {
              const isFacturaCero = r.facturaReal === 0;
              return (
                <tr 
                  key={r.id} 
                  className="hover:bg-[#18271a]/80 transition-colors group"
                >
                  {/* Period */}
                  <td className="py-2.5 px-3.5 font-bold text-[#f1f7ef] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{r.periodLabel}</span>
                      {r.cycleLabel && (
                        <span className="text-[10px] text-[#6d846c] font-mono font-normal">
                          ({r.cycleLabel})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Producción Real (Editable) */}
                  <td 
                    className="py-2.5 px-3 font-bold text-amber-300 bg-amber-950/10 whitespace-nowrap cursor-pointer hover:bg-amber-950/30 transition-colors"
                    onClick={() => startInlineEdit(r, 'produccionReal')}
                    title="Haz clic para editar"
                  >
                    {editingCell?.recordId === r.id && editingCell?.field === 'produccionReal' ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="0.1"
                          autoFocus
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitInlineEdit(r.id, 'produccionReal');
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-16 px-1.5 py-0.5 text-xs bg-[#19271c] border border-amber-400 rounded-sm font-bold text-amber-200"
                        />
                        <button
                          onClick={() => submitInlineEdit(r.id, 'produccionReal')}
                          className="p-1 bg-amber-500 text-slate-950 rounded-xs"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    ) : (
                      <span className="hover:underline flex items-center gap-1">
                        {r.produccionReal}
                      </span>
                    )}
                  </td>

                  {/* Teórica */}
                  <td className="py-2.5 px-3 text-[#9bb198] font-mono whitespace-nowrap">
                    {r.produccionTeoricaTotal}
                  </td>

                  {/* Consumo Total Real (Editable) */}
                  <td 
                    className="py-2.5 px-3 font-semibold text-[#d3e3ce] whitespace-nowrap cursor-pointer hover:bg-[#1f3021]"
                    onClick={() => startInlineEdit(r, 'consumoTotalReal')}
                    title="Haz clic para editar"
                  >
                    {editingCell?.recordId === r.id && editingCell?.field === 'consumoTotalReal' ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="0.1"
                          autoFocus
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitInlineEdit(r.id, 'consumoTotalReal');
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-16 px-1.5 py-0.5 text-xs bg-[#19271c] border border-[#4d6b50] rounded-sm font-semibold text-white"
                        />
                        <button
                          onClick={() => submitInlineEdit(r.id, 'consumoTotalReal')}
                          className="p-1 bg-lime-600 text-slate-950 rounded-xs"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    ) : (
                      <span>{r.consumoTotalReal}</span>
                    )}
                  </td>

                  {/* Autoconsumo (Editable) */}
                  <td 
                    className="py-2.5 px-3 font-bold text-lime-300 bg-lime-950/15 whitespace-nowrap cursor-pointer hover:bg-lime-950/35"
                    onClick={() => startInlineEdit(r, 'autoconsumo')}
                    title="Haz clic para editar"
                  >
                    {editingCell?.recordId === r.id && editingCell?.field === 'autoconsumo' ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="0.1"
                          autoFocus
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitInlineEdit(r.id, 'autoconsumo');
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-16 px-1.5 py-0.5 text-xs bg-[#19271c] border border-lime-400 rounded-sm font-bold text-lime-200"
                        />
                        <button
                          onClick={() => submitInlineEdit(r.id, 'autoconsumo')}
                          className="p-1 bg-lime-500 text-slate-950 rounded-xs"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    ) : (
                      <span>{r.autoconsumo}</span>
                    )}
                  </td>

                  {/* Consumo Red */}
                  <td className="py-2.5 px-3 text-[#8ca48a] whitespace-nowrap">
                    {r.consumoRed}
                  </td>

                  {/* Excedentes */}
                  <td className="py-2.5 px-3 font-medium text-teal-300 whitespace-nowrap">
                    {r.excedentes}
                  </td>

                  {/* Balance kWh */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span 
                      className={`font-semibold ${
                        r.diferenciaKwh >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {r.diferenciaKwh > 0 ? `+${r.diferenciaKwh}` : r.diferenciaKwh}
                    </span>
                  </td>

                  {/* Ahorro Directo (€) (Editable) */}
                  <td 
                    className="py-2.5 px-3 font-extrabold text-[#bef264] bg-lime-950/25 whitespace-nowrap cursor-pointer hover:bg-lime-950/45"
                    onClick={() => startInlineEdit(r, 'ahorroDirecto')}
                    title="Haz clic para editar"
                  >
                    {editingCell?.recordId === r.id && editingCell?.field === 'ahorroDirecto' ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="0.01"
                          autoFocus
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitInlineEdit(r.id, 'ahorroDirecto');
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-18 px-1.5 py-0.5 text-xs bg-[#19271c] border border-lime-400 rounded-sm font-bold text-lime-200"
                        />
                        <button
                          onClick={() => submitInlineEdit(r.id, 'ahorroDirecto')}
                          className="p-1 bg-lime-500 text-slate-950 rounded-xs"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    ) : (
                      <span>{r.ahorroDirecto.toFixed(2)} €</span>
                    )}
                  </td>

                  {/* Factura Real (€) (Editable) */}
                  <td 
                    className="py-2.5 px-3 whitespace-nowrap cursor-pointer hover:bg-[#1f3021]"
                    onClick={() => startInlineEdit(r, 'facturaReal')}
                    title="Haz clic para editar"
                  >
                    {editingCell?.recordId === r.id && editingCell?.field === 'facturaReal' ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="0.01"
                          autoFocus
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitInlineEdit(r.id, 'facturaReal');
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-16 px-1.5 py-0.5 text-xs bg-[#19271c] border border-[#527456] rounded-sm font-bold text-white"
                        />
                        <button
                          onClick={() => submitInlineEdit(r.id, 'facturaReal')}
                          className="p-1 bg-lime-600 text-slate-950 rounded-xs"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    ) : isFacturaCero ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-lime-950/80 text-lime-300 border border-lime-800/60">
                        0,00 €
                      </span>
                    ) : (
                      <span className="font-bold text-[#e4eee1]">
                        {r.facturaReal.toFixed(2)} €
                      </span>
                    )}
                  </td>

                  {/* Queda Batería SB */}
                  <td className="py-2.5 px-3 text-cyan-300 font-medium whitespace-nowrap">
                    {r.quedaBateriaSb > 0 ? `${r.quedaBateriaSb.toFixed(2)} €` : '-'}
                  </td>

                  {/* Row Actions */}
                  <td className="py-2.5 px-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => onEditRecord(r)}
                        className="p-1 text-[#8ca48a] hover:text-lime-300 hover:bg-[#203322] rounded-md transition-colors"
                        title="Editar todos los campos"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar el registro de ${r.periodLabel}?`)) {
                            onDeleteRecord(r.id);
                          }
                        }}
                        className="p-1 text-[#708470] hover:text-rose-400 hover:bg-rose-950/50 rounded-md transition-colors"
                        title="Eliminar este mes"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Table Totals Footer */}
          <tfoot className="bg-[#0f1710] text-[#f1f7ef] font-extrabold sticky bottom-0 z-10 border-t-2 border-[#2c422f]">
            <tr>
              <td className="py-3 px-3.5">TOTALES ({sortedRecords.length} meses)</td>
              <td className="py-3 px-3 text-amber-300">{totals.produccionReal.toFixed(1)}</td>
              <td className="py-3 px-3 text-[#9bb198]">{totals.produccionTeorica.toFixed(1)}</td>
              <td className="py-3 px-3 text-[#d3e3ce]">{totals.consumoTotal.toFixed(1)}</td>
              <td className="py-3 px-3 text-lime-300">{totals.autoconsumo.toFixed(1)}</td>
              <td className="py-3 px-3 text-[#8ca48a]">{totals.consumoRed.toFixed(1)}</td>
              <td className="py-3 px-3 text-teal-300">{totals.excedentes.toFixed(1)}</td>
              <td className="py-3 px-3">
                <span className={totals.produccionReal >= totals.consumoTotal ? 'text-emerald-400' : 'text-rose-400'}>
                  {(totals.produccionReal - totals.consumoTotal).toFixed(1)}
                </span>
              </td>
              <td className="py-3 px-3 text-[#bef264] bg-lime-950/40">
                {totals.ahorroDirecto.toFixed(2)} €
              </td>
              <td className="py-3 px-3 text-[#e4eee1]">
                {totals.facturaReal.toFixed(2)} €
              </td>
              <td className="py-3 px-3 text-cyan-300">-</td>
              <td className="py-3 px-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
