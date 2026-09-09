import React from 'react';
import { Mic, MicOff, Volume2, Sparkles, Zap, Lightbulb } from 'lucide-react';
import { SUGGESTED_PROMPTS } from '../services/speechEngine';

interface RamitosAssistantProps {
  isListening: boolean;
  onToggleMic: () => void;
  onSelectSample: (sample: string) => void;
  currentTranscript: string;
}

export const RamitosAssistant: React.FC<RamitosAssistantProps> = ({
  isListening,
  onToggleMic,
  onSelectSample,
  currentTranscript
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl frosted-glass p-6 sm:p-8 border border-emerald-500/20 shadow-2xl mb-8">
      {/* Background Radial Glow */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Ramitos Avatar & Mic Recording Ring */}
        <div className="lg:col-span-5 flex flex-col items-center text-center">
          <div className="relative mb-6">
            
            {/* Pulsing Mic Ring */}
            <div
              className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-1 flex items-center justify-center transition-all duration-500 ${
                isListening ? 'pulse-mic-active scale-105 shadow-2xl shadow-emerald-500/50' : 'shadow-xl shadow-emerald-500/20'
              }`}
            >
              <div className="w-full h-full bg-slate-950 rounded-full flex flex-col items-center justify-center relative overflow-hidden group">
                <span className="text-5xl sm:text-6xl mb-1 transform group-hover:scale-110 transition-transform">🌿</span>
                <span className="text-xs font-bold tracking-wider text-emerald-400 font-mono">RAMITOS</span>
                
                {/* Visualizador de Onda de Audio cuando está grabando */}
                {isListening && (
                  <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center space-x-1.5 h-6">
                    <div className="w-1.5 bg-emerald-400 rounded-full audio-bar"></div>
                    <div className="w-1.5 bg-amber-400 rounded-full audio-bar"></div>
                    <div className="w-1.5 bg-teal-400 rounded-full audio-bar"></div>
                    <div className="w-1.5 bg-emerald-300 rounded-full audio-bar"></div>
                    <div className="w-1.5 bg-amber-300 rounded-full audio-bar"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Mic Toggle Button */}
            <button
              onClick={onToggleMic}
              className={`absolute -bottom-2 right-0 sm:right-2 p-4 rounded-2xl font-bold text-white shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 ring-4 ring-rose-500/30'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-600/40 glow-emerald'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-6 h-6 animate-pulse" />
                  <span className="text-sm font-semibold pr-1">Detener</span>
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6" />
                  <span className="text-sm font-semibold pr-1">Hablar a Ramitos</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-white flex items-center justify-center gap-2">
              <span>Hola, soy Ramitos</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              Presiona el botón, habla libremente y cuéntame la necesidad de tu vereda o barrio. Yo redactaré la idea y propondré la solución.
            </p>
          </div>
        </div>

        {/* Right Column: Live Transcript Display & Quick Samples */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 relative">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Volume2 className={`w-4 h-4 ${isListening ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {isListening ? 'Escuchando en vivo...' : 'Transcripción de la Voz'}
                </span>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-200 min-h-[70px] italic leading-relaxed">
              {currentTranscript || (
                <span className="text-slate-500 not-italic">
                  "Oprime 'Hablar a Ramitos' para iniciar el micrófono o selecciona una prueba rápida abajo..."
                </span>
              )}
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Sugerencias Rápida (Haz Clic):
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.slice(0, 4).map((prompt: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => onSelectSample(prompt)}
                  className="text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition-all text-xs group"
                >
                  <div className="font-semibold text-emerald-300 group-hover:text-emerald-200 flex items-center justify-between">
                    <span className="line-clamp-1">{prompt}</span>
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 opacity-70 group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
