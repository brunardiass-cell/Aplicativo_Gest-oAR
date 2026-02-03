
import { ActivityPlanTemplate, TeamMember } from './types';

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm_1', name: 'Graziella', email: 'graziella@ctvacinas.org', jobTitle: 'Líder', role: 'Admin', password: 'admin', status: 'active' },
  { id: 'tm_2', name: 'Bruna Dias', email: 'bruna.dias@ctvacinas.org', jobTitle: 'Equipe', role: 'Membro', status: 'active' },
  { id: 'tm_3', name: 'Ester', email: 'ester@ctvacinas.org', jobTitle: 'Equipe', role: 'Membro', status: 'active' },
  { id: 'tm_4', name: 'Marjorie', email: 'marjorie@ctvacinas.org', jobTitle: 'Equipe', role: 'Membro', status: 'active' },
  { id: 'tm_5', name: 'Ana Luiza', email: 'ana.luiza@ctvacinas.org', jobTitle: 'Equipe', role: 'Usuario', status: 'active' },
  { id: 'tm_6', name: 'Ana Terzian', email: 'ana.terzian@ctvacinas.org', jobTitle: 'Equipe', role: 'Usuario', status: 'inactive' }
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
