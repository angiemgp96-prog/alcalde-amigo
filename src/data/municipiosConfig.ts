import { BaseProposal } from '../types';
import { BASE_PROPOSALS as BASE_PROPOSALS_GUADUAS } from './basePlanData';

export interface VeredaInfo {
  nombre: string;
  zona: 'Urbana' | 'Inspección' | 'Veredal';
  descripcion: string;
}

export const VEREDAS_GUADUAS: VeredaInfo[] = [
  { nombre: 'Piedras Negras', zona: 'Veredal', descripcion: 'Zona rural distante, requiere agua potable inmediata y conectividad.' },
  { nombre: 'Puerto Bogotá', zona: 'Inspección', descripcion: 'Inspección a orillas del río Magdalena, necesidad de filtración de agua e infraestructura comunitaria.' },
  { nombre: 'Guaduas Centro', zona: 'Urbana', descripcion: 'Casco urbano, parques infantiles, desarrollo turístico y comercio.' },
  { nombre: 'La Paz', zona: 'Urbana', descripcion: 'Barrio popular, parque infantil y espacios deportivos.' },
  { nombre: 'El Hato', zona: 'Veredal', descripcion: 'Zona agrícola productiva, conectividad escolar y transporte de cosechas.' },
  { nombre: 'San José', zona: 'Veredal', descripcion: 'Comunidad agrícola, escuela veredal y vías de acceso.' },
  { nombre: 'Yaguara', zona: 'Veredal', descripcion: 'Vereda alta, red de mini-tiendas de campesinos afiliados.' },
  { nombre: 'La Esperanza', zona: 'Veredal', descripcion: 'Producción de caña y panelera, apoyo a micro-productores.' },
  { nombre: 'Carbonera', zona: 'Veredal', descripcion: 'Vereda montañosa, kits solares y antenas Starlink.' },
  { nombre: 'Canta Rana', zona: 'Veredal', descripcion: 'Zona panelera y de cultivos mixtos.' }
];

export const VEREDAS_CAPARRAPI: VeredaInfo[] = [
  { nombre: 'Caparrapí Centro', zona: 'Urbana', descripcion: 'Casco urbano, veeduría a contratación de Palacio Municipal ($3.082M) y servicios de salud.' },
  { nombre: 'San Carlos', zona: 'Inspección', descripcion: 'Principal polo comercial, ganadero y de tránsito intermunicipal hacia Guaduas.' },
  { nombre: 'Terán', zona: 'Inspección', descripcion: 'Eje neurálgico de la cuenca panelera y mayor concentración de molienda y trapiches.' },
  { nombre: 'San Pedro', zona: 'Inspección', descripcion: 'Centro de servicios rurales, salud comunitaria, caballada tradicional y fuentes hídricas.' },
  { nombre: 'La Magdalena', zona: 'Inspección', descripcion: 'Corredor estratégico de salida de cosechas de caña, frutas y cuenca fluvial.' },
  { nombre: 'El Dindal', zona: 'Inspección', descripcion: 'Inspección de alta vocación cafetera, panelera y pecuaria con frentes comunales.' },
  { nombre: 'Morro Negro', zona: 'Inspección', descripcion: 'Zona montañosa alta, reserva forestal y producción campesina familiar de café.' },
  { nombre: 'Córdoba', zona: 'Inspección', descripcion: 'Comunidad con arraigo panelero y fuerte liderazgo comunal de mujer rural.' },
  { nombre: 'Puerto Colombia', zona: 'Inspección', descripcion: 'Inspección ribereña sobre el río Magdalena, dragado y jarillones.' },
  { nombre: 'San Ramón', zona: 'Veredal', descripcion: 'Comunidad cafetera y panelera, requiere transitabilidad permanente, polideportivo y agua continua.' },
  { nombre: 'Pitalito', zona: 'Veredal', descripcion: 'Zona rural con escuelas que requieren conectividad Starlink y dotación TIC.' },
  { nombre: 'Cuatro Caminos', zona: 'Veredal', descripcion: 'Corredor vial crítico de conexión hacia San Carlos y salida de ganado.' },
  { nombre: 'Alto del Roble', zona: 'Veredal', descripcion: 'Sector panelero de la cuenca de Terán, vía terciaria sin afirmado.' },
  { nombre: 'Acuaparrapí', zona: 'Veredal', descripcion: 'Sector hídrico y de acueductos comunitarios de San Pedro.' },
  { nombre: 'El Silencio', zona: 'Veredal', descripcion: 'Escuela veredal sin conectividad digital y vías deterioradas en invierno.' },
  { nombre: 'El Dinde', zona: 'Veredal', descripcion: 'Sector agrícola productor de caña panelera y cítricos, vía de acceso crítica.' },
  { nombre: 'Mata de Mora', zona: 'Veredal', descripcion: 'Comunidad campesina, necesidad urgente de placas huellas y acueducto por gravedad.' },
  { nombre: 'La Chorrera', zona: 'Veredal', descripcion: 'Vereda alta, acueducto por gravedad y motobomba con estación solar.' },
  { nombre: 'Boca de Monte', zona: 'Veredal', descripcion: 'Zona de minifundios paneleros y ganadería de pequeña escala.' },
  { nombre: 'Galiche', zona: 'Veredal', descripcion: 'Sector veredal con alta necesidad de mantenimiento de maquinaria amarilla.' },
  { nombre: 'Barranquillas', zona: 'Veredal', descripcion: 'Corredor panelero que conecta con la vía principal de Terán.' },
  { nombre: 'Loma Alta', zona: 'Veredal', descripcion: 'Vereda cafetera con alta pendiente y necesidad de placas huellas modulares.' },
  { nombre: 'Hoyo Caliente', zona: 'Veredal', descripcion: 'Comunidad rural con fuentes termales y acueductos comunitarios veredales.' }
];

