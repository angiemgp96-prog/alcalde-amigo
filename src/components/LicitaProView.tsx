import React, { useState } from 'react';
import { 
  Building2, Coins, Calendar, FileText, CheckCircle2, AlertTriangle, 
  XCircle, ArrowUpRight, Search, Filter, Plus, Users, MapPin, Scale, 
  Clock, Sparkles, FolderPlus, ArrowLeft, ShieldCheck, DollarSign,
  TrendingUp, AlertCircle, FileCheck2, Landmark, Check, RefreshCw,
  FolderOpen, Calculator, Building, GraduationCap, Database, Briefcase,
  Download, Eye, Lock, Unlock, CheckSquare, Square, ChevronRight,
  Shield, Layers, Award, Percent, FileCode
} from 'lucide-react';

// Formato de moneda COP
const formatCOP = (val: number): string => {
  return `$${Math.round(val).toLocaleString('es-CO')} COP`;
};

// =========================================================================
// INTERFACES Y MODELOS DE DATOS DE LICITAPRO COLOMBIA
// =========================================================================

export interface ProponenteOrg {
  id: string;
  nombre: string;
  nit: string;
  tipo: 'ONG / Fundación' | 'Empresa S.A.S.' | 'Asociación Campesina' | 'Cooperativa' | 'Consorcio';
  nature: string;
  snbf_status: string;
  certVigenciaDias: number;
  certFechaVence: string;
  certResolucion: string;
  sedePrincipal: string;
  departamentoBase: string;
  telefono: string;
  email: string;
  patrimonioEstimadoCop: number;
  boardMembers: {
    cargo: string;
    nombres: string;
    doc_identidad: string;
  }[];
  modalities: {
    nombre: string;
    rango_edad: string;
    objetivo: string;
    fuente: string;
  }[];
  municipalities: string[];
  experienciaContratos: {
    objeto: string;
    entidad: string;
    valorCop: number;
    ano: number;
    estado: 'liquidado_satisfaccion' | 'en_ejecucion';
  }[];
}

export interface OpportunitySecop {
  id: string;
  process_number: string;
  entity_name: string;
  department: string;
  city: string;
  modality: string;
  description: string;
  object_detail?: string;
  estimated_value: number;
  presentation_date: string;
  secop_url: string;
  strategic_score: number;
  recommendation: 'participar' | 'investigar' | 'descartar';
  category_score: {
    juridico: number;
    tecnico: number;
    financiero: number;
    territorial: number;
  };
  capital_trabajo_min_cop: number;
  dias_colchon: number;
  poliza_valor_cop: number;
  prima_est_cop: number;
  friccion_territorial: string;
  veredicto_etiqueta: string;
  veredicto_color: 'emerald' | 'amber' | 'rose';
  regla_descarte: string;
  justificacion: string;
  sobres_secop: {
    sobre_1: {
      titulo: string;
      items: { nombre: string; estado: 'listo' | 'por_actualizar' | 'alerta'; exigencia: string; detalle: string }[];
    };
    sobre_2: {
      titulo: string;
      items: { nombre: string; estado: 'listo' | 'por_actualizar' | 'alerta'; exigencia: string; detalle: string }[];
    };
    sobre_3: {
      titulo: string;
      items: { nombre: string; estado: 'listo' | 'por_actualizar' | 'alerta'; exigencia: string; detalle: string }[];
    };
    sobre_4: {
      titulo: string;
      items: { nombre: string; estado: 'listo' | 'por_actualizar' | 'alerta'; exigencia: string; detalle: string }[];
    };
  };
  checklist_antirechazo: {
    titulo: string;
    riesgo: string;
    medida_preventiva: string;
    estado: 'critico' | 'alerta';
  }[];
  requirements: {
    codigo: string;
    titulo: string;
    literal: string;
    caracter: 'Habilitante Obligatorio' | 'Puntuable';
    max_pts?: number;
    evidencia: string;
    estado: 'cumple_con_evidencia' | 'por_confirmar' | 'pendiente';
  }[];
}

export interface BidTask {
  id: string;
  titulo: string;
  responsable: string;
  fecha_limite: string;
  completada: boolean;
}

export interface BidApproval {
  rol: 'tecnica' | 'juridica' | 'financiera' | 'representante_legal';
  rol_titulo: string;
  aprobado: boolean;
  aprobado_por?: string;
  fecha?: string;
  comentarios?: string;
}

export interface BudgetItem {
  id: string;
  concepto: string;
  tipo: 'directo' | 'indirecto';
  costo_mensual: number;
  meses: number;
  total: number;
}

export interface EvidenceItem {
  id: string;
  titulo: string;
  categoria: string;
  emisor: string;
  vigencia: string;
  estado: 'confirmado' | 'declarado' | 'pendiente';
  archivo: string;
}

// =========================================================================
// DATOS SEMILLA ORIGINALES DE LICITAPRO LOCALHOST
// =========================================================================

const DEFAULT_ORGS: ProponenteOrg[] = [
  {
    id: 'org_fnv_001',
    nombre: 'Fundación Nueva Vida',
    nit: '832.008.424-4',
    tipo: 'ONG / Fundación',
    nature: 'Entidad Sin Ánimo de Lucro (ESAL) / Régimen Especial',
    snbf_status: 'Reconocida ICBF SNBF (Res. 6300/2024)',
    certVigenciaDias: 22,
    certFechaVence: '2026-10-29',
    certResolucion: 'Res. ICBF 6300 del 29/04/2026 (Vigencia 6 meses)',
    sedePrincipal: 'Cajicá / Sabana Centro, Cundinamarca',
    departamentoBase: 'Cundinamarca',
    telefono: '(+57) 310 854 2291',
    email: 'contacto@fundacionnuevavida.org.co',
    patrimonioEstimadoCop: 850000000,
    boardMembers: [
      { cargo: 'Representante Legal Principal', nombres: 'Dra. Martha Patricia Gómez Ruiz', doc_identidad: 'CC 52.418.902' },
      { cargo: 'Director Técnico Operativo', nombres: 'Carlos Andrés Rodríguez P.', doc_identidad: 'CC 79.821.450' },
      { cargo: 'Revisora Fiscal Titular', nombres: 'Dra. Claudia Marcela Vega C.', doc_identidad: 'TP 84210-T' }
    ],
    modalities: [
      { nombre: 'Hogares Infantiles y Centros de Desarrollo Infantil (CDI)', rango_edad: '0 a 5 años', objetivo: 'Educación inicial, cuidado calificado y nutrición balanceada.', fuente: 'Brochure Institucional FNV' },
      { nombre: 'Centros Transitorios de Protección y Acogida NNA', rango_edad: '6 a 17 años', objetivo: 'Restablecimiento de derechos, apoyo psicosocial y formativo.', fuente: 'Brochure Institucional FNV' },
      { nombre: 'Nutrición Comunitaria y Seguridad Alimentaria', rango_edad: 'Familiar', objetivo: 'Canastas nutricionales, seguimiento biométrico y talleres comunitarios.', fuente: 'Brochure Institucional FNV' }
    ],
    municipalities: [
      'Cajicá', 'Cota', 'Chía', 'Zipaquirá', 'Tabio', 'Tenjo', 'Sopó',
      'Nemocón', 'Gachancipá', 'Tocancipá', 'Fúquene', 'Fusagasugá', 'Cáqueza', 'Soacha'
    ],
    experienciaContratos: [
      {
        objeto: 'Atención integral a niños, niñas y adolescentes en restablecimiento de derechos y acogida transitoria',
        entidad: 'Municipio de Soacha - Secretaría de Desarrollo Social',
        valorCop: 151071426,
        ano: 2021,
        estado: 'liquidado_satisfaccion'
      },
      {
        objeto: 'Servicios de protección y cuidado transitorio bajo lineamientos técnicos ICBF en Sabana Centro',
        entidad: 'ICBF Regional Cundinamarca - Centro Zonal Zipaquirá',
        valorCop: 420000000,
        ano: 2023,
        estado: 'liquidado_satisfaccion'
      },
      {
        objeto: 'Operación técnica de centros comunitarios de apoyo nutricional y pedagógico',
        entidad: 'Alcaldía Municipal de Cajicá',
        valorCop: 98500000,
        ano: 2024,
        estado: 'liquidado_satisfaccion'
      }
    ]
  }
];

