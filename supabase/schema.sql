-- ====================================================================
-- ALCALDE AMIGO CON RAMITOS - SCRIPT SQL COMPLETO PARA SUPABASE
-- Sistema de Co-Creación Ciudadana, CRM y Copiloto de Gobierno
-- ====================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- OBJETIVO 5: RECOPILACIÓN DE DATOS DEL USUARIO Y LEADS (WhatsApp, Nombre, Vereda)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ciudadanos_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT UNIQUE, -- Identificador único de dispositivo en cliente
    ip_address TEXT, -- IP del usuario
    nombre TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    vereda_barrio TEXT DEFAULT 'Guaduas',
    interes_principal TEXT, -- Agua, Educacion, Campo, Parques, Energia, Salud
    consentimiento_whatsapp BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMPTZ DEFAULT NOW()
);

-- ALTER TABLE PARA AGREGAR COLUMNAS SI LA TABLA YA EXISTÍA
ALTER TABLE ciudadanos_leads ADD COLUMN IF NOT EXISTS device_id TEXT UNIQUE;
ALTER TABLE ciudadanos_leads ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- --------------------------------------------------------------------
-- NUEVA TABLA: REGISTRO CONTINUO DE DIÁLOGOS (TEXTUAL VS REINTERPRETACIÓN IA)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interacciones_conversaciones_ramitos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL,
    ip_address TEXT,
    ciudadano_id UUID REFERENCES ciudadanos_leads(id) ON DELETE SET NULL,
    nombre_ciudadano TEXT, -- Nombre del ciudadano (si ya se registró o identificó)
    whatsapp_ciudadano TEXT, -- Número de WhatsApp registrado para respuesta
    mensaje_textual_ciudadano TEXT NOT NULL, -- Lo que dijo la persona textualmente (audio o escrito)
    respuesta_limpia_ramitos TEXT NOT NULL, -- Respuesta hablada por Ramitos
    reinterpretacion_estructurada_ia TEXT, -- Síntesis y análisis de intención estructurado por la IA
    expresion_ramitos TEXT DEFAULT 'feliz',
    sector_detectado TEXT,
    fecha_interaccion TIMESTAMPTZ DEFAULT NOW()
);

-- ALTER TABLE PARA TABLA EXISTENTE
ALTER TABLE interacciones_conversaciones_ramitos ADD COLUMN IF NOT EXISTS nombre_ciudadano TEXT;
ALTER TABLE interacciones_conversaciones_ramitos ADD COLUMN IF NOT EXISTS whatsapp_ciudadano TEXT;

-- ÍNDICES PARA BÚSQUEDA RÁPIDA POR DISPOSITIVO O IP
CREATE INDEX IF NOT EXISTS idx_ramitos_dialogos_device ON interacciones_conversaciones_ramitos(device_id);
CREATE INDEX IF NOT EXISTS idx_ramitos_dialogos_ip ON interacciones_conversaciones_ramitos(ip_address);

-- --------------------------------------------------------------------
-- NUEVA TABLA: CONCLUSIONES Y MEMORIA FRECUENTE DE CONVERSACIONES
-- (Permite a Ramitos recordar el contexto y las conclusiones previas
--  asociadas al dispositivo, IP o WhatsApp del ciudadano)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conclusiones_memoria_ramitos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    whatsapp_ciudadano TEXT,
    nombre_ciudadano TEXT,
    tema_principal TEXT DEFAULT 'Co-creación y Necesidades Cívicas',
    resumen_contexto TEXT NOT NULL,
    ultima_conclusion TEXT NOT NULL,
    estado_propuesta TEXT DEFAULT 'En Construcción',
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- ALTER TABLE PARA TABLA EXISTENTE
ALTER TABLE conclusiones_memoria_ramitos ADD COLUMN IF NOT EXISTS whatsapp_ciudadano TEXT;
ALTER TABLE conclusiones_memoria_ramitos ADD COLUMN IF NOT EXISTS nombre_ciudadano TEXT;

CREATE INDEX IF NOT EXISTS idx_memoria_ramitos_device ON conclusiones_memoria_ramitos(device_id);
CREATE INDEX IF NOT EXISTS idx_memoria_ramitos_ip ON conclusiones_memoria_ramitos(ip_address);
CREATE INDEX IF NOT EXISTS idx_memoria_ramitos_wa ON conclusiones_memoria_ramitos(whatsapp_ciudadano);

