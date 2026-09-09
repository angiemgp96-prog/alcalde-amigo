import React, { useState } from 'react';
import { Mic } from 'lucide-react';

interface RamitosAvatarLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showHalo?: boolean;
  className?: string;
}

export const RamitosAvatarLogo: React.FC<RamitosAvatarLogoProps> = ({
  size = 'md',
  showHalo = true,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  const dimMap = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`relative ${dimMap[size]} shrink-0 flex items-center justify-center ${className}`}>
      {/* Glow aura */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-300 to-amber-300 opacity-80 blur-[3px]"></div>

      <div className="relative w-full h-full rounded-2xl bg-white border-2 border-emerald-500 p-1 flex items-center justify-center overflow-hidden shadow-md">
        {!imgError ? (
          <img
            src="/assets/ramitos/ramitos_feliz.png"
            alt="Ramitos Avatar"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain drop-shadow-md transform hover:scale-110 transition-transform"
          />
        ) : (
          <svg className="w-full h-full" viewBox="0 0 160 140" fill="none">
            {/* Flower Petals */}
            <circle cx="80" cy="30" r="18" fill="#fb923c" />
            <circle cx="45" cy="45" r="16" fill="#fde047" />
            <circle cx="115" cy="45" r="16" fill="#38bdf8" />
            <circle cx="35" cy="75" r="15" fill="#f472b6" />
            <circle cx="125" cy="75" r="15" fill="#a7f3d0" />
            {/* Cloud Head */}
            <path
              d="M45 110 C25 110 10 92 20 72 C8 55 24 35 44 42 C54 22 86 20 100 35 C116 22 144 32 142 52 C158 66 150 94 132 104 C120 114 90 115 80 110 Z"
              fill="#ffffff"
              stroke="#10b981"
              strokeWidth="4"
            />
            {/* Smile Face (High contrast on white cloud) */}
            <ellipse cx="65" cy="65" rx="5" ry="6" fill="#1e293b" />
            <ellipse cx="95" cy="65" rx="5" ry="6" fill="#1e293b" />
            <path d="M68 82 Q80 94 92 82" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
        )}
      </div>

      {/* Floating Glowing Mic Badge (Mic Halo - Clean White Border) */}
      {showHalo && (
        <div className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
          <Mic className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </div>
  );
};
