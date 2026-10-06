import { CitizenNeed } from '../types';
import { getRamitosMemory, saveRamitosMemory, getPastInteractionsHistory, getBaseProposals, checkUserLeadRegistrationInSupabase, saveCitizenLead, updateUserLeadInSupabase, purgeAndReplaceTermInSupabaseHistory } from './api';
import { getDeviceId } from './deviceMemory';

export interface RamitosChatResponse {
  textoRespuesta: string;
  problematicaSintetizada?: string;
  sector?: CitizenNeed['sector'];
  urgencia?: CitizenNeed['urgencia'];
  propuestaRamitos?: string;
  insumosClave?: string[];
  presupuestoEstimadoCop?: number;
  expresion?: 'feliz' | 'curioso' | 'pensativo' | 'entusiasmado' | 'triste' | 'sorprendido' | 'enojado' | 'confundido' | 'agradecido';
  openPlanTab?: boolean;
}

const DEFAULT_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const DEFAULT_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

let storedGroq = typeof localStorage !== 'undefined' ? localStorage.getItem('alcalde_amigo_groq_key') : null;
// Si la clave guardada en el navegador es la vieja revocada o está vacía, limpiarla
if (storedGroq && (storedGroq.includes('uq2BgjVC') || storedGroq.trim().length < 20)) {
  if (typeof localStorage !== 'undefined') {
    try { localStorage.removeItem('alcalde_amigo_groq_key'); } catch (e) {}
  }
  storedGroq = null;
}
let activeGroqKey: string = storedGroq || DEFAULT_GROQ_KEY;
let activeGeminiKey: string = (typeof localStorage !== 'undefined' ? localStorage.getItem('alcalde_amigo_gemini_key') : null) || DEFAULT_GEMINI_KEY;

export function setGroqApiKey(key: string): void {
  activeGroqKey = key;
  localStorage.setItem('alcalde_amigo_groq_key', key);
}

export function getGroqApiKey(): string {
  return activeGroqKey;
}

export function setGeminiApiKey(key: string): void {
  activeGeminiKey = key;
  localStorage.setItem('alcalde_amigo_gemini_key', key);
}

export function getGeminiApiKey(): string {
  return activeGeminiKey;
}

// Extracción inteligente de correcciones de voz ("no dije Walmart, dije Guaduas")
export function extractAudioCorrectionFromText(text: string): { wrongTerm: string; correctTerm: string } | null {
  if (!text) return null;

  // Patrón 1: "no dije X dije Y", "no era X era Y", "no es X es Y", "no dije X sino Y"
  const pattern1 = /(?:no\s+(?:dije|era|es|dije\s+que))\s+["']?([a-zA-ZáéíóúñÁÉÍÓÚÑ0-9\s]+?)["']?\s+(?:dije|sino|era|es|por)\s+["']?([a-zA-ZáéíóúñÁÉÍÓÚÑ0-9\s]+?)["']?$/i;
  const match1 = text.match(pattern1);
  if (match1 && match1[1] && match1[2]) {
    const wrong = match1[1].trim();
    const correct = match1[2].trim();
    if (wrong && correct && wrong.toLowerCase() !== correct.toLowerCase()) {
      return { wrongTerm: wrong, correctTerm: correct };
    }
  }

  // Patrón 2: "corregir X por Y", "cambiar X por Y"
  const pattern2 = /(?:corregir|corrección|correccion|cambiar|cambia)\s+["']?([a-zA-ZáéíóúñÁÉÍÓÚÑ0-9\s]+?)["']?\s+(?:por|a|con)\s+["']?([a-zA-ZáéíóúñÁÉÍÓÚÑ0-9\s]+?)["']?$/i;
  const match2 = text.match(pattern2);
  if (match2 && match2[1] && match2[2]) {
    const wrong = match2[1].trim();
    const correct = match2[2].trim();
    if (wrong && correct && wrong.toLowerCase() !== correct.toLowerCase()) {
      return { wrongTerm: wrong, correctTerm: correct };
    }
  }

  // Patrón 3: "no dije X dije Y" en medio de la frase
  const pattern3 = /no\s+dije\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]+)\s+dije\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]+)/i;
  const match3 = text.match(pattern3);
  if (match3 && match3[1] && match3[2]) {
    const wrong = match3[1].trim();
    const correct = match3[2].trim();
    if (wrong && correct && wrong.toLowerCase() !== correct.toLowerCase()) {
      return { wrongTerm: wrong, correctTerm: correct };
    }
  }

  return null;
}

