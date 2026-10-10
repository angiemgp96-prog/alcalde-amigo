/**
 * agentKnowledgeBaseService.ts
 * Cerebro Universal de Conocimiento Técnico y Normativo para la Sala de Bots.
 * Proporciona el marco doctrinal, legal y de ingeniería para cualquier sector de inversión pública
 * (Transporte/INVIAS, TIC/MinTIC, Agua/RAS, Educación, Salud, Agro, Energía, Medio Ambiente,
 *  Vivienda, Deporte, Cultura, Seguridad/Justicia, Inclusión Social, Desarrollo Económico,
 *  Residuos Sólidos, Ciencia y Tecnología) y capacidad de síntesis dinámica para cualquier tema emergente.
 */

import { getSupabaseClient } from './api';

export type SectorDnpType = 
  | 'transporte' 
  | 'tic' 
  | 'agua' 
  | 'educacion' 
  | 'salud' 
  | 'agropecuario' 
  | 'energia' 
  | 'medio_ambiente'
  | 'vivienda'
  | 'deporte'
  | 'cultura'
  | 'seguridad_justicia'
  | 'inclusion_social'
  | 'desarrollo_economico'
  | 'residuos_solidos'
  | 'ciencia_tecnologia'
  | (string & {});

export interface SectorKnowledgeProfile {
  sector: SectorDnpType;
  nombreSector: string;
  entidadRectora: string;
  marcoNormativoPrincipal: string[];
  especificacionesIngenieria: {
    capitulos: string[];
    normasTecnicas: string[];
    criteriosDisenoMinimos: string;
    riesgosPrevisiblesComunes: string[];
  };
  catalogoApuTipicos: {
    item: string;
    unidad: string;
    descripcion: string;
  }[];
  palabrasClavePositivas: string[];
  palabrasProhibidasPorIncompatibilidad: string[];
  metaProductoDnpCodigo: string;
  metaProductoDnpNombre: string;
}

