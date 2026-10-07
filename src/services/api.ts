import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CitizenNeed, CitizenLead, BaseProposal, GreenApiMessage, PurchaseItem, LaborItem, ProposalComment, PilotVoting } from '../types';
import { BASE_PROPOSALS } from '../data/basePlanData';
import { MUNICIPIOS_DATA } from '../data/municipiosConfig';
import { getDeviceId, getClientIpAddress } from './deviceMemory';
import { cleanHumanName } from './ramitosBrain';

const LOCAL_STORAGE_NEEDS = 'alcalde_amigo_needs';
const LOCAL_STORAGE_LEADS = 'alcalde_amigo_leads';
const LOCAL_STORAGE_PLAN = 'alcalde_amigo_plan';
const LOCAL_STORAGE_MESSAGES = 'alcalde_amigo_messages';
const LOCAL_STORAGE_SUPABASE_CONFIG = 'alcalde_amigo_supabase_cfg';

let supabaseClient: SupabaseClient | null = null;

// Inicializa Supabase si existen credenciales
export function initSupabase(url: string, anonKey: string): boolean {
  if (!url || !anonKey) {
    supabaseClient = null;
    return false;
  }
  try {
    supabaseClient = createClient(url, anonKey);
    localStorage.setItem(LOCAL_STORAGE_SUPABASE_CONFIG, JSON.stringify({ url, anonKey }));
    return true;
  } catch (e) {
    console.error('Error al inicializar Supabase client:', e);
    supabaseClient = null;
    return false;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseClient) {
    const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    if (envUrl && envKey) {
      initSupabase(envUrl, envKey);
    }
  }
  return supabaseClient;
}

// PURGA AUTOMÁTICA DE DATOS FANTASMA EN LOCALSTORAGE
export function purgePhantomLocalStorageCache(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_LEADS);
    localStorage.removeItem(LOCAL_STORAGE_NEEDS);
    localStorage.removeItem('alcalde_amigo_ramitos_memory');
    localStorage.removeItem(LOCAL_STORAGE_MESSAGES);
  } catch (e) {
    console.warn('Error purgando caché fantasma:', e);
  }
}

// Carga configuración previa de Supabase desde variables de entorno o LocalStorage
export function getSavedSupabaseConfig(): { url: string; anonKey: string; isConnected: boolean } {
  // Purga automática de caché fantasma local en cada inicio
  purgePhantomLocalStorageCache();

  // 1. Intentar desde variables de entorno VITE_
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    const ok = initSupabase(envUrl, envKey);
    if (ok) return { url: envUrl, anonKey: envKey, isConnected: true };
  }

  // 2. Intentar desde LocalStorage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SUPABASE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        const ok = initSupabase(parsed.url, parsed.anonKey);
        return { url: parsed.url, anonKey: parsed.anonKey, isConnected: ok };
      }
    }
  } catch (e) {
    console.warn('No hay configuración guardada de Supabase.');
  }
  return { url: '', anonKey: '', isConnected: false };
}

// -------------------------------------------------------------
// GESTIÓN DE CONTACTOS / LEADS (ASOCIADOS A DISPOSITIVO E IP)
// -------------------------------------------------------------
export async function saveCitizenLead(lead: Omit<CitizenLead, 'id' | 'fechaRegistro' | 'estadoNotificacion'>): Promise<CitizenLead> {
  const newLead: CitizenLead = {
    ...lead,
    id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    fechaRegistro: new Date().toISOString(),
    estadoNotificacion: 'activo'
  };

  const deviceId = getDeviceId();
  const ipAddress = await getClientIpAddress();

  // Guardar en Supabase asociando a Dispositivo e IP
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('ciudadanos_leads').insert({
        device_id: deviceId,
        ip_address: ipAddress,
        nombre: newLead.nombre,
        whatsapp: newLead.whatsapp,
        vereda_barrio: newLead.veredaBarrio,
        interes_principal: newLead.interesPrincipal || ''
      }).select().single();
      if (!error && data) {
        newLead.id = data.id;
      }
    } catch (err) {
      console.warn('Error guardando lead en Supabase, guardando en LocalStorage:', err);
    }
  }

  // Guardar localmente
  const existing = getCitizenLeads();
  existing.unshift(newLead);
  localStorage.setItem(LOCAL_STORAGE_LEADS, JSON.stringify(existing));
  return newLead;
}

