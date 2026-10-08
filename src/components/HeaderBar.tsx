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
  const isAdentro = ['radiografia', 'auditoria', 'politicas', 'mga', 'speech', 'territorio', 'gira', 'veredas'].includes(activeTab);

  return (
    <header className="sticky top-0 z-40 bg-[#0a0f1d]/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* FILA PRINCIPAL: RESPONSIVE EN MÓVILES Y DESKTOP */}
        <div className="flex items-center justify-between py-2 sm:h-20">
          
          {/* Logo & Brand Identity iAlcaldía */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="cursor-pointer shrink-0" onClick={() => setActiveTab('chat')}>
              <RamitosAvatarLogo size="sm" showHalo={true} municipioId={municipioId} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-lg sm:text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  iAlcaldía
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm shrink-0">
                  Unificada
                </span>
              </div>

              {/* Selector interactivo de municipio */}
              <div className="relative mt-0.5 sm:mt-1">
                <button
                  onClick={() => setShowMunDropdown(!showMunDropdown)}
                  className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-slate-300 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg cursor-pointer truncate max-w-[190px] sm:max-w-none"
                >
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{isCaparrapi ? '🐎 Caparrapí' : '🌿 Guaduas'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {showMunDropdown && (
                  <div className="absolute left-0 mt-1.5 w-64 sm:w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn">
                    <p className="px-3.5 py-1 text-[10px] font-black uppercase text-slate-400">Seleccionar Municipio</p>
                    <button
                      onClick={() => { onSelectMunicipio('caparrapi'); setShowMunDropdown(false); }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between font-bold hover:bg-slate-800 cursor-pointer ${
                        isCaparrapi ? 'text-cyan-300 bg-cyan-950/40' : 'text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">🐎 Caparrapí, Cundinamarca</span>
                      {isCaparrapi && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </button>
                    <button
                      onClick={() => { onSelectMunicipio('guaduas'); setShowMunDropdown(false); }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between font-bold hover:bg-slate-800 cursor-pointer ${
                        !isCaparrapi ? 'text-emerald-300 bg-emerald-950/40' : 'text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">🌿 Guaduas, Cundinamarca</span>
                      {!isCaparrapi && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* NAVEGACIÓN EN PANTALLA GRANDE (DESKTOP) */}
          <div className="hidden lg:flex items-center gap-2">
            
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
              onClick={() => setActiveTab(isAdentro ? activeTab : 'radiografia')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                isAdentro
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/50 border border-cyan-400/40'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>🏛️</span>
              <span>Centro de Mando & MGA (Adentro)</span>
            </button>

            {/* BOTÓN EXCLUSIVO: LICITAPRO SAAS */}
            <button
              onClick={() => setActiveTab('licitaciones')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg ${
                activeTab === 'licitaciones'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-purple-950/70 border border-purple-400/50 scale-[1.03] ring-1 ring-purple-400/30'
                  : 'bg-purple-950/40 text-purple-300 hover:text-white hover:bg-purple-900/60 border border-purple-800/70'
              }`}
              title="Plataforma de Licitaciones Públicas SECOP II"
            >
              <span>📑</span>
              <span className="font-extrabold tracking-wide">LicitaPro SaaS</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 uppercase font-mono font-bold">
                SECOP
              </span>
            </button>

            {/* Status Supabase */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <div className={`w-2 h-2 rounded-full ${isConnectedDb ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
              <span className="text-[11px] font-bold text-slate-300">{isConnectedDb ? 'Supabase' : 'Local'}</span>
            </div>

          </div>

          {/* BADGE DE ESTADO RÁPIDO EN MÓVILES */}
          <div className="flex lg:hidden items-center gap-1.5 shrink-0">
            <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px]">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnectedDb ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
              <span className="text-slate-300 font-semibold">{isConnectedDb ? 'Cloud' : 'Local'}</span>
            </div>
          </div>

        </div>

        {/* BARRA DE NAVEGACIÓN COMPACTA EN MÓVILES (< 1024px) - TABS LIMPIOS TIPO APP SIN MONTARSE */}
        <div className="flex lg:hidden items-center justify-between gap-1.5 pb-2 pt-1 border-t border-slate-800/60">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer truncate ${
              activeTab === 'chat'
                ? 'bg-emerald-600 text-white shadow-md border border-emerald-400/50'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <span>🤖</span>
            <span className="truncate">Copiloto</span>
          </button>

          <button
            onClick={() => setActiveTab(isAdentro ? activeTab : 'radiografia')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer truncate ${
              isAdentro
                ? 'bg-cyan-600 text-white shadow-md border border-cyan-400/50'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <span>🏛️</span>
            <span className="truncate">Mando MGA</span>
          </button>

          <button
            onClick={() => setActiveTab('licitaciones')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer truncate ${
              activeTab === 'licitaciones'
                ? 'bg-purple-600 text-white shadow-md border border-purple-400/50'
                : 'bg-slate-900/90 text-purple-300 hover:text-white border border-slate-800'
            }`}
          >
            <span>📑</span>
            <span className="truncate">LicitaPro</span>
          </button>
        </div>

      </div>
    </header>
  );
};
