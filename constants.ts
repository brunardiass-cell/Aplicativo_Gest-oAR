
import { ActivityPlanTemplate, TeamMember } from './types';

export const ADMIN_WHITELIST = [
  'graziella.r@ctvacinas.org',
  'priscilapassos@ctvacinas.org',
  'priscilapassos.ctvacinas@gmail.com',
  'brunardias@outlook.com',
];

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm_1', name: 'Graziella', role: 'Líder', isLeader: true },
  { id: 'tm_2', name: 'Bruna Dias', role: 'Equipe', isLeader: false },
  { id: 'tm_3', name: 'Ester', role: 'Equipe', isLeader: false },
  { id: 'tm_4', name: 'Marjorie', role: 'Equipe', isLeader: false },
  { id: 'tm_5', name: 'Ana Luiza', role: 'Equipe', isLeader: false },
  { id: 'tm_6', name: 'Ana Terzian', role: 'Equipe', isLeader: false }
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