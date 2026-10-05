-- ====================================================================
-- iAlcaldía — Esquema Unificado Completo con Backup Restaurado + Nuevas Capacidades
-- Generado para el nuevo proyecto de Supabase
-- Incluye: Datos históricos de Guaduas (Ramitos) + Inteligencia Caparrapí (SECOP II & MGA)
-- ====================================================================

-- 1. EXTENSIÓN PARA GENERACIÓN DE UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA MAESTRA DE MUNICIPIOS
CREATE TABLE IF NOT EXISTS municipios (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    departamento TEXT NOT NULL DEFAULT 'Cundinamarca',
    candidato_nombre TEXT NOT NULL,
    candidato_lema TEXT,
    color_primario TEXT DEFAULT '#059669',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO municipios (id, nombre, departamento, candidato_nombre, candidato_lema, color_primario)
VALUES 
('guaduas', 'Guaduas', 'Cundinamarca', 'Ramitos', 'Cero Burocracia, Soluciones Reales e Inmediatas', '#059669'),
('caparrapi', 'Caparrapí', 'Cundinamarca', 'Equipo Caparrapí', 'Inteligencia Territorial, Auditoría Rigurosa y Gestión MGA', '#1e40af')
ON CONFLICT (id) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    candidato_nombre = EXCLUDED.candidato_nombre;

-- --------------------------------------------------------------------
-- FRENTE CIUDADANO (ALCALDE AMIGO): TABLAS ORIGINALES + SOPORTE MULTI-MUNICIPIO
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ciudadanos_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL DEFAULT 'guaduas' REFERENCES municipios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    vereda_barrio TEXT NOT NULL,
    interes_principal TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    estado_notificacion TEXT DEFAULT 'activo'
);

CREATE TABLE IF NOT EXISTS problematicas_ciudadanas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL DEFAULT 'guaduas' REFERENCES municipios(id) ON DELETE CASCADE,
    ciudadano_id UUID REFERENCES ciudadanos_leads(id) ON DELETE SET NULL,
    ciudadano_nombre TEXT NOT NULL,
    vereda_barrio TEXT NOT NULL,
    transcripcion_audio TEXT,
    descripcion_problema TEXT,
    sector TEXT NOT NULL,
    urgencia TEXT DEFAULT 'Alta',
    votos_comunitarios INTEGER DEFAULT 1,
    fecha_reporte TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS propuestas_estructuradas_ia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL DEFAULT 'guaduas' REFERENCES municipios(id) ON DELETE CASCADE,
    problematica_id UUID REFERENCES problematicas_ciudadanas(id) ON DELETE CASCADE,
    ciudadano_id UUID REFERENCES ciudadanos_leads(id) ON DELETE SET NULL,
    intencion_sintetizada TEXT NOT NULL,
    necesidad_clave TEXT NOT NULL,
    propuesta_redactada_ramitos TEXT NOT NULL,
    estado_evaluacion TEXT DEFAULT 'Pendiente Revision Humana',
    respuesta_equipo_humano TEXT,
    fecha_analisis TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_gobierno_proyectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL DEFAULT 'guaduas' REFERENCES municipios(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    sector TEXT NOT NULL,
    veredas_afectadas TEXT[] NOT NULL,
    diagnostico TEXT NOT NULL,
    contraste_politico TEXT NOT NULL,
    solucion_pragmatica TEXT NOT NULL,
    compras_directas TEXT NOT NULL,
    presupuesto_total_cop NUMERIC NOT NULL,
    marco_legal TEXT NOT NULL,
    talento_humano TEXT[] NOT NULL,
    cronograma_dias INTEGER DEFAULT 30,
    estado TEXT DEFAULT 'Aprobado Plan',
    CONSTRAINT uk_municipio_codigo UNIQUE(municipio_id, codigo)
);

CREATE TABLE IF NOT EXISTS interacciones_conversaciones_ramitos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL DEFAULT 'guaduas' REFERENCES municipios(id) ON DELETE CASCADE,
    device_id TEXT,
    ip_address TEXT,
    ciudadano_id UUID REFERENCES ciudadanos_leads(id) ON DELETE SET NULL,
    mensaje_textual_ciudadano TEXT NOT NULL,
    respuesta_limpia_ramitos TEXT NOT NULL,
    reinterpretacion_estructurada_ia TEXT,
    expresion_ramitos TEXT,
    sector_detectado TEXT,
    fecha_interaccion TIMESTAMPTZ DEFAULT NOW(),
    nombre_ciudadano TEXT,
    whatsapp_ciudadano TEXT
);

