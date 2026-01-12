// DO NOT add any new types to types.ts as per guidelines, fixing TeamMember usage here
import { Priority, Status, Task } from './types';

// Fix: Removed missing TeamMember type and used string[] instead
export const TEAM_MEMBERS: string[] = ['Graziella', 'Bruna', 'Ester', 'Marjorie', 'Ana Luiza', 'Ana Terzian'];

export const PRIORITIES: Priority[] = ['Baixa', 'Média', 'Alta', 'Urgente'];

export const STATUSES: Status[] = ['Não Iniciada', 'Em Andamento', 'Bloqueada', 'Concluída'];

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    requestDate: '2024-05-10',
    project: 'Expansão Q3',
    activity: 'Planejamento de Metas',
    description: 'Definição detalhada dos KPIs para o terceiro trimestre.',
    projectLead: 'Graziella',
    collaborators: ['Bruna', 'Ester'],
    priority: 'Alta',
    status: 'Em Andamento',
    plannedStartDate: '2024-05-12',
    realStartDate: '2024-05-12',
    completionDate: '2024-05-20',
    progress: 45,
    nextStep: 'Reunião de alinhamento com diretoria.',
    updates: [
      { id: 'u1', date: '2024-05-13', note: 'Primeira versão do documento concluída.' }
    ],
    emailOnJoin: true,
    emailOnDeadline: true
  },
  {
    id: '2',
    requestDate: '2024-05-11',
    project: 'Marketing Interno',
    activity: 'Newsletter Mensal',
    description: 'Criação do conteúdo para a newsletter de colaboradores.',
    projectLead: 'Marjorie',
    collaborators: ['Ana Luiza'],
    priority: 'Média',
    status: 'Não Iniciada',
    plannedStartDate: '2024-05-15',
    completionDate: '2024-05-25',
    progress: 0,
    nextStep: 'Coleta de feedbacks dos setores.',
    updates: [],
    emailOnJoin: false,
    emailOnDeadline: true
  }
];