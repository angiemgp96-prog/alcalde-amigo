/**
 * leadValidationService.ts
 * Servicio integral de validacion, sanitizacion y persistencia de leads de ciudadanos (Nombres y Celulares).
 * Solucion de fondo para evitar que palabras comunes, saludos, verbos o dictados de voz
 * (ej. "Estas", "Como", "Hola", "Vereda", etc.) se guarden como nombres.
 */

// Normaliza texto eliminando acentos, tildes y diacriticos, en minusculas y limpio de puntuacion extra
export function normalizeLeadText(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Lista negra canonica y exhaustiva de palabras que JAMAS son un nombre propio humano
export const INVALID_NAME_WORDS = new Set([
  // Verbos de estado, ser, estar, haber, tener
  "estas", "esta", "estan", "estoy", "estamos", "estuve", "estaba", "estado", "este", "estos",
  "eres", "es", "soy", "somos", "son", "era", "eran", "fui", "fue", "sido", "ser", "sea", "sean",
  "tengo", "tienes", "tiene", "tenemos", "tienen", "tenia", "tener", "hubo", "habia", "hay", "haya",
  // Verbos de querer, poder, deber, saber, conocer
  "quiero", "quieres", "quiere", "queremos", "quieren", "quisiera", "querer",
  "puedo", "puedes", "puede", "podemos", "pueden", "podria", "podrian", "poder",
  "debo", "debes", "debe", "debemos", "deber",
  "sabes", "sabe", "sabemos", "saben", "se", "sabia", "saber", "sabras",
  "conoces", "conoce", "conocemos", "conocen", "conocer",
  // Verbos de comunicacion, modificacion y accion
  "llamo", "llamas", "llama", "llaman", "llamar", "llamado",
  "modifica", "modifico", "modificas", "modificar", "modifique", "modificalo", "modificala",
  "actualiza", "actualizo", "actualizas", "actualizar", "actualizalo", "actualizala", "actualizado",
  "cambia", "cambio", "cambias", "cambiar", "cambialo", "cambiala", "cambiado",
  "corrige", "corrijo", "corregir", "corrigelo", "corregido",
  "revisa", "revisar", "consulta", "consultar", "guarda", "guardar", "guardado",
  "borra", "borrar", "elimina", "eliminar", "ayuda", "ayudame", "ayudar",
  "habla", "hablo", "hablas", "hablar", "escribe", "escribo", "escribir", "escrito",
  "dime", "dinos", "da", "dame", "dar", "dado", "dice", "dices", "digo", "decir", "dije", "dijo",
  "cuenta", "cuentame", "cuentan", "contar", "mira", "mire", "mirar", "oye", "oiga", "escucha",
  "veo", "ves", "ve", "ver", "visto", "recuerdo", "recuerdas", "recuerda", "recordar",
  "pense", "pensaba", "pensar", "creo", "creer", "hago", "haces", "hace", "hacemos", "hacer", "hecho",
  "proponer", "propone", "propuesta", "conversar", "contactar", "contactame",
  // Saludos y formulas de cortesia
  "hola", "buenos", "buenas", "tardes", "dias", "noches", "saludo", "saludos", "chao", "adios",
  "hasta", "luego", "pronto", "porfis", "favor", "gracias", "disculpa", "perdon",
  // Respuestas y afirmaciones / negaciones
  "si", "no", "claro", "vale", "dale", "bueno", "buena", "bien", "mal", "ok", "listo", "hecho",
  "verdad", "cierto", "seguro", "exacto", "correcto", "perfecto", "excelente",
  "nada", "todo", "algo", "nadie", "alguien", "mucho", "poco", "mas", "menos",
  // Pronombres y articulos
  "yo", "tu", "el", "ella", "usted", "ustedes", "nosotros", "nosotras", "ellos", "ellas",
  "me", "te", "se", "nos", "le", "les",
  "mi", "mis", "su", "sus", "nuestro", "nuestra", "nuestros", "nuestras", "tuya", "tuyo",
  "un", "una", "unos", "unas", "lo", "la", "los", "las",
  "esto", "ese", "esa", "esos", "esas", "eso", "aquel", "aquella",
  "que", "cual", "cuales", "quien", "quienes", "como", "cuando", "donde", "por", "para", "con", "sin",
  "de", "del", "al", "en", "sobre", "tras", "desde", "hacia", "entre",
  "y", "e", "o", "u", "pero", "sino", "aunque", "porque", "ni", "ya", "tambien", "tampoco",
  // Terminos de la plataforma y del dominio publico / municipal
  "ciudadano", "ciudadana", "anonimo", "usuario", "persona", "amigo", "amiga", "vecino", "vecina",
  "alcalde", "alcaldesa", "alcaldia", "copiloto", "ramitos", "equipo", "rr", "asesor", "asistente",
  "guaduas", "caparrapi", "vereda", "barrio", "sector", "municipio", "pueblo", "ciudad",
  "proyecto", "licitacion", "datos", "registro", "informacion", "contacto",
  "nombre", "numero", "celular", "telefono", "whatsapp", "chat", "voz", "mensaje", "correo", "audio",
  "escuela", "via", "vias", "agua", "luz", "salud", "internet", "conectividad", "resumen", "plan",
  "san", "santa"
]);

// Lista de nombres de pila comunes hispanos (permite validar con seguridad nombres de una sola palabra)
export const COMMON_SPANISH_FIRST_NAMES = new Set([
  "ivan", "carlos", "maria", "juan", "pedro", "andres", "alejandro", "luis", "jose", "jorge",
  "david", "fernando", "santiago", "mateo", "sebastian", "diego", "daniel", "gabriel", "laura",
  "paula", "diana", "camila", "valentina", "sofia", "ana", "claudia", "martha", "marta", "luz",
  "patricia", "gloria", "esperanza", "rosa", "albeiro", "jairo", "wilson", "alvaro", "german",
  "hugo", "cesar", "mario", "mauricio", "gustavo", "ricardo", "eduardo", "antonio", "manuel",
  "miguel", "oscar", "rafael", "jaime", "hector", "javier", "julio", "rodrigo", "gonzalo",
  "roberto", "guillermo", "enrique", "armando", "arturo", "ramon", "raul", "sergio", "victor",
  "felipe", "marcos", "julian", "nicolas", "esteban", "samuel", "lucas", "tomas", "elena",
  "carmen", "adriana", "monica", "sandra", "angela", "lorena", "natalia", "tatiana", "carolina",
  "vanessa", "paola", "marcela", "jessica", "daniela", "catalina", "marina", "teresa", "mercedes",
  "isabel", "rocio", "blanca", "lucia", "mariana", "juliana", "gabriela", "fabian", "orlando",
  "edgar", "jhon", "john", "alexander", "leonardo", "cristian", "camilo", "felix", "alberto"
]);

const KNOWN_LOCATIONS = [
  "san carlos", "san pablo", "san ramon", "pitalito", "el dinde", "dinde", "mata de mora",
  "la chorrera", "chorrera", "boca de monte", "galiche", "el silencio", "puerto colombia",
  "casco urbano", "piedras negras", "puerto bogota", "la paz", "el hato", "san jose",
  "yaguara", "la esperanza", "carbonera", "canta rana", "versalles", "guaduas", "caparrapi"
];

/**
 * Valida de forma estricta si una cadena de texto es un nombre humano real y legitimo.
 */
export function isValidHumanName(name?: string): boolean {
  if (!name || typeof name !== "string") return false;

  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 50) return false;

  // No debe contener numeros ni caracteres especiales extranos
  if (!/^[a-zA-Z\u00C0-\u017F\s'-]+$/.test(trimmed)) return false;

  const normalizedLower = normalizeLeadText(trimmed);

  // Descartar si coincide con una vereda o ubicacion
  if (KNOWN_LOCATIONS.some(loc => normalizedLower === loc || normalizedLower.startsWith(loc + " "))) {
    return false;
  }

  // Descartar si empieza por preposiciones de ubicacion
  if (/^(?:de|del|en|desde|soy\s+de|para)\s+/i.test(normalizedLower)) {
    return false;
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 4) return false;

  const normalizedWords = words.map(w => normalizeLeadText(w));

  for (const nw of normalizedWords) {
    if (nw.length < 2) return false;
    if (INVALID_NAME_WORDS.has(nw)) {
      return false;
    }
  }

  if (words.length === 1) {
    const singleWordNorm = normalizedWords[0];
    return COMMON_SPANISH_FIRST_NAMES.has(singleWordNorm) || (singleWordNorm.length >= 4 && !INVALID_NAME_WORDS.has(singleWordNorm));
  }

  return true;
}

/**
 * Sanitiza y formatea un nombre humano legitimo en Title Case (ej. "Ivan Alvarado").
 */
export function cleanHumanName(name?: string): string | undefined {
  if (!name || !isValidHumanName(name)) return undefined;

  const words = name.trim().split(/\s+/).filter(Boolean);
  const formatted = words
    .slice(0, 4)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return formatted.length >= 3 ? formatted : undefined;
}

/**
 * Valida si un numero corresponde a un celular colombiano legitimo de 10 digitos.
 */
export function isValidColombianPhone(phone?: string): boolean {
  if (!phone || typeof phone !== "string") return false;

  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("57") && digits.length === 12) {
    digits = digits.substring(2);
  }

  if (digits.length !== 10) return false;
  if (!/^3\d{9}$/.test(digits)) return false;

  // Descartar digitos repetidos: 3000000000, 3111111111, etc.
  const allSame = digits.split("").every(c => c === digits[0]);
  if (allSame) return false;

  const testSequences = ["3123456789", "3012345678", "3987654321"];
  if (testSequences.includes(digits)) return false;

  return true;
}

/**
 * Limpia y devuelve el numero de celular colombiano normalizado a 10 digitos numericos.
 */
export function formatColombianPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("57") && digits.length === 12) {
    digits = digits.substring(2);
  }
  return isValidColombianPhone(digits) ? digits : undefined;
}

