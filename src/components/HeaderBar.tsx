import React from 'react';
import { ActiveTab } from '../types';
import { MessageSquare, FileText, Send, Building2, Cloud, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import { RamitosAvatarLogo } from './RamitosAvatarLogo';

interface HeaderBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isConnectedDb: boolean;
  needsCount: number;
  isSecretAdminUnlocked?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  setActiveTab,
  isConnectedDb,
  needsCount,
  isSecretAdminUnlocked = false
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Identity "Ramitos" with Mic Halo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('chat')}>
            <RamitosAvatarLogo size="md" showHalo={true} />

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 bg-clip-text text-transparent">
                  ALCALDE AMIGO
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> Ramitos
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <span>Guaduas, Cundinamarca</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">Conversación Directa</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Visibles únicamente en Modo Administrador 0777) */}
          {isSecretAdminUnlocked && (
            <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner animate-fadeIn">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-200/80 border border-transparent'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Conversar con Ramitos 🌿</span>
              </button>

              <button
                onClick={() => setActiveTab('copiloto')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'copiloto'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Alcaldía Copiloto</span>
              </button>

              <button
                onClick={() => setActiveTab('crm')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'crm'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Send className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp CRM</span>
              </button>
            </nav>
          )}

          {/* Status Badge */}
          <div className="flex items-center space-x-3">

            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs">
              {isConnectedDb ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-950 font-bold">Supabase</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <span className="text-amber-800 font-bold">Localhost</span>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-slate-200">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
              activeTab === 'chat' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-700 bg-slate-100'
            }`}
          >
            🌿 Conversar con Ramitos
          </button>
          <button
            onClick={() => setActiveTab('copiloto')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'copiloto' ? 'bg-emerald-600 text-white' : 'text-slate-700 bg-slate-100'
            }`}
          >
            Alcaldía Copiloto
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'crm' ? 'bg-emerald-600 text-white' : 'text-slate-700 bg-slate-100'
            }`}
          >
            WhatsApp CRM
          </button>
        </div>
      </div>
    </header>
  );
};
