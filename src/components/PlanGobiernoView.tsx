import React, { useState } from 'react';
import { BaseProposal } from '../types';
import { formatCOP } from '../utils/formatters';
import { CheckCircle2, AlertTriangle, Zap, Filter, ArrowRight, Award, ShoppingBag } from 'lucide-react';

interface PlanGobiernoViewProps {
  proposals: BaseProposal[];
  onSelectProposal: (proposal: BaseProposal) => void;
}

export const PlanGobiernoView: React.FC<PlanGobiernoViewProps> = ({
  proposals,
  onSelectProposal
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('Todos');

  const sectors = ['Todos', 'Infancia y Familia', 'Agua Potable y Saneamiento', 'Educación y Conectividad', 'Campo y Desarrollo Agrícola'];

  const filteredProposals = selectedSector === 'Todos'
    ? proposals
    : proposals.filter(p => p.sector === selectedSector);

  const totalPresupuesto = filteredProposals.reduce((sum, p) => sum + p.presupuestoTotalCop, 0);

  return (
    <div className="space-y-6">
      
      {/* Visual Header Banner */}
      <div className="frosted-glass rounded-3xl p-6 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
            🌿 Manifiesto Obras Reales vs Megaobras Burocráticas
          </span>
          <h2 className="text-2xl font-extrabold text-white">
            Plan de Gobierno <span className="text-emerald-400">Guaduas 2024-2027</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Soluciones inmediatas a necesidades críticas: Parques infantiles iluminados, motobombas con EcoFlow solar, Starlink veredal y la Ruta Campesina.
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-right shrink-0">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Presupuesto Total Sector</span>
          <span className="text-xl font-extrabold text-emerald-400 font-mono">{formatCOP(totalPresupuesto)}</span>
        </div>
      </div>

      {/* Clean Sector Selector Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full">
        <Filter className="w-4 h-4 text-emerald-400 shrink-0" />
        {sectors.map((sec, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedSector(sec)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedSector === sec
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Minimalist Visual Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProposals.map((p) => (
          <div
            key={p.id}
            className="frosted-glass-interactive rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-950 text-amber-400 border border-amber-500/30">
                {p.codigo}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                {p.sector}
              </span>
            </div>

            {/* Title */}
            <div>
              <h3 className="text-lg font-bold text-white mb-1">{p.titulo}</h3>
              <p className="text-xs text-slate-300 line-clamp-2">{p.diagnostico}</p>
            </div>

            {/* Visual Contrast Pill */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-rose-950/30 border border-rose-500/20 p-2.5 rounded-xl text-rose-300">
                <span className="font-bold text-[10px] uppercase block text-rose-400">❌ Políticos Tradicionales:</span>
                <span className="text-[11px] line-clamp-2">"{p.contrastePolitico}"</span>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-200">
                <span className="font-bold text-[10px] uppercase block text-emerald-400">✅ Método Ramitos:</span>
                <span className="text-[11px] line-clamp-2">{p.solucionPragmatica}</span>
              </div>
            </div>

            {/* Insumos & Budget Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Inversión Inmediata</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  {formatCOP(p.presupuestoTotalCop)}
                </span>
              </div>

              <button
                onClick={() => onSelectProposal(p)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md"
              >
                <span>Ficha Ejecutiva</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
