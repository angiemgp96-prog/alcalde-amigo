// Lista de veredas, inspecciones y barrios de Guaduas, Cundinamarca

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