CREATE TABLE IF NOT EXISTS conclusiones_memoria_ramitos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL DEFAULT 'guaduas' REFERENCES municipios(id) ON DELETE CASCADE,
    device_id TEXT,
    ip_address TEXT,
    whatsapp_ciudadano TEXT,
    nombre_ciudadano TEXT,
    tema_principal TEXT,
    resumen_contexto TEXT,
    ultima_conclusion TEXT,
    estado_propuesta TEXT DEFAULT 'En Diálogo',
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interacciones_plan_gobierno (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL DEFAULT 'guaduas' REFERENCES municipios(id) ON DELETE CASCADE,
    proyecto_id UUID REFERENCES plan_gobierno_proyectos(id) ON DELETE CASCADE,
    ciudadano_id UUID REFERENCES ciudadanos_leads(id) ON DELETE SET NULL,
    comentario_sugerencia TEXT NOT NULL,
    tipo_interaccion TEXT DEFAULT 'Sugerencia',
    fecha_interaccion TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mensajes_green_api (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipio_id TEXT NOT NULL DEFAULT 'guaduas' REFERENCES municipios(id) ON DELETE CASCADE,
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
    periodo_alcaldia TEXT NOT NULL,
    alcalde_responsable TEXT NOT NULL,
    numero_proceso TEXT NOT NULL,
    objeto_contrato TEXT NOT NULL,
    contratista_nombre TEXT NOT NULL,
    valor_contrato_cop NUMERIC NOT NULL,
    modalidad_seleccion TEXT NOT NULL,
    alerta_auditoria TEXT,
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
    ventanilla_financiacion TEXT NOT NULL,
    evaluacion_social_vpn NUMERIC,
    evaluacion_social_tir NUMERIC,
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
    estado_visita TEXT DEFAULT 'Pendiente Visita'
);

-- --------------------------------------------------------------------
-- POLÍTICAS RLS (ACCESO PÚBLICO SEGURO)
-- --------------------------------------------------------------------
ALTER TABLE municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciudadanos_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE problematicas_ciudadanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE propuestas_estructuradas_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_gobierno_proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacciones_conversaciones_ramitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conclusiones_memoria_ramitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacciones_plan_gobierno ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_green_api ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_secop ENABLE ROW LEVEL SECURITY;
ALTER TABLE banco_mga_bpin ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_electoral ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichas_gira_veredal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de municipios activos" ON municipios FOR SELECT USING (activo = true);
CREATE POLICY "Lectura pública leads" ON ciudadanos_leads FOR SELECT USING (true);
CREATE POLICY "Inserción pública leads" ON ciudadanos_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura pública problemáticas" ON problematicas_ciudadanas FOR SELECT USING (true);
CREATE POLICY "Inserción pública problemáticas" ON problematicas_ciudadanas FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura pública propuestas IA" ON propuestas_estructuradas_ia FOR SELECT USING (true);
CREATE POLICY "Inserción pública propuestas IA" ON propuestas_estructuradas_ia FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura pública planes gobierno" ON plan_gobierno_proyectos FOR SELECT USING (true);
CREATE POLICY "Lectura pública conversaciones" ON interacciones_conversaciones_ramitos FOR SELECT USING (true);
CREATE POLICY "Inserción pública conversaciones" ON interacciones_conversaciones_ramitos FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura pública memoria" ON conclusiones_memoria_ramitos FOR SELECT USING (true);
CREATE POLICY "Inserción pública memoria" ON conclusiones_memoria_ramitos FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura pública interacciones" ON interacciones_plan_gobierno FOR SELECT USING (true);
CREATE POLICY "Inserción pública interacciones" ON interacciones_plan_gobierno FOR INSERT WITH CHECK (true);
CREATE POLICY "Inserción CRM WhatsApp" ON mensajes_green_api FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura auditoría SECOP" ON auditoria_secop FOR SELECT USING (true);
CREATE POLICY "Inserción auditoría SECOP" ON auditoria_secop FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura banco MGA" ON banco_mga_bpin FOR SELECT USING (true);
CREATE POLICY "Inserción banco MGA" ON banco_mga_bpin FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura electoral" ON historial_electoral FOR SELECT USING (true);
CREATE POLICY "Lectura gira veredal" ON fichas_gira_veredal FOR SELECT USING (true);
CREATE POLICY "Inserción gira veredal" ON fichas_gira_veredal FOR INSERT WITH CHECK (true);

-- ====================================================================
-- RESTAURACIÓN EXACTA DE DATOS DESDE TU BACKUP DE GUADUAS
-- ====================================================================

-- 1. Proyectos originales de Plan de Gobierno (Guaduas)
INSERT INTO plan_gobierno_proyectos (id, municipio_id, codigo, titulo, sector, veredas_afectadas, diagnostico, contraste_politico, solucion_pragmatica, compras_directas, presupuesto_total_cop, marco_legal, talento_humano, cronograma_dias, estado) VALUES ('98543548-8eab-4087-8481-349b373df10f', 'guaduas', 'PG-PARQUES-01', 'Red de Parques Infantiles Dignos e Iluminados', 'Infancia y Familia', '{"Guaduas Centro","Puerto Bogotá","La Paz","El Hato"}'::TEXT[], 'Ausencia total de parques infantiles en buen estado en el municipio.', 'Los políticos tradicionales prometen megaobras inútiles de miles de millones que jamás terminan.', 'Instalación rápida de 4 parques modulares de alta durabilidad con iluminación solar autónoma.', 'Kits de Parques Modulares + Luminarias solares All-in-One.', '48000000', 'Convenios Solidarios con Juntas de Acción Comunal (JAC) - Ley 2166 de 2021.', '{"1 Ingeniero Civil","2 Lideres JAC","4 Operarios Locales"}'::TEXT[], '30', 'Aprobado Plan') ON CONFLICT DO NOTHING;
INSERT INTO plan_gobierno_proyectos (id, municipio_id, codigo, titulo, sector, veredas_afectadas, diagnostico, contraste_politico, solucion_pragmatica, compras_directas, presupuesto_total_cop, marco_legal, talento_humano, cronograma_dias, estado) VALUES ('d89c5c73-156c-483f-ae1a-7b21d1e02197', 'guaduas', 'PG-AGUA-01', 'Agua Potable Inmediata Piedras Negras (Motobomba + Solar)', 'Agua Potable y Saneamiento', '{"Piedras Negras"}'::TEXT[], 'Vereda apartada de Guaduas sin servicio continuo ni bombeo de agua potable.', 'Llevan décadas prometiendo acueductos multimillonarios que se quedan en estudios y burocracia.', 'Compra e instalación directa de motobomba de alto flujo alimentada por estación de energía solar EcoFlow.', 'Motobomba diésel/eléctrica de 3 HP + Estación de Energía EcoFlow DELTA Max.', '18500000', 'Contratación Directa de Menor Cuantía / Compra de Emergencia Comunitaria.', '{"1 Fontanero Veredal","1 Técnico Electricista","Líder Veredal"}'::TEXT[], '30', 'Aprobado Plan') ON CONFLICT DO NOTHING;
INSERT INTO plan_gobierno_proyectos (id, municipio_id, codigo, titulo, sector, veredas_afectadas, diagnostico, contraste_politico, solucion_pragmatica, compras_directas, presupuesto_total_cop, marco_legal, talento_humano, cronograma_dias, estado) VALUES ('8ca00295-9c61-432d-81cc-bca772e432d5', 'guaduas', 'PG-AGUA-02', 'Filtros y Potabilización por Cobre Puerto Bogotá', 'Agua Potable y Saneamiento', '{"Puerto Bogotá"}'::TEXT[], 'Problemas recurrentes de calidad de agua e turbiedad en la inspección de Puerto Bogotá.', 'Años de promesas de plantas gigantescas mientras la población consume agua de mala calidad.', 'Sistemas de filtración multicapa en cascada e ionización de cobre de rápida instalación.', 'Filtros industriales de cartucho sedimentador + Células de ionización de cobre.', '27000000', 'Acuerdo Municipal de Salud Pública y Agua Limpia Ya.', '{"1 Ingeniero Químico/Ambiental","2 Operarios de Mantenimiento"}'::TEXT[], '30', 'Aprobado Plan') ON CONFLICT DO NOTHING;
INSERT INTO plan_gobierno_proyectos (id, municipio_id, codigo, titulo, sector, veredas_afectadas, diagnostico, contraste_politico, solucion_pragmatica, compras_directas, presupuesto_total_cop, marco_legal, talento_humano, cronograma_dias, estado) VALUES ('db018698-9b5b-4605-8c56-ce1872067342', 'guaduas', 'PG-CON-01', 'Internet Starlink Veredal para Escuelas Rurales', 'Educación y Conectividad', '{"Escuelas Veredales Piedras Negras","El Hato","San José",Yaguara}'::TEXT[], 'Escuelas rurales aisladas sin conectividad a internet para niños y docentes.', 'Contratos estatales de conectividad engorrosos que nunca llegan a las aulas veredales.', 'Kits satelitales Starlink Residencial/Empresarial con panel solar de respaldo en cada escuela.', 'Kits Starlink Colombia + Inversores y Paneles Solares 400W.', '16000000', 'Fondo de Desarrollo Local Educativo y Convenios con rectores veredales.', '{"1 Técnico en Telecomunicaciones","Docentes Encargados"}'::TEXT[], '30', 'Aprobado Plan') ON CONFLICT DO NOTHING;
INSERT INTO plan_gobierno_proyectos (id, municipio_id, codigo, titulo, sector, veredas_afectadas, diagnostico, contraste_politico, solucion_pragmatica, compras_directas, presupuesto_total_cop, marco_legal, talento_humano, cronograma_dias, estado) VALUES ('23fab115-8002-48cf-9eb9-774165b8d363', 'guaduas', 'PG-CAMPO-01', 'La Ruta Campesina y Red de Mini-Tiendas Afiliadas', 'Desarrollo Agrícola y Campo', '{"Todas las Veredas de Guaduas"}'::TEXT[], 'Dificultad de los campesinos para transportar cosechas al centro urbano a costos justos.', 'Burocracia en la UMATA y falta de logística real para la comercialización agrícola.', 'Vehículo tipo ruta escolar exclusivo para cosechas + Centro de Acopio y Red de Mini-Tiendas de campesinos afiliados.', 'Camión mediano de estacas furgón + Puntos de pesaje digital + Red de estantería.', '85000000', 'Asociatividad Campesina y Ley de Compras Públicas Locales (Ley 2046 de 2020).', '{"1 Coordinador Logístico","2 Conductores","Administrador Acopio"}'::TEXT[], '30', 'Aprobado Plan') ON CONFLICT DO NOTHING;

-- 2. Problemáticas Ciudadanas reales registradas por la comunidad (Guaduas)
INSERT INTO problematicas_ciudadanas (id, municipio_id, ciudadano_id, ciudadano_nombre, vereda_barrio, transcripcion_audio, descripcion_problema, sector, urgencia, votos_comunitarios, fecha_reporte) VALUES ('9e3ea581-838a-4d27-8159-485116bb3829', 'guaduas', NULL, 'Ciudadano Anónimo', 'Guaduas (Centro)', 'herramientas quiero comentarte una problemática que tenemos aquí por el sector del río al lado de la iglesia', 'Inquietud planteada: "herramientas quiero comentarte una problemática que tenemos aquí por el sector del río al lado de la iglesia"', 'Energía e Infraestructura', 'Alta', '1', '2026-09-08 17:44:29.23112+00') ON CONFLICT DO NOTHING;
INSERT INTO problematicas_ciudadanas (id, municipio_id, ciudadano_id, ciudadano_nombre, vereda_barrio, transcripcion_audio, descripcion_problema, sector, urgencia, votos_comunitarios, fecha_reporte) VALUES ('f2ce1cf0-90e9-44ec-9e52-07103713e80a', 'guaduas', NULL, 'Ciudadano Anónimo', 'Por definir', 'Sí mira Ramito lo que pasa es que el río huele muy feo y muy malos olores en la zona del barrio', 'Inquietud planteada: "Sí mira Ramito lo que pasa es que el río huele muy feo y muy malos olores en la zona del barrio"', 'Energía e Infraestructura', 'Alta', '1', '2026-09-08 18:17:17.130575+00') ON CONFLICT DO NOTHING;
INSERT INTO problematicas_ciudadanas (id, municipio_id, ciudadano_id, ciudadano_nombre, vereda_barrio, transcripcion_audio, descripcion_problema, sector, urgencia, votos_comunitarios, fecha_reporte) VALUES ('8f4f0fd2-02b4-4f0e-b180-dc58dea78026', 'guaduas', NULL, 'Ciudadano Anónimo', 'Por definir', 'Hola Me llamo maylin y quiero que hayan parques infantiles para en guaduas', 'Inquietud planteada: "Hola Me llamo maylin y quiero que hayan parques infantiles para en guaduas"', 'Infancia y Familia', 'Alta', '1', '2026-09-09 01:26:35.917841+00') ON CONFLICT DO NOTHING;
INSERT INTO problematicas_ciudadanas (id, municipio_id, ciudadano_id, ciudadano_nombre, vereda_barrio, transcripcion_audio, descripcion_problema, sector, urgencia, votos_comunitarios, fecha_reporte) VALUES ('3fdd0337-9d43-467e-adbc-cf5402f07593', 'guaduas', NULL, 'Ciudadano Anónimo', 'Por definir', 'Hola soy maylin y tengo 10 años me gustaría que hagan parques infantiles en Walmart', 'Inquietud planteada: "Hola soy maylin y tengo 10 años me gustaría que hagan parques infantiles en Walmart"', 'Infancia y Familia', 'Alta', '1', '2026-09-09 01:34:38.159239+00') ON CONFLICT DO NOTHING;
INSERT INTO problematicas_ciudadanas (id, municipio_id, ciudadano_id, ciudadano_nombre, vereda_barrio, transcripcion_audio, descripcion_problema, sector, urgencia, votos_comunitarios, fecha_reporte) VALUES ('30c80320-f9fe-4c9a-b8f3-01c4b7ccd80c', 'guaduas', NULL, 'Ciudadano Anónimo', 'Por definir', 'Hola Me llamo maylin tengo 10 años me gustaría que hicieran parques en guaduas cundinamarca', 'Inquietud planteada: "Hola Me llamo maylin tengo 10 años me gustaría que hicieran parques en guaduas cundinamarca"', 'Infancia y Familia', 'Alta', '1', '2026-09-09 02:09:19.774729+00') ON CONFLICT DO NOTHING;
INSERT INTO problematicas_ciudadanas (id, municipio_id, ciudadano_id, ciudadano_nombre, vereda_barrio, transcripcion_audio, descripcion_problema, sector, urgencia, votos_comunitarios, fecha_reporte) VALUES ('331e8076-b06b-4f46-bcb1-095153792827', 'guaduas', NULL, 'Ciudadano Anónimo', 'Por definir', 'Sí es que aquí al lado del río huele a feo qué podemos hacer', 'Inquietud planteada: "Sí es que aquí al lado del río huele a feo qué podemos hacer"', 'Energía e Infraestructura', 'Alta', '1', '2026-09-09 22:36:01.768333+00') ON CONFLICT DO NOTHING;
INSERT INTO problematicas_ciudadanas (id, municipio_id, ciudadano_id, ciudadano_nombre, vereda_barrio, transcripcion_audio, descripcion_problema, sector, urgencia, votos_comunitarios, fecha_reporte) VALUES ('4d12c6d4-a567-4fba-b211-4c0f7298e2c9', 'guaduas', NULL, 'Ciudadano Anónimo', 'Por definir', 'sí te comento abajo en el puente al lado de la iglesia del barrio', 'Inquietud planteada: "sí te comento abajo en el puente al lado de la iglesia del barrio"', 'Energía e Infraestructura', 'Alta', '1', '2026-09-10 03:01:54.992078+00') ON CONFLICT DO NOTHING;
INSERT INTO problematicas_ciudadanas (id, municipio_id, ciudadano_id, ciudadano_nombre, vereda_barrio, transcripcion_audio, descripcion_problema, sector, urgencia, votos_comunitarios, fecha_reporte) VALUES ('42168077-6165-4745-96b7-4902ac4336a0', 'guaduas', NULL, 'Ciudadano Anónimo', 'Por definir', 'está ubicado en el barrio Benjamín Herrera', 'Inquietud planteada: "está ubicado en el barrio Benjamín Herrera"', 'Energía e Infraestructura', 'Alta', '1', '2026-09-10 03:02:17.390085+00') ON CONFLICT DO NOTHING;
INSERT INTO problematicas_ciudadanas (id, municipio_id, ciudadano_id, ciudadano_nombre, vereda_barrio, transcripcion_audio, descripcion_problema, sector, urgencia, votos_comunitarios, fecha_reporte) VALUES ('484bef27-830d-4262-ac49-561d339c74df', 'guaduas', NULL, 'Ciudadano Anónimo', 'Por definir', 'sí Hazme un resumen Cuéntame De qué trata mi propuesta', 'Inquietud planteada: "sí Hazme un resumen Cuéntame De qué trata mi propuesta"', 'Energía e Infraestructura', 'Alta', '1', '2026-09-10 03:03:54.196778+00') ON CONFLICT DO NOTHING;
INSERT INTO problematicas_ciudadanas (id, municipio_id, ciudadano_id, ciudadano_nombre, vereda_barrio, transcripcion_audio, descripcion_problema, sector, urgencia, votos_comunitarios, fecha_reporte) VALUES ('1a0d63c1-5996-48cd-a579-b4a28951a3e7', 'guaduas', NULL, 'Ciudadano Anónimo', 'Por definir', 'qué proyectos tienen paraguas pensados en general', 'Inquietud planteada: "qué proyectos tienen paraguas pensados en general"', 'Agua Potable y Saneamiento', 'Alta', '1', '2026-09-10 03:06:15.714584+00') ON CONFLICT DO NOTHING;

-- 3. Propuestas estructuradas IA originales (Guaduas)
INSERT INTO propuestas_estructuradas_ia (id, municipio_id, problematica_id, ciudadano_id, intencion_sintetizada, necesidad_clave, propuesta_redactada_ramitos, estado_evaluacion, respuesta_equipo_humano, fecha_analisis) VALUES ('2a4bf630-bd66-4625-b43b-5a55c8f440a7', 'guaduas', '9e3ea581-838a-4d27-8159-485116bb3829', NULL, 'Inquietud planteada: "herramientas quiero comentarte una problemática que tenemos aquí por el sector del río al lado de la iglesia"', '', 'Propuesta estructurada para análisis del equipo humano de gobierno.', 'Pendiente Revision Humana', NULL, '2026-09-08 17:44:29.399237+00') ON CONFLICT DO NOTHING;
INSERT INTO propuestas_estructuradas_ia (id, municipio_id, problematica_id, ciudadano_id, intencion_sintetizada, necesidad_clave, propuesta_redactada_ramitos, estado_evaluacion, respuesta_equipo_humano, fecha_analisis) VALUES ('9ef4880f-932f-43ba-972d-e6d85afb5b6a', 'guaduas', 'f2ce1cf0-90e9-44ec-9e52-07103713e80a', NULL, 'Inquietud planteada: "Sí mira Ramito lo que pasa es que el río huele muy feo y muy malos olores en la zona del barrio"', '', 'Propuesta estructurada para análisis del equipo humano de gobierno.', 'Pendiente Revision Humana', NULL, '2026-09-08 18:17:17.396465+00') ON CONFLICT DO NOTHING;
INSERT INTO propuestas_estructuradas_ia (id, municipio_id, problematica_id, ciudadano_id, intencion_sintetizada, necesidad_clave, propuesta_redactada_ramitos, estado_evaluacion, respuesta_equipo_humano, fecha_analisis) VALUES ('bb44a150-bc06-42a3-8087-13ab4f842bfd', 'guaduas', '8f4f0fd2-02b4-4f0e-b180-dc58dea78026', NULL, 'Inquietud planteada: "Hola Me llamo maylin y quiero que hayan parques infantiles para en guaduas"', '', 'Propuesta estructurada para análisis del equipo humano de gobierno.', 'Pendiente Revision Humana', NULL, '2026-09-09 01:26:36.163393+00') ON CONFLICT DO NOTHING;
INSERT INTO propuestas_estructuradas_ia (id, municipio_id, problematica_id, ciudadano_id, intencion_sintetizada, necesidad_clave, propuesta_redactada_ramitos, estado_evaluacion, respuesta_equipo_humano, fecha_analisis) VALUES ('e2ca9112-286a-4adc-861f-d6d932e427c8', 'guaduas', '3fdd0337-9d43-467e-adbc-cf5402f07593', NULL, 'Inquietud planteada: "Hola soy maylin y tengo 10 años me gustaría que hagan parques infantiles en Walmart"', '', 'Propuesta estructurada para análisis del equipo humano de gobierno.', 'Pendiente Revision Humana', NULL, '2026-09-09 01:34:38.362182+00') ON CONFLICT DO NOTHING;
INSERT INTO propuestas_estructuradas_ia (id, municipio_id, problematica_id, ciudadano_id, intencion_sintetizada, necesidad_clave, propuesta_redactada_ramitos, estado_evaluacion, respuesta_equipo_humano, fecha_analisis) VALUES ('3046c981-4acd-471b-b2bd-eb0c2acd4240', 'guaduas', '30c80320-f9fe-4c9a-b8f3-01c4b7ccd80c', NULL, 'Inquietud planteada: "Hola Me llamo maylin tengo 10 años me gustaría que hicieran parques en guaduas cundinamarca"', '', 'Propuesta estructurada para análisis del equipo humano de gobierno.', 'Pendiente Revision Humana', NULL, '2026-09-09 02:09:19.949943+00') ON CONFLICT DO NOTHING;
INSERT INTO propuestas_estructuradas_ia (id, municipio_id, problematica_id, ciudadano_id, intencion_sintetizada, necesidad_clave, propuesta_redactada_ramitos, estado_evaluacion, respuesta_equipo_humano, fecha_analisis) VALUES ('b6bcca67-9576-494c-bdaa-11051da385ab', 'guaduas', '331e8076-b06b-4f46-bcb1-095153792827', NULL, 'Inquietud planteada: "Sí es que aquí al lado del río huele a feo qué podemos hacer"', '', 'Propuesta estructurada para análisis del equipo humano de gobierno.', 'Pendiente Revision Humana', NULL, '2026-09-09 22:36:02.061683+00') ON CONFLICT DO NOTHING;
INSERT INTO propuestas_estructuradas_ia (id, municipio_id, problematica_id, ciudadano_id, intencion_sintetizada, necesidad_clave, propuesta_redactada_ramitos, estado_evaluacion, respuesta_equipo_humano, fecha_analisis) VALUES ('fdcec2b6-13dc-41ee-889e-ee82fc2d686d', 'guaduas', '4d12c6d4-a567-4fba-b211-4c0f7298e2c9', NULL, 'Inquietud planteada: "sí te comento abajo en el puente al lado de la iglesia del barrio"', '', 'Propuesta estructurada para análisis del equipo humano de gobierno.', 'Pendiente Revision Humana', NULL, '2026-09-10 03:01:55.346181+00') ON CONFLICT DO NOTHING;
INSERT INTO propuestas_estructuradas_ia (id, municipio_id, problematica_id, ciudadano_id, intencion_sintetizada, necesidad_clave, propuesta_redactada_ramitos, estado_evaluacion, respuesta_equipo_humano, fecha_analisis) VALUES ('bc706834-902a-45fd-b90a-8f526f02c1db', 'guaduas', '42168077-6165-4745-96b7-4902ac4336a0', NULL, 'Inquietud planteada: "está ubicado en el barrio Benjamín Herrera"', '', 'Propuesta estructurada para análisis del equipo humano de gobierno.', 'Pendiente Revision Humana', NULL, '2026-09-10 03:02:17.521034+00') ON CONFLICT DO NOTHING;
INSERT INTO propuestas_estructuradas_ia (id, municipio_id, problematica_id, ciudadano_id, intencion_sintetizada, necesidad_clave, propuesta_redactada_ramitos, estado_evaluacion, respuesta_equipo_humano, fecha_analisis) VALUES ('606f5f00-a88b-4534-b09f-8b22e364b329', 'guaduas', '484bef27-830d-4262-ac49-561d339c74df', NULL, 'Inquietud planteada: "sí Hazme un resumen Cuéntame De qué trata mi propuesta"', '', 'Propuesta estructurada para análisis del equipo humano de gobierno.', 'Pendiente Revision Humana', NULL, '2026-09-10 03:03:54.372644+00') ON CONFLICT DO NOTHING;
INSERT INTO propuestas_estructuradas_ia (id, municipio_id, problematica_id, ciudadano_id, intencion_sintetizada, necesidad_clave, propuesta_redactada_ramitos, estado_evaluacion, respuesta_equipo_humano, fecha_analisis) VALUES ('09e4ca46-2752-44c4-aa53-1b612f73bc92', 'guaduas', '1a0d63c1-5996-48cd-a579-b4a28951a3e7', NULL, 'Inquietud planteada: "qué proyectos tienen paraguas pensados en general"', '', 'Propuesta estructurada para análisis del equipo humano de gobierno.', 'Pendiente Revision Humana', NULL, '2026-09-10 03:06:15.837094+00') ON CONFLICT DO NOTHING;

-- 4. Conversaciones reales e interacciones con Ramitos (Guaduas)
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('1208e472-110d-4a02-b334-80b699cc9829', 'guaduas', 'dev-1788880222821-3dyd2bg', '190.158.204.16', NULL, 'Hola ramitos Tengo una inquietud sabes quién soy', 'Solo tú conoces tu historia, pero estoy aquí para escucharte y acompañarte con tu inquietud en Guaduas Centro. ¿Te gustaría compartir tu nombre y WhatsApp para que el equipo humano te contacte?', NULL, 'feliz', NULL, '2026-09-08 17:43:04.124971+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('9d057bd7-eab2-4f7d-ae13-15dd25d46758', 'guaduas', 'dev-1788880222821-3dyd2bg', '190.158.204.16', NULL, 'herramientas quiero comentarte una problemática que tenemos aquí por el sector del río al lado de la iglesia', 'Cuéntame más sobre la problemática del río junto a la iglesia en Guaduas Centro, para que podamos estructurar una propuesta concreta. ¿Te gustaría dejarnos tu Nombre y WhatsApp para que el equipo humano te contacte?', 'Inquietud planteada: "herramientas quiero comentarte una problemática que tenemos aquí por el sector del río al lado de la iglesia"', 'curioso', 'Energía e Infraestructura', '2026-09-08 17:44:29.251568+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('2ff37f26-131b-499d-955c-e6a436322b07', 'guaduas', 'dev-1788880222821-3dyd2bg', '190.158.204.16', NULL, 'Hola Ramito sabes quién soy', 'Solo tú sabes quién eres, pero estoy aquí para escucharte. ¿Podrías compartir tu nombre y WhatsApp para que el equipo humano te contacte?', NULL, 'feliz', NULL, '2026-09-08 17:51:30.673764+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('3c921397-0c33-45bf-aa9f-7a4b7117f41b', 'guaduas', 'dev-1788880222821-3dyd2bg', '190.158.204.16', NULL, 'Claro mi nombre es Iván Alvarado y mi número es 322 582 2027', 'Aún no tengo registrado tu número de celular. ¿Deseas proporcionarlo para estar comunicando avances sobre tu planteamiento?', NULL, 'curioso', NULL, '2026-09-08 17:51:57.513808+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('8550d16f-1e0e-4f73-8188-d000ddef910d', 'guaduas', 'dev-1788880222821-3dyd2bg', '190.158.204.16', NULL, 'Ya te los di Mira el historial', 'Ya tengo tu nombre e WhatsApp, Iván. ¿Podrías contarme la problemática que deseas registrar para que el equipo humano la evalúe?', NULL, 'feliz', NULL, '2026-09-08 17:52:25.75382+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('3a2ef9d4-a1bc-4375-a842-ad7352803017', 'guaduas', 'dev-1788880222821-3dyd2bg', '190.158.204.16', NULL, 'Sí mira', 'Listo, Iván. Te escucho con atención para que nos cuentes en detalle la situación del río y así podamos registrarla para el equipo humano.', NULL, 'feliz', NULL, '2026-09-08 18:02:42.999564+00', 'herramientas quiero comentarte una', '3225822027') ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('60defee4-fa79-4afd-ab77-4cb306d5ce48', 'guaduas', 'dev-1788880222821-3dyd2bg', '190.158.204.16', NULL, 'Sí mira Ramito lo que pasa es que el río huele muy feo y muy malos olores en la zona del barrio', 'Iván, el problema del fuerte olor del río en tu barrio es una prioridad. Registraremos la queja y pediremos al equipo técnico una inspección y plan de mitigación para eliminar los olores.', 'Inquietud planteada: "Sí mira Ramito lo que pasa es que el río huele muy feo y muy malos olores en la zona del barrio"', 'curioso', 'Energía e Infraestructura', '2026-09-08 18:17:17.005406+00', 'herramientas quiero comentarte una', '3225822027') ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('fa9d0e25-aba0-4b97-be9c-2838d88fb175', 'guaduas', 'dev-1788880222821-3dyd2bg', '190.158.204.16', NULL, 'Muchas gracias tienes algún avance', 'Hasta el momento no hay avances nuevos; la queja está registrada y el equipo técnico está programando la inspección y el plan de mitigación del olor. Te avisaremos en cuanto tengamos respuesta del equipo.', NULL, 'agradecido', NULL, '2026-09-08 21:36:04.632037+00', 'herramientas quiero comentarte una', '3225822027') ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('dcf983fe-cd9a-4ec6-9d3d-8f06d1cae077', 'guaduas', 'dev-1788880222821-3dyd2bg', '190.158.204.16', NULL, 'me puedes contar un poco qué plan de gobierno Qué planes tiene paraguas', '¡Con mucho gusto! Despliego el Plan de Gobierno en pantalla para que lo revisemos juntos.', NULL, 'entusiasmado', NULL, '2026-09-08 22:00:30.271861+00', 'herramientas quiero comentarte una', '3225822027') ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('ad0d605d-9319-4f5b-8d45-8a7a190301ce', 'guaduas', 'dev-1788880222821-3dyd2bg', '190.158.204.16', NULL, 'Hola Me llamo maylin tengo 10 años me gustaría que hicieran parques en guaduas cundinamarca', 'Maylin, una alternativa es proponer un parque infantil con juegos seguros y áreas verdes; ¿en qué vereda o barrio de Guaduas te gustaría que se ubique?', 'Inquietud planteada: "Hola Me llamo maylin tengo 10 años me gustaría que hicieran parques en guaduas cundinamarca"', 'agradecido', 'Infancia y Familia', '2026-09-09 02:09:19.798364+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('497423a0-3253-4fb8-ba70-3f3fe5c4394a', 'guaduas', 'dev-1788880222821-3dyd2bg', '190.158.204.16', NULL, 'no sé', 'Una opción práctica es sugerir una zona cercana al colegio o al parque actual; ¿tienes alguna vereda o barrio en mente?', NULL, 'feliz', NULL, '2026-09-09 02:09:52.438891+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('5359ae8b-9906-4092-98f1-22212d6f73c2', 'guaduas', 'dev-1788880222821-3dyd2bg', '190.158.204.16', NULL, 'No no tengo nada en mente contáctame a mi WhatsApp', 'Tengo registrado tu número de WhatsApp como 3225822027 a nombre de herramientas quiero comentarte. ¿Te gustaría actualizarlo o seguir conversando sobre tu propuesta?', NULL, 'feliz', NULL, '2026-09-09 02:10:05.915265+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('ecf6e215-9344-4b7f-895d-31ea7453b1bb', 'guaduas', 'dev-sample-test-100', '190.28.100.12', NULL, 'Quisiera saber sobre los proyectos de escuelas conectadas.', 'Tenemos el proyecto Starlink para escuelas rurales.', 'Consulta de conectividad Starlink.', 'entusiasmado', 'Educación y Conectividad', '2026-09-09 03:06:46.411996+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('e34042f9-c49c-4b57-ba36-c8ff3c62d652', 'guaduas', 'dev-1788880222821-3dyd2bg', '190.158.204.16', NULL, 'Hola ramitos Me gustaría saber qué proyectos tiene planeados para guaduas', 'En Guaduas se planifican parques infantiles modulares con suelo amortiguador y luces LED (PG‑PARQUES‑01), una microestación solar de agua potable (PG‑AGUA‑01) y conexión satelital Starlink para escuelas rurales (PG‑CON‑01).', NULL, 'agradecido', NULL, '2026-09-09 15:34:47.174383+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('1cbb509a-d99e-44a6-9e71-f51f45952154', 'guaduas', 'dev-1788880222821-3dyd2bg', '190.158.204.16', NULL, 'En dónde harán eso', 'Los proyectos están en fase de planificación y se definirán según la vereda o barrio que se indique; ¿en qué zona de Guaduas te gustaría que se ubiquen?', NULL, 'feliz', NULL, '2026-09-09 15:35:16.287933+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('1cd034a8-4533-43e9-828f-b161f8bcf8d5', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, 'Hola Ramito me escuchas', 'Sí, te escucho; los proyectos (parques infantiles, microestación solar y conexión Starlink) están en fase de planificación y se asignarán según la vereda o barrio que indiques, ¿cuál zona de Guaduas prefieres?', NULL, 'feliz', NULL, '2026-09-09 20:03:41.835133+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('fe741035-ac6f-4b1d-a4ea-36cea2422c36', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, 'Sí vale', 'Resumen: los parques infantiles, la microestación solar y Starlink están en planificación y se asignarán según la vereda que indiques. ¿En qué vereda o barrio de Guaduas deseas priorizarlos?', NULL, 'feliz', NULL, '2026-09-09 20:23:31.744086+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('bf30359a-1b56-40b5-9c43-868d51750052', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, 'Hola hola', '¡Hola! Para que el equipo pueda asignar los parques infantiles, la microestación solar y Starlink, ¿en qué vereda o barrio de Guaduas te encuentras exactamente?', NULL, 'feliz', NULL, '2026-09-09 21:55:27.789858+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('1ea22f73-2620-417e-9c07-4e7b0cf2fa06', 'guaduas', 'dev-1788991568185-5dpkv6v', '190.158.204.16', NULL, 'Hola', '¡Hola! Cuéntame qué tema o idea tienes y, para enfocarnos, ¿en qué vereda o barrio de Guaduas se presenta?', NULL, 'feliz', NULL, '2026-09-09 22:06:33.685971+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('34422567-abe3-4243-aa9b-d34ce3c81b1d', 'guaduas', 'dev-1788993356698-82f2076', '190.158.204.16', NULL, 'Sí es que aquí al lado del río huele a feo qué podemos hacer', 'Una alternativa es organizar una jornada de limpieza y solicitar al equipo de salud ambiental que realice monitoreo y controle vertidos; ¿en qué vereda o barrio de Guaduas ocurre?', 'Inquietud planteada: "Sí es que aquí al lado del río huele a feo qué podemos hacer"', 'curioso', 'Energía e Infraestructura', '2026-09-09 22:36:01.49846+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('61a443fb-3e76-4775-b241-ecc9cb4da326', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, 'sabes quién soy yo', 'Hasta ahora solo sé que eres un vecino de Guaduas interesado en parques infantiles, microestación solar y Starlink; aún no tengo tu nombre ni vereda. ¿Podrías indicarme en qué barrio te encuentras?', NULL, 'feliz', NULL, '2026-09-09 22:57:24.07943+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('661b64ed-3826-4475-85c4-e06bebaa757f', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, 'Mi nombre es Iván Alvarado', 'Gracias, Iván Alvarado, ¿en qué vereda o barrio de Guaduas te encuentras? ¿Te gustaría compartir tu WhatsApp para que el equipo te informe cuando evalúen la propuesta?', NULL, 'feliz', NULL, '2026-09-09 22:57:44.656841+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('93dc6d05-35a9-4333-aa52-349f2b78e7e5', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, 'sí te comento abajo en el puente al lado de la iglesia del barrio', 'Para que el equipo pueda atender lo del puente junto a la iglesia, ¿en qué vereda o barrio de Guaduas está ubicado? ¿Te gustaría dejarnos tu WhatsApp para mantenerte informado?', 'Inquietud planteada: "sí te comento abajo en el puente al lado de la iglesia del barrio"', 'feliz', 'Energía e Infraestructura', '2026-09-10 03:01:54.727905+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('3990ea4b-66dc-4c17-8dc5-66b66ac33744', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, 'está ubicado en el barrio Benjamín Herrera', 'Perfecto, Iván, el equipo registrará la intervención del puente cerca de la iglesia en Benjamín Herrera y abrirá una votación piloto para priorizarla. ¿Nos dejas tu WhatsApp para mantenerte al tanto?', 'Inquietud planteada: "está ubicado en el barrio Benjamín Herrera"', 'feliz', 'Energía e Infraestructura', '2026-09-10 03:02:17.195327+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('434c2de0-7e28-47d9-abab-ecef12d18635', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, 'Claro mi WhatsApp Es 322 582 2027', 'Tengo registrado tu número de WhatsApp como 3225822027 a nombre de Yo Mi. ¿Te gustaría actualizarlo o seguir conversando sobre tu propuesta?', NULL, 'feliz', NULL, '2026-09-10 03:02:36.490804+00', 'Mi', '3225822027') ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('c685f1be-a8cc-4cc5-bdf0-06322881ef51', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, 'actualízalo Mi nombre es Iván Alvarado', 'Listo, Iván Alvarado, tu nombre está actualizado en el registro. El equipo seguirá con la votación piloto para el puente cerca de la iglesia en Benjamín Herrera.', NULL, 'feliz', NULL, '2026-09-10 03:02:55.549971+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('bd787310-ea78-4cae-adb3-7b0a5b9821fe', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, 'Okay pero el problema no es el puente el problema es el río huele muy feo', '¡Entendido! He corregido el término erróneo ''el puente el problema'' por ''el río huele muy feo'' en nuestro registro y base de datos para evitar cualquier confusión. Continuemos con tu propuesta en el río huele muy feo.', NULL, 'agradecido', NULL, '2026-09-10 03:03:27.652447+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('3d7fb3c4-704d-4616-801d-cf153310ce83', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, 'sí Hazme un resumen Cuéntame De qué trata mi propuesta', 'Iván, tu propuesta busca solucionar el fuerte olor del río en Benjamín Herrera, tras haber registrado antes una intervención del puente cerca de la iglesia. Proponemos abrir una votación piloto para acciones de mitigación.', 'Inquietud planteada: "sí Hazme un resumen Cuéntame De qué trata mi propuesta"', 'curioso', 'Energía e Infraestructura', '2026-09-10 03:03:54.228817+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('7ee41432-196d-4c71-a244-5d9af50fa3d9', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, 'qué proyectos tienen paraguas pensados en general', 'Los proyectos paraguas son: agua potable con microestación solar (PG-AGUA-01), filtros de cobre (PG-AGUA-02), internet satelital Starlink (PG-CON-01), parques infantiles modulares (PG-PARQUES-01) y ruta campesina con mini‑tiendas (PG-CAMPO-01).', 'Inquietud planteada: "qué proyectos tienen paraguas pensados en general"', 'feliz', 'Agua Potable y Saneamiento', '2026-09-10 03:06:15.690599+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('24df5c1f-ea17-4c3d-acc4-3be08503d311', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, 'hoy suena muy interesante Cuéntame', 'Los proyectos paraguas son agua potable con microestación solar, filtros de cobre, internet Starlink, parques infantiles y ruta campesina con mini‑tiendas. Abrimos votación piloto para filtros y microestación y mitigar el olor del río.', NULL, 'feliz', NULL, '2026-09-10 03:06:54.289215+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('9bb45714-df22-406f-abac-aa4da96f4a89', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, 'Llévame a votar o Llévame al dashboard', 'La votación piloto está disponible en el dashboard: https://guaduas-dashboard.org/votaciones. Allí puedes revisar los proyectos paraguas y elegir la acción para mitigar el olor del río.', NULL, 'feliz', NULL, '2026-09-10 03:07:49.736827+00', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO interacciones_conversaciones_ramitos (id, municipio_id, device_id, ip_address, ciudadano_id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, reinterpretacion_estructurada_ia, expresion_ramitos, sector_detectado, fecha_interaccion, nombre_ciudadano, whatsapp_ciudadano) VALUES ('4038ad1a-4595-4cef-b3da-2e00bc423c08', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, 'Muéstrame el plan de gobierno abre el plan de gobierno', '¡Con mucho gusto! Despliego el Plan de Gobierno en pantalla para que lo revisemos juntos.', NULL, 'entusiasmado', NULL, '2026-09-10 03:08:20.347647+00', NULL, NULL) ON CONFLICT DO NOTHING;

-- 5. Conclusiones y memoria de Ramitos (Guaduas)
INSERT INTO conclusiones_memoria_ramitos (id, municipio_id, device_id, ip_address, whatsapp_ciudadano, nombre_ciudadano, tema_principal, resumen_contexto, ultima_conclusion, estado_propuesta, fecha_actualizacion) VALUES ('55763b77-991a-4cc4-ab1b-32c561b3e946', 'guaduas', 'dev-1788991568185-5dpkv6v', '190.158.204.16', NULL, NULL, 'Energía e Infraestructura', 'Diálogo sobre Energía e Infraestructura en la vereda/zona Por definir. Inquietud expresada: "Hola"', '¡Hola! Cuéntame qué tema o idea tienes y, para enfocarnos, ¿en qué vereda o barrio de Guaduas se presenta?', 'En Construcción', '2026-09-09 22:06:33.457+00') ON CONFLICT DO NOTHING;
INSERT INTO conclusiones_memoria_ramitos (id, municipio_id, device_id, ip_address, whatsapp_ciudadano, nombre_ciudadano, tema_principal, resumen_contexto, ultima_conclusion, estado_propuesta, fecha_actualizacion) VALUES ('7984d721-7c92-4e85-bea0-913d1dc0b4ab', 'guaduas', 'dev-1788993356698-82f2076', '190.158.204.16', NULL, NULL, 'Energía e Infraestructura', 'Diálogo sobre Energía e Infraestructura en la vereda/zona Por definir. Inquietud expresada: "Sí es que aquí al lado del río huele a feo qué podemos hacer"', 'Una alternativa es organizar una jornada de limpieza y solicitar al equipo de salud ambiental que realice monitoreo y controle vertidos; ¿en qué vereda o barrio de Guaduas ocurre?', 'En Construcción', '2026-09-09 22:36:01.278+00') ON CONFLICT DO NOTHING;
INSERT INTO conclusiones_memoria_ramitos (id, municipio_id, device_id, ip_address, whatsapp_ciudadano, nombre_ciudadano, tema_principal, resumen_contexto, ultima_conclusion, estado_propuesta, fecha_actualizacion) VALUES ('5cee101c-9df5-4a60-8f57-e828073c6f66', 'guaduas', 'dev-1788880222821-3dyd2bg', '190.158.204.16', NULL, NULL, 'Energía e Infraestructura', 'Diálogo sobre Energía e Infraestructura en la vereda/zona Por definir. Inquietud expresada: "En dónde harán eso"', 'Los proyectos están en fase de planificación y se definirán según la vereda o barrio que se indique; ¿en qué zona de Guaduas te gustaría que se ubiquen?', 'En Construcción', '2026-09-09 15:35:16.181+00') ON CONFLICT DO NOTHING;
INSERT INTO conclusiones_memoria_ramitos (id, municipio_id, device_id, ip_address, whatsapp_ciudadano, nombre_ciudadano, tema_principal, resumen_contexto, ultima_conclusion, estado_propuesta, fecha_actualizacion) VALUES ('acd95b63-f06d-4000-99ed-b033d1a26688', 'guaduas', 'dev-1788984202737-idtkin7', '190.158.204.16', NULL, NULL, 'Energía e Infraestructura', 'Diálogo sobre Energía e Infraestructura en la vereda/zona Por definir. Inquietud expresada: "Llévame a votar o Llévame al dashboard"', 'La votación piloto está disponible en el dashboard: https://guaduas-dashboard.org/votaciones. Allí puedes revisar los proyectos paraguas y elegir la acción para mitigar el olor del', 'En Construcción', '2026-09-10 03:07:49.474+00') ON CONFLICT DO NOTHING;

-- ====================================================================
-- SEMILLA DE DATOS NUEVOS DE CAPARRAPÍ (SECOP II, MGA Y REGISTRADURÍA)
-- ====================================================================

-- 1. SECOP II Caparrapí (Periodo 2024-2027 Andrés Ardila Sánchez)
INSERT INTO auditoria_secop (municipio_id, periodo_alcaldia, alcalde_responsable, numero_proceso, objeto_contrato, contratista_nombre, valor_contrato_cop, modalidad_seleccion, alerta_auditoria, fecha_firma)
VALUES
('caparrapi', '2024-2027 Andrés Ardila Sánchez', 'Andrés Ardila Sánchez', 'LP-001-2024', 'Construcción nueva sede del Palacio Municipal de Caparrapí Fase 1', 'Consorcio Caparrapí Moderno 2024', 3082500000, 'Licitación Pública', 'Concentración presupuestal de $3.082M COP en edificio administrativo mientras vías rurales colapsan', '2024-03-15'),
('caparrapi', '2024-2027 Andrés Ardila Sánchez', 'Andrés Ardila Sánchez', '236 Contratos OPS 2024', 'Contratación de prestación de servicios y apoyo a la gestión administrativa', 'Varios Contratistas OPS', 4477800000, 'Contratación Directa', 'Representa el 79.2% de los contratos directos del año 2024', '2024-02-01'),
('caparrapi', '2024-2027 Andrés Ardila Sánchez', 'Andrés Ardila Sánchez', 'SAMC-008-2024', 'Mantenimiento correctivo y preventivo de maquinaria amarilla municipal', 'Maquinarias y Repuestos del Llano SAS', 395000000, 'Selección Abreviada', 'Maquinaria reportada frecuentemente inoperativa en veredas del sector norte', '2024-05-20'),
('caparrapi', '2024-2027 Andrés Ardila Sánchez', 'Andrés Ardila Sánchez', 'LP-003-2024', 'Adecuación y cubierta del Polideportivo Vereda San Ramón', 'Construcciones e Ingeniería San Ramón', 1181200000, 'Licitación Pública', 'Obra civil con prórrogas consecutivas de entrega', '2024-06-10')
ON CONFLICT DO NOTHING;

-- 2. Proyectos MGA Fase 3 Caparrapí
INSERT INTO banco_mga_bpin (municipio_id, codigo_bpin, nombre_proyecto, sector_dnp, codigo_producto_dnp, problema_central, objetivo_central, presupuesto_total_cop, ventanilla_financiacion, evaluacion_social_vpn, evaluacion_social_tir, estado_mga)
VALUES
('caparrapi', '2024251480001', 'Mejoramiento de 12.5 km de corredores terciarios con placas huellas en Caparrapí', 'Transporte', '2101004 - Vías terciarias construidas y mejoradas', 'Deterioro severo del 78% de vías terciarias que impiden sacar cosechas de café y caña', 'Garantizar transitabilidad permanente en los anillos viales veredales', 4200000000, 'INVIAS Caminos Comunitarios de la Paz Total', 1845000000, 18.4, 'Fase 3 - Listo para radicación'),
('caparrapi', '2024251480002', 'Construcción y optimización de 4 acueductos veredales por gravedad y energía solar', 'Vivienda, Ciudad y Territorio', '4001001 - Sistemas de acueducto rural construidos', 'Inexistencia de agua tratada y desabastecimiento en épocas de estiaje', 'Suministrar agua continua y potable a 1.250 familias campesinas', 2650000000, 'Ministerio de Vivienda - Programa Agua al Campo', 920000000, 16.2, 'Fase 3 - Listo para radicación'),
('caparrapi', '2024251480003', 'Dotación tecnológica e internet satelital Starlink en 14 escuelas rurales de Caparrapí', 'Educación', '2201015 - Ambientes de aprendizaje dotados con TIC', 'Brecha digital y abandono tecnológico de sedes educativas rurales', 'Conectar el 100% de las sedes educativas rurales a internet de alta velocidad', 380000000, 'Fondo Único de TIC / Obras por Impuestos ART', 410000000, 22.8, 'Fase 3 - Listo para radicación')
ON CONFLICT (municipio_id, codigo_bpin) DO NOTHING;

-- 3. Historial Electoral Registraduría Caparrapí
INSERT INTO historial_electoral (municipio_id, ano_eleccion, candidato_nombre, partido_coalicion, votos_obtenidos, porcentaje_votos, es_ganador, censo_electoral, votacion_total_valida)
VALUES
('caparrapi', 2023, 'Andrés Ardila Sánchez', 'Partido Conservador / Coalición de Gobierno', 3542, 42.15, true, 11450, 8403),
('caparrapi', 2023, 'Isidro Anzola', 'Coalición Opositora / Movimiento Cívico', 3212, 38.22, false, 11450, 8403),
('caparrapi', 2023, 'Otros / Votos Blanco', 'Otros Partidos', 1649, 19.63, false, 11450, 8403),
('caparrapi', 2019, 'Gonzalo Ramírez Gaitán', 'Coalición por Caparrapí', 3890, 46.50, true, 10890, 8365),
('caparrapi', 2015, 'José Joaquín Sánchez Chávez', 'Partido Liberal / Unidad Nacional', 3620, 45.20, true, 10250, 8008)
ON CONFLICT DO NOTHING;

-- 4. Fichas de Gira Veredal (Estratégicas 1-Clic)
INSERT INTO fichas_gira_veredal (municipio_id, nombre_vereda, lideres_comunales, potencial_electoral_estimado, votos_historicos_2023, necesidades_criticas, obras_secop_previas, compromiso_estrategico)
VALUES
('caparrapi', 'San Carlos', 'Presidentes JAC Cuatro Caminos, Las Ferias, San Pablo, El Trapiche, Comité de Ganaderos', 1620, 1120, '{"Vía crítica Cuatro Caminos colapsada en invierno","Inseguridad en salidas a Guaduas y Puerto Salgar","Falta de acueducto tecnificado"}'::TEXT[], 'Contratos 2026 afirmado por $349M lavados en aguaceros', 'Obras por Impuestos ZOMAC para placa huella pesada y puesto de biotecnología pecuaria'),
('caparrapi', 'Terán', 'Asociación de Productores Paneleros, JAC Barranquillas, Buena Vista, Alto del Roble', 1450, 1020, '{"Más de 300 trapiches con tecnología obsoleta","Intermediarios abusivos en venta de panela","Caminos intransitables hacia Barranquillas"}'::TEXT[], 'Cero proyectos de modernización aprobados en SECOP', 'Modernización calórica de 25 trapiches con Finagro y Centro de Acopio Regional de Panela'),
('caparrapi', 'San Pedro', 'JAC San Pedro Centro, Acuaparrapí, El Silencio, Loma Alta, Criadores equinos', 1280, 910, '{"70% de las casas sin agua potable continua","Ausencia de asistencia veterinaria oficial"}'::TEXT[], 'Contrato PTAP $4.543M con demoras y sin cobertura rural', 'Planta compacta de agua potable con energía solar y Unidad Móvil Veterinaria gratuita'),
('caparrapi', 'La Magdalena', 'JAC La Magdalena Centro, Canchimay, La Unión, Productores frutales', 1150, 790, '{"Pérdida recurrente de puentes de herradura","Falta de cadena de frío para cítricos"}'::TEXT[], 'Maquinaria asignada de manera intermitente', 'Pontones modulares de acero galvanizado con Fondo Adaptación e Invías'),
('caparrapi', 'El Dindal', 'Comités Cafeteros locales, JAC Peñas Blancas, La Florida, Montefrío', 980, 670, '{"Cero beneficio ecológico de café","Precios castigados por pasilla"}'::TEXT[], 'Cero inversión en secado solar en SECOP II en 8 años', 'Microcentrales de beneficio ecológico de café y crédito blando Finagro'),
('caparrapi', 'Morro Negro', 'JAC Morro Negro, Alto de Minas, El Chipal, Educadores rurales', 890, 610, '{"Aislamiento por falla geológica","Escuelas rurales sin internet"}'::TEXT[], 'Derrumbes recurrentes atendidos sin obras de fondo', 'Estabilización de taludes con biomantos y dotación Starlink institucional con MinTIC'),
('caparrapi', 'Córdoba', 'JAC Córdoba Centro, El Guamal, Sabaneta, Ganaderos', 820, 560, '{"Vías de herradura colapsadas","Falta de banco de maquinaria"}'::TEXT[], 'Contratos de recebo sin cunetas', 'Kit de maquinaria comunitaria asignado por cuencas con operador capacitado'),
('caparrapi', 'Pataló', 'JAC Pataló Centro, El Trapiche, La Fría, Comités de agua', 760, 520, '{"Alcantarillados rurales inconclusos","Vertimientos a fuentes de agua"}'::TEXT[], 'Proyectos de saneamiento suspendidos', 'Pozos sépticos biológicos modulares certificados y energía solar para trapiches'),
('caparrapi', 'Cabecera Municipal', 'Comerciantes plaza de mercado, transportadores urbanos, JAC barriales', 3200, 2180, '{"Obras viales con retrasos","Gasto concentrado en palacio municipal"}'::TEXT[], 'Contrato Casa de Gobierno $3.082M vs abandono rural', 'Modernización de plaza de mercado, área refrigerada y transparencia SECOP en línea'),
('guaduas', 'Puerto Bogotá', 'Presidentes JAC Barrio El Cairo, La Cabaña y Pescadores del Magdalena', 4800, 3200, '{"Cortes de agua por crecientes del río","Inundaciones periódicas en la ribera"}'::TEXT[], 'Contrato jarillón 2021 suspendido por sobrecostos', 'Planta compacta con captación flotante insensible a crecidas y muro de defensa UNGRD'),
('guaduas', 'Guaduero', 'Comité de Paneleros de Guaduero, JAC San Antonio Alto', 2400, 1650, '{"Vía intransitable en temporada de zafra","Maquinaria amarilla varada"}'::TEXT[], 'Mantenimiento maquinaria 2022 operó solo 15 días', '3 km de placa huella modular prefabricada con convenios solidarios ejecutados por JAC'),
('guaduas', 'San José', 'Asociación de Cafeteros de San José, Junta Acueducto Veredal', 1950, 1380, '{"Beneficio de café sin conexión trifásica","Escuela sin conectividad"}'::TEXT[], 'Proyecto beneficio 2020 paralizado por falta de energía', 'Planta solar fotovoltaica híbrida de 15 kW y conexión Starlink institucional')
ON CONFLICT DO NOTHING;
