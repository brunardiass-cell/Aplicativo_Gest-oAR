import * as XLSX from 'xlsx';
import { 
  Task, 
  Project, 
  TeamMember, 
  RegulatoryEvidence, 
  RegulatoryStandard, 
  RegulatoryDocument, 
  DossierContribution,
  MicroActivity
} from '../types';

export interface ProfileReportData {
  profile: TeamMember;
  isDiscontinued: boolean;
  folderPath: string; // e.g. "sistema/Bruna Dias" or "sistema/perfis antigos/Nome"
  monthlyTasksWorkbook: XLSX.WorkBook;
  projectsWorkbook: XLSX.WorkBook;
  regulatoryWorkbook: XLSX.WorkBook;
}

// Formatter helpers
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

// 1. Generate "Atividades do Mês" Workbook
export function generateMonthlyTasksWorkbook(
  profile: TeamMember,
  tasks: Task[],
  projects: Project[]
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Filter tasks relevant to this profile (or all if Leader / Comitê)
  const isLeaderOrComite = profile.isLeader || profile.isComiteGestor;
  
  const relevantTasks = tasks.filter(t => {
    if (isLeaderOrComite) return true;
    const isLead = t.projectLead?.trim().toLowerCase() === profile.name?.trim().toLowerCase();
    const isCollab = t.collaborators?.some(c => c.trim().toLowerCase() === profile.name?.trim().toLowerCase());
    const isReviewer = t.currentReviewer?.trim().toLowerCase() === profile.name?.trim().toLowerCase();
    const hasCompleted = t.completedCollaborators?.some(c => c.trim().toLowerCase() === profile.name?.trim().toLowerCase());
    return isLead || isCollab || isReviewer || hasCompleted;
  });

  // Sheet 1: Atividades Setoriais
  const taskRows = relevantTasks.map(t => {
    const latestNote = t.updates && t.updates.length > 0 ? t.updates[t.updates.length - 1] : null;
    return {
      'ID Atividade': t.id,
      'Nome da Atividade': t.activity,
      'Projeto Relacionado': t.project,
      'Responsável Principal': t.projectLead,
      'Equipe de Apoio': (t.collaborators || []).join(', '),
      'Prioridade': t.priority,
      'Status': t.status,
      '% Progresso': `${t.progress || 0}%`,
      'Data de Solicitação': formatDate(t.requestDate),
      'Data Prevista': formatDate(t.completionDate),
      'Data Início Planejada': formatDate(t.plannedStartDate),
      'Data Início Real': formatDate(t.actualStartDate),
      'Próximo Passo Estratégico': t.nextStep || '',
      'Fluxo de Revisão Ativo': t.isReport ? 'Sim' : 'Não',
      'Etapa da Revisão': t.reportStage || '',
      'Revisor Atual Designado': t.currentReviewer || t.collaboratorReviewerName || t.committeeReviewerName || '',
      'Link / Localização do Arquivo': t.fileLocation || '',
      'Conteúdo Regulatório?': t.generatesRegulatoryContent ? 'Sim' : 'Não',
      'Qtd. Notas Registradas': t.updates ? t.updates.length : 0,
      'Última Nota': latestNote ? `[${formatDate(latestNote.date.split('T')[0])} - ${latestNote.user}]: ${latestNote.note}` : '',
      'Descrição Detalhada': t.description || ''
    };
  });

  const wsTasks = XLSX.utils.json_to_sheet(taskRows.length > 0 ? taskRows : [{ 'Aviso': 'Nenhuma atividade setorial vinculada no momento.' }]);
  XLSX.utils.book_append_sheet(wb, wsTasks, 'Atividades_Setoriais');

  // Sheet 2: Microatividades dos Projetos
  const microRows: any[] = [];
  projects.forEach(p => {
    (p.macroActivities || []).forEach(macro => {
      (macro.microActivities || []).forEach(micro => {
        const isAssignee = micro.assignee?.trim().toLowerCase() === profile.name?.trim().toLowerCase();
        if (isLeaderOrComite || isAssignee) {
          microRows.push({
            'Projeto': p.name,
            'Fase': macro.phase || 'Geral',
            'Macroatividade': macro.name,
            'Microatividade': micro.name,
            'Responsável': micro.assignee,
            'Status': micro.status,
            '% Progresso': `${micro.progress || 0}%`,
            'Data Início': formatDate(micro.startDate || micro.realStartDate),
            'Prazo Final': formatDate(micro.dueDate),
            'Data Conclusão Real': formatDate(micro.completionDate || micro.realEndDate),
            'Pré-requisitos': (micro.prerequisites || []).map(pr => `${pr.name} (${pr.status})`).join('; '),
            'Link Evidência / Relatório': micro.reportLink || micro.evidenceUrl || '',
            'Gera Conteúdo Regulatório?': micro.generatesRegulatoryContent ? 'Sim' : 'Não',
            'Observações': micro.observations || ''
          });
        }
      });
    });
  });

  const wsMicros = XLSX.utils.json_to_sheet(microRows.length > 0 ? microRows : [{ 'Aviso': 'Nenhuma microatividade de projeto atribuída.' }]);
  XLSX.utils.book_append_sheet(wb, wsMicros, 'Microatividades_Projetos');

  return wb;
}

