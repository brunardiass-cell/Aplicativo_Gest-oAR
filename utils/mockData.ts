
import { Task, TeamMember } from '../types';

export const generateInitialTasks = (teamMembers: TeamMember[]): Task[] => {
  const leader = teamMembers.find(m => m.isLeader);
  const otherMembers = teamMembers.filter(m => !m.isLeader);

  return [
    {
      id: 'task_1',
      project: 'Proteína Recombinante',
      activity: 'Relatório de Estabilidade Lote P01',
      description: 'Compilar e analisar os dados de estabilidade do primeiro lote de produção.',
      projectLead: leader?.name || 'Graziella',
      collaborators: [otherMembers[0]?.name || 'Bruna Dias'],
      priority: 'Alta',
      status: 'Em Andamento',
      requestDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      plannedStartDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 60,
      nextStep: 'Aguardando resultados do laboratório de controle de qualidade.',
      updates: [],
      isReport: true,
      reportStage: 'Próximo Revisor',
      currentReviewer: leader?.name || 'Graziella',
      fileLocation: '#',
    },
    {
      id: 'task_2',
      project: 'Vírus Recombinante',
      activity: 'Submissão de Dossiê para Fase II',
      description: 'Finalizar a documentação e submeter o dossiê completo para aprovação da Fase II.',
      projectLead: otherMembers[0]?.name || 'Bruna Dias',
      collaborators: [otherMembers[1]?.name || 'Ester'],
      priority: 'Urgente',
      status: 'Planejada',
      requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      plannedStartDate: new Date().toISOString().split('T')[0],
      completionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 10,
      nextStep: 'Revisão final com o comitê gestor antes da submissão.',
      updates: [],
      isReport: true,
      reportStage: 'Em Elaboração',
    },
    {
      id: 'task_3',
      project: 'Proteína Recombinante',
      activity: 'Validação do Processo Produtivo',
      description: 'Executar os protocolos de validação para o processo produtivo em escala piloto.',
      projectLead: leader?.name || 'Graziella',
      collaborators: [otherMembers[2]?.name || 'Marjorie'],
      priority: 'Média',
      status: 'Concluída',
      requestDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      plannedStartDate: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 100,
      nextStep: 'N/A',
      updates: [],
      isReport: false,
    },
  ];
};
