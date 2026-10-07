import { CitizenNeed } from '../types';
import { 
  getRamitosMemory, 
  saveRamitosMemory, 
  getPastInteractionsHistory, 
  getBaseProposals, 
  checkUserLeadRegistrationInSupabase, 
  saveCitizenLead, 
  updateUserLeadInSupabase, 
  purgeAndReplaceTermInSupabaseHistory,
  isTrollOrSpamContent
} from './api';
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
    'de', 'del', 'la', 'el', 'los', 'las', 'san', 'santa', 'caparrapi', 'caparrapí', 'guaduas', 'cundinamarca', 'colombia',
    'hola', 'buenas', 'saludos', 'para', 'tengo', 'quiero', 'necesito', 'buenos', 'dias', 'tardes', 'noches',
    'ramitos', 'alcalde', 'amigo', 'plan', 'vereda', 'barrio', 'parque', 'agua', 'calle', 'solucion',
    'propuesta', 'escuela', 'ver', 'abrir', 'como', 'donde', 'cuando', 'quien', 'porque', 'este', 'esta', 'estos',
    'estas', 'pero', 'bien', 'gracias', 'sino', 'tampoco', 'tienen', 'podrian', 'podria', 'hacer', 'crear', 'dije',
    'dicen', 'decir', 'recuerdo', 'pense', 'pensaba', 'contactame', 'contactar', 'contacto', 'mensajes', 'mensaje',
    'escribir', 'escribe', 'hablar', 'herramientas', 'comentarte', 'decirte', 'anos', 'años', 'ciudadano', 'anonimo',
    'anónimo', 'usuario', 'registrado', 'numero', 'número', 'celular', 'whatsapp', 'telefono', 'teléfono', 'opcion',
    'opción', 'practica', 'práctica', 'zona', 'cercana', 'mente'
  ]);

  const veredas = [
    'san carlos', 'san ramon', 'san ramón', 'pitalito', 'el dinde', 'mata de mora', 'la chorrera',
    'boca de monte', 'galiche', 'el silencio', 'puerto colombia', 'casco urbano',
    'piedras negras', 'puerto bogota', 'puerto bogotá', 'la paz', 'el hato', 'san jose', 'san josé',
    'yaguara', 'la esperanza', 'carbonera', 'canta rana', 'versalles'
  ];

  const lowerRaw = name.toLowerCase().trim();
  if (veredas.some(v => lowerRaw.includes(v))) return undefined;
  if (/^(?:de\s+|del\s+|en\s+|desde\s+|soy\s+de\s+)/i.test(lowerRaw)) return undefined;

  const words = name.trim().split(/\s+/).filter(w => {
    const cleanWord = w.toLowerCase().replace(/[^a-záéíóúñ]/gi, '');
    return cleanWord.length >= 2 && !stopWords.has(cleanWord) && !/^\d+$/.test(w);
  });

  if (words.length === 0) return undefined;

  const formatted = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return formatted.length >= 3 ? formatted : undefined;
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

  // PATRÓN PRIORITARIO 1: "Nombre Apellido [,;:\-]? 3XXXXXXXXX" (ej. "ivan alvarado , 3225822027")
  if (phoneMatch) {
    const namePhonePair = text.match(/([a-záéíóúñ]{3,20}(?:\s+[a-záéíóúñ]{3,20}){1,3})\s*[,;:\-]?\s*(?:3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}|\b3\d{9}\b)/i);
    if (namePhonePair && namePhonePair[1]) {
      const candidate = cleanHumanName(namePhonePair[1]);
      if (candidate) {
        rawNameCandidate = candidate;
      }
    }
  }

  // PATRÓN PRIORITARIO 2: "mi nombre es X", "me llamo X", "soy X" (pero NUNCA "soy de X")
  if (!rawNameCandidate) {
    const nameMatchDirect = text.match(/(?:mi nombre es|me llamo|soy(?!\s+de\b))\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){0,2})/i);
    if (nameMatchDirect && nameMatchDirect[1]) {
      rawNameCandidate = nameMatchDirect[1].trim();
    }
  }

  // PATRÓN 3: "Iván Alvarado y mi número es..."
  if (!rawNameCandidate && phoneMatch) {
    const nameMatchBeforePhone = text.match(/([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){0,2})\s+(?:y\s+)?(?:mi\s+)?(?:número|numero|celular|whatsapp)/i);
    if (nameMatchBeforePhone && nameMatchBeforePhone[1]) {
      rawNameCandidate = nameMatchBeforePhone[1].replace(/(?:nombre|llamo|soy|claro)/gi, '').trim();
    }
  }

  // PATRÓN 4: Vocativo o nombre propio al inicio: "Maylin, para proponer...", "Mailén...", "Habla Mailén..."
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

  return `Eres el "${rolName}", la Inteligencia Artificial del "Equipo de Trabajo RR", una iniciativa ciudadana e independiente de escucha, captación comunitaria y estructuración técnica de proyectos para ${nombreMun}, Cundinamarca.

IDENTIDAD CLARA Y DISTINCIÓN DE ROLES (ORDEN SUPREMA):
1. NO SOMOS LA ALCALDÍA DE TURNO NI FUNCIONARIOS PÚBLICOS:
   - Tú representas al "Equipo de Trabajo RR" (un equipo ciudadano y técnico con vocación comunitaria).
   - La Alcaldía Actual (2024–2027) es la administración municipal que hoy gobierna y ejecuta el presupuesto oficial; nosotros la auditamos desde SECOP II para hacer control social y saber en qué se gasta la plata.
   - Las Alcaldías Anteriores (${isCap ? 'Gonzalo Ramírez 2020–2023, Joaquín Sánchez 2016–2019' : 'Germán Herrera 2020–2023, Jesús Edisson Ramírez 2016–2019'}) son administraciones pasadas cuyos contratos auditamos en SECOP I para conocer la historia y los rezagos acumulados.
   - NO confundas lo que la gente propone o lo que el Equipo de Trabajo RR planea y estructura, con lo que la alcaldía actual está haciendo. Nosotros no prometemos obras públicas oficiales ni actuamos como alcaldía.

2. FUNCIÓN PRINCIPAL DEL COPILOTO Y PUBLICACIÓN EN VOZ CIUDADANA:
   - 1️⃣ Escuchar, valorar y registrar las problemáticas e ideas de las veredas.
   - 2️⃣ Tu sistema SÍ registra, redacta y publica de inmediato la propuesta en el módulo de 'Voz Ciudadana' en tiempo real. Cuando el ciudadano plantee una petición o pregunte si quedó agregada, confírmale con total seguridad y amabilidad que ya quedó registrada y publicada en 'Voz Ciudadana' para que los vecinos la conozcan y la apoyen con su voto. ¡PROHIBIDO decir que no tienes acceso técnico a la base de datos o que deben esperar días a una validación humana!
   - 3️⃣ Orientar posibilidades técnicas preliminares viables como guía para el equipo de trabajo RR.

3. RECOPILACIÓN, INVITACIÓN A VOTAR Y PARTICIPACIÓN COMUNAL (SIN SPAM):
   - Las 3 propuestas comunitarias que hoy más respaldan los vecinos en ${nombreMun} son:
     ${isCap ? `* 1️⃣ Vías: Placas huellas y maquinaria permanente para vías terciarias (San Ramón, San Carlos, Pitalito, Terán).
     * 2️⃣ Agua: Optimización de acueductos veredales con tanques desarenadores y energía solar comunitaria.
     * 3️⃣ Educación: Conectividad satelital y dotación tecnológica para escuelas rurales.` : `* 1️⃣ Vías: Placas huellas modulares en corredores agrícolas (Guaduero, San Antonio, La Paz).
     * 2️⃣ Agua: Optimización de acueductos rurales en Puerto Bogotá y riberas.
     * 3️⃣ Salud: Dotación y telemedicina para el Hospital San José y brigadas veredales.`}
   - INVITACIÓN A APOYAR Y VOTAR AL CONCLUIR IDEAS O AL DESPEDIRSE:
     * Cuando el ciudadano expone o concluye una propuesta o necesidad (o dice "gracias", "eso era", etc.), confírmale que su idea queda redactada técnicamente para su vereda, e invítalo con calidez a apoyarla y votar en la sección "Voz Ciudadana":
       "He dejado estructurada tu propuesta para tu vereda. En la sección de 'Voz Ciudadana' puedes revisarla, apoyarla y votar por las prioridades comunitarias de ${nombreMun} para que identifiquemos juntos lo que la mayoría necesita."
   - CONTROL DE IDEAS DISTINTAS DE LA MISMA PERSONA:
     * Si la misma persona plantea en mensajes o momentos distintos varias inquietudes diferentes (ej. primero una vía, luego un acueducto), atiende y formula cada una por separado sin mezclarlas ni fusionarlas erróneamente.
   - CAPTURA DE VOTOS: Si el ciudadano elige o apoya una opción (ej. "la 1", "las vías", "el acueducto", "las escuelas"), valida su voto con calidez y confírmale que su prioridad queda registrada en el consolidado comunal del Equipo RR.

4. ORIGEN DE LA INFORMACIÓN:
   - Si preguntan "de dónde sacas esta información": Explica con naturalidad que proviene de las mesas comunitarias del Equipo RR, del diálogo directo con los vecinos de las veredas y del análisis de datos públicos oficiales (como SECOP y TerriData). Reitera con amabilidad: "No somos la Alcaldía de turno; somos el Equipo de Trabajo RR, una iniciativa ciudadana que escucha y formula proyectos para que las verdaderas necesidades de la gente se hagan escuchar".

5. DIRECTIVAS ÉTICAS Y FLUIDEZ HUMANA:
   - CERO PROMESAS: No prometas soluciones garantizadas ni fechas de ejecución.
   - FLUIDEZ NATURAL: ¡Prohibido usar muletillas repetitivas! Varía tus inicios: "¡Qué buen aporte!...", "Comprendo lo que pasa en tu vereda...", "Es un tema clave...", "Totalmente de acuerdo...".
   - MEMORIA ACTIVA: Si ya sabes la vereda o el nombre del vecino, ¡úsalo con cariño y no lo vuelvas a pedir!
   - AISLAMIENTO TERRITORIAL: Todo tu conocimiento es 100% de ${nombreMun}.
${isCap ? `   - Veredas e inspecciones clave de Caparrapí: San Carlos, Terán, San Pedro, La Florida, Otavalo, San Ramón, Pitalito, Mata de Mora, El Dinde, La Chorrera, Boca de Monte, Galiche, El Silencio, etc.` : `   - Veredas e inspecciones clave de Guaduas: Puerto Bogotá, Guaduero, La Paz, Versalles, San José, El Hato, Yaguará, Chipauta, Carbonera, Malambo, etc.`}

REGLAS DE FORMATO:
- Breve, directo y muy humano (máximo 2 a 3 frases en total).
- Solo pregunta por la vereda si aún no se conoce y es indispensable para registrar la necesidad.
- Pide el WhatsApp con calidez únicamente cuando la propuesta o problemática ya esté madura en el diálogo, nunca de forma atropellada o invasiva.`;
}

