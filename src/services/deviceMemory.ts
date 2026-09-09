// Servicio de Memoria por Dispositivo e IP
const LOCAL_STORAGE_DEVICE_ID = 'alcalde_amigo_device_id';

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

// Obtiene la dirección IP pública del cliente (con fallback silencioso)
export async function getClientIpAddress(): Promise<string> {
  if (cachedIpAddress) return cachedIpAddress;

  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        cachedIpAddress = data.ip;
        return data.ip;
      }
    }
  } catch (e) {
    // Fallback silencioso si hay bloqueo de CORS o red offline
  }

  cachedIpAddress = 'IP Local / Desconocida';
  return cachedIpAddress;
}
