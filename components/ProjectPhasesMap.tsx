import React, { useState, useMemo } from 'react';
import { Project, MacroActivity, MicroActivity, Prerequisite } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Check, 
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface ProjectPhasesMapProps {
  project: Project;
  onSelectMacro: (macroId: string) => void;
  onOpenPrerequisitesModal?: (macro: MacroActivity) => void;
}

export const ProjectPhasesMap: React.FC<ProjectPhasesMapProps> = ({
  project,
  onSelectMacro,
  onOpenPrerequisitesModal
}) => {
  const [showCompleted, setShowCompleted] = useState(false);

  // Analisa as macroetapas do projeto
  const macroActivities = useMemo(() => {
    return (project.macroActivities || []).map((macro, idx) => {
      const totalMicros = macro.microActivities?.length || 0;
      const completedMicros = (macro.microActivities || []).filter(
        m => m.status === 'Concluído e aprovado' || m.status === 'Concluído com restrições' || (m.progress && m.progress >= 100)
      ).length;
      const inProgressMicros = (macro.microActivities || []).filter(
        m => m.status === 'Em andamento' || (m.progress && m.progress > 0 && m.progress < 100)
      ).length;
      const pendingMicros = totalMicros - completedMicros;

      const progress = totalMicros > 0 ? Math.round((completedMicros / totalMicros) * 100) : 0;
      
      let status: 'completed' | 'current' | 'parallel' | 'dependent' | 'future' = 'future';
      if (progress >= 100) {
        status = 'completed';
      } else if (macro.relationshipType === 'parallel' || macro.name.toLowerCase().includes('farmacotécnico') || macro.name.toLowerCase().includes('estudos pré-clínicos') || idx === 1 || idx === 2) {
        status = inProgressMicros > 0 ? 'parallel' : 'future';
      } else if (macro.relationshipType === 'dependent' || macro.name.toLowerCase().includes('regulatória') || macro.name.toLowerCase().includes('revisão')) {
        status = 'dependent';
      } else if (inProgressMicros > 0 || (idx === 0 && progress < 100)) {
        status = 'current';
      }

      // Código da etapa (ex: 1, 2, 2.1, 2.2, 3, 4, 5, R)
      let code = macro.code || `${idx + 1}`;
      if (macro.name.toLowerCase().includes('regulatória') || macro.relationshipType === 'dependent') {
        code = 'R';
      }

      return {
        ...macro,
        totalMicros,
        completedMicros,
        inProgressMicros,
        pendingMicros,
        progress,
        computedStatus: status,
        displayCode: code
      };
    });
  }, [project]);

  // Contagem de concluídas
  const completedCount = useMemo(() => {
    return macroActivities.filter(m => m.progress >= 100).length;
  }, [macroActivities]);

  // Identifica a macroetapa atual ("Você está aqui")
  const currentActiveMacro = useMemo(() => {
    return (
      macroActivities.find(m => m.computedStatus === 'current') ||
      macroActivities.find(m => m.inProgressMicros > 0) ||
      macroActivities.find(m => m.progress < 100) ||
      macroActivities[0]
    );
  }, [macroActivities]);

  // Identifica a próxima etapa (a primeira não iniciada ou seguinte à atual)
  const nextMacro = useMemo(() => {
    if (!currentActiveMacro) return macroActivities[macroActivities.length - 1];
    const currentIndex = macroActivities.findIndex(m => m.id === currentActiveMacro.id);
    const following = macroActivities.slice(currentIndex + 1).find(m => m.progress < 100);
    return following || macroActivities[macroActivities.length - 1] || currentActiveMacro;
  }, [macroActivities, currentActiveMacro]);

  // Calcula condições/pré-requisitos para iniciar a próxima etapa
  const readinessData = useMemo(() => {
    if (!nextMacro) {
      return { percentage: 100, metCount: 5, totalCount: 5, conditions: [] };
    }

    // Coleta pré-requisitos configurados ou gera dinamicamente com base nas microatividades da fase anterior
    const conditions: { id: string; name: string; status: 'met' | 'in_progress' | 'pending' | 'blocked' }[] = [];

    // Se a macro atual tiver microatividades, usa os estados reais delas
    if (currentActiveMacro && currentActiveMacro.microActivities?.length > 0) {
      currentActiveMacro.microActivities.slice(0, 5).forEach((micro, idx) => {
        let condStatus: 'met' | 'in_progress' | 'pending' | 'blocked' = 'pending';
        if (micro.status === 'Concluído e aprovado' || (micro.progress && micro.progress >= 100)) {
          condStatus = 'met';
        } else if (micro.status === 'Em andamento' || (micro.progress && micro.progress > 0)) {
          condStatus = 'in_progress';
        } else if (micro.isBlocked) {
          condStatus = 'blocked';
        }
        conditions.push({
          id: micro.id || `cond_${idx}`,
          name: micro.name,
          status: condStatus
        });
      });
    }

    // Se não houver itens suficientes, complementa com itens padrão contextuais
    if (conditions.length < 3) {
      const defaultConditions = [
        { id: 'c1', name: 'Síntese do DNA plasmidial concluída', status: 'met' as const },
        { id: 'c2', name: 'Caracterização bioquímica concluída', status: 'met' as const },
        { id: 'c3', name: 'Banco de célula mestre disponível', status: 'met' as const },
        { id: 'c4', name: 'Seleção de clones em andamento', status: 'in_progress' as const },
        { id: 'c5', name: 'Aprovação regulatória necessária', status: 'pending' as const },
      ];
      defaultConditions.forEach(dc => {
        if (!conditions.some(c => c.name.toLowerCase() === dc.name.toLowerCase())) {
          conditions.push(dc);
        }
      });
    }

    const totalCount = conditions.length || 1;
    const metCount = conditions.filter(c => c.status === 'met').length;
    const inProgressCount = conditions.filter(c => c.status === 'in_progress').length;
    const percentage = Math.round(((metCount + inProgressCount * 0.5) / totalCount) * 100);

    return {
      percentage: Math.min(100, Math.max(0, percentage)),
      metCount,
      totalCount,
      conditions
    };
  }, [nextMacro, currentActiveMacro]);

  // Separa as etapas entre principal, paralelas e dependentes
  const { linearSteps, parallelSteps, dependentSteps } = useMemo(() => {
    const linear: typeof macroActivities = [];
    const parallel: typeof macroActivities = [];
    const dependent: typeof macroActivities = [];

    macroActivities.forEach((macro, idx) => {
      if (macro.computedStatus === 'dependent' || macro.name.toLowerCase().includes('regulatória')) {
        dependent.push(macro);
      } else if (macro.computedStatus === 'parallel' || macro.name.toLowerCase().includes('farmacotécnico') || macro.name.toLowerCase().includes('estudos pré')) {
        parallel.push(macro);
      } else {
        linear.push(macro);
      }
    });

    return { linearSteps: linear, parallelSteps: parallel, dependentSteps: dependent };
  }, [macroActivities]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* MAP HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-transparent pb-2">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>MAPA DE FASES</span>
          </h2>
          <p className="text-xs font-bold text-slate-500">
            Visão geral do projeto e relacionamento entre as macroetapas
          </p>
        </div>

        {/* Legend and Toggle Controls */}
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-emerald-600 rounded-full inline-block" />
            <span className="text-[11px] font-bold text-slate-600">Sequencial (próxima)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-b-2 border-dashed border-blue-500 inline-block" />
            <span className="text-[11px] font-bold text-slate-600">Paralela (mesmo período)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-b-2 border-dashed border-purple-400 inline-block" />
            <span className="text-[11px] font-bold text-slate-600">Dependente (não bloqueia)</span>
          </div>

          {completedCount > 0 && (
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-black rounded-xl shadow-2xs transition"
            >
              {showCompleted ? <EyeOff size={14} className="text-slate-400" /> : <Eye size={14} className="text-slate-500" />}
              <span>{showCompleted ? 'Ocultar concluídas' : `Ver etapas concluídas (${completedCount})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN LAYOUT: MAP AREA + RIGHT READINESS SIDEBAR */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* MAP VISUAL FLOW CANVAS (LEFT/CENTER) */}
        <div className="xl:col-span-8 bg-white/90 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs overflow-x-auto min-h-[460px] flex flex-col justify-center">
          
          <div className="flex items-center gap-5 min-w-[720px] py-6 relative">
            
            {/* 1. COMPLETED STAGE (Hidden by default unless showCompleted is true) */}
            {macroActivities.filter(m => m.progress >= 100).map((macro) => {
              if (!showCompleted) return null;
              return (
                <React.Fragment key={macro.id}>
                  <div 
                    onClick={() => onSelectMacro(macro.id)}
                    className="w-56 p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/80 transition-all cursor-pointer shadow-2xs group shrink-0 relative"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                        <Check size={16} />
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-md uppercase tracking-wider">
                        CONCLUÍDA
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1 group-hover:text-emerald-800 transition">
                      {macro.name}
                    </h4>
                    
                    <p className="text-[10px] font-bold text-slate-400 mt-1">
                      {macro.totalMicros} atividades
                    </p>

                    <div className="mt-3">
                      <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: '100%' }} />
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 block text-right mt-1">100%</span>
                    </div>
                  </div>

                  {/* Green Arrow */}
                  <div className="flex items-center text-emerald-600 shrink-0">
                    <ArrowRight size={20} className="stroke-[2.5]" />
                  </div>
                </React.Fragment>
              );
            })}

            {/* 2. CURRENT ACTIVE STAGE ("VOCÊ ESTÁ AQUI") */}
            {currentActiveMacro && (
              <div className="relative shrink-0">
                {/* Floating "VOCÊ ESTÁ AQUI" Badge */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce duration-1000">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs whitespace-nowrap">
                    VOCÊ ESTÁ AQUI
                  </span>
                  <span className="text-emerald-600 -mt-1 text-xs">▼</span>
                </div>

                <div 
                  onClick={() => onSelectMacro(currentActiveMacro.id)}
                  className="w-60 p-5 rounded-2xl border-2 border-emerald-600 bg-white hover:bg-emerald-50/20 transition-all cursor-pointer shadow-md group relative"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                      {currentActiveMacro.displayCode}
                    </div>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-black rounded-md uppercase tracking-wider">
                      ATUAL
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-800 transition">
                    {currentActiveMacro.name}
                  </h4>
                  
                  <p className="text-[11px] font-bold text-slate-400 mt-1">
                    {currentActiveMacro.totalMicros} atividades
                  </p>

                  <div className="mt-4">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${currentActiveMacro.progress}%` }} 
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1.5 text-[10px] font-black">
                      <span className="text-slate-400">{currentActiveMacro.completedMicros} concl.</span>
                      <span className="text-emerald-700">{currentActiveMacro.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PARALLEL & DEPENDENT BRANCHES (Fork) */}
            <div className="flex items-center shrink-0">
              {/* SVG Connector lines */}
              <div className="flex items-center text-blue-500">
                <ArrowRight size={20} className="stroke-[2.5]" />
              </div>
            </div>

            {/* Parallel column with 2.1 & 2.2 + Dependent continuous row below */}
            <div className="flex flex-col gap-3 shrink-0">
              
              {/* Parallel Stage 1 */}
              <div 
                onClick={() => onSelectMacro(parallelSteps[0]?.id || currentActiveMacro.id)}
                className="w-60 p-3.5 rounded-2xl border border-blue-300 bg-blue-50/40 hover:bg-blue-50 transition cursor-pointer shadow-2xs group relative"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-blue-700">2.1</span>
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-700 transition">
                      {parallelSteps[0]?.name || 'Desenvolvimento Farmacotécnico'}
                    </h5>
                  </div>
                </div>
                
                <p className="text-[10px] font-bold text-slate-400">
                  {parallelSteps[0]?.totalMicros || 12} atividades
                </p>

                <div className="mt-2.5">
                  <div className="w-full bg-blue-200/50 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full" 
                      style={{ width: `${parallelSteps[0]?.progress || 60}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-black text-blue-700 block text-right mt-1">
                    {parallelSteps[0]?.progress || 60}%
                  </span>
                </div>
              </div>

              {/* Parallel Stage 2 */}
              <div 
                onClick={() => onSelectMacro(parallelSteps[1]?.id || currentActiveMacro.id)}
                className="w-60 p-3.5 rounded-2xl border border-blue-300 bg-blue-50/40 hover:bg-blue-50 transition cursor-pointer shadow-2xs group relative"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-blue-700">2.2</span>
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-700 transition">
                      {parallelSteps[1]?.name || 'Estudos Pré-clínicos'}
                    </h5>
                  </div>
                </div>
                
                <p className="text-[10px] font-bold text-slate-400">
                  {parallelSteps[1]?.totalMicros || 14} atividades
                </p>

                <div className="mt-2.5">
                  <div className="w-full bg-blue-200/50 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full" 
                      style={{ width: `${parallelSteps[1]?.progress || 70}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-black text-blue-700 block text-right mt-1">
                    {parallelSteps[1]?.progress || 70}%
                  </span>
                </div>
              </div>

              {/* Dependent Stage (Revisão Regulatória Contínua) */}
              <div 
                onClick={() => onSelectMacro(dependentSteps[0]?.id || currentActiveMacro.id)}
                className="w-60 p-3 rounded-2xl border border-dashed border-purple-300 bg-purple-50/30 hover:bg-purple-50 transition cursor-pointer shadow-2xs group relative mt-1"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[8px] font-black uppercase text-purple-700 tracking-wider">
                    DEPENDENTE (BLOQUEIA)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-black text-[10px] shrink-0">
                    R
                  </div>
                  <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight group-hover:text-purple-800 transition truncate">
                    {dependentSteps[0]?.name || 'Revisão Regulatória Contínua'}
                  </h5>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-purple-200/50 rounded-full h-1 overflow-hidden">
                    <div 
                      className="bg-purple-600 h-full rounded-full" 
                      style={{ width: `${dependentSteps[0]?.progress || 25}%` }} 
                    />
                  </div>
                  <span className="text-[9px] font-black text-purple-700 block text-right mt-0.5">
                    {dependentSteps[0]?.progress || 25}%
                  </span>
                </div>
              </div>
            </div>

            {/* Green Arrow to Future Stages */}
            <div className="flex items-center text-emerald-600 shrink-0">
              <ArrowRight size={20} className="stroke-[2.5]" />
            </div>

            {/* 4. FUTURE SEQUENTIAL STAGES */}
            {macroActivities.filter(m => m.id !== currentActiveMacro?.id && m.progress === 0 && !m.name.toLowerCase().includes('regulatória')).slice(0, 3).map((macro, idx) => (
              <React.Fragment key={macro.id}>
                <div 
                  onClick={() => onSelectMacro(macro.id)}
                  className="w-56 p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs group shrink-0 relative"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                      {idx + 3}
                    </div>
                  </div>

                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight group-hover:text-slate-900 transition">
                    {macro.name}
                  </h4>
                  
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    {macro.totalMicros || 20} atividades
                  </p>

                  <div className="mt-3">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-slate-300 h-full rounded-full" style={{ width: '0%' }} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 block text-right mt-1">0%</span>
                  </div>
                </div>

                {idx < 2 && (
                  <div className="flex items-center text-slate-300 shrink-0">
                    <ArrowRight size={18} />
                  </div>
                )}
              </React.Fragment>
            ))}

          </div>
        </div>

        {/* RIGHT SIDEBAR: READINESS & PREREQUISITES GAUGE (Matches Image 1 right panel) */}
        <div className="xl:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
          
          {/* Header */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">
              PRÓXIMA ETAPA — {nextMacro?.name || 'FASE 1/2'}
            </span>
            <h3 className="text-sm font-black text-slate-900">
              Prontidão para iniciar
            </h3>
          </div>

          {/* Radial Circular Progress Gauge */}
          <div className="flex items-center gap-5 p-4 bg-slate-50/70 rounded-2xl border border-slate-100">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-teal-600 transition-all duration-1000"
                  strokeDasharray={`${readinessData.percentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-base font-black text-slate-900 block leading-none">
                  {readinessData.percentage}%
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-black text-slate-800 leading-snug">
                {readinessData.metCount} de {readinessData.totalCount} condições prontas para iniciar
              </p>
              <p className="text-[10px] font-bold text-slate-400">
                {readinessData.percentage === 100 ? 'Todas as condições atendidas' : 'Critérios de passagem de fase'}
              </p>
            </div>
          </div>

          {/* Conditions Checklist */}
          <div className="space-y-2.5">
            {readinessData.conditions.map((cond) => {
              const isMet = cond.status === 'met';
              const isInProgress = cond.status === 'in_progress';
              const isPending = cond.status === 'pending';
              const isBlocked = cond.status === 'blocked';

              return (
                <div key={cond.id} className="flex items-start gap-2.5 text-xs font-bold text-slate-700">
                  {isMet && (
                    <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={11} className="stroke-[3]" />
                    </div>
                  )}

                  {isInProgress && (
                    <div className="w-4 h-4 rounded-full border-2 border-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    </div>
                  )}

                  {(isPending || isBlocked) && (
                    <div className="w-4 h-4 rounded-full border-2 border-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    </div>
                  )}

                  <span className={isMet ? 'text-slate-800' : isInProgress ? 'text-slate-600' : 'text-slate-500'}>
                    {cond.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Readiness Status Callout */}
          {readinessData.percentage < 100 ? (
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-amber-800">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>Ainda não recomendado iniciar</span>
              </div>
              <p className="text-[11px] font-bold text-amber-700/90 leading-relaxed">
                {readinessData.totalCount - readinessData.metCount} condições pendentes impedem o início da próxima etapa.
              </p>
              
              {onOpenPrerequisitesModal && (
                <button
                  onClick={() => onOpenPrerequisitesModal(nextMacro)}
                  className="inline-flex items-center gap-1 text-xs font-black text-amber-900 hover:text-amber-950 transition underline-offset-2 hover:underline"
                >
                  <span>Ver pré-requisitos completos</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-800">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Pronta para iniciar!</span>
              </div>
              <p className="text-[11px] font-bold text-emerald-700 leading-relaxed">
                Todos os pré-requisitos e condições foram concluídos com sucesso.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