export const SECTOR_KNOWLEDGE_BASE: Record<string, SectorKnowledgeProfile> = {
  transporte: {
    sector: 'transporte',
    nombreSector: 'Transporte & Infraestructura Vial (Vías Terciarias y Puentes)',
    entidadRectora: 'Ministerio de Transporte / INVIAS / OCAD Paz / Sistema General de Regalías (SGR)',
    marcoNormativoPrincipal: [
      'Ley 105 de 1993 (Estatuto General del Transporte en Colombia)',
      'Ley 336 de 1996 (Estatuto Nacional de Transporte)',
      'Resolución 1376 de 2014 INVIAS (Manual de Diseño Geométrico de Carreteras)',
      'Resolución 1860 de 2021 INVIAS (Especificaciones Generales de Construcción de Carreteras - Artículos 300, 400 y 500)',
      'Guía Técnica para el Diseño y Construcción de Placa Huella en Vías Terciarias (INVIAS 2020)',
      'Decreto 1079 de 2015 (Decreto Único Reglamentario del Sector Transporte)'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Localización, replanteo topográfico y demoliciones preliminares',
        'Capítulo 2: Movimiento de tierras, excavación no clasificada y mejoramiento de subrasante (CBR > 5%)',
        'Capítulo 3: Estructura de pavimento en placa huella (Concreto MR-43 / f\'c=28 MPa y piedra pegada en ciclópeo)',
        'Capítulo 4: Obras de arte y drenaje (Alcantarillas de 36", cunetas triangulares en concreto f\'c=21 MPa y descoles)',
        'Capítulo 5: Muros de contención y estabilización de taludes (Gaviones o concreto reforzado)',
        'Capítulo 6: Señalización vertical preventiva y reglamentaria vial'
      ],
      normasTecnicas: [
        'NTC 1377 (Elaboración y curado de especímenes de concreto)',
        'NSR-10 Título C (Concreto Estructural para obras de infraestructura)',
        'Manual de Drenaje para Carreteras del INVIAS',
        'Norma INVIAS Artículo 673 (Placas de concreto para huellas vehiculares)'
      ],
      criteriosDisenoMinimos: 'Módulo de rotura del concreto a flexotracción MR >= 4.3 MPa (aprox. f\'c 280 kg/cm2 o 4000 PSI) a 28 días; espesor de placa huella de 15 cm reforzada con malla electrosoldada o acero de refuerzo fy=4200 kg/cm2; berma-cuneta fundida monolítica o confinada; pendientes transversales de bombeo del 2% al 3%; alcantarillas en tubería de concreto reforzado clase II de mínimo 36 pulgadas de diámetro.',
      riesgosPrevisiblesComunes: [
        'Riesgo Geotécnico: Inestabilidad de taludes por saturación hídrica y fallas por deslizamiento en temporada de lluvias.',
        'Riesgo Hidrológico: Socavación de estribos y colapso de terraplenes por caudales de retorno superiores a 25 años.',
        'Riesgo Logístico: Dificultad de acceso de mixer y maquinaria pesada en tramos rurales angostos y pendientes superiores al 15%.',
        'Riesgo de Precios: Fluctuación del costo del acero, cemento estructural y transporte de agregados pétreos desde cantera licenciada.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'M2', descripcion: 'Localización, trazado y replanteo topográfico con estación total' },
      { item: '2.1', unidad: 'M3', descripcion: 'Excavación mecánica en material común sin clasificar de la calzada' },
      { item: '2.2', unidad: 'M3', descripcion: 'Subbase granular clase B compactada al 95% del Proctor Modificado' },
      { item: '3.1', unidad: 'M3', descripcion: 'Concreto para placa huella MR-43 (f\'c=28 MPa) fundido en sitio' },
      { item: '3.2', unidad: 'KG', descripcion: 'Acero de refuerzo fy=4200 kg/cm2 (60.000 PSI) en canastillas y pasadores' },
      { item: '3.3', unidad: 'M3', descripcion: 'Concreto ciclópeo (60% concreto f\'c=17.5 MPa + 40% piedra rajón limpia)' },
      { item: '4.1', unidad: 'ML', descripcion: 'Alcantarilla de 36 pulgadas en concreto reforzado clase II con cabezales' },
      { item: '4.2', unidad: 'ML', descripcion: 'Cuneta triangular en concreto fundido en sitio e=10cm f\'c=21 MPa' },
      { item: '5.1', unidad: 'UN', descripcion: 'Señal de tránsito vertical preventiva/reglamentaria reflectiva tipo I' }
    ],
    palabrasClavePositivas: [
      'vía', 'vias', 'carretera', 'placa huella', 'placahuella', 'pavimento', 'afirmado', 
      'invias', 'alcantarilla', 'cuneta', 'talud', 'subrasante', 'puente', 'pontón', 
      'muro de contención', 'transporte', 'tránsito', 'calzada', 'corredor vial'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'starlink', 'antena satelital', 'wifi', 'wi-fi', 'megabits', 'ancho de banda',
      'fibra óptica', 'transceptor', 'simat', 'router', 'access point', 'latencia', 'mintic'
    ],
    metaProductoDnpCodigo: '2201002',
    metaProductoDnpNombre: 'Kilómetros de red vial terciaria mejorados y construidos con placa huella'
  },

  tic: {
    sector: 'tic',
    nombreSector: 'Tecnologías de la Información y las Comunicaciones (TIC)',
    entidadRectora: 'Ministerio de las TIC / Fondo Único de TIC (FUNTIC) / Computadores para Educar',
    marcoNormativoPrincipal: [
      'Ley 1341 de 2009 (Ley Marco del Sector de las TIC en Colombia)',
      'Ley 1978 de 2019 (Modernización del Sector TIC)',
      'Resolución 3484 de 2012 CRC (Reglamento de Redes de Telecomunicaciones)',
      'Decreto 1078 de 2015 (Decreto Único Reglamentario del Sector TIC)',
      'Plan Nacional de Conectividad Rural y Conectividad para la Vida (MinTIC)'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Suministro e instalación de estación satelital LEO (Low Earth Orbit / Starlink Business)',
        'Capítulo 2: Red de distribución inalámbrica Wi-Fi 6 de grado industrial para cobertura escolar y comunitaria',
        'Capítulo 3: Sistema de respaldo y estabilización fotovoltaica/eléctrica (UPS online de 2kVA y paneles solares)',
        'Capítulo 4: Red de cableado estructurado Cat 6A blindado para exteriores con supresores de picos',
        'Capítulo 5: Torre mástil arriostrado galvanizado en caliente con sistema de puesta a tierra RETIE',
        'Capítulo 6: Apropiación digital comunitaria y capacitación a docentes y estudiantes'
      ],
      normasTecnicas: [
        'NTC 2050 (Código Eléctrico Colombiano)',
        'RETIE (Reglamento Técnico de Instalaciones Eléctricas - Puesta a Tierra y Protección contra Rayos)',
        'IEEE 802.11ax (Estándar Wi-Fi 6)',
        'ISO/IEC 11801 (Cableado Genérico de Telecomunicaciones)'
      ],
      criteriosDisenoMinimos: 'Velocidad de descarga sostenida mínima de 150 a 220 Mbps y subida mínima de 25 Mbps por sede educativa; latencia inferior a 45 ms; cobertura Wi-Fi exterior garantizada en radio de 100 metros en línea de vista; sistema de energía ininterrumpida con autonomía de 8 horas continuas; resistencia mecánica del mástil a vientos de hasta 120 km/h.',
      riesgosPrevisiblesComunes: [
        'Riesgo Atmosférico: Descargas eléctricas atmosféricas (rayos) en zonas montañosas tropicales.',
        'Riesgo de Fluctuación Energética: Caídas de tensión y apagones en redes eléctricas rurales.',
        'Riesgo de Cobertura: Obstrucción de línea de vista satelital por vegetación densa o topografía escarpada.',
        'Riesgo de Seguridad: Hurto o vandalismo de terminales y paneles solares en sedes aisladas.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'UN', descripcion: 'Terminal satelital Starlink Business de alta velocidad con router de gestión' },
      { item: '2.1', unidad: 'UN', descripcion: 'Access Point Wi-Fi 6 Outdoor industrial con antenas omnidireccionales' },
      { item: '3.1', unidad: 'UN', descripcion: 'Sistema solar fotovoltaico autónomo 1.2 kWp con inversor cargador y baterías litio' },
      { item: '4.1', unidad: 'ML', descripcion: 'Cableado estructurado Cat 6A UTP/STP para intemperie con canalización EMT' },
      { item: '5.1', unidad: 'UN', descripcion: 'Mástil telescópico galvanizado de 9 metros arriostrado con sistema de tierra RETIE' },
      { item: '6.1', unidad: 'GL', descripcion: 'Taller de alfabetización digital y gobierno en línea para comunidad rural' }
    ],
    palabrasClavePositivas: [
      'internet', 'starlink', 'satelital', 'wifi', 'wi-fi', 'fibra óptica', 'conectividad digital',
      'mintic', 'ancho de banda', 'router', 'aulas digitales', 'computadores', 'telecomunicaciones'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'placa huella', 'afirmado', 'cbr', 'asfalto', 'alcantarilla de 36', 'cuneta triangular',
      'concreto mr-43', 'berma', 'subbase granular', 'invias', 'calzada vehicular'
    ],
    metaProductoDnpCodigo: '2301004',
    metaProductoDnpNombre: 'Sedes educativas rurales con solución de conectividad a internet de banda ancha operando'
  },

  agua: {
    sector: 'agua',
    nombreSector: 'Agua Potable y Saneamiento Básico (Acueductos, Alcantarillados y PTAP)',
    entidadRectora: 'Ministerio de Vivienda, Ciudad y Territorio / Viceministerio de Agua / CRA / PDA',
    marcoNormativoPrincipal: [
      'Ley 142 de 1994 (Régimen de los Servicios Públicos Domiciliarios)',
      'Resolución 0330 de 2017 (Reglamento Técnico del Sector de Agua Potable y Saneamiento Básico - RAS 2017)',
      'Resolución 2115 de 2007 (Características físicas, químicas y microbiológicas del agua potable - IRCA)',
      'Decreto 1077 de 2015 (Decreto Único Reglamentario del Sector Vivienda, Ciudad y Territorio)',
      'Resolución 501 de 2017 (Requisitos técnicos para tuberías y accesorios en sistemas de acueducto y alcantarillado)'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Captación y bocatoma de fondo con desarenador en concreto reforzado',
        'Capítulo 2: Línea de aducción y conducción en tubería PVC/RDE o Polietileno de Alta Densidad (PEAD)',
        'Capítulo 3: Planta de Tratamiento de Agua Potable (PTAP) compacta con floculador, sedimentador y filtros',
        'Capítulo 4: Tanque de almacenamiento y compensación en concreto reforzado con impermeabilización integral',
        'Capítulo 5: Red de distribución domiciliar con macromedición y micromedición veredal',
        'Capítulo 6: Sistema de desinfección por cloración automática y laboratorio de control de calidad'
      ],
      normasTecnicas: [
        'NTC 382 (Tubos de poli(cloruro de vinilo) (PVC) para presión)',
        'NTC 1500 (Código Colombiano de Fontanería)',
        'RAS-2017 Título B (Sistemas de Acueducto)',
        'NSR-10 Título C y E para estructuras hidráulicas'
      ],
      criteriosDisenoMinimos: 'Dotación neta máxima de 100 L/hab/día para clima templado-cálido según RAS-2017; velocidad mínima en redes de 0.5 m/s y máxima de 2.5 m/s; presiones de servicio en red entre 10 m.c.a. y 50 m.c.a.; capacidad de almacenamiento de regulación para 1/3 del consumo medio diario; índice de Riesgo de la Calidad del Agua (IRCA) proyectado < 5% (Agua apta para consumo humano).',
      riesgosPrevisiblesComunes: [
        'Riesgo Hidrológico: Disminución drástica del caudal de la microcuenca en época de estiaje prolongado (Fenómeno de El Niño).',
        'Riesgo Sanitario: Contaminación microbiológica en la fuente aguas arriba por ganadería o vertimientos agrícolas.',
        'Riesgo Topográfico: Roturas por sobrepresión (golpe de ariete) en tramos con desniveles pronunciados.',
        'Riesgo Institucional: Falta de capacidad tarifaria y técnica de la Junta Administradora del Acueducto Veredal.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'M3', descripcion: 'Bocatoma de fondo en concreto f\'c=21 MPa con rejilla en acero inoxidable 304' },
      { item: '1.2', unidad: 'UN', descripcion: 'Desarenador de doble módulo en concreto con válvulas de purga' },
      { item: '2.1', unidad: 'ML', descripcion: 'Suministro e instalación de tubería PEAD 3" PN-10 termofusionada en zanja' },
      { item: '3.1', unidad: 'UN', descripcion: 'Planta de tratamiento de agua potable (PTAP) modular de 3.0 L/s' },
      { item: '4.1', unidad: 'M3', descripcion: 'Tanque de almacenamiento de 50 m3 en concreto reforzado impermeabilizado' },
      { item: '5.1', unidad: 'UN', descripcion: 'Acometida domiciliaria con medidor volumétrico de 1/2" y caja de protección' }
    ],
    palabrasClavePositivas: [
      'acueducto', 'alcantarillado', 'agua potable', 'ptap', 'ptar', 'bocatoma', 'desarenador',
      'red de distribución', 'tanque de almacenamiento', 'irca', 'cloración', 'ras', 'saneamiento'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'placa huella', 'afirmado', 'cbr', 'starlink', 'antena satelital', 'wi-fi 6',
      'carpeta asfáltica', 'mástil arriostrado'
    ],
    metaProductoDnpCodigo: '2101001',
    metaProductoDnpNombre: 'Personas con acceso a nuevo o mejorado servicio de agua potable con calidad certificada'
  },

  educacion: {
    sector: 'educacion',
    nombreSector: 'Educación & Infraestructura Escolar (Aulas, Baterías Sanitarias y Dotación)',
    entidadRectora: 'Ministerio de Educación Nacional / Fondo de Financiamiento de la Infraestructura Educativa (FFIE)',
    marcoNormativoPrincipal: [
      'Ley 115 de 1994 (Ley General de Educación)',
      'NTC 4595 (Ingeniería y Arquitectura de Edificaciones Escolares)',
      'NTC 4596 (Señalización para Instalaciones Educativas)',
      'Resolución 0019 de 2021 FFIE (Lineamientos de Diseño de Infraestructura Educativa)',
      'Decreto 1075 de 2015 (Decreto Único Reglamentario del Sector Educación)'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Cimentación y estructura sismorresistente bajo NSR-10 (Pórticos en concreto f\'c=28 MPa)',
        'Capítulo 2: Mampostería estructural y acabados lavables de alta durabilidad',
        'Capítulo 3: Cubierta termoacústica autoportante con aislamiento térmico y recolección de aguas lluvias',
        'Capítulo 4: Baterías sanitarias con criterio de accesibilidad universal (Ley 1618 de 2013)',
        'Capítulo 5: Instalaciones eléctricas escolares RETIE con iluminación LED 300 luxes en aula',
        'Capítulo 6: Dotación de mobiliario escolar ergonómico bajo NTC 4734'
      ],
      normasTecnicas: [
        'NSR-10 (Grupo de Ocupación III - Edificaciones indispensables y de atención comunitaria)',
        'NTC 4595 (Áreas mínimas de 1.8 m2 por alumno en aula y ventilación cruzada natural)',
        'RETIE y RETILAP (Iluminación y eficiencia energética)'
      ],
      criteriosDisenoMinimos: 'Área mínima de aula de 60 m2 para 30 estudiantes (2.0 m2/estudiante); altura libre mínima de 3.0 metros; ventilación cruzada natural permanente con área de apertura superior al 15% del área de piso; iluminación natural complementada con LED de 300 luxes a nivel de mesa; baños diferenciados por género y módulo accesible para personas con movilidad reducida.',
      riesgosPrevisiblesComunes: [
        'Riesgo Estructural: Vulnerabilidad sísmica de sedes antiguas contiguas que requieren demolición o reforzamiento.',
        'Riesgo de Abandono Escolar: Dificultades de reubicación temporal de los alumnos durante las obras civiles.',
        'Riesgo Sanitario: Carencia de fuentes de agua potable en la sede que impida el funcionamiento de las baterías.',
        'Riesgo de Humedad: Filtraciones en cubiertas por precipitaciones intensas en zonas de ladera.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'M3', descripcion: 'Concreto estructural f\'c=28 MPa (4000 PSI) para zapatas, vigas y columnas' },
      { item: '2.1', unidad: 'M2', descripcion: 'Muro en mampostería en ladrillo a la vista confinado con pañete y pintura epóxica' },
      { item: '3.1', unidad: 'M2', descripcion: 'Cubierta en panel sándwich termoacústico con estructura metálica en celosía' },
      { item: '4.1', unidad: 'UN', descripcion: 'Batería sanitaria escolar completa antivandálica con grifería economizadora' },
      { item: '5.1', unidad: 'UN', descripcion: 'Punto eléctrico e iluminación LED estanca 40W bajo especificaciones RETIE' },
      { item: '6.1', unidad: 'UN', descripcion: 'Puesto de trabajo bipersonal ergonómico mesa y dos sillas NTC 4734' }
    ],
    palabrasClavePositivas: [
      'aula', 'colegio', 'escuela', 'sede educativa', 'batería sanitaria', 'estudiantes', 
      'docentes', 'ffie', 'simat', 'laboratorio escolar', 'comedor escolar', 'ntc 4595'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'placa huella', 'afirmado vial', 'cbr', 'subbase granular', 'pavimento asfáltico', 
      'alcantarilla 36 invias', 'carretera'
    ],
    metaProductoDnpCodigo: '2401001',
    metaProductoDnpNombre: 'Aulas escolares y espacios educativos construidos y mejorados con estándares de calidad'
  },

  salud: {
    sector: 'salud',
    nombreSector: 'Salud & Infraestructura Hospitalaria (Puestos de Salud y Dotación Biomédica)',
    entidadRectora: 'Ministerio de Salud y Protección Social / Secretarías Departamentales de Salud',
    marcoNormativoPrincipal: [
      'Ley 100 de 1993 (Sistema de Seguridad Social Integral)',
      'Resolución 3100 de 2019 MinSalud (Condiciones de Habilitación de Servicios de Salud)',
      'Resolución 4445 de 1996 (Condiciones Sanitarias y Arquitectónicas de Instituciones Prestadoras de Salud)',
      'Decreto 780 de 2016 (Decreto Único Reglamentario del Sector Salud)',
      'NSR-10 Título A.2.5 (Edificaciones Indispensables - Categoría de Ocupación IV)'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Adecuación arquitectónica bajo estándares de habilitación sanitaria (Res. 3100/2019)',
        'Capítulo 2: Redes hidrosanitarias hospitalarias con fluxómetros y lavado quirúrgico',
        'Capítulo 3: Red eléctrica de emergencia RETIE con planta eléctrica diésel y transferencia automática',
        'Capítulo 4: Sistema de climatización y ventilación mecánica con filtros HEPA para consultorios',
        'Capítulo 5: Ruta de gestión y almacenamiento de residuos hospitalarios y biológicos peligrosos',
        'Capítulo 6: Dotación de equipos biomédicos de primer nivel (Fonendoscopios, desfibrilador DEA, camillas)'
      ],
      normasTecnicas: [
        'NSR-10 Grupo IV (Coeficiente de importancia 1.5 - Hospitales y Centros de Salud)',
        'NTC 2050 Sección 517 (Instalaciones en Instituciones de Asistencia Médica)',
        'Resolución 3100 de 2019 (Criterios de Bioseguridad y Acabados de Superficies Asépticas)'
      ],
      criteriosDisenoMinimos: 'Pisos conductivos o de vinilo de alta densidad sin juntas (media caña) en áreas clínicas; paredes lavables e impermeables hasta 2.0 metros de altura; sistema de ventilación que garantice mínimo 6 renovaciones de aire por hora; planta eléctrica de respaldo con autonomía de 72 horas para mantener cadena de frío de biológicos.',
      riesgosPrevisiblesComunes: [
        'Riesgo Biológico: Ruptura de bioseguridad por deficiente separación de áreas limpias y contaminadas.',
        'Riesgo Eléctrico: Interrupción de la cadena de frío de vacunas por fallas en la red comercial.',
        'Riesgo Normativo: No acreditación de habilitación ante la Secretaría de Salud por detalles de acabados.',
        'Riesgo Logístico: Dificultades de evacuación de urgencias por vías intransitables hacia hospital de referencia.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'M2', descripcion: 'Piso vinílico homogéneo antibacteriano continuo con zócalo sanitario media caña' },
      { item: '1.2', unidad: 'M2', descripcion: 'Pintura epóxica grado clínico lavable y antibacteriana en muros y cielo raso' },
      { item: '2.1', unidad: 'UN', descripcion: 'Lavamanos quirúrgico en acero inoxidable con grifería de pedal o sensor infrarrojo' },
      { item: '3.1', unidad: 'UN', descripcion: 'Planta eléctrica de emergencia 30 kVA con cabina insonorizada y transferencia' },
      { item: '4.1', unidad: 'UN', descripcion: 'Nevera solar biomédica para almacenamiento de vacunas certificada PQS-OMS' },
      { item: '5.1', unidad: 'UN', descripcion: 'Desfibrilador Externo Automático (DEA) bifásico con paletas pediátricas y adultas' }
    ],
    palabrasClavePositivas: [
      'salud', 'puesto de salud', 'centro de salud', 'hospital', 'urgencias', 'biomédico',
      'cadena de frío', 'vacunación', 'médico', 'enfermería', 'resolución 3100', 'ambulancia'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'placa huella', 'afirmado', 'cbr', 'starlink', 'antena de internet', 'alcantarilla 36 invias',
      'subbase granular', 'pavimento'
    ],
    metaProductoDnpCodigo: '2501001',
    metaProductoDnpNombre: 'Puestos y centros de atención básica en salud construidos y dotados con habilitación sanitaria'
  },

  agropecuario: {
    sector: 'agropecuario',
    nombreSector: 'Agricultura & Desarrollo Rural (Distritos de Riego, Centros de Acopio y Transformación)',
    entidadRectora: 'Ministerio de Agricultura y Desarrollo Rural / Agencia de Desarrollo Rural (ADR) / UPRA',
    marcoNormativoPrincipal: [
      'Ley 101 de 1993 (Ley General de Desarrollo Agropecuario y Pesquero)',
      'Ley 1876 de 2017 (Sistema Nacional de Innovación Agropecuaria - SNIA)',
      'Resolución 138 de 2018 ADR (Lineamientos para Proyectos Integrales de Desarrollo Agropecuario)',
      'Decreto 1071 de 2015 (Decreto Único Reglamentario del Sector Administrativo Agropecuario)',
      'Ley 41 de 1993 (Subsidio de Adecuación de Tierras y Distritos de Riego)'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Adecuación de suelos y sistemas de captación para riego intrapredial',
        'Capítulo 2: Redes de distribución presurizadas para riego por goteo y microaspersión',
        'Capítulo 3: Infraestructura comunitaria de poscosecha, fermentación y secado tecnificado',
        'Capítulo 4: Cuartos de almacenamiento y cadena de frío con energía renovable',
        'Capítulo 5: Dotación de maquinaria agroindustrial menor y herramientas de beneficio',
        'Capítulo 6: Asistencia técnica integral y extensión agropecuaria bajo Ley 1876'
      ],
      normasTecnicas: [
        'NTC 4867 (Buenas Prácticas Agrícolas BPA)',
        'Resolución 2674 de 2013 INVIMA (Buenas Prácticas de Manufactura en Alimentos)',
        'Guía Técnica ADR para Sistemas de Riego Parcelario'
      ],
      criteriosDisenoMinimos: 'Eficiencia de aplicación del sistema de riego > 85% mediante tecnologías de goteo presurizado; diseño hidráulico para cubrir la evapotranspiración de cultivo en época seca crítica; cumplimiento estricto de estándares BPM de inocuidad en centros de beneficio comunitario; articulación comercial formal con acuerdos de compra y comercio justo.',
      riesgosPrevisiblesComunes: [
        'Riesgo Climático: Heladas o sequías extremas que afecten la floración y rendimiento de los cultivos.',
        'Riesgo Fitosanitario: Ataque de plagas o enfermedades fungosas en plantaciones no tecnificadas.',
        'Riesgo de Mercado: Caída internacional o regional del precio del producto básico (ej. café o cacao).',
        'Riesgo Operativo: Falta de mantenimiento preventivo a bombas y filtros por la asociación campesina.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'HA', descripcion: 'Sistema intrapredial de riego por goteo con cabezal de fertirriego y filtros de malla' },
      { item: '2.1', unidad: 'UN', descripcion: 'Reservorio de agua geomembrana calibre 40 mils con capacidad de 250 m3' },
      { item: '3.1', unidad: 'UN', descripcion: 'Módulo marquesina de secado solar tecnificado en estructura metálica con policarbonato' },
      { item: '4.1', unidad: 'UN', descripcion: 'Cajón de fermentación en madera cedro/roble de tres niveles para cacao de aroma' },
      { item: '5.1', unidad: 'UN', descripcion: 'Despulpadora ecológica de café con motor eléctrico y desmucilaginador vertical' },
      { item: '6.1', unidad: 'MES', descripcion: 'Acompañamiento técnico agronómico y certificación en BPA predio a predio' }
    ],
    palabrasClavePositivas: [
      'agropecuario', 'riego', 'distrito de riego', 'café', 'cacao', 'panela', 'bpa',
      'cosecha', 'poscosecha', 'reservorio', 'adr', 'agrícola', 'asociación campesina'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'starlink', 'antena satelital', 'wi-fi 6', 'computadores escolares', 'placa huella vial',
      'pavimento asfáltico', 'alcantarilla de 36'
    ],
    metaProductoDnpCodigo: '2601002',
    metaProductoDnpNombre: 'Productores agropecuarios con apoyo en infraestructura productiva, riego y comercialización'
  },

  energia: {
    sector: 'energia',
    nombreSector: 'Minas & Energía (Electrificación Rural y Soluciones Solares Fotovoltaicas)',
    entidadRectora: 'Ministerio de Minas y Energía / UPME / IPSE / FENOGE',
    marcoNormativoPrincipal: [
      'Ley 142 y 143 de 1994 (Régimen Eléctrico Colombiano)',
      'Ley 1715 de 2014 y Ley 2099 de 2021 (Transición Energética y Fuentes No Convencionales de Energía Renovable - FNCER)',
      'Resolución 90708 de 2013 MinMinas (Reglamento Técnico de Instalaciones Eléctricas - RETIE)',
      'Resolución 180540 de 2010 (Reglamento Técnico de Iluminación y Alumbrado Público - RETILAP)',
      'Resolución CREG 174 de 2021 (Autogeneración y Generación Distribuida)'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Estudio de recurso solar y diseño del generador fotovoltaico',
        'Capítulo 2: Suministro e instalación de paneles solares monocristalinos Tier-1 (potencia >= 550Wp)',
        'Capítulo 3: Banco de almacenamiento en baterías de Litio Ferro-Fosfato (LiFePO4) de ciclo profundo',
        'Capítulo 4: Inversor solar cargador híbrido de onda senoidal pura con protecciones integradas',
        'Capítulo 5: Estructura de soporte en aluminio anodizado resistente a vientos de 100 km/h',
        'Capítulo 6: Sistema de puesta a tierra equipotencial y descargadores de sobretensión DPS bajo RETIE'
      ],
      normasTecnicas: [
        'RETIE (Libro II Instalaciones Fotovoltaicas)',
        'NTC 2050 (Artículo 690 Sistemas Solares Fotovoltaicos)',
        'IEC 61215 / IEC 61730 (Calidad y seguridad en módulos fotovoltaicos)',
        'IEC 62619 (Seguridad para baterías de litio industriales)'
      ],
      criteriosDisenoMinimos: 'Generación mínima diaria estimada calculada con el mes de menor radiación solar histórica (Peor Mes de Radiación en NASA Surface Meteorology); autonomía mínima de 2.5 días sin radiación (días nublados); profundidad máxima de descarga DoD del 80% en baterías de litio para vida útil > 4000 ciclos; inversores con distorsión armónica total THD < 3%.',
      riesgosPrevisiblesComunes: [
        'Riesgo de Sobrecorriente: Daño en inversores por descargas atmosféricas inducidas en zonas rurales abiertas.',
        'Riesgo de Sombreado: Disminución de eficiencia de generación por crecimiento de copas de árboles circundantes.',
        'Riesgo Operativo: Mal uso de la energía por sobrecarga de aparatos de alta resistencia térmica (calentadores/estufas).',
        'Riesgo de Hurto: Sustracción de paneles en viviendas rurales dispersas.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'UN', descripcion: 'Panel solar monocristalino PERC 550Wp de alta eficiencia certificado IEC' },
      { item: '2.1', unidad: 'UN', descripcion: 'Batería de Litio LiFePO4 48V 100Ah (4.8 kWh) con BMS inteligente' },
      { item: '3.1', unidad: 'UN', descripcion: 'Inversor cargador solar híbrido 5 kW onda pura 48V con controlador MPPT' },
      { item: '4.1', unidad: 'UN', descripcion: 'Estructura coplanar o inclinada en aluminio y acero inoxidable para techo' },
      { item: '5.1', unidad: 'UN', descripcion: 'Tablero de protecciones DC y AC con breakers, fusibles gPV y DPS Clase II' },
      { item: '6.1', unidad: 'UN', descripcion: 'Malla de puesta a tierra con electrodo de cobre y soldadura exotérmica RETIE' }
    ],
    palabrasClavePositivas: [
      'solar', 'fotovoltaico', 'energía solar', 'electrificación rural', 'paneles solares',
      'baterías litio', 'inversor', 'retie', 'upme', 'ipse', 'fncer', 'renovable'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'placa huella', 'afirmado', 'cbr', 'asfalto', 'alcantarilla 36 invias', 'puente vehicular',
      'ptap', 'bocatoma'
    ],
    metaProductoDnpCodigo: '2801001',
    metaProductoDnpNombre: 'Viviendas rurales y sedes comunitarias conectadas al servicio de energía eléctrica con FNCER'
  },

  medio_ambiente: {
    sector: 'medio_ambiente',
    nombreSector: 'Ambiente & Gestión del Riesgo (Obras de Mitigación, Muros y Estabilización)',
    entidadRectora: 'Ministerio de Ambiente / Unidad Nacional para la Gestión del Riesgo de Desastres (UNGRD) / CAR',
    marcoNormativoPrincipal: [
      'Ley 1523 de 2012 (Política Nacional de Gestión del Riesgo de Desastres)',
      'Ley 99 de 1993 (Creación del Sistema Nacional Ambiental - SINA)',
      'Decreto 1076 de 2015 (Decreto Único Reglamentario del Sector Ambiente)',
      'Resolución 1085 de 2018 (Metodología de Evaluación y Mitigación del Riesgo)',
      'Manual de Estabilidad de Taludes y Control de Erosión del INVIAS / UNGRD'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Estudios geotécnicos, topografía de detalle y análisis de amenaza por movimientos en masa',
        'Capítulo 2: Movimiento de tierras, banqueo de taludes y peinado de coronas inestables',
        'Capítulo 3: Obras de contención rígida o semirrígida (Muros en concreto reforzado o gaviones triples torsión)',
        'Capítulo 4: Drenaje subsuperficial y superficial (Filtros franceses, lloraderos y zanjas de coronación)',
        'Capítulo 5: Obras de bioingeniería (Geomallas biodegradables, hidrosiembra y trinchos vivos de guadua)',
        'Capítulo 6: Obras hidráulicas en cauce (Descolmatación, jarillones y diques de disipación)'
      ],
      normasTecnicas: [
        'NSR-10 Título H (Estudios Geotécnicos)',
        'NTC 2403 (Mallas de alambre de acero de triple torsión para gaviones)',
        'Manual de Obras de Mitigación de la UNGRD'
      ],
      criteriosDisenoMinimos: 'Factor de seguridad mínimo a deslizamiento FS >= 1.5 en condiciones estáticas y FS >= 1.1 en condiciones pseudo-estáticas (sismo de diseño NSR-10); lloraderos en tubería PVC perforada de 3" cada 1.5 metros con geotextil no tejido para evitar taponamiento; zanja de coronación con sección trapezoidal mínima de 0.40 x 0.40 m revestida en concreto.',
      riesgosPrevisiblesComunes: [
        'Riesgo Sísmico: Aceleración pico del terreno que induzca nuevas fallas geológicas durante excavaciones.',
        'Riesgo de Lluvias Torrenciales: Crecientes súbitas que socaven la base del muro durante la fase constructiva.',
        'Riesgo de Infiltración: Taponamiento de lloraderos por sedimentos finos que eleve la presión hidrostática.',
        'Riesgo Predial: Invasión de zonas de ronda o servidumbres de intervención en cauces.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'M3', descripcion: 'Muro en gaviones de alambre galvanizado triple torsión calibre 13 con piedra rajón' },
      { item: '2.1', unidad: 'M3', descripcion: 'Concreto f\'c=21 MPa para cimentación y vástago de muro de contención en voladizo' },
      { item: '3.1', unidad: 'M2', descripcion: 'Geotextil no tejido de alto gramaje para separación y filtro en trasdós de muro' },
      { item: '4.1', unidad: 'ML', descripcion: 'Filtro francés longitudinal con tubería corrugada perforada de 4" y grava lavada' },
      { item: '5.1', unidad: 'ML', descripcion: 'Zanja de coronación trapezoidal en concreto f\'c=17.5 MPa e=8cm reforzada' },
      { item: '6.1', unidad: 'M2', descripcion: 'Biotratamiento de talud con hidrosiembra, geomanto orgánico y especies nativas' }
    ],
    palabrasClavePositivas: [
      'riesgo', 'mitigación', 'desastre', 'ungrd', 'gaviones', 'muro de contención',
      'deslizamiento', 'talud', 'erosión', 'socavación', 'creciente súbita', 'bioingeniería'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'starlink', 'antena wifi', 'simat', 'aulas digitales', 'pupitres escolares',
      'equipos biomédicos hospitalarios'
    ],
    metaProductoDnpCodigo: '3201003',
    metaProductoDnpNombre: 'Metros lineales de obras de mitigación y protección construidas contra amenazas de desastre'
  },

  vivienda: {
    sector: 'vivienda',
    nombreSector: 'Vivienda, Ciudad y Espacio Público (Mejoramiento de Vivienda y Entorno Urbano)',
    entidadRectora: 'Ministerio de Vivienda, Ciudad y Territorio (MVCT) / Fonvivienda',
    marcoNormativoPrincipal: [
      'Ley 1537 de 2012 (Ley de Desarrollo Urbano y Acceso a la Vivienda)',
      'Ley 2079 de 2021 (Política Pública de Hábitat y Vivienda)',
      'Decreto 1077 de 2015 (Decreto Único Reglamentario del Sector Vivienda)',
      'Resolución 0070 de 2023 MVCT (Lineamientos Técnicos del Programa Cambia Mi Casa)',
      'NSR-10 (Norma Sismo Resistente de Colombia - Título E para Vivienda de Uno y Dos Pisos)'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Diagnóstico técnico estructural predial y levantamiento patológico por vivienda',
        'Capítulo 2: Mejoramiento de pisos (Sustitución de tierra por placa en concreto f\'c=21 MPa y acabado pulido)',
        'Capítulo 3: Mejoramiento de cubiertas (Reemplazo por teja termoacústica y estructura metálica liviana)',
        'Capítulo 4: Adecuación de unidades básicas de saneamiento (Batería sanitaria, ducha y enchape cerámico)',
        'Capítulo 5: Instalación de cocina saludable con mesón en acero inoxidable y trampa de grasas',
        'Capítulo 6: Redes hidrosanitarias y eléctricas intradomiciliarias bajo NTC 1500 y RETIE'
      ],
      normasTecnicas: [
        'NSR-10 Título E (Casas de uno y dos pisos de mampostería confinada)',
        'NTC 1500 (Código Colombiano de Fontanería)',
        'NTC 2050 (Instalaciones Eléctricas Interiores)'
      ],
      criteriosDisenoMinimos: 'Eliminación del 100% de pisos en tierra mediante losa de concreto de 7 cm con malla electrosoldada; cubiertas con pendiente mínima del 15% que garanticen estanqueidad total y aislamiento térmico; unidad sanitaria completa con inodoro ahorrador, lavamanos y ducha con muros enchapados a 1.80 m de altura.',
      riesgosPrevisiblesComunes: [
        'Riesgo Predial: Inseguridad jurídica en la titularidad o posesión legal del inmueble intervenido.',
        'Riesgo Estructural: Muros de adobe o bahareque en estado de ruina no aptos para recibir cargas de cubierta.',
        'Riesgo Sanitario: Carencia de red pública de alcantarillado que obligue a instalar pozo séptico individual.',
        'Riesgo Social: Inconformidad familiar por expectativas no cubiertas en el alcance de mejoramiento.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'M2', descripcion: 'Construcción de piso en concreto esmaltado e=7cm con malla electrosoldada M-084' },
      { item: '2.1', unidad: 'M2', descripcion: 'Cambio integral de cubierta en teja termoacústica UPVC con estructura metálica' },
      { item: '3.1', unidad: 'UN', descripcion: 'Módulo de batería sanitaria básica (inodoro, lavamanos, ducha, grifería y enchape)' },
      { item: '4.1', unidad: 'UN', descripcion: 'Mesón de cocina en acero inoxidable de 1.20m con pozuelo y grifería monocontrol' },
      { item: '5.1', unidad: 'UN', descripcion: 'Sistema de tratamiento individual pozo séptico plástico de 1000L con campo de infiltración' },
      { item: '6.1', unidad: 'GL', descripcion: 'Adecuación de red eléctrica interior con tablero bifilar y 4 salidas reguladas RETIE' }
    ],
    palabrasClavePositivas: [
      'vivienda', 'mejoramiento de vivienda', 'pisos', 'techos', 'cubiertas', 'baños', 
      'cocinas saludables', 'fonvivienda', 'cambia mi casa', 'espacio público', 'parque urbano'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'starlink', 'antena satelital', 'wi-fi 6', 'simat', 'placa huella vehicular', 'afirmado invias'
    ],
    metaProductoDnpCodigo: '4001001',
    metaProductoDnpNombre: 'Viviendas intervenidas con soluciones de mejoramiento habitacional integral'
  },

  deporte: {
    sector: 'deporte',
    nombreSector: 'Deporte & Recreación (Escenarios Deportivos, Polideportivos y Parques Biosaludables)',
    entidadRectora: 'Ministerio del Deporte / Coldeportes / Ligas y Entidades Territoriales',
    marcoNormativoPrincipal: [
      'Ley 181 de 1995 (Ley del Deporte, la Recreación y el Aprovechamiento del Tiempo Libre)',
      'Resolución 138 de 2020 MinDeporte (Lineamientos para Escenarios Deportivos)',
      'NSR-10 (Estructuras Metálicas y Graderías bajo Requisitos de Evacuación y Cargas)',
      'Guía Técnica de Diseño de Escenarios Deportivos del Ministerio del Deporte'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Replanteo y cimentación profunda/superficial para columnas de cubierta',
        'Capítulo 2: Placa polideportiva multifuncional en concreto reforzado f\'c=28 MPa con acabado sintético epóxico',
        'Capítulo 3: Estructura metálica autoportante para cubierta (Cerchas tubulares y perfiles estructurales ASTM A500)',
        'Capítulo 4: Cubierta arquitectónica en teja sin traslapo tipo standing seam con canoas y bajantes',
        'Capítulo 5: Cerramiento perimetral en malla eslabonada plastificada galvanizada y contra-impactos',
        'Capítulo 6: Sistema de iluminación deportiva LED con reflectores de alta potencia (200 luxes) y tablero RETILAP',
        'Capítulo 7: Dotación de arcos multifuncionales (Microfútbol/Baloncesto) y postes de voleibol reglamentarios'
      ],
      normasTecnicas: [
        'NSR-10 Título F (Estructuras Metálicas) y Título K (Requisitos de Seguridad y Evacuación)',
        'NTC 4595 (Áreas deportivas y lúdicas)',
        'RETILAP (Norma Técnica de Iluminación Deportiva para Escenarios de Formación y Competencia)'
      ],
      criteriosDisenoMinimos: 'Dimensiones reglamentarias de placa de 32.0 x 19.0 metros (área mínima 608 m2); pendientes de drenaje superficial del 0.8% a 1.0% hacia los laterales; iluminación mínima horizontal de 200 luxes con uniformidad >= 0.6; estructura de cubierta calculada con carga de viento local y sismo de diseño; pintura sintética antideslizante con demarcación multideportiva según federaciones.',
      riesgosPrevisiblesComunes: [
        'Riesgo Estructural: Deformación excesiva de cerchas por viento o corrosión atmosférica prematura.',
        'Riesgo Hidráulico: Inundación de la placa por rebose de canoas de aguas lluvias mal dimensionadas.',
        'Riesgo de Pavimento: Fisuración de la placa por asentamiento diferencial del terraplén o ausencia de juntas de dilatación.',
        'Riesgo Comunitario: Conflictos de uso o falta de comité de mantenimiento del escenario.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'M2', descripcion: 'Placa deportiva en concreto reforzado f\'c=28 MPa e=10cm con malla electrosoldada' },
      { item: '2.1', unidad: 'M2', descripcion: 'Recubrimiento sintético acrílico deportivo antideslizante con demarcación multideporte' },
      { item: '3.1', unidad: 'KG', descripcion: 'Suministro e instalación de estructura metálica para cubierta en perfiles estructurales' },
      { item: '4.1', unidad: 'M2', descripcion: 'Cubierta en teja curva o trapezoidal prepintada con canaletas en lámina galvanizada' },
      { item: '5.1', unidad: 'ML', descripcion: 'Cerramiento perimetral en malla eslabonada calibre 10 con tubos galvanizados de 2"' },
      { item: '6.1', unidad: 'UN', descripcion: 'Reflector LED deportivo de 250W grado industrial hermético IP66 con mástil' },
      { item: '7.1', unidad: 'JGO', descripcion: 'Estructura integrada para baloncesto, microfútbol y voleibol con tableros acrílicos' }
    ],
    palabrasClavePositivas: [
      'deporte', 'polideportivo', 'placa polideportiva', 'cancha', 'cancha sintética', 
      'cubierta polideportivo', 'parque biosaludable', 'graderías', 'mindeporte', 'recreación'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'starlink', 'antena de conectividad', 'fibra óptica', 'simat', 'red de acueducto', 
      'placa huella vehicular', 'hospital'
    ],
    metaProductoDnpCodigo: '4301001',
    metaProductoDnpNombre: 'Escenarios y complejos deportivos construidos y adecuados para la comunidad'
  },

  cultura: {
    sector: 'cultura',
    nombreSector: 'Cultura & Patrimonio (Casas de Cultura, Bibliotecas y Centros de Memoria)',
    entidadRectora: 'Ministerio de las Culturas, las Artes y los Saberes (MinCulturas)',
    marcoNormativoPrincipal: [
      'Ley 397 de 1997 (Ley General de Cultura de Colombia)',
      'Ley 1185 de 2008 (Patrimonio Cultural de la Nación)',
      'Ley 1379 de 2010 (Red Nacional de Bibliotecas Públicas)',
      'Decreto 1080 de 2015 (Decreto Único Reglamentario del Sector Cultura)'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Adecuación arquitectónica de espacios de formación artística y salones de danza',
        'Capítulo 2: Acondicionamiento acústico para auditorio y salas de ensayo musical',
        'Capítulo 3: Infraestructura para biblioteca pública, salas de lectura infantil y archivo histórico',
        'Capítulo 4: Iluminación escénica profesional y sistema de sonido y proyección audiovisual',
        'Capítulo 5: Dotación de instrumentos musicales para bandas de viento, cuerdas y percusión tradicional',
        'Capítulo 6: Accesibilidad universal y protocolo de conservación patrimonial'
      ],
      normasTecnicas: [
        'NSR-10 (Grupo de Ocupación III - Edificaciones con afluencia comunitaria)',
        'NTC 4595 (Condiciones acústicas y lumínicas en espacios formativos)',
        'Lineamientos Técnicos del Plan Nacional de Música para la Convivencia (PNMC)'
      ],
      criteriosDisenoMinimos: 'Aislamiento acústico en salas de música con índice Rw >= 45 dB; piso de madera o linóleo amortiguado con cámara de aire para salones de danza; estantería metálica sismorresistente en biblioteca; climatización pasiva para evitar deterioro por humedad de instrumentos y textos.',
      riesgosPrevisiblesComunes: [
        'Riesgo Patrimonial: Modificación indebida de fachadas o elementos con valor arquitectónico de conservación.',
        'Riesgo Acústico: Contaminación sonora entre salones por deficiencia en juntas o cielo raso.',
        'Riesgo Instrumental: Descalibración o daño en instrumentos musicales por humedad relativa superior al 70%.',
        'Riesgo Operativo: Falta de formadores culturales contratados para dar continuidad a las escuelas artísticas.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'M2', descripcion: 'Piso especial amortiguado en madera con bastidor y cámara de aire para danza' },
      { item: '2.1', unidad: 'M2', descripcion: 'Tratamiento acústico en muros con paneles absorbentes ranurados en madera' },
      { item: '3.1', unidad: 'GL', descripcion: 'Dotación instrumental para banda sinfónica o tradicional (viento madera, metal y percusión)' },
      { item: '4.1', unidad: 'UN', descripcion: 'Sistema de audio y microfonía profesional para auditorio cultural' },
      { item: '5.1', unidad: 'UN', descripcion: 'Estantería metálica modular de doble cara para biblioteca pública con acabado electrostático' }
    ],
    palabrasClavePositivas: [
      'cultura', 'casa de la cultura', 'biblioteca', 'auditorio', 'música', 'danza', 
      'patrimonio cultural', 'instrumentos musicales', 'minculturas', 'artes'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'placa huella vehicular', 'invias', 'cbr subrasante', 'starlink satelital', 'acueducto red'
    ],
    metaProductoDnpCodigo: '3301001',
    metaProductoDnpNombre: 'Espacios culturales, artísticos y bibliotecas públicas adecuados y dotados'
  },

  seguridad_justicia: {
    sector: 'seguridad_justicia',
    nombreSector: 'Seguridad Ciudadana, Justicia & Convivencia (Cámaras CCTV, Estaciones y CAD)',
    entidadRectora: 'Ministerio del Interior / FONCONSEG / Policía Nacional / Ministerio de Justicia',
    marcoNormativoPrincipal: [
      'Ley 62 de 1993 (Normas sobre la Policía Nacional)',
      'Ley 1801 de 2016 (Código Nacional de Seguridad y Convivencia Ciudadana)',
      'Ley 2197 de 2022 (Ley de Seguridad Ciudadana)',
      'Guía Técnica para la Implementación de Sistemas de Videovigilancia (MinInterior / FONCONSEG)'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Suministro e instalación de postes metálicos con brazo antivandálico para cámaras de seguridad',
        'Capítulo 2: Cámaras PTZ domo de alta resolución (4K/8MP) con zoom óptico 32x y analítica forense',
        'Capítulo 3: Cámaras fijas LPR para lectura automática de placas de vehículos en entradas/salidas del municipio',
        'Capítulo 4: Red de transmisión de datos (Fibra óptica monomodo armada o radioenlaces punto a punto microondas)',
        'Capítulo 5: Centro Automático de Despacho (CAD) con videowall, servidores de almacenamiento NVR y UPS redundante',
        'Capítulo 6: Sistema de alimentación eléctrica ininterrumpida con respaldo solar y protecciones atmosféricas'
      ],
      normasTecnicas: [
        'RETIE (Sistemas de puesta a tierra y protección contra descargas para postes y salas CAD)',
        'NTC/ISO 27001 (Seguridad de la Información y Cadena de Custodia de Grabaciones)',
        'ONVIF Perfil S y G (Interoperabilidad de video IP)'
      ],
      criteriosDisenoMinimos: 'Almacenamiento continuo de video en resolución nativa durante mínimo 30 días calendario (conforme directrices de la Policía Nacional); analítica de detección de intrusión, cruce de línea y placas vehiculares; enlace troncal con disponibilidad del 99.8%; UPS online con redundancia N+1 y respaldo de mínimo 2 horas.',
      riesgosPrevisiblesComunes: [
        'Riesgo Cibernético: Ataques de denegación de servicio o intrusión en la red de video vigilancia.',
        'Riesgo de Suministro: Vandalismo sobre tendidos de fibra óptica en zonas desoladas.',
        'Riesgo Eléctrico: Daño de cámaras montadas en postes por descargas atmosféricas directas.',
        'Riesgo Operativo: Falta de personal policial asignado para el monitoreo permanente del CAD.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'UN', descripcion: 'Poste metálico cónico galvanizado de 12m con cimentación y caja de paso' },
      { item: '2.1', unidad: 'UN', descripcion: 'Cámara domo PTZ IP 4K de 32x con infrarrojo 200m y analítica de video inteligente' },
      { item: '3.1', unidad: 'UN', descripcion: 'Cámara fija LPR especializada en lectura y reconocimiento de placas vehiculares' },
      { item: '4.1', unidad: 'KM', descripcion: 'Tendido de fibra óptica monomodo aérea ADSS de 24 hilos con herrajes y marquillado' },
      { item: '5.1', unidad: 'GL', descripcion: 'Servidor NVR empresarial con capacidad de almacenamiento RAID para 30 días continuos' },
      { item: '6.1', unidad: 'UN', descripcion: 'Videowall profesional de 3x2 pantallas industriales de 55" con bisel ultrafino' }
    ],
    palabrasClavePositivas: [
      'seguridad', 'cctv', 'cámaras de seguridad', 'videovigilancia', 'policía', 'estación de policía',
      'fonconseg', 'cad', 'comisaría de familia', 'convivencia', 'inspección de policía'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'placa huella vial', 'cbr subrasante', 'afirmado invias', 'acueducto red', 'riego parcelario'
    ],
    metaProductoDnpCodigo: '0301001',
    metaProductoDnpNombre: 'Sistemas tecnológicos de videovigilancia y seguridad ciudadana instalados y en servicio'
  },

  inclusion_social: {
    sector: 'inclusion_social',
    nombreSector: 'Inclusión Social, Primera Infancia & Adulto Mayor (CDI, Centros Vida y Casas de la Mujer)',
    entidadRectora: 'Departamento para la Prosperidad Social (DPS) / ICBF / Ministerio de Igualdad y Equidad',
    marcoNormativoPrincipal: [
      'Ley 1098 de 2006 (Código de la Infancia y la Adolescencia)',
      'Ley 1276 de 2009 y Ley 1850 de 2017 (Protección y Centros Vida para el Adulto Mayor)',
      'Ley 1804 de 2016 (Política de Estado para el Desarrollo Integral de la Primera Infancia De Cero a Siempre)',
      'Resolución 1060 de 2021 ICBF (Lineamientos de Infraestructura para Centros de Desarrollo Infantil CDI)'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Adecuación arquitectónica con accesibilidad total (Cero barreras arquitectónicas)',
        'Capítulo 2: Salas de estimulación temprana y salones pedagógicos diferenciados por ciclo vital',
        'Capítulo 3: Cocina institucional y comedor con mesones en acero inoxidable grado alimenticio',
        'Capítulo 4: Baterías sanitarias a escala infantil (inodoros y lavamanos a 35cm de altura) y geriátricas con barras de apoyo',
        'Capítulo 5: Zonas exteriores de recreación lúdica con piso de caucho amortiguante continuo',
        'Capítulo 6: Dotación de material didáctico Montessori/Waldorf y mobiliario ergonómico'
      ],
      normasTecnicas: [
        'NSR-10 (Edificaciones Comunitarias Indispensables Grupo III)',
        'NTC 4595 y NTC 6047 (Accesibilidad al Medio Físico)',
        'Resolución 2674 de 2013 INVIMA (Buenas Prácticas de Manufactura en Preparación de Alimentos)'
      ],
      criteriosDisenoMinimos: 'Puertas con ancho libre de mínimo 1.0 metro para paso de sillas de ruedas; pasillos con pasamanos dobles a 70 cm y 90 cm; esquinas redondeadas o protegidas con esquineros de caucho; cocina con campana extractora industrial y trampa de grasas; ventilación e iluminación natural en el 100% de los espacios.',
      riesgosPrevisiblesComunes: [
        'Riesgo de Accidentes: Golpes o caídas por desniveles o materiales resbaladizos en áreas húmedas.',
        'Riesgo Sanitario: Contaminación cruzada en preparación de alimentos para poblaciones vulnerables.',
        'Riesgo de Sostenibilidad: Ausencia de convenio de operación con ICBF o recursos propios para alimentación.',
        'Riesgo Social: Sobrecupo o desborde de la demanda comunitaria en sectores de alta vulnerabilidad.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'M2', descripcion: 'Piso amortiguante continuo de caucho EPDM vaciado in situ para parque infantil' },
      { item: '2.1', unidad: 'UN', descripcion: 'Batería sanitaria especial a escala infantil con fluxómetro y lavamanos ergonómico' },
      { item: '3.1', unidad: 'UN', descripcion: 'Barra de apoyo en acero inoxidable satinado de 1-1/2" para inodoros geriátricos' },
      { item: '4.1', unidad: 'GL', descripcion: 'Dotación de cocina industrial en acero inoxidable 304 con estufa de 4 puestos y campana' },
      { item: '5.1', unidad: 'GL', descripcion: 'Dotación pedagógica integral para estimulación multisensorial y primera infancia' }
    ],
    palabrasClavePositivas: [
      'primera infancia', 'cdi', 'centro de desarrollo infantil', 'adulto mayor', 'centro vida',
      'casa de la mujer', 'prosperidad social', 'dps', 'icbf', 'víctimas', 'inclusión social'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'placa huella vehicular', 'invias', 'cbr subrasante', 'starlink satelital', 'riego parcelario'
    ],
    metaProductoDnpCodigo: '4101001',
    metaProductoDnpNombre: 'Centros comunitarios, infantiles y de adulto mayor construidos y adecuados operando'
  },

  desarrollo_economico: {
    sector: 'desarrollo_economico',
    nombreSector: 'Comercio, Turismo & Desarrollo Económico (Plazas de Mercado y Malecones)',
    entidadRectora: 'Ministerio de Comercio, Industria y Turismo (MinCIT) / FONTUR',
    marcoNormativoPrincipal: [
      'Ley 300 de 1996 (Ley General de Turismo)',
      'Ley 2068 de 2020 (Ley de Turismo y Fomento)',
      'Decreto 1074 de 2015 (Decreto Único Reglamentario del Sector Comercio, Industria y Turismo)',
      'Resolución 2674 de 2013 (Inocuidad y Sanidad en Plazas de Mercado y Centros de Abasto)'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Estructura bioclimática para plaza de mercado o centro de comercialización campesina',
        'Capítulo 2: Módulos comerciales estandarizados en acero inoxidable con puntos hidrosanitarios individuales',
        'Capítulo 3: Cuarto frío y almacenamiento con control de temperatura para carnes y perecederos',
        'Capítulo 4: Pisos epóxicos de alta resistencia mecánica y química con pendientes a cárcamos de desagüe',
        'Capítulo 5: Zona de cargue y descargue pesado con patio de maniobras para camiones',
        'Capítulo 6: Planta de tratamiento de aguas residuales grasas y orgánicas previo a vertimiento'
      ],
      normasTecnicas: [
        'NSR-10 Título J y K (Requisitos contra Incendio y Evacuación en Espacios Comerciales)',
        'Reglamentos INVIMA para comercialización de cárnicos y lácteos',
        'NTC 5133 (Etiquetas ambientales y ecoturismo)'
      ],
      criteriosDisenoMinimos: 'Módulos comerciales con área mínima de 6 m2 con mesones lavables; pasillos de circulación de compradores con ancho mínimo de 2.5 metros; altura libre al centro de la nave superior a 6.0 metros para disipación térmica natural; sistema de separación de residuos en la fuente con cuarto de acopio refrigerado de desperdicios orgánicos.',
      riesgosPrevisiblesComunes: [
        'Riesgo Sanitario: Proliferación de vectores o roedores por mal manejo de desechos orgánicos.',
        'Riesgo de Tráfico: Congestión vehicular en el perímetro por falta de bahías de descargue.',
        'Riesgo de Aceptación: Resistencia de vendedores informales a reubicarse en los módulos interiores.',
        'Riesgo Tarifario: Tarifas de arriendo insuficientes para cubrir energía de cuartos fríos y aseo.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'M2', descripcion: 'Piso en resina epóxica autonivelante de 3mm de alto tráfico con cuarzo antideslizante' },
      { item: '2.1', unidad: 'UN', descripcion: 'Módulo comercial tipo carnicería/frutas en acero inoxidable con lavaplatos y cortina' },
      { item: '3.1', unidad: 'UN', descripcion: 'Cámara frigorífica modular de 30 m3 con equipo de refrigeración media temperatura' },
      { item: '4.1', unidad: 'M2', descripcion: 'Estructura metálica espacial con ventilación cenital bioclimática e iluminación natural' },
      { item: '5.1', unidad: 'UN', descripcion: 'Trampa de grasas industrial en fibra de vidrio de alta capacidad para zona de comidas' }
    ],
    palabrasClavePositivas: [
      'plaza de mercado', 'mercado campesino', 'turismo', 'malecón', 'fontur', 'mincit',
      'centro de acopio', 'galería comercial', 'ecoturismo', 'desarrollo económico'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'placa huella vial', 'cbr subrasante', 'afirmado invias', 'starlink satelital', 'hospital'
    ],
    metaProductoDnpCodigo: '3501001',
    metaProductoDnpNombre: 'Infraestructura turística y de comercialización campesina construida y puesta en servicio'
  },

  residuos_solidos: {
    sector: 'residuos_solidos',
    nombreSector: 'Gestión Integral de Residuos Sólidos & Economía Circular (ECA y Compostaje)',
    entidadRectora: 'Ministerio de Vivienda / Ministerio de Ambiente / CRA / Superintendencia de Servicios',
    marcoNormativoPrincipal: [
      'Decreto 1077 de 2015 (Título 2 Servicio Público de Aseo)',
      'Resolución 0754 de 2014 (Metodología para la formulación del PGIRS Municipal)',
      'Resolución 1407 de 2018 (Gestión Ambiental de Residuos de Envases y Empaques)',
      'Ley 2232 de 2022 (Reducción de Plásticos de Un Solo Uso y Fomento al Reciclaje)'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Estación de Clasificación y Aprovechamiento (ECA) para recicladores de oficio',
        'Capítulo 2: Línea de separación mecanizada (Tolva de recepción, banda transportadora y mesas de selección)',
        'Capítulo 3: Equipos de compactación y embalaje (Prensas enfardadoras verticales de 30 toneladas)',
        'Capítulo 4: Planta de compostaje aeróbico con volteo mecánico para residuos orgánicos de plaza de mercado',
        'Capítulo 5: Báscula camionera de pesaje electrónico con software de control tarifario del servicio de aseo',
        'Capítulo 6: Sistema de recolección y tratamiento de lixiviados con recirculación y humedales artificiales'
      ],
      normasTecnicas: [
        'RAS-2017 Título F (Sistemas de Aseo Urbano y Gestión de Residuos)',
        'NTC 5167 (Productos orgánicos usados como abonos o fertilizantes y enmiendas de suelo)',
        'NTC/ISO 14001 (Sistemas de Gestión Ambiental)'
      ],
      criteriosDisenoMinimos: 'Capacidad de procesamiento dimensionada según la tasa de generación diaria del PGIRS (mínimo 5 toneladas/día para municipio intermedio); pendiente del patio de compostaje del 2% hacia canales de lixiviados; pisos impermeabilizados con concreto reforzado o geomembrana HDPE para proteger acuíferos subterráneos.',
      riesgosPrevisiblesComunes: [
        'Riesgo de Olores: Generación de malos olores y lixiviados por exceso de humedad en pilas de compostaje.',
        'Riesgo de Incendio: Combustión espontánea en bodegas de cartón o plástico prensado.',
        'Riesgo Social: Rechazo vecinal por localización cercana a centros poblados.',
        'Riesgo Tarifario: Desconocimiento del costo de aprovechamiento en la fórmula tarifaria CRA.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'M2', descripcion: 'Bodega industrial para ECA en estructura metálica con cerramiento y ventilación' },
      { item: '2.1', unidad: 'UN', descripcion: 'Banda transportadora de selección de residuos de 12 metros con tolva y variador' },
      { item: '3.1', unidad: 'UN', descripcion: 'Prensa enfardadora hidráulica vertical para cartón y plástico de 30 toneladas' },
      { item: '4.1', unidad: 'M2', descripcion: 'Plataforma impermeable en concreto reforzado f\'c=28 MPa para compostaje aeróbico' },
      { item: '5.1', unidad: 'UN', descripcion: 'Báscula camionera electrónica de piso de 60 toneladas con plataforma metálica' }
    ],
    palabrasClavePositivas: [
      'residuos sólidos', 'reciclaje', 'eca', 'aprovechamiento', 'pgirs', 'compostaje',
      'lixiviados', 'aseo', 'basuras', 'economía circular', 'recicladores'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'starlink satelital', 'antena wifi', 'hospital urgencias', 'placa huella vehicular', 'simat escolar'
    ],
    metaProductoDnpCodigo: '3203001',
    metaProductoDnpNombre: 'Toneladas de residuos sólidos aprovechadas e infraestructura ECA en operación'
  },

  ciencia_tecnologia: {
    sector: 'ciencia_tecnologia',
    nombreSector: 'Ciencia, Tecnología & Innovación (Laboratorios STEAM, Robótica y Bioeconomía)',
    entidadRectora: 'Ministerio de Ciencia, Tecnología e Innovación (MinCiencias) / OCAD CTeI Regalías',
    marcoNormativoPrincipal: [
      'Ley 2162 de 2021 (Creación del Ministerio de Ciencia, Tecnología e Innovación)',
      'Ley 2056 de 2020 (Régimen del Sistema General de Regalías - Asignación para la CTeI)',
      'Documento CONPES 4069 de 2021 (Política Nacional de Ciencia, Tecnología e Innovación)',
      'Lineamientos Técnicos y Metodológicos para Proyectos de CTeI del MinCiencias'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Adecuación de espacios tipo Makerspace / FabLab con mobiliario colaborativo flexible',
        'Capítulo 2: Equipamiento para fabricación digital (Impresoras 3D industriales, corte láser CNC y fresadoras)',
        'Capítulo 3: Kits avanzados de robótica educativa, microcontroladores IoT y sensores de adquisición de datos',
        'Capítulo 4: Estaciones de computación gráfica de alto rendimiento para diseño CAD y programación',
        'Capítulo 5: Red de datos de alta velocidad con switches Gigabit y cableado estructurado certificado',
        'Capítulo 6: Metodología pedagógica STEAM y formación de formadores comunitarios y docentes'
      ],
      normasTecnicas: [
        'RETIE (Instalaciones Eléctricas con Protección de Equipos Sensibles y Tierra Aislada)',
        'NTC/ISO 9001 (Gestión de la Calidad en Procesos de I+D+i)',
        'Estándares Internacionales FAB Foundation para Laboratorios de Fabricación'
      ],
      criteriosDisenoMinimos: 'Sistema de extracción de humos y filtrado para máquinas de corte láser; circuito eléctrico dedicado con transformador de aislamiento y UPS para maquinaria CNC; conectividad local simétrica con ancho de banda superior a 1 Gbps en red interna; espacios modulares con capacidad para trabajo en equipos multidisciplinarios.',
      riesgosPrevisiblesComunes: [
        'Riesgo de Obsolescencia: Rápido envejecimiento tecnológico si no se actualizan licencias o firmwares.',
        'Riesgo de Subutilización: Falta de proyectos aplicados de los jóvenes por falta de mentorías permanentes.',
        'Riesgo de Mantenimiento: Daño en cabezales de impresión o láser por consumibles de baja calidad.',
        'Riesgo de Propiedad Intelectual: Conflictos en la titularidad de patentes o modelos de utilidad desarrollados.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'UN', descripcion: 'Impresora 3D industrial de gran formato con doble extrusor y cámara cerrada' },
      { item: '2.1', unidad: 'UN', descripcion: 'Máquina de corte y grabado láser CO2 de 100W con enfriador chiller y extractor' },
      { item: '3.1', unidad: 'JGO', descripcion: 'Kit pedagógico de robótica y sensores IoT para 25 puestos de aprendizaje' },
      { item: '4.1', unidad: 'UN', descripcion: 'Workstation gráfica de alto desempeño Intel Core i9 / RTX 4080 para diseño 3D' },
      { item: '5.1', unidad: 'MES', descripcion: 'Programa integral de aceleración de capacidades STEAM y transferencia tecnológica' }
    ],
    palabrasClavePositivas: [
      'steam', 'robótica', 'ciencia', 'innovación', 'tecnología', 'fablab', 'impresión 3d',
      'minciencias', 'ctei', 'makerspace', 'regalías ctei', 'bioeconomía'
    ],
    palabrasProhibidasPorIncompatibilidad: [
      'placa huella vehicular', 'cbr subrasante', 'afirmado invias', 'alcantarilla 36 invias'
    ],
    metaProductoDnpCodigo: '3901001',
    metaProductoDnpNombre: 'Centros y laboratorios de formación en ciencia, tecnología e innovación dotados y en operación'
  }
};

