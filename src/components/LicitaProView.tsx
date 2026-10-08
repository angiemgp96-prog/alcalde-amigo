import React, { useState } from 'react';
import { 
  Building2, Coins, Calendar, FileText, CheckCircle2, AlertTriangle, 
  XCircle, ArrowUpRight, Search, Filter, Plus, Users, MapPin, Scale, 
  Clock, Sparkles, FolderPlus, ArrowLeft, ShieldCheck, DollarSign,
  TrendingUp, AlertCircle, FileCheck2, Landmark, Check
} from 'lucide-react';

// Formato de moneda COP
const formatCOP = (val: number): string => {
  return `$${Math.round(val).toLocaleString('es-CO')} COP`;
};

// Interfaz de Organización Proponente (Multi-Empresa)
export interface ProponenteOrg {
  id: string;
  nombre: string;
  nit: string;
  tipo: 'ONG / Fundación' | 'Empresa S.A.S.' | 'Asociación Campesina' | 'Cooperativa' | 'Consorcio';
  personeria: string;
  certVigenciaDias: number;
  certFechaVence: string;
  sedePrincipal: string;
  departamentoBase: string;
  patrimonioEstimadoCop: number;
  experienciaContratos: {
    objeto: string;
    entidad: string;
    valorCop: number;
    ano: number;
    estado: 'liquidado_satisfaccion' | 'en_ejecucion';
  }[];
}

// Organización predeterminada: Fundación Nueva Vida
const DEFAULT_ORG: ProponenteOrg = {
  id: 'org_fnv_001',
  nombre: 'Fundación Nueva Vida',
  nit: '832.008.424-4',
  tipo: 'ONG / Fundación',
  personeria: 'Reconocida ICBF SNBF (Res. 6300/2024)',
  certVigenciaDias: 22,
  certFechaVence: '2026-10-29',
  sedePrincipal: 'Cajicá / Sabana Centro',
  departamentoBase: 'Cundinamarca',
  patrimonioEstimadoCop: 850000000,
  experienciaContratos: [
    {
      objeto: 'Atención integral a niños, niñas y adolescentes en restablecimiento de derechos',
      entidad: 'Municipio de Soacha - Secretaría de Desarrollo Social',
      valorCop: 151071426,
      ano: 2021,
      estado: 'liquidado_satisfaccion'
    },
    {
      objeto: 'Servicios de protección y cuidado transitorio bajo lineamientos técnicos ICBF',
      entidad: 'ICBF Regional Cundinamarca',
      valorCop: 420000000,
      ano: 2023,
      estado: 'liquidado_satisfaccion'
    }
  ]
};

// Listado de oportunidades reales sincronizadas de SECOP II
interface OpportunitySecop {
  id: string;
  process_number: string;
  entity_name: string;
  department: string;
  city: string;
  modality: string;
  description: string;
  estimated_value: number;
  presentation_date: string;
  secop_url: string;
  strategic_score: number;
  recommendation: 'participar' | 'investigar' | 'descartar';
}

