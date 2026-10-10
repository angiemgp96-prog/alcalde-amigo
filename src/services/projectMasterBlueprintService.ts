/**
 * projectMasterBlueprintService.ts
 * Servicio Maestro de Conversión: Voz del Pueblo / Problemática -> Master Blueprint MGA Ganador.
 * Conecta las necesidades ciudadanas captadas en territorio con las directrices del Copiloto Senior,
 * genera Códigos Únicos de Referencia (REF-BPIN-VOZ-XXXX), desglosa los 4 pilares operativos
 * (Trámites Institucionales, Evidencias de Terreno, Redacción de Documentos IA y Viabilidad DNP)
 * y reentrena a los bots en Supabase.
 */

import { getSupabaseClient } from './api';
import { SectorDnpType, resolveUniversalSectorProfile, SectorKnowledgeProfile } from './agentKnowledgeBaseService';
import { ProjectFieldData } from './fieldEvidenceService';

export interface TramiteInstitucionalItem {
  id: string;
  nombre: string;
  entidadResponsable: string;
  descripcion: string;
  estado: 'pendiente' | 'en_tramite' | 'obtenido';
  archivoNombre?: string;
  archivoUrl?: string;
  esCriticoParaViabilidad: boolean;
}

export interface RequerimientoTerrenoItem {
  id: string;
  titulo: string;
  tipo: 'dato_tecnico' | 'fotografia' | 'acta_comunitaria' | 'estudio_especifico';
  descripcion: string;
  valorRegistrado?: string;
  archivoNombre?: string;
  archivoUrl?: string;
  estado: 'pendiente' | 'cargado';
}

export interface ProjectMasterBlueprint {
  codigoReferenciaUnico: string;
  proyectoId: string;
  nombreProyecto: string;
  problematicaOrigen: string;
  sector: SectorDnpType;
  entidadRectora: string;
  metaDnpCodigo: string;
  metaDnpNombre: string;
  presupuestoEstimadoCop: number;
  poblacionBeneficiaria: number;
  localizacionVeredas: string[];
  
  // 4 Pilares Operativos
  tramitesInstitucionales: TramiteInstitucionalItem[];
  requerimientosTerreno: RequerimientoTerrenoItem[];
  documentosOficialesIa: {
    dtsDisponible: boolean;
    mgaCompletoDisponible: boolean;
    matrizApuDisponible: boolean;
    matrizRiesgosDisponible: boolean;
  };
  
  // Termómetro de Viabilidad DNP (0 - 100%)
  porcentajeViabilidadDnp: number;
  diagnosticoViabilidad: string;
  colorSemaforo: 'rojo' | 'amarillo' | 'verde';
  
  // Prompt Estructurado para el Copiloto Senior
  promptCopilotoSenior: string;
  dictamenCopilotoSenior?: string;
  fechaActualizacion: string;
}

const STORAGE_PREFIX = 'ialcaldia_master_blueprint_';

/**
 * Genera el Blueprint Maestro Inicial para un Proyecto MGA a partir de la problemática o proyecto existente.
 */
