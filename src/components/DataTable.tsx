import React, { useState } from 'react';
import { Edit2, Trash2, Search, ArrowUpDown, Check, Download, Calendar } from 'lucide-react';
import { SolarRecord, SolarSettings } from '../types/solar';

interface Props {
  records: SolarRecord[];
  onEditRecord: (record: SolarRecord) => void;
  onQuickUpdateField: (recordId: string, field: keyof SolarRecord, value: number) => Promise<void>;
  onDeleteRecord: (recordId: string) => Promise<void>;
  selectedPeriod: string;
  settings?: SolarSettings;
}

export function DataTable({
  records,
  onEditRecord,
  onQuickUpdateField,
  onDeleteRecord,
  selectedPeriod,
  settings,
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

  // Helper to get unit prices with fallback if legacy record
  const getPrices = (r: SolarRecord) => {
    const precioCompra = r.precioKwhComprado ?? (
      r.autoconsumo > 0 ? Number((r.valorAutoconsumo / r.autoconsumo).toFixed(4)) : (settings?.precioKwhRedMedio ?? 0.18)
    );
    const precioVenta = r.precioKwhVendido ?? (
      r.excedentes > 0 ? Number((r.valorExcedentes / r.excedentes).toFixed(4)) : (settings?.precioKwhExcedenteMedio ?? 0.08)
    );
    return { precioCompra, precioVenta };
  };

  // Start inline cell edit
  const startInlineEdit = (record: SolarRecord, field: keyof SolarRecord) => {
    setEditingCell({ recordId: record.id, field });
    const { precioCompra, precioVenta } = getPrices(record);
    if (field === 'precioKwhComprado') {
      setCellValue(String(record.precioKwhComprado ?? precioCompra));
    } else if (field === 'precioKwhVendido') {
      setCellValue(String(record.precioKwhVendido ?? precioVenta));
    } else {
      setCellValue(String(record[field] ?? ''));
    }
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
      'Periodo', 'Año', 'Mes', 'Ciclo Anual', 'Prod. Real (kWh)', 'Teorica (kWh)', 'Consumo Real (kWh)',
      'Autoconsumo (kWh)', 'Consumo Red (kWh)', 'Excedentes (kWh)', 'Balance kWh',
      '€/kWh Compra', '€/kWh Venta',
      'Ahorro Directo (€)', 'Factura Real (€)', 'Bateria Virtual SB (€)', 'Valor Excedentes (€)'
    ];
    const rows = sortedRecords.map((r) => {
      const { precioCompra, precioVenta } = getPrices(r);
      return [
        r.periodLabel, r.year, r.month, r.cycleLabel || '', r.produccionReal, r.produccionTeoricaTotal,
        r.consumoTotalReal, r.autoconsumo, r.consumoRed, r.excedentes, r.diferenciaKwh,
        r.precioKwhComprado ?? precioCompra, r.precioKwhVendido ?? precioVenta,
        r.ahorroDirecto, r.facturaReal, r.quedaBateriaSb, r.valorExcedentes
      ];
    });

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
      diferenciaKwh: acc.diferenciaKwh + (r.diferenciaKwh || 0),
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
      diferenciaKwh: 0,
      ahorroDirecto: 0,
      facturaReal: 0,
    }
  );

  return (
    <div 
      id="container-data-table" 
      className="bg-[#121c13] rounded-2xl border border-[#2b3e2d] shadow-xl overflow-hidden text-[#ecf5ea]"
    >
      {/* Table Toolbar */}
      <div className="p-4 border-b border-[#233525] bg-[#142015] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#769074]" />
          <input
            id="input-search-records"
            type="text"
            placeholder="Buscar por mes, año o ciclo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#101911] border border-[#2d422f] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-white placeholder-[#688266]"
          />
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
              <th className="py-3 px-3 whitespace-nowrap text-[#e4eee1]">
                <div className="flex items-center gap-1 cursor-pointer" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                  <span>Periodo / Ciclo</span>
                  <ArrowUpDown className="w-3 h-3 text-[#6f8b6d]" />
                </div>
              </th>
              <th className="py-3 px-3 whitespace-nowrap text-amber-300 bg-amber-950/20">Prod. Real (kWh)</th>
              <th className="py-3 px-2.5 whitespace-nowrap text-[#9bb198]">Teórica</th>
              <th className="py-3 px-3 whitespace-nowrap text-[#d3e3ce]">Consumo Total</th>
              <th className="py-3 px-3 whitespace-nowrap text-lime-300 bg-lime-950/20">Autoconsumo</th>
              <th className="py-3 px-2.5 whitespace-nowrap text-[#8ca48a]">Consumo Red</th>
              <th className="py-3 px-2.5 whitespace-nowrap text-teal-300">Excedentes</th>
              <th className="py-3 px-2.5 whitespace-nowrap text-[#d3e3ce]">Balance kWh</th>
              
              {/* Casillas explícitas de Precios unitarios de kWh */}
              <th className="py-3 px-2.5 whitespace-nowrap text-lime-300 bg-lime-950/40" title="Precio kWh Comprado de la Red">
                €/kWh Compra
              </th>
              <th className="py-3 px-2.5 whitespace-nowrap text-teal-300 bg-teal-950/30" title="Precio kWh Vendido por Excedente">
                €/kWh Venta
              </th>

              <th className="py-3 px-3 whitespace-nowrap text-[#bef264] bg-lime-950/30">Ahorro Directo</th>
              <th className="py-3 px-3 whitespace-nowrap text-[#e4eee1]">Factura Real</th>
              <th className="py-3 px-2.5 whitespace-nowrap text-cyan-300">Batería SB</th>
              <th className="py-3 px-3 whitespace-nowrap text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2d20]">
            {sortedRecords.map((r) => {
              const { precioCompra, precioVenta } = getPrices(r);
              const isFacturaCero = r.facturaReal === 0;
              return (
                <tr 
                  key={r.id} 
                  className="hover:bg-[#18271a]/80 transition-colors group"
                >
                  {/* Period & Cycle */}
                  <td className="py-2.5 px-3 font-bold text-[#f1f7ef] whitespace-nowrap">
                    <div className="flex flex-col">
                      <span>{r.periodLabel}</span>
                      {r.cycleLabel && (
                        <span className="text-[10px] text-lime-400/80 font-mono font-normal">
                          {r.cycleLabel}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Producción Real (Editable) */}
                  <td 
                    className="py-2.5 px-3 font-bold text-amber-300 bg-amber-950/10 whitespace-nowrap cursor-pointer hover:bg-amber-950/30 transition-colors"
                    onClick={() => startInlineEdit(r, 'produccionReal')}
                    title="Haz clic para editar producción"
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
                  <td className="py-2.5 px-2.5 text-[#9bb198] font-mono whitespace-nowrap">
                    {r.produccionTeoricaTotal}
                  </td>

                  {/* Consumo Total Real (Editable) */}
                  <td 
                    className="py-2.5 px-3 font-semibold text-[#d3e3ce] whitespace-nowrap cursor-pointer hover:bg-[#1f3021]"
                    onClick={() => startInlineEdit(r, 'consumoTotalReal')}
                    title="Haz clic para editar consumo"
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
                      <span className="hover:underline">
                        {r.consumoTotalReal}
                      </span>
                    )}
                  </td>

                  {/* Autoconsumo (Editable) */}
                  <td 
                    className="py-2.5 px-3 font-bold text-lime-300 bg-lime-950/10 whitespace-nowrap cursor-pointer hover:bg-lime-950/30"
                    onClick={() => startInlineEdit(r, 'autoconsumo')}
                    title="Haz clic para editar autoconsumo"
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
                      <span className="hover:underline">
                        {r.autoconsumo}
                      </span>
                    )}
                  </td>

                  {/* Consumo Red */}
                  <td className="py-2.5 px-2.5 text-[#9ab098] whitespace-nowrap">
                    {r.consumoRed}
                  </td>

                  {/* Excedentes */}
                  <td className="py-2.5 px-2.5 font-medium text-teal-300 whitespace-nowrap">
                    {r.excedentes}
                  </td>

                  {/* Balance kWh */}
                  <td className={`py-2.5 px-2.5 font-semibold font-mono whitespace-nowrap ${
                    r.diferenciaKwh >= 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {r.diferenciaKwh > 0 ? `+${r.diferenciaKwh}` : r.diferenciaKwh}
                  </td>

                  {/* PRECIO €/kWh COMPRA (Editable inline) */}
                  <td 
                    className="py-2.5 px-2.5 font-mono text-lime-300 bg-lime-950/20 whitespace-nowrap cursor-pointer hover:bg-lime-950/40"
                    onClick={() => startInlineEdit(r, 'precioKwhComprado')}
                    title="Haz clic para editar precio de compra de red (€/kWh)"
                  >
                    {editingCell?.recordId === r.id && editingCell?.field === 'precioKwhComprado' ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="0.0001"
                          autoFocus
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitInlineEdit(r.id, 'precioKwhComprado');
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-16 px-1 py-0.5 text-xs bg-[#19271c] border border-lime-400 rounded-sm font-bold text-lime-200"
                        />
                        <button
                          onClick={() => submitInlineEdit(r.id, 'precioKwhComprado')}
                          className="p-1 bg-lime-500 text-slate-950 rounded-xs"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    ) : (
                      <span className="hover:underline">
                        {r.precioKwhComprado ?? precioCompra} €
                      </span>
                    )}
                  </td>

                  {/* PRECIO €/kWh VENTA (Editable inline) */}
                  <td 
                    className="py-2.5 px-2.5 font-mono text-teal-300 bg-teal-950/20 whitespace-nowrap cursor-pointer hover:bg-teal-950/40"
                    onClick={() => startInlineEdit(r, 'precioKwhVendido')}
                    title="Haz clic para editar precio de venta de excedentes (€/kWh)"
                  >
                    {editingCell?.recordId === r.id && editingCell?.field === 'precioKwhVendido' ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="0.0001"
                          autoFocus
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitInlineEdit(r.id, 'precioKwhVendido');
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-16 px-1 py-0.5 text-xs bg-[#19271c] border border-teal-400 rounded-sm font-bold text-teal-200"
                        />
                        <button
                          onClick={() => submitInlineEdit(r.id, 'precioKwhVendido')}
                          className="p-1 bg-teal-500 text-slate-950 rounded-xs"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    ) : (
                      <span className="hover:underline">
                        {r.precioKwhVendido ?? precioVenta} €
                      </span>
                    )}
                  </td>

                  {/* Ahorro Directo */}
                  <td className="py-2.5 px-3 font-bold font-mono text-[#bef264] bg-lime-950/20 whitespace-nowrap">
                    {r.ahorroDirecto} €
                  </td>

                  {/* Factura Real */}
                  <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                    {isFacturaCero ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        0 € (Luz gratis)
                      </span>
                    ) : (
                      <span className="text-[#ecf5ea]">{r.facturaReal} €</span>
                    )}
                  </td>

                  {/* Batería Virtual SB */}
                  <td className="py-2.5 px-2.5 font-semibold text-cyan-300 whitespace-nowrap">
                    {r.quedaBateriaSb > 0 ? `${r.quedaBateriaSb} €` : '-'}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditRecord(r)}
                        className="p-1.5 text-lime-400 hover:bg-[#203222] rounded-md transition-colors"
                        title="Editar registro completo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteRecord(r.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-md transition-colors"
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

          {/* Totals Footer Row */}
          <tfoot className="bg-[#0f1710] font-bold text-[#ecf5ea] border-t-2 border-[#2b3e2d] sticky bottom-0 z-10 shadow-lg">
            <tr>
              <td className="py-3 px-3 text-[#9bb198] uppercase tracking-wider text-[11px]">
                Total ({sortedRecords.length} meses)
              </td>
              <td className="py-3 px-3 font-extrabold text-amber-300">
                {Number(totals.produccionReal.toFixed(1))} kWh
              </td>
              <td className="py-3 px-2.5 text-[#9bb198] font-mono">
                {Number(totals.produccionTeorica.toFixed(1))}
              </td>
              <td className="py-3 px-3 text-white">
                {Number(totals.consumoTotal.toFixed(1))} kWh
              </td>
              <td className="py-3 px-3 text-lime-300">
                {Number(totals.autoconsumo.toFixed(1))} kWh
              </td>
              <td className="py-3 px-2.5 text-[#9ab098]">
                {Number(totals.consumoRed.toFixed(1))}
              </td>
              <td className="py-3 px-2.5 text-teal-300">
                {Number(totals.excedentes.toFixed(1))}
              </td>
              <td className="py-3 px-2.5 font-mono text-emerald-400">
                {Number(totals.diferenciaKwh.toFixed(1))} kWh
              </td>
              
              {/* Unit price footer empty / average */}
              <td className="py-3 px-2.5 text-center text-[#748c72] text-[10px]">-</td>
              <td className="py-3 px-2.5 text-center text-[#748c72] text-[10px]">-</td>

              <td className="py-3 px-3 text-sm font-extrabold text-[#bef264] bg-lime-950/40">
                {Number(totals.ahorroDirecto.toFixed(2))} €
              </td>
              <td className="py-3 px-3 text-white">
                {Number(totals.facturaReal.toFixed(2))} €
              </td>
              <td className="py-3 px-2.5 text-cyan-300">-</td>
              <td className="py-3 px-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
