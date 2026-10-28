import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  FlaskConical, 
  Calendar, 
  Flag, 
  MoreVertical, 
  X, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Clock,
  Printer,
  FileText,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Bookmark,
  Target,
  Shield,
  Presentation,
  Paperclip,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Link as LinkIcon,
  Plus,
  BookOpen,
  Trash2,
  Sparkles,
  Layers,
  TestTube,
  Microscope,
  Beaker,
  Rat,
  Building,
  Send,
  Award,
  Activity,
  CheckCircle2,
  Filter,
  Search,
  Database,
  Download,
  History as HistoryIcon,
  Inbox,
  AlertCircle,
  Eye,
  Share2,
  FileSpreadsheet,
  Layers3,
  Edit3,
  Sliders,
  Pencil,
  Zap,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  Project, 
  MicroActivity, 
  MicroActivityStatus, 
  TeamMember, 
  RegulatoryStandard,
  Meeting,
  Task,
  PlanDecisionItem,
  PlanReferenceGuide,
  MacroActivity,
  RegulatoryRecordItem,
  ProjectContributionItem,
  ProjectHistoryEvent,
  RegulatoryTermDefinition
} from '../types';
import { 
  STANDARD_REGULATORY_GROUPS, 
  INITIAL_REGULATORY_TERMS,
  VACCINE_PLATFORM_PHASES, 
  AVAILABLE_PROJECT_ICONS,
  AVAILABLE_MACRO_ICONS,
  getMacroIconComponent,
  DEFAULT_REGULATORY_STANDARDS
} from '../constants';
import { CompleteActivityModal } from './CompleteActivityModal';

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updatedProject: Project) => void;
  teamMembers?: TeamMember[];
  regulatoryStandards?: RegulatoryStandard[];
  onOpenRegulatoryModal?: (activityName: string) => void;
  onPrint?: () => void;
  onSwitchTab?: (tab: 'overview' | 'map' | 'details' | 'regulatory_docs') => void;
  meetings?: Meeting[];
  tasks?: Task[];
}

// Canonical phase normalizer: removes numeric prefixes ("FASE 1 —", "FASE 2:", etc.)
// but strictly preserves the full phase name
const normalizePhaseName = (name: string): string => {
  const trimmed = (name || '').trim();
  return trimmed.replace(/^FASE\s+\d+\s*[-—–:]\s*/i, '').trim();
};

// Regulatory knowledge and details mapping for standard groups
interface GroupRegulatoryData {
  summary: string;
  keyPoints: string[];
  guides: { name: string; url?: string }[];
  decisions: string[];
  applicableGuidesList?: string[];
  keyQuestions?: string[];
}

const GROUP_REGULATORY_MAP: Record<string, GroupRegulatoryData> = {
  'Produção de material': {
    summary: 'Nesta etapa, são produzidos os lotes de pesquisa e definidos os controles de qualidade para garantir identidade, pureza, potência e segurança do material utilizado nos estudos.',
    keyPoints: [
      'Seguir as Boas Práticas de Fabricação (quando aplicável).',
      'Definir especificações do lote de pesquisa.',
      'Comprovar identidade, pureza e potência.',
      'Considerar requisitos de estabilidade para o uso clínico.'
    ],
    guides: [
      { name: 'WHO Technical Report Series 1004 – Annex 2', url: 'https://www.who.int/publications/m/item/trs-1004-annex-2' },
      { name: 'ICH Q5A – Viral Safety Evaluation', url: 'https://www.ich.org/page/quality-guidelines' },
      { name: 'ICH Q6B – Specifications', url: 'https://www.ich.org/page/quality-guidelines' },
      { name: 'EMA Guideline on Quality of Vaccines', url: 'https://www.ema.europa.eu' },
      { name: 'Guia Anvisa – Produtos Biológicos', url: 'https://www.gov.br/anvisa' }
    ],
    decisions: [
      'Tipo de sistema de expressão',
      'Estratégia de purificação',
      'Critérios de liberação do lote',
      'Justificativa da escala de produção'
    ],
    applicableGuidesList: [
      'ICH Q5A(R2): Qualificação de linhagens celulares e avaliação de segurança viral.',
      'ICH Q6B: Testes de liberação físico-química e biológica de lote.',
      'RDC Anvisa nº 55/2010: Requisitos para registro de produtos biológicos.',
      'Farmacopeia Brasileira: Ensaios de esterilidade, endotoxinas e teor proteico.'
    ],
    keyQuestions: [
      'O lote de pesquisa foi produzido sob condições rastreáveis com documentação de lote?',
      'As especificações de pureza (ex: >95% por HPLC/SDS-PAGE) foram atendidas?',
      'O nível de endotoxinas bacterianas está abaixo do limite aceitável (< 5 EU/dose)?',
      'A estabilidade do material congelado ou liofilizado foi confirmada para o período de testes?'
    ]
  },
  'Caracterização do candidato': {
    summary: 'Caracterização físico-química e biológica exaustiva do antígeno vacinal, confirmando conformação tridimensional, peso molecular, homogeneidade e afinidade de ligação.',
    keyPoints: [
      'Validação de métodos analíticos (HPLC, SDS-PAGE, DLS, Espectrometria de Massas).',
      'Determinação precisa do perfil de impurezas e agregados proteicos.',
      'Avaliação de glicosilação e modificações pós-traducionais críticas.',
      'Confirmação de epítopos funcionais por ensaios de ligação (ELISA/SPR).'
    ],
    guides: [
      { name: 'ICH Q6B – Specifications for Biologicals', url: 'https://www.ich.org' },
      { name: 'ICH Q2(R1) – Validation of Analytical Procedures', url: 'https://www.ich.org' },
      { name: 'EMA Guideline on Influenza & Recombinant Vaccines', url: 'https://www.ema.europa.eu' },
      { name: 'Guia Anvisa – Caracterização de Moléculas Complexas', url: 'https://www.gov.br/anvisa' }
    ],
    decisions: [
      'Painel de testes analíticos críticos de liberação',
      'Definição de padrão de referência primário e de trabalho',
      'Limites de aceitação para isoformas e variantes conformacionais'
    ],
    applicableGuidesList: [
      'ICH Q6B: Especificações analíticas para produtos biotecnológicos.',
      'ICH Q2(R2): Validação de procedimentos analíticos espectroscópicos e cromatográficos.'
    ],
    keyQuestions: [
      'O mapa de peptídeos por espectrometria de massa coincide com a sequência teórica?',
      'A integridade estrutural após congelamento/descongelamento foi comprovada?'
    ]
  },
  'Estudos não clínicos': {
    summary: 'Avaliação de farmacodinâmica primária, resposta imunológica e perfil toxicológico de dose repetida em modelos animais representativos sob Boas Práticas de Laboratório (BPL).',
    keyPoints: [
      'Estudos de toxicidade sistêmica em conformidade com BPL.',
      'Monitoramento de tolerância local no sítio de injeção e reações inflamatórias.',
      'Avaliação de biodistribuição e eliminação de componentes da formulação.',
      'Aprovação prévia por Comissão de Ética no Uso de Animais (CEUA).'
    ],
    guides: [
      { name: 'WHO TRS 927 – Nonclinical Evaluation of Vaccines', url: 'https://www.who.int' },
      { name: 'ICH M3(R2) – Nonclinical Safety Studies', url: 'https://www.ich.org' },
      { name: 'ICH S6(R1) – Preclinical Safety of Biopharmaceuticals', url: 'https://www.ich.org' },
      { name: 'Guia Anvisa nº 23/2019 – Avaliação Não Clínica', url: 'https://www.gov.br/anvisa' }
    ],
    decisions: [
      'Seleção da espécie animal mais sensível e imunologicamente responsiva',
      'Determinação do NOAEL (No Observed Adverse Effect Level)',
      'Duração do período de acompanhamento de toxicidade de dose repetida'
    ],
    applicableGuidesList: [
      'OECD Principles on Good Laboratory Practice (GLP).',
      'Guia Anvisa nº 23/2019 para condução de estudos toxicológicos em vacinas.'
    ],
    keyQuestions: [
      'O laboratório executor do ensaio toxicológico possui certificação BPL ativa?',
      'Foi observada toxicidade de órgãos-alvo ou formação de imunocomplexos indesejados?'
    ]
  },
  'Escolha da dose, via e esquema': {
    summary: 'Determinação da curva dose-resposta, seleção da via de inoculação ótima (IM/SC) e periodicidade das doses de reforço para induzir imunidade protetora duradoura.',
    keyPoints: [
      'Avaliação comparativa de doses baixas, intermediárias e elevadas.',
      'Justificativa do intervalo entre primeira dose e reforços (ex: D0, D28, D56).',
      'Modelagem translacional da dose animal para o ensaio clínico Fase 1 (HED).'
    ],
    guides: [
      { name: 'WHO Guidelines on Clinical Evaluation of Vaccines', url: 'https://www.who.int' },
      { name: 'FDA Guidance: Estimating Maximum Safe Starting Dose in Adults', url: 'https://www.fda.gov' },
      { name: 'ICH S7A – Safety Pharmacology', url: 'https://www.ich.org' }
    ],
    decisions: [
      'Dose inicial segura e dose máxima planejada para escalonamento',
      'Via de administração intramuscular vs subcutânea',
      'Esquema vacinal de 1, 2 ou 3 doses'
    ],
    applicableGuidesList: [
      'WHO TRS 924: Guidelines for regulatory assessment of vaccine dosing schemes.'
    ],
    keyQuestions: [
      'A dose selecionada induz títulos protetores sem gerar reactogenicidade excessiva?',
      'Existe correlação clara entre dose, via de administração e título de anticorpos?'
    ]
  },
  'Estudos de imunogenicidade': {
    summary: 'Caracterização aprofundada da resposta imune protetora humoral (anticorpos neutralizantes, IgG total e subclasses) e celular (linfócitos T CD4+ e CD8+ produtores de IFN-gama e TNF-alfa).',
    keyPoints: [
      'Padronização e validação de ensaios de neutralização e ELISA in-house.',
      'Determinação do perfil de polarização Th1 vs Th2.',
      'Avaliação da longevidade de células B de memória e persistência de títulos.'
    ],
    guides: [
      { name: 'WHO TRS 924 – Standardisation of Vaccines', url: 'https://www.who.int' },
      { name: 'EMA Guideline on Clinical Evaluation of Vaccines', url: 'https://www.ema.europa.eu' },
      { name: 'Guia Anvisa – Ensaios Imunológicos em Candidatos Vacinais', url: 'https://www.gov.br/anvisa' }
    ],
    decisions: [
      'Definição de correlatos putativos de proteção biológica',
      'Inclusão de controle ativo ou vacina de referência comparadora',
      'Critérios de resposta de soroconversão (> 4 vezes o título basal)'
    ],
    applicableGuidesList: [
      'WHO Technical Report Series 924: Standardization of immunological endpoints.',
      'ICH E6(R2): Good Clinical Practice em dosagens de biomarcadores.'
    ],
    keyQuestions: [
      'Os soros de animais vacinados neutralizam cepas clínicas heterólogas do patógeno?',
      'A resposta de células T produz citocinas com perfil Th1 seguro?'
    ]
  },
  'Estudos de segurança': {
    summary: 'Investigação sistemática de potencial imunopatologia, reações adversas sistêmicas, reactogenicidade no sítio e ausência de fenômeno ADE (Antibody-Dependent Enhancement).',
    keyPoints: [
      'Monitoramento laboratorial completo (hemograma, função hepática e renal).',
      'Triagem de reatividade cruzada tecidual em painel de órgãos e tecidos.',
      'Ausência de imunopatologia pulmonar ou hepática pós-desafio.'
    ],
    guides: [
      { name: 'ICH S7A – Safety Pharmacology', url: 'https://www.ich.org' },
      { name: 'EMA Guideline on Adjuvants in Vaccines', url: 'https://www.ema.europa.eu' },
      { name: 'Anvisa – Manual de Farmacovigilância e Segurança Não Clínica', url: 'https://www.gov.br/anvisa' }
    ],
    decisions: [
      'Critérios de parada e limites de tolerabilidade de segurança',
      'Plano preliminar de Gerenciamento de Risco (PGR) para submissão à Anvisa'
    ],
    applicableGuidesList: [
      'ICH S7B: Avaliação farmacológica de segurança cardiovascular e respiratória.',
      'RDC Anvisa nº 9/2015: Ensaios clínicos com medicamentos e produtos biológicos.'
    ],
    keyQuestions: [
      'Foi identificada alguma alteração hematológica ou inflamatória grave?',
      'O risco de doença agravada pela vacinação foi categoricamente descartado?'
    ]
  },
  'Desenvolvimento da formulação': {
    summary: 'Otimização físico-química da formulação vacinal, selecionando adjuvantes imunológicos, tampões crioprotetores, surfactantes e recipientes de envase primário estéril.',
    keyPoints: [
      'Cinética de adsorção antígeno-adjuvante (> 80% adsorvido).',
      'Osmolalidade e pH compatíveis com conforto à injeção humana (pH 6.8 - 7.4).',
      'Avaliação de compatibilidade com frascos-ampola tipo I e rolhas de clorobutila.'
    ],
    guides: [
      { name: 'ICH Q8(R2) – Pharmaceutical Development', url: 'https://www.ich.org' },
      { name: 'EMA Guideline on Development of Biological Formulations', url: 'https://www.ema.europa.eu' },
      { name: 'Farmacopeia Brasileira – Formas Parenterais e Imunobiológicos', url: 'https://www.gov.br/anvisa' }
    ],
    decisions: [
      'Escolha do tipo de adjuvante (ex: Alum, emulsão óleo em água, saponina QS-21)',
      'Formato da apresentação clínica: líquida pronta para uso vs liofilizada'
    ],
    applicableGuidesList: [
      'ICH Q8(R2): Quality by Design (QbD) e identificação de parâmetros críticos de processo (CPP).'
    ],
    keyQuestions: [
      'A formulação mantém-se límpida e isenta de partículas visíveis?',
      'A compatibilidade com seringas e agulhas foi demonstrada com perda mínima?'
    ]
  },
  'Estudo de estabilidade': {
    summary: 'Condução de estudos de estabilidade acelerada (25°C e 40°C) e de longa duração (2-8°C e -80°C) para estabelecer prazo de validade e condições de transporte da cadeia de frio.',
    keyPoints: [
      'Monitoramento periódico de teor de antígeno, pureza e potência in vitro.',
      'Estudo de estabilidade em uso após aspiração da primeira dose.',
      'Avaliação de estresse mecânico de agitação durante simulação de transporte.'
    ],
    guides: [
      { name: 'ICH Q5C – Stability of Biologicals', url: 'https://www.ich.org' },
      { name: 'RDC Anvisa nº 318/2019 – Estudos de Estabilidade', url: 'https://www.gov.br/anvisa' },
      { name: 'WHO Guidelines on Stability Evaluation of Vaccines', url: 'https://www.who.int' }
    ],
    decisions: [
      'Condição de armazenamento primário recomendada em bula (2 a 8°C)',
      'Validade provisória para o lote clínico piloto (ex: 12 meses)'
    ],
    applicableGuidesList: [
      'ICH Q5C: Critérios para estudos de estabilidade com ensaios indicativos de estabilidade.'
    ],
    keyQuestions: [
      'O produto atende a todas as especificações após 3 e 6 meses a 2-8°C?',
      'Os ensaios de estresse térmico identificaram as rotas primárias de degradação?'
    ]
  }
};

// Generic fallback regulatory data for any other group
const DEFAULT_REGULATORY_DATA: GroupRegulatoryData = {
  summary: 'Acompanhamento rigoroso das exigências regulatórias, documentação comprobatória e padrões de conformidade técnica para garantir a viabilidade clínica e submissão à Anvisa.',
  keyPoints: [
    'Documentação técnica rastreável de todas as etapas operacionais.',
    'Alinhamento com diretrizes aplicáveis da Anvisa e OMS.',
    'Garantia de integridade de dados (Data Integrity ALCOA+).'
  ],
  guides: [
    { name: 'RDC Anvisa nº 55/2010 – Registro de Produtos Biológicos', url: 'https://www.gov.br/anvisa' },
    { name: 'ICH Q10 – Pharmaceutical Quality System', url: 'https://www.ich.org' },
    { name: 'WHO Guidelines on Quality, Safety and Efficacy of Vaccines', url: 'https://www.who.int' }
  ],
  decisions: [
    'Aprovação formal do protocolo técnico',
    'Auditoria de conformidade documental pré-submissão'
  ]
};

// Default canonical vaccine development groups matching Image reference
interface CanonicalGroupDef {
  number: number;
  name: string;
  defaultBullets: string[];
  description: string;
  defaultProgress: number;
  illustrationType: 'vials' | 'chromatography' | 'animal' | 'syringe' | 'antibodies' | 'shield' | 'formulation' | 'stability';
}

