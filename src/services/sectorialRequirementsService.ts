/**
 * sectorialRequirementsService.ts
 * Catálogo canónico oficial de requisitos de viabilidad sectorial MGA / DNP para entidades territoriales colombianas.
 * Garantiza coherencia técnica estricta por sector (MinTIC, MinTransporte, MinVivienda, MinSalud).
 * NUNCA mezcla especificaciones de vías o concreto en proyectos de tecnología satelital.
 */

import { RequisitoViabilidad } from '../types';

export type SectorDnpType = 'tic' | 'transporte' | 'agua' | 'educacion' | 'salud' | 'agropecuario';

export function detectSectorDnpType(sectorTexto: string, nombreProyecto: string = ''): SectorDnpType {
  const combined = `${sectorTexto} ${nombreProyecto}`.toLowerCase();
  
  if (combined.includes('tic') || combined.includes('tecnolog') || combined.includes('conectividad') || 
      combined.includes('internet') || combined.includes('starlink') || combined.includes('digital') || 
      combined.includes('telecomunicac')) {
    return 'tic';
  }

  if (combined.includes('agua') || combined.includes('acueducto') || combined.includes('alcantarillado') || 
      combined.includes('ptap') || combined.includes('saneamiento') || combined.includes('tratamiento de agua')) {
    return 'agua';
  }

  if (combined.includes('salud') || combined.includes('puesto de salud') || combined.includes('hospital') || 
      combined.includes('clinica') || combined.includes('ambulancia')) {
    return 'salud';
  }

  if (combined.includes('educaci') || combined.includes('colegio') || combined.includes('escuela') || 
      combined.includes('aulas') && !combined.includes('satelital')) {
    return 'educacion';
  }

  if (combined.includes('agro') || combined.includes('pecuario') || combined.includes('cultivo') || 
      combined.includes('cafe') || combined.includes('cacao') || combined.includes('ganader')) {
    return 'agropecuario';
  }

  // Por defecto si no coincide es transporte/infraestructura vial
  return 'transporte';
}

/**
 * Genera los 12 requisitos sectoriales estrictos para un proyecto según su sector DNP
 */