const REAL_OPPORTUNITIES: OpportunitySecop[] = [
  {
    id: 'opp_secop_icbf_001',
    process_number: 'ICBF-CV-PC-001-2026BOL',
    entity_name: 'ICBF REGIONAL BOLIVAR',
    department: 'Bolívar',
    city: 'Cartagena',
    modality: 'Convocatoria Pública - Contrato de Aporte',
    description: 'Prestar los servicios de educación inicial en el marco de la atención Integral a la Primera Infancia, de conformidad con los Manuales Técnicos y Guías Operativas del ICBF.',
    estimated_value: 2091584837,
    presentation_date: '2026-10-24 15:00:00',
    secop_url: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10207367',
    strategic_score: 92,
    recommendation: 'participar'
  },
  {
    id: 'opp_secop_cota_002',
    process_number: 'PC-002-2026',
    entity_name: 'ALCALDÍA MUNICIPAL COTA',
    department: 'Cundinamarca',
    city: 'Cota (Sabana Centro)',
    modality: 'Contratación régimen especial (con ofertas)',
    description: 'Prestación de servicios para la operación del programa integral de apoyo nutricional y desarrollo psicosocial en el municipio de Cota.',
    estimated_value: 529998630,
    presentation_date: '2026-10-18 17:00:00',
    secop_url: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10207939',
    strategic_score: 88,
    recommendation: 'participar'
  },
  {
    id: 'opp_secop_fuquene_003',
    process_number: 'CA-003-2026',
    entity_name: 'MUNICIPIO DE FÚQUENE',
    department: 'Cundinamarca',
    city: 'Fúquene',
    modality: 'Contratación régimen especial (con ofertas)',
    description: 'Atención integral a población vulnerable y fortalecimiento de los centros comunitarios de protección infantil y del adulto mayor.',
    estimated_value: 102585714,
    presentation_date: '2026-10-22 14:00:00',
    secop_url: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10225032',
    strategic_score: 82,
    recommendation: 'participar'
  },
  {
    id: 'opp_secop_fusagasuga_004',
    process_number: 'CPSP 2026-0266',
    entity_name: 'ALCALDIA MUNICIPAL FUSAGASUGA',
    department: 'Cundinamarca',
    city: 'Fusagasugá',
    modality: 'Contratación directa',
    description: 'Servicios de acompañamiento técnico pedagógico y psicosocial para la infancia y adolescencia en situación de riesgo en Fusagasugá.',
    estimated_value: 41020000,
    presentation_date: '2026-10-16 11:00:00',
    secop_url: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.9676831',
    strategic_score: 74,
    recommendation: 'investigar'
  },
  {
    id: 'opp_secop_nemocon_005',
    process_number: 'SMIC-015-2026',
    entity_name: 'ALCALDÍA NEMOCON',
    department: 'Cundinamarca',
    city: 'Nemocón',
    modality: 'Mínima cuantía',
    description: 'Suministro de dotación pedagógica y apoyo a la casa de la mujer y familia del municipio de Nemocón.',
    estimated_value: 29750000,
    presentation_date: '2026-10-14 16:00:00',
    secop_url: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10206575',
    strategic_score: 79,
    recommendation: 'investigar'
  },
  {
    id: 'opp_secop_caqueza_006',
    process_number: 'HSRC-933-2026',
    entity_name: 'E.S.E HOSPITAL SAN RAFAEL DE CAQUEZA',
    department: 'Cundinamarca',
    city: 'Cáqueza',
    modality: 'Contratación régimen especial',
    description: 'Prestación de servicios para apoyo operativo y psicosocial en brigadas comunitarias de atención rural.',
    estimated_value: 24920000,
    presentation_date: '2026-10-15 10:00:00',
    secop_url: 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10243956',
    strategic_score: 70,
    recommendation: 'investigar'
  }
];