/**
 * Generador Dinámico de Perfiles de Conocimiento para Temas No Clasificados o Híbridos.
 */
export function synthesizeDynamicSectorProfile(
  temaOTexto: string,
  descripcionContexto?: string
): SectorKnowledgeProfile {
  const cleanTitle = (temaOTexto || 'Inversión Pública Especial').trim();
  const lower = cleanTitle.toLowerCase();

  let entidad = 'Departamento Nacional de Planeación (DNP) / Ministerio Rector del Sector';
  let sectorCode = '9901001';

  if (lower.includes('comunic') || lower.includes('radio') || lower.includes('emisora')) {
    entidad = 'Ministerio de las TIC / Radio Nacional de Colombia';
    sectorCode = '2302001';
  } else if (lower.includes('vivero') || lower.includes('árbol') || lower.includes('reforest')) {
    entidad = 'Ministerio de Ambiente / Corporación Autónoma Regional (CAR)';
    sectorCode = '3202001';
  } else if (lower.includes('animal') || lower.includes('mascota') || lower.includes('coso')) {
    entidad = 'Ministerio de Ambiente / Secretaría de Salud y Bienestar Animal';
    sectorCode = '3204001';
  } else if (lower.includes('feria') || lower.includes('artesan')) {
    entidad = 'Ministerio de Comercio / Artesanías de Colombia';
    sectorCode = '3502001';
  }

  return {
    sector: cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30),
    nombreSector: cleanTitle,
    entidadRectora: entidad,
    marcoNormativoPrincipal: [
      'Constitución Política de Colombia (Artículos 209, 339 y 365)',
      'Ley 152 de 1994 (Ley Orgánica del Plan de Desarrollo)',
      'Ley 80 de 1993 y Ley 1150 de 2007 (Estatuto General de Contratación Pública)',
      'Ley 2056 de 2020 (Régimen del Sistema General de Regalías)',
      'Metodología General Ajustada (MGA Web - DNP 2024)'
    ],
    especificacionesIngenieria: {
      capitulos: [
        'Capítulo 1: Estudios previos, ingeniería básica y diagnósticos de campo para ' + cleanTitle,
        'Capítulo 2: Suministro de insumos, materiales y equipos certificados para el desarrollo del objeto',
        'Capítulo 3: Ejecución de obras físicas o despliegue operativo especializado bajo normas técnicas',
        'Capítulo 4: Aseguramiento de calidad, pruebas funcionales y puesta en marcha integral',
        'Capítulo 5: Capacitación, manuales de operación y transferencia comunitaria o institucional'
      ],
      normasTecnicas: [
        'Normas Técnicas Colombianas (NTC) aplicables al sector de intervención',
        'Guías Sectoriales y Catálogo de Productos y Servicios del DNP',
        'Lineamientos de Sostenibilidad y Eficiencia del Gasto Público'
      ],
      criteriosDisenoMinimos: 'Diseño técnico ajustado a la demanda real diagnosticada en territorio; cumplimiento estricto de especificaciones del fabricante y normatividad nacional; garantía de operatividad mínima continua por 5 años con esquema de mantenimiento local.',
      riesgosPrevisiblesComunes: [
        'Riesgo Operativo: Interrupción de la operación por falta de insumos o personal calificado.',
        'Riesgo de Precios: Fluctuación del mercado en insumos especializados.',
        'Riesgo Social: Resistencia de la comunidad beneficiaria por falta de socialización temprana.',
        'Riesgo Climático: Retrasos en el cronograma por factores meteorológicos adversos en la zona.'
      ]
    },
    catalogoApuTipicos: [
      { item: '1.1', unidad: 'GL', descripcion: 'Estudios técnicos, diseños de detalle y licencias aplicables para ' + cleanTitle.substring(0, 40) },
      { item: '2.1', unidad: 'UN', descripcion: 'Adquisición e instalación de equipamiento central especializado certificado' },
      { item: '3.1', unidad: 'GL', descripcion: 'Obras de adecuación civil, infraestructura física y montajes técnicos' },
      { item: '4.1', unidad: 'GL', descripcion: 'Pruebas de funcionamiento, puesta en marcha y aseguramiento de calidad' },
      { item: '5.1', unidad: 'JOR', descripcion: 'Jornadas de transferencia técnica, capacitación y apropiación social' }
    ],
    palabrasClavePositivas: [cleanTitle.toLowerCase()],
    palabrasProhibidasPorIncompatibilidad: [],
    metaProductoDnpCodigo: sectorCode,
    metaProductoDnpNombre: 'Intervención integral y dotación especializada en ' + cleanTitle
  };
}