/**
 * Extrae datos de contacto validos (Nombre y WhatsApp) del texto de entrada del usuario.
 */
export function extractLeadInfoFromText(text: string): { nombre?: string; whatsapp?: string } | null {
  if (!text || typeof text !== "string") return null;

  const normalized = text.trim();

  // 1. Extraer celular colombiano de 10 digitos (3XX XXX XXXX o 3XXXXXXXXX)
  const phoneMatch = normalized.match(/(?:\+?57\s*)?(?:3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}|\b3\d{9}\b)/);
  let whatsappClean: string | undefined = undefined;
  if (phoneMatch) {
    whatsappClean = formatColombianPhone(phoneMatch[0]);
  }

  const isQuestionOrInquiry = /(?:sabes|sabe|recuerdas|recuerda|conoces|conoce|cu[aá]l\s+es|c[oó]mo\s+me|qui[eé]n\s+soy|tienes?\s+registrado|qu[eé]\s+tienes|mi\s+nombre|mi\s+n[uú]mero|mi\s+numero|mi\s+celular|mi\s+whatsapp|resumen)\b/i.test(normalized);

  let rawNameCandidate: string | undefined = undefined;

  // PATRON PRIORITARIO 0: Solicitud explicita de modificacion/cambio de nombre
  // ej: "modifica mi nombre me llamo Ivan Alvarado", "cambia mi nombre a Ivan Alvarado"
  const changeNameMatch = normalized.match(/(?:(?:modifica|cambia|actualiza|corrige)\s+(?:mi\s+)?(?:nombre|datos)\s+(?:a|por|como|que\s+es|me\s+llamo)\s+|me\s+llamo\s+realmente\s+)([a-zA-Z\u00C0-\u017F\s'-]{3,35})/i);
  if (changeNameMatch && changeNameMatch[1]) {
    const candidate = cleanHumanName(changeNameMatch[1]);
    if (candidate) {
      rawNameCandidate = candidate;
    }
  }

  // PATRON PRIORITARIO 1: Declaracion afirmativa explicita ("me llamo Ivan Alvarado", "mi nombre es Ivan Alvarado")
  if (!rawNameCandidate) {
    const explicitDeclarationMatch = normalized.match(/(?:(?:mi\s+nombre\s+(?:es|real\s+es)|me\s+llamo)\s+([a-zA-Z\u00C0-\u017F]{3,20}(?:\s+[a-zA-Z\u00C0-\u017F]{2,20}){0,3}))/i);
    if (explicitDeclarationMatch && explicitDeclarationMatch[1]) {
      const matchIndex = explicitDeclarationMatch.index ?? 0;
      const precedingText = normalized.substring(Math.max(0, matchIndex - 20), matchIndex).toLowerCase();
      const isPrecededByQuestion = /c[oó]mo\s*$|sabes\s*$|sabe\s*$|si\s*$/i.test(precedingText);
      if (!isPrecededByQuestion) {
        const candidate = cleanHumanName(explicitDeclarationMatch[1]);
        if (candidate) {
          rawNameCandidate = candidate;
        }
      }
    }
  }

  // PATRON PRIORITARIO 2: "Nombre Apellido [,;:-]? 3XXXXXXXXX"
  if (!rawNameCandidate && phoneMatch) {
    const namePhonePair = normalized.match(/([a-zA-Z\u00C0-\u017F]{3,20}(?:\s+[a-zA-Z\u00C0-\u017F]{2,20}){1,3})\s*[,;:-]?\s*(?:(?:\+?57\s*)?(?:3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}|\b3\d{9}\b))/i);
    if (namePhonePair && namePhonePair[1]) {
      const candidate = cleanHumanName(namePhonePair[1]);
      if (candidate) {
        rawNameCandidate = candidate;
      }
    }
  }

  // PATRON 3: "Soy Ivan Alvarado" (solo si no es pregunta)
  if (!rawNameCandidate && !isQuestionOrInquiry) {
    const soyMatch = normalized.match(/\bsoy\s+([a-zA-Z\u00C0-\u017F]{3,20}(?:\s+[a-zA-Z\u00C0-\u017F]{2,20}){1,2})\b/i);
    if (soyMatch && soyMatch[1]) {
      const candidate = cleanHumanName(soyMatch[1]);
      if (candidate) {
        rawNameCandidate = candidate;
      }
    }
  }

  // PATRON 4: Introduccion formal ("Habla Ivan Alvarado", "Atentamente Ivan Alvarado")
  if (!rawNameCandidate && !isQuestionOrInquiry) {
    const formalIntroMatch = normalized.match(/^(?:habla|atentamente|att|attt)\s+([a-zA-Z\u00C0-\u017F]{3,20}(?:\s+[a-zA-Z\u00C0-\u017F]{2,20}){1,2})$/i);
    if (formalIntroMatch && formalIntroMatch[1]) {
      const candidate = cleanHumanName(formalIntroMatch[1]);
      if (candidate) {
        rawNameCandidate = candidate;
      }
    }
  }

  // PATRON 5: Mensaje compuesto estrictamente por nombre completo de 2 a 3 palabras
  if (!rawNameCandidate && !isQuestionOrInquiry && normalized.length <= 40 && !normalized.includes("?") && !normalized.includes("!")) {
    const words = normalized.split(/\s+/).filter(Boolean);
    if (words.length >= 2 && words.length <= 3) {
      const candidate = cleanHumanName(normalized);
      if (candidate) {
        rawNameCandidate = candidate;
      }
    }
  }

  const nombreClean = cleanHumanName(rawNameCandidate);

  if (whatsappClean || nombreClean) {
    return { nombre: nombreClean, whatsapp: whatsappClean };
  }
  return null;
}

// --------------------------------------------------------------------------------
// GESTION DE ACTUALIZACIONES PENDIENTES DE CONTACTO (Soporte en 2 turnos)
// --------------------------------------------------------------------------------
const SESSION_STORAGE_PENDING_KEY = "ialcaldia_pending_lead_update";
let memoryPendingLeadUpdate: { nombre?: string; whatsapp?: string } | null = null;

export function setPendingLeadUpdate(data: { nombre?: string; whatsapp?: string }): void {
  memoryPendingLeadUpdate = data;
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem(SESSION_STORAGE_PENDING_KEY, JSON.stringify(data));
    } catch (_) {}
  }
}

export function getPendingLeadUpdate(): { nombre?: string; whatsapp?: string } | null {
  if (memoryPendingLeadUpdate) return memoryPendingLeadUpdate;
  if (typeof sessionStorage !== "undefined") {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_PENDING_KEY);
      if (raw) {
        memoryPendingLeadUpdate = JSON.parse(raw);
        return memoryPendingLeadUpdate;
      }
    } catch (_) {}
  }
  return null;
}

export function clearPendingLeadUpdate(): void {
  memoryPendingLeadUpdate = null;
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_PENDING_KEY);
    } catch (_) {}
  }
}