// 2. Generate "Projetos e Atividades" Workbook
export function generateProjectsWorkbook(
  profile: TeamMember,
  projects: Project[]
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const isLeaderOrComite = profile.isLeader || profile.isComiteGestor;

  // Filter projects where profile is lead/team or all if Leader
  const relevantProjects = projects.filter(p => {
    if (isLeaderOrComite) return true;
    const isLead = p.responsible?.trim().toLowerCase() === profile.name?.trim().toLowerCase();
    const inTeam = p.team?.some(t => t.trim().toLowerCase() === profile.name?.trim().toLowerCase());
    const hasMicro = (p.macroActivities || []).some(m => 
      (m.microActivities || []).some(mic => mic.assignee?.trim().toLowerCase() === profile.name?.trim().toLowerCase())
    );
    return isLead || inTeam || hasMicro;
  });

  // Sheet 1: Visão Geral dos Projetos
  const projectSummaryRows = relevantProjects.map(p => {
    let totalMacros = (p.macroActivities || []).length;
    let totalMicros = 0;
    let completedMicros = 0;

    (p.macroActivities || []).forEach(m => {
      (m.microActivities || []).forEach(mic => {
        totalMicros++;
        if (mic.status === 'Concluído e aprovado' || mic.status === 'Concluído com restrições') {
          completedMicros++;
        }
      });
    });

    const completionRate = totalMicros > 0 ? Math.round((completedMicros / totalMicros) * 100) : 0;

    return {
      'ID Projeto': p.id,
      'Nome do Projeto': p.name,
      'Responsável Geral': p.responsible || 'Não Definido',
      'Status': p.status,
      'Fases do Projeto': (p.phases || []).join(' > '),
      'Equipe Vinculada': (p.team || []).join(', '),
      'Total Macroatividades': totalMacros,
      'Total Microatividades': totalMicros,
      'Micros Concluídas': completedMicros,
      '% Conclusão Geral': `${completionRate}%`,
      'Objetivo / Descrição': p.objective || p.description || ''
    };
  });

  const wsOverview = XLSX.utils.json_to_sheet(projectSummaryRows.length > 0 ? projectSummaryRows : [{ 'Aviso': 'Nenhum projeto associado.' }]);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Visao_Geral_Projetos');

  // Sheet 2: Estrutura Detalhada (Macros e Micros)
  const detailRows: any[] = [];
  relevantProjects.forEach(p => {
    (p.macroActivities || []).forEach(macro => {
      if (!macro.microActivities || macro.microActivities.length === 0) {
        detailRows.push({
          'Projeto': p.name,
          'Fase': macro.phase || '',
          'Macroatividade': macro.name,
          'Prazo Macro': formatDate(macro.dueDate),
          'Resultados Esperados': macro.expectedResults || '',
          'Links de Resultados': (macro.resultLinks || []).join(', '),
          'Tem Entregável': macro.hasDeliverable ? 'Sim' : 'Não',
          'Tipo de Entregável': macro.deliverableType || '',
          'Entregável Registrado': macro.isDeliverableRegistered ? 'Sim' : 'Não',
          'Microatividade': 'Nenhuma micro cadastrada',
          'Responsável Micro': '',
          'Status Micro': '',
          'Prazo Micro': '',
          'Observações': ''
        });
      } else {
        macro.microActivities.forEach(micro => {
          detailRows.push({
            'Projeto': p.name,
            'Fase': macro.phase || '',
            'Macroatividade': macro.name,
            'Prazo Macro': formatDate(macro.dueDate),
            'Resultados Esperados': macro.expectedResults || '',
            'Links de Resultados': (macro.resultLinks || []).join(', '),
            'Tem Entregável': macro.hasDeliverable ? 'Sim' : 'Não',
            'Tipo de Entregável': macro.deliverableType || '',
            'Entregável Registrado': macro.isDeliverableRegistered ? 'Sim' : 'Não',
            'Microatividade': micro.name,
            'Responsável Micro': micro.assignee,
            'Status Micro': micro.status,
            'Prazo Micro': formatDate(micro.dueDate),
            'Observações': micro.observations || ''
          });
        });
      }
    });
  });

  const wsDetails = XLSX.utils.json_to_sheet(detailRows.length > 0 ? detailRows : [{ 'Aviso': 'Nenhuma atividade detalhada cadastrada.' }]);
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Estrutura_Macros_e_Micros');

  return wb;
}