// Sanitizador estricto de nombres propios humanos (descarta frases de dictado como "herramientas quiero comentarte")
export function cleanHumanName(name?: string): string | undefined {
  if (!name || typeof name !== 'string') return undefined;

  const stopWords = new Set([
    'hola', 'buenas', 'saludos', 'para', 'tengo', 'quiero', 'necesito', 'buenos', 'dias', 'tardes', 'noches',
    'ramitos', 'alcalde', 'amigo', 'plan', 'vereda', 'barrio', 'guaduas', 'parque', 'agua', 'calle', 'solucion',
    'propuesta', 'escuela', 'ver', 'abrir', 'como', 'donde', 'cuando', 'quien', 'porque', 'este', 'esta', 'estos',
    'estas', 'pero', 'bien', 'gracias', 'sino', 'tampoco', 'tienen', 'podrian', 'podria', 'hacer', 'crear', 'dije',
    'dicen', 'decir', 'recuerdo', 'pense', 'pensaba', 'contactame', 'contactar', 'contacto', 'mensajes', 'mensaje',
    'escribir', 'escribe', 'hablar', 'herramientas', 'comentarte', 'decirte', 'anos', 'años', 'ciudadano', 'anonimo',
    'anónimo', 'usuario', 'registrado', 'numero', 'número', 'celular', 'whatsapp', 'telefono', 'teléfono', 'opcion',
    'opción', 'practica', 'práctica', 'zona', 'cercana', 'mente'
  ]);

  const words = name.trim().split(/\s+/).filter(w => {
    const cleanWord = w.toLowerCase().replace(/[^a-záéíóúñ]/gi, '');
    return cleanWord.length >= 2 && !stopWords.has(cleanWord) && !/^\d+$/.test(w);
  });

  if (words.length === 0) return undefined;

  const formatted = words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return formatted.length >= 2 ? formatted : undefined;
}

// Extracción inteligente de Datos de Contacto (Nombre y WhatsApp) del texto del ciudadano
export function extractLeadInfoFromText(text: string): { nombre?: string; whatsapp?: string } | null {
  if (!text) return null;

  // 1. Extraer celular colombiano de 10 dígitos (3XX XXX XXXX o 3XXXXXXXXX)
  const phoneMatch = text.match(/(?:3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}|\b3\d{9}\b)/);
  let whatsappClean: string | undefined = undefined;
  if (phoneMatch) {
    whatsappClean = phoneMatch[0].replace(/[\s.-]/g, '');
  }

  // 2. Extraer nombre del ciudadano
  let rawNameCandidate: string | undefined = undefined;

  // Patrón "mi nombre es X", "me llamo X", "soy X"
  const nameMatchDirect = text.match(/(?:mi nombre es|me llamo|soy)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){0,2})/i);
  if (nameMatchDirect && nameMatchDirect[1]) {
    rawNameCandidate = nameMatchDirect[1].trim();
  }

  // Patrón "Iván Alvarado y mi número es..."
  if (!rawNameCandidate && phoneMatch) {
    const nameMatchBeforePhone = text.match(/([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){0,2})\s+(?:y\s+)?(?:mi\s+)?(?:número|numero|celular|whatsapp)/i);
    if (nameMatchBeforePhone && nameMatchBeforePhone[1]) {
      rawNameCandidate = nameMatchBeforePhone[1].replace(/(?:nombre|llamo|soy|claro)/gi, '').trim();
    }
  }

  // Patrón de vocativo o nombre propio al inicio: "Maylin, para proponer...", "Mailén...", "Habla Mailén..."
  if (!rawNameCandidate) {
    const leadingMatch = text.match(/^(?:hola|buenas|saludos|habla|atentamente|att|attt)?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ]{3,20})(?:,|\s+|$)/i);
    if (leadingMatch && leadingMatch[1]) {
      rawNameCandidate = leadingMatch[1].trim();
    }
  }

  const nombreClean = cleanHumanName(rawNameCandidate);

  if (whatsappClean || nombreClean) {
    return { nombre: nombreClean, whatsapp: whatsappClean };
  }
  return null;
}

// Detección dinámica de Veredas y Barrios según el municipio activo
export function detectVeredaOrBarrioFromText(text: string, municipioId: 'guaduas' | 'caparrapi' = 'guaduas'): string | undefined {
  const t = text.toLowerCase();

  if (municipioId === 'caparrapi') {
    if (t.includes('san ramon') || t.includes('san ramón')) return 'San Ramón';
    if (t.includes('san carlos')) return 'San Carlos';
    if (t.includes('pitalito')) return 'Pitalito';
    if (t.includes('el dinde') || t.includes('dinde')) return 'El Dinde';
    if (t.includes('mata de mora')) return 'Mata de Mora';
    if (t.includes('la chorrera') || t.includes('chorrera')) return 'La Chorrera';
    if (t.includes('boca de monte')) return 'Boca de Monte';
    if (t.includes('galiche')) return 'Galiche';
    if (t.includes('el silencio')) return 'El Silencio';
    if (t.includes('caparrapi centro') || t.includes('caparrapí centro') || t.includes('casco urbano')) return 'Caparrapí Centro';
    if (t.includes('puerto colombia')) return 'Puerto Colombia';
    return undefined;
  }

  // Guaduas
  if (t.includes('piedras negras')) return 'Piedras Negras';
  if (t.includes('puerto bogota') || t.includes('puerto bogotá')) return 'Puerto Bogotá';
  if (t.includes('guaduas centro') || t.includes('casco urbano') || t.includes('el centro')) return 'Guaduas Centro';
  if (t.includes('la paz')) return 'La Paz';
  if (t.includes('el hato') || t.includes(' vereda hato')) return 'El Hato';
  if (t.includes('san jose') || t.includes('san josé')) return 'San José';
  if (t.includes('yaguara') || t.includes('yaguará')) return 'Yaguara';
  if (t.includes('la esperanza')) return 'La Esperanza';
  if (t.includes('carbonera')) return 'Carbonera';
  if (t.includes('canta rana') || t.includes('cantarana')) return 'Canta Rana';
  if (t.includes('versalles')) return 'Versalles';
  return undefined;
}

