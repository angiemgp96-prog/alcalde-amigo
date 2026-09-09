import { BaseProposal } from '../types';

export const BASE_PROPOSALS: BaseProposal[] = [
  {
    id: 'prop-2',
    codigo: 'PG-AGUA-01',
    titulo: 'Agua Potable Inmediata Piedras Negras (Bombeo Solar Off-Grid + Filtración)',
    sector: 'Agua Potable y Saneamiento',
    veredasAfectadas: ['Piedras Negras'],
    diagnostico: 'Las familias de Piedras Negras dependen de acarreos manuales o aljibes contaminados con turbiedad y materia orgánica debido a la ausencia de red eléctrica estable para bombear hacia los tanques comunales elevados.',
    contrastePolitico: 'La administración burocrática tradicional promete una "ampliación de red de media tensión y megatanque de distribución", contratando estudios topográficos e hidrológicos de 12 meses por más de $180 millones COP. Tras 4 años, el proyecto queda congelado y la comunidad sigue sin agua potable.',
    solucionPragmatica: 'Implementación de microestación de impulsión fotovoltaica autónoma y tratamiento de sedimentos: Estación de energía EcoFlow DELTA Max (2016Wh, 2400W), 2 paneles solares 450W, motobomba 1.5HP con arrancador suave, tanque de 5.000L y batería de prefiltración Big Blue de 20 pulgadas.',
    comprasDirectas: [
      'Estación de Energía Portátil EcoFlow DELTA Max (2016Wh, 2400W)',
      'Panel Solar Monocristalino Rígido 450W Tier 1 (Jinko/JA Solar)',
      'Estructura Coplanar Aluminio + Cableado Solar 6mm²',
      'Bomba Centrífuga / Sumergible 1.5 HP Barnes/Pedrollo Alta Eficiencia',
      'Tanque Plástico de Almacenamiento 5.000 Litros Polietileno Virged',
      'Portafiltros Big Blue 20" Doble Etapa + Cartuchos (Sedimento + Carbón Block)',
      'Tubería RDE 21 PVC Presión 1", Válvulas y Cheques',
      'Gabinete Metálico NEMA 4X Exterior para Intemperie'
    ],
    comprasDetalladas: [
      {
        id: 'comp-1',
        producto: 'Estación de Energía Portátil EcoFlow DELTA Max (2016Wh, 2400W)',
        cantidad: 1,
        precioUnitarioCop: 7890000,
        precioTotalCop: 7890000,
        linkReferencia: 'https://articulo.mercadolibre.com.co/MCO-ecoflow-delta-max-2016wh',
        tienda: 'MercadoLibre',
        estadoVerificacion: 'verificado',
        esLinkDirecto: true,
        opcionesComparativas: [
          { id: 'opt-1a', proveedor: 'Tienda Oficial EcoFlow ML', tienda: 'MercadoLibre', precioUnitarioCop: 7890000, link: 'https://articulo.mercadolibre.com.co/MCO-ecoflow-delta-max-2016wh', verificado: true, nota: 'Envío Gratis Express a Guaduas' },
          { id: 'opt-1b', proveedor: 'Distribuidor Solar Bogotá', tienda: 'Distribuidor Nacional', precioUnitarioCop: 7650000, link: '', verificado: false, nota: 'Requiere transporte por cuenta de la JAC' },
          { id: 'opt-1c', proveedor: 'Importador Directo Temu', tienda: 'Temu', precioUnitarioCop: 7400000, link: '', verificado: false, nota: 'Demora de 15 días en aduana' }
        ]
      },
      {
        id: 'comp-2',
        producto: 'Panel Solar Monocristalino Rígido 450W Tier 1 (Jinko/JA Solar)',
        cantidad: 2,
        precioUnitarioCop: 620000,
        precioTotalCop: 1240000,
        linkReferencia: 'https://articulo.mercadolibre.com.co/MCO-panel-solar-450w-jinko',
        tienda: 'MercadoLibre',
        estadoVerificacion: 'verificado',
        esLinkDirecto: true,
        opcionesComparativas: [
          { id: 'opt-2a', proveedor: 'Jinko Solar Store ML', tienda: 'MercadoLibre', precioUnitarioCop: 620000, link: 'https://articulo.mercadolibre.com.co/MCO-panel-solar-450w-jinko', verificado: true, nota: 'Garantía 10 años' },
          { id: 'opt-2b', proveedor: 'Ferretería El Progreso (Guaduas)', tienda: 'Ferretería Local', precioUnitarioCop: 640000, link: '', verificado: true, nota: 'Entrega inmediata en la vereda' }
        ]
      },
      {
        id: 'comp-3',
        producto: 'Estructura Coplanar / Soporte Aluminio + Cable Solar 6mm²',
        cantidad: 1,
        precioUnitarioCop: 380000,
        precioTotalCop: 380000,
        linkReferencia: '',
        tienda: 'Ferretería Local',
        estadoVerificacion: 'pendiente_link',
        esLinkDirecto: false,
        opcionesComparativas: [
          { id: 'opt-3a', proveedor: 'Ferretería Central Guaduas', tienda: 'Ferretería Local', precioUnitarioCop: 380000, link: '', verificado: false, nota: 'Precio estimado por verificar en mostrador' }
        ]
      },
      {
        id: 'comp-4',
        producto: 'Bomba Centrífuga / Sumergible 1.5 HP Barnes/Pedrollo Alta Eficiencia',
        cantidad: 1,
        precioUnitarioCop: 1450000,
        precioTotalCop: 1450000,
        linkReferencia: 'https://articulo.mercadolibre.com.co/MCO-bomba-barnes-15hp',
        tienda: 'MercadoLibre',
        estadoVerificacion: 'verificado',
        esLinkDirecto: true
      },
      {
        id: 'comp-5',
        producto: 'Tanque Plástico de Almacenamiento 5.000L Polietileno Virged (Aqualimp)',
        cantidad: 1,
        precioUnitarioCop: 2850000,
        precioTotalCop: 2850000,
        linkReferencia: 'https://articulo.mercadolibre.com.co/MCO-tanque-aqualimp-5000l',
        tienda: 'MercadoLibre',
        estadoVerificacion: 'verificado',
        esLinkDirecto: true
      },
      {
        id: 'comp-6',
        producto: 'Portafiltros Big Blue 20" Doble Etapa + Cartuchos (Sedimento 5µm + Carbón Block)',
        cantidad: 1,
        precioUnitarioCop: 680000,
        precioTotalCop: 680000,
        linkReferencia: '',
        tienda: 'MercadoLibre',
        estadoVerificacion: 'pendiente_link',
        esLinkDirecto: false
      },
      {
        id: 'comp-7',
        producto: 'Tubería RDE 21 PVC Presión 1", Válvulas de Retención Cheque, Codos y Accesorios',
        cantidad: 1,
        precioUnitarioCop: 920000,
        precioTotalCop: 920000,
        linkReferencia: '',
        tienda: 'Ferretería Local',
        estadoVerificacion: 'pendiente_link',
        esLinkDirecto: false
      },
      {
        id: 'comp-8',
        producto: 'Gabinete Metálico NEMA 4X Exterior con Ventilación Forzada para EcoFlow',
        cantidad: 1,
        precioUnitarioCop: 540000,
        precioTotalCop: 540000,
        linkReferencia: 'https://articulo.mercadolibre.com.co/MCO-gabinete-nema4x-exterior',
        tienda: 'MercadoLibre',
        estadoVerificacion: 'verificado',
        esLinkDirecto: true
      }
    ],
    manoDeObraDetallada: [
      {
        id: 'mob-1',
        rol: 'Técnico Electricista / Solar Certificado (Guaduas)',
        personas: 1,
        diasTrabajo: 3,
        tarifaDiariaCop: 160000,
        totalLaborCop: 480000
      },
      {
        id: 'mob-2',
        rol: 'Fontanero / Plomero Especialista en Redes Hidráulicas',
        personas: 1,
        diasTrabajo: 4,
        tarifaDiariaCop: 130000,
        totalLaborCop: 520000
      },
      {
        id: 'mob-3',
        rol: 'Ayudantes Locales / Operarios de la JAC Piedras Negras',
        personas: 2,
        diasTrabajo: 4,
        tarifaDiariaCop: 80000,
        totalLaborCop: 640000
      },
      {
        id: 'mob-4',
        rol: 'Ingeniero Residente / Director de Montaje (Acompañamiento)',
        personas: 1,
        diasTrabajo: 2,
        tarifaDiariaCop: 250000,
        totalLaborCop: 500000
      }
    ],
    porcentajeFlete: 5,
    presupuestoTotalCop: 18994500,
    marcoLegal: 'Convenio Solidario con la Junta de Acción Comunal (JAC) de Piedras Negras conforme al Art. 95 de la Ley 2166 de 2021 y Decreto 142 de 2023 (Contratación Directa Comunitaria hasta menor cuantía).',
    mecanismoLegalEspecifico: 'Ley 2166 de 2021 (Art. 95) & Decreto 142 de 2023 - Convenios Solidarios de Ejecución Comunal Directa.',
    pasosOperativosFastTrack: [
      'Día 1 - Expedición de CDP express ($19M COP) por resolución de urgencia de salubridad hídrica.',
      'Día 2 - Firma de Convenio Solidario con la JAC de Piedras Negras y giro del 80% del anticipo.',
      'Día 3 - Despacho express de equipos EcoFlow, motobomba y tanques a Guaduas.',
      'Día 4 a 8 - Anclaje de paneles solares, conexión del banco de filtros, montaje de bomba y entrega a la comunidad.'
    ],
    votosVistoBueno: 42,
    vistoBuenoAprobado: true,
    comentariosComunidad: [
      {
        id: 'com-1',
        autor: 'Don Gonzalo Morales',
        rol: 'Presidente JAC',
        texto: 'Validado con la comunidad de Piedras Negras. Ponemos la camioneta de la junta para subir el tanque de 5.000L desde el casco urbano.',
        seccion: 'general',
        fecha: 'Hace 2 horas'
      },
      {
        id: 'com-2',
        autor: 'Lilia Martínez',
        rol: 'Vecino Beneficiario',
        texto: 'La bomba de 1.5HP alcanza perfecto para subir el agua hasta la loma alta. ¡Excelente que los pagos de mano de obra queden en la vereda!',
        seccion: 'mano_obra',
        fecha: 'Hace 45 min'
      }
    ],
    talentoHumano: ['1 Técnico Solar', '1 Fontanero', '2 Operarios JAC Piedras Negras', '1 Ingeniero Director'],
    cronogramaDias: 8,
    estado: 'En Co-creación'
  },
  {
    id: 'prop-4',
    codigo: 'PG-CON-01',
    titulo: 'Internet Satelital Starlink Veredal para Escuelas Rurales',
    sector: 'Educación y Conectividad',
    veredasAfectadas: ['Piedras Negras', 'El Hato', 'San José', 'Carbonera'],
    diagnostico: 'Las escuelas rurales de Guaduas están totalmente incomunicadas. Los niños no tienen acceso a herramientas digitales para estudiar.',
    contrastePolitico: 'Contratos estatales de conectividad engorrosos de $400M que instalan antenas obsoletas que nunca funcionan o quedan sin señal tras 3 meses.',
    solucionPragmatica: 'Instalación de antenas Starlink de alta velocidad con respaldo de baterías solares y micro-routers WiFi Mesh en 4 escuelas veredales.',
    comprasDirectas: [
      'Kit Satelital Starlink Alta Velocidad Colombia (4 unidades)',
      'Inversores solares 1000W + Paneles solares de respaldo',
      'Routers Mesh WiFi Gigabit para cobertura en aula y patio'
    ],
    comprasDetalladas: [
      {
        id: 'comp-st1',
        producto: 'Kit Satelital Starlink Residencial / Empresarial Colombia',
        cantidad: 4,
        precioUnitarioCop: 2200000,
        precioTotalCop: 8800000,
        linkReferencia: 'https://listado.mercadolibre.com.co/starlink-kit-satelital',
        tienda: 'MercadoLibre'
      },
      {
        id: 'comp-st2',
        producto: 'Generador Solar Portátil Backup 1000W con Panel Solar 200W',
        cantidad: 4,
        precioUnitarioCop: 1400000,
        precioTotalCop: 5600000,
        linkReferencia: 'https://listado.mercadolibre.com.co/generador-solar-portatil',
        tienda: 'MercadoLibre'
      },
      {
        id: 'comp-st3',
        producto: 'Sistema WiFi Mesh Dual Band TP-Link Deco X20 (Pack 3 nod)',
        cantidad: 2,
        precioUnitarioCop: 800000,
        precioTotalCop: 1600000,
        linkReferencia: 'https://listado.mercadolibre.com.co/tp-link-deco-mesh',
        tienda: 'MercadoLibre'
      }
    ],
    manoDeObraDetallada: [
      {
        id: 'mob-st1',
        rol: 'Técnico de Telecomunicaciones e Redes',
        personas: 1,
        diasTrabajo: 4,
        tarifaDiariaCop: 180000,
        totalLaborCop: 720000
      },
      {
        id: 'mob-st2',
        rol: 'Auxiliar de Montaje Veredal',
        personas: 2,
        diasTrabajo: 4,
        tarifaDiariaCop: 80000,
        totalLaborCop: 640000
      }
    ],
    porcentajeFlete: 4,
    presupuestoTotalCop: 17960000,
    marcoLegal: 'Fondo de Desarrollo Educativo Municipal y Compras Directas Tecnológicas de Menor Cuantía.',
    mecanismoLegalEspecifico: 'Compra Directa de Menor Cuantía + Convenio con la Asociación de Padres de Familia de la Escuela.',
    pasosOperativosFastTrack: [
      'Día 1 - Orden de compra directa de 4 Kits Starlink en Tienda Oficial / MercadoLibre.',
      'Día 2 - Recepción y configuración previa de red Mesh.',
      'Día 3 a 6 - Instalación física en tejado de las 4 escuelas veredales y pruebas de velocidad (200 Mbps+).',
      'Día 7 - Entrega de clave WiFi a profesores y niños.'
    ],
    votosVistoBueno: 38,
    vistoBuenoAprobado: true,
    comentariosComunidad: [],
    talentoHumano: ['1 Técnico Telecom', '2 Auxiliares Veredales'],
    cronogramaDias: 7,
    estado: 'En Co-creación'
  },
  {
    id: 'prop-1',
    codigo: 'PG-PARQUES-01',
    titulo: 'Red de Parques Infantiles Dignos e Iluminados',
    sector: 'Infancia y Familia',
    veredasAfectadas: ['Guaduas Centro', 'Puerto Bogotá', 'La Paz', 'El Hato'],
    diagnostico: 'Guaduas no cuenta con un solo parque infantil en buen estado. Los niños no tienen dónde jugar de manera segura e iluminada.',
    contrastePolitico: 'Los políticos tradicionales prometen megaobras inútiles de miles de millones que nunca terminan, pero son incapaces de construir un parque infantil para los niños.',
    solucionPragmatica: 'Instalación rápida de 4 parques modulares comunitarios con suelo amortiguador de alta resistencia y paneles solares con luces LED automáticas.',
    comprasDirectas: [
      'Sets de Parques Modulares Certificados (MercadoLibre / Distribuidor Nacional)',
      'Luminarias Solares All-in-One 200W con sensor de movimiento',
      'Piso de caucho reciclado de alto impacto'
    ],
    comprasDetalladas: [
      {
        id: 'comp-p1',
        producto: 'Set Parque Infantil Modular Exterior Metal/Plástico Recreativo',
        cantidad: 4,
        precioUnitarioCop: 9500000,
        precioTotalCop: 38000000,
        linkReferencia: 'https://listado.mercadolibre.com.co/parque-infantil-exterior',
        tienda: 'MercadoLibre'
      },
      {
        id: 'comp-p2',
        producto: 'Luminaria Solar Suburbana 300W LED con Control y Sensor',
        cantidad: 12,
        precioUnitarioCop: 220000,
        precioTotalCop: 2640000,
        linkReferencia: 'https://listado.mercadolibre.com.co/lampara-solar-300w',
        tienda: 'MercadoLibre'
      },
      {
        id: 'comp-p3',
        producto: 'Baldosas Caucho Reciclado Amortiguante 50x50 cm 25mm',
        cantidad: 160,
        precioUnitarioCop: 28000,
        precioTotalCop: 4480000,
        linkReferencia: 'https://listado.mercadolibre.com.co/piso-caucho-reciclado',
        tienda: 'MercadoLibre'
      }
    ],
    manoDeObraDetallada: [
      {
        id: 'mob-p1',
        rol: 'Maestro de Obra Ensamblador',
        personas: 1,
        diasTrabajo: 10,
        tarifaDiariaCop: 150000,
        totalLaborCop: 1500000
      },
      {
        id: 'mob-p2',
        rol: 'Ayudantes de Montaje JAC Local',
        personas: 3,
        diasTrabajo: 10,
        tarifaDiariaCop: 80000,
        totalLaborCop: 2400000
      }
    ],
    porcentajeFlete: 3,
    presupuestoTotalCop: 49020000,
    marcoLegal: 'Convenios Solidarios con Juntas de Acción Comunal (JAC) conforme a la Ley 2166 de 2021.',
    mecanismoLegalEspecifico: 'Ley 2166 de 2021 Art. 95 (Convenios Solidarios Comunitarios).',
    pasosOperativosFastTrack: [
      'Día 1 a 3 - Contratación del Convenio Solidario con las JAC locales.',
      'Día 4 a 10 - Despacho e inspección del kit de parques.',
      'Día 11 a 25 - Montaje de bases de concreto, nivelación de piso de caucho e iluminación solar.'
    ],
    votosVistoBueno: 29,
    vistoBuenoAprobado: false,
    comentariosComunidad: [],
    talentoHumano: ['1 Maestro Ensamblador', '3 Ayudantes JAC'],
    cronogramaDias: 25,
    estado: 'En Campaña'
  },
  {
    id: 'prop-3',
    codigo: 'PG-AGUA-02',
    titulo: 'Filtros y Potabilización por Cobre para Puerto Bogotá',
    sector: 'Agua Potable y Saneamiento',
    veredasAfectadas: ['Puerto Bogotá'],
    diagnostico: 'En la inspección de Puerto Bogotá el suministro de agua presenta alta turbiedad y sospechas de contaminación por fuentes hídricas cercanas.',
    contrastePolitico: 'Promesas electorales de plantas potabilizadoras gigantescas que duran 4 años en licitaciones mientras las familias consumen agua de mala calidad.',
    solucionPragmatica: 'Instalación de batería de filtros multicapa en cascada e ionizadores de cobre bactericidas en puntos estratégicos de distribución comunitaria.',
    comprasDirectas: [
      'Filtros Industriales de Cartucho Sedimentador + Carbón Activado',
      'Células de Ionización de Cobre y Plata Bactericida',
      'Medidores de Calidad de Agua Digitales (TDS y pH)'
    ],
    presupuestoTotalCop: 27000000,
    marcoLegal: 'Acuerdo Municipal de Respuesta Inmediata a la Salud Hídrica.',
    talentoHumano: ['1 Ingeniero Químico / Sanitariasta', '2 Operarios de Mantenimiento Comunitario'],
    cronogramaDias: 15,
    estado: 'En Campaña'
  },
  {
    id: 'prop-5',
    codigo: 'PG-CAMPO-01',
    titulo: 'La Ruta Campesina y Red de Mini-Tiendas Afiliadas',
    sector: 'Campo y Desarrollo Agrícola',
    veredasAfectadas: ['Todas las Veredas de Guaduas', 'El Hato', 'Yaguara', 'San José'],
    diagnostico: 'Los campesinos pierden sus cosechas o las venden a precios de miseria a intermediarios por no tener cómo transportarlas al mercado.',
    contrastePolitico: 'Entidades burocráticas que hacen talleres y capacitaciones de papel, pero no resuelven la logística real de transporte de cosechas.',
    solucionPragmatica: 'Ruta logística semanal (similar a ruta escolar) exclusiva para transporte de alimentos + Centro de Acopio municipal y Red de Mini-Tiendas de campesinos afiliados.',
    comprasDirectas: [
      'Vehículo mediano de carga furgón de estacas',
      'Básculas digitales pesadoras comerciales',
      'Mobiliario y estantería modular para las Mini-TiendasAfiliadas'
    ],
    presupuestoTotalCop: 85000000,
    marcoLegal: 'Ley 2046 de 2020 de Compras Públicas Locales y Asociatividad Campesina.',
    talentoHumano: ['1 Coordinador Logístico', '2 Conductores', '1 Administrador del Centro de Acopio'],
    cronogramaDias: 30,
    estado: 'En Campaña'
  }
];