// 3. Generate "Informações de Documentos Regulatórios" Workbook
export function generateRegulatoryWorkbook(
  profile: TeamMember,
  projects: Project[],
  tasks: Task[],
  regulatoryEvidence: RegulatoryEvidence[],
  regulatoryStandards: RegulatoryStandard[],
  regulatoryDocs: RegulatoryDocument[],
  dossierContributions: DossierContribution[]
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const isLeaderOrComite = profile.isLeader || profile.isComiteGestor;

  // Sheet 1: Evidências e Dossiê Regulatório
  const dossierRows: any[] = [];
  
  // From Task Dossier Contributions
  tasks.filter(t => t.generatesRegulatoryContent || t.dossierContribution).forEach(t => {
    const contrib = t.dossierContribution;
    const isRelevant = isLeaderOrComite || t.projectLead?.toLowerCase() === profile.name?.toLowerCase() || (t.collaborators || []).includes(profile.name);
    if (isRelevant) {
      dossierRows.push({
        'Origem': 'Atividade Setorial',
        'Item / Atividade': t.activity,
        'Projeto Relacionado': t.project,
        'Responsável': t.projectLead,
        'Capítulo DDCM': contrib?.chapterId || 'Geral',
        'Tipo de Contribuição': contrib?.type || 'texto',
        'Status no Dossiê': contrib?.status || 'Rascunho',
        'Título da Seção': contrib?.formFields?.title || t.activity,
        'Resumo Metodológico': contrib?.formFields?.methodologySummary || '',
        'Principais Resultados': contrib?.formFields?.keyResults || '',
        'Conclusão Regulatória': contrib?.formFields?.regulatoryConclusion || '',
        'Especificações / Critérios': contrib?.formFields?.specifications || '',
        'Link do Arquivo de Evidência': contrib?.attachmentUrl || t.fileLocation || '',
        'Última Atualização': formatDate(contrib?.updatedAt?.split('T')[0])
      });
    }
  });

  // From Projects MicroActivities Dossier Contributions
  projects.forEach(p => {
    (p.macroActivities || []).forEach(macro => {
      (macro.microActivities || []).forEach(micro => {
        if (micro.generatesRegulatoryContent || micro.dossierContribution || micro.evidenceUrl) {
          const contrib = micro.dossierContribution;
          const isRelevant = isLeaderOrComite || micro.assignee?.toLowerCase() === profile.name?.toLowerCase();
          if (isRelevant) {
            dossierRows.push({
              'Origem': 'Microatividade de Projeto',
              'Item / Atividade': `${macro.name} > ${micro.name}`,
              'Projeto Relacionado': p.name,
              'Responsável': micro.assignee,
              'Capítulo DDCM': contrib?.chapterId || 'Geral',
              'Tipo de Contribuição': contrib?.type || 'documento',
              'Status no Dossiê': contrib?.status || 'Rascunho',
              'Título da Seção': contrib?.formFields?.title || micro.name,
              'Resumo Metodológico': contrib?.formFields?.methodologySummary || '',
              'Principais Resultados': contrib?.formFields?.keyResults || '',
              'Conclusão Regulatória': contrib?.formFields?.regulatoryConclusion || '',
              'Especificações / Critérios': contrib?.formFields?.specifications || '',
              'Link do Arquivo de Evidência': micro.evidenceUrl || contrib?.attachmentUrl || micro.reportLink || '',
              'Última Atualização': formatDate(contrib?.updatedAt?.split('T')[0])
            });
          }
        }
      });
    });
  });

  const wsDossier = XLSX.utils.json_to_sheet(dossierRows.length > 0 ? dossierRows : [{ 'Aviso': 'Nenhuma contribuição de dossiê/evidência regulatória vinculada.' }]);
  XLSX.utils.book_append_sheet(wb, wsDossier, 'Evidencias_e_Dossie');

  // Sheet 2: Normas e Padrões Regulatórios
  const standardRows = (regulatoryStandards || []).map(std => ({
    'ID / Código': std.id,
    'Nome / Título da Norma': std.name,
    'Tipo': std.type,
    'Tema': std.theme,
    'Fase de Aplicação': std.phase,
    'Status': std.status,
    'Versão': std.version || '',
    'Aplica-se a': std.appliesTo || '',
    'Link do Documento': std.documentLink || '',
    'Resumo': std.summary || ''
  }));

  const wsStandards = XLSX.utils.json_to_sheet(standardRows.length > 0 ? standardRows : [{ 'Aviso': 'Nenhuma norma cadastrada no momento.' }]);
  XLSX.utils.book_append_sheet(wb, wsStandards, 'Normas_Regulatorias');

  // Sheet 3: Documentos Regulatórios e Submissões
  const docRows = (regulatoryDocs || []).map(doc => ({
    'ID Documento': doc.id,
    'Título do Documento': doc.title,
    'ID do Projeto': doc.projectId || 'Geral',
    'Tipo de Dossiê': doc.type,
    'Grupo': doc.group || '',
    'Status / Etapa': doc.currentVersionStatus || 'Em Elaboração',
    'Versão': doc.currentVersion || '1.0',
    'Última Atualização': doc.updatedAt ? formatDate(doc.updatedAt) : '',
    'Descrição': doc.description || ''
  }));

  const wsDocs = XLSX.utils.json_to_sheet(docRows.length > 0 ? docRows : [{ 'Aviso': 'Nenhum documento regulatório cadastrado.' }]);
  XLSX.utils.book_append_sheet(wb, wsDocs, 'Documentos_e_Submissoes');

  return wb;
}

// Helper to convert workbook to binary ArrayBuffer / Uint8Array
export function workbookToArrayBuffer(wb: XLSX.WorkBook): ArrayBuffer {
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return wbout;
}

// Helper to trigger browser download of a workbook
export function downloadWorkbookAsFile(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

// Uploads a single Excel workbook to SharePoint Drive
export async function uploadExcelToSharePointPath(
  token: string,
  driveId: string,
  folderPath: string, // e.g. "sistema/Bruna Dias" or "sistema/perfis antigos/Nome"
  fileName: string,   // e.g. "Atividades_do_Mes.xlsx"
  wb: XLSX.WorkBook
): Promise<{ success: boolean; error?: string }> {
  try {
    const arrayBuffer = workbookToArrayBuffer(wb);
    const sanitizedFolder = folderPath.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
    const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${sanitizedFolder}/${fileName}:/content`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      body: arrayBuffer
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`Erro ao subir planilha ${fileName} para ${folderPath}:`, err);
      return { success: false, error: err?.error?.message || 'Falha no upload' };
    }

    return { success: true };
  } catch (err: any) {
    console.error(`Exceção ao subir planilha ${fileName}:`, err);
    return { success: false, error: err.message };
  }
}
