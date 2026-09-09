import React, { useState } from 'react';
import { BaseProposal, PurchaseItem, LaborItem, ProposalComment, ComparativePriceOption, PilotVoting } from '../types';
import { saveComentarioCopilotoToSupabase, getPilotVotingsFromSupabase, voteForPilotCommunityInSupabase } from '../services/api';
import { formatCOP } from '../utils/formatters';
import { VEREDAS_GUADUAS } from '../data/veredasGuaduas';
import { RamitosAvatarLogo } from './RamitosAvatarLogo';
import { 
  Building2, ShieldCheck, Scale, Users, Clock, ShoppingBag, 
  CheckCircle2, ArrowRight, Zap, Award, ExternalLink, Plus, 
  Edit3, ThumbsUp, MessageSquare, Search, Filter, Sparkles, 
  Truck, FileText, AlertTriangle, Check, RefreshCw, Link as LinkIcon,
  HelpCircle, ChevronDown, CheckCircle, Scale as BalanceIcon, Mic, Vote, Flame, X, Send, MicOff, Bot, Trash2
} from 'lucide-react';

interface CopilotoAlcaldiaViewProps {
  proposals: BaseProposal[];
  selectedProposal: BaseProposal | null;
  onSelectProposal: (proposal: BaseProposal) => void;
  onAddProposal?: (newProposal: BaseProposal) => void;
  onUpdateProposal?: (updatedProposal: BaseProposal) => void;
}