// Actualiza explícitamente la información de contacto (Nombre, WhatsApp) para este dispositivo/IP en Supabase
export async function updateUserLeadInSupabase(nombre: string, whatsapp: string, veredaBarrio?: string): Promise<boolean> {
  const deviceId = getDeviceId();
  const ipAddress = await getClientIpAddress();

  if (supabaseClient) {
    try {
      // 1. Intentar actualizar por device_id
      const { data, error } = await supabaseClient
        .from('ciudadanos_leads')
        .update({
          nombre: nombre,
          whatsapp: whatsapp,
          vereda_barrio: veredaBarrio || 'Guaduas'
        })
        .eq('device_id', deviceId)
        .select();

      if (error || !data || data.length === 0) {
        // 2. Si no encontró por device_id, intentar por ip_address
        await supabaseClient
          .from('ciudadanos_leads')
          .update({
            nombre: nombre,
            whatsapp: whatsapp,
            vereda_barrio: veredaBarrio || 'Guaduas'
          })
          .eq('ip_address', ipAddress);
      }
    } catch (err) {
      console.warn('Error actualizando lead en Supabase:', err);
    }
  }

  // Actualizar también en LocalStorage
  try {
    const leads = getCitizenLeads();
    let found = false;
    const updated = leads.map(l => {
      if ((l as any).deviceId === deviceId || l.nombre) {
        found = true;
        return {
          ...l,
          nombre,
          whatsapp,
          veredaBarrio: veredaBarrio || l.veredaBarrio
        };
      }
      return l;
    });

    if (!found || updated.length === 0) {
      updated.unshift({
        id: `lead-${Date.now()}`,
        nombre,
        whatsapp,
        veredaBarrio: veredaBarrio || 'Guaduas',
        fechaRegistro: new Date().toISOString(),
        estadoNotificacion: 'activo'
      });
    }
    localStorage.setItem(LOCAL_STORAGE_LEADS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error actualizando LocalStorage:', e);
  }

  return true;
}

// -------------------------------------------------------------
// REGISTRO CONTINUO DE INTERACCIONES RAMITOS (DISPOSITIVO + IP + NOMBRE + WHATSAPP)
// -------------------------------------------------------------
export interface RamitosInteractionLog {
  mensajeTextualCiudadano: string;
  respuestaLimpiaRamitos: string;
  reinterpretacionEstructuradaIa?: string;
  expresionRamitos?: string;
  sectorDetectado?: string;
  nombreCiudadano?: string;
  whatsappCiudadano?: string;
  municipioId?: 'guaduas' | 'caparrapi' | string;
}

export async function saveRamitosInteractionLog(log: RamitosInteractionLog): Promise<void> {
  const deviceId = getDeviceId();
  const ipAddress = await getClientIpAddress();
  const munId = log.municipioId || 'guaduas';

  // Buscar información de lead previa si no viene dada
  const savedLead = getUserLeadInfo();
  const nombreFinal = log.nombreCiudadano || savedLead?.nombre || null;
  const whatsappFinal = log.whatsappCiudadano || savedLead?.whatsapp || null;

  // 1. Guardar de inmediato en LocalStorage (persistencia garantizada por dispositivo a 0ms)
  try {
    const key = `ialcaldia_chat_history_v2_${munId}`;
    const raw = localStorage.getItem(key);
    const list: Array<{ sender: 'user' | 'ramitos'; text: string; time: string; timestamp?: string }> = raw ? JSON.parse(raw) : [];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowIso = new Date().toISOString();
    list.push({ sender: 'user', text: log.mensajeTextualCiudadano, time: nowTime, timestamp: nowIso });
    list.push({ sender: 'ramitos', text: log.respuestaLimpiaRamitos, time: nowTime, timestamp: nowIso });
    if (list.length > 50) list.splice(0, list.length - 50);
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.warn('Error guardando en caché local de conversación:', e);
  }

  // 2. Guardar en Supabase
  if (supabaseClient) {
    try {
      await supabaseClient.from('interacciones_conversaciones_ramitos').insert({
        municipio_id: munId,
        device_id: deviceId,
        ip_address: ipAddress,
        nombre_ciudadano: nombreFinal,
        whatsapp_ciudadano: whatsappFinal,
        mensaje_textual_ciudadano: log.mensajeTextualCiudadano,
        respuesta_limpia_ramitos: log.respuestaLimpiaRamitos,
        reinterpretacion_estructurada_ia: log.reinterpretacionEstructuradaIa || null,
        expresion_ramitos: log.expresionRamitos || 'feliz',
        sector_detectado: log.sectorDetectado || null
      });
    } catch (err) {
      console.warn('Error guardando log de conversación en Supabase:', err);
    }
  }
}

// -------------------------------------------------------------
// TABLA DE CONCLUSIONES Y MEMORIA FRECUENTE (DISPOSITIVO + IP + WHATSAPP)
// -------------------------------------------------------------
export interface RamitosMemoryConclusion {
  id?: string;
  deviceId: string;
  ipAddress?: string;
  whatsappCiudadano?: string;
  nombreCiudadano?: string;
  temaPrincipal: string;
  resumenContexto: string;
  ultimaConclusion: string;
  estadoPropuesta?: string;
  fechaActualizacion?: string;
}

const LOCAL_STORAGE_RAMITOS_MEMORY = 'alcalde_amigo_ramitos_memory';

export async function getRamitosMemory(deviceId?: string, ipAddress?: string): Promise<RamitosMemoryConclusion | null> {
  const targetDeviceId = deviceId || getDeviceId();
  const targetIp = ipAddress || await getClientIpAddress();

  if (supabaseClient) {
    try {
      // 1. Intentar consultar por device_id
      let { data, error } = await supabaseClient
        .from('conclusiones_memoria_ramitos')
        .select('*')
        .eq('device_id', targetDeviceId)
        .maybeSingle();

      // 2. Si no hay por device_id, consultar por ip_address
      if (!data && targetIp) {
        const resIp = await supabaseClient
          .from('conclusiones_memoria_ramitos')
          .select('*')
          .eq('ip_address', targetIp)
          .order('fecha_actualizacion', { ascending: false })
          .limit(1);
        if (resIp.data && resIp.data.length > 0) {
          data = resIp.data[0];
        }
      }

      if (data) {
        return {
          id: data.id,
          deviceId: data.device_id,
          ipAddress: data.ip_address,
          whatsappCiudadano: data.whatsapp_ciudadano,
          nombreCiudadano: data.nombre_ciudadano,
          temaPrincipal: data.tema_principal || 'Co-creación y Necesidades Cívicas',
          resumenContexto: data.resumen_contexto,
          ultimaConclusion: data.ultima_conclusion,
          estadoPropuesta: data.estado_propuesta || 'En Construcción',
          fechaActualizacion: data.fecha_actualizacion
        };
      }
    } catch (err) {
      console.warn('Error recuperando memoria de Supabase:', err);
    }
  }

  // Supabase es la ÚNICA fuente de verdad. Si no hay registros en Supabase, retorna null.
  return null;
}

export async function saveRamitosMemory(memory: Omit<RamitosMemoryConclusion, 'id' | 'fechaActualizacion'>): Promise<void> {
  const deviceId = memory.deviceId || getDeviceId();
  const ipAddress = memory.ipAddress || await getClientIpAddress();

  const savedLead = getUserLeadInfo();
  const nombreFinal = memory.nombreCiudadano || savedLead?.nombre || undefined;
  const whatsappFinal = memory.whatsappCiudadano || savedLead?.whatsapp || undefined;

  const fullMemory: RamitosMemoryConclusion = {
    ...memory,
    deviceId,
    ipAddress,
    nombreCiudadano: nombreFinal,
    whatsappCiudadano: whatsappFinal,
    fechaActualizacion: new Date().toISOString()
  };

  // Guardar EXCLUSIVAMENTE en Supabase
  if (supabaseClient) {
    try {
      await supabaseClient.from('conclusiones_memoria_ramitos').upsert({
        device_id: deviceId,
        ip_address: ipAddress,
        nombre_ciudadano: nombreFinal || null,
        whatsapp_ciudadano: whatsappFinal || null,
        tema_principal: fullMemory.temaPrincipal,
        resumen_contexto: fullMemory.resumenContexto,
        ultima_conclusion: fullMemory.ultimaConclusion,
        estado_propuesta: fullMemory.estadoPropuesta || 'En Construcción',
        fecha_actualizacion: fullMemory.fechaActualizacion
      }, { onConflict: 'device_id' });
    } catch (err) {
      console.warn('Error guardando memoria en Supabase:', err);
    }
  }
}

// -------------------------------------------------------------
// RECUPERACIÓN DE HISTORIAL COMPLETO DE DIÁLOGOS POR DISPOSITIVO E IP
// -------------------------------------------------------------
export interface PastUserInteraction {
  userText: string;
  ramitosResponse: string;
  timestamp: string;
}

export async function getPastInteractionsHistory(deviceId?: string, municipioId?: 'guaduas' | 'caparrapi' | string): Promise<PastUserInteraction[]> {
  const targetDeviceId = deviceId || getDeviceId();
  const munId = municipioId || 'guaduas';

  if (supabaseClient) {
    try {
      // Consultar estrictamente por device_id y municipio_id para aislar conversaciones de cada municipio
      let query = supabaseClient
        .from('interacciones_conversaciones_ramitos')
        .select('mensaje_textual_ciudadano, respuesta_limpia_ramitos, fecha_interaccion')
        .eq('device_id', targetDeviceId);

      if (munId) {
        query = query.eq('municipio_id', munId);
      }

      const { data, error } = await query
        .order('fecha_interaccion', { ascending: true })
        .limit(40);

      if (data && data.length > 0) {
        const parsed = data.map((item: any) => ({
          userText: item.mensaje_textual_ciudadano,
          ramitosResponse: item.respuesta_limpia_ramitos,
          timestamp: item.fecha_interaccion
        }));

        // Actualizar el caché local con los datos reales de Supabase
        try {
          const key = `ialcaldia_chat_history_v2_${munId}`;
          const formattedForLocal = [];
          for (const item of parsed) {
            const timeStr = item.timestamp
              ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            formattedForLocal.push({ sender: 'user', text: item.userText, time: timeStr, timestamp: item.timestamp });
            formattedForLocal.push({ sender: 'ramitos', text: item.ramitosResponse, time: timeStr, timestamp: item.timestamp });
          }
          localStorage.setItem(key, JSON.stringify(formattedForLocal));
        } catch (e) {}

        return parsed;
      }
    } catch (err) {
      console.warn('Error obteniendo historial completo de interacciones:', err);
    }
  }

  // Fallback garantizado desde LocalStorage si Supabase está cargando o offline
  try {
    const raw = localStorage.getItem(`ialcaldia_chat_history_v2_${munId}`);
    if (raw) {
      const list = JSON.parse(raw);
      const res: PastUserInteraction[] = [];
      for (let i = 0; i < list.length; i += 2) {
        const u = list[i];
        const r = list[i + 1];
        if (u && r) {
          res.push({
            userText: u.text,
            ramitosResponse: r.text,
            timestamp: u.timestamp || new Date().toISOString()
          });
        }
      }
      return res;
    }
  } catch (e) {}

  return [];
}

export function clearConversationHistory(municipioId: 'guaduas' | 'caparrapi' | string): void {
  try {
    localStorage.removeItem(`ialcaldia_chat_history_v2_${municipioId}`);
  } catch (e) {}
}

// -------------------------------------------------------------
// PURGA Y REEMPLAZO DE TÉRMINOS ERRÓNEOS DE AUDIOCORRECCIÓN EN SUPABASE
// -------------------------------------------------------------
export async function purgeAndReplaceTermInSupabaseHistory(
  wrongTerm: string,
  correctTerm: string,
  deviceId?: string,
  ipAddress?: string
): Promise<{ updatedInteractions: number; updatedMemories: number }> {
  const targetDeviceId = deviceId || getDeviceId();
  const targetIp = ipAddress || await getClientIpAddress();
  let updatedInteractions = 0;
  let updatedMemories = 0;

  if (!wrongTerm || !correctTerm || wrongTerm.trim().toLowerCase() === correctTerm.trim().toLowerCase()) {
    return { updatedInteractions: 0, updatedMemories: 0 };
  }

  const wrongClean = wrongTerm.trim();
  const correctClean = correctTerm.trim();

  // Variaciones fonéticas comunes (ej. "wolmart", "wolmar", "walmart")
  const searchVariants = [wrongClean];
  const wLower = wrongClean.toLowerCase();
  if (wLower.includes('wolm') || wLower.includes('walm')) {
    searchVariants.push('walmart', 'wolmart', 'wolmar', 'walmar', 'wolmart');
  }

  if (supabaseClient) {
    try {
      // 1. Actualizar interacciones_conversaciones_ramitos
      const { data: interacciones } = await supabaseClient
        .from('interacciones_conversaciones_ramitos')
        .select('*')
        .or(`device_id.eq.${targetDeviceId},ip_address.eq.${targetIp}`);

      if (interacciones && interacciones.length > 0) {
        for (const item of interacciones) {
          let updated = false;
          let userText = item.mensaje_textual_ciudadano || '';
          let ramitosResp = item.respuesta_limpia_ramitos || '';
          let reinterpret = item.reinterpretacion_estructurada_ia || '';

          for (const variant of searchVariants) {
            const reg = new RegExp(variant, 'gi');
            if (reg.test(userText)) {
              userText = userText.replace(reg, correctClean);
              updated = true;
            }
            if (reg.test(ramitosResp)) {
              ramitosResp = ramitosResp.replace(reg, correctClean);
              updated = true;
            }
            if (reinterpret && reg.test(reinterpret)) {
              reinterpret = reinterpret.replace(reg, correctClean);
              updated = true;
            }
          }

          if (updated) {
            await supabaseClient
              .from('interacciones_conversaciones_ramitos')
              .update({
                mensaje_textual_ciudadano: userText,
                respuesta_limpia_ramitos: ramitosResp,
                reinterpretacion_estructurada_ia: reinterpret || null
              })
              .eq('id', item.id);
            updatedInteractions++;
          }
        }
      }

      // 2. Actualizar conclusiones_memoria_ramitos
      const { data: memorias } = await supabaseClient
        .from('conclusiones_memoria_ramitos')
        .select('*')
        .or(`device_id.eq.${targetDeviceId},ip_address.eq.${targetIp}`);

      if (memorias && memorias.length > 0) {
        for (const mem of memorias) {
          let updated = false;
          let tema = mem.tema_principal || '';
          let resumen = mem.resumen_contexto || '';
          let conclusion = mem.ultima_conclusion || '';

          for (const variant of searchVariants) {
            const reg = new RegExp(variant, 'gi');
            if (reg.test(tema)) {
              tema = tema.replace(reg, correctClean);
              updated = true;
            }
            if (reg.test(resumen)) {
              resumen = resumen.replace(reg, correctClean);
              updated = true;
            }
            if (reg.test(conclusion)) {
              conclusion = conclusion.replace(reg, correctClean);
              updated = true;
            }
          }

          if (updated) {
            await supabaseClient
              .from('conclusiones_memoria_ramitos')
              .update({
                tema_principal: tema,
                resumen_contexto: resumen,
                ultima_conclusion: conclusion
              })
              .eq('id', mem.id);
            updatedMemories++;
          }
        }
      }

      // 3. Actualizar ciudadanos_leads si vereda_barrio o interes_principal tenía el término erróneo
      const { data: leads } = await supabaseClient
        .from('ciudadanos_leads')
        .select('*')
        .or(`device_id.eq.${targetDeviceId},ip_address.eq.${targetIp}`);

      if (leads && leads.length > 0) {
        for (const lead of leads) {
          let updated = false;
          let vereda = lead.vereda_barrio || '';
          let interes = lead.interes_principal || '';

          for (const variant of searchVariants) {
            const reg = new RegExp(variant, 'gi');
            if (reg.test(vereda)) {
              vereda = vereda.replace(reg, correctClean);
              updated = true;
            }
            if (reg.test(interes)) {
              interes = interes.replace(reg, correctClean);
              updated = true;
            }
          }

          if (updated) {
            await supabaseClient
              .from('ciudadanos_leads')
              .update({
                vereda_barrio: vereda,
                interes_principal: interes
              })
              .eq('id', lead.id);
          }
        }
      }
    } catch (err) {
      console.warn('Error purgando y reemplazando término en Supabase:', err);
    }
  }

  return { updatedInteractions, updatedMemories };
}

// -------------------------------------------------------------
// VERIFICACIÓN DIRECTA DE REGISTRO DE LEAD EN SUPABASE POR IP/DISPOSITIVO
// -------------------------------------------------------------
export async function checkUserLeadRegistrationInSupabase(deviceId?: string, ipAddress?: string): Promise<{ isRegistered: boolean; nombre?: string; whatsapp?: string }> {
  const targetDeviceId = deviceId || getDeviceId();
  const targetIp = ipAddress || await getClientIpAddress();

  if (supabaseClient) {
    try {
      // 1. Consultar por device_id
      let { data } = await supabaseClient
        .from('ciudadanos_leads')
        .select('nombre, whatsapp')
        .eq('device_id', targetDeviceId)
        .maybeSingle();

      // 2. Consultar por ip_address si no se encuentra por device_id
      if (!data && targetIp) {
        const resIp = await supabaseClient
          .from('ciudadanos_leads')
          .select('nombre, whatsapp')
          .eq('ip_address', targetIp)
          .limit(1);
        if (resIp.data && resIp.data.length > 0) data = resIp.data[0];
      }

      if (data && data.whatsapp && data.whatsapp.length > 5) {
        const cleanedName = cleanHumanName(data.nombre) || 'Ciudadano';
        return { isRegistered: true, nombre: cleanedName, whatsapp: data.whatsapp };
      }
    } catch (err) {
      console.warn('Error consultando registro de lead en Supabase:', err);
    }
  }

  // Supabase es la ÚNICA fuente de verdad. Si no hay datos en Supabase, retorna false.
  return { isRegistered: false };
}

export function getUserLeadInfo(): { nombre: string; whatsapp: string; veredaBarrio: string } | null {
  try {
    const leads = getCitizenLeads();
    const deviceId = getDeviceId();
    const match = leads.find(l => (l as any).deviceId === deviceId || (l.nombre && l.nombre !== 'Ciudadano Anónimo' && !l.nombre.startsWith('Ciudadano de')));
    if (match && match.whatsapp && match.whatsapp.length > 5) {
      const cleanedName = cleanHumanName(match.nombre) || 'Ciudadano';
      return { nombre: cleanedName, whatsapp: match.whatsapp, veredaBarrio: match.veredaBarrio };
    }
  } catch (e) {
    console.warn('Error recuperando datos del usuario:', e);
  }
  return null;
}

export function getCitizenLeads(): CitizenLead[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LEADS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

// -------------------------------------------------------------
// CONTROL ANTI-TROLL, ANTI-SPAM Y BLOQUEO POR 5 HORAS
// -------------------------------------------------------------
const LOCAL_STORAGE_SPAM_BLOCK = 'ialcaldia_spam_block_until';
const LOCAL_STORAGE_SPAM_STRIKES = 'ialcaldia_spam_strikes';
const LOCAL_STORAGE_VOTED_NEEDS = 'ialcaldia_voted_needs';

export function isTrollOrSpamContent(text: string): boolean {
  if (!text || text.trim().length < 4) return false;
  const lower = text.toLowerCase();
  
  // Detección de mofa, absurdos o peticiones no viables
  const trollPatterns = [
    /\b(?:10|diez|\d+)\s+helic[oó]pteros?\b/i,
    /\b(?:comprar|traer|mandar)\s+(?:helic[oó]pteros?|aviones?|cohetes?|ovnis?|aliens?|tanques?|bombas?)\b/i,
    /\b(?:prostitut|drogas?|cocaina|marihuana|mariju)\b/i,
    /\b(?:hpta|malparid|gonorrea|hijueputa|pirobo|carechimba)\b/i,
    /\b(?:fiesta\s+con\s+modelos|viaje\s+a\s+marte|viajar\s+a\s+la\s+luna)\b/i,
    /(.)\1{7,}/, // Repetición de caracteres
    /^[asdfghjklqwertyuiopzxcvbnm\s]{15,}$/i // Machaque de teclado
  ];

  return trollPatterns.some(p => p.test(lower));
}

export function getDeviceBlockStatus(): { isBlocked: boolean; remainingHours?: number } {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SPAM_BLOCK);
    if (raw) {
      const until = Number(raw);
      const now = Date.now();
      if (now < until) {
        const remainingHours = Math.max(1, Math.ceil((until - now) / (1000 * 60 * 60)));
        return { isBlocked: true, remainingHours };
      } else {
        localStorage.removeItem(LOCAL_STORAGE_SPAM_BLOCK);
        localStorage.removeItem(LOCAL_STORAGE_SPAM_STRIKES);
      }
    }
  } catch (e) {}
  return { isBlocked: false };
}

