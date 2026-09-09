import { GreenApiConfig, GreenApiMessage } from '../types';
import { formatWhatsAppNumber } from '../utils/formatters';
import { saveGreenApiMessage } from './api';

const LOCAL_STORAGE_GREEN_CFG = 'alcalde_amigo_green_cfg';

export function getGreenApiConfig(): GreenApiConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_GREEN_CFG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return {
    idInstance: '',
    apiTokenInstance: '',
    enabled: false
  };
}

export function saveGreenApiConfig(config: GreenApiConfig): void {
  localStorage.setItem(LOCAL_STORAGE_GREEN_CFG, JSON.stringify(config));
}

// Envía mensaje de WhatsApp individual vía Green API
export async function sendWhatsAppMessage(
  whatsappPhone: string,
  message: string,
  vereda: string = 'Guaduas',
  tipo: 'Directo' | 'Masivo Veredal' | 'Avance Proyecto' = 'Directo'
): Promise<{ success: boolean; simulated: boolean; info: string }> {
  const config = getGreenApiConfig();
  const formattedPhone = formatWhatsAppNumber(whatsappPhone);

  if (!config.enabled || !config.idInstance || !config.apiTokenInstance) {
    // Modo Simulación interactivo
    saveGreenApiMessage({
      destinatarioWhatsapp: formattedPhone,
      veredaBarrio: vereda,
      mensajeTexto: message,
      tipoEnvio: tipo,
      estadoEnvio: 'Enviado Simulador'
    });
    return {
      success: true,
      simulated: true,
      info: `Simulación de WhatsApp realizada a +${formattedPhone}. (Configura tus llaves de Green API para envío real).`
    };
  }

  // Envío real a la API de Green API
  try {
    const url = `https://api.green-api.com/waInstance${config.idInstance}/sendMessage/${config.apiTokenInstance}`;
    const payload = {
      chatId: `${formattedPhone}@c.us`,
      message: message
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      saveGreenApiMessage({
        destinatarioWhatsapp: formattedPhone,
        veredaBarrio: vereda,
        mensajeTexto: message,
        tipoEnvio: tipo,
        estadoEnvio: 'Enviado GreenAPI'
      });
      return {
        success: true,
        simulated: false,
        info: `Mensaje enviado exitosamente a WhatsApp (+${formattedPhone}) vía Green API.`
      };
    } else {
      const errText = await response.text();
      throw new Error(errText);
    }
  } catch (err: any) {
    console.error('Error enviando mensaje por Green API:', err);
    saveGreenApiMessage({
      destinatarioWhatsapp: formattedPhone,
      veredaBarrio: vereda,
      mensajeTexto: message,
      tipoEnvio: tipo,
      estadoEnvio: 'Fallido'
    });
    return {
      success: false,
      simulated: false,
      info: `Error al conectar con Green API: ${err.message || err}`
    };
  }
}
