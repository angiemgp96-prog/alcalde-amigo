-- ====================================================================
-- iAlcaldía — Esquema Integral de Base de Datos Multi-Municipio
-- Soporta: Frente Ciudadano (Alcalde Amigo) + Frente Estratégico (SECOP II & MGA)
-- ====================================================================

-- 1. EXTENSIÓN PARA GENERACIÓN DE UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA MAESTRA: MUNICIPIOS (Multi-Tenant)
CREATE TABLE IF NOT EXISTS municipios (
    id TEXT PRIMARY KEY, -- 'caparrapi', 'guaduas', 'puertosalgar', etc.
    nombre TEXT NOT NULL,
    departamento TEXT NOT NULL DEFAULT 'Cundinamarca',
    candidato_nombre TEXT NOT NULL,
    candidato_lema TEXT,
    color_primario TEXT DEFAULT '#059669', -- Emerald por defecto
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semilla inicial de municipios
INSERT INTO municipios (id, nombre, departamento, candidato_nombre, candidato_lema, color_primario)
VALUES 
('guaduas', 'Guaduas', 'Cundinamarca', 'Ramitos', 'Cero Burocracia, Soluciones Reales e Inmediatas', '#059669'),
('caparrapi', 'Caparrapí', 'Cundinamarca', 'Equipo Caparrapí', 'Inteligencia Territorial, Auditoría Rigurosa y Gestión MGA', '#1e40af')
ON CONFLICT (id) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    candidato_nombre = EXCLUDED.candidato_nombre;

-- --------------------------------------------------------------------
-- FRENTE CIUDADANO: LEADS, ESCUCHA DE VOZ Y PROPUESTAS IA
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ciudadanos_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    vereda_barrio TEXT NOT NULL,
    interes_principal TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    estado_notificacion TEXT DEFAULT 'activo'
);

CREATE TABLE IF NOT EXISTS problematicas_ciudadanas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
    contacto_id UUID REFERENCES ciudadanos_leads(id) ON DELETE SET NULL,
    ciudadano_nombre TEXT NOT NULL,
    vereda_barrio TEXT NOT NULL,
    audio_transcripcion TEXT,
    audio_duracion_segundos NUMERIC,
    sector TEXT NOT NULL,
    urgencia TEXT DEFAULT 'Alta', -- Crítica, Alta, Media
    fecha_reporte TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS propuestas_estructuradas_ia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
    problematica_id UUID REFERENCES problematicas_ciudadanas(id) ON DELETE CASCADE,
    problematica_sintetizada TEXT NOT NULL,
    solucion_pragmatica TEXT NOT NULL,
    insumos_clave JSONB, -- Lista de insumos y enlaces
    presupuesto_estimado_cop NUMERIC DEFAULT 0,
    mecanismo_legal_sugerido TEXT, -- Ley 80, Ley 2166 JAC
    votos_apoyo INTEGER DEFAULT 1,
    estado_evaluacion TEXT DEFAULT 'Pendiente', -- Pendiente, En Estudio, Aprobado
    respuesta_equipo_humano TEXT,
    fecha_analisis TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- FRENTE CIUDADANO: PLAN DE GOBIERNO RESOLUTIVO Y CO-CREACIÓN
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_gobierno_proyectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    sector TEXT NOT NULL,
    veredas_afectadas TEXT[] NOT NULL,
    diagnostico TEXT NOT NULL,
    contraste_politico TEXT NOT NULL,
    solucion_pragmatica TEXT NOT NULL,
    compras_directas JSONB NOT NULL,
    presupuesto_total_cop NUMERIC NOT NULL,
    marco_legal TEXT NOT NULL,
    talento_humano TEXT[] NOT NULL,
    cronograma_dias INTEGER DEFAULT 30,
    estado TEXT DEFAULT 'Aprobado Plan', -- En Campaña, Aprobado Plan, En Ejecución, Completado
    CONSTRAINT uk_municipio_codigo UNIQUE(municipio_id, codigo)
);