ALTER TABLE conclusiones_memoria_ramitos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura y guardado publico de memoria ramitos" ON conclusiones_memoria_ramitos FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- OBJETIVO 1: PROBLEMÁTICAS EN GUADUAS DE MANERA PARTICIPATIVA
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS problematicas_ciudadanas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ciudadano_id UUID REFERENCES ciudadanos_leads(id) ON DELETE SET NULL,
    ciudadano_nombre TEXT NOT NULL,
    vereda_barrio TEXT NOT NULL,
    transcripcion_audio TEXT,
    descripcion_problema TEXT NOT NULL,
    sector TEXT NOT NULL, -- Agua Potable, Conectividad, Campo, Infancia, Energia
    urgencia TEXT DEFAULT 'Alta', -- Critica, Alta, Media
    votos_comunitarios INTEGER DEFAULT 1,
    fecha_reporte TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- OBJETIVO 2: INTENCIÓN Y NECESIDADES ESTRUCTURADAS POR LA IA
-- (Formato corto, concreto y fácil de interpretar para el equipo humano)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS propuestas_estructuradas_ia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problematica_id UUID REFERENCES problematicas_ciudadanas(id) ON DELETE CASCADE,
    ciudadano_id UUID REFERENCES ciudadanos_leads(id) ON DELETE SET NULL,
    intencion_sintetizada TEXT NOT NULL, -- Resumen ejecutorio en 1 o 2 frases
    necesidad_clave TEXT NOT NULL, -- Insumo o requerimiento concreto
    propuesta_redactada_ramitos TEXT NOT NULL, -- Propuesta formal estructurada
    estado_evaluacion TEXT DEFAULT 'Pendiente Revision Humana', -- Pendiente, En Estudio, Aprobado, Respondido
    respuesta_equipo_humano TEXT, -- Respuesta enviada al ciudadano
    fecha_analisis TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- OBJETIVO 3: CONSULTAR PROYECTOS EXISTENTES DEL PLAN DE GOBIERNO
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_gobierno_proyectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo TEXT UNIQUE NOT NULL,
    titulo TEXT NOT NULL,
    sector TEXT NOT NULL,
    veredas_afectadas TEXT[] NOT NULL,
    diagnostico TEXT NOT NULL,
    contraste_politico TEXT NOT NULL,
    solucion_pragmatica TEXT NOT NULL,
    compras_directas TEXT NOT NULL, -- Ej: EcoFlow, Starlink, Filtros Cobre
    presupuesto_total_cop NUMERIC NOT NULL,
    marco_legal TEXT NOT NULL, -- Ley 80, Convenios JAC Ley 2166
    talento_humano TEXT[] NOT NULL,
    cronograma_dias INTEGER DEFAULT 30,
    estado TEXT DEFAULT 'Aprobado Plan' -- En Campaña, Aprobado Plan, En Ejecucion, Completado
);

