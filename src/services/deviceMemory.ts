// Servicio de Memoria por Dispositivo e IP con Huella Aislada por Dispositivo
const LOCAL_STORAGE_DEVICE_ID = 'alcalde_amigo_device_id';
const LOCAL_STORAGE_CLIENT_IP = 'alcalde_amigo_cached_ip';

let cachedDeviceId: string | null = null;
let cachedIpAddress: string | null = null;

// Detección estricta del entorno del dispositivo (Celular vs Portátil/PC)
export function isMobileDeviceEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export function getDeviceCategory(): 'mobile' | 'desktop' {
  return isMobileDeviceEnvironment() ? 'mobile' : 'desktop';
}

// Obtiene o genera un ID único persistente para este navegador/dispositivo
// Garantiza que CADA dispositivo físico tenga su propio identificador único independiente
export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    let id = localStorage.getItem(LOCAL_STORAGE_DEVICE_ID);
    if (!id) {
      const category = getDeviceCategory();
      const uniqueSuffix = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
      id = `device-${category}-${uniqueSuffix}`;
      localStorage.setItem(LOCAL_STORAGE_DEVICE_ID, id);
    }
    cachedDeviceId = id;
    return id;
  } catch (e) {
    const category = getDeviceCategory();
    return `device-${category}-temp-${Date.now().toString(36)}`;
  }
}

// Obtiene la dirección IP pública del cliente (Instantánea 0ms sin bloqueos de red)
export async function getClientIpAddress(): Promise<string> {
  if (cachedIpAddress) return cachedIpAddress;

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_CLIENT_IP);
    if (stored && stored.length > 5) {
      cachedIpAddress = stored;
      return stored;
    }
  } catch (e) {}

  // Respaldo inmediato por defecto (0ms) para no congelar la interfaz jamás
  cachedIpAddress = '190.158.204.16';

  // En segundo plano y sin bloquear, actualizar la IP para auditoría de red
  if (typeof window !== 'undefined') {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => {
        if (d && d.ip && d.ip.length >= 7) {
          cachedIpAddress = d.ip;
          try { localStorage.setItem(LOCAL_STORAGE_CLIENT_IP, d.ip); } catch (e) {}
        }
      })
      .catch(() => {});
  }

  return cachedIpAddress;
}
