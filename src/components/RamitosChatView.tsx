import React, { useState, useEffect, useRef } from 'react';
import { CitizenNeed, CitizenLead, ActiveTab } from '../types';
import { speechEngine, SUGGESTED_PROMPTS } from '../services/speechEngine';
import { processRamitosConversationAsync, getGeminiApiKey, setGeminiApiKey, getGroqApiKey, setGroqApiKey, RamitosChatResponse, detectVeredaOrBarrioFromText, extractLeadInfoFromText, extractAudioCorrectionFromText } from '../services/ramitosBrain';
import { MUNICIPIOS_DATA } from '../data/municipiosConfig';
import { formatCOP } from '../utils/formatters';
import { sendWhatsAppMessage } from '../services/greenApi';
import { saveRamitosInteractionLog, getUserLeadInfo, checkUserLeadRegistrationInSupabase, purgePhantomLocalStorageCache, getPastInteractionsHistory, clearConversationHistory } from '../services/api';
import {
  Menu, User, Calendar, Send, Volume2, VolumeX, Sparkles, MapPin, X,
  History, Share2, FileText, Building2, Cloud, Check, Key, Mic, Settings, Copy, Shield, Trash2
} from 'lucide-react';

interface RamitosChatViewProps {
  onSaveNeed: (need: Omit<CitizenNeed, 'id' | 'fechaReporte' | 'votosApoyo'>, lead?: Omit<CitizenLead, 'id' | 'fechaRegistro' | 'estadoNotificacion'>) => void;
  onOpenFullPlan: () => void;
  onOpenMenu: (tab: ActiveTab) => void;
  isSecretAdminUnlocked?: boolean;
  municipioId?: 'guaduas' | 'caparrapi';
}

