import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { 
  X, MapPin, ChevronDown, CheckCircle2, Lock, Unlock, KeyRound
} from 'lucide-react';
import { RamitosAvatarLogo } from './RamitosAvatarLogo';

interface HeaderBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isConnectedDb: boolean;
  needsCount: number;
  isSecretAdminUnlocked?: boolean;
  onUnlockSecretAdmin?: (unlocked: boolean) => void;
  showAdminModal?: boolean;
  setShowAdminModal?: (show: boolean) => void;
  municipioId: 'guaduas' | 'caparrapi';
  onSelectMunicipio: (m: 'guaduas' | 'caparrapi') => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  setActiveTab,
  isConnectedDb,
  needsCount,
  isSecretAdminUnlocked = false,
  onUnlockSecretAdmin,
  showAdminModal: externalShowAdminModal,
  setShowAdminModal: externalSetShowAdminModal,
  municipioId,
  onSelectMunicipio
}) => {
  const [showMunDropdown, setShowMunDropdown] = useState(false);
  const [internalShowAdminModal, setInternalShowAdminModal] = useState(false);
  const showAdminModal = externalShowAdminModal !== undefined ? externalShowAdminModal : internalShowAdminModal;
  const setShowAdminModal = (val: boolean) => {
    if (externalSetShowAdminModal) externalSetShowAdminModal(val);
    setInternalShowAdminModal(val);
  };
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [adminKeyError, setAdminKeyError] = useState(false);

  const isCaparrapi = municipioId === 'caparrapi';
  const isAdentro = ['radiografia', 'auditoria', 'politicas', 'mga', 'speech', 'territorio', 'gira', 'veredas'].includes(activeTab);

  const handleAdminFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKeyInput.trim() === '0777') {
      if (onUnlockSecretAdmin) onUnlockSecretAdmin(true);
      setShowAdminModal(false);
      setAdminKeyInput('');
      setAdminKeyError(false);
    } else {
      setAdminKeyError(true);
    }
  };

  const handleToggleLock = () => {
    if (onUnlockSecretAdmin) onUnlockSecretAdmin(!isSecretAdminUnlocked);
    setShowAdminModal(false);
    setAdminKeyInput('');
    setAdminKeyError(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0a0f1d]/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          
          {/* FILA PRINCIPAL: RESPONSIVE EN MÓVILES Y DESKTOP */}
          <div className="flex items-center justify-between py-2 sm:h-20">
            
            {/* Logo & Brand Identity iAlcaldía */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="shrink-0">
                <RamitosAvatarLogo size="sm" showHalo={true} municipioId={municipioId} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 select-none">
                  <span className="text-lg sm:text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                    iAlcaldía
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm shrink-0 flex items-center gap-1">
                    <span>Unificada</span>
                  </span>
                </div>

                {/* Selector de municipio: Bloqueado en Caparrapí salvo que se desbloquee modo admin */}
                <div className="relative mt-0.5 sm:mt-1">
                  {isSecretAdminUnlocked ? (
                    <>
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
                    </>
                  ) : (
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg select-none">
                      <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
                      <span>🐎 Caparrapí</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* NAVEGACIÓN EN PANTALLA GRANDE (DESKTOP) */}
            <div className="hidden lg:flex items-center gap-2">
              
              {/* AFUERA: BOT */}
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50 border border-emerald-400/40'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>🤖</span>
                <span>Bot</span>
              </button>

              {/* BOTÓN VOZ DEL PUEBLO */}
              <button
                onClick={() => setActiveTab('escucha')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'escucha'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-orange-950/50 border border-amber-400/50'
                    : 'bg-slate-900/80 text-amber-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
                title="Voz del Pueblo: Propuestas y Prioridades Comunitarias"
              >
                <span>📣</span>
                <span>Voz del Pueblo</span>
                {needsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                    {needsCount}
                  </span>
                )}
              </button>

              {/* MÓDULOS DE ADMINISTRADOR (SOLO SI SE ESCRIBE 0777 O VÍA MODAL) */}
              {isSecretAdminUnlocked && (
                <>
                  {/* ADENTRO: CENTRO DE MANDO & MGA */}
                  <button
                    onClick={() => setActiveTab(isAdentro ? activeTab : 'radiografia')}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer animate-fadeIn ${
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
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg animate-fadeIn ${
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
                </>
              )}

            </div>

          </div>

          {/* BARRA DE NAVEGACIÓN COMPACTA EN MÓVILES (< 1024px) */}
          <div className="flex lg:hidden items-center justify-between gap-1 pb-1.5 pt-1 border-t border-slate-800/60">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer truncate ${
                activeTab === 'chat'
                  ? 'bg-emerald-600 text-white shadow-md border border-emerald-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <span>🤖</span>
              <span className="truncate">Bot</span>
            </button>

            <button
              onClick={() => setActiveTab('escucha')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer truncate ${
                activeTab === 'escucha'
                  ? 'bg-amber-600 text-white shadow-md border border-amber-400/50'
                  : 'bg-slate-900/90 text-amber-300 hover:text-white border border-slate-800'
              }`}
            >
              <span>📣</span>
              <span className="truncate">Voz del Pueblo {needsCount > 0 ? `(${needsCount})` : ''}</span>
            </button>

            {/* MÓDULOS DE ADMINISTRADOR EN MÓVILES (SOLO SI SE DESBLOQUEA CON 0777) */}
            {isSecretAdminUnlocked && (
              <>
                <button
                  onClick={() => setActiveTab(isAdentro ? activeTab : 'radiografia')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer truncate animate-fadeIn ${
                    isAdentro
                      ? 'bg-cyan-600 text-white shadow-md border border-cyan-400/50'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>🏛️</span>
                  <span className="truncate">Mando</span>
                </button>

                <button
                  onClick={() => setActiveTab('licitaciones')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer truncate animate-fadeIn ${
                    activeTab === 'licitaciones'
                      ? 'bg-purple-600 text-white shadow-md border border-purple-400/50'
                      : 'bg-slate-900/90 text-purple-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>📑</span>
                  <span className="truncate">LicitaPro</span>
                </button>
              </>
            )}
          </div>

        </div>
      </header>

      {/* MODAL DE CLAVE DE ACCESO ADMINISTRATIVO */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => { setShowAdminModal(false); setAdminKeyError(false); setAdminKeyInput(''); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Acceso Administrativo</h3>
                <p className="text-[11px] text-slate-400">Módulos de gestión territorial</p>
              </div>
            </div>

            {isSecretAdminUnlocked ? (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center space-x-2.5">
                  <Unlock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-300 font-semibold">El Centro de Mando y LicitaPro ya están visibles.</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleLock}
                  className="w-full py-2.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Bloquear y Ocultar Menú
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdminFormSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Clave de Acceso:</label>
                  <input
                    type="password"
                    autoFocus
                    value={adminKeyInput}
                    onChange={(e) => { setAdminKeyInput(e.target.value); setAdminKeyError(false); }}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none font-mono"
                  />
                  {adminKeyError && (
                    <p className="text-[10px] text-rose-400 mt-1 font-semibold">Clave incorrecta. Intenta de nuevo.</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowAdminModal(false); setAdminKeyError(false); setAdminKeyInput(''); }}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
                  >
                    Desbloquear
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
