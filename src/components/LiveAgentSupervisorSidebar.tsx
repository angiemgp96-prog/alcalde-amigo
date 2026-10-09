import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, Scale, Calculator, Briefcase, Award, 
  Layers, Landmark, ShieldAlert, Sparkles, RefreshCw, CheckCircle2, 
  Download, FileText, ChevronRight, ChevronLeft, Bot, Eye, BellRing,
  CheckCircle, ArrowUpRight, Zap
} from 'lucide-react';
import { OrchestrationReport, AgentIncongruence, AgentDebateMessage } from '../services/agentOrchestratorService';
import { generateOfficialDocxBlob, downloadFileBlob } from '../services/docExportService';

interface LiveAgentSupervisorSidebarProps {
  report: OrchestrationReport;
  onRerunAnalysis: () => Promise<void>;
  isRunningAnalysis: boolean;
  entidadNombre: string;
  procesoIdOProyecto: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  tipoVista?: 'mga_proyecto' | 'licitacion_secop';
}

export const LiveAgentSupervisorSidebar: React.FC<LiveAgentSupervisorSidebarProps> = ({
  report,
  onRerunAnalysis,
  isRunningAnalysis,
  entidadNombre,
  procesoIdOProyecto,
  isCollapsed = false,
  onToggleCollapse,
  tipoVista = 'mga_proyecto'
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'debate' | 'notificaciones'>('radar');
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const getSeverityBadge = (sev: AgentIncongruence['severidad']) => {
    switch (sev) {
      case 'critico_descalificacion':
        return { label: 'CRÍTICO / RECHAZO', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'advertencia_puntaje':
        return { label: 'ADVERTENCIA', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'mejora_estrategica':
        return { label: 'OPTIMIZACIÓN', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      default:
        return { label: 'AUDITORÍA', bg: 'bg-slate-500/20 text-slate-300 border-slate-500/40' };
    }
  };

  const getBotVisualInfo = (deAgente: string) => {
    const lower = deAgente.toLowerCase();
    if (lower.includes('juridico') || lower.includes('ley80')) {
      return { emoji: '⚖️', nombre: 'BOT-JURIDICO-LEY80', border: 'border-blue-500/40 bg-blue-950/60 text-blue-300' };
    }
    if (lower.includes('ingeniero') || lower.includes('sectorial') || lower.includes('tecnico') || lower.includes('unspsc')) {
      return { emoji: '📐', nombre: 'BOT-INGENIERO-SECTORIAL', border: 'border-amber-500/40 bg-amber-950/60 text-amber-300' };
    }
    if (lower.includes('financiero') || lower.includes('dnp') || lower.includes('apu') || lower.includes('aiu')) {
      return { emoji: '💰', nombre: 'BOT-FINANCIERO-DNP', border: 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300' };
    }
    if (lower.includes('auditor') || lower.includes('secop') || lower.includes('riesgo') || lower.includes('ambiental')) {
      return { emoji: '🛡️', nombre: 'BOT-AUDITOR-SECOP', border: 'border-purple-500/40 bg-purple-950/60 text-purple-300' };
    }
    return { emoji: '⭐', nombre: 'BOT-COMANDANTE-RADICACION', border: 'border-cyan-500/40 bg-cyan-950/60 text-cyan-300' };
  };

  const handleExportarAuditoriaDocx = async () => {
    setIsExportingDocx(true);
    try {
      const lineas: string[] = [];
      lineas.push(`DICTAMEN OFICIAL DE AUDITORÍA Y SUPERVISIÓN MULTI-BOT`);
      lineas.push(`ENTIDAD / JURISDICCIÓN: ${entidadNombre.toUpperCase()}`);
      lineas.push(`PROCESO / EXPEDIENTE BPIN: ${procesoIdOProyecto}`);
      lineas.push(`FECHA: ${new Date().toLocaleDateString('es-CO')} | ESTADO: ${report.veredictoFinal.toUpperCase()}`);
      lineas.push(`\nSCORE DE BLINDAJE TÉCNICO-LEGAL: ${report.scoreViabilidadGlobal}/100\n`);
      lineas.push(`1. RESUMEN EJECUTIVO DE LOS BOTS ESPECIALISTAS:`);
      lineas.push(report.resumenEjecutivo);
      lineas.push(`\n2. RADAR DE INCONGRUENCIAS DETECTADAS (${report.incongruencias.length}):`);
      report.incongruencias.forEach((inc, idx) => {
        lineas.push(`[${idx + 1}] [${inc.severidad.toUpperCase()}] ${inc.titulo}`);
        lineas.push(`    - Emisor: ${inc.agenteEmisor} -> Receptor: ${inc.agenteDestino || 'Equipo General'}`);
        lineas.push(`    - Causa: ${inc.descripcionCausa}`);
        lineas.push(`    - Impacto: ${inc.impactoLegalOFinanciero}`);
        lineas.push(`    - Solución aplicada: ${inc.solucionAplicada}\n`);
      });
      lineas.push(`\n3. DELIBERACIÓN DE LA MESA DE DEBATE TÉCNICA:`);
      report.debateLog.forEach((deb) => {
        lineas.push(`${deb.deAgente} (${deb.rolTitulo}): "${deb.mensaje}"`);
      });

      const blob = await generateOfficialDocxBlob({
        tituloPrincipal: `DICTAMEN DE AUDITORÍA BOTS ESPECIALISTAS: ${procesoIdOProyecto}`,
        subtitulo: `SALA TÉCNICA Y RADAR DE BLINDAJE INSTITUCIONAL - ${entidadNombre.toUpperCase()}`,
        entidadEmisora: entidadNombre,
        tipoDocumento: tipoVista === 'mga_proyecto' ? 'proyecto_mga' : 'licitacion_secop',
        referenciaProceso: procesoIdOProyecto,
        contenidoTexto: lineas.join('\n')
      });

      downloadFileBlob(blob, `AUDITORIA_MASTER_BOTS_${procesoIdOProyecto.replace(/[^a-zA-Z0-9]/g, '_')}.docx`);
    } catch (e) {
      console.error(e);
      alert('Error generando documento de auditoría.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-slate-950/95 border-l border-slate-800 flex flex-col items-center py-4 gap-4 z-30 transition-all shadow-2xl">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer shadow-md"
          title="Expandir Supervisión de Bots Especialistas"
        >
          <ChevronLeft className="w-4 h-4 text-emerald-400" />
        </button>
        <div className="flex flex-col items-center gap-3 writing-mode-vertical text-[10px] font-black uppercase tracking-widest text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="rotate-90 mt-8">BOTS EN VIVO</span>
        </div>
      </aside>
    );
  }

  const criticosCount = report.incongruencias.filter(i => i.severidad === 'critico_descalificacion').length;

  return (
    <aside className="w-full xl:w-[380px] bg-slate-950/95 border-l border-slate-800/90 flex flex-col h-full z-20 shadow-2xl backdrop-blur-xl shrink-0">
      
      {/* 1. HEADER DE SUPERVISIÓN EN VIVO */}
      <div className="p-4 border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                <span>Bots Especialistas en Vivo</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Radar 24/7 en Vivo • Cero Datos Inventados</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onRerunAnalysis}
              disabled={isRunningAnalysis}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 cursor-pointer disabled:opacity-50"
              title="Re-auditar expediente"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRunningAnalysis ? 'animate-spin' : ''}`} />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 cursor-pointer"
                title="Colapsar panel"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Semáforo de Viabilidad Global */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Score de Viabilidad</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-black ${report.scoreViabilidadGlobal >= 90 ? 'text-emerald-400' : report.scoreViabilidadGlobal >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                {report.scoreViabilidadGlobal}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono">/ 100%</span>
            </div>
          </div>

          <div className="text-right space-y-0.5">
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-block ${
              report.veredictoFinal === 'APTO_PARA_RADICACION' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
              report.veredictoFinal === 'EN_OPTIMIZACION' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
              'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {report.veredictoFinal.replace(/_/g, ' ')}
            </span>
            <p className="text-[9px] text-slate-400 font-mono">
              {criticosCount > 0 ? `${criticosCount} alertas críticas` : '100% blindado'}
            </p>
          </div>
        </div>

        {/* 4 Bots Especialistas Activos */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {[
            { id: 'ing', nombre: 'BOT-ING', rol: 'Ingeniería', icon: '📐', active: true },
            { id: 'jur', nombre: 'BOT-JUR', rol: 'Ley 80', icon: '⚖️', active: true },
            { id: 'fin', nombre: 'BOT-FIN', rol: 'APU DNP', icon: '💰', active: true },
            { id: 'aud', nombre: 'BOT-AUD', rol: 'Control', icon: '🛡️', active: true }
          ].map(bot => (
            <div key={bot.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-1.5 text-center flex flex-col items-center">
              <span className="text-xs">{bot.icon}</span>
              <span className="text-[8px] font-black text-white uppercase mt-0.5">{bot.nombre}</span>
              <span className="text-[7px] text-emerald-400 font-mono">Activo ✓</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. SELECTOR DE PESTAÑAS */}
      <div className="flex border-b border-slate-800/80 bg-slate-950 text-xs shrink-0">
        <button
          onClick={() => setActiveTab('radar')}
          className={`flex-1 py-2.5 px-2 text-center font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'radar'
              ? 'border-b-2 border-emerald-400 text-emerald-300 bg-slate-900/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Radar ({report.incongruencias.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('debate')}
          className={`flex-1 py-2.5 px-2 text-center font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'debate'
              ? 'border-b-2 border-cyan-400 text-cyan-300 bg-slate-900/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Mesa Debate</span>
        </button>

        <button
          onClick={() => setActiveTab('notificaciones')}
          className={`flex-1 py-2.5 px-2 text-center font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'notificaciones'
              ? 'border-b-2 border-indigo-400 text-indigo-300 bg-slate-900/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>Feed Avances</span>
        </button>
      </div>

      {/* 3. CONTENIDO DEL PANEL CON SCROLL SUAVE */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        
        {/* PESTAÑA A: RADAR DE INCONGRUENCIAS Y ALERTAS SECTORIALES */}
        {activeTab === 'radar' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                Detección de Riesgos y Mezclas Indebidas
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                {report.incongruencias.filter(i => i.resuelto).length} resueltos
              </span>
            </div>

            {report.incongruencias.length === 0 ? (
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-white">¡Expediente 100% Coherente!</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  No se detectaron mezclas de normatividad ni discordancias de rubros.
                </p>
              </div>
            ) : (
              report.incongruencias.map((inc) => {
                const badge = getSeverityBadge(inc.severidad);
                const botInfo = getBotVisualInfo(inc.agenteEmisor);

                return (
                  <div key={inc.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2 hover:border-slate-700 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs">{botInfo.emoji}</span>
                        <span className="text-[9px] font-mono font-bold text-slate-300">{botInfo.nombre}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                      {inc.resuelto ? (
                        <span className="text-[9px] font-black text-emerald-400 font-mono flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> Blindado
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-rose-400 font-mono flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> Requiere Acción
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white leading-snug">{inc.titulo}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{inc.descripcionCausa}</p>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="text-[9px] text-rose-300/90 font-mono">
                        <strong className="text-rose-400">Riesgo si no se corrige:</strong> {inc.impactoLegalOFinanciero}
                      </div>
                      <div className="text-[9px] text-emerald-300/90 font-mono">
                        <strong className="text-emerald-400">Solución aplicada por los bots:</strong> {inc.solucionAplicada}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PESTAÑA B: MESA DE DEBATE ENTRE BOTS */}
        {activeTab === 'debate' && (
          <div className="space-y-3 animate-fadeIn">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">
              Deliberación Técnica en Tiempo Real
            </span>

            {report.debateLog.map((deb) => {
              const botInfo = getBotVisualInfo(deb.deAgente);
              return (
                <div key={deb.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{botInfo.emoji}</span>
                      <strong className="text-white font-mono">{botInfo.nombre}</strong>
                      <span className="text-slate-500 font-mono">({deb.rolTitulo})</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">{deb.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-mono pl-5 border-l-2 border-slate-700">
                    "{deb.mensaje}"
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* PESTAÑA C: NOTIFICACIONES DE AVANCE Y RADICACIÓN */}
        {activeTab === 'notificaciones' && (
          <div className="space-y-3 animate-fadeIn">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">
              Bitácora de Cumplimiento
            </span>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <h5 className="text-xs font-bold text-white">Misión del Expediente</h5>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                {report.misionPrincipal}
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                <h5 className="text-xs font-bold text-white">Resumen Ejecutivo de los Bots</h5>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                {report.resumenEjecutivo}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. FOOTER: EXPORTAR AUDITORÍA OFICIAL EN WORD (.DOCX) */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950 shrink-0">
        <button
          onClick={handleExportarAuditoriaDocx}
          disabled={isExportingDocx}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all disabled:opacity-50"
        >
          {isExportingDocx ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Generando Word Oficial...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Dictamen de Bots (.docx)</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
