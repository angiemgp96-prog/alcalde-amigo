import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, Scale, Calculator, Briefcase, Award, 
  Layers, Landmark, ShieldAlert, Sparkles, RefreshCw, CheckCircle2, 
  Download, FileText, ChevronDown, ChevronUp, Bot, ArrowRight
} from 'lucide-react';
import { OrchestrationReport, AgentIncongruence, AgentDebateMessage } from '../services/agentOrchestratorService';
import { generateOfficialDocxBlob, downloadFileBlob } from '../services/docExportService';

interface AgentOrchestratorPanelProps {
  report: OrchestrationReport;
  onRerunAnalysis: () => Promise<void>;
  isRunningAnalysis: boolean;
  entidadNombre: string;
  procesoIdOProyecto: string;
}

export const AgentOrchestratorPanel: React.FC<AgentOrchestratorPanelProps> = ({
  report,
  onRerunAnalysis,
  isRunningAnalysis,
  entidadNombre,
  procesoIdOProyecto
}) => {
  const [activeTab, setActiveTab] = useState<'incongruencias' | 'debate' | 'resumen'>('incongruencias');
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const getSeverityBadge = (sev: AgentIncongruence['severidad']) => {
    switch (sev) {
      case 'critico_descalificacion':
        return {
          label: 'CRÍTICO: CAUSAL DE DESCALIFICACIÓN',
          style: 'bg-rose-500/15 text-rose-300 border-rose-500/40'
        };
      case 'advertencia_puntaje':
        return {
          label: 'ADVERTENCIA: PÉRDIDA DE PUNTAJE',
          style: 'bg-amber-500/15 text-amber-300 border-amber-500/40'
        };
      default:
        return {
          label: 'OPTIMIZACIÓN ESTRATÉGICA',
          style: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
        };
    }
  };

  const handleExportWord = async () => {
    setIsExportingDocx(true);
    try {
      const textoConsolidado = `${report.misionPrincipal}

RESUMEN EJECUTIVO DEL ESTADO MAYOR DE AGENTES:
${report.resumenEjecutivo}

INCONGRUENCIAS DETECTADAS Y BLINDADAS (${report.incongruencias.length}):
${report.incongruencias.map((inc, i) => `
${i + 1}. ${inc.titulo.toUpperCase()}
- Detectado por: ${inc.agenteEmisor} -> ${inc.agenteDestino || 'Commander'}
- Severidad: ${inc.severidad.replace(/_/g, ' ').toUpperCase()}
- Causa Técnica/Jurídica: ${inc.descripcionCausa}
- Impacto Normativo: ${inc.impactoLegalOFinanciero}
- Solución Blindada: ${inc.solucionAplicada}
- Estado: RESUELTO Y CERTIFICADO
`).join('\n')}

HILO DE DEBATE Y CONSENSO MULTI-AGENTE:
${report.debateLog.map(d => `[${d.rolTitulo}] (${d.timestamp}): ${d.mensaje}`).join('\n\n')}

DICTAMEN FINAL DEL COMANDANTE:
Puntaje de Viabilidad: ${report.scoreViabilidadGlobal}/100
Veredicto: ${report.veredictoFinal}
`;

      const blob = await generateOfficialDocxBlob({
        tituloPrincipal: `DICTAMEN TÉCNICO OFICIAL: ${report.commanderTitulo.toUpperCase()}`,
        subtitulo: `ESTADO MAYOR MULTI-AGENTE INTELIGENTE - ${report.veredictoFinal}`,
        entidadEmisora: entidadNombre,
        tipoDocumento: report.commanderId === 'commander_secop' ? 'licitacion_secop' : 'proyecto_mga',
        referenciaProceso: procesoIdOProyecto,
        contenidoTexto: textoConsolidado
      });

      downloadFileBlob(blob, `Expediente_Oficial_${report.commanderId}_${procesoIdOProyecto.replace(/[^a-zA-Z0-9]/g, '_')}.docx`);
    } catch (e) {
      console.error('Error exportando Word:', e);
      alert('Error exportando documento Word formal.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div className="bg-slate-900/95 border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 text-slate-100 animate-fadeIn backdrop-blur-xl">
      
      {/* 1. CABECERA DEL COMANDANTE SUPREMO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-950/80 text-white shrink-0">
            <Bot className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Agente Superior Orquestador
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Score: {report.scoreViabilidadGlobal}/100
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {report.commanderTitulo}
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              <strong>Misión Activa:</strong> {report.misionPrincipal}
            </p>
          </div>
        </div>

        {/* ACCIONES DEL COMANDANTE */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={onRerunAnalysis}
            disabled={isRunningAnalysis}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            title="Re-analizar con los 3 agentes especializados"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRunningAnalysis ? 'animate-spin' : ''}`} />
            <span>{isRunningAnalysis ? 'Auto-analizando...' : 'Re-evaluar Agentes'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportWord}
            disabled={isExportingDocx}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-950/60 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingDocx ? 'Generando Word...' : 'Descargar Expediente en Word (.docx)'}</span>
          </button>
        </div>
      </div>

      {/* 2. TABS DEL ESTADO MAYOR DE AGENTES */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('incongruencias')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'incongruencias'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Monitor de Incongruencias ({report.incongruencias.length} Blindadas)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('debate')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'debate'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Mesa de Debate & Consenso ({report.debateLog.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resumen')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'resumen'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Veredicto y Resumen Ejecutivo</span>
        </button>
      </div>

      {/* 3. TAB 1: MONITOR DE INCONGRUENCIAS DETECTADAS */}
      {activeTab === 'incongruencias' && (
        <div className="space-y-3.5 animate-fadeIn">
          <p className="text-xs text-slate-400">
            Los agentes cruzaron los requerimientos oficiales contra las capacidades reales, detectando estas inconsistencias que habrían causado el rechazo de la propuesta:
          </p>

          <div className="space-y-3">
            {report.incongruencias.map(inc => {
              const badge = getSeverityBadge(inc.severidad);
              return (
                <div
                  key={inc.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 transition-all hover:border-slate-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badge.style}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
                        <span>{inc.agenteEmisor}</span>
                        {inc.agenteDestino && (
                          <>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-400">{inc.agenteDestino}</span>
                          </>
                        )}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Subsanado por IA
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{inc.titulo}</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900/90 border border-slate-800/80 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold uppercase text-rose-400 block">
                        Causa & Riesgo de Descalificación:
                      </span>
                      <p className="text-slate-300 leading-relaxed">{inc.descripcionCausa}</p>
                      <p className="text-slate-400 text-[11px] italic mt-1 font-mono">{inc.impactoLegalOFinanciero}</p>
                    </div>

                    <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                        Solución y Blindaje Aplicado:
                      </span>
                      <p className="text-emerald-100 leading-relaxed">{inc.solucionAplicada}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB 2: MESA DE DEBATE Y CONSENSO MULTI-AGENTE */}
      {activeTab === 'debate' && (
        <div className="space-y-4 animate-fadeIn">
          <p className="text-xs text-slate-400">
            Registro de deliberación autónoma: observa cómo los agentes especializados dialogan, contrastan normas y unifican criterios bajo el mando del Commander:
          </p>

          <div className="space-y-3 font-mono text-xs">
            {report.debateLog.map(d => {
              const isCommander = d.tipo === 'consenso_commander';
              return (
                <div
                  key={d.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCommander
                      ? 'bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border-purple-500/50 shadow-lg'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isCommander ? 'bg-purple-400 animate-pulse' : 'bg-cyan-400'}`} />
                      <strong className={isCommander ? 'text-purple-300 font-extrabold' : 'text-cyan-300'}>
                        {d.deAgente}
                      </strong>
                      <span className="text-[10px] text-slate-500 hidden sm:inline">({d.rolTitulo})</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{d.timestamp}</span>
                  </div>
                  <p className={`leading-relaxed font-sans ${isCommander ? 'text-white font-semibold' : 'text-slate-300'}`}>
                    {d.mensaje}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB 3: RESUMEN EJECUTIVO */}
      {activeTab === 'resumen' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Veredicto Oficial: {report.veredictoFinal}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {report.resumenEjecutivo}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1 font-sans">
              <p className="font-bold text-white">Descarga formal para presentación:</p>
              <p>
                Puedes presionar el botón <strong>"Descargar Expediente en Word (.docx)"</strong> en la parte superior para obtener el documento oficial con membrete formal, estructura tipográfica de acto administrativo y firmas, listo para presentar en SECOP II o ante el Ministerio correspondiente.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
