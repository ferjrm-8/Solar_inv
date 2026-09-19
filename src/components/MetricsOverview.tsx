import { Sun, Battery, TrendingUp, PiggyBank, Zap, ArrowUpRight, ShieldCheck, Leaf } from 'lucide-react';
import { SolarRecord, SolarSettings } from '../types/solar';

interface Props {
  records: SolarRecord[];
  settings: SolarSettings;
}

export function MetricsOverview({ records, settings }: Props) {
  if (!records || records.length === 0) {
    return null;
  }

  // Aggregate stats
  const totalProduccionReal = records.reduce((acc, r) => acc + (r.produccionReal || 0), 0);
  const totalProduccionTeorica = records.reduce((acc, r) => acc + (r.produccionTeoricaTotal || 0), 0);
  const totalConsumoReal = records.reduce((acc, r) => acc + (r.consumoTotalReal || 0), 0);
  const totalAutoconsumo = records.reduce((acc, r) => acc + (r.autoconsumo || 0), 0);
  const totalExcedentes = records.reduce((acc, r) => acc + (r.excedentes || 0), 0);

  const totalAhorroDirecto = records.reduce((acc, r) => acc + (r.ahorroDirecto || 0), 0);
  const totalValorExcedentes = records.reduce((acc, r) => acc + (r.valorExcedentes || 0), 0);

  // Latest virtual battery balance
  const lastRecord = records[records.length - 1];
  const currentBateriaSb = lastRecord?.quedaBateriaSb || 0;

  // Percentage metrics
  const cumplimientoTeorico = totalProduccionTeorica > 0 
    ? ((totalProduccionReal / totalProduccionTeorica) * 100).toFixed(1) 
    : '0';

  const autarquiaSolar = totalConsumoReal > 0 
    ? ((totalAutoconsumo / totalConsumoReal) * 100).toFixed(1) 
    : '0';

  const amortizacionPorcentaje = settings.inversionTotal > 0
    ? Math.min(100, (totalAhorroDirecto / settings.inversionTotal) * 100).toFixed(1)
    : '0';

  const mesesFacturaCero = records.filter((r) => r.facturaReal === 0).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Producción Solar */}
      <div className="p-4 bg-[#141f16]/90 backdrop-blur-sm rounded-2xl border border-[#253927] shadow-sm flex flex-col justify-between hover:border-[#355138] transition-colors">
        <div className="flex items-center justify-between text-[#8fa88d] mb-1">
          <span className="text-xs font-semibold">Producción Solar</span>
          <div className="p-1.5 rounded-lg bg-[#1e2f20] text-amber-300 border border-[#2e4631]">
            <Sun className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-extrabold text-[#f1f6ef] tracking-tight">
            {totalProduccionReal.toLocaleString('es-ES', { maximumFractionDigits: 0 })}{' '}
            <span className="text-xs font-normal text-[#8fa88d]">kWh</span>
          </div>
          <div className="text-[11px] text-lime-400 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>{cumplimientoTeorico}% vs teórica</span>
          </div>
        </div>
      </div>

      {/* 2. Autoconsumo & Autarquía */}
      <div className="p-4 bg-[#141f16]/90 backdrop-blur-sm rounded-2xl border border-[#253927] shadow-sm flex flex-col justify-between hover:border-[#355138] transition-colors">
        <div className="flex items-center justify-between text-[#8fa88d] mb-1">
          <span className="text-xs font-semibold">Autoconsumo</span>
          <div className="p-1.5 rounded-lg bg-[#1e2f20] text-lime-400 border border-[#2e4631]">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-extrabold text-[#f1f6ef] tracking-tight">
            {totalAutoconsumo.toLocaleString('es-ES', { maximumFractionDigits: 0 })}{' '}
            <span className="text-xs font-normal text-[#8fa88d]">kWh</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1">
            {autarquiaSolar}% cobertura hogar
          </div>
        </div>
      </div>

      {/* 3. Excedentes Vertidos */}
      <div className="p-4 bg-[#141f16]/90 backdrop-blur-sm rounded-2xl border border-[#253927] shadow-sm flex flex-col justify-between hover:border-[#355138] transition-colors">
        <div className="flex items-center justify-between text-[#8fa88d] mb-1">
          <span className="text-xs font-semibold">Excedentes</span>
          <div className="p-1.5 rounded-lg bg-[#1e2f20] text-teal-300 border border-[#2e4631]">
            <Battery className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-extrabold text-[#f1f6ef] tracking-tight">
            {totalExcedentes.toLocaleString('es-ES', { maximumFractionDigits: 0 })}{' '}
            <span className="text-xs font-normal text-[#8fa88d]">kWh</span>
          </div>
          <div className="text-[11px] text-teal-400 font-medium mt-1">
            {totalValorExcedentes.toLocaleString('es-ES', { maximumFractionDigits: 0 })} € compensados
          </div>
        </div>
      </div>

      {/* 4. Ahorro Total Acumulado */}
      <div className="p-4 bg-gradient-to-b from-[#182a1b] to-[#122014] rounded-2xl border border-lime-700/50 shadow-md flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between text-lime-300 mb-1">
          <span className="text-xs font-bold flex items-center gap-1">
            <Leaf className="w-3.5 h-3.5 text-lime-400" />
            Ahorro Directo
          </span>
          <div className="p-1.5 rounded-lg bg-lime-950/80 text-lime-400 border border-lime-800/60">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-extrabold text-[#bef264] tracking-tight">
            {totalAhorroDirecto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs font-normal text-lime-300">€</span>
          </div>
          <div className="text-[11px] text-emerald-300 font-semibold mt-1 flex items-center justify-between">
            <span>{amortizacionPorcentaje}% amortizado</span>
            <span className="text-[10px] text-lime-400/80 font-normal">
              de {settings.inversionTotal.toLocaleString('es-ES')} €
            </span>
          </div>
        </div>
      </div>

      {/* 5. Batería Virtual Actual */}
      <div className="p-4 bg-[#141f16]/90 backdrop-blur-sm rounded-2xl border border-[#253927] shadow-sm flex flex-col justify-between hover:border-[#355138] transition-colors">
        <div className="flex items-center justify-between text-[#8fa88d] mb-1">
          <span className="text-xs font-semibold">Batería Virtual</span>
          <div className="p-1.5 rounded-lg bg-[#1e2f20] text-cyan-400 border border-[#2e4631]">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-extrabold text-cyan-200 tracking-tight">
            {currentBateriaSb.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs font-normal text-[#8fa88d]">€</span>
          </div>
          <div className="text-[11px] text-cyan-400 font-medium mt-1">
            Saldo monedero SB
          </div>
        </div>
      </div>

      {/* 6. Meses Factura 0€ */}
      <div className="p-4 bg-[#141f16]/90 backdrop-blur-sm rounded-2xl border border-[#253927] shadow-sm flex flex-col justify-between hover:border-[#355138] transition-colors">
        <div className="flex items-center justify-between text-[#8fa88d] mb-1">
          <span className="text-xs font-semibold">Facturas 0,00 €</span>
          <div className="p-1.5 rounded-lg bg-[#1e2f20] text-emerald-400 border border-[#2e4631]">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-extrabold text-emerald-300 tracking-tight">
            {mesesFacturaCero}{' '}
            <span className="text-xs font-normal text-[#8fa88d]">meses</span>
          </div>
          <div className="text-[11px] text-[#8fa88d] font-medium mt-1">
            de {records.length} registrados
          </div>
        </div>
      </div>
    </div>
  );
}