CREATE TABLE IF NOT EXISTS interacciones_plan_gobierno (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
    proyecto_id UUID REFERENCES plan_gobierno_proyectos(id) ON DELETE CASCADE,
    ciudadano_id UUID REFERENCES ciudadanos_leads(id) ON DELETE SET NULL,
    comentario_sugerencia TEXT NOT NULL,
    tipo_interaccion TEXT DEFAULT 'Sugerencia', -- Pregunta, Sugerencia, Respaldo
    fecha_interaccion TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mensajes_green_api (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
    destinatario_whatsapp TEXT NOT NULL,
    vereda_barrio TEXT NOT NULL,
    mensaje_texto TEXT NOT NULL,
    tipo_envio TEXT DEFAULT 'Respuesta Propuesta',
    estado_envio TEXT DEFAULT 'Enviado GreenAPI',
    fecha_envio TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- FRENTE ESTRATÉGICO: AUDITORÍA SECOP II REAL
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_secop (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
    periodo_alcaldia TEXT NOT NULL, -- Ej: '2024-2027 Andrés Ardila Sánchez'
    alcalde_responsable TEXT NOT NULL,
    numero_proceso TEXT NOT NULL,
    objeto_contrato TEXT NOT NULL,
    contratista_nombre TEXT NOT NULL,
    valor_contrato_cop NUMERIC NOT NULL,
    modalidad_seleccion TEXT NOT NULL, -- Licitación Pública, Contratación Directa, Mínima Cuantía
    alerta_auditoria TEXT, -- Hallazgo o señalamiento técnico
    estado_proceso TEXT DEFAULT 'Celebrado / En Ejecución',
    fecha_firma DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- FRENTE ESTRATÉGICO: BANCO DE PROYECTOS MGA FASE 3 (DNP)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS banco_mga_bpin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
    codigo_bpin TEXT NOT NULL,
    nombre_proyecto TEXT NOT NULL,
    sector_dnp TEXT NOT NULL,
    codigo_producto_dnp TEXT NOT NULL,
    problema_central TEXT NOT NULL,
    objetivo_central TEXT NOT NULL,
    presupuesto_total_cop NUMERIC NOT NULL,
    ventanilla_financiacion TEXT NOT NULL, -- Invías, MinVivienda, SGR OCAD, Obras por Impuestos ART, ADR
    evaluacion_social_vpn NUMERIC, -- Valor Presente Neto Social
    evaluacion_social_tir NUMERIC, -- Tasa Interna de Retorno Social (Tasa de Descuento 12%)
    estado_mga TEXT DEFAULT 'Fase 3 - Listo para radicación',
    CONSTRAINT uk_municipio_bpin UNIQUE(municipio_id, codigo_bpin)
);

-- --------------------------------------------------------------------
-- FRENTE ESTRATÉGICO: HISTORIAL ELECTORAL OFICIAL (REGISTRADURÍA)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_electoral (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
    ano_eleccion INTEGER NOT NULL,
    candidato_nombre TEXT NOT NULL,
    partido_coalicion TEXT NOT NULL,
    votos_obtenidos INTEGER NOT NULL,
    porcentaje_votos NUMERIC(5,2) NOT NULL,
    es_ganador BOOLEAN DEFAULT false,
    censo_electoral INTEGER,
    votacion_total_valida INTEGER
);

-- --------------------------------------------------------------------
-- FRENTE ESTRATÉGICO: FICHAS TÁCTICAS DE GIRA VEREDAL
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fichas_gira_veredal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
    nombre_vereda TEXT NOT NULL,
    lideres_comunales TEXT,
    potencial_electoral_estimado INTEGER,
    votos_historicos_2023 INTEGER,
    necesidades_criticas TEXT[] NOT NULL,
    obras_secop_previas TEXT,
    compromiso_estrategico TEXT,
    estado_visita TEXT DEFAULT 'Pendiente Visita' -- Pendiente Visita, Visitada, Seguimiento
);

-- --------------------------------------------------------------------
-- POLÍTICAS DE SEGURIDAD (RLS) CON AISLAMIENTO POR MUNICIPIO
-- --------------------------------------------------------------------
ALTER TABLE municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciudadanos_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE problematicas_ciudadanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE propuestas_estructuradas_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_gobierno_proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacciones_plan_gobierno ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_green_api ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_secop ENABLE ROW LEVEL SECURITY;
ALTER TABLE banco_mga_bpin ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_electoral ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichas_gira_veredal ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública por municipio
CREATE POLICY "Lectura pública de municipios activos" ON municipios FOR SELECT USING (activo = true);
CREATE POLICY "Lectura pública leads" ON ciudadanos_leads FOR SELECT USING (true);
CREATE POLICY "Inserción pública leads" ON ciudadanos_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura pública problemáticas" ON problematicas_ciudadanas FOR SELECT USING (true);
CREATE POLICY "Inserción pública problemáticas" ON problematicas_ciudadanas FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura pública propuestas IA" ON propuestas_estructuradas_ia FOR SELECT USING (true);
CREATE POLICY "Inserción pública propuestas IA" ON propuestas_estructuradas_ia FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura pública planes gobierno" ON plan_gobierno_proyectos FOR SELECT USING (true);
CREATE POLICY "Lectura pública interacciones" ON interacciones_plan_gobierno FOR SELECT USING (true);
CREATE POLICY "Inserción pública interacciones" ON interacciones_plan_gobierno FOR INSERT WITH CHECK (true);
CREATE POLICY "Inserción CRM WhatsApp" ON mensajes_green_api FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura auditoría SECOP" ON auditoria_secop FOR SELECT USING (true);
CREATE POLICY "Lectura banco MGA" ON banco_mga_bpin FOR SELECT USING (true);
CREATE POLICY "Lectura electoral" ON historial_electoral FOR SELECT USING (true);
CREATE POLICY "Lectura gira veredal" ON fichas_gira_veredal FOR SELECT USING (true);

-- ====================================================================
-- SEMILLA DE DATOS REALES DE CAPARRAPÍ (SECOP II, MGA Y ELECTORAL)
-- ====================================================================

-- 1. SECOP II Caparrapí (Periodo 2024-2027 Andrés Ardila Sánchez)
INSERT INTO auditoria_secop (municipio_id, periodo_alcaldia, alcalde_responsable, numero_proceso, objeto_contrato, contratista_nombre, valor_contrato_cop, modalidad_seleccion, alerta_auditoria, fecha_firma)
VALUES
('caparrapi', '2024-2027 Andrés Ardila Sánchez', 'Andrés Ardila Sánchez', 'LP-001-2024', 'Construcción nueva sede del Palacio Municipal de Caparrapí Fase 1', 'Consorcio Caparrapí Moderno 2024', 3082500000, 'Licitación Pública', 'Concentración presupuestal de $3.082M COP en edificio administrativo mientras vías rurales colapsan', '2024-03-15'),
('caparrapi', '2024-2027 Andrés Ardila Sánchez', 'Andrés Ardila Sánchez', '236 Contratos OPS 2024', 'Contratación de prestación de servicios y apoyo a la gestión administrativa', 'Varios Contratistas OPS', 4477800000, 'Contratación Directa', 'Representa el 79.2% de los contratos directos del año 2024', '2024-02-01'),
('caparrapi', '2024-2027 Andrés Ardila Sánchez', 'Andrés Ardila Sánchez', 'SAMC-008-2024', 'Mantenimiento correctivo y preventivo de maquinaria amarilla municipal', 'Maquinarias y Repuestos del Llano SAS', 395000000, 'Selección Abreviada', 'Maquinaria reportada frecuentemente inoperativa en veredas del sector norte', '2024-05-20'),
('caparrapi', '2024-2027 Andrés Ardila Sánchez', 'Andrés Ardila Sánchez', 'LP-003-2024', 'Adecuación y cubierta del Polideportivo Vereda San Ramón', 'Construcciones e Ingeniería San Ramón', 1181200000, 'Licitación Pública', 'Obra civil con prórrogas consecutivas de entrega', '2024-06-10');

-- 2. Proyectos MGA Fase 3 Caparrapí
INSERT INTO banco_mga_bpin (municipio_id, codigo_bpin, nombre_proyecto, sector_dnp, codigo_producto_dnp, problema_central, objetivo_central, presupuesto_total_cop, ventanilla_financiacion, evaluacion_social_vpn, evaluacion_social_tir, estado_mga)
VALUES
('caparrapi', '2024251480001', 'Mejoramiento de 12.5 km de corredores terciarios con placas huellas en Caparrapí', 'Transporte', '2101004 - Vías terciarias construidas y mejoradas', 'Deterioro severo del 78% de vías terciarias que impiden sacar cosechas de café y caña', 'Garantizar transitabilidad permanente en los anillos viales veredales', 4200000000, 'INVIAS Caminos Comunitarios de la Paz Total', 1845000000, 18.4, 'Fase 3 - Listo para radicación'),
('caparrapi', '2024251480002', 'Construcción y optimización de 4 acueductos veredales por gravedad y energía solar', 'Vivienda, Ciudad y Territorio', '4001001 - Sistemas de acueducto rural construidos', 'Inexistencia de agua tratada y desabastecimiento en épocas de estiaje', 'Suministrar agua continua y potable a 1.250 familias campesinas', 2650000000, 'Ministerio de Vivienda - Programa Agua al Campo', 920000000, 16.2, 'Fase 3 - Listo para radicación'),
('caparrapi', '2024251480003', 'Dotación tecnológica e internet satelital Starlink en 14 escuelas rurales de Caparrapí', 'Educación', '2201015 - Ambientes de aprendizaje dotados con TIC', 'Brecha digital y abandono tecnológico de sedes educativas rurales', 'Conectar el 100% de las sedes educativas rurales a internet de alta velocidad', 380000000, 'Fondo Único de TIC / Obras por Impuestos ART', 410000000, 22.8, 'Fase 3 - Listo para radicación');

-- 3. Historial Electoral Registraduría Caparrapí
INSERT INTO historial_electoral (municipio_id, ano_eleccion, candidato_nombre, partido_coalicion, votos_obtenidos, porcentaje_votos, es_ganador, censo_electoral, votacion_total_valida)
VALUES
('caparrapi', 2023, 'Andrés Ardila Sánchez', 'Partido Conservador / Coalición de Gobierno', 3542, 42.15, true, 11450, 8403),
('caparrapi', 2023, 'Isidro Anzola', 'Coalición Opositora / Movimiento Cívico', 3212, 38.22, false, 11450, 8403),
('caparrapi', 2023, 'Otros / Votos Blanco', 'Otros Partidos', 1649, 19.63, false, 11450, 8403),
('caparrapi', 2019, 'Gonzalo Ramírez Gaitán', 'Coalición por Caparrapí', 3890, 46.50, true, 10890, 8365),
('caparrapi', 2015, 'José Joaquín Sánchez Chávez', 'Partido Liberal / Unidad Nacional', 3620, 45.20, true, 10250, 8008);
