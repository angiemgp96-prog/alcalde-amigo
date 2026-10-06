import React, { useState, useEffect } from 'react';
import { CitizenNeed, CitizenLead } from '../types';
import { speechEngine, SUGGESTED_PROMPTS } from '../services/speechEngine';
import { processRamitosConversationAsync } from '../services/ramitosBrain';
import { MUNICIPIOS_DATA } from '../data/municipiosConfig';
import { formatCOP } from '../utils/formatters';
import { Mic, Send, CheckCircle2, User, Phone, MapPin, Sparkles, ShoppingBag, ThumbsUp } from 'lucide-react';

interface CitizenVoiceViewProps {
  needs: CitizenNeed[];
  onSaveNeed: (need: Omit<CitizenNeed, 'id' | 'fechaReporte' | 'votosApoyo'>, lead?: Omit<CitizenLead, 'id' | 'fechaRegistro' | 'estadoNotificacion'>) => void;
  municipioId?: 'guaduas' | 'caparrapi';
}

export const CitizenVoiceView: React.FC<CitizenVoiceViewProps> = ({ needs, onSaveNeed, municipioId = 'guaduas' }) => {
  const isCaparrapi = municipioId === 'caparrapi';
  const munData = MUNICIPIOS_DATA[municipioId || 'guaduas'];
  const veredasList = munData.veredas;

  const [transcript, setTranscript] = useState('');
  const [vereda, setVereda] = useState(veredasList[0]?.nombre || 'Centro');
  const [ciudadanoNombre, setCiudadanoNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const list = MUNICIPIOS_DATA[municipioId || 'guaduas'].veredas;
    if (list && list.length > 0) {
      setVereda(list[0].nombre);
    }
  }, [municipioId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) {
      alert('Por favor habla por el micrófono o escribe tu voz/sugerencia.');
      return;
    }
    const currentSynthesis = await processRamitosConversationAsync(transcript, vereda, [], false, municipioId);

    const leadData = whatsapp.trim().length >= 7 ? {
      nombre: ciudadanoNombre.trim() || 'Ciudadano de ' + vereda,
      whatsapp: whatsapp.trim(),
      veredaBarrio: vereda,
      interesPrincipal: currentSynthesis.sector || 'Infancia y Familia'
    } : undefined;

    onSaveNeed({
      ciudadanoNombre: ciudadanoNombre.trim() || 'Ciudadano Anónimo',
      veredaBarrio: vereda,
      audioTranscripcion: transcript,
      problematicaSintetizada: currentSynthesis.problematicaSintetizada || transcript,
      sector: currentSynthesis.sector || 'Infancia y Familia',
      urgencia: currentSynthesis.urgencia || 'Alta',
      propuestaRamitos: currentSynthesis.propuestaRamitos || currentSynthesis.textoRespuesta,
      insumosClave: currentSynthesis.insumosClave || [],
      presupuestoEstimadoCop: currentSynthesis.presupuestoEstimadoCop || 0
    }, leadData);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setTranscript('');
      setCiudadanoNombre('');
      setWhatsapp('');
    }, 3000);
  };

  return (
    <div className="space-y-8">
      <div className="frosted-glass rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{isCaparrapi ? '🐎' : '🌿'}</span>
            <span>Escucha Activa & Formulario Complementario ({isCaparrapi ? 'Caparrapí' : 'Guaduas'})</span>
          </h3>
          <span className="text-xs font-mono text-cyan-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
            {veredasList.length} veredas e inspecciones disponibles
          </span>
        </div>
        <p className="text-xs text-slate-300">
          Esta vista te permite registrar inquietudes y propuestas para las veredas de {isCaparrapi ? 'Caparrapí' : 'Guaduas'} o cargarlas mediante formulario WhatsApp.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={3}
            placeholder={`Escribe la problemática o sugerencia para tu sector en ${isCaparrapi ? 'Caparrapí' : 'Guaduas'}...`}
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs text-white"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Vereda / Sector ({isCaparrapi ? 'Caparrapí' : 'Guaduas'}):</label>
              <select
                value={vereda}
                onChange={(e) => setVereda(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
              >
                {veredasList.map((v, i) => (
                  <option key={i} value={v.nombre}>{v.nombre} ({v.zona})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Nombre del Ciudadano:</label>
              <input
                type="text"
                value={ciudadanoNombre}
                onChange={(e) => setCiudadanoNombre(e.target.value)}
                placeholder="Nombre"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">WhatsApp de Contacto:</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="WhatsApp"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Guardar Inquietud para {isCaparrapi ? 'Caparrapí' : 'Guaduas'}
          </button>
        </form>
      </div>

      {/* Needs Feed */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white">Inquietudes Comunitarias Recientes ({needs.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {needs.map((n) => (
            <div key={n.id} className="frosted-glass p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">📍 {n.veredaBarrio}</span>
                <span className="text-amber-400 font-mono">{n.urgencia}</span>
              </div>
              <p className="text-xs text-white font-semibold">{n.problematicaSintetizada}</p>
              <p className="text-xs text-slate-300">💡 {n.propuestaRamitos}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
