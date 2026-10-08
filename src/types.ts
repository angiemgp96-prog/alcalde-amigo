// Interfaces y tipos del sistema ALCALDE AMIGO con Ramitos

export type ActiveTab = 
  | 'territorio'
  | 'gira' 
  | 'radiografia' 
  | 'veredas' 
  | 'auditoria' 
  | 'politicas' 
  | 'mga' 
  | 'speech' 
  | 'chat' 
  | 'escucha' 
  | 'crm' 
  | 'copiloto'
  | 'licitaciones';

export interface CitizenLead {
  id: string;
  nombre: string;
  whatsapp: string;
  veredaBarrio: string;
  interesPrincipal?: string;
  fechaRegistro: string;
  estadoNotificacion: 'activo' | 'pausado';
}

export interface CitizenNeed {
  id: string;
  contactoId?: string;
  ciudadanoNombre: string;
  veredaBarrio: string;
  audioTranscripcion: string;
  problematicaSintetizada: string;
  sector: 'Agua Potable y Saneamiento' | 'Educación y Conectividad' | 'Campo y Desarrollo Agrícola' | 'Infancia y Familia' | 'Energía e Infraestructura' | 'Salud y Bienestar';
  urgencia: 'Crítica' | 'Alta' | 'Media';
  propuestaRamitos: string;
  insumosClave: string[];
  presupuestoEstimadoCop: number;
  votosApoyo: number;
  fechaReporte: string;
  whatsapp?: string;
  municipioId?: 'guaduas' | 'caparrapi';
  origen?: 'chat' | 'formulario';
}

export interface ComparativePriceOption {
  id: string;
  proveedor: string;
  tienda: 'MercadoLibre' | 'Temu' | 'Ferretería Local' | 'Distribuidor Nacional';
  precioUnitarioCop: number;
  link: string;
  verificado: boolean;
  nota?: string;
}

export interface PurchaseItem {
  id?: string;
  producto: string;
  cantidad: number;
  precioUnitarioCop: number;
  precioTotalCop: number;
  linkReferencia: string;
  tienda?: 'MercadoLibre' | 'Temu' | 'Distribuidor Nacional' | 'Ferretería Local';
  estadoVerificacion?: 'verificado' | 'pendiente_link';
  esLinkDirecto?: boolean;
  opcionesComparativas?: ComparativePriceOption[];
}

export interface LaborItem {
  id?: string;
  rol: string;
  personas: number;
  diasTrabajo: number;
  tarifaDiariaCop: number;
  totalLaborCop: number;
}

export interface ProposalComment {
  id: string;
  autor: string;
  rol: 'Presidente JAC' | 'Fontanero Veredal' | 'Operario Local' | 'Vecino Beneficiario' | 'Equipo Gobierno';
  texto: string;
  seccion: 'general' | 'tecnologia' | 'mano_obra' | 'legal';
  fecha: string;
}

export interface BaseProposal {
  id: string;
  codigo: string;
  titulo: string;
  sector: 'Agua Potable y Saneamiento' | 'Educación y Conectividad' | 'Campo y Desarrollo Agrícola' | 'Infancia y Familia' | 'Energía e Infraestructura' | 'Salud y Bienestar';
  veredasAfectadas: string[];
  diagnostico: string;
  contrastePolitico: string;
  solucionPragmatica: string;
  comprasDirectas: string[];
  comprasDetalladas?: PurchaseItem[];
  manoDeObraDetallada?: LaborItem[];
  porcentajeFlete?: number;
  mecanismoLegalEspecifico?: string;
  pasosOperativosFastTrack?: string[];
  votosVistoBueno?: number;
  vistoBuenoAprobado?: boolean;
  comentariosComunidad?: ProposalComment[];
  presupuestoTotalCop: number;
  marcoLegal: string;
  talentoHumano: string[];
  cronogramaDias: number;
  estado: 'En Campaña' | 'Aprobado Plan' | 'En Co-creación' | 'En Ejecución' | 'Completado';
}

