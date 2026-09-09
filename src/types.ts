// Interfaces y tipos del sistema ALCALDE AMIGO con Ramitos

export type ActiveTab = 'chat' | 'escucha' | 'crm' | 'copiloto' | 'cloud';

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
