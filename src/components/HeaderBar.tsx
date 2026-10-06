import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { 
  MessageSquare, FileText, Send, Building2, Cloud, Sparkles, CheckCircle2, 
  ShieldAlert, ChevronDown, MapPin, Database, Radio, Vote, Mic, Users, HeartHandshake,
  ArrowRight
} from 'lucide-react';
import { RamitosAvatarLogo } from './RamitosAvatarLogo';

interface HeaderBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isConnectedDb: boolean;
  needsCount: number;
  isSecretAdminUnlocked?: boolean;
  municipioId: 'guaduas' | 'caparrapi';
  onSelectMunicipio: (m: 'guaduas' | 'caparrapi') => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  setActiveTab,
  isConnectedDb,
  needsCount,
  isSecretAdminUnlocked = false,
  municipioId,
  onSelectMunicipio
}) => {
  const [showMunDropdown, setShowMunDropdown] = useState(false);
  const isCaparrapi = municipioId === 'caparrapi';

  const isAdentro = ['gira', 'radiografia', 'veredas', 'auditoria', 'politicas', 'mga', 'speech'].includes(activeTab);

  return (
    <header className="sticky top-0 z-40 bg-[#0a0f1d]/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* FILA 1: BRANDING, SELECTOR DE SEDE Y NAVEGACIÓN PRINCIPAL (AFUERA / ADENTRO) */}
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Identity iAlcaldía */}
          <div className="flex items-center space-x-3">
            <div className="cursor-pointer" onClick={() => setActiveTab('chat')}>
              <RamitosAvatarLogo size="md" showHalo={true} municipioId={municipioId} />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  iAlcaldía
                </span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm">
                  Plataforma Unificada
                </span>
              </div>

              {/* Selector interactivo de municipio */}
              <div className="relative mt-1">
                <button
                  onClick={() => setShowMunDropdown(!showMunDropdown)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isCaparrapi ? '🐎 Caparrapí (Copiloto & Inteligencia)' : '🌿 Guaduas (Ramitos & Inteligencia)'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showMunDropdown && (
                  <div className="absolute left-0 mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn">
                    <p className="px-3.5 py-1 text-[10px] font-black uppercase text-slate-400">Seleccionar Sede</p>
                    <button
                      onClick={() => { onSelectMunicipio('caparrapi'); setShowMunDropdown(false); }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between font-bold hover:bg-slate-800 cursor-pointer ${
                        isCaparrapi ? 'text-cyan-300 bg-cyan-950/40' : 'text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">🐎 Caparrapí, Cund. (Estrategia, SECOP & MGA)</span>
                      {isCaparrapi && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </button>
                    <button
                      onClick={() => { onSelectMunicipio('guaduas'); setShowMunDropdown(false); }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between font-bold hover:bg-slate-800 cursor-pointer ${
                        !isCaparrapi ? 'text-emerald-300 bg-emerald-950/40' : 'text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">🌿 Guaduas, Cund. (Ramitos, SECOP & MGA)</span>
                      {!isCaparrapi && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BOTONES PRINCIPALES: AFUERA (CHAT CON VOZ) vs ADENTRO (CENTRO DE MANDO & MGA) */}
          <div className="flex items-center gap-2">
            
            {/* AFUERA: CHAT CON VOZ */}
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50 border border-emerald-400/40'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>🤖</span>
              <span>{isCaparrapi ? 'Bot Caparrapí (Afuera)' : 'Ramitos con Voz (Afuera)'}</span>
            </button>

            {/* ADENTRO: CENTRO DE MANDO & MGA */}
            <button
              onClick={() => setActiveTab(isAdentro ? activeTab : 'gira')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                isAdentro
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/50 border border-cyan-400/40'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>🏛️</span>
              <span>Centro de Mando & MGA (Adentro)</span>
            </button>

            {/* VOZ CIUDADANA */}
            <button
              onClick={() => setActiveTab('escucha')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'escucha'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>📣</span>
              <span>Voz Ciudadana</span>
              {needsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                  {needsCount}
                </span>
              )}
            </button>

            {/* CRM WHATSAPP */}
            <button
              onClick={() => setActiveTab('crm')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'crm'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>📱</span>
              <span>CRM</span>
            </button>

            {/* Status Supabase */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
              {isConnectedDb ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-emerald-300 font-bold text-[11px] hidden sm:inline">Supabase</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <span className="text-amber-300 font-bold text-[11px]">Local</span>
                </>
              )}
            </div>

          </div>

        </div>

      </div>
    </header>
  );
};