export interface GreenApiMessage {
  id: string;
  destinatarioWhatsapp: string;
  veredaBarrio: string;
  mensajeTexto: string;
  tipoEnvio: 'Directo' | 'Masivo Veredal' | 'Avance Proyecto';
  estadoEnvio: 'Enviado Simulador' | 'Enviado GreenAPI' | 'Fallido';
  fechaEnvio: string;
}

export interface GreenApiConfig {
  idInstance: string;
  apiTokenInstance: string;
  enabled: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export interface PilotVoting {
  id: string;
  proyectoId?: string;
  titulo: string;
  descripcion: string;
  veredaBarrio: string;
  votos: number;
  metaVotos: number;
  estado: 'activa' | 'completada';
  fechaCreacion?: string;
}

// -------------------------------------------------------------
// SISTEMA OFICIAL DE FORMULACIÓN MGA / DNP / PRESIDENCIA
// -------------------------------------------------------------

export type EstadoTramiteProyecto = 
  | 'borrador' 
  | 'en_estructuracion' 
  | 'requisitos_pendientes' 
  | 'listo_presidencia' 
  | 'radicado';

export interface EvaluacionEconomicaMga {
  tasa_descuento?: string;
  vpn_social?: string | number;
  tir_social?: string;
  relacion_costo_beneficio?: string | number;
}

export interface ArbolProblemasMga {
  problema_central?: string;
  causa_directa?: string;
  causa_indirecta?: string;
  efecto_directo?: string;
  efecto_indirecto?: string;
}

export interface ArbolObjetivosMga {
  objetivo_general?: string;
  fines_directos?: string[];
  medios_directos?: string[];
}

export interface CadenaValorItem {
  etapa?: string;
  actividad?: string;
  producto_dnp?: string;
  unidad_medida?: string;
  cantidad?: number;
  costo_estimado_cop?: number;
}

export interface ProyectoMgaEstructurado {
  id: string;
  municipio_id: 'caparrapi' | 'guaduas';
  codigo_bpin_propuesto: string;
  nombre_proyecto: string;
  sector_dnp: string;
  codigo_producto_dnp?: string;
  fase_mga: string;
  estado_tramite: EstadoTramiteProyecto;
  presupuesto_total_cop: number;
  fuente_financiacion_principal: string;
  veredas_impactadas: string[];
  poblacion_beneficiaria_total: number;
  evaluacion_economica?: EvaluacionEconomicaMga;
  arbol_problemas?: ArbolProblemasMga;
  arbol_objetivos?: ArbolObjetivosMga;
  cadena_valor?: CadenaValorItem[];
  justificacion_presidencia?: string;
  creado_por?: string;
  created_at?: string;
  updated_at?: string;
  // Campos complementarios de compatibilidad con vistas existentes
  apu_clave?: string;
  capitulos_presupuesto_apu?: { capitulo: string; valor: number | string; apu_clave?: string }[];
  checklist_tareas?: { tarea: string; estado: string; responsable: string }[];
}

export type CategoriaRequisito = 'legal' | 'tecnico' | 'ambiental' | 'socioeconomico' | 'censo';
export type EstadoRequisito = 'pendiente' | 'cargado' | 'verificado';

export interface RequisitoViabilidad {
  id: string;
  proyecto_id: string;
  categoria: CategoriaRequisito;
  nombre_requisito: string;
  descripcion?: string;
  es_obligatorio: boolean;
  estado: EstadoRequisito;
  archivo_url?: string;
  archivo_nombre?: string;
  archivo_size?: number;
  observaciones?: string;
  updated_at?: string;
}

export interface CensoBeneficiario {
  id: string;
  proyecto_id: string;
  nombre_completo: string;
  numero_documento?: string;
  vereda: string;
  grupo_sisben?: string;
  numero_miembros_familia: number;
  hectareas_o_unidad_productiva?: string;
  telefono_contacto?: string;
  observacion_territorial?: string;
  created_at?: string;
}

export interface PresupuestoApuItem {
  id: string;
  proyecto_id: string;
  numero_capitulo: number;
  nombre_capitulo: string;
  item_codigo?: string;
  descripcion_item: string;
  unidad_medida: string;
  cantidad: number;
  valor_unitario_cop: number;
  valor_total_cop: number;
}

