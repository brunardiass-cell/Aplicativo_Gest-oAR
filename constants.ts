
import { ActivityPlanTemplate, TeamMember, AppUser } from './types';

export const DEFAULT_APP_USERS: AppUser[] = [
  {
    id: 'user_admin_bruna',
    username: 'Bruna Rodrigues',
    email: 'brunardias@outlook.com',
    role: 'admin',
    status: 'active',
    joinedAt: new Date().toISOString()
  },
  {
    id: 'user_user_ester',
    username: 'Ester (Acesso)',
    email: 'ester@ctvacinas.org',
    role: 'user_team_2',
    status: 'active',
    joinedAt: new Date().toISOString()
  },
  {
    id: 'user_user_general',
    username: 'Usuário Geral',
    email: 'geral@ctvacinas.org',
    role: 'user_general',
    status: 'active',
    joinedAt: new Date().toISOString()
  }
];

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm_1', name: 'Graziella', role: 'Líder', isLeader: true, password: 'admin' },
  { id: 'tm_2', name: 'Bruna Dias', role: 'Equipe', isLeader: false },
  { id: 'tm_3', name: 'Ester', role: 'Equipe', isLeader: false },
  { id: 'tm_4', name: 'Marjorie', role: 'Equipe', isLeader: false },
  { id: 'tm_5', name: 'Ana Luiza', role: 'Equipe', isLeader: false },
  { id: 'tm_6', name: 'Ana Terzian', role: 'Equipe', isLeader: false }
];

export const ADMIN_WHITELIST = [
  'priscilapassos@ctvacinas.org'
];

const defaultPhases = [
  'Fase 1: Prova de Conceito',
  'Fase 2: Fase Não Clínica',
  'Fase 3: Fase Clínica I',
  'Fase 4: Fase Clínica II',
  'Fase 5: Fase Clínica III',
];

export const DEFAULT_ACTIVITY_PLANS: ActivityPlanTemplate[] = [
  {
    id: 'plan_protein',
    name: 'Proteína Recombinante',
    phases: defaultPhases,
    macroActivities: [
      { name: 'Desenvolvimento de Dossiê de Insumo (DIFA)', phase: defaultPhases[0] },
      { name: 'Coordenação de Estudo de Estabilidade', phase: defaultPhases[0] },
      { name: 'Validação de Processo Produtivo', phase: defaultPhases[0] },
      { name: 'Elaboração de Relatório Clínico Fase III', phase: defaultPhases[0] },
      { name: 'Submissão Regulatória Final', phase: defaultPhases[0] }
    ]
  },
  {
    id: 'plan_virus',
    name: 'Vírus Recombinante',
    phases: defaultPhases,
    macroActivities: [
      { name: 'Caracterização do Banco Viral Mestre/Trabalho', phase: defaultPhases[0] },
      { name: 'Gerenciamento de Testes de Adventícios', phase: defaultPhases[0] },
      { name: 'Desenvolvimento do Processo de Inativação Viral', phase: defaultPhases[0] },
      { name: 'Compilação e Submissão de Dossiê', phase: defaultPhases[0] }
    ]
  },
  {
    id: 'plan_rna',
    name: 'RNA (Terapia Gênica)',
    phases: defaultPhases,
    macroActivities: [
      { name: 'Qualificação do Plasmídeo Molde', phase: defaultPhases[0] },
      { name: 'Validação da Transcrição in vitro (TIV)', phase: defaultPhases[0] },
      { name: 'Análise de Pureza e Integridade do RNA', phase: defaultPhases[0] },
      { name: 'Elaboração de Relatório de Segurança Pré-clínica', phase: defaultPhases[0] },
    ]
  },
  {
    id: 'plan_dna',
    name: 'DNA (Vacina de DNA)',
    phases: defaultPhases,
    macroActivities: [
      { name: 'Construção e Qualificação do Vetor Plasmidial', phase: defaultPhases[0] },
      { name: 'Desenvolvimento da Produção em Larga Escala', phase: defaultPhases[0] },
      { name: 'Desenvolvimento de Teste de Potência', phase: defaultPhases[0] },
      { name: 'Preparação para Submissão de Estudos Clínicos', phase: defaultPhases[0] },
    ]
  }
];

