import React, { useState } from 'react';
import { CitizenLead, GreenApiMessage, GreenApiConfig } from '../types';
import { sendWhatsAppMessage, getGreenApiConfig, saveGreenApiConfig } from '../services/greenApi';
import { VEREDAS_GUADUAS } from '../data/veredasGuaduas';
import { formatDate } from '../utils/formatters';
import { Send, Phone, MapPin, Users, Key, CheckCircle2, ShieldCheck, MessageSquare, Sparkles, Filter } from 'lucide-react';

interface GreenApiCrmViewProps {
  leads: CitizenLead[];
  messages: GreenApiMessage[];
  onMessageSent: () => void;
}

export const GreenApiCrmView: React.FC<GreenApiCrmViewProps> = ({
  leads,
  messages,
  onMessageSent
}) => {
  const [selectedVereda, setSelectedVereda] = useState<string>('Todas');
  const [singlePhone, setSinglePhone] = useState('');
  const [singleName, setSingleName] = useState('');
  const [messageText, setMessageText] = useState(
    'Hola! Ramitos te informa que tu inquietud para tu vereda ya fue analizada e incluida con solución práctica en el Plan de Gobierno de Guaduas. ¡La meta la construimos entre todos!'
  );
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  // Estado de configuración de Green API
  const [apiConfig, setApiConfig] = useState<GreenApiConfig>(getGreenApiConfig());
  const [showConfig, setShowConfig] = useState(false);

  const filteredLeads = selectedVereda === 'Todas'
    ? leads
    : leads.filter(l => l.veredaBarrio === selectedVereda);

  // Guardar credenciales de Green API
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveGreenApiConfig(apiConfig);
    alert('Configuración de Green API guardada exitosamente.');
    setShowConfig(false);
  };

  // Envío individual o masivo por WhatsApp
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      alert('Escribe un mensaje para difundir.');
      return;
    }

    setIsSending(true);
    setSendResult(null);

    if (singlePhone.trim()) {
      // Envío a número específico
      const res = await sendWhatsAppMessage(singlePhone, messageText, selectedVereda, 'Directo');
      setSendResult(res.info);
    } else {
      // Envío masivo a la lista filtrada de vereda
      if (filteredLeads.length === 0) {
        alert('No hay contactos registrados en esta vereda para enviar el mensaje masivo.');
        setIsSending(false);
        return;
      }

      let count = 0;
      for (const lead of filteredLeads) {
        const personalizedMsg = `Hola ${lead.nombre}, ${messageText}`;
        await sendWhatsAppMessage(lead.whatsapp, personalizedMsg, lead.veredaBarrio, 'Masivo Veredal');
        count++;
      }
      setSendResult(`Envío procesado para ${count} contactos de ${selectedVereda}.`);
    }

    setIsSending(false);
    onMessageSent();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner: CRM Green API */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold uppercase tracking-wider">
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            <span>CRM Político Comunitario Green API</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Difusión y Seguimiento por <span className="text-emerald-600">WhatsApp & Telegram</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
            Mantén una comunicación constante con los ciudadanos entrevistados. Envía avances de proyectos por vereda para que la ciudadanía sienta que la meta es de todos.
          </p>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold flex items-center space-x-2 transition-all shrink-0 cursor-pointer shadow-xs"
        >
          <Key className="w-4 h-4 text-amber-600" />
          <span>Configurar Llaves Green API</span>
        </button>
      </div>

      {/* API Key Modal / Form */}
      {showConfig && (
        <form onSubmit={handleSaveConfig} className="bg-amber-50/90 rounded-3xl p-6 border border-amber-300 shadow-md space-y-4 animate-fadeIn">
          <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-600" /> Configuración de Instancia Green API (WhatsApp Real)
          </h3>
          <p className="text-xs text-slate-700 font-medium">
            Ingresa los datos de tu cuenta en Green-API.com para realizar envíos reales por WhatsApp. Si los dejas vacíos, el sistema operará en <strong>Modo Simulación Interactivo</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">idInstance:</label>
              <input
                type="text"
                value={apiConfig.idInstance}
                onChange={(e) => setApiConfig({ ...apiConfig, idInstance: e.target.value })}
                placeholder="Ej: 7103849201"
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">apiTokenInstance:</label>
              <input
                type="password"
                value={apiConfig.apiTokenInstance}
                onChange={(e) => setApiConfig({ ...apiConfig, apiTokenInstance: e.target.value })}
                placeholder="Ej: e82f91a0b3c4..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-800 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={apiConfig.enabled}
                onChange={(e) => setApiConfig({ ...apiConfig, enabled: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Habilitar envío real vía Green API</span>
            </label>
            <button
              type="submit"
              className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Broadcast Generator */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSendBroadcast} className="bg-white rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <span>Panel de Difusión de WhatsApp</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                {apiConfig.enabled ? 'Modo API Real' : 'Modo Simulador'}
              </span>
            </div>

            {/* Segment by Vereda */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>Segmentar por Vereda de Guaduas:</span>
                <span className="text-emerald-700 font-extrabold">{filteredLeads.length} contactos inscritos</span>
              </label>
              <select
                value={selectedVereda}
                onChange={(e) => setSelectedVereda(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Todas">Todas las Veredas (Difusión General)</option>
                {VEREDAS_GUADUAS.map((v, idx) => (
                  <option key={idx} value={v.nombre}>
                    {v.nombre} ({v.zona})
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Phone Option */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                O enviar a un número de WhatsApp específico (Opcional):
              </label>
              <input
                type="tel"
                value={singlePhone}
                onChange={(e) => setSinglePhone(e.target.value)}
                placeholder="Ej: 3104567890 (Si se especifica, solo enviará a este número)"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Message Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Mensaje de la Campaña / Avance de Solución:
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={5}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={isSending}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Enviando Mensajes...' : 'Ejecutar Difusión por WhatsApp'}</span>
            </button>

            {sendResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center">
                {sendResult}
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Contact List & Sent Log */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Registered Community Contacts */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>Contactos Ciudadanos Registrados</span>
              </h3>
              <span className="text-xs text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {leads.length} total
              </span>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-extrabold text-slate-900">{lead.nombre}</div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-amber-600" /> {lead.veredaBarrio}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-700 font-mono font-bold">+57 {lead.whatsapp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sent Messages History */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Historial Reciente de Envíos</span>
            </h3>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4 font-medium">No hay envíos registrados aún.</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-600 text-[10px] font-semibold">
                      <span>+{msg.destinatarioWhatsapp} ({msg.veredaBarrio})</span>
                      <span className="text-emerald-700 font-mono font-bold">{formatDate(msg.fechaEnvio)}</span>
                    </div>
                    <p className="text-slate-800 line-clamp-2 italic font-medium">"{msg.mensajeTexto}"</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