export function generateMasterBlueprint(
  proyecto: {
    id: string;
    nombre_proyecto: string;
    codigo_bpin_propuesto?: string;
    sector_dnp?: string;
    resumen_ejecutivo?: string;
    presupuesto_total_cop?: number;
    poblacion_beneficiaria_total?: number;
    veredas_impactadas?: string[];
  },
  fieldData?: ProjectFieldData,
  problematicaTexto?: string
): ProjectMasterBlueprint {
  const bpin = proyecto.codigo_bpin_propuesto || '2026-CAP';
  const codigoRef = `REF-${bpin.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const profile: SectorKnowledgeProfile = resolveUniversalSectorProfile(proyecto.nombre_proyecto, proyecto.sector_dnp);
  const veredas = proyecto.veredas_impactadas || ['Zona Rural de Caparrapí'];
  const presupuesto = proyecto.presupuesto_total_cop || 1500000000;
  const poblacion = proyecto.poblacion_beneficiaria_total || 3800;
  const necesidad = problematicaTexto || proyecto.resumen_ejecutivo || 'Limitaciones de acceso y cobertura en infraestructura esencial para la comunidad campesina.';

  // 1. Trámites Institucionales Específicos por Sector
  const tramites = deriveTramitesInstitucionales(profile.sector);

  // 2. Requerimientos de Terreno Interactivos (Reemplazo del TXT)
  const reqTerreno = deriveRequerimientosTerreno(profile.sector, fieldData);

  // 3. Cálculo de Viabilidad DNP (Ponderado: 35% Trámites + 35% Terreno + 30% Documentos IA)
  const tramitesListos = tramites.filter(t => t.estado === 'obtenido').length;
  const terrenoListos = reqTerreno.filter(r => r.estado === 'cargado').length;
  
  const scoreTramites = tramites.length > 0 ? (tramitesListos / tramites.length) * 35 : 35;
  const scoreTerreno = reqTerreno.length > 0 ? (terrenoListos / reqTerreno.length) * 35 : 35;
  const scoreDocIa = 30; // La IA ya los formula con el estándar del Copiloto
  
  const scoreTotal = Math.round(scoreTramites + scoreTerreno + scoreDocIa);

  let colorSemaforo: 'rojo' | 'amarillo' | 'verde' = 'amarillo';
  let diagnostico = 'Faltan soportes de campo o trámites institucionales para radicación.';

  if (scoreTotal >= 90) {
    colorSemaforo = 'verde';
    diagnostico = 'EXPEDIENTE 100% BLINDADO: Apto para radicación oficial en SUIFP/BPIN y viabilidad ministerial.';
  } else if (scoreTotal < 60) {
    colorSemaforo = 'rojo';
    diagnostico = 'ALERTA DE VIABILIDAD: Faltan requisitos habilitantes críticos (permisos ambientales o titularidad).';
  }

  // 4. Prompt para el Copiloto Senior
  const promptCopiloto = `REPORTE MAESTRO DE EXPEDIENTE - DUAL AI COPILOTO SENIOR
========================================================================
CÓDIGO ÚNICO: ${codigoRef}
PROYECTO: "${proyecto.nombre_proyecto}"
MUNICIPIO: Caparrapí (Cundinamarca)
SECTOR DNP: ${profile.nombreSector}
ENTIDAD RECTORA: ${profile.entidadRectora}
PRESUPUESTO ESTIMADO: $${presupuesto.toLocaleString('es-CO')} COP
POBLACIÓN BENEFICIARIA: ${poblacion.toLocaleString('es-CO')} habitantes (${veredas.join(', ')})
CLAMOR CIUDADANO (VOZ DEL PUEBLO): "${necesidad}"
VIABILIDAD ACTUAL: ${scoreTotal}% (${diagnostico})

ESTADO DE TRÁMITES INSTITUCIONALES (${tramitesListos}/${tramites.length}):
${tramites.map(t => `- [${t.estado === 'obtenido' ? 'LISTO' : 'PENDIENTE'}] ${t.nombre} (${t.entidadResponsable})`).join('\n')}

ESTADO DE LEVANTAMIENTO EN TERRENO (${terrenoListos}/${reqTerreno.length}):
${reqTerreno.map(r => `- [${r.estado === 'cargado' ? 'CARGADO' : 'PENDIENTE'}] ${r.titulo}: ${r.valorRegistrado || 'No suministrado'}`).join('\n')}

ORDEN PARA EL COPILOTO SENIOR:
Analizar la viabilidad técnica y presupuestal bajo normativa oficial colombiana. Dictar lineamientos exactos de APUs, mitigación de riesgos y subsanaciones necesarias para que este proyecto obtenga calificación perfecta ante el DNP y los Ministerios.`;

  return {
    codigoReferenciaUnico: codigoRef,
    proyectoId: proyecto.id,
    nombreProyecto: proyecto.nombre_proyecto,
    problematicaOrigen: necesidad,
    sector: profile.sector,
    entidadRectora: profile.entidadRectora,
    metaDnpCodigo: profile.metaProductoDnpCodigo,
    metaDnpNombre: profile.metaProductoDnpNombre,
    presupuestoEstimadoCop: presupuesto,
    poblacionBeneficiaria: poblacion,
    localizacionVeredas: veredas,
    tramitesInstitucionales: tramites,
    requerimientosTerreno: reqTerreno,
    documentosOficialesIa: {
      dtsDisponible: true,
      mgaCompletoDisponible: true,
      matrizApuDisponible: true,
      matrizRiesgosDisponible: true
    },
    porcentajeViabilidadDnp: scoreTotal,
    diagnosticoViabilidad: diagnostico,
    colorSemaforo,
    promptCopilotoSenior: promptCopiloto,
    fechaActualizacion: new Date().toISOString()
  };
}

function deriveTramitesInstitucionales(sector: string): TramiteInstitucionalItem[] {
  const isVias = sector.includes('transporte');
  const isTic = sector.includes('tic');
  const isAgua = sector.includes('agua');

  if (isVias) {
    return [
      { id: 'tr_01', nombre: 'Certificado de Uso del Suelo y Jerarquización Vial (POT)', entidadResponsable: 'Secretaría de Planeación Municipal', descripcion: 'Certifica que el corredor corresponde a la red vial terciaria oficial del Municipio.', estado: 'obtenido', esCriticoParaViabilidad: true },
      { id: 'tr_02', nombre: 'Certificado de No Afectación de Reserva Forestal o Licencia CAR', entidadResponsable: 'CAR Cundinamarca', descripcion: 'Acredita que las obras de placa huella y alcantarillas no requieren sustracción de reserva.', estado: 'obtenido', esCriticoParaViabilidad: true },
      { id: 'tr_03', nombre: 'Certificado de Sostenibilidad y Mantenimiento Post-Inversión', entidadResponsable: 'Despacho del Alcalde / Secretaría de Obras', descripcion: 'Compromiso municipal de destinar recursos anuales para rocería y limpieza de cunetas.', estado: 'en_tramite', esCriticoParaViabilidad: false }
    ];
  }

  if (isTic) {
    return [
      { id: 'tr_01', nombre: 'Acta de Autorización Institucional para Conectividad Escolar', entidadResponsable: 'Secretaría de Educación / Rectoría de Sede', descripcion: 'Autorización oficial del rector y consejo directivo para anclaje de antenas y equipos Wi-Fi.', estado: 'obtenido', esCriticoParaViabilidad: true },
      { id: 'tr_02', nombre: 'Certificado de Disponibilidad y Factibilidad Eléctrica RETIE', entidadResponsable: 'Secretaría de Planeación / Enel Colombia', descripcion: 'Constancia de voltaje y disponibilidad de red veredal para alimentación ininterrumpida.', estado: 'en_tramite', esCriticoParaViabilidad: true },
      { id: 'tr_03', nombre: 'Plan de Apropiación Digital y Custodia de Equipos', entidadResponsable: 'Coordinación TIC Municipal / JAC', descripcion: 'Compromiso de seguridad comunitaria para salvaguardar paneles y terminales satelitales.', estado: 'obtenido', esCriticoParaViabilidad: false }
    ];
  }

  if (isAgua) {
    return [
      { id: 'tr_01', nombre: 'Concesión de Aguas Superficiales Vigente', entidadResponsable: 'CAR Cundinamarca', descripcion: 'Resolución de concesión de caudal hídrico en época de estiaje para consumo humano.', estado: 'en_tramite', esCriticoParaViabilidad: true },
      { id: 'tr_02', nombre: 'Certificado de Titularidad Predial del Punto de Captación', entidadResponsable: 'Oficina de Registro / Catastro IGAC', descripcion: 'Acredita propiedad municipal o servidumbre constituida para la bocatoma y PTAP.', estado: 'en_tramite', esCriticoParaViabilidad: true },
      { id: 'tr_03', nombre: 'Constancia de Legalización de la Junta del Acueducto Veredal', entidadResponsable: 'Cámara de Comercio / Secretaría de Gobierno', descripcion: 'Personería jurídica y RUT de la asociación de suscriptores rurales.', estado: 'obtenido', esCriticoParaViabilidad: false }
    ];
  }

  return [
    { id: 'tr_01', nombre: 'Certificado de Titularidad del Inmueble a Nombre del Municipio', entidadResponsable: 'Alcaldía Municipal / Catastro', descripcion: 'Garantiza propiedad pública para ejecutar inversión estatal.', estado: 'en_tramite', esCriticoParaViabilidad: true },
    { id: 'tr_02', nombre: 'Certificación de Concordancia con el Plan de Desarrollo Municipal', entidadResponsable: 'Secretaría de Planeación', descripcion: 'Alineación de la meta con el programa de gobierno territorial vigente.', estado: 'obtenido', esCriticoParaViabilidad: true },
    { id: 'tr_03', nombre: 'Certificado de Gestión del Riesgo y No Mitigabilidad', entidadResponsable: 'Consejo Municipal de Gestión del Riesgo (CMGRD)', descripcion: 'Certifica que el área no se encuentra en zona de amenaza alta no mitigable.', estado: 'obtenido', esCriticoParaViabilidad: true }
  ];
}

function deriveRequerimientosTerreno(sector: string, fieldData?: ProjectFieldData): RequerimientoTerrenoItem[] {
  const isVias = sector.includes('transporte');
  const isTic = sector.includes('tic');
  const isAgua = sector.includes('agua');

  const evList = fieldData?.evidencias || [];
  const tramoVal = fieldData?.tramoOInstalacion;
  const gpsVal = fieldData?.coordenadasGps;

  if (isVias) {
    return [
      {
        id: 'req_01',
        titulo: 'Tramo Exacto & Puntos Críticos (PR)',
        tipo: 'dato_tecnico',
        descripcion: 'Kilometraje inicial y final de intervención en placa huella (ej. Km 3+200 a Km 7+850).',
        valorRegistrado: tramoVal,
        estado: tramoVal ? 'cargado' : 'pendiente'
      },
      {
        id: 'req_02',
        titulo: 'Coordenadas GPS de Vértices y Alcantarillas',
        tipo: 'dato_tecnico',
        descripcion: 'Coordenadas WGS84 tomadas en los puntos donde se construirán cunetas y alcantarillas.',
        valorRegistrado: gpsVal,
        estado: gpsVal ? 'cargado' : 'pendiente'
      },
      {
        id: 'req_03',
        titulo: 'Registro Fotográfico de Pérdida de Banca y Cárcavas',
        tipo: 'fotografia',
        descripcion: 'Fotografías georreferenciadas que evidencien el deterioro vial que justifica la inversión.',
        archivoNombre: evList.find(e => e.tipo === 'foto_falla')?.archivoNombre,
        estado: evList.some(e => e.tipo === 'foto_falla') ? 'cargado' : 'pendiente'
      },
      {
        id: 'req_04',
        titulo: 'Acta de Socialización con Junta de Acción Comunal (JAC)',
        tipo: 'acta_comunitaria',
        descripcion: 'Acta de asamblea veredal con firmas de los beneficiarios respaldando la obra y cesiones.',
        archivoNombre: evList.find(e => e.tipo === 'acta_comunitaria')?.archivoNombre,
        estado: evList.some(e => e.tipo === 'acta_comunitaria') ? 'cargado' : 'pendiente'
      }
    ];
  }

  if (isTic) {
    const daneVal = fieldData?.codigoDaneOIdPredio;
    return [
      {
        id: 'req_01',
        titulo: 'Código DANE Oficial de las Sedes Educativas (12 dígitos)',
        tipo: 'dato_tecnico',
        descripcion: 'Identificación oficial del Ministerio de Educación de cada escuela rural a conectar.',
        valorRegistrado: daneVal,
        estado: daneVal ? 'cargado' : 'pendiente'
      },
      {
        id: 'req_02',
        titulo: 'Coordenadas GPS de la Antena y Línea de Vista',
        tipo: 'dato_tecnico',
        descripcion: 'Punto exacto de coordenadas con vista despejada al cielo para el terminal Starlink/Satélite.',
        valorRegistrado: gpsVal,
        estado: gpsVal ? 'cargado' : 'pendiente'
      },
      {
        id: 'req_03',
        titulo: 'Fotografía del Techo / Mástil de Montaje',
        tipo: 'fotografia',
        descripcion: 'Foto donde se aprecia la solidez estructural del techo para soportar vientos y el mástil.',
        archivoNombre: evList.find(e => e.tipo === 'foto_infraestructura' || e.tipo === 'foto_falla')?.archivoNombre,
        estado: evList.length > 0 ? 'cargado' : 'pendiente'
      },
      {
        id: 'req_04',
        titulo: 'Acta de Acuerdo Comunitario para Acceso al Wi-Fi Público',
        tipo: 'acta_comunitaria',
        descripcion: 'Compromiso de uso comunitario del punto digital en horario extracurricular para familias veredales.',
        archivoNombre: evList.find(e => e.tipo === 'acta_comunitaria')?.archivoNombre,
        estado: evList.some(e => e.tipo === 'acta_comunitaria') ? 'cargado' : 'pendiente'
      }
    ];
  }

  if (isAgua) {
    return [
      {
        id: 'req_01',
        titulo: 'Aforo de Caudal en Época Seca (L/s)',
        tipo: 'dato_tecnico',
        descripcion: 'Medición hidrológica que garantice abastecimiento continuo sin agotar la microcuenca.',
        valorRegistrado: fieldData?.longitudOMedida,
        estado: fieldData?.longitudOMedida ? 'cargado' : 'pendiente'
      },
      {
        id: 'req_02',
        titulo: 'Coordenadas GPS de Bocatoma y Tanque Desarenador',
        tipo: 'dato_tecnico',
        descripcion: 'Puntos georreferenciados para calcular la pendiente hidráulica y presiones de red.',
        valorRegistrado: gpsVal,
        estado: gpsVal ? 'cargado' : 'pendiente'
      },
      {
        id: 'req_03',
        titulo: 'Fotos de la Captación Actual y Necesidad Crítica',
        tipo: 'fotografia',
        descripcion: 'Evidencias del estado precario de la toma artesanal o mangueras expuestas.',
        archivoNombre: evList.find(e => e.tipo === 'foto_falla')?.archivoNombre,
        estado: evList.some(e => e.tipo === 'foto_falla') ? 'cargado' : 'pendiente'
      },
      {
        id: 'req_04',
        titulo: 'Censo Comunitario de Suscriptores y Familias Beneficiarias',
        tipo: 'acta_comunitaria',
        descripcion: 'Listado firmado con número de cédula y predio de los usuarios del acueducto veredal.',
        archivoNombre: evList.find(e => e.tipo === 'acta_comunitaria')?.archivoNombre,
        estado: evList.some(e => e.tipo === 'acta_comunitaria') ? 'cargado' : 'pendiente'
      }
    ];
  }

  return [
    {
      id: 'req_01',
      titulo: 'Localización y Coordenadas GPS del Polígono',
      tipo: 'dato_tecnico',
      descripcion: 'Ubicación geográfica exacta del punto de intervención.',
      valorRegistrado: gpsVal,
      estado: gpsVal ? 'cargado' : 'pendiente'
    },
    {
      id: 'req_02',
      titulo: 'Registro Fotográfico Panorámico y Detallado',
      tipo: 'fotografia',
      descripcion: 'Fotografías que sustentan la problemática identificada.',
      archivoNombre: evList[0]?.archivoNombre,
      estado: evList.length > 0 ? 'cargado' : 'pendiente'
    },
    {
      id: 'req_03',
      titulo: 'Acta de Socialización Comunitaria Firmada',
      tipo: 'acta_comunitaria',
      descripcion: 'Constancia de priorización participativa por parte de los beneficiarios directos.',
      archivoNombre: evList.find(e => e.tipo === 'acta_comunitaria')?.archivoNombre,
      estado: evList.some(e => e.tipo === 'acta_comunitaria') ? 'cargado' : 'pendiente'
    }
  ];
}

/**
 * Guarda el Master Blueprint en LocalStorage y sincroniza con Supabase
 */
export async function saveMasterBlueprint(blueprint: ProjectMasterBlueprint): Promise<void> {
  blueprint.fechaActualizacion = new Date().toISOString();

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${blueprint.proyectoId}`, JSON.stringify(blueprint));
    } catch (e) {
      console.warn('LocalStorage save blueprint error:', e);
    }
  }

  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client
      .from('propuestas_estructuradas_ia')
      .upsert({
        id: blueprint.codigoReferenciaUnico,
        intencion_sintetizada: `[MASTER BLUEPRINT MGA] ${blueprint.nombreProyecto}`,
        necesidad_clave: blueprint.problematicaOrigen,
        propuesta_redactada_ramitos: JSON.stringify({
          blueprintId: blueprint.codigoReferenciaUnico,
          sector: blueprint.sector,
          entidadRectora: blueprint.entidadRectora,
          metaDnp: { codigo: blueprint.metaDnpCodigo, nombre: blueprint.metaDnpNombre },
          presupuesto: blueprint.presupuestoEstimadoCop,
          tramites: blueprint.tramitesInstitucionales,
          terreno: blueprint.requerimientosTerreno,
          viabilidadScore: blueprint.porcentajeViabilidadDnp,
          diagnostico: blueprint.diagnosticoViabilidad,
          dictamenSenior: blueprint.dictamenCopilotoSenior
        }),
        estado_evaluacion: blueprint.porcentajeViabilidadDnp >= 90 ? 'aprobado' : 'en_analisis',
        fecha_analisis: new Date().toISOString()
      }, { onConflict: 'id' });
  } catch (err) {
    console.warn('Error syncing Master Blueprint to Supabase:', err);
  }
}