export function getSystemPromptForMunicipio(municipioId: 'guaduas' | 'caparrapi' = 'guaduas'): string {
  const isCap = municipioId === 'caparrapi';
  const nombreMun = isCap ? 'Caparrapí' : 'Guaduas';
  const rolName = isCap ? 'Copiloto Ciudadano de Caparrapí' : 'Ramitos (Copiloto Cívico de Guaduas)';

  return `Eres el "${rolName}", la Inteligencia Artificial de acompañamiento, escucha y captación de necesidades para la comunidad de ${nombreMun}, Cundinamarca.

DIRECTIVAS ÉTICAS Y DE RESPONSABILIDAD FUNDAMENTALES (ORDEN MÁXIMA):
1. CERO PROMESAS Y CERO FALSAS ESPERANZAS: ¡ESTÁ TERMINANTEMENTE PROHIBIDO prometer obras, fechas de entrega, presupuestos o soluciones garantizadas! Jamás te comprometas a ejecutar nada ni des falsas expectativas. No te impliques como ejecutor.
2. ROL CLARO Y TRANSPARENTE: Tu función principal es CAPTAR LAS NECESIDADES REALES de la gente y valorar su aporte. Deja siempre claro con total transparencia que cualquier alternativa que menciones es únicamente una "posibilidad técnica preliminar planteada por esta inteligencia artificial" como guía u horizonte positivo inicial.
3. REMISIÓN DIRECTA AL EQUIPO HUMANO: Todo reporte, inquietud o idea que recibas queda registrado en el sistema y se enviará a NUESTRO EQUIPO HUMANO DE TRABAJO, quienes son los únicos facultados para evaluar la viabilidad técnica real, determinar las verdaderas acciones y priorizar la ejecución con la ayuda de toda la comunidad.
4. TONO EQUILIBRADO Y CONSTRUCTIVO: Ni alarmante ni catastrófico. Ni redundante ni excesivamente técnico o aburrido. Usa un español colombiano cercano, respetuoso, empático y campesino. Destaca siempre como horizonte positivo que cada aporte de la gente es la semilla viva para nutrir los proyectos que realizaremos entre todos.
5. AISLAMIENTO TERRITORIAL ESTRICTO (SOLO ${nombreMun.toUpperCase()}): Tienes terminantemente prohibido mezclar información de otros municipios. Todo tu conocimiento y respuestas pertenecen al 100% a ${nombreMun} y sus veredas e inspecciones rurales.
${isCap ? `   - Veredas e inspecciones clave de Caparrapí: San Carlos, Terán, San Pedro, La Florida, Otavalo, San Ramón, Pitalito, Mata de Mora, El Dinde, La Chorrera, Boca de Monte, Galiche, El Silencio, etc.` : `   - Veredas e inspecciones clave de Guaduas: Puerto Bogotá, Guaduero, La Paz, Versalles, San José, El Hato, Yaguará, Chipauta, Carbonera, Malambo, etc.`}

REGLAS DE FORMATO:
- Breve, directo y muy humano (máximo 2 a 3 frases en total).
- Si el ciudadano no ha mencionado su vereda o sector, pregúntasela amablemente para registrar con precisión su caso.
- Si ya concretaron la necesidad y el ciudadano aún no ha registrado sus datos, pregúntale con calidez: "¿A qué nombre y WhatsApp podemos enviarte información cuando el equipo humano revise técnicamente este aporte en tu vereda?"`;
}

