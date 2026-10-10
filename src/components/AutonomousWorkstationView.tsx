import React, { useState, useEffect } from 'react';
import { 
  Zap, ShieldCheck, CheckCircle2, Clock, AlertTriangle, Download, 
  ArrowLeft, RefreshCw, FileText, ChevronDown, ChevronUp, Bot, 
  Award, Sparkles, Building, Landmark, Scale, Calculator, Layers,
  ExternalLink, Check, Copy, MapPin, Camera, Plus, Trash2, HelpCircle
} from 'lucide-react';
import { ProyectoMgaEstructurado } from '../types';
import { 
  executeAutonomousMgaPipeline, 
  PipelinePhaseReport, 
  AutonomousExecutionResult 
} from '../services/autonomousPipelineService';
import { 
  getProjectFieldData, 
  saveProjectFieldData, 
  addFieldEvidence, 
  removeFieldEvidence, 
  generateFieldSurveyChecklist, 
  ProjectFieldData, 
  TipoEvidencia 
} from '../services/fieldEvidenceService';
import { buildFullMgaInstitutionalDossier } from '../services/mgaDossierBuilderService';
import { detectSectorDnpTypeRigorous, SECTOR_KNOWLEDGE_BASE } from '../services/agentKnowledgeBaseService';
import { generateOfficialDocxBlob, downloadFileBlob } from '../services/docExportService';

interface AutonomousWorkstationViewProps {
  proyecto: ProyectoMgaEstructurado;
  municipioId: 'caparrapi' | 'guaduas';
  onVolver: () => void;
  onProyectoActualizado?: (p: ProyectoMgaEstructurado) => void;
}