/**
 * Resuelve el Perfil de Conocimiento Sectorial Universal.
 */
export function resolveUniversalSectorProfile(temaOTexto: string, sectorHint?: string): SectorKnowledgeProfile {
  const detectedType = detectSectorDnpTypeRigorous({
    nombre_proyecto: temaOTexto,
    sector_dnp: sectorHint,
    codigo_bpin_propuesto: ''
  });

  if (SECTOR_KNOWLEDGE_BASE[detectedType]) {
    return SECTOR_KNOWLEDGE_BASE[detectedType];
  }

  return synthesizeDynamicSectorProfile(temaOTexto);
}

/**
 * Detector Riguroso de Sector DNP que previene mezclas y errores de clasificación.
 */
export function detectSectorDnpTypeRigorous(
  proyectoOrBpin: any,
  sectorHint?: string,
  nombreOTexto?: string
): SectorDnpType {
  let bpinUpper = '';
  let sectorLower = '';
  let nombreLower = '';
  let resumenLower = '';

  if (typeof proyectoOrBpin === 'object' && proyectoOrBpin !== null) {
    bpinUpper = (proyectoOrBpin.codigo_bpin_propuesto || '').toUpperCase();
    sectorLower = (proyectoOrBpin.sector_dnp || '').toLowerCase();
    nombreLower = (proyectoOrBpin.nombre_proyecto || '').toLowerCase();
    resumenLower = (proyectoOrBpin.resumen_ejecutivo || '').toLowerCase();
  } else {
    bpinUpper = String(proyectoOrBpin || '').toUpperCase();
    sectorLower = String(sectorHint || '').toLowerCase();
    nombreLower = String(nombreOTexto || '').toLowerCase();
  }

  const combined = `${sectorLower} ${nombreLower} ${resumenLower}`;

  // 1. REGLA POR PREFIJO BPIN
  if (bpinUpper.includes('VIA') || bpinUpper.includes('TRANSP') || bpinUpper.includes('PUENT')) return 'transporte';
  if (bpinUpper.includes('TIC') || bpinUpper.includes('TELCO') || bpinUpper.includes('DIGIT')) return 'tic';
  if (bpinUpper.includes('AGUA') || bpinUpper.includes('ACUE') || bpinUpper.includes('SANEA')) return 'agua';
  if (bpinUpper.includes('EDU') || bpinUpper.includes('ESC')) return 'educacion';
  if (bpinUpper.includes('SALUD') || bpinUpper.includes('HOSP')) return 'salud';
  if (bpinUpper.includes('AGRO') || bpinUpper.includes('RURAL')) return 'agropecuario';
  if (bpinUpper.includes('ENERG') || bpinUpper.includes('SOLAR')) return 'energia';
  if (bpinUpper.includes('AMBIEN') || bpinUpper.includes('RIESGO')) return 'medio_ambiente';
  if (bpinUpper.includes('VIV') || bpinUpper.includes('HABIT')) return 'vivienda';
  if (bpinUpper.includes('DEP') || bpinUpper.includes('RECR')) return 'deporte';
  if (bpinUpper.includes('CULT') || bpinUpper.includes('BIBL')) return 'cultura';
  if (bpinUpper.includes('SEG') || bpinUpper.includes('JUST')) return 'seguridad_justicia';
  if (bpinUpper.includes('INCL') || bpinUpper.includes('FAM') || bpinUpper.includes('CDI')) return 'inclusion_social';
  if (bpinUpper.includes('COM') || bpinUpper.includes('TURIS') || bpinUpper.includes('MERC')) return 'desarrollo_economico';
  if (bpinUpper.includes('RESID') || bpinUpper.includes('ECA') || bpinUpper.includes('ASEO')) return 'residuos_solidos';
  if (bpinUpper.includes('CTEI') || bpinUpper.includes('CIENC') || bpinUpper.includes('INNOV')) return 'ciencia_tecnologia';

  // 2. REGLA DE SECTOR FORMAL EXPRESO
  if (sectorLower.includes('transporte') || sectorLower.includes('vías') || sectorLower.includes('vias') || sectorLower.includes('carretera')) return 'transporte';
  if (sectorLower.includes('tic') || sectorLower.includes('telecomunicac') || sectorLower.includes('tecnología') || sectorLower.includes('tecnologia')) return 'tic';
  if (sectorLower.includes('agua') || sectorLower.includes('saneamiento') || sectorLower.includes('acueducto')) return 'agua';
  if (sectorLower.includes('educaci') || sectorLower.includes('colegio')) return 'educacion';
  if (sectorLower.includes('salud') || sectorLower.includes('hospital')) return 'salud';
  if (sectorLower.includes('agro') || sectorLower.includes('pecuario') || sectorLower.includes('agricultura')) return 'agropecuario';
  if (sectorLower.includes('energ') || sectorLower.includes('minas')) return 'energia';
  if (sectorLower.includes('ambiente') || sectorLower.includes('riesgo') || sectorLower.includes('desastre')) return 'medio_ambiente';
  if (sectorLower.includes('vivienda') || sectorLower.includes('hábitat') || sectorLower.includes('habitat')) return 'vivienda';
  if (sectorLower.includes('deporte') || sectorLower.includes('recreación') || sectorLower.includes('recreacion')) return 'deporte';
  if (sectorLower.includes('cultura') || sectorLower.includes('patrimonio')) return 'cultura';
  if (sectorLower.includes('seguridad') || sectorLower.includes('justicia')) return 'seguridad_justicia';
  if (sectorLower.includes('inclusión') || sectorLower.includes('inclusion') || sectorLower.includes('primera infancia')) return 'inclusion_social';
  if (sectorLower.includes('comercio') || sectorLower.includes('turismo') || sectorLower.includes('mercado')) return 'desarrollo_economico';
  if (sectorLower.includes('residuos') || sectorLower.includes('aseo') || sectorLower.includes('reciclaje')) return 'residuos_solidos';
  if (sectorLower.includes('ciencia') || sectorLower.includes('innovación') || sectorLower.includes('robótica')) return 'ciencia_tecnologia';

  // 3. REGLA POR NOMBRE COMPUESTO
  if (combined.includes('conectividad terciaria') || combined.includes('conectividad vial') || 
      combined.includes('corredor vial') || combined.includes('corredores') || 
      combined.includes('placa huella') || combined.includes('paviment') || 
      combined.includes('afirmado') || combined.includes('invias') || 
      combined.includes('puente')) {
    return 'transporte';
  }

  if (combined.includes('internet') || combined.includes('starlink') || combined.includes('wifi') || 
      combined.includes('wi-fi') || combined.includes('fibra óptica') || combined.includes('conectividad digital') ||
      combined.includes('satelital') || combined.includes('mintic') || combined.includes('aulas digitales')) {
    return 'tic';
  }

  if (combined.includes('acueducto') || combined.includes('alcantarillado') || combined.includes('ptap') || 
      combined.includes('ptar') || combined.includes('bocatoma') || combined.includes('agua potable')) {
    return 'agua';
  }

  if (combined.includes('escuela') || combined.includes('colegio') || combined.includes('aulas escolares') || combined.includes('estudiantes') || combined.includes('ffie')) {
    return 'educacion';
  }

  if (combined.includes('puesto de salud') || combined.includes('hospital') || combined.includes('médic') || combined.includes('ambulancia') || combined.includes('biomédico')) {
    return 'salud';
  }

  if (combined.includes('cultivo') || combined.includes('cacao') || combined.includes('café') || combined.includes('distrito de riego') || combined.includes('agro')) {
    return 'agropecuario';
  }

  if (combined.includes('solar') || combined.includes('fotovoltaic') || combined.includes('electrificaci') || combined.includes('paneles solares')) {
    return 'energia';
  }

  if (combined.includes('muro de contención') || combined.includes('gaviones') || combined.includes('descolmataci') || combined.includes('mitigación') || combined.includes('ungrd')) {
    return 'medio_ambiente';
  }

  if (combined.includes('mejoramiento de vivienda') || combined.includes('pisos y techos') || combined.includes('fonvivienda') || combined.includes('cambia mi casa')) {
    return 'vivienda';
  }

  if (combined.includes('polideportivo') || combined.includes('cancha sintética') || combined.includes('cancha') || combined.includes('mindeporte') || combined.includes('parque biosaludable')) {
    return 'deporte';
  }

  if (combined.includes('casa de la cultura') || combined.includes('biblioteca') || combined.includes('instrumentos musicales') || combined.includes('banda musical')) {
    return 'cultura';
  }

  if (combined.includes('cámaras de seguridad') || combined.includes('cctv') || combined.includes('videovigilancia') || combined.includes('estación de policía') || combined.includes('fonconseg')) {
    return 'seguridad_justicia';
  }

  if (combined.includes('cdi') || combined.includes('primera infancia') || combined.includes('adulto mayor') || combined.includes('centro vida') || combined.includes('casa de la mujer')) {
    return 'inclusion_social';
  }

  if (combined.includes('plaza de mercado') || combined.includes('malecón') || combined.includes('turismo') || combined.includes('fontur')) {
    return 'desarrollo_economico';
  }

  if (combined.includes('reciclaje') || combined.includes('eca') || combined.includes('compostaje') || combined.includes('pgirs') || combined.includes('residuos')) {
    return 'residuos_solidos';
  }

  if (combined.includes('steam') || combined.includes('robótica') || combined.includes('makerspace') || combined.includes('impresora 3d') || combined.includes('minciencias')) {
    return 'ciencia_tecnologia';
  }

  return 'transporte';
}

