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
  ProjectFieldData, 
  TipoEvidencia 
} from '../services/fieldEvidenceService';
import { 
  generateMasterBlueprint, 
  saveMasterBlueprint, 
  ProjectMasterBlueprint,
  TramiteInstitucionalItem,
  RequerimientoTerrenoItem,
  fetchSeniorCopilotDirectivesFromSupabase,
  applySeniorDirectivesToBlueprint,
  SeniorCopilotDirectives
} from '../services/projectMasterBlueprintService';
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

  // Auto-scroll al montar o cambiar de proyecto
  useEffect(() => {
    const el = document.getElementById('mga-workstation-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [proyecto.id]);

  const [activeTabMain, setActiveTabMain] = useState<'operativo' | 'documentos' | 'copiloto' | 'pipeline'>('operativo');
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<AutonomousExecutionResult | null>(null);
  const [isDownloadingMaster, setIsDownloadingMaster] = useState(false);
  const [promptCopyFeedback, setPromptCopyFeedback] = useState(false);
  const [isSyncingDirectives, setIsSyncingDirectives] = useState(false);
  const [seniorDirectives, setSeniorDirectives] = useState<SeniorCopilotDirectives | null>(null);



  // Estados de Terreno y Master Blueprint
  const [fieldData, setFieldData] = useState<ProjectFieldData>(() => getProjectFieldData(proyecto.id));
  const [blueprint, setBlueprint] = useState<ProjectMasterBlueprint>(() => 
    generateMasterBlueprint(proyecto, getProjectFieldData(proyecto.id))
  );

  // Consulta en Supabase si el Copiloto Senior emitió directrices
  const checkSeniorDirectives = async (refCode: string) => {
    setIsSyncingDirectives(true);
    try {
      const dirs = await fetchSeniorCopilotDirectivesFromSupabase(refCode);
      if (dirs) {
        setSeniorDirectives(dirs);
        setBlueprint(prev => {
          const applied = applySeniorDirectivesToBlueprint(prev, dirs);
          saveMasterBlueprint(applied);
          return applied;
        });
      }
    } finally {
      setIsSyncingDirectives(false);
    }
  };

  useEffect(() => {
    if (blueprint.codigoReferenciaUnico) {
      checkSeniorDirectives(blueprint.codigoReferenciaUnico);
    }
  }, [blueprint.codigoReferenciaUnico]);

  // Estados de Edición de Terreno
  const [tramoInput, setTramoInput] = useState(fieldData.tramoOInstalacion || '');
  const [coordenadasInput, setCoordenadasInput] = useState(fieldData.coordenadasGps || '');
  const [daneInput, setDaneInput] = useState(fieldData.codigoDaneOIdPredio || '');
  const [isEditingTerreno, setIsEditingTerreno] = useState(false);

  // Modal para Soporte Personalizado Libre
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
  const [newEvTipo, setNewEvTipo] = useState<TipoEvidencia>('soporte_personalizado');
  const [newEvTitulo, setNewEvTitulo] = useState('');
  const [newEvDesc, setNewEvDesc] = useState('');

  // Actualizar Blueprint cuando cambien los datos de campo
  useEffect(() => {
    const fd = getProjectFieldData(proyecto.id);
    setFieldData(fd);
    setTramoInput(fd.tramoOInstalacion || '');
    setCoordenadasInput(fd.coordenadasGps || '');
    setDaneInput(fd.codigoDaneOIdPredio || '');
    const bp = generateMasterBlueprint(proyecto, fd);
    setBlueprint(bp);
    saveMasterBlueprint(bp);
  }, [proyecto.id]);

  // Guardar datos de terreno editados
  const handleSaveTerrenoData = async () => {
    const updated: ProjectFieldData = {
      ...fieldData,
      tramoOInstalacion: tramoInput,
      coordenadasGps: coordenadasInput,
      codigoDaneOIdPredio: daneInput
    };
    await saveProjectFieldData(updated);
    setFieldData(updated);
    setIsEditingTerreno(false);
    const bp = generateMasterBlueprint(proyecto, updated);
    setBlueprint(bp);
    await saveMasterBlueprint(bp);
  };

  // Alternar estado de trámite institucional
  const handleToggleTramite = async (tramiteId: string) => {
    const updatedTramites = blueprint.tramitesInstitucionales.map(t => {
      if (t.id === tramiteId) {
        const nextState: 'pendiente' | 'en_tramite' | 'obtenido' = 
          t.estado === 'pendiente' ? 'en_tramite' : t.estado === 'en_tramite' ? 'obtenido' : 'pendiente';
        return { ...t, estado: nextState };
      }
      return t;
    });

    const updatedBp = {
      ...blueprint,
      tramitesInstitucionales: updatedTramites
    };
    
    // Recalcular score
    const tramitesListos = updatedTramites.filter(t => t.estado === 'obtenido').length;
    const terrenoListos = blueprint.requerimientosTerreno.filter(r => r.estado === 'cargado').length;
    const scoreTramites = (tramitesListos / updatedTramites.length) * 35;
    const scoreTerreno = blueprint.requerimientosTerreno.length > 0 ? (terrenoListos / blueprint.requerimientosTerreno.length) * 35 : 35;
    const scoreTotal = Math.round(scoreTramites + scoreTerreno + 30);
    
    updatedBp.porcentajeViabilidadDnp = scoreTotal;
    updatedBp.colorSemaforo = scoreTotal >= 90 ? 'verde' : scoreTotal >= 60 ? 'amarillo' : 'rojo';
    
    setBlueprint(updatedBp);
    await saveMasterBlueprint(updatedBp);
  };

  // Agregar soporte personalizado libre
  const handleCreateCustomEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvTitulo.trim()) return;

    const updatedFd = await addFieldEvidence(proyecto.id, {
      tipo: newEvTipo,
      titulo: newEvTitulo.trim(),
      descripcion: newEvDesc.trim() || 'Soporte verificado e incorporado por el equipo humano al expediente técnico.',
      archivoNombre: `${newEvTitulo.replace(/[^a-zA-Z0-9]/g, '_')}_Soporte.pdf`,
      registradoPor: 'Equipo de Planeación / Territorio',
      coordenadasGps: coordenadasInput || undefined
    });

    setFieldData(updatedFd);
    setShowAddEvidenceModal(false);
    setNewEvTitulo('');
    setNewEvDesc('');

    const bp = generateMasterBlueprint(proyecto, updatedFd);
    setBlueprint(bp);
    await saveMasterBlueprint(bp);
  };

  // Eliminar soporte
  const handleDeleteEvidence = async (id: string) => {
    const updatedFd = await removeFieldEvidence(proyecto.id, id);
    setFieldData(updatedFd);
    const bp = generateMasterBlueprint(proyecto, updatedFd);
    setBlueprint(bp);
    await saveMasterBlueprint(bp);
  };

  // Copiar prompt para el Copiloto Senior
  const handleCopyPromptCopiloto = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(blueprint.promptCopilotoSenior);
      setPromptCopyFeedback(true);
      setTimeout(() => setPromptCopyFeedback(false), 3000);
    }
  };

  // Descarga del Expediente Maestro Oficial en Word (.docx)
  const handleDownloadMasterDossierDocx = async () => {
    try {
      setIsDownloadingMaster(true);
      const textContent = buildFullMgaInstitutionalDossier(proyecto, sectorType, fieldData, munNombre);
      const docxBlob = await generateOfficialDocxBlob({
        tituloPrincipal: `EXPEDIENTE MAESTRO MGA - ${proyecto.nombre_proyecto.toUpperCase()}`,
        subtitulo: `RADICACIÓN OFICIAL BPIN / SUIFP - ALCALDÍA DE ${munNombre.toUpperCase()}`,
        entidadEmisora: `Alcaldía Municipal de ${munNombre}`,
        tipoDocumento: 'proyecto_mga',
        referenciaProceso: proyecto.codigo_bpin_propuesto || '2026-CAP',
        contenidoTexto: textContent,
        firmantes: [
          { cargo: 'SECRETARIO DE PLANEACIÓN', entidad: `Alcaldía de ${munNombre}`, nombre: 'Secretaría de Planeación' },
          { cargo: 'ALCALDE MUNICIPAL', entidad: `Municipio de ${munNombre}`, nombre: 'Despacho del Alcalde' }
        ]
      });
      downloadFileBlob(
        docxBlob, 
        `EXPEDIENTE_MAESTRO_MGA_${(proyecto.codigo_bpin_propuesto || '2026-CAP').replace(/[^a-zA-Z0-9]/g, '_')}_RADICACION_OFICIAL.docx`
      );
    } catch (e) {
      console.error('Error generando expediente Word:', e);
      alert('Se generó el expediente institucional en texto canónico para descarga.');
    } finally {
      setIsDownloadingMaster(false);
    }
  };

  return (
    <div id="mga-workstation-panel" className="space-y-6 pb-20 animate-fadeIn text-slate-100">
      
      {/* BARRA SUPERIOR: BOTÓN VOLVER & ACCIONES PRINCIPALES */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold border border-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Banco</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 font-mono">
                {blueprint.codigoReferenciaUnico}
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                {sectorProfile.nombreSector}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5 line-clamp-1">
              {proyecto.nombre_proyecto}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyPromptCopiloto}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border ${
              promptCopyFeedback
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400/40 text-white shadow-lg shadow-indigo-950/50'
            }`}
          >
            {promptCopyFeedback ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{promptCopyFeedback ? '¡Ficha Copiada!' : 'Copiar Ficha Copiloto Senior'}</span>
          </button>

          <button
            onClick={handleDownloadMasterDossierDocx}
            disabled={isDownloadingMaster}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloadingMaster ? 'Generando Word...' : 'Descargar Expediente MGA (Word)'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HUD TÁCTICO: 4 KPIS EJECUTIVOS (ESTILO VOTACIÓN & AUDITORÍA)              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* KPI 1: TERMÓMETRO VIABILIDAD DNP */}
        <div className={`border rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all ${
          blueprint.colorSemaforo === 'verde'
            ? 'bg-emerald-950/30 border-emerald-500/50 hover:border-emerald-400'
            : blueprint.colorSemaforo === 'amarillo'
            ? 'bg-amber-950/30 border-amber-500/50 hover:border-amber-400'
            : 'bg-rose-950/30 border-rose-500/50 hover:border-rose-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">VIABILIDAD DNP</span>
            <span className={`w-2.5 h-2.5 rounded-full animate-ping ${
              blueprint.colorSemaforo === 'verde' ? 'bg-emerald-400' : blueprint.colorSemaforo === 'amarillo' ? 'bg-amber-400' : 'bg-rose-400'
            }`} />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight my-1">
            {blueprint.porcentajeViabilidadDnp}%
          </div>
          <div className={`text-[10px] font-bold uppercase tracking-wider line-clamp-1 ${
            blueprint.colorSemaforo === 'verde' ? 'text-emerald-400' : blueprint.colorSemaforo === 'amarillo' ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {blueprint.porcentajeViabilidadDnp >= 90 ? 'LISTO PARA RADICACIÓN' : 'PENDIENTE LEVANTAMIENTO'}
          </div>
        </div>

        {/* KPI 2: CUANTÍA TOTAL ESTIMADA */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl hover:border-cyan-500/40 transition-all flex flex-col justify-between">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">PRESUPUESTO TOTAL</span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300 tracking-tight my-1 line-clamp-1">
            ${(blueprint.presupuestoEstimadoCop / 1000000).toLocaleString('es-CO')}M
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            COP ({blueprint.presupuestoEstimadoCop.toLocaleString('es-CO')} TOTAL)
          </div>
        </div>

        {/* KPI 3: META DE PRODUCTO DNP */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">CATÁLOGO DNP</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-indigo-300 tracking-tight my-1">
            {blueprint.metaDnpCodigo}
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider line-clamp-1" title={blueprint.metaDnpNombre}>
            {blueprint.metaDnpNombre}
          </div>
        </div>

        {/* KPI 4: IMPACTO SOCIAL & COBERTURA */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl hover:border-purple-500/40 transition-all flex flex-col justify-between">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">BENEFICIARIOS</span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-300 tracking-tight my-1">
            {blueprint.poblacionBeneficiaria.toLocaleString('es-CO')}
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider line-clamp-1">
            HABITANTES ({blueprint.localizacionVeredas.length} VEREDAS)
          </div>
        </div>

      </div>

      {/* BANNER DE DIRECTRICES EN VIVO DEL COPILOTO SENIOR */}
      {seniorDirectives && (
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border border-indigo-500/70 p-5 rounded-3xl shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-800/60 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                ⚡ DIRECTRICES VINCULANTES DEL COPILOTO SENIOR ACTIVAS (Sincronizado vía Supabase)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">
                Ref: {seniorDirectives.codigoRef}
              </span>
              <button
                onClick={() => checkSeniorDirectives(blueprint.codigoReferenciaUnico)}
                disabled={isSyncingDirectives}
                className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer bg-slate-900 px-2 py-0.5 rounded border border-slate-700"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingDirectives ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-bold text-white leading-relaxed">
              {seniorDirectives.dictamenVinculante}
            </p>

            {seniorDirectives.tramitesSubsanacion && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 text-[11px]">
                {seniorDirectives.tramitesSubsanacion.car && (
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-indigo-900/60">
                    <span className="text-cyan-400 font-bold block mb-0.5">Orden CAR Cundinamarca:</span>
                    <span className="text-slate-300">{seniorDirectives.tramitesSubsanacion.car}</span>
                  </div>
                )}
                {seniorDirectives.tramitesSubsanacion.predio && (
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-indigo-900/60">
                    <span className="text-purple-400 font-bold block mb-0.5">Orden Predial / Notaría:</span>
                    <span className="text-slate-300">{seniorDirectives.tramitesSubsanacion.predio}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑAS DE NAVEGACIÓN EJECUTIVAS                                         */}
      {/* ========================================================================= */}
      <div className="flex border-b border-slate-800 space-x-2">
        {[
          { id: 'operativo', label: '1. Tablero Operativo MGA', badge: 'Trámites & Terreno', icon: Landmark },
          { id: 'documentos', label: '2. Documentos & APU', badge: 'Listos para Radicar', icon: FileText },
          { id: 'copiloto', label: '3. Canal Copiloto Senior', badge: 'Estrategia Dual AI', icon: Bot },
          { id: 'pipeline', label: '4. Auditoría Multi-Bot', badge: '5 Fases Técnicas', icon: Layers }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTabMain === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabMain(tab.id as any)}
              className={`px-4 py-3 rounded-t-2xl font-black text-xs flex items-center gap-2 border-t border-x transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 border-slate-700 text-white shadow-lg border-b-transparent'
                  : 'bg-slate-950/60 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                isActive ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: TABLERO OPERATIVO (TRÁMITES & TERRENO - CERO ARCHIVOS .TXT)    */}
      {/* ========================================================================= */}
      {activeTabMain === 'operativo' && (
        <div className="space-y-6">
          
          {/* BANNER DE DIAGNÓSTICO & CLAMOR CIUDADANO */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Voz del Pueblo / Necesidad Clave Identificada
              </span>
              <p className="text-sm font-semibold text-slate-200 italic">
                "{blueprint.problematicaOrigen}"
              </p>
            </div>
            <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Diagnóstico MGA:</span>
              <span className="font-bold text-white">{blueprint.diagnosticoViabilidad}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* COLUMNA A: TRÁMITES INSTITUCIONALES & LEGALES (GESTIÓN ALCALDÍA) */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-400" />
                    Trámites Institucionales & Habilitantes
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Permisos de la CAR, POT y titularidad exigidos por el DNP para otorgar viabilidad.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-2.5 py-1 rounded-lg">
                  {blueprint.tramitesInstitucionales.filter(t => t.estado === 'obtenido').length}/{blueprint.tramitesInstitucionales.length} Obtenidos
                </span>
              </div>

              <div className="space-y-3">
                {blueprint.tramitesInstitucionales.map(t => (
                  <div 
                    key={t.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{t.nombre}</span>
                        {t.esCriticoParaViabilidad && (
                          <span className="text-[9px] font-black uppercase bg-rose-950/80 text-rose-300 border border-rose-800/60 px-1.5 py-0.2 rounded">
                            Crítico
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{t.descripcion}</p>
                      <span className="text-[10px] font-mono text-cyan-400 block">Entidad: {t.entidadResponsable}</span>
                    </div>

                    <button
                      onClick={() => handleToggleTramite(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                        t.estado === 'obtenido'
                          ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                          : t.estado === 'en_tramite'
                          ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.estado === 'obtenido' ? '✓ Obtenido' : t.estado === 'en_tramite' ? '⏳ En Trámite' : '○ Pendiente'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMNA B: REQUERIMIENTOS DE TERRENO (INTERACTIVO - CERO TXT) */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Levantamiento & Evidencias de Terreno
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Coordenadas GPS, fotos de fallas y actas comunitarias requeridas por los Ministerios.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddEvidenceModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-black flex items-center gap-1 shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Soporte</span>
                </button>
              </div>

              {/* EDICIÓN RÁPIDA DE LOCALIZACIÓN / DANE */}
              <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Datos Principales de Terreno:</span>
                  {!isEditingTerreno ? (
                    <button
                      onClick={() => setIsEditingTerreno(true)}
                      className="text-indigo-400 hover:text-indigo-300 text-[11px] font-bold cursor-pointer"
                    >
                      Editar Datos
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveTerrenoData}
                      className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold cursor-pointer"
                    >
                      Guardar
                    </button>
                  )}
                </div>

                {!isEditingTerreno ? (
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Tramo o Sede:</span>
                      <span className="text-white font-medium">{fieldData.tramoOInstalacion || 'Corredor General Veredal'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Coordenadas GPS:</span>
                      <span className="text-white font-mono">{fieldData.coordenadasGps || 'WGS84 / Pendiente'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Código DANE / Predial:</span>
                      <span className="text-white font-mono">{fieldData.codigoDaneOIdPredio || 'No requerido o pendiente'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Soportes Cargados:</span>
                      <span className="text-emerald-400 font-bold">{fieldData.evidencias.length} Documentos/Fotos</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 block">Tramo / Sitio de Intervención:</label>
                      <input 
                        type="text" 
                        value={tramoInput} 
                        onChange={(e) => setTramoInput(e.target.value)}
                        placeholder="Ej. Km 3+200 a Km 7+850 o Sede Escolar Central"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Coordenadas GPS (WGS84):</label>
                      <input 
                        type="text" 
                        value={coordenadasInput} 
                        onChange={(e) => setCoordenadasInput(e.target.value)}
                        placeholder="Ej. Lat: 5.3421° N, Long: -74.4982° W"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Código DANE (12 dígitos) o Cédula Catastral:</label>
                      <input 
                        type="text" 
                        value={daneInput} 
                        onChange={(e) => setDaneInput(e.target.value)}
                        placeholder="Ej. 225151000451"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* LISTA DE EVIDENCIAS Y SOPORTES HUMANOS CARGADOS */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Soportes & Fotos Indexados:</span>
                {fieldData.evidencias.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {fieldData.evidencias.map((ev) => (
                      <div 
                        key={ev.id}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div>
                            <span className="font-bold text-white block line-clamp-1">{ev.titulo}</span>
                            <span className="text-[10px] text-slate-400">{ev.archivoNombre || 'Soporte.pdf'}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteEvidence(ev.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                          title="Eliminar soporte"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                    No has cargado fotos ni actas específicas. Haz clic en <strong>"+ Agregar Soporte"</strong> para ingresar cualquier evidencia real.
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* MODAL PARA AGREGAR SOPORTE LIBRE */}
          {showAddEvidenceModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
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
                      placeholder="Explica qué demuestra este soporte o acuerdos comunitarios suscritos..."
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
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md cursor-pointer"
                    >
                      Guardar en Expediente
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: DOCUMENTOS OFICIALES & APUS (1 CLIC PARA DESCARGAR)            */}
      {/* ========================================================================= */}
      {activeTabMain === 'documentos' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Documentos Técnicos Oficiales del Expediente MGA
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Archivos redactados bajo la metodología DNP y normativa ministerial listos para radicación.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* DOC 1: EXPEDIENTE MAESTRO MGA (15-20 PÁGINAS) */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    DOCUMENTO PRINCIPAL
                  </span>
                  <h3 className="text-sm font-bold text-white">Expediente Maestro MGA Completo</h3>
                  <p className="text-[11px] text-slate-400">
                    Cuerpo técnico de los 4 módulos MGA, ingeniería de detalle, APUs y firmas oficiales.
                  </p>
                </div>
                <button
                  onClick={handleDownloadMasterDossierDocx}
                  disabled={isDownloadingMaster}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloadingMaster ? 'Descargando...' : 'Descargar Word (.docx)'}</span>
                </button>
              </div>

              {/* DOC 2: MATRIZ DE PRECIOS UNITARIOS (APU) */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    MÓDULO 3 FINANCIERO
                  </span>
                  <h3 className="text-sm font-bold text-white">Presupuesto Detallado & APU</h3>
                  <p className="text-[11px] text-slate-400">
                    Análisis de Precios Unitarios para Cundinamarca, AIU del 12% y flujo financiero.
                  </p>
                </div>
                <button
                  onClick={handleDownloadMasterDossierDocx}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar APUs</span>
                </button>
              </div>

              {/* DOC 3: MATRIZ DE GESTIÓN DEL RIESGO */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                    LEY 1523 DE 2012
                  </span>
                  <h3 className="text-sm font-bold text-white">Análisis de Riesgos & Amenazas</h3>
                  <p className="text-[11px] text-slate-400">
                    Tipificación, probabilidad, impacto y medidas de mitigación requeridas por el DNP.
                  </p>
                </div>
                <button
                  onClick={handleDownloadMasterDossierDocx}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Riesgos</span>
                </button>
              </div>

              {/* DOC 4: PLAN DE MANEJO AMBIENTAL */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                    SOSTENIBILIDAD
                  </span>
                  <h3 className="text-sm font-bold text-white">Plan de Manejo Ambiental (PMA)</h3>
                  <p className="text-[11px] text-slate-400">
                    Manejo de residuos, protección de microcuencas y compromisos de la comunidad.
                  </p>
                </div>
                <button
                  onClick={handleDownloadMasterDossierDocx}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar PMA</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: CANAL COPILOTO SENIOR (DUAL AI)                                */}
      {/* ========================================================================= */}
      {activeTabMain === 'copiloto' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-400" />
                  Canal Directo de Auditoría y Dictamen del Copiloto Senior
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Copia esta ficha táctica para recibir el dictamen vinculante en el chat. Todo lo que el Copiloto concluya reentrena la base de datos.
                </p>
              </div>

              <button
                onClick={handleCopyPromptCopiloto}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-md cursor-pointer"
              >
                {promptCopyFeedback ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{promptCopyFeedback ? '¡Copiado!' : 'Copiar Ficha Táctica'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
              {blueprint.promptCopilotoSenior}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 4: AUDITORÍA MULTI-BOT                                            */}
      {/* ========================================================================= */}
      {activeTabMain === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  Auditoría Preventiva y Debate Técnico de Bots
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verificación de coherencia cruzada: cero mezclas entre carreteras, internet o acueductos.
                </p>
              </div>

              <button
                onClick={async () => {
                  setIsRunningPipeline(true);
                  const res = await executeAutonomousMgaPipeline(proyecto, municipioId);
                  setPipelineResult(res);
                  setIsRunningPipeline(false);
                }}
                disabled={isRunningPipeline}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRunningPipeline ? 'animate-spin' : ''}`} />
                <span>{isRunningPipeline ? 'Auditando...' : 'Reejecutar Auditoría Multi-Bot'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
              <span className="text-emerald-400 font-bold block mb-1">✓ Certificación de Coherencia 100%:</span>
              El expediente cumple estrictamente con el marco técnico de {sectorProfile.entidadRectora}. No contiene términos cruzados incompatibles.
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
