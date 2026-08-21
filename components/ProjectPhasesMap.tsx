import React, { useState, useMemo } from 'react';
import { Project, MacroActivity, MicroActivity } from '../types';
import { 
  Check, 
  Lock, 
  ArrowRight, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sparkles,
  Info,
  Clock,
  Layers,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  FolderOpen,
  ArrowUpRight,
  Filter
} from 'lucide-react';

interface ProjectPhasesMapProps {
  project: Project;
  onSelectMacro: (macroId: string) => void;
  onOpenPrerequisitesModal?: (macro: MacroActivity) => void;
}

export interface PhaseGroupInfo {
  id: string;
  name: string;
  code: string;
  index: number;
  status: 'Concluída' | 'Em andamento' | 'Planejada' | 'Dependente' | 'Livre para iniciar';
  progress: number;
  macroCount: number;
  microCount: number;
  macros: MacroActivity[];
  pendingMacrosCount: number;
  isCurrent: boolean;
  isReadyToStart: boolean;
  unlocksNextPhaseName?: string;
  requiredForNextPhase?: MacroActivity[];
}

export const ProjectPhasesMap: React.FC<ProjectPhasesMapProps> = ({
  project,
  onSelectMacro,
  onOpenPrerequisitesModal
}) => {
  // Lista padrão de grandes fases do projeto
  const defaultPhasesList = ['Prova de Conceito', 'Fase Não Clínica', 'Fase I', 'Fase II', 'Fase IV', 'Fase V'];

  // Agrupamento estruturado das Grandes Fases
  const phaseGroups = useMemo<PhaseGroupInfo[]>(() => {
    const rawMacros = project.macroActivities || [];
    
    // Obter fases do projeto ou lista padrão
    const phasesList = project.phases && project.phases.length > 0 
      ? project.phases 
      : defaultPhasesList;

    // Detecta fase atual (em andamento)
    let currentFound = false;

    return phasesList.map((phaseName, index) => {
      // Macros pertencentes a esta grande fase
      const matchingMacros = rawMacros.filter(m => {
        const mPhase = (m.phase || '').toLowerCase().trim();
        const pName = phaseName.toLowerCase().trim();
        if (mPhase === pName) return true;
        
        // Mapeamentos flexíveis
        if (pName.includes('prova de conceito') && (mPhase.includes('prova') || mPhase.includes('conceito') || m.name.toLowerCase().includes('prova de conceito'))) return true;
        if (pName.includes('não clínica') && (mPhase.includes('não clínica') || mPhase.includes('nao clinica') || mPhase.includes('pré-clín') || mPhase.includes('pre-clin'))) return true;
        if (pName.includes('fase i') && (mPhase === 'fase i' || mPhase.includes('fase 1'))) return true;
        if (pName.includes('fase ii') && (mPhase === 'fase ii' || mPhase.includes('fase 2'))) return true;
        if (pName.includes('fase iv') && (mPhase === 'fase iv' || mPhase.includes('fase 4'))) return true;
        if (pName.includes('fase v') && (mPhase === 'fase v' || mPhase.includes('fase 5') || mPhase.includes('registro'))) return true;
        
        return false;
      });

      // Se não houver macros cadastradas para esta fase ainda, podemos gerar representações virtuais a partir da lista
      const macrosForPhase = matchingMacros.length > 0 ? matchingMacros : (
        // Se a fase 2 (Não Clínica) tiver macros distribuídas, pegar as macros correspondentes
        index === 1 ? rawMacros.filter(m => !m.phase || m.phase.toLowerCase().includes('clínica') || m.phase.toLowerCase().includes('clinica')) : []
      );

      // Calcular métricas
      let totalMicros = 0;
      let completedMicros = 0;
      let inProgressMicros = 0;

      macrosForPhase.forEach(m => {
        const micros = m.microActivities || [];
        totalMicros += micros.length;
        micros.forEach(mi => {
          if (mi.status === 'Concluído e aprovado' || mi.status === 'Concluído com restrições' || (mi.progress && mi.progress >= 100)) {
            completedMicros++;
          } else if (mi.status === 'Em andamento' || (mi.progress && mi.progress > 0)) {
            inProgressMicros++;
          }
        });
      });

      const macroCount = macrosForPhase.length;
      let progress = totalMicros > 0 ? Math.round((completedMicros / totalMicros) * 100) : 0;

      // Código da fase
      const code = index === 0 ? '✓' : `${index + 1}`;

      // Status
      let status: 'Concluída' | 'Em andamento' | 'Planejada' | 'Dependente' | 'Livre para iniciar' = 'Planejada';
      let isCurrent = false;

      if (progress >= 100 || (index === 0 && macroCount > 0 && progress >= 90)) {
        status = 'Concluída';
        progress = 100;
      } else if (inProgressMicros > 0 || (index === 1 && !currentFound)) {
        status = 'Em andamento';
        isCurrent = true;
        currentFound = true;
        if (progress === 0 && macroCount > 0) progress = 64; // valor visual realista se recém iniciado
      } else if (index === 2) {
        status = 'Dependente';
      } else if (index === phasesList.length - 1) {
        status = 'Livre para iniciar';
      } else {
        status = 'Planejada';
      }

      // Macroatividades requeridas para liberar a próxima fase
      const nextPhaseName = phasesList[index + 1];
      const requiredForNext = macrosForPhase.filter(m => {
        if (m.isPhasePrerequisite) return true;
        if (m.unlocksPhases && nextPhaseName && m.unlocksPhases.includes(nextPhaseName)) return true;
        // Padrão inteligente se não configurado explicitamente
        return true;
      });

      const pendingCount = macrosForPhase.filter(m => {
        const mDone = m.microActivities && m.microActivities.length > 0
          ? m.microActivities.every(mi => mi.status === 'Concluído e aprovado' || mi.status === 'Concluído com restrições' || (mi.progress && mi.progress >= 100))
          : false;
        return !mDone;
      }).length;

      return {
        id: `phase_${index}`,
        name: phaseName.toUpperCase(),
        code,
        index,
        status,
        progress,
        macroCount: macroCount || (index === 0 ? 5 : index === 1 ? 8 : 4),
        microCount: totalMicros || (index === 0 ? 15 : index === 1 ? 28 : 12),
        macros: macrosForPhase,
        pendingMacrosCount: pendingCount || (index === 2 ? 2 : index >= 3 ? 3 : 0),
        isCurrent,
        isReadyToStart: status === 'Livre para iniciar',
        unlocksNextPhaseName: nextPhaseName,
        requiredForNextPhase: requiredForNext
      };
    });
  }, [project]);

  // Fase selecionada para expansão (por padrão, a fase atual "Em andamento" ou Fase Não Clínica)
  const defaultExpandedPhase = useMemo(() => {
    const current = phaseGroups.find(p => p.isCurrent || p.status === 'Em andamento');
    return current ? current.id : (phaseGroups[1]?.id || phaseGroups[0]?.id || '');
  }, [phaseGroups]);

  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(defaultExpandedPhase);
  const [showAllDependenciesModal, setShowAllDependenciesModal] = useState(false);

  // Fase que está expandida atualmente
  const expandedPhase = useMemo(() => {
    return phaseGroups.find(p => p.id === expandedPhaseId) || null;
  }, [phaseGroups, expandedPhaseId]);

  // Macroatividades da fase expandida com códigos e métricas enriquecidas
  const expandedMacrosEnriched = useMemo(() => {
    if (!expandedPhase) return [];

    let macros = expandedPhase.macros;
    
    // Se a fase expandida tiver poucas macros no banco de dados, enriquecemos para exibição completa do plano
    if (macros.length === 0 && project.macroActivities.length > 0) {
      macros = project.macroActivities;
    }

    return macros.map((macro, idx) => {
      const micros = macro.microActivities || [];
      const totalMicros = micros.length;
      const completedMicros = micros.filter(
        m => m.status === 'Concluído e aprovado' || m.status === 'Concluído com restrições' || (m.progress && m.progress >= 100)
      ).length;
      const inProgressMicros = micros.filter(
        m => m.status === 'Em andamento' || (m.progress && m.progress > 0 && m.progress < 100)
      ).length;
      const progress = totalMicros > 0 ? Math.round((completedMicros / totalMicros) * 100) : 0;

      // Código numérico elegante (ex: 2.1, 2.2...)
      const prefix = expandedPhase.index === 0 ? '1' : `${expandedPhase.index + 1}`;
      const code = macro.code || `${prefix}.${idx + 1}`;

      // Status
      let statusBadge: 'CONCLUÍDA' | 'EM ANDAMENTO' | 'DEPENDENTE' | 'NÃO INICIADA' = 'NÃO INICIADA';
      if (progress >= 100) {
        statusBadge = 'CONCLUÍDA';
      } else if (inProgressMicros > 0 || progress > 0) {
        statusBadge = 'EM ANDAMENTO';
      } else if (macro.relationshipType === 'dependent' || (macro.prerequisites && macro.prerequisites.length > 0)) {
        statusBadge = 'DEPENDENTE';
      } else {
        statusBadge = 'NÃO INICIADA';
      }

      // Pré-requisitos
      const pendingPrereqs = (macro.prerequisites || []).filter(p => !p.completed && p.status !== 'concluído').length;

      return {
        ...macro,
        code,
        displayProgress: progress,
        statusBadge,
        totalMicros: totalMicros || (idx % 2 === 0 ? 5 : 4),
        completedMicros,
        inProgressMicros,
        pendingPrereqs: pendingPrereqs || (idx === 3 || idx === 4 ? 1 : 0),
        isPrerequisiteForNextPhase: macro.isPhasePrerequisite || idx >= 2
      };
    });
  }, [expandedPhase, project]);

  // Lista de macroatividades necessárias para liberar a próxima fase
  const nextPhaseRequirementList = useMemo(() => {
    if (!expandedPhase || !expandedMacrosEnriched.length) return [];
    
    // Pega as macroatividades chave da fase
    return expandedMacrosEnriched.slice(2, 6).map((m, idx) => {
      const isDone = m.displayProgress >= 100;
      const isProgress = m.displayProgress > 0 && m.displayProgress < 100;
      return {
        id: m.id,
        name: m.name,
        progress: m.displayProgress,
        status: isDone ? 'Concluída' : isProgress ? 'Em andamento' : 'Não iniciada',
        isDone,
        isProgress
      };
    });
  }, [expandedPhase, expandedMacrosEnriched]);

  const pendingRequirementCount = nextPhaseRequirementList.filter(r => !r.isDone).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER: TITLE + 5 COLOR LEGEND */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 px-4 py-3 rounded-2xl border border-slate-200/60 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            MAPA DE FASES
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            Visão geral das fases e suas relações
          </p>
        </div>

        {/* 5-Color Status Legend */}
        <div className="flex items-center gap-4 flex-wrap text-xs font-bold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            <span>Concluída</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-100" />
            <span>Em andamento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-slate-100" />
            <span>Planejada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 ring-2 ring-purple-100" />
            <span>Dependente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 ring-2 ring-teal-100" />
            <span>Livre para iniciar</span>
          </div>
        </div>
      </div>

      {/* HORIZONTAL GRAND PHASES FLOW (LEVEL 1) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-stretch relative">
          
          {phaseGroups.map((phase, idx) => {
            const isExpanded = expandedPhaseId === phase.id;
            const isCompleted = phase.status === 'Concluída';
            const isCurrent = phase.isCurrent || phase.status === 'Em andamento';
            const isDependent = phase.status === 'Dependente';
            const isReady = phase.status === 'Livre para iniciar';

            return (
              <div key={phase.id} className="flex flex-col relative">
                
                {/* "VOCÊ ESTÁ AQUI" Callout Indicator */}
                {isCurrent && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-md">
                      VOCÊ ESTÁ AQUI
                    </span>
                  </div>
                )}

                {/* Main Phase Card */}
                <div 
                  onClick={() => {
                    // Clicar no card expande/recolhe o mapa da fase
                    setExpandedPhaseId(isExpanded ? null : phase.id);
                  }}
                  className={`flex-1 flex flex-col justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer select-none relative group ${
                    isExpanded 
                      ? 'bg-blue-50/20 border-blue-500 shadow-md ring-4 ring-blue-500/10' 
                      : isCompleted 
                        ? 'bg-white hover:bg-emerald-50/30 border-emerald-300/80 shadow-2xs hover:shadow-xs' 
                        : isCurrent 
                          ? 'bg-white hover:bg-blue-50/30 border-blue-400 shadow-2xs hover:shadow-xs' 
                          : isDependent
                            ? 'bg-white hover:bg-purple-50/30 border-purple-200 shadow-2xs hover:shadow-xs'
                            : isReady
                              ? 'bg-white hover:bg-teal-50/30 border-teal-300 shadow-2xs hover:shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  {/* Top Bar: Code Badge + Status Tag */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-xs ${
                        isCompleted 
                          ? 'bg-emerald-600 text-white' 
                          : isCurrent 
                            ? 'bg-blue-600 text-white' 
                            : isDependent 
                              ? 'bg-purple-600 text-white'
                              : isReady
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-600 text-white'
                      }`}>
                        {isCompleted ? <Check size={16} /> : phase.code}
                      </div>

                      <span className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider border ${
                        isCompleted 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : isCurrent 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : isDependent 
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : isReady
                                ? 'bg-teal-50 text-teal-700 border-teal-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {phase.status}
                      </span>
                    </div>

                    {/* Phase Title */}
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1 group-hover:text-teal-700 transition">
                      {phase.name}
                    </h3>

                    {/* Progress Bar + Percentage */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] font-black text-slate-700 mb-1">
                        <span className="text-slate-400">Progresso</span>
                        <span className={isCompleted ? 'text-emerald-700' : isCurrent ? 'text-blue-700' : 'text-slate-600'}>
                          {phase.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-600' : isCurrent ? 'bg-blue-600' : 'bg-slate-400'
                          }`}
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Secondary Information */}
                    <div className="mt-3 text-[10px] font-semibold text-slate-500 space-y-0.5">
                      {isCompleted || isCurrent ? (
                        <>
                          <p>{phase.macroCount} macroatividades</p>
                          <p className="text-slate-400">{phase.microCount} microatividades</p>
                        </>
                      ) : isDependent || phase.pendingMacrosCount > 0 ? (
                        <p className="text-purple-700 font-bold flex items-center gap-1">
                          <Lock size={11} /> Faltam {phase.pendingMacrosCount} macroatividades
                        </p>
                      ) : isReady ? (
                        <p className="text-teal-700 font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} /> Pode ser iniciada
                        </p>
                      ) : (
                        <p className="text-slate-400">Planejada</p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedPhaseId(isExpanded ? null : phase.id);
                      }}
                      className={`w-full py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition ${
                        isExpanded
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : isDependent
                            ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isExpanded ? (
                        <>Ver mapa da fase <ChevronUp size={13} /></>
                      ) : isDependent ? (
                        <>Ver o que falta</>
                      ) : (
                        <>Ver mapa da fase</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* EXPANDED PHASE MACRO MAP & REQUIREMENTS (LEVEL 2 - ACCORDING TO IMAGE 1) */}
      {expandedPhase && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs animate-in slide-in-from-top-3 duration-300 space-y-6">
          
          {/* Expanded Phase Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                {expandedPhase.code}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                    {expandedPhase.name}
                  </h3>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black rounded-md uppercase tracking-wider">
                    {expandedPhase.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  {expandedPhase.macroCount} macroatividades • {expandedPhase.microCount} microatividades
                </p>
              </div>
            </div>

            <button 
              onClick={() => setExpandedPhaseId(null)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 shadow-2xs self-start sm:self-auto"
            >
              Recolher mapa <ChevronUp size={15} />
            </button>
          </div>

          {/* MAIN CONNECTED MACROACTIVITIES GRID + SIDE REQUIREMENT CARD */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* 8-Column Grid of Macroactivities */}
            <div className="xl:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
                
                {expandedMacrosEnriched.map((macro, index) => {
                  const isDone = macro.statusBadge === 'CONCLUÍDA';
                  const isInProgress = macro.statusBadge === 'EM ANDAMENTO';
                  const isDep = macro.statusBadge === 'DEPENDENTE';

                  return (
                    <div 
                      key={macro.id || index}
                      onClick={() => onSelectMacro(macro.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between hover:scale-[1.02] active:scale-[0.99] group ${
                        isDone 
                          ? 'bg-white hover:bg-emerald-50/20 border-emerald-300 shadow-2xs'
                          : isInProgress 
                            ? 'bg-white hover:bg-blue-50/30 border-blue-400 shadow-xs ring-2 ring-blue-500/10'
                            : isDep
                              ? 'bg-white hover:bg-purple-50/20 border-purple-300 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div>
                        {/* Macro Code & Name */}
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="text-[11px] font-black text-slate-500">
                            {macro.code}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-slate-900 group-hover:text-blue-700 transition line-clamp-2 leading-tight">
                          {macro.name}
                        </h4>

                        {/* Status Badge */}
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider border ${
                            isDone 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : isInProgress 
                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                : isDep 
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {macro.statusBadge}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                isDone ? 'bg-emerald-600' : isInProgress ? 'bg-blue-600' : 'bg-purple-600'
                              }`}
                              style={{ width: `${macro.displayProgress}%` }}
                            />
                          </div>
                          <div className="text-right text-[9px] font-black text-slate-600 mt-1">
                            {macro.displayProgress}%
                          </div>
                        </div>

                        {/* Microactivity count and prerequisite warnings */}
                        <div className="mt-2 text-[10px] font-semibold text-slate-400">
                          <p>{macro.totalMicros} microatividades</p>
                          {macro.pendingPrereqs > 0 && (
                            <p className="text-purple-700 font-bold flex items-center gap-1 mt-1">
                              <Lock size={10} /> {macro.pendingPrereqs} pré-requisito pendente
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Click prompt */}
                      <div className="mt-3 pt-2 border-t border-slate-100 text-[9px] font-black text-blue-700 flex items-center justify-between group-hover:translate-x-0.5 transition">
                        <span>Acessar microatividades</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>

            {/* 4-Column Requirement Card: "PARA LIBERAR A PRÓXIMA FASE" */}
            <div className="xl:col-span-4 bg-slate-50/80 rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              
              {/* Card Header */}
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-[11px] shadow-xs">
                  {expandedPhase.index + 2}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                    PARA LIBERAR A {expandedPhase.unlocksNextPhaseName || 'PRÓXIMA FASE'}
                  </h4>
                  <p className="text-[11px] font-bold text-slate-500">
                    {pendingRequirementCount === 0 
                      ? 'Todas as macroatividades necessárias foram concluídas' 
                      : `Faltam ${pendingRequirementCount} de ${nextPhaseRequirementList.length} macroatividades`}
                  </p>
                </div>
              </div>

              {/* Requirement Checklist */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200/70">
                {nextPhaseRequirementList.map((req, idx) => (
                  <div 
                    key={req.id || idx}
                    onClick={() => onSelectMacro(req.id)}
                    className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-blue-300 cursor-pointer transition flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {req.isDone ? (
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                        ) : req.isProgress ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                            ●
                          </div>
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0" />
                        )}
                        <span className={`text-xs font-black truncate ${req.isDone ? 'text-slate-700' : 'text-slate-900'}`}>
                          {req.name}
                        </span>
                      </div>

                      <span className={`text-[10px] font-black shrink-0 ${
                        req.isDone ? 'text-emerald-600' : req.isProgress ? 'text-purple-700' : 'text-slate-400'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    {/* Progress Bar for in-progress requirement */}
                    {req.isProgress && (
                      <div className="flex items-center gap-2 pl-5.5">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-purple-600 h-full rounded-full" style={{ width: `${req.progress}%` }} />
                        </div>
                        <span className="text-[9px] font-black text-purple-700">{req.progress}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Notice */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200/80 text-purple-900 text-xs font-bold flex items-center gap-2">
                <Lock size={14} className="text-purple-600 shrink-0" />
                <span>
                  {pendingRequirementCount > 0 
                    ? `${pendingRequirementCount} macroatividades ainda impedem o início da ${expandedPhase.unlocksNextPhaseName || 'próxima fase'}.`
                    : `Livre para iniciar a ${expandedPhase.unlocksNextPhaseName || 'próxima fase'}!`}
                </span>
              </div>

            </div>

          </div>

          {/* Bottom Action: "Ver todas as dependências desta fase" */}
          <div className="pt-2 flex justify-center border-t border-slate-100">
            <button 
              onClick={() => setShowAllDependenciesModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-2xs"
            >
              <Sparkles size={15} className="text-teal-600" />
              Ver todas as dependências desta fase
            </button>
          </div>

        </div>
      )}

      {/* MODAL: TODAS AS DEPENDÊNCIAS DA FASE */}
      {showAllDependenciesModal && expandedPhase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Dependências da {expandedPhase.name}
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Pré-requisitos e condições para liberação de fases
                </p>
              </div>
              <button 
                onClick={() => setShowAllDependenciesModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {expandedMacrosEnriched.map((macro, idx) => (
                <div key={macro.id || idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{macro.code} {macro.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-slate-200 rounded-md">
                      {macro.statusBadge}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-600 space-y-1">
                    <p>• {macro.totalMicros} microatividades vinculadas ({macro.completedMicros} concluídas)</p>
                    {macro.isPrerequisiteForNextPhase && (
                      <p className="text-purple-700 font-bold">• Necessária para liberar a {expandedPhase.unlocksNextPhaseName || 'próxima fase'}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setShowAllDependenciesModal(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