export const CopilotoAlcaldiaView: React.FC<CopilotoAlcaldiaViewProps> = ({
  proposals: initialProposals,
  selectedProposal,
  onSelectProposal,
  onAddProposal,
  onUpdateProposal
}) => {
  // Local state for dynamic proposals and active sub-tab
  const [proposalList, setProposalList] = useState<BaseProposal[]>(initialProposals || []);
  const [activeSubTab, setActiveSubTab] = useState<'detalle' | 'asistente' | 'mesa' | 'votaciones'>('detalle');
  const [pilotVotings, setPilotVotings] = useState<PilotVoting[]>([]);
  const [ramitosSpeechBubbleText, setRamitosSpeechBubbleText] = useState<string>(
    '🌿 ¡Hola! Soy Ramitos, tu Copiloto Municipal de Guaduas. Estoy escuchando: puedes pedirme en lenguaje natural modificar precios, agregar o eliminar ítems, auditar cotizaciones o cambiar de módulo.'
  );

  // Keep proposalList in sync when initialProposals arrives from Supabase or parent
  React.useEffect(() => {
    if (initialProposals && initialProposals.length > 0) {
      setProposalList(initialProposals);
    }
  }, [initialProposals]);

  React.useEffect(() => {
    getPilotVotingsFromSupabase().then(loaded => {
      if (loaded && loaded.length > 0) setPilotVotings(loaded);
    });
  }, []);

  const handleVoteForPilot = async (votingId: string) => {
    const updatedCount = await voteForPilotCommunityInSupabase(votingId);
    setPilotVotings(prev => prev.map(v => v.id === votingId ? { ...v, votos: updatedCount } : v));
  };
  
  // Filters for catalog
  const [selectedVereda, setSelectedVereda] = useState<string>('Todas');
  const [selectedSector, setSelectedSector] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected proposal reference
  const currentProposalId = selectedProposal?.id || (proposalList.length > 0 ? proposalList[0].id : 'prop-2');
  const currentProposal = proposalList.find(p => p.id === currentProposalId) || proposalList[0] || null;

  // State for Mesa de Trabajo live edits
  const [editablePurchases, setEditablePurchases] = useState<PurchaseItem[]>(currentProposal?.comprasDetalladas || []);
  const [editableLabor, setEditableLabor] = useState<LaborItem[]>(currentProposal?.manoDeObraDetallada || []);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [newCommentAuthor, setNewCommentAuthor] = useState<string>('');
  const [newCommentRole, setNewCommentRole] = useState<ProposalComment['rol']>('Presidente JAC');

  // State for Inline Link / Price Editing Modal
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editLinkUrl, setEditLinkUrl] = useState<string>('');
  const [editPriceCop, setEditPriceCop] = useState<number>(0);
  const [editStoreName, setEditStoreName] = useState<PurchaseItem['tienda']>('MercadoLibre');

  // State for Price Comparison Modal
  const [compareItemIndex, setCompareItemIndex] = useState<number | null>(null);

  // State for Asistente (Wizard)
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [newPropTitle, setNewPropTitle] = useState<string>('');
  const [newPropVereda, setNewPropVereda] = useState<string>('Piedras Negras');
  const [newPropSector, setNewPropSector] = useState<BaseProposal['sector']>('Agua Potable y Saneamiento');
  const [newPropProblem, setNewPropProblem] = useState<string>('');
  const [newPropSolution, setNewPropSolution] = useState<string>('');
  const [newPropEquiposText, setNewPropEquiposText] = useState<string>('');
  const [newPropEstBudget, setNewPropEstBudget] = useState<string>('15000000');
  const [newPropDays, setNewPropDays] = useState<number>(7);

  // Ramitos Protagonist Hero Header Expanded/Minimized State
  const [isRamitosHeroExpanded, setIsRamitosHeroExpanded] = useState<boolean>(true);

  // Copiloto Municipal Ramitos Floating Widget State & Commands
  const [isCopilotoWidgetOpen, setIsCopilotoWidgetOpen] = useState<boolean>(false);
  const [copilotoInputText, setCopilotoInputText] = useState<string>('');
  const [isCopilotoListening, setIsCopilotoListening] = useState<boolean>(false);
  const [copilotoMessages, setCopilotoMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'ramitos';
    text: string;
    actionBadge?: string;
    timestamp: string;
  }>>([
    {
      id: 'welcome-1',
      sender: 'ramitos',
      text: '¡Hola! Soy Ramitos, tu Copiloto Municipal y Asistente del Dashboard. Puedo ejecutar modificaciones de precios en tiempo real, agregar o eliminar ítems del plan de gobierno, alternar entre módulos o auditar links de compra.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const handleSendCopilotoDashboardCommand = (rawText?: string) => {
    const textToProcess = (rawText || copilotoInputText).trim();
    if (!textToProcess) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user' as const,
      text: textToProcess,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setCopilotoMessages(prev => [...prev, userMsg]);
    setCopilotoInputText('');

    const lower = textToProcess.toLowerCase();
    let replyText = '';
    let actionBadge = '';

    // Regex matchers
    const editPriceMatch = lower.match(/(?:modifica|cambia|actualiza|ajusta|pon)\s+(?:el\s+)?(?:precio|valor|costo)?\s*(?:de\s+)?(.+?)\s+a\s+\$?([0-9\.\,]+)/i);
    const addItemMatch = lower.match(/(?:agrega|crea|añade|agregar|crear)\s+(?:un\s+)?(?:nuevo\s+)?(?:ítem|item|producto|insumo)\s+(?:al\s+plan\s+de\s+gobierno|al\s+plan|a\s+la\s+obra)?\s*(?:llamado|titulado|de)?\s*(.+?)\s+(?:por|de|con\s+valor\s+de)?\s*\$?([0-9\.\,]+)/i);
    const deleteItemMatch = lower.match(/(?:elimina|borra|quita)\s+(?:el\s+)?(?:ítem|item|producto|insumo)?\s*(.+)/i);

    const isVotaciones = lower.includes('votacion') || lower.includes('encuesta') || lower.includes('piloto');
    const isMesa = lower.includes('mesa') || lower.includes('cotizacion') || lower.includes('trabajo');
    const isCatalogo = lower.includes('catalogo') || lower.includes('proyectos') || lower.includes('lista');
    const isDetalle = lower.includes('detalle') || lower.includes('resumen');
    const isAsistente = lower.includes('asistente') || lower.includes('crear propuesta');
    const isAudit = lower.includes('incoherencia') || lower.includes('audita') || lower.includes('link') || lower.includes('revisa') || lower.includes('fallas');

    if (editPriceMatch) {
      const targetQuery = editPriceMatch[1].trim();
      const rawPrice = editPriceMatch[2].replace(/[\.,]/g, '');
      const newPrice = parseInt(rawPrice, 10);

      const itemIdx = editablePurchases.findIndex(item => item.producto.toLowerCase().includes(targetQuery));
      if (itemIdx !== -1 && !isNaN(newPrice)) {
        const newItems = [...editablePurchases];
        const target = { ...newItems[itemIdx] };
        target.precioUnitarioCop = newPrice;
        target.precioTotalCop = target.cantidad * newPrice;
        newItems[itemIdx] = target;

        setEditablePurchases(newItems);
        if (currentProposal) {
          const updatedTarget: BaseProposal = {
            ...currentProposal,
            comprasDetalladas: newItems
          };
          const updatedProposalList = proposalList.map(p => (p.id === currentProposal.id ? updatedTarget : p));
          setProposalList(updatedProposalList);
          if (onUpdateProposal) onUpdateProposal(updatedTarget);
        }

        replyText = `✅ He actualizado el precio unitario de **"${target.producto}"** a **$${newPrice.toLocaleString('es-CO')} COP** en el Plan de Gobierno.`;
        actionBadge = 'Precio Modificado';
      } else {
        replyText = `⚠️ Intenté buscar el ítem "${targetQuery}" en la propuesta activa pero no lo encontré. Revisa el catálogo o la Mesa de Trabajo.`;
      }
    } else if (addItemMatch) {
      const itemName = addItemMatch[1].trim();
      const rawPrice = addItemMatch[2].replace(/[\.,]/g, '');
      const newPrice = parseInt(rawPrice, 10) || 100000;

      const newItem: PurchaseItem = {
        producto: itemName,
        cantidad: 1,
        precioUnitarioCop: newPrice,
        precioTotalCop: newPrice,
        tienda: 'MercadoLibre',
        linkReferencia: '',
        esLinkDirecto: false,
        estadoVerificacion: 'pendiente_link'
      };

      const newItems = [...editablePurchases, newItem];
      setEditablePurchases(newItems);
      if (currentProposal) {
        const updatedTarget: BaseProposal = {
          ...currentProposal,
          comprasDetalladas: newItems
        };
        const updatedProposalList = proposalList.map(p => (p.id === currentProposal.id ? updatedTarget : p));
        setProposalList(updatedProposalList);
        if (onUpdateProposal) onUpdateProposal(updatedTarget);
      }

      replyText = `✅ Agregué el ítem **"${itemName}"** por **$${newPrice.toLocaleString('es-CO')} COP** a la propuesta activa.`;
      actionBadge = 'Ítem Creado';
    } else if (deleteItemMatch && !editPriceMatch) {
      const targetQuery = deleteItemMatch[1].trim();
      const itemIdx = editablePurchases.findIndex(item => item.producto.toLowerCase().includes(targetQuery));
      if (itemIdx !== -1) {
        const removedItem = editablePurchases[itemIdx];
        const newItems = editablePurchases.filter((_, idx) => idx !== itemIdx);
        setEditablePurchases(newItems);
        if (currentProposal) {
          const updatedTarget: BaseProposal = {
            ...currentProposal,
            comprasDetalladas: newItems
          };
          const updatedProposalList = proposalList.map(p => (p.id === currentProposal.id ? updatedTarget : p));
          setProposalList(updatedProposalList);
          if (onUpdateProposal) onUpdateProposal(updatedTarget);
        }

        replyText = `🗑️ Se eliminó **"${removedItem.producto}"** de la propuesta.`;
        actionBadge = 'Ítem Eliminado';
      } else {
        replyText = `⚠️ No encontré el ítem "${targetQuery}" para eliminar.`;
      }
    } else if (isVotaciones) {
      setActiveSubTab('votaciones');
      replyText = `🗳️ Cambiando a **Votaciones y Encuestas Cívicas (Planes Piloto)**.`;
      actionBadge = 'Navegación Pestaña';
    } else if (isMesa) {
      setActiveSubTab('mesa');
      replyText = `📊 Te llevé a la **Mesa de Trabajo y Cotizaciones**.`;
      actionBadge = 'Navegación Pestaña';
    } else if (isCatalogo) {
      setActiveSubTab('detalle');
      replyText = `📄 Mostrando **Ficha Detalle de Propuestas**.`;
      actionBadge = 'Navegación Pestaña';
    } else if (isDetalle) {
      setActiveSubTab('detalle');
      replyText = `📄 Mostrando **Detalle de la Propuesta**.`;
      actionBadge = 'Navegación Pestaña';
    } else if (isAsistente) {
      setActiveSubTab('asistente');
      replyText = `✨ Abriendo **Asistente de Creación**.`;
      actionBadge = 'Navegación Pestaña';
    } else if (isAudit) {
      const missingLinks = editablePurchases.filter(i => !i.linkReferencia || i.estadoVerificacion === 'pendiente_link');
      const zeroPrices = editablePurchases.filter(i => i.precioUnitarioCop <= 0);

      if (missingLinks.length === 0 && zeroPrices.length === 0) {
        replyText = `🔍 **Auditoría Ramitos**: La propuesta **"${currentProposal?.titulo || ''}"** no presenta enlaces faltantes ni precios en $0. Cumple 100% de transparencia.`;
        actionBadge = 'Auditoría Limpia';
      } else {
        replyText = `⚠️ **Auditoría de Incoherencias y Enlaces**:\n` +
          (missingLinks.length > 0 ? `- Encontré ${missingLinks.length} ítem(s) sin enlace comercial respaldado (ej: "${missingLinks[0].producto}").\n` : '') +
          (zeroPrices.length > 0 ? `- Encontré ${zeroPrices.length} ítem(s) con valor $0 COP.\n` : '') +
          `Te sugiero adjuntar los links para garantizar la transparencia pública.`;
        actionBadge = 'Auditoría Ramitos';
      }
    } else {
      replyText = `Entendido. Como tu Copiloto Municipal en Guaduas, puedes indicarme acciones en lenguaje natural. Ejemplos:\n• *"modifica el valor de la motobomba a 2500000"*\n• *"agrega panel solar por 1200000"*\n• *"ve a votaciones"*\n• *"audita enlaces comerciales"*.`;
    }

    setRamitosSpeechBubbleText(replyText);
    speakText(replyText);

    setTimeout(() => {
      setCopilotoMessages(prev => [
        ...prev,
        {
          id: `ram-${Date.now()}`,
          sender: 'ramitos',
          text: replyText,
          actionBadge,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 400);
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const clean = text.replace(/[\*\_`#]/g, '');
        const utt = new SpeechSynthesisUtterance(clean);
        utt.lang = 'es-CO';
        utt.rate = 1.05;
        window.speechSynthesis.speak(utt);
      } catch {}
    }
  };

  const handleToggleVoiceInput = () => {
    if (isCopilotoListening) {
      setIsCopilotoListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-CO';
        recognition.interimResults = false;

        setIsCopilotoListening(true);
        recognition.start();

        recognition.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          setCopilotoInputText(transcript);
          setIsCopilotoListening(false);
          handleSendCopilotoDashboardCommand(transcript);
        };

        recognition.onerror = () => setIsCopilotoListening(false);
        recognition.onend = () => setIsCopilotoListening(false);
      } catch {
        setIsCopilotoListening(false);
      }
    } else {
      alert('Tu navegador no soporta entrada de voz directa. Puedes escribir el comando en la barra.');
    }
  };

  // Sync edits when selected proposal changes
  React.useEffect(() => {
    if (currentProposal) {
      setEditablePurchases(currentProposal.comprasDetalladas || []);
      setEditableLabor(currentProposal.manoDeObraDetallada || []);
    }
  }, [currentProposalId, currentProposal]);

  // Real-time helper for updating equipment purchases (inline)
  const handleUpdatePurchaseItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const updated = [...editablePurchases];
    const item = { ...updated[index] };
    (item as any)[field] = value;
    if (field === 'cantidad' || field === 'precioUnitarioCop') {
      item.precioTotalCop = (item.cantidad || 1) * (item.precioUnitarioCop || 0);
    }
    if (field === 'linkReferencia') {
      item.estadoVerificacion = typeof value === 'string' && value.trim().length > 0 ? 'verificado' : 'pendiente_link';
    }
    updated[index] = item;
    setEditablePurchases(updated);
    syncProposalChanges(updated, editableLabor);
  };

  const handleAddPurchaseItem = () => {
    const newItem: PurchaseItem = {
      producto: 'Nuevo Equipo / Insumo Requerido',
      cantidad: 1,
      precioUnitarioCop: 500000,
      precioTotalCop: 500000,
      tienda: 'MercadoLibre',
      linkReferencia: '',
      esLinkDirecto: false,
      estadoVerificacion: 'pendiente_link'
    };
    const updated = [...editablePurchases, newItem];
    setEditablePurchases(updated);
    syncProposalChanges(updated, editableLabor);
  };

  const handleDeletePurchaseItem = (index: number) => {
    const item = editablePurchases[index];
    if (window.confirm(`¿Deseas eliminar "${item.producto}" de esta propuesta?`)) {
      const updated = editablePurchases.filter((_, idx) => idx !== index);
      setEditablePurchases(updated);
      syncProposalChanges(updated, editableLabor);
    }
  };

  // Real-time helper for updating mano de obra (inline)
  const handleUpdateLaborItem = (index: number, field: keyof LaborItem, value: any) => {
    const updated = [...editableLabor];
    const item = { ...updated[index] };
    (item as any)[field] = value;
    if (field === 'personas' || field === 'diasTrabajo' || field === 'tarifaDiariaCop') {
      item.totalLaborCop = (item.personas || 1) * (item.diasTrabajo || 1) * (item.tarifaDiariaCop || 0);
    }
    updated[index] = item;
    setEditableLabor(updated);
    syncProposalChanges(editablePurchases, updated);
  };

  const handleAddLaborItem = () => {
    const newLabor: LaborItem = {
      id: `lab-${Date.now()}`,
      rol: 'Nuevo Personal / Operario Veredal',
      personas: 1,
      diasTrabajo: 3,
      tarifaDiariaCop: 80000,
      totalLaborCop: 240000
    };
    const updated = [...editableLabor, newLabor];
    setEditableLabor(updated);
    syncProposalChanges(editablePurchases, updated);
  };

  const handleDeleteLaborItem = (index: number) => {
    const item = editableLabor[index];
    if (window.confirm(`¿Deseas eliminar "${item.rol}" de la mano de obra?`)) {
      const updated = editableLabor.filter((_, idx) => idx !== index);
      setEditableLabor(updated);
      syncProposalChanges(editablePurchases, updated);
    }
  };

  // Central sync function so Ficha Detalle, Mesa de Trabajo, and Header share 100% identical totals
  const syncProposalChanges = (purchases: PurchaseItem[], labor: LaborItem[]) => {
    if (!currentProposal) return;
    const subPurchases = purchases.reduce((acc, i) => acc + (i.precioTotalCop || i.cantidad * i.precioUnitarioCop), 0);
    const subLabor = labor.reduce((acc, i) => acc + (i.totalLaborCop || i.personas * i.diasTrabajo * i.tarifaDiariaCop), 0);
    const flete = Math.round((subPurchases + subLabor) * 0.05);
    const newTotal = subPurchases + subLabor + flete;

    const updatedProposal: BaseProposal = {
      ...currentProposal,
      comprasDetalladas: purchases,
      manoDeObraDetallada: labor,
      presupuestoTotalCop: newTotal
    };

    setProposalList(prev => prev.map(p => p.id === currentProposal.id ? updatedProposal : p));
    if (onUpdateProposal) onUpdateProposal(updatedProposal);
  };

  // Recalculate dynamic totals in Mesa de Trabajo
  const subtotalPurchases = editablePurchases.reduce((acc, item) => acc + (item.precioTotalCop || item.cantidad * item.precioUnitarioCop), 0);
  const subtotalLabor = editableLabor.reduce((acc, item) => acc + (item.totalLaborCop || item.personas * item.diasTrabajo * item.tarifaDiariaCop), 0);
  const fletePercent = currentProposal?.porcentajeFlete || 5;
  const fleteCop = Math.round((subtotalPurchases + subtotalLabor) * (fletePercent / 100));
  const dynamicTotalBudgetCop = subtotalPurchases + subtotalLabor + fleteCop;

  // Filtered proposals list
  const filteredProposals = proposalList.filter(p => {
    const matchesVereda = selectedVereda === 'Todas' || p.veredasAfectadas.includes(selectedVereda) || p.veredasAfectadas.includes('Todas las Veredas de Guaduas');
    const matchesSector = selectedSector === 'Todos' || p.sector === selectedSector;
    const matchesSearch = p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.solucionPragmatica.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesVereda && matchesSector && matchesSearch;
  });

  const totalPlanPresupuesto = proposalList.reduce((acc, p) => acc + p.presupuestoTotalCop, 0);

  // Check if a proposal has all verified direct links
  const isProposalFullyVerified = (p: BaseProposal) => {
    if (!p.comprasDetalladas || p.comprasDetalladas.length === 0) return false;
    return p.comprasDetalladas.every(item => item.estadoVerificacion === 'verificado' && item.linkReferencia.trim().length > 0);
  };

  // Handle selecting a proposal and switching view
  const handleSelectAndNavigate = (proposal: BaseProposal, tab: 'detalle' | 'mesa') => {
    onSelectProposal(proposal);
    setActiveSubTab(tab);
    setIsRamitosHeroExpanded(false);
  };

  // Handle Civic Endorsement (Visto Bueno Cívico)
  const handleToggleVistoBueno = () => {
    const updated = proposalList.map(p => {
      if (p.id === currentProposal.id) {
        const isApproved = !p.vistoBuenoAprobado;
        const newVotes = (p.votosVistoBueno || 0) + (isApproved ? 1 : -1);
        return {
          ...p,
          vistoBuenoAprobado: isApproved,
          votosVistoBueno: Math.max(0, newVotes),
          estado: isApproved ? ('En Co-creación' as const) : p.estado
        };
      }
      return p;
    });
    setProposalList(updated);
    if (onUpdateProposal) {
      const target = updated.find(p => p.id === currentProposal.id);
      if (target) onUpdateProposal(target);
    }
  };

  // Open Edit Modal for a specific item
  const handleOpenEditItemModal = (index: number) => {
    const item = editablePurchases[index];
    setEditingItemIndex(index);
    setEditLinkUrl(item.linkReferencia || '');
    setEditPriceCop(item.precioUnitarioCop || 0);
    setEditStoreName(item.tienda || 'MercadoLibre');
  };

  // Save Direct Link & Price Edit
  const handleSaveInlineItemEdit = () => {
    if (editingItemIndex === null) return;
    const newItems = [...editablePurchases];
    const target = { ...newItems[editingItemIndex] };

    const isUrlProvided = editLinkUrl.trim().startsWith('http://') || editLinkUrl.trim().startsWith('https://');

    target.linkReferencia = editLinkUrl.trim();
    target.precioUnitarioCop = editPriceCop;
    target.precioTotalCop = target.cantidad * editPriceCop;
    target.tienda = editStoreName;
    target.estadoVerificacion = isUrlProvided ? 'verificado' : 'pendiente_link';
    target.esLinkDirecto = isUrlProvided;

    newItems[editingItemIndex] = target;
    setEditablePurchases(newItems);

    const updatedTarget: BaseProposal = {
      ...currentProposal,
      comprasDetalladas: newItems
    };

    const updatedProposalList = proposalList.map(p => (p.id === currentProposal.id ? updatedTarget : p));
    setProposalList(updatedProposalList);

    if (onUpdateProposal) {
      onUpdateProposal(updatedTarget);
    }

    setEditingItemIndex(null);
  };

  // Select a comparative price option
  const handleSelectComparativeOption = (itemIdx: number, option: ComparativePriceOption) => {
    const newItems = [...editablePurchases];
    const target = { ...newItems[itemIdx] };

    target.precioUnitarioCop = option.precioUnitarioCop;
    target.precioTotalCop = target.cantidad * option.precioUnitarioCop;
    target.tienda = option.tienda;
    if (option.link) {
      target.linkReferencia = option.link;
      target.estadoVerificacion = 'verificado';
      target.esLinkDirecto = true;
    }

    newItems[itemIdx] = target;
    setEditablePurchases(newItems);

    const updatedTarget: BaseProposal = {
      ...currentProposal,
      comprasDetalladas: newItems
    };

    const updatedProposalList = proposalList.map(p => (p.id === currentProposal.id ? updatedTarget : p));
    setProposalList(updatedProposalList);

    if (onUpdateProposal) {
      onUpdateProposal(updatedTarget);
    }

    setCompareItemIndex(null);
  };



  // Save changes from Mesa de Trabajo
  const handleSaveChangesMesa = () => {
    const updatedTarget: BaseProposal = {
      ...currentProposal,
      comprasDetalladas: editablePurchases,
      manoDeObraDetallada: editableLabor,
      presupuestoTotalCop: dynamicTotalBudgetCop
    };

    const updated = proposalList.map(p => (p.id === currentProposal.id ? updatedTarget : p));
    setProposalList(updated);
    if (onUpdateProposal) {
      onUpdateProposal(updatedTarget);
    }
    alert('✅ Cambios guardados y sincronizados con Supabase con éxito.');
  };

  // Add Comment in Mesa de Trabajo
  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const commentObj: ProposalComment = {
      id: 'com-' + Date.now(),
      autor: newCommentAuthor.trim() || 'Líder Veredal',
      rol: newCommentRole,
      texto: newCommentText.trim(),
      seccion: 'general',
      fecha: 'Hace un instante'
    };

    const updatedTarget: BaseProposal = {
      ...currentProposal,
      comentariosComunidad: [commentObj, ...(currentProposal.comentariosComunidad || [])]
    };

    const updated = proposalList.map(p => (p.id === currentProposal.id ? updatedTarget : p));
    setProposalList(updated);

    saveComentarioCopilotoToSupabase(currentProposal.id, commentObj);

    if (onUpdateProposal) {
      onUpdateProposal(updatedTarget);
    }

    setNewCommentText('');
    setNewCommentAuthor('');
  };

  // Create new project via Wizard Assistant
  const handleCreateWizardProject = () => {
    if (!newPropTitle.trim() || !newPropProblem.trim()) {
      alert('Por favor completa el título y la problemática comunitaria.');
      return;
    }

    const estBudgetNum = parseInt(newPropEstBudget, 10) || 15000000;
    const newCode = `PG-${newPropSector.substring(0, 3).toUpperCase()}-0${proposalList.length + 1}`;

    const newProposal: BaseProposal = {
      id: 'prop-custom-' + Date.now(),
      codigo: newCode,
      titulo: newPropTitle.trim(),
      sector: newPropSector,
      veredasAfectadas: [newPropVereda],
      diagnostico: newPropProblem.trim(),
      contrastePolitico: 'Estudios tradicionales engorrosos de 12 meses por más de $150M COP sin solucionar la falla real.',
      solucionPragmatica: newPropSolution.trim() || 'Instalación de kit modular comercial de rápida implementación off-grid con talento local.',
      comprasDirectas: newPropEquiposText.split('\n').filter(t => t.trim().length > 0),
      comprasDetalladas: [
        {
          id: 'comp-w1',
          producto: newPropTitle + ' - Kit Principal Comercial',
          cantidad: 1,
          precioUnitarioCop: Math.round(estBudgetNum * 0.75),
          precioTotalCop: Math.round(estBudgetNum * 0.75),
          linkReferencia: '',
          tienda: 'MercadoLibre',
          estadoVerificacion: 'pendiente_link',
          esLinkDirecto: false
        },
        {
          id: 'comp-w2',
          producto: 'Accesorios e Insumos de Montaje Rápido',
          cantidad: 1,
          precioUnitarioCop: Math.round(estBudgetNum * 0.15),
          precioTotalCop: Math.round(estBudgetNum * 0.15),
          linkReferencia: '',
          tienda: 'Ferretería Local',
          estadoVerificacion: 'pendiente_link',
          esLinkDirecto: false
        }
      ],
      manoDeObraDetallada: [
        {
          id: 'mob-w1',
          rol: 'Técnico Especialista Local (' + newPropVereda + ')',
          personas: 1,
          diasTrabajo: newPropDays,
          tarifaDiariaCop: 140000,
          totalLaborCop: newPropDays * 140000
        },
        {
          id: 'mob-w2',
          rol: 'Operarios Locales JAC',
          personas: 2,
          diasTrabajo: newPropDays,
          tarifaDiariaCop: 80000,
          totalLaborCop: 2 * newPropDays * 80000
        }
      ],
      porcentajeFlete: 5,
      presupuestoTotalCop: estBudgetNum,
      marcoLegal: 'Convenio Solidario Ley 2166 de 2021 (Art. 95) con la Junta de Acción Comunal de ' + newPropVereda + '.',
      mecanismoLegalEspecifico: 'Ley 2166 de 2021 & Decreto 142 de 2023 - Convenio Solidario Express',
      pasosOperativosFastTrack: [
        'Día 1 - Firma de convenio con la JAC y expedición de CDP express.',
        'Día 2 - Compra directa por MercadoLibre / Proveedores.',
        'Día 3 a ' + newPropDays + ' - Ejecución y entrega a la comunidad.'
      ],
      votosVistoBueno: 1,
      vistoBuenoAprobado: false,
      comentariosComunidad: [],
      talentoHumano: ['Técnico Local', 'Operarios JAC'],
      cronogramaDias: newPropDays,
      estado: 'En Co-creación'
    };

    const updatedList = [newProposal, ...proposalList];
    setProposalList(updatedList);
    if (onAddProposal) onAddProposal(newProposal);
    onSelectProposal(newProposal);

    setWizardStep(1);
    setNewPropTitle('');
    setNewPropProblem('');
    setNewPropSolution('');
    setNewPropEquiposText('');

    setActiveSubTab('detalle');
    alert('✨ ¡Proyecto generado con éxito! Puedes ingresar los links reales y verificar la cotización.');
  };

  return (
    <div className="relative w-full max-w-md sm:max-w-xl mx-auto min-h-[88vh] flex flex-col justify-between p-4 sm:p-5 bg-slate-100/90 backdrop-blur-md rounded-[38px] border-[6px] border-white shadow-2xl overflow-hidden select-none space-y-4 animate-fadeIn">
      
      {/* TOP MOBILE BAR */}
      <div className="flex items-center justify-between z-10 px-1">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-2xl bg-white border border-emerald-300 p-0.5 shadow-sm">
            <RamitosAvatarLogo size="sm" showHalo={false} />
          </div>
          <span className="text-xs font-black text-slate-800 tracking-tight">ALCALDÍA COPILOTO</span>
        </div>

        <div className="flex items-center space-x-1.5 bg-white/90 px-3 py-1 rounded-full border border-white text-xs text-slate-700 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-bold text-slate-800 text-[11px]">Atención Copiloto</span>
        </div>
      </div>

      {/* CLEAN ELEGANT DASHBOARD HEADER */}
      <div className="bg-white/95 rounded-3xl p-4 sm:p-5 border border-white shadow-md flex items-center justify-between gap-3 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shadow-md">
            <RamitosAvatarLogo size="sm" showHalo={false} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Dashboard de Gestión Municipal
            </h1>
            <p className="text-[11px] font-bold text-slate-500 font-mono">
              Guaduas • {proposalList.length} Obras Activas ({formatCOP(totalPlanPresupuesto)})
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-extrabold border border-emerald-200 shadow-2xs">
          Panel Admin
        </span>
      </div>

      {/* 🧭 SUB-TAB NAVIGATION BAR (SÓLO PESTAÑAS ÚTILES Y DIRECTAS) */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs border-b border-slate-200/80 scrollbar-none z-10">
        <button
          onClick={() => setActiveSubTab('detalle')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'detalle'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200'
          }`}
        >
          📄 Ficha Detalle
        </button>

        <button
          onClick={() => setActiveSubTab('mesa')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'mesa'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white hover:bg-teal-50 text-slate-700 border border-slate-200'
          }`}
        >
          📊 Mesa & Recálculo
        </button>

        <button
          onClick={() => setActiveSubTab('asistente')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'asistente'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white hover:bg-purple-50 text-slate-700 border border-slate-200'
          }`}
        >
          ✨ Nuevo
        </button>

        <button
          onClick={() => setActiveSubTab('votaciones')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'votaciones'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200'
          }`}
        >
          🗳️ Votaciones
        </button>
      </div>

      {/* SELECTOR DE OBRA ACTIVA PARA NAVEGACIÓN MÓVIL DIRECTA DE 1 TAP */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 text-xs font-bold z-10">
        <span className="text-slate-500 whitespace-nowrap">📍 Obra Activa:</span>
        <select
          value={currentProposal?.id || ''}
          onChange={(e) => {
            const found = proposalList.find(p => p.id === e.target.value);
            if (found) onSelectProposal(found);
          }}
          className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate cursor-pointer"
        >
          {proposalList.map(p => (
            <option key={p.id} value={p.id}>
              {p.codigo} - {p.titulo} ({formatCOP(p.presupuestoTotalCop)})
            </option>
          ))}
        </select>
      </div>



      {/* -------------------------------------------------------------------------------- */}
      {/* VISTA 2: FICHA DE DETALLE PRAGMÁTICO (ESTILO BUBBLE DETAILS) */}
      {/* -------------------------------------------------------------------------------- */}
      {activeSubTab === 'detalle' && currentProposal && (
        <div className="space-y-8">
          
          {/* Header Info Banner of Selected Proposal */}
          <div className="bg-white/95 rounded-3xl p-6 sm:p-8 border border-white shadow-lg space-y-4 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Ficha Técnica Pragmática • {currentProposal.codigo}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {currentProposal.titulo}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-xs border border-emerald-200">
                  {currentProposal.sector}
                </span>

                <button
                  onClick={() => setActiveSubTab('mesa')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Ajustar o Editar Insumos</span>
                </button>
              </div>
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Veredas Beneficiadas</span>
                <span className="text-sm font-bold text-slate-800">
                  📍 {currentProposal.veredasAfectadas.join(', ')}
                </span>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Presupuesto Consolidado Invertido</span>
                <span className="text-base font-black text-emerald-800 font-mono">
                  {formatCOP(currentProposal.presupuestoTotalCop)}
                </span>
              </div>

              <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-200">
                <span className="text-[10px] text-teal-800 font-bold uppercase block">Tiempo Estimado de Entrega</span>
                <span className="text-base font-black text-teal-800 font-mono">
                  ⏱️ {currentProposal.cronogramaDias} Días Hábiles
                </span>
              </div>
            </div>
          </div>

          {/* 1. DIAGNÓSTICO VS. BUROCRACIA TRADICIONAL */}
          <div className="space-y-4">
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>1. Diagnóstico Real vs. Burocracia Tradicional</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white/95 p-6 rounded-3xl border border-white shadow-md space-y-2 text-slate-900">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                  🚨 Problema Real en la Vereda:
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                  {currentProposal.diagnostico}
                </p>
              </div>

              <div className="bg-rose-50/90 p-6 rounded-3xl border border-rose-200 shadow-md space-y-2 text-rose-950">
                <span className="text-xs font-extrabold text-rose-800 uppercase tracking-wider block">
                  ❌ Modelo Burocrático Tradicional:
                </span>
                <p className="text-xs sm:text-sm text-rose-900 leading-relaxed font-semibold">
                  {currentProposal.contrastePolitico}
                </p>
              </div>

            </div>

            <div className="bg-emerald-50/90 p-6 rounded-3xl border border-emerald-200 shadow-md space-y-2 text-emerald-950">
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>⚡ Solución Tecnológica Práctica (Alcaldía Copiloto):</span>
              </span>
              <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed font-extrabold">
                {currentProposal.solucionPragmatica}
              </p>
            </div>
          </div>

          {/* 2. COMPRAS DIRECTAS E INSUMOS (INLINE EDITABLE CARDS) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <span>2. Compras Directas e Insumos</span>
              </h4>

              <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
                Subtotal Insumos: {formatCOP(subtotalPurchases)}
              </span>
            </div>

            <div className="space-y-3">
              {editablePurchases.map((item, idx) => (
                <div key={item.id || idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-emerald-400 transition-all">
                  {/* Row 1: Product Name (Inline Input) + Delete Button */}
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={item.producto}
                      onChange={(e) => handleUpdatePurchaseItem(idx, 'producto', e.target.value)}
                      placeholder="Nombre del insumo / equipo..."
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePurchaseItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                      title="Eliminar este producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Row 2: Cantidad Stepper, Precio Unitario Input, Subtotal */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-2 border-t border-slate-200/80">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500 font-bold">Cant:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleUpdatePurchaseItem(idx, 'cantidad', Math.max(1, item.cantidad - 1))}
                          className="w-7 h-7 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={item.cantidad}
                          onChange={(e) => handleUpdatePurchaseItem(idx, 'cantidad', parseInt(e.target.value, 10) || 1)}
                          className="w-14 bg-white border border-slate-300 rounded-xl py-1 text-center font-mono font-bold text-slate-900 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdatePurchaseItem(idx, 'cantidad', item.cantidad + 1)}
                          className="w-7 h-7 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500 font-bold">Precio U:</span>
                      <input
                        type="number"
                        step={10000}
                        value={item.precioUnitarioCop}
                        onChange={(e) => handleUpdatePurchaseItem(idx, 'precioUnitarioCop', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-1.5 text-right font-mono text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Subtotal</span>
                      <span className="text-sm font-black text-emerald-700 font-mono">
                        {formatCOP(item.cantidad * item.precioUnitarioCop)}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Direct Purchase Link (Inline Editable) */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={item.linkReferencia || ''}
                      onChange={(e) => handleUpdatePurchaseItem(idx, 'linkReferencia', e.target.value)}
                      placeholder="Pegar link de compra (MercadoLibre, Ferretería, etc.)..."
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {item.linkReferencia.trim().length > 0 && (
                      <a
                        href={item.linkReferencia}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-extrabold flex items-center gap-1 shrink-0"
                      >
                        <span>Ver Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {/* BUTTON: AGREGAR NUEVO PRODUCTO DIRECTAMENTE ABAJO */}
              <button
                type="button"
                onClick={handleAddPurchaseItem}
                className="w-full py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-dashed border-emerald-300 text-emerald-800 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>➕ Agregar Nuevo Producto / Insumo a esta Obra</span>
              </button>
            </div>
          </div>

          {/* 3. MANO DE OBRA Y TALENTO HUMANO LOCAL (INLINE EDITABLE CARDS) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <span>3. Mano de Obra y Talento Humano Local (JAC Veredal)</span>
              </h4>

              <span className="text-xs font-mono font-black text-teal-800 bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200">
                Pago Directo: {formatCOP(subtotalLabor)}
              </span>
            </div>

            <div className="space-y-3">
              {editableLabor.map((item, idx) => (
                <div key={item.id || idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-teal-400 transition-all">
                  {/* Row 1: Rol / Personal Local (Inline Input) + Delete Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs shrink-0">👤</span>
                      <input
                        type="text"
                        value={item.rol}
                        onChange={(e) => handleUpdateLaborItem(idx, 'rol', e.target.value)}
                        placeholder="Ej. Técnico / Auxiliar Veredal..."
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLaborItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                      title="Eliminar personal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Row 2: Personas, Días de Trabajo, Jornal Diario, Subtotal Mano de Obra */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center pt-2 border-t border-slate-200/80">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500 font-bold">Personas:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateLaborItem(idx, 'personas', Math.max(1, item.personas - 1))}
                          className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={item.personas}
                          onChange={(e) => handleUpdateLaborItem(idx, 'personas', parseInt(e.target.value, 10) || 1)}
                          className="w-10 bg-white border border-slate-300 rounded-lg py-1 text-center font-mono font-bold text-slate-900 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateLaborItem(idx, 'personas', item.personas + 1)}
                          className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500 font-bold">Días:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateLaborItem(idx, 'diasTrabajo', Math.max(1, item.diasTrabajo - 1))}
                          className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={item.diasTrabajo}
                          onChange={(e) => handleUpdateLaborItem(idx, 'diasTrabajo', parseInt(e.target.value, 10) || 1)}
                          className="w-10 bg-white border border-slate-300 rounded-lg py-1 text-center font-mono font-bold text-slate-900 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateLaborItem(idx, 'diasTrabajo', item.diasTrabajo + 1)}
                          className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500 font-bold">Jornal ($):</span>
                      <input
                        type="number"
                        step={10000}
                        value={item.tarifaDiariaCop}
                        onChange={(e) => handleUpdateLaborItem(idx, 'tarifaDiariaCop', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-1.5 text-right font-mono text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Obra</span>
                      <span className="text-sm font-black text-amber-700 font-mono">
                        {formatCOP(item.personas * item.diasTrabajo * item.tarifaDiariaCop)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* BUTTON: AGREGAR NUEVO PERSONAL DIRECTAMENTE ABAJO */}
              <button
                type="button"
                onClick={handleAddLaborItem}
                className="w-full py-3 rounded-2xl bg-teal-50 hover:bg-teal-100 border-2 border-dashed border-teal-300 text-teal-900 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4 text-teal-600" />
                <span>➕ Agregar Personal / Mano de Obra Local</span>
              </button>
            </div>
          </div>

          {/* 4. CONSOLIDADO PRESUPUESTAL Y MARCO LEGAL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-5 bg-white/95 p-6 rounded-3xl border border-white shadow-md space-y-4 text-slate-900">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
                <Zap className="w-4 h-4 text-emerald-600" /> Presupuesto Consolidado Invertido
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-700 font-semibold">
                  <span>Subtotal Insumos y Equipos:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCOP(subtotalPurchases)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-700 font-semibold">
                  <span>Subtotal Mano de Obra Local (JAC):</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCOP(subtotalLabor)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-700 font-semibold">
                  <span>Flete Veredal ({fletePercent}%):</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCOP(fleteCop)}
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-1">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">💰 Presupuesto Total Invertido:</span>
                  <span className="font-mono font-black text-emerald-700 text-2xl sm:text-3xl block">
                    {formatCOP(dynamicTotalBudgetCop)}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white/95 p-6 rounded-3xl border border-white shadow-md space-y-4 text-slate-900">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
                <Scale className="w-4 h-4 text-emerald-600" /> Respaldo Legal & Contratación Directa (Ley 2166)
              </h4>

              <div className="space-y-3 text-xs">
                <p className="text-slate-800 leading-relaxed font-semibold">
                  📌 {currentProposal.mecanismoLegalEspecifico || currentProposal.marcoLegal}
                </p>

                {currentProposal.pasosOperativosFastTrack && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Cronograma Operativo:</span>
                    {currentProposal.pasosOperativosFastTrack.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-800 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 font-semibold">
                        <span className="text-emerald-600 font-mono font-bold">➔</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MODAL 1: EDITAR LINK DIRECTO Y PRECIO UNITARIO */}
      {editingItemIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-emerald-600" />
                <span>Verificar Cotización & Ingresar Link Directo</span>
              </h3>
              <button
                onClick={() => setEditingItemIndex(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Producto / Equipo:</label>
                <input
                  type="text"
                  disabled
                  value={editablePurchases[editingItemIndex]?.producto || ''}
                  className="w-full bg-slate-100 border border-slate-300 rounded-2xl p-3 text-slate-700 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tienda / Proveedor Comercial:</label>
                <select
                  value={editStoreName}
                  onChange={(e) => setEditStoreName(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="MercadoLibre">MercadoLibre Colombia</option>
                  <option value="Temu">Temu Colombia / Importador Directo</option>
                  <option value="Ferretería Local">Ferretería Local (Guaduas)</option>
                  <option value="Distribuidor Nacional">Distribuidor Mayorista Nacional</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Precio Unitario Real ($ COP):</label>
                <input
                  type="number"
                  step={10000}
                  value={editPriceCop}
                  onChange={(e) => setEditPriceCop(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">URL / Link Directo del Producto Exacto:</label>
                <input
                  type="url"
                  placeholder="https://articulo.mercadolibre.com.co/MCO-..."
                  value={editLinkUrl}
                  onChange={(e) => setEditLinkUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 placeholder-slate-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
              <button
                onClick={() => setEditingItemIndex(null)}
                className="px-4 py-2.5 rounded-2xl bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveInlineItemEdit}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md cursor-pointer"
              >
                Guardar Enlace & Verificar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPARADOR INTERACTIVO DE PRECIOS */}
      {compareItemIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <BalanceIcon className="w-4 h-4 text-teal-600" />
                  <span>Comparador de Precios & Proveedores</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {editablePurchases[compareItemIndex]?.producto}
                </span>
              </div>
              <button
                onClick={() => setCompareItemIndex(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-80 overflow-y-auto">
              {(editablePurchases[compareItemIndex]?.opcionesComparativas || []).map((opt) => (
                <div key={opt.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 hover:border-emerald-500 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{opt.proveedor}</span>
                      <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                        {opt.tienda}
                      </span>
                    </div>
                    {opt.nota && <p className="text-slate-500 text-[11px]">{opt.nota}</p>}
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-sm font-black text-emerald-700 font-mono block">
                      {formatCOP(opt.precioUnitarioCop)}
                    </span>
                    <button
                      onClick={() => handleSelectComparativeOption(compareItemIndex, opt)}
                      className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                    >
                      Seleccionar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-200">
              <button
                onClick={() => setCompareItemIndex(null)}
                className="px-4 py-2.5 rounded-2xl bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* VISTA 3: ASISTENTE DE NUEVO PROYECTO */}
      {/* -------------------------------------------------------------------------------- */}
      {activeSubTab === 'asistente' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white/95 rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-6 text-slate-900">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-purple-700 uppercase tracking-wider block">
                  Asistente IA Generador de Fichas de Choque
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Problemática Comunitaria a Ficha Técnica Práctica
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-800 font-bold text-xs border border-purple-200">
                Paso {wizardStep} de 4
              </span>
            </div>

            {/* STEP 1 */}
            {wizardStep === 1 && (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Título Corto del Proyecto de Choque:</label>
                  <input
                    type="text"
                    placeholder="Ej. Iluminación Solar Comunitaria Loma Alta"
                    value={newPropTitle}
                    onChange={(e) => setNewPropTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Vereda / Barrio Beneficiado:</label>
                    <select
                      value={newPropVereda}
                      onChange={(e) => setNewPropVereda(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                    >
                      {VEREDAS_GUADUAS.map((v) => (
                        <option key={v.nombre} value={v.nombre}>{v.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Sector Requerido:</label>
                    <select
                      value={newPropSector}
                      onChange={(e) => setNewPropSector(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                    >
                      <option value="Agua Potable y Saneamiento">Agua Potable y Saneamiento</option>
                      <option value="Educación y Conectividad">Educación y Conectividad</option>
                      <option value="Campo y Desarrollo Agrícola">Campo y Desarrollo Agrícola</option>
                      <option value="Infancia y Familia">Infancia y Familia</option>
                      <option value="Energía e Infraestructura">Energía e Infraestructura</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Descripción de la Problemática Comunitaria:</label>
                  <textarea
                    rows={3}
                    placeholder="Describe qué falla hoy y por qué el modelo político tradicional no lo resuelve..."
                    value={newPropProblem}
                    onChange={(e) => setNewPropProblem(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setWizardStep(2)}
                    disabled={!newPropTitle.trim() || !newPropProblem.trim()}
                    className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Siguiente: Solución Tecnológica</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {wizardStep === 2 && (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Solución Tecnológica de Choque Sugerida:</label>
                  <textarea
                    rows={4}
                    placeholder="Ej. Adquisición de 6 reflectores solares 300W all-in-one con batería integrada y control remoto..."
                    value={newPropSolution}
                    onChange={(e) => setNewPropSolution(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Días Estimados de Montaje:</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={newPropDays}
                      onChange={(e) => setNewPropDays(parseInt(e.target.value, 10) || 7)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Presupuesto Estimado Total ($ COP):</label>
                    <input
                      type="number"
                      step={500000}
                      value={newPropEstBudget}
                      onChange={(e) => setNewPropEstBudget(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Atrás
                  </button>

                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Siguiente: Equipos e Insumos</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {wizardStep === 3 && (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Listado de Equipos e Insumos (Un producto por línea):</label>
                  <textarea
                    rows={5}
                    placeholder="Reflector Solar Suburbano 300W IP67&#10;Poste Metálico de Anclaje 4m&#10;Abrazaderas de Presión en Acero"
                    value={newPropEquiposText}
                    onChange={(e) => setNewPropEquiposText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Atrás
                  </button>

                  <button
                    onClick={() => setWizardStep(4)}
                    className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Siguiente: Vista Previa</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {wizardStep === 4 && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-black text-purple-900 text-base">{newPropTitle}</h4>
                  <p className="text-slate-700"><strong>Vereda:</strong> {newPropVereda} • <strong>Sector:</strong> {newPropSector}</p>
                  <p className="text-slate-700"><strong>Presupuesto Inversión:</strong> {formatCOP(parseInt(newPropEstBudget, 10) || 15000000)}</p>
                  <p className="text-slate-700"><strong>Tiempo Estimado:</strong> {newPropDays} Días hábiles</p>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Atrás
                  </button>

                  <button
                    onClick={handleCreateWizardProject}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>🚀 Generar Ficha Técnica & Publicar</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* VISTA 4: ESPACIO DE MESA DE TRABAJO COLABORATIVA */}
      {/* -------------------------------------------------------------------------------- */}
      {activeSubTab === 'mesa' && currentProposal && (
        <div className="space-y-8">
          
          {/* Top Banner Mesa */}
          <div className="bg-white/95 rounded-3xl p-6 sm:p-8 border border-white shadow-xl space-y-4 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-wider block mb-1">
                  Mesa de Trabajo Veredal • {currentProposal.codigo}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Ajustes en Vivo & Visto Bueno Cívico
                </h3>
              </div>

              <button
                onClick={handleToggleVistoBueno}
                className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                  currentProposal.vistoBuenoAprobado
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>
                  {currentProposal.vistoBuenoAprobado
                    ? '✓ Visto Bueno Aprobado (' + (currentProposal.votosVistoBueno || 1) + ' Votos)'
                    : 'Emitir Visto Bueno Cívico'}
                </span>
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Presupuesto Dinámico Recalculado</span>
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  {formatCOP(dynamicTotalBudgetCop)}
                </span>
              </div>

              <button
                onClick={handleSaveChangesMesa}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Guardar Ajustes de Presupuesto</span>
              </button>
            </div>
          </div>

          {/* Editable Equipment Purchases List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Ajustar Cantidades y Precios de Insumos</span>
              </h4>
              <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Subtotal: {formatCOP(subtotalPurchases)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {editablePurchases.map((item, idx) => (
                <div key={item.id || idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-emerald-400 transition-all">
                  {/* Row 1: Product Name (Inline Input) + Delete Button */}
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={item.producto}
                      onChange={(e) => handleUpdatePurchaseItem(idx, 'producto', e.target.value)}
                      placeholder="Nombre del insumo / equipo..."
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePurchaseItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                      title="Eliminar este producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Row 2: Cantidad Stepper, Precio Unitario Input, Subtotal */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-2 border-t border-slate-200/80">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500 font-bold">Cant:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleUpdatePurchaseItem(idx, 'cantidad', Math.max(1, item.cantidad - 1))}
                          className="w-7 h-7 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={item.cantidad}
                          onChange={(e) => handleUpdatePurchaseItem(idx, 'cantidad', parseInt(e.target.value, 10) || 1)}
                          className="w-14 bg-white border border-slate-300 rounded-xl py-1 text-center font-mono font-bold text-slate-900 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdatePurchaseItem(idx, 'cantidad', item.cantidad + 1)}
                          className="w-7 h-7 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500 font-bold">Precio U:</span>
                      <input
                        type="number"
                        step={10000}
                        value={item.precioUnitarioCop}
                        onChange={(e) => handleUpdatePurchaseItem(idx, 'precioUnitarioCop', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-1.5 text-right font-mono text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Subtotal</span>
                      <span className="text-sm font-black text-emerald-700 font-mono">
                        {formatCOP(item.precioTotalCop || item.cantidad * item.precioUnitarioCop)}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Direct Link */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={item.linkReferencia || ''}
                      onChange={(e) => handleUpdatePurchaseItem(idx, 'linkReferencia', e.target.value)}
                      placeholder="Pegar link de compra directo..."
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {item.linkReferencia.trim().length > 0 && (
                      <a
                        href={item.linkReferencia}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-[11px] font-extrabold flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddPurchaseItem}
                className="w-full py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-dashed border-emerald-300 text-emerald-800 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>➕ Agregar Nuevo Producto / Insumo a esta Obra</span>
              </button>
            </div>
          </div>

          {/* Editable Mano de Obra List in Mesa */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Mano de Obra y Talento Humano Local (JAC Veredal)</span>
              </h4>
              <span className="text-xs font-mono font-black text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Subtotal: {formatCOP(subtotalLabor)}
              </span>
            </div>

            <div className="space-y-3">
              {editableLabor.map((item, idx) => (
                <div key={item.id || idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-teal-400 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs shrink-0">👤</span>
                      <input
                        type="text"
                        value={item.rol}
                        onChange={(e) => handleUpdateLaborItem(idx, 'rol', e.target.value)}
                        placeholder="Ej. Técnico / Auxiliar Veredal..."
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLaborItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                      title="Eliminar personal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center pt-2 border-t border-slate-200/80">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500 font-bold">Personas:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateLaborItem(idx, 'personas', Math.max(1, item.personas - 1))}
                          className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={item.personas}
                          onChange={(e) => handleUpdateLaborItem(idx, 'personas', parseInt(e.target.value, 10) || 1)}
                          className="w-10 bg-white border border-slate-300 rounded-lg py-1 text-center font-mono font-bold text-slate-900 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateLaborItem(idx, 'personas', item.personas + 1)}
                          className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500 font-bold">Días:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateLaborItem(idx, 'diasTrabajo', Math.max(1, item.diasTrabajo - 1))}
                          className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={item.diasTrabajo}
                          onChange={(e) => handleUpdateLaborItem(idx, 'diasTrabajo', parseInt(e.target.value, 10) || 1)}
                          className="w-10 bg-white border border-slate-300 rounded-lg py-1 text-center font-mono font-bold text-slate-900 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateLaborItem(idx, 'diasTrabajo', item.diasTrabajo + 1)}
                          className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500 font-bold">Jornal ($):</span>
                      <input
                        type="number"
                        step={10000}
                        value={item.tarifaDiariaCop}
                        onChange={(e) => handleUpdateLaborItem(idx, 'tarifaDiariaCop', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-1.5 text-right font-mono text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Obra</span>
                      <span className="text-sm font-black text-amber-700 font-mono">
                        {formatCOP(item.personas * item.diasTrabajo * item.tarifaDiariaCop)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddLaborItem}
                className="w-full py-3 rounded-2xl bg-teal-50 hover:bg-teal-100 border-2 border-dashed border-teal-300 text-teal-900 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4 text-teal-600" />
                <span>➕ Agregar Personal / Mano de Obra Local</span>
              </button>
            </div>
          </div>

          {/* Community Observations */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span>Observaciones Comunitarias y Notas de Campo</span>
            </h4>

            <div className="bg-white/95 p-5 rounded-3xl border border-white shadow-md space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Tu Nombre / Líder Veredal..."
                  value={newCommentAuthor}
                  onChange={(e) => setNewCommentAuthor(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />

                <select
                  value={newCommentRole}
                  onChange={(e) => setNewCommentRole(e.target.value as any)}
                  className="bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  <option value="Presidente JAC">Presidente JAC</option>
                  <option value="Fontanero Veredal">Fontanero Veredal</option>
                  <option value="Operario Local">Operario Local</option>
                  <option value="Vecino Beneficiario">Vecino Beneficiario</option>
                  <option value="Equipo Gobierno">Equipo Gobierno</option>
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe un aporte, cotización local o sugerencia para esta obra..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />

                <button
                  onClick={handleAddComment}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Publicar</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {(currentProposal.comentariosComunidad || []).map((com) => (
                <div key={com.id} className="bg-white/90 p-4.5 rounded-2xl border border-white shadow-sm text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <span>👤 {com.autor}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                        {com.rol}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{com.fecha}</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-medium">{com.texto}</p>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* 5. VISTAS Y VOTACIONES DE PLANES PILOTO CÍVICOS */}
      {activeSubTab === 'votaciones' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white/95 p-6 sm:p-8 rounded-3xl border border-white shadow-md space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600">
                  <Vote className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">Votaciones y Encuestas Cívicas (Planes Piloto)</h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">Competencia sana veredal para priorizar la ejecución de soluciones entre las comunidades que más lo necesitan.</p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                <Flame className="w-4 h-4 text-amber-600" /> Competencia Veredal Activa
              </span>
            </div>

            {/* Tarjetas de Votaciones Horizontalmente Divididas y Apiladas en la Pantalla */}
            <div className="flex flex-col space-y-4 w-full pt-2">
              {pilotVotings.map(v => {
                const percent = Math.min(100, Math.round((v.votos / (v.metaVotos || 100)) * 100));
                return (
                  <div key={v.id} className="w-full bg-slate-50/90 rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col space-y-3.5 hover:border-amber-400 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                      <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-extrabold border border-emerald-300">
                        📍 {v.veredaBarrio}
                      </span>
                      <span className="text-xs font-black text-amber-700 font-mono bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        🔥 {v.votos} / {v.metaVotos} Votos Cívicos
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">{v.titulo}</h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">{v.descripcion}</p>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600">
                          <span>Progreso Meta Veredal</span>
                          <span className="font-mono">{percent}% Aceptación</span>
                        </div>
                        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleVoteForPilot(v.id)}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-teal-600 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Vote className="w-4 h-4" />
                        <span>Votar por mi Vereda (+1 Voto Cívico)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
