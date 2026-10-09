import { getGroqApiKey } from './ramitosBrain';
import { getSupabaseClient } from './api';

export interface GeneratedDocResult {
  id: string;
  tipo: 'carta_presentacion' | 'propuesta_tecnica' | 'matriz_riesgos' | 'observaciones_pliego';
  titulo: string;
  contenido: string;
  fechaGeneracion: string;
  modeloUsado: string;
  palabrasAprox: number;
}

export interface HumanActionItem {
  id: string;
  nivel: 'verde_ia' | 'amarillo_humano' | 'rojo_critico';
  titulo: string;
  descripcion: string;
  responsableSugerido: string;
  tiempoEstimado: string;
  completado: boolean;
  documentoSoporte?: string;
}

export interface MasterAuditPackage {
  id: string;
  fechaCreacion: string;
  procesoSecop: {
    id: string;
    titulo: string;
    entidad: string;
    municipio: string;
    presupuestoCop: number;
    modalidad: string;
    fechaCierre: string;
  };
  empresaProponente: {
    nombre: string;
    nit: string;
    tipo: string;
    representanteLegal?: string;
  };
  scoreEstrategico: number;
  documentosGenerados: GeneratedDocResult[];
  checklistHumano: HumanActionItem[];
  auditoriaSeniorPuntosClave: {
    alertasJuridicas: string[];
    analisisFinancieroAiu: string[];
    recomendacionesEstrategicas: string[];
  };
}

export interface SupabaseAuditRecord {
  id: string;
  codigo_bpin_propuesto: string;
  nombre_proyecto: string;
  sector_dnp: string;
  estado_tramite: 'pendiente_auditoria_senior' | 'en_revision' | 'aprobado_blindado' | 'observaciones_requeridas';
  presupuesto_total_cop: number;
  justificacion_presidencia: string; // JSON del MasterAuditPackage
  evaluacion_economica?: string;    // Dictamen del Copiloto Senior
  updated_at: string;
}

function generateSafeUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getFallbackDocumentContent(tipo: string, opp: any, org: any): string {
  const fechaHoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  const valorFormateado = `$${Math.round(opp.presupuesto_cop || 0).toLocaleString('es-CO')} COP`;

  if (tipo === 'carta_presentacion') {
    return `BOGOTÁ D.C. / CUNDINAMARCA, ${fechaHoy}

Señores:
${(opp.entidad || 'ENTIDAD CONTRATANTE').toUpperCase()}
Comité Evaluador de Contratación Pública
Proceso No.: ${opp.id || 'SECOP-II-2026'}
Objeto: "${opp.titulo || 'Contratación estatal'}"

REF: CARTA DE PRESENTACIÓN DE LA PROPUESTA (FORMATO PLIEGO TIPO LEY 80 / LEY 1150)

Respetados Señores:

El suscrito, actuando en calidad de Representante Legal de ${org.nombre || 'NUEVA VIDA S.A.S.'}, identificada con NIT ${org.nit || '832.008.424-4'}, de conformidad con las condiciones estipuladas en el Pliego de Condiciones del proceso de la referencia, me permito presentar formal y definitiva propuesta comercial, técnica y jurídica.

Para tal efecto, manifestamos expresamente bajo la gravedad de juramento lo siguiente:

1. Conocimiento y Aceptación: Hemos revisado detalladamente el pliego de condiciones definitivo, sus anexos técnicos y las adendas expedidas, aceptando en su integridad todos los términos allí contenidos.
2. Capacidad Jurídica e Inhabilidades: Declaramos que ni la empresa ${org.nombre || 'la proponente'} ni sus administradores se encuentran incursos en causales constitucionales o legales de inhabilidad, incompatibilidad o conflicto de interés previstas en el artículo 8 de la Ley 80 de 1993, la Ley 1474 de 2011 y demás normas concordantes.
3. Propuesta Económica: El valor total de nuestra propuesta económica para la ejecución cabal del objeto contractual asciende a la suma de ${valorFormateado}, la cual incluye todos los costos directos, indirectos, impuestos de ley, tasas y el factor A.I.U. (Administración, Imprevistos y Utilidad).
4. Vigencia de la Oferta: Nuestra propuesta tiene una validez de noventa (90) días calendario contados a partir de la fecha de cierre del proceso, respaldada mediante la correspondiente Póliza de Seriedad de la Oferta.
5. Experiencia y Capacidad Técnica: Contamos con la experiencia acreditada en el Registro Único de Proponentes (RUP) bajo los códigos clasificadores UNSPSC solicitados en el pliego, respaldada con contratos ejecutados y liquidados a entera satisfacción.

Atentamente,

___________________________________________________
REPRESENTANTE LEGAL
${org.nombre || 'NUEVA VIDA S.A.S.'}
NIT: ${org.nit || '832.008.424-4'}
Correo de Notificaciones: ${org.email || 'contacto@licitaciones.co'}
Teléfono: ${org.telefono || '+57 322 582 2027'}
Dirección: Sede Principal Cundinamarca`;
  }

  if (tipo === 'propuesta_tecnica') {
    return `PROPUESTA TÉCNICA Y METODOLOGÍA DE EJECUCIÓN
PROCESO: ${opp.id} - ${opp.titulo}
PROPONENTE: ${org.nombre} (NIT: ${org.nit})

1. INTRODUCCIÓN Y ENFOQUE METODOLÓGICO
${org.nombre} plantea un modelo de gestión integral basado en estándares PMBOK y lineamientos de aseguramiento de calidad técnica. Nuestra propuesta garantiza la entrega oportuna de las metas contractuales con cero retrasos y trazabilidad total documentada.

2. FASES DE EJECUCIÓN Y PLAN OPERATIVO:
- Fase I (Alistamiento e Instalación - Semanas 1 a 2): Levantamiento inicial de requerimientos, legalización de actas de inicio, suscripción de pólizas de cumplimiento y asignación del equipo profesional interdisciplinario.
- Fase II (Ejecución y Control Operativo - Semanas 3 a 16): Despliegue de cuadrillas/profesionales en campo, auditoría de suministros, reportes semanales al interventor y control de bitácora digital.
- Fase III (Cierre, Liquidación y Transferencia - Semanas 17 a 18): Pruebas de calidad y recepción final, informe final consolidado y suscripción de acta de recibo a satisfacción con la Entidad.

3. PLAN DE ASEGURAMIENTO DE CALIDAD Y SST:
Se implementará el Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) cumpliendo con la Resolución 0312 de 2019, dotando al 100% del personal de elementos de protección individual y cobertura de ARL nivel de riesgo certificado.

4. EQUIPO TÉCNICO ASIGNADO:
El personal propuesto cumple con los títulos académicos y tarjetas profesionales vigentes requeridos en el pliego de condiciones, sin traslape de dedicación con otros proyectos concurrentes.`;
  }

  if (tipo === 'matriz_riesgos') {
    return `MATRIZ DE ASIGNACIÓN Y GESTIÓN DE RIESGOS PREVISIBLES (CONPES 3714)
PROCESO: ${opp.id} | ENTIDAD: ${opp.entidad}
PROPONENTE: ${org.nombre}

1. RIESGO TÉCNICO Y OPERACIONAL:
- Evento: Demoras en suministros o contingencias climáticas en la zona de ejecución.
- Impacto: Medio | Probabilidad: Media.
- Mitigación: Contar con proveedores de respaldo locales certificados y un stock de reserva del 15% en bodega central.
- Asignación: Contratista.

2. RIESGO FINANCIERO Y DE MERCADO:
- Evento: Variaciones extraordinarias en precios de insumos o inflación.
- Impacto: Bajo | Probabilidad: Baja.
- Mitigación: Cierre de contratos marco con fabricantes mayoristas con congelación de listas de precios durante el periodo contractual.
- Asignación: Contratista.

3. RIESGO REGULATORIO Y LEGAL:
- Evento: Modificaciones en normatividad sectorial durante la vigencia.
- Impacto: Bajo | Probabilidad: Muy Baja.
- Mitigación: Acompañamiento continuo de asesoría jurídica interna para adecuación inmediata.
- Asignación: Compartido.`;
  }

  return `OBSERVACIONES AL PROYECTO DE PLIEGO DE CONDICIONES
PROCESO: ${opp.id} | ${opp.entidad}

Respetados Señores Comité Evaluador:

En ejercicio del derecho a formular observaciones conforme al artículo 2.2.1.1.2.1.4 del Decreto 1082 de 2015, ${org.nombre} presenta las siguientes consideraciones para asegurar la pluralidad de oferentes:

1. SOLICITUD DE ACLARACIÓN SOBRE CÓDIGOS UNSPSC:
Se solicita a la entidad permitir la acreditación de la experiencia exigida a través de códigos clasificadores de tercer nivel de la misma familia, garantizando que empresas con amplia idoneidad técnica en el objeto contractual puedan participar sin barreras restrictivas injustificadas.

2. REQUISITOS FINANCIEROS HABILITANTES:
Se confirma que los indicadores de liquidez y endeudamiento exigidos se encuentran ajustados al promedio del sector económico, solicitando certificar que la fórmula de capital de trabajo no exceda el presupuesto oficial del proceso.

Agradecemos su atención y oportuna respuesta en el informe de observaciones.`;
}