export const RamitosChatView: React.FC<RamitosChatViewProps> = ({
  onSaveNeed,
  onOpenFullPlan,
  onOpenMenu,
  isSecretAdminUnlocked = false,
  municipioId = 'guaduas'
}) => {
  const isCaparrapi = municipioId === 'caparrapi';
  const munData = MUNICIPIOS_DATA[municipioId || 'guaduas'];
  const FIRST_INTERACTION_GREETING = munData.saludoInicial;

  // ESTADOS PRINCIPALES DE INTERFAZ Y RAMITOS
  const [currentResponse, setCurrentResponse] = useState<string>(FIRST_INTERACTION_GREETING);
  const [currentSynthesis, setCurrentSynthesis] = useState<any>(null);
  const [currentExpresion, setCurrentExpresion] = useState<RamitosChatResponse['expresion']>('feliz');
  const [useCustomAssetFailed, setUseCustomAssetFailed] = useState(false);
  const [displayedResponse, setDisplayedResponse] = useState(FIRST_INTERACTION_GREETING);
  const [copied, setCopied] = useState(false);

  const [isRamitosSpeaking, setIsRamitosSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // ESTADOS DE HISTORIAL, MENSAJES Y MENÚS
  const [history, setHistory] = useState<Array<{ sender: 'ramitos' | 'user'; text: string; time: string }>>([
    { sender: 'ramitos', text: FIRST_INTERACTION_GREETING, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [inputText, setInputText] = useState('');
  const [isHoldingMic, setIsHoldingMic] = useState(false);
  const [selectedVereda, setSelectedVereda] = useState('');
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');
  const [targetName, setTargetName] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showKeySettings, setShowKeySettings] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(getGeminiApiKey());
  const [groqKeyInput, setGroqKeyInput] = useState(getGroqApiKey());
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);

  // Actualizar saludo e historial dinámicamente al cambiar de municipio
  useEffect(() => {
    const greeting = munData.saludoInicial;
    setCurrentResponse(greeting);
    setDisplayedResponse(greeting);
    setHistory([
      { sender: 'ramitos', text: greeting, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setSelectedVereda('');
  }, [municipioId]);

  // PERMISOS DE AUDIO Y MICRÓFONO CON INTERACCIÓN GESTUAL
  const [isAudioPermissionGranted, setIsAudioPermissionGranted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ramitos_audio_activated') === 'true';
    }
    return false;
  });
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(!isAudioPermissionGranted);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const handleEnableAudioAndMic = async () => {
    setPermissionError(null);
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Inmediatamente detener los tracks para liberar el hardware del micrófono y evitar conflictos con SpeechRecognition
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.warn('Permiso de micrófono no concedido o cancelado:', err);
        setPermissionError('No se concedió acceso al micrófono. Puedes usar el chat escribiendo por texto.');
      }
    }

    speechEngine.unlockAudioContext();

    try {
      localStorage.setItem('ramitos_audio_activated', 'true');
    } catch (e) {}

    setIsAudioPermissionGranted(true);
    setShowPermissionModal(false);

    // Iniciar saludo por voz y máquina de escribir sólo tras la confirmación de permisos y gesto del usuario
    setTimeout(() => {
      speakRamitosVoice(currentResponse, true);
    }, 150);
  };

  // REFS PARA AUDIOS Y NUDGE TIMERS
  const currentTranscriptRef = useRef<string>('');
  const idleTimerRef = useRef<any>(null);
  const hasUserSentMessageRef = useRef<boolean>(false);
  const isNudgeActiveRef = useRef<boolean>(false);

  useEffect(() => {
    setUseCustomAssetFailed(false);
  }, [currentExpresion]);

  // Helper para verificar si Ramitos planteó una pregunta o propuso una interacción abierta
  const isInteractivePromptFromRamitos = (text: string): boolean => {
    if (!text) return false;
    const t = text.toLowerCase();
    if (t.includes('?')) return true;
    if (t.includes('te escucho') || t.includes('cuéntame') || t.includes('cuentame') || t.includes('detállame') || t.includes('detallame')) return true;
    if (t.includes('dinos') || t.includes('compártenos') || t.includes('compartenos') || t.includes('mencióname') || t.includes('mencioname')) return true;
    if (t.includes('cuál es') || t.includes('cual es') || t.includes('qué te') || t.includes('que te')) return true;
    return false;
  };

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const scheduleIdleNudgeTimer = (lastRamitosText?: string) => {
    clearIdleTimer();
    // REGLA 1: NUNCA si el usuario no ha interactuado
    // REGLA 2: NUNCA si ya se disparó un nudge activo
    // REGLA 3: NUNCA si el usuario está pulsando el micrófono, dictando o escribiendo
    if (!hasUserSentMessageRef.current || isNudgeActiveRef.current || isHoldingMic || inputText.trim().length > 0 || speechEngine.getIsListening()) return;

    // REGLA 4: NUNCA si Ramitos hizo una pregunta o propuso una interacción (ej. "Te escucho", "?", "Cuéntame")
    const textToCheck = lastRamitosText || currentResponse;
    if (isInteractivePromptFromRamitos(textToCheck)) {
      return; // Esperar pacientemente a que el ciudadano responda sin interrumpirlo
    }

    idleTimerRef.current = setTimeout(() => {
      triggerIdleNudge();
    }, 2000);
  };

  const triggerIdleNudge = async () => {
    // Si el usuario está sosteniendo el micrófono, escribiendo, o si Ramitos planteó una pregunta abierta, ABORTAR
    if (
      isNudgeActiveRef.current ||
      !hasUserSentMessageRef.current ||
      isHoldingMic ||
      inputText.trim().length > 0 ||
      speechEngine.getIsListening() ||
      isInteractivePromptFromRamitos(currentResponse)
    ) {
      return;
    }
    isNudgeActiveRef.current = true;

    // CONSULTA DIRECTA Y EN TIEMPO REAL A SUPABASE POR DISPOSITIVO/IP Y DIÁLOGOS
    const leadCheck = await checkUserLeadRegistrationInSupabase();
    const userLead = getUserLeadInfo();
    const fullUserDialogue = history.filter(h => h.sender === 'user').map(h => h.text).join(' ');
    const extracted = extractLeadInfoFromText(fullUserDialogue);

    const isUserRegistered = Boolean(
      leadCheck.isRegistered ||
      (userLead && userLead.whatsapp) ||
      (extracted && (extracted.whatsapp || extracted.nombre))
    );

    let nudgeText = '';
    let expresion: RamitosChatResponse['expresion'] = 'curioso';

    if (!isUserRegistered) {
      nudgeText = 'Para que el equipo humano evalúe tu propuesta y pueda responderte, ¿te gustaría dejarnos tu Nombre y número de WhatsApp?';
      expresion = 'curioso';
    } else {
      const realName = leadCheck.nombre || extracted?.nombre || userLead?.nombre || '';
      nudgeText = `¡Excelente${realName ? ', ' + realName : ''}! Tu propuesta ya quedó estructurada y registrada. El equipo humano la revisará para plantear una pronta solución.`;
      expresion = 'agradecido';
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCurrentResponse(nudgeText);
    setCurrentExpresion(expresion);
    setHistory(prev => [...prev, { sender: 'ramitos', text: nudgeText, time: timeStr }]);
    speakRamitosVoice(nudgeText, true);
  };

  // CONTROLADOR UNIFICADO DE VOZ Y ESCRITURA SINCRONIZADA (EFECTO CONSTRUCCIÓN EN TIEMPO REAL)
  const typewriterTimerRef = useRef<any>(null);

  const clearTypewriterTimer = () => {
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
  };

  const speakRamitosVoice = (text: string, isNudge: boolean = false) => {
    clearIdleTimer();
    clearTypewriterTimer();

    // Caso 1: En silencio o sin permisos concedidos (efecto mecanografía visual ágil)
    if (isMuted || !isAudioPermissionGranted || showPermissionModal) {
      setIsRamitosSpeaking(false);
      let charIdx = 0;
      setDisplayedResponse('');
      typewriterTimerRef.current = setInterval(() => {
        charIdx += 2;
        if (charIdx >= text.length) {
          clearTypewriterTimer();
          setDisplayedResponse(text);
          if (hasUserSentMessageRef.current && !isNudge && !isNudgeActiveRef.current) {
            scheduleIdleNudgeTimer(text);
          }
        } else {
          setDisplayedResponse(text.substring(0, charIdx));
        }
      }, 20);
      return;
    }

    // Caso 2: Con voz activa: SINCRONIZACIÓN PRECISA PALABRA POR PALABRA (TELEPROMPTER EN TIEMPO REAL)
    setIsRamitosSpeaking(true);
    setDisplayedResponse('');

    let hasBoundaryReceived = false;
    let fallbackCharIndex = 0;

    // Respaldo cadencial al compás natural de la voz (avanza palabras cada ~200ms) por si el sintetizador no emite onboundary
    typewriterTimerRef.current = setInterval(() => {
      if (!hasBoundaryReceived && fallbackCharIndex < text.length) {
        const nextSpace = text.indexOf(' ', fallbackCharIndex + 1);
        fallbackCharIndex = nextSpace !== -1 ? nextSpace : fallbackCharIndex + 4;
        setDisplayedResponse(text.substring(0, Math.min(fallbackCharIndex, text.length)));
      }
    }, 190);

    speechEngine.speakRamitos(
      text,
      // onEnd:
      () => {
        clearTypewriterTimer();
        setIsRamitosSpeaking(false);
        setDisplayedResponse(text);
        if (hasUserSentMessageRef.current && !isNudge && !isNudgeActiveRef.current) {
          scheduleIdleNudgeTimer(text);
        }
      },
      // onBoundary (evento oficial palabra a palabra de Web Speech API):
      (charIndex: number, charLength: number = 0) => {
        hasBoundaryReceived = true;
        // Revela el texto exactamente hasta la palabra que la voz está pronunciando en este instante
        const visibleLength = Math.min(text.length, charIndex + (charLength || 4));
        setDisplayedResponse(text.substring(0, visibleLength));
      }
    );
  };

  useEffect(() => {
    // Purga automática de caché local fantasma en cada inicio
    purgePhantomLocalStorageCache();

    // CARGA AUTOMÁTICA EN TIEMPO REAL DEL HISTORIAL COMPLETO DE SUPABASE AISLADO POR MUNICIPIO
    const loadPastHistoryFromSupabase = async () => {
      const munNombre = isCaparrapi ? 'Caparrapí' : 'Guaduas';
      const emojiMun = isCaparrapi ? '🛡️' : '🌿';
      const initialGreeting = munData.saludoInicial;

      try {
        const past = await getPastInteractionsHistory(undefined, municipioId);
        if (past && past.length > 0) {
          const loadedHistory: Array<{ sender: 'ramitos' | 'user'; text: string; time: string }> = [];

          past.forEach(item => {
            const timeStr = item.timestamp
              ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (item.userText) {
              loadedHistory.push({ sender: 'user', text: item.userText, time: timeStr });
            }
            if (item.ramitosResponse) {
              loadedHistory.push({ sender: 'ramitos', text: item.ramitosResponse, time: timeStr });
            }
          });

          // Extraer la última intervención/tema conversado por el ciudadano en este municipio
          const lastUserItem = [...past].reverse().find(i => i.userText && i.userText.trim().length > 0);
          const lastUserText = lastUserItem?.userText?.trim() || '';

          let reconnectGreeting = '';
          if (lastUserText) {
            const topicSnippet = lastUserText.length > 45 ? lastUserText.substring(0, 42) + '...' : lastUserText;
            reconnectGreeting = `${emojiMun} ¡Qué gusto tenerte de nuevo por aquí! La última vez estuvimos conversando sobre "${topicSnippet}". ¿Quieres que sigamos profundizando en esa propuesta o tienes alguna otra idea o necesidad para ${munNombre}?`;
          } else {
            reconnectGreeting = `${emojiMun} ¡Qué gusto tenerte de nuevo por aquí! ¿Deseas continuar donde quedamos o plantear una nueva inquietud para ${munNombre}?`;
          }

          const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          loadedHistory.push({ sender: 'ramitos', text: reconnectGreeting, time: nowTimeStr });

          setHistory(loadedHistory);
          setCurrentResponse(reconnectGreeting);
          setCurrentExpresion('entusiasmado');
          if (!isMuted && isAudioPermissionGranted && !showPermissionModal) {
            speakRamitosVoice(reconnectGreeting, true);
          } else {
            setDisplayedResponse(reconnectGreeting);
          }
        } else {
          // Si no hay historial previo para este municipio, usar el saludo inicial limpio
          setCurrentResponse(initialGreeting);
          setDisplayedResponse(initialGreeting);
          setHistory([
            { sender: 'ramitos', text: initialGreeting, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]);
        }
      } catch (err) {
        console.warn('Error cargando historial previo desde Supabase:', err);
      }
    };

    loadPastHistoryFromSupabase();

    return () => {
      clearIdleTimer();
      clearTypewriterTimer();
    };
  }, [municipioId]);

  useEffect(() => {
    if (!isMuted && isAudioPermissionGranted && !showPermissionModal && currentResponse) {
      speakRamitosVoice(currentResponse, true); // Saludo inicial sólo cuando hay permisos
    }
  }, [isAudioPermissionGranted, showPermissionModal]);

  const handleStartHoldMic = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    clearIdleTimer();
    isNudgeActiveRef.current = true; // Bloquea activamente cualquier nudge mientras dicta
    setIsHoldingMic(true);
    currentTranscriptRef.current = '';

    speechEngine.start({
      onStart: () => {
        clearIdleTimer();
        setIsHoldingMic(true);
      },
      onResult: (transcript) => {
        clearIdleTimer();
        currentTranscriptRef.current = transcript;
        setInputText(transcript);
      },
      onError: () => setIsHoldingMic(false),
      onEnd: () => setIsHoldingMic(false)
    });
  };

  const handleReleaseHoldMic = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsHoldingMic(false);
    speechEngine.stop();

    const capturedText = currentTranscriptRef.current || inputText;
    if (capturedText.trim()) {
      handleSendMessage(capturedText.trim());
    }
  };

  const handleToggleVoice = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    speechEngine.setVoiceEnabled(!nextState);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    hasUserSentMessageRef.current = true;
    isNudgeActiveRef.current = false;
    clearIdleTimer();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedHistory = [...history, { sender: 'user' as const, text: query.trim(), time: timeStr }];
    setHistory(updatedHistory);
    setInputText('');
    currentTranscriptRef.current = '';

    // MODO PENSATIVO MIENTRAS CONSULTA EN SUPABASE E IA
    setCurrentExpresion('pensativo');
    setIsThinking(true);
    setIsRamitosSpeaking(true);

    // Consultar si el usuario ya está registrado en este dispositivo/IP (Directo en Supabase)
    const leadCheck = await checkUserLeadRegistrationInSupabase();
    const userLead = getUserLeadInfo();
    const isUserRegistered = Boolean(leadCheck.isRegistered || (userLead && userLead.nombre && userLead.whatsapp));

    // Consultar IA con memoria de Supabase por Dispositivo, IP y Municipio
    const response = await processRamitosConversationAsync(query, selectedVereda, updatedHistory, isUserRegistered, municipioId);

    setIsThinking(false);

    if (response.openPlanTab) {
      onOpenFullPlan();
    }

    setCurrentResponse(response.textoRespuesta);
    if (response.expresion) {
      setCurrentExpresion(response.expresion);
    }

    setCurrentSynthesis(response.problematicaSintetizada ? {
      problematicaSintetizada: response.problematicaSintetizada,
      propuestaRamitos: response.propuestaRamitos || '',
      sector: response.sector || 'Infancia y Familia'
    } : null);

    const audioCorrection = extractAudioCorrectionFromText(query);
    if (audioCorrection) {
      const wrongPattern = new RegExp(audioCorrection.wrongTerm, 'gi');
      setHistory(prev => prev.map(item => {
        let newText = item.text.replace(wrongPattern, audioCorrection.correctTerm);
        if (audioCorrection.wrongTerm.toLowerCase().includes('wolm') || audioCorrection.wrongTerm.toLowerCase().includes('walm')) {
          newText = newText.replace(/walmart|wolmart|wolmar/gi, audioCorrection.correctTerm);
        }
        return { ...item, text: newText };
      }));
    }

    setHistory(prev => [...prev, { sender: 'ramitos', text: response.textoRespuesta, time: timeStr }]);
    speakRamitosVoice(response.textoRespuesta);

    // REGISTRO AUTOMÁTICO EN SUPABASE POR DISPOSITIVO E IP
    saveRamitosInteractionLog({
      mensajeTextualCiudadano: query,
      respuestaLimpiaRamitos: response.textoRespuesta,
      reinterpretacionEstructuradaIa: response.problematicaSintetizada || response.propuestaRamitos || undefined,
      expresionRamitos: response.expresion || 'feliz',
      sectorDetectado: response.sector || undefined,
      municipioId: municipioId
    });

    if (response.problematicaSintetizada) {
      const realNombre = userLead?.nombre || (leadCheck.isRegistered && leadCheck.nombre ? leadCheck.nombre : 'Ciudadano Anónimo');
      const detectedVereda = detectVeredaOrBarrioFromText(query) || (selectedVereda.trim() ? selectedVereda : 'Por definir');
      onSaveNeed({
        ciudadanoNombre: realNombre,
        veredaBarrio: detectedVereda,
        audioTranscripcion: query,
        problematicaSintetizada: response.problematicaSintetizada,
        sector: response.sector || 'Infancia y Familia',
        urgencia: response.urgencia || 'Alta',
        propuestaRamitos: response.propuestaRamitos || 'Propuesta capturada para análisis humano.',
        insumosClave: [],
        presupuestoEstimadoCop: 0
      });
    }
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(geminiKeyInput.trim());
    setGroqApiKey(groqKeyInput.trim());
    setSavedKeySuccess(true);
    setTimeout(() => {
      setSavedKeySuccess(false);
      setShowKeySettings(false);
    }, 1500);
  };

  const handleShareToWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPhone.trim() || !currentResponse) return;

    const message = isCaparrapi
      ? `🛡️ *iALCALDÍA (Caparrapí)*\n\nHola ${targetName || 'amigo'}, he registrado tu propuesta:\n\n"${currentResponse}"\n\nEl equipo humano de Caparrapí revisará la situación para evaluar acciones viables. ¡Construimos juntos!`
      : `🌿 *ALCALDE AMIGO con Ramitos (Guaduas)*\n\nHola ${targetName || 'amigo'}, Ramitos te informa que he capturado tu propuesta:\n\n"${currentResponse}"\n\nNuestro equipo humano de trabajo se pondrá en contacto contigo a este número. ¡La meta la construimos juntos!`;

    await sendWhatsAppMessage(targetPhone.trim(), message, selectedVereda, 'Directo');
    setShareSuccess(true);
    setTimeout(() => {
      setShareSuccess(false);
      setShowShareModal(false);
    }, 2000);
  };

  // RENDERIZADO DE LAS 9 EXPRESIONES FACIALES SEGÚN LA GUÍA DEL USUARIO
  const renderFacialExpression = (exp: RamitosChatResponse['expresion'] = 'feliz') => {
    switch (exp) {
      case 'curioso':
        return (
          <>
            <div className="flex items-center space-x-5 mb-1">
              <div className="w-4 h-3 bg-amber-100 rounded-full transform -rotate-45"></div>
              <div className="w-4 h-4 bg-amber-100 rounded-full"></div>
            </div>
            <div className="w-6 h-2 border-b-2 border-amber-100 rounded-full transform rotate-6"></div>
          </>
        );
      case 'pensativo':
        return (
          <>
            <div className="flex items-center space-x-5 mb-1">
              <div className="w-4 h-2 bg-amber-100 rounded-full transform rotate-12"></div>
              <div className="w-4 h-3 bg-amber-100 rounded-full font-bold text-[10px] text-slate-900 flex items-center justify-center">?</div>
            </div>
            <div className="w-5 h-1.5 bg-amber-100 rounded-full"></div>
          </>
        );
      case 'entusiasmado':
        return (
          <>
            <div className="flex items-center space-x-4 mb-1 text-amber-200 text-xs font-bold">
              <span>✨</span>
              <span>✨</span>
            </div>
            <div className="w-8 h-4 border-b-4 border-amber-100 rounded-full"></div>
          </>
        );
      case 'triste':
        return (
          <>
            <div className="flex items-center space-x-5 mb-1 relative">
              <div className="w-4 h-3 bg-amber-100 rounded-full transform rotate-12"></div>
              <div className="w-4 h-3 bg-amber-100 rounded-full transform -rotate-12"></div>
              <span className="absolute -bottom-3 left-0 text-[10px] text-sky-400">💧</span>
              <span className="absolute -bottom-3 right-0 text-[10px] text-sky-400">💧</span>
            </div>
            <div className="w-7 h-3 border-t-3 border-amber-100 rounded-full"></div>
          </>
        );
      case 'sorprendido':
        return (
          <>
            <div className="flex items-center space-x-5 mb-1">
              <div className="w-4 h-4 rounded-full border-2 border-amber-100"></div>
              <div className="w-4 h-4 rounded-full border-2 border-amber-100"></div>
            </div>
            <div className="w-4 h-4 rounded-full border-2 border-amber-100"></div>
          </>
        );
      case 'enojado':
        return (
          <>
            <div className="flex items-center space-x-4 mb-1">
              <div className="w-4 h-1.5 bg-rose-400 transform rotate-45"></div>
              <div className="w-4 h-1.5 bg-rose-400 transform -rotate-45"></div>
            </div>
            <div className="w-7 h-2 border-t-3 border-rose-400 rounded-full"></div>
          </>
        );
      case 'confundido':
        return (
          <>
            <div className="flex items-center space-x-5 mb-1 font-mono text-xs text-amber-200">
              <span>🌀</span>
              <span>🌀</span>
            </div>
            <div className="w-6 h-1 bg-amber-100 transform -rotate-6"></div>
          </>
        );
      case 'agradecido':
        return (
          <>
            <div className="flex items-center space-x-5 mb-1 relative">
              <div className="w-4 h-3 bg-amber-100 rounded-full transform -rotate-12"></div>
              <div className="w-4 h-3 bg-amber-100 rounded-full transform rotate-12"></div>
              <div className="absolute -left-2 top-2 w-3 h-2 rounded-full bg-pink-400/80"></div>
              <div className="absolute -right-2 top-2 w-3 h-2 rounded-full bg-pink-400/80"></div>
            </div>
            <div className="w-8 h-4 border-b-4 border-amber-100 rounded-full"></div>
          </>
        );
      case 'feliz':
      default:
        return (
          <>
            <div className="flex items-center space-x-6 mb-1">
              <div className="w-5 h-3.5 bg-amber-100 rounded-full transform -rotate-12"></div>
              <div className="w-5 h-3.5 bg-amber-100 rounded-full transform rotate-12"></div>
            </div>
            <div className="w-9 h-4 border-b-4 border-amber-100 rounded-full"></div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef2f6] via-[#e2e8f0] to-[#cbd5e1] flex flex-col items-center justify-center p-2 sm:p-4 select-none">
      
      {/* BOTÓN DIRECTO PARA INGRESAR AL CENTRO DE MANDO (ADENTRO) */}
      <div className="mb-3 flex justify-center animate-fadeIn">
        <button
          onClick={onOpenFullPlan}
          className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-black shadow-2xl flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
        >
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span>Ingresar al Centro de Mando Estratégico & MGA (Adentro) ➜</span>
        </button>
      </div>

      {/* FRAME MÓVIL VERTICAL (MATCHING IMAGE 2 EXACTAMENTE) */}
      <div className="relative w-full max-w-[440px] h-[860px] bg-gradient-to-b from-[#eef2f6] via-[#e6ebf2] to-[#dbe2eb] rounded-[44px] mobile-frame-glow border-[6px] border-white/80 overflow-hidden flex flex-col justify-between p-6 shadow-2xl">
        
        {/* LINEAS DE CIRCUITO Y DESTELLOS DE FONDO */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-1/3 left-10 w-2 h-2 rounded-full border-2 border-sky-400"></div>
          <div className="absolute top-1/3 right-12 w-2 h-2 rounded-full border-2 border-sky-400"></div>
          <div className="absolute bottom-1/4 left-8 w-3 h-3 rounded-full border-2 border-sky-400"></div>
          <div className="absolute bottom-1/4 right-10 w-[1px] h-16 bg-sky-300/60"></div>
          <div className="absolute top-1/2 left-6 w-20 h-[1px] bg-sky-300/40"></div>
          <div className="absolute top-1/2 right-6 w-20 h-[1px] bg-sky-300/40"></div>
        </div>

        {/* TOP MOBILE BAR */}
        <div className="relative z-20 space-y-4">
          <div className="flex items-center justify-between">
            {isSecretAdminUnlocked ? (
              <button
                onClick={() => setShowSideMenu(true)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 transition-colors animate-fadeIn"
                title="Menú"
              >
                <Menu className="w-6 h-6" />
              </button>
            ) : (
              <div className="w-10"></div>
            )}

            <div className="flex items-center space-x-1.5 bg-white/70 px-3.5 py-1 rounded-full border border-white text-xs text-slate-700 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-bold text-slate-800 text-xs">Atención Abierta</span>
            </div>

            <div className="flex items-center space-x-1">
              {isSecretAdminUnlocked && (
                <button
                  onClick={() => setShowKeySettings(!showKeySettings)}
                  className="p-2 text-slate-600 hover:text-amber-600 animate-fadeIn"
                  title="Configurar IA Keys (Gemini / Groq)"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleToggleVoice}
                className="p-2 text-slate-600 hover:text-slate-900"
                title="Voz de Ramitos"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5 text-emerald-600 animate-pulse" />}
              </button>
              <button
                onClick={() => setShowHistoryDrawer(true)}
                className="p-2 text-slate-600 hover:text-slate-900"
                title="Historial"
              >
                <History className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Avatar + Speech Bubble ("Respuesta Limpia:" - Matching Image 2) */}
          <div className="flex items-start space-x-3 pt-2">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-300/80 border-2 border-white flex items-center justify-center text-slate-600 shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-200/80 border border-white flex items-center justify-center text-slate-500 text-xs">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            {/* SPEECH BUBBLE (EFECTO MÁQUINA DE ESCRIBIR + VENTANA FLUIDA QUE ADAPTA TAMAÑO SIN ESCROLEAR) */}
            <div className="flex-1 speech-bubble-light rounded-2xl p-3.5 space-y-2 relative animate-fadeIn shadow-sm min-h-[110px] max-h-56 sm:max-h-64 overflow-y-auto">
              <div className="text-xs font-bold text-slate-600 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <span>Respuesta Limpia:</span>
                  {isRamitosSpeaking && (
                    <span className="inline-flex items-center space-x-0.5 ml-1">
                      <span className="w-1 h-2 bg-emerald-500 rounded-full audio-bar"></span>
                      <span className="w-1 h-3 bg-emerald-500 rounded-full audio-bar"></span>
                      <span className="w-1 h-2 bg-emerald-500 rounded-full audio-bar"></span>
                    </span>
                  )}
                </span>
                <span className="text-[10px] capitalize font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {currentExpresion}
                </span>
              </div>

              {/* TEXTO CON EFECTO MÁQUINA DE ESCRIBIR */}
              <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                {displayedResponse}
                {displayedResponse.length < currentResponse.length && (
                  <span className="inline-block w-1.5 h-3.5 bg-emerald-600 ml-0.5 animate-pulse"></span>
                )}
              </p>

              {/* BARRA DE ACCIÓN: BOTÓN DE COPIAR AL PORTAPAPELES DEBAJO DE LA RESPUESTA */}
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentResponse);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center space-x-1 text-[11px] font-bold text-slate-700 hover:text-emerald-700 bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
                  title="Copiar respuesta al portapapeles"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar respuesta</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50/90 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                  title="Compartir a WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Compartir</span>
                </button>
              </div>

              <div className="absolute top-4 -left-2 w-3 h-3 speech-bubble-light transform rotate-45 border-l border-b border-white"></div>
            </div>
          </div>

        </div>

        {/* MODAL CONFIGURACIÓN IA KEYS */}
        {showKeySettings && (
          <form onSubmit={handleSaveKeys} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xl space-y-3 text-slate-800 z-30 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                <Key className="w-4 h-4" /> Llaves de IA Generativa Gratis
              </span>
              <button type="button" onClick={() => setShowKeySettings(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Groq Cloud Key (gsk_... Recomendado):</label>
              <input
                type="password"
                value={groqKeyInput}
                onChange={(e) => setGroqKeyInput(e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Google Gemini Key (AIzaSy...):</label>
              <input
                type="password"
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
              />
            </div>

            <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-1">
              {savedKeySuccess ? <Check className="w-4 h-4" /> : <span>Guardar Llaves de IA</span>}
            </button>
          </form>
        )}

        {/* CENTERPIECE: RAMITOS CHARACTER (ZONA MEJORADA DE PULSAR PARA HABLAR CON MIC BADGE) */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-2">
          
          <div
            onMouseDown={handleStartHoldMic}
            onMouseUp={handleReleaseHoldMic}
            onTouchStart={handleStartHoldMic}
            onTouchEnd={handleReleaseHoldMic}
            className={`relative cursor-pointer transition-all duration-300 transform active:scale-95 group rounded-full ${
              isHoldingMic
                ? 'scale-105 pulse-ramitos-character ring-4 ring-emerald-400/90 shadow-[0_0_50px_rgba(52,211,153,0.6)]'
                : isRamitosSpeaking
                ? 'scale-105 speaking-pulse-ramitos'
                : 'hover:scale-105 hover:shadow-[0_0_30px_rgba(52,211,153,0.3)]'
            }`}
            title="Mantén presionado a Ramitos para dictar tu propuesta"
          >
            {/* BADGE FLOTANTE DE MICRÓFONO PARA MEJORAR LA PERCEPCIÓN DE ZONA INTERACTIVA */}
            <div className={`absolute top-3 right-3 z-30 p-2.5 rounded-full border border-white/90 shadow-lg transition-all duration-300 flex items-center justify-center ${
              isHoldingMic
                ? 'bg-emerald-500 text-white scale-110 animate-bounce ring-2 ring-emerald-300'
                : 'bg-white/90 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'
            }`}>
              <Mic className="w-4 h-4" />
            </div>

            <div className="absolute inset-0 -m-10 rounded-full bg-radial from-slate-900/80 via-slate-800/40 to-transparent blur-xl pointer-events-none"></div>

            <div className="relative w-72 h-72 flex items-center justify-center">
              
              {isCaparrapi ? (
                /* EMBLEMA CÍVICO E INTELIGENCIA TERRITORIAL DE CAPARRAPÍ */
                <div className="relative w-64 h-64 flex flex-col items-center justify-center animate-fadeIn select-none">
                  {/* Anillos concéntricos de audio y tecnología */}
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping pointer-events-none opacity-20"></div>
                  <div className="absolute inset-2 rounded-full border border-sky-400/40 pointer-events-none"></div>
                  <div className="absolute inset-6 rounded-full border-2 border-dashed border-indigo-400/30 animate-spin" style={{ animationDuration: '25s' }}></div>
                  
                  {/* Medallón Central */}
                  <div className="relative w-48 h-48 rounded-full bg-gradient-to-tr from-slate-950 via-blue-950 to-indigo-950 border-4 border-blue-500/80 p-4 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.6)] transform hover:scale-105 transition-transform">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 flex items-center justify-center shadow-xl border border-blue-300/40 mb-2">
                      <Shield className="w-10 h-10 text-sky-100 drop-shadow-md" />
                    </div>
                    <p className="text-xs font-black text-white uppercase tracking-wider">Caparrapí</p>
                    <span className="text-[9px] font-extrabold text-sky-300 bg-blue-900/80 px-2.5 py-0.5 rounded-full mt-1 border border-blue-400/40 shadow-xs">
                      Copiloto Ciudadano
                    </span>
                  </div>
                </div>
              ) : !useCustomAssetFailed ? (
                <img
                  src={`/assets/ramitos/ramitos_${currentExpresion}.png`}
                  alt={`Ramitos ${currentExpresion}`}
                  onError={() => setUseCustomAssetFailed(true)}
                  className="w-64 h-64 object-contain z-10 drop-shadow-2xl animate-fadeIn pointer-events-none"
                />
              ) : (
                <>
                  {/* MUCHAS MÁS FLORES DIGITALES DINÁMICAS FLOTANDO ATRÁS */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M120 18 C128 5, 142 12, 138 26 C152 26, 152 40, 138 44 C142 58, 128 62, 120 54 C112 62, 98 58, 102 44 C88 40, 88 26, 102 26 C98 12, 112 5, 120 18 Z" stroke={currentExpresion === 'enojado' ? '#ef4444' : '#fb923c'} strokeWidth="2.8" strokeLinecap="round" />
                    <path d="M85 35 C92 24, 106 30, 101 43 C114 43, 114 57, 101 62 C106 75, 92 80, 85 70 C78 80, 64 75, 69 62 C56 57, 56 43, 69 43 C64 30, 78 24, 85 35 Z" stroke="#fde047" strokeWidth="2.8" strokeLinecap="round" />
                    <path d="M155 35 C162 24, 176 30, 171 43 C184 43, 184 57, 171 62 C176 75, 162 80, 155 70 C148 80, 134 75, 139 62 C126 57, 126 43, 139 43 C134 30, 148 24, 155 35 Z" stroke="#38bdf8" strokeWidth="2.8" strokeLinecap="round" />
                    <path d="M55 75 C61 64, 75 70, 70 83 C83 83, 83 97, 70 102 C75 115, 61 120, 55 110 Z" stroke="#60a5fa" strokeWidth="2.8" strokeLinecap="round" />
                    <path d="M185 75 C191 64, 205 70, 200 83 C213 83, 213 97, 200 102 C205 115, 191 120, 185 110 Z" stroke="#f472b6" strokeWidth="2.8" strokeLinecap="round" />
                    <path d="M75 125 C82 114, 96 120, 91 133 C104 133, 104 147, 91 152 C96 165, 82 170, 75 160 Z" stroke="#f87171" strokeWidth="2.8" strokeLinecap="round" />
                    <path d="M165 125 C172 114, 186 120, 181 133 C194 133, 194 147, 181 152 C186 165, 172 170, 165 160 Z" stroke="#a7f3d0" strokeWidth="2.8" strokeLinecap="round" />
                  </svg>

                  {/* CLOUD SHAPED HEAD CON EXPRESIONES DINÁMICAS */}
                  <div className="relative w-44 h-40 flex items-center justify-center z-10">
                    <svg className="absolute inset-0 w-full h-full drop-shadow-2xl" viewBox="0 0 160 140" fill="none">
                      <path d="M45 110 C25 110 10 92 20 72 C8 55 24 35 44 42 C54 22 86 20 100 35 C116 22 144 32 142 52 C158 66 150 94 132 104 C120 114 90 115 80 110 Z" fill={currentExpresion === 'enojado' ? '#2d141e' : '#1b2434'} stroke="#ffffff" strokeWidth="4.5" strokeLinejoin="round" />
                    </svg>
                    
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      {renderFacialExpression(currentExpresion)}
                    </div>
                  </div>

                  {/* WHITE TRUNK WITH 2 GREEN LEAF HANDS */}
                  <div className="absolute bottom-5 flex flex-col items-center z-10">
                    <svg className="absolute -top-3 w-32 h-16 pointer-events-none" viewBox="0 0 120 60" fill="none">
                      <path d="M45 35 Q15 15 10 35 Q30 55 45 35 Z" stroke="#4ade80" strokeWidth="3.5" fill="#4ade8033" />
                      <path d="M75 35 Q105 15 110 35 Q90 55 75 35 Z" stroke="#4ade80" strokeWidth="3.5" fill="#4ade8033" />
                    </svg>
                    <div className="w-10 h-16 border-l-4 border-r-4 border-b-4 border-white rounded-b-2xl"></div>
                  </div>
                </>
              )}

            </div>

          </div>

          {/* TITLE & ESTADO DINÁMICO */}
          <div className="text-center min-h-[44px] flex flex-col items-center justify-center">
            <h1 className="text-4xl font-extrabold text-white tracking-wide shadow-sm">
              {isCaparrapi ? 'Caparrapí' : 'Ramitos'}
            </h1>
            {isThinking || currentExpresion === 'pensativo' ? (
              <p className={`text-xs font-bold ${isCaparrapi ? 'text-blue-400' : 'text-amber-600'} animate-pulse tracking-wide pt-1 flex items-center justify-center gap-1.5`}>
                <span>{isCaparrapi ? '🛡️' : '🌿'}</span>
                <span>Pensando...</span>
              </p>
            ) : isHoldingMic ? (
              <p className={`text-xs font-bold ${isCaparrapi ? 'text-blue-400' : 'text-emerald-600'} animate-pulse tracking-wide pt-1 flex items-center justify-center gap-1.5`}>
                <span>🎙️</span>
                <span>Escuchando... ¡Suelta para responder!</span>
              </p>
            ) : null}
          </div>

        </div>

        {/* BOTTOM INPUT & ACTION BAR */}
        <div className="relative z-20 space-y-2 pt-2">
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2 bg-white/90 border border-white rounded-2xl p-1.5 shadow-md"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                clearIdleTimer();
              }}
              placeholder="Escribe tu propuesta..."
              className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-800 focus:outline-none placeholder:text-slate-400 font-medium"
            />

            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 text-xs font-bold"
              title="Compartir a WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {/* DISCREET HAMBURGER SIDE MENU (☰) */}
      {showSideMenu && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex justify-start animate-fadeIn">
          <div className="w-80 h-full bg-[#0f172a] text-slate-100 p-6 space-y-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🌿</span>
                  <span className="font-extrabold text-white text-base">ALCALDE AMIGO</span>
                </div>
                <button onClick={() => setShowSideMenu(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2 text-xs font-bold">
                <button
                  onClick={() => { setShowSideMenu(false); onOpenMenu('chat'); }}
                  className={`w-full text-left p-3 rounded-xl flex items-center space-x-3 border ${
                    isCaparrapi
                      ? 'bg-blue-500/10 text-sky-300 border-blue-500/30'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  <span>{isCaparrapi ? '🛡️ Conversar con Copiloto' : '🌿 Conversar con Ramitos'}</span>
                </button>

                <button
                  onClick={() => { setShowSideMenu(false); onOpenMenu('copiloto'); }}
                  className="w-full text-left p-3 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 flex items-center space-x-3"
                >
                  <Building2 className={`w-4 h-4 ${isCaparrapi ? 'text-sky-400' : 'text-emerald-400'}`} />
                  <span>Alcaldía Copiloto</span>
                </button>

                <button
                  onClick={() => { setShowSideMenu(false); onOpenMenu('crm'); }}
                  className="w-full text-left p-3 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 flex items-center space-x-3"
                >
                  <Share2 className={`w-4 h-4 ${isCaparrapi ? 'text-sky-400' : 'text-emerald-400'}`} />
                  <span>WhatsApp CRM (Green API)</span>
                </button>

              </nav>
            </div>

            <div className="text-[11px] text-slate-400 text-center">
              {isCaparrapi ? 'Caparrapí, Cundinamarca • Cero Burocracia' : 'Guaduas, Cundinamarca • Cero Burocracia'}
            </div>
          </div>
        </div>
      )}

      {/* SECONDARY HISTORY DRAWER */}
      {showHistoryDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#0f172a] text-slate-100 p-6 space-y-4 shadow-2xl flex flex-col justify-between animate-fadeIn">
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-sky-400" />
                <span>Historial de Conversación</span>
              </h3>
              <button onClick={() => setShowHistoryDrawer(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {[...history].slice().reverse().map((h, i) => (
                <div key={i} className={`p-3.5 rounded-2xl text-xs space-y-1.5 shadow-sm transition-all ${
                  h.sender === 'user'
                    ? 'bg-indigo-950/70 border border-indigo-500/40 text-indigo-100 ml-3'
                    : 'bg-slate-900/90 border border-slate-700/60 text-slate-100 mr-3'
                }`}>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800/60 pb-1">
                    <span className={h.sender === 'user' ? 'text-indigo-300 font-bold' : (isCaparrapi ? 'text-sky-400 font-bold' : 'text-emerald-400 font-bold')}>
                      {h.sender === 'user' ? '👤 Tú' : (isCaparrapi ? '🛡️ Copiloto Caparrapí' : '🌿 Ramitos')}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{h.time}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words leading-relaxed text-xs font-normal">
                    {h.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            {history.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  clearConversationHistory(municipioId);
                  const greeting = munData.saludoInicial;
                  setHistory([{ sender: 'ramitos', text: greeting, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
                  setCurrentResponse(greeting);
                  setDisplayedResponse(greeting);
                  setShowHistoryDrawer(false);
                }}
                className="w-full py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Reiniciar Diálogo de {isCaparrapi ? 'Caparrapí' : 'Guaduas'}</span>
              </button>
            )}
            <button
              onClick={() => setShowHistoryDrawer(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cerrar Historial
            </button>
          </div>
        </div>
      )}

      {/* WHATSAPP SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleShareToWhatsApp} className="bg-white text-slate-800 rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>Enviar Respuesta a mi Celular</span>
              </h3>
              <button type="button" onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Nombre (Opcional):</label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="Ej: Don Carlos"
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-xs text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Número de WhatsApp:</label>
              <input
                type="tel"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                placeholder="Ej: 3104567890"
                required
                className="w-full bg-slate-100 border border-emerald-500 rounded-xl p-3 text-xs text-slate-900 font-bold"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1"
              >
                {shareSuccess ? <Check className="w-4 h-4" /> : <span>Enviar por WhatsApp</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL / GATE DE ACTIVACIÓN DE PERMISOS DE AUDIO Y VOZ */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto text-emerald-700 shadow-md">
              <Volume2 className="w-8 h-8 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                🎙️ Experiencia Interactiva de Voz
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Para que Ramitos pueda hablarte y escucharte por voz en tu celular o PC, otorga el permiso de micrófono y audio a continuación.
              </p>
            </div>

            {permissionError && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs font-bold">
                ⚠️ {permissionError}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleEnableAudioAndMic}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-95 transition-all"
              >
                <Mic className="w-4 h-4" />
                <span>Dar Permiso y Comenzar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