const INITIAL_OPPORTUNITIES: OpportunitySecop[] = [
  {
    id: 'opp_secop_icbf_001',
    process_number: 'ICBF-CV-PC-001-2026BOL',
    entity_name: 'ICBF REGIONAL BOLIVAR',
    department: 'Bolívar',
    city: 'Cartagena',
    modality: 'Convocatoria Pública - Contrato de Aporte',
    description: 'Prestar los servicios de educación inicial en el marco de la atención Integral a la Primera Infancia, de conformidad con los Manuales Técnicos y Guías Operativas del ICBF.',
    object_detail: 'Atención a más de 1.800 niñas y niños de sectores vulnerables de Cartagena y municipios ribereños del departamento de Bolívar, incluyendo componente nutricional, pedagógico y psicosocial.',
    estimated_value: 2091584837,
    presentation_date: '2026-10-24 15:00:00',
    secop_url: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10207367',
    strategic_score: 92,
    recommendation: 'participar',
    category_score: { juridico: 95, tecnico: 90, financiero: 82, territorial: 65 },
    capital_trabajo_min_cop: 418316967,
    dias_colchon: 60,
    poliza_valor_cop: 627475451,
    prima_est_cop: 7529705,
    friccion_territorial: 'Extraterritorial (Bolívar - Requiere Sede Operativa o Alianza Local)',
    veredicto_etiqueta: 'Recomendado en Unión Temporal / Consorcio Local',
    veredicto_color: 'amber',
    regla_descarte: 'PRESENTARSE ÚNICAMENTE EN ALIANZA (60/40 o 70/30) con fundación acreditada en Bolívar para asegurar arraigo operativo y co-financiar póliza de $627M COP.',
    justificacion: 'Fundación Nueva Vida posee personería jurídica ICBF SNBF idónea, pero al operar desde Cundinamarca el pliego exige sede demostrada en Cartagena. La cuantía ($2.091M COP) exige $418M de caja corriente.',
    sobres_secop: {
      sobre_1: {
        titulo: 'Sobre 1: Requisitos Habilitantes Jurídicos & SNBF',
        items: [
          { nombre: 'Certificado Personería Jurídica ICBF (Res. 6300/2024)', estado: 'por_actualizar', exigencia: 'Vigencia máx 30 días hábiles al cierre', detalle: 'Vence en 22 días. Radicar solicitud de reconfirmación previa en ICBF.' },
          { nombre: 'RUT Actualizado con Actividad Misional 8890', estado: 'listo', exigencia: 'RUT DIAN vigente', detalle: 'Registrado con código de actividades de servicios sociales sin alojamiento.' },
          { nombre: 'Certificación Parafiscales y Seguridad Social', estado: 'listo', exigencia: 'Firma Revisor Fiscal / Rep. Legal', detalle: 'Paz y salvo al día de los últimos 6 meses del personal en planta.' }
        ]
      },
      sobre_2: {
        titulo: 'Sobre 2: Propuesta Técnica y Experiencia Misional',
        items: [
          { nombre: 'Contratos Anteriores Acreditados (Mínimo 2)', estado: 'listo', exigencia: 'Sumatoria >= 100% presupuesto oficial', detalle: 'Contratos con Soacha ($151M) e ICBF Cundinamarca ($420M) suman $571M. En Consorcio el socio local suma los $1.500M restantes.' },
          { nombre: 'Equipo Interdisciplinario (Pedagogía, Psicología, Nutrición)', estado: 'por_actualizar', exigencia: 'Hojas de vida con tarjetas profesionales y certificados', detalle: 'Requiere perfiles radicados en la zona costera de Bolívar.' }
        ]
      },
      sobre_3: {
        titulo: 'Sobre 3: Capacidad Financiera & RUP',
        items: [
          { nombre: 'Índice de Liquidez >= 1.5 y Endeudamiento <= 70%', estado: 'listo', exigencia: 'Estados Financieros certificados a dic/2025', detalle: 'Liquidez: 1.82 | Endeudamiento: 34.5% (Cumple plenamente).' },
          { nombre: 'Póliza de Seriedad de Oferta (30% Cuantía)', estado: 'alerta', exigencia: 'Valor asegurado: $627.475.451 COP', detalle: 'Cotizar con aseguradora aliada. Prima estimada $7.529.705 COP.' }
        ]
      },
      sobre_4: {
        titulo: 'Sobre 4: Oferta Económica & Canasta de Costos',
        items: [
          { nombre: 'Estructura Canasta Primera Infancia ICBF', estado: 'listo', exigencia: 'Ceñido estrictamente al techo oficial ($2.091.584.837 COP)', detalle: 'No superar un solo centavo del presupuesto oficial para evitar causal de rechazo.' }
        ]
      }
    },
    checklist_antirechazo: [
      {
        titulo: 'Inconsistencia en la Fecha del Certificado ICBF',
        riesgo: 'Si el certificado vence antes del acto de adjudicación, la entidad declara rechazo automático.',
        medida_preventiva: 'Solicitar reexpedición reglamentaria de 6 meses ante ICBF Regional Cundinamarca antes de la radicación final en SECOP II.',
        estado: 'critico'
      },
      {
        titulo: 'Propuesta Económica que Supere el Presupuesto Oficial',
        riesgo: 'En contratos de aporte y régimen especial, superar por $1 COP el presupuesto es causal objetiva de descarte no subsanable.',
        medida_preventiva: 'El simulador LicitaPro bloquea y audita el valor total ofertado para asegurar coincidencia exacta ($2.091.584.837 COP).',
        estado: 'critico'
      },
      {
        titulo: 'Omisión de Garantía de Seriedad de la Oferta en SECOP II',
        riesgo: 'Cargar la póliza sin el recibo de pago o con beneficiario erróneo causa descarte.',
        medida_preventiva: 'Verificar beneficiario: "INSTITUTO COLOMBIANO DE BIENESTAR FAMILIAR - NIT 899.999.239-2".',
        estado: 'alerta'
      }
    ],
    requirements: [
      { codigo: 'REQ-JUR-01', titulo: 'Existencia, Representación Legal y Personería Jurídica', literal: 'Acreditar personería jurídica vigente otorgada por el ICBF con certificado no mayor a 30 días.', caracter: 'Habilitante Obligatorio', evidencia: 'Certificado ICBF SNBF Res. 6300/2024', estado: 'cumple_con_evidencia' },
      { codigo: 'REQ-EXP-02', titulo: 'Experiencia Contractual Específica en Primera Infancia', literal: 'Acreditar mínimo dos (2) contratos liquidados que sumen el 100% de la cuantía oficial.', caracter: 'Puntuable', max_pts: 40, evidencia: 'Contrato Soacha 2021 + Contrato ICBF Cundinamarca 2023', estado: 'por_confirmar' },
      { codigo: 'REQ-FIN-03', titulo: 'Capacidad Financiera y RUP', literal: 'Liquidez superior a 1.5, Endeudamiento inferior al 70%, Capital de trabajo demostrado.', caracter: 'Habilitante Obligatorio', evidencia: 'Estados Financieros Auditados 2025', estado: 'cumple_con_evidencia' }
    ]
  },
  {
    id: 'opp_secop_cota_002',
    process_number: 'PC-002-2026',
    entity_name: 'ALCALDÍA MUNICIPAL COTA',
    department: 'Cundinamarca',
    city: 'Cota (Sabana Centro)',
    modality: 'Contratación régimen especial (con ofertas)',
    description: 'Prestación de servicios para la operación del programa integral de apoyo nutricional y desarrollo psicosocial en el municipio de Cota.',
    object_detail: 'Suministro de raciones complementarias, talleres de habilidades psicosociales y visitas domiciliarias en los sectores rurales y urbanos de Cota.',
    estimated_value: 529998630,
    presentation_date: '2026-10-18 17:00:00',
    secop_url: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10207939',
    strategic_score: 88,
    recommendation: 'participar',
    category_score: { juridico: 92, tecnico: 88, financiero: 85, territorial: 98 },
    capital_trabajo_min_cop: 79499795,
    dias_colchon: 45,
    poliza_valor_cop: 105999726,
    prima_est_cop: 1271997,
    friccion_territorial: 'Sede Local Directa (Baja Fricción - Cajicá/Cota)',
    veredicto_etiqueta: 'Viable en Solitario (Go Operativo)',
    veredicto_color: 'emerald',
    regla_descarte: 'Cuantía accesible ($529M COP). Si el certificado ICBF y RUT están al día, presentar oferta en solitario sin depender de terceros.',
    justificacion: 'Cota es municipio colindante con Cajicá. La infraestructura y experiencia previa de Fundación Nueva Vida cubre el 100% de la capacidad exigida.',
    sobres_secop: {
      sobre_1: {
        titulo: 'Sobre 1: Habilitantes Jurídicos',
        items: [
          { nombre: 'Personería Jurídica y Certificado SNBF', estado: 'listo', exigencia: 'Vigencia en Cundinamarca', detalle: 'Vigente con reconocimiento oficial.' },
          { nombre: 'RUT y Cédula de Representante Legal', estado: 'listo', exigencia: 'DIAN y Registraduría', detalle: 'Verificado.' }
        ]
      },
      sobre_2: {
        titulo: 'Sobre 2: Propuesta Técnica Nutricional',
        items: [
          { nombre: 'Experiencia Específica en Cundinamarca', estado: 'listo', exigencia: 'Contratos previos en Sabana Centro', detalle: 'Respaldado con contratos de Soacha y Cajicá.' }
        ]
      },
      sobre_3: {
        titulo: 'Sobre 3: Póliza y RUP',
        items: [
          { nombre: 'Póliza de Seriedad del 20%', estado: 'listo', exigencia: 'Valor: $105.999.726 COP', detalle: 'Prima estimada: $1.271.997 COP.' }
        ]
      },
      sobre_4: {
        titulo: 'Sobre 4: Presupuesto y Precios',
        items: [
          { nombre: 'Propuesta Económica AIU', estado: 'listo', exigencia: 'Techo oficial $529.998.630 COP', detalle: 'Validada.' }
        ]
      }
    },
    checklist_antirechazo: [
      {
        titulo: 'Vencimiento de Personería Jurídica durante Evaluación',
        riesgo: 'Faltan 22 días para el vencimiento de la resolución reglamentaria.',
        medida_preventiva: 'Anexar constancia de radicación del trámite de prórroga ante ICBF Cundinamarca.',
        estado: 'alerta'
      }
    ],
    requirements: [
      { codigo: 'REQ-JUR-01', titulo: 'Personería Jurídica', literal: 'Acreditar idoneidad de ONG en bienestar familiar.', caracter: 'Habilitante Obligatorio', evidencia: 'Certificado ICBF 2026', estado: 'cumple_con_evidencia' }
    ]
  },
  {
    id: 'opp_secop_fuquene_003',
    process_number: 'CA-003-2026',
    entity_name: 'MUNICIPIO DE FÚQUENE',
    department: 'Cundinamarca',
    city: 'Fúquene',
    modality: 'Contratación régimen especial (con ofertas)',
    description: 'Atención integral a población vulnerable y fortalecimiento de los centros comunitarios de protección infantil y del adulto mayor.',
    estimated_value: 102585714,
    presentation_date: '2026-10-22 14:00:00',
    secop_url: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10225032',
    strategic_score: 82,
    recommendation: 'participar',
    category_score: { juridico: 90, tecnico: 84, financiero: 88, territorial: 80 },
    capital_trabajo_min_cop: 15387857,
    dias_colchon: 45,
    poliza_valor_cop: 10258571,
    prima_est_cop: 123103,
    friccion_territorial: 'Sede Local Directa (Cundinamarca - Cobertura Provincial)',
    veredicto_etiqueta: 'Viable en Solitario (Go Operativo)',
    veredicto_color: 'emerald',
    regla_descarte: 'Proceso de baja cuantía ($102M COP) con alta viabilidad operativa. Excelente para sumar puntos de experiencia en centros transitorios.',
    justificacion: 'Fúquene está incluido expresamente en el brochure institucional de centros transitorios de Fundación Nueva Vida.',
    sobres_secop: {
      sobre_1: { titulo: 'Sobre 1', items: [{ nombre: 'Habilitantes Jurídicos', estado: 'listo', exigencia: 'RUT y Personería', detalle: 'Ok' }] },
      sobre_2: { titulo: 'Sobre 2', items: [{ nombre: 'Propuesta Técnica', estado: 'listo', exigencia: 'Metodología Comunitaria', detalle: 'Ok' }] },
      sobre_3: { titulo: 'Sobre 3', items: [{ nombre: 'Póliza', estado: 'listo', exigencia: '10% Cuantía', detalle: 'Prima $123k COP' }] },
      sobre_4: { titulo: 'Sobre 4', items: [{ nombre: 'Propuesta Económica', estado: 'listo', exigencia: '$102.585.714 COP', detalle: 'Ok' }] }
    },
    checklist_antirechazo: [],
    requirements: []
  },
  {
    id: 'opp_secop_fusagasuga_004',
    process_number: 'CPSP 2026-0266',
    entity_name: 'ALCALDIA MUNICIPAL FUSAGASUGA',
    department: 'Cundinamarca',
    city: 'Fusagasugá',
    modality: 'Contratación directa',
    description: 'Servicios de acompañamiento técnico pedagógico y psicosocial para la infancia y adolescencia en situación de riesgo en Fusagasugá.',
    estimated_value: 41020000,
    presentation_date: '2026-10-16 11:00:00',
    secop_url: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.9676831',
    strategic_score: 74,
    recommendation: 'investigar',
    category_score: { juridico: 80, tecnico: 78, financiero: 85, territorial: 75 },
    capital_trabajo_min_cop: 6153000,
    dias_colchon: 45,
    poliza_valor_cop: 4102000,
    prima_est_cop: 49224,
    friccion_territorial: 'Cundinamarca - Sumapaz',
    veredicto_etiqueta: 'Viable en Solitario (Go Operativo)',
    veredicto_color: 'emerald',
    regla_descarte: 'Verificar si el proceso requiere contratación directa mediante convenio especial o si es convocatoria abierta.',
    justificacion: 'Fusagasugá hace parte del brochure de la fundación.',
    sobres_secop: { sobre_1: { titulo: 'Habilitante', items: [] }, sobre_2: { titulo: 'Técnico', items: [] }, sobre_3: { titulo: 'Financiero', items: [] }, sobre_4: { titulo: 'Económico', items: [] } },
    checklist_antirechazo: [],
    requirements: []
  },
  {
    id: 'opp_secop_nemocon_005',
    process_number: 'SMIC-015-2026',
    entity_name: 'ALCALDÍA NEMOCON',
    department: 'Cundinamarca',
    city: 'Nemocón',
    modality: 'Mínima cuantía',
    description: 'Suministro de dotación pedagógica y apoyo a la casa de la mujer y familia del municipio de Nemocón.',
    estimated_value: 29750000,
    presentation_date: '2026-10-14 16:00:00',
    secop_url: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10206575',
    strategic_score: 79,
    recommendation: 'investigar',
    category_score: { juridico: 85, tecnico: 80, financiero: 88, territorial: 95 },
    capital_trabajo_min_cop: 4462500,
    dias_colchon: 45,
    poliza_valor_cop: 2975000,
    prima_est_cop: 35700,
    friccion_territorial: 'Sabana Centro (Inmediata cercanía)',
    veredicto_etiqueta: 'Viable en Solitario (Go Operativo)',
    veredicto_color: 'emerald',
    regla_descarte: 'Mínima cuantía con plazo de cierre muy corto. Requiere cotización inmediata de suministros.',
    justificacion: 'Nemocón dista 15 minutos de la sede principal de Cajicá.',
    sobres_secop: { sobre_1: { titulo: 'Habilitante', items: [] }, sobre_2: { titulo: 'Técnico', items: [] }, sobre_3: { titulo: 'Financiero', items: [] }, sobre_4: { titulo: 'Económico', items: [] } },
    checklist_antirechazo: [],
    requirements: []
  },
  {
    id: 'opp_secop_caqueza_006',
    process_number: 'HSRC-933-2026',
    entity_name: 'E.S.E HOSPITAL SAN RAFAEL DE CAQUEZA',
    department: 'Cundinamarca',
    city: 'Cáqueza',
    modality: 'Contratación régimen especial',
    description: 'Prestación de servicios para apoyo operativo y psicosocial en brigadas comunitarias de atención rural.',
    estimated_value: 24920000,
    presentation_date: '2026-10-15 10:00:00',
    secop_url: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10243956',
    strategic_score: 70,
    recommendation: 'investigar',
    category_score: { juridico: 75, tecnico: 70, financiero: 85, territorial: 70 },
    capital_trabajo_min_cop: 3738000,
    dias_colchon: 45,
    poliza_valor_cop: 2492000,
    prima_est_cop: 29904,
    friccion_territorial: 'Oriente de Cundinamarca',
    veredicto_etiqueta: 'Viable en Solitario (Go Operativo)',
    veredicto_color: 'emerald',
    regla_descarte: 'Proceso de menor cuantía. Validar disponibilidad de equipo interdisciplinario en la provincia de Oriente.',
    justificacion: 'Fácil estructuración si se dispone de personal local en Cáqueza.',
    sobres_secop: { sobre_1: { titulo: 'Habilitante', items: [] }, sobre_2: { titulo: 'Técnico', items: [] }, sobre_3: { titulo: 'Financiero', items: [] }, sobre_4: { titulo: 'Económico', items: [] } },
    checklist_antirechazo: [],
    requirements: []
  }
];