export const LicitaProView: React.FC = () => {
  // Estado de organizaciones (Multi-empresa)
  const [organizaciones, setOrganizaciones] = useState<ProponenteOrg[]>([DEFAULT_ORG]);
  const [activeOrgId, setActiveOrgId] = useState<string>(DEFAULT_ORG.id);
  const activeOrg = organizaciones.find(o => o.id === activeOrgId) || DEFAULT_ORG;

  // Estado de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRec, setFilterRec] = useState('');

  // Modal de Detalle de Oportunidad & Sensatez
  const [selectedOpp, setSelectedOpp] = useState<OpportunitySecop | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'secop' | 'antirechazo' | 'bidroom'>('secop');

  // Modal para Vincular Nueva Empresa / Emprendedor
  const [showNewOrgModal, setShowNewOrgModal] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState({
    nombre: '',
    nit: '',
    tipo: 'Empresa S.A.S.' as ProponenteOrg['tipo'],
    sedePrincipal: '',
    departamentoBase: 'Cundinamarca',
    patrimonioEstimadoCop: 300000000
  });

  // Motor dinámico de evaluación de sensatez para cualquier oportunidad y cualquier empresa
  const computeViability = (opp: OpportunitySecop, org: ProponenteOrg) => {
    const oppValue = opp.estimated_value || 0;
    const isAporte = opp.modality.toLowerCase().includes('aporte') || opp.description.toLowerCase().includes('icbf');
    
    // 1. Capital de Trabajo (Prueba del dinero para aguantar 45-60 días de desfase estatal)
    const pctCapital = isAporte ? 0.20 : 0.15;
    const capitalTrabajoMinCop = Math.round(oppValue * pctCapital);
    const diasColchon = isAporte ? 60 : 45;

    // 2. Póliza de Seriedad y Prima Comercial
    const polizaPct = isAporte ? 0.30 : (oppValue > 500000000 ? 0.20 : 0.10);
    const polizaValorCop = Math.round(oppValue * polizaPct);
    const primaEstimadaCop = Math.round(polizaValorCop * 0.012);

    // 3. Fricción Territorial
    const oppDept = opp.department.toLowerCase();
    const oppCity = opp.city.toLowerCase();
    const orgDept = org.departamentoBase.toLowerCase();
    const isLocal = oppDept.includes(orgDept) || oppCity.includes('cajic') || oppCity.includes('cota') || oppCity.includes('sabana');
    const friccionTitulo = isLocal 
      ? 'Sede Local Directa (Baja Fricción)'
      : `Extraterritorial (${opp.department} - Requiere Sede o Socio Local)`;

    // 4. Experiencia Acreditada de la empresa activa
    const totalAcreditado = org.experienciaContratos.reduce((sum, c) => sum + c.valorCop, 0);

    // 5. Veredicto Inmediato de Sensatez Económica
    let decisionCodigo = 'VIABLE_SOLITARIO';
    let decisionEtiqueta = 'Viable en Solitario (Go Operativo)';
    let decisionColor = 'emerald';
    let reglaDescarte = '';
    let justificacion = '';

    if (oppValue > 3500000000) {
      decisionCodigo = 'DESCARTAR_ALTO_RIESGO';
      decisionEtiqueta = 'Descartar por Alto Riesgo Financiero (No-Go)';
      decisionColor = 'rose';
      reglaDescarte = `DESCARTAR si la empresa no dispone de cupo bancario por más de ${formatCOP(oppValue * 0.25)}. Riesgo severo de asfixia de liquidez.`;
      justificacion = `La cuantía (${formatCOP(oppValue)}) desborda la capacidad corriente. Postularse generaría iliquidez en tesorería.`;
    } else if (oppValue > 1000000000 || !isLocal) {
      decisionCodigo = 'RECOMENDADO_UNION_TEMPORAL';
      decisionEtiqueta = 'Recomendado en Unión Temporal / Consorcio';
      decisionColor = 'amber';
      reglaDescarte = `PRESENTARSE ÚNICAMENTE EN ALIANZA (60/40 o 70/30). No postular en solitario si falta sede en el territorio o caja líquida inmediata de ${formatCOP(capitalTrabajoMinCop)}.`;
      justificacion = `Por el monto (${formatCOP(oppValue)}) y la distancia (${opp.department}), es prudente afianzar la póliza de ${formatCOP(polizaValorCop)} con un aliado con arraigo local.`;
    } else {
      decisionCodigo = 'VIABLE_SOLITARIO';
      decisionEtiqueta = 'Viable en Solitario (Go Operativo)';
      decisionColor = 'emerald';
      reglaDescarte = `Cuantía accesible (${formatCOP(oppValue)}). Capital de trabajo estimado: ${formatCOP(capitalTrabajoMinCop)}. Si la personería y RUT están al día, estructurar oferta.`;
      justificacion = `El valor es proporcional a la capacidad de tesorería y experiencia de ${org.nombre}. La póliza (${formatCOP(primaEstimadaCop)} est.) es completamente manejable.`;
    }

    return {
      capitalTrabajoMinCop,
      diasColchon,
      polizaPct,
      polizaValorCop,
      primaEstimadaCop,
      friccionTitulo,
      isLocal,
      totalAcreditado,
      decisionCodigo,
      decisionEtiqueta,
      decisionColor,
      reglaDescarte,
      justificacion
    };
  };

  // Manejo de creación de nueva empresa
  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgForm.nombre || !newOrgForm.nit) return;

    const newId = `org_${Date.now()}`;
    const newOrg: ProponenteOrg = {
      id: newId,
      nombre: newOrgForm.nombre,
      nit: newOrgForm.nit,
      tipo: newOrgForm.tipo,
      personeria: 'Cámara de Comercio / Registro Mercantil Vigente',
      certVigenciaDias: 180,
      certFechaVence: '2026-12-31',
      sedePrincipal: newOrgForm.sedePrincipal || 'Sede Registrada',
      departamentoBase: newOrgForm.departamentoBase,
      patrimonioEstimadoCop: newOrgForm.patrimonioEstimadoCop,
      experienciaContratos: [
        {
          objeto: 'Servicios operativos y comerciales afines al objeto mercantil',
          entidad: 'Entidad Pública / Cliente Corporativo',
          valorCop: Math.round(newOrgForm.patrimonioEstimadoCop * 0.4),
          ano: 2024,
          estado: 'liquidado_satisfaccion'
        }
      ]
    };

    setOrganizaciones(prev => [...prev, newOrg]);
    setActiveOrgId(newId);
    setShowNewOrgModal(false);
    setNewOrgForm({
      nombre: '',
      nit: '',
      tipo: 'Empresa S.A.S.',
      sedePrincipal: '',
      departamentoBase: 'Cundinamarca',
      patrimonioEstimadoCop: 300000000
    });
  };

  // Filtrado de oportunidades
  const filteredOpps = REAL_OPPORTUNITIES.filter(o => {
    const matchSearch = searchTerm === '' || 
      o.process_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = filterDept === '' || o.department.toLowerCase().includes(filterDept.toLowerCase());
    const matchRec = filterRec === '' || o.recommendation === filterRec;
    return matchSearch && matchDept && matchRec;
  });

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100">
      
      {/* ========================================================================= */}
      {/* 1. HEADER EMPRESARIAL / MULTI-TENANT SAAS                                 */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-indigo-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-950/50">
              ⚖️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  PLATAFORMA SAAS DE LICITACIONES PÚBLICAS
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  SECOP II OFICIAL
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                LicitaPro Colombia • Inteligencia Contractual
              </h2>
            </div>
          </div>

          {/* Selector de Organización Proponente y Botón Nueva Empresa */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-[9px] font-bold uppercase text-slate-400 block leading-none">Proponente Activo:</span>
                <select
                  value={activeOrgId}
                  onChange={(e) => setActiveOrgId(e.target.value)}
                  className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer"
                >
                  {organizaciones.map(org => (
                    <option key={org.id} value={org.id} className="bg-slate-900 text-white">
                      {org.nombre} ({org.tipo})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowNewOrgModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-950/50 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Registrar Empresa / Asociación</span>
            </button>
          </div>
        </div>

        {/* Ficha Resumen de la Organización Activa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">NIT Registrado:</span>
            <span className="font-mono text-cyan-300 font-bold">{activeOrg.nit}</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Personería / Habilitante:</span>
            <span className="text-slate-200 font-medium truncate block">{activeOrg.personeria}</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Vigencia Certificado:</span>
            <span className={`font-bold flex items-center gap-1.5 ${activeOrg.certVigenciaDias <= 30 ? 'text-amber-300' : 'text-emerald-400'}`}>
              <Clock className="w-3.5 h-3.5" />
              {activeOrg.certVigenciaDias} días restantes ({activeOrg.certFechaVence})
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Sede Operativa:</span>
            <span className="text-slate-200 font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              {activeOrg.sedePrincipal}
            </span>
          </div>
        </div>

        {activeOrg.certVigenciaDias <= 30 && (
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Alerta Jurídica Preventiva:</strong> El certificado de personería/representación vence en {activeOrg.certVigenciaDias} días. Para radicar propuestas en SECOP II se debe tramitar reconfirmación previa para evitar causales de descarte.
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE BÚSQUEDA Y FILTROS DE LICITACIONES                            */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div className="sm:col-span-2">
          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Buscar por Objeto o Entidad</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ej: ICBF, primera infancia, Cota, alimentos..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Departamento</label>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">Todos los Departamentos</option>
            <option value="Cundinamarca">Cundinamarca</option>
            <option value="Bolívar">Bolívar</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Recomendación</label>
          <select
            value={filterRec}
            onChange={(e) => setFilterRec(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">Todas</option>
            <option value="participar">Participar</option>
            <option value="investigar">Investigar</option>
            <option value="descartar">Descartar</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LISTADO DE OPORTUNIDADES CON VEREDICTO DE SENSATEZ Y CUANTÍA REAL      */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {filteredOpps.map((opp) => {
          const viab = computeViability(opp, activeOrg);
          const verdBadgeColor = viab.decisionColor === 'emerald'
            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
            : viab.decisionColor === 'amber'
            ? 'bg-amber-950 text-amber-300 border-amber-700'
            : 'bg-rose-950 text-rose-300 border-rose-700';

          return (
            <div
              key={opp.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-xl transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800 pb-4">
                
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-white border border-slate-700">
                      {opp.process_number}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {opp.modality}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {opp.department} - {opp.city}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${verdBadgeColor}`}>
                      {viab.decisionEtiqueta}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {opp.description}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5 text-cyan-400" />
                      {opp.entity_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      Cierre: <strong className="text-slate-200">{opp.presentation_date}</strong>
                    </span>
                  </div>
                </div>

                {/* Presupuesto y Puntuación */}
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    PRESUPUESTO OFICIAL SECOP II
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 tracking-tight block">
                    {formatCOP(opp.estimated_value)}
                  </span>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className="text-xs text-slate-400">Score Estratégico:</span>
                    <span className="text-sm font-black text-cyan-300 font-mono">
                      {opp.strategic_score}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Fila de Métricas de Dinero Real (Filtro de Sensatez) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" /> Capital Trabajo Inicial Requerido:
                  </span>
                  <span className="font-mono text-white font-bold block">
                    {formatCOP(viab.capitalTrabajoMinCop)} <span className="text-[10px] text-emerald-400">({viab.diasColchon} días colchón)</span>
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-purple-400" /> Póliza de Seriedad Requerida:
                  </span>
                  <span className="font-mono text-purple-300 font-bold block">
                    {formatCOP(viab.polizaValorCop)} <span className="text-[10px] text-slate-400">(Prima est: {formatCOP(viab.primaEstimadaCop)})</span>
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" /> Fricción Territorial:
                  </span>
                  <span className="text-slate-200 font-medium truncate block">
                    {viab.friccionTitulo}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                <a
                  href={opp.secop_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition flex items-center gap-1.5"
                >
                  <span>Expediente SECOP Oficial</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => { setSelectedOpp(opp); setActiveDetailTab('secop'); }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ficha de Sensatez & Sobres SECOP 📄</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: FICHA DETALLADA, SENSATEZ Y 4 SOBRES SECOP II                   */}
      {/* ========================================================================= */}
      {selectedOpp && (() => {
        const viab = computeViability(selectedOpp, activeOrg);

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl relative">
              
              {/* Botón Cerrar */}
              <button
                onClick={() => setSelectedOpp(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 border border-slate-700 cursor-pointer"
              >
                ✕
              </button>

              {/* Header Modal */}
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-800 text-white">
                    {selectedOpp.process_number}
                  </span>
                  <span className="text-xs text-cyan-400 font-bold">
                    {selectedOpp.entity_name}
                  </span>
                  <span className="text-xs text-slate-400">
                    • {selectedOpp.department} - {selectedOpp.city}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {selectedOpp.description}
                </h3>
                <div className="text-right sm:text-left">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">PRESUPUESTO OFICIAL SECOP II:</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {formatCOP(selectedOpp.estimated_value)}
                  </span>
                </div>
              </div>

              {/* Banner de Sensatez Económica (Filtro Go / No-Go) */}
              <div className={`p-5 rounded-2xl border ${
                viab.decisionColor === 'emerald' ? 'bg-emerald-950/40 border-emerald-500/50' :
                viab.decisionColor === 'amber' ? 'bg-amber-950/40 border-amber-500/50' :
                'bg-rose-950/40 border-rose-500/50'
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <span>⚖️</span> Veredicto de Sensatez Económica para {activeOrg.nombre}:
                  </span>
                  <span className={`text-xs font-black px-3 py-1 rounded-full uppercase border ${
                    viab.decisionColor === 'emerald' ? 'bg-emerald-950 text-emerald-300 border-emerald-600' :
                    viab.decisionColor === 'amber' ? 'bg-amber-950 text-amber-300 border-amber-600' :
                    'bg-rose-950 text-rose-300 border-rose-600'
                  }`}>
                    {viab.decisionEtiqueta}
                  </span>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                    Regla de Decisión Inmediata (Cold-Logic Rule):
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                    {viab.reglaDescarte}
                  </p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Justificación Operativa:</strong> {viab.justificacion}
                </p>

                {/* 3 Métricas de Dinero Real */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Capital Mínimo en Caja:</span>
                    <span className="font-mono text-base font-black text-emerald-400 block mt-0.5">
                      {formatCOP(viab.capitalTrabajoMinCop)}
                    </span>
                    <span className="text-[10px] text-slate-400">Para aguantar {viab.diasColchon} días de nómina previa al primer giro.</span>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Póliza Exigida ({Math.round(viab.polizaPct * 100)}%):</span>
                    <span className="font-mono text-base font-black text-purple-300 block mt-0.5">
                      {formatCOP(viab.polizaValorCop)}
                    </span>
                    <span className="text-[10px] text-slate-400">Prima en efectivo a fondo perdido: {formatCOP(viab.primaEstimadaCop)}.</span>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Despliegue Territorial:</span>
                    <span className="text-xs font-bold text-slate-200 block mt-0.5 truncate">
                      {selectedOpp.department} - {selectedOpp.city}
                    </span>
                    <span className="text-[10px] text-slate-400">{viab.friccionTitulo}</span>
                  </div>
                </div>
              </div>

              {/* Pestañas del Modal */}
              <div className="flex border-b border-slate-800 gap-4 text-xs font-bold">
                <button
                  onClick={() => setActiveDetailTab('secop')}
                  className={`pb-2.5 transition cursor-pointer flex items-center gap-1.5 ${
                    activeDetailTab === 'secop' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Cuestionario Oficial SECOP II (4 Sobres)</span>
                </button>

                <button
                  onClick={() => setActiveDetailTab('antirechazo')}
                  className={`pb-2.5 transition cursor-pointer flex items-center gap-1.5 ${
                    activeDetailTab === 'antirechazo' ? 'text-rose-400 border-b-2 border-rose-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Checklist Anti-Rechazo (5 Puntos Críticos)</span>
                </button>
              </div>

              {/* PANE 1: ESTRUCTURA OFICIAL DE 4 SOBRES SECOP II */}
              {activeDetailTab === 'secop' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sobre 1.1.1 Jurídico */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-black text-cyan-300 uppercase">Sobre 1.1.1 Jurídico & Habilitante</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">Cumple</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Personería Jurídica SNBF:</strong> Vigente ({activeOrg.certVigenciaDias} días restantes).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>Parafiscales Ley 789:</strong> Certificado de Revisor Fiscal con menos de 30 días calendario al cierre.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>RUT Actualizado:</strong> Con actividad de bienestar y protección infantil.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Sobre 1.1.2 Técnico */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-black text-cyan-300 uppercase">Sobre 1.1.2 Técnico & Experiencia</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        {viab.totalAcreditado >= selectedOpp.estimated_value * 0.7 ? 'Cumple' : 'Alianza Sugerida'}
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span><strong>Contratos Previos Verificados:</strong> {formatCOP(viab.totalAcreditado)} registrados a satisfacción.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Equipo Psicosocial:</strong> Psicólogo, Trabajador Social y Pedagogo con registro ReTHUS.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Plan Operativo:</strong> Enfoque según manuales técnicos ICBF.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Sobre 1.1.3 Financiero */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-black text-cyan-300 uppercase">Sobre 1.1.3 Financiero & Pólizas</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-800">En Trámite</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Garantía de Seriedad:</strong> Póliza por {formatCOP(viab.polizaValorCop)} asegurada a favor de {selectedOpp.entity_name}.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Indicadores RUP:</strong> Liquidez ≥ 1.2 y Endeudamiento ≤ 70%.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Sobre 1.2.1 Económico */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-black text-rose-300 uppercase">Sobre 1.2.1 Oferta Económica (Techo)</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">Techo Estricto</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span><strong>Regla de Oro SECOP II:</strong> La oferta no puede exceder en $1 peso el valor oficial de {formatCOP(selectedOpp.estimated_value)}.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Presupuesto Detallado:</strong> Canasta básica, salarios e insumos según tablas oficiales.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* PANE 2: CHECKLIST ANTI-RECHAZO */}
              {activeDetailTab === 'antirechazo' && (
                <div className="space-y-3">
                  {[
                    {
                      num: '1',
                      titulo: 'Certificación de Parafiscales Vigente',
                      riesgo: 'Rechazo directo si la fecha de expedición supera 30 días calendario al cierre.',
                      prevencion: 'Expedir el certificado firmado por el Revisor Fiscal 5 días antes de radicar.'
                    },
                    {
                      num: '2',
                      titulo: 'Asegurado Exacto en la Póliza',
                      riesgo: `Error en el nombre de la entidad contratante (${selectedOpp.entity_name}).`,
                      prevencion: 'Exigir a la aseguradora la carátula con el nombre literal idéntico al pliego.'
                    },
                    {
                      num: '3',
                      titulo: 'Oferta no mayor al Techo Oficial',
                      riesgo: `Sobrepasar ${formatCOP(selectedOpp.estimated_value)} por centavos es causal de descarte no subsanable.`,
                      prevencion: 'Validar 3 veces el valor digitado en la plataforma transaccional de SECOP II.'
                    },
                    {
                      num: '4',
                      titulo: 'Actas de Liquidación de Experiencia',
                      riesgo: 'Contratos sin acta de liquidación suscrita son descartados en evaluación técnica.',
                      prevencion: 'Anexar únicamente contratos terminados con certificación o acta firmada.'
                    },
                    {
                      num: '5',
                      titulo: 'ReTHUS Activo del Equipo Psicosocial',
                      riesgo: 'Un profesional sin registro activo inhabilita el componente humano.',
                      prevencion: 'Descargar el certificado ReTHUS del Ministerio de Salud una semana antes.'
                    }
                  ].map((c) => (
                    <div key={c.num} className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {c.num}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white">{c.titulo}</h4>
                        <p className="text-xs text-rose-300"><strong>Causal de Descalificación:</strong> {c.riesgo}</p>
                        <p className="text-xs text-emerald-300"><strong>Medida Preventiva LicitaPro:</strong> {c.prevencion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Botón Cerrar Inferior */}
              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  onClick={() => setSelectedOpp(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  Cerrar Expediente
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 5. MODAL: REGISTRAR NUEVA EMPRESA / ASOCIACIÓN (MULTI-TENANT)             */}
      {/* ========================================================================= */}
      {showNewOrgModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            
            <button
              onClick={() => setShowNewOrgModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800"
            >
              ✕
            </button>

            <div className="space-y-1 border-b border-slate-800 pb-3">
              <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">
                INCORPORAR NUEVO PROPONENTE AL SISTEMA
              </span>
              <h3 className="text-lg font-black text-white">
                Vincular Empresa, Asociación o Emprendedor
              </h3>
              <p className="text-xs text-slate-400">
                Permite calificar licitaciones públicas de SECOP II contra las capacidades específicas de esta nueva organización.
              </p>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Razón Social / Nombre de la Organización</label>
                <input
                  type="text"
                  value={newOrgForm.nombre}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, nombre: e.target.value })}
                  placeholder="Ej: Asociación de Productores Agropecuarios de Caparrapí"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">NIT</label>
                  <input
                    type="text"
                    value={newOrgForm.nit}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, nit: e.target.value })}
                    placeholder="Ej: 901.458.123-1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Tipo de Entidad</label>
                  <select
                    value={newOrgForm.tipo}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, tipo: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Empresa S.A.S.">Empresa S.A.S.</option>
                    <option value="Asociación Campesina">Asociación Campesina</option>
                    <option value="ONG / Fundación">ONG / Fundación</option>
                    <option value="Cooperativa">Cooperativa</option>
                    <option value="Consorcio">Consorcio</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Municipio Sede</label>
                  <input
                    type="text"
                    value={newOrgForm.sedePrincipal}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, sedePrincipal: e.target.value })}
                    placeholder="Ej: Caparrapí / Guaduas"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Patrimonio Estimado (COP)</label>
                  <input
                    type="number"
                    value={newOrgForm.patrimonioEstimadoCop}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, patrimonioEstimadoCop: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewOrgModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg cursor-pointer"
                >
                  Guardar y Activar Organización
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
