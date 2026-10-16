import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  ChevronUp, 
  GripVertical, 
  MoreVertical, 
  FileText, 
  Sparkles, 
  Dna, 
  Activity, 
  ShieldCheck, 
  Check, 
  Trash2, 
  Edit2, 
  Copy, 
  Layers,
  X
} from 'lucide-react';
import { ActivityPlanTemplate, MacroActivityTemplate } from '../types';
import { 
  MicroOperationalTemplate, 
  loadMicroTemplates, 
  saveMicroTemplates, 
  DEFAULT_MICRO_TEMPLATES 
} from '../utils/microTemplates';
import { ManageTemplatesDrawer } from './ManageTemplatesDrawer';

export type PlanTypeKey = 'recombinant_protein' | 'attenuated_virus' | 'dna_vaccine' | 'custom';

interface PlanTypeOption {
  key: PlanTypeKey;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface PlanPhaseItem {
  id: string;
  name: string;
  description: string;
  expanded: boolean;
  macros: PlanMacroItem[];
}

export interface PlanMacroItem {
  id: string;
  name: string;
  description: string;
  expanded: boolean;
  micros: PlanMicroItem[];
}

export interface PlanMicroItem {
  id: string;
  name: string;
  description: string;
  appliedTemplateId?: string;
  appliedTemplateName?: string;
  checklist?: { id: string; item: string; completed?: boolean }[];
  internalDependencies?: { id: string; fromItem: string; toItem: string }[];
}

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPlan: ActivityPlanTemplate, saveAsDefaultTemplates?: boolean) => void;
  existingPlans?: ActivityPlanTemplate[];
  onDeletePlan?: (planId: string) => void;
}

const INITIAL_PROTEIN_PLAN: PlanPhaseItem[] = [
  {
    id: 'ph_poc',
    name: 'Prova de Conceito',
    description: 'Estudos iniciais e comprovação do conceito',
    expanded: true,
    macros: [
      {
        id: 'mac_ifa',
        name: 'IFA – Definição do antígeno',
        description: 'Desenvolvimento e caracterização do antígeno candidato',
        expanded: true,
        micros: [
          {
            id: 'mic_1',
            name: 'Definição da sequência do antígeno',
            description: 'Planejamento e definição da sequência.',
          },
          {
            id: 'mic_2',
            name: 'Análise bioinformática',
            description: 'Análise e validação in silico.',
          },
          {
            id: 'mic_3',
            name: 'Contratação do serviço',
            description: 'Contratação de parceiro para síntese do antígeno.',
            appliedTemplateId: 'tmpl_servico_contratacao',
            appliedTemplateName: 'Serviço / contratação',
            checklist: [
              { id: 'c1', item: 'Definir escopo' },
              { id: 'c2', item: 'Solicitar orçamento' },
              { id: 'c3', item: 'Avaliar propostas' },
              { id: 'c4', item: 'Aprovar contrato' },
              { id: 'c5', item: 'Revisar relatório final' }
            ],
            internalDependencies: [
              { id: 'd1', fromItem: 'Solicitar orçamento', toItem: 'Avaliar propostas' },
              { id: 'd2', fromItem: 'Aprovar contrato', toItem: 'Revisar relatório final' }
            ]
          },
          {
            id: 'mic_4',
            name: 'Caracterização inicial',
            description: 'Ensaios iniciais de caracterização.',
          }
        ]
      },
      {
        id: 'mac_adj',
        name: 'Adjuvante – Desenvolvimento farmacotécnico',
        description: 'Estudo de adjuvantes e formulação',
        expanded: false,
        micros: []
      },
      {
        id: 'mac_carac',
        name: 'Caracterização da formulação',
        description: 'Avaliação da formulação vacinal',
        expanded: false,
        micros: []
      }
    ]
  },
  {
    id: 'ph_nao_clinica',
    name: 'Fase Não Clínica',
    description: 'Estudos não clínicos (pré-clínicos)',
    expanded: false,
    macros: [
      {
        id: 'mac_nc_1',
        name: 'Controle de qualidade e estabilidade',
        description: 'Ensaios físico-químicos e estabilidade acelerada',
        expanded: false,
        micros: []
      },
      {
        id: 'mac_nc_2',
        name: 'Toxicologia e segurança GLP',
        description: 'Estudos de toxicidade pré-clínica',
        expanded: false,
        micros: []
      }
    ]
  },
  {
    id: 'ph_1_2',
    name: 'Fase 1/2',
    description: 'Estudos clínicos de Fase 1 e 2',
    expanded: false,
    macros: [
      {
        id: 'mac_c1',
        name: 'Produção do lote clínico (GMP)',
        description: 'Fabricação com controle de qualidade para liberação',
        expanded: false,
        micros: []
      },
      {
        id: 'mac_c2',
        name: 'Submissão e condução do ensaio clínico',
        description: 'Protocolo clínico e recrutamento',
        expanded: false,
        micros: []
      }
    ]
  },
  {
    id: 'ph_3',
    name: 'Fase 3',
    description: 'Estudos clínicos de Fase 3',
    expanded: false,
    macros: [
      {
        id: 'mac_c3',
        name: 'Ensaio clínico multicêntrico de eficácia',
        description: 'Avaliação de eficácia e segurança em larga escala',
        expanded: false,
        micros: []
      }
    ]
  }
];