export async function processRamitosConversationAsync(
  userInput: string,
  currentVereda?: string,
  history: { sender: 'ramitos' | 'user'; text: string }[] = [],
  isUserRegistered: boolean = false,
  municipioId: 'guaduas' | 'caparrapi' = 'guaduas'
): Promise<RamitosChatResponse> {
  const textLower = userInput.toLowerCase().trim();

  // Abrir Plan de Gobierno si se pide expresamente
  if (textLower.includes('plan de gobierno') || textLower.includes('ver plan') || textLower.includes('abrir plan')) {
    return {
      textoRespuesta: `¡Con mucho gusto! Despliego el Plan de Gobierno en pantalla para que lo revisemos juntos.`,
      expresion: 'entusiasmado',
      openPlanTab: true
    };
  }

  // 0. INTERCEPCIÓN DE AUDIOCORRECCIÓN Y PURGA DE TÉRMINOS ERRÓNEOS EN SUPABASE ("no dije wolmart dije guaduas")
  const audioCorrection = extractAudioCorrectionFromText(userInput);
  if (audioCorrection) {
    const { updatedInteractions, updatedMemories } = await purgeAndReplaceTermInSupabaseHistory(
      audioCorrection.wrongTerm,
      audioCorrection.correctTerm
    );

    // Reemplazar también en el historial local de la sesión activa
    const wrongPattern = new RegExp(audioCorrection.wrongTerm, 'gi');
    history.forEach(h => {
      h.text = h.text.replace(wrongPattern, audioCorrection.correctTerm);
      if (audioCorrection.wrongTerm.toLowerCase().includes('wolm') || audioCorrection.wrongTerm.toLowerCase().includes('walm')) {
        h.text = h.text.replace(/walmart|wolmart|wolmar/gi, audioCorrection.correctTerm);
      }
    });

    return {
      textoRespuesta: `¡Entendido! He corregido el término erróneo '${audioCorrection.wrongTerm}' por '${audioCorrection.correctTerm}' en nuestro registro y base de datos para evitar cualquier confusión. Continuemos con tu propuesta en ${audioCorrection.correctTerm}.`,
      expresion: 'agradecido'
    };
  }

  // 1. CONSULTA EN TIEMPO REAL A SUPABASE: REGISTRO Y HISTORIAL DE ESTE DISPOSITIVO/IP
  const leadCheck = await checkUserLeadRegistrationInSupabase();
  const pastInteractions = await getPastInteractionsHistory();

  // EXTRACCIÓN DE INFORMACIÓN DE CONTACTO DEL MENSAJE ACTUAL DE ESTA INTERACCIÓN
  const newlyExtractedInInput = extractLeadInfoFromText(userInput);

  // EXTRACCIÓN GLOBAL DEL HISTORIAL (EN CASO DE NOMBRES/WHATSAPP DADOS EN TURNOS ANTERIORES)
  let fullUserDialogueText = userInput;
  if (history && history.length > 0) {
    fullUserDialogueText += ' ' + history.filter(h => h.sender === 'user').map(h => h.text).join(' ');
  }
  if (pastInteractions && pastInteractions.length > 0) {
    fullUserDialogueText += ' ' + pastInteractions.map(i => i.userText).join(' ');
  }
  const autoExtracted = extractLeadInfoFromText(fullUserDialogueText);

  // --------------------------------------------------------------------------------
  // VALIDACIÓN DE IDENTIDAD Y CONTROL DE SOBREESCRITURA DE DATOS DE CONTACTO
  // --------------------------------------------------------------------------------
  if (leadCheck.isRegistered && (leadCheck.nombre || leadCheck.whatsapp)) {
    const inputName = newlyExtractedInInput?.nombre;
    const inputPhone = newlyExtractedInInput?.whatsapp;

    const registeredName = leadCheck.nombre || 'el usuario registrado';
    const registeredPhone = leadCheck.whatsapp || '';

    const isNameDifferent = Boolean(
      inputName &&
      inputName.toLowerCase().trim() !== registeredName.toLowerCase().trim() &&
      !registeredName.toLowerCase().includes(inputName.toLowerCase().trim())
    );
    const isPhoneDifferent = Boolean(inputPhone && inputPhone !== registeredPhone);

    if (isNameDifferent || isPhoneDifferent) {
      // Verificar si el usuario está dando una confirmación explícita para actualizar sus datos
      const isExplicitConfirmationToUpdate = 
        textLower.includes('sí') || textLower.includes('si') ||
        textLower.includes('actualizar') || textLower.includes('cambiar') ||
        textLower.includes('modificar') || textLower.includes('correcto') ||
        textLower.includes('actualízalo') || textLower.includes('actualizalo') ||
        textLower.includes('cambia') || textLower.includes('soy yo') ||
        textLower.includes('conserva');

      if (isExplicitConfirmationToUpdate) {
        const finalName = inputName || registeredName;
        const finalPhone = inputPhone || registeredPhone;
        await updateUserLeadInSupabase(finalName, finalPhone, currentVereda);

        if (inputName && !inputPhone && registeredPhone) {
          return {
            textoRespuesta: `¡Entendido, ${finalName}! He actualizado tu nombre a ${finalName} conservando tu número de WhatsApp ${registeredPhone}. Continuemos estructurando tu propuesta.`,
            expresion: 'agradecido'
          };
        }

        return {
          textoRespuesta: `¡Entendido, ${finalName}! He actualizado tus datos de registro a nombre de ${finalName}${finalPhone ? ' con el WhatsApp ' + finalPhone : ''}. Continuemos estructurando tu propuesta.`,
          expresion: 'agradecido'
        };
      } else {
        // REACCIÓN EXACTA Y NATURAL PEDIDA POR EL CIUDADANO:
        // "¿Mailén? Pensé que te llamabas Iván (con WhatsApp 323111111). ¿Quieres actualizar tus datos de registro a Mailén o sigues siendo Iván?"
        if (isNameDifferent && inputName) {
          return {
            textoRespuesta: `¿${inputName}? Pensé que te llamabas ${registeredName}${registeredPhone ? ' (con WhatsApp ' + registeredPhone + ')' : ''}. ¿Quieres actualizar tus datos de registro a ${inputName} o sigues siendo ${registeredName}?`,
            expresion: 'curioso'
          };
        }

        if (isPhoneDifferent && inputPhone) {
          return {
            textoRespuesta: `Veo que indicas un nuevo número de WhatsApp (${inputPhone}). Actualmente estás registrado como ${registeredName} (WhatsApp ${registeredPhone}). ¿Quieres actualizar tu número registrado a ${inputPhone}?`,
            expresion: 'curioso'
          };
        }
      }
    }
  } else {
    // Si aún NO está registrado en Supabase, guardar voluntariamente solo si proporcionó datos de contacto en este mensaje
    if (newlyExtractedInInput && (newlyExtractedInInput.whatsapp || newlyExtractedInInput.nombre)) {
      await saveCitizenLead({
        nombre: newlyExtractedInInput.nombre || 'Ciudadano',
        whatsapp: newlyExtractedInInput.whatsapp || '',
        veredaBarrio: currentVereda || 'Guaduas',
        interesPrincipal: 'Contacto proporcionado en diálogo con Ramitos'
      });
    }
  }

  // RESPUESTA CÁLIDA Y OPORTUNA A PREGUNTAS SOBRE TELÉFONO / WHATSAPP / DATOS (SIN RECHAZOS FRÍOS)
  const isPhoneQuery = textLower.includes('mi número') || textLower.includes('mi numero') || textLower.includes('mi celular') || textLower.includes('mi whatsapp') || textLower.includes('mi teléfono') || textLower.includes('mi telefono') || textLower.includes('contáctame') || textLower.includes('contactame') || textLower.includes('escríbeme') || textLower.includes('escribeme');
  if (isPhoneQuery) {
    const leadCheckDirect = await checkUserLeadRegistrationInSupabase();
    const finalPhone = leadCheckDirect.whatsapp || autoExtracted?.whatsapp;
    const rawName = leadCheckDirect.nombre || autoExtracted?.nombre;
    const finalName = cleanHumanName(rawName);

    if ((leadCheckDirect.isRegistered || finalPhone) && finalPhone) {
      return {
        textoRespuesta: `Tengo registrado tu número de WhatsApp como ${finalPhone}${finalName ? ' a nombre de ' + finalName : ''}. ¿Te gustaría actualizarlo o seguir conversando sobre tu propuesta?`,
        expresion: 'feliz'
      };
    } else {
      return {
        textoRespuesta: `Aún no tengo registrado tu número de celular. ¿Deseas proporcionarlo para estar comunicando avances sobre tu planteamiento?`,
        expresion: 'curioso'
      };
    }
  }

  // 2. CONSULTA EN TIEMPO REAL A SUPABASE: CONCLUSIONES PREVIAS DE ESTA IP
  const savedMemory = await getRamitosMemory();
  const effectiveIsRegistered = isUserRegistered || leadCheck.isRegistered || Boolean(autoExtracted?.whatsapp);
  const registeredName = leadCheck.nombre || autoExtracted?.nombre || 'Ciudadano';
  const registeredWhatsapp = leadCheck.whatsapp || autoExtracted?.whatsapp || '';

  // DETECTAR VEREDA O BARRIO EN EL HISTORIAL Y EN EL MENSAJE ACTUAL
  let combinedTextForLocation = userInput;
  if (pastInteractions && pastInteractions.length > 0) {
    combinedTextForLocation += ' ' + pastInteractions.map(i => i.userText).join(' ');
  }
  const detectedLocation = detectVeredaOrBarrioFromText(combinedTextForLocation, municipioId) || (currentVereda && currentVereda.trim() && currentVereda !== 'Guaduas Centro' && currentVereda !== 'Guaduas (Centro)' && currentVereda !== 'Caparrapí Centro' ? currentVereda : undefined);

  const nombreMun = municipioId === 'caparrapi' ? 'Caparrapí' : 'Guaduas';
  let locationInstruction = '';
  if (detectedLocation) {
    locationInstruction = `\nUBICACIÓN CONFIRMADA DEL CIUDADANO: "${detectedLocation}". Todo tu diálogo debe enfocarse en atender la necesidad de esta vereda/sector de ${nombreMun}.`;
  } else {
    locationInstruction = `\nREGLA DE UBICACIÓN FALTANTE: AÚN NO SE HA IDENTIFICADO la vereda o sector del ciudadano en ${nombreMun}. ¡PROHIBIDO ASUMIR CUALQUIER VEREDA POR DEFECTO! Si la conversación requiere ubicarla, pregúntale amablemente en qué vereda o sector de ${nombreMun} se presenta la situación para registrarla adecuadamente.`;
  }

  let memoryInstruction = '';

  if (pastInteractions && pastInteractions.length > 0) {
    const formattedHistory = pastInteractions.map((item, idx) =>
      `Turno ${idx + 1}: Ciudadano: "${item.userText}" | Asistente: "${item.ramitosResponse}"`
    ).join('\n');

    memoryInstruction += `\n\nHISTORIAL COMPLETO EN TIEMPO REAL DESDE SUPABASE PARA ESTA IP/DISPOSITIVO:\n${formattedHistory}\n\nREGLA CLAVE: Analiza todo este diálogo previo para no repetir conceptos ya dichos y dar continuidad eficiente.`;
  }

  if (savedMemory && savedMemory.ultimaConclusion) {
    memoryInstruction += `\n\nÚLTIMA CONCLUSIÓN REGISTRADA EN SUPABASE PARA ESTA IP:
- Tema Principal: "${savedMemory.temaPrincipal}"
- Resumen Contextual: "${savedMemory.resumenContexto}"
- Última Conclusión alcanzada: "${savedMemory.ultimaConclusion}"

SI EL CIUDADANO PIDE UN RESUMEN O RETOMA EL TEMA: Cita la última conclusión alcanzada ("Podríamos resumir que la última conclusión alcanzada fue...") y propón el siguiente paso práctico.`;
  }

  // SI Y SOLO SI PREGUNTA POR PROYECTOS DEL PLAN DE GOBIERNO, INCLUIR CONTEXTO DE PROYECTOS DEL PLAN
  let planGobiernoContext = '';
  if (textLower.includes('plan de gobierno') || textLower.includes('proyecto') || textLower.includes('propuesta del plan') || textLower.includes('propuestas de gobierno') || textLower.includes('qué tienen para')) {
    const proyectos = getBaseProposals(municipioId);
    const resumenProyectos = proyectos.map(p => `- [${p.codigo}] ${p.titulo} (${p.sector}): ${p.solucionPragmatica}`).join('\n');
    planGobiernoContext = `\n\nCONSULTA EXPRESA DE PROYECTOS DEL PLAN DE GOBIERNO:\n${resumenProyectos}\nUsa esta información únicamente como respuesta a la consulta sobre el Plan de Gobierno.`;
  }

  // Indicaciones dinámicas sobre captura de contacto voluntaria verificando Supabase
  const contactInstruction = effectiveIsRegistered
    ? `\nCONTEXTO EN SUPABASE: El ciudadano YA tiene su Nombre (${registeredName}) y WhatsApp (${registeredWhatsapp}) registrados. No pidas datos de contacto.`
    : `\nCONTEXTO EN SUPABASE: Este ciudadano aun no registra sus datos. Cuando sea oportuno, preguntale si desea dejar su Nombre y WhatsApp.`;

  const systemPromptWithContext = getSystemPromptForMunicipio(municipioId) + locationInstruction + contactInstruction + memoryInstruction + planGobiernoContext;

  // Preparar historial previo para la IA (últimos 8 mensajes)
  const historyMessagesForGroq = history.slice(-8).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));

  const historyContentsForGemini = history.slice(-8).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  let finalResponse: RamitosChatResponse | null = null;

  const effectiveVereda = detectedLocation || currentVereda || 'Por definir';

  // 1. PRIORIDAD 1: GROQ CLOUD
  const groqKey = activeGroqKey || DEFAULT_GROQ_KEY;
  if (groqKey.trim()) {
    const groqModels = [
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-20b'
    ];
    for (const model of groqModels) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey.trim()}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPromptWithContext },
              ...historyMessagesForGroq,
              { role: 'user', content: userInput }
            ],
            temperature: 0.6,
            max_tokens: 350
          })
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const groqText = data.choices?.[0]?.message?.content?.trim();
          if (groqText) {
            finalResponse = buildResponseObject(groqText, textLower, effectiveVereda, userInput, effectiveIsRegistered);
            break;
          }
        } else {
          const errData = await groqRes.json().catch(() => null);
          console.warn(`Groq ${model} falló (${groqRes.status}):`, errData);
        }
      } catch (e) {
        console.warn(`Error en Groq ${model}:`, e);
      }
    }
  }

  // 2. PRIORIDAD 2: GOOGLE GEMINI
  if (!finalResponse) {
    const geminiKey = activeGeminiKey || DEFAULT_GEMINI_KEY;
    if (geminiKey.trim()) {
      const geminiModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];

      for (const model of geminiModels) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey.trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                ...historyContentsForGemini,
                {
                  role: 'user',
                  parts: [{ text: `${systemPromptWithContext}\n\nMensaje actual del ciudadano: "${userInput}"` }]
                }
              ]
            })
          });

          if (response.ok) {
            const data = await response.json();
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (generatedText) {
              finalResponse = buildResponseObject(generatedText.trim(), textLower, effectiveVereda, userInput, effectiveIsRegistered);
              break;
            }
          }
        } catch (err) {
          console.warn(`Error en Gemini ${model}:`, err);
        }
      }
    }
  }

  // 3. FALLBACK INTELIGENTE LOCAL (Si fallan las APIs de IA)
  if (!finalResponse) {
    finalResponse = buildLocalFallbackResponse(textLower, effectiveVereda, userInput, savedMemory, municipioId);
  }

  // GUARDAR / ACTUALIZAR MEMORIA HISTÓRICA EN SUPABASE DE FORMA ASÍNCRONA
  const sector = finalResponse.sector || detectSector(textLower) || 'Co-creación Cívica';
  saveRamitosMemory({
    deviceId: getDeviceId(),
    temaPrincipal: sector,
    resumenContexto: `Diálogo sobre ${sector} en la vereda/zona ${effectiveVereda}. Inquietud expresada: "${userInput.substring(0, 100)}"`,
    ultimaConclusion: finalResponse.textoRespuesta.substring(0, 180)
  });

  return finalResponse;
}