/**
 * Radar de Auditoría y Detección de Incongruencias Sectoriales.
 */
export function auditTextForSectorIncongruence(
  texto: string,
  sectorEsperado: SectorDnpType
): { esValido: boolean; palabrasInfractoras: string[]; accionCorrectiva: string } {
  const profile = SECTOR_KNOWLEDGE_BASE[sectorEsperado] || synthesizeDynamicSectorProfile(sectorEsperado);
  const textoLower = (texto || '').toLowerCase();
  const encontradas: string[] = [];

  if (profile.palabrasProhibidasPorIncompatibilidad) {
    for (const prohibida of profile.palabrasProhibidasPorIncompatibilidad) {
      if (textoLower.includes(prohibida.toLowerCase())) {
        encontradas.push(prohibida);
      }
    }
  }

  if (encontradas.length > 0) {
    return {
      esValido: false,
      palabrasInfractoras: encontradas,
      accionCorrectiva: `RECHAZO DE COHERENCIA: Se detectaron términos incompatibles (${encontradas.join(', ')}). Se fuerza re-generación con catálogo exclusivo de ${profile.nombreSector} bajo normativa de ${profile.entidadRectora}.`
    };
  }

  return {
    esValido: true,
    palabrasInfractoras: [],
    accionCorrectiva: `CONFORMIDAD 100%: Vocabulario y especificaciones corresponden fielmente al sector ${profile.nombreSector}.`
  };
}

/**
 * Sincroniza un Perfil de Conocimiento Sectorial con la Base de Datos.
 */
export async function syncKnowledgeProfileToDatabase(profile: SectorKnowledgeProfile): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client
      .from('propuestas_estructuradas_ia')
      .upsert({
        id: `kb_${profile.sector}`,
        intencion_sintetizada: `[CONOCIMIENTO SECTORIAL] ${profile.nombreSector}`,
        necesidad_clave: profile.entidadRectora,
        propuesta_redactada_ramitos: JSON.stringify({
          normativa: profile.marcoNormativoPrincipal,
          ingenieria: profile.especificacionesIngenieria,
          apu: profile.catalogoApuTipicos,
          metaDnp: { codigo: profile.metaProductoDnpCodigo, nombre: profile.metaProductoDnpNombre }
        }),
        estado_evaluacion: 'aprobado',
        fecha_analisis: new Date().toISOString()
      }, { onConflict: 'id' });
  } catch (err) {
    console.warn('Error syncing knowledge profile to Supabase:', err);
  }
}
