import json
import os

base_dir = r"C:\Users\if4b9\.gemini\antigravity-ide\scratch\ialcaldia\public\data"
guaduas_path = os.path.join(base_dir, "intelligence_guaduas.json")

with open(guaduas_path, "r", encoding="utf-8") as f:
    gua = json.load(f)

# Fichas de gira veredal ampliadas para Guaduas
fichas_gira_gua = gua.get("fichas_gira_veredal", [])
existing_veredas = {f["vereda"] for f in fichas_gira_gua}

nuevas_fichas = [
    {
        "vereda": "El Palmar",
        "inspeccion": "El Palmar",
        "censo_electoral": 1420,
        "votos_estimados": 980,
        "lideres_clave": "Comité de Cafeteros del Bajo Guaduas, JAC El Palmar y líderes de asociaciones de mujeres rurales.",
        "fallas_secop_historicas": "Contratos de afirmado 2021 sin cunetas que colapsaron en la ola invernal; falta de electrificación en 3 ramales veredales.",
        "propuesta_tecnica_2026": "MGA-GUA-004: Electrificación rural fotovoltaica aislada y 1.8 km de placa huella en puntos críticos con Invías.",
        "argumentario_reunion": "«Vecinos de El Palmar: no más contratos de recebo que se convierten en barro a los 15 días. Traemos el proyecto MGA estructurado con Invías para placa huella sólida y energía solar en las fincas que aún no tienen luz.»",
        "fuente_oficial": "SECOP II Contratos 2020-2023 / Ficha MGA BPIN 2026-25320-004-MGA"
    },
    {
        "vereda": "La Paz",
        "inspeccion": "La Paz",
        "censo_electoral": 1250,
        "votos_estimados": 870,
        "lideres_clave": "JAC La Paz Centro, Asociación Ganadera del Valle de Guaduas, líderes de acueductos comunitarios.",
        "fallas_secop_historicas": "Acueducto veredal sin planta de tratamiento adecuada; cortes continuos en época seca y turbiedad en época de lluvia.",
        "propuesta_tecnica_2026": "MGA-GUA-005: Optimización de captación y filtración lenta automatizada con respaldo de energía solar.",
        "argumentario_reunion": "«Comunidad de La Paz: tener agua limpia no es un favor político, es un derecho. Radicamos directamente en MinVivienda el proyecto con código BPIN para que cada familia tenga agua tratada 24/7 sin cobros desproporcionados.»",
        "fuente_oficial": "DNP TerriData Cobertura Agua / MinVivienda Programa Agua al Campo"
    },
    {
        "vereda": "San Antonio",
        "inspeccion": "San Antonio",
        "censo_electoral": 1100,
        "votos_estimados": 780,
        "lideres_clave": "JAC San Antonio, transportadores de carga pesada, comités paneleros locales.",
        "fallas_secop_historicas": "Puente sobre la quebrada en riesgo por socavación de estribos no atendida en el contrato de obras de 2023.",
        "propuesta_tecnica_2026": "MGA-GUA-006: Reforzamiento de estribos, gaviones de protección y placa huella modular en la subida a la vereda.",
        "argumentario_reunion": "«Amigos de San Antonio: sabemos el miedo que da pasar el camión cargado por ese puente en invierno. En nuestro banco MGA el puente y los gaviones están listos con ingeniería de detalle y APU reales.»",
        "fuente_oficial": "UNGRD Gestión del Riesgo / SECOP II Auditoría Infraestructura"
    },
    {
        "vereda": "Cabecera Guaduas",
        "inspeccion": "Cabecera Municipal",
        "censo_electoral": 15400,
        "votos_estimados": 9800,
        "lideres_clave": "Sector hotelero y gastronómico patrimonial, comerciantes de la plaza de mercado, artesanos y líderes comunales urbanos.",
        "fallas_secop_historicas": "Contratos de señalización turística y adecuación patrimonial sin impacto en la ocupación hotelera ni en el empleo juvenil; sobrecostos en mantenimiento de vías urbanas.",
        "propuesta_tecnica_2026": "MGA-GUA-003: Circuito turístico patrimonial integrado con conectividad digital, parqueaderos disuasorios y estímulos tributarios para emprendimientos turísticos.",
        "argumentario_reunion": "«Habitantes de la Villa de Guaduas: somos la cuna de Policarpa Salavarrieta y patrimonio de Colombia. El presupuesto de Guaduas debe generar empleo y turismo real, no burocracia ni obras a medias. Con proyectos viabilizados en Fontur y MinComercio pondremos a Guaduas a la altura de su historia.»",
        "fuente_oficial": "Fontur Colombia / SECOP II Contratos Urbanos 2020-2024"
    }
]

for nf in nuevas_fichas:
    if nf["vereda"] not in existing_veredas:
        fichas_gira_gua.append(nf)

gua["fichas_gira_veredal"] = fichas_gira_gua

# Aliases en Guaduas
gua["banco_proyectos"] = gua.get("proyectos_mga_fase3", [])
gua["politicas_presidencia_2026"] = gua.get("politicas_gobierno_nacional", [])
gua["radar_convocatorias_financiamiento"] = gua.get("radar_convocatorias_activas", [])
gua["auditoria_alcaldias"] = gua.get("auditoria_gobiernos", [])
gua["top_megaproyectos_auditados"] = gua.get("megaproyectos_auditados", [])

with open(guaduas_path, "w", encoding="utf-8") as f:
    json.dump(gua, f, ensure_ascii=False, indent=2)

print("intelligence_guaduas.json actualizado exitosamente.")