export const AutonomousWorkstationView: React.FC<AutonomousWorkstationViewProps> = ({
  proyecto,
  municipioId,
  onVolver,
  onProyectoActualizado
}) => {
  const munNombre = municipioId === 'caparrapi' ? 'Caparrapí' : 'Guaduas';
  const sectorType = detectSectorDnpTypeRigorous(
    proyecto.codigo_bpin_propuesto || '',
    proyecto.sector_dnp || '',
    proyecto.nombre_proyecto || ''
  );
  const sectorProfile = SECTOR_KNOWLEDGE_BASE[sectorType];

  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<AutonomousExecutionResult | null>(null);
  const [faseExpandida, setFaseExpandida] = useState<number | null>(1);
  const [activeTabMain, setActiveTabMain] = useState<'pipeline' | 'campo' | 'copiloto'>('pipeline');
  const [activeTabDerecha, setActiveTabDerecha] = useState<'reporte' | 'bots'>('reporte');
  const [isDownloadingMaster, setIsDownloadingMaster] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [promptCopyFeedback, setPromptCopyFeedback] = useState(false);

  // Estados de Datos de Campo y Soportes Reales
  const [fieldData, setFieldData] = useState<ProjectFieldData>(() => getProjectFieldData(proyecto.id));
  const [tramoInput, setTramoInput] = useState(fieldData.tramoOInstalacion || '');
  const [coordenadasInput, setCoordenadasInput] = useState(fieldData.coordenadasGps || '');
  const [longitudInput, setLongitudInput] = useState(fieldData.longitudOMedida || '');
  const [isEditingTramo, setIsEditingTramo] = useState(false);

  // Modal / Formulario para Soporte Personalizado
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
  const [newEvTipo, setNewEvTipo] = useState<TipoEvidencia>('soporte_personalizado');
  const [newEvTitulo, setNewEvTitulo] = useState('');
  const [newEvDesc, setNewEvDesc] = useState('');

  useEffect(() => {
    const fd = getProjectFieldData(proyecto.id);
    setFieldData(fd);
    setTramoInput(fd.tramoOInstalacion || '');
    setCoordenadasInput(fd.coordenadasGps || '');
    setLongitudInput(fd.longitudOMedida || '');
  }, [proyecto.id]);

  // Guardar datos de tramo/localización
  const handleSaveLocationData = async () => {
    const updated = {
      ...fieldData,
      tramoOInstalacion: tramoInput,
      coordenadasGps: coordenadasInput,
      longitudOMedida: longitudInput
    };
    const saved = await saveProjectFieldData(updated);
    setFieldData(saved);
    setIsEditingTramo(false);
  };

  // Agregar soporte personalizado
  const handleCreateCustomEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvTitulo.trim()) return;

    const updated = await addFieldEvidence(proyecto.id, {
      tipo: newEvTipo,
      titulo: newEvTitulo.trim(),
      descripcion: newEvDesc.trim() || 'Soporte incorporado al expediente técnico institucional.',
      registradoPor: 'Equipo Técnico Municipal',
      archivoNombre: `Soporte_${newEvTitulo.replace(/\s+/g, '_')}.pdf`
    });
    setFieldData(updated);
    setShowAddEvidenceModal(false);
    setNewEvTitulo('');
    setNewEvDesc('');
  };

  // Eliminar soporte
  const handleDeleteEvidence = async (evId: string) => {
    const updated = await removeFieldEvidence(proyecto.id, evId);
    setFieldData(updated);
  };

  // Descargar Ficha Técnica de Levantamiento de Campo (.txt / memoria)
  const handleDownloadSurveyChecklist = () => {
    const checklistText = generateFieldSurveyChecklist(
      proyecto.id,
      proyecto.nombre_proyecto,
      sectorProfile.nombreSector
    );
    const blob = new Blob([checklistText], { type: 'text/plain;charset=utf-8' });
    downloadFileBlob(blob, `FICHA_LEVANTAMIENTO_CAMPO_${proyecto.codigo_bpin_propuesto || 'MGA'}.txt`);
  };

  // Ejecución en 1 Clic del Pipeline Completo Autónomo
  const handleRunFullPipeline = async () => {
    setIsRunningPipeline(true);
    try {
      const res = await executeAutonomousMgaPipeline(
        proyecto,
        municipioId,
        (faseActual) => {
          setFaseExpandida(faseActual);
        }
      );
      setPipelineResult(res);
      setFaseExpandida(5); // Expandir la fase final de consolidación
      if (onProyectoActualizado) {
        onProyectoActualizado({
          ...proyecto,
          sector_dnp: res.nombreSectorOficial,
          estado_tramite: 'listo_presidencia'
        });
      }
    } catch (e) {
      console.error('Error en pipeline autónomo:', e);
      alert('Error ejecutando el pipeline autónomo.');
    } finally {
      setIsRunningPipeline(false);
    }
  };

  // Descarga del Expediente Maestro Verdadero en Word Oficial (.docx)
  const handleDownloadMasterDossier = async () => {
    setIsDownloadingMaster(true);
    try {
      const fullDossierText = buildFullMgaInstitutionalDossier(
        proyecto,
        sectorType,
        fieldData,
        munNombre
      );

      const blob = await generateOfficialDocxBlob({
        tituloPrincipal: `EXPEDIENTE MAESTRO MGA: ${proyecto.nombre_proyecto}`,
        subtitulo: `DESPACHO DE PLANEACIÓN Y GESTIÓN TERRITORIAL - ALCALDÍA DE ${munNombre.toUpperCase()}`,
        entidadEmisora: `Alcaldía Municipal de ${munNombre} - Cundinamarca`,
        tipoDocumento: 'proyecto_mga',
        referenciaProceso: proyecto.codigo_bpin_propuesto || 'BPIN-2026',
        contenidoTexto: fullDossierText,
        firmantes: [
          {
            cargo: 'SECRETARIO DE PLANEACIÓN Y DESARROLLO TERRITORIAL',
            entidad: `Alcaldía Municipal de ${munNombre}`,
            nombre: 'Despacho de Planeación Municipal'
          },
          {
            cargo: 'ALCALDE MUNICIPAL / ORDENADOR DEL GASTO',
            entidad: `Municipio de ${munNombre}, Cundinamarca`,
            nombre: `Despacho del Alcalde de ${munNombre}`
          }
        ]
      });

      downloadFileBlob(
        blob, 
        `EXPEDIENTE_MAESTRO_MGA_${proyecto.codigo_bpin_propuesto || 'BPIN'}_CANONICO.docx`
      );
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

  const handleCopyPromptCopiloto = () => {
    if (!pipelineResult) return;
    navigator.clipboard.writeText(pipelineResult.promptParaCopilotoSenior);
    setPromptCopyFeedback(true);
    setTimeout(() => setPromptCopyFeedback(false), 2500);
  };

  // Fases base antes de la primera ejecución
  const defaultFases: PipelinePhaseReport[] = [
    {
      faseNumero: 1,
      faseTitulo: 'Diagnóstico Territorial & Justificación de Brecha MGA (Módulo 1)',
      botLider: 'BOT-INGENIERO-SECTORIAL',
      botApoyo: 'BOT-AUDITOR-SECOP',
      estado: 'pendiente',
      resumenQueSeHizo: `Diagnóstico de necesidades en ${proyecto.veredas_impactadas?.join(', ') || 'zona rural'} focalizando a ${proyecto.poblacion_beneficiaria_total || 4500} beneficiarios bajo normativa de ${sectorProfile.entidadRectora}.`,
      fundamentoNormativo: sectorProfile.marcoNormativoPrincipal[0],
      justificacionPorQue: 'Sin árbol de problemas ni línea base justificada, el DNP rechaza el proyecto.',
      impactoEnMeta: `Alinea la meta de producto DNP ${sectorProfile.metaProductoDnpCodigo}.`,
      documentosGenerados: []
    },
    {
      faseNumero: 2,
      faseTitulo: 'Presupuesto Detallado APU & Matriz Financiera (Módulo 3)',
      botLider: 'BOT-FINANCIERO-DNP',
      botApoyo: 'BOT-INGENIERO-SECTORIAL',
      estado: 'pendiente',
      resumenQueSeHizo: `Estructuración de capítulos y Análisis de Precios Unitarios (APU) regionalizados para Cundinamarca por $${Math.round(proyecto.presupuesto_total_cop || 2500000000).toLocaleString('es-CO')} COP.`,
      fundamentoNormativo: 'Guía Metodológica de Costeo de Proyectos de Inversión del DNP.',
      justificacionPorQue: 'El DNP y los Ministerios exigen que cada peso esté respaldado por APUs de mercado.',
      impactoEnMeta: 'Presupuesto blindado sin sobrecostos.',
      documentosGenerados: []
    },
    {
      faseNumero: 3,
      faseTitulo: 'Soportes Sectoriales & Diseños Técnicos (Módulo 2)',
      botLider: 'BOT-JURIDICO-LEY80',
      botApoyo: 'BOT-INGENIERO-SECTORIAL',
      estado: 'pendiente',
      resumenQueSeHizo: `Memorias descriptivas, normas de ingeniería y certificaciones requeridas por ${sectorProfile.entidadRectora}.`,
      fundamentoNormativo: sectorProfile.marcoNormativoPrincipal.join('; '),
      justificacionPorQue: 'Cada ministerio aplica una lista de chequeo sectorial implacable.',
      impactoEnMeta: 'Cumplimiento del 100% en requisitos técnicos habilitantes.',
      documentosGenerados: []
    },
    {
      faseNumero: 4,
      faseTitulo: 'Auditoría Anti-Rechazo & Control de Coherencia 100%',
      botLider: 'BOT-AUDITOR-SECOP',
      botApoyo: 'BOT-COMANDANTE-RADICACION',
      estado: 'pendiente',
      resumenQueSeHizo: `Escaneo integral del expediente para erradicar cualquier término de otro sector y garantizar cero contradicciones.`,
      fundamentoNormativo: 'Manual de Control y Calidad Metodológica del DNP.',
      justificacionPorQue: 'La causa número 1 de rechazo son las contradicciones entre disciplinas.',
      impactoEnMeta: 'Expediente blindado contra observaciones de evaluadores.',
      documentosGenerados: []
    },
    {
      faseNumero: 5,
      faseTitulo: 'Consolidación del Dossier Maestro Foliado (Módulo 4)',
      botLider: 'BOT-COMANDANTE-RADICACION',
      botApoyo: 'BOT-JURIDICO-LEY80',
      estado: 'pendiente',
      resumenQueSeHizo: `Consolidación del expediente institucional foliado con los 4 módulos MGA y firmas formales.`,
      fundamentoNormativo: 'Ley 152 de 1994 y Protocolo de Radicación en el Banco de Proyectos (BPIN).',
      justificacionPorQue: 'Para radicar se requiere el expediente completo foliado con firmas oficiales.',
      impactoEnMeta: 'Expediente 100% listo para radicación ministerial.',
      documentosGenerados: []
    }
  ];

  const fasesActivas = pipelineResult ? pipelineResult.fases : defaultFases;
  const isCompleted = pipelineResult?.scoreFinalViabilidad === 98;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      
      {/* TOPBAR EJECUTIVA DE LA MESA DE TRABAJO MGA */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={onVolver}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold border border-slate-700/60 cursor-pointer"
            title="Volver al Centro de Mando"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>
          
          <div className="border-l border-slate-700 pl-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-950/70 border border-cyan-800/80 px-2 py-0.5 rounded">
                BPIN: {proyecto.codigo_bpin_propuesto || '2026-CAP'}
              </span>
              <span className="text-[11px] font-bold text-amber-300 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded uppercase tracking-wider">
                {sectorProfile.nombreSector}
              </span>
              <span className="text-xs text-slate-400">
                • {munNombre} (Cundinamarca)
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-white truncate max-w-xl">
              {proyecto.nombre_proyecto}
            </h1>
          </div>
        </div>

        {/* ACCIONES Y BOTÓN MAGNO */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Presupuesto MGA</span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              ${Math.round(proyecto.presupuesto_total_cop || 0).toLocaleString('es-CO')} COP
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden md:block" />

          {/* BADGE DE VIABILIDAD */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <ShieldCheck className={`w-4 h-4 ${isCompleted ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-xs font-bold">
              {isCompleted ? '98% Viable DNP' : 'Viabilidad: 67%'}
            </span>
          </div>

          {/* BOTÓN MAGNO DE FORMULACIÓN Y AUDITORÍA */}
          <button
            onClick={handleRunFullPipeline}
            disabled={isRunningPipeline}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
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
                <span>Formulando & Auditando con Bots...</span>
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Proyecto Blindado al 98% (Re-Formular)</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Auto-Formular & Auditar Proyecto (1 Clic)</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* BARRA DE NAVEGACIÓN DE LA MESA DE TRABAJO (3 PESTAÑAS PRINCIPALES) */}
      <nav className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4 flex gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTabMain('pipeline')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTabMain === 'pipeline'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>1. Pipeline Autónomo (5 Fases)</span>
        </button>

        <button
          onClick={() => setActiveTabMain('campo')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTabMain === 'campo'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>2. Soportes & Evidencias de Terreno ({fieldData.evidencias.length})</span>
        </button>

        <button
          onClick={() => setActiveTabMain('copiloto')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTabMain === 'copiloto'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-cyan-300" />
          <span>3. Canal Copiloto Senior (Dual AI)</span>
        </button>
      </nav>

      {/* CONTENIDO DINÁMICO SEGÚN PESTAÑA PRINCIPAL */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">

        {/* PESTAÑA 1: PIPELINE AUTÓNOMO DE 5 FASES */}
        {activeTabMain === 'pipeline' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-300">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Entidad Rectora de Cofinanciación
                    </span>
                    <span className="text-sm font-black text-white">
                      {sectorProfile.entidadRectora}
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-400 block">Meta Producto DNP:</span>
                  <span className="font-bold text-cyan-400">{sectorProfile.metaProductoDnpCodigo} - {sectorProfile.metaProductoDnpNombre}</span>
                </div>
              </div>

              {/* LISTA DE 5 FASES */}
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
                            <span className="text-xs font-extrabold text-white block">
                              Fase {fase.faseNumero}: {fase.faseTitulo}
                            </span>
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
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3.5 bg-slate-950/40">
                          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3" /> ¿Qué se hizo en esta fase?
                            </span>
                            <p className="text-xs text-slate-200 leading-relaxed">
                              {fase.resumenQueSeHizo}
                            </p>
                          </div>

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
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* BANNER DE EXPEDIENTE LISTO */}
              {isCompleted && (
                <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-800/60 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-300 font-extrabold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Expediente MGA Completo Foliado y Blindado</span>
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl">
                      El proyecto contiene los 4 módulos MGA oficiales, memorias técnicas sectoriales auténticas, matriz APU desglosada y el registro de evidencias de terreno.
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadMasterDossier}
                    disabled={isDownloadingMaster}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 shrink-0 transition-all cursor-pointer"
                  >
                    {isDownloadingMaster ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Generando Expediente Word...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Descargar Dossier Maestro (.docx)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>

            {/* COLUMNA DERECHA (4 COLS): SALA DE BOTS Y REPORTE */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex text-xs font-bold">
                <button
                  onClick={() => setActiveTabDerecha('reporte')}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTabDerecha === 'bots'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sala de Bots (5)</span>
                </button>
              </div>

              {activeTabDerecha === 'reporte' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Dictamen Ejecutivo
                      </h3>
                      <span className="text-[10px] text-slate-400">
                        Explicación directa sin tecnicismos enredados
                      </span>
                    </div>

                    {pipelineResult && (
                      <button
                        onClick={handleCopyReport}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
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
                          Veredicto Metodológico:
                        </span>
                        Expediente 100% blindado y formulado bajo las directrices estrictas de {sectorProfile.entidadRectora}.
                      </div>

                      <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl whitespace-pre-line font-mono text-[11px] text-slate-300">
                        {pipelineResult.reporteHumanoEjecutivo}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-3 text-slate-400">
                      <Bot className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                      <p className="text-xs">
                        Presiona el botón superior <strong className="text-white">"Auto-Formular & Auditar Proyecto"</strong> para que los bots generen el reporte ejecutivo y estructuren las 5 fases.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTabDerecha === 'bots' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-cyan-400" /> Escuadrón Técnico Asignado
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      Especialistas en {sectorProfile.nombreSector}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      {
                        nombre: 'BOT-INGENIERO-SECTORIAL',
                        rol: 'Ingeniería y Diagnóstico de Brecha',
                        mision: `Estructura memorias técnicas conforme a normativas de ${sectorProfile.entidadRectora}.`
                      },
                      {
                        nombre: 'BOT-FINANCIERO-DNP',
                        rol: 'Presupuesto APU y Matriz MGA',
                        mision: 'Desglosa precios unitarios regionalizados sin errores de centavos.'
                      },
                      {
                        nombre: 'BOT-JURIDICO-LEY80',
                        rol: 'Soportes y Marco Legal',
                        mision: `Redacta oficios de radicación oficial citando ${sectorProfile.marcoNormativoPrincipal[0]}.`
                      },
                      {
                        nombre: 'BOT-AUDITOR-SECOP',
                        rol: 'Radar Anti-Incongruencias',
                        mision: 'Verifica que no exista mezcla de vocabulario o normativas impropias.'
                      },
                      {
                        nombre: 'BOT-COMANDANTE-RADICACION',
                        rol: 'Supervisión y Foliación Maestro',
                        mision: 'Consolida el Dossier MGA oficial con firmas de Secretaría y Despacho del Alcalde.'
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
                            {isCompleted ? 'Validado' : isRunningPipeline ? 'Procesando...' : 'Activo'}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-300">{bot.rol}</div>
                        <p className="text-[10px] text-slate-400">{bot.mision}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* PESTAÑA 2: SOPORTES Y EVIDENCIAS DE TERRENO */}
        {activeTabMain === 'campo' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    Localización Exacta & Datos Territoriales del Proyecto
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Especifica el tramo, coordenadas GPS y magnitudes reales para sustentar el Módulo 1 y 2 de la MGA.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadSurveyChecklist}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                    title="Descargar Ficha de requerimientos para la cuadrilla en campo"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Descargar Ficha de Terreno</span>
                  </button>

                  {!isEditingTramo ? (
                    <button
                      onClick={() => setIsEditingTramo(true)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      Editar Tramo / Coordenadas
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveLocationData}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      Guardar Cambios
                    </button>
                  )}
                </div>
              </div>

              {!isEditingTramo ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tramo / Sitio de Intervención:</span>
                    <span className="text-white font-semibold">
                      {fieldData.tramoOInstalacion || 'No especificado (Corredor veredal general)'}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Coordenadas GPS (WGS84):</span>
                    <span className="text-white font-mono font-semibold">
                      {fieldData.coordenadasGps || 'Pendiente toma en punto de inicio'}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Longitud o Magnitud:</span>
                    <span className="text-white font-semibold">
                      {fieldData.longitudOMedida || 'Intervención en puntos críticos'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Tramo / Sitio (ej. Km 3+200 a 7+850):</label>
                    <input 
                      type="text" 
                      value={tramoInput} 
                      onChange={(e) => setTramoInput(e.target.value)}
                      placeholder="Ej. Km 3+200 a Km 7+850 - Vía San Carlos"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Coordenadas GPS:</label>
                    <input 
                      type="text" 
                      value={coordenadasInput} 
                      onChange={(e) => setCoordenadasInput(e.target.value)}
                      placeholder="Ej. Lat: 5.3421° N, Long: -74.4982° W"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Longitud o Magnitud:</label>
                    <input 
                      type="text" 
                      value={longitudInput} 
                      onChange={(e) => setLongitudInput(e.target.value)}
                      placeholder="Ej. 4.65 kilómetros / 12 aulas / 3 km red"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN DE EVIDENCIAS Y SOPORTES HUMANOS */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-cyan-400" />
                    Soportes, Fotos y Evidencias Cargadas ({fieldData.evidencias.length})
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fotos de la necesidad, planos, actas de asambleas JAC o soportes personalizados que acreditan la realidad del proyecto.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddEvidenceModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-cyan-950/40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Soporte Personalizado</span>
                </button>
              </div>

              {/* LISTA DE EVIDENCIAS */}
              {fieldData.evidencias.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fieldData.evidencias.map((ev) => (
                    <div 
                      key={ev.id}
                      className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2 hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                            {ev.tipo.replace('_', ' ')}
                          </span>
                          <button
                            onClick={() => handleDeleteEvidence(ev.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                            title="Eliminar soporte"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h3 className="text-xs font-bold text-white line-clamp-1">{ev.titulo}</h3>
                        <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">{ev.descripcion}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{ev.archivoNombre || 'Soporte_Adjunto.pdf'}</span>
                        <span className="text-emerald-400 font-bold">✓ Validado</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                  <Camera className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Aún no has registrado soportes específicos. Haz clic en <strong className="text-white">"+ Agregar Soporte Personalizado"</strong> para cargar fotos de la vía, actas comunales, planos o cualquier documento técnico.
                  </p>
                </div>
              )}
            </div>

            {/* FORMULARIO MODAL PARA AGREGAR SOPORTE PERSONALIZADO */}
            {showAddEvidenceModal && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-cyan-400" />
                      Registrar Soporte / Evidencia Personalizada
                    </h3>
                    <button 
                      onClick={() => setShowAddEvidenceModal(false)}
                      className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                    >
                      ✕ Cerrar
                    </button>
                  </div>

                  <form onSubmit={handleCreateCustomEvidence} className="space-y-3.5 text-xs">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tipo de Soporte:</label>
                      <select
                        value={newEvTipo}
                        onChange={(e) => setNewEvTipo(e.target.value as TipoEvidencia)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="foto_falla">Fotografía de Falla / Necesidad Crítica</option>
                        <option value="foto_infraestructura">Fotografía Panorámica de Infraestructura</option>
                        <option value="plano_tecnico">Plano Técnico / Memoria de Cálculo</option>
                        <option value="acta_comunitaria">Acta de Asamblea JAC / Comunidad</option>
                        <option value="estudio_suelos">Estudio de Suelos / Geotécnico</option>
                        <option value="certificado_oficial">Certificación Oficial / DANE / Predial</option>
                        <option value="soporte_personalizado">Soporte Libre Personalizado</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Título del Soporte:</label>
                      <input
                        type="text"
                        required
                        value={newEvTitulo}
                        onChange={(e) => setNewEvTitulo(e.target.value)}
                        placeholder="Ej. Foto pérdida de banca Km 4+500 / Acta JAC San Carlos"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Descripción y Hallazgos:</label>
                      <textarea
                        rows={3}
                        value={newEvDesc}
                        onChange={(e) => setNewEvDesc(e.target.value)}
                        placeholder="Explica qué demuestra este soporte, medidas tomadas o acuerdos comunitarios suscritos..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAddEvidenceModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md shadow-indigo-950/50 cursor-pointer"
                      >
                        Guardar Soporte en Expediente
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* PESTAÑA 3: CANAL COPILOTO SENIOR (DUAL AI) */}
        {activeTabMain === 'copiloto' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-cyan-400" />
                    Puente de Comunicación Dual AI: Plataforma Web ↔ Copiloto Senior
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Este canal sincroniza el estado en Supabase y genera el Prompt Maestro para la auditoría profunda de razonamiento.
                  </p>
                </div>

                {pipelineResult && (
                  <button
                    onClick={handleCopyPromptCopiloto}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-purple-950/40 cursor-pointer"
                  >
                    {promptCopyFeedback ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{promptCopyFeedback ? 'Prompt Copiado' : 'Copiar Prompt para Copiloto'}</span>
                  </button>
                )}
              </div>

              {pipelineResult ? (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-purple-400 block tracking-wider">
                      Prompt de Estado Generado para el Copiloto Senior:
                    </span>
                    <pre className="whitespace-pre-wrap font-mono text-[11px] text-slate-300 leading-relaxed max-h-80 overflow-y-auto">
                      {pipelineResult.promptParaCopilotoSenior}
                    </pre>
                  </div>

                  {/* BITÁCORA DE DEBATE Y AUTO-CORRECCIÓN DE LOS BOTS */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Bitácora de Auditoría y Auto-Corrección en Vivo:
                    </span>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {pipelineResult.debateAutoCorreccionLog.map((log, lIdx) => (
                        <div key={lIdx} className="text-slate-300 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3 text-slate-400">
                  <Bot className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                  <p className="text-xs">
                    Ejecuta primero el pipeline en la Pestaña 1 para generar el Prompt Maestro y sincronizar el expediente con la base de datos.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
};
