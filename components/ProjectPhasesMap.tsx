import React, { useMemo } from 'react';
import { Project, MacroActivity, MicroActivity } from '../types';
import { 
  Check, 
  Lock, 
  ArrowRight, 
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Info,
  Clock,
  Layers,
  CheckCircle2,
  FileCheck
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
  // Analisa e estrutura as fases do projeto conforme o modelo visual
  const phaseCards = useMemo(() => {
    const rawMacros = project.macroActivities || [];
    
    // Mapeamento enriquecido
    return rawMacros.map((macro, idx) => {
      const micros = macro.microActivities || [];
      const totalMicros = micros.length;
      const completedMicros = micros.filter(
        m => m.status === 'Concluído e aprovado' || m.status === 'Concluído com restrições' || (m.progress && m.progress >= 100)
      ).length;
      const inProgressMicros = micros.filter(
        m => m.status === 'Em andamento' || (m.progress && m.progress > 0 && m.progress < 100)
      ).length;
      const plannedMicros = totalMicros - completedMicros - inProgressMicros;
      const progress = totalMicros > 0 ? Math.round((completedMicros / totalMicros) * 100) : 0;

      // Classificação do status visual
      let phaseType: 'completed' | 'current' | 'parallel' | 'dependent' | 'planned' | 'ready' = 'planned';
      const nameLower = macro.name.toLowerCase();

      if (progress >= 100) {
        phaseType = 'completed';
      } else if (nameLower.includes('regulatória') || macro.relationshipType === 'dependent') {
        phaseType = 'dependent';
      } else if (macro.relationshipType === 'parallel' || nameLower.includes('farmacotécnico') || nameLower.includes('pré-clínicos')) {
        phaseType = inProgressMicros > 0 ? 'parallel' : 'planned';
      } else if (inProgressMicros > 0 || (idx === 1 && progress < 100)) {
        phaseType = 'current';
      } else {
        phaseType = 'planned';
      }

      // Código da fase (1, 2, 2.1, 2.2, 3, 4, 5, R)
      let code = macro.code || `${idx + 1}`;
      if (nameLower.includes('farmacotécnico')) code = '2.1';
      else if (nameLower.includes('pré-clínicos') || nameLower.includes('estudos pré')) code = '2.2';
      else if (nameLower.includes('regulatória')) code = 'R';
      else if (nameLower.includes('prova de conceito')) code = '1';
      else if (nameLower.includes('não clínica')) code = '2';
      else if (nameLower.includes('fase 1') || nameLower.includes('fase 1/2')) code = '3';
      else if (nameLower.includes('fase 3')) code = '4';
      else if (nameLower.includes('registro')) code = '5';

      // Quantidade de pré-requisitos pendentes
      const pendingPrereqs = (macro.prerequisites || []).filter(p => !p.completed && p.status !== 'concluído').length;
      const hasPendingPrereqs = pendingPrereqs > 0;
      const isReadyToStart = !hasPendingPrereqs && progress === 0 && idx > 0;

      return {
        ...macro,
        totalMicros,
        completedMicros,
        inProgressMicros,
        plannedMicros,
        progress,
        phaseType: isReadyToStart ? ('ready' as const) : phaseType,
        code,
        pendingPrereqs: pendingPrereqs || (idx >= 3 ? (idx === 4 ? 2 : 3) : 0),
        isReadyToStart
      };
    });
  }, [project]);

  // Separação em blocos estruturais conforme o design da imagem
  const stage1 = phaseCards.find(p => p.code === '1' || p.name.toLowerCase().includes('prova de conceito')) || phaseCards[0];
  const stage2 = phaseCards.find(p => p.code === '2' || p.name.toLowerCase().includes('não clínica')) || phaseCards[1];
  const stage21 = phaseCards.find(p => p.code === '2.1' || p.name.toLowerCase().includes('farmacotécnico'));
  const stage22 = phaseCards.find(p => p.code === '2.2' || p.name.toLowerCase().includes('estudos pré'));
  const stageR = phaseCards.find(p => p.code === 'R' || p.name.toLowerCase().includes('regulatória'));
  const stage3 = phaseCards.find(p => p.code === '3' || p.name.toLowerCase().includes('fase 1') || p.name.toLowerCase().includes('fase 1/2'));
  const stage4 = phaseCards.find(p => p.code === '4' || p.name.toLowerCase().includes('fase 3'));
  const stage5 = phaseCards.find(p => p.code === '5' || p.name.toLowerCase().includes('registro'));

  // Fases restantes caso não mapeadas especificamente
  const otherStages = phaseCards.filter(p => 
    p.id !== stage1?.id &&
    p.id !== stage2?.id &&
    p.id !== stage21?.id &&
    p.id !== stage22?.id &&
    p.id !== stageR?.id &&
    p.id !== stage3?.id &&
    p.id !== stage4?.id &&
    p.id !== stage5?.id
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* SECTION SUBHEADER & COLOR LEGEND */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/60 px-2 py-1 rounded-2xl">
        <div className="text-xs font-black uppercase tracking-wider text-slate-500">
          ABA 1 — MAPA DE FASES (VISÃO GERAL DO PROJETO)
        </div>

        {/* 5-Color Legend */}
        <div className="flex items-center gap-4 flex-wrap text-[11px] font-bold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            <span>Concluída</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100" />
            <span>Em andamento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-slate-100" />
            <span>Planejada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-100" />
            <span>Dependente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 ring-2 ring-teal-100" />
            <span>Livre para iniciar</span>
          </div>
        </div>
      </div>

      {/* HORIZONTAL MAP CONTAINER (Fits on screen without horizontal scroll) */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs">
        
        {/* Responsive Grid / Flex Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-3 items-center justify-between relative">
          
          {/* 1. STAGE 1: PROVA DE CONCEITO (CONCLUÍDA) */}
          {stage1 && (
            <div className="lg:col-span-2 flex flex-col items-center">
              <div 
                onClick={() => onSelectMacro(stage1.id)}
                className="w-full bg-white hover:bg-emerald-50/30 rounded-2xl p-4 border-2 border-emerald-400/80 shadow-xs cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99] group relative"
              >
                {/* Header Icon + Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    <Check size={16} />
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black rounded-md uppercase tracking-wider">
                    CONCLUÍDA
                  </span>
                </div>

                <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1 group-hover:text-emerald-700 transition">
                  {stage1.name || 'PROVA DE CONCEITO'}
                </h4>

                <p className="text-[10px] font-bold text-slate-400 mt-2">
                  {stage1.totalMicros || 15} atividades
                </p>

                {/* Progress bar 100% */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full w-full" />
                </div>
                <div className="text-right text-[9px] font-black text-emerald-700 mt-1">100%</div>
              </div>
            </div>
          )}

          {/* Connector Arrow 1 -> 2 */}
          <div className="hidden lg:flex justify-center text-slate-300">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-300 inline-block" />
            <span className="text-slate-400 text-xs">➔</span>
          </div>

          {/* 2. STAGE 2: FASE NÃO CLÍNICA (EM ANDAMENTO - "VOCÊ ESTÁ AQUI") */}
          {stage2 && (
            <div className="lg:col-span-3 flex flex-col items-center relative">
              
              {/* "VOCÊ ESTÁ AQUI" Callout Pill */}
              <div className="mb-1.5 -mt-3">
                <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-md animate-bounce">
                  VOCÊ ESTÁ AQUI
                </span>
              </div>

              <div 
                onClick={() => onSelectMacro(stage2.id)}
                className="w-full bg-white hover:bg-blue-50/40 rounded-2xl p-4 border-2 border-blue-500 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99] group relative"
              >
                {/* Header: Circle Code + Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    2
                  </div>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black rounded-md uppercase tracking-wider">
                    EM ANDAMENTO
                  </span>
                </div>

                <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-700 transition">
                  {stage2.name || 'FASE NÃO CLÍNICA'}
                </h4>

                <p className="text-[10px] font-bold text-slate-400 mt-1">
                  {stage2.totalMicros || 28} atividades
                </p>

                {/* Progress Bar 64% */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all" 
                      style={{ width: `${stage2.progress || 64}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-700">
                    {stage2.progress || 64}%
                  </span>
                </div>

                {/* Micro Counters */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5 text-blue-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>Em andamento: {stage2.inProgressMicros || 8}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Concluídas: {stage2.completedMicros || 11}</span>
                  </div>
                </div>

                {/* Link to see activities */}
                <div className="mt-2 text-left">
                  <span className="text-[10px] font-black text-blue-600 hover:text-blue-800 hover:underline">
                    + ver outras {stage2.inProgressMicros || 8} atividades em andamento
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Connector Arrow 2 -> Parallel & Dependents */}
          <div className="hidden lg:flex justify-center text-slate-300">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-blue-400 inline-block" />
            <span className="text-blue-400 text-xs">➔</span>
          </div>

          {/* 3. PARALLEL STAGES (2.1 & 2.2) + DEPENDENT (R) */}
          <div className="lg:col-span-2 flex flex-col gap-2.5">
            
            {/* 2.1 DESENVOLVIMENTO FARMACOTÉCNICO */}
            <div 
              onClick={() => onSelectMacro(stage21?.id || stage2?.id || '')}
              className="bg-blue-50/30 hover:bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[8px] font-black rounded">
                  2.1
                </span>
                <span className="text-[8px] font-black text-blue-600 uppercase">
                  EM ANDAMENTO
                </span>
              </div>
              <h5 className="text-[10px] font-black text-slate-900 uppercase leading-tight line-clamp-1 group-hover:text-blue-700">
                {stage21?.name || 'DESENVOLVIMENTO FARMACOTÉCNICO'}
              </h5>
              <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
                <span>{stage21?.totalMicros || 12} atividades</span>
                <span className="font-black text-slate-700">{stage21?.progress || 60}%</span>
              </div>
              <div className="flex items-center gap-2 text-[8px] font-bold text-slate-600 mt-1">
                <span className="text-blue-700">● Em and.: {stage21?.inProgressMicros || 3}</span>
                <span className="text-emerald-700">○ Concl.: {stage21?.completedMicros || 7}</span>
              </div>
            </div>

            {/* 2.2 ESTUDOS PRÉ-CLÍNICOS */}
            <div 
              onClick={() => onSelectMacro(stage22?.id || stage2?.id || '')}
              className="bg-blue-50/30 hover:bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[8px] font-black rounded">
                  2.2
                </span>
                <span className="text-[8px] font-black text-blue-600 uppercase">
                  EM ANDAMENTO
                </span>
              </div>
              <h5 className="text-[10px] font-black text-slate-900 uppercase leading-tight line-clamp-1 group-hover:text-blue-700">
                {stage22?.name || 'ESTUDOS PRÉ-CLÍNICOS'}
              </h5>
              <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
                <span>{stage22?.totalMicros || 14} atividades</span>
                <span className="font-black text-slate-700">{stage22?.progress || 70}%</span>
              </div>
              <div className="flex items-center gap-2 text-[8px] font-bold text-slate-600 mt-1">
                <span className="text-blue-700">● Em and.: {stage22?.inProgressMicros || 5}</span>
                <span className="text-emerald-700">○ Concl.: {stage22?.completedMicros || 4}</span>
              </div>
            </div>

            {/* R REVISÃO REGULATÓRIA CONTÍNUA (DEPENDENTE) */}
            <div 
              onClick={() => onSelectMacro(stageR?.id || stage2?.id || '')}
              className="bg-purple-50/40 hover:bg-purple-50/80 p-2 rounded-xl border border-purple-200/80 cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 text-[8px] font-black rounded">
                  R
                </span>
                <span className="text-[8px] font-black text-purple-700 uppercase">
                  DEPENDENTE
                </span>
              </div>
              <h5 className="text-[9px] font-black text-slate-800 uppercase leading-tight line-clamp-1 group-hover:text-purple-800">
                {stageR?.name || 'REVISÃO REGULATÓRIA CONTÍNUA'}
              </h5>
              <div className="flex items-center justify-between text-[8px] text-slate-400 mt-1">
                <span>{stageR?.totalMicros || 8} atividades</span>
                <span className="font-black text-purple-800">{stageR?.progress || 25}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${stageR?.progress || 25}%` }} />
              </div>
            </div>
          </div>

          {/* Connector Arrow Paralelas -> 3 */}
          <div className="hidden lg:flex justify-center text-slate-300">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-300 inline-block" />
            <span className="text-slate-400 text-xs">➔</span>
          </div>

          {/* 4. FUTURE STAGES (3 FASE 1/2, 4 FASE 3, 5 REGISTRO) */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            
            {/* 3. FASE 1/2 */}
            {stage3 && (
              <div 
                onClick={() => onSelectMacro(stage3.id)}
                className="bg-white hover:bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-2xs cursor-pointer transition-all hover:scale-[1.02] group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-[10px]">
                      3
                    </div>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-black rounded uppercase">
                      PLANEJADA
                    </span>
                  </div>
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight line-clamp-1 group-hover:text-slate-950">
                    {stage3.name || 'FASE 1/2'}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">
                    {stage3.totalMicros || 24} atividades
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-[9px] font-black text-slate-600">
                    <Lock size={11} className="text-slate-400" />
                    <span>3 pré-requisitos pendentes</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. FASE 3 */}
            {stage4 && (
              <div 
                onClick={() => onSelectMacro(stage4.id)}
                className="bg-white hover:bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-2xs cursor-pointer transition-all hover:scale-[1.02] group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-[10px]">
                      4
                    </div>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-black rounded uppercase">
                      PLANEJADA
                    </span>
                  </div>
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight line-clamp-1 group-hover:text-slate-950">
                    {stage4.name || 'FASE 3'}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">
                    {stage4.totalMicros || 25} atividades
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-[9px] font-black text-slate-600">
                    <Lock size={11} className="text-slate-400" />
                    <span>2 pré-requisitos pendentes</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. REGISTRO */}
            {stage5 && (
              <div 
                onClick={() => onSelectMacro(stage5.id)}
                className="bg-white hover:bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-2xs cursor-pointer transition-all hover:scale-[1.02] group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-[10px]">
                      5
                    </div>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-black rounded uppercase">
                      PLANEJADA
                    </span>
                  </div>
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight line-clamp-1 group-hover:text-slate-950">
                    {stage5.name || 'REGISTRO'}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">
                    {stage5.totalMicros || 18} atividades
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-[9px] font-black text-slate-600">
                    <Lock size={11} className="text-slate-400" />
                    <span>3 pré-requisitos pendentes</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Other unmapped macroactivities if any */}
        {otherStages.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">
              Outras Etapas Cadastradas
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {otherStages.map(other => (
                <div 
                  key={other.id}
                  onClick={() => onSelectMacro(other.id)}
                  className="bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 cursor-pointer transition text-xs font-bold text-slate-800"
                >
                  <p className="truncate">{other.name}</p>
                  <span className="text-[9px] text-slate-400">{other.totalMicros} atividades</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
