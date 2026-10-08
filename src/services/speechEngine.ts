// Servicio Web Speech API & TTS Neural Colombiano (Micrófono + Voz Hablada Realista)

export interface SpeechListenerCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (errorMsg: string) => void;
  onEnd?: () => void;
}

class SpeechEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private supported: boolean = false;
  private voiceEnabled: boolean = true;
  private voicesLoaded: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.supported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-CO';
    } else {
      this.supported = false;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.voicesLoaded = true;
      };
    }
  }

  public isSupported(): boolean {
    return this.supported;
  }

  public start(callbacks: SpeechListenerCallbacks): void {
    if (!this.supported || !this.recognition) {
      if (callbacks.onError) {
        callbacks.onError('El navegador no soporta micrófono directo. Escribe tu mensaje.');
      }
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      if (callbacks.onStart) callbacks.onStart();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const fullText = finalTranscript || interimTranscript;
      if (callbacks.onResult) {
        callbacks.onResult(fullText, Boolean(finalTranscript));
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      if (callbacks.onError) {
        callbacks.onError(`Micrófono: ${event.error || 'No detectado'}`);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (callbacks.onEnd) callbacks.onEnd();
    };

    try {
      this.recognition.start();
    } catch (e: any) {
      if (callbacks.onError) callbacks.onError('Error al encender micrófono.');
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public unlockAudioContext(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const silentUtterance = new SpeechSynthesisUtterance('');
        silentUtterance.volume = 0;
        window.speechSynthesis.speak(silentUtterance);
      } catch (e) {
        console.warn('Audio gesture unlock error:', e);
      }
    }
  }

  private currentSpeechId: number = 0;
  private currentSyncTimer: any = null;

  public stopSpeaking(): void {
    this.currentSpeechId++;
    if (this.currentSyncTimer) {
      clearInterval(this.currentSyncTimer);
      this.currentSyncTimer = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  // VOZ HABLADA REALISTA DE RAMITOS / COPILOTO (NEURAL COLOMBIANA SIN APIS O ELEVENLABS OSCAR LOPEZ PAISA)
  public async speakRamitos(
    text: string,
    onEnd?: () => void,
    onBoundary?: (charIndex: number, charLength?: number) => void
  ): Promise<void> {
    if (!this.voiceEnabled || typeof window === 'undefined') return;

    this.stopSpeaking();
    const mySpeechId = ++this.currentSpeechId;

    const cleanText = text
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
      .replace(/[\u{2600}-\u{27BF}]/gu, '')
      .replace(/[\u{2300}-\u{23FF}]/gu, '')
      .replace(/[\u{2B00}-\u{2BFF}]/gu, '')
      .replace(/[🌿🌱🍃🌾🌴🌳🌲✨⚡📌💰👤🚨❌➔⏱️📍🔥🗳️💡🤝🏛️📊📢🇨🇴🛡️🐎🐴🎙️🤖]/gu, '')
      .replace(/[*_#~`]/g, '')
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    // 1. REVISAR SI EL USUARIO TIENE GUARDADA UNA API KEY DE ELEVENLABS (VOZ OSCAR LOPEZ PAISA)
    let elevenKey = '';
    try {
      elevenKey = localStorage.getItem('elevenlabs_api_key') || '';
    } catch (e) {}

    // 2. INTENTO 1: ELEVENLABS (SI HAY LLAVE) O EDGE NEURAL COLOMBIA GRATUITA (DEFAULT)
    try {
      let audioUrl = '';
      if (elevenKey.trim()) {
        const elRes = await fetch('/api/tts-elevenlabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            apiKey: elevenKey.trim(),
            voiceId: 'XRJWcG2EfnXUf27dRJZn' // Oscar Lopez Paisa / Medellín Colombian Voice
          })
        });
        if (this.currentSpeechId !== mySpeechId) return;
        if (elRes.ok) {
          const blob = await elRes.blob();
          audioUrl = URL.createObjectURL(blob);
        }
      }

      // Si no hay llave de ElevenLabs o falló, usar Edge Neural Colombia Gratuito
      if (!audioUrl) {
        const edgeRes = await fetch(`/api/tts?text=${encodeURIComponent(cleanText)}&voice=es-CO-GonzaloNeural`);
        if (this.currentSpeechId !== mySpeechId) return;
        if (edgeRes.ok) {
          const blob = await edgeRes.blob();
          audioUrl = URL.createObjectURL(blob);
        }
      }

      if (this.currentSpeechId !== mySpeechId) return;

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;

        const updateWordProgress = () => {
          if (this.currentSpeechId !== mySpeechId) {
            if (this.currentSyncTimer) {
              clearInterval(this.currentSyncTimer);
              this.currentSyncTimer = null;
            }
            return;
          }
          if (!audio.duration || isNaN(audio.duration) || audio.duration <= 0) return;
          const ratio = Math.min(1, Math.max(0, audio.currentTime / audio.duration));
          let targetIndex = Math.floor(ratio * cleanText.length);
          if (targetIndex < cleanText.length) {
            const nextSpace = cleanText.indexOf(' ', targetIndex);
            if (nextSpace !== -1 && nextSpace - targetIndex < 6) {
              targetIndex = nextSpace;
            }
          }
          if (onBoundary) {
            onBoundary(targetIndex, 0);
          }
        };

        this.currentSyncTimer = setInterval(updateWordProgress, 40);
        audio.addEventListener('timeupdate', updateWordProgress);

        audio.onended = () => {
          if (this.currentSpeechId !== mySpeechId) return;
          if (this.currentSyncTimer) {
            clearInterval(this.currentSyncTimer);
            this.currentSyncTimer = null;
          }
          audio.removeEventListener('timeupdate', updateWordProgress);
          this.currentAudio = null;
          if (onBoundary) onBoundary(cleanText.length, 0);
          if (onEnd) onEnd();
        };

        audio.onerror = () => {
          if (this.currentSpeechId !== mySpeechId) return;
          if (this.currentSyncTimer) {
            clearInterval(this.currentSyncTimer);
            this.currentSyncTimer = null;
          }
          audio.removeEventListener('timeupdate', updateWordProgress);
          this.currentAudio = null;
          this.fallbackBrowserSpeech(cleanText, mySpeechId, onEnd, onBoundary);
        };

        await audio.play();
        return;
      }
    } catch (netErr) {
      console.warn('Neural TTS Server unreachable, using browser speech fallback:', netErr);
    }

    if (this.currentSpeechId !== mySpeechId) return;

    // 3. RESPALDO LOCAL: WEB SPEECH API DEL NAVEGADOR (NUNCA ESPAÑA)
    this.fallbackBrowserSpeech(cleanText, mySpeechId, onEnd, onBoundary);
  }

  private fallbackBrowserSpeech(
    cleanText: string,
    speechId: number,
    onEnd?: () => void,
    onBoundary?: (charIndex: number, charLength?: number) => void
  ) {
    if (this.currentSpeechId !== speechId) return;
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-CO';
      utterance.rate = 1.0;
      utterance.pitch = 1.02;

      const voices = window.speechSynthesis.getVoices();
      // Filtrar estrictamente: NUNCA permitir acento de España (es-ES)
      const nonSpainVoices = voices.filter(v => {
        const lang = (v.lang || '').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return !lang.includes('es-es') && !name.includes('spain') && !name.includes('españa');
      });

      // Priorizar voz colombiana (es-CO) o latinoamericana
      const coVoice = nonSpainVoices.find(v => v.lang.toLowerCase() === 'es-co' || v.name.toLowerCase().includes('colombia'))
        || nonSpainVoices.find(v => (v.name.includes('Neural') || v.name.includes('Natural')) && v.lang.toLowerCase().startsWith('es'))
        || nonSpainVoices.find(v => v.lang.toLowerCase().includes('419') || v.lang.toLowerCase().includes('mx') || v.lang.toLowerCase().startsWith('es'));

      if (coVoice) {
        utterance.voice = coVoice;
      }

      if (onBoundary) {
        utterance.onboundary = (e: any) => {
          if (this.currentSpeechId !== speechId) return;
          if (e.name === 'word' || typeof e.charIndex === 'number') {
            onBoundary(e.charIndex, e.charLength || 0);
          }
        };
      }

      if (onEnd) {
        utterance.onend = () => {
          if (this.currentSpeechId !== speechId) return;
          onEnd();
        };
        utterance.onerror = () => {
          if (this.currentSpeechId !== speechId) return;
          onEnd();
        };
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Browser Speech error:', e);
      if (onEnd) onEnd();
    }
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.voiceEnabled = enabled;
    if (!enabled) {
      this.stopSpeaking();
    }
  }

  public getVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }
}

export const speechEngine = new SpeechEngine();

export const SUGGESTED_PROMPTS = [
  "¿Cómo va el proyecto de la planta de energía para Versalles?",
  "En Piedras Negras no tenemos agua potable y la motobomba está dañada.",
  "Me gustaría proponer una mejora para los parques infantiles de Guaduas.",
  "Quiero reportar falta de internet en la escuela de la vereda El Hato.",
  "Necesitamos apoyo para transportar las cosechas de los campesinos."
];