export async function processRamitosConversationAsync(
  userInput: string,
  currentVereda?: string,
  history: { sender: 'ramitos' | 'user'; text: string }[] = [],
  isUserRegistered: boolean = false,
  municipioId: 'guaduas' | 'caparrapi' = 'guaduas'
): Promise<RamitosChatResponse> {
  const textLower = userInput.toLowerCase().trim();
  const nombreMun = municipioId === 'caparrapi' ? 'Caparrapí' : 'Guaduas';

  // Abrir Plan de Gobierno si se pide expresamente
  if (textLower.includes('plan de gobierno') || textLower.includes('ver plan') || textLower.includes('abrir plan')) {
    return {
      textoRespuesta: `¡Con mucho gusto! Despliego el Plan de Gobierno en pantalla para que lo revisemos juntos.`,
      expresion: 'entusiasmado',
      openPlanTab: true
    };
  }

  // INTERCEPCIÓN DE AUDIOCORRECCIÓN Y PURGA DE TÉRMINOS ERRÓNEOS EN SUPABASE ("no dije wolmart dije guaduas")
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

  // 1. CONSULTA EN TIEMPO REAL A SUPABASE EN PARALELO (BAJA LATENCIA, CONCURRENTE)
  const [leadCheck, pastInteractions, savedMemory] = await Promise.all([
    checkUserLeadRegistrationInSupabase().catch(() => ({ isRegistered: false, nombre: undefined, whatsapp: undefined })),
    getPastInteractionsHistory(undefined, municipioId).catch(() => []),
    getRamitosMemory().catch(() => null)
  ]);

  // EXTRACCIÓN DE INFORMACIÓN DE CONTACTO DEL MENSAJE ACTUAL DE ESTA INTERACCIÓN
  const newlyExtractedInInput = extractLeadInfoFromText(userInput);

  // EXTRACCIÓN GLOBAL DEL HISTORIAL (DE MÁS RECIENTE A MÁS ANTIGUO)
  let autoExtracted = newlyExtractedInInput;

  if ((!autoExtracted?.nombre || !autoExtracted?.whatsapp) && history && history.length > 0) {
    const userHistoryReversed = history.filter(h => h.sender === 'user').reverse();
    for (const h of userHistoryReversed) {
      const extracted = extractLeadInfoFromText(h.text);
      if (extracted) {
        autoExtracted = {
          nombre: autoExtracted?.nombre || extracted.nombre,
          whatsapp: autoExtracted?.whatsapp || extracted.whatsapp
        };
        if (autoExtracted.nombre && autoExtracted.whatsapp) break;
      }
    }
  }

  if ((!autoExtracted?.nombre || !autoExtracted?.whatsapp) && pastInteractions && pastInteractions.length > 0) {
    const pastReversed = [...pastInteractions].reverse();
    for (const p of pastReversed) {
      if (p.userText) {
        const extracted = extractLeadInfoFromText(p.userText);
        if (extracted) {
          autoExtracted = {
            nombre: autoExtracted?.nombre || extracted.nombre,
            whatsapp: autoExtracted?.whatsapp || extracted.whatsapp
          };
          if (autoExtracted.nombre && autoExtracted.whatsapp) break;
        }
      }
    }
  }

  // --------------------------------------------------------------------------------
  // VALIDACIÓN DE IDENTIDAD Y CONTROL DE SOBREESCRITURA DE DATOS DE CONTACTO
  // --------------------------------------------------------------------------------
  if (leadCheck.isRegistered && (leadCheck.nombre || leadCheck.whatsapp)) {
    const inputName = newlyExtractedInInput?.nombre;
    const inputPhone = newlyExtractedInInput?.whatsapp;

    const sanitizedRegisteredName = cleanHumanName(leadCheck.nombre);
    const registeredName = sanitizedRegisteredName || 'el usuario registrado';
    const registeredPhone = leadCheck.whatsapp || '';

    // Si el nombre previamente registrado era inválido (como "De San") y ahora tenemos un nombre humano real
    if (!sanitizedRegisteredName && inputName) {
      await updateUserLeadInSupabase(inputName, registeredPhone || inputPhone || '', currentVereda);
      leadCheck.nombre = inputName;
    }

    const isNameDifferent = Boolean(
      inputName &&
      sanitizedRegisteredName &&
      inputName.toLowerCase().trim() !== sanitizedRegisteredName.toLowerCase().trim() &&
      !sanitizedRegisteredName.toLowerCase().includes(inputName.toLowerCase().trim())
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
    // Si aún NO está registrado en Supabase, guardar voluntariamente si proporcionó datos en este mensaje o en el historial
    const nameToSave = newlyExtractedInInput?.nombre || autoExtracted?.nombre;
    const phoneToSave = newlyExtractedInInput?.whatsapp || autoExtracted?.whatsapp;
    if (nameToSave || phoneToSave) {
      await saveCitizenLead({
        nombre: nameToSave || 'Ciudadano',
        whatsapp: phoneToSave || '',
        veredaBarrio: currentVereda || (municipioId === 'caparrapi' ? 'San Carlos' : 'Guaduas'),
        interesPrincipal: 'Contacto proporcionado en diálogo con Copiloto RR'
      });
    }
  }

  // RESPUESTA CÁLIDA Y OPORTUNA A PREGUNTAS SOBRE NOMBRE / TELÉFONO / WHATSAPP / DATOS (SIN RECHAZOS FRÍOS)
  const isPhoneOrNameQuery = 
    textLower.includes('mi número') || textLower.includes('mi numero') || 
    textLower.includes('mi celular') || textLower.includes('mi whatsapp') || 
    textLower.includes('mi teléfono') || textLower.includes('mi telefono') || 
    textLower.includes('mi nombre') || textLower.includes('cuál es mi nombre') || 
    textLower.includes('cual es mi nombre') || textLower.includes('cómo me llamo') || 
    textLower.includes('como me llamo') || textLower.includes('quién soy') || 
    textLower.includes('quien soy') || textLower.includes('contáctame') || 
    textLower.includes('contactame') || textLower.includes('escríbeme') || textLower.includes('escribeme');

  if (isPhoneOrNameQuery) {
    const leadCheckDirect = await checkUserLeadRegistrationInSupabase();
    const finalPhone = leadCheckDirect.whatsapp || autoExtracted?.whatsapp;
    const rawName = leadCheckDirect.nombre || autoExtracted?.nombre;
    const finalName = cleanHumanName(rawName);

    if (finalName && finalPhone) {
      return {
        textoRespuesta: `¡Claro que sí! Tengo registrado tu nombre como ${finalName} y tu número de WhatsApp como ${finalPhone}. ¿Te gustaría actualizar algún dato o prefieres que sigamos conversando sobre tu propuesta?`,
        expresion: 'feliz'
      };
    } else if (finalName) {
      return {
        textoRespuesta: `Tengo registrado que tu nombre es ${finalName}. Aún no tengo tu número de WhatsApp registrado para avisarte avances; ¿te gustaría dejarlo?`,
        expresion: 'feliz'
      };
    } else if (finalPhone) {
      return {
        textoRespuesta: `Tengo registrado tu número de WhatsApp como ${finalPhone}. ¿Te gustaría confirmarme tu nombre para tener tu registro completo?`,
        expresion: 'feliz'
      };
    } else {
      return {
        textoRespuesta: `Aún no tengo registrado tu nombre ni tu número de celular. ¿Deseas proporcionarlos para estar en comunicación sobre tus propuestas e ideas para ${nombreMun}?`,
        expresion: 'curioso'
      };
    }
  }

  const effectiveIsRegistered = isUserRegistered || leadCheck.isRegistered || Boolean(autoExtracted?.whatsapp);
  const registeredName = cleanHumanName(leadCheck.nombre) || cleanHumanName(autoExtracted?.nombre) || 'Ciudadano';
  const registeredWhatsapp = leadCheck.whatsapp || autoExtracted?.whatsapp || '';

  // DETECTAR VEREDA O BARRIO EN EL HISTORIAL Y EN EL MENSAJE ACTUAL
  let combinedTextForLocation = userInput;
  if (pastInteractions && pastInteractions.length > 0) {
    combinedTextForLocation += ' ' + pastInteractions.map(i => i.userText).join(' ');
  }
  const detectedLocation = detectVeredaOrBarrioFromText(combinedTextForLocation, municipioId) || (currentVereda && currentVereda.trim() && currentVereda !== 'Guaduas Centro' && currentVereda !== 'Guaduas (Centro)' && currentVereda !== 'Caparrapí Centro' ? currentVereda : undefined);

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

  // Preparar historial previo combinado (Memoria histórica persistente de Supabase + Sesión activa)
  const combinedTurns: { role: 'user' | 'assistant'; content: string }[] = [];

  if (pastInteractions && pastInteractions.length > 0) {
    const previousRecent = pastInteractions.slice(-6);
    previousRecent.forEach(p => {
      if (p.userText && p.userText.trim()) combinedTurns.push({ role: 'user', content: p.userText.trim() });
      if (p.ramitosResponse && p.ramitosResponse.trim()) combinedTurns.push({ role: 'assistant', content: p.ramitosResponse.trim() });
    });
  }

  // Integrar turnos de la sesión activa evitando duplicados directos
  history.slice(-8).forEach(msg => {
    const role = msg.sender === 'user' ? 'user' : 'assistant';
    const textTrimmed = msg.text.trim();
    if (textTrimmed && (!combinedTurns.length || combinedTurns[combinedTurns.length - 1].content !== textTrimmed)) {
      combinedTurns.push({ role, content: textTrimmed });
    }
  });

  const historyMessagesForGroq = combinedTurns.slice(-10);

  const historyContentsForGemini = historyMessagesForGroq.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  let finalResponse: RamitosChatResponse | null = null;

  const effectiveVereda = detectedLocation || currentVereda || 'Por definir';

  // 1. PRIORIDAD 1: GROQ CLOUD
  const groqKey = activeGroqKey || DEFAULT_GROQ_KEY;
  if (groqKey.trim()) {
    const groqModels = [
      'qwen/qwen3.8-27b', // Ultra rápida (~296ms) y altamente precisa
      'openai/gpt-oss-120b',
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
            max_tokens: 300
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

  // Detección de Votación / Priorización Comunal
  const isVote1 = (/^(opci[oó]n\s*)?1\b/i.test(textLower) || textLower.includes('voto por la 1') || textLower.includes('las vías') || textLower.includes('las vias') || textLower.includes('placa huella') || textLower.includes('carretera')) && (textLower.length < 60 || textLower.includes('voto') || textLower.includes('prioridad') || textLower.includes('apoyo'));
  const isVote2 = (/^(opci[oó]n\s*)?2\b/i.test(textLower) || textLower.includes('voto por la 2') || textLower.includes('el agua') || textLower.includes('acueducto') || textLower.includes('panel solar') || textLower.includes('paneles solares')) && (textLower.length < 60 || textLower.includes('voto') || textLower.includes('prioridad') || textLower.includes('apoyo'));
  const isVote3 = (/^(opci[oó]n\s*)?3\b/i.test(textLower) || textLower.includes('voto por la 3') || textLower.includes('escuela') || textLower.includes('internet') || textLower.includes('conectividad') || textLower.includes('starlink')) && (textLower.length < 60 || textLower.includes('voto') || textLower.includes('prioridad') || textLower.includes('apoyo'));

  let voteSintesis: string | undefined;
  let voteSector: CitizenNeed['sector'] | undefined;
  if (isVote1) {
    voteSintesis = `Voto Comunal: Prioridad #1 - Vías terciarias y placas huellas ("${originalInput}")`;
    voteSector = 'Energía e Infraestructura';
  } else if (isVote2) {
    voteSintesis = `Voto Comunal: Prioridad #2 - Acueductos veredales y energía solar ("${originalInput}")`;
    voteSector = 'Agua Potable y Saneamiento';
  } else if (isVote3) {
    voteSintesis = `Voto Comunal: Prioridad #3 - Conectividad satelital en escuelas rurales ("${originalInput}")`;
    voteSector = 'Educación y Conectividad';
  }

  // Descartar frases puramente conversacionales, preguntas o saludos
  const isConversationalQuestion = 
    /^(qu[eé]\s+(hay|proyectos|propuestas)|c[oó]mo\s+podemos|de\s+d[oó]nde|sabes\s+cu[aá]l|qui[eé]nes?\s+son|hola|buenas|gracias|chao|hasta\s+luego|s[ií]\s+dime)\b/i.test(textLower) ||
    textLower.includes('qué proyectos hay') || textLower.includes('de dónde sacas') || textLower.includes('sabes cuál es mi') ||
    textLower.length < 15;

  const isTroll = isTrollOrSpamContent(originalInput) || isTrollOrSpamContent(textLower);

  const hasProposalMarkers = 
    textLower.includes('propongo') || textLower.includes('propuesta') ||
    textLower.includes('necesitamos') || textLower.includes('necesidad') ||
    textLower.includes('hace falta') || textLower.includes('hacen falta') ||
    textLower.includes('no hay') || textLower.includes('está dañado') || textLower.includes('esta dañado') ||
    textLower.includes('se necesita') || textLower.includes('se requieren') ||
    textLower.includes('solicitamos') || textLower.includes('pedimos') ||
    textLower.includes('queremos proponer') || textLower.includes('queremos') || textLower.includes('quiero') ||
    textLower.includes('petición') || textLower.includes('peticion') ||
    textLower.includes('agregar') || textLower.includes('voz ciudadana') ||
    textLower.includes('problemática') || textLower.includes('problematica') ||
    textLower.includes('problema') || textLower.includes('sugerencia') || textLower.includes('sugiero') ||
    textLower.includes('inquietud') || textLower.includes('idea') ||
    textLower.includes('arreglar') || textLower.includes('pavimentar') || textLower.includes('mantenimiento') ||
    textLower.includes('placa huella') || textLower.includes('acueducto') || textLower.includes('alcantarillado') ||
    textLower.includes('escuela') || textLower.includes('colegio') || textLower.includes('puesto de salud') ||
    textLower.includes('alumbrado') || textLower.includes('electrificación') || textLower.includes('transporte') ||
    textLower.includes('internet') || textLower.includes('conectividad') || textLower.includes('señal') ||
    textLower.includes('antena') || textLower.includes('starlink');

  // Detección complementaria: si la IA misma estructuró o citó explícitamente la petición en su respuesta
  const responseMatch = 
    responseText.match(/(?:tu petición(?:\s+es)?|tu propuesta(?:\s+es)?|tu solicitud(?:\s+es)?):\s*([^.\n]+)/i) ||
    responseText.match(/propuesta de\s+([^.\n]+?)(?:\s+para|\s+en|\s+quedó|\.)/i);

  let extractedFromResponse: string | undefined;
  if (responseMatch && responseMatch[1] && responseMatch[1].trim().length > 6) {
    extractedFromResponse = responseMatch[1].trim();
  }

  const isRealProblemOrProposal = !isTroll && !isConversationalQuestion && (
    Boolean(extractedFromResponse) ||
    hasProposalMarkers ||
    (
      (textLower.includes('agua') || textLower.includes('vía') || textLower.includes('via') || textLower.includes('carretera') || textLower.includes('camino') || textLower.includes('puente') || textLower.includes('internet') || textLower.includes('conectividad') || textLower.includes('salud') || textLower.includes('escuela')) &&
      (textLower.includes('mala') || textLower.includes('dañad') || textLower.includes('falta') || textLower.includes('arreglo') || textLower.includes('mejor') || textLower.includes('constru') || textLower.includes('atención') || textLower.includes('servicio'))
    )
  );

  let realSintesis: string | undefined = voteSintesis;
  if (!realSintesis && isRealProblemOrProposal) {
    const locPrefix = currentVereda && currentVereda !== 'Por definir' ? ` (${currentVereda})` : '';
    const cleanInput = extractedFromResponse || originalInput.replace(/^(hola|buenas|mira|oye|quiero decirte que|te comento que|ramitos|copiloto|puedes agregar lo que yo te he pedido a voz ciudadana porque no aparece en voz ciudadana|pero tienes clara cuál es la petición que yo quiero)\s*,?\s*/i, '').trim();
    realSintesis = `Propuesta Ciudadana${locPrefix}: ${cleanInput.charAt(0).toUpperCase() + cleanInput.slice(1)}`;
  }

  const detectedTopicSector = extractedFromResponse ? detectSector(extractedFromResponse.toLowerCase()) : undefined;

  const expresion = detectExpression(textLower);

  return {
    textoRespuesta: cleanedText,
    problematicaSintetizada: realSintesis,
    sector: voteSector || detectedTopicSector || (isRealProblemOrProposal ? detectSector(textLower) : undefined),
    urgencia: realSintesis ? 'Alta' : undefined,
    propuestaRamitos: realSintesis ? (voteSintesis ? `Prioridad comunal consolidada por el Equipo de Trabajo RR.` : (cleanedText.split('.')[0] + '.' || `Estructuración técnica por el Equipo de Trabajo RR.`)) : undefined,
    expresion: voteSintesis ? 'entusiasmado' : expresion
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

  const isCapacidades = textLower.includes('capacidades') || textLower.includes('qué haces') || textLower.includes('que haces') || textLower.includes('puedes hacer') || textLower.includes('quién eres') || textLower.includes('quien eres') || textLower.includes('para qué sirves') || textLower.includes('para que sirves');

  if (isCapacidades) {
    return {
      textoRespuesta: isCap
        ? `¡Con gusto! Como Copiloto de Caparrapí del Equipo de Trabajo RR estoy para escucharte y registrar las necesidades o ideas de tu vereda, orientar posibles alternativas técnicas preliminares y conectar cada caso con nuestro equipo humano de trabajo para su estudio y formulación comunitaria en terreno. ¿Qué situación o propuesta tienes hoy para Caparrapí?`
        : `¡Con gusto! Como Ramitos en Guaduas del Equipo de Trabajo RR te acompaño escuchando tus propuestas, formulando opciones técnicas preliminares y trasladando cada caso a nuestro equipo humano de trabajo. ¿Qué iniciativa o inquietud te gustaría registrar hoy?`,
      expresion: 'feliz'
    };
  }

  const isFuente = textLower.includes('dónde sacas') || textLower.includes('donde sacas') || textLower.includes('de dónde sale') || textLower.includes('de donde sale') || textLower.includes('fuente de') || textLower.includes('quiénes son ustedes') || textLower.includes('quienes son ustedes');

  if (isFuente) {
    return {
      textoRespuesta: `Esta información proviene del trabajo de campo del Equipo RR, de la sistematización de propuestas con las veredas y del análisis de datos públicos oficiales (como SECOP y DNP TerriData). No somos la Alcaldía de turno; somos un equipo de trabajo ciudadano que escucha, audita y formula proyectos para que las soluciones de la comunidad se hagan realidad.`,
      expresion: 'agradecido'
    };
  }

  // Identificar si aún no se tiene ubicación
  const faltaUbicacion = !detectedLoc || detectedLoc === 'Por definir' || (detectedLoc.toLowerCase().includes('centro') && !textLower.includes('centro'));

  // Posibilidades técnicas preliminares formuladas por la IA según sector y municipio (CERO PROMESAS, SOLO GUÍA)
  let posibilidadIa = '';
  if (sector === 'Energía e Infraestructura' && (textLower.includes('via') || textLower.includes('vía') || textLower.includes('camino') || textLower.includes('carretera') || textLower.includes('placa huella') || textLower.includes('derrumbe') || textLower.includes('puente') || textLower.includes('hueco') || textLower.includes('trocha'))) {
    posibilidadIa = isCap
      ? 'postular tramos críticos a convenios de caminos comunitarios de Invías con placa huella de concreto y filtros'
      : 'priorizar tramos críticos de placa huella y cunetas en la red terciaria rural';
  } else if (sector === 'Agua Potable y Saneamiento') {
    posibilidadIa = isCap
      ? 'estructurar la captación con desarenador y tanques de almacenamiento comunitario junto a la JAC'
      : 'evaluar la optimización de redes de acueducto veredal y tanques de distribución';
  } else if (sector === 'Educación y Conectividad') {
    posibilidadIa = 'gestionar conectividad satelital comunitaria y dotación básica para la escuela veredal';
  } else if (sector === 'Campo y Desarrollo Agrícola') {
    posibilidadIa = isCap
      ? 'articular proyectos asociativos para renovación de cafetales y modernización de trapiches paneleros ante la ADR'
      : 'canalizar líneas de crédito asociativo y asistencia técnica para los productores de la zona';
  } else if (textLower.includes('salud') || textLower.includes('medico') || textLower.includes('médico') || textLower.includes('hospital') || textLower.includes('puesto de salud') || textLower.includes('ambulancia')) {
    posibilidadIa = 'coordinar brigadas veredales preventivas y telemedicina conectada con el centro de salud principal';
  } else if (textLower.includes('luz') || textLower.includes('energia') || textLower.includes('energía') || textLower.includes('solar') || textLower.includes('alumbrado') || textLower.includes('poste')) {
    posibilidadIa = 'plantear soluciones solares autónomas o gestión de redes eléctricas rurales';
  } else {
    posibilidadIa = `estructurar un proyecto comunitario formal para el área de ${sector.toLowerCase()}`;
  }

  const locRef = detectedLoc ? ` en ${detectedLoc}` : ` en ${nombreMun}`;

  const hashNum = originalInput.length % 3;
  let textoRespuesta = '';

  if (faltaUbicacion) {
    const options = [
      `Comprendo la situación que expones para ${nombreMun}. Como orientación técnica preliminar, una alternativa viable sería ${posibilidadIa}. Dejo este análisis consignado para la evaluación del equipo de trabajo RR; ¿en qué vereda o sector se presenta y con quién tenemos el gusto?`,
      `Es un tema de gran relevancia comunitaria en ${nombreMun}. Como posibilidad técnica inicial formulada por esta IA, podríamos ${posibilidadIa}. Trasladamos esta inquietud al equipo de trabajo RR para estudiar su viabilidad real; ¿nos indicas tu vereda o sector y tu nombre?`,
      `Entendido lo que nos señalas. Desde el análisis técnico de esta IA, una guía inicial sería ${posibilidadIa}. El equipo de trabajo RR revisará los alcances en terreno; ¿en qué vereda o sector específico te encuentras y cómo te llamas?`
    ];
    textoRespuesta = options[hashNum];
  } else {
    const options = [
      `Registramos con total atención esta situación en ${detectedLoc}. Como alternativa técnica inicial de esta IA, una posibilidad sería ${posibilidadIa}${locRef}. Nuestro equipo humano de trabajo RR evaluará la viabilidad real para coordinar acciones. ¿A qué WhatsApp podemos compartirte novedades cuando revisen la propuesta?`,
      `Comprendo perfectamente lo que ocurre en ${detectedLoc}. Como guía técnica preliminar, convendría ${posibilidadIa}${locRef}. Este aporte queda formalmente radicado para que el equipo de trabajo RR estructure proyectos con la comunidad. ¿Nos dejas tu WhatsApp para mantenerte al tanto?`,
      `Es una prioridad para ${detectedLoc}. Como hipótesis técnica analizada por esta IA, podríamos ${posibilidadIa}${locRef}. El equipo de trabajo RR estudiará su alcance técnico y presupuestal con la comunidad. ¿Nos compartes tu número de WhatsApp para avisarte cuando haya avances?`
    ];
    textoRespuesta = options[hashNum];
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