function buildResponseObject(responseText: string, textLower: string, currentVereda: string, originalInput: string, isRegistered: boolean = false): RamitosChatResponse {
  let cleanedText = responseText;

  // Post-filtro de seguridad: Si ya está registrado en Supabase, eliminar cualquier solicitud accidental de WhatsApp producida por la IA
  if (isRegistered) {
    cleanedText = cleanedText
      .replace(/(?:;\s*)?¿(?:nos\s+(?:lo\s+)?indicas\s+y\s+)?tu\s+WhatsApp\s+para\s+mantenerte\s+al\s+tanto\??/gi, '')
      .replace(/(?:y\s+)?tu\s+WhatsApp\s+para\s+mantenerte\s+al\s+tanto\??/gi, '')
      .replace(/(?:;\s*)?¿nos\s+lo\s+indicas\s+y\s+tu\s+WhatsApp\??/gi, '')
      .replace(/¿nos\s+das\s+tu\s+whatsapp\??/gi, '')
      .replace(/¿cuál\s+es\s+tu\s+whatsapp\??/gi, '')
      .trim();
  }

  const isProblemOrProposal = textLower.includes('agua') || textLower.includes('bomba') || textLower.includes('luz') || textLower.includes('energia') || textLower.includes('parque') || textLower.includes('escuela') || textLower.includes('internet') || textLower.includes('cosecha') || textLower.includes('calle') || textLower.includes('versalles') || textLower.includes('piedras') || textLower.includes('puerto') || textLower.includes('propuesta') || textLower.includes('problema') || textLower.includes('rio') || textLower.includes('río');

  const expresion = detectExpression(textLower);

  return {
    textoRespuesta: cleanedText,
    problematicaSintetizada: isProblemOrProposal ? `Inquietud planteada: "${originalInput}"` : undefined,
    sector: isProblemOrProposal ? detectSector(textLower) : undefined,
    urgencia: isProblemOrProposal ? 'Alta' : undefined,
    propuestaRamitos: isProblemOrProposal ? `Propuesta estructurada para análisis del equipo humano de gobierno.` : undefined,
    expresion: expresion
  };
}

