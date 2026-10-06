import React, { useState, useEffect } from 'react';
import { ActiveTab, CitizenNeed, CitizenLead, BaseProposal, GreenApiMessage, SupabaseConfig } from './types';
import { HeaderBar } from './components/HeaderBar';
import { RamitosChatView } from './components/RamitosChatView';
import { CitizenVoiceView } from './components/CitizenVoiceView';
import { GreenApiCrmView } from './components/GreenApiCrmView';
import { CopilotoAlcaldiaView } from './components/CopilotoAlcaldiaView';
import { CentroMandoView } from './components/CentroMandoView';
import {
  getCitizenNeeds,
  saveCitizenNeed,
  getCitizenLeads,
  saveCitizenLead,
  getBaseProposals,
  getProyectosCopilotoFromSupabase,
  saveOrUpdateProyectoCopiloto,
  getGreenApiMessages,
  getSavedSupabaseConfig
} from './services/api';

export function App() {
  // Detección inicial de municipio desde la URL o LocalStorage
  const getInitialMunicipio = (): 'guaduas' | 'caparrapi' => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('caparrapi')) return 'caparrapi';
      if (path.includes('guaduas')) return 'guaduas';
      const stored = localStorage.getItem('ialcaldia_active_municipio');
      if (stored === 'caparrapi' || stored === 'guaduas') return stored;
    }
    return 'caparrapi'; // Default a Caparrapí para máxima riqueza de inteligencia
  };

  const [municipioId, setMunicipioId] = useState<'guaduas' | 'caparrapi'>(getInitialMunicipio);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [needs, setNeeds] = useState<CitizenNeed[]>([]);
  const [leads, setLeads] = useState<CitizenLead[]>([]);
  const [proposals, setProposals] = useState<BaseProposal[]>(getBaseProposals());
  const [messages, setMessages] = useState<GreenApiMessage[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSavedSupabaseConfig());
  const [selectedProposal, setSelectedProposal] = useState<BaseProposal | null>(null);

  // MODO SECRETO ADMINISTRADOR ("0777")
  const [isSecretAdminUnlocked, setIsSecretAdminUnlocked] = useState<boolean>(false);
  const [showSecretToast, setShowSecretToast] = useState<boolean>(false);

  useEffect(() => {
    let keyBuffer = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      keyBuffer += e.key;
      if (keyBuffer.length > 20) keyBuffer = keyBuffer.slice(-20);

      if (keyBuffer.endsWith('0777')) {
        setIsSecretAdminUnlocked(prev => {
          const nextState = !prev;
          setShowSecretToast(true);
          setTimeout(() => setShowSecretToast(false), 4500);
          return nextState;
        });
        keyBuffer = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Carga inicial de datos
  useEffect(() => {
    setNeeds(getCitizenNeeds());
    setLeads(getCitizenLeads());
    setMessages(getGreenApiMessages());
    setProposals(getBaseProposals(municipioId));

    getProyectosCopilotoFromSupabase().then((loaded) => {
      if (loaded && loaded.length > 0) {
        setProposals(loaded);
      }
    });
  }, [municipioId]);

  const handleSelectMunicipio = (newMun: 'guaduas' | 'caparrapi') => {
    setMunicipioId(newMun);
    localStorage.setItem('ialcaldia_active_municipio', newMun);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/${newMun}`);
    }
  };

  const handleSaveNeed = async (
    needData: Omit<CitizenNeed, 'id' | 'fechaReporte' | 'votosApoyo'>,
    leadData?: Omit<CitizenLead, 'id' | 'fechaRegistro' | 'estadoNotificacion'>
  ) => {
    if (leadData) {
      await saveCitizenLead(leadData);
      setLeads(getCitizenLeads());
    }
    await saveCitizenNeed(needData);
    setNeeds(getCitizenNeeds());
  };

  const handleUpdateProposal = async (updated: BaseProposal) => {
    setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    await saveOrUpdateProyectoCopiloto(updated);
  };

  const handleAddProposal = async (newProp: BaseProposal) => {
    setProposals((prev) => [newProp, ...prev]);
    await saveOrUpdateProyectoCopiloto(newProp);
  };

  const handleMessageSent = () => {
    setMessages(getGreenApiMessages());
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Toast Notificación Modo Secreto 0777 */}
      {showSecretToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-emerald-300 border-2 border-emerald-500/60 shadow-2xl px-5 py-3.5 rounded-2xl flex items-center space-x-3 animate-bounce backdrop-blur-xl">
          <span className="text-2xl">{isSecretAdminUnlocked ? '🔓' : '🔒'}</span>
          <div>
            <p className="text-sm font-extrabold text-white">Modo Administrador {isSecretAdminUnlocked ? 'ACTIVADO' : 'OCULTO'}</p>
            <p className="text-xs text-emerald-400 font-mono">Clave secreta 0777 detectada</p>
          </div>
        </div>
      )}

      {/* Header Bar siempre visible con navegación completa y selector de Sede */}
      <HeaderBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnectedDb={supabaseConfig.isConnected}
        needsCount={needs.length}
        isSecretAdminUnlocked={isSecretAdminUnlocked}
        municipioId={municipioId}
        onSelectMunicipio={handleSelectMunicipio}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto pb-12">
        {/* MÓDULOS DE INTELIGENCIA TERRITORIAL, SECOP II, MGA Y ELECCIONES */}
        {['radiografia', 'auditoria', 'politicas', 'mga', 'speech', 'territorio', 'gira', 'veredas'].includes(activeTab) && (
          <CentroMandoView
            municipioId={municipioId}
            currentTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as ActiveTab)}
          />
        )}

        {/* MÓDULO CHAT: COPILOTO CIUDADANO (CAPARRAPÍ) / RAMITOS (GUADUAS) */}
        {activeTab === 'chat' && (
          <div className="pt-2">
            <RamitosChatView
              onSaveNeed={handleSaveNeed}
              onOpenFullPlan={() => setActiveTab('mga')}
              onOpenMenu={(tab) => setActiveTab(tab)}
              isSecretAdminUnlocked={isSecretAdminUnlocked}
              municipioId={municipioId}
            />
          </div>
        )}

        {/* MÓDULO VOZ CIUDADANA */}
        {activeTab === 'escucha' && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <CitizenVoiceView
              needs={needs}
              onSaveNeed={handleSaveNeed}
              municipioId={municipioId}
            />
          </div>
        )}

        {/* MÓDULO CRM GREEN API */}
        {activeTab === 'crm' && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <GreenApiCrmView
              leads={leads}
              messages={messages}
              onMessageSent={handleMessageSent}
              municipioId={municipioId}
            />
          </div>
        )}

        {/* MÓDULO COPILOTO ALCALDÍA */}
        {activeTab === 'copiloto' && (
          <div className="py-4 sm:py-6 px-2">
            <CopilotoAlcaldiaView
              proposals={proposals}
              selectedProposal={selectedProposal}
              onSelectProposal={setSelectedProposal}
              onAddProposal={handleAddProposal}
              onUpdateProposal={handleUpdateProposal}
              isSecretAdminUnlocked={isSecretAdminUnlocked}
              municipioId={municipioId}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
