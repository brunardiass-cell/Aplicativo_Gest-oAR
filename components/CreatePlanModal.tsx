import React, { useState, useMemo } from 'react';
import { 
  X, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  GripVertical, 
  RefreshCw, 
  MoreHorizontal, 
  Plus, 
  Layers, 
  BarChart2, 
  Sparkles, 
  Flag, 
  Info, 
  Pencil, 
  Trash2,
  SlidersHorizontal
} from 'lucide-react';
import { ActivityPlanTemplate, MacroActivityTemplate } from '../types';
import { 
  DEFAULT_OPERATIONAL_TEMPLATES, 
  detectMacroActivityType,
  applyAutomaticDependencies,
  OperationalTemplateKey
} from '../utils/operationalTemplates';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPlan: ActivityPlanTemplate, saveAsDefaultTemplates: boolean) => void;
  existingPlans?: ActivityPlanTemplate[];
}

interface PhaseDefinition {
  id: string;
  name: string;
  description: string;
  badgeNumber: number;
  badgeColor: string;
  selected: boolean;
  macros: Array<{
    id: string;
    code: string;
    name: string;
    templateType: OperationalTemplateKey;
    templateLabel: string;
    isContracted?: boolean;
  }>;
}

const DEFAULT_PHASES_SETUP: PhaseDefinition[] = [
  {
    id: 'fase_poc',
    name: 'Prova de Conceito',
    description: 'Estudos iniciais e comprovação do conceito',
    badgeNumber: 1,
    badgeColor: 'bg-emerald-600 text-white',
    selected: true,
    macros: [
      { id: 'poc_1', code: '1.1', name: 'Desenvolvimento do bioprocesso inicial', templateType: 'development_process', templateLabel: 'Desenvolvimento técnico/processo' },
      { id: 'poc_2', code: '1.2', name: 'Caracterização preliminar do antígeno', templateType: 'characterization', templateLabel: 'Caracterização' },
      { id: 'poc_3', code: '1.3', name: 'Controle de qualidade analítico', templateType: 'quality_control', templateLabel: 'Controle de qualidade' },
      { id: 'poc_4', code: '1.4', name: 'Ensaio de imunogenicidade preliminar', templateType: 'biological_assay', templateLabel: 'Atividade biológica/laboratorial' },
      { id: 'poc_5', code: '1.5', name: 'Relatório técnico de prova de conceito', templateType: 'regulatory_document', templateLabel: 'Documento regulatório' },
    ]
  },
  {
    id: 'fase_nao_clinica',
    name: 'Fase Não Clínica',
    description: 'Estudos não clínicos (pré-clínicos)',
    badgeNumber: 2,
    badgeColor: 'bg-blue-600 text-white',
    selected: true,
    macros: [
      { id: 'nc_1', code: '2.1', name: 'Controle de qualidade', templateType: 'quality_control', templateLabel: 'Controle de qualidade' },
      { id: 'nc_2', code: '2.2', name: 'Estabilidade', templateType: 'stability', templateLabel: 'Estabilidade' },
      { id: 'nc_3', code: '2.3', name: 'Serviços / contratos', templateType: 'glp_safety', templateLabel: 'Serviços / contratos' },
      { id: 'nc_4', code: '2.4', name: 'Fabricação de lote', templateType: 'batch_manufacturing', templateLabel: 'Fabricação de lote' },
      { id: 'nc_5', code: '2.5', name: 'Caracterização', templateType: 'characterization', templateLabel: 'Caracterização' },
      { id: 'nc_6', code: '2.6', name: 'Documento regulatório', templateType: 'regulatory_document', templateLabel: 'Documento regulatório' },
    ]
  },
  {
    id: 'fase_1_2',
    name: 'Fase 1/2',
    description: 'Estudos clínicos de Fase 1 e 2',
    badgeNumber: 3,
    badgeColor: 'bg-purple-600 text-white',
    selected: true,
    macros: [
      { id: 'c12_1', code: '3.1', name: 'Produção do lote clínico (GMP)', templateType: 'batch_manufacturing', templateLabel: 'Fabricação de lote' },
      { id: 'c12_2', code: '3.2', name: 'Controle de qualidade de liberação clínica', templateType: 'quality_control', templateLabel: 'Controle de qualidade' },
      { id: 'c12_3', code: '3.3', name: 'Estudo de estabilidade em tempo real', templateType: 'stability', templateLabel: 'Estabilidade' },
      { id: 'c12_4', code: '3.4', name: 'Preparação e submissão do protocolo clínico', templateType: 'regulatory_document', templateLabel: 'Documento regulatório' },
      { id: 'c12_5', code: '3.5', name: 'Ensaios clínicos Fase 1/2', templateType: 'biological_assay', templateLabel: 'Atividade biológica/laboratorial' },
      { id: 'c12_6', code: '3.6', name: 'Relatório clínico consolidado', templateType: 'regulatory_document', templateLabel: 'Documento regulatório' },
    ]
  },
  {
    id: 'fase_3',
    name: 'Fase 3',
    description: 'Estudos clínicos de Fase 3',
    badgeNumber: 4,
    badgeColor: 'bg-slate-600 text-white',
    selected: false,
    macros: [
      { id: 'c3_1', code: '4.1', name: 'Escalonamento industrial do bioprocesso', templateType: 'batch_manufacturing', templateLabel: 'Fabricação de lote' },
      { id: 'c3_2', code: '4.2', name: 'Validação de métodos analíticos e CQ', templateType: 'quality_control', templateLabel: 'Controle de qualidade' },
      { id: 'c3_3', code: '4.3', name: 'Estudo de comparabilidade analítica', templateType: 'comparability', templateLabel: 'Comparabilidade' },
      { id: 'c3_4', code: '4.4', name: 'Estudo clínico multicêntrico de Fase 3', templateType: 'biological_assay', templateLabel: 'Atividade biológica/laboratorial' },
      { id: 'c3_5', code: '4.5', name: 'Dossiê consolidado para registro sanitário', templateType: 'regulatory_document', templateLabel: 'Documento regulatório' },
      { id: 'c3_6', code: '4.6', name: 'Suporte de submissão e cumprimento de exigências', templateType: 'regulatory_document', templateLabel: 'Gestão regulatória' },
    ]
  }
];

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingPlans = []
}) => {
  const [phases, setPhases] = useState<PhaseDefinition[]>(DEFAULT_PHASES_SETUP);
  const [expandedPhaseId, setExpandedPhaseId] = useState<string>('fase_nao_clinica');
  const [templateApplyMode, setTemplateApplyMode] = useState<'only_this_plan' | 'save_for_future'>('only_this_plan');
  const [planName, setPlanName] = useState('Plano Padrão de Vacinas');
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editingMacroId, setEditingMacroId] = useState<string | null>(null);
  const [tempMacroName, setTempMacroName] = useState('');
  const [newMacroPhaseId, setNewMacroPhaseId] = useState<string | null>(null);
  const [newMacroNameInput, setNewMacroNameInput] = useState('');
  const [newMacroTemplateType, setNewMacroTemplateType] = useState<OperationalTemplateKey>('quality_control');

  // Toggle seleção de fase
  const handleTogglePhase = (phaseId: string) => {
    setPhases(prev => prev.map(p => {
      if (p.id === phaseId) {
        const nextSelected = !p.selected;
        if (nextSelected && !expandedPhaseId) {
          setExpandedPhaseId(p.id);
        }
        return { ...p, selected: nextSelected };
      }
      return p;
    }));
  };

  // Alternar accordion
  const handleToggleAccordion = (phaseId: string) => {
    setExpandedPhaseId(prev => prev === phaseId ? '' : phaseId);
  };

  // Adicionar nova macroatividade a uma fase
  const handleAddMacroToPhase = (phaseId: string) => {
    if (!newMacroNameInput.trim()) return;
    const templateDef = DEFAULT_OPERATIONAL_TEMPLATES[newMacroTemplateType];
    setPhases(prev => prev.map(p => {
      if (p.id === phaseId) {
        const nextIndex = p.macros.length + 1;
        const phaseNumber = p.badgeNumber;
        const newMacro = {
          id: `macro_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          code: `${phaseNumber}.${nextIndex}`,
          name: newMacroNameInput.trim(),
          templateType: newMacroTemplateType,
          templateLabel: templateDef ? templateDef.name : 'Controle de qualidade'
        };
        return { ...p, macros: [...p.macros, newMacro] };
      }
      return p;
    }));
    setNewMacroNameInput('');
    setNewMacroPhaseId(null);
  };

  // Trocar template de uma macroatividade
  const handleChangeTemplate = (phaseId: string, macroId: string, nextType: OperationalTemplateKey) => {
    const templateDef = DEFAULT_OPERATIONAL_TEMPLATES[nextType];
    setPhases(prev => prev.map(p => {
      if (p.id === phaseId) {
        return {
          ...p,
          macros: p.macros.map(m => {
            if (m.id === macroId) {
              return {
                ...m,
                templateType: nextType,
                templateLabel: templateDef ? templateDef.name : m.templateLabel
              };
            }
            return m;
          })
        };
      }
      return p;
    }));
  };

  // Excluir macroatividade
  const handleDeleteMacro = (phaseId: string, macroId: string) => {
    setPhases(prev => prev.map(p => {
      if (p.id === phaseId) {
        const filtered = p.macros.filter(m => m.id !== macroId);
        // reindexa códigos
        const reindexed = filtered.map((m, idx) => ({
          ...m,
          code: `${p.badgeNumber}.${idx + 1}`
        }));
        return { ...p, macros: reindexed };
      }
      return p;
    }));
  };

  // Adicionar nova fase
  const handleAddNewPhase = () => {
    const nextNumber = phases.length + 1;
    const newPhase: PhaseDefinition = {
      id: `custom_phase_${Date.now()}`,
      name: `Fase ${nextNumber}`,
      description: 'Fase complementar personalizada',
      badgeNumber: nextNumber,
      badgeColor: 'bg-indigo-600 text-white',
      selected: true,
      macros: [
        {
          id: `macro_${Date.now()}_1`,
          code: `${nextNumber}.1`,
          name: 'Planejamento e alinhamento da fase',
          templateType: 'development_process',
          templateLabel: 'Desenvolvimento técnico/processo'
        }
      ]
    };
    setPhases(prev => [...prev, newPhase]);
    setExpandedPhaseId(newPhase.id);
  };

  // Resumo do plano calculado
  const selectedPhases = useMemo(() => phases.filter(p => p.selected), [phases]);
  
  const estimatedMacros = useMemo(() => {
    return selectedPhases.reduce((acc, p) => acc + p.macros.length, 0);
  }, [selectedPhases]);

  const estimatedMicros = useMemo(() => {
    let count = 0;
    selectedPhases.forEach(p => {
      p.macros.forEach(m => {
        const tmpl = DEFAULT_OPERATIONAL_TEMPLATES[m.templateType];
        count += tmpl && tmpl.steps ? tmpl.steps.length : 4;
      });
    });
    return count;
  }, [selectedPhases]);

  // Concluir criação do plano
  const handleCreatePlan = () => {
    const activePhasesList = selectedPhases.map(p => p.name);
    
    // Converte para MacroActivityTemplate
    const macroTemplates: MacroActivityTemplate[] = [];
    selectedPhases.forEach(p => {
      p.macros.forEach(m => {
        const tmpl = DEFAULT_OPERATIONAL_TEMPLATES[m.templateType];
        const microNames = tmpl && tmpl.steps ? tmpl.steps.map(s => s.name) : [];
        macroTemplates.push({
          name: m.name,
          phase: p.name,
          microActivities: microNames,
          templateType: m.templateType,
          isContracted: m.isContracted || false
        });
      });
    });

    const newPlan: ActivityPlanTemplate = {
      id: 'plan_' + Date.now(),
      name: planName.trim() || 'Plano de Trabalho Padrão',
      phases: activePhasesList,
      macroActivities: macroTemplates,
      objective: 'Plano base operacional gerado automaticamente conforme diretrizes de assuntos regulatórios'
    };

    onSave(newPlan, templateApplyMode === 'save_for_future');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[90] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* TOP HEADER */}
        <div className="p-6 sm:p-8 pb-5 border-b border-slate-100 flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Criar plano do projeto
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Selecione as fases que farão parte do seu projeto. O sistema irá gerar automaticamente um plano base com as macroatividades padrão.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* STEPPER BAR (Matching Image 1) */}
        <div className="px-6 sm:px-8 py-4 bg-slate-50/70 border-b border-slate-150 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {/* Step 1 */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              1
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">Selecionar fases</p>
              <p className="text-[10px] text-slate-500">Escolha as fases do projeto</p>
            </div>
          </div>

          <div className="flex-1 h-0.5 bg-slate-200 min-w-[24px] mx-2" />

          {/* Step 2 */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-black text-sm flex items-center justify-center">
              2
            </div>
            <div>
              <p className="text-xs font-black text-slate-700">Plano base automático</p>
              <p className="text-[10px] text-slate-500">Macroatividades sugeridas</p>
            </div>
          </div>

          <div className="flex-1 h-0.5 bg-slate-200 min-w-[24px] mx-2" />

          {/* Step 3 */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-black text-sm flex items-center justify-center">
              3
            </div>
            <div>
              <p className="text-xs font-black text-slate-700">Editar plano</p>
              <p className="text-[10px] text-slate-500">Ajuste macroatividades e templates</p>
            </div>
          </div>

          <div className="flex-1 h-0.5 bg-slate-200 min-w-[24px] mx-2" />

          {/* Step 4 */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-black text-sm flex items-center justify-center">
              4
            </div>
            <div>
              <p className="text-xs font-black text-slate-700">Revisar e criar</p>
              <p className="text-[10px] text-slate-500">Confira e crie o plano do projeto</p>
            </div>
          </div>
        </div>

        {/* 3-COLUMN MAIN BODY (Matching Image 1) */}
        <div className="flex-1 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto bg-slate-50/40">
          
          {/* COLUMN 1: Selecionar fases do projeto (lg:col-span-4) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  1. Selecionar fases do projeto
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Escolha as fases que farão parte do plano. O sistema trará as macroatividades padrão para cada fase selecionada.
                </p>
              </div>

              {/* Phase Checkboxes List */}
              <div className="space-y-3 pt-2">
                {phases.map((phase) => (
                  <label
                    key={phase.id}
                    className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      phase.selected 
                        ? 'border-blue-300 bg-blue-50/40 shadow-xs' 
                        : 'border-slate-200/80 hover:bg-slate-50/80 opacity-70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={phase.selected}
                      onChange={() => handleTogglePhase(phase.id)}
                      className="w-5 h-5 rounded-md text-blue-600 border-slate-300 focus:ring-blue-500 mt-0.5"
                    />
                    <div className="flex items-start gap-2.5 flex-1">
                      <div className={`w-6 h-6 rounded-full ${phase.badgeColor} font-black text-xs flex items-center justify-center shrink-0 mt-0.5`}>
                        {phase.badgeNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-900 leading-tight">
                          {phase.name}
                        </p>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                          {phase.description}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}

                <button
                  type="button"
                  onClick={handleAddNewPhase}
                  className="w-full py-2.5 px-4 border border-dashed border-blue-300 text-blue-700 bg-blue-50/30 hover:bg-blue-50/80 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2"
                >
                  <Plus size={15} /> Adicionar fase
                </button>
              </div>
            </div>

            {/* Bottom Alert Box */}
            <div className="mt-6 p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3">
              <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
                Após selecionar as fases, o sistema irá gerar automaticamente um plano base com as macroatividades e templates adequados.
              </p>
            </div>
          </div>

          {/* COLUMN 2: Plano base gerado automaticamente (lg:col-span-5) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4 overflow-hidden flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  2. Plano base gerado automaticamente
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  O sistema sugeriu as macroatividades padrão para as fases selecionadas. Você pode editar o plano, alterar templates e adicionar novas macroatividades.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingPlan(!isEditingPlan)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-2xs"
              >
                <Pencil size={13} /> {isEditingPlan ? 'Concluir' : 'Editar plano'}
              </button>
            </div>

            {/* Accordions for selected phases */}
            <div className="space-y-3 pt-2 overflow-y-auto pr-1 flex-1">
              {selectedPhases.map((phase) => {
                const isExpanded = expandedPhaseId === phase.id;
                return (
                  <div 
                    key={phase.id} 
                    className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 bg-white"
                  >
                    {/* Accordion Header */}
                    <div 
                      onClick={() => handleToggleAccordion(phase.id)}
                      className="px-4 py-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between cursor-pointer select-none transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full ${phase.badgeColor} font-black text-xs flex items-center justify-center shrink-0`}>
                          {phase.badgeNumber}
                        </div>
                        <span className="text-xs font-black text-slate-900">
                          {phase.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">
                          {phase.macros.length} macroatividades sugeridas
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-slate-400" />
                        ) : (
                          <ChevronDown size={16} className="text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Accordion Content (List of Macroactivities) */}
                    {isExpanded && (
                      <div className="p-3 bg-white space-y-2 border-t border-slate-100 animate-in fade-in duration-150">
                        {phase.macros.map((macro) => (
                          <div 
                            key={macro.id}
                            className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 flex items-center justify-between gap-2 group transition"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500 cursor-grab shrink-0" />
                              <span className="text-xs font-bold text-slate-400 shrink-0">
                                {macro.code}
                              </span>
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {macro.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Template Badge */}
                              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[10px] font-bold">
                                Template: {macro.templateLabel}
                              </span>

                              {/* Switch template dropdown */}
                              <select
                                value={macro.templateType}
                                onChange={e => handleChangeTemplate(phase.id, macro.id, e.target.value as OperationalTemplateKey)}
                                className="opacity-0 group-hover:opacity-100 transition p-1 text-slate-400 hover:text-blue-600 bg-transparent text-[10px] font-bold cursor-pointer"
                                title="Trocar template operacional"
                              >
                                {Object.entries(DEFAULT_OPERATIONAL_TEMPLATES).map(([key, def]) => (
                                  <option key={key} value={key}>{def.name}</option>
                                ))}
                              </select>

                              {/* Delete macro */}
                              {isEditingPlan && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMacro(phase.id, macro.id)}
                                  className="p-1 text-slate-300 hover:text-red-500 transition"
                                  title="Excluir macroatividade"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Add Macro Inline Form */}
                        {newMacroPhaseId === phase.id ? (
                          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2.5 mt-2">
                            <input
                              type="text"
                              value={newMacroNameInput}
                              onChange={e => setNewMacroNameInput(e.target.value)}
                              placeholder="Nome da nova macroatividade..."
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                              autoFocus
                            />
                            <div className="flex items-center justify-between gap-2">
                              <select
                                value={newMacroTemplateType}
                                onChange={e => setNewMacroTemplateType(e.target.value as OperationalTemplateKey)}
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 outline-none"
                              >
                                {Object.entries(DEFAULT_OPERATIONAL_TEMPLATES).map(([key, def]) => (
                                  <option key={key} value={key}>Template: {def.name}</option>
                                ))}
                              </select>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setNewMacroPhaseId(null)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddMacroToPhase(phase.id)}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-2xs"
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setNewMacroPhaseId(phase.id);
                              setNewMacroNameInput('');
                            }}
                            className="w-full py-2 text-center text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50/50 rounded-xl transition flex items-center justify-center gap-1.5"
                          >
                            <Plus size={14} /> Adicionar macroatividade
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMN 3: Configuração dos templates & Resumo (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-5 flex flex-col justify-between">
            
            {/* Template Configuration Card (Matching Image 1) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Layers size={16} />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Configuração dos templates
                </h4>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Os templates são aplicados automaticamente com base no tipo de macroatividade. Você pode alterar o template manualmente e escolher como aplicar a alteração.
              </p>

              {/* Info pill */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2">
                <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-900 leading-tight">
                  Ao alterar um template, você pode aplicar a mudança apenas neste plano ou salvar para futuros planos.
                </p>
              </div>

              {/* Radio Group */}
              <div className="space-y-2.5 pt-1">
                <p className="text-[11px] font-black text-slate-800">
                  Quando eu alterar um template:
                </p>

                <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition">
                  <input
                    type="radio"
                    name="template_apply_mode"
                    value="only_this_plan"
                    checked={templateApplyMode === 'only_this_plan'}
                    onChange={() => setTemplateApplyMode('only_this_plan')}
                    className="text-blue-600 border-slate-300 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-black text-slate-900 leading-snug">
                      Aplicar alterações somente neste plano
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      A mudança vale apenas para o plano que estou criando agora.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition">
                  <input
                    type="radio"
                    name="template_apply_mode"
                    value="save_for_future"
                    checked={templateApplyMode === 'save_for_future'}
                    onChange={() => setTemplateApplyMode('save_for_future')}
                    className="text-blue-600 border-slate-300 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-black text-slate-900 leading-snug">
                      Salvar alteração para planos futuros
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      A mudança será salva e usada como padrão em novos planos.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Plan Summary Card (Matching Image 1) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <BarChart2 size={16} />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Resumo do plano
                </h4>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2">
                    <Layers size={14} className="text-slate-400" /> Fases selecionadas
                  </span>
                  <span className="font-black text-slate-900">{selectedPhases.length}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-slate-400" /> Macroatividades (estimado)
                  </span>
                  <span className="font-black text-slate-900">{estimatedMacros}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2">
                    <Check size={14} className="text-slate-400" /> Microatividades (estimado)
                  </span>
                  <span className="font-black text-slate-900">{estimatedMicros}</span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleCreatePlan}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <Sparkles size={16} /> Criar plano
              </button>

              {/* Next Steps Box */}
              <div className="pt-2 border-t border-slate-100 flex items-start gap-2.5">
                <Flag size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-slate-800">Próximos passos</p>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Após criar o plano, você poderá acompanhar a execução e gerenciar as atividades do projeto.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
