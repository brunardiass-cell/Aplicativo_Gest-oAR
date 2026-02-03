
import { ActivityPlanTemplate, TeamMember } from './types';

export const AUTHORIZED_EMAILS = [
  'priscilapassos@ctvacinas.org',
  'priscilapassos.ctvacinas@gmail.com',
  'brunardias@outlook.com'
];

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  // FIX: Added isLeader property to align with type definition and fix usage errors.
  { id: 'tm_1', name: 'Priscila Passos', email: 'priscilapassos@ctvacinas.org', jobTitle: 'Gerente Regulatória', role: 'Admin', password: 'admin', status: 'active', isLeader: true },
  { id: 'tm_2', name: 'priscilapassos.ctvacinas@gmail.com', email: 'priscilapassos.ctvacinas@gmail.com', jobTitle: 'Consultora', role: 'Admin', status: 'active', isLeader: false },
  { id: 'tm_3', name: 'Bruna Dias', email: 'brunardias@outlook.com', jobTitle: 'Especialista Regulatória', role: 'Admin', status: 'active', isLeader: false },
];


export const ADMIN_WHITELIST = [
  'priscilapassos@ctvacinas.org'
];

export const DEFAULT_ACTIVITY_PLANS: ActivityPlanTemplate[] = [
  {
    id: 'plan_protein',
    name: 'Proteína Recombinante',
    macroActivities: [
      'Desenvolvimento de Dossiê de Insumo (DIFA)',
      'Coordenação de Estudo de Estabilidade',
      'Validação de Processo Produtivo',
      'Elaboração de Relatório Clínico Fase III',
      'Submissão Regulatória Final'
    ]
  },
  {
    id: 'plan_virus',
    name: 'Vírus Recombinante',
    macroActivities: [
      'Caracterização do Banco Viral Mestre/Trabalho',
      'Gerenciamento de Testes de Adventícios',
      'Desenvolvimento do Processo de Inativação Viral',
      'Compilação e Submissão de Dossiê'
    ]
  },
  {
    id: 'plan_rna',
    name: 'RNA (Terapia Gênica)',
    macroActivities: [
      'Qualificação do Plasmídeo Molde',
      'Validação da Transcrição in vitro (TIV)',
      'Análise de Pureza e Integridade do RNA',
      'Elaboração de Relatório de Segurança Pré-clínica',
    ]
  },
  {
    id: 'plan_dna',
    name: 'DNA (Vacina de DNA)',
    macroActivities: [
      'Construção e Qualificação do Vetor Plasmidial',
      'Desenvolvimento da Produção em Larga Escala',
      'Desenvolvimento de Teste de Potência',
      'Preparação para Submissão de Estudos Clínicos',
    ]
  }
];
