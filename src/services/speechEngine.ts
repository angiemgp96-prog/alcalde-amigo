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
      
      const cleanText = text
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
        .replace(/[\u{2600}-\u{27BF}]/gu, '')
        .replace(/[\u{2300}-\u{23FF}]/gu, '')
        .replace(/[\u{2B00}-\u{2BFF}]/gu, '')
        .replace(/[🌿🌱🍃🌾🌴🌳🌲✨⚡📌💰👤🚨❌➔⏱️📍🔥🗳️💡🤝🏛️📊📢🇨🇴]/gu, '')
        .replace(/[*_#~`]/g, '') // Elimina caracteres markdown
        .replace(/https?:\/\/\S+/gi, '') // Elimina links
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        if (onEnd) onEnd();
        return;
      }

      const doSpeak = () => {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = 'es-CO';
          utterance.rate = 1.02;
          utterance.pitch = 1.05;

          const voices = window.speechSynthesis.getVoices();
          const esVoice = voices.find(v => 
            v.lang.toLowerCase().includes('es-co') || 
            v.lang.toLowerCase().includes('es-mx') || 
            v.lang.toLowerCase().includes('es-es') || 
            v.lang.toLowerCase().startsWith('es')
          );
          if (esVoice) {
            utterance.voice = esVoice;
          }

          if (onEnd) {
            utterance.onend = onEnd;
            utterance.onerror = onEnd;
          }

          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn('Speech error:', e);
          if (onEnd) onEnd();
        }
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        let handled = false;
        const timer = setTimeout(() => {
          if (!handled) {
            handled = true;
            doSpeak();
          }
        }, 150);

        window.speechSynthesis.onvoiceschanged = () => {
          if (!handled) {
            handled = true;
            clearTimeout(timer);
            doSpeak();
          }
        };
      } else {
        doSpeak();
      }
    } catch (err) {
      console.warn('Error al reproducir voz de Ramitos:', err);
      if (onEnd) onEnd();
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
