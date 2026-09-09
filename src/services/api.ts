import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CitizenNeed, CitizenLead, BaseProposal, GreenApiMessage, PurchaseItem, LaborItem, ProposalComment, PilotVoting } from '../types';
import { BASE_PROPOSALS } from '../data/basePlanData';
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
}

export async function saveRamitosInteractionLog(log: RamitosInteractionLog): Promise<void> {
  const deviceId = getDeviceId();
  const ipAddress = await getClientIpAddress();

  // Buscar información de lead previa si no viene dada
  const savedLead = getUserLeadInfo();
  const nombreFinal = log.nombreCiudadano || savedLead?.nombre || null;
  const whatsappFinal = log.whatsappCiudadano || savedLead?.whatsapp || null;

  if (supabaseClient) {
    try {
      await supabaseClient.from('interacciones_conversaciones_ramitos').insert({
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

export async function getPastInteractionsHistory(deviceId?: string, ipAddress?: string): Promise<PastUserInteraction[]> {
  const targetDeviceId = deviceId || getDeviceId();
  const targetIp = ipAddress || await getClientIpAddress();

  if (supabaseClient) {
    try {
      // 1. Consultar por device_id
      let { data, error } = await supabaseClient
        .from('interacciones_conversaciones_ramitos')
        .select('mensaje_textual_ciudadano, respuesta_limpia_ramitos, fecha_interaccion')
        .eq('device_id', targetDeviceId)
        .order('fecha_interaccion', { ascending: true })
        .limit(20);

      // 2. Si no hay por device_id, consultar por ip_address
      if ((!data || data.length === 0) && targetIp) {
        const resIp = await supabaseClient
          .from('interacciones_conversaciones_ramitos')
          .select('mensaje_textual_ciudadano, respuesta_limpia_ramitos, fecha_interaccion')
          .eq('ip_address', targetIp)
          .order('fecha_interaccion', { ascending: true })
          .limit(20);
        data = resIp.data || [];
      }

      if (data && data.length > 0) {
        return data.map((item: any) => ({
          userText: item.mensaje_textual_ciudadano,
          ramitosResponse: item.respuesta_limpia_ramitos,
          timestamp: item.fecha_interaccion
        }));
      }
    } catch (err) {
      console.warn('Error obteniendo historial completo de interacciones:', err);
    }
  }
  return [];
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
// GESTIÓN DE NECESIDADES Y PROPUESTAS CIUDADANAS (ESCUCHA RAMITOS)
// -------------------------------------------------------------
export async function saveCitizenNeed(need: Omit<CitizenNeed, 'id' | 'fechaReporte' | 'votosApoyo'>): Promise<CitizenNeed> {
  const newNeed: CitizenNeed = {
    ...need,
    id: `need-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    votosApoyo: 1,
    fechaReporte: new Date().toISOString()
  };

  // Guardar en Supabase en las tablas problematicas_ciudadanas y propuestas_estructuradas_ia
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

  const existing = getCitizenNeeds();
  existing.unshift(newNeed);
  localStorage.setItem(LOCAL_STORAGE_NEEDS, JSON.stringify(existing));
  return newNeed;
}

export function getCitizenNeeds(): CitizenNeed[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NEEDS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

// -------------------------------------------------------------
// GESTIÓN DEL PLAN DE GOBIERNO (PROPOSALS)
// -------------------------------------------------------------
export function getBaseProposals(): BaseProposal[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PLAN);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  // Retorna datos semilla por defecto
  return BASE_PROPOSALS;
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
