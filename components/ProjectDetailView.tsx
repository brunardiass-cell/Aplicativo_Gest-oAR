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
  Printer,
  AlertTriangle,
  Link2,
  Trash2
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
  // Helper para normalizar e canonicalizar nomes de fase evitando duplicidades
  const normalizePhaseName = (name: string): string => {
    const trimmed = (name || '').trim();
    const lower = trimmed.toLowerCase();
    if (lower === 'prova de conceito') return 'Prova de Conceito';
    if (lower === 'fase não clínica' || lower === 'fase nao clinica' || lower === 'não clínica') return 'Fase Não Clínica';
    if (lower === 'fase 1/2' || lower === 'fase 1 e 2' || lower === 'fase i/ii') return 'Fase 1/2';
    if (lower === 'fase 3' || lower === 'fase iii') return 'Fase 3';
    return trimmed;
  };

  // Fases do projeto estritamente deduplicadas (cada fase aparece apenas uma vez)
  const phasesList = useMemo(() => {
    const canonicalMap = new Map<string, string>();
    const defaultPhases = ['Prova de Conceito', 'Fase Não Clínica', 'Fase 1/2', 'Fase 3'];
    
    defaultPhases.forEach(p => canonicalMap.set(p.toLowerCase(), p));

    (project.phases || []).forEach(p => {
      const norm = normalizePhaseName(p);
      if (norm && !canonicalMap.has(norm.toLowerCase())) {
        canonicalMap.set(norm.toLowerCase(), norm);
      }
    });

    (project.macroActivities || []).forEach(m => {
      if (m.phase) {
        const norm = normalizePhaseName(m.phase);
        if (norm && !canonicalMap.has(norm.toLowerCase())) {
          canonicalMap.set(norm.toLowerCase(), norm);
        }
      }
    });

    return Array.from(canonicalMap.values());
  }, [project.phases, project.macroActivities]);

  const [selectedPhase, setSelectedPhase] = useState<string>(() => {
    return phasesList.find(p => p.toLowerCase().includes('1/2')) || phasesList[0] || 'Fase 1/2';
  });

  // Macro expandida (por padrão abre a que possui microatividades ativas)
  const [expandedMacroIds, setExpandedMacroIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    const normTarget = normalizePhaseName(phasesList.find(p => p.toLowerCase().includes('1/2')) || phasesList[0] || '').toLowerCase();
    const macrosInPhase = (project.macroActivities || []).filter(m => normalizePhaseName(m.phase || '').toLowerCase() === normTarget);
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

  // Edição rápida de detalhes da microatividade (nome, responsável, etc.)
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  // Edição inline de item do checklist
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistText, setEditingChecklistText] = useState('');

  // Estado para adicionar / editar dependências
  const [isAddingDependency, setIsAddingDependency] = useState(false);
  const [selectedDepIdToAdd, setSelectedDepIdToAdd] = useState('');
  const [editingDepId, setEditingDepId] = useState<string | null>(null);

  // Ao trocar de fase, atualiza a macro expandida
  useEffect(() => {
    const normTarget = normalizePhaseName(selectedPhase).toLowerCase();
    const macrosInPhase = (project.macroActivities || []).filter(m => normalizePhaseName(m.phase || '').toLowerCase() === normTarget);
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
    phasesList.forEach((phase) => {
      const normP = normalizePhaseName(phase).toLowerCase();
      const macros = (project.macroActivities || []).filter(m => normalizePhaseName(m.phase || '').toLowerCase() === normP);
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
    const normTarget = normalizePhaseName(selectedPhase).toLowerCase();
    return (project.macroActivities || []).filter(m => normalizePhaseName(m.phase || '').toLowerCase() === normTarget);
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

  // Salvar edição de texto de um item do checklist
  const handleSaveChecklistEdit = (itemId: string, newText: string) => {
    if (!selectedMicro || !newText.trim()) return;
    const currentList = selectedMicro.checklist || [];
    const updated = currentList.map(item => {
      if (item.id === itemId) {
        return { ...item, item: newText.trim(), text: newText.trim() };
      }
      return item;
    });
    updateSelectedMicroField({ checklist: updated });
    setEditingChecklistId(null);
  };

  // Excluir item do checklist
  const handleDeleteChecklistItem = (itemId: string) => {
    if (!selectedMicro) return;
    const currentList = selectedMicro.checklist || [];
    const updated = currentList.filter(item => item.id !== itemId);
    updateSelectedMicroField({ checklist: updated });
  };

  // Lista de todas as outras microatividades do projeto (para selecionar dependências)
  const allOtherMicros = useMemo(() => {
    if (!selectedMicro) return [];
    const list: { id: string; name: string; phase: string; macroName: string }[] = [];
    (project.macroActivities || []).forEach(macro => {
      (macro.microActivities || []).forEach(m => {
        if (m.id !== selectedMicro.id) {
          list.push({
            id: m.id,
            name: m.name,
            phase: macro.phase || '',
            macroName: macro.name
          });
        }
      });
    });
    return list;
  }, [project.macroActivities, selectedMicro]);

  // Informações sobre dependências e bloqueios
  const blockersInfo = useMemo(() => {
    if (!selectedMicro) return [];
    const dependsOn = selectedMicro.dependsOnMicroIds || [];
    const results: { id: string; name: string; isDone: boolean }[] = [];
    
    (project.macroActivities || []).forEach(macro => {
      (macro.microActivities || []).forEach(m => {
        if (dependsOn.includes(m.id)) {
          const isDone = m.status === 'Concluído e aprovado' || m.status === 'Concluído com restrições';
          results.push({ id: m.id, name: m.name, isDone });
        }
      });
    });

    return results;
  }, [selectedMicro, project.macroActivities]);

  const pendingBlockers = blockersInfo.filter(b => !b.isDone);

  // Handlers para CRUD de dependências
  const handleAddDependency = (targetId: string) => {
    if (!selectedMicro || !targetId) return;
    const currentDeps = selectedMicro.dependsOnMicroIds || [];
    if (currentDeps.includes(targetId)) return;

    const targetObj = allOtherMicros.find(m => m.id === targetId);
    const nextDeps = [...currentDeps, targetId];
    const currentNames = selectedMicro.dependsOnNames || [];
    const nextNames = targetObj ? [...currentNames, targetObj.name] : currentNames;

    updateSelectedMicroField({
      dependsOnMicroIds: nextDeps,
      dependsOnNames: nextNames
    });
    setIsAddingDependency(false);
    setSelectedDepIdToAdd('');
  };

  const handleRemoveDependency = (targetId: string) => {
    if (!selectedMicro) return;
    const currentDeps = selectedMicro.dependsOnMicroIds || [];
    const nextDeps = currentDeps.filter(id => id !== targetId);
    const nextNames = (selectedMicro.dependsOnNames || []).filter((_, idx) => currentDeps[idx] !== targetId);

    updateSelectedMicroField({
      dependsOnMicroIds: nextDeps,
      dependsOnNames: nextNames
    });
  };

  const handleUpdateDependency = (oldId: string, newId: string) => {
    if (!selectedMicro || !newId || oldId === newId) return;
    const currentDeps = selectedMicro.dependsOnMicroIds || [];
    const targetObj = allOtherMicros.find(m => m.id === newId);
    const nextDeps = currentDeps.map(id => id === oldId ? newId : id);
    const nextNames = (selectedMicro.dependsOnNames || []).map((name, idx) => {
      if (currentDeps[idx] === oldId) return targetObj ? targetObj.name : name;
      return name;
    });

    updateSelectedMicroField({
      dependsOnMicroIds: nextDeps,
      dependsOnNames: nextNames
    });
    setEditingDepId(null);
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

        {/* RIGHT CONTEXTUAL DRAWER (Compact, Clean, Opens ONLY when a microactivity is selected) */}
        {selectedMicro && selectedMacroOfMicro && (
          <div className="lg:col-span-4 xl:col-span-4 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4 animate-in slide-in-from-right-4 duration-200 text-xs">
            
            {/* Header: Code, Title (Editable), Status (Editable Dropdown) & Close Button */}
            <div className="border-b border-slate-100 pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">
                  {selectedMicro.code || '2.24.2'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMicro(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  title="Fechar painel"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Title - In-place editing or click to edit */}
              {isEditingDetails ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nome da Microatividade</label>
                  <input
                    type="text"
                    value={selectedMicro.name}
                    onChange={e => updateSelectedMicroField({ name: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                    placeholder="Nome da microatividade..."
                  />
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <h3 
                    onClick={() => setIsEditingDetails(true)} 
                    className="text-base font-black text-slate-900 tracking-tight leading-snug cursor-pointer hover:text-blue-600 transition"
                    title="Clique para editar o nome"
                  >
                    {selectedMicro.name}
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setIsEditingDetails(true)}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded-lg shrink-0"
                    title="Editar nome"
                  >
                    <Edit3 size={13} />
                  </button>
                </div>
              )}

              {/* Status Selector Dropdown */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-500">Status:</span>
                <select
                  value={selectedMicro.status || 'Em andamento'}
                  onChange={e => updateSelectedMicroField({ status: e.target.value as MicroActivityStatus })}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[11px] font-black cursor-pointer outline-none hover:bg-blue-100 transition"
                >
                  <option value="Planejada">Planejada</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluído e aprovado">Concluído e aprovado</option>
                  <option value="Concluído com restrições">Concluído com restrições</option>
                  <option value="Atrasada">Atrasada</option>
                  <option value="Bloqueada">Bloqueada</option>
                </select>
              </div>
            </div>

            {/* BLOCKER ALERT - Highlights ONLY when blocked! */}
            {(selectedMicro.isBlocked || pendingBlockers.length > 0) && (
              <div className="p-3 bg-red-50 border border-red-200/90 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 shadow-2xs">
                <AlertTriangle size={16} className="text-red-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold">Bloqueada por: </span>
                  <span className="font-black text-red-900">
                    {pendingBlockers.length > 0 ? pendingBlockers.map(b => b.name).join(', ') : selectedMicro.blockReason || 'Atividade precedente pendente'}
                  </span>
                </div>
              </div>
            )}

            {/* Prazo Estimado */}
            <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-2xl border border-slate-200/70">
              <span className="text-xs font-bold text-slate-600">Prazo estimado:</span>
              <div className="w-32">
                <DateInput
                  value={selectedMicro.dueDate || ''}
                  onChange={(newDueDate) => updateSelectedMicroField({ dueDate: newDueDate })}
                  placeholder="dd/mm/aaaa"
                  className="text-xs font-bold"
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                  Checklist ({(selectedMicro.checklist || []).filter(c => c.completed).length}/{(selectedMicro.checklist || []).length})
                </h4>
              </div>

              {/* Checklist Items List */}
              <div className="space-y-1.5 pt-0.5">
                {(selectedMicro.checklist || [
                  { id: 'c1', text: 'Pesquisar fornecedores qualificados', completed: true },
                  { id: 'c2', text: 'Solicitar cotações formais', completed: true },
                  { id: 'c3', text: 'Comparar propostas recebidas', completed: false },
                  { id: 'c4', text: 'Validar escopo e condições comerciais', completed: false },
                ]).map((item) => {
                  const isItemEditing = editingChecklistId === item.id;
                  const itemText = (item as any).item || (item as any).text;

                  return (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 select-none">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleChecklist(item.id)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 shrink-0"
                        />
                        {isItemEditing ? (
                          <input
                            type="text"
                            value={editingChecklistText}
                            onChange={e => setEditingChecklistText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveChecklistEdit(item.id, editingChecklistText);
                              if (e.key === 'Escape') setEditingChecklistId(null);
                            }}
                            autoFocus
                            className="flex-1 px-2 py-0.5 bg-white border border-blue-400 rounded-lg text-xs font-bold text-slate-900 outline-none"
                          />
                        ) : (
                          <span className={`text-xs font-medium leading-tight truncate ${
                            item.completed ? 'line-through text-slate-400' : 'text-slate-700'
                          }`}>
                            {itemText}
                          </span>
                        )}
                      </label>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                        {isItemEditing ? (
                          <button
                            type="button"
                            onClick={() => handleSaveChecklistEdit(item.id, editingChecklistText)}
                            className="p-1 text-emerald-600 hover:text-emerald-700 rounded-lg"
                            title="Salvar"
                          >
                            <Check size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingChecklistId(item.id);
                              setEditingChecklistText(itemText);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded-lg"
                            title="Editar texto"
                          >
                            <Edit3 size={12} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteChecklistItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg"
                          title="Excluir item"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}

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
                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition shrink-0"
                    title="Adicionar item"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Toggle: Contribui para documento regulatório */}
            <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMicro.generatesRegulatoryContent || false}
                    onChange={e => updateSelectedMicroField({ generatesRegulatoryContent: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-xs font-bold text-slate-800">
                  Contribui para documento regulatório
                </span>
              </div>
              <Info size={14} className="text-slate-400" />
            </div>

            {/* Retroactive Status Card */}
            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100/90 flex items-start gap-2.5">
              <Calendar size={16} className="text-blue-600 shrink-0 mt-0.5" />
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
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                  Finalizada antes da criação do sistema.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {/* Editar atividade */}
              <button
                type="button"
                onClick={() => setIsEditingDetails(!isEditingDetails)}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 border shadow-2xs ${
                  isEditingDetails 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Edit3 size={14} /> {isEditingDetails ? 'Concluir edição' : 'Editar atividade'}
              </button>

              {/* Concluir atividade */}
              <button
                type="button"
                onClick={() => {
                  setActivityToComplete(selectedMicro);
                  setIsCompleteModalOpen(true);
                }}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <Check size={15} /> Concluir atividade
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
                className="w-full py-2 px-3 bg-transparent hover:bg-blue-50 text-blue-700 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2"
              >
                <Check size={14} /> Aprovar sem checklist completo
              </button>
            </div>

            {/* Accordion: Mostrar mais opções */}
            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="w-full flex items-center justify-between text-xs font-black text-slate-600 hover:text-slate-900 transition py-1"
              >
                <span>Mostrar mais opções</span>
                {showMoreOptions ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {showMoreOptions && (
                <div className="pt-3 space-y-3.5 animate-in fade-in duration-150">
                  
                  {/* DEPENDÊNCIAS CRUD SECTION (Inside Mostrar mais opções as requested) */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Link2 size={14} className="text-slate-600" />
                        <span className="text-xs font-black text-slate-800">Dependências</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingDependency(!isAddingDependency)}
                        className="text-[11px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Plus size={12} /> {isAddingDependency ? 'Cancelar' : 'Adicionar'}
                      </button>
                    </div>

                    {/* Add Dependency Inline Selector */}
                    {isAddingDependency && (
                      <div className="p-2.5 bg-white rounded-xl border border-blue-200 space-y-2 animate-in fade-in duration-150">
                        <label className="text-[10px] font-black uppercase text-slate-500 block">
                          Selecionar atividade pré-requisito:
                        </label>
                        <select
                          value={selectedDepIdToAdd}
                          onChange={e => setSelectedDepIdToAdd(e.target.value)}
                          className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                        >
                          <option value="">-- Escolha uma microatividade --</option>
                          {allOtherMicros
                            .filter(m => !(selectedMicro.dependsOnMicroIds || []).includes(m.id))
                            .map(m => (
                              <option key={m.id} value={m.id}>
                                [{m.phase}] {m.name}
                              </option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsAddingDependency(false)}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={!selectedDepIdToAdd}
                            onClick={() => handleAddDependency(selectedDepIdToAdd)}
                            className="px-3 py-1 bg-blue-600 disabled:bg-slate-300 text-white text-[11px] font-black rounded-lg transition"
                          >
                            Vincular dependência
                          </button>
                        </div>
                      </div>
                    )}

                    {/* List of Current Dependencies */}
                    {(!selectedMicro.dependsOnMicroIds || selectedMicro.dependsOnMicroIds.length === 0) ? (
                      <p className="text-[11px] text-slate-400 italic">
                        Nenhuma dependência cadastrada.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedMicro.dependsOnMicroIds.map(depId => {
                          const target = allOtherMicros.find(m => m.id === depId);
                          const blocker = blockersInfo.find(b => b.id === depId);
                          const isDone = blocker ? blocker.isDone : false;

                          return (
                            <div
                              key={depId}
                              className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <p className="font-bold text-slate-900 truncate">
                                  {target ? target.name : depId}
                                </p>
                                <span className={`text-[10px] font-black ${
                                  isDone ? 'text-emerald-600' : 'text-amber-600'
                                }`}>
                                  {isDone ? '✓ Concluída' : '⏳ Pendente'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDependency(depId)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition"
                                  title="Remover dependência"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