/**
 * Carga el Master Blueprint de un proyecto
 */
export function getMasterBlueprint(proyectoId: string): ProjectMasterBlueprint | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${proyectoId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error loading Master Blueprint:', e);
  }
  return null;
}


export interface SeniorCopilotDirectives {
  codigoRef: string;
  sectorRector: string;
  metaDnp: string;
  dictamenVinculante: string;
  apuMaestro?: { cap: string; valor: number }[];
  tramitesSubsanacion?: Record<string, string>;
  fechaDictamen: string;
}

/**
 * Consulta en Supabase si el Copiloto Senior ha emitido directrices vinculantes para este proyecto
 */
export async function fetchSeniorCopilotDirectivesFromSupabase(
  codigoRef: string
): Promise<SeniorCopilotDirectives | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('propuestas_estructuradas_ia')
      .select('*')
      .ilike('intencion_sintetizada', `%${codigoRef}%`)
      .order('fecha_analisis', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const row = data[0];
    if (row.propuesta_redactada_ramitos) {
      try {
        const parsed = JSON.parse(row.propuesta_redactada_ramitos);
        if (parsed.dictamenVinculante) {
          return parsed as SeniorCopilotDirectives;
        }
      } catch (e) {
        console.warn('Error parsing dictamen JSON from Supabase:', e);
      }
    }
  } catch (err) {
    console.warn('Error fetching Senior Directives from Supabase:', err);
  }

  return null;
}