export const DEFAULT_REGULATORY_SUBJECTS = [
  {
    id: 'subj_1',
    name: 'Proteínas Recombinantes',
    blocks: [
      {
        id: 'block_1_1',
        name: 'Estudo de Segurança',
        concepts: [
          {
            id: 'concept_1',
            title: 'Toxicidade Local',
            centralIdea: 'Avaliação do potencial de irritação e tolerabilidade tecidual no sítio de administração em modelos pré-clínicos.',
            practicalApplication: 'Definição da via de administração segura, determinação do tampão de formulação e observação de reações inflamatórias no local de injeção.',
            observations: 'Recomenda-se utilizar a formulação e concentração idênticas às pretendidas para uso humano.',
            color: 'yellow',
            linkedStandards: [
              {
                standardId: 'std_1',
                relevantPassages: 'Estudos de tolerância local devem utilizar a via clínica pretendida e avaliar alterações histopatológicas no sítio de injeção.',
                page: 'Página 14',
                section: 'Seção 4.3'
              }
            ]
          },
          {
            id: 'concept_2',
            title: 'Estudos de Dose Repetida',
            centralIdea: 'Análise dos efeitos tóxicos decorrentes da administração continuada do biofármaco para identificação de órgãos-alvo.',
            practicalApplication: 'Determinação do NOAEL (No Observed Adverse Effect Level) para cálculo da dose inicial em ensaios humanos (FIH).',
            observations: 'A duração dos estudos pré-clínicos deve refletir a duração prevista do tratamento clínico humano.',
            color: 'blue',
            linkedStandards: [
              {
                standardId: 'std_1',
                relevantPassages: 'Doses repetidas devem ser administradas em espécies relevantes com monitoramento de perfil imunogênico e parâmetros laboratoriais.',
                page: 'Página 18',
                section: 'Seção 5.2'
              }
            ]
          }
        ]
      },
      {
        id: 'block_1_2',
        name: 'Estudo de Estabilidade',
        concepts: [
          {
            id: 'concept_3',
            title: 'Potência',
            centralIdea: 'Quantificação da atividade biológica específica da molécula com base no mecanismo de ação pretendido.',
            practicalApplication: 'Controle de qualidade de liberação de lote e ensaios in vitro/in vivo de ligação a receptores ou atividade funcional ao longo do tempo de prateleira.',
            observations: 'Deve ser estabelecido um padrão de referência devidamente caracterizado para calibração do ensaio.',
            color: 'green',
            linkedStandards: [
              {
                standardId: 'std_2',
                relevantPassages: 'O ensaio de potência é requisito obrigatório para liberação do lote de insumo farmacêutico ativo e produto acabado.',
                page: 'Página 9',
                section: 'Item 3.1'
              }
            ]
          },
          {
            id: 'concept_4',
            title: 'Solventes e Impurezas Residuais',
            centralIdea: 'Limites aceitáveis para impurezas do processo e reagentes remanescentes após as etapas de purificação.',
            practicalApplication: 'Monitoramento analítico por cromatografia com especificação de aceitação em conformidade com os guias de segurança.',
            observations: 'Impurezas relacionadas ao processo (ex.: DNA da célula hospedeira, HCP) devem ser quantificadas em validação.',
            color: 'pink',
            linkedStandards: [
              {
                standardId: 'std_2',
                relevantPassages: 'Níveis de impurezas derivadas do hospedeiro devem ser validados quanto à remoção e estar abaixo dos limites toxicológicos.',
                page: 'Página 22',
                section: 'Seção 6.4'
              }
            ]
          }
        ]
      }
    ]
  }
];
