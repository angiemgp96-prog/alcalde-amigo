import React, { useState, useEffect } from 'react';
import { ActiveTab, CitizenNeed, CitizenLead, BaseProposal, GreenApiMessage, SupabaseConfig } from './types';
import { HeaderBar } from './components/HeaderBar';
import { RamitosChatView } from './components/RamitosChatView';
import { CitizenVoiceView } from './components/CitizenVoiceView';
import { GreenApiCrmView } from './components/GreenApiCrmView';
import { CopilotoAlcaldiaView } from './components/CopilotoAlcaldiaView';
import { CloudConsoleView } from './components/CloudConsoleView';
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
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [needs, setNeeds] = useState<CitizenNeed[]>([]);
  const [leads, setLeads] = useState<CitizenLead[]>([]);
  const [proposals, setProposals] = useState<BaseProposal[]>(getBaseProposals());
  const [messages, setMessages] = useState<GreenApiMessage[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSavedSupabaseConfig());
  const [selectedProposal, setSelectedProposal] = useState<BaseProposal | null>(null);

  // MODO SECRETO ADMINISTRADOR (ACTIVADO AL DIGITAR "0777" EN TECLADO)
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

  // Carga inicial de datos (incluyendo proyectos desde Supabase)
  useEffect(() => {
    setNeeds(getCitizenNeeds());
    setLeads(getCitizenLeads());
    setMessages(getGreenApiMessages());

    // Cargar proyectos de Copiloto desde Supabase en segundo plano
    getProyectosCopilotoFromSupabase().then((loaded) => {
      if (loaded && loaded.length > 0) {
        setProposals(loaded);
      }
    });
  }, []);

  // Guardar nueva necesidad y lead de contacto desde el chat o voz
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

  // Guardar o actualizar un proyecto en Supabase (links, precios, visto bueno, etc.)
  const handleUpdateProposal = async (updated: BaseProposal) => {
    setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    await saveOrUpdateProyectoCopiloto(updated);
  };

  // Crear un nuevo proyecto en Supabase desde el asistente
  const handleAddProposal = async (newProp: BaseProposal) => {
    setProposals((prev) => [newProp, ...prev]);
    await saveOrUpdateProyectoCopiloto(newProp);
  };

  const handleMessageSent = () => {
    setMessages(getGreenApiMessages());
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
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

      {/* Header Bar solo visible si el usuario navega a opciones secundarias */}
      {activeTab !== 'chat' && (
        <HeaderBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isConnectedDb={supabaseConfig.isConnected}
          needsCount={needs.length}
          isSecretAdminUnlocked={isSecretAdminUnlocked}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto">
        {activeTab === 'chat' && (
          <RamitosChatView
            onSaveNeed={handleSaveNeed}
            onOpenFullPlan={() => setActiveTab('copiloto')}
            onOpenMenu={(tab) => setActiveTab(tab)}
            isSecretAdminUnlocked={isSecretAdminUnlocked}
          />
        )}

        {activeTab === 'escucha' && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <CitizenVoiceView
              needs={needs}
              onSaveNeed={handleSaveNeed}
            />
          </div>
        )}

        {activeTab === 'crm' && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <GreenApiCrmView
              leads={leads}
              messages={messages}
              onMessageSent={handleMessageSent}
            />
          </div>
        )}

        {activeTab === 'copiloto' && (
          <div className="py-4 sm:py-6 px-2">
            <CopilotoAlcaldiaView
              proposals={proposals}
              selectedProposal={selectedProposal}
              onSelectProposal={setSelectedProposal}
              onAddProposal={handleAddProposal}
              onUpdateProposal={handleUpdateProposal}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
