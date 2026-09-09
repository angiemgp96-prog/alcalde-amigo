// Servicio Web Speech API (Microfono Abierto + Voz Hablada de Ramitos)

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

  // VOZ HABLADA DE RAMITOS (SpeechSynthesis confiable)
  public speakRamitos(text: string, onEnd?: () => void): void {
    if (!this.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Cancela voces en cola
      
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{203C}\u{2049}\u{25AA}\u{25AB}\u{25FE}\u{25FD}\u{25FB}\u{25FC}\u{25B6}\u{25C0}\u{1F1E6}-\u{1F1FF}🌿🌱🍃🌾🌴🌳🌲✨⚡📌💰👤🚨❌➔⏱️📍🔥🗳️👤💡]/gu;
      const cleanText = text
        .replace(emojiRegex, '')
        .replace(/[*_#~`]/g, '') // Elimina caracteres markdown
        .replace(/https?:\/\/\S+/gi, '') // Elimina links
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-CO';
      utterance.rate = 1.05;
      utterance.pitch = 1.1;

      // Buscar voz en español
      const voices = window.speechSynthesis.getVoices();
      const esVoice = voices.find(v => v.lang.startsWith('es-CO') || v.lang.startsWith('es-MX') || v.lang.startsWith('es-ES') || v.lang.startsWith('es'));
      if (esVoice) {
        utterance.voice = esVoice;
      }

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Error al reproducir voz de Ramitos:', err);
    }
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.voiceEnabled = enabled;
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
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