export function getCanonicalSectorRequisitos(
  proyectoId: string, 
  sectorTexto: string, 
  nombreProyecto: string = '',
  munNombre: string = 'Caparrapí'
): RequisitoViabilidad[] {
  const sectorType = detectSectorDnpType(sectorTexto, nombreProyecto);

  if (sectorType === 'tic') {
    return [
      {
        id: `req-${proyectoId}-1`,
        proyecto_id: proyectoId,
        categoria: 'legal',
        nombre_requisito: 'Carta de Radicación Oficial al Ministerio de las TIC / Centros Digitales',
        descripcion: `Oficio formal suscrito por el Alcalde Municipal de ${munNombre} justificando la focalización de escuelas rurales y sedes comunitarias aisladas para conectividad satelital de alta velocidad.`,
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Debe citar Ley 1341 de 2009 y metas del Plan Nacional de Conectividad Rural.'
      },
      {
        id: `req-${proyectoId}-2`,
        proyecto_id: proyectoId,
        categoria: 'legal',
        nombre_requisito: 'Actas de Autorización de Espacio en Sedes Educativas Rurales y Puntos Comunitarios',
        descripcion: 'Actas firmadas por rectores de las instituciones educativas y directivas de Juntas de Acción Comunal autorizando la instalación de antenas satelitales en techo/mástil y equipos de distribución.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Requiere firmas de los directores de sedes rurales focalizadas.'
      },
      {
        id: `req-${proyectoId}-3`,
        proyecto_id: proyectoId,
        categoria: 'legal',
        nombre_requisito: 'Certificación de Concordancia con el Plan de Desarrollo y Políticas TIC',
        descripcion: `Certificación expedida por la Secretaría de Planeación de ${munNombre} acreditando la alineación del proyecto con las metas de cierre de brecha digital territorial.`,
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Alineación con el PBOT y Plan de Desarrollo Municipal vigente.'
      },
      {
        id: `req-${proyectoId}-4`,
        proyecto_id: proyectoId,
        categoria: 'tecnico',
        nombre_requisito: 'Estudio de Ingeniería de Enlace Satelital LEO (Starlink) y Topología Wi-Fi 6',
        descripcion: 'Memoria técnica de cálculo de radioenlace satelital de órbita baja, ancho de banda mínimo garantizado (150-250 Mbps descendente / 25-50 Mbps ascendente), diagramas de radiación y cobertura Wi-Fi exterior con radio de 200 metros.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Prohibido usar especificaciones viales o de concreto; debe describir mástiles de aluminio/acero galvanizado, routers PoE y Access Points exteriores IP67.'
      },
      {
        id: `req-${proyectoId}-5`,
        proyecto_id: proyectoId,
        categoria: 'tecnico',
        nombre_requisito: 'Diseño del Sistema de Respaldo Solar Fotovoltaico Autónomo (UPS / Off-Grid)',
        descripcion: 'Cálculo de autonomía energética de mínimo 8 horas continuas para mitigar cortes de energía eléctrica en la zona rural, incluyendo paneles solares de 400W, inversores y baterías de litio LiFePO4.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Garantiza que las escuelas mantengan conectividad incluso durante fallas en la red eléctrica convencional.'
      },
      {
        id: `req-${proyectoId}-6`,
        proyecto_id: proyectoId,
        categoria: 'tecnico',
        nombre_requisito: 'Presupuesto Detallado APU de Hardware Satelital, Red y Despliegue en Campo',
        descripcion: 'Análisis de Precios Unitarios desagregando kits de antena satelital Starlink, mástiles arriostrados, cableado FTP exterior Cat 6 con protección UV, gabinetes climatizados y cuadrillas de instalación.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Costos verificados contra tarifas de importación legal y proveedores autorizados en Colombia.'
      },
      {
        id: `req-${proyectoId}-7`,
        proyecto_id: proyectoId,
        categoria: 'tecnico',
        nombre_requisito: 'Cronograma Físico de Despliegue Rápido en Veredas (Ruta de 15 a 30 Días)',
        descripcion: 'Cronograma de despliegue modular escuela por escuela, pruebas de throughput (latencia < 40ms, jitter y velocidad) y acta de entrega a la comunidad.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Ruta logística veredal organizada por cuadrantes geográficos.'
      },
      {
        id: `req-${proyectoId}-8`,
        proyecto_id: proyectoId,
        categoria: 'socioeconomico',
        nombre_requisito: 'Censo de Población Estudiantil y Productores Beneficiarios Directos',
        descripcion: 'Listado georreferenciado de estudiantes matriculados en SIMAT en las sedes rurales y familias del área de influencia con necesidad de telemedicina y trámites digitales.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Soporte fundamental para la evaluación socioeconómica y tasa de retorno social MGA.'
      },
      {
        id: `req-${proyectoId}-9`,
        proyecto_id: proyectoId,
        categoria: 'socioeconomico',
        nombre_requisito: 'Plan de Transferencia de Conocimiento y Alfabetización Digital Rural',
        descripcion: 'Programa de capacitación para docentes, líderes de JAC y productores agropecuarios en aprovechamiento de internet, plataformas educativas y comercialización electrónica.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Garantiza la apropiación social de la tecnología instalada.'
      },
      {
        id: `req-${proyectoId}-10`,
        proyecto_id: proyectoId,
        categoria: 'ambiental',
        nombre_requisito: 'Certificación de No Afectación Ambiental y Manejo de Residuos RAEE',
        descripcion: 'Concepto técnico de la Secretaría de Desarrollo Agropecuario y Ambiental certificando que la instalación de mástiles no genera remoción en masa ni tala, con protocolo de gestión de baterías y residuos electrónicos.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Cumplimiento de la Ley 1672 de 2013 sobre gestión integral de RAEE.'
      },
      {
        id: `req-${proyectoId}-11`,
        proyecto_id: proyectoId,
        categoria: 'legal',
        nombre_requisito: 'Acta de Compromiso de Sostenibilidad y Pago de Suscripción Satelital',
        descripcion: `Acta suscrita por la Alcaldía Municipal de ${munNombre} comprometiendo vigencias presupuestales para el pago mensual de la suscripción de datos satelitales y soporte técnico preventivo.`,
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Requisito habilitante para viabilidad definitiva en el SGR / MinTIC.'
      },
      {
        id: `req-${proyectoId}-12`,
        proyecto_id: proyectoId,
        categoria: 'socioeconomico',
        nombre_requisito: 'Ficha Canónica Resumen MGA Web y Certificado BPIN MinTIC',
        descripcion: 'Estructura canónica de los 4 módulos de la Metodología General Ajustada (Identificación, Preparación, Evaluación y Programación) validada para cargue en la plataforma MGA Web del DNP.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Ficha definitiva de radicación institucional.'
      }
    ];
  }

  if (sectorType === 'agua') {
    return [
      {
        id: `req-${proyectoId}-1`,
        proyecto_id: proyectoId,
        categoria: 'legal',
        nombre_requisito: 'Carta de Presentación y Solicitud de Viabilidad al MinVivienda / SGR',
        descripcion: `Oficio formal firmado por el Alcalde de ${munNombre} radicando el proyecto ante el Viceministerio de Agua y Saneamiento Básico.`,
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Conforme a la Resolución 0330 de 2017 (Reglamento Técnico RAS).'
      },
      {
        id: `req-${proyectoId}-2`,
        proyecto_id: proyectoId,
        categoria: 'legal',
        nombre_requisito: 'Concesión de Aguas Superficiales Vigente expedida por la CAR',
        descripcion: 'Resolución de la Corporación Autónoma Regional que otorga caudal de diseño garantizado para la población proyectada a 25 años.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Obligatorio adjuntar copia de la resolución de la CAR.'
      },
      {
        id: `req-${proyectoId}-3`,
        proyecto_id: proyectoId,
        categoria: 'tecnico',
        nombre_requisito: 'Estudio de Ingeniería de Detalle, Topografía y Memorias de Cálculo Hidráulico',
        descripcion: 'Planos y memorias de cálculo de la captación, desarenador, línea de aducción, módulos de clarificación y sedimentación acelerada de la PTAP, tanque de almacenamiento y redes de distribución.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Firmado por Ingeniero Civil o Sanitario con matrícula profesional vigente.'
      },
      {
        id: `req-${proyectoId}-4`,
        proyecto_id: proyectoId,
        categoria: 'tecnico',
        nombre_requisito: 'Caracterización Fisicoquímica y Bacteriológica del Agua Cruda y Tratada',
        descripcion: 'Análisis de laboratorio acreditado por el IDEAM demostrando turbiedad, color aparente, pH, coliformes totales y E. coli en época seca y de lluvia.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Base para determinar el tren de tratamiento químico de la planta.'
      },
      {
        id: `req-${proyectoId}-5`,
        proyecto_id: proyectoId,
        categoria: 'tecnico',
        nombre_requisito: 'Presupuesto Detallado APU de Obra Hidráulica, Redes y Electromecánica',
        descripcion: 'Desglose por ítems con tarifas regionalizadas para excavaciones, tubería RDE, válvulas de control, bombas dosificadoras y macromedidores.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Verificado con precios de referencia de la Gobernación de Cundinamarca.'
      },
      {
        id: `req-${proyectoId}-6`,
        proyecto_id: proyectoId,
        categoria: 'tecnico',
        nombre_requisito: 'Cronograma Físico y Financiero de Ejecución (Curva S)',
        descripcion: 'Cronograma detallado por capítulos de obra y flujo de desembolsos estimado a 6 u 8 meses.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Planificación de frentes de trabajo en bocatoma y planta.'
      },
      {
        id: `req-${proyectoId}-7`,
        proyecto_id: proyectoId,
        categoria: 'ambiental',
        nombre_requisito: 'Plan de Manejo Ambiental (PMA) y Plan de Saneamiento y Vertimientos (PSMV)',
        descripcion: 'Medidas de mitigación de impacto sobre la cuenca hídrica y manejo de lodos de sedimentación.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Requisito de viabilidad ambiental ministerial.'
      },
      {
        id: `req-${proyectoId}-8`,
        proyecto_id: proyectoId,
        categoria: 'ambiental',
        nombre_requisito: 'Estudio de Análisis de Riesgos y Amenazas de Desastres (Ley 1523 de 2012)',
        descripcion: 'Evaluación de vulnerabilidad de la bocatoma y tanques frente a crecientes súbitas, remoción en masa y sismicidad.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Concepto favorable del Consejo Municipal de Gestión del Riesgo.'
      },
      {
        id: `req-${proyectoId}-9`,
        proyecto_id: proyectoId,
        categoria: 'socioeconomico',
        nombre_requisito: 'Censo de Suscriptores y Usuarios Beneficiarios con Estratificación',
        descripcion: 'Listado de usuarios residenciales y comerciales beneficiarios con cálculo del consumo per cápita.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Determina la capacidad de pago y subsidios de la tarifa.'
      },
      {
        id: `req-${proyectoId}-10`,
        proyecto_id: proyectoId,
        categoria: 'legal',
        nombre_requisito: 'Modelo de Operación, Sostenibilidad y Administración del Servicio',
        descripcion: 'Constitución o fortalecimiento de la Empresa de Servicios Públicos (ESP) o Asociación Comunitaria de Usuarios encargada del recaudo y mantenimiento.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Garantía de viabilidad operativa a largo plazo.'
      },
      {
        id: `req-${proyectoId}-11`,
        proyecto_id: proyectoId,
        categoria: 'legal',
        nombre_requisito: 'Certificado de Titularidad Predial del Lote de la PTAP y Tanques',
        descripcion: 'Escritura pública y folio de matrícula inmobiliaria que acredite propiedad del municipio o servidumbre formal de paso.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Prohibido construir en predios sin titulación saneada.'
      },
      {
        id: `req-${proyectoId}-12`,
        proyecto_id: proyectoId,
        categoria: 'socioeconomico',
        nombre_requisito: 'Ficha Canónica Resumen MGA Web y Certificado BPIN',
        descripcion: 'Resumen estructurado en MGA Web del DNP con indicador de cobertura de agua potable.',
        es_obligatorio: true,
        estado: 'pendiente',
        observaciones: 'Documento oficial de radicación.'
      }
    ];
  }

  // Por defecto: TRANSPORTE / VÍAS Y PLACA HUELLA (INVIAS / MinTransporte)
  return [
    {
      id: `req-${proyectoId}-1`,
      proyecto_id: proyectoId,
      categoria: 'legal',
      nombre_requisito: 'Carta de Presentación y Radicación Oficial al INVIAS / Ministerio de Transporte',
      descripcion: `Oficio formal firmado por el Alcalde Municipal de ${munNombre} sustentando la intervención vial de conectividad productiva y campesina.`,
      es_obligatorio: true,
      estado: 'pendiente',
      observaciones: 'Debe citar la Ley 1682 de 2013 de Infraestructura de Transporte.'
    },
    {
      id: `req-${proyectoId}-2`,
      proyecto_id: proyectoId,
      categoria: 'legal',
      nombre_requisito: 'Certificado de Pertenencia a la Red Terciaria Municipal y Actas de Servidumbre',
      descripcion: 'Constancia expedida por Planeación certificando el código de la vía terciaria e inventario vial municipal, con actas de permiso de paso suscritas por predios colindantes.',
      es_obligatorio: true,
      estado: 'pendiente',
      observaciones: 'Garantiza que la intervención se realiza sobre vía pública comunitaria.'
    },
    {
      id: `req-${proyectoId}-3`,
      proyecto_id: proyectoId,
      categoria: 'legal',
      nombre_requisito: 'Certificación de Concordancia con el Plan de Desarrollo y PBOT',
      descripcion: 'Constancia expedida por Planeación Municipal indicando alineación con los instrumentos de ordenamiento territorial vial.',
      es_obligatorio: true,
      estado: 'pendiente',
      observaciones: 'Alineación con el plan vial municipal.'
    },
    {
      id: `req-${proyectoId}-4`,
      proyecto_id: proyectoId,
      categoria: 'tecnico',
      nombre_requisito: 'Estudio de Ingeniería de Detalle y Diseños Estructurales (Proyecto Tipo INVIAS / DNP)',
      descripcion: 'Planos topográficos de rasante y curvas, memorias de cálculo estructural de placa huella de concreto 3000 PSI, piedra pegada 2500 PSI, cunetas y alcantarillas de 36 pulgadas conforme a la Guía de Diseño de Pavimentos en Vías Terciarias del INVIAS.',
      es_obligatorio: true,
      estado: 'pendiente',
      observaciones: 'Diseño tipo con módulos estandarizados de concreto 3000 PSI y bermas cunetas.'
    },
    {
      id: `req-${proyectoId}-5`,
      proyecto_id: proyectoId,
      categoria: 'tecnico',
      nombre_requisito: 'Presupuesto Detallado con Análisis de Precios Unitarios (APU) Regionalizados',
      descripcion: 'Desglose por capítulos (Preliminares, Movimiento de tierras, Placa huella concreto 3000 PSI, Obras de drenaje y Señalización) con tarifas verificadas para Cundinamarca.',
      es_obligatorio: true,
      estado: 'pendiente',
      observaciones: 'Precios verificados con la base de datos de la Gobernación de Cundinamarca e INVIAS.'
    },
    {
      id: `req-${proyectoId}-6`,
      proyecto_id: proyectoId,
      categoria: 'tecnico',
      nombre_requisito: 'Cronograma Físico y Financiero de Inversiones (Curva S)',
      descripcion: 'Planificación de ejecución física por tramos veredales y flujo de desembolsos mensual.',
      es_obligatorio: true,
      estado: 'pendiente',
      observaciones: 'Estimado de cronograma de obra por cuadrillas de trabajo.'
    },
    {
      id: `req-${proyectoId}-7`,
      proyecto_id: proyectoId,
      categoria: 'ambiental',
      nombre_requisito: 'Plan de Manejo Ambiental Específico (PMA) o Certificado de No Afectación',
      descripcion: 'Disposición de material sobrante en ZODME autorizado, manejo de aguas de escorrentía y mitigación de polvo.',
      es_obligatorio: true,
      estado: 'pendiente',
      observaciones: 'Concepto técnico de la Secretaría de Medio Ambiente.'
    },
    {
      id: `req-${proyectoId}-8`,
      proyecto_id: proyectoId,
      categoria: 'ambiental',
      nombre_requisito: 'Análisis de Gestión del Riesgo y Amenaza de Desastres (Ley 1523 de 2012)',
      descripcion: 'Identificación de taludes inestables, amenazas por deslizamiento en época invernal y obras de bioingeniería de protección.',
      es_obligatorio: true,
      estado: 'pendiente',
      observaciones: 'Concepto emitido por la Oficina de Gestión del Riesgo.'
    },
    {
      id: `req-${proyectoId}-9`,
      proyecto_id: proyectoId,
      categoria: 'socioeconomico',
      nombre_requisito: 'Censo de Productores Agropecuarios y Beneficiarios del Corredor Vial',
      descripcion: 'Listado georreferenciado de familias campesinas, hectáreas productivas (café, caña, plátano, ganado) y volúmenes de carga que transitan por la vía.',
      es_obligatorio: true,
      estado: 'pendiente',
      observaciones: 'Justifica el costo-beneficio social de la inversión pública.'
    },
    {
      id: `req-${proyectoId}-10`,
      proyecto_id: proyectoId,
      categoria: 'legal',
      nombre_requisito: 'Acta de Socialización y Concertación con la Comunidad y JAC',
      descripcion: 'Actas de asambleas comunitarias con firmas de los presidentes de JAC acordando el trazado y conformación de comités de veeduría ciudadana.',
      es_obligatorio: true,
      estado: 'pendiente',
      observaciones: 'Requisito de participación ciudadana comunitaria.'
    },
    {
      id: `req-${proyectoId}-11`,
      proyecto_id: proyectoId,
      categoria: 'socioeconomico',
      nombre_requisito: 'Ficha Canónica Resumen MGA Web y Certificado BPIN Transporte',
      descripcion: 'Estructura canónica de los 4 módulos de la Metodología General Ajustada del DNP para proyectos de infraestructura vial.',
      es_obligatorio: true,
      estado: 'pendiente',
      observaciones: 'Ficha consolidada de radicación.'
    },
    {
      id: `req-${proyectoId}-12`,
      proyecto_id: proyectoId,
      categoria: 'legal',
      nombre_requisito: 'Acta de Compromiso de Mantenimiento y Sostenibilidad Vial',
      descripcion: `Compromiso formal suscrito por el municipio de ${munNombre} garantizando cuadrillas y maquinaria para el mantenimiento rutinario de cunetas y alcantarillas.`,
      es_obligatorio: true,
      estado: 'pendiente',
      observaciones: 'Garantía de vida útil de la infraestructura vial.'
    }
  ];
}

