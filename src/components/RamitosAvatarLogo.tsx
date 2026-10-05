import React, { useState } from 'react';
import { Mic, Shield } from 'lucide-react';

interface RamitosAvatarLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showHalo?: boolean;
  className?: string;
  municipioId?: 'guaduas' | 'caparrapi';
}

export const RamitosAvatarLogo: React.FC<RamitosAvatarLogoProps> = ({
  size = 'md',
  showHalo = true,
  className = '',
  municipioId = 'guaduas'
}) => {
  const [imgError, setImgError] = useState(false);

  const dimMap = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const isCaparrapi = municipioId === 'caparrapi';

  return (
    <div className={`relative ${dimMap[size]} shrink-0 flex items-center justify-center ${className}`}>
      {/* Glow aura */}
      <div className={`absolute inset-0 rounded-2xl ${
        isCaparrapi 
          ? 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400' 
          : 'bg-gradient-to-tr from-emerald-400 via-teal-300 to-amber-300'
      } opacity-80 blur-[3px]`}></div>

      <div className={`relative w-full h-full rounded-2xl bg-white border-2 ${
        isCaparrapi ? 'border-blue-600' : 'border-emerald-500'
      } p-1 flex items-center justify-center overflow-hidden shadow-md`}>
        {isCaparrapi ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-950 text-white rounded-xl p-0.5">
            <Shield className="w-5 h-5 text-blue-300 drop-shadow" />
            <span className="text-[7px] font-black uppercase tracking-tighter text-sky-200">Caparrapí</span>
          </div>
        ) : !imgError ? (
          <img
            src="/assets/ramitos/ramitos_feliz.png"
            alt="Ramitos Avatar"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain drop-shadow-md transform hover:scale-110 transition-transform"
          />
        ) : (
          <svg className="w-full h-full" viewBox="0 0 160 140" fill="none">
            <circle cx="80" cy="30" r="18" fill="#fb923c" />
            <circle cx="45" cy="45" r="16" fill="#fde047" />
            <circle cx="115" cy="45" r="16" fill="#38bdf8" />
            <circle cx="35" cy="75" r="15" fill="#f472b6" />
            <circle cx="125" cy="75" r="15" fill="#a7f3d0" />
            <path
              d="M45 110 C25 110 10 92 20 72 C8 55 24 35 44 42 C54 22 86 20 100 35 C116 22 144 32 142 52 C158 66 150 94 132 104 C120 114 90 115 80 110 Z"
              fill="#ffffff"
              stroke="#10b981"
              strokeWidth="4"
            />
            <ellipse cx="65" cy="65" rx="5" ry="6" fill="#1e293b" />
            <ellipse cx="95" cy="65" rx="5" ry="6" fill="#1e293b" />
            <path d="M68 82 Q80 94 92 82" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
        )}
      </div>

      {/* Floating Glowing Mic Badge */}
      {showHalo && (
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${
          isCaparrapi ? 'bg-blue-600' : 'bg-emerald-600'
        } border-2 border-white flex items-center justify-center shadow-md animate-pulse`}>
          <Mic className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </div>
  );
};
