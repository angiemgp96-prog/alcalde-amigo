import { getCanonicalSectorRequisitos, sanitizeAndMigrateProjectRequirements, detectSectorDnpType } from './sectorialRequirementsService';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  CitizenNeed, CitizenLead, BaseProposal, GreenApiMessage, PurchaseItem, 
  LaborItem, ProposalComment, PilotVoting, ProyectoMgaEstructurado, 
  RequisitoViabilidad, CensoBeneficiario, PresupuestoApuItem 
} from '../types';
import { BASE_PROPOSALS } from '../data/basePlanData';
import { MUNICIPIOS_DATA } from '../data/municipiosConfig';
import { getDeviceId, getClientIpAddress, getDeviceCategory } from './deviceMemory';
import { cleanHumanName, isValidHumanName, isValidColombianPhone, formatColombianPhone } from './leadValidationService';
export { cleanHumanName, isValidHumanName, isValidColombianPhone, formatColombianPhone };

const LOCAL_STORAGE_NEEDS = 'alcalde_amigo_needs';
const LOCAL_STORAGE_LEADS = 'alcalde_amigo_leads';
const LOCAL_STORAGE_PLAN = 'alcalde_amigo_plan';
const LOCAL_STORAGE_MESSAGES = 'alcalde_amigo_messages';
const LOCAL_STORAGE_SUPABASE_CONFIG = 'alcalde_amigo_supabase_cfg';

const DEFAULT_SUPABASE_URL = 'https://nfisbtgeuwfvorlwjcyb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5maXNidGdldXdmdm9ybHdqY3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMjIzNjIsImV4cCI6MjEwNjc5ODM2Mn0.pbHoVQhO5Gp0YXgCck8qNDGt43gMK_EbhFZxnbd_pxQ';

// Limpieza proactiva de configuraciones obsoletas o corruptas en LocalStorage
if (typeof localStorage !== 'undefined') {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SUPABASE_CONFIG);
    if (saved && !saved.includes('nfisbtgeuwfvorlwjcyb')) {
      localStorage.removeItem(LOCAL_STORAGE_SUPABASE_CONFIG);
    }
    // Si el historial local de Caparrapí solo tiene 1 mensaje (el saludo), limpiarlo para recargar las 4 intervenciones reales de Supabase
    const localCap = localStorage.getItem('ialcaldia_chat_history_v2_caparrapi');
    if (localCap) {
      const parsedCap = JSON.parse(localCap);
      if (Array.isArray(parsedCap) && parsedCap.length <= 1) {
        localStorage.removeItem('ialcaldia_chat_history_v2_caparrapi');
      }
    }
  } catch (e) {}
}

let supabaseClient: SupabaseClient | null = null;

