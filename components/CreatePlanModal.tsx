import React, { useState, useMemo, useRef } from 'react';
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
  X,
  FlaskConical,
  TestTube,
  Microscope,
  Beaker,
  Clock,
  Send,
  CheckCircle2,
  Award,
  Syringe,
  Atom,
  Layers,
  Building,
  Search,
  Edit3,
  Filter,
  Rat
} from 'lucide-react';
import { ActivityPlanTemplate, MacroActivityTemplate, PlanReferenceGuide, PlanDecisionItem, RegulatoryStandard } from '../types';
import { 
  MicroOperationalTemplate, 
  loadMicroTemplates, 
  saveMicroTemplates, 
  DEFAULT_MICRO_TEMPLATES 
} from '../utils/microTemplates';
import { ManageTemplatesDrawer } from './ManageTemplatesDrawer';
import { 
  DEFAULT_ACTIVITY_PLANS, 
  VACCINE_PLATFORM_PHASES, 
  STANDARD_REGULATORY_GROUPS,
  AVAILABLE_MACRO_ICONS,
  MacroIconOption,
  getMacroIconComponent,
  DEFAULT_REGULATORY_STANDARDS
} from '../constants';

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
  icon?: string;
  description: string;
  expanded: boolean;
  activeTab?: 'micros' | 'regulatory';
  micros: PlanMicroItem[];
  keyDecisions?: string[];
  decisionsList?: PlanDecisionItem[];
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
  regulatoryStandards?: RegulatoryStandard[];
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
        icon: mac.icon,
        description: mac.expectedResults || '',
        expanded: false,
        activeTab: 'micros',
        keyDecisions: mac.keyDecisions ? [...mac.keyDecisions] : [],
        decisionsList: mac.decisionsList ? JSON.parse(JSON.stringify(mac.decisionsList)) : (mac.keyDecisions || []).map((q, qIdx) => ({
          id: `dec_${pIdx}_${mIdx}_${qIdx}`,
          question: q,
          status: 'Pendente' as const,
          hasRegulatoryImpact: true,
          isMandatory: true,
          responseType: 'ambos' as const
        })),
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
  onDeletePlan,
  regulatoryStandards = []
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

  // Macro icon selection
  const [newMacroIcon, setNewMacroIcon] = useState<string>('FlaskConical');
  const [iconPickerTarget, setIconPickerTarget] = useState<{ phaseId?: string; macroId?: string; isNew?: boolean; currentIcon?: string } | null>(null);
  const [iconCategoryFilter, setIconCategoryFilter] = useState<string>('Todos');

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
  const [guideInputMode, setGuideInputMode] = useState<'catalog' | 'manual'>('catalog');
  const [standardSearchQuery, setStandardSearchQuery] = useState('');

  // Refs for fast-save focus and preventing duplicate submissions
  const isSubmittingRef = useRef<boolean>(false);
  const microInputRef = useRef<HTMLInputElement>(null);
  const quickInputRef = useRef<HTMLInputElement>(null);

  // Regulatory standards list with fallback to defaults so it is never empty
  const allAvailableStandards = useMemo(() => {
    if (regulatoryStandards && regulatoryStandards.length > 0) {
      return regulatoryStandards;
    }
    return DEFAULT_REGULATORY_STANDARDS;
  }, [regulatoryStandards]);

  const filteredStandards = useMemo(() => {
    const q = standardSearchQuery.toLowerCase().trim();
    if (!q) return allAvailableStandards;
    return allAvailableStandards.filter(s => 
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.theme && s.theme.toLowerCase().includes(q)) ||
      (s.type && s.type.toLowerCase().includes(q)) ||
      (s.summary && s.summary.toLowerCase().includes(q)) ||
      (s.keywords && s.keywords.some(k => k.toLowerCase().includes(q)))
    );
  }, [allAvailableStandards, standardSearchQuery]);

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
    const trimmed = newMacroName.trim();
    if (!trimmed) return;

    // Intelligent icon choice: if user customized, use it. Otherwise smart default (NEVER animal unless explicit)
    let assignedIcon = newMacroIcon || 'FlaskConical';
    const isAnimal = trimmed.toLowerCase().includes('in vivo') || 
                     trimmed.toLowerCase().includes('animal') || 
                     trimmed.toLowerCase().includes('roedores');
    if (!newMacroIcon || newMacroIcon === 'FlaskConical') {
      if (isAnimal) {
        assignedIcon = 'Rat';
      } else if (trimmed.toLowerCase().includes('banco') || trimmed.toLowerCase().includes('upstream')) {
        assignedIcon = 'Layers';
      } else if (trimmed.toLowerCase().includes('lote') || trimmed.toLowerCase().includes('bpl') || trimmed.toLowerCase().includes('produção')) {
        assignedIcon = 'TestTube';
      } else if (trimmed.toLowerCase().includes('impureza') || trimmed.toLowerCase().includes('caracterização')) {
        assignedIcon = 'Microscope';
      } else if (trimmed.toLowerCase().includes('estabilidade')) {
        assignedIcon = 'Clock';
      } else if (trimmed.toLowerCase().includes('formulação') || trimmed.toLowerCase().includes('adjuvante')) {
        assignedIcon = 'Syringe';
      } else if (trimmed.toLowerCase().includes('clínico') || trimmed.toLowerCase().includes('voluntário')) {
        assignedIcon = 'Users';
      } else if (trimmed.toLowerCase().includes('dossiê') || trimmed.toLowerCase().includes('documentação') || trimmed.toLowerCase().includes('ddcm')) {
        assignedIcon = 'FileText';
      } else {
        assignedIcon = 'FlaskConical';
      }
    }

    const newMac: PlanMacroItem = {
      id: `mac_${Date.now()}`,
      name: trimmed,
      icon: assignedIcon,
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
    setNewMacroIcon('FlaskConical');
    setNewMacroPhaseId(null);
  };

  const handleChangeMacroIcon = (phaseId: string, macroId: string, iconKey: string) => {
    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        macros: p.macros.map(m => m.id === macroId ? { ...m, icon: iconKey } : m)
      };
    }));
    setIconPickerTarget(null);
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

  // Micro operations (Fast save with Enter, no duplicate items, focus retained)
  const handleAddMicro = (phaseId: string, macroId: string, keepOpen: boolean = false) => {
    const trimmed = newMicroName.trim();
    if (!trimmed) return;

    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        macros: p.macros.map(m => {
          if (m.id !== macroId) return m;
          // Prevent exact duplicate microactivities from repeated keystrokes
          const alreadyExists = m.micros.some(mi => mi.name.toLowerCase() === trimmed.toLowerCase());
          if (alreadyExists) return m;
          const newMic: PlanMicroItem = {
            id: `mic_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: trimmed,
            description: 'Microatividade operacional'
          };
          return { ...m, micros: [...m.micros, newMic] };
        })
      };
    }));

    setNewMicroName('');
    if (!keepOpen) {
      setNewMicroMacroId(null);
    } else {
      setTimeout(() => {
        microInputRef.current?.focus();
      }, 50);
    }
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

  // Regulatory item handlers for Leader (Fast save with Enter, no duplicate items, focus retained)
  const handleAddRegulatoryItem = (phaseId: string, macroId: string, keepOpen: boolean = false) => {
    if (!activeInputType) return;
    const trimmed = tempTextValue.trim();
    if (!trimmed) return;
    const { type } = activeInputType;

    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        macros: p.macros.map(m => {
          if (m.id !== macroId) return m;
          if (type === 'question') {
            const alreadyExists = (m.keyDecisions || []).some(q => q.toLowerCase() === trimmed.toLowerCase());
            if (alreadyExists) return m;
            return { ...m, keyDecisions: [...(m.keyDecisions || []), trimmed] };
          } else if (type === 'regulatory') {
            const alreadyExists = (m.regulatoryPoints || []).some(pt => pt.toLowerCase() === trimmed.toLowerCase());
            if (alreadyExists) return m;
            return { ...m, regulatoryPoints: [...(m.regulatoryPoints || []), trimmed] };
          } else if (type === 'justification') {
            const alreadyExists = (m.technicalJustifications || []).some(j => j.toLowerCase() === trimmed.toLowerCase());
            if (alreadyExists) return m;
            return { ...m, technicalJustifications: [...(m.technicalJustifications || []), trimmed] };
          } else if (type === 'guide') {
            const alreadyExists = (m.referenceGuides || []).some(g => g.title.toLowerCase() === trimmed.toLowerCase());
            if (alreadyExists) return m;
            const newGuide: PlanReferenceGuide = {
              id: `guide_${Date.now()}`,
              title: trimmed,
              link: tempGuideLink.trim() || undefined,
              type: 'norma'
            };
            return { ...m, referenceGuides: [...(m.referenceGuides || []), newGuide] };
          }
          return m;
        })
      };
    }));

    setTempTextValue('');
    setTempGuideLink('');
    if (!keepOpen) {
      setActiveInputType(null);
    } else {
      setTimeout(() => {
        quickInputRef.current?.focus();
      }, 50);
    }
  };

  // Link existing regulatory standard directly from registered catalog (reuses ID, title, and link)
  const handleLinkExistingStandard = (phaseId: string, macroId: string, standard: RegulatoryStandard) => {
    setPhases(phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        macros: p.macros.map(m => {
          if (m.id !== macroId) return m;
          const alreadyExists = (m.referenceGuides || []).some(
            g => g.standardId === standard.id || g.title.toLowerCase() === standard.name.toLowerCase()
          );
          if (alreadyExists) return m;
          const newGuide: PlanReferenceGuide = {
            id: standard.id,
            standardId: standard.id,
            title: standard.name,
            link: standard.documentLink || standard.link || undefined,
            type: 'norma'
          };
          return {
            ...m,
            referenceGuides: [...(m.referenceGuides || []), newGuide]
          };
        })
      };
    }));
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



  // Save Plan
  const handleSavePlan = () => {
    const macroTemplates: MacroActivityTemplate[] = [];

    phases.forEach(phase => {
      phase.macros.forEach(macro => {
        macroTemplates.push({
          name: macro.name,
          phase: phase.name,
          icon: macro.icon,
          expectedResults: macro.description,
          microActivities: macro.micros.map(mi => mi.name),
          keyDecisions: macro.keyDecisions || [],
          decisionsList: macro.decisionsList || [],
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
                      <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIconPickerTarget({ phaseId: phase.id, isNew: true, currentIcon: newMacroIcon })}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-2xs shrink-0 cursor-pointer"
                            title="Escolher ícone da macroatividade"
                          >
                            {React.createElement(getMacroIconComponent(newMacroIcon), { size: 15, className: "text-blue-600" })}
                            <span>Ícone</span>
                          </button>

                          <input
                            type="text"
                            value={newMacroName}
                            onChange={e => setNewMacroName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                                e.preventDefault();
                                handleAddMacro(phase.id);
                              }
                            }}
                            placeholder="Nome da macroatividade (Ex: Produção de material, Estudos in vivo)..."
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleAddMacro(phase.id)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-2xs"
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
                      </div>
                    )}

                    {phase.macros.map((macro) => {
                      const isExpanded = macro.expanded;
                      const activeTab = macro.activeTab || 'micros';
                      const decisionsCount = (macro.keyDecisions || []).length;
                      const guidesCount = (macro.referenceGuides || []).length;
                      const regCount = (macro.regulatoryPoints || []).length;
                      const MacroIconComp = getMacroIconComponent(macro.icon);

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

                              {/* Macro Icon with preview and edit action */}
                              <button
                                type="button"
                                onClick={() => setIconPickerTarget({ phaseId: phase.id, macroId: macro.id, currentIcon: macro.icon || 'FlaskConical' })}
                                className="w-7 h-7 rounded-lg border border-slate-200/90 bg-white hover:bg-blue-50 hover:border-blue-300 flex items-center justify-center text-blue-600 transition shadow-2xs shrink-0 cursor-pointer"
                                title="Clique para alterar o ícone desta macroatividade"
                              >
                                <MacroIconComp size={15} />
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

                              {/* TAB 1: Microatividades (Templates removed, fast save with Enter active) */}
                              {activeTab === 'micros' && (
                                <div className="space-y-2">
                                  {macro.micros.map((micro) => (
                                    <div 
                                      key={micro.id}
                                      className="p-2.5 bg-white hover:bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 transition group relative shadow-2xs"
                                    >
                                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                        <FileText size={15} className="text-slate-400 shrink-0" />
                                        <div className="min-w-0">
                                          <span className="text-xs font-bold text-slate-800 block truncate">
                                            {micro.name}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
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
                                  ))}

                                  {/* Add Micro inline form with Enter fast-save */}
                                  {newMicroMacroId === macro.id ? (
                                    <div className="flex flex-col gap-1.5 pt-1 bg-blue-50/50 p-2.5 rounded-xl border border-blue-200">
                                      <div className="flex items-center gap-2">
                                        <input
                                          ref={microInputRef}
                                          type="text"
                                          value={newMicroName}
                                          onChange={e => setNewMicroName(e.target.value)}
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                              if (e.ctrlKey || e.metaKey) {
                                                return; // Ctrl+Enter inserts line break / does not save
                                              }
                                              e.preventDefault();
                                              if (!newMicroName.trim() || isSubmittingRef.current) return;
                                              isSubmittingRef.current = true;
                                              handleAddMicro(phase.id, macro.id, true);
                                              setTimeout(() => {
                                                isSubmittingRef.current = false;
                                                microInputRef.current?.focus();
                                              }, 50);
                                            }
                                          }}
                                          placeholder="Nome da microatividade (Enter para salvar e avançar)..."
                                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                                          autoFocus
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!newMicroName.trim() || isSubmittingRef.current) return;
                                            isSubmittingRef.current = true;
                                            handleAddMicro(phase.id, macro.id, true);
                                            setTimeout(() => {
                                              isSubmittingRef.current = false;
                                              microInputRef.current?.focus();
                                            }, 50);
                                          }}
                                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                                        >
                                          Salvar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setNewMicroMacroId(null)}
                                          className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                                        >
                                          Concluir
                                        </button>
                                      </div>
                                      <span className="text-[10px] text-slate-400 pl-1">
                                        Pressione <strong>Enter</strong> para salvar e continuar digitando; <strong>Ctrl+Enter</strong> para quebra de linha.
                                      </span>
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

                                    {/* Inline input with Enter fast-save */}
                                    {activeInputType?.macroId === macro.id && activeInputType.type === 'question' && (
                                      <div className="space-y-1.5 p-2 bg-blue-50/60 rounded-xl border border-blue-200">
                                        <div className="flex items-center gap-2">
                                          <input
                                            ref={quickInputRef}
                                            type="text"
                                            value={tempTextValue}
                                            onChange={e => setTempTextValue(e.target.value)}
                                            onKeyDown={e => {
                                              if (e.key === 'Enter') {
                                                if (e.ctrlKey || e.metaKey) return;
                                                e.preventDefault();
                                                if (!tempTextValue.trim() || isSubmittingRef.current) return;
                                                isSubmittingRef.current = true;
                                                handleAddRegulatoryItem(phase.id, macro.id, true);
                                                setTimeout(() => {
                                                  isSubmittingRef.current = false;
                                                  quickInputRef.current?.focus();
                                                }, 50);
                                              }
                                            }}
                                            placeholder="Ex: Qual a justificativa para a seleção do modelo animal? (Enter para salvar)"
                                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                            autoFocus
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (!tempTextValue.trim() || isSubmittingRef.current) return;
                                              isSubmittingRef.current = true;
                                              handleAddRegulatoryItem(phase.id, macro.id, true);
                                              setTimeout(() => {
                                                isSubmittingRef.current = false;
                                                quickInputRef.current?.focus();
                                              }, 50);
                                            }}
                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                                          >
                                            Salvar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setActiveInputType(null)}
                                            className="px-2 text-slate-400 text-xs cursor-pointer hover:text-slate-600 font-bold"
                                          >
                                            Concluir
                                          </button>
                                        </div>
                                        <span className="text-[10px] text-slate-400 pl-1">
                                          Pressione <strong>Enter</strong> para salvar e continuar digitando; <strong>Ctrl+Enter</strong> para quebra de linha.
                                        </span>
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
                                      <div className="space-y-1.5 p-2 bg-amber-50/60 rounded-xl border border-amber-200">
                                        <div className="flex items-center gap-2">
                                          <input
                                            ref={quickInputRef}
                                            type="text"
                                            value={tempTextValue}
                                            onChange={e => setTempTextValue(e.target.value)}
                                            onKeyDown={e => {
                                              if (e.key === 'Enter') {
                                                if (e.ctrlKey || e.metaKey) return;
                                                e.preventDefault();
                                                if (!tempTextValue.trim() || isSubmittingRef.current) return;
                                                isSubmittingRef.current = true;
                                                handleAddRegulatoryItem(phase.id, macro.id, true);
                                                setTimeout(() => {
                                                  isSubmittingRef.current = false;
                                                  quickInputRef.current?.focus();
                                                }, 50);
                                              }
                                            }}
                                            placeholder="Ex: Conformidade com Boas Práticas de Laboratório (BPL)... (Enter para salvar)"
                                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                            autoFocus
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (!tempTextValue.trim() || isSubmittingRef.current) return;
                                              isSubmittingRef.current = true;
                                              handleAddRegulatoryItem(phase.id, macro.id, true);
                                              setTimeout(() => {
                                                isSubmittingRef.current = false;
                                                quickInputRef.current?.focus();
                                              }, 50);
                                            }}
                                            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                                          >
                                            Salvar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setActiveInputType(null)}
                                            className="px-2 text-slate-400 text-xs cursor-pointer hover:text-slate-600 font-bold"
                                          >
                                            Concluir
                                          </button>
                                        </div>
                                        <span className="text-[10px] text-slate-400 pl-1">
                                          Pressione <strong>Enter</strong> para salvar e continuar digitando; <strong>Ctrl+Enter</strong> para quebra de linha.
                                        </span>
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

                                  {/* 3. Normas, Guias e Artigos de Referência (PRIORITY 5: Dual Selector - Searchable Catalog vs Manual) */}
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
                                          setGuideInputMode('catalog');
                                          setStandardSearchQuery('');
                                        }}
                                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <Plus size={12} /> Adicionar norma/guia
                                      </button>
                                    </div>

                                    {/* Dual Selection Container */}
                                    {activeInputType?.macroId === macro.id && activeInputType.type === 'guide' && (
                                      <div className="space-y-3 p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                                        {/* Dual Tab Buttons */}
                                        <div className="flex items-center gap-2 border-b border-emerald-200/80 pb-2">
                                          <button
                                            type="button"
                                            onClick={() => setGuideInputMode('catalog')}
                                            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                              guideInputMode === 'catalog' 
                                                ? 'bg-emerald-600 text-white shadow-2xs' 
                                                : 'bg-white/90 text-emerald-900 hover:bg-white'
                                            }`}
                                          >
                                            <BookOpen size={13} /> Selecionar norma existente
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setGuideInputMode('manual')}
                                            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                              guideInputMode === 'manual' 
                                                ? 'bg-emerald-600 text-white shadow-2xs' 
                                                : 'bg-white/90 text-emerald-900 hover:bg-white'
                                            }`}
                                          >
                                            <Plus size={13} /> Cadastrar referência manualmente
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setActiveInputType(null)}
                                            className="ml-auto text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                                          >
                                            Fechar
                                          </button>
                                        </div>

                                        {/* Option A: Searchable Registered Standards Catalog */}
                                        {guideInputMode === 'catalog' ? (
                                          <div className="space-y-2">
                                            <div className="relative">
                                              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                              <input
                                                type="text"
                                                value={standardSearchQuery}
                                                onChange={e => setStandardSearchQuery(e.target.value)}
                                                placeholder="Pesquisar norma por código, tema ou título (Ex: RDC 658, BPF, Farmacopeia)..."
                                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 shadow-2xs"
                                                autoFocus
                                              />
                                            </div>

                                            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                                              {filteredStandards.map(std => {
                                                const isAlreadyLinked = (macro.referenceGuides || []).some(
                                                  g => g.standardId === std.id || g.title.toLowerCase() === std.name.toLowerCase()
                                                );

                                                return (
                                                  <div 
                                                    key={std.id}
                                                    className={`p-2.5 rounded-xl border transition flex items-start justify-between gap-2 ${
                                                      isAlreadyLinked 
                                                        ? 'bg-emerald-100/60 border-emerald-300' 
                                                        : 'bg-white hover:bg-emerald-50/50 border-slate-200'
                                                    }`}
                                                  >
                                                    <div className="min-w-0 flex-1">
                                                      <div className="flex items-center gap-2">
                                                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded uppercase">
                                                          {std.type || 'Norma'}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-900 truncate">
                                                          {std.name}
                                                        </span>
                                                        {std.status && (
                                                          <span className="text-[10px] text-slate-400">({std.status})</span>
                                                        )}
                                                      </div>
                                                      {std.theme && (
                                                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{std.theme}</p>
                                                      )}
                                                      {std.summary && (
                                                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{std.summary}</p>
                                                      )}
                                                    </div>
                                                    <button
                                                      type="button"
                                                      disabled={isAlreadyLinked}
                                                      onClick={() => handleLinkExistingStandard(phase.id, macro.id, std)}
                                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                                                        isAlreadyLinked 
                                                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                                      }`}
                                                    >
                                                      {isAlreadyLinked ? 'Vinculada' : 'Selecionar'}
                                                    </button>
                                                  </div>
                                                );
                                              })}
                                              {filteredStandards.length === 0 && (
                                                <p className="text-xs text-slate-400 italic text-center py-3">
                                                  Nenhuma norma encontrada para "{standardSearchQuery}".
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          /* Option B: Manual Input with Enter fast-save */
                                          <div className="space-y-2">
                                            <input
                                              ref={quickInputRef}
                                              type="text"
                                              value={tempTextValue}
                                              onChange={e => setTempTextValue(e.target.value)}
                                              onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                  if (e.ctrlKey || e.metaKey) return;
                                                  e.preventDefault();
                                                  if (!tempTextValue.trim() || isSubmittingRef.current) return;
                                                  isSubmittingRef.current = true;
                                                  handleAddRegulatoryItem(phase.id, macro.id, true);
                                                  setTimeout(() => {
                                                    isSubmittingRef.current = false;
                                                    quickInputRef.current?.focus();
                                                  }, 50);
                                                }
                                              }}
                                              placeholder="Título da norma ou guia (Ex: WHO TRS 927)... (Enter para salvar)"
                                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                              autoFocus
                                            />
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="url"
                                                value={tempGuideLink}
                                                onChange={e => setTempGuideLink(e.target.value)}
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') {
                                                    if (e.ctrlKey || e.metaKey) return;
                                                    e.preventDefault();
                                                    if (!tempTextValue.trim() || isSubmittingRef.current) return;
                                                    isSubmittingRef.current = true;
                                                    handleAddRegulatoryItem(phase.id, macro.id, true);
                                                    setTimeout(() => {
                                                      isSubmittingRef.current = false;
                                                      quickInputRef.current?.focus();
                                                    }, 50);
                                                  }
                                                }}
                                                placeholder="Link oficial ou SharePoint (opcional)..."
                                                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (!tempTextValue.trim() || isSubmittingRef.current) return;
                                                  isSubmittingRef.current = true;
                                                  handleAddRegulatoryItem(phase.id, macro.id, true);
                                                  setTimeout(() => {
                                                    isSubmittingRef.current = false;
                                                    quickInputRef.current?.focus();
                                                  }, 50);
                                                }}
                                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-2xs"
                                              >
                                                Salvar
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setActiveInputType(null)}
                                                className="px-2 text-slate-400 text-xs cursor-pointer hover:text-slate-600 font-bold"
                                              >
                                                Concluir
                                              </button>
                                            </div>
                                            <span className="text-[10px] text-slate-400 pl-1">
                                              Pressione <strong>Enter</strong> para salvar e continuar digitando referências.
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <div className="space-y-1.5">
                                      {(macro.referenceGuides || []).map((gd, gIdx) => (
                                        <div key={gIdx} className="p-2 bg-emerald-50/30 rounded-xl border border-emerald-100 flex items-center justify-between gap-2 text-xs">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <LinkIcon size={12} className="text-emerald-600 shrink-0" />
                                            <span className="font-bold text-slate-800 truncate">{gd.title}</span>
                                            {gd.link && (
                                              <a 
                                                href={gd.link} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-[10px] text-emerald-700 hover:underline truncate max-w-[200px]"
                                              >
                                                ({gd.link})
                                              </a>
                                            )}
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

      {/* Macro Icon Picker Modal */}
      {iconPickerTarget && (
        <div className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/80 shadow-2xs">
                  {React.createElement(getMacroIconComponent(iconPickerTarget.currentIcon), { size: 20 })}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Selecionar Ícone da Macroatividade</h3>
                  <p className="text-[11px] text-slate-500">Escolha um ícone para representação visual no plano e na jornada</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIconPickerTarget(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1 shrink-0">
              {['Todos', 'Laboratório', 'Produção', 'Estudos Clínicos', 'Estudos In Vivo', 'Documentação', 'Qualidade', 'Estabilidade', 'Segurança', 'Vacina'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setIconCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    iconCategoryFilter === cat 
                      ? 'bg-blue-600 text-white shadow-2xs' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* In Vivo animal guideline note */}
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 leading-relaxed shrink-0 flex items-center gap-2">
              <Rat size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>Regra de conformidade:</strong> O ícone de animal é reservado estritamente para estudos <em>in vivo</em> pré-clínicos.
              </span>
            </div>

            {/* Icon Grid */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AVAILABLE_MACRO_ICONS.filter(ico => iconCategoryFilter === 'Todos' || ico.category === iconCategoryFilter).map(item => {
                const isSelected = iconPickerTarget.currentIcon === item.key;
                const IconComp = item.icon;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (iconPickerTarget.isNew) {
                        setNewMacroIcon(item.key);
                        setIconPickerTarget(null);
                      } else if (iconPickerTarget.phaseId && iconPickerTarget.macroId) {
                        handleChangeMacroIcon(iconPickerTarget.phaseId, iconPickerTarget.macroId, item.key);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-2xs' 
                        : 'border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <IconComp size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-black text-slate-900 block truncate">{item.label}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{item.category}</span>
                      {item.isInVivoOnly && (
                        <span className="inline-block mt-0.5 px-1 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-black uppercase">
                          In Vivo
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Ícone atual: <strong>{iconPickerTarget.currentIcon || 'FlaskConical'}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIconPickerTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
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
