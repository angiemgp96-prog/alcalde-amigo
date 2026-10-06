// Servicio de Memoria por Dispositivo e IP
const LOCAL_STORAGE_DEVICE_ID = 'alcalde_amigo_device_id';
const LOCAL_STORAGE_CLIENT_IP = 'alcalde_amigo_cached_ip';

let cachedDeviceId: string | null = null;
let cachedIpAddress: string | null = null;

// Obtiene o genera un ID único persistente para este navegador/dispositivo
export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;
  
  try {
    let id = localStorage.getItem(LOCAL_STORAGE_DEVICE_ID);
    if (!id) {
      id = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(LOCAL_STORAGE_DEVICE_ID, id);
    }
    cachedDeviceId = id;
    return id;
  } catch (e) {
    return `dev-${Date.now()}-fallback`;
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