export async function generateBidDocumentWithAI(
  tipo: 'carta_presentacion' | 'propuesta_tecnica' | 'matriz_riesgos' | 'observaciones_pliego',
  opp: any,
  org: any,
  instruccionesAdicionales?: string
): Promise<GeneratedDocResult> {
  const groqKey = getGroqApiKey();
  const fechaStr = new Date().toISOString();

  const titulos = {
    carta_presentacion: 'Carta Oficial de Presentación de la Oferta (Pliego Tipo)',
    propuesta_tecnica: 'Memoria Técnica, Metodología y Plan de Ejecución',
    matriz_riesgos: 'Matriz de Gestión de Riesgos Previsibles (Conpes 3714)',
    observaciones_pliego: 'Documento Jurídico de Observaciones al Pliego de Condiciones'
  };

  if (!groqKey || groqKey.trim().length < 15) {
    const fallbackText = getFallbackDocumentContent(tipo, opp, org);
    return {
      id: `doc_${tipo}_${Date.now()}`,
      tipo,
      titulo: titulos[tipo],
      contenido: fallbackText,
      fechaGeneracion: fechaStr,
      modeloUsado: 'Motor Normativo Local (Pre-redactado Ley 80)',
      palabrasAprox: fallbackText.split(/\s+/).length
    };
  }

  const promptSystem = `Eres el Director Jurídico y de Licitaciones Públicas de más alto nivel de Colombia, especialista en la Ley 80 de 1993, Ley 1150 de 2007, Decreto 1082 de 2015, Pliegos Tipo de Colombia Compra Eficiente y la plataforma SECOP II.
Tu misión es redactar un documento impecable, profesional, formal y sin errores para la empresa "${org.nombre}" (NIT: ${org.nit}), que se postula al proceso de contratación pública convocado por "${opp.entidad || 'Entidad Pública'}".

NORMAS CLAVE:
1. Usa lenguaje jurídico, administrativo y contractual de altísimo nivel.
2. Nunca uses expresiones coloquiales ni inventes normas inexistentes.
3. Cita normas vigentes de contratación estatal colombiana.
4. Redacta el documento listo para imprimir o copiar a SECOP II.`;

  const promptUser = `Genera el documento de tipo "${tipo}" con los siguientes datos del proceso licitatorio:

DATOS DE LA ENTIDAD Y PROCESO:
- Entidad: ${opp.entidad}
- Proceso SECOP: ${opp.id} - ${opp.titulo}
- Presupuesto Oficial: $${Math.round(opp.presupuesto_cop || 0).toLocaleString('es-CO')} COP
- Modalidad: ${opp.modalidad || 'Licitación Pública / Selección Abreviada'}
- Municipio / Departamento: ${opp.departamento || 'Cundinamarca'}

DATOS DE LA EMPRESA PROPONENTE:
- Nombre: ${org.nombre}
- NIT: ${org.nit}
- Tipo: ${org.tipo || 'Empresa Privada'}
- Sede: ${org.sedePrincipal || 'Cundinamarca'}
- Teléfono: ${org.telefono || '3225822027'}
- Email: ${org.email || 'contacto@licitaciones.co'}

INSTRUCCIONES EXTRA DEL USUARIO:
${instruccionesAdicionales || 'Asegurar el 100% de cumplimiento de los requisitos habilitantes y blindaje contra rechazo de la oferta.'}

Entrega el documento completo, detallado y bien estructurado con sus firmas y títulos correspondientes.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey.trim()}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: promptSystem },
          { role: 'user', content: promptUser }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Respuesta vacía de Groq');
    }

    return {
      id: `doc_${tipo}_${Date.now()}`,
      tipo,
      titulo: titulos[tipo],
      contenido: content,
      fechaGeneracion: fechaStr,
      modeloUsado: 'Groq Llama 3.3 70B Versatile',
      palabrasAprox: content.split(/\s+/).length
    };
  } catch (error) {
    console.warn('Fallback a redactor normativo por incidencia con Groq:', error);
    const fallbackText = getFallbackDocumentContent(tipo, opp, org);
    return {
      id: `doc_${tipo}_${Date.now()}`,
      tipo,
      titulo: titulos[tipo],
      contenido: fallbackText,
      fechaGeneracion: fechaStr,
      modeloUsado: 'Motor Normativo Local (Pre-redactado Ley 80)',
      palabrasAprox: fallbackText.split(/\s+/).length
    };
  }
}

export function generateHumanChecklist(opp: any, org: any): HumanActionItem[] {
  return [
    {
      id: 'chk_v1',
      nivel: 'verde_ia',
      titulo: 'Carta de Presentación Oficial Redactada',
      descripcion: `Formato 1 de Colombia Compra Eficiente diligenciado con NIT ${org.nit} y manifestación juramentada.`,
      responsableSugerido: 'IA Redactora (Listo)',
      tiempoEstimado: 'Completado',
      completado: true,
      documentoSoporte: 'Carta_Presentacion_Oferta.pdf'
    },
    {
      id: 'chk_v2',
      nivel: 'verde_ia',
      titulo: 'Clasificador de Códigos UNSPSC Cruzados',
      descripcion: `Verificación automática de códigos UNSPSC del pliego contra el portafolio de ${org.nombre}.`,
      responsableSugerido: 'IA Redactora (Listo)',
      tiempoEstimado: 'Completado',
      completado: true,
      documentoSoporte: 'Matriz_UNSPSC_Acreditada.xlsx'
    },
    {
      id: 'chk_v3',
      nivel: 'verde_ia',
      titulo: 'Memoria Técnica y Metodología Estructurada',
      descripcion: 'Plan operativo, cronograma de hitos y plan de calidad y SST redactados según términos del pliego.',
      responsableSugerido: 'IA Redactora (Listo)',
      tiempoEstimado: 'Completado',
      completado: true,
      documentoSoporte: 'Propuesta_Tecnica_Metodologia.docx'
    },
    {
      id: 'chk_a1',
      nivel: 'amarillo_humano',
      titulo: 'Expedición de Garantía de Seriedad de la Oferta (Póliza)',
      descripcion: `Solicitar a la compañía de seguros la póliza por el 10% del presupuesto oficial ($${Math.round((opp.presupuesto_cop || 0) * 0.1).toLocaleString('es-CO')} COP) a favor de ${opp.entidad}. Debe adjuntarse con recibo de pago o constancia de vigencia.`,
      responsableSugerido: 'Humano / Director Financiero',
      tiempoEstimado: '24 a 48 horas',
      completado: false,
      documentoSoporte: 'Carátula de Póliza + Recibo de Caja'
    },
    {
      id: 'chk_a2',
      nivel: 'amarillo_humano',
      titulo: 'Paz y Salvo de Parafiscales y Seguridad Social',
      descripcion: `Certificación del artículo 50 de la Ley 789 de 2002 firmado original por el Revisor Fiscal o Representante Legal, con copia de tarjeta profesional y cédula de quien certifica vigente dentro de los últimos 6 meses.`,
      responsableSugerido: 'Humano / Revisor Fiscal',
      tiempoEstimado: '1 a 2 horas',
      completado: false,
      documentoSoporte: 'Certificacion_Parafiscales_Firmada.pdf'
    },
    {
      id: 'chk_a3',
      nivel: 'amarillo_humano',
      titulo: 'Actualización y Descarga del Certificado RUP',
      descripcion: `Descargar del portal de Cámara de Comercio el Certificado RUP vigente con fecha de expedición no mayor a 30 días calendario anteriores al cierre del proceso.`,
      responsableSugerido: 'Humano / Asistente Administrativo',
      tiempoEstimado: '30 minutos (Portal Virtual)',
      completado: false,
      documentoSoporte: 'RUP_Camara_Comercio.pdf'
    },
    {
      id: 'chk_a4',
      nivel: 'amarillo_humano',
      titulo: 'Pago de Estampillas Pro-Desarrollo o Pro-Cultura (Si Aplica)',
      descripcion: `Verificar si el municipio o departamento exige comprobante de estampillas locales previo o estampillas retenidas en la primera acta de pago.`,
      responsableSugerido: 'Humano / Tesorería',
      tiempoEstimado: '2 horas',
      completado: false,
      documentoSoporte: 'Comprobante_Estampillas.pdf'
    },
    {
      id: 'chk_r1',
      nivel: 'rojo_critico',
      titulo: 'Firma Digital y Cargue en SECOP II antes del Cierre',
      descripcion: `El Representante Legal debe acceder con su usuario y contraseña o firma digital en SECOP II. Las propuestas deben estar cargadas y confirmadas mínimo 2 horas antes de las ${opp.fecha_cierre || '10:00 AM'} del día de cierre para evitar bloqueos por saturación del servidor nacional.`,
      responsableSugerido: 'Humano / Representante Legal (Obligatorio)',
      tiempoEstimado: 'Punto Crítico Final (No delegable)',
      completado: false,
      documentoSoporte: 'Constancia de Radicación SECOP II'
    }
  ];
}

export function buildMasterAuditPackage(
  opp: any,
  org: any,
  generatedDocs: GeneratedDocResult[],
  checklist: HumanActionItem[]
): MasterAuditPackage {
  return {
    id: `audit_pkg_${opp.id}_${Date.now()}`,
    fechaCreacion: new Date().toISOString(),
    procesoSecop: {
      id: opp.id,
      titulo: opp.titulo,
      entidad: opp.entidad,
      municipio: opp.municipio || opp.departamento || 'Cundinamarca',
      presupuestoCop: opp.presupuesto_cop || 0,
      modalidad: opp.modalidad || 'Licitación Pública',
      fechaCierre: opp.fecha_cierre || 'Pendiente'
    },
    empresaProponente: {
      nombre: org.nombre,
      nit: org.nit,
      tipo: org.tipo,
      representanteLegal: org.boardMembers?.[0]?.nombres || 'Representante Legal Registrado'
    },
    scoreEstrategico: opp.strategic_score || 85,
    documentosGenerados: generatedDocs,
    checklistHumano: checklist,
    auditoriaSeniorPuntosClave: {
      alertasJuridicas: [
        'Verificar que el certificado de parafiscales incluya la declaración expresa de estar a paz y salvo con ICBF, SENA, Cajas de Compensación y Salud/Pensión durante los últimos 6 meses.',
        'Revisar si el pliego exige experiencia de los últimos 5 o 10 años en el RUP.',
        'Asegurar que no exista causal de consanguinidad o conflicto de intereses con el ordenador del gasto de la entidad.'
      ],
      analisisFinancieroAiu: [
        `Presupuesto total estimado: $${Math.round(opp.presupuesto_cop || 0).toLocaleString('es-CO')} COP.`,
        'Estructura recomendada de A.I.U.: Administración (15% a 20%), Imprevistos (2% a 5%), Utilidad (5% a 8%).',
        'Validar que la suma de ítems unitarios no tenga redondeo que discrepe en centavos con la plataforma SECOP II.'
      ],
      recomendacionesEstrategicas: [
        'Radicar observaciones al pliego dentro del término legal si se detecta direccionamiento de códigos UNSPSC.',
        'Disponer de los 3 mejores contratos de experiencia específica que sumen al menos el 150% del presupuesto oficial para asegurar puntaje máximo en factor técnico.'
      ]
    }
  };
}

// =========================================================================
// COMUNICACIÓN NATIVA EN SUPABASE (CANAL DUAL AI EN LA NUBE)
// =========================================================================

export async function syncAuditPackageToSupabase(pkg: MasterAuditPackage): Promise<{
  success: boolean;
  recordId?: string;
  estado?: string;
  mensaje?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, mensaje: 'Cliente Supabase no disponible' };
  }

  const pkgJsonStr = JSON.stringify(pkg);
  const nowIso = new Date().toISOString();

  try {
    // 1. Buscar si ya existe una auditoría previa para este proceso SECOP
    const { data: existingRows } = await client
      .from('proyectos_mga_estructurados')
      .select('id, estado_tramite, evaluacion_economica')
      .eq('sector_dnp', 'LICITACION_SECOP_AUDITORIA')
      .eq('codigo_bpin_propuesto', pkg.procesoSecop.id)
      .limit(1);

    if (existingRows && existingRows.length > 0) {
      const existing = existingRows[0];
      const { error: updateErr } = await client
        .from('proyectos_mga_estructurados')
        .update({
          nombre_proyecto: `[AUDITORÍA SECOP] ${pkg.procesoSecop.titulo} - ${pkg.empresaProponente.nombre}`,
          presupuesto_total_cop: pkg.procesoSecop.presupuestoCop,
          justificacion_presidencia: pkgJsonStr,
          estado_tramite: 'pendiente_auditoria_senior',
          updated_at: nowIso
        })
        .eq('id', existing.id);

      if (updateErr) throw updateErr;

      return {
        success: true,
        recordId: existing.id,
        estado: 'pendiente_auditoria_senior',
        mensaje: 'Expediente actualizado en Supabase y notificado al Copiloto Senior'
      };
    }

    // 2. Si no existe, insertar nuevo registro con UUID válido
    const newUuid = generateSafeUUID();
    const { error: insertErr } = await client
      .from('proyectos_mga_estructurados')
      .insert({
        id: newUuid,
        municipio_id: 'caparrapi',
        codigo_bpin_propuesto: pkg.procesoSecop.id,
        nombre_proyecto: `[AUDITORÍA SECOP] ${pkg.procesoSecop.titulo} - ${pkg.empresaProponente.nombre}`,
        sector_dnp: 'LICITACION_SECOP_AUDITORIA',
        estado_tramite: 'pendiente_auditoria_senior',
        presupuesto_total_cop: pkg.procesoSecop.presupuestoCop,
        justificacion_presidencia: pkgJsonStr,
        creado_por: `LicitaPro SaaS (${pkg.empresaProponente.nombre})`,
        updated_at: nowIso
      });

    if (insertErr) throw insertErr;

    return {
      success: true,
      recordId: newUuid,
      estado: 'pendiente_auditoria_senior',
      mensaje: 'Expediente creado en Supabase con éxito. Esperando auditoría senior.'
    };
  } catch (error: any) {
    console.error('Error sincronizando auditoría con Supabase:', error);
    return {
      success: false,
      mensaje: error?.message || 'Error desconocido sincronizando con Supabase'
    };
  }
}

export async function fetchAuditStatusFromSupabase(procesoSecopId: string): Promise<{
  encontrado: boolean;
  estado?: 'pendiente_auditoria_senior' | 'en_revision' | 'aprobado_blindado' | 'observaciones_requeridas';
  dictamenSenior?: string;
  fechaActualizacion?: string;
  recordId?: string;
}> {
  const client = getSupabaseClient();
  if (!client) return { encontrado: false };

  try {
    const { data, error } = await client
      .from('proyectos_mga_estructurados')
      .select('id, estado_tramite, evaluacion_economica, updated_at')
      .eq('sector_dnp', 'LICITACION_SECOP_AUDITORIA')
      .eq('codigo_bpin_propuesto', procesoSecopId)
      .limit(1);

    if (error || !data || data.length === 0) {
      return { encontrado: false };
    }

    const row = data[0];
    return {
      encontrado: true,
      recordId: row.id,
      estado: row.estado_tramite as any,
      dictamenSenior: row.evaluacion_economica || undefined,
      fechaActualizacion: row.updated_at
    };
  } catch (error) {
    console.warn('Error consultando estado en Supabase:', error);
    return { encontrado: false };
  }
}
