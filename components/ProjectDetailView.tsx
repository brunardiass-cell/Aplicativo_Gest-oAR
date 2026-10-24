import React, { useState, useMemo, useRef } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { 
  Project, 
  MicroActivity, 
  MicroActivityStatus, 
  TeamMember, 
  RegulatoryStandard,
  Meeting,
  Task
} from '../types';
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

// Canonical phase normalizer
const normalizePhaseName = (name: string): string => {
  const trimmed = (name || '').trim();
  const lower = trimmed.toLowerCase();
  if (lower.includes('prova') || lower.includes('conceito')) return 'Prova de Conceito';
  if (lower.includes('não clínica') || lower.includes('nao clinica') || lower.includes('não-clínica')) return 'Fase Não Clínica';
  if (lower.includes('1/2') || lower.includes('1 e 2') || lower.includes('i/ii') || lower.includes('fase 1')) return 'Fase 1/2';
  if (lower.includes('fase 3') || lower.includes('iii')) return 'Fase 3';
  return trimmed || 'Fase 1/2';
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
  // Top view tab state
  const [activeTopTab, setActiveTopTab] = useState<'visao_geral' | 'estrutura' | 'proximas_acoes' | 'orientacao' | 'historico' | 'contribuicoes'>('visao_geral');

  // Phases deduplicated list
  const phasesList = useMemo(() => {
    const defaultPhases = ['Prova de Conceito', 'Fase Não Clínica', 'Fase 1/2', 'Fase 3'];
    const canonicalMap = new Map<string, string>();
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

  // Selected phase (defaults to Fase 1/2 as in the reference image)
  const [selectedPhase, setSelectedPhase] = useState<string>(() => {
    return phasesList.find(p => p.toLowerCase().includes('1/2')) || phasesList[2] || phasesList[0] || 'Fase 1/2';
  });

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

  // Presentation link temporary state in modal
  const [presentationLinkInput, setPresentationLinkInput] = useState('');
  const [newDiscussionComment, setNewDiscussionComment] = useState('');

  // Horizontal journey carousel scroll ref
  const journeyScrollRef = useRef<HTMLDivElement>(null);
  const regulatoryPanelRef = useRef<HTMLDivElement>(null);

  // Calculate stats for top KPI cards
  const stats = useMemo(() => {
    const allMacros = project.macroActivities || [];
    let totalMicros = 0;
    let completedMicros = 0;
    let totalProgressSum = 0;

    allMacros.forEach(macro => {
      (macro.microActivities || []).forEach(mic => {
        totalMicros++;
        const isDone = mic.status === 'Concluído e aprovado' || mic.status === 'Concluído com restrições';
        if (isDone) completedMicros++;
        totalProgressSum += (mic.progress ?? (isDone ? 100 : 0));
      });
    });

    // Default progress to 22% matching reference screenshot if empty
    const overallProgress = totalMicros > 0 ? Math.round(totalProgressSum / totalMicros) : 22;

    return {
      overallProgress: Math.min(100, Math.max(0, overallProgress)),
      daysRemaining: 198,
      forecastDate: '12/12/2025',
      nextMilestoneName: 'Imunogenicidade',
      daysToMilestone: 595
    };
  }, [project.macroActivities]);

  // Phase progress mapping matching the screenshot (87%, 27%, 22%, 0%)
  const phaseProgressMap = useMemo(() => {
    const map: Record<string, number> = {};
    phasesList.forEach(phase => {
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

      if (total > 0) {
        map[phase] = Math.round((completed / total) * 100);
      } else {
        // Fallback default numbers from screenshot if no data registered yet
        if (phase.includes('Conceito')) map[phase] = 87;
        else if (phase.includes('Não Clínica')) map[phase] = 27;
        else if (phase.includes('1/2')) map[phase] = 22;
        else if (phase.includes('3')) map[phase] = 0;
        else map[phase] = 0;
      }
    });
    return map;
  }, [phasesList, project.macroActivities]);

  // Merge canonical group definitions with existing macroactivities in current phase
  const currentPhaseGroups = useMemo(() => {
    const normTarget = normalizePhaseName(selectedPhase).toLowerCase();
    const existingMacrosInPhase = (project.macroActivities || []).filter(
      m => normalizePhaseName(m.phase || '').toLowerCase() === normTarget
    );

    // Build the 14 standard groups, populating with existing macroactivities if name matches or attaching existing ones
    return CANONICAL_GROUPS.map((cGroup, idx) => {
      const matchedMacro = existingMacrosInPhase.find(m => 
        m.name.toLowerCase().includes(cGroup.name.toLowerCase()) || 
        cGroup.name.toLowerCase().includes(m.name.toLowerCase())
      );

      // Microactivities list: either from the existing project macroactivity or default activities
      let microActivities: MicroActivity[] = [];
      if (matchedMacro && matchedMacro.microActivities && matchedMacro.microActivities.length > 0) {
        microActivities = matchedMacro.microActivities;
      } else if (idx === 0) {
        // Group 1: Produção de material (faithful to screenshot)
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
        // Group 2: Caracterização do candidato
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
        // Group 3: Estudos não clínicos
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

      // Calculate progress of this group
      let calculatedProgress = cGroup.defaultProgress;
      if (microActivities.length > 0) {
        const sumProg = microActivities.reduce((acc, m) => {
          const isDone = m.status === 'Concluído e aprovado' || m.status === 'Concluído com restrições';
          return acc + (m.progress ?? (isDone ? 100 : 0));
        }, 0);
        calculatedProgress = Math.round(sumProg / microActivities.length);
      }

      return {
        ...cGroup,
        matchedMacro,
        macroId: matchedMacro?.id || `macro_${idx}_${project.id}`,
        microActivities,
        progress: calculatedProgress,
        completedCount: microActivities.filter(m => m.status === 'Concluído e aprovado' || m.status === 'Concluído com restrições').length,
        totalCount: microActivities.length
      };
    });
  }, [selectedPhase, project.macroActivities, project.id]);

  // Active selected group
  const activeGroup = currentPhaseGroups[selectedGroupIndex] || currentPhaseGroups[0];

  // Regulatory data for active group
  const activeRegulatory = GROUP_REGULATORY_MAP[activeGroup.name] || DEFAULT_REGULATORY_DATA;

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

  // Scroll to regulatory panel
  const handleScrollToRegulatory = () => {
    if (regulatoryPanelRef.current) {
      regulatoryPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setRegulatoryTab('resumo');
    }
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
          {/* Top View Navigation Tabs (Pills from screenshot) */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 mr-2">
            <button
              onClick={() => setActiveTopTab('visao_geral')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTopTab === 'visao_geral'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTopTab('estrutura')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTopTab === 'estrutura'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">2</span>
              Estrutura
            </button>
            <button
              onClick={() => setActiveTopTab('proximas_acoes')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTopTab === 'proximas_acoes'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">3</span>
              Próximas Ações
            </button>
            <button
              onClick={() => setActiveTopTab('orientacao')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTopTab === 'orientacao'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">4</span>
              Orientação Regulatória
            </button>
            <button
              onClick={() => setActiveTopTab('historico')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTopTab === 'historico'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">5</span>
              Histórico
            </button>
            <button
              onClick={() => setActiveTopTab('contribuicoes')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTopTab === 'contribuicoes'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">6</span>
              Contribuições
            </button>
          </div>

          {/* Quick Action buttons */}
          <button
            onClick={() => onSwitchTab ? onSwitchTab('regulatory_docs') : setActiveTopTab('orientacao')}
            className="px-3.5 py-2 bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5"
            title="Documentação Regulatória"
          >
            <FileText size={15} className="text-slate-500" /> Docs
          </button>

          <button
            onClick={() => onPrint ? onPrint() : window.print()}
            className="p-2.5 bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50 rounded-xl transition shadow-2xs"
            title="Imprimir visão do projeto"
          >
            <Printer size={15} />
          </button>

          <button
            onClick={onBack}
            className="px-4 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-2xs active:scale-95"
          >
            <ArrowLeft size={14} /> Voltar
          </button>
        </div>
      </div>

      {/* Top Tabs on smaller screens */}
      <div className="flex xl:hidden overflow-x-auto pb-2 gap-1.5 no-scrollbar">
        {[
          { id: 'visao_geral', num: '1', label: 'Visão Geral' },
          { id: 'estrutura', num: '2', label: 'Estrutura' },
          { id: 'proximas_acoes', num: '3', label: 'Próximas Ações' },
          { id: 'orientacao', num: '4', label: 'Orientação Regulatória' },
          { id: 'historico', num: '5', label: 'Histórico' },
          { id: 'contribuicoes', num: '6', label: 'Contribuições' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTopTab(tab.id as any)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTopTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            <span>{tab.num}.</span> {tab.label}
          </button>
        ))}
      </div>

      {/* 2. TOP 3 KPI STAT CARDS (Matching Image top cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Progresso geral */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FlaskConical size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-500">Progresso geral</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.overallProgress}%
            </p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                style={{ width: `${stats.overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Tempo restante */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
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

        {/* Card 3: Próximo marco */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
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

      {activeTopTab === 'historico' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900">Histórico e Reuniões Vinculadas</h2>
            <p className="text-xs text-slate-500">Registro de atualizações, deliberações e atas de reuniões do projeto</p>
          </div>
          <div className="space-y-3">
            {linkedMeetings.length > 0 ? (
              linkedMeetings.map(meeting => (
                <div key={meeting.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-900">{meeting.title}</p>
                    <p className="text-[11px] text-slate-500">Data: {meeting.date} | Moderador: {meeting.moderator}</p>
                    {meeting.presentationLink && (
                      <a 
                        href={meeting.presentationLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[11px] text-blue-600 font-bold inline-flex items-center gap-1 hover:underline"
                      >
                        <Presentation size={12} /> Link da apresentação &rarr;
                      </a>
                    )}
                  </div>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold">
                    {meeting.agendaItems?.length || 0} pautas
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">Nenhuma reunião com pauta vinculada diretamente a este projeto até o momento.</p>
            )}
          </div>
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
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                GRUPOS DE ATIVIDADES DA {selectedPhase.toUpperCase()}
              </h3>

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

              {/* Stepper Cards Horizontal Carousel */}
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
                        {/* Number badge */}
                        <div className={`w-5 h-5 rounded-full font-black text-[11px] flex items-center justify-center ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          {group.number}
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

                      {/* Graphic Illustration */}
                      <div className="pt-3">
                        {renderGroupIllustration(group.illustrationType)}
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

            {/* SPLIT CONTAINER: ACTIVE GROUP DETAILS + REGULATORY ORIENTATION */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* LEFT / CENTER: ACTIVE GROUP DETAILS (xl:col-span-8) */}
              <div className="xl:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
                
                {/* Active Group Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
                      {activeGroup.number}
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

                {/* Sub-Tab 1: ATIVIDADES TABLE (Matching Image table) */}
                {groupSubTab === 'atividades' && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150 pb-2">
                            <th className="py-2 px-3 w-12">#</th>
                            <th className="py-2 px-3">ATIVIDADE</th>
                            <th className="py-2 px-3">STATUS</th>
                            <th className="py-2 px-3">PRAZO</th>
                            <th className="py-2 px-3">RESPONSÁVEL</th>
                            <th className="py-2 px-3">REG.</th>
                            <th className="py-2 px-3 text-right">AÇÕES</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {activeGroup.microActivities.map((micro, mIdx) => {
                            const code = `${activeGroup.number}.${mIdx + 1}`;
                            const isReg = micro.generatesRegulatoryContent !== false;

                            return (
                              <tr 
                                key={micro.id} 
                                className="hover:bg-slate-50/70 transition group"
                              >
                                <td className="py-3 px-3 font-bold text-slate-500">
                                  {code}
                                </td>
                                <td className="py-3 px-3">
                                  <span className="font-bold text-slate-900 group-hover:text-blue-700 transition">
                                    {micro.name}
                                  </span>
                                  {micro.observations && (
                                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                      {micro.observations}
                                    </p>
                                  )}
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  {renderStatusBadge(micro.status)}
                                </td>
                                <td className="py-3 px-3 font-semibold text-slate-600 whitespace-nowrap">
                                  {micro.dueDate ? micro.dueDate.split('-').reverse().join('/') : '—'}
                                </td>
                                <td className="py-3 px-3 font-bold text-slate-700 whitespace-nowrap">
                                  {micro.assignee || 'Bruna'}
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <span className={`font-bold ${isReg ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {isReg ? 'Sim' : 'Não'}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleOpenMicroDetails(micro)}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                                      title="Abrir detalhes"
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
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Guias técnicos e diretrizes aplicáveis ao grupo <strong>{activeGroup.name}</strong> para garantir conformidade regulatória:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeRegulatory.guides.map(guide => (
                        <a
                          key={guide.name}
                          href={guide.url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-300 transition flex items-center justify-between text-xs font-bold text-slate-800"
                        >
                          <span className="truncate">{guide.name}</span>
                          <ExternalLink size={14} className="text-blue-600 shrink-0" />
                        </a>
                      ))}
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
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600">
                      Decisões estratégicas registradas nesta etapa do projeto:
                    </p>
                    <div className="space-y-2.5">
                      {activeRegulatory.decisions.map((dec, dIdx) => (
                        <div key={dIdx} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                          <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-black text-slate-900">{dec}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Validado em conformidade com as diretrizes da Anvisa e comitê técnico do CTVacinas.
                            </p>
                          </div>
                        </div>
                      ))}
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

                    {/* Add note input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newDiscussionComment}
                        onChange={e => setNewDiscussionComment(e.target.value)}
                        placeholder="Adicionar nota ou comentário sobre o grupo..."
                        className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        onClick={() => {
                          if (!newDiscussionComment.trim()) return;
                          setNewDiscussionComment('');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition cursor-pointer"
                      >
                        Comentar
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* RIGHT: ORIENTAÇÃO REGULATÓRIA DA ETAPA (Matching screenshot right card) */}
              <div 
                ref={regulatoryPanelRef}
                className="xl:col-span-4 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-5"
              >
                {/* Header with camera/clipboard icon */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Target size={18} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    Orientação regulatória da etapa
                  </h3>
                </div>

                {/* Tabs: Resumo | Guias aplicáveis | Perguntas-chave */}
                <div className="flex items-center gap-4 border-b border-slate-150 pb-2 text-xs font-bold">
                  <button
                    onClick={() => setRegulatoryTab('resumo')}
                    className={`pb-1 transition-all cursor-pointer ${
                      regulatoryTab === 'resumo' 
                        ? 'text-blue-600 border-b-2 border-blue-600 font-black' 
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Resumo
                  </button>
                  <button
                    onClick={() => setRegulatoryTab('guias')}
                    className={`pb-1 transition-all cursor-pointer ${
                      regulatoryTab === 'guias' 
                        ? 'text-blue-600 border-b-2 border-blue-600 font-black' 
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Guias aplicáveis
                  </button>
                  <button
                    onClick={() => setRegulatoryTab('perguntas')}
                    className={`pb-1 transition-all cursor-pointer ${
                      regulatoryTab === 'perguntas' 
                        ? 'text-blue-600 border-b-2 border-blue-600 font-black' 
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Perguntas-chave
                  </button>
                </div>

                {/* Tab content: Resumo (Default, exactly matching screenshot) */}
                {regulatoryTab === 'resumo' && (
                  <div className="space-y-5 text-xs">
                    {/* Description paragraph */}
                    <p className="text-slate-600 leading-relaxed">
                      {activeRegulatory.summary}
                    </p>

                    {/* Section: Principais pontos de atenção */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-blue-600 font-bold">
                        <Target size={15} />
                        <span className="text-slate-800 font-black">Principais pontos de atenção</span>
                      </div>
                      <ul className="space-y-1.5 text-slate-600 pl-1">
                        {activeRegulatory.keyPoints.map((pt, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-2">
                            <span className="text-blue-500 font-black shrink-0">•</span>
                            <span className="leading-snug">{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Section: Guias e referências principais */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-blue-600 font-bold">
                        <Bookmark size={15} />
                        <span className="text-slate-800 font-black">Guias e referências principais</span>
                      </div>
                      <div className="space-y-1.5 pl-1">
                        {activeRegulatory.guides.map((g, gIdx) => (
                          <a
                            key={gIdx}
                            href={g.url || 'https://www.gov.br/anvisa'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 leading-snug group"
                          >
                            <ExternalLink size={12} className="shrink-0 text-blue-400 group-hover:text-blue-600" />
                            <span className="truncate">{g.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Section: Decisões importantes nesta etapa */}
                    <div className="space-y-2.5 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold">
                        <Shield size={15} />
                        <span className="text-slate-800 font-black">Decisões importantes nesta etapa</span>
                      </div>
                      <ul className="space-y-1.5 text-slate-600 pl-1">
                        {activeRegulatory.decisions.map((dec, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-2">
                            <span className="text-emerald-500 font-black shrink-0">•</span>
                            <span className="leading-snug">{dec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Tab content: Guias aplicáveis */}
                {regulatoryTab === 'guias' && (
                  <div className="space-y-3 text-xs">
                    <p className="text-slate-500">
                      Normativas e resoluções da Anvisa e diretrizes internacionais da OMS e ICH:
                    </p>
                    <div className="space-y-2">
                      {(activeRegulatory.applicableGuidesList || [
                        'RDC Anvisa nº 55/2010: Produtos biológicos.',
                        'ICH Q6B: Especificações analíticas de biológicos.',
                        'Farmacopeia Brasileira: Ensaios gerais de controle.'
                      ]).map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab content: Perguntas-chave */}
                {regulatoryTab === 'perguntas' && (
                  <div className="space-y-3 text-xs">
                    <p className="text-slate-500">
                      Checklist regulatório para prontidão e auditoria:
                    </p>
                    <div className="space-y-2">
                      {(activeRegulatory.keyQuestions || [
                        'Todos os ensaios foram realizados com procedimentos operacionais padrão (POP) vigentes?',
                        'Os certificados de análise (CoA) possuem assinatura do responsável técnico?'
                      ]).map((q, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
                          <HelpCircle size={15} className="text-blue-500 shrink-0 mt-0.5" />
                          <span className="text-slate-700 leading-snug">{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

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

    </div>
  );
};