const INITIAL_VIRUS_PLAN: PlanPhaseItem[] = [
  {
    id: 'ph_poc',
    name: 'Prova de Conceito',
    description: 'Atenuação viral e testes de passagem',
    expanded: true,
    macros: [
      {
        id: 'mac_virus_1',
        name: 'Isolamento e clonagem da cepa viral',
        description: 'Caracterização genética e passagens em cultivo celular',
        expanded: true,
        micros: [
          { id: 'mv_1', name: 'Sequenciamento genômico viral', description: 'Validação da sequência da cepa' },
          { id: 'mv_2', name: 'Cinética de replicação viral', description: 'Curvas de crescimento in vitro' }
        ]
      }
    ]
  },
  {
    id: 'ph_nao_clinica',
    name: 'Fase Não Clínica',
    description: 'Ensaios de segurança e patogenicidade',
    expanded: false,
    macros: []
  },
  {
    id: 'ph_1_2',
    name: 'Fase 1/2',
    description: 'Estudos clínicos de Fase 1 e 2',
    expanded: false,
    macros: []
  },
  {
    id: 'ph_3',
    name: 'Fase 3',
    description: 'Estudos clínicos de Fase 3',
    expanded: false,
    macros: []
  }
];

const INITIAL_DNA_PLAN: PlanPhaseItem[] = [
  {
    id: 'ph_poc',
    name: 'Prova de Conceito',
    description: 'Construção plasmídica e ensaios de expressão in vitro',
    expanded: true,
    macros: [
      {
        id: 'mac_dna_1',
        name: 'Construção e clonagem do plasmídeo',
        description: 'Desenho de vetor e síntese gênica',
        expanded: true,
        micros: [
          { id: 'md_1', name: 'Desenho e síntese do gene de interesse', description: 'Otimização de códons' },
          { id: 'md_2', name: 'Transfecção e validação de expressão', description: 'Western blot e citometria' }
        ]
      }
    ]
  },
  {
    id: 'ph_nao_clinica',
    name: 'Fase Não Clínica',
    description: 'Biodistribuição e toxicologia pré-clínica',
    expanded: false,
    macros: []
  },
  {
    id: 'ph_1_2',
    name: 'Fase 1/2',
    description: 'Estudos clínicos de Fase 1 e 2',
    expanded: false,
    macros: []
  },
  {
    id: 'ph_3',
    name: 'Fase 3',
    description: 'Estudos clínicos de Fase 3',
    expanded: false,
    macros: []
  }
];

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingPlans = [],
  onDeletePlan
}) => {
  const [selectedPlanType, setSelectedPlanType] = useState<PlanTypeKey>('recombinant_protein');
  const [selectedExistingPlanId, setSelectedExistingPlanId] = useState<string | null>(null);
  const [planTitle, setPlanTitle] = useState('Plano de Desenvolvimento – Proteína Recombinante');
  const [phases, setPhases] = useState<PlanPhaseItem[]>(() => JSON.parse(JSON.stringify(INITIAL_PROTEIN_PLAN)));
  
  // Reusable templates state
  const [availableTemplates, setAvailableTemplates] = useState<MicroOperationalTemplate[]>(() => loadMicroTemplates());
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<MicroOperationalTemplate | null>(null);

  // Active dropdown for "Aplicar template"
  const [openTemplateDropdownMicroId, setOpenTemplateDropdownMicroId] = useState<string | null>(null);

  // Inline additions
  const [newPhaseName, setNewPhaseName] = useState('');
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [newMacroPhaseId, setNewMacroPhaseId] = useState<string | null>(null);
  const [newMacroName, setNewMacroName] = useState('');
  const [newMicroMacroId, setNewMicroMacroId] = useState<string | null>(null);
  const [newMicroName, setNewMicroName] = useState('');

  // Switch plan type
  const handleSelectPlanType = (typeKey: PlanTypeKey) => {
    setSelectedPlanType(typeKey);
    setSelectedExistingPlanId(null);
    if (typeKey === 'recombinant_protein') {
      setPlanTitle('Plano de Desenvolvimento – Proteína Recombinante');
      setPhases(JSON.parse(JSON.stringify(INITIAL_PROTEIN_PLAN)));
    } else if (typeKey === 'attenuated_virus') {
      setPlanTitle('Plano de Desenvolvimento – Vírus Atenuado');
      setPhases(JSON.parse(JSON.stringify(INITIAL_VIRUS_PLAN)));
    } else if (typeKey === 'dna_vaccine') {
      setPlanTitle('Plano de Desenvolvimento – Vacina de DNA');
      setPhases(JSON.parse(JSON.stringify(INITIAL_DNA_PLAN)));
    } else {
      setPlanTitle('Plano de Desenvolvimento Personalizado');
      setPhases([
        {
          id: 'ph_custom_1',
          name: 'Prova de Conceito',
          description: 'Estudos iniciais',
          expanded: true,
          macros: []
        }
      ]);
    }
  };

  // Select an existing plan from the system
  const handleSelectExistingPlan = (plan: ActivityPlanTemplate) => {
    setSelectedExistingPlanId(plan.id);
    setSelectedPlanType('custom');
    setPlanTitle(plan.name);

    if (plan.phases && plan.phases.length > 0) {
      const convertedPhases: PlanPhaseItem[] = plan.phases.map((phName, pIdx) => {
        const matchingMacros = (plan.macroActivities || []).filter(m => m.phase === phName);
        return {
          id: `ph_ex_${plan.id}_${pIdx}`,
          name: phName,
          description: `Fase ${pIdx + 1} do plano`,
          expanded: pIdx === 0,
          macros: matchingMacros.map((mac, mIdx) => ({
            id: `mac_ex_${plan.id}_${pIdx}_${mIdx}`,
            name: mac.name,
            description: mac.expectedResults || '',
            expanded: mIdx === 0,
            micros: (mac.microActivities || []).map((micName, micIdx) => ({
              id: `mic_ex_${plan.id}_${pIdx}_${mIdx}_${micIdx}`,
              name: micName,
              description: ''
            }))
          }))
        };
      });
      setPhases(convertedPhases);
    } else {
      setPhases([]);
    }
  };

  // Expand / Collapse all
  const allExpanded = useMemo(() => {
    return phases.every(p => p.expanded && p.macros.every(m => m.expanded));
  }, [phases]);

  const toggleExpandAll = () => {
    const nextState = !allExpanded;
    setPhases(phases.map(p => ({
      ...p,
      expanded: nextState,
      macros: p.macros.map(m => ({ ...m, expanded: nextState }))
    })));
  };

  // Phase operations
  const togglePhaseExpand = (phaseId: string) => {
    setPhases(phases.map(p => p.id === phaseId ? { ...p, expanded: !p.expanded } : p));
  };

  const handleAddPhase = () => {
    if (!newPhaseName.trim()) return;
    const newPh: PlanPhaseItem = {
      id: `ph_${Date.now()}`,
      name: newPhaseName.trim(),
      description: 'Nova fase do projeto',
      expanded: true,
      macros: []
    };
    setPhases([...phases, newPh]);
    setNewPhaseName('');
    setIsAddingPhase(false);
  };

  const handleDeletePhase = (phaseId: string) => {
    setPhases(phases.filter(p => p.id !== phaseId));
  };

  // Macro operations
  const toggleMacroExpand = (phaseId: string, macroId: string) => {
    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        macros: p.macros.map(m => m.id === macroId ? { ...m, expanded: !m.expanded } : m)
      };
    }));
  };

  const handleAddMacro = (phaseId: string) => {
    if (!newMacroName.trim()) return;
    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      const newM: PlanMacroItem = {
        id: `mac_${Date.now()}`,
        name: newMacroName.trim(),
        description: 'Descrição da macroatividade',
        expanded: true,
        micros: []
      };
      return { ...p, macros: [...p.macros, newM] };
    }));
    setNewMacroName('');
    setNewMacroPhaseId(null);
  };

  const handleDeleteMacro = (phaseId: string, macroId: string) => {
    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      return { ...p, macros: p.macros.filter(m => m.id !== macroId) };
    }));
  };

  // Micro operations
  const handleAddMicro = (phaseId: string, macroId: string) => {
    if (!newMicroName.trim()) return;
    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        macros: p.macros.map(m => {
          if (m.id !== macroId) return m;
          const newMi: PlanMicroItem = {
            id: `mic_${Date.now()}`,
            name: newMicroName.trim(),
            description: 'Descrição da microatividade',
          };
          return { ...m, micros: [...m.micros, newMi], expanded: true };
        })
      };
    }));
    setNewMicroName('');
    setNewMicroMacroId(null);
  };

  const handleDeleteMicro = (phaseId: string, macroId: string, microId: string) => {
    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        macros: p.macros.map(m => {
          if (m.id !== macroId) return m;
          return { ...m, micros: m.micros.filter(mi => mi.id !== microId) };
        })
      };
    }));
  };

  // Apply template to a microactivity
  const handleApplyTemplate = (phaseId: string, macroId: string, microId: string, template: MicroOperationalTemplate) => {
    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        macros: p.macros.map(m => {
          if (m.id !== macroId) return m;
          return {
            ...m,
            micros: m.micros.map(mi => {
              if (mi.id !== microId) return mi;
              return {
                ...mi,
                appliedTemplateId: template.id,
                appliedTemplateName: template.name,
                checklist: template.checklist.map(c => ({ id: c.id, item: c.item, completed: false })),
                internalDependencies: template.internalDependencies?.map(d => ({ ...d })) || []
              };
            })
          };
        })
      };
    }));
    setOpenTemplateDropdownMicroId(null);
  };

  // Remove template from microactivity
  const handleRemoveTemplate = (phaseId: string, macroId: string, microId: string) => {
    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        macros: p.macros.map(m => {
          if (m.id !== macroId) return m;
          return {
            ...m,
            micros: m.micros.map(mi => {
              if (mi.id !== microId) return mi;
              const { appliedTemplateId, appliedTemplateName, ...rest } = mi;
              return rest;
            })
          };
        })
      };
    }));
  };

  // Save Plan
  const handleSavePlan = () => {
    const macroTemplates: MacroActivityTemplate[] = [];

    phases.forEach(phase => {
      phase.macros.forEach(macro => {
        macroTemplates.push({
          name: macro.name,
          phase: phase.name,
          expectedResults: macro.description,
          microActivities: macro.micros.map(mi => mi.name)
        });
      });
    });

    const newPlan: ActivityPlanTemplate = {
      id: selectedExistingPlanId || `plan_${Date.now()}`,
      name: planTitle.trim() || 'Novo Plano de Atividades',
      phases: phases.map(p => p.name),
      macroActivities: macroTemplates
    };

    onSave(newPlan, false);
    onClose();
  };

  if (!isOpen) return null;

  const planOptions: PlanTypeOption[] = [
    {
      key: 'recombinant_protein',
      title: 'Proteína recombinante',
      description: 'Planos baseados em proteínas recombinantes.',
      icon: <Dna className="text-blue-600" size={20} />
    },
    {
      key: 'attenuated_virus',
      title: 'Vírus atenuado',
      description: 'Planos para vírus atenuados.',
      icon: <Sparkles className="text-emerald-600" size={20} />
    },
    {
      key: 'dna_vaccine',
      title: 'Vacina de DNA',
      description: 'Planos para vacinas de DNA.',
      icon: <Activity className="text-purple-600" size={20} />
    },
    {
      key: 'custom',
      title: 'Outro / Personalizado',
      description: 'Começar do zero.',
      icon: <FileText className="text-slate-600" size={20} />
    }
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-[#F8FAFC] flex flex-col overflow-hidden animate-in fade-in duration-200">
      
      {/* Top Bar (Image 4) */}
      <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition px-2 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              Criar novo plano de projeto
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Defina o tipo de plano e construa a estrutura do seu projeto com fases, macroatividades e microatividades.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setTemplateToEdit(null);
              setIsTemplateDrawerOpen(true);
            }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Settings size={15} className="text-slate-500" /> Gerenciar templates
          </button>

          <button
            type="button"
            onClick={handleSavePlan}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            Salvar plano
          </button>
        </div>
      </header>

      {/* Main Content Area: 2 to 3 Columns Layout (Image 4) */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row p-6 gap-6 max-w-[1700px] w-full mx-auto">

        {/* Column 1: Tipo de plano (Image 4) */}
        <div className="w-full md:w-80 lg:w-96 shrink-0 flex flex-col space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-black text-slate-900">1. Tipo de plano</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Selecione o tipo de projeto para carregar as fases e macroatividades padrão, ou crie um plano personalizado.
              </p>
            </div>

            {/* Plan Title edit */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-bold text-slate-500">Nome do plano:</label>
              <input
                type="text"
                value={planTitle}
                onChange={e => setPlanTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition"
              />
            </div>

            {/* Radio options */}
            <div className="space-y-2.5 pt-2">
              {planOptions.map(option => {
                const isSelected = selectedPlanType === option.key;
                return (
                  <div
                    key={option.key}
                    onClick={() => handleSelectPlanType(option.key)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                      isSelected 
                        ? 'bg-blue-50/50 border-blue-500 shadow-xs' 
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="mt-0.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-blue-600' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                      {option.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-slate-900">{option.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{option.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Existing Plans Section */}
            {existingPlans && existingPlans.length > 0 && (
              <div className="pt-4 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Planos Existentes ({existingPlans.length})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Carregar ou excluir
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {existingPlans.map(plan => {
                    const isSelected = selectedExistingPlanId === plan.id;
                    const macroCount = plan.macroActivities?.length || 0;
                    const phaseCount = plan.phases?.length || 0;

                    return (
                      <div
                        key={plan.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 shadow-2xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div
                          onClick={() => handleSelectExistingPlan(plan)}
                          className="flex-1 min-w-0 cursor-pointer"
                          title="Clique para carregar e editar a estrutura deste plano"
                        >
                          <div className="flex items-center gap-2">
                            <Layers size={14} className={isSelected ? 'text-blue-600 shrink-0' : 'text-slate-400 shrink-0'} />
                            <span className="text-xs font-black text-slate-900 truncate">
                              {plan.name}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 pl-5">
                            {phaseCount} {phaseCount === 1 ? 'fase' : 'fases'} • {macroCount} {macroCount === 1 ? 'macro' : 'macros'}
                          </p>
                        </div>

                        {onDeletePlan && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Tem certeza que deseja excluir o plano "${plan.name}"? Esta ação removerá o modelo do sistema.`)) {
                                onDeletePlan(plan.id);
                                if (selectedExistingPlanId === plan.id) {
                                  setSelectedExistingPlanId(null);
                                  handleSelectPlanType('recombinant_protein');
                                }
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer shrink-0"
                            title={`Excluir plano "${plan.name}"`}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Estrutura do plano (Image 4) */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          
          {/* Header of column 2 */}
          <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div>
              <h2 className="text-sm font-black text-slate-900">2. Estrutura do plano</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Edite, adicione ou remova fases, macroatividades e microatividades. Templates são aplicados às microatividades.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAddingPhase(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Adicionar fase
              </button>

              <button
                type="button"
                onClick={toggleExpandAll}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                {allExpanded ? 'Recolher todos' : 'Expandir todos'}
              </button>
            </div>
          </div>

          {/* New Phase inline input */}
          {isAddingPhase && (
            <div className="p-4 bg-blue-50/60 border-b border-blue-200 flex items-center gap-3">
              <input
                type="text"
                value={newPhaseName}
                onChange={e => setNewPhaseName(e.target.value)}
                placeholder="Nome da nova fase (Ex: Estudos Clínicos Fase 4)..."
                className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddPhase}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700"
              >
                Salvar fase
              </button>
              <button
                type="button"
                onClick={() => setIsAddingPhase(false)}
                className="px-3 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* List of Phases, Macros, Micros (Image 4 central tree) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {phases.map((phase, pIndex) => (
              <div 
                key={phase.id} 
                className="border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-2xs"
              >
                {/* Phase Header */}
                <div className="p-3.5 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <GripVertical size={15} className="text-slate-400 shrink-0 cursor-grab" />
                    <button
                      type="button"
                      onClick={() => togglePhaseExpand(phase.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-900 transition"
                    >
                      {phase.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-slate-900 truncate block">
                        {phase.name}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate block">
                        {phase.description}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeletePhase(phase.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition"
                      title="Excluir fase"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Phase Content (Macros) */}
                {phase.expanded && (
                  <div className="p-4 space-y-3 bg-white">
                    {phase.macros.map((macro, mIndex) => (
                      <div 
                        key={macro.id}
                        className="border border-slate-200/80 rounded-xl overflow-hidden bg-white"
                      >
                        {/* Macro Header */}
                        <div className="p-3 bg-slate-50/50 hover:bg-slate-100/50 flex items-center justify-between gap-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <GripVertical size={13} className="text-slate-400 shrink-0 cursor-grab" />
                            <button
                              type="button"
                              onClick={() => toggleMacroExpand(phase.id, macro.id)}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 transition"
                            >
                              {macro.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            <div className="min-w-0">
                              <span className="text-xs font-black text-slate-800 block truncate">
                                {macro.name}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {macro.description}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* If collapsed, show button to add/view microactivities */}
                            {!macro.expanded && macro.micros.length === 0 && (
                              <button
                                type="button"
                                onClick={() => toggleMacroExpand(phase.id, macro.id)}
                                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[11px] font-bold transition"
                              >
                                Adicionar microatividades
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteMacro(phase.id, macro.id)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                              title="Excluir macroatividade"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Macro Content (Microactivities) */}
                        {macro.expanded && (
                          <div className="p-3 space-y-2 bg-slate-50/30">
                            {macro.micros.map((micro) => {
                              const hasTemplate = !!micro.appliedTemplateName;
                              const isDropdownOpen = openTemplateDropdownMicroId === micro.id;

                              return (
                                <div 
                                  key={micro.id}
                                  className="p-2.5 bg-white hover:bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 transition group relative"
                                >
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <FileText size={15} className="text-slate-400 shrink-0" />
                                    <div className="min-w-0">
                                      <span className="text-xs font-bold text-slate-800 block truncate">
                                        {micro.name}
                                      </span>
                                      <span className="text-[10px] text-slate-400 block truncate">
                                        {micro.description}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Template Action Button / Badge (Image 4) */}
                                  <div className="flex items-center gap-2 relative">
                                    {hasTemplate ? (
                                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-bold shadow-2xs">
                                        <FileText size={12} className="text-blue-600" />
                                        <span>{micro.appliedTemplateName}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveTemplate(phase.id, macro.id, micro.id)}
                                          className="text-blue-400 hover:text-red-500 transition ml-1"
                                          title="Remover template desta microatividade"
                                        >
                                          <X size={11} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="relative">
                                        <button
                                          type="button"
                                          onClick={() => setOpenTemplateDropdownMicroId(isDropdownOpen ? null : micro.id)}
                                          className="px-3 py-1 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 rounded-xl text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                        >
                                          Aplicar template <ChevronDown size={12} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isDropdownOpen && (
                                          <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                                            <div className="px-2 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                              Selecione um template:
                                            </div>
                                            <div className="max-h-48 overflow-y-auto space-y-1">
                                              {availableTemplates.map(tmpl => (
                                                <button
                                                  key={tmpl.id}
                                                  type="button"
                                                  onClick={() => handleApplyTemplate(phase.id, macro.id, micro.id, tmpl)}
                                                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-blue-50 text-xs font-bold text-slate-800 hover:text-blue-700 transition flex items-center justify-between"
                                                >
                                                  <span>{tmpl.name}</span>
                                                  <span className="text-[10px] text-slate-400 font-normal">{tmpl.checklist.length} itens</span>
                                                </button>
                                              ))}
                                            </div>
                                            <div className="border-t border-slate-100 pt-1.5 mt-1">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setOpenTemplateDropdownMicroId(null);
                                                  setTemplateToEdit(null);
                                                  setIsTemplateDrawerOpen(true);
                                                }}
                                                className="w-full text-left px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-xs font-bold text-blue-600 transition flex items-center gap-1.5"
                                              >
                                                <Plus size={12} /> Criar novo template
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMicro(phase.id, macro.id, micro.id)}
                                      className="p-1 text-slate-300 hover:text-red-500 rounded transition"
                                      title="Excluir microatividade"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Add Micro inline form */}
                            {newMicroMacroId === macro.id ? (
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  value={newMicroName}
                                  onChange={e => setNewMicroName(e.target.value)}
                                  placeholder="Nome da microatividade..."
                                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddMicro(phase.id, macro.id)}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
                                >
                                  Salvar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewMicroMacroId(null)}
                                  className="px-2 py-1.5 text-slate-400 text-xs font-bold"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setNewMicroMacroId(macro.id);
                                  setNewMicroName('');
                                }}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 pt-1 cursor-pointer"
                              >
                                <Plus size={13} /> Adicionar microatividade
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add Macro Button or inline input */}
                    {newMacroPhaseId === phase.id ? (
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          value={newMacroName}
                          onChange={e => setNewMacroName(e.target.value)}
                          placeholder="Nome da macroatividade..."
                          className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleAddMacro(phase.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewMacroPhaseId(null)}
                          className="px-3 py-2 text-slate-400 text-xs font-bold"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setNewMacroPhaseId(phase.id);
                          setNewMacroName('');
                        }}
                        className="w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus size={14} /> Adicionar macroatividade
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Template Manager Drawer (Image 4 right drawer) */}
      <ManageTemplatesDrawer
        isOpen={isTemplateDrawerOpen}
        onClose={() => setIsTemplateDrawerOpen(false)}
        initialTemplateToEdit={templateToEdit}
        onTemplateSaved={(savedTmpl) => {
          const updated = loadMicroTemplates();
          setAvailableTemplates(updated);
        }}
      />

    </div>
  );
};
