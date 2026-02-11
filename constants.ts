
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