const CANONICAL_GROUPS: CanonicalGroupDef[] = [
  {
    number: 1,
    name: 'Produção de material',
    defaultBullets: ['Lote de pesquisa', 'Controle de qualidade', 'Liberação'],
    description: 'Produção do antígeno e formulações para os estudos clínicos. Inclui lotes de pesquisa, controles de qualidade e liberação.',
    defaultProgress: 60,
    illustrationType: 'vials'
  },
  {
    number: 2,
    name: 'Caracterização do candidato',
    defaultBullets: ['Identidade', 'Pureza', 'Potência'],
    description: 'Ensaios analíticos detalhados de estrutura, integridade físico-química e atividade biológica do antígeno recombinante.',
    defaultProgress: 30,
    illustrationType: 'chromatography'
  },
  {
    number: 3,
    name: 'Estudos não clínicos',
    defaultBullets: ['Toxicidade', 'Biodistribuição', 'Imunogenicidade'],
    description: 'Avaliação de farmacologia, farmacocinética e perfil de toxicidade em modelos biológicos laboratoriais.',
    defaultProgress: 10,
    illustrationType: 'animal'
  },
  {
    number: 4,
    name: 'Escolha da dose, via e esquema',
    defaultBullets: ['Dose e esquema', 'Justificativa científica', 'Modelo animal / In vivo'],
    description: 'Estudos de escalonamento para definir a concentração ideal, via de inoculação e cronograma de imunizações.',
    defaultProgress: 0,
    illustrationType: 'syringe'
  },
  {
    number: 5,
    name: 'Estudos de imunogenicidade',
    defaultBullets: ['Resposta imune', 'Marcadores', 'Comparadores'],
    description: 'Quantificação da resposta imune adaptativa humoral e celular específica contra o antígeno vacinal.',
    defaultProgress: 0,
    illustrationType: 'antibodies'
  },
  {
    number: 6,
    name: 'Estudos de segurança',
    defaultBullets: ['Eventos adversos', 'Exames laboratoriais', 'Monitoramento'],
    description: 'Ensaios de segurança toxicológica e farmacológica para atestar ausência de efeitos deletérios.',
    defaultProgress: 0,
    illustrationType: 'shield'
  },
  {
    number: 7,
    name: 'Desenvolvimento da formulação',
    defaultBullets: ['Adjuvante', 'Estabilidade', 'Compatibilidade'],
    description: 'Formulação farmacêutica do candidato vacinal incluindo adjuvantes e estabilizantes estéreis.',
    defaultProgress: 0,
    illustrationType: 'formulation'
  },
  {
    number: 8,
    name: 'Estudo de estabilidade',
    defaultBullets: ['Condições', 'Prazo de validade', 'Plano de estudos'],
    description: 'Monitoramento da estabilidade acelerada e de longa duração nas condições de armazenamento estipuladas.',
    defaultProgress: 0,
    illustrationType: 'stability'
  },
  {
    number: 9,
    name: 'Produção BPM',
    defaultBullets: ['Boas Práticas', 'Validação de processo', 'Auditoria'],
    description: 'Adequação dos processos fabris às normas de Boas Práticas de Manufatura para ensaios humanos.',
    defaultProgress: 0,
    illustrationType: 'vials'
  },
  {
    number: 10,
    name: 'Estudo de segurança CIEnP',
    defaultBullets: ['Ensaio toxicológico', 'Conformidade BPL', 'Relatório final'],
    description: 'Condução de ensaios de segurança e toxicidade pré-clínica em centro credenciado independente.',
    defaultProgress: 0,
    illustrationType: 'shield'
  },
  {
    number: 11,
    name: 'Banco mestre de células',
    defaultBullets: ['Criopreservação', 'Pureza genética', 'Certificação'],
    description: 'Estabelecimento e certificação do banco mestre e de trabalho celular (MCB/WCB).',
    defaultProgress: 0,
    illustrationType: 'vials'
  },
  {
    number: 12,
    name: 'Estudo de interação antígeno-adjuvante',
    defaultBullets: ['Taxa de adsorção', 'Isotermas', 'Estabilidade coloidal'],
    description: 'Caracterização das forças de ligação e cinética de liberação entre o antígeno e o sistema adjuvante.',
    defaultProgress: 0,
    illustrationType: 'formulation'
  },
  {
    number: 13,
    name: 'Parcerias para produção BPF',
    defaultBullets: ['Transferência de tecnologia', 'CDMO', 'Contratos'],
    description: 'Negociação e celebração de parcerias com plantas industriais certificadas para envase estéril BPF.',
    defaultProgress: 0,
    illustrationType: 'vials'
  },
  {
    number: 14,
    name: 'Documentação regulatória',
    defaultBullets: ['DDCM', 'Dossiê do IFA', 'Submissão Anvisa'],
    description: 'Elaboração e compilação de dossiês do produto e do ensaio clínico para protocolo de aprovação na Anvisa.',
    defaultProgress: 5,
    illustrationType: 'shield'
  }
];

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  onUpdateProject,
  teamMembers = [],
  regulatoryStandards = [],
  onOpenRegulatoryModal,
  onPrint,
  onSwitchTab,
  meetings = [],
  tasks = []
}) => {
  // Top view tab state (Renumbered: 1. Visão Geral, 2. Próximas Ações, 3. Histórico, 4. Contribuições, 5. Docs)
  const [activeTopTab, setActiveTopTab] = useState<'visao_geral' | 'proximas_acoes' | 'historico' | 'contribuicoes' | 'docs' | 'estrutura' | 'orientacao'>('visao_geral');

  // Phases deduplicated list respecting exact plan phases and ordering
  const phasesList = useMemo(() => {
    if (project.phases && project.phases.length > 0) {
      const cleanPhases = project.phases.map(normalizePhaseName).filter(Boolean);
      return Array.from(new Set(cleanPhases));
    }

    const derived = new Set<string>();
    (project.macroActivities || []).forEach(m => {
      if (m.phase) {
        const norm = normalizePhaseName(m.phase);
        if (norm) derived.add(norm);
      }
    });

    if (derived.size > 0) {
      return Array.from(derived);
    }

    return [...VACCINE_PLATFORM_PHASES];
  }, [project.phases, project.macroActivities]);

  // Selected phase (defaults to the first real phase of the project)
  const [selectedPhase, setSelectedPhase] = useState<string>(() => {
    if (project.phases && project.phases.length > 0) {
      return normalizePhaseName(project.phases[0]);
    }
    return phasesList[0] || 'Descoberta / Prova de Conceito';
  });

  // Keep selected phase synchronized with phasesList
  useEffect(() => {
    if (phasesList.length > 0 && !phasesList.includes(selectedPhase)) {
      setSelectedPhase(phasesList[0]);
    }
  }, [phasesList, selectedPhase]);

  // Selected group number or ID
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number>(0);

  // Group sub-tabs
  const [groupSubTab, setGroupSubTab] = useState<'atividades' | 'orientacoes' | 'documentos' | 'decisoes' | 'discussoes'>('atividades');

  // Regulatory panel sub-tab (Resumo | Guias aplicáveis | Perguntas-chave)
  const [regulatoryTab, setRegulatoryTab] = useState<'resumo' | 'guias' | 'perguntas'>('resumo');

  // Selected microactivity for detail drawer / modal
  const [selectedMicro, setSelectedMicro] = useState<MicroActivity | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [editingMicroData, setEditingMicroData] = useState<Partial<MicroActivity>>({});

  // Decision management states (enriched with regulatory impact & table destination)
  const [editingDecision, setEditingDecision] = useState<PlanDecisionItem | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isNewDecisionModalOpen, setIsNewDecisionModalOpen] = useState(false);
  const [newDecisionQuestion, setNewDecisionQuestion] = useState('');
  
  const [decisionFormStatus, setDecisionFormStatus] = useState<'Pendente' | 'Em avaliação' | 'Decidido' | 'Validado'>('Pendente');
  const [decisionFormQuestion, setDecisionFormQuestion] = useState('');
  const [decisionFormAnswer, setDecisionFormAnswer] = useState('');
  const [decisionFormJustification, setDecisionFormJustification] = useState('');
  const [decisionFormResponsible, setDecisionFormResponsible] = useState('');
  const [decisionFormDate, setDecisionFormDate] = useState('');
  const [decisionFormLink, setDecisionFormLink] = useState('');
  const [decisionFormRegulatoryImpact, setDecisionFormRegulatoryImpact] = useState(true);
  const [decisionFormMandatory, setDecisionFormMandatory] = useState(true);
  const [decisionFormTargetFieldKey, setDecisionFormTargetFieldKey] = useState('');
  const [decisionFormTargetFieldLabel, setDecisionFormTargetFieldLabel] = useState('');
  const [decisionFormResponseType, setDecisionFormResponseType] = useState<'texto' | 'link' | 'ambos'>('ambos');
  const [decisionFormLinkedStandards, setDecisionFormLinkedStandards] = useState<string[]>([]);

  // History timeline states
  const [historyFilter, setHistoryFilter] = useState<'todos' | 'reuniao' | 'atividade' | 'decisao' | 'regulatorio' | 'contribuicao'>('todos');
  const [selectedMeetingForModal, setSelectedMeetingForModal] = useState<Meeting | null>(null);
  const [isAddHistoryModalOpen, setIsAddHistoryModalOpen] = useState(false);
  const [newHistoryTitle, setNewHistoryTitle] = useState('');
  const [newHistoryDesc, setNewHistoryDesc] = useState('');
  const [newHistoryType, setNewHistoryType] = useState<ProjectHistoryEvent['eventType']>('marco');

  // Contributions triage states
  const [contributionFilter, setContributionFilter] = useState<'todas' | 'pendentes' | 'validadas' | 'descartadas'>('todas');
  const [isAddContributionModalOpen, setIsAddContributionModalOpen] = useState(false);
  const [newContribTitle, setNewContribTitle] = useState('');
  const [newContribContent, setNewContribContent] = useState('');
  const [newContribSource, setNewContribSource] = useState<'reunião' | 'atividade' | 'discussão técnica' | 'observação'>('reunião');
  const [newContribLink, setNewContribLink] = useState('');
  const [selectedContribForTriage, setSelectedContribForTriage] = useState<ProjectContributionItem | null>(null);
  const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);
  const [triagePhase, setTriagePhase] = useState('');
  const [triageMacroId, setTriageMacroId] = useState('');
  const [triageDecisionId, setTriageDecisionId] = useState('');
  const [triageFieldKeys, setTriageFieldKeys] = useState<string[]>([]);
  const [triageJustification, setTriageJustification] = useState('');
  const [triageAction, setTriageAction] = useState<'validar' | 'revisao' | 'descartar'>('validar');

  // Guide and point additions
  const [isAddGuideModalOpen, setIsAddGuideModalOpen] = useState(false);
  const [newGuideTitle, setNewGuideTitle] = useState('');
  const [newGuideLink, setNewGuideLink] = useState('');
  const [newGuideStandardId, setNewGuideStandardId] = useState('');
  const [guideModalMode, setGuideModalMode] = useState<'catalog' | 'manual'>('catalog');
  const [guideSearchQuery, setGuideSearchQuery] = useState('');
  const [isAddPointModalOpen, setIsAddPointModalOpen] = useState(false);
  const [newPointText, setNewPointText] = useState('');
  const [isAddJustificationModalOpen, setIsAddJustificationModalOpen] = useState(false);
  const [newJustificationText, setNewJustificationText] = useState('');

  // Macro icon customization on project level (manager can change per project without altering base plan)
  const [selectedMacroForIconEdit, setSelectedMacroForIconEdit] = useState<MacroActivity | null>(null);
  const [isMacroIconModalOpen, setIsMacroIconModalOpen] = useState(false);
  const [projectIconCategoryFilter, setProjectIconCategoryFilter] = useState('Todos');

  // Presentation link and discussion comment states
  const [presentationLinkInput, setPresentationLinkInput] = useState('');
  const [newDiscussionComment, setNewDiscussionComment] = useState('');

  // Compact decision modal collapsible section
  const [showAdditionalSettings, setShowAdditionalSettings] = useState(false);

  // Direct 1-click inline editing for microactivities (Item 3)
  const [inlineEditing, setInlineEditing] = useState<{ id: string; field: 'name' | 'observations' | 'dueDate' | 'assignee' | 'status' } | null>(null);

  // Rapid registration in Atividades and Todos os Grupos (Item 1)
  const [quickRegisterText, setQuickRegisterText] = useState('');
  const [quickRegisterType, setQuickRegisterType] = useState<'nota' | 'tarefa' | 'observacao'>('nota');
  const [quickRegisterMacroId, setQuickRegisterMacroId] = useState<string>('');
  const quickRegisterInputRef = useRef<HTMLTextAreaElement>(null);

  // Regulatory Terms & Matrix Sub-view State (Item 4 & Item 6)
  const [matrixViewTab, setMatrixViewTab] = useState<'matriz' | 'base' | 'termos'>('matriz');
  const [filterTermSearch, setFilterTermSearch] = useState('');
  const [filterTermGroup, setFilterTermGroup] = useState('Todos');
  const [isNewTermModalOpen, setIsNewTermModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<RegulatoryTermDefinition | null>(null);
  const [termFormKey, setTermFormKey] = useState('');
  const [termFormLabel, setTermFormLabel] = useState('');
  const [termFormDesc, setTermFormDesc] = useState('');
  const [termFormGroup, setTermFormGroup] = useState('Dados Gerais do Candidato Vacinal');
  const [termFormValueType, setTermFormValueType] = useState<'texto' | 'link' | 'ambos'>('ambos');
  const [termFormIsMandatory, setTermFormIsMandatory] = useState(true);
  const [termFormPhase, setTermFormPhase] = useState('Descoberta / Prova de Conceito');
  const [termFormError, setTermFormError] = useState('');

  // Active Terms list (Item 4: central catalog of regulatory terms)
  const activeTermsList = useMemo<RegulatoryTermDefinition[]>(() => {
    if (project.regulatoryTerms && project.regulatoryTerms.length > 0) {
      return project.regulatoryTerms;
    }
    return INITIAL_REGULATORY_TERMS;
  }, [project.regulatoryTerms]);

  // Unified Central de Validação Regulatória States (Item 3 & Item 5)
  const [validationQueueFilter, setValidationQueueFilter] = useState<'todos' | 'pendentes' | 'ajustes' | 'validados' | 'descartados'>('pendentes');
  const [unifiedValidationModalOpen, setUnifiedValidationModalOpen] = useState(false);
  const [selectedUnifiedItem, setSelectedUnifiedItem] = useState<{
    id: string;
    originType: 'atividade' | 'decisao' | 'contribuicao';
    title: string;
    phase: string;
    macroName: string;
    macroId?: string;
    microId?: string;
    decisionId?: string;
    content: string;
    evidenceLink?: string;
    author: string;
    date: string;
    currentStatus: 'pendente' | 'validada' | 'ajustes' | 'descartada';
    linkedTermKey?: string;
    justification?: string;
    operationalStatus?: string;
  } | null>(null);

  const [reviewAction, setReviewAction] = useState<'aprovar' | 'ajustes' | 'descartar'>('aprovar');
  const [reviewTermKey, setReviewTermKey] = useState('');
  const [reviewTextValue, setReviewTextValue] = useState('');
  const [reviewLinkValue, setReviewLinkValue] = useState('');
  const [reviewJustification, setReviewJustification] = useState('');
  const [isInlineCreateTermOpen, setIsInlineCreateTermOpen] = useState(false);
  const [inlineNewTermKey, setInlineNewTermKey] = useState('');
  const [inlineNewTermLabel, setInlineNewTermLabel] = useState('');
  const [inlineNewTermType, setInlineNewTermType] = useState<'texto' | 'link' | 'ambos'>('ambos');

  // Unified Regulatory Validation Queue: dynamically pulls from microactivities, decisions, and contributions (Item 3)
  const unifiedValidationQueue = useMemo(() => {
    const list: Array<{
      id: string;
      originType: 'atividade' | 'decisao' | 'contribuicao';
      title: string;
      phase: string;
      macroName: string;
      macroId?: string;
      microId?: string;
      decisionId?: string;
      content: string;
      evidenceLink?: string;
      author: string;
      date: string;
      currentStatus: 'pendente' | 'validada' | 'ajustes' | 'descartada';
      linkedTermKey?: string;
      justification?: string;
      operationalStatus?: string;
    }> = [];

    // 1. Microactivities with generatesRegulatoryContent !== false
    (project.macroActivities || []).forEach(macro => {
      (macro.microActivities || []).forEach(micro => {
        if (micro.generatesRegulatoryContent !== false) {
          const content = (micro.observations || micro.documentLink || micro.evidenceDescription || '').trim();
          const evidence = micro.documentLink || micro.reportLink || micro.evidenceUrl;
          const regStatus = micro.regulatoryStatus || 'pendente';
          list.push({
            id: `val_mic_${micro.id}`,
            originType: 'atividade',
            title: `Microatividade: ${micro.name}`,
            phase: macro.phase || 'Desenvolvimento Não Clínico',
            macroName: macro.name,
            macroId: macro.id,
            microId: micro.id,
            content: content || 'Atividade com insumo regulatório.',
            evidenceLink: evidence,
            author: micro.assignee || 'Equipe',
            date: micro.dueDate || 'Sem prazo',
            currentStatus: regStatus,
            linkedTermKey: micro.regulatoryLinkedFieldKey,
            justification: micro.regulatoryJustification,
            operationalStatus: micro.status
          });
        }
      });

      // 2. Strategic decisions with regulatory impact
      (macro.decisionsList || []).forEach(dec => {
        if (dec.hasRegulatoryImpact || dec.isMandatory) {
          let regStatus: 'pendente' | 'validada' | 'ajustes' | 'descartada' = 'pendente';
          if (dec.status === 'Validado') regStatus = 'validada';
          else if (dec.status === 'Em avaliação') regStatus = 'ajustes';
          list.push({
            id: `val_dec_${dec.id}`,
            originType: 'decisao',
            title: `Decisão: ${dec.question}`,
            phase: macro.phase || 'Desenvolvimento Não Clínico',
            macroName: macro.name,
            macroId: macro.id,
            decisionId: dec.id,
            content: dec.decision || dec.justification || 'Decisão técnica-regulatória obrigatória.',
            evidenceLink: dec.evidenceLink,
            author: dec.responsible || 'Comitê Técnico',
            date: dec.date || 'Sem data',
            currentStatus: regStatus,
            linkedTermKey: dec.targetFieldKey,
            justification: dec.justification,
            operationalStatus: dec.status
          });
        }
      });
    });

    // 3. Project contributions (meetings, manual, notes)
    (project.contributions || []).forEach(c => {
      if (!c.originDetails || !c.originDetails.startsWith('mic_')) {
        let mappedStatus: 'pendente' | 'validada' | 'ajustes' | 'descartada' = 'pendente';
        if (c.status === 'validada') mappedStatus = 'validada';
        else if (c.status === 'ajustes' || c.status === 'em_ajuste') mappedStatus = 'ajustes';
        else if (c.status === 'descartada') mappedStatus = 'descartada';

        list.push({
          id: `val_contrib_${c.id}`,
          originType: 'contribuicao',
          title: c.title,
          phase: c.targetPhase || selectedPhase,
          macroName: c.linkedMacroName || 'Geral do Projeto',
          content: c.content,
          evidenceLink: c.evidenceLink || c.link,
          author: c.author || 'Equipe',
          date: c.createdAt ? c.createdAt.split('T')[0] : 'Recente',
          currentStatus: mappedStatus,
          linkedTermKey: c.targetFieldKey || (c.targetRegulatoryFields?.[0]),
          justification: c.justification,
          operationalStatus: 'Registrada'
        });
      }
    });

    return list;
  }, [project.macroActivities, project.contributions, selectedPhase]);

  // Pending items badge counter for Tab 4
  const totalPendingValidation = useMemo(() => {
    return unifiedValidationQueue.filter(i => i.currentStatus === 'pendente' || i.currentStatus === 'ajustes').length;
  }, [unifiedValidationQueue]);

  // Legacy counter maintained for compatibility
  const pendingContributionsCount = totalPendingValidation;

  // Standards catalog with fallback
  const allAvailableStandards = useMemo(() => {
    if (regulatoryStandards && regulatoryStandards.length > 0) {
      return regulatoryStandards;
    }
    return DEFAULT_REGULATORY_STANDARDS;
  }, [regulatoryStandards]);

  const filteredProjectStandards = useMemo(() => {
    const q = guideSearchQuery.toLowerCase().trim();
    if (!q) return allAvailableStandards;
    return allAvailableStandards.filter(s => 
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.theme && s.theme.toLowerCase().includes(q)) ||
      (s.type && s.type.toLowerCase().includes(q)) ||
      (s.summary && s.summary.toLowerCase().includes(q)) ||
      (s.keywords && s.keywords.some(k => k.toLowerCase().includes(q)))
    );
  }, [allAvailableStandards, guideSearchQuery]);

  // Horizontal journey carousel scroll ref
  const journeyScrollRef = useRef<HTMLDivElement>(null);
  const regulatoryPanelRef = useRef<HTMLDivElement>(null);

  // Dual Progress calculation (Progresso Operacional baseado em microatividades concluídas vs Progresso Regulatório - Item 1)
  const stats = useMemo(() => {
    const allMacros = project.macroActivities || [];
    let totalMicros = 0;
    let completedMicros = 0;

    let totalMandatoryDecisions = 0;
    let validatedMandatoryDecisions = 0;

    allMacros.forEach(macro => {
      (macro.microActivities || []).forEach(mic => {
        totalMicros++;
        const isDone = mic.status === 'Concluído e aprovado' || mic.status === 'Concluído com restrições';
        if (isDone) completedMicros++;
      });

      (macro.decisionsList || []).forEach(dec => {
        if (dec.hasRegulatoryImpact || dec.isMandatory) {
          totalMandatoryDecisions++;
          if (dec.status === 'Validado' || dec.status === 'Decidido') {
            validatedMandatoryDecisions++;
          }
        }
      });
    });

    const regDb = project.regulatoryDatabase || [];
    let regDbMandatory = 0;
    let regDbValidated = 0;
    regDb.forEach(item => {
      if (item.isMandatory !== false && item.status !== 'não aplicável') {
        regDbMandatory++;
        if (item.status === 'validado') {
          regDbValidated++;
        }
      }
    });

    // Item 1: O progresso operacional do projeto deve ser calculado com base nas microatividades concluídas
    const operationalProgress = totalMicros > 0 ? Math.round((completedMicros / totalMicros) * 100) : 0;
    
    // O progresso regulatório deve ser calculado separadamente, considerando decisões e requisitos regulatórios validados
    const totalRegChecks = totalMandatoryDecisions + regDbMandatory;
    const validatedRegChecks = validatedMandatoryDecisions + regDbValidated;
    let regulatoryProgress = 0;
    if (totalRegChecks > 0) {
      regulatoryProgress = Math.round((validatedRegChecks / totalRegChecks) * 100);
    } else if (totalMandatoryDecisions > 0) {
      regulatoryProgress = Math.round((validatedMandatoryDecisions / totalMandatoryDecisions) * 100);
    }

    return {
      operationalProgress: Math.min(100, Math.max(0, operationalProgress)),
      projectProgress: Math.min(100, Math.max(0, operationalProgress)),
      regulatoryProgress: Math.min(100, Math.max(0, regulatoryProgress)),
      totalMicros,
      completedMicros,
      totalMandatoryDecisions: totalRegChecks,
      validatedMandatoryDecisions: validatedRegChecks,
      daysRemaining: 198,
      forecastDate: '12/12/2025',
      nextMilestoneName: 'Imunogenicidade',
      daysToMilestone: 595
    };
  }, [project.macroActivities, project.regulatoryDatabase]);

  // Phase progress mapping (Calculates actual microactivity progress per phase)
  const phaseProgressMap = useMemo(() => {
    const map: Record<string, number> = {};
    phasesList.forEach(phase => {
      const normP = normalizePhaseName(phase).toLowerCase();
      const macros = (project.macroActivities || []).filter(
        m => normalizePhaseName(m.phase || '').toLowerCase() === normP
      );
      let total = 0;
      let sumProg = 0;
      macros.forEach(m => {
        (m.microActivities || []).forEach(mi => {
          total++;
          const isDone = mi.status === 'Concluído e aprovado' || mi.status === 'Concluído com restrições';
          sumProg += (mi.progress ?? (isDone ? 100 : 0));
        });
      });

      if (total > 0) {
        map[phase] = Math.round(sumProg / total);
      } else {
        map[phase] = 0;
      }
    });
    return map;
  }, [phasesList, project.macroActivities]);

  // Merge canonical group definitions with existing macroactivities in current phase
  const currentPhaseGroups = useMemo(() => {
    const normTarget = normalizePhaseName(selectedPhase).toLowerCase();
    const existingMacrosInPhase = (project.macroActivities || []).filter(
      m => normalizePhaseName(m.phase || '').toLowerCase() === normTarget ||
           (m.phase || '').trim().toLowerCase() === selectedPhase.trim().toLowerCase()
    );

    // If project has explicit macroactivities in this phase
    if (existingMacrosInPhase.length > 0) {
      return existingMacrosInPhase.map((macro, idx) => {
        const matchedCanonical = CANONICAL_GROUPS.find(c => 
          c.name.toLowerCase().includes(macro.name.toLowerCase()) || 
          macro.name.toLowerCase().includes(c.name.toLowerCase())
        );

        // Standard illustration types without animal in default rotation
        const illustrationList: ('vials' | 'chromatography' | 'syringe' | 'antibodies' | 'shield' | 'formulation' | 'stability')[] = [
          'vials', 'chromatography', 'syringe', 'antibodies', 'shield', 'formulation', 'stability'
        ];
        
        // Animal icon/illustration is ONLY used for in-vivo or explicitly animal-related activities
        const isInVivo = macro.name.toLowerCase().includes('in vivo') || 
                         macro.name.toLowerCase().includes('animal') || 
                         macro.name.toLowerCase().includes('roedores') ||
                         macro.name.toLowerCase().includes('primatas') ||
                         macro.icon === 'Rat';
        const illustrationType = isInVivo 
          ? 'animal' 
          : (matchedCanonical?.illustrationType || illustrationList[idx % illustrationList.length]);

        const microActivities = macro.microActivities || [];
        const completedCount = microActivities.filter(m => m.status === 'Concluído e aprovado' || m.status === 'Concluído com restrições').length;
        let calculatedProgress = 0;
        if (microActivities.length > 0) {
          const sumProg = microActivities.reduce((acc, m) => {
            const isDone = m.status === 'Concluído e aprovado' || m.status === 'Concluído com restrições';
            return acc + (m.progress ?? (isDone ? 100 : 0));
          }, 0);
          calculatedProgress = Math.round(sumProg / microActivities.length);
        } else if (matchedCanonical) {
          calculatedProgress = matchedCanonical.defaultProgress;
        }

        const bullets = microActivities.length > 0 
          ? microActivities.slice(0, 3).map(m => m.name)
          : (matchedCanonical?.defaultBullets || ['Planejamento', 'Execução técnica', 'Documentação regulatória']);

        // Initialize decisions list
        let decisionsList: PlanDecisionItem[] = macro.decisionsList ? [...macro.decisionsList] : [];
        if (decisionsList.length === 0 && macro.keyDecisions && macro.keyDecisions.length > 0) {
          decisionsList = macro.keyDecisions.map((q, qIdx) => ({
            id: `dec_${macro.id}_${qIdx}`,
            question: q,
            status: 'Pendente' as const
          }));
        }
        if (decisionsList.length === 0 && matchedCanonical) {
          const regData = GROUP_REGULATORY_MAP[matchedCanonical.name];
          if (regData?.keyQuestions && regData.keyQuestions.length > 0) {
            decisionsList = regData.keyQuestions.map((q, qIdx) => ({
              id: `dec_${macro.id}_reg_${qIdx}`,
              question: q,
              status: 'Pendente' as const
            }));
          }
        }

        const regData = matchedCanonical ? GROUP_REGULATORY_MAP[matchedCanonical.name] : undefined;
        const regulatoryPoints = (macro.regulatoryPoints && macro.regulatoryPoints.length > 0) 
          ? macro.regulatoryPoints 
          : (regData?.keyPoints || []);
        const technicalJustifications = macro.technicalJustifications || [];
        const referenceGuides: PlanReferenceGuide[] = (macro.referenceGuides && macro.referenceGuides.length > 0)
          ? macro.referenceGuides
          : (regData?.guides.map(g => ({ title: g.name, link: g.url })) || []);

        return {
          number: idx + 1,
          name: macro.name,
          defaultBullets: bullets,
          description: macro.expectedResults || matchedCanonical?.description || 'Macroatividade estratégica do candidato vacinal.',
          defaultProgress: calculatedProgress,
          illustrationType,
          matchedMacro: macro,
          macroId: macro.id,
          microActivities,
          progress: calculatedProgress,
          completedCount,
          totalCount: microActivities.length,
          keyDecisions: macro.keyDecisions || [],
          decisionsList,
          regulatoryPoints,
          technicalJustifications,
          referenceGuides
        };
      });
    }

    // Fallback to CANONICAL_GROUPS if phase has no registered macros
    return CANONICAL_GROUPS.map((cGroup, idx) => {
      let microActivities: MicroActivity[] = [];
      if (idx === 0) {
        microActivities = [
          {
            id: `mic_1_1_${project.id}`,
            name: 'Produzir lote de pesquisa (Lote 001)',
            status: 'Concluído e aprovado',
            dueDate: '2025-07-15',
            assignee: 'Bruna',
            progress: 100,
            observations: 'Lote piloto com 500 frascos de proteína recombinante purificada.',
            generatesRegulatoryContent: true
          },
          {
            id: `mic_1_2_${project.id}`,
            name: 'Controle de qualidade físico-químico',
            status: 'Em andamento',
            dueDate: '2025-08-30',
            assignee: 'Helton',
            progress: 60,
            observations: 'Análises de HPLC e SDS-PAGE em andamento com pureza preliminar > 96%.',
            generatesRegulatoryContent: true
          },
          {
            id: `mic_1_3_${project.id}`,
            name: 'Controle de qualidade biológico',
            status: 'Planejado',
            dueDate: '2025-09-15',
            assignee: 'Graziella',
            progress: 0,
            observations: 'Ensaios de endotoxinas e esterilidade microbiológica.',
            generatesRegulatoryContent: true
          },
          {
            id: `mic_1_4_${project.id}`,
            name: 'Liberação do lote para estudos',
            status: 'Planejado',
            dueDate: '2025-09-30',
            assignee: 'Bruna',
            progress: 0,
            observations: 'Emissão e assinatura do Certificado de Análise (CoA).',
            generatesRegulatoryContent: true
          },
          {
            id: `mic_1_5_${project.id}`,
            name: 'Definir escala de produção',
            status: 'Planejado',
            dueDate: '2025-10-10',
            assignee: 'Bruna',
            progress: 20,
            observations: 'Dimensionamento do biorreator para escala clínica.',
            generatesRegulatoryContent: false
          },
          {
            id: `mic_1_6_${project.id}`,
            name: 'Registrar resultados e justificativas',
            status: 'Planejado',
            dueDate: '2025-10-15',
            assignee: 'Bruna',
            progress: 0,
            observations: 'Compilação técnica para o Capítulo 3 do DDCM.',
            generatesRegulatoryContent: true
          }
        ];
      } else if (idx === 1) {
        microActivities = [
          {
            id: `mic_2_1_${project.id}`,
            name: 'Determinação de pureza por SEC-HPLC',
            status: 'Concluído e aprovado',
            dueDate: '2025-08-10',
            assignee: 'Helton',
            progress: 100,
            observations: 'Pureza confirmada em 97.4%.',
            generatesRegulatoryContent: true
          },
          {
            id: `mic_2_2_${project.id}`,
            name: 'Ensaio de potência biológica in vitro',
            status: 'Em andamento',
            dueDate: '2025-09-20',
            assignee: 'Graziella',
            progress: 30,
            observations: 'Ligação a anticorpos monoclonais de referência.',
            generatesRegulatoryContent: true
          }
        ];
      } else if (idx === 2) {
        microActivities = [
          {
            id: `mic_3_1_${project.id}`,
            name: 'Toxicidade de dose repetida em roedores',
            status: 'Em andamento',
            dueDate: '2025-11-15',
            assignee: 'Bruna',
            progress: 20,
            observations: 'Protocolo CEUA aprovado, primeira dosagem concluída.',
            generatesRegulatoryContent: true
          }
        ];
      }

      const regData = GROUP_REGULATORY_MAP[cGroup.name] || DEFAULT_REGULATORY_DATA;
      const initialDecisions: PlanDecisionItem[] = (regData.keyQuestions || regData.decisions).map((q, qIdx) => ({
        id: `dec_canonical_${idx}_${qIdx}`,
        question: q,
        status: qIdx === 0 ? 'Decidido' as const : 'Pendente' as const,
        decision: qIdx === 0 ? 'Protocolo aprovado e em conformidade.' : undefined,
        justification: qIdx === 0 ? 'Definido com base no delineamento do estudo pré-clínico.' : undefined,
        responsible: 'Bruna Dias',
        date: '2025-08-15',
        sharepointDocUrl: 'https://ctvacinas.sharepoint.com/sites/regulatorio/Documentos'
      }));

      return {
        ...cGroup,
        matchedMacro: undefined,
        macroId: `macro_${idx}_${project.id}`,
        microActivities,
        progress: cGroup.defaultProgress,
        completedCount: microActivities.filter(m => m.status === 'Concluído e aprovado' || m.status === 'Concluído com restrições').length,
        totalCount: microActivities.length,
        keyDecisions: regData.keyQuestions || [],
        decisionsList: initialDecisions,
        regulatoryPoints: regData.keyPoints,
        technicalJustifications: ['Racional técnico documentado para conformidade com a Anvisa.'],
        referenceGuides: regData.guides.map(g => ({ title: g.name, link: g.url }))
      };
    });
  }, [selectedPhase, project.macroActivities, project.id]);

  // Active selected group (supports single group or "Todos os Grupos" when selectedGroupIndex === -1)
  const isAllGroups = selectedGroupIndex === -1;
  const activeGroup = useMemo(() => {
    if (isAllGroups) {
      const allMicros = currentPhaseGroups.flatMap(g => 
        g.microActivities.map(m => ({ ...m, groupName: g.name, groupNumber: g.number, macroId: g.macroId }))
      );
      const completedCount = allMicros.filter(m => m.status === 'Concluído e aprovado' || m.status === 'Concluído com restrições').length;
      const progress = allMicros.length > 0 ? Math.round(allMicros.reduce((acc, m) => acc + (m.progress ?? 0), 0) / allMicros.length) : 0;
      return {
        number: 0,
        name: `Todos os Grupos (${selectedPhase})`,
        defaultBullets: ['Visão consolidada', 'Todas as macroatividades', 'Execução integrada'],
        description: `Visão consolidada de todas as macroatividades e tarefas da ${selectedPhase}.`,
        defaultProgress: progress,
        illustrationType: 'vials' as const,
        matchedMacro: currentPhaseGroups[0]?.matchedMacro,
        macroId: 'all_groups',
        microActivities: allMicros,
        progress,
        completedCount,
        totalCount: allMicros.length,
        keyDecisions: currentPhaseGroups.flatMap(g => g.keyDecisions),
        decisionsList: currentPhaseGroups.flatMap(g => g.decisionsList),
        regulatoryPoints: Array.from(new Set(currentPhaseGroups.flatMap(g => g.regulatoryPoints))),
        technicalJustifications: Array.from(new Set(currentPhaseGroups.flatMap(g => g.technicalJustifications))),
        referenceGuides: currentPhaseGroups.flatMap(g => g.referenceGuides)
      };
    }
    return currentPhaseGroups[selectedGroupIndex] || currentPhaseGroups[0];
  }, [isAllGroups, currentPhaseGroups, selectedGroupIndex, selectedPhase]);

  // Regulatory data for active group
  const activeRegulatory = GROUP_REGULATORY_MAP[activeGroup.name] || DEFAULT_REGULATORY_DATA;

  // Helper to ensure macro exists and update its fields
  const updateActiveMacro = (updater: (macro: MacroActivity) => MacroActivity) => {
    let macroFound = false;
    let updatedMacros = (project.macroActivities || []).map(m => {
      if (m.id === activeGroup.macroId || m.name.toLowerCase().trim() === activeGroup.name.toLowerCase().trim()) {
        macroFound = true;
        return updater(m);
      }
      return m;
    });

    if (!macroFound) {
      const newMacro: MacroActivity = updater({
        id: activeGroup.macroId,
        name: activeGroup.name,
        phase: selectedPhase,
        expectedResults: activeGroup.description,
        microActivities: activeGroup.microActivities,
        keyDecisions: activeGroup.keyDecisions,
        decisionsList: activeGroup.decisionsList,
        regulatoryPoints: activeGroup.regulatoryPoints,
        technicalJustifications: activeGroup.technicalJustifications,
        referenceGuides: activeGroup.referenceGuides
      });
      updatedMacros.push(newMacro);
    }

    onUpdateProject({ ...project, macroActivities: updatedMacros });
  };

  const handleOpenEditDecision = (decision: PlanDecisionItem) => {
    setEditingDecision(decision);
    const statusVal = decision.status === 'Aprovado' ? 'Decidido' : (decision.status === 'Avaliado' ? 'Em avaliação' : (decision.status || 'Pendente'));
    setDecisionFormStatus(statusVal);
    setDecisionFormQuestion(decision.question || '');
    setDecisionFormAnswer(decision.decision || '');
    setDecisionFormJustification(decision.justification || '');
    setDecisionFormResponsible(decision.responsible || teamMembers[0]?.name || 'Bruna Dias');
    setDecisionFormDate(decision.date || new Date().toISOString().split('T')[0]);
    setDecisionFormLink(decision.evidenceLink || decision.sharepointDocUrl || '');
    setDecisionFormRegulatoryImpact(decision.hasRegulatoryImpact !== false);
    setDecisionFormMandatory(decision.isMandatory !== false);
    setDecisionFormTargetFieldKey(decision.targetFieldKey || '');
    setDecisionFormTargetFieldLabel(decision.targetFieldLabel || '');
    setDecisionFormResponseType(decision.responseType || 'ambos');
    setDecisionFormLinkedStandards(decision.linkedStandardIds || []);
    setIsDecisionModalOpen(true);
  };

  const handleSaveDecisionForm = () => {
    if (!editingDecision) return;
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];

    const updated: PlanDecisionItem = {
      ...editingDecision,
      question: decisionFormQuestion.trim() || editingDecision.question,
      status: decisionFormStatus,
      decision: decisionFormAnswer.trim() || undefined,
      justification: decisionFormJustification.trim() || undefined,
      responsible: decisionFormResponsible.trim() || undefined,
      date: decisionFormDate || todayStr,
      evidenceLink: decisionFormLink.trim() || undefined,
      sharepointDocUrl: decisionFormLink.trim() || undefined,
      hasRegulatoryImpact: decisionFormRegulatoryImpact,
      isMandatory: decisionFormMandatory,
      targetFieldKey: decisionFormTargetFieldKey.trim() || undefined,
      targetFieldLabel: decisionFormTargetFieldLabel.trim() || undefined,
      responseType: decisionFormResponseType,
      linkedStandardIds: decisionFormLinkedStandards,
      validatedAt: (decisionFormStatus === 'Decidido' || decisionFormStatus === 'Validado') ? nowIso : undefined,
      validatedBy: (decisionFormStatus === 'Decidido' || decisionFormStatus === 'Validado') ? decisionFormResponsible : undefined
    };

    // Update macroactivities
    let updatedMacros = (project.macroActivities || []).map(m => {
      if (m.id === activeGroup.macroId || m.name.toLowerCase().trim() === activeGroup.name.toLowerCase().trim()) {
        const currentList = m.decisionsList && m.decisionsList.length > 0 
          ? [...m.decisionsList] 
          : [...activeGroup.decisionsList];
        const idx = currentList.findIndex(d => d.id === updated.id);
        if (idx >= 0) currentList[idx] = updated;
        else currentList.push(updated);
        return { ...m, decisionsList: currentList };
      }
      return m;
    });

    // If decision feeds regulatory database (targetFieldKey set and resolved)
    let updatedRegulatoryDb = [...(project.regulatoryDatabase || [])];
    if (updated.targetFieldKey && (decisionFormStatus === 'Decidido' || decisionFormStatus === 'Validado' || decisionFormAnswer.trim())) {
      const fieldKey = updated.targetFieldKey;
      const targetLabel = updated.targetFieldLabel || updated.question;
      const existingIdx = updatedRegulatoryDb.findIndex(r => r.fieldKey === fieldKey);

      const isResolved = decisionFormStatus === 'Decidido' || decisionFormStatus === 'Validado';
      const recordStatus = isResolved ? 'validado' : (decisionFormAnswer.trim() ? 'em análise' : 'não preenchido');

      if (existingIdx >= 0) {
        const oldRec = updatedRegulatoryDb[existingIdx];
        const historyItem = {
          id: `rh_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          timestamp: nowIso,
          author: decisionFormResponsible || 'Gestor',
          previousValue: oldRec.valueText || oldRec.valueLink || '',
          newValue: decisionFormAnswer || decisionFormLink,
          justification: decisionFormJustification || 'Atualizado via Decisão Estratégica'
        };

        updatedRegulatoryDb[existingIdx] = {
          ...oldRec,
          valueText: decisionFormAnswer.trim() || oldRec.valueText,
          valueLink: decisionFormLink.trim() || oldRec.valueLink,
          status: recordStatus,
          origin: 'decisão',
          originRefId: updated.id,
          originRefName: activeGroup.name,
          responsible: decisionFormResponsible || oldRec.responsible,
          lastModifiedAt: nowIso,
          history: [historyItem, ...(oldRec.history || [])]
        };
      } else {
        updatedRegulatoryDb.push({
          id: `reg_${fieldKey.toLowerCase()}_${Date.now()}`,
          fieldKey,
          fieldLabel: targetLabel,
          groupName: activeGroup.name,
          phase: selectedPhase,
          macroActivityName: activeGroup.name,
          valueText: decisionFormAnswer.trim() || undefined,
          valueLink: decisionFormLink.trim() || undefined,
          status: recordStatus,
          origin: 'decisão',
          originRefId: updated.id,
          originRefName: activeGroup.name,
          responsible: decisionFormResponsible,
          lastModifiedAt: nowIso,
          isMandatory: updated.isMandatory !== false,
          history: [{
            id: `rh_${Date.now()}`,
            timestamp: nowIso,
            author: decisionFormResponsible || 'Gestor',
            previousValue: '',
            newValue: decisionFormAnswer || decisionFormLink,
            justification: decisionFormJustification || 'Criado a partir de Decisão Estratégica'
          }]
        });
      }
    }

    // Add History Event
    const historyEvent: ProjectHistoryEvent = {
      id: `hist_dec_${Date.now()}`,
      date: todayStr,
      timestamp: nowIso,
      author: decisionFormResponsible || 'Gestor',
      eventType: 'decisao',
      title: `Decisão Estratégica: ${updated.question}`,
      description: decisionFormAnswer ? `Decisão: ${decisionFormAnswer}` : `Status: ${decisionFormStatus}`,
      previousValue: editingDecision.decision,
      newValue: decisionFormAnswer,
      justification: decisionFormJustification,
      refType: 'decisao',
      refId: updated.id
    };

    const updatedTimeline = [historyEvent, ...(project.historyTimeline || [])];

    onUpdateProject({
      ...project,
      macroActivities: updatedMacros,
      regulatoryDatabase: updatedRegulatoryDb,
      historyTimeline: updatedTimeline
    });

    setIsDecisionModalOpen(false);
    setEditingDecision(null);
  };

  const handleDeleteDecision = (decisionId: string) => {
    updateActiveMacro(macro => {
      const currentList = (macro.decisionsList || activeGroup.decisionsList).filter(d => d.id !== decisionId);
      return { ...macro, decisionsList: currentList };
    });
  };

  const handleAddNewDecision = () => {
    if (!newDecisionQuestion.trim()) return;
    const newItem: PlanDecisionItem = {
      id: `dec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      question: newDecisionQuestion.trim(),
      status: 'Pendente',
      hasRegulatoryImpact: true,
      isMandatory: true,
      responseType: 'ambos'
    };
    updateActiveMacro(macro => {
      const currentList = macro.decisionsList && macro.decisionsList.length > 0 
        ? [...macro.decisionsList, newItem] 
        : [...activeGroup.decisionsList, newItem];
      return { ...macro, decisionsList: currentList };
    });
    setIsNewDecisionModalOpen(false);
    setNewDecisionQuestion('');
  };

  const handleSaveNewGuide = () => {
    if (!newGuideTitle.trim()) return;
    const newGuide: PlanReferenceGuide = {
      title: newGuideTitle.trim(),
      link: newGuideLink.trim() || undefined,
      standardId: newGuideStandardId || undefined,
      type: 'norma'
    };
    updateActiveMacro(macro => {
      const currentGuides = macro.referenceGuides && macro.referenceGuides.length > 0
        ? [...macro.referenceGuides, newGuide]
        : [...activeGroup.referenceGuides, newGuide];
      return { ...macro, referenceGuides: currentGuides };
    });
    setIsAddGuideModalOpen(false);
    setNewGuideTitle('');
    setNewGuideLink('');
    setNewGuideStandardId('');
    setGuideSearchQuery('');
  };

  const handleLinkExistingStandardToMacro = (std: RegulatoryStandard) => {
    const newGuide: PlanReferenceGuide = {
      id: std.id,
      title: std.name || `${std.code || ''} ${std.title || ''}`.trim(),
      link: std.documentLink || std.link || std.pdfUrl || undefined,
      standardId: std.id,
      type: 'norma'
    };
    updateActiveMacro(macro => {
      const currentGuides = macro.referenceGuides && macro.referenceGuides.length > 0
        ? [...macro.referenceGuides, newGuide]
        : [...activeGroup.referenceGuides, newGuide];
      return { ...macro, referenceGuides: currentGuides };
    });
    setIsAddGuideModalOpen(false);
    setNewGuideTitle('');
    setNewGuideLink('');
    setNewGuideStandardId('');
    setGuideSearchQuery('');
  };

  const handleUpdateMacroIcon = (newIconKey: string) => {
    if (!selectedMacroForIconEdit) return;
    let found = false;
    const updatedMacros = (project.macroActivities || []).map(m => {
      if (m.id === selectedMacroForIconEdit.id || m.name.toLowerCase().trim() === selectedMacroForIconEdit.name.toLowerCase().trim()) {
        found = true;
        return { ...m, icon: newIconKey };
      }
      return m;
    });
    if (!found) {
      updatedMacros.push({
        ...selectedMacroForIconEdit,
        icon: newIconKey
      });
    }
    onUpdateProject({
      ...project,
      macroActivities: updatedMacros
    });
    setIsMacroIconModalOpen(false);
    setSelectedMacroForIconEdit(null);
  };

  // Direct 1-click inline editing for microactivities (Item 3 & Item 5)
  const handleUpdateMicroField = (microId: string, field: keyof MicroActivity, value: any) => {
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];
    let changedMicroName = '';
    let oldValue: any = '';
    let matchedMicroObj: MicroActivity | null = null;
    let matchedMacroObj: MacroActivity | null = null;

    let updatedMacros = (project.macroActivities || []).map(macro => {
      let hasChanged = false;
      const updatedMicros = (macro.microActivities || []).map(mic => {
        if (mic.id === microId) {
          hasChanged = true;
          changedMicroName = mic.name;
          oldValue = mic[field];
          const updated = { ...mic, [field]: value };
          
          if (field === 'status') {
            if (value === 'Concluído e aprovado') {
              updated.progress = 100;
              updated.completionDate = updated.completionDate || todayStr;
            } else if (value === 'Em andamento' && (updated.progress === 0 || updated.progress === 100)) {
              updated.progress = 50;
            } else if (value === 'Planejado') {
              updated.progress = 0;
            }
          }

          matchedMicroObj = updated;
          matchedMacroObj = macro;
          return updated;
        }
        return mic;
      });
      return hasChanged ? { ...macro, microActivities: updatedMicros } : macro;
    });

    // If micro was in activeGroup fallback
    if (!matchedMicroObj && activeGroup) {
      const foundInActive = activeGroup.microActivities.find(m => m.id === microId);
      if (foundInActive) {
        changedMicroName = foundInActive.name;
        oldValue = foundInActive[field];
        const updated = { ...foundInActive, [field]: value };
        if (field === 'status') {
          if (value === 'Concluído e aprovado') {
            updated.progress = 100;
            updated.completionDate = updated.completionDate || todayStr;
          } else if (value === 'Em andamento') {
            updated.progress = 50;
          } else if (value === 'Planejado') {
            updated.progress = 0;
          }
        }
        matchedMicroObj = updated;

        const currentMicros = activeGroup.microActivities.map(m => m.id === microId ? updated : m);
        let macroFound = false;
        updatedMacros = updatedMacros.map(m => {
          if (m.name.toLowerCase().trim() === activeGroup.name.toLowerCase().trim()) {
            macroFound = true;
            return { ...m, microActivities: currentMicros };
          }
          return m;
        });
        if (!macroFound) {
          updatedMacros.push({
            id: activeGroup.macroId,
            name: activeGroup.name,
            phase: selectedPhase,
            microActivities: currentMicros
          });
        }
      }
    }

    // Item 5: When marked as having regulatory content and has content registered, forward to Contribuições
    let updatedContributions = [...(project.contributions || [])];
    if (matchedMicroObj) {
      const micro = matchedMicroObj as MicroActivity;
      const isReg = micro.generatesRegulatoryContent !== false;
      const content = (micro.observations || micro.documentLink || micro.reportLink || '').trim();

      if (isReg && content) {
        const existingIdx = updatedContributions.findIndex(c => c.originDetails === micro.id || c.id === `contrib_mic_${micro.id}`);
        if (existingIdx === -1) {
          const newContrib: ProjectContributionItem = {
            id: `contrib_mic_${micro.id}`,
            title: `Atividade: ${micro.name}`,
            content: content,
            origin: 'Atividade',
            originDetails: micro.id,
            source: 'atividade',
            evidenceLink: micro.documentLink || micro.reportLink,
            status: 'pendente',
            author: micro.assignee || teamMembers[0]?.name || 'Equipe Técnica',
            createdAt: nowIso,
            targetPhase: (matchedMacroObj as MacroActivity | null)?.phase || selectedPhase,
            targetMacroActivityId: (matchedMacroObj as MacroActivity | null)?.id || activeGroup.macroId
          };
          updatedContributions = [newContrib, ...updatedContributions];
        } else if (updatedContributions[existingIdx].status === 'pendente' || updatedContributions[existingIdx].status === 'em_analise') {
          updatedContributions[existingIdx] = {
            ...updatedContributions[existingIdx],
            title: `Atividade: ${micro.name}`,
            content: content,
            evidenceLink: micro.documentLink || micro.reportLink || updatedContributions[existingIdx].evidenceLink
          };
        }
      }
    }

    const historyEvent: ProjectHistoryEvent = {
      id: `hist_micro_${Date.now()}`,
      date: todayStr,
      timestamp: nowIso,
      author: teamMembers[0]?.name || 'Gestor',
      eventType: 'atividade',
      title: `Atualização: ${changedMicroName || 'Atividade'}`,
      description: `Campo "${String(field)}" alterado para "${value ?? '—'}"`,
      refType: 'atividade',
      refId: microId
    };

    onUpdateProject({
      ...project,
      macroActivities: updatedMacros,
      contributions: updatedContributions,
      historyTimeline: [historyEvent, ...(project.historyTimeline || [])]
    });
  };

  // Rapid registration in Atividades and Todos os Grupos (Item 1)
  const handleQuickRegisterItem = (targetMacroId?: string) => {
    const text = quickRegisterText.trim();
    if (!text) return;

    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];
    const authorName = teamMembers[0]?.name || 'Gestor';
    const effectiveMacroId = targetMacroId || quickRegisterMacroId || (activeGroup.macroId !== 'all_groups' ? activeGroup.macroId : currentPhaseGroups[0]?.macroId);

    let targetMacroName = activeGroup.name;
    const targetMacro = (project.macroActivities || []).find(m => m.id === effectiveMacroId);
    if (targetMacro) targetMacroName = targetMacro.name;

    if (quickRegisterType === 'tarefa') {
      const newMicro: MicroActivity = {
        id: `mic_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: text,
        status: 'Planejado',
        assignee: authorName,
        dueDate: todayStr,
        progress: 0,
        observations: '',
        generatesRegulatoryContent: false
      };

      let macroFound = false;
      const updatedMacros = (project.macroActivities || []).map(m => {
        if (m.id === effectiveMacroId || m.name.toLowerCase().trim() === targetMacroName.toLowerCase().trim()) {
          macroFound = true;
          return { ...m, microActivities: [...(m.microActivities || []), newMicro] };
        }
        return m;
      });

      if (!macroFound) {
        updatedMacros.push({
          id: effectiveMacroId,
          name: targetMacroName,
          phase: selectedPhase,
          microActivities: [...(activeGroup.microActivities || []), newMicro]
        });
      }

      const histEvent: ProjectHistoryEvent = {
        id: `hist_task_${Date.now()}`,
        date: todayStr,
        timestamp: nowIso,
        author: authorName,
        eventType: 'atividade',
        title: `Nova Tarefa Rápida: ${text}`,
        description: `Cadastrada em ${targetMacroName}`,
        refType: 'atividade',
        refId: newMicro.id
      };

      onUpdateProject({
        ...project,
        macroActivities: updatedMacros,
        historyTimeline: [histEvent, ...(project.historyTimeline || [])]
      });
    } else {
      const histEvent: ProjectHistoryEvent = {
        id: `hist_note_${Date.now()}`,
        date: todayStr,
        timestamp: nowIso,
        author: authorName,
        eventType: quickRegisterType === 'observacao' ? 'atividade' : 'outro',
        title: `${quickRegisterType === 'observacao' ? 'Observação Técnica' : 'Nota Rápida'}: ${targetMacroName}`,
        description: text,
        refType: 'outro'
      };

      onUpdateProject({
        ...project,
        historyTimeline: [histEvent, ...(project.historyTimeline || [])]
      });
    }

    setQuickRegisterText('');
    setTimeout(() => {
      quickRegisterInputRef.current?.focus();
    }, 50);
  };

  const handleAddNewDiscussionComment = () => {
    if (!newDiscussionComment.trim()) return;
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];
    const authorName = teamMembers[0]?.name || 'Gestor';
    const text = newDiscussionComment.trim();

    const histEvent: ProjectHistoryEvent = {
      id: `hist_disc_${Date.now()}`,
      date: todayStr,
      timestamp: nowIso,
      author: authorName,
      eventType: 'outro',
      title: `Nota / Discussão: ${activeGroup.name}`,
      description: text,
      refType: 'outro'
    };

    onUpdateProject({
      ...project,
      historyTimeline: [histEvent, ...(project.historyTimeline || [])]
    });

    setNewDiscussionComment('');
  };

  const handleSaveNewPoint = () => {
    if (!newPointText.trim()) return;
    updateActiveMacro(macro => {
      const currentPoints = macro.regulatoryPoints && macro.regulatoryPoints.length > 0
        ? [...macro.regulatoryPoints, newPointText.trim()]
        : [...activeGroup.regulatoryPoints, newPointText.trim()];
      return { ...macro, regulatoryPoints: currentPoints };
    });
    setIsAddPointModalOpen(false);
    setNewPointText('');
  };

  const handleSaveNewJustification = () => {
    if (!newJustificationText.trim()) return;
    updateActiveMacro(macro => {
      const currentJust = macro.technicalJustifications && macro.technicalJustifications.length > 0
        ? [...macro.technicalJustifications, newJustificationText.trim()]
        : [...activeGroup.technicalJustifications, newJustificationText.trim()];
      return { ...macro, technicalJustifications: currentJust };
    });
    setIsAddJustificationModalOpen(false);
    setNewJustificationText('');
  };

  // Add new contribution to the project
  const handleSaveNewContribution = () => {
    if (!newContribTitle.trim()) return;
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];

    const newContrib: ProjectContributionItem = {
      id: `contrib_${Date.now()}`,
      title: newContribTitle.trim(),
      content: newContribContent.trim(),
      source: newContribSource,
      evidenceLink: newContribLink.trim() || undefined,
      status: 'pendente',
      author: teamMembers[0]?.name || 'Usuário',
      createdAt: nowIso
    };

    const historyEvent: ProjectHistoryEvent = {
      id: `hist_contrib_${Date.now()}`,
      date: todayStr,
      timestamp: nowIso,
      author: newContrib.author,
      eventType: 'contribuicao',
      title: `Nova Contribuição: ${newContrib.title}`,
      description: `Origem: ${newContrib.source}`,
      refType: 'contribuicao',
      refId: newContrib.id
    };

    onUpdateProject({
      ...project,
      contributions: [newContrib, ...(project.contributions || [])],
      historyTimeline: [historyEvent, ...(project.historyTimeline || [])]
    });

    setIsAddContributionModalOpen(false);
    setNewContribTitle('');
    setNewContribContent('');
    setNewContribLink('');
  };

  // Triage a contribution: link to macro, decision, fields, validate or discard
  const handleTriageContributionSubmit = () => {
    if (!selectedContribForTriage) return;
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];

    const isVal = triageAction === 'validar';
    const isDesc = triageAction === 'descartar';
    const newStatus = isVal ? 'validada' : (isDesc ? 'descartada' : 'em_analise');

    const updatedContrib: ProjectContributionItem = {
      ...selectedContribForTriage,
      status: newStatus,
      targetPhase: triagePhase || selectedContribForTriage.targetPhase,
      targetMacroActivityId: triageMacroId || selectedContribForTriage.targetMacroActivityId,
      targetDecisionId: triageDecisionId || selectedContribForTriage.targetDecisionId,
      targetRegulatoryFields: triageFieldKeys.length > 0 ? triageFieldKeys : selectedContribForTriage.targetRegulatoryFields,
      justification: triageJustification.trim() || selectedContribForTriage.justification,
      validatedAt: isVal ? nowIso : undefined,
      validatedBy: isVal ? (teamMembers[0]?.name || 'Gestor') : undefined
    };

    let updatedRegDb = [...(project.regulatoryDatabase || [])];

    // If validated to regulatory fields, feed the regulatory database
    if (isVal && triageFieldKeys.length > 0) {
      triageFieldKeys.forEach(fKey => {
        const existingIdx = updatedRegDb.findIndex(r => r.fieldKey === fKey);
        if (existingIdx >= 0) {
          const oldRec = updatedRegDb[existingIdx];
          updatedRegDb[existingIdx] = {
            ...oldRec,
            valueText: selectedContribForTriage.content || oldRec.valueText,
            valueLink: selectedContribForTriage.evidenceLink || oldRec.valueLink,
            status: 'validado',
            origin: 'contribuição',
            originRefId: updatedContrib.id,
            originRefName: updatedContrib.title,
            lastModifiedAt: nowIso,
            history: [{
              id: `rh_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              timestamp: nowIso,
              author: teamMembers[0]?.name || 'Gestor',
              previousValue: oldRec.valueText || '',
              newValue: selectedContribForTriage.content,
              justification: triageJustification || 'Triada e validada via Central de Contribuições'
            }, ...(oldRec.history || [])]
          };
        } else {
          updatedRegDb.push({
            id: `reg_${fKey.toLowerCase()}_${Date.now()}`,
            fieldKey: fKey,
            fieldLabel: fKey,
            groupName: 'Base Regulatória',
            phase: triagePhase || selectedPhase,
            valueText: selectedContribForTriage.content,
            valueLink: selectedContribForTriage.evidenceLink,
            status: 'validado',
            origin: 'contribuição',
            originRefId: updatedContrib.id,
            originRefName: updatedContrib.title,
            responsible: teamMembers[0]?.name || 'Gestor',
            lastModifiedAt: nowIso,
            history: [{
              id: `rh_${Date.now()}`,
              timestamp: nowIso,
              author: teamMembers[0]?.name || 'Gestor',
              previousValue: '',
              newValue: selectedContribForTriage.content,
              justification: triageJustification || 'Triada e validada via Central de Contribuições'
            }]
          });
        }
      });
    }

    const updatedContribList = (project.contributions || []).map(c => 
      c.id === updatedContrib.id ? updatedContrib : c
    );

    const historyEvent: ProjectHistoryEvent = {
      id: `hist_triage_${Date.now()}`,
      date: todayStr,
      timestamp: nowIso,
      author: teamMembers[0]?.name || 'Gestor',
      eventType: 'contribuicao',
      title: `Triagem de Contribuição: ${updatedContrib.title} (${isVal ? 'Validada' : isDesc ? 'Descartada' : 'Em Análise'})`,
      description: triageJustification || `Campos: ${triageFieldKeys.join(', ') || 'Nenhum'}`,
      justification: triageJustification,
      refType: 'contribuicao',
      refId: updatedContrib.id
    };

    onUpdateProject({
      ...project,
      contributions: updatedContribList,
      regulatoryDatabase: updatedRegDb,
      historyTimeline: [historyEvent, ...(project.historyTimeline || [])]
    });

    setIsTriageModalOpen(false);
    setSelectedContribForTriage(null);
  };

  // Add manual milestone/note to history timeline
  const handleSaveManualHistoryEvent = () => {
    if (!newHistoryTitle.trim()) return;
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];

    const event: ProjectHistoryEvent = {
      id: `hist_manual_${Date.now()}`,
      date: todayStr,
      timestamp: nowIso,
      author: teamMembers[0]?.name || 'Gestor',
      eventType: newHistoryType,
      title: newHistoryTitle.trim(),
      description: newHistoryDesc.trim(),
      refType: 'outro'
    };

    onUpdateProject({
      ...project,
      historyTimeline: [event, ...(project.historyTimeline || [])]
    });

    setIsAddHistoryModalOpen(false);
    setNewHistoryTitle('');
    setNewHistoryDesc('');
  };

  // Item 3 & 5: Unified Review Submission (Aprovar, Devolver para Ajustes, Rejeitar)
  const handleSaveUnifiedReview = () => {
    if (!selectedUnifiedItem) return;
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];
    const authorName = teamMembers[0]?.name || 'Gestor';

    let updatedRegDb = [...(project.regulatoryDatabase || [])];
    let updatedMacros = [...(project.macroActivities || [])];
    let updatedContributions = [...(project.contributions || [])];
    const newHistoryEvents: ProjectHistoryEvent[] = [];

    if (reviewAction === 'aprovar') {
      if (!reviewTermKey) {
        alert('Por favor, selecione ou crie um termo regulatório para vincular esta aprovação.');
        return;
      }

      const termDef = activeTermsList.find(t => t.key === reviewTermKey);
      const termLabel = termDef?.label || reviewTermKey;

      // Update or create in regulatoryDatabase
      const existingDbIdx = updatedRegDb.findIndex(r => r.key === reviewTermKey || r.fieldKey === reviewTermKey);
      let previousVal = '';
      if (existingDbIdx >= 0) {
        const oldRec = updatedRegDb[existingDbIdx];
        previousVal = oldRec.valueText || oldRec.value || '';
        const historyList = oldRec.history || [];
        
        updatedRegDb[existingDbIdx] = {
          ...oldRec,
          valueText: reviewTextValue || oldRec.valueText || '',
          valueLink: reviewLinkValue || oldRec.valueLink,
          value: reviewTextValue || oldRec.value,
          status: 'validado',
          origin: selectedUnifiedItem.originType,
          originRefId: selectedUnifiedItem.id,
          originRefName: selectedUnifiedItem.title,
          lastModifiedAt: nowIso,
          updatedBy: authorName,
          version: (oldRec.version || historyList.length || 1) + 1,
          history: [
            {
              id: `rh_${Date.now()}`,
              version: (oldRec.version || historyList.length || 1) + 1,
              timestamp: nowIso,
              author: authorName,
              previousValue: previousVal,
              newValue: reviewTextValue,
              justification: reviewJustification || 'Aprovado na Central de Validação Regulatória'
            },
            ...historyList
          ]
        };
      } else {
        updatedRegDb.push({
          id: `reg_${reviewTermKey.toLowerCase()}_${Date.now()}`,
          key: reviewTermKey,
          fieldKey: reviewTermKey,
          label: termLabel,
          fieldLabel: termLabel,
          groupName: termDef?.groupName || 'Base Regulatória',
          phase: selectedUnifiedItem.phase,
          valueText: reviewTextValue,
          valueLink: reviewLinkValue,
          value: reviewTextValue,
          status: 'validado',
          origin: selectedUnifiedItem.originType,
          originRefId: selectedUnifiedItem.id,
          originRefName: selectedUnifiedItem.title,
          responsible: authorName,
          updatedBy: authorName,
          lastModifiedAt: nowIso,
          version: 1,
          history: [
            {
              id: `rh_${Date.now()}`,
              version: 1,
              timestamp: nowIso,
              author: authorName,
              previousValue: '',
              newValue: reviewTextValue,
              justification: reviewJustification || 'Aprovado e cadastrado na Base Regulatória'
            }
          ]
        });
      }

      // Update source item regulatory status independently (Operational status untouched!)
      if (selectedUnifiedItem.originType === 'atividade' && selectedUnifiedItem.microId) {
        updatedMacros = updatedMacros.map(macro => ({
          ...macro,
          microActivities: (macro.microActivities || []).map(mic => {
            if (mic.id === selectedUnifiedItem.microId) {
              return {
                ...mic,
                regulatoryStatus: 'validada',
                regulatoryLinkedFieldKey: reviewTermKey,
                regulatoryJustification: reviewJustification
              };
            }
            return mic;
          })
        }));
      } else if (selectedUnifiedItem.originType === 'decisao' && selectedUnifiedItem.decisionId) {
        updatedMacros = updatedMacros.map(macro => ({
          ...macro,
          decisionsList: (macro.decisionsList || []).map(dec => {
            if (dec.id === selectedUnifiedItem.decisionId) {
              return {
                ...dec,
                status: 'Validado',
                targetFieldKey: reviewTermKey,
                decision: reviewTextValue || dec.decision,
                justification: reviewJustification || dec.justification
              };
            }
            return dec;
          })
        }));
      } else if (selectedUnifiedItem.originType === 'contribuicao') {
        const rawContribId = selectedUnifiedItem.id.replace('val_contrib_', '');
        updatedContributions = updatedContributions.map(c => {
          if (c.id === rawContribId || c.id === selectedUnifiedItem.id) {
            return {
              ...c,
              status: 'validada',
              targetFieldKey: reviewTermKey,
              targetRegulatoryFields: [reviewTermKey],
              justification: reviewJustification,
              validatedAt: nowIso,
              validatedBy: authorName
            };
          }
          return c;
        });
      }

      newHistoryEvents.push({
        id: `hist_val_${Date.now()}`,
        date: todayStr,
        timestamp: nowIso,
        author: authorName,
        eventType: 'regulatorio',
        title: `Validação Regulatória: [${reviewTermKey}]`,
        description: `Aprovado e vinculado ao termo "${termLabel}" a partir de ${selectedUnifiedItem.title}.`,
        previousValue: previousVal || undefined,
        newValue: reviewTextValue || undefined,
        justification: reviewJustification,
        refType: selectedUnifiedItem.originType,
        refId: selectedUnifiedItem.id
      });
    } else if (reviewAction === 'ajustes') {
      // Devolver para ajustes
      if (selectedUnifiedItem.originType === 'atividade' && selectedUnifiedItem.microId) {
        updatedMacros = updatedMacros.map(macro => ({
          ...macro,
          microActivities: (macro.microActivities || []).map(mic => {
            if (mic.id === selectedUnifiedItem.microId) {
              return {
                ...mic,
                regulatoryStatus: 'ajustes',
                regulatoryJustification: reviewJustification
              };
            }
            return mic;
          })
        }));
      } else if (selectedUnifiedItem.originType === 'decisao' && selectedUnifiedItem.decisionId) {
        updatedMacros = updatedMacros.map(macro => ({
          ...macro,
          decisionsList: (macro.decisionsList || []).map(dec => {
            if (dec.id === selectedUnifiedItem.decisionId) {
              return {
                ...dec,
                status: 'Em avaliação',
                justification: reviewJustification
              };
            }
            return dec;
          })
        }));
      } else if (selectedUnifiedItem.originType === 'contribuicao') {
        const rawContribId = selectedUnifiedItem.id.replace('val_contrib_', '');
        updatedContributions = updatedContributions.map(c => {
          if (c.id === rawContribId || c.id === selectedUnifiedItem.id) {
            return {
              ...c,
              status: 'ajustes',
              justification: reviewJustification
            };
          }
          return c;
        });
      }

      newHistoryEvents.push({
        id: `hist_ajuste_${Date.now()}`,
        date: todayStr,
        timestamp: nowIso,
        author: authorName,
        eventType: 'regulatorio',
        title: `Devolvido para Ajustes: ${selectedUnifiedItem.title}`,
        description: reviewJustification || 'Necessita adequação de evidência ou detalhamento técnico.',
        justification: reviewJustification,
        refType: selectedUnifiedItem.originType,
        refId: selectedUnifiedItem.id
      });
    } else if (reviewAction === 'descartar') {
      // Descartar
      if (selectedUnifiedItem.originType === 'atividade' && selectedUnifiedItem.microId) {
        updatedMacros = updatedMacros.map(macro => ({
          ...macro,
          microActivities: (macro.microActivities || []).map(mic => {
            if (mic.id === selectedUnifiedItem.microId) {
              return {
                ...mic,
                regulatoryStatus: 'descartada',
                regulatoryJustification: reviewJustification
              };
            }
            return mic;
          })
        }));
      } else if (selectedUnifiedItem.originType === 'decisao' && selectedUnifiedItem.decisionId) {
        updatedMacros = updatedMacros.map(macro => ({
          ...macro,
          decisionsList: (macro.decisionsList || []).map(dec => {
            if (dec.id === selectedUnifiedItem.decisionId) {
              return {
                ...dec,
                status: 'Pendente',
                justification: reviewJustification
              };
            }
            return dec;
          })
        }));
      } else if (selectedUnifiedItem.originType === 'contribuicao') {
        const rawContribId = selectedUnifiedItem.id.replace('val_contrib_', '');
        updatedContributions = updatedContributions.map(c => {
          if (c.id === rawContribId || c.id === selectedUnifiedItem.id) {
            return {
              ...c,
              status: 'descartada',
              justification: reviewJustification
            };
          }
          return c;
        });
      }

      newHistoryEvents.push({
        id: `hist_desc_${Date.now()}`,
        date: todayStr,
        timestamp: nowIso,
        author: authorName,
        eventType: 'regulatorio',
        title: `Contribuição Descartada: ${selectedUnifiedItem.title}`,
        description: reviewJustification || 'Item desconsiderado para a base regulatória.',
        justification: reviewJustification,
        refType: selectedUnifiedItem.originType,
        refId: selectedUnifiedItem.id
      });
    }

    onUpdateProject({
      ...project,
      macroActivities: updatedMacros,
      contributions: updatedContributions,
      regulatoryDatabase: updatedRegDb,
      historyTimeline: [...newHistoryEvents, ...(project.historyTimeline || [])]
    });

    setUnifiedValidationModalOpen(false);
    setSelectedUnifiedItem(null);
  };

  // Item 4: Add / Edit Regulatory Term Definition (Central Catalog)
  const handleSaveRegulatoryTerm = () => {
    const rawKey = termFormKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!rawKey) {
      setTermFormError('A chave do termo é obrigatória (ex: NOME_VACINA).');
      return;
    }
    if (!termFormLabel.trim()) {
      setTermFormError('O nome legível do termo é obrigatório.');
      return;
    }

    // Check duplicate key if creating or changing key
    const isDuplicate = activeTermsList.some(t => 
      t.key === rawKey && (!editingTerm || t.id !== editingTerm.id)
    );
    if (isDuplicate) {
      setTermFormError(`A chave "${rawKey}" já está cadastrada. Escolha uma chave exclusiva.`);
      return;
    }

    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];
    const authorName = teamMembers[0]?.name || 'Gestor';

    let updatedTerms: RegulatoryTermDefinition[];

    if (editingTerm) {
      updatedTerms = activeTermsList.map(t => {
        if (t.id === editingTerm.id) {
          return {
            ...t,
            key: rawKey,
            label: termFormLabel.trim(),
            description: termFormDesc.trim(),
            groupName: termFormGroup,
            valueType: termFormValueType,
            isMandatory: termFormIsMandatory,
            phase: termFormPhase,
            updatedAt: nowIso
          };
        }
        return t;
      });
    } else {
      const newTerm: RegulatoryTermDefinition = {
        id: `term_${rawKey.toLowerCase()}_${Date.now()}`,
        key: rawKey,
        label: termFormLabel.trim(),
        description: termFormDesc.trim() || `Campo regulatório do grupo ${termFormGroup}.`,
        groupName: termFormGroup,
        valueType: termFormValueType,
        isMandatory: termFormIsMandatory,
        isActive: true,
        phase: termFormPhase,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      updatedTerms = [...activeTermsList, newTerm];
    }

    const historyEvent: ProjectHistoryEvent = {
      id: `hist_term_${Date.now()}`,
      date: todayStr,
      timestamp: nowIso,
      author: authorName,
      eventType: 'base_regulatoria',
      title: editingTerm ? `Termo Regulatório Atualizado: [${rawKey}]` : `Novo Termo Regulatório Cadastrado: [${rawKey}]`,
      description: `${termFormLabel.trim()} (${termFormGroup})`,
      refType: 'termo_regulatorio',
      refId: rawKey
    };

    onUpdateProject({
      ...project,
      regulatoryTerms: updatedTerms,
      historyTimeline: [historyEvent, ...(project.historyTimeline || [])]
    });

    setIsNewTermModalOpen(false);
    setEditingTerm(null);
    setTermFormKey('');
    setTermFormLabel('');
    setTermFormDesc('');
    setTermFormError('');
  };

  // Item 4: Toggle Active/Inactive Term (Preserving historical records)
  const handleToggleTermActive = (termId: string) => {
    const target = activeTermsList.find(t => t.id === termId);
    if (!target) return;

    const nowIso = new Date().toISOString();
    const authorName = teamMembers[0]?.name || 'Gestor';
    const newStatus = !target.isActive;

    const updatedTerms = activeTermsList.map(t => {
      if (t.id === termId) {
        return { ...t, isActive: newStatus, updatedAt: nowIso };
      }
      return t;
    });

    const historyEvent: ProjectHistoryEvent = {
      id: `hist_term_status_${Date.now()}`,
      date: nowIso.split('T')[0],
      timestamp: nowIso,
      author: authorName,
      eventType: 'base_regulatoria',
      title: `Status do Termo Alterado: [${target.key}]`,
      description: `Termo ${newStatus ? 'reativado' : 'desativado'} no cadastro central.`,
      refType: 'termo_regulatorio',
      refId: target.key
    };

    onUpdateProject({
      ...project,
      regulatoryTerms: updatedTerms,
      historyTimeline: [historyEvent, ...(project.historyTimeline || [])]
    });
  };

  // Item 6: Export Matrix Table to XLSX Spreadsheet
  const handleExportMatrixExcel = () => {
    try {
      const activeOnlyTerms = activeTermsList.filter(t => t.isActive);

      // Sheet 1: Matrix Data (1 row per project, terms as columns)
      const matrixHeaders = [
        'ID_PROJETO',
        'NOME_PROJETO',
        'RESPONSAVEL',
        'STATUS_OPERACIONAL',
        'PROGRESSO_OPERACIONAL',
        'PROGRESSO_REGULATORIO',
        ...activeOnlyTerms.map(t => `[${t.key}] ${t.label}`)
      ];

      const currentProjRow = [
        project.id,
        project.name,
        project.responsible || 'Bruna',
        project.status || 'Ativo',
        `${stats.operationalProgress}%`,
        `${stats.regulatoryProgress}%`,
        ...activeOnlyTerms.map(t => {
          const rec = (project.regulatoryDatabase || []).find(r => r.key === t.key || r.fieldKey === t.key);
          if (rec?.status === 'validado') {
            const txt = rec.valueText || rec.value || '';
            const link = rec.valueLink ? ` (Link: ${rec.valueLink})` : '';
            return `[VALIDADO] ${txt}${link}`;
          }
          if (rec?.status === 'Em andamento' || rec?.status === 'em análise' || rec?.status === 'Aguardando validação') {
            return `[EM VALIDAÇÃO] ${rec.valueText || ''}`;
          }
          return '—';
        })
      ];

      const matrixSheet = XLSX.utils.aoa_to_sheet([matrixHeaders, currentProjRow]);

      // Sheet 2: Terms Dictionary
      const dictHeaders = ['CHAVE', 'NOME_CAMPO', 'GRUPO_REGULATORIO', 'TIPO_VALOR', 'OBRIGATORIO', 'STATUS', 'FASE', 'DESCRICAO'];
      const dictRows = activeTermsList.map(t => [
        t.key,
        t.label,
        t.groupName,
        t.valueType,
        t.isMandatory ? 'SIM' : 'NÃO',
        t.isActive ? 'ATIVO' : 'INATIVO',
        t.phase || '—',
        t.description || '—'
      ]);

      const dictSheet = XLSX.utils.aoa_to_sheet([dictHeaders, ...dictRows]);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, matrixSheet, 'Matriz Regulatória');
      XLSX.utils.book_append_sheet(workbook, dictSheet, 'Dicionário de Termos');

      const safeName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      XLSX.writeFile(workbook, `Matriz_Regulatoria_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Falha ao exportar planilha XLSX:', err);
      alert('Não foi possível gerar a planilha XLSX. Verifique os dados e tente novamente.');
    }
  };

  // Linked meetings to this project
  const linkedMeetings = useMemo(() => {
    return (meetings || []).filter(m => 
      m.projectId === project.id || 
      (m.projectName && project.name && m.projectName.toLowerCase().trim() === project.name.toLowerCase().trim())
    );
  }, [meetings, project.id, project.name]);

  // Filtered upcoming next actions for the active group
  const nextActions = useMemo(() => {
    const list: { micro: MicroActivity; groupName: string }[] = [];
    activeGroup.microActivities.forEach(micro => {
      const isDone = micro.status === 'Concluído e aprovado' || micro.status === 'Concluído com restrições';
      if (!isDone) {
        list.push({ micro, groupName: activeGroup.name });
      }
    });
    return list;
  }, [activeGroup]);

  // Carousel scroll helpers
  const handleScrollCarousel = (direction: 'left' | 'right') => {
    if (journeyScrollRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      journeyScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Switch to regulatory orientation subtab within active group
  const handleScrollToRegulatory = () => {
    setGroupSubTab('orientacoes');
  };

  // Open activity detail modal
  const handleOpenMicroDetails = (micro: MicroActivity) => {
    setSelectedMicro(micro);
    setEditingMicroData({ ...micro });
    setPresentationLinkInput(micro.documentLink || (micro as any).presentationLink || '');
    setIsActivityModalOpen(true);
  };

  // Save changes to microactivity
  const handleSaveMicroActivity = () => {
    if (!selectedMicro) return;

    const updatedMicro: MicroActivity = {
      ...selectedMicro,
      ...editingMicroData,
      documentLink: presentationLinkInput || editingMicroData.documentLink,
      reportLink: editingMicroData.reportLink || selectedMicro.reportLink
    };

    // Update in project
    const updatedMacros = (project.macroActivities || []).map(macro => {
      const hasMicro = (macro.microActivities || []).some(m => m.id === updatedMicro.id);
      if (hasMicro) {
        const nextMicros = macro.microActivities.map(m => m.id === updatedMicro.id ? updatedMicro : m);
        return { ...macro, microActivities: nextMicros };
      }
      return macro;
    });

    // If the macro wasn't in project.macroActivities yet, ensure it is added
    const exists = updatedMacros.some(m => (m.microActivities || []).some(mic => mic.id === updatedMicro.id));
    if (!exists) {
      // Find or create the macro
      const macroName = activeGroup.name;
      const existingMacro = updatedMacros.find(m => m.name === macroName);
      if (existingMacro) {
        existingMacro.microActivities = [...existingMacro.microActivities, updatedMicro];
      } else {
        updatedMacros.push({
          id: activeGroup.macroId,
          name: activeGroup.name,
          phase: selectedPhase,
          microActivities: activeGroup.microActivities.map(m => m.id === updatedMicro.id ? updatedMicro : m)
        });
      }
    }

    onUpdateProject({
      ...project,
      macroActivities: updatedMacros
    });

    setIsActivityModalOpen(false);
    setSelectedMicro(null);
  };

  // Quick toggle status for microactivity from table
  const handleQuickStatusChange = (microId: string, newStatus: MicroActivityStatus) => {
    const isDone = newStatus === 'Concluído e aprovado';
    const updatedMacros = (project.macroActivities || []).map(macro => {
      const hasMicro = (macro.microActivities || []).some(m => m.id === microId);
      if (hasMicro) {
        const nextMicros = macro.microActivities.map(m => {
          if (m.id === microId) {
            return {
              ...m,
              status: newStatus,
              progress: isDone ? 100 : (m.progress || 50),
              completionDate: isDone ? new Date().toISOString().split('T')[0] : m.completionDate
            };
          }
          return m;
        });
        return { ...macro, microActivities: nextMicros };
      }
      return macro;
    });

    onUpdateProject({
      ...project,
      macroActivities: updatedMacros
    });
  };

  // Helper for status badge styling
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'Concluído e aprovado':
      case 'Concluída':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle size={12} className="text-emerald-600" /> Concluída
          </span>
        );
      case 'Em andamento':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
            <Clock size={12} className="text-blue-600" /> Em andamento
          </span>
        );
      case 'Planejado':
      case 'Pendente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <Clock size={12} className="text-amber-600" /> Pendente
          </span>
        );
      case 'Em análise':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
            <Clock size={12} className="text-purple-600" /> Em análise
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {status || 'Pendente'}
          </span>
        );
    }
  };

  // Render SVG illustration per group
  const renderGroupIllustration = (type: CanonicalGroupDef['illustrationType']) => {
    switch (type) {
      case 'vials':
        return (
          <div className="h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 60" className="h-14 w-auto text-blue-500 fill-current opacity-90 drop-shadow-xs">
              <rect x="18" y="22" width="26" height="34" rx="4" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
              <rect x="22" y="32" width="18" height="20" rx="2" fill="#38BDF8" fillOpacity="0.4" />
              <rect x="23" y="16" width="16" height="6" rx="2" fill="#0284C7" />
              <line x1="22" y1="22" x2="40" y2="22" stroke="#0284C7" strokeWidth="2" />
              <rect x="52" y="14" width="30" height="42" rx="5" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2" />
              <rect x="57" y="26" width="20" height="26" rx="3" fill="#0284C7" fillOpacity="0.6" />
              <rect x="58" y="8" width="18" height="6" rx="2" fill="#0369A1" />
              <line x1="56" y1="14" x2="78" y2="14" stroke="#0284C7" strokeWidth="2" />
            </svg>
          </div>
        );
      case 'chromatography':
        return (
          <div className="h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 60" className="h-14 w-auto drop-shadow-xs">
              <rect x="15" y="12" width="70" height="42" rx="4" fill="#F8FAFC" stroke="#64748B" strokeWidth="2" />
              <rect x="22" y="18" width="36" height="28" rx="2" fill="#0F172A" />
              <path d="M 24 40 L 30 38 L 34 22 L 38 39 L 46 39 L 50 30 L 54 40" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="66" y="20" width="12" height="6" rx="1" fill="#0284C7" />
              <circle cx="72" cy="34" r="3" fill="#22C55E" />
            </svg>
          </div>
        );
      case 'animal':
        return (
          <div className="h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 60" className="h-14 w-auto text-slate-400 drop-shadow-xs">
              <ellipse cx="50" cy="36" rx="28" ry="16" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
              <circle cx="28" cy="28" r="10" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
              <circle cx="24" cy="26" r="2" fill="#0F172A" />
              <ellipse cx="26" cy="18" rx="5" ry="8" fill="#FBCFE8" stroke="#F43F5E" strokeWidth="1.5" />
              <path d="M 76 36 Q 90 32 94 44" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'syringe':
        return (
          <div className="h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 60" className="h-14 w-auto text-blue-600 drop-shadow-xs">
              <rect x="25" y="24" width="45" height="14" rx="2" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
              <line x1="34" y1="24" x2="34" y2="30" stroke="#2563EB" strokeWidth="1.5" />
              <line x1="44" y1="24" x2="44" y2="30" stroke="#2563EB" strokeWidth="1.5" />
              <line x1="54" y1="24" x2="54" y2="30" stroke="#2563EB" strokeWidth="1.5" />
              <rect x="70" y="28" width="18" height="6" fill="#2563EB" />
              <line x1="88" y1="24" x2="88" y2="38" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
              <line x1="12" y1="31" x2="25" y2="31" stroke="#94A3B8" strokeWidth="2" />
            </svg>
          </div>
        );
      case 'antibodies':
        return (
          <div className="h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 60" className="h-14 w-auto text-blue-600 drop-shadow-xs">
              <g transform="translate(25, 12)">
                <path d="M 12 36 L 12 18 M 12 18 L 4 6 M 12 18 L 20 6" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="4" cy="6" r="3" fill="#38BDF8" />
                <circle cx="20" cy="6" r="3" fill="#38BDF8" />
              </g>
              <g transform="translate(55, 12)">
                <path d="M 12 36 L 12 18 M 12 18 L 4 6 M 12 18 L 20 6" fill="none" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="4" cy="6" r="3" fill="#38BDF8" />
                <circle cx="20" cy="6" r="3" fill="#38BDF8" />
              </g>
            </svg>
          </div>
        );
      case 'shield':
        return (
          <div className="h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 60" className="h-14 w-auto text-blue-600 drop-shadow-xs">
              <path d="M 50 10 L 68 18 C 68 34 50 48 50 48 C 50 48 32 34 32 18 Z" fill="#2563EB" stroke="#1D4ED8" strokeWidth="2" />
              <path d="M 42 28 L 48 34 L 58 22" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      case 'formulation':
        return (
          <div className="h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 60" className="h-14 w-auto text-blue-600 drop-shadow-xs">
              <rect x="28" y="16" width="22" height="36" rx="4" fill="#EFF6FF" stroke="#0284C7" strokeWidth="2" />
              <rect x="32" y="10" width="14" height="6" rx="1" fill="#0284C7" />
              <circle cx="68" cy="22" r="5" fill="#38BDF8" />
              <circle cx="78" cy="38" r="6" fill="#0284C7" />
              <circle cx="62" cy="42" r="4" fill="#93C5FD" />
              <line x1="68" y1="22" x2="78" y2="38" stroke="#64748B" strokeWidth="1.5" />
              <line x1="78" y1="38" x2="62" y2="42" stroke="#64748B" strokeWidth="1.5" />
            </svg>
          </div>
        );
      case 'stability':
        return (
          <div className="h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 60" className="h-14 w-auto text-blue-600 drop-shadow-xs">
              <rect x="42" y="12" width="10" height="34" rx="5" fill="#EFF6FF" stroke="#0284C7" strokeWidth="2" />
              <circle cx="47" cy="46" r="9" fill="#0284C7" stroke="#0369A1" strokeWidth="2" />
              <rect x="45" y="24" width="4" height="22" rx="2" fill="#0284C7" />
              <line x1="56" y1="18" x2="62" y2="18" stroke="#64748B" strokeWidth="1.5" />
              <line x1="56" y1="26" x2="66" y2="26" stroke="#64748B" strokeWidth="1.5" />
              <line x1="56" y1="34" x2="62" y2="34" stroke="#64748B" strokeWidth="1.5" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 font-sans text-slate-800">
      
      {/* 1. TOP HEADER & BREADCRUMBS & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <button 
              onClick={onBack}
              className="hover:text-blue-600 transition flex items-center gap-1 cursor-pointer"
            >
              Projetos
            </button>
            <span className="text-slate-400 font-normal">&gt;</span>
            <span className="text-slate-800 font-bold truncate max-w-[320px] sm:max-w-none">
              {project.name}
            </span>
          </div>

          {/* Project Title + Status Badge */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-xs font-black shadow-2xs">
              {project.status || 'Ativo'}
            </span>
          </div>

          {/* Subtitle */}
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {project.description || 'Desenvolvimento e acompanhamento de candidato vacinal no módulo CTVacinas.'}
          </p>
        </div>

        {/* Top Right Buttons & Tab Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Top View Navigation Tabs (Item 2 & 3: Visão Geral, Próximas Ações, Histórico, Validação Regulatória, Base Regulatória & Termos) */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 mr-2">
            <button
              onClick={() => setActiveTopTab('visao_geral')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTopTab === 'visao_geral'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                activeTopTab === 'visao_geral' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>1</span>
              Visão Geral
            </button>

            <button
              onClick={() => setActiveTopTab('proximas_acoes')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTopTab === 'proximas_acoes'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                activeTopTab === 'proximas_acoes' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>2</span>
              Próximas Ações
            </button>

            <button
              onClick={() => setActiveTopTab('historico')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTopTab === 'historico'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                activeTopTab === 'historico' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>3</span>
              Histórico
            </button>

            <button
              onClick={() => setActiveTopTab('contribuicoes')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTopTab === 'contribuicoes'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                activeTopTab === 'contribuicoes' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>4</span>
              <span>Validação Regulatória</span>
              {totalPendingValidation > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                  {totalPendingValidation}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTopTab('docs')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTopTab === 'docs'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                activeTopTab === 'docs' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>5</span>
              <span>Base Regulatória & Termos</span>
            </button>
          </div>

          {/* Quick Action buttons */}
          <button
            onClick={() => onPrint ? onPrint() : window.print()}
            className="p-2.5 bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50 rounded-xl transition shadow-2xs cursor-pointer"
            title="Imprimir visão do projeto"
          >
            <Printer size={15} />
          </button>

          <button
            onClick={onBack}
            className="px-4 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={14} /> Voltar
          </button>
        </div>
      </div>

      {/* Top Tabs on smaller screens */}
      <div className="flex xl:hidden overflow-x-auto pb-2 gap-1.5 no-scrollbar">
        {[
          { id: 'visao_geral', num: '1', label: 'Visão Geral' },
          { id: 'proximas_acoes', num: '2', label: 'Próximas Ações' },
          { id: 'historico', num: '3', label: 'Histórico' },
          { id: 'contribuicoes', num: '4', label: 'Validação Regulatória', badge: totalPendingValidation },
          { id: 'docs', num: '5', label: 'Base Regulatória & Termos' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTopTab(tab.id as any)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTopTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            <span>{tab.num}.</span> {tab.label}
            {tab.badge && tab.badge > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white ml-0.5">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* 2. TOP KPI STAT CARDS (Item 1: Progresso Operacional baseado em microatividades concluídas vs Progresso Regulatório) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Progresso Operacional */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FlaskConical size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500">Progresso operacional</p>
              <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                Microatividades Concluídas
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.operationalProgress}%
            </p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                style={{ width: `${stats.operationalProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-1 truncate">
              {stats.completedMicros} de {stats.totalMicros} microatividades concluídas
            </p>
          </div>
        </div>

        {/* Card 2: Progresso Regulatório */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500">Progresso regulatório</p>
              <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                Decisões & Base
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.regulatoryProgress}%
            </p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${stats.regulatoryProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-1 truncate">
              {stats.validatedMandatoryDecisions} de {stats.totalMandatoryDecisions} requisitos validados
            </p>
          </div>
        </div>

        {/* Card 3: Tempo restante */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Tempo restante</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">
                {stats.daysRemaining} dias
              </p>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Previsão: {stats.forecastDate}
              </p>
            </div>
          </div>
          <div className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-black">
            20%
          </div>
        </div>

        {/* Card 4: Próximo marco */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Flag size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-500">Próximo marco</p>
            <p className="text-lg font-black text-slate-900 truncate leading-snug">
              {stats.nextMilestoneName}
            </p>
            <p className="text-xs font-black text-blue-600 mt-0.5">
              Em {stats.daysToMilestone} dias
            </p>
          </div>
        </div>
      </div>

      {/* Conditional rendering for other Top Tabs */}
      {activeTopTab === 'estrutura' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Estrutura Completa do Projeto</h2>
              <p className="text-xs text-slate-500">Árvore hierárquica de Fases, Grupos de Atividades e Microatividades</p>
            </div>
          </div>
          <div className="space-y-4">
            {phasesList.map((phase, pIdx) => {
              const normP = normalizePhaseName(phase).toLowerCase();
              const macrosInPhase = (project.macroActivities || []).filter(m => normalizePhaseName(m.phase || '').toLowerCase() === normP);
              return (
                <div key={phase} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-800">{pIdx + 1}. {phase}</span>
                    <span className="text-xs font-bold text-blue-600">{phaseProgressMap[phase] || 0}% concluído</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
                    {macrosInPhase.map(m => (
                      <div key={m.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                        <p className="font-bold text-slate-900">{m.name}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{(m.microActivities || []).length} microatividades</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTopTab === 'proximas_acoes' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900">Próximas Ações e Prazos do Projeto</h2>
            <p className="text-xs text-slate-500">Tarefas em andamento e pendentes para acompanhamento direto da gestão</p>
          </div>
          <div className="divide-y divide-slate-100">
            {currentPhaseGroups.flatMap(g => g.microActivities.filter(m => m.status !== 'Concluído e aprovado')).map(m => (
              <div key={m.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{m.name}</p>
                    <p className="text-[11px] text-slate-400">Responsável: {m.assignee || 'Não atribuído'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600">{m.dueDate || 'Sem prazo'}</span>
                  <button 
                    onClick={() => handleOpenMicroDetails(m)}
                    className="text-xs font-black text-blue-600 hover:text-blue-800"
                  >
                    Abrir &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA HISTÓRICO - REGISTRO DO QUE ACONTECEU (Item 8) */}
      {activeTopTab === 'historico' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <HistoryIcon className="text-blue-600" size={20} />
                <h2 className="text-lg font-black text-slate-900">Histórico Completo do Projeto</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Linha do tempo cronológica com reuniões, deliberações, decisões e alterações na Base Regulatória
              </p>
            </div>
            <button
              onClick={() => setIsAddHistoryModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus size={14} /> Registrar Marco / Nota
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-bold mr-1 flex items-center gap-1">
              <Filter size={12} /> Filtrar por:
            </span>
            {[
              { id: 'todos', label: 'Todos os Eventos' },
              { id: 'reuniao', label: 'Reuniões' },
              { id: 'decisao', label: 'Decisões Estratégicas' },
              { id: 'regulatorio', label: 'Base Regulatória' },
              { id: 'contribuicao', label: 'Contribuições' },
              { id: 'atividade', label: 'Atividades' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setHistoryFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  historyFilter === f.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Chronological Timeline */}
          <div className="space-y-4 pt-2">
            {/* Meetings Section if filter matches */}
            {(historyFilter === 'todos' || historyFilter === 'reuniao') && linkedMeetings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Presentation size={14} className="text-blue-600" /> Reuniões Realizadas ({linkedMeetings.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {linkedMeetings.map(meeting => (
                    <div 
                      key={meeting.id} 
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/20 transition space-y-2 cursor-pointer"
                      onClick={() => setSelectedMeetingForModal(meeting)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-black text-slate-900">{meeting.title}</p>
                          <p className="text-[11px] text-slate-500">
                            Data: {meeting.date} | Moderador: {meeting.moderator}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-black shrink-0">
                          {meeting.agendaItems?.length || 0} pautas
                        </span>
                      </div>
                      {meeting.generalConclusions && (
                        <p className="text-xs text-slate-600 line-clamp-2 italic">
                          "{meeting.generalConclusions}"
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        {meeting.presentationLink ? (
                          <a 
                            href={meeting.presentationLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            onClick={e => e.stopPropagation()}
                            className="text-[11px] text-blue-600 font-bold inline-flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink size={12} /> Apresentação
                          </a>
                        ) : <span />}
                        <button 
                          onClick={() => setSelectedMeetingForModal(meeting)}
                          className="text-[11px] font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          Ver pautas e ata completa &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Feed */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Linha do Tempo de Alterações e Marcos
              </h3>
              {(() => {
                const events = (project.historyTimeline || []).filter(e => {
                  if (historyFilter === 'todos') return true;
                  return e.eventType === historyFilter;
                });

                if (events.length === 0) {
                  return (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-xs text-slate-400 italic">
                        Nenhum evento registrado nesta categoria até o momento. Conforme decisões forem tomadas e contribuições validadas, elas aparecerão automaticamente aqui.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {events.map((evt, idx) => (
                      <div key={evt.id || idx} className="relative">
                        {/* Node circle */}
                        <div className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                          evt.eventType === 'decisao' ? 'border-emerald-500' :
                          evt.eventType === 'regulatorio' ? 'border-blue-500' :
                          evt.eventType === 'contribuicao' ? 'border-purple-500' : 'border-amber-500'
                        }`} />

                        <div className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                evt.eventType === 'decisao' ? 'bg-emerald-100 text-emerald-800' :
                                evt.eventType === 'regulatorio' ? 'bg-blue-100 text-blue-800' :
                                evt.eventType === 'contribuicao' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {evt.eventType}
                              </span>
                              <span className="font-black text-slate-900">{evt.title}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-semibold">
                              {evt.date} • por <strong className="text-slate-700">{evt.author}</strong>
                            </span>
                          </div>

                          {evt.description && (
                            <p className="text-slate-600 leading-relaxed">{evt.description}</p>
                          )}

                          {/* Content change detail: previous value vs new value */}
                          {(evt.previousValue || evt.newValue) && (
                            <div className="p-3 bg-white rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              {evt.previousValue && (
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-400 uppercase text-[9px]">Valor anterior:</span>
                                  <p className="text-slate-500 line-through truncate">{evt.previousValue}</p>
                                </div>
                              )}
                              {evt.newValue && (
                                <div className="space-y-0.5">
                                  <span className="font-bold text-emerald-600 uppercase text-[9px]">Novo valor:</span>
                                  <p className="text-slate-800 font-semibold truncate">{evt.newValue}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {evt.justification && (
                            <p className="text-[11px] text-slate-500 italic bg-amber-50/60 p-2 rounded-xl border border-amber-200/50">
                              <strong>Justificativa:</strong> {evt.justification}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: CENTRAL DE VALIDAÇÃO REGULATÓRIA (Item 3 & Item 5: Unifica microatividades, decisões e contribuições) */}
      {activeTopTab === 'contribuicoes' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-blue-600" size={22} />
                <h2 className="text-lg font-black text-slate-900">Central de Validação Regulatória</h2>
                {totalPendingValidation > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white animate-pulse">
                    {totalPendingValidation} pendência{totalPendingValidation > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Fila unificada de validação técnica: microatividades marcadas, decisões estratégicas e contribuições da equipe.
                A aprovação regulatória é independente da conclusão operacional.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddContributionModalOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus size={14} /> Nova Contribuição Manual
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          {(() => {
            const allItems = unifiedValidationQueue;
            const pendentes = allItems.filter(i => i.currentStatus === 'pendente').length;
            const ajustes = allItems.filter(i => i.currentStatus === 'ajustes').length;
            const validados = allItems.filter(i => i.currentStatus === 'validada').length;
            const descartados = allItems.filter(i => i.currentStatus === 'descartada').length;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500">Total na Fila</span>
                  <p className="text-2xl font-black text-slate-900">{allItems.length}</p>
                </div>
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-700">Pendentes</span>
                    {pendentes > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />}
                  </div>
                  <p className="text-2xl font-black text-amber-900">{pendentes}</p>
                </div>
                <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-200">
                  <span className="text-[11px] font-bold text-indigo-700">Em Ajustes</span>
                  <p className="text-2xl font-black text-indigo-900">{ajustes}</p>
                </div>
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-700">Validados</span>
                  <p className="text-2xl font-black text-emerald-900">{validados}</p>
                </div>
                <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500">Descartados</span>
                  <p className="text-2xl font-black text-slate-700">{descartados}</p>
                </div>
              </div>
            );
          })()}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-bold mr-1 flex items-center gap-1">
              <Filter size={12} /> Filtrar Status:
            </span>
            {[
              { id: 'pendentes', label: 'Pendentes de Análise' },
              { id: 'ajustes', label: 'Em Ajustes' },
              { id: 'validados', label: 'Validados' },
              { id: 'descartados', label: 'Descartados' },
              { id: 'todos', label: 'Todos os Itens' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setValidationQueueFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  validationQueueFilter === f.id
                    ? 'bg-blue-600 text-white shadow-2xs font-black'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Unified Validation Feed */}
          <div className="space-y-3">
            {(() => {
              const list = unifiedValidationQueue.filter(item => {
                if (validationQueueFilter === 'todos') return true;
                if (validationQueueFilter === 'pendentes') return item.currentStatus === 'pendente';
                if (validationQueueFilter === 'ajustes') return item.currentStatus === 'ajustes';
                if (validationQueueFilter === 'validados') return item.currentStatus === 'validada';
                if (validationQueueFilter === 'descartados') return item.currentStatus === 'descartada';
                return true;
              });

              if (list.length === 0) {
                return (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
                    <p className="text-xs font-bold uppercase text-slate-600">Nenhum item nesta visualização</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {validationQueueFilter === 'pendentes'
                        ? 'Todas as contribuições, microatividades e decisões regulatórias foram avaliadas!'
                        : 'Não há registros para o filtro selecionado.'}
                    </p>
                  </div>
                );
              }

              return list.map(item => {
                const isApproved = item.currentStatus === 'validada';
                const isAdjustments = item.currentStatus === 'ajustes';
                const isDiscarded = item.currentStatus === 'descartada';

                return (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-2xl border transition space-y-3 ${
                      isApproved 
                        ? 'border-emerald-200 bg-emerald-50/30' 
                        : isAdjustments 
                          ? 'border-indigo-200 bg-indigo-50/30' 
                          : isDiscarded 
                            ? 'border-slate-200 bg-slate-50/50 opacity-75' 
                            : 'border-amber-200 bg-white hover:border-amber-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Origin Type Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.originType === 'atividade' ? 'bg-blue-100 text-blue-800' :
                            item.originType === 'decisao' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {item.originType}
                          </span>

                          {/* Independent Regulatory Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isApproved ? 'bg-emerald-600 text-white shadow-2xs' :
                            isAdjustments ? 'bg-indigo-600 text-white shadow-2xs' :
                            isDiscarded ? 'bg-slate-300 text-slate-700' : 'bg-amber-500 text-white shadow-2xs'
                          }`}>
                            {isApproved ? 'Validada ✓' : isAdjustments ? 'Em Ajustes ⚠️' : isDiscarded ? 'Descartada' : 'Pendente de Validação ⏳'}
                          </span>

                          <h4 className="text-xs font-black text-slate-900">{item.title}</h4>
                        </div>

                        <p className="text-[11px] text-slate-500">
                          Fase: <strong className="text-slate-700">{item.phase}</strong> • Macro: <strong className="text-slate-700">{item.macroName}</strong> • Autor: <strong className="text-slate-700">{item.author}</strong> • Prazo/Data: {item.date}
                        </p>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center gap-2">
                        {item.evidenceLink && (
                          <a
                            href={item.evidenceLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-blue-600 hover:bg-slate-50 flex items-center gap-1 shadow-2xs"
                          >
                            <ExternalLink size={12} /> Evidência
                          </a>
                        )}

                        <button
                          onClick={() => {
                            setSelectedUnifiedItem(item);
                            setReviewAction(item.currentStatus === 'validada' ? 'aprovar' : (item.currentStatus === 'descartada' ? 'descartar' : 'aprovar'));
                            setReviewTermKey(item.linkedTermKey || activeTermsList[0]?.key || '');
                            setReviewTextValue(item.content);
                            setReviewLinkValue(item.evidenceLink || '');
                            setReviewJustification(item.justification || '');
                            setIsInlineCreateTermOpen(false);
                            setUnifiedValidationModalOpen(true);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                            isApproved 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <Sliders size={13} /> {isApproved ? 'Revisar Validação' : 'Avaliar / Validar'}
                        </button>
                      </div>
                    </div>

                    {/* Content Box */}
                    <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed font-medium">
                      {item.content}
                    </div>

                    {/* Operational Status (Independent from Regulatory) & Linked Term */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">Status Operacional:</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200">
                          {item.operationalStatus || 'Ativo'}
                        </span>
                      </div>

                      {item.linkedTermKey && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-400">Termo Vinculado:</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono font-bold rounded-lg border border-blue-200">
                            [{item.linkedTermKey}]
                          </span>
                        </div>
                      )}
                    </div>

                    {item.justification && (
                      <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <strong>Parecer do Gestor:</strong> {item.justification}
                      </p>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ABA 5: BASE REGULATÓRIA & CADASTRO DE TERMOS (Item 4 & Item 6) */}
      {activeTopTab === 'docs' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
          {/* Sub-Tabs: Matriz Consolidada | Detalhes da Base | Cadastro Central de Termos */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Database className="text-blue-600" size={22} />
                <h2 className="text-lg font-black text-slate-900">Base Regulatória & Matriz de Termos</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidação matricial dos requisitos regulatórios, histórico auditável de versões e catálogo central de termos.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              {[
                { id: 'matriz', label: '1. Matriz Consolidada' },
                { id: 'base', label: '2. Detalhes do Projeto' },
                { id: 'termos', label: '3. Cadastro de Termos' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setMatrixViewTab(sub.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    matrixViewTab === sub.id
                      ? 'bg-blue-600 text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          {/* SUB-VIEW 1: MATRIZ CONSOLIDADA DE PROJETOS (Item 6: Tabela onde cada projeto ocupa 1 linha com ID_PROJETO e termos como colunas + XLSX) */}
          {matrixViewTab === 'matriz' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    Exibindo <strong>1 projeto</strong> e <strong>{activeTermsList.filter(t => t.isActive).length} termos ativos</strong> em colunas.
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Diferenciação clara: Aprovados vs Em validação vs Em branco
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExportMatrixExcel}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Exportar planilha XLSX formatada com dados e dicionário"
                >
                  <Download size={14} /> Exportar Planilha (XLSX)
                </button>
              </div>

              {/* Matriz Horizontal Scrollable Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl max-w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-bold">
                      <th className="py-3 px-4 border-r border-slate-800 sticky left-0 bg-slate-900 z-10 whitespace-nowrap">ID_PROJETO</th>
                      <th className="py-3 px-4 border-r border-slate-800 whitespace-nowrap">PROJETO</th>
                      <th className="py-3 px-4 border-r border-slate-800 whitespace-nowrap">RESPONSÁVEL</th>
                      <th className="py-3 px-4 border-r border-slate-800 whitespace-nowrap text-center">PROG. OPERACIONAL</th>
                      <th className="py-3 px-4 border-r border-slate-800 whitespace-nowrap text-center">PROG. REGULATÓRIO</th>
                      {activeTermsList.filter(t => t.isActive).map(term => (
                        <th key={term.key} className="py-3 px-4 border-r border-slate-800 min-w-[200px]" title={term.description}>
                          <span className="text-sky-300 font-mono">[{term.key}]</span>
                          <span className="block text-[10px] text-slate-300 font-normal truncate">{term.label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    <tr className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-black text-slate-900 border-r border-slate-100 sticky left-0 bg-white z-10 whitespace-nowrap">
                        {project.id}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                        {project.name}
                      </td>
                      <td className="py-3 px-4 text-slate-700 border-r border-slate-100 whitespace-nowrap">
                        {project.responsible || 'Bruna'}
                      </td>
                      <td className="py-3 px-4 text-center border-r border-slate-100 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full font-black text-[11px] bg-blue-100 text-blue-800">
                          {stats.operationalProgress}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center border-r border-slate-100 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full font-black text-[11px] bg-emerald-100 text-emerald-800">
                          {stats.regulatoryProgress}%
                        </span>
                      </td>
                      {activeTermsList.filter(t => t.isActive).map(term => {
                        const rec = (project.regulatoryDatabase || []).find(r => r.key === term.key || r.fieldKey === term.key);
                        const isVal = rec?.status === 'validado';
                        const isPend = rec?.status === 'Em andamento' || rec?.status === 'em análise' || rec?.status === 'Aguardando validação';

                        if (isVal && (rec.valueText || rec.value)) {
                          return (
                            <td key={term.key} className="py-3 px-4 border-r border-slate-100 bg-emerald-50/40">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-emerald-800 font-bold">
                                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                  <span className="truncate max-w-[190px]" title={rec.valueText || rec.value}>
                                    {rec.valueText || rec.value}
                                  </span>
                                </div>
                                {rec.valueLink && (
                                  <a
                                    href={rec.valueLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                                  >
                                    <ExternalLink size={10} /> Link de evidência
                                  </a>
                                )}
                              </div>
                            </td>
                          );
                        }

                        if (isPend) {
                          return (
                            <td key={term.key} className="py-3 px-4 border-r border-slate-100 bg-amber-50/40">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                                <Clock size={11} /> ⏳ Em validação
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td key={term.key} className="py-3 px-4 border-r border-slate-100 text-slate-300 text-center">
                            —
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: DETALHES DA BASE DO PROJETO (Categorizado por Grupos, com Versionamento Auditável) */}
          {matrixViewTab === 'base' && (
            <div className="space-y-6">
              {STANDARD_REGULATORY_GROUPS.map((grp, gIdx) => (
                <div key={grp.groupName} className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        {gIdx + 1}. {grp.groupName}
                      </h3>
                      <p className="text-xs text-slate-500">{grp.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {grp.fields.map(f => {
                      const rec = (project.regulatoryDatabase || []).find(r => r.key === f.key || r.fieldKey === f.key);
                      const isVal = rec?.status === 'validado';
                      const historyItems = rec?.history || [];

                      return (
                        <div key={f.key} className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-blue-700">[{f.key}]</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isVal ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isVal ? 'Validado ✓' : 'Não preenchido'}
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-800">{f.label}</h4>

                          <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150 min-h-[42px] leading-relaxed">
                            {rec?.valueText || rec?.value || <span className="italic text-slate-400">Pendente de validação</span>}
                          </p>

                          {rec?.valueLink && (
                            <a
                              href={rec.valueLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                            >
                              <ExternalLink size={12} /> Link de acesso restrito / Evidência
                            </a>
                          )}

                          {historyItems.length > 0 && (
                            <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                              <span>Versão {rec?.version || historyItems.length} ({historyItems.length} alterações)</span>
                              <span title={`Última alteração por ${rec?.updatedBy || 'Gestor'}`}>
                                Por {rec?.updatedBy || 'Gestor'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUB-VIEW 3: CADASTRO CENTRAL DE TERMOS REGULATÓRIOS (Item 4: Adicionar, editar, desativar termos, sem duplicações) */}
          {matrixViewTab === 'termos' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[180px]">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={filterTermSearch}
                      onChange={e => setFilterTermSearch(e.target.value)}
                      placeholder="Buscar termos por chave, nome ou descrição..."
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                    />
                  </div>

                  {/* Group Filter */}
                  <select
                    value={filterTermGroup}
                    onChange={e => setFilterTermGroup(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
                  >
                    <option value="Todos">Todos os Grupos</option>
                    {STANDARD_REGULATORY_GROUPS.map(g => (
                      <option key={g.groupName} value={g.groupName}>{g.groupName}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingTerm(null);
                    setTermFormKey('');
                    setTermFormLabel('');
                    setTermFormDesc('');
                    setTermFormGroup(STANDARD_REGULATORY_GROUPS[0].groupName);
                    setTermFormValueType('ambos');
                    setTermFormIsMandatory(true);
                    setTermFormPhase('Descoberta / Prova de Conceito');
                    setTermFormError('');
                    setIsNewTermModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus size={14} /> Novo Termo Regulatório
                </button>
              </div>

              {/* Terms Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-2.5 px-3">CHAVE ÚNICA</th>
                      <th className="py-2.5 px-3">NOME LEGÍVEL</th>
                      <th className="py-2.5 px-3">GRUPO REGULATÓRIO</th>
                      <th className="py-2.5 px-3">TIPO DE VALOR</th>
                      <th className="py-2.5 px-3">OBRIGATÓRIO</th>
                      <th className="py-2.5 px-3">STATUS</th>
                      <th className="py-2.5 px-3 text-right">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeTermsList.filter(t => {
                      if (filterTermGroup !== 'Todos' && t.groupName !== filterTermGroup) return false;
                      if (!filterTermSearch) return true;
                      const q = filterTermSearch.toLowerCase();
                      return t.key.toLowerCase().includes(q) || t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
                    }).map(term => (
                      <tr key={term.id} className={`hover:bg-slate-50 transition ${!term.isActive ? 'opacity-50 bg-slate-50/50' : ''}`}>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                          [{term.key}]
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {term.label}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {term.groupName}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                            {term.valueType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                            term.isMandatory ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {term.isMandatory ? 'SIM' : 'NÃO'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            term.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {term.isActive ? 'Ativo' : 'Desativado'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTerm(term);
                                setTermFormKey(term.key);
                                setTermFormLabel(term.label);
                                setTermFormDesc(term.description);
                                setTermFormGroup(term.groupName);
                                setTermFormValueType(term.valueType);
                                setTermFormIsMandatory(term.isMandatory);
                                setTermFormPhase(term.phase || 'Descoberta / Prova de Conceito');
                                setTermFormError('');
                                setIsNewTermModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                              title="Editar termo"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleTermActive(term.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                                term.isActive
                                  ? 'bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600'
                                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                              }`}
                              title={term.isActive ? 'Desativar termo preservando registros' : 'Reativar termo'}
                            >
                              {term.isActive ? 'Desativar' : 'Reativar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. MAIN WORKSPACE (Active by default: 1. Visão Geral) */}
      {activeTopTab === 'visao_geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDEBAR (FASES + GRUPOS DE ATIVIDADES) - lg:col-span-3 */}
          <div className="lg:col-span-3 space-y-5">
            
            {/* Card: FASES DO PROJETO */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                FASES DO PROJETO
              </h3>

              <div className="space-y-2.5">
                {phasesList.map((phase, idx) => {
                  const phaseNum = idx + 1;
                  const isSelected = selectedPhase === phase;
                  const progressPct = phaseProgressMap[phase] ?? 0;

                  return (
                    <div
                      key={phase}
                      onClick={() => {
                        setSelectedPhase(phase);
                        setSelectedGroupIndex(0);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/50 shadow-xs' 
                          : 'border-slate-150 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-5 h-5 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 ${
                            isSelected 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-emerald-600 text-white'
                          }`}>
                            {phaseNum}
                          </div>
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-950 font-black' : 'text-slate-800'}`}>
                            {phase}
                          </span>
                        </div>
                        <span className="text-xs font-black text-slate-700 shrink-0">
                          {progressPct}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isSelected ? 'bg-blue-600' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card: GRUPOS DE ATIVIDADES DA FASE */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  GRUPOS DE ATIVIDADES DA {selectedPhase.toUpperCase()}
                </h3>
              </div>

              {/* Botão Todos os Grupos (Item 1) */}
              <div
                onClick={() => setSelectedGroupIndex(-1)}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 select-none ${
                  selectedGroupIndex === -1
                    ? 'border-indigo-500 bg-indigo-50/90 font-black text-indigo-950 shadow-2xs'
                    : 'border-slate-150 bg-slate-50/60 hover:bg-slate-100/80 text-slate-700'
                }`}
                title="Visualizar e registrar atividades e notas de todos os grupos consolidados"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-5 h-5 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 ${
                    selectedGroupIndex === -1 ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}>
                    *
                  </div>
                  <span className="text-xs truncate font-bold">
                    Todos os Grupos ({selectedPhase})
                  </span>
                </div>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                  selectedGroupIndex === -1 ? 'text-indigo-700 bg-white border border-indigo-200' : 'text-slate-500 bg-white border border-slate-200'
                }`}>
                  {currentPhaseGroups.reduce((acc, g) => acc + g.microActivities.length, 0)} ativ.
                </span>
              </div>

              <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1 no-scrollbar">
                {currentPhaseGroups.map((group, idx) => {
                  const isSelected = selectedGroupIndex === idx;

                  return (
                    <div
                      key={group.name}
                      onClick={() => setSelectedGroupIndex(idx)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 select-none ${
                        isSelected 
                          ? 'border-blue-400 bg-blue-50/80 font-bold text-blue-950 shadow-2xs' 
                          : 'border-transparent hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-5 h-5 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {group.number}
                        </div>
                        <span className="text-xs truncate leading-snug">
                          {group.name}
                        </span>
                      </div>
                      <span className={`text-xs font-black shrink-0 ${
                        group.progress > 0 ? (isSelected ? 'text-blue-700' : 'text-slate-800') : 'text-slate-400'
                      }`}>
                        {group.progress}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* CENTER & RIGHT SECTION - lg:col-span-9 */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* JORNADA DO PROJETO - VISÃO GERAL DAS ATIVIDADES DA FASE */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
              
              {/* Stepper Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  JORNADA DO PROJETO – VISÃO GERAL DAS ATIVIDADES DA {selectedPhase.toUpperCase()}
                </h3>

                {/* Prev & Next arrows */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleScrollCarousel('left')}
                    className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition shadow-2xs cursor-pointer"
                    title="Anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => handleScrollCarousel('right')}
                    className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition shadow-2xs cursor-pointer"
                    title="Próximo"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Stepper Cards Horizontal Carousel (Item 4: O ícone da macroatividade é o único elemento ilustrativo no espaço principal) */}
              <div 
                ref={journeyScrollRef}
                className="overflow-x-auto pb-4 pt-1 flex gap-3.5 no-scrollbar scroll-smooth snap-x"
              >
                {currentPhaseGroups.slice(0, 8).map((group, idx) => {
                  const isSelected = selectedGroupIndex === idx;

                  return (
                    <div
                      key={group.name}
                      onClick={() => setSelectedGroupIndex(idx)}
                      className={`min-w-[175px] max-w-[190px] p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shrink-0 snap-start select-none ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/20 shadow-md ring-2 ring-blue-500/20' 
                          : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Number badge and Progress badge */}
                        <div className="flex items-center justify-between">
                          <div className={`w-5 h-5 rounded-full font-black text-[11px] flex items-center justify-center ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                          }`}>
                            {group.number}
                          </div>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                            group.progress === 100 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : group.progress > 0 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-slate-100 text-slate-500'
                          }`}>
                            {group.progress}%
                          </span>
                        </div>

                        {/* Group Title */}
                        <h4 className="text-xs font-black text-slate-900 leading-tight min-h-[32px]">
                          {group.name}
                        </h4>

                        {/* Bullet points */}
                        <ul className="text-[10px] text-slate-500 space-y-0.5 pt-1">
                          {group.defaultBullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="flex items-center gap-1.5 truncate">
                              <span className="text-slate-400">•</span>
                              <span className="truncate">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Espaço Principal: Ícone Exclusivo da Macroatividade (Item 4: sem ilustrações genéricas) */}
                      <div className="pt-3">
                        {(() => {
                          const IconComp = getMacroIconComponent(group.matchedMacro?.icon);
                          return (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (group.matchedMacro) {
                                  setSelectedMacroForIconEdit(group.matchedMacro);
                                  setIsMacroIconModalOpen(true);
                                }
                              }}
                              className={`h-20 rounded-xl border flex flex-col items-center justify-center relative group/iconcard cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-blue-100/60 border-blue-300 text-blue-700 shadow-inner'
                                  : 'bg-slate-50/80 hover:bg-blue-50/60 border-slate-200/80 text-blue-600'
                              }`}
                              title="Clique para personalizar o ícone desta macroatividade neste projeto"
                            >
                              <IconComp size={32} className="stroke-[2.2] transition-transform group-hover/iconcard:scale-110" />
                              <div className="mt-1 flex items-center gap-1 opacity-0 group-hover/iconcard:opacity-100 transition text-[9px] font-bold text-blue-700 bg-white/95 px-1.5 py-0.5 rounded shadow-2xs">
                                <Pencil size={8} /> Personalizar
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Connected Journey Line & Percentage Nodes (Matching reference line) */}
              <div className="relative pt-2 pb-1 overflow-x-auto no-scrollbar">
                <div className="min-w-[700px] relative">
                  {/* Continuous connector line */}
                  <div className="absolute top-[9px] left-8 right-6 h-0.5 bg-sky-200" />
                  {/* Arrowhead at the right end */}
                  <div className="absolute top-[5px] right-2 text-sky-500">
                    <ChevronRight size={14} className="stroke-[3]" />
                  </div>

                  {/* Percentage pills under each step */}
                  <div className="flex justify-between relative z-10 px-6">
                    {currentPhaseGroups.slice(0, 8).map((group, idx) => {
                      const isSelected = selectedGroupIndex === idx;

                      return (
                        <div key={group.name} className="flex flex-col items-center">
                          {/* Node circle on the line */}
                          <div className={`w-4 h-4 rounded-full border-2 bg-white transition-all ${
                            isSelected ? 'border-blue-600 ring-2 ring-blue-200 scale-125' : 'border-sky-400'
                          }`} />

                          {/* Percentage badge underneath */}
                          <div className={`mt-2 px-2 py-0.5 rounded-full text-[10px] font-black border transition-all ${
                            isSelected 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' 
                              : group.progress > 0 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {group.progress}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* ACTIVE GROUP DETAILS (Full width - interface simplificada sem painel lateral duplicado) */}
            <div className="w-full bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
                
                {/* Active Group Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-start gap-3.5">
                    <div className="relative group/icon flex items-center justify-center shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
                        {(() => {
                          const IconComp = getMacroIconComponent(activeGroup.matchedMacro?.icon);
                          return <IconComp size={22} className="text-white" />;
                        })()}
                      </div>
                      <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                        {activeGroup.number}
                      </div>
                      {activeGroup.matchedMacro && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMacroForIconEdit(activeGroup.matchedMacro || null);
                            setIsMacroIconModalOpen(true);
                          }}
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 flex items-center justify-center shadow-xs cursor-pointer opacity-90 hover:opacity-100 transition"
                          title="Alterar ícone da macroatividade neste projeto"
                        >
                          <Pencil size={10} />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                          {activeGroup.name}
                        </h2>
                        {renderStatusBadge(activeGroup.progress === 100 ? 'Concluída' : activeGroup.progress > 0 ? 'Em andamento' : 'Pendente')}
                      </div>
                      <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                        {activeGroup.description}
                      </p>
                    </div>
                  </div>

                  {/* Group Progress on the right */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <span>Progresso do grupo</span>
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                          style={{ width: `${activeGroup.progress}%` }}
                        />
                      </div>
                      <span className="font-black text-slate-900">{activeGroup.progress}%</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {activeGroup.completedCount} de {activeGroup.totalCount} atividades concluídas
                    </p>
                    <button
                      onClick={handleScrollToRegulatory}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 pt-1 cursor-pointer"
                    >
                      Ver orientação regulatória &rarr;
                    </button>
                  </div>
                </div>

                {/* Sub-Tabs Bar */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-150 pb-2">
                  <button
                    onClick={() => setGroupSubTab('atividades')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      groupSubTab === 'atividades'
                        ? 'bg-blue-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Atividades ({activeGroup.microActivities.length})
                  </button>
                  <button
                    onClick={() => setGroupSubTab('orientacoes')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      groupSubTab === 'orientacoes'
                        ? 'bg-blue-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Orientações e Guias ({activeRegulatory.guides.length})
                  </button>
                  <button
                    onClick={() => setGroupSubTab('documentos')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      groupSubTab === 'documentos'
                        ? 'bg-blue-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Documentos ({linkedMeetings.length + activeGroup.microActivities.filter(m => m.documentLink || m.reportLink).length + 2})
                  </button>
                  <button
                    onClick={() => setGroupSubTab('decisoes')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      groupSubTab === 'decisoes'
                        ? 'bg-blue-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Decisões ({activeRegulatory.decisions.length})
                  </button>
                  <button
                    onClick={() => setGroupSubTab('discussoes')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      groupSubTab === 'discussoes'
                        ? 'bg-blue-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Discussões ({linkedMeetings.length > 0 ? linkedMeetings.length : 2})
                  </button>
                </div>

                {/* Sub-Tab 1: ATIVIDADES TABLE (Item 1: Registro Rápido & Item 3: Edição Direta) */}
                {groupSubTab === 'atividades' && (
                  <div className="space-y-4">

                    {/* BARRA DE REGISTRO RÁPIDO (Item 1: Enter salva, Ctrl+Enter pula linha) */}
                    <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1">
                            <Zap size={13} className="text-amber-500 fill-amber-500" /> Registro Rápido
                          </span>
                          <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200">
                            {[
                              { id: 'tarefa', label: 'Tarefa Rápida' },
                              { id: 'nota', label: 'Nota' },
                              { id: 'observacao', label: 'Observação Técnica' }
                            ].map(t => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setQuickRegisterType(t.id as any)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                  quickRegisterType === t.id
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Se estiver em "Todos os Grupos", permite escolher a macroatividade de destino */}
                        {isAllGroups && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-[11px] font-bold text-slate-500">Destino:</span>
                            <select
                              value={quickRegisterMacroId || currentPhaseGroups[0]?.macroId}
                              onChange={(e) => setQuickRegisterMacroId(e.target.value)}
                              className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded-xl"
                            >
                              {currentPhaseGroups.map(g => (
                                <option key={g.macroId} value={g.macroId}>
                                  {g.number}. {g.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Text Input with Enter = Save, Ctrl+Enter = Newline */}
                      <div className="flex items-start gap-2">
                        <div className="flex-1 relative">
                          <textarea
                            ref={quickRegisterInputRef}
                            value={quickRegisterText}
                            onChange={(e) => setQuickRegisterText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (e.ctrlKey || e.metaKey) {
                                  // Ctrl + Enter: Insert newline without saving
                                  e.preventDefault();
                                  const start = e.currentTarget.selectionStart;
                                  const end = e.currentTarget.selectionEnd;
                                  const newText = quickRegisterText.substring(0, start) + '\n' + quickRegisterText.substring(end);
                                  setQuickRegisterText(newText);
                                  setTimeout(() => {
                                    if (quickRegisterInputRef.current) {
                                      quickRegisterInputRef.current.selectionStart = quickRegisterInputRef.current.selectionEnd = start + 1;
                                    }
                                  }, 0);
                                } else if (!e.shiftKey) {
                                  // Enter alone: Save immediately
                                  e.preventDefault();
                                  handleQuickRegisterItem();
                                }
                              }
                            }}
                            rows={1}
                            placeholder={
                              quickRegisterType === 'tarefa'
                                ? `Digite a nova microatividade/tarefa e pressione Enter para salvar...`
                                : quickRegisterType === 'observacao'
                                  ? `Digite a observação técnica e pressione Enter para salvar...`
                                  : `Digite a nota rápida e pressione Enter para salvar...`
                            }
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 resize-y min-h-[38px]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleQuickRegisterItem()}
                          disabled={!quickRegisterText.trim()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-2xs shrink-0 flex items-center gap-1.5 h-[38px]"
                        >
                          <Plus size={14} /> Salvar
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                        <span>
                          Atalhos: <strong className="text-slate-700 font-bold">Enter</strong> salva imediatamente • <strong className="text-slate-700 font-bold">Ctrl + Enter</strong> insere nova linha
                        </span>
                        <span>
                          Autor: <strong>{teamMembers[0]?.name || 'Bruna'}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150 pb-2">
                            <th className="py-2 px-3 w-12">#</th>
                            <th className="py-2 px-3">ATIVIDADE & OBSERVAÇÕES</th>
                            <th className="py-2 px-3">STATUS</th>
                            <th className="py-2 px-3">PRAZO</th>
                            <th className="py-2 px-3">RESPONSÁVEL</th>
                            <th className="py-2 px-3">REG.</th>
                            <th className="py-2 px-3 text-right">AÇÕES</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {activeGroup.microActivities.map((micro, mIdx) => {
                            const code = isAllGroups && (micro as any).groupNumber 
                              ? `${(micro as any).groupNumber}.${mIdx + 1}` 
                              : `${activeGroup.number}.${mIdx + 1}`;
                            const isReg = micro.generatesRegulatoryContent !== false;
                            const isDone = micro.status === 'Concluído e aprovado' || micro.status === 'Concluído com restrições';
                            const isApprovedReg = micro.regulatoryStatus === 'validada';
                            const isAdjustmentsReg = micro.regulatoryStatus === 'ajustes';
                            const isDiscardedReg = micro.regulatoryStatus === 'descartada';

                            return (
                              <tr 
                                key={micro.id} 
                                className={`transition group ${
                                  isDone 
                                    ? 'bg-emerald-50/70 hover:bg-emerald-100/70 border-l-4 border-l-emerald-600 shadow-2xs' 
                                    : 'hover:bg-slate-50/70 border-l-4 border-l-slate-200'
                                }`}
                              >
                                <td className="py-3 px-3 font-bold text-slate-500 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    {isDone && (
                                      <span title="Atividade operacionalmente concluída">
                                        <CheckCircle2 size={16} className="text-emerald-600 fill-emerald-100 shrink-0" />
                                      </span>
                                    )}
                                    <span className={isDone ? 'font-black text-emerald-900' : ''}>{code}</span>
                                  </div>
                                  {isAllGroups && (micro as any).groupName && (
                                    <span className="block text-[9px] text-indigo-600 font-extrabold truncate max-w-[70px]">
                                      {(micro as any).groupName}
                                    </span>
                                  )}
                                </td>
                                
                                {/* ATIVIDADE & OBSERVAÇÕES (Item 1 & Item 3) */}
                                <td className="py-3 px-3 min-w-[220px]">
                                  {inlineEditing?.id === micro.id && inlineEditing?.field === 'name' ? (
                                    <input
                                      type="text"
                                      defaultValue={micro.name}
                                      autoFocus
                                      onBlur={(e) => {
                                        const val = e.target.value.trim();
                                        if (val && val !== micro.name) {
                                          handleUpdateMicroField(micro.id, 'name', val);
                                        }
                                        setInlineEditing(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.currentTarget.blur();
                                        } else if (e.key === 'Escape') {
                                          setInlineEditing(null);
                                        }
                                      }}
                                      className="w-full px-2 py-1 text-xs font-bold border border-blue-400 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                                    />
                                  ) : (
                                    <div 
                                      onClick={() => setInlineEditing({ id: micro.id, field: 'name' })}
                                      className="cursor-pointer group/title flex items-center gap-1.5"
                                      title="Clique para editar o título diretamente"
                                    >
                                      {isDone && (
                                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                      )}
                                      <span className={`font-bold transition ${
                                        isDone ? 'text-emerald-950 font-black' : 'text-slate-900 group-hover/title:text-blue-700'
                                      }`}>
                                        {micro.name}
                                      </span>
                                      <Pencil size={11} className="text-slate-400 opacity-0 group-hover/title:opacity-100 transition shrink-0" />
                                    </div>
                                  )}

                                  {/* Observações editáveis diretamente com 1 clique */}
                                  {inlineEditing?.id === micro.id && inlineEditing?.field === 'observations' ? (
                                    <div className="mt-1">
                                      <textarea
                                        defaultValue={micro.observations || ''}
                                        autoFocus
                                        rows={2}
                                        onBlur={(e) => {
                                          const val = e.target.value.trim();
                                          if (val !== (micro.observations || '')) {
                                            handleUpdateMicroField(micro.id, 'observations', val);
                                          }
                                          setInlineEditing(null);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            if (e.ctrlKey) {
                                              // allow newline
                                            } else {
                                              e.preventDefault();
                                              e.currentTarget.blur();
                                            }
                                          } else if (e.key === 'Escape') {
                                            setInlineEditing(null);
                                          }
                                        }}
                                        placeholder="Digite as observações e pressione Enter para salvar..."
                                        className="w-full px-2 py-1 text-[11px] border border-blue-400 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                                      />
                                      <span className="text-[9px] text-slate-400 block mt-0.5">Enter salva • Ctrl+Enter insere nova linha</span>
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => setInlineEditing({ id: micro.id, field: 'observations' })}
                                      className="cursor-pointer group/obs mt-0.5 flex items-center gap-1"
                                      title="Clique para editar as observações diretamente"
                                    >
                                      <p className={`text-[11px] transition line-clamp-1 ${isDone ? 'text-emerald-700/80' : 'text-slate-400 group-hover/obs:text-slate-700'}`}>
                                        {micro.observations || <span className="italic text-slate-300 hover:text-blue-500">+ Adicionar observação...</span>}
                                      </p>
                                      <Pencil size={10} className="text-slate-300 opacity-0 group-hover/obs:opacity-100 transition shrink-0" />
                                    </div>
                                  )}
                                </td>

                                {/* STATUS (Item 1 & Item 3: Destaque visual nítido para atividades concluídas) */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <select
                                    value={micro.status}
                                    onChange={(e) => handleUpdateMicroField(micro.id, 'status', e.target.value as MicroActivityStatus)}
                                    className={`text-[11px] font-black rounded-xl px-2.5 py-1 border cursor-pointer outline-hidden transition ${
                                      micro.status === 'Concluído e aprovado'
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                        : micro.status === 'Concluído com restrições'
                                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                          : micro.status === 'Em andamento'
                                            ? 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200'
                                            : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                    }`}
                                    title="Clique para alterar status imediatamente"
                                  >
                                    <option value="Planejado">Planejado</option>
                                    <option value="Em andamento">Em andamento</option>
                                    <option value="Concluído e aprovado">✓ Concluído e aprovado</option>
                                    <option value="Concluído com restrições">✓ Concluído c/ restrições</option>
                                    <option value="Cancelado">Cancelado</option>
                                  </select>
                                </td>

                                {/* PRAZO */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <input
                                    type="date"
                                    value={micro.dueDate || ''}
                                    onChange={(e) => handleUpdateMicroField(micro.id, 'dueDate', e.target.value)}
                                    className="text-xs font-semibold text-slate-700 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-400 rounded-lg px-1.5 py-0.5 transition cursor-pointer"
                                    title="Clique para alterar o prazo"
                                  />
                                </td>

                                {/* RESPONSÁVEL */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <select
                                    value={micro.assignee || 'Bruna'}
                                    onChange={(e) => handleUpdateMicroField(micro.id, 'assignee', e.target.value)}
                                    className="text-xs font-bold text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-400 rounded-lg px-1.5 py-0.5 transition cursor-pointer"
                                    title="Clique para atribuir responsável"
                                  >
                                    {teamMembers.map(m => (
                                      <option key={m.id} value={m.name}>{m.name}</option>
                                    ))}
                                    {!teamMembers.some(m => m.name === micro.assignee) && micro.assignee && (
                                      <option value={micro.assignee}>{micro.assignee}</option>
                                    )}
                                  </select>
                                </td>

                                {/* STATUS REGULATÓRIO INDEPENDENTE (Item 1 & Item 3: Aprovado, Pendente, Em Ajustes ou Não Regulatório) */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  {isReg ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedUnifiedItem({
                                          id: `val_mic_${micro.id}`,
                                          originType: 'atividade',
                                          title: `Microatividade: ${micro.name}`,
                                          phase: selectedPhase,
                                          macroName: activeGroup.name,
                                          microId: micro.id,
                                          content: micro.observations || 'Atividade com insumo regulatório.',
                                          evidenceLink: micro.documentLink || micro.reportLink,
                                          author: micro.assignee || 'Equipe',
                                          date: micro.dueDate || 'Sem prazo',
                                          currentStatus: micro.regulatoryStatus || 'pendente',
                                          linkedTermKey: micro.regulatoryLinkedFieldKey,
                                          justification: micro.regulatoryJustification,
                                          operationalStatus: micro.status
                                        });
                                        setReviewAction(micro.regulatoryStatus === 'validada' ? 'aprovar' : (micro.regulatoryStatus === 'descartada' ? 'descartar' : 'aprovar'));
                                        setReviewTermKey(micro.regulatoryLinkedFieldKey || activeTermsList[0]?.key || '');
                                        setReviewTextValue(micro.observations || '');
                                        setReviewLinkValue(micro.documentLink || micro.reportLink || '');
                                        setReviewJustification(micro.regulatoryJustification || '');
                                        setUnifiedValidationModalOpen(true);
                                      }}
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                                        isApprovedReg
                                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                          : isAdjustmentsReg
                                            ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border border-indigo-300'
                                            : isDiscardedReg
                                              ? 'bg-slate-200 text-slate-600 hover:bg-slate-300 border border-slate-300'
                                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 animate-pulse'
                                      }`}
                                      title="Clique para abrir central de validação para esta atividade"
                                    >
                                      {isApprovedReg && <CheckCircle2 size={12} className="text-emerald-700" />}
                                      <span>
                                        {isApprovedReg ? 'Validado ✓' : isAdjustmentsReg ? 'Em Ajustes ⚠️' : isDiscardedReg ? 'Descartada' : 'Pendente ⏳'}
                                      </span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateMicroField(micro.id, 'generatesRegulatoryContent', true)}
                                      className="px-2 py-0.5 rounded-full text-[10px] text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                                      title="Clique para marcar como geradora de insumo regulatório"
                                    >
                                      Não aplicável
                                    </button>
                                  )}
                                </td>

                                {/* AÇÕES */}
                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleOpenMicroDetails(micro)}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                                      title="Abrir detalhes completos"
                                    >
                                      <ExternalLink size={14} />
                                    </button>

                                    {/* Discussion comments count */}
                                    <button
                                      onClick={() => handleOpenMicroDetails(micro)}
                                      className="p-1 text-slate-400 hover:text-blue-600 rounded-lg inline-flex items-center gap-0.5 text-[11px] font-bold cursor-pointer"
                                      title="Comentários"
                                    >
                                      <MessageSquare size={13} />
                                      <span>{mIdx === 0 ? 2 : mIdx === 1 || mIdx === 4 ? 1 : ''}</span>
                                    </button>

                                    {/* Quick toggle menu */}
                                    <button
                                      onClick={() => {
                                        const nextStatus: MicroActivityStatus = 
                                          micro.status === 'Concluído e aprovado' 
                                            ? 'Em andamento' 
                                            : micro.status === 'Em andamento' 
                                              ? 'Concluído e aprovado' 
                                              : 'Em andamento';
                                        handleQuickStatusChange(micro.id, nextStatus);
                                      }}
                                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                                      title="Alternar status rápido"
                                    >
                                      <MoreVertical size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* PRÓXIMAS AÇÕES DO GRUPO (Matching box under table) */}
                    <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <Target size={14} />
                          </div>
                          <h4 className="text-xs font-black text-slate-900">
                            Próximas ações do grupo ({nextActions.length})
                          </h4>
                        </div>
                        <button
                          onClick={() => setActiveTopTab('proximas_acoes')}
                          className="px-3 py-1 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 rounded-lg text-[11px] font-black transition cursor-pointer"
                        >
                          Ver todos
                        </button>
                      </div>

                      <div className="divide-y divide-slate-200/60 text-xs">
                        {nextActions.slice(0, 3).map((item, aIdx) => {
                          const dotColors = ['bg-amber-500', 'bg-blue-600', 'bg-purple-600'];
                          const dotColor = dotColors[aIdx % dotColors.length];

                          return (
                            <div key={item.micro.id} className="py-2.5 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-2.5 h-2.5 rounded-full ${dotColor} shrink-0`} />
                                <span className="font-bold text-slate-800 truncate">
                                  {item.micro.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-6 shrink-0">
                                <div className="text-[11px]">
                                  <span className="text-slate-400 font-semibold mr-1">PRAZO:</span>
                                  <span className="font-bold text-slate-700">
                                    {item.micro.dueDate ? item.micro.dueDate.split('-').reverse().join('/') : '15/09/2025'}
                                  </span>
                                </div>
                                <div className="text-[11px]">
                                  <span className="text-slate-400 font-semibold mr-1">RESPONSÁVEL:</span>
                                  <span className="font-bold text-slate-700">
                                    {item.micro.assignee || 'Bruna'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleOpenMicroDetails(item.micro)}
                                  className="text-[11px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                                >
                                  Abrir &rarr;
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {nextActions.length === 0 && (
                          <p className="py-3 text-[11px] text-slate-400 italic text-center">
                            Todas as atividades deste grupo foram concluídas com sucesso!
                          </p>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* Sub-Tab 2: ORIENTAÇÕES E GUIAS */}
                {groupSubTab === 'orientacoes' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Orientações Regulatórias e Normas Aplicáveis
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Diretrizes, pontos críticos e normas definidas pelo Líder no plano-base para <strong>{activeGroup.name}</strong>:
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddPointModalOpen(true)}
                          className="px-3 py-1.5 bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={13} /> Ponto de atenção
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddGuideModalOpen(true)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Plus size={13} /> Adicionar norma/guia
                        </button>
                      </div>
                    </div>

                    {/* Section 1: Pontos de Atenção Regulatória */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle size={15} />
                        <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          Pontos de Atenção Regulatória ({activeGroup.regulatoryPoints?.length || 0})
                        </h5>
                      </div>
                      <div className="space-y-2">
                        {(activeGroup.regulatoryPoints || []).map((pt, pIdx) => (
                          <div key={pIdx} className="p-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/40 flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                            <p className="text-xs font-medium text-slate-800 leading-relaxed">
                              {pt}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 2: Justificativas Técnicas Necessárias */}
                    {(activeGroup.technicalJustifications?.length || 0) > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Bookmark size={15} />
                          <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                            Justificativas Técnicas a Documentar ({activeGroup.technicalJustifications?.length || 0})
                          </h5>
                        </div>
                        <div className="space-y-2">
                          {(activeGroup.technicalJustifications || []).map((just, jIdx) => (
                            <div key={jIdx} className="p-3.5 rounded-2xl border border-blue-150 bg-blue-50/30 flex items-start gap-3">
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                              <p className="text-xs font-medium text-slate-800 leading-relaxed">
                                {just}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 3: Normas, Guias e Artigos de Referência */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <BookOpen size={15} />
                        <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          Normas, Guias e Artigos de Referência ({activeGroup.referenceGuides?.length || 0})
                        </h5>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(activeGroup.referenceGuides || []).map((guide, gIdx) => (
                          <div
                            key={gIdx}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition flex items-center justify-between gap-3 shadow-2xs group"
                          >
                            <div className="min-w-0">
                              <span className="text-xs font-black text-slate-900 block truncate group-hover:text-blue-700">
                                {guide.title}
                              </span>
                              {guide.link && (
                                <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                                  {guide.link.includes('sharepoint.com') ? 'Documento no SharePoint' : guide.link}
                                </span>
                              )}
                            </div>
                            {guide.link && (
                              <a
                                href={guide.link}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-blue-600 transition shrink-0"
                                title="Abrir referência"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 3: DOCUMENTOS */}
                {groupSubTab === 'documentos' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-600 font-medium">
                        Documentos, relatórios técnicos e links de apresentação vinculados:
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {/* Presentation link row */}
                      <div className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Presentation size={18} className="text-blue-600" />
                          <div>
                            <p className="text-xs font-bold text-slate-900">Apresentação Técnica do Grupo / Reunião</p>
                            <p className="text-[11px] text-slate-500">Slides de acompanhamento e alinhamento de resultados</p>
                          </div>
                        </div>
                        <a 
                          href="https://docs.google.com/presentation" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1 shadow-2xs"
                        >
                          Abrir apresentação &rarr;
                        </a>
                      </div>

                      {/* Attached protocols and certificates */}
                      <div className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="text-slate-500" />
                          <div>
                            <p className="text-xs font-bold text-slate-900">Protocolo de Produção e Liberação de Lote (POP-042)</p>
                            <p className="text-[11px] text-slate-400">PDF • 2.4 MB • Atualizado em 15/07/2025</p>
                          </div>
                        </div>
                        <button className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                          Visualizar
                        </button>
                      </div>

                      <div className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="text-slate-500" />
                          <div>
                            <p className="text-xs font-bold text-slate-900">Certificado de Análise Físico-Química (CoA - Lote 001)</p>
                            <p className="text-[11px] text-slate-400">PDF • 1.1 MB • Assinado por Helton</p>
                          </div>
                        </div>
                        <button className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                          Visualizar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 4: DECISÕES */}
                {groupSubTab === 'decisoes' && (
                  <div className="space-y-5">
                    {/* Summary Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Decisões e Justificativas Regulatórias do Grupo
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span>{activeGroup.decisionsList?.length || 0} questões cadastradas</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">
                            {(activeGroup.decisionsList || []).filter(d => d.status === 'Decidido').length} decididas
                          </span>
                          <span>•</span>
                          <span className="text-amber-700 font-bold">
                            {(activeGroup.decisionsList || []).filter(d => d.status === 'Pendente' || !d.status).length} a avaliar
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsNewDecisionModalOpen(true)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
                      >
                        <Plus size={14} /> Nova pergunta / decisão
                      </button>
                    </div>

                    {/* Decisions and Questions List */}
                    <div className="space-y-3">
                      {(activeGroup.decisionsList || []).map((decItem, dIdx) => {
                        const isDecided = decItem.status === 'Decidido';
                        const isUnderReview = decItem.status === 'Em avaliação';

                        return (
                          <div 
                            key={decItem.id || dIdx}
                            className={`p-4 rounded-2xl border transition-all space-y-3 ${
                              isDecided 
                                ? 'bg-white border-emerald-200 shadow-2xs' 
                                : isUnderReview 
                                  ? 'bg-blue-50/20 border-blue-200' 
                                  : 'bg-amber-50/20 border-amber-200/80'
                            }`}
                          >
                            {/* Card Top: Question & Status */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                                    isDecided ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                                  }`}>
                                    {dIdx + 1}
                                  </span>
                                  <h5 className="text-xs font-black text-slate-900 leading-snug">
                                    {decItem.question}
                                  </h5>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                  isDecided 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                    : isUnderReview 
                                      ? 'bg-blue-50 text-blue-700 border-blue-300' 
                                      : 'bg-amber-50 text-amber-700 border-amber-300'
                                }`}>
                                  {isDecided ? 'Decidido e documentado' : isUnderReview ? 'Em avaliação' : 'Pendente (A avaliar)'}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditDecision(decItem)}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-blue-600 transition cursor-pointer"
                                >
                                  {isDecided ? 'Editar' : 'Registrar decisão'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteDecision(decItem.id)}
                                  className="p-1 text-slate-300 hover:text-red-500 transition cursor-pointer"
                                  title="Excluir decisão"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Card Body: Decision, Justification, Evidence */}
                            {isDecided || decItem.decision || decItem.justification ? (
                              <div className="p-3 bg-slate-50/80 rounded-xl space-y-2 text-xs border border-slate-150">
                                {decItem.decision && (
                                  <div>
                                    <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wide">
                                      Decisão Tomada:
                                    </span>
                                    <p className="text-slate-900 font-semibold mt-0.5 leading-relaxed">
                                      {decItem.decision}
                                    </p>
                                  </div>
                                )}

                                {decItem.justification && (
                                  <div>
                                    <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wide">
                                      Justificativa Técnica:
                                    </span>
                                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                                      {decItem.justification}
                                    </p>
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 text-[11px]">
                                  <div className="flex items-center gap-4 text-slate-500">
                                    {decItem.responsible && (
                                      <span>Responsável: <strong className="text-slate-800">{decItem.responsible}</strong></span>
                                    )}
                                    {decItem.date && (
                                      <span>Data: <strong className="text-slate-800">{decItem.date.split('-').reverse().join('/')}</strong></span>
                                    )}
                                  </div>

                                  {(decItem.evidenceLink || decItem.sharepointDocUrl) && (
                                    <a
                                      href={decItem.evidenceLink || decItem.sharepointDocUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline"
                                    >
                                      <LinkIcon size={12} /> Evidência / SharePoint &rarr;
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100 flex items-center justify-between gap-3 text-xs">
                                <p className="text-amber-800 leading-snug">
                                  Orientação do plano-base pendente de resposta. O gestor pode registrar a decisão técnica e vincular referências científicas ou do SharePoint.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditDecision(decItem)}
                                  className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition shrink-0 cursor-pointer shadow-2xs"
                                >
                                  Responder
                                </button>
                              </div>
                            )}

                          </div>
                        );
                      })}

                      {(activeGroup.decisionsList || []).length === 0 && (
                        <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl">
                          <p className="text-xs text-slate-400">
                            Nenhuma decisão ou pergunta estratégica cadastrada para este grupo. Clique em "+ Nova pergunta / decisão" para registrar.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-Tab 5: DISCUSSÕES */}
                {groupSubTab === 'discussoes' && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Bruna</span>
                          <span className="text-[10px] text-slate-400">Ontem às 14:30</span>
                        </div>
                        <p className="text-slate-600">
                          Ajustamos a especificação de pureza por SEC-HPLC para manter limite mínimo de 95% para os lotes pré-clínicos.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Helton</span>
                          <span className="text-[10px] text-slate-400">12/08/2025 às 10:15</span>
                        </div>
                        <p className="text-slate-600">
                          Os dados de caracterização foram incluídos na pauta da reunião semanal com a coordenação regulatória.
                        </p>
                      </div>
                    </div>

                    {/* Add note input (Item 1: Enter salva imediatamente, Ctrl+Enter quebra linha) */}
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <textarea
                          value={newDiscussionComment}
                          onChange={e => setNewDiscussionComment(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              if (e.ctrlKey || e.metaKey) {
                                // Ctrl+Enter: Insert newline
                                e.preventDefault();
                                const start = e.currentTarget.selectionStart;
                                const end = e.currentTarget.selectionEnd;
                                const newText = newDiscussionComment.substring(0, start) + '\n' + newDiscussionComment.substring(end);
                                setNewDiscussionComment(newText);
                              } else if (!e.shiftKey) {
                                // Enter alone: save immediately
                                e.preventDefault();
                                handleAddNewDiscussionComment();
                              }
                            }
                          }}
                          rows={1}
                          placeholder="Adicionar nota ou comentário sobre o grupo... (Enter para salvar)"
                          className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 resize-y min-h-[38px]"
                        />
                        <button
                          onClick={handleAddNewDiscussionComment}
                          disabled={!newDiscussionComment.trim()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs shrink-0 flex items-center gap-1.5 h-[38px]"
                        >
                          <Send size={13} /> Comentar
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Atalhos: <strong className="text-slate-600 font-bold">Enter</strong> salva • <strong className="text-slate-600 font-bold">Ctrl + Enter</strong> quebra linha
                      </p>
                    </div>
                  </div>
                )}

              </div>

          </div>

        </div>
      )}

      {/* MODAL: ACTIVITY DETAILS & EDITING */}
      {isActivityModalOpen && selectedMicro && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider">
                  Detalhes da Atividade
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {selectedMicro.name}
                </h3>
              </div>
              <button 
                onClick={() => setIsActivityModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Status & Assignee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editingMicroData.status || 'Planejado'}
                    onChange={e => setEditingMicroData({ ...editingMicroData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                  >
                    <option value="Planejado">Planejado / Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluído e aprovado">Concluído e aprovado</option>
                    <option value="Concluído com restrições">Concluído com restrições</option>
                    <option value="A repetir / retrabalho">A repetir / retrabalho</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Responsável</label>
                  <select
                    value={editingMicroData.assignee || 'Bruna'}
                    onChange={e => setEditingMicroData({ ...editingMicroData, assignee: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                  >
                    {teamMembers.length > 0 ? (
                      teamMembers.map(tm => (
                        <option key={tm.id} value={tm.name}>{tm.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="Bruna">Bruna</option>
                        <option value="Helton">Helton</option>
                        <option value="Graziella">Graziella</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Deadline & Regulatory Impact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prazo de Conclusão</label>
                  <input
                    type="date"
                    value={editingMicroData.dueDate || ''}
                    onChange={e => setEditingMicroData({ ...editingMicroData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Impacto Regulatório (REG.)</label>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="generatesReg"
                        checked={editingMicroData.generatesRegulatoryContent !== false}
                        onChange={() => setEditingMicroData({ ...editingMicroData, generatesRegulatoryContent: true })}
                      />
                      <span>Sim</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-600">
                      <input
                        type="radio"
                        name="generatesReg"
                        checked={editingMicroData.generatesRegulatoryContent === false}
                        onChange={() => setEditingMicroData({ ...editingMicroData, generatesRegulatoryContent: false })}
                      />
                      <span>Não</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Presentation Link (Feature requested in prompt 1 & 2) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Presentation size={14} className="text-blue-600" />
                  Link de Apresentação (Slides / Canva / Drive)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={presentationLinkInput}
                    onChange={e => setPresentationLinkInput(e.target.value)}
                    placeholder="https://docs.google.com/presentation/d/..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                  {presentationLinkInput && (
                    <a
                      href={presentationLinkInput}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-slate-100 hover:bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center cursor-pointer"
                      title="Testar link"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>

              {/* Document / Report link */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Paperclip size={14} className="text-slate-500" />
                  Link do Documento / Relatório Técnico
                </label>
                <input
                  type="text"
                  value={editingMicroData.reportLink || ''}
                  onChange={e => setEditingMicroData({ ...editingMicroData, reportLink: e.target.value })}
                  placeholder="https://sharepoint.com/relatorios/..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Observations */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Observações e Notas</label>
                <textarea
                  value={editingMicroData.observations || ''}
                  onChange={e => setEditingMicroData({ ...editingMicroData, observations: e.target.value })}
                  rows={3}
                  placeholder="Detalhes técnicos, justificativas e informações de controle..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveMicroActivity}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={14} /> Salvar Alterações
              </button>
            </div>

          </div>
        </div>
      )}

      {/* COMPLETE MODAL WITH DELIVERABLE */}
      {isCompleteModalOpen && selectedMicro && (
        <CompleteActivityModal
          isOpen={isCompleteModalOpen}
          microActivity={selectedMicro}
          onClose={() => setIsCompleteModalOpen(false)}
          onConfirm={(microId, docLink) => {
            const today = new Date().toISOString().split('T')[0];
            const updatedMicro: MicroActivity = {
              ...selectedMicro,
              status: 'Concluído e aprovado',
              progress: 100,
              completionDate: today,
              reportLink: docLink || selectedMicro.reportLink
            };

            const updatedMacros = (project.macroActivities || []).map(macro => {
              const hasMicro = (macro.microActivities || []).some(m => m.id === updatedMicro.id);
              if (hasMicro) {
                const nextMicros = macro.microActivities.map(m => m.id === updatedMicro.id ? updatedMicro : m);
                return { ...macro, microActivities: nextMicros };
              }
              return macro;
            });

            onUpdateProject({ ...project, macroActivities: updatedMacros });
            setIsCompleteModalOpen(false);
          }}
        />
      )}

      {/* DECISION EDIT MODAL (Item 6: Interface Compacta com Configurações Adicionais Recolhidas) */}
      {isDecisionModalOpen && editingDecision && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-3">
              <div>
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider block">
                  Decisão Estratégica • {activeGroup.name}
                </span>
                <h3 className="text-base font-black text-slate-900 leading-snug mt-0.5">
                  {editingDecision.question}
                </h3>
              </div>
              <button 
                onClick={() => setIsDecisionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* 1. Status da Decisão (4 pills compactas) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status da Decisão</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Pendente', 'Em avaliação', 'Decidido', 'Validado'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setDecisionFormStatus(st)}
                      className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        decisionFormStatus === st
                          ? st === 'Validado'
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-black'
                            : st === 'Decidido'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-black'
                              : st === 'Em avaliação'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-black'
                                : 'bg-amber-500 text-white border-amber-500 shadow-2xs font-black'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Resposta ou Decisão Tomada */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Resposta ou Decisão Tomada <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={decisionFormAnswer}
                  onChange={e => setDecisionFormAnswer(e.target.value)}
                  autoFocus
                  rows={3}
                  placeholder="Descreva de forma clara a decisão técnica validada ou resposta adotada para este marco..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              {/* 3. Justificativa Técnica ou Científica */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Justificativa Técnica ou Científica
                </label>
                <textarea
                  value={decisionFormJustification}
                  onChange={e => setDecisionFormJustification(e.target.value)}
                  rows={2}
                  placeholder="Fundamentação técnico-científica, dados pré-clínicos ou referências da literatura que embasam esta escolha..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              {/* 4. Link de Referência ou Evidência (Opcional) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <LinkIcon size={13} className="text-blue-600" />
                  Link de Referência ou Evidência (Opcional)
                </label>
                <input
                  type="url"
                  value={decisionFormLink}
                  onChange={e => setDecisionFormLink(e.target.value)}
                  placeholder="https://ctvacinas.sharepoint.com/... ou link de artigo PubMed"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              {/* 5. Configurações Adicionais (Recolhidas por padrão via Accordion) */}
              <div className="pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowAdditionalSettings(!showAdditionalSettings)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sliders size={13} className="text-blue-600" />
                    <span>Configurações adicionais (herdados do plano-base)</span>
                  </span>
                  {showAdditionalSettings ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {showAdditionalSettings && (
                  <div className="mt-3 p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3.5 animate-in fade-in duration-200">
                    
                    {/* Pergunta customizável */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Texto da Pergunta / Decisão</label>
                      <input
                        type="text"
                        value={decisionFormQuestion}
                        onChange={e => setDecisionFormQuestion(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Impacto Regulatório & Obrigatoriedade */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 text-[11px]">Impacto regulatório:</span>
                          <p className="text-[10px] text-slate-400">Relevante para a Anvisa</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDecisionFormRegulatoryImpact(!decisionFormRegulatoryImpact)}
                          className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                            decisionFormRegulatoryImpact
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {decisionFormRegulatoryImpact ? 'Sim' : 'Não'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 text-[11px]">Decisão obrigatória:</span>
                          <p className="text-[10px] text-slate-400">Exigida para marco</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDecisionFormMandatory(!decisionFormMandatory)}
                          className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                            decisionFormMandatory
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {decisionFormMandatory ? 'Sim' : 'Opcional'}
                        </button>
                      </div>
                    </div>

                    {/* Campo de Destino na Base Regulatória */}
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-black text-blue-950 flex items-center gap-1.5 text-xs">
                          <Database size={13} className="text-blue-600" />
                          Campo de Destino na Base Regulatória
                        </label>
                        <span className="text-[10px] text-blue-700 font-bold">
                          Alimenta automaticamente Docs
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block mb-1">Selecionar entre campos padrão:</span>
                          <select
                            value={decisionFormTargetFieldKey}
                            onChange={e => {
                              const val = e.target.value;
                              setDecisionFormTargetFieldKey(val);
                              for (const grp of STANDARD_REGULATORY_GROUPS) {
                                const f = grp.fields.find(field => field.key === val);
                                if (f) {
                                  setDecisionFormTargetFieldLabel(f.label);
                                  break;
                                }
                              }
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
                          >
                            <option value="">-- Nenhum campo vinculado --</option>
                            {STANDARD_REGULATORY_GROUPS.map(grp => (
                              <optgroup key={grp.groupName} label={grp.groupName}>
                                {grp.fields.map(f => (
                                  <option key={f.key} value={f.key}>
                                    [{f.key}] {f.label}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block mb-1">Ou chave customizada:</span>
                          <input
                            type="text"
                            value={decisionFormTargetFieldKey}
                            onChange={e => {
                              setDecisionFormTargetFieldKey(e.target.value);
                              if (!decisionFormTargetFieldLabel) {
                                setDecisionFormTargetFieldLabel(e.target.value);
                              }
                            }}
                            placeholder="Ex: NOME_DA_VACINA"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-mono uppercase bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Responsável & Data */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1 text-[11px]">Responsável</label>
                        <select
                          value={decisionFormResponsible}
                          onChange={e => setDecisionFormResponsible(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
                        >
                          {teamMembers.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                          {!teamMembers.some(m => m.name === decisionFormResponsible) && decisionFormResponsible && (
                            <option value={decisionFormResponsible}>{decisionFormResponsible}</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1 text-[11px]">Data da Decisão</label>
                        <input
                          type="date"
                          value={decisionFormDate}
                          onChange={e => setDecisionFormDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
                        />
                      </div>
                    </div>

                    {/* Normas Vinculadas */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                        Normas e Guias Vinculados
                      </label>
                      <div className="max-h-28 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200 space-y-1">
                        {allAvailableStandards.map(std => {
                          const isChecked = decisionFormLinkedStandards.includes(std.id);
                          const displayName = std.name || `${std.code || ''} ${std.title || ''}`.trim();
                          return (
                            <label key={std.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setDecisionFormLinkedStandards([...decisionFormLinkedStandards, std.id]);
                                  } else {
                                    setDecisionFormLinkedStandards(decisionFormLinkedStandards.filter(id => id !== std.id));
                                  }
                                }}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              {std.code && <span className="font-bold text-slate-800 shrink-0">{std.code}</span>}
                              <span className="text-slate-600 truncate">{displayName}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDecisionModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveDecisionForm}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={14} /> Salvar Decisão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW DECISION MODAL */}
      {isNewDecisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider">
                  Nova Pergunta / Decisão Estratégica
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {activeGroup.name}
                </h3>
              </div>
              <button 
                onClick={() => setIsNewDecisionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-700 block">
                Pergunta ou decisão que precisa ser avaliada:
              </label>
              <textarea
                value={newDecisionQuestion}
                onChange={e => setNewDecisionQuestion(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNewDecision();
                  }
                }}
                rows={3}
                placeholder="Ex: Qual a justificativa para a via de administração e o esquema de doses? (Enter para salvar, Ctrl+Enter para quebra de linha)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                autoFocus
              />
              <p className="text-[11px] text-slate-400">
                Pressione Enter para salvar imediatamente ou Ctrl + Enter para inserir uma quebra de linha.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewDecisionModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddNewDecision}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
              >
                Adicionar Questão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD GUIDE MODAL (Item 5: Selecionar norma existente vs Cadastrar referência manualmente) */}
      {isAddGuideModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider">
                  Macroatividade: {activeGroup.name}
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Adicionar Norma, Guia ou Referência Regulatória
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsAddGuideModalOpen(false);
                  setGuideSearchQuery('');
                  setNewGuideTitle('');
                  setNewGuideLink('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setGuideModalMode('catalog')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  guideModalMode === 'catalog'
                    ? 'bg-white text-blue-900 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen size={14} className={guideModalMode === 'catalog' ? 'text-blue-600' : 'text-slate-400'} />
                Selecionar norma existente ({allAvailableStandards.length})
              </button>
              <button
                type="button"
                onClick={() => setGuideModalMode('manual')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  guideModalMode === 'manual'
                    ? 'bg-white text-blue-900 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LinkIcon size={14} className={guideModalMode === 'manual' ? 'text-blue-600' : 'text-slate-400'} />
                Cadastrar referência manualmente
              </button>
            </div>

            {guideModalMode === 'catalog' ? (
              <div className="space-y-3">
                {/* Search input */}
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={guideSearchQuery}
                    onChange={e => setGuideSearchQuery(e.target.value)}
                    placeholder="Pesquisar norma por código, tema, órgão (Anvisa, OMS...) ou título..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                    autoFocus
                  />
                </div>

                {/* Standards list */}
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                  {filteredProjectStandards.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      Nenhuma norma encontrada para "{guideSearchQuery}".
                    </div>
                  ) : (
                    filteredProjectStandards.map(std => {
                      const displayName = std.name || `${std.code || ''} ${std.title || ''}`.trim();
                      const linkUrl = std.documentLink || std.link || std.pdfUrl;

                      return (
                        <div
                          key={std.id}
                          className="pt-2 first:pt-0 p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition flex items-start justify-between gap-3 group"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {std.code && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-black text-[10px]">
                                  {std.code}
                                </span>
                              )}
                              {std.type && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold text-[10px]">
                                  {std.type}
                                </span>
                              )}
                              {std.theme && (
                                <span className="text-[10px] text-slate-400">
                                  • {std.theme}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-900 leading-snug">
                              {displayName}
                            </h4>
                            {std.summary && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                {std.summary}
                              </p>
                            )}
                            {linkUrl && (
                              <a
                                href={linkUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                              >
                                <ExternalLink size={10} /> Link oficial da norma
                              </a>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleLinkExistingStandardToMacro(std)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-2xs shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <Check size={12} /> Vincular
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nome / Título da Referência <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newGuideTitle}
                    onChange={e => setNewGuideTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveNewGuide();
                      }
                    }}
                    placeholder="Ex: RDC Anvisa nº 55/2010 ou Artigo Nature 2024 (Pressione Enter para salvar)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pressione Enter para salvar imediatamente.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Link de Acesso (Não exige anexo)
                  </label>
                  <input
                    type="url"
                    value={newGuideLink}
                    onChange={e => setNewGuideLink(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveNewGuide();
                      }
                    }}
                    placeholder="https://www.gov.br/anvisa ou https://ctvacinas.sharepoint.com/..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Preserva o sigilo de documentos armazenados em ambientes restritos registrando apenas o link de acesso.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddGuideModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewGuide}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
                  >
                    Salvar Referência
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD POINT MODAL */}
      {isAddPointModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Adicionar Ponto de Atenção Regulatória
              </h3>
              <button 
                onClick={() => setIsAddPointModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-700 block">
                Descrição do ponto de atenção:
              </label>
              <textarea
                value={newPointText}
                onChange={e => setNewPointText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveNewPoint();
                  }
                }}
                rows={3}
                placeholder="Ex: Validação rigorosa dos métodos analíticos de quantificação de endotoxinas... (Enter para salvar)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
                autoFocus
              />
              <p className="text-[10px] text-slate-400">
                Pressione Enter para salvar imediatamente ou Ctrl + Enter para inserir quebra de linha.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddPointModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNewPoint}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
              >
                Salvar Ponto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEETING DETAILS MODAL (Item 8: "não basta informar que uma reunião ocorreu: abrir seus detalhes") */}
      {selectedMeetingForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider">
                  Ata e Deliberações da Reunião
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {selectedMeetingForModal.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Data: {selectedMeetingForModal.date} às {selectedMeetingForModal.time || '10:00'} | Local: {selectedMeetingForModal.location || 'CTVacinas'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedMeetingForModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Participants & Moderator */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-slate-700">
                  <strong>Moderador:</strong> {selectedMeetingForModal.moderator}
                </p>
                <p className="text-slate-600">
                  <strong>Participantes:</strong> {(selectedMeetingForModal.participants || []).join(', ') || 'Equipe CTVacinas'}
                </p>
                {selectedMeetingForModal.presentationLink && (
                  <div className="pt-1">
                    <a
                      href={selectedMeetingForModal.presentationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 font-bold inline-flex items-center gap-1.5 hover:underline"
                    >
                      <Presentation size={13} /> Acessar Link de Apresentação &rarr;
                    </a>
                  </div>
                )}
              </div>

              {/* General Conclusions */}
              {selectedMeetingForModal.generalConclusions && (
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px]">Conclusões Gerais e Deliberações:</h4>
                  <p className="text-slate-700 bg-blue-50/50 p-3 rounded-xl border border-blue-200/60 leading-relaxed italic">
                    "{selectedMeetingForModal.generalConclusions}"
                  </p>
                </div>
              )}

              {/* Agenda items */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
                  Pautas e Itens Discutidos ({selectedMeetingForModal.agendaItems?.length || 0}):
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(selectedMeetingForModal.agendaItems || []).map((pauta, pIdx) => (
                    <div key={pauta.id || pIdx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900">{pIdx + 1}. {pauta.title}</span>
                        {pauta.hasRegulatoryImpact && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                            Impacto Regulatório
                          </span>
                        )}
                      </div>
                      {pauta.description && (
                        <p className="text-slate-600 text-[11px]">{pauta.description}</p>
                      )}
                      {pauta.decisions && (
                        <p className="text-emerald-800 font-medium text-[11px] bg-emerald-50/50 p-2 rounded-lg border border-emerald-200/50">
                          <strong>Decisão tomada:</strong> {pauta.decisions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedMeetingForModal(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CONTRIBUTION MODAL (Item 9) */}
      {isAddContributionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-black text-purple-600 uppercase tracking-wider">
                  Central de Triagem
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Registrar Nova Contribuição
                </h3>
              </div>
              <button 
                onClick={() => setIsAddContributionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título / Assunto</label>
                <input
                  type="text"
                  value={newContribTitle}
                  onChange={e => setNewContribTitle(e.target.value)}
                  placeholder="Ex: Resultados preliminares de endotoxina do Lote 003"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Origem da Informação</label>
                <select
                  value={newContribSource}
                  onChange={e => setNewContribSource(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
                >
                  <option value="reunião">Reunião técnica ou administrativa</option>
                  <option value="discussão técnica">Discussão técnica / Bancada</option>
                  <option value="atividade">Atividade / Microatividade</option>
                  <option value="observação">Observação de campo / Outro</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descrição / Conteúdo Técnico</label>
                <textarea
                  value={newContribContent}
                  onChange={e => setNewContribContent(e.target.value)}
                  rows={3}
                  placeholder="Descreva a informação relevante, dados analíticos ou observação obtida..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Link de Acesso ou Evidência (Opcional)</label>
                <input
                  type="url"
                  value={newContribLink}
                  onChange={e => setNewContribLink(e.target.value)}
                  placeholder="https://ctvacinas.sharepoint.com/... ou link de drive"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddContributionModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNewContribution}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
              >
                Registrar Contribuição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRIAGE CONTRIBUTION MODAL (Item 9: Avaliar relevância, vincular a macro/decisão/base regulatória) */}
      {isTriageModalOpen && selectedContribForTriage && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-black text-purple-600 uppercase tracking-wider">
                  Triagem e Vinculação Regulatória
                </span>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {selectedContribForTriage.title}
                </h3>
              </div>
              <button 
                onClick={() => setIsTriageModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                {selectedContribForTriage.content}
              </div>

              {/* Triage Action */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ação de Triagem</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'validar', label: 'Validar para a Base' },
                    { id: 'revisao', label: 'Solicitar Revisão' },
                    { id: 'descartar', label: 'Descartar' }
                  ].map(act => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setTriageAction(act.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        triageAction === act.id
                          ? act.id === 'validar'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : act.id === 'descartar'
                              ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                              : 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {triageAction !== 'descartar' && (
                <>
                  {/* Select Phase */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Vincular à Fase</label>
                    <select
                      value={triagePhase}
                      onChange={e => setTriagePhase(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
                    >
                      {phasesList.map(phase => (
                        <option key={phase} value={phase}>{phase}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Target Regulatory Fields (can feed multiple fields!) */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Selecionar Campo(s) da Base Regulatória a alimentar:
                    </label>
                    <div className="max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      {STANDARD_REGULATORY_GROUPS.flatMap(g => g.fields).map(f => {
                        const isChecked = triageFieldKeys.includes(f.key);
                        return (
                          <label key={f.key} className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setTriageFieldKeys([...triageFieldKeys, f.key]);
                                } else {
                                  setTriageFieldKeys(triageFieldKeys.filter(k => k !== f.key));
                                }
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="font-mono text-[10px] text-blue-700 font-bold">[{f.key}]</span>
                            <span className="text-slate-800 font-semibold truncate">{f.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Justification */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Justificativa / Parecer Técnico do Gestor
                </label>
                <textarea
                  value={triageJustification}
                  onChange={e => setTriageJustification(e.target.value)}
                  rows={2}
                  placeholder={triageAction === 'descartar' ? 'Justifique por que esta contribuição não possui relevância regulatória...' : 'Justifique a validação e impacto técnico para a Base Regulatória...'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTriageModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleTriageContributionSubmit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
              >
                Concluir Triagem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MANUAL HISTORY MILESTONE MODAL (Item 8) */}
      {isAddHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Registrar Marco ou Nota no Histórico
              </h3>
              <button 
                onClick={() => setIsAddHistoryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tipo de Evento</label>
                <select
                  value={newHistoryType}
                  onChange={e => setNewHistoryType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
                >
                  <option value="marco">Marco do Projeto</option>
                  <option value="regulatorio">Comunicação / Parecer Anvisa</option>
                  <option value="decisao">Decisão Estratégica Externa</option>
                  <option value="outro">Anotação Geral da Gestão</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Título do Evento</label>
                <input
                  type="text"
                  value={newHistoryTitle}
                  onChange={e => setNewHistoryTitle(e.target.value)}
                  placeholder="Ex: Parecer favorável do Comitê de Ética CONEP"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descrição / Detalhes</label>
                <textarea
                  value={newHistoryDesc}
                  onChange={e => setNewHistoryDesc(e.target.value)}
                  rows={3}
                  placeholder="Detalhes adicionais sobre o marco alcançado..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddHistoryModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveManualHistoryEvent}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
              >
                Salvar no Histórico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT-LEVEL MACRO ICON PICKER MODAL (Item 4: Permitir que o gestor altere o ícone no projeto específico, sem modificar o plano-base) */}
      {isMacroIconModalOpen && selectedMacroForIconEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider">
                  Personalização Visual da Jornada
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Selecionar Ícone da Macroatividade
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Macroatividade: <strong className="text-slate-800">{selectedMacroForIconEdit.name}</strong>
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsMacroIconModalOpen(false);
                  setSelectedMacroForIconEdit(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200/50 text-xs text-blue-900 flex items-center gap-2">
              <span className="font-bold shrink-0">Nota:</span>
              <span>
                Esta alteração será aplicada exclusivamente a este projeto, sem modificar o modelo do plano-base original.
              </span>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['Todos', 'Laboratório', 'Produção', 'Clínico', 'Documentação', 'Qualidade', 'Estabilidade', 'Segurança'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setProjectIconCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    projectIconCategoryFilter === cat
                      ? 'bg-blue-600 text-white shadow-2xs font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Icons Grid */}
            <div className="max-h-72 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-1">
              {AVAILABLE_MACRO_ICONS.filter(opt => {
                const isMacroInVivo = selectedMacroForIconEdit.name.toLowerCase().includes('in vivo') || 
                                     selectedMacroForIconEdit.name.toLowerCase().includes('animal') || 
                                     selectedMacroForIconEdit.name.toLowerCase().includes('roedores');
                if (opt.isInVivoOnly && !isMacroInVivo) return false;
                if (projectIconCategoryFilter !== 'Todos' && opt.category !== projectIconCategoryFilter) return false;
                return true;
              }).map(opt => {
                const IconComponent = opt.icon;
                const isCurrent = selectedMacroForIconEdit.icon === opt.key;

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleUpdateMacroIcon(opt.key)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col items-center gap-2 text-center cursor-pointer ${
                      isCurrent
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <IconComponent size={20} />
                    </div>
                    <div className="w-full">
                      <span className="text-xs font-black text-slate-900 block truncate">
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {opt.category}
                      </span>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        Ativo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsMacroIconModalOpen(false);
                  setSelectedMacroForIconEdit(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED REGULATORY VALIDATION REVIEW MODAL (Item 3 & Item 5) */}
      {unifiedValidationModalOpen && selectedUnifiedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    selectedUnifiedItem.originType === 'atividade'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : selectedUnifiedItem.originType === 'decisao'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {selectedUnifiedItem.originType === 'atividade' ? 'Microatividade' : selectedUnifiedItem.originType === 'decisao' ? 'Decisão Técnica' : 'Contribuição'}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-500">{selectedUnifiedItem.phase}</span>
                </div>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {selectedUnifiedItem.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Macroatividade: <strong className="text-slate-700">{selectedUnifiedItem.macroName}</strong> • Autor: <strong className="text-slate-700">{selectedUnifiedItem.author}</strong> ({selectedUnifiedItem.date})
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUnifiedValidationModalOpen(false);
                  setSelectedUnifiedItem(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Principle banner: Independence */}
            <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center gap-2 text-xs text-blue-900">
              <ShieldCheck size={16} className="text-blue-600 shrink-0" />
              <span>
                <strong>Independência Regulatória:</strong> A validação regulatória é independente da conclusão operacional. O item pode estar em andamento na bancada e ter sua evidência já apreciada e vinculada à Matriz.
              </span>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 space-y-5 overflow-y-auto text-xs">
              
              {/* Origin Context & Content */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Conteúdo Registrado na Origem</span>
                  <div className="flex items-center gap-2">
                    {selectedUnifiedItem.operationalStatus && (
                      <span className="px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded-md font-bold text-[10px]">
                        Op: {selectedUnifiedItem.operationalStatus}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      selectedUnifiedItem.currentStatus === 'validada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedUnifiedItem.currentStatus === 'ajustes'
                          ? 'bg-amber-100 text-amber-800'
                          : selectedUnifiedItem.currentStatus === 'descartada'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      Reg: {selectedUnifiedItem.currentStatus}
                    </span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedUnifiedItem.content || <em className="text-slate-400">Nenhum detalhamento textual informado na origem.</em>}
                </div>
                {selectedUnifiedItem.evidenceLink && (
                  <div className="flex items-center gap-2 pt-1 text-blue-600">
                    <ExternalLink size={13} className="shrink-0" />
                    <span className="font-bold">Evidência anexada:</span>
                    <a
                      href={selectedUnifiedItem.evidenceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate hover:underline font-semibold"
                    >
                      {selectedUnifiedItem.evidenceLink}
                    </a>
                  </div>
                )}
              </div>

              {/* Action Selection (Item 3: aprovar, devolver para ajustes, descartar) */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block text-xs">
                  Decisão da Coordenação Regulatória <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setReviewAction('aprovar')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      reviewAction === 'aprovar'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={16} className={reviewAction === 'aprovar' ? 'text-emerald-600' : 'text-slate-400'} />
                      <span className="text-xs font-black">Aprovar e Vincular</span>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">Alimenta a base e a matriz consolidada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('ajustes')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      reviewAction === 'ajustes'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <AlertCircle size={16} className={reviewAction === 'ajustes' ? 'text-amber-600' : 'text-slate-400'} />
                      <span className="text-xs font-black">Devolver p/ Ajustes</span>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">Requer complemento de dados ou evidência</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('descartar')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      reviewAction === 'descartar'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Trash2 size={16} className={reviewAction === 'descartar' ? 'text-rose-600' : 'text-slate-400'} />
                      <span className="text-xs font-black">Rejeitar / Descartar</span>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">Sem relevância para os requisitos regulatórios</span>
                  </button>
                </div>
              </div>

              {/* If APPROVAL: Select / Create Term and Input Final Value (Item 5) */}
              {reviewAction === 'aprovar' && (
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-emerald-950 text-xs flex items-center gap-1.5">
                      <Bookmark size={14} className="text-emerald-700" />
                      Termo Regulatório de Destino na Matriz <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsInlineCreateTermOpen(!isInlineCreateTermOpen)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} />
                      {isInlineCreateTermOpen ? 'Fechar cadastro rápido' : '+ Criar novo termo agora'}
                    </button>
                  </div>

                  {/* Inline quick term creator */}
                  {isInlineCreateTermOpen && (
                    <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-2.5">
                      <span className="font-bold text-[11px] text-blue-900 block">Novo Termo Regulatório Rápido</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Chave Única (ex: NOME_NOVO)</label>
                          <input
                            type="text"
                            value={inlineNewTermKey}
                            onChange={e => setInlineNewTermKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                            placeholder="CHAVE_EM_MAIUSCULO"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Nome Legível do Campo</label>
                          <input
                            type="text"
                            value={inlineNewTermLabel}
                            onChange={e => setInlineNewTermLabel(e.target.value)}
                            placeholder="Ex: Título da Evidência"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <select
                          value={inlineNewTermType}
                          onChange={e => setInlineNewTermType(e.target.value as any)}
                          className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white"
                        >
                          <option value="ambos">Texto e Link</option>
                          <option value="texto">Apenas Texto</option>
                          <option value="link">Apenas Link</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const k = inlineNewTermKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
                            if (!k || !inlineNewTermLabel.trim()) {
                              alert('Preencha a chave e o nome do novo termo.');
                              return;
                            }
                            const newTerm: RegulatoryTermDefinition = {
                              id: `term_${k.toLowerCase()}_${Date.now()}`,
                              key: k,
                              label: inlineNewTermLabel.trim(),
                              description: `Campo criado na validação de ${selectedUnifiedItem?.title || ''}`,
                              groupName: 'Base Regulatória',
                              valueType: inlineNewTermType,
                              isMandatory: false,
                              isActive: true,
                              phase: selectedUnifiedItem?.phase || selectedPhase,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString()
                            };
                            onUpdateProject({
                              ...project,
                              regulatoryTerms: [...activeTermsList, newTerm]
                            });
                            setReviewTermKey(k);
                            setIsInlineCreateTermOpen(false);
                            setInlineNewTermKey('');
                            setInlineNewTermLabel('');
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Salvar e Selecionar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Term Select */}
                  <select
                    value={reviewTermKey}
                    onChange={e => setReviewTermKey(e.target.value)}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-xs font-bold bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Selecione o termo regulatório correspondente...</option>
                    {activeTermsList.filter(t => t.isActive).map(term => (
                      <option key={term.id} value={term.key}>
                        [{term.key}] {term.label} — ({term.groupName})
                      </option>
                    ))}
                  </select>

                  {/* Validated Value & Link Inputs */}
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Valor Validado para a Base Regulatória (Texto)
                      </label>
                      <textarea
                        value={reviewTextValue}
                        onChange={e => setReviewTextValue(e.target.value)}
                        rows={2}
                        placeholder="Texto formal consolidado para o dossiê regulatório..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Link de Evidência / Acesso Restrito ao Documento
                      </label>
                      <input
                        type="url"
                        value={reviewLinkValue}
                        onChange={e => setReviewLinkValue(e.target.value)}
                        placeholder="https://sharepoint... ou link de relatório assinado"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Justification / Technical Opinion (Item 5: parecer e histórico) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block text-xs">
                  Justificativa / Parecer Técnico do Responsável {reviewAction !== 'aprovar' && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  value={reviewJustification}
                  onChange={e => setReviewJustification(e.target.value)}
                  rows={3}
                  placeholder={
                    reviewAction === 'aprovar'
                      ? 'Descreva a motivação da aprovação técnica ou referências normativas cumpridas (opcional)...'
                      : reviewAction === 'ajustes'
                        ? 'Descreva os apontamentos e o que deve ser complementado ou corrigido pela equipe técnica...'
                        : 'Justifique por que esta informação foi rejeitada ou desconsiderada para fins regulatórios...'
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setUnifiedValidationModalOpen(false);
                  setSelectedUnifiedItem(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveUnifiedReview}
                className={`px-5 py-2 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer flex items-center gap-1.5 ${
                  reviewAction === 'aprovar'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : reviewAction === 'ajustes'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Check size={14} />
                {reviewAction === 'aprovar'
                  ? 'Confirmar Aprovação Regulatória'
                  : reviewAction === 'ajustes'
                    ? 'Devolver para Ajustes'
                    : 'Confirmar Rejeição / Descarte'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CADASTRO CENTRAL DE TERMOS REGULATÓRIOS MODAL (Item 4) */}
      {isNewTermModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-slate-200 overflow-y-auto animate-in zoom-in-95 duration-200 my-auto space-y-4">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider">
                  Matriz & Dicionário Regulatório
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {editingTerm ? 'Editar Termo Regulatório' : 'Novo Termo Regulatório'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Padronização de termos para colunas da matriz regulatória e relatórios executivos.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsNewTermModalOpen(false);
                  setEditingTerm(null);
                  setTermFormError('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {termFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{termFormError}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              
              {/* Unique Key */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Chave Única do Termo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={termFormKey}
                  onChange={e => {
                    setTermFormKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'));
                    setTermFormError('');
                  }}
                  placeholder="Ex: NOME_VACINA, NOME_IFA, INDICACAO, PLATAFORMA"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase tracking-wider focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Identificador técnico único (apenas letras maiúsculas, números e sublinhados). Impede duplicações acidentais.
                </p>
              </div>

              {/* Readable Label */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nome Legível do Campo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={termFormLabel}
                  onChange={e => {
                    setTermFormLabel(e.target.value);
                    setTermFormError('');
                  }}
                  placeholder="Ex: Nome do Candidato Vacinal"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              {/* Regulatory Group */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Grupo Regulatório de Enquadramento <span className="text-rose-500">*</span>
                </label>
                <select
                  value={termFormGroup}
                  onChange={e => setTermFormGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
                >
                  {STANDARD_REGULATORY_GROUPS.map(g => (
                    <option key={g.groupName} value={g.groupName}>
                      {g.groupName}
                    </option>
                  ))}
                  <option value="Outros Requisitos Regulatórios">Outros Requisitos Regulatórios</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Descrição e Orientações de Preenchimento
                </label>
                <textarea
                  value={termFormDesc}
                  onChange={e => setTermFormDesc(e.target.value)}
                  rows={2}
                  placeholder="Instruções para a equipe técnica sobre os requisitos regulatórios esperados..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Value Type & Mandatory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo de Valor Aceito</label>
                  <select
                    value={termFormValueType}
                    onChange={e => setTermFormValueType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
                  >
                    <option value="ambos">Texto e Link de Evidência</option>
                    <option value="texto">Apenas Texto</option>
                    <option value="link">Apenas Link / Documento</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fase Principal</label>
                  <select
                    value={termFormPhase}
                    onChange={e => setTermFormPhase(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold"
                  >
                    {phasesList.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mandatory Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={termFormIsMandatory}
                    onChange={e => setTermFormIsMandatory(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                  />
                  <span className="font-bold text-slate-700 text-xs">
                    Termo obrigatório para conformidade regulatória do projeto
                  </span>
                </label>
              </div>

            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsNewTermModalOpen(false);
                  setEditingTerm(null);
                  setTermFormError('');
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRegulatoryTerm}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check size={14} />
                {editingTerm ? 'Atualizar Termo' : 'Cadastrar Termo'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