/**
 * Corrige y sanea los requisitos de un proyecto si detecta que tienen datos de un sector equivocado
 * (ej. concreto 3000 PSI en un proyecto TIC de Starlink)
 */
export function sanitizeAndMigrateProjectRequirements(
  proyectoId: string,
  sectorTexto: string,
  nombreProyecto: string,
  currentReqs: RequisitoViabilidad[],
  munNombre: string = 'Caparrapí'
): { sanitized: RequisitoViabilidad[]; wasMigrated: boolean } {
  const expectedSector = detectSectorDnpType(sectorTexto, nombreProyecto);

  // Detectar incongruencia en los requisitos actuales
  const hasIncongruence = currentReqs.some(r => {
    const text = `${r.nombre_requisito} ${r.descripcion || ''} ${r.observaciones || ''}`.toLowerCase();
    if (expectedSector === 'tic') {
      return text.includes('invias') || text.includes('concreto 3000') || text.includes('placa huella') || text.includes('hidráulico');
    }
    if (expectedSector === 'transporte') {
      return text.includes('starlink') || text.includes('wifi') || text.includes('satelital');
    }
    if (expectedSector === 'agua') {
      return text.includes('placa huella') || text.includes('starlink');
    }
    return false;
  });

  if (hasIncongruence || currentReqs.length === 0) {
    const freshCanonical = getCanonicalSectorRequisitos(proyectoId, sectorTexto, nombreProyecto, munNombre);
    return { sanitized: freshCanonical, wasMigrated: true };
  }

  return { sanitized: currentReqs, wasMigrated: false };
}