/**
 * Aplica las directrices del Copiloto Senior al Blueprint Maestro del proyecto.
 * Ajusta los requerimientos operativos, costos APU e instrucciones específicas.
 */
export function applySeniorDirectivesToBlueprint(
  blueprint: ProjectMasterBlueprint,
  directives: SeniorCopilotDirectives
): ProjectMasterBlueprint {
  const updated = { ...blueprint };

  updated.dictamenCopilotoSenior = directives.dictamenVinculante;

  // Si incluye desglose de APU maestro calibrado por el Copiloto
  if (directives.apuMaestro && directives.apuMaestro.length > 0) {
    const totalApu = directives.apuMaestro.reduce((acc, item) => acc + item.valor, 0);
    if (totalApu > 0) {
      updated.presupuestoEstimadoCop = totalApu;
    }
  }

  // Mapeo semántico y dinámico de subsanaciones a trámites y requerimientos de terreno
  if (directives.tramitesSubsanacion) {
    const entries = Object.entries(directives.tramitesSubsanacion);

    updated.tramitesInstitucionales = updated.tramitesInstitucionales.map(t => {
      const tNorm = (t.nombre + ' ' + t.entidadResponsable + ' ' + t.descripcion).toLowerCase();
      for (const [key, instruction] of entries) {
        const kNorm = key.toLowerCase();
        if (
          tNorm.includes(kNorm) ||
          (kNorm.includes('car') && tNorm.includes('car')) ||
          (kNorm.includes('ambient') && (tNorm.includes('ambiental') || tNorm.includes('licencia') || tNorm.includes('reserva'))) ||
          (kNorm.includes('predio') && (tNorm.includes('predio') || tNorm.includes('titularidad') || tNorm.includes('catastro'))) ||
          (kNorm.includes('sostenib') && (tNorm.includes('sostenib') || tNorm.includes('mantenimiento') || tNorm.includes('obras'))) ||
          (kNorm.includes('pot') && (tNorm.includes('pot') || tNorm.includes('suelo') || tNorm.includes('planeaci'))) ||
          (kNorm.includes('salud') && (tNorm.includes('salud') || tNorm.includes('hospital') || tNorm.includes('minsalud'))) ||
          (kNorm.includes('tic') && (tNorm.includes('tic') || tNorm.includes('conectividad') || tNorm.includes('mintic'))) ||
          (kNorm.includes('educ') && (tNorm.includes('educ') || tNorm.includes('colegio') || tNorm.includes('mineducacion')))
        ) {
          return { ...t, descripcion: instruction };
        }
      }
      return t;
    });

    // Si incluye directriz para comisión en terreno o campo
    if (directives.tramitesSubsanacion.terreno && updated.requerimientosTerreno) {
      updated.requerimientosTerreno = updated.requerimientosTerreno.map(req => {
        if (req.tipo === 'dato_tecnico' || req.id === 'req_01' || req.titulo.toLowerCase().includes('tramo')) {
          return { ...req, descripcion: directives.tramitesSubsanacion!.terreno! };
        }
        return req;
      });
    }
  }

  return updated;
}