-- --------------------------------------------------------------------
-- OBJETIVO 4: DIÁLOGO SOBRE PROPUESTAS DE DESARROLLO DEL PLAN DE GOBIERNO
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interacciones_plan_gobierno (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID REFERENCES plan_gobierno_proyectos(id) ON DELETE SET NULL,
    ciudadano_id UUID REFERENCES ciudadanos_leads(id) ON DELETE SET NULL,
    comentario_sugerencia TEXT NOT NULL,
    tipo_interaccion TEXT DEFAULT 'Sugerencia', -- Pregunta, Sugerencia, Respaldo, Critica Constructiva
    fecha_interaccion TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- HISTORIAL CRM Y WHATSAPP GREEN API
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mensajes_green_api (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destinatario_whatsapp TEXT NOT NULL,
    vereda_barrio TEXT NOT NULL,
    mensaje_texto TEXT NOT NULL,
    tipo_envio TEXT DEFAULT 'Respuesta Propuesta', -- Respuesta Propuesta, Masivo Veredal, Avance Proyecto
    estado_envio TEXT DEFAULT 'Enviado Simulador',
    fecha_envio TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- SEGURIDAD RLS (ROW LEVEL SECURITY) Y POLÍTICAS PÚBLICAS
-- --------------------------------------------------------------------
ALTER TABLE ciudadanos_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE problematicas_ciudadanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE propuestas_estructuradas_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_gobierno_proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacciones_plan_gobierno ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacciones_conversaciones_ramitos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir insercion publica de leads" ON ciudadanos_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura publica de leads" ON ciudadanos_leads FOR SELECT USING (true);

CREATE POLICY "Permitir insercion publica de problematicas" ON problematicas_ciudadanas FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura publica de problematicas" ON problematicas_ciudadanas FOR SELECT USING (true);

CREATE POLICY "Permitir insercion publica de propuestas IA" ON propuestas_estructuradas_ia FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura publica de propuestas IA" ON propuestas_estructuradas_ia FOR SELECT USING (true);

CREATE POLICY "Permitir insercion de dialogos ramitos" ON interacciones_conversaciones_ramitos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura de dialogos ramitos" ON interacciones_conversaciones_ramitos FOR SELECT USING (true);

CREATE POLICY "Permitir lectura publica de plan de gobierno" ON plan_gobierno_proyectos FOR SELECT USING (true);

CREATE POLICY "Permitir insercion de interacciones plan" ON interacciones_plan_gobierno FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura de interacciones plan" ON interacciones_plan_gobierno FOR SELECT USING (true);

CREATE POLICY "Permitir insercion de mensajes CRM" ON mensajes_green_api FOR INSERT WITH CHECK (true);

-- --------------------------------------------------------------------
-- DATOS SEMILLA (PROYECTOS ESTRATÉGICOS DE GUADUAS)
-- --------------------------------------------------------------------
INSERT INTO plan_gobierno_proyectos (codigo, titulo, sector, veredas_afectadas, diagnostico, contraste_politico, solucion_pragmatica, compras_directas, presupuesto_total_cop, marco_legal, talento_humano)
VALUES
('PG-PARQUES-01', 'Red de Parques Infantiles Dignos e Iluminados', 'Infancia y Familia', ARRAY['Guaduas Centro', 'Puerto Bogotá', 'La Paz', 'El Hato'], 
 'Ausencia total de parques infantiles en buen estado en el municipio.', 
 'Los políticos tradicionales prometen megaobras inútiles de miles de millones que jamás terminan.', 
 'Instalación rápida de 4 parques modulares de alta durabilidad con iluminación solar autónoma.', 
 'Kits de Parques Modulares + Luminarias solares All-in-One.', 
 48000000, 'Convenios Solidarios con Juntas de Acción Comunal (JAC) - Ley 2166 de 2021.', ARRAY['1 Ingeniero Civil', '2 Lideres JAC', '4 Operarios Locales']),

('PG-AGUA-01', 'Agua Potable Inmediata Piedras Negras (Motobomba + Solar)', 'Agua Potable y Saneamiento', ARRAY['Piedras Negras'], 
 'Vereda apartada de Guaduas sin servicio continuo ni bombeo de agua potable.', 
 'Llevan décadas prometiendo acueductos multimillonarios que se quedan en estudios y burocracia.', 
 'Compra e instalación directa de motobomba de alto flujo alimentada por estación de energía solar EcoFlow.', 
 'Motobomba diésel/eléctrica de 3 HP + Estación de Energía EcoFlow DELTA Max.', 
 18500000, 'Contratación Directa de Menor Cuantía / Compra de Emergencia Comunitaria.', ARRAY['1 Fontanero Veredal', '1 Técnico Electricista', 'Líder Veredal']),

('PG-AGUA-02', 'Filtros y Potabilización por Cobre Puerto Bogotá', 'Agua Potable y Saneamiento', ARRAY['Puerto Bogotá'], 
 'Problemas recurrentes de calidad de agua e turbiedad en la inspección de Puerto Bogotá.', 
 'Años de promesas de plantas gigantescas mientras la población consume agua de mala calidad.', 
 'Sistemas de filtración multicapa en cascada e ionización de cobre de rápida instalación.', 
 'Filtros industriales de cartucho sedimentador + Células de ionización de cobre.', 
 27000000, 'Acuerdo Municipal de Salud Pública y Agua Limpia Ya.', ARRAY['1 Ingeniero Químico/Ambiental', '2 Operarios de Mantenimiento']),

('PG-CON-01', 'Internet Starlink Veredal para Escuelas Rurales', 'Educación y Conectividad', ARRAY['Escuelas Veredales Piedras Negras', 'El Hato', 'San José', 'Yaguara'], 
 'Escuelas rurales aisladas sin conectividad a internet para niños y docentes.', 
 'Contratos estatales de conectividad engorrosos que nunca llegan a las aulas veredales.', 
 'Kits satelitales Starlink Residencial/Empresarial con panel solar de respaldo en cada escuela.', 
 'Kits Starlink Colombia + Inversores y Paneles Solares 400W.', 
 16000000, 'Fondo de Desarrollo Local Educativo y Convenios con rectores veredales.', ARRAY['1 Técnico en Telecomunicaciones', 'Docentes Encargados']),

('PG-CAMPO-01', 'La Ruta Campesina y Red de Mini-Tiendas Afiliadas', 'Desarrollo Agrícola y Campo', ARRAY['Todas las Veredas de Guaduas'], 
 'Dificultad de los campesinos para transportar cosechas al centro urbano a costos justos.', 
 'Burocracia en la UMATA y falta de logística real para la comercialización agrícola.', 
 'Vehículo tipo ruta escolar exclusivo para cosechas + Centro de Acopio y Red de Mini-Tiendas de campesinos afiliados.', 
 'Camión mediano de estacas furgón + Puntos de pesaje digital + Red de estantería.', 
 85000000, 'Asociatividad Campesina y Ley de Compras Públicas Locales (Ley 2046 de 2020).', ARRAY['1 Coordinador Logístico', '2 Conductores', 'Administrador Acopio']);

