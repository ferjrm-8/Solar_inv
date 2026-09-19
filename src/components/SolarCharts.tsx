import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Sun, Battery, Euro, ShieldCheck, Filter } from 'lucide-react';
import { SolarRecord } from '../types/solar';

interface Props {
  records: SolarRecord[];
  selectedYear: string;
  onSelectYear: (year: string) => void;
}

export function SolarCharts({ records, selectedYear, onSelectYear }: Props) {
  const [activeTab, setActiveTab] = useState<'generacion' | 'desglose' | 'economia' | 'bateria'>('generacion');

  // Available year filters
  const years = Array.from(new Set(records.map((r) => r.year.toString()))).sort();
  const cycles = Array.from(new Set(records.map((r) => r.cycleLabel).filter(Boolean))) as string[];

  // Filter records by selected year or cycle
  const filteredRecords = records.filter((r) => {
    if (selectedYear === 'all') return true;
    if (selectedYear.startsWith('cycle:')) {
      return r.cycleLabel === selectedYear.replace('cycle:', '');
    }
    return r.year.toString() === selectedYear;
  });

  // Chart data format
  const chartData = filteredRecords.map((r) => ({
    name: r.periodLabel,
    year: r.year,
    produccionReal: r.produccionReal,
    produccionTeorica: r.produccionTeoricaTotal,
    consumoReal: r.consumoTotalReal,
    autoconsumo: r.autoconsumo,
    consumoRed: r.consumoRed,
    excedentes: r.excedentes,
    diferenciaKwh: r.diferenciaKwh,
    ahorroDirecto: r.ahorroDirecto,
    facturaReal: r.facturaReal,
    valorAutoconsumo: r.valorAutoconsumo,
    valorExcedentes: r.valorExcedentes,
    quedaBateriaSb: r.quedaBateriaSb,
  }));

  // Custom tooltips in dark sustainability theme
  const CustomKwhTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#101711] p-3 rounded-xl shadow-xl border border-[#2b3e2d] text-xs space-y-1.5 min-w-[210px]">
          <p className="font-bold text-[#f1f7ef] border-b border-[#243526] pb-1">{label}</p>
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center gap-3">
              <span className="flex items-center gap-1.5 text-[#9ab098]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}:
              </span>
              <span className="font-bold font-mono text-[#f1f7ef]">
                {item.value} kWh
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomEurosTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#101711] p-3 rounded-xl shadow-xl border border-[#2b3e2d] text-xs space-y-1.5 min-w-[210px]">
          <p className="font-bold text-[#f1f7ef] border-b border-[#243526] pb-1">{label}</p>
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center gap-3">
              <span className="flex items-center gap-1.5 text-[#9ab098]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}:
              </span>
              <span className="font-bold font-mono text-[#bef264]">
                {Number(item.value).toFixed(2)} €
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#141f16]/95 backdrop-blur-sm rounded-2xl border border-[#253927] p-5 shadow-sm">
      {/* Header controls: Tabs and Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[#223324]">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0e160f] p-1 rounded-xl border border-[#1e2e20]">
          <button
            id="tab-chart-gen"
            onClick={() => setActiveTab('generacion')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'generacion'
                ? 'bg-[#223524] text-[#f1f7ef] shadow-xs border border-[#38543b]'
                : 'text-[#8ba389] hover:text-[#e4efe2]'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Generación vs Consumo</span>
          </button>

          <button
            id="tab-chart-desglose"
            onClick={() => setActiveTab('desglose')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'desglose'
                ? 'bg-[#223524] text-[#f1f7ef] shadow-xs border border-[#38543b]'
                : 'text-[#8ba389] hover:text-[#e4efe2]'
            }`}
          >
            <Battery className="w-3.5 h-3.5 text-lime-400" />
            <span>Autoconsumo vs Red vs Excedentes</span>
          </button>

          <button
            id="tab-chart-eco"
            onClick={() => setActiveTab('economia')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'economia'
                ? 'bg-[#223524] text-[#f1f7ef] shadow-xs border border-[#38543b]'
                : 'text-[#8ba389] hover:text-[#e4efe2]'
            }`}
          >
            <Euro className="w-3.5 h-3.5 text-[#a3e635]" />
            <span>Rentabilidad (€)</span>
          </button>

          <button
            id="tab-chart-bat"
            onClick={() => setActiveTab('bateria')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'bateria'
                ? 'bg-[#223524] text-[#f1f7ef] shadow-xs border border-[#38543b]'
                : 'text-[#8ba389] hover:text-[#e4efe2]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Batería Virtual (€)</span>
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-lime-400" />
          <span className="text-xs font-medium text-[#8fa88d]">Periodo:</span>
          <select
            id="select-chart-period"
            value={selectedYear}
            onChange={(e) => onSelectYear(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#19271c] border border-[#2e4430] rounded-lg text-[#e6f1e3] font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500 shadow-2xs"
          >
            <option value="all">Todo el Histórico ({records.length} meses)</option>
            <optgroup label="Años Naturales">
              {years.map((y) => (
                <option key={y} value={y}>
                  Año {y}
                </option>
              ))}
            </optgroup>
            {cycles.length > 0 && (
              <optgroup label="Ciclos Anuales (Junio-Mayo)">
                {cycles.map((c) => (
                  <option key={c} value={`cycle:${c}`}>
                    Ciclo {c}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="mt-5 h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'generacion' ? (
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2e20" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8ca68a' }} stroke="#293d2b" />
              <YAxis unit=" kWh" tick={{ fontSize: 11, fill: '#8ca68a' }} stroke="#293d2b" />
              <Tooltip content={<CustomKwhTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: '#c4d7c1' }} />
              <Bar dataKey="produccionReal" name="Producción Real" fill="#eab308" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="consumoReal" name="Consumo Vivienda" fill="#4d6b52" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Line
                type="monotone"
                dataKey="produccionTeorica"
                name="Producción Teórica"
                stroke="#84cc16"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#84cc16' }}
              />
            </ComposedChart>
          ) : activeTab === 'desglose' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2e20" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8ca68a' }} stroke="#293d2b" />
              <YAxis unit=" kWh" tick={{ fontSize: 11, fill: '#8ca68a' }} stroke="#293d2b" />
              <Tooltip content={<CustomKwhTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: '#c4d7c1' }} />
              <Area
                type="monotone"
                dataKey="autoconsumo"
                name="Autoconsumo Solar"
                stackId="1"
                stroke="#84cc16"
                fill="#84cc16"
                fillOpacity={0.65}
              />
              <Area
                type="monotone"
                dataKey="excedentes"
                name="Excedentes Vertidos"
                stackId="2"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.45}
              />
              <Area
                type="monotone"
                dataKey="consumoRed"
                name="Consumo Red"
                stackId="3"
                stroke="#f43f5e"
                fill="#f43f5e"
                fillOpacity={0.35}
              />
            </AreaChart>
          ) : activeTab === 'economia' ? (
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2e20" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8ca68a' }} stroke="#293d2b" />
              <YAxis unit=" €" tick={{ fontSize: 11, fill: '#8ca68a' }} stroke="#293d2b" />
              <Tooltip content={<CustomEurosTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: '#c4d7c1' }} />
              <Bar dataKey="ahorroDirecto" name="Ahorro Directo" fill="#a3e635" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="facturaReal" name="Factura Real Pagada" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Line
                type="monotone"
                dataKey="valorExcedentes"
                name="Compensación Excedentes"
                stroke="#2dd4bf"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2e20" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8ca68a' }} stroke="#293d2b" />
              <YAxis unit=" €" tick={{ fontSize: 11, fill: '#8ca68a' }} stroke="#293d2b" />
              <Tooltip content={<CustomEurosTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: '#c4d7c1' }} />
              <Area
                type="monotone"
                dataKey="quedaBateriaSb"
                name="Saldo Batería Virtual (Solar Bank)"
                stroke="#38bdf8"
                fill="#0284c7"
                fillOpacity={0.4}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
