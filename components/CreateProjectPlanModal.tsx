import React, { useState, useMemo } from 'react';
import { 
  X, Check, Plus, Layers, Sparkles, SlidersHorizontal, 
  ArrowRight, ChevronDown, ChevronUp, Trash2, Edit3, 
  ArrowLeftRight, Info, GripVertical, CheckCircle2, MoreVertical
} from 'lucide-react';
import { ActivityPlanTemplate, MacroActivityTemplate } from '../types';
import { 
  DEFAULT_OPERATIONAL_TEMPLATES, 
  OperationalTemplateKey, 
  detectMacroActivityType, 
  getOperationalTemplate, 
  saveOperationalTemplateCustomization 
} from '../utils/operationalTemplates';

interface CreateProjectPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlan: (plan: ActivityPlanTemplate) => void;
  existingPlans: ActivityPlanTemplate[];
}

interface PhaseOption {
  id: string;
  name: string;
  desc: string;
  badgeNumber: number;
  color: string;
  defaultMacros: { name: string; template: OperationalTemplateKey }[];
}

const DEFAULT_PHASE_OPTIONS: PhaseOption[] = [
  {
    id: 'fase_poc',
    name: 'Prova de Conceito',
    desc: 'Estudos iniciais e comprovação do conceito',
    badgeNumber: 1,
    color: 'emerald',
    defaultMacros: [
      { name: 'Desenvolvimento e Otimização da Construção Antigênica', template: 'development_process' },
      { name: 'Expressão e Purificação em Escala Laboratorial', template: 'development_process' },
      { name: 'Caracterização Estrutural Preliminar', template: 'characterization' },
      { name: 'Ensaio Biológico de Imunogenicidade in vivo', template: 'biological_assay' },
      { name: 'Relatório Técnico de Prova de Conceito', template: 'regulatory_document' }
    ]
  },
  {
    id: 'fase_nao_clinica',
    name: 'Fase Não Clínica',
    desc: 'Estudos não clínicos (pré-clínicos)',
    badgeNumber: 2,
    color: 'blue',
    defaultMacros: [
      { name: 'Controle de qualidade', template: 'quality_control' },
      { name: 'Estabilidade', template: 'stability' },
      { name: 'Serviços / contratos', template: 'glp_safety' },
      { name: 'Fabricação de lote', template: 'batch_manufacturing' },
      { name: 'Caracterização', template: 'characterization' },
      { name: 'Documento regulatório', template: 'regulatory_document' }
    ]
  },
  {
    id: 'fase_1_2',
    name: 'Fase 1/2',
    desc: 'Estudos clínicos de Fase 1 e 2',
    badgeNumber: 3,
    color: 'indigo',
    defaultMacros: [
      { name: 'Produção do lote clínico (GMP)', template: 'batch_manufacturing' },
      { name: 'Estudo de estabilidade preliminar', template: 'stability' },
      { name: 'Preparação do protocolo clínico', template: 'regulatory_document' },
      { name: 'Ensaios de segurança BPL', template: 'glp_safety' },
      { name: 'Submissão e aprovação do DDCM', template: 'regulatory_document' },
      { name: 'Condução do ensaio clínico Fase I/II', template: 'biological_assay' }
    ]
  },
  {
    id: 'fase_3',
    name: 'Fase 3',
    desc: 'Estudos clínicos de Fase 3',
    badgeNumber: 4,
    color: 'purple',
    defaultMacros: [
      { name: 'Escalonamento industrial e lote comercial', template: 'batch_manufacturing' },
      { name: 'Controle de qualidade e validação de métodos', template: 'quality_control' },
      { name: 'Estudo de estabilidade de longa duração', template: 'stability' },
      { name: 'Comparabilidade de processo industrial', template: 'comparability' },
      { name: 'Execução do ensaio clínico Fase III multicêntrico', template: 'biological_assay' },
      { name: 'Dossiê de registro sanitário do produto', template: 'regulatory_document' }
    ]
  }
];