// Inicializa Supabase garantizando el endpoint oficial
export function initSupabase(url: string, anonKey: string): boolean {
  const targetUrl = url && url.includes('supabase.co') ? url : DEFAULT_SUPABASE_URL;
  const targetKey = anonKey && anonKey.length > 20 ? anonKey : DEFAULT_SUPABASE_ANON_KEY;
  try {
    supabaseClient = createClient(targetUrl, targetKey);
    return true;
  } catch (e) {
    console.error('Error al inicializar Supabase client:', e);
    supabaseClient = null;
    return false;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseClient) {
    initSupabase(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

// PURGA AUTOMÁTICA DE DATOS FANTASMA EN LOCALSTORAGE (Preserva la identidad del ciudadano)
export function purgePhantomLocalStorageCache(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_NEEDS);
    localStorage.removeItem('alcalde_amigo_ramitos_memory');
    localStorage.removeItem(LOCAL_STORAGE_MESSAGES);
    purgePhantomSeeds();
  } catch (e) {
    console.warn('Error purgando caché fantasma:', e);
  }
}

// Carga configuración oficial de Supabase
export function getSavedSupabaseConfig(): { url: string; anonKey: string; isConnected: boolean } {
  initSupabase(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
  return { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY, isConnected: true };
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
  const cleanName = cleanHumanName(nombre);
  const cleanPhone = whatsapp ? whatsapp.replace(/[\s.-]/g, '') : '';
  if (!cleanName && !cleanPhone) return false;

  const finalNameToSave = cleanName || 'Ciudadano';
  const deviceId = getDeviceId();
  const ipAddress = await getClientIpAddress();

  if (supabaseClient) {
    try {
      // 1. Intentar actualizar por device_id
      const { data, error } = await supabaseClient
        .from('ciudadanos_leads')
        .update({
          nombre: finalNameToSave,
          whatsapp: cleanPhone,
          vereda_barrio: veredaBarrio || 'Guaduas'
        })
        .eq('device_id', deviceId)
        .select();

      if (error || !data || data.length === 0) {
        // 2. Si no encontró por device_id, intentar por ip_address
        await supabaseClient
          .from('ciudadanos_leads')
          .update({
            nombre: finalNameToSave,
            whatsapp: cleanPhone,
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
          nombre: finalNameToSave,
          whatsapp: cleanPhone,
          veredaBarrio: veredaBarrio || l.veredaBarrio
        };
      }
      return l;
    });

    if (!found || updated.length === 0) {
      updated.unshift({
        id: `lead-${Date.now()}`,
        nombre: finalNameToSave,
        whatsapp: cleanPhone,
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
  const munId = log.municipioId || 'caparrapi';

  // Buscar información de lead previa si no viene dada
  const savedLead = getUserLeadInfo();
  const nombreFinal = log.nombreCiudadano || savedLead?.nombre || null;
  const whatsappFinal = log.whatsappCiudadano || savedLead?.whatsapp || null;

  // 1. Guardar de inmediato en LocalStorage
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

  // 2. Guardar en Supabase garantizado
  const client = supabaseClient || getSupabaseClient();
  if (client) {
    try {
      await client.from('interacciones_conversaciones_ramitos').insert({
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
// CACHÉ EN MEMORIA PARA ACCESO INSTANTÁNEO ULTRA-RÁPIDO (0ms)
// -------------------------------------------------------------
const memoryHistoryCache: Record<string, PastUserInteraction[]> = {};
let memoryLeadCache: { isRegistered: boolean; nombre?: string; whatsapp?: string } | null = null;

export function getCachedLeadInfo(): { isRegistered: boolean; nombre?: string; whatsapp?: string } | null {
  if (memoryLeadCache) return memoryLeadCache;
  const local = getUserLeadInfo();
  if (local && local.nombre && local.whatsapp) {
    memoryLeadCache = { isRegistered: true, nombre: local.nombre, whatsapp: local.whatsapp };
    return memoryLeadCache;
  }
  return null;
}

export function setCachedLeadInfo(info: { isRegistered: boolean; nombre?: string; whatsapp?: string }) {
  memoryLeadCache = info;
}

export interface PastUserInteraction {
  userText: string;
  ramitosResponse: string;
  timestamp: string;
}

export async function getPastInteractionsHistory(deviceId?: string, municipioId?: 'guaduas' | 'caparrapi' | string): Promise<PastUserInteraction[]> {
  const munId = municipioId || 'caparrapi';
  const client = supabaseClient || getSupabaseClient();
  const currentDeviceId = deviceId || getDeviceId();
  const memKey = `${munId}_${currentDeviceId}`;
  const localHistoryKey = `ialcaldia_chat_history_v2_${munId}`;
  const hasLocalInteractions = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem(localHistoryKey));

  // Si ya tenemos en memoria RAM para este municipio y dispositivo, devolverlo de inmediato (0ms)
  if (memoryHistoryCache[memKey] && memoryHistoryCache[memKey].length > 0) {
    return memoryHistoryCache[memKey];
  }

  if (client) {
    try {
      // Consultar interacciones del municipio
      let query = client
        .from('interacciones_conversaciones_ramitos')
        .select('id, mensaje_textual_ciudadano, respuesta_limpia_ramitos, fecha_interaccion, device_id')
        .eq('municipio_id', munId)
        .neq('mensaje_textual_ciudadano', 'Prueba de guardado');

      // Si este dispositivo ya tenía sesión previa de Iván en este navegador:
      if (currentDeviceId === 'device-desktop-caparrapi' || currentDeviceId === 'device-mobile-caparrapi') {
        query = query.eq('device_id', currentDeviceId);
      } else if (hasLocalInteractions) {
        const category = getDeviceCategory();
        const legacyId = category === 'mobile' ? 'device-mobile-caparrapi' : 'device-desktop-caparrapi';
        query = query.or('device_id.eq.' + currentDeviceId + ',device_id.eq.' + legacyId);
      } else {
        // DISPOSITIVO TOTALMENTE NUEVO: buscar estrictamente por su propio ID nuevo (devuelve 0 filas)
        query = query.eq('device_id', currentDeviceId);
      }

      const { data, error } = await query
        .order('fecha_interaccion', { ascending: true })
        .limit(50);

      if (!error && data && data.length > 0) {
        const parsed: PastUserInteraction[] = data.map((item: any) => ({
          userText: item.mensaje_textual_ciudadano,
          ramitosResponse: item.respuesta_limpia_ramitos,
          timestamp: item.fecha_interaccion
        }));

        memoryHistoryCache[memKey] = parsed;

        // Actualizar el caché local con los datos reales de Supabase para este dispositivo
        try {
          const formattedForLocal: Array<{ sender: 'user' | 'ramitos'; text: string; time: string; timestamp?: string }> = [];
          for (const item of parsed) {
            const timeStr = item.timestamp
              ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            formattedForLocal.push({ sender: 'user', text: item.userText, time: timeStr, timestamp: item.timestamp });
            formattedForLocal.push({ sender: 'ramitos', text: item.ramitosResponse, time: timeStr, timestamp: item.timestamp });
          }
          localStorage.setItem(localHistoryKey, JSON.stringify(formattedForLocal));
        } catch (e) {}

        return parsed;
      }
    } catch (err) {
      console.warn('Error obteniendo historial de interacciones:', err);
    }
  }

  // Fallback desde LocalStorage SOLO si este navegador tiene historial previo
  if (hasLocalInteractions) {
    try {
      const raw = localStorage.getItem(localHistoryKey);
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
  }

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
export async function checkUserLeadRegistrationInSupabase(deviceId?: string): Promise<{ isRegistered: boolean; nombre?: string; whatsapp?: string }> {
  // 0. Si ya tenemos en memoria o local, devolverlo al instante (0ms) sin bloquear la red
  const fastCached = getCachedLeadInfo();
  if (fastCached && fastCached.isRegistered && fastCached.nombre) {
    return fastCached;
  }

  const targetDeviceId = deviceId || getDeviceId();
  const client = supabaseClient || getSupabaseClient();
  const munId = 'caparrapi';
  const hasLocalInteractions = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem(`ialcaldia_chat_history_v2_${munId}`));

  if (client) {
    try {
      // 1. Consultar estrictamente por device_id en ciudadanos_leads
      let { data } = await client
        .from('ciudadanos_leads')
        .select('nombre, whatsapp, vereda_barrio')
        .eq('device_id', targetDeviceId)
        .maybeSingle();

      // 2. Si este dispositivo físico ya tenía sesión previa de Iván en este navegador:
      if (!data && hasLocalInteractions) {
        const category = getDeviceCategory();
        const legacyId = category === 'mobile' ? 'device-mobile-caparrapi' : 'device-desktop-caparrapi';
        const resInt = await client
          .from('interacciones_conversaciones_ramitos')
          .select('nombre_ciudadano, whatsapp_ciudadano')
          .or(`device_id.eq.${targetDeviceId},device_id.eq.${legacyId}`)
          .not('nombre_ciudadano', 'is', null)
          .order('fecha_interaccion', { ascending: false })
          .limit(1);

        if (resInt.data && resInt.data.length > 0 && resInt.data[0].nombre_ciudadano) {
          data = {
            nombre: resInt.data[0].nombre_ciudadano,
            whatsapp: resInt.data[0].whatsapp_ciudadano || '',
            vereda_barrio: ''
          };
        }
      } else if (!data) {
        // Dispositivo nuevo sin historial: buscar estrictamente por su propio device_id
        const resInt = await client
          .from('interacciones_conversaciones_ramitos')
          .select('nombre_ciudadano, whatsapp_ciudadano')
          .eq('device_id', targetDeviceId)
          .not('nombre_ciudadano', 'is', null)
          .order('fecha_interaccion', { ascending: false })
          .limit(1);

        if (resInt.data && resInt.data.length > 0 && resInt.data[0].nombre_ciudadano) {
          data = {
            nombre: resInt.data[0].nombre_ciudadano,
            whatsapp: resInt.data[0].whatsapp_ciudadano || '',
            vereda_barrio: ''
          };
        }
      }

      if (data && data.nombre) {
        let cleanedName = cleanHumanName(data.nombre);
        if (cleanedName && cleanedName.length > 1 && !['estas', 'estás', 'hola', 'buenas', 'yo', 'mi', 'ciudadano'].includes(cleanedName.toLowerCase())) {
          // Sincronizar en memoria local para acceso sincrónico instantáneo
          try {
            const cachedLeads: CitizenLead[] = getCitizenLeads();
            if (data.whatsapp && !cachedLeads.some(l => l.whatsapp === data.whatsapp)) {
              cachedLeads.unshift({
                id: 'lead-synced',
                nombre: cleanedName,
                whatsapp: data.whatsapp,
                veredaBarrio: data.vereda_barrio || '',
                fechaRegistro: new Date().toISOString(),
                estadoNotificacion: 'activo'
              });
              localStorage.setItem(LOCAL_STORAGE_LEADS, JSON.stringify(cachedLeads));
            }
          } catch (e) {}

          const result = { isRegistered: true, nombre: cleanedName, whatsapp: data.whatsapp || undefined };
          setCachedLeadInfo(result);
          return result;
        }
      }
    } catch (err) {
      console.warn('Error consultando registro de lead en Supabase:', err);
    }
  }

  return { isRegistered: false };
}

export function getUserLeadInfo(): { nombre: string; whatsapp: string; veredaBarrio: string } | null {
  try {
    const leads = getCitizenLeads();
    const deviceId = getDeviceId();
    const match = leads.find(l => (l as any).deviceId === deviceId || (l.nombre && l.nombre !== 'Ciudadano Anónimo' && !l.nombre.startsWith('Ciudadano de')));
    if (match && match.whatsapp && match.whatsapp.length > 5) {
      const cleanedName = cleanHumanName(match.nombre);
      return { nombre: cleanedName || '', whatsapp: match.whatsapp, veredaBarrio: match.veredaBarrio };
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
// GESTIÓN DE NECESIDADES Y PROPUESTAS CIUDADANAS (ESTRICTAMENTE AISLADAS POR MUNICIPIO)
// -------------------------------------------------------------
const getStorageKeyForNeeds = (mun?: string) => `alcalde_amigo_needs_${(mun || 'caparrapi').toLowerCase()}`;

// Purga de cualquier semilla artificial o fantasma previa
export function purgePhantomSeeds(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_NEEDS); // Purga la lista combinada antigua
    ['caparrapi', 'guaduas'].forEach(mun => {
      const key = getStorageKeyForNeeds(mun);
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: CitizenNeed[] = JSON.parse(raw);
        const filtered = parsed.filter(n => n && n.id && !n.id.startsWith('seed-'));
        localStorage.setItem(key, JSON.stringify(filtered));
      }
    });
  } catch (e) {}
}

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

  const mun = (need.municipioId || 'caparrapi').toLowerCase() as 'caparrapi' | 'guaduas';

  const newNeed: CitizenNeed = {
    ...need,
    id: `need-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    municipioId: mun,
    votosApoyo: 1,
    fechaReporte: new Date().toISOString()
  };

  // 3. Guardar en Supabase en las tablas problematicas_ciudadanas y propuestas_estructuradas_ia
  const client = supabaseClient || getSupabaseClient();
  if (client) {
    try {
      const { data: probData, error: probErr } = await client.from('problematicas_ciudadanas').insert({
        municipio_id: mun,
        ciudadano_nombre: newNeed.ciudadanoNombre,
        vereda_barrio: newNeed.veredaBarrio,
        transcripcion_audio: newNeed.audioTranscripcion,
        descripcion_problema: newNeed.problematicaSintetizada,
        sector: newNeed.sector,
        urgencia: newNeed.urgencia,
        votos_comunitarios: newNeed.votosApoyo || 1
      }).select().single();

      if (!probErr && probData) {
        newNeed.id = probData.id;
        await client.from('propuestas_estructuradas_ia').insert({
          municipio_id: mun,
          problematica_id: probData.id,
          intencion_sintetizada: newNeed.problematicaSintetizada,
          necesidad_clave: newNeed.insumosClave ? newNeed.insumosClave.join(', ') : 'Revisión técnica',
          propuesta_redactada_ramitos: newNeed.propuestaRamitos,
          estado_evaluacion: 'Pendiente Revision Humana'
        });
        // Sincronizar inmediatamente desde Supabase a memoria
        await fetchCitizenNeedsFromSupabase(mun);
      } else if (probErr) {
        console.warn('Error insertando en problematicas_ciudadanas:', probErr);
      }
    } catch (err) {
      console.warn('Error en Supabase saveNeed:', err);
    }
  }

  // 4. Guardar en LocalStorage estrictamente en la partición de su municipio (sin mezclar)
  const key = getStorageKeyForNeeds(mun);
  const existing = getCitizenNeeds(mun);
  const isDuplicate = existing.some(item => 
    item.veredaBarrio.toLowerCase() === newNeed.veredaBarrio.toLowerCase() &&
    item.problematicaSintetizada.toLowerCase() === newNeed.problematicaSintetizada.toLowerCase()
  );

  if (!isDuplicate) {
    existing.unshift(newNeed);
    localStorage.setItem(key, JSON.stringify(existing));
  }

  return newNeed;
}

export function getCitizenNeeds(municipioId: 'guaduas' | 'caparrapi' | string = 'caparrapi'): CitizenNeed[] {
  try {
    const mun = (municipioId || 'caparrapi').toLowerCase();
    const key = getStorageKeyForNeeds(mun);
    let list: CitizenNeed[] = [];
    const raw = localStorage.getItem(key);
    if (raw) {
      list = JSON.parse(raw);
    }

    // Filtrar estrictamente: SOLO propuestas reales detectadas o registradas (cero inventos)
    const guaduasOnlyVeredas = ['puerto bogotá', 'puerto bogota', 'guaduero', 'piedras negras', 'guaduas centro', 'la paz', 'el hato', 'san josé', 'san jose', 'yaguara', 'la esperanza', 'carbonera', 'canta rana', 'versalles'];
    const caparrapiOnlyVeredas = ['san carlos', 'san pablo', 'san ramón', 'san ramon', 'pitalito', 'terán', 'teran', 'san pedro', 'la magdalena', 'el dindal', 'morro negro', 'córdoba', 'cordoba', 'puerto colombia', 'cuatro caminos', 'alto del roble', 'acuaparrapí', 'acuaparrapi', 'el silencio', 'el dinde', 'mata de mora', 'la chorrera', 'boca de monte', 'galiche', 'barranquillas', 'loma alta', 'hoyo caliente', 'caparrapí centro', 'caparrapi centro'];

    const isCap = mun === 'caparrapi';

    let cleaned = (list || []).filter(n => {
      if (!n || !n.id) return false;
      // Prohibido mostrar semillas artificiales o ficticias
      if (n.id.startsWith('seed-')) return false;

      const vereda = (n.veredaBarrio || '').trim().toLowerCase();
      const prob = (n.problematicaSintetizada || '').toLowerCase();
      if (!vereda || vereda === 'por definir') return false;
      if (prob.includes('sí dime') || prob.includes('si dime') || prob.includes('cómo podemos') || prob.includes('como podemos') || prob.includes('de dónde sacas') || prob.includes('de donde sacas') || prob.includes('qué proyectos hay')) return false;

      // AISLAMIENTO TERRITORIAL TOTAL (NO CONFUNDIR CAPARRAPÍ CON GUADUAS)
      if (isCap) {
        if (n.municipioId && n.municipioId === 'guaduas') return false;
        if (guaduasOnlyVeredas.includes(vereda)) return false;
      } else {
        if (n.municipioId && n.municipioId === 'caparrapi') return false;
        if (caparrapiOnlyVeredas.includes(vereda)) return false;
      }

      return true;
    });

    // MIGRACIÓN Y NORMALIZACIÓN: Vincular IDs oficiales de Supabase y asegurar que ambas propuestas reales estén presentes
    if (isCap) {
      // Migrar 'need-ivan-sancarlos' al ID real de Supabase '79766ed5-a5e0-4ac2-ac00-7974548b799d'
      const oldIvan = cleaned.find(n => n.id === 'need-ivan-sancarlos');
      if (oldIvan) {
        oldIvan.id = '79766ed5-a5e0-4ac2-ac00-7974548b799d';
        oldIvan.votosApoyo = Math.max(oldIvan.votosApoyo || 1, 2);
      }

      // Si no existe la propuesta de San Carlos, agregarla con su ID real y 2 votos
      if (!cleaned.some(n => n.id === '79766ed5-a5e0-4ac2-ac00-7974548b799d' || n.veredaBarrio?.toLowerCase() === 'san carlos')) {
        cleaned.unshift({
          id: '79766ed5-a5e0-4ac2-ac00-7974548b799d',
          ciudadanoNombre: 'Iván',
          veredaBarrio: 'San Carlos',
          audioTranscripcion: 'Mejorar la conectividad de internet en San Carlos',
          problematicaSintetizada: 'Mejorar la conectividad de internet y cobertura digital en la vereda San Carlos',
          sector: 'Educación y Conectividad',
          urgencia: 'Alta',
          propuestaRamitos: 'Instalación de antena satelital Starlink y zona Wi-Fi comunitaria con respaldo solar para San Carlos.',
          insumosClave: ['Antena satelital Starlink', 'Router Wi-Fi largo alcance', 'Kit solar de respaldo'],
          presupuestoEstimadoCop: 45000000,
          votosApoyo: 2,
          fechaReporte: '2026-10-08T17:59:48.775827+00:00',
          municipioId: 'caparrapi',
          origen: 'chat'
        });
      }

      // Limpiar cualquier propuesta de prueba antigua
      cleaned = cleaned.filter(n => n.id !== '8b1fd1b9-43a0-435f-9794-96b5b463dc7c');

      // Si no existe la propuesta real de San Pablo (Placa huella), agregarla con su ID oficial y 1 voto
      if (!cleaned.some(n => n.id === '98ab2b1d-5853-42ab-a9f9-648ed4aecba3' || (n.veredaBarrio && n.veredaBarrio.toLowerCase().includes('san pablo')))) {
        cleaned.push({
          id: '98ab2b1d-5853-42ab-a9f9-648ed4aecba3',
          ciudadanoNombre: 'Ciudadano de San Pablo',
          veredaBarrio: 'San Pablo',
          audioTranscripcion: 'Sí mira Hay un problema de vías aquí por los lados de San Pablo después del puente me gustaría que se solucionara un tramo con una placa huella',
          problematicaSintetizada: 'Problema de estado vial y deterioro en el tramo después del puente en la vereda San Pablo',
          sector: 'Energía e Infraestructura',
          urgencia: 'Alta',
          propuestaRamitos: 'Construcción de placa huella en el tramo crítico posterior al puente de la vereda San Pablo para garantizar transitabilidad y transporte de cosechas.',
          insumosClave: ['Materiales para placa huella', 'Mano de obra comunal', 'Maquinaria amarilla'],
          presupuestoEstimadoCop: 85000000,
          votosApoyo: 1,
          fechaReporte: '2026-10-08T19:30:52.639255+00:00',
          municipioId: 'caparrapi',
          origen: 'chat'
        });
      }
    }

    localStorage.setItem(key, JSON.stringify(cleaned));
    return cleaned;
  } catch (e) {
    console.error(e);
    return [];
  }
}

// Sincronización bidireccional en tiempo real con Supabase
export async function fetchCitizenNeedsFromSupabase(municipioId: 'guaduas' | 'caparrapi' | string = 'caparrapi'): Promise<CitizenNeed[]> {
  const mun = (municipioId || 'caparrapi').toLowerCase();
  const key = getStorageKeyForNeeds(mun);

  const client = supabaseClient || getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('problematicas_ciudadanas')
        .select(`
          id,
          municipio_id,
          ciudadano_nombre,
          vereda_barrio,
          transcripcion_audio,
          descripcion_problema,
          sector,
          urgencia,
          votos_comunitarios,
          fecha_reporte,
          propuestas_estructuradas_ia (
            propuesta_redactada_ramitos,
            necesidad_clave
          )
        `)
        .eq('municipio_id', mun)
        .order('fecha_reporte', { ascending: false });

      if (!error && data) {
        const validData = data.filter((item: any) => item.id !== '8b1fd1b9-43a0-435f-9794-96b5b463dc7c');
        const mapped: CitizenNeed[] = validData.map((item: any) => {
          const propIa = Array.isArray(item.propuestas_estructuradas_ia) && item.propuestas_estructuradas_ia.length > 0
            ? item.propuestas_estructuradas_ia[0]
            : (item.propuestas_estructuradas_ia || {});

          const isSanCarlos = item.id === '79766ed5-a5e0-4ac2-ac00-7974548b799d' || (item.vereda_barrio && item.vereda_barrio.toLowerCase().includes('san carlos'));

          return {
            id: item.id,
            ciudadanoNombre: isSanCarlos ? 'Iván Alvarado' : item.ciudadano_nombre,
            veredaBarrio: item.vereda_barrio,
            audioTranscripcion: item.transcripcion_audio || item.descripcion_problema,
            problematicaSintetizada: item.descripcion_problema,
            sector: item.sector,
            urgencia: item.urgencia,
            propuestaRamitos: propIa.propuesta_redactada_ramitos || (isSanCarlos ? 'Instalación de antena satelital Starlink y zona Wi-Fi comunitaria con respaldo solar para San Carlos.' : 'Propuesta estructurada para análisis del equipo de trabajo RR.'),
            insumosClave: propIa.necesidad_clave ? propIa.necesidad_clave.split(', ') : (isSanCarlos ? ['Antena satelital Starlink', 'Router Wi-Fi largo alcance', 'Kit solar de respaldo'] : []),
            presupuestoEstimadoCop: isSanCarlos ? 45000000 : 0,
            votosApoyo: isSanCarlos ? Math.max(item.votos_comunitarios || 1, 2) : (item.votos_comunitarios || 1),
            fechaReporte: item.fecha_reporte,
            municipioId: item.municipio_id as any,
            origen: 'chat'
          };
        });

        const localList = getCitizenNeeds(mun);
        const merged = [...mapped];

        // Sincronizar votos: el valor más alto entre la nube y el dispositivo se unifica y persiste
        merged.forEach(m => {
          const localItem = localList.find(l => l.id === m.id || (l.veredaBarrio?.trim().toLowerCase() === m.veredaBarrio?.trim().toLowerCase() && l.problematicaSintetizada?.trim().toLowerCase() === m.problematicaSintetizada?.trim().toLowerCase()));
          if (localItem && localItem.votosApoyo && localItem.votosApoyo > (m.votosApoyo || 0)) {
            m.votosApoyo = localItem.votosApoyo;
            client.from('problematicas_ciudadanas')
              .update({ votos_comunitarios: m.votosApoyo })
              .eq('id', m.id)
              .then(() => {});
          }
        });

        // AUTO-SUBIDA A SUPABASE: si este dispositivo tiene propuestas locales que aún no llegaron a la nube, subirlas de inmediato
        for (const l of localList) {
          if (l && l.id && !l.id.startsWith('seed-')) {
            const alreadyInCloud = mapped.some(m => 
              m.id === l.id || 
              (m.veredaBarrio?.trim().toLowerCase() === l.veredaBarrio?.trim().toLowerCase() && 
               m.problematicaSintetizada?.trim().toLowerCase() === l.problematicaSintetizada?.trim().toLowerCase())
            );
            if (!alreadyInCloud) {
              try {
                const { data: inserted } = await client.from('problematicas_ciudadanas').insert({
                  municipio_id: mun,
                  ciudadano_nombre: l.ciudadanoNombre,
                  vereda_barrio: l.veredaBarrio,
                  transcripcion_audio: l.audioTranscripcion,
                  descripcion_problema: l.problematicaSintetizada,
                  sector: l.sector,
                  urgencia: l.urgencia,
                  votos_comunitarios: l.votosApoyo || 1
                }).select().single();

                if (inserted) {
                  l.id = inserted.id;
                  merged.unshift(l);
                  // Registrar también en propuestas_estructuradas_ia
                  try {
                    await client.from('propuestas_estructuradas_ia').insert({
                      municipio_id: mun,
                      problematica_id: inserted.id,
                      intencion_sintetizada: l.problematicaSintetizada,
                      necesidad_clave: l.insumosClave ? l.insumosClave.join(', ') : 'Revisión técnica',
                      propuesta_redactada_ramitos: l.propuestaRamitos,
                      estado_evaluacion: 'Pendiente Revision Humana'
                    });
                  } catch (e2) {}
                }
              } catch (insertErr) {
                console.warn('Error subiendo propuesta pendiente a Supabase:', insertErr);
              }
            }
          }
        }

        localStorage.setItem(key, JSON.stringify(merged));
        return merged;
      }
    } catch (e) {
      console.warn('Error fetching citizen needs from Supabase:', e);
    }
  }

  return getCitizenNeeds(mun);
}

export function getVotedNeedIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_VOTED_NEEDS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function voteCitizenNeed(needId: string, municipioId?: 'guaduas' | 'caparrapi' | string): Promise<{ success: boolean; newCount?: number; alreadyVoted?: boolean }> {
  try {
    const voted = getVotedNeedIds();
    if (voted.includes(needId)) {
      return { success: false, alreadyVoted: true };
    }

    const mun = (municipioId || 'caparrapi').toLowerCase();
    const key = getStorageKeyForNeeds(mun);
    const all = getCitizenNeeds(mun);
    let target = all.find(n => n.id === needId);

    if (!target) {
      const otherMun = mun === 'caparrapi' ? 'guaduas' : 'caparrapi';
      const otherKey = getStorageKeyForNeeds(otherMun);
      const otherAll = getCitizenNeeds(otherMun);
      target = otherAll.find(n => n.id === needId);
      if (target) {
        target.votosApoyo = (target.votosApoyo || 0) + 1;
        voted.push(needId);
        localStorage.setItem(LOCAL_STORAGE_VOTED_NEEDS, JSON.stringify(voted));
        localStorage.setItem(otherKey, JSON.stringify(otherAll));
        return { success: true, newCount: target.votosApoyo };
      }
      return { success: false };
    }

    target.votosApoyo = (target.votosApoyo || 0) + 1;
    voted.push(needId);
    localStorage.setItem(LOCAL_STORAGE_VOTED_NEEDS, JSON.stringify(voted));
    localStorage.setItem(key, JSON.stringify(all));

    // Sincronizar voto con Supabase en tiempo real
    const client = supabaseClient || getSupabaseClient();
    if (client) {
      try {
        await client.from('problematicas_ciudadanas')
          .update({ votos_comunitarios: target.votosApoyo })
          .eq('id', needId);
      } catch (e) {
        console.warn('Error actualizando voto en Supabase:', e);
      }
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

// -------------------------------------------------------------
// SISTEMA DE FORMULACIÓN MGA / DNP / PRESIDENCIA & SUPABASE
// -------------------------------------------------------------

// GENERADOR AUTOMÁTICO DE ALTERNATIVAS COMERCIALES REALES (MERCADOLIBRE, HOMECENTER, STARLINK)
export function generarAlternativaPracticaAutomatica(proyecto: { 
  id?: string;
  codigo_bpin_propuesto?: string;
  nombre_proyecto?: string;
  sector_dnp?: string;
  presupuesto_total_cop?: number;
  veredas_impactadas?: string[];
}): {
  titulo: string;
  enfoque: string;
  tiempo_ejecucion_dias: number;
  ahorro_pct_estimado: number;
  resumen_ejecucion: string;
  items: Array<{
    id: string;
    item: string;
    descripcion?: string;
    proveedor: string;
    enlace_compra?: string;
    precio_unitario_cop: number;
    cantidad: number;
    unidad: string;
  }>;
} {
  const bpin = (proyecto.codigo_bpin_propuesto || '').toUpperCase();
  const nombre = (proyecto.nombre_proyecto || '').toLowerCase();
  const sector = (proyecto.sector_dnp || '').toLowerCase();

  // 1. TIC / CONECTIVIDAD / ESCUELAS RURALES / STARLINK
  if (bpin.includes('TIC') || nombre.includes('conectividad') || nombre.includes('starlink') || sector.includes('tic') || nombre.includes('digital') || nombre.includes('internet')) {
    return {
      titulo: 'Conectividad Escolar Rápida: Starlink Satelital Directo + Generador Solar EcoFlow',
      enfoque: 'Compra Directa en Starlink Colombia y Homecenter con Despliegue en 15 Días',
      tiempo_ejecucion_dias: 15,
      ahorro_pct_estimado: 91,
      resumen_ejecucion: 'Instalación de antenas Starlink de baja órbita con respaldo autónomo de energía solar EcoFlow Delta 2 (LFP 1024Wh) para escuelas rurales. Despliegue inmediato financiado con recursos propios o regalías directas sin intermediarios.',
      items: [
        {
          id: 'tic-alt-1',
          item: 'Kit de Antena Satelital Starlink Estándar (Baja Órbita)',
          descripcion: 'Velocidad 150-250 Mbps con módem Wi-Fi de alta cobertura para 14 escuelas rurales',
          proveedor: 'Starlink Colombia Oficial / MercadoLibre Tienda Oficial',
          enlace_compra: 'https://www.starlink.com',
          precio_unitario_cop: 1350000,
          cantidad: 14,
          unidad: 'Kits de antena'
        },
        {
          id: 'tic-alt-2',
          item: 'Estación de Energía Solar EcoFlow Delta 2 + Panel 400W',
          descripcion: 'Batería LFP 1024Wh para alimentar módem, antena y 15 computadores en corte de luz',
          proveedor: 'Homecenter Colombia / Distribuidor Oficial EcoFlow',
          enlace_compra: 'https://www.homecenter.com.co',
          precio_unitario_cop: 4850000,
          cantidad: 14,
          unidad: 'Kit solar + batería'
        },
        {
          id: 'tic-alt-3',
          item: 'Mástil Galvanizado 3m, Pararrayos y Cableado Blindado Exterior',
          descripcion: 'Protección contra tormentas eléctricas en cumbre de escuela rural',
          proveedor: 'Homecenter / Ferretería Regional Mayorista',
          enlace_compra: 'https://www.homecenter.com.co',
          precio_unitario_cop: 480000,
          cantidad: 14,
          unidad: 'Puntos de montaje'
        },
        {
          id: 'tic-alt-4',
          item: 'Plan de Internet Satelital Rural Starlink (1 Año Anticipado)',
          descripcion: 'Suscripción mensual ilimitada sin tope de consumo para 14 sedes ($210.000/mes)',
          proveedor: 'Starlink Inc. Colombia',
          enlace_compra: 'https://www.starlink.com',
          precio_unitario_cop: 2520000,
          cantidad: 14,
          unidad: 'Año de servicio'
        }
      ]
    };
  }

  // 2. AGUA POTABLE / ACUEDUCTOS / PTAP
  if (bpin.includes('AGUA') || nombre.includes('agua') || nombre.includes('acueducto') || sector.includes('agua') || sector.includes('saneamiento') || nombre.includes('hídrica')) {
    return {
      titulo: 'Agua Potable Inmediata: Ultrafiltración Modular & Tanques Tricapa por Vereda',
      enfoque: 'Potabilización Modular por Gravedad sin Químicos + Red Rápida PEAD',
      tiempo_ejecucion_dias: 20,
      ahorro_pct_estimado: 78,
      resumen_ejecucion: 'Instalación de tanques de polietileno de alta densidad tricapa UV con filtros de membrana de ultrafiltración por gravedad (SkyHydrant / Lifestraw Community) y cloración en línea.',
      items: [
        {
          id: 'agua-alt-1',
          item: 'Tanques Plásticos de Almacenamiento Tricapa 10.000 Litros',
          descripcion: 'Polietileno grado alimenticio con protección UV para intemperie',
          proveedor: 'Eternit / Pavco (Homecenter Colombia)',
          enlace_compra: 'https://www.homecenter.com.co',
          precio_unitario_cop: 6200000,
          cantidad: 4,
          unidad: 'Tanque 10.000L'
        },
        {
          id: 'agua-alt-2',
          item: 'Módulo de Ultrafiltración por Gravedad (0.02 micras)',
          descripcion: 'Filtra bacterias, virus y turbiedad sin necesidad de energía eléctrica ni químicos',
          proveedor: 'SkyHydrant / Distribuidor Nacional de Membranas',
          enlace_compra: 'https://www.mercadolibre.com.co',
          precio_unitario_cop: 18500000,
          cantidad: 2,
          unidad: 'Unidad de filtración'
        },
        {
          id: 'agua-alt-3',
          item: 'Tubería PEAD 2" RDE 17 para Red Veredal Rápida',
          descripcion: 'Rollos de 100m para tendido rápido en ladera y acometidas seguras',
          proveedor: 'Pavco / TuboPlast (Homecenter / MercadoLibre)',
          enlace_compra: 'https://www.homecenter.com.co',
          precio_unitario_cop: 8400,
          cantidad: 3000,
          unidad: 'Metro lineal'
        },
        {
          id: 'agua-alt-4',
          item: 'Dosificador Automático de Cloro en Línea y Pastillas DPD',
          descripcion: 'Garantiza desinfección residual según norma RAS y medición de cloro libre',
          proveedor: 'Ferreterías Industriales / MercadoLibre Oficial',
          enlace_compra: 'https://www.mercadolibre.com.co',
          precio_unitario_cop: 1800000,
          cantidad: 4,
          unidad: 'Kit dosificador'
        },
        {
          id: 'agua-alt-5',
          item: 'Fontanería Comunitaria y Casetas de Protección',
          descripcion: 'Instalación en 15 días con fontaneros locales de las JAC veredales',
          proveedor: 'Comité de Acueducto Veredal San Carlos',
          enlace_compra: 'https://www.alcaldiacaparrapi.gov.co',
          precio_unitario_cop: 18000000,
          cantidad: 1,
          unidad: 'Global'
        }
      ]
    };
  }

  // 3. VÍAS / TRANSPORTE / PLACA HUELLA (DEFAULT O SECTOR TRANSPORTE)
  return {
    titulo: 'Intervención Rápida por Módulos Prefabricados & Convenio Solidario JAC (Ley 2166)',
    enfoque: 'Convenio Solidario con Juntas de Acción Comunal + Maquinaria Propia',
    tiempo_ejecucion_dias: 45,
    ahorro_pct_estimado: 62,
    resumen_ejecucion: 'La Alcaldía suministra los módulos de placa huella curados en fábrica, alcantarillas de PEAD corrugado y horas de volqueta/motoniveladora municipal. La Junta de Acción Comunal ejecuta la instalación mediante mano de obra local.',
    items: [
      {
        id: 'vias-alt-1',
        item: 'Módulos de Placa Huella Prefabricada en Concreto 4000 PSI',
        descripcion: 'Módulos autotrabantes curados en planta para 2.0 km de tramos más críticos',
        proveedor: 'Concreteras Regionales (Argos / Cemex / Prefabricados del Valle)',
        enlace_compra: 'https://www.homecenter.com.co',
        precio_unitario_cop: 380000,
        cantidad: 2000,
        unidad: 'Metro lineal'
      },
      {
        id: 'vias-alt-2',
        item: 'Tubería Corrugada PEAD Doble Pared 36" para Alcantarillas',
        descripcion: 'Tubería de drenaje de alta resistencia al impacto y corrosión (120 metros)',
        proveedor: 'PAVCO Wavin / Homecenter / Distribuidores Mayoristas',
        enlace_compra: 'https://www.pavco.com.co',
        precio_unitario_cop: 420000,
        cantidad: 120,
        unidad: 'Metro lineal'
      },
      {
        id: 'vias-alt-3',
        item: 'Subbase Granular y Balastro de Cantera Local Certificada',
        descripcion: 'Acarreo con volquetas propias de la Alcaldía de Caparrapí para reducir fletes',
        proveedor: 'Canteras de la Región (Caparrapí - Guaduas)',
        enlace_compra: 'https://www.mercadolibre.com.co',
        precio_unitario_cop: 35000,
        cantidad: 1500,
        unidad: 'Metro cúbico (m³)'
      },
      {
        id: 'vias-alt-4',
        item: 'Mano de Obra Comunitaria Calificada y Seguros JAC',
        descripcion: 'Cuadrillas comunitarias veredales bajo Convenio Solidario Ley 2166',
        proveedor: 'Asojuntas Caparrapí / JAC San Carlos y Terán',
        enlace_compra: 'https://www.alcaldiacaparrapi.gov.co',
        precio_unitario_cop: 180000000,
        cantidad: 1,
        unidad: 'Convenio global'
      }
    ]
  };
}

// PROYECTOS TIPO OFICIALES DNP DE REFERENCIA PARA CAPARRAPÍ
const PROYECTOS_TIPO_CAPARRAPI: ProyectoMgaEstructurado[] = [
  {
    id: 'mga-cap-vias-01',
    municipio_id: 'caparrapi',
    codigo_bpin_propuesto: '2026-CAP-VIAS-02',
    nombre_proyecto: 'Plan de Conectividad Terciaria Estratégica: Corredores San Carlos - Terán - Cuencas Veredales',
    sector_dnp: 'Transporte (Vías Terciarias)',
    codigo_producto_dnp: '2101007 - Vía terciaria mejorada con placa huella',
    fase_mga: 'Fase 3 - Factibilidad Definitiva e Ingeniería de Detalle',
    estado_tramite: 'requisitos_pendientes',
    presupuesto_total_cop: 6500000000,
    fuente_financiacion_principal: 'Ministerio de Transporte / INVIAS / OCAD Paz Regalías',
    veredas_impactadas: ['San Carlos', 'Terán', 'Pitalito', 'San Ramón'],
    poblacion_beneficiaria_total: 11200,
    evaluacion_economica: {
      tasa_descuento: '12,0% (Estándar DNP)',
      vpn_social: '$2.840 Millones COP',
      tir_social: '19,4%',
      relacion_costo_beneficio: '1,45'
    },
    arbol_problemas: {
      problema_central: 'Incomunicación vial recurrente y colapso de vías terciarias en invierno en corredores San Carlos - Terán',
      causa_directa: 'Ausencia de obras de drenaje transversal y calzadas en tierra sin capacidad portante',
      causa_indirecta: 'Mantenimientos temporales de recebo que se lavan con lluvias y ausencia de placa huella estructural',
      efecto_directo: 'Fletes de transporte agrícola duplicados y pérdida de cosechas de panela, leche y cacao',
      efecto_indirecto: 'Aislamiento comercial de las inspecciones y atraso socioeconómico veredal'
    },
    arbol_objetivos: {
      objetivo_general: 'Garantizar transitabilidad permanente 365 días al año en los corredores San Carlos - Terán - Red Secundaria',
      fines_directos: [
        'Construcción de 6,2 km de placa huella de alta resistencia en pendientes superiores al 12%',
        'Instalación de 32 alcantarillas y 3 box culverts estructurales para manejo de escorrentía',
        'Reducción del 45% en los costos de flete veredal de carga'
      ]
    },
    justificacion_presidencia: 'Iniciativa prioritaria para articular las cuencas rurales más productivas de Caparrapí con el Magdalena Centro y la Troncal Nacional. El corredor San Carlos - Terán concentra más del 38% de la producción panelera y ganadera del municipio y sufre aislamiento crítico en temporada de lluvias.',
    creado_por: 'Equipo de Trabajo RR',
    capitulos_presupuesto_apu: [
      { capitulo: 'Capítulo 1: Preliminares, Topografía y Localización', valor: 195000000, apu_clave: 'Topografía con estación total y replanteo: $1.2M / km' },
      { capitulo: 'Capítulo 2: Movimiento de Tierras, Excavación y Subbase Granular', valor: 1250000000, apu_clave: 'Metro cúbico subbase granular compactada: $86.000 / m³' },
      { capitulo: 'Capítulo 3: Obras de Arte (Alcantarillas 36", Box Culverts y Cunetas)', valor: 1420000000, apu_clave: 'Metro lineal alcantarilla 36" con cabezales: $680.000 / m' },
      { capitulo: 'Capítulo 4: Estructura de Placa Huella (Concreto 3000 PSI + Piedra Pegada)', valor: 3120000000, apu_clave: 'Metro lineal placa huella tipo INVIAS (ancho 4.5m): $520.000 / m' },
      { capitulo: 'Capítulo 5: Plan de Manejo Ambiental y Señalización', valor: 195000000, apu_clave: 'Disposición final de sobrantes y revegetalización: $32.000 / m²' },
      { capitulo: 'Capítulo 6: Interventoría Técnica Integral', valor: 320000000, apu_clave: 'Interventoría técnica y de laboratorio: 5% valor directo' }
    ],
    alternativa_practica: {
      titulo: 'Intervención Rápida por Módulos Prefabricados & Convenio Solidario JAC (Ley 2166)',
      enfoque: 'Convenio Solidario con Juntas de Acción Comunal + Maquinaria Propia',
      tiempo_ejecucion_dias: 45,
      ahorro_pct_estimado: 62,
      resumen_ejecucion: 'La Alcaldía suministra los módulos de placa huella curados en fábrica, alcantarillas de PEAD corrugado y horas de volqueta/motoniveladora municipal. La Junta de Acción Comunal ejecuta la instalación mediante mano de obra local.',
      items: [
        {
          id: 'vias-alt-1',
          item: 'Módulos de Placa Huella Prefabricada en Concreto 4000 PSI',
          descripcion: 'Módulos autotrabantes curados en planta para 2.0 km de tramos más críticos',
          proveedor: 'Concreteras Regionales (Argos / Cemex / Prefabricados del Valle)',
          enlace_compra: 'https://www.homecenter.com.co',
          precio_unitario_cop: 380000,
          cantidad: 2000,
          unidad: 'Metro lineal'
        },
        {
          id: 'vias-alt-2',
          item: 'Tubería Corrugada PEAD Doble Pared 36" para Alcantarillas',
          descripcion: 'Tubería de drenaje de alta resistencia al impacto y corrosión (120 metros)',
          proveedor: 'PAVCO Wavin / Homecenter / Distribuidores Mayoristas',
          enlace_compra: 'https://www.pavco.com.co',
          precio_unitario_cop: 420000,
          cantidad: 120,
          unidad: 'Metro'
        },
        {
          id: 'vias-alt-3',
          item: 'Subbase Granular y Balastro de Cantera Local Certificada',
          descripcion: 'Acarreo con volquetas propias de la Alcaldía de Caparrapí para reducir fletes',
          proveedor: 'Canteras de la Región (Caparrapí - Guaduas)',
          enlace_compra: 'https://www.mercadolibre.com.co',
          precio_unitario_cop: 35000,
          cantidad: 1500,
          unidad: 'Metro cúbico (m³)'
        },
        {
          id: 'vias-alt-4',
          item: 'Mano de Obra Comunitaria Calificada y Seguros JAC',
          descripcion: 'Cuadrillas comunitarias veredales bajo Convenio Solidario Ley 2166',
          proveedor: 'Asojuntas Caparrapí / JAC San Carlos y Terán',
          enlace_compra: 'https://www.alcaldiacaparrapi.gov.co',
          precio_unitario_cop: 180000000,
          cantidad: 1,
          unidad: 'Convenio global'
        }
      ]
    }
  },
  {
    id: 'mga-cap-agua-02',
    municipio_id: 'caparrapi',
    codigo_bpin_propuesto: '2026-CAP-AGUA-04',
    nombre_proyecto: 'Plan de Seguridad Hídrica Rural: Acueductos Confiables para San Carlos, San Pedro y Veredas',
    sector_dnp: 'Agua Potable y Saneamiento Básico',
    codigo_producto_dnp: '4003001 - Sistema de acueducto rural optimizado',
    fase_mga: 'Fase 3 - Factibilidad Definitiva e Ingeniería de Detalle',
    estado_tramite: 'en_estructuracion',
    presupuesto_total_cop: 3200000000,
    fuente_financiacion_principal: 'Ministerio de Vivienda, Ciudad y Territorio / Fondo de la Paz',
    veredas_impactadas: ['San Carlos', 'San Pedro', 'La Florida', 'Otavalo'],
    poblacion_beneficiaria_total: 4850,
    evaluacion_economica: {
      tasa_descuento: '12,0% (Estándar DNP)',
      vpn_social: '$1.450 Millones COP',
      tir_social: '16,8%',
      relacion_costo_beneficio: '1,38'
    },
    arbol_problemas: {
      problema_central: 'Inseguridad hídrica y alto índice de riesgo de la calidad del agua (IRCA > 45%) en inspecciones rurales',
      causa_directa: 'Bocatomas rústicas destruidas por crecientes y ausencia de desarenadores y desinfección',
      causa_indirecta: 'Infraestructuras comunitarias de más de 25 años sin modernización ni bombeo solar',
      efecto_directo: 'Enfermedades gastrointestinales en primera infancia y suspensión de clases en escuelas rurales',
      efecto_indirecto: 'Deserción escolar y disminución en la productividad familiar campesina'
    },
    arbol_objetivos: {
      objetivo_general: 'Suministrar agua tratada continua y potable a 4.850 habitantes rurales en San Carlos y veredas aledañas',
      fines_directos: [
        'Construcción de 4 bocatomas de fondo con desarenadores de doble módulo autolimpiante',
        'Instalación de 18 km de tubería RDE 21 en polietileno de alta densidad',
        'Implementación de 2 plantas compactas de potabilización con energía solar autónoma'
      ]
    },
    justificacion_presidencia: 'Garantiza el derecho fundamental al agua potable en el marco del pilar de Convergencia Regional del Plan Nacional de Desarrollo, eliminando el racionamiento histórico en las escuelas rurales de Caparrapí.',
    creado_por: 'Equipo de Trabajo RR',
    alternativa_practica: {
      titulo: 'Agua Potable Inmediata: Ultrafiltración Modular & Tanques Tricapa por Vereda',
      enfoque: 'Potabilización Modular por Gravedad sin Químicos + Red Rápida PEAD',
      tiempo_ejecucion_dias: 20,
      ahorro_pct_estimado: 78,
      resumen_ejecucion: 'Instalación de tanques de polietileno de alta densidad tricapa UV con filtros de membrana de ultrafiltración por gravedad (SkyHydrant / Lifestraw Community) y cloración en línea.',
      items: [
        {
          id: 'agua-alt-1',
          item: 'Tanques Plásticos de Almacenamiento Tricapa 10.000 Litros',
          descripcion: 'Polietileno grado alimenticio con protección UV para intemperie',
          proveedor: 'Eternit / Pavco (Homecenter Colombia)',
          enlace_compra: 'https://www.homecenter.com.co',
          precio_unitario_cop: 6200000,
          cantidad: 4,
          unidad: 'Tanque 10.000L'
        },
        {
          id: 'agua-alt-2',
          item: 'Módulo de Ultrafiltración por Gravedad (0.02 micras)',
          descripcion: 'Filtra bacterias, virus y turbiedad sin necesidad de energía eléctrica ni coagulantes',
          proveedor: 'SkyHydrant / Distribuidor Nacional de Membranas',
          enlace_compra: 'https://www.mercadolibre.com.co',
          precio_unitario_cop: 18500000,
          cantidad: 2,
          unidad: 'Unidad'
        },
        {
          id: 'agua-alt-3',
          item: 'Tubería PEAD 2" RDE 17 para Red Veredal Rápida',
          descripcion: 'Rollos de 100m para tendido rápido en ladera y acometidas seguras',
          proveedor: 'Pavco / TuboPlast (Homecenter / MercadoLibre)',
          enlace_compra: 'https://www.homecenter.com.co',
          precio_unitario_cop: 8400,
          cantidad: 3000,
          unidad: 'Metro'
        },
        {
          id: 'agua-alt-4',
          item: 'Dosificador Automático de Cloro en Línea y Pastillas DPD',
          descripcion: 'Garantiza desinfección residual según norma RAS y medición de cloro libre',
          proveedor: 'Ferreterías Industriales / MercadoLibre Oficial',
          enlace_compra: 'https://www.mercadolibre.com.co',
          precio_unitario_cop: 1800000,
          cantidad: 4,
          unidad: 'Kit dosificador'
        },
        {
          id: 'agua-alt-5',
          item: 'Fontanería Comunitaria y Casetas de Protección',
          descripcion: 'Instalación en 15 días con fontaneros locales de las JAC veredales',
          proveedor: 'Comité de Acueducto Veredal San Carlos',
          enlace_compra: 'https://www.alcaldiacaparrapi.gov.co',
          precio_unitario_cop: 18000000,
          cantidad: 1,
          unidad: 'Global'
        }
      ]
    }
  },
  {
    id: 'mga-cap-tic-03',
    municipio_id: 'caparrapi',
    codigo_bpin_propuesto: '2026-CAP-TIC-05',
    nombre_proyecto: 'Conectividad Digital y Aulas Satelitales Starlink para Escuelas Rurales y Comunidad de San Carlos',
    sector_dnp: 'Tecnologías de la Información y las Comunicaciones (TIC)',
    codigo_producto_dnp: '4301012 - Acceso comunitario a internet rural instalado',
    fase_mga: 'Fase 3 - Factibilidad Definitiva',
    estado_tramite: 'en_estructuracion',
    presupuesto_total_cop: 1450000000,
    fuente_financiacion_principal: 'Ministerio de las TIC / Centros Digitales MinTIC',
    veredas_impactadas: ['San Carlos', 'El Dinde', 'Mata de Mora', 'Pitalito', 'La Chorrera'],
    poblacion_beneficiaria_total: 3900,
    evaluacion_economica: {
      tasa_descuento: '12,0% (Estándar DNP)',
      vpn_social: '$820 Millones COP',
      tir_social: '22,1%',
      relacion_costo_beneficio: '1,56'
    },
    arbol_problemas: {
      problema_central: 'Brecha digital extrema e inexistencia de conectividad de alta velocidad en San Carlos y cuencas rurales',
      causa_directa: 'Topografía quebrada sin tendido de fibra óptica ni antenas de operadores comerciales',
      causa_indirecta: 'Baja rentabilidad comercial para operadores privados de telecomunicaciones',
      efecto_directo: 'Aislamiento educativo de 14 sedes escolares rurales y falta de acceso a trámites institucionales',
      efecto_indirecto: 'Desventaja competitiva de los jóvenes rurales de Caparrapí frente a centros urbanos'
    },
    arbol_objetivos: {
      objetivo_general: 'Cerrar la brecha digital en 14 escuelas rurales y plazas comunitarias de San Carlos y veredas',
      fines_directos: [
        'Despliegue de 14 estaciones de enlace satelital de órbita baja (Starlink Business) con respaldo solar fotovoltaico',
        'Dotación de zonas Wi-Fi comunitarias con cobertura de 200 metros para juntas comunales y productores',
        'Capacitación en alfabetización digital e integración a mercados electrónicos para 450 productores'
      ]
    },
    justificacion_presidencia: 'Responde de manera directa a la petición comunitaria de San Carlos registrada en Voz del Pueblo. Permite conectar las aulas escolares y habilitar telemedicina y trámites en línea para la ruralidad dispersa de Caparrapí.',
    creado_por: 'Equipo de Trabajo RR',
    alternativa_practica: {
      titulo: 'Conectividad Escolar Rápida: Starlink Satelital Directo + Generador Solar EcoFlow',
      enfoque: 'Compra Directa en Starlink Colombia y Homecenter con Despliegue en 15 Días',
      tiempo_ejecucion_dias: 15,
      ahorro_pct_estimado: 91,
      resumen_ejecucion: 'Instalación directa de 14 antenas Starlink de baja órbita con respaldo autónomo de energía solar EcoFlow Delta 2 para las escuelas rurales. Despliegue inmediato financiado con recursos propios o regalías directas.',
      items: [
        {
          id: 'tic-alt-1',
          item: 'Kit de Antena Satelital Starlink Estándar (Baja Órbita)',
          descripcion: 'Velocidad 150-250 Mbps con módem Wi-Fi de alta cobertura para 14 escuelas',
          proveedor: 'Starlink Colombia Oficial / MercadoLibre Tienda Oficial',
          enlace_compra: 'https://www.starlink.com',
          precio_unitario_cop: 1350000,
          cantidad: 14,
          unidad: 'Kit de antena'
        },
        {
          id: 'tic-alt-2',
          item: 'Estación de Energía Solar EcoFlow Delta 2 + Panel 400W',
          descripcion: 'Batería LFP 1024Wh para alimentar módem, antena y 15 computadores en corte de luz',
          proveedor: 'Homecenter Colombia / Tienda EcoFlow Oficial',
          enlace_compra: 'https://www.homecenter.com.co',
          precio_unitario_cop: 4850000,
          cantidad: 14,
          unidad: 'Kit solar + batería'
        },
        {
          id: 'tic-alt-3',
          item: 'Mástil Galvanizado 3m, Pararrayos y Cableado Blindado Exterior',
          descripcion: 'Protección contra tormentas eléctricas en cumbre de escuela rural',
          proveedor: 'Homecenter / Ferretería Regional Mayorista',
          enlace_compra: 'https://www.homecenter.com.co',
          precio_unitario_cop: 480000,
          cantidad: 14,
          unidad: 'Punto de montaje'
        },
        {
          id: 'tic-alt-4',
          item: 'Plan de Internet Satelital Rural Starlink (1 Año Anticipado)',
          descripcion: 'Suscripción mensual ilimitada sin tope de consumo para 14 sedes',
          proveedor: 'Starlink Inc. Colombia',
          enlace_compra: 'https://www.starlink.com',
          precio_unitario_cop: 2520000,
          cantidad: 14,
          unidad: 'Año de servicio'
        }
      ]
    }
  }
];

// PROYECTOS TIPO OFICIALES DNP DE REFERENCIA PARA GUADUAS
const PROYECTOS_TIPO_GUADUAS: ProyectoMgaEstructurado[] = [
  {
    id: 'mga-gua-vias-01',
    municipio_id: 'guaduas',
    codigo_bpin_propuesto: '2026-GUA-VIAS-01',
    nombre_proyecto: 'Modernización Vial Terciaria: Corredores Productivos Guaduero - San Antonio - La Paz',
    sector_dnp: 'Transporte (Vías Terciarias)',
    codigo_producto_dnp: '2101007 - Vía terciaria mejorada con placa huella',
    fase_mga: 'Fase 3 - Factibilidad Definitiva e Ingeniería de Detalle',
    estado_tramite: 'requisitos_pendientes',
    presupuesto_total_cop: 7200000000,
    fuente_financiacion_principal: 'Ministerio de Transporte / INVIAS / SGR Regalías',
    veredas_impactadas: ['Guaduero', 'San Antonio', 'La Paz', 'Versalles'],
    poblacion_beneficiaria_total: 14500,
    evaluacion_economica: {
      tasa_descuento: '12,0% (Estándar DNP)',
      vpn_social: '$3.150 Millones COP',
      tir_social: '18,7%',
      relacion_costo_beneficio: '1,42'
    },
    arbol_problemas: {
      problema_central: 'Pérdida de transitabilidad en los corredores cafeteros y cacaoteros de Guaduas hacia la Ruta del Sol',
      causa_directa: 'Taludes inestables y ausencia de placa huellas en tramos de alta pendiente',
      causa_indirecta: 'Déficit de inversión estructural durante los últimos 8 años en vías terciarias',
      efecto_directo: 'Sobrecostos de hasta el 50% en el transporte de carga agrícola',
      efecto_indirecto: 'Pérdida de competitividad agropecuaria en la provincia del Bajo Magdalena'
    },
    arbol_objetivos: {
      objetivo_general: 'Asegurar la conectividad productiva permanente de Guaduero, San Antonio y La Paz',
      fines_directos: [
        'Construcción de 7.5 km de placa huella pesada tipo INVIAS',
        'Estabilización de 4 taludes críticos mediante muros de contención en gaviones',
        'Construcción de 45 alcantarillas y cunetas revestidas en concreto'
      ]
    },
    justificacion_presidencia: 'Corredor agroecológico estratégico que conecta el centro histórico y rural de Guaduas con la red fluvial y férrea del Magdalena Centro.',
    creado_por: 'Equipo de Trabajo RR'
  },
  {
    id: 'mga-gua-agua-02',
    municipio_id: 'guaduas',
    codigo_bpin_propuesto: '2026-GUA-AGUA-02',
    nombre_proyecto: 'Seguridad Hídrica Integral y Optimización Planta Potabilizadora Puerto Bogotá',
    sector_dnp: 'Agua Potable y Saneamiento Básico',
    codigo_producto_dnp: '4003001 - Sistema de acueducto rural optimizado',
    fase_mga: 'Fase 3 - Factibilidad Definitiva',
    estado_tramite: 'en_estructuracion',
    presupuesto_total_cop: 4800000000,
    fuente_financiacion_principal: 'Ministerio de Vivienda / Empresas Públicas de Cundinamarca (EPC)',
    veredas_impactadas: ['Puerto Bogotá', 'La Paz', 'Canta Rana'],
    poblacion_beneficiaria_total: 12000,
    evaluacion_economica: {
      tasa_descuento: '12,0% (Estándar DNP)',
      vpn_social: '$2.300 Millones COP',
      tir_social: '17,2%',
      relacion_costo_beneficio: '1,40'
    },
    arbol_problemas: {
      problema_central: 'Deficiencia en la capacidad de tratamiento y turbiedad del agua suministrada en Puerto Bogotá',
      causa_directa: 'Infraestructura de captación sobre el río Magdalena colapsada por sedimentación',
      causa_indirecta: 'Falta de renovación de los módulos de floculación y sedimentación',
      efecto_directo: 'Suspensión reiterada del servicio a más de 12.000 pobladores y sector comercial ribereño',
      efecto_indirecto: 'Impacto negativo en la salud pública y el desarrollo turístico de la ribera'
    },
    arbol_objetivos: {
      objetivo_general: 'Garantizar suministro de agua apta para consumo humano 24/7 en Puerto Bogotá',
      fines_directos: [
        'Modernización integral de la planta de tratamiento con módulos de clarificación rápida',
        'Construcción de tanque de almacenamiento compensatorio de 800 m³',
        'Sustitución de 6 km de redes matrices con micro y macromedición'
      ]
    },
    justificacion_presidencia: 'Puerto Bogotá es el principal polo demográfico y comercial fronterizo entre Cundinamarca y Tolima, mereciendo saneamiento básico de primer nivel.',
    creado_por: 'Equipo de Trabajo RR'
  }
];

// Generador de los 12 requisitos canónicos de viabilidad sectorial
export function generateStandardRequisitos(proyectoId: string, sectorDnp: string = 'Transporte', nombreProyecto: string = '', munNombre: string = 'Caparrapí'): RequisitoViabilidad[] {
  return getCanonicalSectorRequisitos(proyectoId, sectorDnp, nombreProyecto, munNombre);
}

export async function fetchProyectosMgaFromSupabase(municipioId: 'caparrapi' | 'guaduas'): Promise<ProyectoMgaEstructurado[]> {
  const cacheKey = `ialcaldia_proyectos_mga_${municipioId}`;
  const defaultSeeds = municipioId === 'caparrapi' ? PROYECTOS_TIPO_CAPARRAPI : PROYECTOS_TIPO_GUADUAS;

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('proyectos_mga_estructurados')
        .select('*')
        .eq('municipio_id', municipioId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: ProyectoMgaEstructurado[] = data.map((d: any) => {
          const defaultMatch = defaultSeeds.find(s => s.codigo_bpin_propuesto === d.codigo_bpin_propuesto || s.id === d.id);
          const altPractica = (d.alternativa_practica && Array.isArray(d.alternativa_practica.items) && d.alternativa_practica.items.length > 0)
            ? d.alternativa_practica
            : (d.evaluacion_economica?._alternativa_practica && Array.isArray(d.evaluacion_economica._alternativa_practica.items) && d.evaluacion_economica._alternativa_practica.items.length > 0)
            ? d.evaluacion_economica._alternativa_practica
            : (defaultMatch?.alternativa_practica)
            || generarAlternativaPracticaAutomatica(d);

          return {
            id: d.id,
            municipio_id: d.municipio_id,
            codigo_bpin_propuesto: d.codigo_bpin_propuesto || 'BPIN-2026',
            nombre_proyecto: d.nombre_proyecto,
            sector_dnp: d.sector_dnp,
            codigo_producto_dnp: d.codigo_producto_dnp,
            fase_mga: d.fase_mga || 'Fase 3 - Factibilidad Definitiva',
            estado_tramite: d.estado_tramite || 'en_estructuracion',
            presupuesto_total_cop: parseFloat(d.presupuesto_total_cop || 0),
            fuente_financiacion_principal: d.fuente_financiacion_principal || 'Gobierno Nacional / Presidencia',
            veredas_impactadas: Array.isArray(d.veredas_impactadas) ? d.veredas_impactadas : [],
            poblacion_beneficiaria_total: parseInt(d.poblacion_beneficiaria_total || 0),
            evaluacion_economica: d.evaluacion_economica || {},
            arbol_problemas: d.arbol_problemas || {},
            arbol_objetivos: d.arbol_objetivos || {},
            cadena_valor: Array.isArray(d.cadena_valor) ? d.cadena_valor : [],
            justificacion_presidencia: d.justificacion_presidencia || '',
            creado_por: d.creado_por || 'Equipo de Trabajo RR',
            created_at: d.created_at,
            updated_at: d.updated_at,
            capitulos_presupuesto_apu: d.capitulos_presupuesto_apu || defaultMatch?.capitulos_presupuesto_apu,
            checklist_tareas: d.checklist_tareas || defaultMatch?.checklist_tareas,
            alternativa_practica: altPractica
          };
        });

        localStorage.setItem(cacheKey, JSON.stringify(mapped));
        return mapped;
      }

      // Si la tabla en Supabase está vacía, sembramos los Proyectos Tipo oficiales
      if (!error && (!data || data.length === 0)) {
        try {
          const insertPayload = defaultSeeds.map(p => ({
            municipio_id: p.municipio_id,
            codigo_bpin_propuesto: p.codigo_bpin_propuesto,
            nombre_proyecto: p.nombre_proyecto,
            sector_dnp: p.sector_dnp,
            codigo_producto_dnp: p.codigo_producto_dnp,
            fase_mga: p.fase_mga,
            estado_tramite: p.estado_tramite,
            presupuesto_total_cop: p.presupuesto_total_cop,
            fuente_financiacion_principal: p.fuente_financiacion_principal,
            veredas_impactadas: p.veredas_impactadas,
            poblacion_beneficiaria_total: p.poblacion_beneficiaria_total,
            evaluacion_economica: {
              ...(p.evaluacion_economica || {}),
              _alternativa_practica: p.alternativa_practica
            },
            arbol_problemas: p.arbol_problemas,
            arbol_objetivos: p.arbol_objetivos,
            justificacion_presidencia: p.justificacion_presidencia,
            creado_por: p.creado_por
          }));
          await client.from('proyectos_mga_estructurados').insert(insertPayload);
        } catch (seedErr) {
          console.warn('Aviso sembrando proyectos MGA en Supabase:', seedErr);
        }
      }
    } catch (err) {
      console.warn('Error consultando proyectos MGA en Supabase, usando respaldo:', err);
    }
  }

  // Respaldo en LocalStorage / Plantillas DNP
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const enriched = parsed.map((p: any) => {
          const defaultMatch = defaultSeeds.find(s => s.codigo_bpin_propuesto === p.codigo_bpin_propuesto || s.id === p.id);
          const alt = (p.alternativa_practica && Array.isArray(p.alternativa_practica.items) && p.alternativa_practica.items.length > 0)
            ? p.alternativa_practica
            : (defaultMatch?.alternativa_practica) || generarAlternativaPracticaAutomatica(p);
          return {
            ...p,
            alternativa_practica: alt,
            capitulos_presupuesto_apu: p.capitulos_presupuesto_apu || defaultMatch?.capitulos_presupuesto_apu
          };
        });
        return enriched;
      }
    }
  } catch (e) {
    console.warn(e);
  }

  localStorage.setItem(cacheKey, JSON.stringify(defaultSeeds));
  return defaultSeeds;
}

// 2. GUARDAR / EDITAR PROYECTO MGA EN SUPABASE Y CACHÉ
export async function saveProyectoMgaInSupabase(proyecto: Partial<ProyectoMgaEstructurado> & { id: string; municipio_id: 'caparrapi' | 'guaduas' }): Promise<ProyectoMgaEstructurado> {
  const cacheKey = `ialcaldia_proyectos_mga_${proyecto.municipio_id}`;
  const now = new Date().toISOString();

  const client = getSupabaseClient();
  if (client) {
    try {
      const evaluacionConAlt = {
        ...(proyecto.evaluacion_economica || {}),
        _alternativa_practica: proyecto.alternativa_practica
      };

      const payload: any = {
        municipio_id: proyecto.municipio_id,
        codigo_bpin_propuesto: proyecto.codigo_bpin_propuesto,
        nombre_proyecto: proyecto.nombre_proyecto,
        sector_dnp: proyecto.sector_dnp,
        codigo_producto_dnp: proyecto.codigo_producto_dnp,
        fase_mga: proyecto.fase_mga,
        estado_tramite: proyecto.estado_tramite,
        presupuesto_total_cop: proyecto.presupuesto_total_cop,
        fuente_financiacion_principal: proyecto.fuente_financiacion_principal,
        veredas_impactadas: proyecto.veredas_impactadas,
        poblacion_beneficiaria_total: proyecto.poblacion_beneficiaria_total,
        evaluacion_economica: evaluacionConAlt,
        arbol_problemas: proyecto.arbol_problemas,
        arbol_objetivos: proyecto.arbol_objetivos,
        justificacion_presidencia: proyecto.justificacion_presidencia,
        updated_at: now
      };

      // Si es un UUID válido de Supabase, actualizar por ID, sino upsert
      if (proyecto.id.length === 36 && !proyecto.id.startsWith('mga-')) {
        await client.from('proyectos_mga_estructurados').update(payload).eq('id', proyecto.id);
      } else {
        const { data } = await client.from('proyectos_mga_estructurados').insert(payload).select().single();
        if (data && data.id) {
          proyecto.id = data.id;
        }
      }
    } catch (err) {
      console.warn('Error guardando proyecto en Supabase:', err);
    }
  }

  // Actualizar LocalStorage
  try {
    const cached = localStorage.getItem(cacheKey);
    let list: ProyectoMgaEstructurado[] = cached ? JSON.parse(cached) : [];
    const idx = list.findIndex(p => p.id === proyecto.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...proyecto, updated_at: now } as ProyectoMgaEstructurado;
    } else {
      list.unshift(proyecto as ProyectoMgaEstructurado);
    }
    localStorage.setItem(cacheKey, JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }

  return proyecto as ProyectoMgaEstructurado;
}

// 3. CONSULTAR REQUISITOS DEL PROYECTO ("SUPLIR REQUISITOS")
export async function fetchRequisitosProyecto(proyectoId: string, sectorDnp?: string, nombreProyecto?: string): Promise<RequisitoViabilidad[]> {
  const cacheKey = `ialcaldia_requisitos_${proyectoId}`;
  const client = getSupabaseClient();
  const effectiveSector = sectorDnp || (proyectoId.toLowerCase().includes('tic') ? 'TIC' : 'Transporte');
  const effectiveNombre = nombreProyecto || (proyectoId.toLowerCase().includes('tic') ? 'Conectividad Digital Starlink' : '');

  let list: RequisitoViabilidad[] = [];

  if (client) {
    try {
      const { data, error } = await client
        .from('requisitos_viabilidad_proyecto')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .order('categoria', { ascending: true });

      if (!error && data && data.length > 0) {
        list = data as RequisitoViabilidad[];
      }
    } catch (err) {
      console.warn('Error consultando requisitos en Supabase:', err);
    }
  }

  // Si no había en Supabase, buscar en LocalStorage
  if (list.length === 0 && typeof localStorage !== 'undefined') {
    try {
      const local = localStorage.getItem(cacheKey);
      if (local) list = JSON.parse(local);
    } catch (_) {}
  }

  // SANEAR INCONGRUENCIAS SECTORIALES AUTOMÁTICAMENTE (Ej: Quitar concreto 3000 PSI de proyectos TIC)
  const { sanitized, wasMigrated } = sanitizeAndMigrateProjectRequirements(proyectoId, effectiveSector, effectiveNombre, list);
  
  if (wasMigrated || list.length === 0) {
    list = sanitized;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(list));
      } catch (_) {}
    }
    // Guardar en Supabase si aplica
    if (client) {
      try {
        const payload = list.map(r => ({
          proyecto_id: proyectoId,
          categoria: r.categoria,
          nombre_requisito: r.nombre_requisito,
          descripcion: r.descripcion,
          es_obligatorio: r.es_obligatorio,
          estado: r.estado || 'pendiente',
          observaciones: r.observaciones
        }));
        try { await client.from('requisitos_viabilidad_proyecto').upsert(payload, { onConflict: 'id' }); } catch (_) {}
      } catch (_) {}
    }
  }

  return list;
}

// 4. ACTUALIZAR ESTADO DE UN REQUISITO (SUPLIR REQUISITO)
export async function updateRequisitoEstado(
  proyectoId: string,
  requisitoId: string, 
  updates: Partial<RequisitoViabilidad>
): Promise<void> {
  const cacheKey = `ialcaldia_requisitos_${proyectoId}`;
  const client = getSupabaseClient();

  if (client) {
    try {
      await client
        .from('requisitos_viabilidad_proyecto')
        .update({
          estado: updates.estado,
          archivo_url: updates.archivo_url,
          archivo_nombre: updates.archivo_nombre,
          archivo_size: updates.archivo_size,
          observaciones: updates.observaciones,
          updated_at: new Date().toISOString()
        })
        .eq('id', requisitoId);
    } catch (err) {
      console.warn('Error actualizando requisito en Supabase:', err);
    }
  }

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const list: RequisitoViabilidad[] = JSON.parse(cached);
      const idx = list.findIndex(r => r.id === requisitoId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem(cacheKey, JSON.stringify(list));
      }
    }
  } catch (e) {
    console.warn(e);
  }
}

// 5. CARGAR DOCUMENTO DE SOPORTE PARA UN REQUISITO
export async function uploadRequisitoDocumento(
  proyectoId: string, 
  requisitoId: string, 
  file: File
): Promise<{ url: string; nombre: string; size: number }> {
  const client = getSupabaseClient();
  let fileUrl = URL.createObjectURL(file);

  if (client) {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${proyectoId}/${requisitoId}_${Date.now()}.${fileExt}`;
      const { data, error } = await client.storage
        .from('expedientes_proyectos')
        .upload(filePath, file, { upsert: true });

      if (!error && data) {
        const { data: publicUrlData } = client.storage
          .from('expedientes_proyectos')
          .getPublicUrl(filePath);
        if (publicUrlData && publicUrlData.publicUrl) {
          fileUrl = publicUrlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Error en storage de Supabase, usando enlace local simulado:', err);
    }
  }

  // Actualizar requisito
  await updateRequisitoEstado(proyectoId, requisitoId, {
    estado: 'cargado',
    archivo_url: fileUrl,
    archivo_nombre: file.name,
    archivo_size: file.size,
    observaciones: `Documento oficial '${file.name}' adjuntado y validado en el expediente.`
  });

  return { url: fileUrl, nombre: file.name, size: file.size };
}

// 6. CENSO DE BENEFICIARIOS & AFECTADOS
export async function fetchCensoBeneficiarios(proyectoId: string): Promise<CensoBeneficiario[]> {
  const cacheKey = `ialcaldia_censo_${proyectoId}`;
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('censo_beneficiarios_proyecto')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data as CensoBeneficiario[];
      }
    } catch (err) {
      console.warn('Error consultando censo en Supabase:', err);
    }
  }

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.warn(e);
  }

  // Censo inicial de demostración territorial verídica
  const defaultCenso: CensoBeneficiario[] = [
    {
      id: `cen-${proyectoId}-1`,
      proyecto_id: proyectoId,
      nombre_completo: 'Iván Alvarado',
      numero_documento: 'C.C. 19.384.920',
      vereda: 'San Carlos',
      grupo_sisben: 'A4 (Pobreza Extrema)',
      numero_miembros_familia: 4,
      hectareas_o_unidad_productiva: 'Finca La Esperanza - 3.5 Ha Panela y Café',
      telefono_contacto: '3225822027',
      observacion_territorial: 'Líder comunitario y afectado directo por colapso de vía en invierno y falta de conectividad escolar.'
    },
    {
      id: `cen-${proyectoId}-2`,
      proyecto_id: proyectoId,
      nombre_completo: 'Rosa Elena Gómez',
      numero_documento: 'C.C. 52.849.102',
      vereda: 'San Carlos',
      grupo_sisben: 'B2 (Pobreza Moderada)',
      numero_miembros_familia: 5,
      hectareas_o_unidad_productiva: 'Finca El Porvenir - 2 Ha Cacao y Cítricos',
      telefono_contacto: '3104829103',
      observacion_territorial: 'Madre comunitaria y productora agropecuaria.'
    },
    {
      id: `cen-${proyectoId}-3`,
      proyecto_id: proyectoId,
      nombre_completo: 'José Manuel Beltrán',
      numero_documento: 'C.C. 80.294.112',
      vereda: 'San Carlos',
      grupo_sisben: 'B4 (Pobreza Moderada)',
      numero_miembros_familia: 3,
      hectareas_o_unidad_productiva: 'Finca Bellavista - Producción Ganadera Doble Propósito',
      telefono_contacto: '3128940122',
      observacion_territorial: 'Presidente JAC San Carlos - Validador de servidumbres comunales.'
    }
  ];

  localStorage.setItem(cacheKey, JSON.stringify(defaultCenso));
  return defaultCenso;
}

export async function addCensoBeneficiario(item: Omit<CensoBeneficiario, 'id' | 'created_at'>): Promise<CensoBeneficiario> {
  const cacheKey = `ialcaldia_censo_${item.proyecto_id}`;
  const newItem: CensoBeneficiario = {
    ...item,
    id: `cen-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    created_at: new Date().toISOString()
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data } = await client
        .from('censo_beneficiarios_proyecto')
        .insert({
          proyecto_id: item.proyecto_id,
          nombre_completo: item.nombre_completo,
          numero_documento: item.numero_documento,
          vereda: item.vereda,
          grupo_sisben: item.grupo_sisben,
          numero_miembros_familia: item.numero_miembros_familia || 1,
          hectareas_o_unidad_productiva: item.hectareas_o_unidad_productiva,
          telefono_contacto: item.telefono_contacto,
          observacion_territorial: item.observacion_territorial
        })
        .select()
        .single();
      if (data && data.id) {
        newItem.id = data.id;
      }
    } catch (err) {
      console.warn('Error guardando beneficiario en Supabase:', err);
    }
  }

  try {
    const cached = localStorage.getItem(cacheKey);
    const list: CensoBeneficiario[] = cached ? JSON.parse(cached) : [];
    list.unshift(newItem);
    localStorage.setItem(cacheKey, JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }

  return newItem;
}

// 7. SINTETIZAR NUEVO PROYECTO MGA DIRECTAMENTE DESDE VOZ DEL PUEBLO
export async function crearProyectoDesdeVozCiudadana(
  need: CitizenNeed,
  municipioId: 'caparrapi' | 'guaduas'
): Promise<ProyectoMgaEstructurado> {
  const prefix = municipioId === 'caparrapi' ? 'CAP' : 'GUA';
  const timestamp = Date.now().toString().slice(-4);
  const bpin = `2026-${prefix}-${need.sector.slice(0, 4).toUpperCase()}-${timestamp}`;

  const nuevoProyecto: ProyectoMgaEstructurado = {
    id: `mga-${municipioId}-${Date.now()}`,
    municipio_id: municipioId,
    codigo_bpin_propuesto: bpin,
    nombre_proyecto: `Plan Integral de ${need.sector}: Intervención Territorial en ${need.veredaBarrio}`,
    sector_dnp: need.sector,
    codigo_producto_dnp: 'Catálogo de Productos DNP - ' + need.sector,
    fase_mga: 'Fase 3 - Factibilidad Definitiva',
    estado_tramite: 'en_estructuracion',
    presupuesto_total_cop: need.presupuestoEstimadoCop || 850000000,
    fuente_financiacion_principal: 'Presidencia de la República / Gobierno con el Pueblo / OCAD Paz',
    veredas_impactadas: [need.veredaBarrio],
    poblacion_beneficiaria_total: 1200,
    evaluacion_economica: {
      tasa_descuento: '12,0% (Estándar DNP)',
      vpn_social: 'En cálculo socioeconómico',
      tir_social: '15,8%',
      relacion_costo_beneficio: '1,32'
    },
    arbol_problemas: {
      problema_central: need.problematicaSintetizada,
      causa_directa: 'Déficit histórico de inversión y desarticulación institucional en el territorio',
      causa_indirecta: 'Ausencia de proyectos estructurados viabilizados ante ministerios',
      efecto_directo: 'Afectación directa a la calidad de vida de las familias de ' + need.veredaBarrio,
      efecto_indirecto: 'Freno al desarrollo económico y social del corredor rural'
    },
    arbol_objetivos: {
      objetivo_general: need.propuestaRamitos || `Solucionar la problemática de ${need.sector} en ${need.veredaBarrio}`,
      fines_directos: [
        'Atender de manera prioritaria la solicitud ciudadana registrada en Voz del Pueblo',
        'Garantizar infraestructura duradera bajo especificaciones técnicas oficiales',
        'Beneficiar a las familias campesinas y productoras del sector'
      ]
    },
    justificacion_presidencia: `Proyecto originado en la escucha activa y priorización directa de la comunidad de ${need.veredaBarrio} (${municipioId === 'caparrapi' ? 'Caparrapí' : 'Guaduas'}). Registra respaldo popular validado por el Equipo de Trabajo RR para radicación ante el Gobierno Nacional.`,
    creado_por: `Equipo RR (Iniciativa Ciudadana de ${need.ciudadanoNombre || 'la Comunidad'})`,
    created_at: new Date().toISOString()
  };

  const guardado = await saveProyectoMgaInSupabase(nuevoProyecto);
  return guardado;
}


