import React, { useState } from 'react';
import { SupabaseConfig } from '../types';
import { initSupabase } from '../services/api';
import { Cloud, CheckCircle2, AlertCircle, Copy, Check, Database, ExternalLink, Terminal, Key, ShieldCheck } from 'lucide-react';

interface CloudConsoleViewProps {
  supabaseConfig: SupabaseConfig;
  onUpdateConfig: (config: SupabaseConfig) => void;
}

export const CloudConsoleView: React.FC<CloudConsoleViewProps> = ({
  supabaseConfig,
  onUpdateConfig
}) => {
  const [url, setUrl] = useState(supabaseConfig.url);
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey);
  const [copiedSql, setCopiedSql] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const sqlSchemaText = `-- ALCALDE AMIGO CON RAMITOS - SCRIPT POSTGRESQL PARA SUPABASE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS contactos_ciudadanos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    vereda_barrio TEXT NOT NULL,
    interes_principal TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS necesidades_ciudadanas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ciudadano_nombre TEXT NOT NULL,
    vereda_barrio TEXT NOT NULL,
    audio_transcripcion TEXT NOT NULL,
    problematica_sintetizada TEXT NOT NULL,
    sector TEXT NOT NULL,
    urgencia TEXT DEFAULT 'Alta',
    propuesta_ramitos TEXT NOT NULL,
    insumos_clave TEXT,
    presupuesto_estimado_cop NUMERIC,
    fecha_reporte TIMESTAMPTZ DEFAULT NOW()
);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = initSupabase(url.trim(), anonKey.trim());
    if (ok) {
      onUpdateConfig({ url: url.trim(), anonKey: anonKey.trim(), isConnected: true });
      setTestResult('¡Conexión con Supabase establecida exitosamente!');
    } else {
      setTestResult('No se pudo conectar con Supabase. Verifica la URL y la Anon Key.');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner: Render & Supabase Cloud Console */}
      <div className="frosted-glass rounded-3xl p-6 sm:p-8 border border-sky-500/30 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-bold uppercase tracking-wider">
              <Cloud className="w-3.5 h-3.5" />
              <span>Infraestructura Gratuita para el Futuro Online</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              Despliegue Online en <span className="text-sky-400">Render</span> & Base de Datos en <span className="text-emerald-400">Supabase</span>
            </h2>
            <p className="text-xs text-slate-300">
              La plataforma está lista para correr 100% gratis en Render (para publicar la página) y Supabase (para guardar la voz de la ciudadanía).
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shrink-0">
            <div className={`w-3 h-3 rounded-full ${supabaseConfig.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
            <span className="text-xs font-bold text-white">
              {supabaseConfig.isConnected ? 'Conectado a Supabase Cloud' : 'Localhost (LocalStorage activo)'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Supabase Credentials Form */}
        <div className="lg:col-span-6 space-y-6">
          <form onSubmit={handleSaveSupabase} className="frosted-glass rounded-3xl p-6 sm:p-8 space-y-5 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Conectar Proyecto de Supabase (Gratis)</span>
              </h3>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                Crear cuenta en Supabase <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">SUPABASE_URL:</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyz.supabase.co"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">SUPABASE_ANON_KEY:</label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              Probar & Sincronizar Base de Datos Supabase
            </button>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs font-bold text-center ${
                supabaseConfig.isConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {testResult}
              </div>
            )}
          </form>

          {/* Render 1-Click Deployment Guide */}
          <div className="frosted-glass rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <span>Publicación Online en Render (Gratis)</span>
            </h3>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
              <li>Sube este repositorio a tu cuenta de GitHub.</li>
              <li>Ingresa a <a href="https://render.com" target="_blank" rel="noreferrer" className="text-sky-400 underline font-bold">Render.com</a> y crea un nuevo <strong>Static Site</strong>.</li>
              <li>Render detectará automáticamente el archivo <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300 font-mono">render.yaml</code>.</li>
              <li>Haz clic en <strong>Deploy</strong> y en 2 minutos tendrás tu sitio en vivo con certificado SSL seguro.</li>
            </ol>
          </div>
        </div>

        {/* Right Column: SQL Schema Viewer */}
        <div className="lg:col-span-6 space-y-4">
          <div className="frosted-glass rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Script PostgreSQL para Supabase (`schema.sql`)</span>
              </h3>
              <button
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-emerald-400 border border-slate-700 flex items-center gap-1.5"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Copia este script, ve al <strong>SQL Editor</strong> en tu panel de Supabase y presiona <strong>Run</strong> para crear automáticamente todas las tablas.
            </p>

            <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] text-emerald-300 font-mono overflow-x-auto max-h-[350px]">
              {sqlSchemaText}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};