export const CreateProjectPlanModal: React.FC<CreateProjectPlanModalProps> = ({
  isOpen,
  onClose,
  onCreatePlan,
  existingPlans
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [planName, setPlanName] = useState('Plano de Desenvolvimento Vacinal');
  
  // Fases selecionadas
  const [selectedPhaseIds, setSelectedPhaseIds] = useState<string[]>(['fase_poc', 'fase_nao_clinica', 'fase_1_2']);
  
  // Customização das macroatividades por fase
  const [phaseMacros, setPhaseMacros] = useState<{ [phaseName: string]: { id: string; name: string; template: OperationalTemplateKey }[] }>(() => {
    const initial: { [phaseName: string]: { id: string; name: string; template: OperationalTemplateKey }[] } = {};
    DEFAULT_PHASE_OPTIONS.forEach(opt => {
      initial[opt.name] = opt.defaultMacros.map((m, idx) => ({
        id: `macro_tmpl_${opt.id}_${idx + 1}`,
        name: m.name,
        template: m.template
      }));
    });
    return initial;
  });

  // Fases expandidas no acordeão
  const [expandedPhases, setExpandedPhases] = useState<{ [phaseName: string]: boolean }>({
    'Fase Não Clínica': true
  });

  // Modo de salvar templates
  const [templateSaveMode, setTemplateSaveMode] = useState<'only_this_plan' | 'save_for_future'>('only_this_plan');

  // Modal para trocar template de macroatividade
  const [switchingMacro, setSwitchingMacro] = useState<{ phaseName: string; macroId: string; currentTemplate: OperationalTemplateKey } | null>(null);

  // Nova fase personalizada
  const [isAddingCustomPhase, setIsAddingCustomPhase] = useState(false);
  const [newCustomPhaseName, setNewCustomPhaseName] = useState('');

  // Nova macroatividade
  const [addingMacroPhase, setAddingMacroPhase] = useState<string | null>(null);
  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroTemplate, setNewMacroTemplate] = useState<OperationalTemplateKey>('development_process');

  if (!isOpen) return null;

  const togglePhaseSelection = (phaseId: string) => {
    if (selectedPhaseIds.includes(phaseId)) {
      setSelectedPhaseIds(selectedPhaseIds.filter(id => id !== phaseId));
    } else {
      setSelectedPhaseIds([...selectedPhaseIds, phaseId]);
    }
  };

  const togglePhaseAccordion = (phaseName: string) => {
    setExpandedPhases(prev => ({ ...prev, [phaseName]: !prev[phaseName] }));
  };

  const handleAddCustomPhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomPhaseName.trim()) return;
    const name = newCustomPhaseName.trim();
    const newId = `custom_phase_${Date.now()}`;

    setPhaseMacros(prev => ({
      ...prev,
      [name]: [
        { id: `m_1_${Date.now()}`, name: 'Planejamento e Definição de Escopo', template: 'development_process' },
        { id: `m_2_${Date.now()}`, name: 'Execução Técnica Principal', template: 'development_process' },
        { id: `m_3_${Date.now()}`, name: 'Documentação Regulatória da Fase', template: 'regulatory_document' }
      ]
    }));
    setSelectedPhaseIds(prev => [...prev, newId]);
    setNewCustomPhaseName('');
    setIsAddingCustomPhase(false);
  };

  const handleAddMacro = (phaseName: string) => {
    if (!newMacroName.trim()) return;
    setPhaseMacros(prev => ({
      ...prev,
      [phaseName]: [
        ...(prev[phaseName] || []),
        {
          id: `macro_${Date.now()}`,
          name: newMacroName.trim(),
          template: newMacroTemplate
        }
      ]
    }));
    setNewMacroName('');
    setAddingMacroPhase(null);
  };

  const handleDeleteMacro = (phaseName: string, macroId: string) => {
    setPhaseMacros(prev => ({
      ...prev,
      [phaseName]: (prev[phaseName] || []).filter(m => m.id !== macroId)
    }));
  };

  const handleChangeTemplate = (phaseName: string, macroId: string, newTemplate: OperationalTemplateKey) => {
    setPhaseMacros(prev => ({
      ...prev,
      [phaseName]: (prev[phaseName] || []).map(m => m.id === macroId ? { ...m, template: newTemplate } : m)
    }));

    if (templateSaveMode === 'save_for_future') {
      const templateDef = getOperationalTemplate(newTemplate);
      saveOperationalTemplateCustomization(newTemplate, templateDef);
    }
    setSwitchingMacro(null);
  };

  // Cálculo do resumo do plano
  const activePhases = useMemo(() => {
    return DEFAULT_PHASE_OPTIONS.filter(opt => selectedPhaseIds.includes(opt.id));
  }, [selectedPhaseIds]);

  const totalMacroCount = useMemo(() => {
    let count = 0;
    activePhases.forEach(ph => {
      count += (phaseMacros[ph.name] || []).length;
    });
    return count;
  }, [activePhases, phaseMacros]);

  const totalEstimatedMicroCount = useMemo(() => {
    let count = 0;
    activePhases.forEach(ph => {
      const macros = phaseMacros[ph.name] || [];
      macros.forEach(m => {
        const tmpl = getOperationalTemplate(m.template);
        count += tmpl.steps.length;
      });
    });
    return count;
  }, [activePhases, phaseMacros]);

  const handleFinalSubmit = () => {
    const selectedPhasesNames = activePhases.map(p => p.name);
    if (selectedPhasesNames.length === 0) return;

    const generatedMacroActivities: MacroActivityTemplate[] = [];

    activePhases.forEach(ph => {
      const macros = phaseMacros[ph.name] || [];
      macros.forEach(m => {
        const tmpl = getOperationalTemplate(m.template);
        generatedMacroActivities.push({
          name: m.name,
          phase: ph.name,
          templateType: m.template,
          hasDeliverable: true,
          deliverableType: tmpl.deliverable,
          microActivities: tmpl.steps.map(s => s.name),
          expectedResults: tmpl.deliverable
        });
      });
    });

    const newPlan: ActivityPlanTemplate = {
      id: 'plan_' + Math.random().toString(36).substr(2, 9),
      name: planName.trim() || 'Novo Plano Operacional',
      phases: selectedPhasesNames,
      macroActivities: generatedMacroActivities
    };

    onCreatePlan(newPlan);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* TOP HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Criar plano do projeto
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecione as fases que farão parte do seu projeto. O sistema irá gerar automaticamente um plano base com as macroatividades padrão.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100">
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, title: 'Selecionar fases', sub: 'Escolha as fases do projeto' },
              { num: 2, title: 'Plano base automático', sub: 'Macroatividades sugeridas' },
              { num: 3, title: 'Editar plano', sub: 'Ajuste macroatividades e templates' },
              { num: 4, title: 'Revisar e criar', sub: 'Confira e crie o plano do projeto' }
            ].map(st => (
              <div key={st.num} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                  currentStep >= st.num 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {st.num}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 truncate leading-tight">{st.title}</p>
                  <p className="text-[10px] text-slate-400 truncate leading-tight">{st.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3-COLUMN MAIN BODY */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMN 1: SELECIONAR FASES (col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                1. Selecionar fases do projeto
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Escolha as fases que farão parte do plano. O sistema trará as macroatividades padrão para cada fase selecionada.
              </p>
            </div>

            <div className="space-y-2.5">
              {DEFAULT_PHASE_OPTIONS.map(phase => {
                const isSelected = selectedPhaseIds.includes(phase.id);
                return (
                  <div
                    key={phase.id}
                    onClick={() => togglePhaseSelection(phase.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center gap-3.5 ${
                      isSelected 
                        ? 'bg-blue-50/50 border-blue-300 shadow-2xs' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 ${
                      phase.color === 'emerald' ? 'bg-emerald-600' :
                      phase.color === 'blue' ? 'bg-blue-600' :
                      phase.color === 'indigo' ? 'bg-indigo-600' : 'bg-slate-600'
                    }`}>
                      {phase.badgeNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-900 leading-tight">
                        {phase.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                        {phase.desc}
                      </p>
                    </div>
                  </div>
                );
              })}

              {isAddingCustomPhase ? (
                <form onSubmit={handleAddCustomPhase} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <input 
                    type="text"
                    value={newCustomPhaseName}
                    onChange={e => setNewCustomPhaseName(e.target.value)}
                    placeholder="Nome da nova fase..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingCustomPhase(false)}
                      className="px-3 py-1 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Adicionar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCustomPhase(true)}
                  className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 rounded-2xl text-xs font-bold text-slate-600 hover:text-blue-700 flex items-center justify-center gap-1.5 transition"
                >
                  <Plus size={14} /> Adicionar fase
                </button>
              )}
            </div>

            <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
              <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Após selecionar as fases, o sistema irá gerar automaticamente um plano base com as macroatividades e templates adequados.
              </p>
            </div>
          </div>

          {/* COLUMN 2: PLANO BASE AUTOMÁTICO (col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  2. Plano base gerado automaticamente
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Macroatividades sugeridas para as fases selecionadas.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
              >
                <Edit3 size={13} /> Editar plano
              </button>
            </div>

            {/* LISTA DE FASES COM ACCORDION */}
            <div className="space-y-3">
              {DEFAULT_PHASE_OPTIONS.map(phase => {
                const isSelected = selectedPhaseIds.includes(phase.id);
                const isExpanded = !!expandedPhases[phase.name];
                const macros = phaseMacros[phase.name] || [];

                return (
                  <div 
                    key={phase.id}
                    className={`rounded-2xl border transition overflow-hidden ${
                      isSelected 
                        ? 'border-slate-200 bg-white shadow-2xs' 
                        : 'border-slate-100 bg-slate-50/60 opacity-60'
                    }`}
                  >
                    {/* Header da Fase */}
                    <div 
                      onClick={() => isSelected && togglePhaseAccordion(phase.name)}
                      className={`p-3.5 flex items-center justify-between transition cursor-pointer select-none ${
                        isSelected ? 'hover:bg-slate-50' : 'cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${
                          phase.color === 'emerald' ? 'bg-emerald-600' :
                          phase.color === 'blue' ? 'bg-blue-600' :
                          phase.color === 'indigo' ? 'bg-indigo-600' : 'bg-slate-500'
                        }`}>
                          {phase.badgeNumber}
                        </div>
                        <span className="text-xs font-black text-slate-900 truncate">
                          {phase.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400">
                          {macros.length} macroatividades sugeridas
                        </span>
                        {isExpanded ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                      </div>
                    </div>

                    {/* Conteúdo da Fase (Macroatividades) */}
                    {isSelected && isExpanded && (
                      <div className="p-3 bg-slate-50/50 border-t border-slate-100 space-y-2">
                        {macros.map((macro, idx) => {
                          const tmpl = getOperationalTemplate(macro.template);
                          return (
                            <div 
                              key={macro.id}
                              className="p-2.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 hover:border-slate-300 transition"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <GripVertical size={13} className="text-slate-300 shrink-0 cursor-grab" />
                                <span className="text-[11px] font-black text-slate-400 shrink-0">
                                  {phase.badgeNumber}.{idx + 1}
                                </span>
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {macro.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-lg text-[10px] font-bold whitespace-nowrap">
                                  Template: {tmpl.name}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => setSwitchingMacro({ phaseName: phase.name, macroId: macro.id, currentTemplate: macro.template })}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                                  title="Trocar template associado"
                                >
                                  <ArrowLeftRight size={13} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteMacro(phase.name, macro.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Excluir macroatividade"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Adicionar macroatividade nesta fase */}
                        {addingMacroPhase === phase.name ? (
                          <div className="p-3 bg-white border border-blue-200 rounded-xl space-y-2">
                            <input 
                              type="text"
                              value={newMacroName}
                              onChange={e => setNewMacroName(e.target.value)}
                              placeholder="Nome da macroatividade..."
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                              autoFocus
                            />
                            <div className="flex items-center gap-2">
                              <select
                                value={newMacroTemplate}
                                onChange={e => setNewMacroTemplate(e.target.value as OperationalTemplateKey)}
                                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                              >
                                {Object.values(DEFAULT_OPERATIONAL_TEMPLATES).map(t => (
                                  <option key={t.key} value={t.key}>{t.name}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleAddMacro(phase.name)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                              >
                                Salvar
                              </button>
                              <button
                                type="button"
                                onClick={() => setAddingMacroPhase(null)}
                                className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setAddingMacroPhase(phase.name); setNewMacroName(''); }}
                            className="w-full py-2 border border-dashed border-slate-200 hover:border-blue-400 rounded-xl text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1 transition"
                          >
                            <Plus size={13} /> Adicionar macroatividade
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMN 3: CONFIGURAÇÃO DE TEMPLATES & RESUMO (col-span-3) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Card: Configuração dos templates */}
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-slate-800">
                <SlidersHorizontal size={16} className="text-blue-600" />
                <h4 className="text-xs font-black tracking-tight">
                  Configuração dos templates
                </h4>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Os templates são aplicados automaticamente com base no tipo de macroatividade. Você pode alterar o template manualmente e escolher como aplicar a alteração.
              </p>

              <div className="p-2.5 bg-blue-50/70 border border-blue-200/70 rounded-xl text-[11px] text-blue-900 leading-tight">
                Ao alterar um template, você pode aplicar a mudança apenas neste plano ou salvar para futuros planos.
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                  Quando eu alterar um template:
                </p>

                <label className="flex items-start gap-2 cursor-pointer text-xs">
                  <input 
                    type="radio"
                    name="templateSaveMode"
                    checked={templateSaveMode === 'only_this_plan'}
                    onChange={() => setTemplateSaveMode('only_this_plan')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Aplicar alterações somente neste plano</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      A mudança vale apenas para o plano que estou criando agora.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer text-xs">
                  <input 
                    type="radio"
                    name="templateSaveMode"
                    checked={templateSaveMode === 'save_for_future'}
                    onChange={() => setTemplateSaveMode('save_for_future')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Salvar alteração para planos futuros</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      A mudança será salva e usada como padrão em novos planos.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Card: Resumo do plano */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
              <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <Layers size={15} className="text-blue-600" /> Resumo do plano
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Fases selecionadas</span>
                  <span className="font-black text-slate-900">{activePhases.length}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Macroatividades (estimado)</span>
                  <span className="font-black text-slate-900">{totalMacroCount}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Microatividades (estimado)</span>
                  <span className="font-black text-slate-900">{totalEstimatedMicroCount}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={activePhases.length === 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Sparkles size={15} /> Criar plano
              </button>
            </div>

            {/* Card: Próximos passos */}
            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                <CheckCircle2 size={14} className="text-blue-600" /> Próximos passos
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Após criar o plano, você poderá acompanhar a execução e gerenciar as atividades do projeto.
              </p>
            </div>

          </div>

        </div>

        {/* MODAL TROCAR TEMPLATE */}
        {switchingMacro && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-[90] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 w-full max-w-sm border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase">Trocar Template</h4>
                <button onClick={() => setSwitchingMacro(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Selecione o template operacional padrão para esta macroatividade:
              </p>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {Object.values(DEFAULT_OPERATIONAL_TEMPLATES).map(tmpl => (
                  <button
                    key={tmpl.key}
                    type="button"
                    onClick={() => handleChangeTemplate(switchingMacro.phaseName, switchingMacro.macroId, tmpl.key)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-bold border transition flex items-center justify-between ${
                      switchingMacro.currentTemplate === tmpl.key
                        ? 'bg-blue-50 border-blue-300 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tmpl.name}</span>
                    {switchingMacro.currentTemplate === tmpl.key && <Check size={14} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