const INITIAL_EVIDENCES: EvidenceItem[] = [
  { id: 'ev_001', titulo: 'Certificado de Personería Jurídica y Representación Legal (ICBF SNBF)', categoria: 'Capacidad Jurídica', emisor: 'ICBF Regional Cundinamarca', vigencia: '2026-10-29 (22 días rest.)', estado: 'confirmado', archivo: 'Certific. FUNDACION NUEVA VIDA-2026 Abril -2002.pdf' },
  { id: 'ev_002', titulo: 'Certificación Contrato No. 151-2021 Soacha ($151.071.426 COP)', categoria: 'Experiencia Contractual', emisor: 'Alcaldía de Soacha', vigencia: 'Indefinida (Liquidado)', estado: 'confirmado', archivo: 'Acta_Liquidacion_Soacha_2021.pdf' },
  { id: 'ev_003', titulo: 'Certificación Contrato ICBF Cundinamarca 2023 ($420.000.000 COP)', categoria: 'Experiencia Contractual', emisor: 'ICBF Regional Cundinamarca', vigencia: 'Indefinida (Liquidado)', estado: 'confirmado', archivo: 'Certificacion_ICBF_2023_Proteccion.pdf' },
  { id: 'ev_004', titulo: 'Brochure Institucional y 14 Sedes de Cundinamarca', categoria: 'Capacidad Operativa', emisor: 'Fundación Nueva Vida', vigencia: 'Vigente', estado: 'confirmado', archivo: 'BROCHURE FINAL IMAGENES.pptx' },
  { id: 'ev_005', titulo: 'Estados Financieros Auditados a 31 de Diciembre de 2025', categoria: 'Capacidad Financiera', emisor: 'Revisoría Fiscal', vigencia: 'Vigente para vigencia 2026', estado: 'confirmado', archivo: 'Balance_General_Dictaminado_2025.pdf' }
];