export function registerSpamStrike(): { blocked: boolean; isBlocked: boolean; remainingHours?: number } {
  try {
    const current = Number(localStorage.getItem(LOCAL_STORAGE_SPAM_STRIKES) || '0') + 1;
    localStorage.setItem(LOCAL_STORAGE_SPAM_STRIKES, String(current));
    if (current >= 2) {
      const blockUntil = Date.now() + 5 * 3600 * 1000; // 5 Horas de bloqueo
      localStorage.setItem(LOCAL_STORAGE_SPAM_BLOCK, String(blockUntil));
      return { blocked: true, isBlocked: true, remainingHours: 5 };
    }
  } catch (e) {}
  return { blocked: false, isBlocked: false };
}

// -------------------------------------------------------------
// SEMILLAS COMUNITARIAS VERIFICADAS POR MUNICIPIO
// -------------------------------------------------------------
const INITIAL_COMMUNITY_SEEDS_CAPARRAPI: CitizenNeed[] = [
  {
    id: 'seed-cap-1',
    ciudadanoNombre: 'Comité Pro-Vías San Carlos',
    veredaBarrio: 'San Carlos',
    audioTranscripcion: 'Requerimos pavimentación en placa huella modular en el tramo Cuatro Caminos hacia Las Ferias porque en época de lluvias se pierde la banca y los camiones no pueden sacar el cacao ni el ganado.',
    problematicaSintetizada: 'Pérdida de banca y lodazales críticos en el corredor comercial Cuatro Caminos - Las Ferias que impiden la salida de cosechas.',
    sector: 'Energía e Infraestructura',
    urgencia: 'Alta',
    propuestaRamitos: 'Estructuración MGA de placa huella modular prefabricada en los 2.4 km más críticos mediante convenios solidarios comunales.',
    insumosClave: ['Placas huellas prefabricadas', 'Cunetas y alcantarillado', 'Maquinaria pesada'],
    presupuestoEstimadoCop: 480000000,
    votosApoyo: 24,
    fechaReporte: new Date(Date.now() - 3600000 * 12).toISOString(),
    municipioId: 'caparrapi',
    origen: 'chat'
  },
  {
    id: 'seed-cap-2',
    ciudadanoNombre: 'Asociación de Productores Paneleros',
    veredaBarrio: 'Terán',
    audioTranscripcion: 'Necesitamos modernizar los trapiches con cámaras de combustión eficientes y un centro de acopio para que no nos paguen la panela a precio de intermediario.',
    problematicaSintetizada: 'Baja eficiencia térmica en molienda y dependencia de intermediarios que castigan el precio de la panela campesina.',
    sector: 'Campo y Desarrollo Agrícola',
    urgencia: 'Alta',
    propuestaRamitos: 'Modernización calórica de trapiches comunitarios y centro de acopio regional con empaque certificado para venta directa.',
    insumosClave: ['Hornos tipo CIMPA', 'Tanques de evaporación', 'Báscula y empaque'],
    presupuestoEstimadoCop: 310000000,
    votosApoyo: 19,
    fechaReporte: new Date(Date.now() - 3600000 * 24).toISOString(),
    municipioId: 'caparrapi',
    origen: 'chat'
  },
  {
    id: 'seed-cap-3',
    ciudadanoNombre: 'Junta de Acción Comunal San Pedro',
    veredaBarrio: 'San Pedro',
    audioTranscripcion: 'El agua del acueducto veredal llega turbia en invierno y en verano se corta por falta de bombeo eficiente.',
    problematicaSintetizada: 'Intermitencia y falta de potabilización técnica en el acueducto rural que abastece a más de 180 familias.',
    sector: 'Agua Potable y Saneamiento',
    urgencia: 'Crítica',
    propuestaRamitos: 'Instalación de sistema de filtración rápida y bombeo electro-solar fotovoltaico con tanque de reserva de 25.000 litros.',
    insumosClave: ['Paneles solares', 'Filtros de lecho mixto', 'Tanque de polietileno'],
    presupuestoEstimadoCop: 195000000,
    votosApoyo: 16,
    fechaReporte: new Date(Date.now() - 3600000 * 36).toISOString(),
    municipioId: 'caparrapi',
    origen: 'chat'
  },
  {
    id: 'seed-cap-4',
    ciudadanoNombre: 'Familias Productoras de La Magdalena',
    veredaBarrio: 'La Magdalena',
    audioTranscripcion: 'Los caminos de herradura y los pasos sobre las quebradas están intransitables para sacar las frutas y la leche.',
    problematicaSintetizada: 'Incomunicación veredal por pasos peatonales artesanales en riesgo sobre las cuencas en invierno.',
    sector: 'Energía e Infraestructura',
    urgencia: 'Media',
    propuestaRamitos: 'Construcción de dos puentes peatonales colgantes seguros y adecuación de 3 km de caminos vecinales con obras de drenaje.',
    insumosClave: ['Cables de acero', 'Maderas tratadas / perfiles metálicos', 'Piedra pegada'],
    presupuestoEstimadoCop: 120000000,
    votosApoyo: 12,
    fechaReporte: new Date(Date.now() - 3600000 * 48).toISOString(),
    municipioId: 'caparrapi',
    origen: 'chat'
  }
];