export const BASE_PROPOSALS_CAPARRAPI: BaseProposal[] = [
  {
    id: 'prop-cap-1',
    codigo: 'PG-CAP-VIAS-01',
    titulo: 'Plan Maestro de Placas Huellas Comunales 12.5 km (Corredores San Ramón - San Carlos - Pitalito)',
    sector: 'Energía e Infraestructura',
    veredasAfectadas: ['San Ramón', 'San Carlos', 'Pitalito', 'Mata de Mora'],
    diagnostico: 'El 78% de la red vial terciaria de Caparrapí colapsa en época de lluvias, impidiendo la evacuación de cargas de café, panela y cítricos hacia los centros de comercialización.',
    contrastePolitico: 'El gobierno actual contrató en 2024 un Palacio Municipal por $3.082 millones COP y $395 millones en mantenimiento de maquinaria que no llega a las veredas, mientras los campesinos pierden sus cosechas.',
    solucionPragmatica: 'Construcción modular de 12.5 km de placas huellas de concreto reforzado con cunetas y alcantarillas, ejecutadas mediante Convenios Solidarios directos con las JAC de cada vereda y cofinanciación MGA BPIN 2024251480001 (INVIAS Caminos Comunitarios).',
    comprasDirectas: [
      'Cemento Gris Estructural Tipo 1 (Sacos 50 kg)',
      'Agregados Pétreos Triturados y Arena de Río Certificada',
      'Malla Electrosoldada y Acero Corrugado de Refuerzo 1/2"',
      'Formaleta Metálica Modular Reutilizable para Placas Huellas',
      'Tubería de Concreto Reforzado 24" y 36" para Alcantarillas',
      'Geotextil no Tejido de Separación y Drenaje Subrasante'
    ],
    comprasDetalladas: [
      {
        id: 'comp-cap-1',
        producto: 'Cemento Gris Estructural Argos/Holcim (Saco 50kg)',
        cantidad: 4500,
        precioUnitarioCop: 34500,
        precioTotalCop: 155250000,
        linkReferencia: 'https://articulo.mercadolibre.com.co/cemento-gris-argos-50kg',
        tienda: 'Distribuidor Nacional',
        estadoVerificacion: 'verificado',
        esLinkDirecto: true
      },
      {
        id: 'comp-cap-2',
        producto: 'Malla Electrosoldada 6mm 15x15 cm Rollo Industrial',
        cantidad: 180,
        precioUnitarioCop: 420000,
        precioTotalCop: 75600000,
        linkReferencia: 'https://articulo.mercadolibre.com.co/malla-electrosoldada-industrial',
        tienda: 'Distribuidor Nacional',
        estadoVerificacion: 'verificado',
        esLinkDirecto: true
      }
    ],
    manoDeObraDetallada: [
      { id: 'mo-cap-1', rol: 'Ingeniero Residente Veredal (Supervisión JAC)', personas: 1, diasTrabajo: 90, tarifaDiariaCop: 180000, totalLaborCop: 16200000 },
      { id: 'mo-cap-2', rol: 'Maestros de Obra Locales (Veredas San Ramón y Pitalito)', personas: 4, diasTrabajo: 90, tarifaDiariaCop: 110000, totalLaborCop: 39600000 },
      { id: 'mo-cap-3', rol: 'Cuadrilla Comunitaria JAC (Oficiales y Ayudantes de la Vereda)', personas: 16, diasTrabajo: 90, tarifaDiariaCop: 65000, totalLaborCop: 93600000 }
    ],
    presupuestoTotalCop: 4200000000,
    marcoLegal: 'Convenios Solidarios con JAC (Ley 2166 de 2021) y Radicación MGA ante INVIAS - Programa Caminos Comunitarios de la Paz Total.',
    talentoHumano: ['1 Ingeniero Civil Director', '4 Maestros de Obra Veredales', '16 Operarios JAC Locales'],
    cronogramaDias: 120,
    estado: 'Aprobado Plan'
  },
  {
    id: 'prop-cap-2',
    codigo: 'PG-CAP-AGUA-01',
    titulo: 'Optimización y Potabilización de 4 Acueductos Veredales Solares (San Ramón, La Chorrera, El Dinde y Mata de Mora)',
    sector: 'Agua Potable y Saneamiento',
    veredasAfectadas: ['San Ramón', 'La Chorrera', 'El Dinde', 'Mata de Mora'],
    diagnostico: '1.250 familias campesinas consumen agua con coliformes fecales y alta turbiedad en invierno, sufriendo desabastecimiento crónico de hasta 15 días en épocas secas.',
    contrastePolitico: 'El municipio gastó en 2024 más de 236 contratos OPS por $4.477 millones (el 79.2% de la contratación directa), pero ninguna vereda cuenta con acueducto con potabilización real.',
    solucionPragmatica: 'Instalación de 4 sistemas autónomos de bombeo solar fotovoltaico con estaciones solares Lorentz, tanques de almacenamiento de polietileno de 10.000L y plantas de filtración rápida multicapa con dosificación de cloro en línea.',
    comprasDirectas: [
      'Bomba Solar Sumergible de Alta Eficiencia Lorentz 3HP',
      'Arreglo Fotovoltaico 12 Paneles 550W Monocristalinos Tier 1',
      'Inversor Híbrido Controlador MPPT Solar de Bombeo',
      'Tanque Plástico Cilíndrico de 10.000 Litros Grado Alimenticio',
      'Filtros Industriales de Vidrio Filtrante y Carbón Activado',
      'Dosificador de Cloro Proporcional sin Electricidad (Tipo Dosatron)'
    ],
    comprasDetalladas: [
      {
        id: 'comp-agua-1',
        producto: 'Bomba Sumergible Solar Lorentz 3HP con Controlador MPPT',
        cantidad: 4,
        precioUnitarioCop: 16500000,
        precioTotalCop: 66000000,
        linkReferencia: 'https://articulo.mercadolibre.com.co/bomba-solar-lorentz-3hp',
        tienda: 'Distribuidor Nacional',
        estadoVerificacion: 'verificado',
        esLinkDirecto: true
      },
      {
        id: 'comp-agua-2',
        producto: 'Tanque Reserva 10.000 L Polietileno Tricapa',
        cantidad: 8,
        precioUnitarioCop: 4800000,
        precioTotalCop: 38400000,
        linkReferencia: 'https://articulo.mercadolibre.com.co/tanque-10000-litros-polietileno',
        tienda: 'Distribuidor Nacional',
        estadoVerificacion: 'verificado',
        esLinkDirecto: true
      }
    ],
    manoDeObraDetallada: [
      { id: 'mo-agua-1', rol: 'Ingeniero Sanitario / Hidráulico', personas: 1, diasTrabajo: 45, tarifaDiariaCop: 190000, totalLaborCop: 8550000 },
      { id: 'mo-agua-2', rol: 'Técnico Instalador Solar', personas: 2, diasTrabajo: 30, tarifaDiariaCop: 120000, totalLaborCop: 7200000 },
      { id: 'mo-agua-3', rol: 'Fontaneros Veredales JAC', personas: 4, diasTrabajo: 45, tarifaDiariaCop: 70000, totalLaborCop: 12600000 }
    ],
    presupuestoTotalCop: 2650000000,
    marcoLegal: 'MGA BPIN 2024251480002 ante Ministerio de Vivienda - Programa Agua al Campo y Recursos SGR OCAD Regional.',
    talentoHumano: ['1 Ingeniero Sanitario', '2 Técnicos Solares', '4 Fontaneros Veredales'],
    cronogramaDias: 90,
    estado: 'Aprobado Plan'
  },
  {
    id: 'prop-cap-3',
    codigo: 'PG-CAP-TIC-01',
    titulo: 'Conectividad Satelital Starlink y Aulas Digitales en 14 Escuelas Rurales de Caparrapí',
    sector: 'Educación y Conectividad',
    veredasAfectadas: ['Pitalito', 'El Silencio', 'San Ramón', 'San Carlos', 'El Dinde', 'Mata de Mora'],
    diagnostico: 'Más de 480 niños campesinos estudian en escuelas rurales sin acceso a internet ni herramientas informáticas, ampliando la brecha de oportunidades frente al casco urbano.',
    contrastePolitico: 'Se anuncian proyectos departamentales de fibra óptica que llevan años en trámite burocrático y jamás llegan a las veredas lejanas.',
    solucionPragmatica: 'Dotación inmediata de 14 kits satelitales Starlink Residencial/Empresarial con panel solar de respaldo EcoFlow y 14 carritos de 10 tablets educativas para cada sede escolar veredal.',
    comprasDirectas: [
      'Kit Antena Satelital Starlink de Alta Velocidad (Baja Latencia)',
      'Estación Solar de Respaldo EcoFlow RIVER 2 Pro (768Wh)',
      'Panel Solar Plegable 220W Bifacial para Respaldo Continuo',
      'Tablets Educativas de 10 Pulgadas con Contenido Pedagógico Offline',
      'Gabinete de Seguridad Metálico con Candado y Cable Blindado'
    ],
    comprasDetalladas: [
      {
        id: 'comp-tic-1',
        producto: 'Kit Satelital Starlink Estándar + Router Wi-Fi 6',
        cantidad: 14,
        precioUnitarioCop: 1350000,
        precioTotalCop: 18900000,
        linkReferencia: 'https://articulo.mercadolibre.com.co/starlink-kit-colombia',
        tienda: 'MercadoLibre',
        estadoVerificacion: 'verificado',
        esLinkDirecto: true
      },
      {
        id: 'comp-tic-2',
        producto: 'Estación de Energía EcoFlow RIVER 2 Pro (768Wh, 800W)',
        cantidad: 14,
        precioUnitarioCop: 2450000,
        precioTotalCop: 34300000,
        linkReferencia: 'https://articulo.mercadolibre.com.co/ecoflow-river-2-pro',
        tienda: 'MercadoLibre',
        estadoVerificacion: 'verificado',
        esLinkDirecto: true
      }
    ],
    manoDeObraDetallada: [
      { id: 'mo-tic-1', rol: 'Ingeniero de Telecomunicaciones', personas: 1, diasTrabajo: 20, tarifaDiariaCop: 160000, totalLaborCop: 3200000 },
      { id: 'mo-tic-2', rol: 'Técnico Instalador de Antenas y Redes', personas: 2, diasTrabajo: 20, tarifaDiariaCop: 95000, totalLaborCop: 3800000 }
    ],
    presupuestoTotalCop: 380000000,
    marcoLegal: 'MGA BPIN 2024251480003 ante Fondo Único de TIC (MinTIC) y Obras por Impuestos ART.',
    talentoHumano: ['1 Ingeniero de Telecomunicaciones', '2 Técnicos de Redes', 'Docentes de Sede'],
    cronogramaDias: 45,
    estado: 'Aprobado Plan'
  }
];