export const LicitaProView: React.FC = () => {
  // Estado de navegación interna de LicitaPro SaaS
  const [currentView, setCurrentView] = useState<'dashboard' | 'opportunities' | 'opportunity_detail' | 'bidroom' | 'budget' | 'profile' | 'learning' | 'sources' | 'onboarding'>('dashboard');

  // Multi-organización / Tenants
  const [organizaciones, setOrganizaciones] = useState<ProponenteOrg[]>(DEFAULT_ORGS);
  const [activeOrgId, setActiveOrgId] = useState<string>('org_fnv_001');
  const activeOrg = organizaciones.find(o => o.id === activeOrgId) || organizaciones[0];

  // Rol del usuario en sesión
  const [userRole, setUserRole] = useState<'admin' | 'bid_manager' | 'legal_reviewer' | 'financial_reviewer' | 'viewer'>('admin');

  // Procesos licitatorios
  const [opportunities, setOpportunities] = useState<OpportunitySecop[]>(INITIAL_OPPORTUNITIES);
  const [selectedOppId, setSelectedOppId] = useState<string>('opp_secop_icbf_001');
  const selectedOpp = opportunities.find(o => o.id === selectedOppId) || opportunities[0];

  // Filtros de oportunidades
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRec, setFilterRec] = useState('');
  const [oppTab, setOppTab] = useState<'all' | 'new' | 'closing_soon' | 'in_bidroom'>('all');

  // Pestaña en Ficha de Oportunidad
  const [oppDetailTab, setOppDetailTab] = useState<'secop_sobres' | 'antirechazo' | 'matriz_pliegos'>('secop_sobres');

  // BidRoom interactivo
  const [bidTasks, setBidTasks] = useState<BidTask[]>([
    { id: 't_01', titulo: 'Obtener prórroga del Certificado de Personería ICBF (Vence en 22 días)', responsable: 'Dra. Martha Patricia Gómez (Rep. Legal)', fecha_limite: '2026-10-15', completada: false },
    { id: 't_02', titulo: 'Formalizar Carta de Intención de Consorcio con socio local de Bolívar', responsable: 'Carlos Andrés Rodríguez (Coord. Licitaciones)', fecha_limite: '2026-10-17', completada: false },
    { id: 't_03', titulo: 'Expedir Póliza de Seriedad con Aseguradora Solidaria ($627.475.451 COP)', responsable: 'Claudia Marcela Vega (Revisoría Fiscal)', fecha_limite: '2026-10-20', completada: false },
    { id: 't_04', titulo: 'Cargar y ensamblar Canasta de Costos en Sobre 4 de SECOP II', responsable: 'Equipo Técnico Licitaciones', fecha_limite: '2026-10-22', completada: true }
  ]);

  const [bidApprovals, setBidApprovals] = useState<BidApproval[]>([
    { rol: 'tecnica', rol_titulo: 'Aprobación Técnica y Operativa', aprobado: true, aprobado_por: 'Carlos Rodríguez', fecha: '2026-10-06' },
    { rol: 'juridica', rol_titulo: 'Aprobación Jurídica (Pliegos y SNBF)', aprobado: false },
    { rol: 'financiera', rol_titulo: 'Aprobación Financiera y RUP', aprobado: true, aprobado_por: 'Claudia Vega', fecha: '2026-10-07' },
    { rol: 'representante_legal', rol_titulo: 'Firma y Autorización Representante Legal', aprobado: false }
  ]);

  // Presupuesto y AIU
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
    { id: 'b_1', concepto: 'Equipo Técnico Interdisciplinario y Formadores de Primera Infancia', tipo: 'directo', costo_mensual: 112000000, meses: 10, total: 1120000000 },
    { id: 'b_2', concepto: 'Alimentación, Nutrición y Minuta bajo lineamientos técnicos ICBF', tipo: 'directo', costo_mensual: 56000000, meses: 10, total: 560000000 },
    { id: 'b_3', concepto: 'Dotación pedagógica, material didáctico y kits de aseo e higiene', tipo: 'directo', costo_mensual: 22000000, meses: 10, total: 220000000 },
    { id: 'b_4', concepto: 'Gastos de Administración y Coordinación Territorial', tipo: 'indirecto', costo_mensual: 9579241, meses: 10, total: 95792410 },
    { id: 'b_5', concepto: 'Fondo de Imprevistos Operativos y Seguros', tipo: 'indirecto', costo_mensual: 9579241, meses: 10, total: 95792427 }
  ]);
  const [aiuAdminPct, setAiuAdminPct] = useState(5.0);
  const [aiuImprevistosPct, setAiuImprevistosPct] = useState(4.58);
  const [aiuUtilidadPct, setAiuUtilidadPct] = useState(0.0); // ESAL contrato de aporte

  // Evidencias
  const [evidences, setEvidences] = useState<EvidenceItem[]>(INITIAL_EVIDENCES);

  // Estados visuales (Sincronización, Toasts, Modales)
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showNewOrgModal, setShowNewOrgModal] = useState(false);
  const [showChecklistExportModal, setShowChecklistExportModal] = useState(false);

  // Formulario nueva org
  const [newOrgForm, setNewOrgForm] = useState({
    nombre: '',
    nit: '',
    tipo: 'Empresa S.A.S.' as ProponenteOrg['tipo'],
    sedePrincipal: '',
    departamentoBase: 'Cundinamarca',
    patrimonioCop: 300000000
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sincronizador en vivo SECOP II
  const handleSyncSecop = () => {
    setIsSyncing(true);
    triggerToast('Conectando a API de Datos Abiertos SECOP II (Colombia Compra Eficiente)...');
    setTimeout(() => {
      setIsSyncing(false);
      triggerToast('Sincronización SECOP II completada: 6 procesos actualizados con pliegos definitivos');
    }, 1200);
  };

  // Cálculos de presupuesto en tiempo real
  const totalDirectos = budgetItems.filter(i => i.tipo === 'directo').reduce((acc, i) => acc + (i.costo_mensual * i.meses), 0);
  const totalIndirectos = budgetItems.filter(i => i.tipo === 'indirecto').reduce((acc, i) => acc + (i.costo_mensual * i.meses), 0);
  const totalOferta = totalDirectos + totalIndirectos;
  const techoOficialICBF = 2091584837;
  const diferenciaTecho = totalOferta - techoOficialICBF;
  const esExcedido = diferenciaTecho > 0;

  // Filtrado de oportunidades
  const filteredOpps = opportunities.filter(opp => {
    const matchesSearch = searchTerm === '' || 
      opp.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      opp.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.process_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = filterDept === '' || opp.department.toLowerCase() === filterDept.toLowerCase();
    const matchesRec = filterRec === '' || opp.recommendation === filterRec;

    if (!matchesSearch || !matchesDept || !matchesRec) return false;

    if (oppTab === 'new') return opp.strategic_score >= 85;
    if (oppTab === 'closing_soon') return opp.presentation_date.includes('2026-10-1');
    if (oppTab === 'in_bidroom') return opp.id === 'opp_secop_icbf_001';

    return true;
  });

  // Alternar tarea de BidRoom
  const toggleBidTask = (id: string) => {
    setBidTasks(bidTasks.map(t => t.id === id ? { ...t, completada: !t.completada } : t));
    triggerToast('Estado de tarea actualizado en la sala de licitación');
  };

  // Aprobar rol directivo
  const handleApproveRole = (rol: BidApproval['rol']) => {
    setBidApprovals(bidApprovals.map(a => {
      if (a.rol === rol) {
        return {
          ...a,
          aprobado: true,
          aprobado_por: userRole === 'admin' ? 'Administrador General' : userRole,
          fecha: new Date().toISOString().split('T')[0]
        };
      }
      return a;
    }));
    triggerToast(`Aprobación formal para '${rol}' concedida`);
  };

  // Crear nueva organización tenant
  const handleCreateOrg = () => {
    if (!newOrgForm.nombre || !newOrgForm.nit) {
      alert('Ingresa al menos el nombre y NIT de la entidad');
      return;
    }
    const newOrg: ProponenteOrg = {
      id: `org_${Date.now()}`,
      nombre: newOrgForm.nombre,
      nit: newOrgForm.nit,
      tipo: newOrgForm.tipo,
      nature: newOrgForm.tipo === 'ONG / Fundación' ? 'ESAL Sin Ánimo de Lucro' : 'Sociedad Comercial',
      snbf_status: 'Registro Inicial en Plataforma',
      certVigenciaDias: 180,
      certFechaVence: '2027-04-30',
      certResolucion: 'Certificado Comercial / Personería en Trámite',
      sedePrincipal: newOrgForm.sedePrincipal || 'Bogotá D.C. / Cundinamarca',
      departamentoBase: newOrgForm.departamentoBase,
      telefono: '(+57) 300 000 0000',
      email: 'contacto@nuevaempresa.com',
      patrimonioEstimadoCop: Number(newOrgForm.patrimonioCop) || 200000000,
      boardMembers: [
        { cargo: 'Representante Legal', nombres: 'Representante Inscrito', doc_identidad: 'CC 00.000.000' }
      ],
      modalities: [],
      municipalities: [newOrgForm.departamentoBase],
      experienciaContratos: []
    };

    setOrganizaciones([...organizaciones, newOrg]);
    setActiveOrgId(newOrg.id);
    setShowNewOrgModal(false);
    triggerToast(`Organización '${newOrg.nombre}' configurada como Tenant activo`);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-[#f8fafc] flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-indigo-400 animate-bounce">
          <Sparkles className="w-5 h-5 text-cyan-300" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* TOPBAR HEADER INSTITUCIONAL */}
      <header className="border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl">
            ⚖️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                LicitaPro Colombia <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold uppercase tracking-wider">SaaS SECOP II</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Plataforma de Inteligencia Contractual, Repositorio RUP & Salas de Propuesta
            </p>
          </div>
        </div>

        {/* ALERTA COUNTDOWN DEL CERTIFICADO ICBF */}
        <div className="flex items-center gap-3 flex-wrap">
          <div 
            onClick={() => setCurrentView('profile')}
            className={`cursor-pointer px-3.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
              activeOrg.certVigenciaDias <= 30 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
            title="Certificado de Personería Jurídica ICBF - Clic para ver expediente probatorio"
          >
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>
              Certificado ICBF: <strong className="underline">{activeOrg.certVigenciaDias} días restantes</strong> ({activeOrg.certFechaVence})
            </span>
          </div>

          {/* SELECTOR DE ROL ACTIVO */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 uppercase text-[10px] font-bold">Rol:</span>
            <select 
              value={userRole} 
              onChange={(e) => {
                setUserRole(e.target.value as any);
                triggerToast(`Rol activo cambiado a: ${e.target.value}`);
              }}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="admin" className="bg-slate-900">Administrador General</option>
              <option value="bid_manager" className="bg-slate-900">Coordinador Licitaciones</option>
              <option value="legal_reviewer" className="bg-slate-900">Revisor Jurídico</option>
              <option value="financial_reviewer" className="bg-slate-900">Revisor Financiero</option>
              <option value="viewer" className="bg-slate-900">Observador</option>
            </select>
          </div>

          {/* BOTÓN SINCRONIZAR SECOP II */}
          <button 
            onClick={handleSyncSecop}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar SECOP'}</span>
          </button>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL: SIDEBAR + VISTA DE CONTENIDO */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* BARRA LATERAL (SIDEBAR DE LICITAPRO) */}
        <aside className="w-full md:w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between p-4 shrink-0">
          <div className="space-y-6">
            {/* ORGANIZACIÓN ACTIVA (TENANT) */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold mb-1">
                <span>PROPONENTE ACTIVO</span>
                <span className="text-cyan-400 cursor-pointer hover:underline" onClick={() => setShowNewOrgModal(true)}>+ Registrar</span>
              </div>
              <div className="font-bold text-sm text-white truncate">{activeOrg.nombre}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">NIT: {activeOrg.nit}</div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {activeOrg.tipo}
              </div>
            </div>

            {/* SECCIONES DE NAVEGACIÓN */}
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 px-3 mb-1.5">
                  Estrategia & Mercado
                </div>
                <nav className="space-y-1">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentView === 'dashboard'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <TrendingUp className="w-4 h-4" />
                      <span>Panel Ejecutivo</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setCurrentView('opportunities')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentView === 'opportunities' || currentView === 'opportunity_detail'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Search className="w-4 h-4" />
                      <span>Radar SECOP II</span>
                    </div>
                    <span className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-700">
                      {opportunities.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setCurrentView('sources')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentView === 'sources'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    <span>Conectores & Fuentes</span>
                  </button>
                </nav>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 px-3 mb-1.5">
                  Preparación & Oferta
                </div>
                <nav className="space-y-1">
                  <button
                    onClick={() => setCurrentView('bidroom')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentView === 'bidroom'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderOpen className="w-4 h-4" />
                      <span>Sala de Propuesta</span>
                    </div>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      En curso
                    </span>
                  </button>

                  <button
                    onClick={() => setCurrentView('budget')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentView === 'budget'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                    <span>Presupuesto & AIU</span>
                  </button>
                </nav>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 px-3 mb-1.5">
                  Evidencia & Capacidad
                </div>
                <nav className="space-y-1">
                  <button
                    onClick={() => setCurrentView('profile')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentView === 'profile'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Perfil & Repositorio RUP</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('learning')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentView === 'learning'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Aprendizaje Histórico</span>
                  </button>
                </nav>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 px-3 mb-1.5">
                  Multiempresa & Tenants
                </div>
                <nav className="space-y-1">
                  <button
                    onClick={() => setCurrentView('onboarding')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentView === 'onboarding'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Tenants & Onboarding</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>LicitaPro v2.4 SaaS</span>
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Online
            </span>
          </div>
        </aside>

        {/* ÁREA DE CONTENIDO DINÁMICO */}
        <main className="flex-1 bg-[#090d16] p-4 md:p-8 overflow-y-auto max-h-[calc(100vh-65px)]">

          {/* =========================================================================
              1. PANEL EJECUTIVO (DASHBOARD)
              ========================================================================= */}
          {currentView === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* ALERTA DE VIGENCIA PREVENTIVA */}
              {activeOrg.certVigenciaDias <= 30 && (
                <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Vencimiento Próximo: Certificado de Personería Jurídica ICBF SNBF
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      El certificado expedido bajo la Resolución 6300 de 2024 tiene vigencia reglamentaria de seis meses. 
                      <strong> Restan únicamente {activeOrg.certVigenciaDias} días</strong> ({activeOrg.certFechaVence}). Para las propuestas en curso en SECOP II, se debe tramitar reconfirmación previa para evitar causales de descarte.
                    </p>
                  </div>
                  <button 
                    onClick={() => setCurrentView('profile')}
                    className="shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs"
                  >
                    Ver Repositorio Probatorio
                  </button>
                </div>
              )}

              {/* GRID DE KPIS EJECUTIVOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Oportunidades Pertinentes</span>
                    <Search className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-3xl font-black text-white mt-2">{opportunities.length}</div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                    <TrendingUp className="w-3.5 h-3.5" /> 3 recomendadas para presentar oferta
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Cierres Próximos (≤ 14 días)</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-400 mt-2">4</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Requieren póliza y estructuración urgente
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Salas de Propuesta Activas</span>
                    <FolderOpen className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-black text-indigo-400 mt-2">1</div>
                  <div className="text-[11px] text-indigo-300 mt-1">
                    ICBF Bolívar ($2.091M COP) en ensamble
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Tasa de Éxito Histórica</span>
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-400 mt-2">78%</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    3 adjudicadas de 4 presentadas
                  </div>
                </div>
              </div>

              {/* SECCIÓN DESTACADA: CONVOCATORIA PRINCIPAL & PIPELINE */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-indigo-900/40 p-6 rounded-3xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-3 py-1 rounded-full font-bold">
                      PROCESO ESTRELLA SECOP II
                    </span>
                    <span className="text-sm font-mono font-bold text-cyan-400">
                      Score: 92/100
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    ICBF-CV-PC-001-2026BOL • Convocatoria Pública de Aporte
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                    Prestar los servicios de educación inicial en el marco de la atención Integral a la Primera Infancia de conformidad con los Manuales Técnicos y Guías Operativas del ICBF.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Presupuesto Oficial</span>
                      <strong className="text-emerald-400 font-mono text-sm">$2.091.584.837 COP</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Cierre SECOP II</span>
                      <strong className="text-white">2026-10-24 15:00</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Modalidad Óptima</span>
                      <strong className="text-amber-400">Consorcio Local (70/30)</strong>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => {
                        setSelectedOppId('opp_secop_icbf_001');
                        setCurrentView('opportunity_detail');
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                    >
                      <FileText className="w-3.5 h-3.5" /> Ficha de Sensatez & Sobres
                    </button>
                    <button 
                      onClick={() => setCurrentView('bidroom')}
                      className="bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-slate-700"
                    >
                      <FolderOpen className="w-3.5 h-3.5" /> Ir a Sala de Propuesta
                    </button>
                  </div>
                </div>

                {/* EMBUDO / PIPELINE ESTRATÉGICO */}
                <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" /> Embudo de Conversión Licitatoria
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>1. Indexadas en Radar</span>
                        <strong>6 Procesos</strong>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full w-full"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>2. Sensatez y Scoring Aprobado</span>
                        <strong>3 Viables</strong>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full w-[60%]"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>3. En Sala de Propuestas (Sobres)</span>
                        <strong>1 Proceso</strong>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full w-[25%]"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>4. Listas para Radicación SECOP</span>
                        <strong>1 en Revisión Final</strong>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[20%]"></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    Filtro activo de sensatez: Descarte preventivo de procesos con asfixia de liquidez o pliegos sastre.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              2. RADAR DE OPORTUNIDADES SECOP II
              ========================================================================= */}
          {currentView === 'opportunities' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-cyan-400" /> Radar de Oportunidades SECOP II
                  </h2>
                  <p className="text-xs text-slate-400">
                    Búsqueda, deduplicación e indexación de convocatorias del SECOP II y entidades territoriales
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSyncSecop}
                    className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Nuevas
                  </button>
                </div>
              </div>

              {/* BARRA DE FILTROS Y BÚSQUEDA */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Buscar por Objeto o Entidad</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="Ej: atención nutricional, ICBF, primera infancia, Cota..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Departamento</label>
                  <select 
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Todos los Departamentos</option>
                    <option value="Cundinamarca">Cundinamarca</option>
                    <option value="Bolívar">Bolívar</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Recomendación</label>
                  <select 
                    value={filterRec}
                    onChange={(e) => setFilterRec(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Todas</option>
                    <option value="participar">Participar</option>
                    <option value="investigar">Investigar</option>
                    <option value="descartar">Descartar</option>
                  </select>
                </div>
              </div>

              {/* TABS DE CLASIFICACIÓN */}
              <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
                <button 
                  onClick={() => setOppTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${oppTab === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Todas ({opportunities.length})
                </button>
                <button 
                  onClick={() => setOppTab('new')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${oppTab === 'new' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Prioritarias / Score Alto
                </button>
                <button 
                  onClick={() => setOppTab('closing_soon')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${oppTab === 'closing_soon' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Cierre Próximo (≤14d)
                </button>
                <button 
                  onClick={() => setOppTab('in_bidroom')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${oppTab === 'in_bidroom' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  En Sala de Propuesta (1)
                </button>
              </div>

              {/* LISTADO DE TARJETAS DE OPORTUNIDADES */}
              <div className="space-y-4">
                {filteredOpps.map(opp => (
                  <div 
                    key={opp.id} 
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 rounded-3xl transition-all shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
                  >
                    {/* SCORE CIRCULAR & RECOMENDACIÓN */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${
                        opp.strategic_score >= 85 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : (opp.strategic_score >= 70 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30')
                      }`}>
                        <span className="text-lg leading-none">{opp.strategic_score}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-400">Score</span>
                      </div>
                      <div>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          opp.recommendation === 'participar' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {opp.recommendation}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {opp.department} - {opp.city}
                        </div>
                      </div>
                    </div>

                    {/* DATOS CENTRALES */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {opp.process_number}
                        </span>
                        <span className="text-xs text-slate-400">
                          {opp.modality}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                          opp.veredicto_color === 'emerald' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
                        }`}>
                          {opp.veredicto_etiqueta}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-snug">
                        {opp.description}
                      </h4>

                      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                        <span><strong className="text-slate-300">Entidad:</strong> {opp.entity_name}</span>
                        <span><strong className="text-slate-300">Cierre:</strong> {opp.presentation_date}</span>
                        <span><strong className="text-slate-300">Presupuesto:</strong> <span className="text-emerald-400 font-mono font-bold">{formatCOP(opp.estimated_value)}</span></span>
                      </div>

                      {/* FILTRO FINANCIERO Y OPERATIVO */}
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-4 text-[11px] text-slate-300 flex-wrap">
                        <span>
                          <DollarSign className="w-3 h-3 inline text-emerald-400" /> Capital Trabajo: <strong className="text-white">{formatCOP(opp.capital_trabajo_min_cop)}</strong> ({opp.dias_colchon}d colchón)
                        </span>
                        <span>
                          <ShieldCheck className="w-3 h-3 inline text-cyan-400" /> Póliza Seriedad: <strong className="text-white">{formatCOP(opp.poliza_valor_cop)}</strong> (Prima est: {formatCOP(opp.prima_est_cop)})
                        </span>
                        <span className="text-slate-400">
                          <MapPin className="w-3 h-3 inline text-amber-400" /> {opp.friccion_territorial}
                        </span>
                      </div>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="flex lg:flex-col gap-2 shrink-0 w-full lg:w-44">
                      <button 
                        onClick={() => {
                          setSelectedOppId(opp.id);
                          setCurrentView('opportunity_detail');
                        }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
                      >
                        <FileText className="w-3.5 h-3.5" /> Ficha & Viabilidad
                      </button>

                      {opp.id === 'opp_secop_icbf_001' ? (
                        <button 
                          onClick={() => setCurrentView('bidroom')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <FolderOpen className="w-3.5 h-3.5" /> Ir a Bid Room
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setSelectedOppId(opp.id);
                            setCurrentView('bidroom');
                            triggerToast(`Sala de Propuesta inicializada para ${opp.process_number}`);
                          }}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700"
                        >
                          <FolderPlus className="w-3.5 h-3.5" /> Abrir Bid Room
                        </button>
                      )}

                      <a 
                        href={opp.secop_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-800 text-center"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" /> SECOP II Oficial
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              3. FICHA DETALLADA, CALIFICACIÓN ESTRATÉGICA Y SOBRES SECOP II
              ========================================================================= */}
          {currentView === 'opportunity_detail' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-between gap-4">
                <button 
                  onClick={() => setCurrentView('opportunities')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver a Oportunidades
                </button>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentView('bidroom')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <FolderOpen className="w-3.5 h-3.5" /> Ir a Sala de Propuesta (BidRoom)
                  </button>
                  <a 
                    href={selectedOpp.secop_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> Expediente SECOP II
                  </a>
                </div>
              </div>

              {/* ENCABEZADO DE LA CONVOCATORIA */}
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/30">
                        {selectedOpp.process_number}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{selectedOpp.modality}</span>
                      <span className="text-xs text-slate-400">• {selectedOpp.department} ({selectedOpp.city})</span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-2">
                      {selectedOpp.description}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedOpp.object_detail || selectedOpp.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Presupuesto Oficial SECOP II</span>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      {formatCOP(selectedOpp.estimated_value)}
                    </div>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Cierre: <strong className="text-white">{selectedOpp.presentation_date}</strong>
                    </span>
                  </div>
                </div>

                {/* VEREDICTO DE SENSATEZ FINANCIERA & LOGÍSTICA */}
                <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  selectedOpp.veredicto_color === 'emerald'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm uppercase flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> {selectedOpp.veredicto_etiqueta}
                      </span>
                      <span className="text-xs text-slate-400">Score Estratégico: {selectedOpp.strategic_score}/100</span>
                    </div>
                    <p className="text-xs mt-1 text-slate-300">
                      <strong>Regla Estratégica:</strong> {selectedOpp.regla_descarte}
                    </p>
                    <p className="text-xs mt-0.5 text-slate-400">
                      {selectedOpp.justificacion}
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs shrink-0 space-y-1">
                    <div>Capital de trabajo: <strong className="text-white font-mono">{formatCOP(selectedOpp.capital_trabajo_min_cop)}</strong></div>
                    <div>Póliza de seriedad: <strong className="text-white font-mono">{formatCOP(selectedOpp.poliza_valor_cop)}</strong></div>
                  </div>
                </div>
              </div>

              {/* TABS DE LA FICHA DETALLADA */}
              <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
                <button 
                  onClick={() => setOppDetailTab('secop_sobres')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    oppDetailTab === 'secop_sobres' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> 1. Cuestionario de Sobres SECOP II (Habilitantes)
                </button>
                <button 
                  onClick={() => setOppDetailTab('antirechazo')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    oppDetailTab === 'antirechazo' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> 2. Checklist Anti-Rechazo (Causales No Subsanables)
                </button>
                <button 
                  onClick={() => setOppDetailTab('matriz_pliegos')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    oppDetailTab === 'matriz_pliegos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" /> 3. Matriz de Requisitos del Pliego
                </button>
              </div>

              {/* TAB 1: CUESTIONARIO DE SOBRES SECOP II */}
              {oppDetailTab === 'secop_sobres' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedOpp.sobres_secop).map(([key, sobre]) => (
                    <div key={key} className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-cyan-400" /> {sobre.titulo}
                        </h4>
                        <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                          {sobre.items.length} requisitos
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {sobre.items.map((it, idx) => (
                          <div key={idx} className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-white">{it.nombre}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${
                                it.estado === 'listo'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : (it.estado === 'por_actualizar' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300')
                              }`}>
                                {it.estado === 'listo' ? 'Listo' : (it.estado === 'por_actualizar' ? 'Por Actualizar' : 'Atención')}
                              </span>
                            </div>
                            <div className="text-[11px] text-cyan-300">
                              Exigencia: {it.exigencia}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {it.detalle}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: CHECKLIST ANTI-RECHAZO */}
              {oppDetailTab === 'antirechazo' && (
                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" /> Causales Críticas de Rechazo en SECOP II
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      El 70% de las propuestas descartadas en SECOP II caen por errores formales o inconsistencias aritméticas prevenibles. Valida cada punto antes de radicar.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {selectedOpp.checklist_antirechazo.map((chk, idx) => (
                      <div key={idx} className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            {chk.titulo}
                          </h4>
                          <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded">
                            No Subsanable
                          </span>
                        </div>
                        <div className="text-xs text-rose-300/90">
                          <strong>Riesgo de Descarte:</strong> {chk.riesgo}
                        </div>
                        <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                          <strong>Medida Preventiva LicitaPro:</strong> {chk.medida_preventiva}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MATRIZ DE REQUISITOS DEL PLIEGO */}
              {oppDetailTab === 'matriz_pliegos' && (
                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">Matriz de Requisitos y Evidencias</h3>
                      <p className="text-xs text-slate-400">Requisitos clasificados, carácter habilitante/puntuable y cruce probatorio con la empresa</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">Código</th>
                          <th className="p-3">Requisito Literal del Pliego</th>
                          <th className="p-3">Carácter</th>
                          <th className="p-3">Evidencia Vinculada</th>
                          <th className="p-3">Cumplimiento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {selectedOpp.requirements.map((req, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="p-3 font-mono font-bold text-cyan-400">{req.codigo}</td>
                            <td className="p-3 max-w-xs">
                              <div className="font-semibold text-white">{req.titulo}</div>
                              <div className="text-slate-400 text-[11px] mt-0.5">{req.literal}</div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                req.caracter === 'Habilitante Obligatorio' ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'
                              }`}>
                                {req.caracter}
                              </span>
                              {req.max_pts && <span className="block text-[10px] text-cyan-400 mt-0.5 font-bold">+{req.max_pts} pts</span>}
                            </td>
                            <td className="p-3 text-slate-300">
                              <div className="flex items-center gap-1.5">
                                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{req.evidencia}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                req.estado === 'cumple_con_evidencia' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {req.estado.replace(/_/g, ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              4. SALA DE PROPUESTA (BIDROOM OFICIAL)
              ========================================================================= */}
          {currentView === 'bidroom' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      FASE: ENSAMBLE FINAL DE SOBRES
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ICBF-CV-PC-001-2026BOL</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    Sala de Propuesta: Convocatoria Primera Infancia ICBF Bolívar
                  </h2>
                  <p className="text-xs text-slate-400">
                    Estación de trabajo para aprobaciones formales, checklist de documentos y radicación
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowChecklistExportModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Exportar Checklist Pre-Envío
                  </button>
                  <a 
                    href="https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10207367" 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> Presentar Oferta en SECOP II
                  </a>
                </div>
              </div>

              {/* BARRA DE ESTADO Y MÉTRICAS DE LA SALA */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Plazo Límite SECOP II</span>
                  <strong className="text-white text-sm">2026-10-24 15:00</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Presupuesto Techo</span>
                  <strong className="text-emerald-400 font-mono text-sm">$2.091.584.837 COP</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tareas Pendientes</span>
                  <strong className="text-amber-400 text-sm">
                    {bidTasks.filter(t => !t.completada).length} de {bidTasks.length} pendientes
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Aprobaciones Directivas</span>
                  <strong className="text-indigo-400 text-sm">
                    {bidApprovals.filter(a => a.aprobado).length} de 4 concedidas
                  </strong>
                </div>
              </div>

              {/* GRID: APROBACIONES DIRECTIVAS + TAREAS DEL EQUIPO */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* FLUJO DE APROBACIONES */}
                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" /> Flujo de Aprobaciones Formales
                    </h3>
                    <span className="text-[10px] text-slate-400">Requisito previo a radicación</span>
                  </div>

                  <div className="space-y-3">
                    {bidApprovals.map((appr, idx) => (
                      <div key={idx} className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold text-white">{appr.rol_titulo}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {appr.aprobado 
                              ? `Aprobado por: ${appr.aprobado_por} (${appr.fecha})` 
                              : 'Pendiente de visto bueno'}
                          </div>
                        </div>

                        <div>
                          {appr.aprobado ? (
                            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Aprobado
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleApproveRole(appr.rol)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-xl text-xs font-bold transition-all"
                            >
                              Aprobar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TAREAS DE ENSAMBLE Y RADICACIÓN */}
                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-400" /> Tareas de Ensamble y Radicación
                    </h3>
                    <span className="text-[10px] text-slate-400">Control de hitos críticos</span>
                  </div>

                  <div className="space-y-2.5">
                    {bidTasks.map(task => (
                      <div 
                        key={task.id} 
                        onClick={() => toggleBidTask(task.id)}
                        className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                          task.completada 
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400' 
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-white'
                        }`}
                      >
                        <div className="mt-0.5">
                          {task.completada ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className={`text-xs font-semibold ${task.completada ? 'line-through text-slate-400' : 'text-white'}`}>
                            {task.titulo}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                            <span><Users className="w-3 h-3 inline mr-1" />{task.responsable}</span>
                            <span><Clock className="w-3 h-3 inline mr-1" />Vence: {task.fecha_limite}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* DOCUMENTOS Y ANEXOS DE LA OFERTA */}
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Documentos Listos para Carga en SECOP II</h3>
                    <p className="text-xs text-slate-400">Anexos técnicos, jurídicos y financieros vinculados al expediente</p>
                  </div>
                  <button 
                    onClick={() => triggerToast('Simulador de carga activado: Puedes arrastrar archivos PDF firmados')}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-700"
                  >
                    + Adjuntar Documento
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 block">Sobre 1 - Jurídico</span>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-rose-400" /> Carta_Presentacion_Oferta.pdf
                    </div>
                    <div className="text-[11px] text-emerald-400 font-semibold">Listo y Firmado Digitalmente</div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 block">Sobre 2 - Técnico</span>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-rose-400" /> Propuesta_Tecnica_Primera_Infancia.pdf
                    </div>
                    <div className="text-[11px] text-emerald-400 font-semibold">Aprobado por Dirección Técnica</div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 block">Sobre 4 - Económico</span>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-rose-400" /> Formato_Economico_Canasta_Costos.xlsx
                    </div>
                    <div className="text-[11px] text-emerald-400 font-semibold font-mono">Total: $2.091.584.837 COP (Exacto)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              5. ESTRUCTURACIÓN PRESUPUESTAL & SIMULADOR AIU
              ========================================================================= */}
          {currentView === 'budget' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-400" /> Simulador de Estructuración Presupuestal & AIU
                  </h2>
                  <p className="text-xs text-slate-400">
                    Canasta de costos, administración, imprevistos y validación automática contra el Presupuesto Oficial SECOP II
                  </p>
                </div>

                <button 
                  onClick={() => triggerToast('Presupuesto exportado en formato estándar de propuesta económica')}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" /> Exportar a Excel (CSV)
                </button>
              </div>

              {/* TARJETAS RESUMEN ARITMÉTICO */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Costos Directos (Operación)</span>
                  <div className="text-lg font-black text-white font-mono mt-1">{formatCOP(totalDirectos)}</div>
                  <span className="text-[11px] text-slate-400">Talento humano, nutrición y dotación</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Costos Indirectos (AIU)</span>
                  <div className="text-lg font-black text-indigo-400 font-mono mt-1">{formatCOP(totalIndirectos)}</div>
                  <span className="text-[11px] text-slate-400">Administración ({aiuAdminPct}%) + Imprevistos ({aiuImprevistosPct}%)</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Oferta Económica</span>
                  <div className="text-lg font-black text-emerald-400 font-mono mt-1">{formatCOP(totalOferta)}</div>
                  <span className="text-[11px] text-emerald-400 font-semibold">Valor exacto a radicar</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Techo Oficial SECOP II</span>
                  <div className="text-lg font-black text-slate-300 font-mono mt-1">{formatCOP(techoOficialICBF)}</div>
                  <span className="text-[11px] text-slate-400">Proceso ICBF Primera Infancia</span>
                </div>
              </div>

              {/* BANNER DE CONSISTENCIA ARITMÉTICA */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
                esExcedido 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                <div className="flex items-center gap-2">
                  {esExcedido ? <XCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  <span>
                    {esExcedido 
                      ? `ALERTA DE RECHAZO: La oferta supera el presupuesto oficial por ${formatCOP(diferenciaTecho)}. En SECOP II esto causa descarte inmediato.` 
                      : 'VIABILIDAD CONFIRMADA: La oferta coincide exactamente con el presupuesto oficial asignado sin sobrecostos.'}
                  </span>
                </div>
                <div className="font-mono font-bold">
                  Diferencia: {formatCOP(diferenciaTecho)}
                </div>
              </div>

              {/* TABLA DE ÍTEMS DE LA CANASTA DE COSTOS */}
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white">Desglose Canasta Oficial de Primera Infancia</h3>
                  <button 
                    onClick={() => {
                      const nuevo: BudgetItem = {
                        id: `b_${Date.now()}`,
                        concepto: 'Nuevo Ítem de Operación Territorial',
                        tipo: 'directo',
                        costo_mensual: 10000000,
                        meses: 10,
                        total: 100000000
                      };
                      setBudgetItems([...budgetItems, nuevo]);
                      triggerToast('Nuevo ítem de costo agregado al simulador');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                  >
                    + Agregar Ítem
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Concepto / Rubro</th>
                        <th className="p-3">Naturaleza</th>
                        <th className="p-3">Costo Mensual (COP)</th>
                        <th className="p-3">Meses</th>
                        <th className="p-3">Total Presupuestado (COP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {budgetItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-800/30">
                          <td className="p-3 font-sans font-semibold text-white">{item.concepto}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.tipo === 'directo' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-indigo-500/20 text-indigo-300'
                            }`}>
                              {item.tipo}
                            </span>
                          </td>
                          <td className="p-3 text-slate-200">{formatCOP(item.costo_mensual)}</td>
                          <td className="p-3 text-slate-300">{item.meses}</td>
                          <td className="p-3 font-bold text-emerald-400">{formatCOP(item.costo_mensual * item.meses)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              6. PERFIL EMPRESARIAL & REPOSITORIO PROBATORIO (RUP)
              ========================================================================= */}
          {currentView === 'profile' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* FICHA INSTITUCIONAL PRINCIPAL */}
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
                        {activeOrg.nature}
                      </span>
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                        {activeOrg.snbf_status}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white mt-2">
                      {activeOrg.nombre}
                    </h2>
                    <div className="text-xs text-slate-400 font-mono mt-1">
                      NIT: <strong>{activeOrg.nit}</strong> | Sede: <strong>{activeOrg.sedePrincipal}</strong>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Patrimonio Registrado</span>
                    <div className="text-xl font-black text-emerald-400 font-mono">
                      {formatCOP(activeOrg.patrimonioEstimadoCop)}
                    </div>
                  </div>
                </div>

                {/* ALERTA Y DESGLOSE DEL CERTIFICADO ICBF SNBF */}
                <div className="bg-slate-950/90 border border-amber-500/30 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      Certificado de Personería Jurídica y Representación Legal (ICBF Regional Cundinamarca)
                    </h4>
                    <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                      Vence en {activeOrg.certVigenciaDias} días
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                    <div>• <strong>Resolución:</strong> Res. 6300 de 2024 (Art. 53)</div>
                    <div>• <strong>Fecha Expedición:</strong> 29 de abril de 2026</div>
                    <div>• <strong>Fecha Vencimiento:</strong> <span className="text-amber-400 font-bold">{activeOrg.certFechaVence}</span></div>
                    <div>• <strong>Vigencia Legal:</strong> Seis (6) meses reglamentarios</div>
                    <div>• <strong>Estado en SECOP II:</strong> Acreditable con solicitud de prórroga</div>
                    <div>• <strong>Archivo Soporte:</strong> <span className="text-cyan-400 underline cursor-pointer">Certific. FUNDACION NUEVA VIDA-2026 Abril.pdf</span></div>
                  </div>
                </div>

                {/* JUNTA DIRECTIVA REGISTRADA */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                      Junta Directiva Registrada en Certificado ICBF
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {userRole === 'admin' ? 'Acceso Administrador (Cédulas completas)' : 'Acceso Restringido'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {activeOrg.boardMembers.map((member, idx) => (
                      <div key={idx} className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-xs">
                        <span className="text-[10px] text-cyan-400 font-bold block">{member.cargo}</span>
                        <strong className="text-white block mt-0.5">{member.nombres}</strong>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {userRole === 'admin' ? member.doc_identidad : 'CC ••.•••.••• (Protegido Ley 1581)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MUNICIPIOS DE CUNDINAMARCA DEL BROCHURE */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Presencia Territorial Declarada en Brochure Institucional (14 Centros de Cundinamarca)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeOrg.municipalities.map((m, idx) => (
                      <span key={idx} className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-lg">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* REPOSITORIO PROBATORIO DE EVIDENCIAS */}
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Repositorio Probatorio de Evidencias</h3>
                    <p className="text-xs text-slate-400">Certificaciones contractuales, actas de liquidación y documentos listos para ofertar</p>
                  </div>
                  <button 
                    onClick={() => triggerToast('Cargador de documentos listo para anexar')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                  >
                    + Cargar Evidencia
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Evidencia / Título</th>
                        <th className="p-3">Categoría</th>
                        <th className="p-3">Emisor</th>
                        <th className="p-3">Vigencia</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Archivo Soporte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {evidences.map(ev => (
                        <tr key={ev.id} className="hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-white">{ev.titulo}</td>
                          <td className="p-3">
                            <span className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold">
                              {ev.categoria}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{ev.emisor}</td>
                          <td className="p-3 text-slate-300">{ev.vigencia}</td>
                          <td className="p-3">
                            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
                              {ev.estado}
                            </span>
                          </td>
                          <td className="p-3 text-cyan-400 underline font-mono text-[11px] cursor-pointer">
                            {ev.archivo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              7. APRENDIZAJE HISTÓRICO & AUDITORÍA
              ========================================================================= */}
          {currentView === 'learning' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-cyan-400" /> Aprendizaje Histórico de Convocatorias
                </h2>
                <p className="text-xs text-slate-400">
                  Trazabilidad de propuestas adjudicadas vs descartadas y lecciones preventivas de pliegos
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    ADJUDICADA / VICTORIA
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    Convenio de Asociación Soacha 2021 ($151.071.426 COP)
                  </h4>
                  <p className="text-xs text-slate-300">
                    Atención integral a NNA en restablecimiento de derechos. Adjudicado a Fundación Nueva Vida con puntaje de 98/100.
                  </p>
                  <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                    <strong>Factor de Éxito:</strong> Presentación impecable de certificaciones de personal y coincidencia exacta en APU nutricional.
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
                  <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    LECCIÓN APRENDIDA / DESCARTE PREVIO
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    Convocatoria Regional Santander 2023
                  </h4>
                  <p className="text-xs text-slate-300">
                    Descartada en etapa previa por exigencia de sede física con matrícula mercantil en Bucaramanga.
                  </p>
                  <div className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    <strong>Regla Incorporada en LicitaPro:</strong> Nunca presentarse fuera de Cundinamarca sin consorcio con sede territorial nativa.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              8. CONECTORES & FUENTES OFICIALES
              ========================================================================= */}
          {currentView === 'sources' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" /> Conectores & Fuentes Oficiales de Contratación
                </h2>
                <p className="text-xs text-slate-400">
                  APIs de Datos Abiertos Colombia, Colombia Compra Eficiente y SECOP II
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">SRC-SECOP-II</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      CONECTADO
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white">SECOP II - Procesos de Contratación</h4>
                  <p className="text-xs text-slate-400">
                    Endpoint oficial: <code className="text-cyan-300">https://www.datos.gov.co/resource/p6dx-8zbt.json</code>
                  </p>
                  <div className="text-xs text-slate-300">
                    • Cobertura: Nacional • Frecuencia: Cada 30 minutos • Formato: Socrata Open Data API (SODA)
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">SRC-PAA</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      CONECTADO
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white">Plan Anual de Adquisiciones (PAA)</h4>
                  <p className="text-xs text-slate-400">
                    Endpoint oficial: <code className="text-cyan-300">https://www.datos.gov.co/resource/274f-d922.json</code>
                  </p>
                  <div className="text-xs text-slate-300">
                    • Detección temprana de licitaciones 6 meses antes de la publicación de pliegos borradores.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              9. TENANTS & ONBOARDING MULTIEMPRESA
              ========================================================================= */}
          {currentView === 'onboarding' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" /> Tenants & Multi-Organización
                  </h2>
                  <p className="text-xs text-slate-400">
                    Aislamiento estricto de repositorios probatorios y perfiles para consorcios y empresas
                  </p>
                </div>
                <button 
                  onClick={() => setShowNewOrgModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <Plus className="w-4 h-4" /> Vincular Nueva Empresa
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {organizaciones.map(org => (
                  <div 
                    key={org.id} 
                    className={`p-5 rounded-3xl border transition-all ${
                      org.id === activeOrgId 
                        ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10' 
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        org.id === activeOrgId ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {org.id === activeOrgId ? 'TENANT ACTIVO' : 'ORGANIZACIÓN REGISTRADA'}
                      </span>
                      <span className="text-xs text-slate-400">{org.tipo}</span>
                    </div>

                    <h4 className="text-base font-bold text-white">{org.nombre}</h4>
                    <div className="text-xs text-slate-400 font-mono mt-1">NIT: {org.nit}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Sede: {org.sedePrincipal}</div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span>Patrimonio: <strong className="text-emerald-400 font-mono">{formatCOP(org.patrimonioEstimadoCop)}</strong></span>
                      {org.id !== activeOrgId && (
                        <button 
                          onClick={() => {
                            setActiveOrgId(org.id);
                            triggerToast(`Cambiado a: ${org.nombre}`);
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1 rounded-lg font-bold"
                        >
                          Seleccionar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: VINCULAR NUEVA EMPRESA / ONBOARDING */}
      {showNewOrgModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" /> Registrar Nueva Empresa / ONG
              </h3>
              <button onClick={() => setShowNewOrgModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Razón Social</label>
                <input 
                  type="text" 
                  value={newOrgForm.nombre}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, nombre: e.target.value })}
                  placeholder="Ej: Fundación Crecer Juntos, Constructora del Norte S.A.S."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">NIT (con dígito de verificación)</label>
                <input 
                  type="text" 
                  value={newOrgForm.nit}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, nit: e.target.value })}
                  placeholder="Ej: 901.452.339-1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Naturaleza Jurídica</label>
                  <select 
                    value={newOrgForm.tipo}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, tipo: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ONG / Fundación">ONG / Fundación</option>
                    <option value="Empresa S.A.S.">Empresa S.A.S.</option>
                    <option value="Asociación Campesina">Asociación Campesina</option>
                    <option value="Cooperativa">Cooperativa</option>
                    <option value="Consorcio">Consorcio</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Departamento Sede</label>
                  <select 
                    value={newOrgForm.departamentoBase}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, departamentoBase: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Cundinamarca">Cundinamarca</option>
                    <option value="Bogotá D.C.">Bogotá D.C.</option>
                    <option value="Bolívar">Bolívar</option>
                    <option value="Antioquia">Antioquia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Sede / Municipio Principal</label>
                <input 
                  type="text" 
                  value={newOrgForm.sedePrincipal}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, sedePrincipal: e.target.value })}
                  placeholder="Ej: Cajicá, Cota, Cartagena..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Patrimonio Estimado (COP)</label>
                <input 
                  type="number" 
                  value={newOrgForm.patrimonioCop}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, patrimonioCop: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button 
                onClick={() => setShowNewOrgModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateOrg}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs"
              >
                Crear e Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXPORTAR CHECKLIST PRE-ENVÍO SECOP II */}
      {showChecklistExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" /> Checklist Oficial de Validación Pre-Envío SECOP II
              </h3>
              <button onClick={() => setShowChecklistExportModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-xs text-emerald-200 space-y-1">
              <strong className="text-sm font-bold block text-emerald-300">
                VERIFICACIÓN LISTA PARA RADICACIÓN EN SECOP II
              </strong>
              <div>Proceso: <strong>ICBF-CV-PC-001-2026BOL</strong></div>
              <div>Cuantía Oficial: <strong>$2.091.584.837 COP</strong></div>
              <div>Requisitos Habilitantes Verificados: <strong>100%</strong></div>
            </div>

            <textarea 
              readOnly 
              rows={8}
              value={`LICITAPRO COLOMBIA - CHECKLIST PRE-ENVIO SECOP II
Proceso: ICBF-CV-PC-001-2026BOL
Entidad: INSTITUTO COLOMBIANO DE BIENESTAR FAMILIAR
Proponente: Fundación Nueva Vida (NIT: 832.008.424-4)
Modalidad: Convocatoria Pública de Aporte

[✓] SOBRE 1: Personería Jurídica ICBF SNBF Res. 6300/2024 verificada
[✓] SOBRE 1: Certificación Parafiscales y Seguridad Social firmada
[✓] SOBRE 2: Experiencia previa acreditada ($571M en Cundinamarca + Socio Local)
[✓] SOBRE 3: Indicadores RUP (Liquidez: 1.82 >= 1.5 | Endeudamiento: 34.5% <= 70%)
[✓] SOBRE 3: Póliza de Seriedad emitida por Aseguradora Solidaria ($627.475.451 COP)
[✓] SOBRE 4: Canasta de costos coincide exactamente con Techo Oficial ($2.091.584.837 COP)
[✓] VEREDICTO: Listo para firma y radicación en la plataforma oficial del SECOP II.`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-cyan-300 font-mono text-xs focus:outline-none"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button 
                onClick={() => setShowChecklistExportModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Cerrar
              </button>
              <a 
                href="https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10207367"
                target="_blank"
                rel="noreferrer"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Abrir Portal SECOP II
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