const INITIAL_COMMUNITY_SEEDS_GUADUAS: CitizenNeed[] = [
  {
    id: 'seed-gua-1',
    ciudadanoNombre: 'Comunidad Ribereña Puerto Bogotá',
    veredaBarrio: 'Puerto Bogotá',
    audioTranscripcion: 'Cada vez que crece el río Magdalena la bocatoma se tapa con lodo y el pueblo se queda sin agua 4 o 5 días.',
    problematicaSintetizada: 'Suspensión reiterada de agua potable por azolvamiento de la captación ribereña en crecidas del Magdalena.',
    sector: 'Agua Potable y Saneamiento',
    urgencia: 'Crítica',
    propuestaRamitos: 'Bocatoma flotante con pre-desarenador dinámico modular insensible a variaciones de cota del río.',
    insumosClave: ['Balsa flotante', 'Bombas sumergibles', 'Filtros autolimpiantes'],
    presupuestoEstimadoCop: 420000000,
    votosApoyo: 28,
    fechaReporte: new Date(Date.now() - 3600000 * 16).toISOString(),
    municipioId: 'guaduas',
    origen: 'chat'
  },
  {
    id: 'seed-gua-2',
    ciudadanoNombre: 'Asociación Veredal Guaduero',
    veredaBarrio: 'Guaduero',
    audioTranscripcion: 'La banca hacia Guaduas se hunde en el invierno y los productores no pueden sacar los productos agrícolas.',
    problematicaSintetizada: 'Fallas geológicas y falta de obras de arte en el corredor interveredal Guaduero - Guaduas.',
    sector: 'Energía e Infraestructura',
    urgencia: 'Alta',
    propuestaRamitos: 'Construcción de muros de contención en gaviones y 1.8 km de placa huella con alcantarillas de 36 pulgadas.',
    insumosClave: ['Gaviones de alambre galvanizado', 'Tubería de concreto', 'Concreto rígido'],
    presupuestoEstimadoCop: 380000000,
    votosApoyo: 22,
    fechaReporte: new Date(Date.now() - 3600000 * 30).toISOString(),
    municipioId: 'guaduas',
    origen: 'chat'
  }
];

