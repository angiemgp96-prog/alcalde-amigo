import React, { useState, useEffect } from 'react';
import { CitizenNeed, CitizenLead } from '../types';
import { processRamitosConversationAsync } from '../services/ramitosBrain';
import { voteCitizenNeed, getVotedNeedIds } from '../services/api';
import { MUNICIPIOS_DATA } from '../data/municipiosConfig';
import { 
  ThumbsUp, TrendingUp, Sparkles, MapPin, 
  ShieldCheck, CheckCircle2, Clock, Check, MessageSquare, AlertCircle
} from 'lucide-react';

interface CitizenVoiceViewProps {
  needs: CitizenNeed[];
  onSaveNeed: (need: Omit<CitizenNeed, 'id' | 'fechaReporte' | 'votosApoyo'>, lead?: Omit<CitizenLead, 'id' | 'fechaRegistro' | 'estadoNotificacion'>) => void;
  municipioId?: 'guaduas' | 'caparrapi';
}

export const CitizenVoiceView: React.FC<CitizenVoiceViewProps> = ({ needs, onSaveNeed, municipioId = 'guaduas' }) => {
  const isCaparrapi = municipioId === 'caparrapi';
  const munData = MUNICIPIOS_DATA[municipioId || 'guaduas'];
  const veredasList = munData.veredas;

  // Estados del formulario manual complementario
  const [transcript, setTranscript] = useState('');
  const [vereda, setVereda] = useState(veredasList[0]?.nombre || 'Centro');
  const [ciudadanoNombre, setCiudadanoNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de votación comunal y filtrado
  const [localNeeds, setLocalNeeds] = useState<CitizenNeed[]>(needs);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes');
  const [filterVereda, setFilterVereda] = useState<string>('all');
  const [votingFeedbackId, setVotingFeedbackId] = useState<string | null>(null);

  useEffect(() => {
    setLocalNeeds(needs);
  }, [needs]);

  useEffect(() => {
    setVotedIds(getVotedNeedIds());
  }, []);

  useEffect(() => {
    const list = MUNICIPIOS_DATA[municipioId || 'guaduas'].veredas;
    if (list && list.length > 0) {
      setVereda(list[0].nombre);
    }
  }, [municipioId]);

  // Manejador del voto comunitario
  const handleVote = async (needId: string) => {
    if (votedIds.includes(needId)) return;

    setVotingFeedbackId(needId);
    const result = await voteCitizenNeed(needId, municipioId);

    if (result.success) {
      setVotedIds(prev => [...prev, needId]);
      setLocalNeeds(prev => prev.map(item => {
        if (item.id === needId) {
          return { ...item, votosApoyo: (item.votosApoyo || 0) + 1 };
        }
        return item;
      }));
    }

    setTimeout(() => {
      setVotingFeedbackId(null);
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) {
      alert('Por favor escribe tu propuesta o problemática comunal.');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentSynthesis = await processRamitosConversationAsync(transcript, vereda, [], false, municipioId);

      const leadData = whatsapp.trim().length >= 7 ? {
        nombre: ciudadanoNombre.trim() || 'Ciudadano de ' + vereda,
        whatsapp: whatsapp.trim(),
        veredaBarrio: vereda,
        interesPrincipal: currentSynthesis.sector || 'Infancia y Familia'
      } : undefined;

      onSaveNeed({
        ciudadanoNombre: ciudadanoNombre.trim() || 'Ciudadano de ' + vereda,
        veredaBarrio: vereda,
        audioTranscripcion: transcript,
        problematicaSintetizada: currentSynthesis.problematicaSintetizada || transcript,
        sector: currentSynthesis.sector || 'Infancia y Familia',
        urgencia: currentSynthesis.urgencia || 'Alta',
        propuestaRamitos: currentSynthesis.propuestaRamitos || currentSynthesis.textoRespuesta,
        insumosClave: currentSynthesis.insumosClave || [],
        presupuestoEstimadoCop: currentSynthesis.presupuestoEstimadoCop || 0,
        whatsapp: whatsapp.trim() || undefined,
        municipioId: municipioId,
        origen: 'formulario'
      }, leadData);

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setTranscript('');
        setCiudadanoNombre('');
        setWhatsapp('');
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrado estricto por municipio: AISLAMIENTO TOTAL (CERO MEZCLA ENTRE CAPARRAPÍ Y GUADUAS)
  const currentMun = (municipioId || 'guaduas').toLowerCase();
  const isCap = currentMun === 'caparrapi';
  const guaduasOnlyVeredas = ['puerto bogotá', 'puerto bogota', 'guaduero', 'piedras negras', 'guaduas centro', 'la paz', 'el hato', 'san josé', 'san jose', 'yaguara', 'la esperanza', 'carbonera', 'canta rana', 'versalles'];
  const caparrapiOnlyVeredas = ['san carlos', 'san ramón', 'san ramon', 'pitalito', 'terán', 'teran', 'san pedro', 'la magdalena', 'el dindal', 'morro negro', 'córdoba', 'cordoba', 'puerto colombia', 'cuatro caminos', 'alto del roble', 'acuaparrapí', 'acuaparrapi', 'el silencio', 'el dinde', 'mata de mora', 'la chorrera', 'boca de monte', 'galiche', 'barranquillas', 'loma alta', 'hoyo caliente', 'caparrapí centro', 'caparrapi centro'];

  const displayedNeeds = [...localNeeds]
    .filter(n => {
      if (!n || !n.id) return false;
      // Prohibir mostrar semillas inventadas
      if (n.id.startsWith('seed-')) return false;

      const v = (n.veredaBarrio || '').trim().toLowerCase();
      // Aislamiento territorial estricto
      if (isCap) {
        if (n.municipioId && n.municipioId === 'guaduas') return false;
        if (guaduasOnlyVeredas.includes(v)) return false;
      } else {
        if (n.municipioId && n.municipioId === 'caparrapi') return false;
        if (caparrapiOnlyVeredas.includes(v)) return false;
      }

      if (filterVereda === 'all') return true;
      return v === filterVereda.toLowerCase();
    })
    .sort((a, b) => {
      if (sortBy === 'votes') {
        const votesA = a.votosApoyo || 0;
        const votesB = b.votosApoyo || 0;
        if (votesB !== votesA) return votesB - votesA;
      }
      const timeA = new Date(a.fechaReporte || 0).getTime();
      const timeB = new Date(b.fechaReporte || 0).getTime();
      return timeB - timeA;
    });

  // Estadísticas del HUD calculadas estrictamente sobre las propuestas reales de este municipio
  const totalProposals = displayedNeeds.length;
  const totalVotes = displayedNeeds.reduce((acc, curr) => acc + (curr.votosApoyo || 1), 0);
  const topNeed = displayedNeeds[0];

  return (
    <div className="space-y-8">
      {/* HUD DE PRIORIZACIÓN CIUDADANA Y PARTICIPACIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="frosted-glass p-5 rounded-2xl border border-slate-800/80 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">
            🗳️
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase text-slate-400">Propuestas Estructuradas</p>
            <p className="text-2xl font-black text-white">{totalProposals}</p>
            <p className="text-[10px] text-emerald-400">Verificadas con IA por el Equipo RR</p>
          </div>
        </div>

        <div className="frosted-glass p-5 rounded-2xl border border-slate-800/80 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl">
            🔥
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase text-slate-400">Votos y Respaldos Comunitarios</p>
            <p className="text-2xl font-black text-cyan-300">{totalVotes}</p>
            <p className="text-[10px] text-cyan-400">Midiendo qué es lo que más quiere la gente</p>
          </div>
        </div>

        <div className="frosted-glass p-5 rounded-2xl border border-slate-800/80 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
            🏆
          </div>
          <div className="truncate">
            <p className="text-[11px] font-mono uppercase text-slate-400">Prioridad #1 de la Mayoría</p>
            <p className="text-sm font-bold text-amber-300 truncate">
              {topNeed ? topNeed.veredaBarrio : 'En proceso'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {topNeed ? `${topNeed.votosApoyo || 1} votos • ${topNeed.sector}` : 'Sin datos'}
            </p>
          </div>
        </div>
      </div>

      {/* BANNER DE FILTRO ÉTICO, NO SPAM Y AUTONOMÍA COMUNAL */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white">Filtro de Seriedad y Participación Activa: </span>
            <span>Las propuestas de cada conversación son redactadas técnicamente por la IA si tienen formulación e intención sincera. Las bromas, solicitudes absurdas o spam son descartadas y bloquean el dispositivo por 5 horas.</span>
          </div>
        </div>
      </div>

      {/* FORMULARIO COMPLEMENTARIO */}
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
          Esta vista te permite registrar inquietudes y propuestas para las veredas de {isCaparrapi ? 'Caparrapí' : 'Guaduas'}, o cargarlas automáticamente desde el diálogo en el Chat Copiloto.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={3}
            placeholder={`Escribe la problemática o sugerencia para tu sector en ${isCaparrapi ? 'Caparrapí' : 'Guaduas'}...`}
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Vereda / Sector ({isCaparrapi ? 'Caparrapí' : 'Guaduas'}):</label>
              <select
                value={vereda}
                onChange={(e) => setVereda(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
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
                placeholder="Nombre completo"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">WhatsApp de Contacto:</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ej. 3101234567"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Estructurando con IA...</span>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>¡Propuesta Comunitaria Guardada con Éxito!</span>
              </>
            ) : (
              <span>Guardar Inquietud para {isCaparrapi ? 'Caparrapí' : 'Guaduas'}</span>
            )}
          </button>
        </form>
      </div>

      {/* FEED DE PROPUESTAS CON CONTROLES DE PRIORIDAD Y VOTACIÓN */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Inquietudes y Propuestas Comunitarias</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 font-mono px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {displayedNeeds.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Vota y apoya las iniciativas para que el Equipo RR identifique las prioridades con mayor respaldo popular.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Orden */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setSortBy('votes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                  sortBy === 'votes'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Más Apoyadas (Prioridad)</span>
              </button>
              <button
                onClick={() => setSortBy('recent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                  sortBy === 'recent'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Más Recientes</span>
              </button>
            </div>

            {/* Filtro por Vereda */}
            <select
              value={filterVereda}
              onChange={(e) => setFilterVereda(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todas las veredas ({displayedNeeds.length})</option>
              {veredasList.map((v, i) => (
                <option key={i} value={v.nombre}>{v.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {displayedNeeds.length === 0 ? (
          <div className="frosted-glass p-12 text-center rounded-3xl border border-slate-800 space-y-3">
            <div className="text-4xl">{isCap ? '🐎' : '🌿'}</div>
            <p className="text-slate-300 font-semibold text-sm">
              No hay propuestas ciudadanas detectadas todavía para {isCap ? 'Caparrapí' : 'Guaduas'}.
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Conversa con el Copiloto IA en el Chat formulando una necesidad o sugerencia real para tu sector, o regístrala directamente en el formulario superior. La IA la estructurará y redactará automáticamente aquí para que la comunidad vote y priorice.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedNeeds.map((n) => {
              const isVoted = votedIds.includes(n.id);
              const isAnimating = votingFeedbackId === n.id;
              const isChatOrigin = n.origen === 'chat' || !n.origen;

              return (
                <div 
                  key={n.id} 
                  className="frosted-glass p-5 rounded-2xl border border-slate-800/90 hover:border-slate-700 transition flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Header de la tarjeta */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{n.veredaBarrio}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
                          {n.sector || 'Desarrollo Comunitario'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {isChatOrigin ? (
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-800/40 flex items-center space-x-1" title="Formulado en diálogo con la IA">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Copiloto IA</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-800/40 flex items-center space-x-1">
                            <MessageSquare className="w-2.5 h-2.5" />
                            <span>Formulario</span>
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          n.urgencia === 'Crítica' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          n.urgencia === 'Alta' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {n.urgencia || 'Media'}
                        </span>
                      </div>
                    </div>

                    {/* Problemática Sintetizada */}
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition leading-snug">
                        {n.problematicaSintetizada}
                      </h4>
                      {n.audioTranscripcion && n.audioTranscripcion !== n.problematicaSintetizada && (
                        <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-2">
                          "{n.audioTranscripcion}"
                        </p>
                      )}
                    </div>

                    {/* Propuesta Técnica Estructurada */}
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="flex items-center space-x-1 text-[10px] font-bold uppercase text-emerald-400">
                        <Sparkles className="w-3 h-3" />
                        <span>Solución Formulada (Equipo RR):</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {n.propuestaRamitos || 'Propuesta en proceso de validación técnica en terreno.'}
                      </p>
                    </div>

                    {/* Metadata del ciudadano */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="text-slate-500">Proponente:</span>
                        <span className="font-semibold text-slate-300 truncate">
                          {n.ciudadanoNombre || 'Vecino de ' + n.veredaBarrio}
                        </span>
                        {n.whatsapp && (
                          <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800">
                            WhatsApp registrado
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                        {new Date(n.fechaReporte || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Botón de Votación y Respaldo Comunal */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                        🔥
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-white">
                          {n.votosApoyo || 1} { (n.votosApoyo || 1) === 1 ? 'Voto' : 'Votos' }
                        </p>
                        <p className="text-[10px] text-slate-400">Respaldo Comunitario</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleVote(n.id)}
                      disabled={isVoted}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        isVoted
                          ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                      }`}
                    >
                      {isVoted ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Ya Apoyaste</span>
                        </>
                      ) : (
                        <>
                          <ThumbsUp className={`w-3.5 h-3.5 ${isAnimating ? 'animate-bounce' : ''}`} />
                          <span>Apoyar (+1 Voto)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
