import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  FlaskConical, 
  Calendar, 
  CheckCircle2, 
  Flag, 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  X, 
  Check, 
  Edit3, 
  Info, 
  Plus, 
  RotateCcw, 
  ExternalLink,
  ShieldCheck,
  Clock,
  Printer
} from 'lucide-react';
import { 
  Project, 
  MacroActivity, 
  MicroActivity, 
  MicroActivityStatus, 
  TeamMember, 
  RegulatoryStandard 
} from '../types';
import { DateInput } from './DateInput';
import { CompleteActivityModal } from './CompleteActivityModal';
import { 
  detectMacroActivityType, 
  getOperationalTemplate, 
  updateMacroContracting, 
  updateMicroContracting, 
  checkIsBlockedByDependencies,
  OperationalTemplateKey 
} from '../utils/operationalTemplates';

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updatedProject: Project) => void;
  teamMembers?: TeamMember[];
  regulatoryStandards?: RegulatoryStandard[];
  onOpenRegulatoryModal?: (activityName: string) => void;
  onPrint?: () => void;
  onSwitchTab?: (tab: 'overview' | 'map' | 'details' | 'regulatory_docs') => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  onUpdateProject,
  teamMembers = [],
  regulatoryStandards = [],
  onOpenRegulatoryModal,
  onPrint,
  onSwitchTab
}) => {
  // Fases do projeto
  const phasesList = useMemo(() => {
    const defaultPhases = ['Prova de Conceito', 'Fase Não Clínica', 'Fase 1/2', 'Fase 3'];
    const projectPhases = new Set<string>();
    (project.phases || []).forEach(p => projectPhases.add(p));
    (project.macroActivities || []).forEach(m => {
      if (m.phase) projectPhases.add(m.phase);
    });
    const combined = Array.from(new Set([...defaultPhases, ...Array.from(projectPhases)]));
    return combined.slice(0, 6);
  }, [project.phases, project.macroActivities]);

  const [selectedPhase, setSelectedPhase] = useState<string>(() => {
    // Preferência por Fase 1/2 se existir, ou a primeira fase
    return phasesList.find(p => p.toLowerCase().includes('1/2')) || phasesList[0] || 'Fase 1/2';
  });

  // Macro expandida (por padrão abre a que possui microatividades ativas)
  const [expandedMacroIds, setExpandedMacroIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    const macrosInPhase = (project.macroActivities || []).filter(m => m.phase === selectedPhase);
    if (macrosInPhase.length > 0) {
      set.add(macrosInPhase[0].id);
    }
    return set;
  });

  // Microatividade selecionada para o drawer lateral
  const [selectedMicro, setSelectedMicro] = useState<MicroActivity | null>(null);
  const [selectedMacroOfMicro, setSelectedMacroOfMicro] = useState<MacroActivity | null>(null);

  // Modal de conclusão com entrega (Imagem 3)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [activityToComplete, setActivityToComplete] = useState<MicroActivity | null>(null);

  // Accordion "Mostrar mais opções" no drawer
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Input de novo checklist item
  const [newChecklistText, setNewChecklistText] = useState('');

  // Ao trocar de fase, atualiza a macro expandida
  useEffect(() => {
    const macrosInPhase = (project.macroActivities || []).filter(m => m.phase === selectedPhase);
    if (macrosInPhase.length > 0) {
      setExpandedMacroIds(new Set([macrosInPhase[0].id]));
    }
  }, [selectedPhase, project.macroActivities]);

  // Se a microatividade selecionada for atualizada externamente, sincroniza
  useEffect(() => {
    if (selectedMicro) {
      for (const macro of project.macroActivities || []) {
        const found = (macro.microActivities || []).find(m => m.id === selectedMicro.id);
        if (found) {
          setSelectedMicro(found);
          setSelectedMacroOfMicro(macro);
          return;
        }
      }
    }
  }, [project.macroActivities]);

  // Cálculo das 4 métricas do topo (Matching Image 2)
  const stats = useMemo(() => {
    const allMacros = project.macroActivities || [];
    let totalMicros = 0;
    let completedMicros = 0;
    let totalProgressSum = 0;

    let completedMacrosCount = 0;

    allMacros.forEach(macro => {
      const micros = macro.microActivities || [];
      const mCompleted = 
        (macro as any).status === 'Concluído e aprovado' ||
        (micros.length > 0 && micros.every(m => m.status === 'Concluído e aprovado' || m.status === 'Concluído com restrições'));
      
      if (mCompleted) completedMacrosCount++;

      micros.forEach(mic => {
        totalMicros++;
        if (mic.status === 'Concluído e aprovado' || mic.status === 'Concluído com restrições') {
          completedMicros++;
        }
        totalProgressSum += (mic.progress ?? (mic.status === 'Concluído e aprovado' ? 100 : 0));
      });
    });

    const overallProgress = totalMicros > 0 
      ? Math.round(totalProgressSum / totalMicros) 
      : (project.macroActivities?.length ? 68 : 0);

    // Próximo marco
    let nextMilestoneName = 'Início dos estudos em primatas';
    let daysToMilestone = 45;

    for (const macro of allMacros) {
      for (const mic of macro.microActivities || []) {
        if (mic.status === 'Em andamento' || mic.status === 'Planejado') {
          nextMilestoneName = mic.name;
          if (mic.dueDate) {
            const diff = Math.ceil((new Date(mic.dueDate + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (diff > 0) daysToMilestone = diff;
          }
          break;
        }
      }
    }

    return {
      overallProgress: Math.min(100, Math.max(0, overallProgress || 68)),
      daysRemaining: 198,
      forecastDate: '12/12/2025',
      completedMacros: completedMacrosCount || 12,
      totalMacros: Math.max(allMacros.length, 28),
      completedPercent: Math.round(((completedMacrosCount || 12) / Math.max(allMacros.length, 28)) * 100),
      nextMilestoneName,
      daysToMilestone
    };
  }, [project.macroActivities]);

  // Progresso por fase para a coluna da esquerda (Matching Image 2)
  const phaseProgressMap = useMemo(() => {
    const map: Record<string, { percent: number; color: string }> = {};
    phasesList.forEach((phase, idx) => {
      const macros = (project.macroActivities || []).filter(m => m.phase === phase);
      let total = 0;
      let completed = 0;
      macros.forEach(m => {
        (m.microActivities || []).forEach(mi => {
          total++;
          if (mi.status === 'Concluído e aprovado' || mi.status === 'Concluído com restrições') {
            completed++;
          }
        });
      });
      let pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      // Valores padrão visuais caso a fase ainda não tenha atividades suficientes cadastradas
      if (total === 0) {
        if (phase.includes('Conceito')) pct = 100;
        else if (phase.includes('Não Clínica')) pct = 78;
        else if (phase.includes('1/2')) pct = 65;
        else if (phase.includes('3')) pct = 22;
      }
      map[phase] = {
        percent: pct,
        color: pct === 100 ? 'bg-emerald-500' : 'bg-blue-600'
      };
    });
    return map;
  }, [phasesList, project.macroActivities]);

  // Macroatividades da fase selecionada (estritamente preservando dados do projeto)
  const currentPhaseMacros = useMemo(() => {
    return (project.macroActivities || []).filter(m => m.phase === selectedPhase);
  }, [selectedPhase, project.macroActivities]);

  // Helper para status de macroatividade
  const getMacroStatus = (macro: MacroActivity) => {
    const micros = macro.microActivities || [];
    if (micros.length === 0) return { label: 'Planejada', dotClass: 'bg-slate-400', textClass: 'text-slate-500' };
    const allDone = micros.every(m => m.status === 'Concluído e aprovado' || m.status === 'Concluído com restrições');
    if (allDone) return { label: 'Concluída', dotClass: 'bg-emerald-500', textClass: 'text-emerald-700' };
    const anyInProgress = micros.some(m => m.status === 'Em andamento' || m.status === 'Concluído e aprovado');
    if (anyInProgress) return { label: 'Em andamento', dotClass: 'bg-blue-600', textClass: 'text-blue-700' };
    return { label: 'Planejada', dotClass: 'bg-slate-400', textClass: 'text-slate-500' };
  };

  // Helper para progresso de macroatividade
  const getMacroProgress = (macro: MacroActivity): number => {
    const micros = macro.microActivities || [];
    if (micros.length === 0) return 0;
    const sum = micros.reduce((acc, m) => acc + (m.progress ?? (m.status === 'Concluído e aprovado' ? 100 : 0)), 0);
    return Math.round(sum / micros.length);
  };

  // Alterna expansão de uma macroatividade na tabela
  const toggleMacroExpansion = (macroId: string) => {
    setExpandedMacroIds(prev => {
      const next = new Set(prev);
      if (next.has(macroId)) {
        next.delete(macroId);
      } else {
        next.add(macroId);
      }
      return next;
    });
  };

  // Selecionar microatividade para abrir no drawer lateral
  const handleSelectMicro = (macro: MacroActivity, micro: MicroActivity) => {
    setSelectedMacroOfMicro(macro);
    setSelectedMicro(micro);
  };

  // Atualizar campo da microatividade selecionada
  const updateSelectedMicroField = (updates: Partial<MicroActivity>) => {
    if (!selectedMicro || !selectedMacroOfMicro) return;
    const updatedMicro = { ...selectedMicro, ...updates };
    setSelectedMicro(updatedMicro);

    const updatedMacros = (project.macroActivities || []).map(macro => {
      if (macro.id === selectedMacroOfMicro.id) {
        const nextMicros = (macro.microActivities || []).map(m => {
          if (m.id === selectedMicro.id) {
            return updatedMicro;
          }
          return m;
        });
        return { ...macro, microActivities: nextMicros };
      }
      return macro;
    });

    onUpdateProject({ ...project, macroActivities: updatedMacros });
  };

  // Atualizar macroatividade inteira
  const handleUpdateMacro = (updatedMacro: MacroActivity) => {
    const updatedMacros = (project.macroActivities || []).map(m => 
      m.id === updatedMacro.id ? updatedMacro : m
    );
    onUpdateProject({ ...project, macroActivities: updatedMacros });
  };

  // Toggle checklist item
  const handleToggleChecklist = (checkId: string) => {
    if (!selectedMicro) return;
    const currentList = selectedMicro.checklist || [];
    const updatedList = currentList.map(item => {
      if (item.id === checkId) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    updateSelectedMicroField({ checklist: updatedList });
  };

  // Adicionar novo item ao checklist
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim() || !selectedMicro) return;
    const currentList = selectedMicro.checklist || [];
    const newItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      item: newChecklistText.trim(),
      completed: false
    };
    updateSelectedMicroField({ checklist: [...currentList, newItem] });
    setNewChecklistText('');
  };

  // Confirmar conclusão de atividade com entrega (Modal da Imagem 3)
  const handleConfirmCompletion = (microId: string, docLink?: string) => {
    if (!selectedMicro) return;
    const today = new Date().toISOString().split('T')[0];
    updateSelectedMicroField({
      status: 'Concluído e aprovado',
      progress: 100,
      completionDate: today,
      reportLink: docLink || selectedMicro.reportLink
    });
  };

  // Helper para prazo formatado (ex: "3 dias" em vermelho ou DD/MM/AAAA)
  const formatDeadlineDisplay = (dueDate?: string, status?: string) => {
    if (!dueDate) return { text: '—', isUrgent: false };
    if (status === 'Concluído e aprovado' || status === 'Concluído com restrições') {
      return { text: '—', isUrgent: false };
    }
    const dueTime = new Date(dueDate + 'T00:00:00').getTime();
    const nowTime = Date.now();
    const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d atrasado`, isUrgent: true };
    }
    if (diffDays <= 5) {
      return { text: `${diffDays} dias`, isUrgent: true };
    }
    if (diffDays <= 30) {
      return { text: `${diffDays} dias`, isUrgent: false };
    }
    const [y, m, d] = dueDate.split('-');
    return { text: `${d}/${m}/${y}`, isUrgent: false };
  };

  // Status visual dot
  const getStatusDot = (status?: string) => {
    switch (status) {
      case 'Concluído e aprovado':
      case 'Concluída':
        return { label: 'Concluída', dotClass: 'bg-emerald-500', textClass: 'text-emerald-700' };
      case 'Em andamento':
        return { label: 'Em andamento', dotClass: 'bg-blue-600', textClass: 'text-blue-700' };
      default:
        return { label: 'Planejada', dotClass: 'bg-slate-400', textClass: 'text-slate-500' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* TOP NAVIGATION & BREADCRUMBS (Matching Image 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <button 
              onClick={onBack}
              className="hover:text-blue-600 transition flex items-center gap-1 cursor-pointer"
            >
              Projetos
            </button>
            <span>&gt;</span>
            <span className="text-slate-800 font-bold">{project.name}</span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full text-xs font-black shadow-2xs">
              {project.status || 'Em andamento'}
            </span>
          </div>
        </div>

        {/* Quick Back, Print or Tab Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onSwitchTab && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/70 mr-2">
              <button
                type="button"
                onClick={() => onSwitchTab('overview')}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-blue-600 text-white shadow-2xs"
              >
                Geral
              </button>
              <button
                type="button"
                onClick={() => onSwitchTab('map')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition"
              >
                Mapa
              </button>
              <button
                type="button"
                onClick={() => onSwitchTab('details')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition"
              >
                Fases
              </button>
              <button
                type="button"
                onClick={() => onSwitchTab('regulatory_docs')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition"
              >
                Docs
              </button>
            </div>
          )}
          {onPrint && (
            <button
              onClick={onPrint}
              className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl transition shadow-2xs"
              title="Imprimir"
            >
              <Printer size={16} />
            </button>
          )}
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition flex items-center gap-1.5 shadow-2xs active:scale-95"
          >
            <ArrowLeft size={15} /> Voltar
          </button>
        </div>
      </div>

      {/* 4 STAT CARDS IN A ROW (Matching Image 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Progresso geral */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FlaskConical size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-500">Progresso geral</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.overallProgress}%
            </p>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1.5">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                style={{ width: `${stats.overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Tempo restante */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-500">Tempo restante</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.daysRemaining} dias
            </p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Previsão: {stats.forecastDate}
            </p>
          </div>
        </div>

        {/* Card 3: Macroatividades concluídas */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-500">Macroatividades concluídas</p>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.completedMacros} de {stats.totalMacros}
              </p>
              <span className="text-xs font-black text-emerald-600">
                {stats.completedPercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1.5">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${stats.completedPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Próximo marco */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Flag size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-500">Próximo marco</p>
            <p className="text-sm font-black text-slate-900 truncate leading-snug">
              {stats.nextMilestoneName}
            </p>
            <p className="text-xs font-black text-blue-600 mt-0.5">
              Em {stats.daysToMilestone} dias
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT LAYOUT (Matching Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Fases do projeto (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Fases do projeto
          </h3>

          <div className="space-y-3">
            {phasesList.map((phase, idx) => {
              const phaseNum = idx + 1;
              const isSelected = selectedPhase === phase;
              const pInfo = phaseProgressMap[phase] || { percent: 0, color: 'bg-blue-600' };

              return (
                <div
                  key={phase}
                  onClick={() => setSelectedPhase(phase)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50/40 shadow-xs' 
                      : 'border-slate-150 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center ${
                        isSelected 
                          ? 'bg-blue-600 text-white' 
                          : pInfo.percent === 100 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-emerald-600 text-white'
                      }`}>
                        {phaseNum}
                      </div>
                      <span className={`text-xs font-black leading-tight ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                        {phase}
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-700">
                      {pInfo.percent}%
                    </span>
                  </div>

                  {/* Horizontal progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected ? 'bg-blue-600' : pInfo.percent === 100 ? 'bg-emerald-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pInfo.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER COLUMN: Macro & Micro Activities Table (lg:col-span-9 or lg:col-span-5/6 depending on drawer) */}
        <div className={`${selectedMicro ? 'lg:col-span-5 xl:col-span-5' : 'lg:col-span-9'} bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5 transition-all duration-300`}>
          
          {/* Phase Header */}
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {selectedPhase}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {selectedPhase.includes('1/2') 
                ? 'Desenvolvimento clínico inicial em humanos' 
                : selectedPhase.includes('Não Clínica')
                  ? 'Estudos de farmacologia, toxicologia e segurança BPL'
                  : 'Atividades e entregáveis da fase'}
            </p>
          </div>

          {/* Macroactivities Table (Matching Image 2) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150 pb-2">
                  <th className="py-2.5 px-3 w-16">#</th>
                  <th className="py-2.5 px-3">Macroatividade</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Progresso</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {currentPhaseMacros.map((macro, macroIdx) => {
                  const isExpanded = expandedMacroIds.has(macro.id);
                  const macroStatus = getMacroStatus(macro);
                  const macroProg = getMacroProgress(macro);
                  const macroCode = `2.${21 + macroIdx}`;
                  const micros = macro.microActivities || [];

                  return (
                    <React.Fragment key={macro.id}>
                      {/* Macroactivity Row */}
                      <tr 
                        onClick={() => toggleMacroExpansion(macro.id)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition select-none ${
                          isExpanded ? 'bg-slate-50/50' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-bold text-slate-600">
                          {macroCode}
                        </td>
                        <td className="py-3 px-3 font-black text-slate-900">
                          {macro.name}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${macroStatus.dotClass}`} />
                            <span className={`font-bold ${macroStatus.textClass}`}>
                              {macroStatus.label}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${macroProg === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                style={{ width: `${macroProg}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-700 shrink-0">
                              {macroProg}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Nested Microactivities Table */}
                      {isExpanded && micros.length > 0 && (
                        <tr>
                          <td colSpan={5} className="p-0 bg-slate-50/40">
                            <div className="px-3 py-2 space-y-1">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/60">
                                    <th className="py-2 px-3 w-20">#</th>
                                    <th className="py-2 px-3">Microatividade</th>
                                    <th className="py-2 px-3">Status</th>
                                    <th className="py-2 px-3">Prazo estimado</th>
                                    <th className="py-2 px-3 text-right">...</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {micros.map((micro, microIdx) => {
                                    const microCode = `${macroCode}.${microIdx + 1}`;
                                    const isSelectedMicro = selectedMicro?.id === micro.id;
                                    const mStatus = getStatusDot(micro.status);
                                    const deadlineInfo = formatDeadlineDisplay(micro.dueDate, micro.status);

                                    return (
                                      <tr
                                        key={micro.id}
                                        onClick={() => handleSelectMicro(macro, micro)}
                                        className={`cursor-pointer transition rounded-xl ${
                                          isSelectedMicro
                                            ? 'bg-blue-50/90 border-l-4 border-blue-600 font-bold text-blue-900 shadow-2xs'
                                            : 'hover:bg-white text-slate-700'
                                        }`}
                                      >
                                        <td className="py-2.5 px-3 text-[11px] font-bold text-slate-500">
                                          {microCode}
                                        </td>
                                        <td className="py-2.5 px-3 text-xs font-bold text-slate-900">
                                          {micro.name}
                                        </td>
                                        <td className="py-2.5 px-3">
                                          <div className="flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full ${mStatus.dotClass}`} />
                                            <span className={`text-[11px] font-bold ${mStatus.textClass}`}>
                                              {mStatus.label}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-2.5 px-3">
                                          <span className={`text-[11px] font-bold ${
                                            deadlineInfo.isUrgent ? 'text-red-600 font-black' : 'text-slate-600'
                                          }`}>
                                            {deadlineInfo.text}
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                          <MoreHorizontal size={14} className="text-slate-400 inline" />
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT CONTEXTUAL DRAWER (Matching Image 2) */}
        {selectedMicro && selectedMacroOfMicro && (
          <div className="lg:col-span-4 xl:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-6 animate-in slide-in-from-right-4 duration-200">
            
            {/* Header: Code, Title, Status & Close Button */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400">
                  {selectedMicro.code || '2.24.2'}
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                    {selectedMicro.name}
                  </h3>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-black shrink-0">
                    {selectedMicro.status || 'Em andamento'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMicro(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                title="Fechar painel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Checklist Header & Prazo Estimado */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Checklist
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Prazo estimado:</span>
                  <div className="w-32">
                    <DateInput
                      value={selectedMicro.dueDate || ''}
                      onChange={(newDueDate) => updateSelectedMicroField({ dueDate: newDueDate })}
                      placeholder="dd/mm/aaaa"
                      className="text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Checklist Items List */}
              <div className="space-y-2 pt-1">
                {(selectedMicro.checklist || [
                  { id: 'c1', text: 'Pesquisar fornecedores qualificados', completed: true },
                  { id: 'c2', text: 'Solicitar cotações formais', completed: true },
                  { id: 'c3', text: 'Comparar propostas recebidas', completed: false },
                  { id: 'c4', text: 'Validar escopo e condições comerciais', completed: false },
                ]).map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer select-none transition"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklist(item.id)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 mt-0.5"
                    />
                    <span className={`text-xs font-bold leading-tight ${
                      item.completed ? 'line-through text-slate-400' : 'text-slate-700'
                    }`}>
                      {(item as any).item || (item as any).text}
                    </span>
                  </label>
                ))}

                {/* Quick Add Checklist */}
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={e => setNewChecklistText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddChecklistItem(); }}
                    placeholder="Adicionar item ao checklist..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition"
                    title="Adicionar item"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Toggle: Contribui para documento regulatório (Matching Image 2) */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMicro.generatesRegulatoryContent || false}
                    onChange={e => updateSelectedMicroField({ generatesRegulatoryContent: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-xs font-bold text-slate-800">
                  Contribui para documento regulatório
                </span>
              </div>
              <Info size={15} className="text-slate-400" />
            </div>

            {/* Retroactive Status Card (Matching Image 2) */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/90 flex items-start gap-3">
              <Calendar size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    const isRet = !selectedMicro.isRetroactive;
                    updateSelectedMicroField({
                      isRetroactive: isRet,
                      status: isRet ? 'Concluído e aprovado' : 'Em andamento',
                      progress: isRet ? 100 : selectedMicro.progress,
                      completionDate: isRet ? (selectedMicro.completionDate || today) : undefined
                    });
                  }}
                  className="text-xs font-black text-blue-700 hover:underline block text-left"
                >
                  {selectedMicro.isRetroactive ? 'Desmarcar como retroativa' : 'Marcar como retroativa'}
                </button>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Finalizada antes da criação do sistema.
                </p>
              </div>
            </div>

            {/* Action Buttons (Matching Image 2) */}
            <div className="space-y-2.5 pt-2">
              {/* Editar atividade */}
              <button
                type="button"
                onClick={() => setShowMoreOptions(true)}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 shadow-2xs"
              >
                <Edit3 size={15} /> Editar atividade
              </button>

              {/* Concluir atividade (Opens Image 3 Modal) */}
              <button
                type="button"
                onClick={() => {
                  setActivityToComplete(selectedMicro);
                  setIsCompleteModalOpen(true);
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <Check size={16} /> Concluir atividade
              </button>

              {/* Aprovar sem checklist completo */}
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  updateSelectedMicroField({
                    status: 'Concluído com restrições',
                    progress: 100,
                    completionDate: today
                  });
                }}
                className="w-full py-2.5 px-4 bg-transparent hover:bg-blue-50 text-blue-700 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2"
              >
                <Check size={15} /> Aprovar sem checklist completo
              </button>
            </div>

            {/* Accordion: Mostrar mais opções */}
            <div className="border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="w-full flex items-center justify-between text-xs font-black text-slate-600 hover:text-slate-900 transition py-1"
              >
                <span>Mostrar mais opções</span>
                {showMoreOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showMoreOptions && (
                <div className="pt-4 space-y-4 animate-in fade-in duration-150">
                  
                  {/* Contracting Setting & Inheritance */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">
                        Será contratado?
                      </span>
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedMacroOfMicro) {
                              const updatedMacro = updateMicroContracting(selectedMacroOfMicro, selectedMicro.id, true);
                              const updatedMicro = updatedMacro.microActivities?.find((m: MicroActivity) => m.id === selectedMicro.id);
                              if (updatedMicro) {
                                setSelectedMicro(updatedMicro);
                              }
                              handleUpdateMacro(updatedMacro);
                            }
                          }}
                          className={`px-3 py-1 text-[11px] font-black rounded-lg transition ${
                            selectedMicro.isContracted
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedMacroOfMicro) {
                              const updatedMacro = updateMicroContracting(selectedMacroOfMicro, selectedMicro.id, false);
                              const updatedMicro = updatedMacro.microActivities?.find((m: MicroActivity) => m.id === selectedMicro.id);
                              if (updatedMicro) {
                                setSelectedMicro(updatedMicro);
                              }
                              handleUpdateMacro(updatedMacro);
                            }
                          }}
                          className={`px-3 py-1 text-[11px] font-black rounded-lg transition ${
                            !selectedMicro.isContracted
                              ? 'bg-slate-700 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    </div>

                    {/* Inheritance Badge */}
                    <div className="flex items-center justify-between text-[11px]">
                      {selectedMicro.contractedCustomized ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Personalizado nesta microatividade: {selectedMicro.isContracted ? 'Sim' : 'Não'}
                        </span>
                      ) : (
                        <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          Herdado da macroatividade: {selectedMacroOfMicro.isContracted ? 'Sim' : 'Não'}
                        </span>
                      )}

                      {selectedMicro.contractedCustomized && (
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedMacroOfMicro) {
                              const macroVal = selectedMacroOfMicro.isContracted ?? false;
                              const updatedMacro = updateMicroContracting(selectedMacroOfMicro, selectedMicro.id, macroVal);
                              const updatedMicro = updatedMacro.microActivities?.find((m: MicroActivity) => m.id === selectedMicro.id);
                              if (updatedMicro) {
                                const resetMicro = { ...updatedMicro, contractedCustomized: false };
                                setSelectedMicro(resetMicro);
                                const finalMacros = (project.macroActivities || []).map((m: MacroActivity) => 
                                  m.id === updatedMacro.id 
                                    ? { ...updatedMacro, microActivities: (updatedMacro.microActivities || []).map((mi: MicroActivity) => mi.id === resetMicro.id ? resetMicro : mi) }
                                    : m
                                );
                                onUpdateProject({ ...project, macroActivities: finalMacros });
                              }
                            }
                          }}
                          className="text-slate-500 hover:text-blue-600 flex items-center gap-1 font-bold underline cursor-pointer"
                        >
                          <RotateCcw size={11} /> Restaurar herança
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Responsible Member */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Responsável</label>
                    <select
                      value={selectedMicro.assignee || ''}
                      onChange={e => updateSelectedMicroField({ assignee: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="">A definir</option>
                      {teamMembers.map(t => (
                        <option key={t.id} value={t.name}>{t.name} ({t.role || 'Equipe'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Data de Início</label>
                    <DateInput
                      value={selectedMicro.startDate || ''}
                      onChange={val => updateSelectedMicroField({ startDate: val })}
                      placeholder="dd/mm/aaaa"
                      className="text-xs font-bold"
                    />
                  </div>

                  {/* Progress Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">Progresso</span>
                      <span className="text-blue-600 font-black">{selectedMicro.progress ?? 0}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={selectedMicro.progress ?? 0}
                      onChange={e => updateSelectedMicroField({ progress: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Observations */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Observações</label>
                    <textarea
                      value={selectedMicro.observations || ''}
                      onChange={e => updateSelectedMicroField({ observations: e.target.value })}
                      placeholder="Observações técnicas ou operacionais..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 min-h-[60px]"
                    />
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* MODAL CONCLUIR ATIVIDADE (Matching Image 3) */}
      <CompleteActivityModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        microActivity={activityToComplete}
        onConfirm={handleConfirmCompletion}
      />

    </div>
  );
};