// -------------------------------------------------------------
// GESTIÓN DE NECESIDADES Y PROPUESTAS CIUDADANAS (ESCUCHA RAMITOS)
// -------------------------------------------------------------
export async function saveCitizenNeed(need: Omit<CitizenNeed, 'id' | 'fechaReporte' | 'votosApoyo'>): Promise<CitizenNeed | null> {
  // 1. Filtrar troll / spam
  if (isTrollOrSpamContent(need.audioTranscripcion) || isTrollOrSpamContent(need.problematicaSintetizada)) {
    registerSpamStrike();
    return null;
  }

  // 2. Verificar bloqueo de dispositivo
  const blockStatus = getDeviceBlockStatus();
  if (blockStatus.isBlocked) {
    return null;
  }

  const newNeed: CitizenNeed = {
    ...need,
    id: `need-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    votosApoyo: 1,
    fechaReporte: new Date().toISOString()
  };

  // 3. Guardar en Supabase en las tablas problematicas_ciudadanas y propuestas_estructuradas_ia
  if (supabaseClient) {
    try {
      const { data: probData, error: probErr } = await supabaseClient.from('problematicas_ciudadanas').insert({
        ciudadano_nombre: newNeed.ciudadanoNombre,
        vereda_barrio: newNeed.veredaBarrio,
        transcripcion_audio: newNeed.audioTranscripcion,
        descripcion_problema: newNeed.problematicaSintetizada,
        sector: newNeed.sector,
        urgencia: newNeed.urgencia
      }).select().single();

      if (!probErr && probData) {
        await supabaseClient.from('propuestas_estructuradas_ia').insert({
          problematica_id: probData.id,
          intencion_sintetizada: newNeed.problematicaSintetizada,
          necesidad_clave: newNeed.insumosClave ? newNeed.insumosClave.join(', ') : 'Revisión técnica',
          propuesta_redactada_ramitos: newNeed.propuestaRamitos,
          estado_evaluacion: 'Pendiente Revision Humana'
        });
      }
    } catch (err) {
      console.warn('Error en Supabase saveNeed:', err);
    }
  }

  // 4. Guardar en LocalStorage evitando duplicados idénticos en la misma vereda
  const existing = getCitizenNeeds(need.municipioId);
  const isDuplicate = existing.some(item => 
    item.veredaBarrio.toLowerCase() === newNeed.veredaBarrio.toLowerCase() &&
    item.problematicaSintetizada.toLowerCase() === newNeed.problematicaSintetizada.toLowerCase()
  );

  if (!isDuplicate) {
    existing.unshift(newNeed);
    localStorage.setItem(LOCAL_STORAGE_NEEDS, JSON.stringify(existing));
  }

  return newNeed;
}

export function getCitizenNeeds(municipioId?: 'guaduas' | 'caparrapi' | string): CitizenNeed[] {
  try {
    let list: CitizenNeed[] = [];
    const raw = localStorage.getItem(LOCAL_STORAGE_NEEDS);
    if (raw) {
      list = JSON.parse(raw);
    }

    // Si la lista está vacía o es la primera vez, cargar semillas verificadas
    if (!list || list.length === 0) {
      list = [...INITIAL_COMMUNITY_SEEDS_CAPARRAPI, ...INITIAL_COMMUNITY_SEEDS_GUADUAS];
      localStorage.setItem(LOCAL_STORAGE_NEEDS, JSON.stringify(list));
    }

    // Filtrar elementos inválidos o preguntas conversacionales
    const cleaned = list.filter(n => {
      const vereda = (n.veredaBarrio || '').trim().toLowerCase();
      const prob = (n.problematicaSintetizada || '').toLowerCase();
      if (!vereda || vereda === 'por definir') return false;
      if (prob.includes('sí dime') || prob.includes('si dime') || prob.includes('cómo podemos') || prob.includes('como podemos') || prob.includes('de dónde sacas') || prob.includes('de donde sacas')) return false;
      return true;
    });

    if (municipioId) {
      const targetMun = municipioId.toLowerCase();
      const filtered = cleaned.filter(n => (n.municipioId || 'caparrapi').toLowerCase() === targetMun);
      return filtered.length > 0 ? filtered : cleaned;
    }

    return cleaned;
  } catch (e) {
    console.error(e);
  }
  return INITIAL_COMMUNITY_SEEDS_CAPARRAPI;
}

export function getVotedNeedIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_VOTED_NEEDS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function voteCitizenNeed(needId: string): Promise<{ success: boolean; newCount?: number; alreadyVoted?: boolean }> {
  try {
    const voted = getVotedNeedIds();
    if (voted.includes(needId)) {
      return { success: false, alreadyVoted: true };
    }

    const all = getCitizenNeeds();
    const target = all.find(n => n.id === needId);
    if (!target) return { success: false };

    target.votosApoyo = (target.votosApoyo || 0) + 1;
    voted.push(needId);
    localStorage.setItem(LOCAL_STORAGE_VOTED_NEEDS, JSON.stringify(voted));
    localStorage.setItem(LOCAL_STORAGE_NEEDS, JSON.stringify(all));

    // Si Supabase está conectado, actualizar votos
    if (supabaseClient) {
      try {
        await supabaseClient.rpc('increment_need_vote', { need_id: needId });
      } catch (e) {}
    }

    return { success: true, newCount: target.votosApoyo };
  } catch (e) {
    return { success: false };
  }
}

// -------------------------------------------------------------
// GESTIÓN DEL PLAN DE GOBIERNO (PROPOSALS)
// -------------------------------------------------------------
export function getBaseProposals(municipioId: 'guaduas' | 'caparrapi' = 'guaduas'): BaseProposal[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PLAN}_${municipioId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  // Retorna datos semilla por municipio
  return MUNICIPIOS_DATA[municipioId]?.proyectosBase || BASE_PROPOSALS;
}

export function saveBaseProposal(proposal: BaseProposal): void {
  const proposals = getBaseProposals();
  const index = proposals.findIndex(p => p.id === proposal.id);
  if (index >= 0) {
    proposals[index] = proposal;
  } else {
    proposals.unshift(proposal);
  }
  localStorage.setItem(LOCAL_STORAGE_PLAN, JSON.stringify(proposals));
}

// -------------------------------------------------------------
// HISTORIAL MENSAJES GREEN API
// -------------------------------------------------------------
export function saveGreenApiMessage(msg: Omit<GreenApiMessage, 'id' | 'fechaEnvio'>): GreenApiMessage {
  const newMsg: GreenApiMessage = {
    ...msg,
    id: `msg-${Date.now()}`,
    fechaEnvio: new Date().toISOString()
  };
  const list = getGreenApiMessages();
  list.unshift(newMsg);
  localStorage.setItem(LOCAL_STORAGE_MESSAGES, JSON.stringify(list));
  return newMsg;
}

export function getGreenApiMessages(): GreenApiMessage[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MESSAGES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

// -------------------------------------------------------------
// GESTIÓN DE PROYECTOS DE ALCALDÍA COPILOTO CON SUPABASE
// -------------------------------------------------------------
export async function getProyectosCopilotoFromSupabase(): Promise<BaseProposal[]> {
  if (!supabaseClient) {
    return getBaseProposals();
  }

  try {
    // 1. Consultar proyectos desde Supabase
    const { data: proyectosData, error: projError } = await supabaseClient
      .from('proyectos_copiloto')
      .select('*')
      .order('created_at', { ascending: true });

    if (projError || !proyectosData || proyectosData.length === 0) {
      // Si las tablas están vacías en Supabase, sembrar los proyectos base iniciales
      await seedBaseProposalsToSupabase();
      return BASE_PROPOSALS;
    }

    // 2. Para cada proyecto, recuperar sus insumos, mano de obra y comentarios
    const loadedProposals: BaseProposal[] = await Promise.all(
      proyectosData.map(async (pData) => {
        const [insumosRes, laborRes, commentsRes] = await Promise.all([
          supabaseClient!.from('insumos_copiloto').select('*').eq('proyecto_id', pData.id),
          supabaseClient!.from('mano_obra_copiloto').select('*').eq('proyecto_id', pData.id),
          supabaseClient!.from('comentarios_copiloto').select('*').eq('proyecto_id', pData.id).order('created_at', { ascending: false })
        ]);

        const comprasDetalladas: PurchaseItem[] = (insumosRes.data || []).map((ins) => ({
          id: ins.id,
          producto: ins.producto,
          cantidad: ins.cantidad,
          precioUnitarioCop: Number(ins.precio_unitario_cop),
          precioTotalCop: Number(ins.precio_total_cop),
          linkReferencia: ins.link_referencia || '',
          tienda: ins.tienda || 'MercadoLibre',
          estadoVerificacion: ins.estado_verificacion || 'pendiente_link',
          esLinkDirecto: ins.es_link_directo || false,
          opcionesComparativas: ins.opciones_comparativas || []
        }));

        const manoDeObraDetallada: LaborItem[] = (laborRes.data || []).map((mob) => ({
          id: mob.id,
          rol: mob.rol,
          personas: mob.personas,
          diasTrabajo: mob.dias_trabajo,
          tarifaDiariaCop: Number(mob.tarifa_diaria_cop),
          totalLaborCop: Number(mob.total_labor_cop)
        }));

        const comentariosComunidad: ProposalComment[] = (commentsRes.data || []).map((com) => ({
          id: com.id,
          autor: com.autor,
          rol: com.rol || 'Presidente JAC',
          texto: com.texto,
          seccion: com.seccion || 'general',
          fecha: new Date(com.created_at).toLocaleDateString('es-CO')
        }));

        return {
          id: pData.id,
          codigo: pData.codigo,
          titulo: pData.titulo,
          sector: pData.sector,
          veredasAfectadas: Array.isArray(pData.veredas_afectadas) ? pData.veredas_afectadas : [],
          diagnostico: pData.diagnostico || '',
          contrastePolitico: pData.contraste_politico || '',
          solucionPragmatica: pData.solucion_pragmatica || '',
          comprasDirectas: comprasDetalladas.map(c => c.producto),
          comprasDetalladas,
          manoDeObraDetallada,
          porcentajeFlete: Number(pData.porcentaje_flete || 5),
          presupuestoTotalCop: Number(pData.presupuesto_total_cop || 0),
          marcoLegal: pData.marco_legal || '',
          mecanismoLegalEspecifico: pData.mecanismo_legal_especifico || pData.marco_legal,
          pasosOperativosFastTrack: Array.isArray(pData.pasos_operativos_fast_track) ? pData.pasos_operativos_fast_track : [],
          votosVistoBueno: pData.votos_visto_bueno || 0,
          vistoBuenoAprobado: pData.visto_bueno_aprobado || false,
          comentariosComunidad,
          talentoHumano: manoDeObraDetallada.map(m => m.rol),
          cronogramaDias: pData.cronograma_dias || 7,
          estado: pData.estado || 'En Co-creación'
        };
      })
    );

    return loadedProposals;
  } catch (err) {
    console.warn('Error recuperando proyectos de Supabase:', err);
    return getBaseProposals();
  }
}

// Sembrar los proyectos base iniciales en Supabase si la tabla está vacía
export async function seedBaseProposalsToSupabase(): Promise<void> {
  if (!supabaseClient) return;

  try {
    for (const prop of BASE_PROPOSALS) {
      await saveOrUpdateProyectoCopiloto(prop);
    }
  } catch (err) {
    console.warn('Error en la siembra inicial de proyectos en Supabase:', err);
  }
}

// Guardar o actualizar un proyecto completo en Supabase
export async function saveOrUpdateProyectoCopiloto(proposal: BaseProposal): Promise<void> {
  // Guardar copia local de respaldo
  saveBaseProposal(proposal);

  if (!supabaseClient) return;

  try {
    // 1. Upsert proyecto
    await supabaseClient.from('proyectos_copiloto').upsert({
      id: proposal.id,
      codigo: proposal.codigo,
      titulo: proposal.titulo,
      sector: proposal.sector,
      veredas_afectadas: proposal.veredasAfectadas,
      diagnostico: proposal.diagnostico,
      contraste_politico: proposal.contrastePolitico,
      solucion_pragmatica: proposal.solucionPragmatica,
      presupuesto_total_cop: proposal.presupuestoTotalCop,
      porcentaje_flete: proposal.porcentajeFlete || 5,
      marco_legal: proposal.marcoLegal,
      mecanismo_legal_especifico: proposal.mecanismoLegalEspecifico || proposal.marcoLegal,
      pasos_operativos_fast_track: proposal.pasosOperativosFastTrack || [],
      cronograma_dias: proposal.cronogramaDias,
      estado: proposal.estado,
      votos_visto_bueno: proposal.votosVistoBueno || 0,
      visto_bueno_aprobado: proposal.vistoBuenoAprobado || false,
      updated_at: new Date().toISOString()
    });

    // 2. Upsert insumos
    if (proposal.comprasDetalladas && proposal.comprasDetalladas.length > 0) {
      for (const item of proposal.comprasDetalladas) {
        const itemId = item.id || `comp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        await supabaseClient.from('insumos_copiloto').upsert({
          id: itemId,
          proyecto_id: proposal.id,
          producto: item.producto,
          cantidad: item.cantidad,
          precio_unitario_cop: item.precioUnitarioCop,
          precio_total_cop: item.precioTotalCop || item.cantidad * item.precioUnitarioCop,
          link_referencia: item.linkReferencia || '',
          tienda: item.tienda || 'MercadoLibre',
          estado_verificacion: item.estadoVerificacion || 'pendiente_link',
          es_link_directo: item.esLinkDirecto || false,
          opciones_comparativas: item.opcionesComparativas || []
        });
      }
    }

    // 3. Upsert mano de obra
    if (proposal.manoDeObraDetallada && proposal.manoDeObraDetallada.length > 0) {
      for (const mob of proposal.manoDeObraDetallada) {
        const mobId = mob.id || `mob-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        await supabaseClient.from('mano_obra_copiloto').upsert({
          id: mobId,
          proyecto_id: proposal.id,
          rol: mob.rol,
          personas: mob.personas,
          dias_trabajo: mob.diasTrabajo,
          tarifa_diaria_cop: mob.tarifaDiariaCop,
          total_labor_cop: mob.totalLaborCop || mob.personas * mob.diasTrabajo * mob.tarifaDiariaCop
        });
      }
    }

  } catch (err) {
    console.warn('Error guardando proyecto Copiloto en Supabase:', err);
  }
}

// Guardar un comentario cívico veredal en Supabase
export async function saveComentarioCopilotoToSupabase(proposalId: string, comment: ProposalComment): Promise<void> {
  if (!supabaseClient) return;
  try {
    const deviceId = getDeviceId();
    const ipAddress = await getClientIpAddress();

    await supabaseClient.from('comentarios_copiloto').insert({
      id: comment.id,
      proyecto_id: proposalId,
      autor: comment.autor,
      rol: comment.rol,
      texto: comment.texto,
      seccion: comment.seccion || 'general',
      device_id: deviceId,
      ip_address: ipAddress
    });
  } catch (err) {
    console.warn('Error guardando comentario en Supabase:', err);
  }
}

// -------------------------------------------------------------
// GESTIÓN DE VOTACIONES Y ENCUESTAS CÍVICAS (PLANES PILOTO EN SUPABASE)
// -------------------------------------------------------------
const LOCAL_STORAGE_PILOT_VOTINGS = 'alcalde_amigo_pilot_votings';

const DEFAULT_PILOT_VOTINGS: PilotVoting[] = [
  {
    id: 'pilot-1',
    titulo: 'Plan Piloto: Sistema de Bombeo Solar con EcoFlow',
    descripcion: 'Selección de la vereda con mayor necesidad hídrica urgente para instalación del primer sistema de prueba.',
    veredaBarrio: 'Piedras Negras',
    votos: 142,
    metaVotos: 200,
    estado: 'activa'
  },
  {
    id: 'pilot-2',
    titulo: 'Plan Piloto: Conectividad Comunitaria Starlink',
    descripcion: 'Votación cívica para entregar el primer kit de internet satelital de alta velocidad a la escuela veredal.',
    veredaBarrio: 'Puerto Bogotá',
    votos: 98,
    metaVotos: 150,
    estado: 'activa'
  },
  {
    id: 'pilot-3',
    titulo: 'Plan Piloto: Parque Infantil y Juegos Seguros',
    descripcion: 'Encuesta participativa para dotar el primer parque infantil en Guaduas.',
    veredaBarrio: 'El Hato',
    votos: 76,
    metaVotos: 100,
    estado: 'activa'
  }
];

export async function getPilotVotingsFromSupabase(): Promise<PilotVoting[]> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('propuestas_votaciones_copiloto')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((v: any) => ({
          id: v.id,
          proyectoId: v.proyecto_id,
          titulo: v.titulo,
          descripcion: v.descripcion,
          veredaBarrio: v.vereda_barrio,
          votos: v.votos || 0,
          metaVotos: v.meta_votos || 100,
          estado: v.estado || 'activa',
          fechaCreacion: v.created_at
        }));
      }
    } catch (err) {
      console.warn('Error obteniendo votaciones de Supabase:', err);
    }
  }

  // Fallback LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PILOT_VOTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(e);
  }
  return DEFAULT_PILOT_VOTINGS;
}

export async function voteForPilotCommunityInSupabase(votingId: string): Promise<number> {
  const currentList = await getPilotVotingsFromSupabase();
  const match = currentList.find(v => v.id === votingId);
  const newVotes = match ? match.votos + 1 : 1;

  if (supabaseClient) {
    try {
      await supabaseClient
        .from('propuestas_votaciones_copiloto')
        .update({ votos: newVotes })
        .eq('id', votingId);
    } catch (err) {
      console.warn('Error votando en Supabase:', err);
    }
  }

  const updated = currentList.map(v => v.id === votingId ? { ...v, votos: newVotes } : v);
  localStorage.setItem(LOCAL_STORAGE_PILOT_VOTINGS, JSON.stringify(updated));
  return newVotes;
}

// -------------------------------------------------------------
// APORTES DE REENTRENAMIENTO Y PROPUESTAS DEL EQUIPO EN SUPABASE
// -------------------------------------------------------------
export interface TeamAporte {
  id: string;
  fecha: string;
  inspeccion: string;
  tema: string;
  titulo: string;
  detalle: string;
  estado: string;
  autor?: string;
}

export async function saveTeamContribution(
  aporte: Omit<TeamAporte, 'id' | 'fecha' | 'estado'>,
  municipioId: 'guaduas' | 'caparrapi'
): Promise<TeamAporte> {
  const newAporte: TeamAporte = {
    id: `APORTE-${Date.now()}`,
    fecha: new Date().toISOString().slice(0, 16).replace('T', ' '),
    inspeccion: aporte.inspeccion,
    tema: aporte.tema,
    titulo: aporte.titulo,
    detalle: aporte.detalle,
    estado: 'Sincronizado en Supabase',
    autor: aporte.autor || 'Equipo Estratégico'
  };

  // Guardar en Supabase
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('interacciones_plan_gobierno').insert({
        municipio_id: municipioId,
        tipo_interaccion: aporte.tema || 'Aporte Estratégico',
        comentario_sugerencia: `[${aporte.inspeccion} - ${aporte.tema}] ${aporte.titulo}: ${aporte.detalle}`,
        dispositivo_id: getDeviceId()
      });
    } catch (err) {
      console.warn('Error guardando aporte en Supabase:', err);
    }
  }

  // Guardar en LocalStorage
  try {
    const key = `ialcaldia_aportes_${municipioId}`;
    const local = localStorage.getItem(key);
    const existing = local ? JSON.parse(local) : [];
    existing.unshift(newAporte);
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (e) {
    console.warn(e);
  }

  return newAporte;
}

export async function getTeamContributions(
  municipioId: 'guaduas' | 'caparrapi'
): Promise<TeamAporte[]> {
  let list: TeamAporte[] = [];

  // 1. Cargar desde Supabase
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data } = await client
        .from('interacciones_plan_gobierno')
        .select('*')
        .eq('municipio_id', municipioId)
        .order('fecha_interaccion', { ascending: false });

      if (data && data.length > 0) {
        list = data.map((d: any) => {
          let inspeccion = municipioId === 'caparrapi' ? 'San Carlos' : 'Guaduero';
          let titulo = 'Aporte del Equipo';
          let detalle = d.comentario_sugerencia || '';

          // Parse formato [Inspeccion - Tema] Titulo: Detalle
          const match = detalle.match(/^\[(.*?)\]\s*(.*?):\s*(.*)$/);
          if (match) {
            inspeccion = match[1];
            titulo = match[2];
            detalle = match[3];
          }

          return {
            id: `sb-${d.id}`,
            fecha: (d.fecha_interaccion || '').slice(0, 16).replace('T', ' '),
            inspeccion,
            tema: d.tipo_interaccion || 'Estrategia Territorial',
            titulo,
            detalle,
            estado: 'Sincronizado en Supabase',
            autor: 'Equipo de Campaña'
          };
        });
      }
    } catch (err) {
      console.warn('Error cargando aportes desde Supabase:', err);
    }
  }

  // 2. Mezclar con LocalStorage
  try {
    const key = `ialcaldia_aportes_${municipioId}`;
    const local = localStorage.getItem(key);
    if (local) {
      const parsed: TeamAporte[] = JSON.parse(local);
      const existingIds = new Set(list.map(l => l.id));
      for (const p of parsed) {
        if (!existingIds.has(p.id)) {
          list.push(p);
        }
      }
    }
  } catch (e) {
    console.warn(e);
  }

  return list;
}

// -------------------------------------------------------------
// CONSULTA EN TIEMPO REAL A LA API OFICIAL DE SECOP II (DATOS ABIERTOS)
// -------------------------------------------------------------
export async function fetchLiveSecopFromDatosGov(municipioId: 'guaduas' | 'caparrapi', baseContracts: any[] = []): Promise<any[]> {
  const ciudadName = municipioId === 'caparrapi' ? 'Caparrapí' : 'Guaduas';
  const url = `https://www.datos.gov.co/resource/jbjy-vk9h.json?departamento=Cundinamarca&ciudad=${encodeURIComponent(ciudadName)}&$limit=2000`;
  
  try {
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) {
      console.warn(`Aviso en API SECOP II: ${response.statusText}`);
      return baseContracts;
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) return baseContracts;

    const liveContracts = data.map((c: any) => ({
      id: c.id_contrato || c.referencia_del_contrato || 'S/N',
      entidad: c.nombre_entidad || (municipioId === 'caparrapi' ? 'ALCALDÍA DE CAPARRAPÍ' : 'ALCALDÍA DE GUADUAS'),
      objeto: c.objeto_del_contrato || c.descripcion_del_proceso || 'Sin descripción',
      valor: parseFloat(c.valor_del_contrato || 0),
      modalidad: c.modalidad_de_contratacion || 'Directa',
      proveedor: c.proveedor_adjudicado || 'No reportado',
      fecha: (c.fecha_de_firma || '').slice(0, 10),
      año: (c.fecha_de_firma || '').slice(0, 4),
      estado: c.estado_contrato || 'Aprobado',
      url: c.urlproceso && c.urlproceso.url ? c.urlproceso.url : 'https://community.secop.gov.co/'
    })).filter((c: any) => c.valor > 0 && c.valor < 50000000000);

    // Fusionar contratos en vivo con la base histórica completa (SECOP I y II)
    const map = new Map<string, any>();
    liveContracts.forEach(c => map.set(c.id, c));
    baseContracts.forEach(c => {
      if (!map.has(c.id)) {
        map.set(c.id, c);
      }
    });

    return Array.from(map.values());
  } catch (err) {
    console.warn('Error conectando a datos.gov.co, manteniendo base local:', err);
    return baseContracts;
  }
}

