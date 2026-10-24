import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  GripVertical, 
  FileText, 
  Sparkles, 
  Dna, 
  Activity, 
  ShieldCheck, 
  Check, 
  Trash2, 
  HelpCircle,
  AlertTriangle,
  BookOpen,
  Link as LinkIcon,
  X
} from 'lucide-react';
import { ActivityPlanTemplate, MacroActivityTemplate, PlanReferenceGuide } from '../types';
import { 
  MicroOperationalTemplate, 
  loadMicroTemplates, 
  saveMicroTemplates, 
  DEFAULT_MICRO_TEMPLATES 
} from '../utils/microTemplates';
import { ManageTemplatesDrawer } from './ManageTemplatesDrawer';
import { DEFAULT_ACTIVITY_PLANS, VACCINE_PLATFORM_PHASES } from '../constants';

export type PlanTypeKey = 'recombinant_protein' | 'attenuated_virus' | 'dna_vaccine' | 'rna_vaccine' | 'custom';

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
  activeTab?: 'micros' | 'regulatory';
  micros: PlanMicroItem[];
  keyDecisions?: string[];
  regulatoryPoints?: string[];
  technicalJustifications?: string[];
  referenceGuides?: PlanReferenceGuide[];
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

// Convert ActivityPlanTemplate to editable PlanPhaseItem[]
const convertTemplateToPhases = (template: ActivityPlanTemplate): PlanPhaseItem[] => {
  const phases = template.phases && template.phases.length > 0 ? template.phases : VACCINE_PLATFORM_PHASES;
  return phases.map((phName, pIdx) => {
    const matchingMacros = (template.macroActivities || []).filter(m => m.phase === phName);
    return {
      id: `ph_${pIdx}_${Date.now()}`,
      name: phName,
      description: `Fase ${pIdx + 1} do plano de desenvolvimento`,
      expanded: pIdx === 0 || pIdx === 1,
      macros: matchingMacros.map((mac, mIdx) => ({
        id: `mac_${pIdx}_${mIdx}_${Date.now()}`,
        name: mac.name,
        description: mac.expectedResults || '',
        expanded: false,
        activeTab: 'micros',
        keyDecisions: mac.keyDecisions ? [...mac.keyDecisions] : [],
        regulatoryPoints: mac.regulatoryPoints ? [...mac.regulatoryPoints] : [],
        technicalJustifications: mac.technicalJustifications ? [...mac.technicalJustifications] : [],
        referenceGuides: mac.referenceGuides ? JSON.parse(JSON.stringify(mac.referenceGuides)) : [],
        micros: (mac.microActivities || []).map((micName, micIdx) => ({
          id: `mic_${pIdx}_${mIdx}_${micIdx}_${Date.now()}`,
          name: micName,
          description: ''
        }))
      }))
    };
  });
};

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
  const [phases, setPhases] = useState<PlanPhaseItem[]>(() => {
    const defaultProtein = DEFAULT_ACTIVITY_PLANS.find(p => p.id === 'plan_recombinant_protein') || DEFAULT_ACTIVITY_PLANS[0];
    return convertTemplateToPhases(defaultProtein);
  });
  
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

  // Inline inputs for macro regulatory items
  const [activeInputType, setActiveInputType] = useState<{ macroId: string; type: 'question' | 'regulatory' | 'justification' | 'guide' } | null>(null);
  const [tempTextValue, setTempTextValue] = useState('');
  const [tempGuideLink, setTempGuideLink] = useState('');

  // Switch plan type
  const handleSelectPlanType = (typeKey: PlanTypeKey) => {
    setSelectedPlanType(typeKey);
    setSelectedExistingPlanId(null);
    if (typeKey === 'recombinant_protein') {
      setPlanTitle('Plano de Desenvolvimento – Proteína Recombinante');
      const plan = DEFAULT_ACTIVITY_PLANS.find(p => p.id === 'plan_recombinant_protein') || DEFAULT_ACTIVITY_PLANS[0];
      setPhases(convertTemplateToPhases(plan));
    } else if (typeKey === 'attenuated_virus') {
      setPlanTitle('Plano de Desenvolvimento – Vírus Atenuado');
      const plan = DEFAULT_ACTIVITY_PLANS.find(p => p.id === 'plan_attenuated_virus') || DEFAULT_ACTIVITY_PLANS[0];
      setPhases(convertTemplateToPhases(plan));
    } else if (typeKey === 'dna_vaccine') {
      setPlanTitle('Plano de Desenvolvimento – Vacina de DNA');
      const plan = DEFAULT_ACTIVITY_PLANS.find(p => p.id === 'plan_dna_vaccine') || DEFAULT_ACTIVITY_PLANS[0];
      setPhases(convertTemplateToPhases(plan));
    } else if (typeKey === 'rna_vaccine') {
      setPlanTitle('Plano de Desenvolvimento – Vacina de RNA Mensageiro');
      // Create template with the 7-phase reference structure tailored for RNA
      const rnaPlan: ActivityPlanTemplate = {
        id: 'plan_rna_synthetic',
        name: 'Plano-Base: Vacina de RNA',
        platform: 'RNA / mRNA',
        description: 'Plano de desenvolvimento regulatório para vacinas baseadas em mRNA ou saRNA encapsulado em LNP.',
        phases: VACCINE_PLATFORM_PHASES,
        macroActivities: [
          {
            name: 'Síntese enzimática do mRNA e desenho do construto',
            phase: VACCINE_PLATFORM_PHASES[0],
            microActivities: ['Otimização de códons e 5’/3’ UTR', 'Transcrição in vitro (IVT) com análogos modificados', 'Purificação e teste de integridade do transcrito'],
            keyDecisions: ['Qual análogo de nucleosídeo será utilizado para minimizar a imunogenicidade inata (ex: N1-metilpseudouridina)?'],
            regulatoryPoints: ['Demonstração de capeamento 5’ eficiente (>95%) e poliadenilação estável.'],
            technicalJustifications: ['Racional de expressão e estabilidade do RNA mensageiro em células eucarióticas.'],
            referenceGuides: [{ title: 'WHO Guidelines on Quality, Safety and Efficacy of mRNA Vaccines', link: 'https://www.who.int' }]
          },
          {
            name: 'Encapsulamento em Nanopartículas Lipídicas (LNP)',
            phase: VACCINE_PLATFORM_PHASES[1],
            microActivities: ['Formulação microfluídica com lípides ionizáveis', 'Taxa de encapsulamento e tamanho de partícula (DLS)', 'Estabilidade a -80°C e liofilização'],
            keyDecisions: ['A proporção N/P de lipídio ionizável para RNA foi otimizada para tolerabilidade in vivo?'],
            regulatoryPoints: ['Especificações de liberação para tamanho de nanopartícula e PDI (índice de polidispersão < 0.2).'],
            technicalJustifications: ['Compatibilidade dos lipídios ionizáveis e fosfolipídios estruturais.'],
            referenceGuides: [{ title: 'EMA Guidance on Quality Requirements for mRNA Vaccines', link: 'https://www.ema.europa.eu' }]
          },
          {
            name: 'Estudos in vivo',
            phase: VACCINE_PLATFORM_PHASES[1],
            microActivities: ['Imunogenicidade humoral e celular em camundongos', 'Biodistribuição de nanopartículas fluorescentes/bioluminescentes', 'Toxicidade de dose repetida BPL'],
            keyDecisions: [
              'Qual a justificativa para a seleção do modelo animal?',
              'Quais estudos são necessários para esta plataforma?',
              'Qual a justificativa para seleção da dose?',
              'Por que foi escolhido determinado adjuvante ou formulação de LNP?',
              'Qual a justificativa para a via de administração e o esquema de doses?',
              'Quais normas e guias fundamentam o delineamento?'
            ],
            regulatoryPoints: ['Biodistribuição mandatória e ausência de persistência em tecidos nobres (cérebro/gônadas).'],
            technicalJustifications: ['Cinética de expressão da proteína codificada e resposta imune duradoura.'],
            referenceGuides: [{ title: 'WHO TRS 927 – Guidelines on Nonclinical Evaluation of Vaccines', link: 'https://www.who.int' }]
          }
        ]
      };
      setPhases(convertTemplateToPhases(rnaPlan));
    } else {
      setPlanTitle('Plano de Desenvolvimento Personalizado');
      setPhases(VACCINE_PLATFORM_PHASES.map((phName, idx) => ({
        id: `ph_cust_${idx}`,
        name: phName,
        description: `Fase ${idx + 1} do desenvolvimento`,
        expanded: idx === 0,
        macros: []
      })));
    }
  };

  // Select an existing plan from the system
  const handleSelectExistingPlan = (plan: ActivityPlanTemplate) => {
    setSelectedExistingPlanId(plan.id);
    setSelectedPlanType('custom');
    setPlanTitle(plan.name);
    setPhases(convertTemplateToPhases(plan));
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
      description: 'Nova fase do plano',
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

  const setMacroTab = (phaseId: string, macroId: string, tab: 'micros' | 'regulatory') => {
    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        macros: p.macros.map(m => m.id === macroId ? { ...m, activeTab: tab } : m)
      };
    }));
  };

  const handleAddMacro = (phaseId: string) => {
    if (!newMacroName.trim()) return;
    const newMac: PlanMacroItem = {
      id: `mac_${Date.now()}`,
      name: newMacroName.trim(),
      description: 'Macroatividade estratégica',
      expanded: true,
      activeTab: 'micros',
      micros: [],
      keyDecisions: [],
      regulatoryPoints: [],
      technicalJustifications: [],
      referenceGuides: []
    };
    setPhases(phases.map(p => p.id === phaseId ? { ...p, macros: [...p.macros, newMac] } : p));
    setNewMacroName('');
    setNewMacroPhaseId(null);
  };

  const handleDeleteMacro = (phaseId: string, macroId: string) => {
    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        macros: p.macros.filter(m => m.id !== macroId)
      };
    }));
  };

  // Micro operations
  const handleAddMicro = (phaseId: string, macroId: string) => {
    if (!newMicroName.trim()) return;
    const newMic: PlanMicroItem = {
      id: `mic_${Date.now()}`,
      name: newMicroName.trim(),
      description: 'Microatividade operacional'
    };
    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        macros: p.macros.map(m => {
          if (m.id !== macroId) return m;
          return { ...m, micros: [...m.micros, newMic] };
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

  // Regulatory item handlers for Leader
  const handleAddRegulatoryItem = (phaseId: string, macroId: string) => {
    if (!activeInputType || !tempTextValue.trim()) return;
    const { type } = activeInputType;

    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        macros: p.macros.map(m => {
          if (m.id !== macroId) return m;
          if (type === 'question') {
            return { ...m, keyDecisions: [...(m.keyDecisions || []), tempTextValue.trim()] };
          } else if (type === 'regulatory') {
            return { ...m, regulatoryPoints: [...(m.regulatoryPoints || []), tempTextValue.trim()] };
          } else if (type === 'justification') {
            return { ...m, technicalJustifications: [...(m.technicalJustifications || []), tempTextValue.trim()] };
          } else if (type === 'guide') {
            const newGuide: PlanReferenceGuide = {
              title: tempTextValue.trim(),
              link: tempGuideLink.trim() || undefined
            };
            return { ...m, referenceGuides: [...(m.referenceGuides || []), newGuide] };
          }
          return m;
        })
      };
    }));

    setTempTextValue('');
    setTempGuideLink('');
    setActiveInputType(null);
  };

  const handleRemoveRegulatoryItem = (phaseId: string, macroId: string, type: 'question' | 'regulatory' | 'justification' | 'guide', index: number) => {
    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        macros: p.macros.map(m => {
          if (m.id !== macroId) return m;
          if (type === 'question') {
            return { ...m, keyDecisions: (m.keyDecisions || []).filter((_, idx) => idx !== index) };
          } else if (type === 'regulatory') {
            return { ...m, regulatoryPoints: (m.regulatoryPoints || []).filter((_, idx) => idx !== index) };
          } else if (type === 'justification') {
            return { ...m, technicalJustifications: (m.technicalJustifications || []).filter((_, idx) => idx !== index) };
          } else if (type === 'guide') {
            return { ...m, referenceGuides: (m.referenceGuides || []).filter((_, idx) => idx !== index) };
          }
          return m;
        })
      };
    }));
  };

  // Apply template to microactivity
  const handleApplyTemplate = (phaseId: string, macroId: string, microId: string, tmpl: MicroOperationalTemplate) => {
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
                appliedTemplateId: tmpl.id,
                appliedTemplateName: tmpl.name,
                checklist: tmpl.checklist.map(c => ({ id: c.id, item: c.item, completed: false })),
                internalDependencies: tmpl.internalDependencies ? [...tmpl.internalDependencies] : []
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
          microActivities: macro.micros.map(mi => mi.name),
          keyDecisions: macro.keyDecisions || [],
          regulatoryPoints: macro.regulatoryPoints || [],
          technicalJustifications: macro.technicalJustifications || [],
          referenceGuides: macro.referenceGuides || []
        });
      });
    });

    const newPlan: ActivityPlanTemplate = {
      id: selectedExistingPlanId || `plan_${Date.now()}`,
      name: planTitle.trim() || 'Novo Plano de Atividades',
      platform: selectedPlanType === 'recombinant_protein' ? 'Proteína Recombinante' : 
                selectedPlanType === 'dna_vaccine' ? 'Vacina de DNA' :
                selectedPlanType === 'attenuated_virus' ? 'Vírus Atenuado' :
                selectedPlanType === 'rna_vaccine' ? 'Vacina de RNA' : 'Personalizado',
      description: `Plano-base configurado para a plataforma ${planTitle}`,
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
      description: 'Plano de 7 fases para candidatos vacinais com subunidade proteica recombinante.',
      icon: <Dna className="text-blue-600" size={20} />
    },
    {
      key: 'dna_vaccine',
      title: 'Vacina de DNA',
      description: 'Plano com foco em plasmídeos recombinantes, eletroporação e biossegurança.',
      icon: <Activity className="text-purple-600" size={20} />
    },
    {
      key: 'attenuated_virus',
      title: 'Vírus atenuado',
      description: 'Plano para plataformas com cepas atenuadas, passagens e estabilidade viral.',
      icon: <Sparkles className="text-emerald-600" size={20} />
    },
    {
      key: 'rna_vaccine',
      title: 'Vacina de RNA / mRNA',
      description: 'Plano com síntese de mRNA, encapsulamento em LNP e ensaios translacionais.',
      icon: <FileText className="text-amber-600" size={20} />
    },
    {
      key: 'custom',
      title: 'Outro / Personalizado',
      description: 'Configurar fases e atividades livremente para novas plataformas.',
      icon: <FileText className="text-slate-600" size={20} />
    }
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-[#F8FAFC] flex flex-col overflow-hidden animate-in fade-in duration-200">
      
      {/* Top Bar */}
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
              Plano-Base por Plataforma Vacinal
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Defina fases, macroatividades, decisões estratégicas e orientações regulatórias reutilizáveis
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
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Settings size={14} /> Gerenciar templates de microatividades
          </button>

          <button
            type="button"
            onClick={handleSavePlan}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
          >
            <Check size={14} /> Salvar plano-base
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
        
        {/* Column 1: Configuração e Modelos */}
        <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden shrink-0">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-sm font-black text-slate-900">1. Tipo de plano & plataforma</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Escolha a plataforma vacinal para carregar o modelo de referência de 7 fases:
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
            
            {/* Title input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Nome do plano de desenvolvimento:
              </label>
              <input
                type="text"
                value={planTitle}
                onChange={e => setPlanTitle(e.target.value)}
                placeholder="Ex: Plano – Proteína Recombinante..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Platform radio cards */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 block">
                Plataforma vacinal:
              </label>
              {planOptions.map(opt => {
                const isSelected = selectedPlanType === opt.key && !selectedExistingPlanId;
                return (
                  <div
                    key={opt.key}
                    onClick={() => handleSelectPlanType(opt.key)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-2xs ring-1 ring-blue-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0 mt-0.5">
                      {opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 block truncate">
                          {opt.title}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Check size={10} />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Existing plans list */}
            {existingPlans.length > 0 && (
              <div className="pt-2 border-t border-slate-150 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Ou editar plano existente:
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {existingPlans.map(plan => {
                    const isSelected = selectedExistingPlanId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => handleSelectExistingPlan(plan)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{plan.name}</span>
                        {onDeletePlan && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Excluir o modelo "${plan.name}"?`)) {
                                onDeletePlan(plan.id);
                              }
                            }}
                            className="text-slate-400 hover:text-red-500 p-1"
                            title="Excluir modelo"
                          >
                            <Trash2 size={12} />
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

        {/* Column 2: Estrutura do plano */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          
          {/* Header of column 2 */}
          <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div>
              <h2 className="text-sm font-black text-slate-900">2. Estrutura do plano, decisões e orientações regulatórias</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Estrutura de 7 fases de referência. Edite atividades, cadastre perguntas estratégicas, normas e justificativas.
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
                placeholder="Nome da nova fase..."
                className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddPhase}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 cursor-pointer"
              >
                Salvar fase
              </button>
              <button
                type="button"
                onClick={() => setIsAddingPhase(false)}
                className="px-3 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* List of Phases, Macros, Micros */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {phases.map((phase) => (
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
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-900 transition cursor-pointer"
                    >
                      {phase.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-slate-900 truncate block">
                        {phase.name}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate block">
                        {phase.macros.length} macroatividades cadastradas
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewMacroPhaseId(phase.id);
                        setNewMacroName('');
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Macroatividade
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePhase(phase.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                      title="Excluir fase"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Phase Content (Macros) */}
                {phase.expanded && (
                  <div className="p-4 space-y-3 bg-white">
                    {/* Inline add macro in this phase */}
                    {newMacroPhaseId === phase.id && (
                      <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl flex items-center gap-2">
                        <input
                          type="text"
                          value={newMacroName}
                          onChange={e => setNewMacroName(e.target.value)}
                          placeholder="Nome da macroatividade (Ex: Estudos in vivo)..."
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleAddMacro(phase.id)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewMacroPhaseId(null)}
                          className="px-2 py-1.5 text-slate-400 text-xs font-bold cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}

                    {phase.macros.map((macro) => {
                      const isExpanded = macro.expanded;
                      const activeTab = macro.activeTab || 'micros';
                      const decisionsCount = (macro.keyDecisions || []).length;
                      const guidesCount = (macro.referenceGuides || []).length;
                      const regCount = (macro.regulatoryPoints || []).length;

                      return (
                        <div 
                          key={macro.id}
                          className="border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-2xs"
                        >
                          {/* Macro Header */}
                          <div className="p-3 bg-slate-50/50 hover:bg-slate-100/50 flex items-center justify-between gap-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <GripVertical size={13} className="text-slate-400 shrink-0 cursor-grab" />
                              <button
                                type="button"
                                onClick={() => toggleMacroExpand(phase.id, macro.id)}
                                className="p-1 rounded text-slate-500 hover:text-slate-900 transition cursor-pointer"
                              >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                              <div className="min-w-0">
                                <span className="text-xs font-black text-slate-800 block truncate">
                                  {macro.name}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span>{macro.micros.length} microatividades</span>
                                  {decisionsCount > 0 && <span>• {decisionsCount} decisões/perguntas</span>}
                                  {guidesCount > 0 && <span>• {guidesCount} normas/guias</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDeleteMacro(phase.id, macro.id)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                                title="Excluir macroatividade"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Macro Content */}
                          {isExpanded && (
                            <div className="p-3 space-y-3 bg-slate-50/30">
                              
                              {/* Subtabs inside macro: Microatividades vs Decisões & Regulação */}
                              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                                <button
                                  type="button"
                                  onClick={() => setMacroTab(phase.id, macro.id, 'micros')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    activeTab === 'micros'
                                      ? 'bg-blue-600 text-white shadow-2xs'
                                      : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  Microatividades ({macro.micros.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMacroTab(phase.id, macro.id, 'regulatory')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                    activeTab === 'regulatory'
                                      ? 'bg-blue-600 text-white shadow-2xs'
                                      : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  <ShieldCheck size={13} />
                                  Decisões & Orientações ({decisionsCount + guidesCount + regCount})
                                </button>
                              </div>

                              {/* TAB 1: Microatividades */}
                              {activeTab === 'micros' && (
                                <div className="space-y-2">
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
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 relative">
                                          {hasTemplate ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-bold shadow-2xs">
                                              <FileText size={12} className="text-blue-600" />
                                              <span>{micro.appliedTemplateName}</span>
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveTemplate(phase.id, macro.id, micro.id)}
                                                className="text-blue-400 hover:text-red-500 transition ml-1 cursor-pointer"
                                                title="Remover template"
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

                                              {isDropdownOpen && (
                                                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                                                  <div className="px-2 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    Templates operacionais:
                                                  </div>
                                                  <div className="max-h-48 overflow-y-auto space-y-1">
                                                    {availableTemplates.map(tmpl => (
                                                      <button
                                                        key={tmpl.id}
                                                        type="button"
                                                        onClick={() => handleApplyTemplate(phase.id, macro.id, micro.id, tmpl)}
                                                        className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-blue-50 text-xs font-bold text-slate-800 hover:text-blue-700 transition flex items-center justify-between cursor-pointer"
                                                      >
                                                        <span>{tmpl.name}</span>
                                                        <span className="text-[10px] text-slate-400 font-normal">{tmpl.checklist.length} itens</span>
                                                      </button>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() => handleDeleteMicro(phase.id, macro.id, micro.id)}
                                            className="p-1 text-slate-300 hover:text-red-500 rounded transition cursor-pointer"
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
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                                      >
                                        Salvar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setNewMicroMacroId(null)}
                                        className="px-2 py-1.5 text-slate-400 text-xs font-bold cursor-pointer"
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

                              {/* TAB 2: Decisões e Orientações Regulatórias */}
                              {activeTab === 'regulatory' && (
                                <div className="space-y-4 bg-white p-3.5 rounded-xl border border-slate-200">
                                  
                                  {/* 1. Perguntas e Decisões Importantes */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                        <HelpCircle size={14} className="text-blue-600" />
                                        Perguntas e Decisões Importantes a Avaliar ({decisionsCount})
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveInputType({ macroId: macro.id, type: 'question' });
                                          setTempTextValue('');
                                        }}
                                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <Plus size={12} /> Adicionar pergunta
                                      </button>
                                    </div>

                                    {/* Inline input */}
                                    {activeInputType?.macroId === macro.id && activeInputType.type === 'question' && (
                                      <div className="flex items-center gap-2 p-2 bg-blue-50/60 rounded-xl">
                                        <input
                                          type="text"
                                          value={tempTextValue}
                                          onChange={e => setTempTextValue(e.target.value)}
                                          placeholder="Ex: Qual a justificativa para a seleção do modelo animal?"
                                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                          autoFocus
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleAddRegulatoryItem(phase.id, macro.id)}
                                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                                        >
                                          Adicionar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setActiveInputType(null)}
                                          className="px-2 text-slate-400 text-xs cursor-pointer"
                                        >
                                          X
                                        </button>
                                      </div>
                                    )}

                                    <div className="space-y-1.5">
                                      {(macro.keyDecisions || []).map((dec, dIdx) => (
                                        <div key={dIdx} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-2 text-xs">
                                          <span className="text-slate-800 leading-snug">{dec}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveRegulatoryItem(phase.id, macro.id, 'question', dIdx)}
                                            className="text-slate-400 hover:text-red-500 shrink-0 cursor-pointer"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      ))}
                                      {decisionsCount === 0 && !activeInputType && (
                                        <p className="text-[11px] text-slate-400 italic">Nenhuma pergunta cadastrada para esta atividade.</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* 2. Pontos de Atenção Regulatória */}
                                  <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                        <AlertTriangle size={14} className="text-amber-500" />
                                        Pontos de Atenção Regulatória ({regCount})
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveInputType({ macroId: macro.id, type: 'regulatory' });
                                          setTempTextValue('');
                                        }}
                                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <Plus size={12} /> Adicionar ponto
                                      </button>
                                    </div>

                                    {activeInputType?.macroId === macro.id && activeInputType.type === 'regulatory' && (
                                      <div className="flex items-center gap-2 p-2 bg-amber-50/60 rounded-xl">
                                        <input
                                          type="text"
                                          value={tempTextValue}
                                          onChange={e => setTempTextValue(e.target.value)}
                                          placeholder="Ex: Conformidade com Boas Práticas de Laboratório (BPL)..."
                                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                          autoFocus
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleAddRegulatoryItem(phase.id, macro.id)}
                                          className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                                        >
                                          Adicionar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setActiveInputType(null)}
                                          className="px-2 text-slate-400 text-xs cursor-pointer"
                                        >
                                          X
                                        </button>
                                      </div>
                                    )}

                                    <div className="space-y-1.5">
                                      {(macro.regulatoryPoints || []).map((pt, pIdx) => (
                                        <div key={pIdx} className="p-2 bg-amber-50/30 rounded-xl border border-amber-100 flex items-start justify-between gap-2 text-xs">
                                          <span className="text-slate-800 leading-snug">{pt}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveRegulatoryItem(phase.id, macro.id, 'regulatory', pIdx)}
                                            className="text-slate-400 hover:text-red-500 shrink-0 cursor-pointer"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* 3. Normas, Guias e Artigos de Referência */}
                                  <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                        <BookOpen size={14} className="text-emerald-600" />
                                        Normas, Guias e Artigos de Referência ({guidesCount})
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveInputType({ macroId: macro.id, type: 'guide' });
                                          setTempTextValue('');
                                          setTempGuideLink('');
                                        }}
                                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <Plus size={12} /> Adicionar guia
                                      </button>
                                    </div>

                                    {activeInputType?.macroId === macro.id && activeInputType.type === 'guide' && (
                                      <div className="space-y-2 p-2.5 bg-emerald-50/60 rounded-xl">
                                        <input
                                          type="text"
                                          value={tempTextValue}
                                          onChange={e => setTempTextValue(e.target.value)}
                                          placeholder="Título da norma (Ex: WHO TRS 927)..."
                                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                          autoFocus
                                        />
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="url"
                                            value={tempGuideLink}
                                            onChange={e => setTempGuideLink(e.target.value)}
                                            placeholder="Link oficial ou do SharePoint..."
                                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleAddRegulatoryItem(phase.id, macro.id)}
                                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                                          >
                                            Salvar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setActiveInputType(null)}
                                            className="px-2 text-slate-400 text-xs cursor-pointer"
                                          >
                                            X
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    <div className="space-y-1.5">
                                      {(macro.referenceGuides || []).map((gd, gIdx) => (
                                        <div key={gIdx} className="p-2 bg-emerald-50/30 rounded-xl border border-emerald-100 flex items-center justify-between gap-2 text-xs">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <LinkIcon size={12} className="text-emerald-600 shrink-0" />
                                            <span className="font-bold text-slate-800 truncate">{gd.title}</span>
                                            {gd.link && <span className="text-[10px] text-slate-400 truncate">({gd.link})</span>}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveRegulatoryItem(phase.id, macro.id, 'guide', gIdx)}
                                            className="text-slate-400 hover:text-red-500 shrink-0 cursor-pointer"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                </div>
                              )}

                            </div>
                          )}

                        </div>
                      );
                    })}

                    {phase.macros.length === 0 && (
                      <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-400">Nenhuma macroatividade cadastrada nesta fase.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Templates Drawer */}
      <ManageTemplatesDrawer
        isOpen={isTemplateDrawerOpen}
        onClose={() => setIsTemplateDrawerOpen(false)}
        initialTemplateToEdit={templateToEdit}
        onTemplateSaved={() => {
          setAvailableTemplates(loadMicroTemplates());
        }}
      />

    </div>
  );
};
