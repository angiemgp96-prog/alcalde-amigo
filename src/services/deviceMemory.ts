// Servicio de Memoria por Dispositivo e IP con Huella Determinística
const LOCAL_STORAGE_DEVICE_ID = 'alcalde_amigo_device_id';
const LOCAL_STORAGE_CLIENT_IP = 'alcalde_amigo_cached_ip';

let cachedDeviceId: string | null = null;
let cachedIpAddress: string | null = null;

// Genera una huella digital determinística basada en el hardware y entorno del dispositivo
// (Permanece EXACTAMENTE IGUAL aunque el usuario borre toda la caché y el LocalStorage)
export function getStableDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server-env';
  
  try {
    const screenInfo = `${window.screen?.width || 0}x${window.screen?.height || 0}x${window.screen?.colorDepth || 0}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota';
    const lang = navigator.language || 'es';
    const cores = navigator.hardwareConcurrency || 4;
    const ua = navigator.userAgent || '';
    
    // Hash determinístico rápido (djb2)
    const raw = `${screenInfo}_${tz}_${lang}_${cores}_${ua}`;
    let hash = 5381;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) + hash) + raw.charCodeAt(i);
      hash = hash & hash;
    }
    return `fp-${Math.abs(hash).toString(36)}`;
  } catch (e) {
    return 'fp-standard';
  }
}

// Obtiene o genera un ID único persistente para este navegador/dispositivo
export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;
  
  const stableFingerprint = getStableDeviceFingerprint();

  try {
    let id = localStorage.getItem(LOCAL_STORAGE_DEVICE_ID);
    if (!id) {
      // Usar la huella determinística para que nunca se pierda aunque borren caché
      id = `dev-${stableFingerprint}`;
      localStorage.setItem(LOCAL_STORAGE_DEVICE_ID, id);
    }
    cachedDeviceId = id;
    return id;
  } catch (e) {
    return `dev-${stableFingerprint}`;
  }
}

// Obtiene la dirección IP pública del cliente (Instantánea 0ms vía caché local)
export async function getClientIpAddress(): Promise<string> {
  if (cachedIpAddress) return cachedIpAddress;

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_CLIENT_IP);
    if (stored && stored.length > 5) {
      cachedIpAddress = stored;
      return stored;
    }
  } catch (e) {}

  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(800) });
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        cachedIpAddress = data.ip;
        try { localStorage.setItem(LOCAL_STORAGE_CLIENT_IP, data.ip); } catch (e) {}
        return data.ip;
      }
    }
  } catch (e) {
    // Fallback silencioso ultra-rápido
  }

  cachedIpAddress = 'IP Local / Desconocida';
  return cachedIpAddress;
}