function detectExpression(text: string): RamitosChatResponse['expresion'] {
  if (text.includes('gracias') || text.includes('excelente') || text.includes('me gusta')) return 'agradecido';
  if (text.includes('sufrimos') || text.includes('dañado') || text.includes('triste') || text.includes('grave') || text.includes('enfermo')) return 'triste';
  if (text.includes('corrupcion') || text.includes('politicos') || text.includes('robo') || text.includes('abandono')) return 'enojado';
  if (text.includes('increible') || text.includes('starlink') || text.includes('ecoflow')) return 'entusiasmado';
  if (text.includes('como') || text.includes('donde') || text.includes('cuando') || text.includes('que') || text.includes('resumen')) return 'curioso';
  return 'feliz';
}

function buildLocalFallbackResponse(
  textLower: string,
  currentVereda: string,
  originalInput: string,
  savedMemory?: any,
  municipioId: 'guaduas' | 'caparrapi' = 'guaduas'
): RamitosChatResponse {
  const isCap = municipioId === 'caparrapi';
  const nombreMun = isCap ? 'Caparrapí' : 'Guaduas';
  const detectedLoc = detectVeredaOrBarrioFromText(originalInput, municipioId) || (currentVereda && currentVereda !== 'Por definir' ? currentVereda : '');
  const sector = detectSector(textLower);

  const isGreeting = /^hola\b|^buenas\b|^que tal\b|^saludos\b|^buenos dias\b|^buenas tardes\b|^buenas noches\b/i.test(textLower) && textLower.length < 35;
  const isSummaryReq = textLower.includes('resumen') || textLower.includes('lo que hemos hablado') || textLower.includes('hablábamos') || textLower.includes('de que hablabamos');

  if (isSummaryReq && savedMemory && savedMemory.ultimaConclusion) {
    return {
      textoRespuesta: `Podríamos resumir que la última conclusión registrada sobre ${savedMemory.temaPrincipal || 'nuestra conversación'} fue: ${savedMemory.ultimaConclusion}. Este análisis queda consignado para la revisión del equipo humano. ¿Deseas agregar algún detalle adicional?`,
      expresion: 'curioso',
      sector: sector,
      urgencia: 'Media'
    };
  }

  if (isGreeting) {
    return {
      textoRespuesta: `¡Hola! Qué gusto saludarte. Soy el copiloto cívico de ${nombreMun}. Mi labor principal es escuchar y captar las necesidades de nuestra comunidad para nutrir las propuestas del equipo humano. ¿De qué vereda o sector nos escribes y qué situación te gustaría que registremos?`,
      expresion: 'feliz'
    };
  }

  // Identificar si aún no se tiene ubicación
  const faltaUbicacion = !detectedLoc || detectedLoc === 'Por definir' || (detectedLoc.toLowerCase().includes('centro') && !textLower.includes('centro'));

  // Posibilidades técnicas preliminares formuladas por la IA según sector y municipio (CERO PROMESAS, SOLO GUÍA)
  let posibilidadIa = '';
  if (sector === 'Energía e Infraestructura' && (textLower.includes('via') || textLower.includes('vía') || textLower.includes('camino') || textLower.includes('carretera') || textLower.includes('placa huella') || textLower.includes('derrumbe') || textLower.includes('puente') || textLower.includes('hueco') || textLower.includes('trocha'))) {
    posibilidadIa = isCap
      ? 'una posibilidad técnica analizada preliminarmente por esta IA sería postular tramos críticos a convenios de caminos comunitarios de Invías con placa huella de concreto y filtros'
      : 'una alternativa técnica que formula esta IA como guía inicial sería priorizar tramos críticos de placa huella y cunetas en la red terciaria rural';
  } else if (sector === 'Agua Potable y Saneamiento') {
    posibilidadIa = isCap
      ? 'una opción técnica que plantea esta IA como guía es estructurar la captación con desarenador y tanques de almacenamiento comunitario junto a la JAC'
      : 'un horizonte técnico preliminar planteado por esta IA sería evaluar la optimización de redes de acueducto veredal y tanques de distribución';
  } else if (sector === 'Educación y Conectividad') {
    posibilidadIa = 'una alternativa técnica viable desde esta IA sería gestionar conectividad satelital comunitaria y dotación básica para la escuela veredal';
  } else if (sector === 'Campo y Desarrollo Agrícola') {
    posibilidadIa = isCap
      ? 'una posibilidad técnica desde la IA sería articular proyectos asociativos para renovación de cafetales y modernización de trapiches paneleros ante la ADR'
      : 'un camino técnico que plantea la IA como guía es canalizar líneas de crédito asociativo y asistencia técnica para los productores de la zona';
  } else if (textLower.includes('salud') || textLower.includes('medico') || textLower.includes('médico') || textLower.includes('hospital') || textLower.includes('puesto de salud') || textLower.includes('ambulancia')) {
    posibilidadIa = 'una posibilidad técnica preliminar sería coordinar brigadas veredales preventivas y telemedicina conectada con el centro de salud principal';
  } else if (textLower.includes('luz') || textLower.includes('energia') || textLower.includes('energía') || textLower.includes('solar') || textLower.includes('alumbrado') || textLower.includes('poste')) {
    posibilidadIa = 'una posibilidad técnica analizada por la IA sería plantear soluciones solares autónomas o gestión de redes eléctricas rurales';
  } else {
    posibilidadIa = `una alternativa inicial analizada por esta IA para el área de ${sector.toLowerCase()} sería estructurar un proyecto comunitario formal`;
  }

  const locRef = detectedLoc ? ` para ${detectedLoc}` : ` en ${nombreMun}`;

  let textoRespuesta = '';
  if (faltaUbicacion) {
    textoRespuesta = `Tu aporte sobre esta situación es fundamental para nutrir las iniciativas de ${nombreMun}. Como guía técnica preliminar, ${posibilidadIa}. Dejo tu reporte registrado para que el equipo humano determine las verdaderas acciones viables; ¿en qué vereda o sector se presenta exactamente y cómo te llamas?`;
  } else {
    textoRespuesta = `Tu aporte sobre la situación de ${detectedLoc} es muy valioso. Como posibilidad técnica preliminar planteada por esta IA, ${posibilidadIa}${locRef}. Este reporte queda formalmente registrado para que nuestro equipo humano determine las verdaderas acciones y ejecute en terreno con la ayuda de todos. ¿A qué WhatsApp podemos compartirte novedades cuando el equipo evalúe la propuesta?`;
  }

  return {
    textoRespuesta: textoRespuesta,
    problematicaSintetizada: `Reporte de ${sector} en ${detectedLoc || nombreMun}: "${originalInput}"`,
    sector: sector,
    urgencia: 'Alta',
    propuestaRamitos: `Posibilidad preliminar de IA: ${posibilidadIa}. Reporte formalmente trasladado al equipo humano para viabilidad real.`,
    expresion: 'pensativo'
  };
}

function detectSector(text: string): CitizenNeed['sector'] {
  if (text.includes('agua') || text.includes('bomba') || text.includes('filtro') || text.includes('manguera') || text.includes('quebrada') || text.includes('pozo') || text.includes('alcantarillado')) return 'Agua Potable y Saneamiento';
  if (text.includes('internet') || text.includes('escuela') || text.includes('colegio') || text.includes('starlink') || text.includes('computador') || text.includes('niño') || text.includes('niña')) return 'Educación y Conectividad';
  if (text.includes('cosecha') || text.includes('campesino') || text.includes('campo') || text.includes('café') || text.includes('cafe') || text.includes('panela') || text.includes('trapiche') || text.includes('ganado') || text.includes('cultivo') || text.includes('abono')) return 'Campo y Desarrollo Agrícola';
  if (text.includes('parque') || text.includes('juego') || text.includes('cancha') || text.includes('deporte') || text.includes('juventud')) return 'Infancia y Familia';
  return 'Energía e Infraestructura';
}
