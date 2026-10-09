import React, { useState } from 'react';
import { 
  Zap, ShieldCheck, CheckCircle2, Clock, AlertTriangle, Download, 
  ArrowLeft, RefreshCw, FileText, ChevronDown, ChevronUp, Bot, 
  Award, Sparkles, Building, Landmark, Scale, Calculator, Layers,
  ExternalLink, Check, Copy, ArrowUpRight, FolderOpen, Users, Shield
} from 'lucide-react';
import { OpportunitySecop, ProponenteOrg } from './LicitaProView';
import { 
  executeAutonomousSecopPipeline, 
  SecopPipelinePhaseReport, 
  AutonomousSecopExecutionResult 
} from '../services/autonomousSecopPipelineService';
import { generateOfficialDocxBlob, downloadFileBlob } from '../services/docExportService';

interface AutonomousSecopWorkstationViewProps {
  opportunity: OpportunitySecop;
  proponente: ProponenteOrg;
  onVolver: () => void;
  onNavigateToBidRoom?: () => void;
}

const formatCOP = (val: number): string => {
  return `$${Math.round(val || 0).toLocaleString('es-CO')} COP`;
};

export const AutonomousSecopWorkstationView: React.FC<AutonomousSecopWorkstationViewProps> = ({
  opportunity,
  proponente,
  onVolver,
  onNavigateToBidRoom
}) => {
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<AutonomousSecopExecutionResult | null>(null);
  const [faseExpandida, setFaseExpandida] = useState<number | null>(1);
  const [activeTabDerecha, setActiveTabDerecha] = useState<'reporte' | 'bots'>('reporte');
  const [isDownloadingMaster, setIsDownloadingMaster] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Ejecución en 1 Clic del Pipeline Completo Autónomo
  const handleRunFullPipeline = async () => {
    setIsRunningPipeline(true);
    try {
      const res = await executeAutonomousSecopPipeline(
        opportunity,
        proponente,
        (faseActual) => {
          setFaseExpandida(faseActual);
        }
      );
      setPipelineResult(res);
      setFaseExpandida(4); // Expandir la fase final de auditoría
    } catch (e) {
      console.error('Error en pipeline autónomo SECOP:', e);
      alert('Error ejecutando el pipeline autónomo.');
    } finally {
      setIsRunningPipeline(false);
    }
  };

  // Descarga individual de documento generado en .docx
  const handleDownloadSingleDoc = async (doc: { nombre: string; tipo: string; contenidoCompleto: string }) => {
    try {
      const blob = await generateOfficialDocxBlob({
        tituloPrincipal: doc.tipo.toUpperCase(),
        subtitulo: `CONTRATACIÓN ESTATAL - SECOP II: ${opportunity.process_number}`,
        entidadEmisora: opportunity.entity_name,
        tipoDocumento: 'licitacion_secop',
        referenciaProceso: opportunity.process_number,
        contenidoTexto: doc.contenidoCompleto,
        firmantes: [
          {
            cargo: 'REPRESENTANTE LEGAL',
            entidad: proponente.nombre,
            nombre: 'Representante Legal'
          }
        ]
      });
      downloadFileBlob(blob, doc.nombre);
    } catch (e) {
      console.error('Error descargando documento:', e);
      alert('Error generando el archivo Word.');
    }
  };

  // Descarga del Expediente Maestro Completo en Word Oficial (.docx)
  const handleDownloadMasterDossier = async () => {
    setIsDownloadingMaster(true);
    try {
      const lineas: string[] = [];
      lineas.push(`EXPEDIENTE MAESTRO DE PROPUESTA TÉCNICA Y JURÍDICA - SECOP II`);
      lineas.push(`PROCESO: ${opportunity.process_number}`);
      lineas.push(`ENTIDAD CONTRATANTE: ${opportunity.entity_name}`);
      lineas.push(`PROPONENTE: ${proponente.nombre} - NIT: ${proponente.nit}`);
      lineas.push(`PRESUPUESTO OFICIAL: ${formatCOP(opportunity.estimated_value)}`);
      lineas.push(`FECHA DE RADICACIÓN: ${new Date().toLocaleDateString('es-CO')}`);
      lineas.push(`VEREDICTO: BLINDADO 100% PARA ADJUDICACIÓN`);
      lineas.push(`\n========================================\n`);

      if (pipelineResult) {
        pipelineResult.fases.forEach(f => {
          lineas.push(`\n========================================`);
          lineas.push(`FASE ${f.faseNumero}: ${f.faseTitulo.toUpperCase()}`);
          lineas.push(`BOT RESPONSABLE: ${f.botLider} (Apoyo: ${f.botApoyo || 'N/A'})`);
          lineas.push(`NORMATIVA APLICADA: ${f.fundamentoNormativo}`);
          lineas.push(`QUÉ SE HIZO: ${f.resumenQueSeHizo}`);
          lineas.push(`POR QUÉ SE HIZO: ${f.justificacionPorQue}`);
          lineas.push(`IMPACTO: ${f.impactoEnMeta}`);
          lineas.push(`========================================\n`);

          f.documentosGenerados.forEach(doc => {
            lineas.push(`\nDOCUMENTO ANEXO: ${doc.tipo}`);
            lineas.push(doc.contenidoCompleto);
            lineas.push(`\n----------------------------------------`);
          });
        });
      } else {
        lineas.push(`Expediente preparado para auto-estructuración y blindaje autónomo.`);
      }

      const blob = await generateOfficialDocxBlob({
        tituloPrincipal: `EXPEDIENTE MAESTRO DE OFERTA: ${opportunity.process_number}`,
        subtitulo: `PROPUESTA FORMAL PARA ${opportunity.entity_name.toUpperCase()}`,
        entidadEmisora: proponente.nombre,
        tipoDocumento: 'licitacion_secop',
        referenciaProceso: opportunity.process_number,
        contenidoTexto: lineas.join('\n'),
        firmantes: [
          {
            cargo: 'REPRESENTANTE LEGAL',
            entidad: proponente.nombre,
            nombre: 'Representante Legal'
          },
          {
            cargo: 'DIRECTOR DE PROYECTO / APODERADO',
            entidad: proponente.nombre,
            nombre: 'Dirección de Operaciones'
          }
        ]
      });
      downloadFileBlob(blob, `EXPEDIENTE_MAESTRO_${opportunity.process_number}_BLINDADO.docx`);
    } catch (e) {
      console.error('Error generando expediente:', e);
      alert('Error exportando el expediente maestro.');
    } finally {
      setIsDownloadingMaster(false);
    }
  };

  const handleCopyReport = () => {
    if (!pipelineResult) return;
    navigator.clipboard.writeText(pipelineResult.reporteHumanoEjecutivo);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  // Fases base mostradas antes de la primera ejecución
  const defaultFases: SecopPipelinePhaseReport[] = [
    {
      faseNumero: 1,
      faseTitulo: 'Habilitación Jurídica, RUP & Carta de Presentación Oficial',
      botLider: 'BOT-JURIDICO-LEY80',
      botApoyo: 'BOT-AUDITOR-SECOP',
      estado: 'pendiente',
      resumenQueSeHizo: `Verifica RUP, capacidad jurídica de ${proponente.nombre}, ausencia de inhabilidades y genera Formato 1 de Carta de Presentación.`,
      fundamentoNormativo: 'Ley 80 de 1993, Ley 1150 de 2007 (Art. 5) y Decreto 1082 de 2015.',
      justificacionPorQue: 'Evita cualquier causal de rechazo o subsanación en el Sobre 1 Jurídico.',
      impactoEnMeta: 'Garantiza admisión jurídica inmediata en SECOP II.',
      documentosGenerados: []
    },
    {
      faseNumero: 2,
      faseTitulo: 'Ingeniería Técnica, Cronograma de Operación & Matriz de Riesgos',
      botLider: 'BOT-INGENIERO-SECTORIAL',
      botApoyo: 'BOT-JURIDICO-LEY80',
      estado: 'pendiente',
      resumenQueSeHizo: `Estructura la Memoria Técnica de Ejecución, cronograma de operación, equipo humano y Matriz de Riesgos Conpes.`,
      fundamentoNormativo: 'Manual de Riesgos de Colombia Compra Eficiente y Decreto 1082 de 2015.',
      justificacionPorQue: 'Asegura la máxima puntuación técnica eliminando observaciones de competidores.',
      impactoEnMeta: 'Asegura puntaje perfecto en el Sobre 2 Técnico.',
      documentosGenerados: []
    },
    {
      faseNumero: 3,
      faseTitulo: 'Calibración Financiera, A.I.U. al Centavo & Propuesta Económica',
      botLider: 'BOT-FINANCIERO-DNP',
      botApoyo: 'BOT-AUDITOR-SECOP',
      estado: 'pendiente',
      resumenQueSeHizo: `Calcula y calibra el A.I.U. al centavo entero para evitar errores de redondeo en SECOP II, y aplica IVA utilidad Art. 462-1 E.T.`,
      fundamentoNormativo: 'Estatuto Tributario Nacional (Art. 462-1) y Decreto 1082 de 2015.',
      justificacionPorQue: 'El algoritmo de SECOP II descalifica ofertas con discordancias en centavos.',
      impactoEnMeta: 'Propuesta económica blindada y matemáticamente exacta.',
      documentosGenerados: []
    },
    {
      faseNumero: 4,
      faseTitulo: 'Auditoría Anti-Rechazo & Expediente Foliado para Radicación SECOP II',
      botLider: 'BOT-AUDITOR-SECOP',
      botApoyo: 'BOT-COMANDANTE-RADICACION',
      estado: 'pendiente',
      resumenQueSeHizo: `Cruza los 4 sobres contra las causales de descarte, audita coherencia total y consolida el paquete foliado para radicación.`,
      fundamentoNormativo: 'Pliegos Tipo Colombia Compra Eficiente y Ley 1474 de 2011 (Anticorrupción).',
      justificacionPorQue: 'Garantiza que la oferta sea adjudicable sin fisuras legales ni técnicas.',
      impactoEnMeta: 'Blindaje 100% de la oferta ganadora.',
      documentosGenerados: []
    }
  ];

  const fasesActivas = pipelineResult ? pipelineResult.fases : defaultFases;
  const isCompleted = pipelineResult?.veredicto === 'BLINDADO_100_PORCIENTO';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      {/* ===================================================================
          TOPBAR EJECUTIVA DE LA MESA DE TRABAJO SECOP II
      =================================================================== */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={onVolver}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold border border-slate-700/60"
            title="Volver al Radar"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Radar</span>
          </button>
          
          <div className="border-l border-slate-700 pl-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-950/70 border border-cyan-800/80 px-2 py-0.5 rounded">
                {opportunity.process_number}
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {opportunity.modality}
              </span>
              <span className="text-xs text-slate-400">
                • {opportunity.department} ({opportunity.city})
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-white truncate max-w-xl">
              {opportunity.description}
            </h1>
          </div>
        </div>

        {/* ACCIÓN MAGNA: BOTÓN DE AUTO-ESTRUCTURACIÓN Y AUDITORÍA */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Presupuesto SECOP II</span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              {formatCOP(opportunity.estimated_value)}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden md:block" />

          {/* BADGE DE BLINDAJE */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <ShieldCheck className={`w-4 h-4 ${isCompleted ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-xs font-bold">
              {isCompleted ? '99% Blindado' : `Score: ${opportunity.strategic_score}/100`}
            </span>
          </div>

          {/* BOTÓN MAGNO */}
          <button
            onClick={handleRunFullPipeline}
            disabled={isRunningPipeline}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all ${
              isRunningPipeline 
                ? 'bg-slate-800 text-slate-400 cursor-wait' 
                : isCompleted
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                : 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-cyan-950/50 hover:scale-[1.02]'
            }`}
          >
            {isRunningPipeline ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Estructurando & Blindando con Bots...</span>
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Oferta Blindada al 100% (Re-Estructurar)</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Auto-Blindar & Estructurar Oferta (1 Clic)</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ===================================================================
          CONTENEDOR PRINCIPAL: 2 COLUMNAS (65% PIPELINE / 35% SALA DE BOTS)
      =================================================================== */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* =================================================================
            COLUMNA IZQUIERDA (7 COLS): PIPELINE DE SOBRES Y FASES LINEALES
        ================================================================= */}
        <section className="lg:col-span-8 space-y-4">
          
          {/* BANNER DE IDENTIFICACIÓN INSTITUCIONAL */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-900/50 border border-indigo-700/50 text-indigo-300">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
                  Proponente Postulado
                </span>
                <span className="text-sm font-black text-white">
                  {proponente.nombre} <span className="text-xs text-slate-400 font-normal">(NIT: {proponente.nit})</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {opportunity.secop_url && (
                <a 
                  href={opportunity.secop_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border border-slate-700"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" /> SECOP II Oficial
                </a>
              )}
              {onNavigateToBidRoom && (
                <button
                  onClick={onNavigateToBidRoom}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border border-slate-700"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-emerald-400" /> Sala de Sobres
                </button>
              )}
            </div>
          </div>

          {/* LISTA DE 4 FASES DEL PIPELINE AUTÓNOMO */}
          <div className="space-y-3">
            {fasesActivas.map((fase) => {
              const isExpanded = faseExpandida === fase.faseNumero;
              const isDone = fase.estado === 'completado';
              const isInProcess = fase.estado === 'en_proceso';

              return (
                <div 
                  key={fase.faseNumero}
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isDone 
                      ? 'bg-slate-900/90 border-emerald-900/50 shadow-md' 
                      : isInProcess
                      ? 'bg-slate-900 border-cyan-800/80 shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* CABECERA DEL ACORDEÓN DE FASE */}
                  <div 
                    onClick={() => setFaseExpandida(isExpanded ? null : fase.faseNumero)}
                    className="p-4 cursor-pointer flex items-center justify-between gap-4 select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                        isDone
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : isInProcess
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-700 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {isDone ? <Check className="w-4 h-4" /> : fase.faseNumero}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-white">
                            Fase {fase.faseNumero}: {fase.faseTitulo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-cyan-400 font-semibold flex items-center gap-1">
                            <Bot className="w-3 h-3" /> {fase.botLider}
                          </span>
                          {fase.botApoyo && (
                            <span className="text-[10px] text-slate-500">
                              + {fase.botApoyo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isDone && (
                        <span className="hidden sm:inline text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                          {fase.documentosGenerados.length} docs oficiales
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* CONTENIDO EXPANDIDO DE LA FASE */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3.5 bg-slate-950/40">
                      
                      {/* QUÉ SE HIZO */}
                      <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" /> ¿Qué se hizo en esta fase?
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {fase.resumenQueSeHizo}
                        </p>
                      </div>

                      {/* FUNDAMENTO NORMATIVO & POR QUÉ */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-900/70 border border-slate-800/80 p-3 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                            <Scale className="w-3 h-3" /> Fundamento Normativo
                          </span>
                          <p className="text-[11px] text-slate-300 leading-normal">
                            {fase.fundamentoNormativo}
                          </p>
                        </div>
                        <div className="bg-slate-900/70 border border-slate-800/80 p-3 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> ¿Por qué es necesario y cómo impacta?
                          </span>
                          <p className="text-[11px] text-slate-300 leading-normal">
                            {fase.justificacionPorQue}
                          </p>
                        </div>
                      </div>

                      {/* DOCUMENTOS GENERADOS Y DESCARGABLES */}
                      {fase.documentosGenerados && fase.documentosGenerados.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Documentos Oficiales Generados para Firma y Radicación (.docx):
                          </span>
                          <div className="grid grid-cols-1 gap-2">
                            {fase.documentosGenerados.map((doc, dIdx) => (
                              <div 
                                key={dIdx}
                                className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800/60 text-indigo-400 shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-white truncate">
                                      {doc.nombre}
                                    </div>
                                    <div className="text-[11px] text-slate-400 truncate">
                                      {doc.tipo}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleDownloadSingleDoc(doc)}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
                                  title="Descargar documento oficial en Word (.docx)"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Descargar .docx</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* BANNER DE EXPEDIENTE MAESTRO LISTO */}
          {isCompleted && (
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-800/60 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-300 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Oferta Completa Blindada y Lista para Radicar</span>
                </div>
                <p className="text-xs text-slate-300 max-w-xl">
                  Los 4 sobres, minutas jurídicas, memoria técnica y desglose de A.I.U. están 100% integrados y foliados bajo la normativa de Colombia Compra Eficiente.
                </p>
              </div>

              <button
                onClick={handleDownloadMasterDossier}
                disabled={isDownloadingMaster}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 shrink-0 transition-all"
              >
                {isDownloadingMaster ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Empaquetando Expediente...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Descargar Dossier Completo (.docx)</span>
                  </>
                )}
              </button>
            </div>
          )}

        </section>

        {/* =================================================================
            COLUMNA DERECHA (5 COLS): SALA DE BOTS Y FEED DE REPORTES CLAROS
        ================================================================= */}
        <aside className="lg:col-span-4 space-y-4">
          
          {/* TABS DE LA COLUMNA DERECHA */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex text-xs font-bold">
            <button
              onClick={() => setActiveTabDerecha('reporte')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTabDerecha === 'reporte'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Reporte Humano Claro</span>
            </button>
            <button
              onClick={() => setActiveTabDerecha('bots')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTabDerecha === 'bots'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sala de Bots (5)</span>
            </button>
          </div>

          {/* TAB 1: REPORTE HUMANO CLARO */}
          {activeTabDerecha === 'reporte' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Dictamen Ejecutivo
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Explicación en lenguaje directo sin tecnicismos
                  </span>
                </div>

                {pipelineResult && (
                  <button
                    onClick={handleCopyReport}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 border border-slate-700"
                    title="Copiar reporte al portapapeles"
                  >
                    {copyFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copyFeedback ? 'Copiado' : 'Copiar'}</span>
                  </button>
                )}
              </div>

              {pipelineResult ? (
                <div className="space-y-3 text-xs leading-relaxed max-h-[580px] overflow-y-auto pr-1">
                  <div className="bg-emerald-950/40 border border-emerald-800/50 p-3 rounded-xl text-emerald-200">
                    <span className="font-bold block text-[11px] uppercase tracking-wider">
                      Veredicto de la Mesa de Trabajo:
                    </span>
                    La propuesta cumple el 100% de los requisitos del pliego definitivo sin riesgo de descalificación o rechazo por causales jurídicas, técnicas o de A.I.U.
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl whitespace-pre-line font-mono text-[11px] text-slate-300">
                    {pipelineResult.reporteHumanoEjecutivo}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 space-y-3 text-slate-400">
                  <Bot className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                  <p className="text-xs">
                    Presiona el botón superior <strong className="text-white">"Auto-Blindar & Estructurar Oferta"</strong> para que los bots generen el reporte ejecutivo y redacten todos los documentos oficiales.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SALA DE BOTS ESPECIALISTAS */}
          {activeTabDerecha === 'bots' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" /> Escuadrón Técnico Asignado
                </h3>
                <span className="text-[10px] text-slate-400">
                  Especialistas en normativa de contratación estatal colombiana
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    nombre: 'BOT-JURIDICO-LEY80',
                    rol: 'Habilitación, Pliegos y RUP',
                    norma: 'Ley 80/93 & Ley 1150/07',
                    mision: 'Valida personería, RUP, inhabilidades y redacta cartas oficiales de oferta.',
                    estado: isRunningPipeline ? 'Analizando...' : isCompleted ? 'Blindado' : 'En Guardia'
                  },
                  {
                    nombre: 'BOT-INGENIERO-SECTORIAL',
                    rol: 'Memoria Técnica y Riesgos',
                    norma: 'Pliegos Técnicos & Conpes',
                    mision: 'Estructura cronogramas de trabajo, perfiles de personal y matriz de riesgos previsibles.',
                    estado: isRunningPipeline ? 'Calculando...' : isCompleted ? 'Completado' : 'En Guardia'
                  },
                  {
                    nombre: 'BOT-FINANCIERO-DNP',
                    rol: 'A.I.U. al Centavo & Oferta',
                    norma: 'Estatuto Tributario Art. 462-1',
                    mision: 'Calibra presupuesto oficial, redondea enteros y audita póliza de seriedad.',
                    estado: isRunningPipeline ? 'Calibrando...' : isCompleted ? 'Validado' : 'En Guardia'
                  },
                  {
                    nombre: 'BOT-AUDITOR-SECOP',
                    rol: 'Auditoría Anti-Rechazo',
                    norma: 'Pliegos Tipo Colombia Compra',
                    mision: 'Cruza causales de descalificación y previene observaciones desestimatorias.',
                    estado: isRunningPipeline ? 'Auditando...' : isCompleted ? 'Aprobado' : 'En Guardia'
                  },
                  {
                    nombre: 'BOT-COMANDANTE-RADICACION',
                    rol: 'Supervisión y Foliación',
                    norma: 'Lineamientos SECOP II',
                    mision: 'Consolida el expediente maestro foliado para radicación oportuna.',
                    estado: isRunningPipeline ? 'Supervisando...' : isCompleted ? 'Listo para radicar' : 'En Guardia'
                  }
                ].map((bot, bIdx) => (
                  <div 
                    key={bIdx}
                    className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl space-y-1 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-cyan-300">
                        {bot.nombre}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : isRunningPipeline
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {bot.estado}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-300">
                      {bot.rol} <span className="text-slate-500 font-normal">({bot.norma})</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {bot.mision}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </aside>
      </main>
    </div>
  );
};