export interface MunicipioData {
  id: 'guaduas' | 'caparrapi';
  nombre: string;
  departamento: string;
  candidatoNombre: string;
  asistenteNombre: string;
  lema: string;
  saludoInicial: string;
  saludoCopiloto: string;
  colorPrimario: string;
  badgeTag: string;
  avatarEmoji: string;
  avatarImage: string;
  veredas: VeredaInfo[];
  proyectosBase: BaseProposal[];
}

export const MUNICIPIOS_DATA: Record<'guaduas' | 'caparrapi', MunicipioData> = {
  guaduas: {
    id: 'guaduas',
    nombre: 'Guaduas',
    departamento: 'Cundinamarca',
    candidatoNombre: 'Ramitos',
    asistenteNombre: 'Ramitos',
    lema: 'Cero Burocracia, Soluciones Reales e Inmediatas',
    saludoInicial: '🌿 ¡Hola! Soy Ramitos, tu Copiloto Municipal en Guaduas. Aquí las soluciones las construimos juntos en comunidad: tu voz y las propuestas de tu vereda o barrio son la clave para transformar nuestro municipio. Cuéntame, ¿qué problemática o idea tienes hoy para Guaduas?',
    saludoCopiloto: '🌿 ¡Hola! Soy Ramitos, tu Copiloto Municipal de Guaduas. Estoy escuchando: puedes pedirme en lenguaje natural modificar precios, agregar o eliminar ítems, auditar cotizaciones o cambiar de módulo.',
    colorPrimario: '#059669',
    badgeTag: 'Ramitos',
    avatarEmoji: '🌿',
    avatarImage: '/assets/ramitos/ramitos_feliz.png',
    veredas: VEREDAS_GUADUAS,
    proyectosBase: BASE_PROPOSALS_GUADUAS
  },
  caparrapi: {
    id: 'caparrapi',
    nombre: 'Caparrapí',
    departamento: 'Cundinamarca',
    candidatoNombre: 'Equipo Caparrapí',
    asistenteNombre: 'Copiloto Caparrapí',
    lema: 'Inteligencia Territorial, Auditoría Rigurosa y Gestión MGA',
    saludoInicial: '🐎 ¡Hola! Soy tu Copiloto Ciudadano en Caparrapí. Aquí las soluciones reales las construimos juntos en comunidad: tu voz y las propuestas de tu vereda o sector son la clave para transformar nuestro municipio con proyectos MGA y auditoría rigurosa. Cuéntame, ¿qué problemática o idea tienes hoy para Caparrapí?',
    saludoCopiloto: '🐎 ¡Hola! Soy tu Copiloto Ciudadano de Caparrapí. Estoy a tu servicio para estructurar proyectos con rigor MGA DNP, auditar contratos de SECOP II y escuchar a las 11 veredas de nuestro municipio.',
    colorPrimario: '#1e40af',
    badgeTag: 'Caparrapí Inteligente',
    avatarEmoji: '🐎',
    avatarImage: '',
    veredas: VEREDAS_CAPARRAPI,
    proyectosBase: BASE_PROPOSALS_CAPARRAPI
  }
};
