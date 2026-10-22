import React, { useState, useMemo, useEffect } from 'react';
import { 
  Task, 
  AppNotification, 
  Status, 
  Priority, 
  TaskNote, 
  ActivityType, 
  TaskGroup, 
  Project, 
  TeamMember 
} from '../types';
import { DEFAULT_TASK_GROUPS } from '../constants';
import { TaskNotesModal } from './TaskNotesModal';
import { RetroactiveImportModal } from './RetroactiveImportModal';
import { TaskCompletionModal } from './TaskCompletionModal';
import { 
  Check, 
  X, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Users, 
  StickyNote, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Printer, 
  Download, 
  Upload, 
  ShieldCheck, 
  ShieldAlert, 
  FolderKanban, 
  MessageSquare, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Menu, 
  Sparkles,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface TaskBoardProps {
  tasks: Task[];
  projects?: Project[];
  currentUser: string | 'Todos';
  selectedProfile?: TeamMember | null;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onDelete: (task: Task) => void;
  onSaveTask: (task: Task) => void;
  onBatchImportTasks?: (tasks: Task[]) => void;
  hasFullAccess?: boolean;
  isLeader?: boolean;
  // Props mantidas para retrocompatibilidade
  statusFilter?: 'Todos' | Status;
  leadFilter?: string;
  projectFilter?: string;
  onStatusFilterChange?: (status: 'Todos' | Status) => void;
  onLeadFilterChange?: (lead: string) => void;
  onProjectFilterChange?: (project: string) => void;
  uniqueLeads?: string[];
  uniqueProjects?: string[];
  dateFilterType?: 'all' | 'requestDate' | 'completionDate';
  onDateFilterTypeChange?: (type: 'all' | 'requestDate' | 'completionDate') => void;
  startDateFilter?: string;
  onStartDateFilterChange?: (date: string) => void;
  endDateFilter?: string;
  onEndDateFilterChange?: (date: string) => void;
  searchTerm?: string;
  onSearchTermChange?: (term: string) => void;
  onNewTask?: () => void;
  onDownloadExcel?: () => void;
  onSyncSharePoint?: () => void;
  isSyncingSharePoint?: boolean;
  notifications?: AppNotification[];
  onNotificationClick?: (n: AppNotification) => void;
  onClearSingleNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
  onCompleteCollaboration?: (taskId: string) => void;
  onAssignReview?: (taskId: string, reviewer: string) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  projects = [],
  currentUser,
  selectedProfile,
  onEdit,
  onView,
  onDelete,
  onSaveTask,
  onBatchImportTasks,
  hasFullAccess = true,
  isLeader = true
}) => {
  // ---------------------------------------------------------------------------
  // 1. GERENCIAMENTO DE GRUPOS (Lateral Interna)
  // ---------------------------------------------------------------------------
  const [groups, setGroups] = useState<TaskGroup[]>(() => {
    try {
      const saved = localStorage.getItem('ctvacinas_task_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Erro ao carregar grupos:', e);
    }
    return DEFAULT_TASK_GROUPS;
  });

  // Salvar grupos no localStorage sempre que houver alteração
  const saveGroupsToStorage = (newGroups: TaskGroup[]) => {
    setGroups(newGroups);
    try {
      localStorage.setItem('ctvacinas_task_groups', JSON.stringify(newGroups));
    } catch (e) {
      console.error('Erro ao salvar grupos:', e);
    }
  };

  // Grupo selecionado ('all' para todos os grupos)
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [isMobileGroupDrawerOpen, setIsMobileGroupDrawerOpen] = useState(false);

  // Modal para criar novo grupo
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupProject, setNewGroupProject] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#0d9488');

  // Gerenciamento de Grupos (Renomear e Excluir)
  const [activeGroupMenuId, setActiveGroupMenuId] = useState<string | null>(null);
  const [renamingGroup, setRenamingGroup] = useState<TaskGroup | null>(null);
  const [renameGroupName, setRenameGroupName] = useState('');
  const [renameGroupProject, setRenameGroupProject] = useState('');

  const [deletingGroup, setDeletingGroup] = useState<TaskGroup | null>(null);
  const [transferTargetGroupId, setTransferTargetGroupId] = useState<string>('');

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: TaskGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newGroupName.trim(),
      projectName: newGroupProject || undefined,
      color: newGroupColor,
      createdAt: new Date().toISOString(),
      createdBy: currentUser || 'Usuário'
    };

    const updated = [...groups, newGroup];
    saveGroupsToStorage(updated);
    setSelectedGroupId(newGroup.id);
    setNewGroupName('');
    setNewGroupProject('');
    setIsNewGroupModalOpen(false);
  };

  // Iniciar renomeação de grupo
  const handleOpenRenameGroup = (group: TaskGroup) => {
    setRenamingGroup(group);
    setRenameGroupName(group.name);
    setRenameGroupProject(group.projectName || '');
  };

  // Salvar renomeação de grupo (mantendo registros e vínculos de projetos)
  const handleSaveRenameGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingGroup || !renameGroupName.trim()) return;

    const oldName = renamingGroup.name;
    const newName = renameGroupName.trim();
    const newProject = renameGroupProject.trim() || undefined;

    const updatedGroups = groups.map(g => 
      g.id === renamingGroup.id 
        ? { ...g, name: newName, projectName: newProject }
        : g
    );
    saveGroupsToStorage(updatedGroups);

    // Renomear deve atualizar o nome do grupo sem perder seus registros ou vínculos com projetos
    tasks.forEach(t => {
      if (!t.deleted && (t.groupId === renamingGroup.id || t.group === oldName)) {
        onSaveTask({
          ...t,
          groupId: renamingGroup.id,
          group: newName,
          project: t.project || newProject || 'Geral'
        });
      }
    });

    setRenamingGroup(null);
  };

  // Iniciar exclusão de grupo
  const handleOpenDeleteGroup = (group: TaskGroup) => {
    setDeletingGroup(group);
    const other = groups.find(g => g.id !== group.id);
    setTransferTargetGroupId(other ? other.id : '');
  };

  // Atividades vinculadas ao grupo em processo de exclusão
  const tasksInDeletingGroup = useMemo(() => {
    if (!deletingGroup) return [];
    return tasks.filter(t => !t.deleted && (t.groupId === deletingGroup.id || t.group === deletingGroup.name));
  }, [tasks, deletingGroup]);

  // Confirmar exclusão com opção de transferir atividades
  const handleConfirmDeleteGroup = () => {
    if (!deletingGroup) return;

    // Se existirem atividades associadas, transferi-las para o grupo de destino
    if (tasksInDeletingGroup.length > 0) {
      const targetGroup = groups.find(g => g.id === transferTargetGroupId && g.id !== deletingGroup.id)
        || groups.find(g => g.id !== deletingGroup.id)
        || { id: 'group_geral', name: 'Geral', projectName: undefined };

      tasksInDeletingGroup.forEach(t => {
        onSaveTask({
          ...t,
          groupId: targetGroup.id,
          group: targetGroup.name,
          project: t.project || targetGroup.projectName || 'Geral'
        });
      });
    }

    const updatedGroups = groups.filter(g => g.id !== deletingGroup.id);
    saveGroupsToStorage(updatedGroups);

    if (selectedGroupId === deletingGroup.id) {
      setSelectedGroupId('all');
    }
    setDeletingGroup(null);
  };

  // ---------------------------------------------------------------------------
  // 2. CRIAÇÃO RÁPIDA (Bloco de Notas Rápidas)
  // ---------------------------------------------------------------------------
  const [quickText, setQuickText] = useState('');
  const [quickType, setQuickType] = useState<ActivityType>('general');
  const [isSavingQuick, setIsSavingQuick] = useState(false);

  // Identificar grupo ativo atual
  const activeGroup = useMemo(() => {
    if (selectedGroupId === 'all') return null;
    return groups.find(g => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  const handleQuickSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickText.trim()) return;

    setIsSavingQuick(true);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const targetGroup = activeGroup || groups[0] || { id: 'group_geral', name: 'Geral' };
    const projectAssociated = targetGroup.projectName || 'Geral';

    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      activity: quickText.trim(),
      description: `Criado via Notas Rápidas no grupo ${targetGroup.name}`,
      project: projectAssociated,
      group: targetGroup.name,
      groupId: targetGroup.id,
      activityType: quickType,
      isReport: quickType === 'report',
      priority: 'Sem prioridade',
      status: quickType === 'note' ? 'Concluída' : 'Em Andamento',
      requestDate: todayStr,
      plannedStartDate: todayStr,
      completionDate: '', // Sem prazo por padrão
      progress: quickType === 'note' ? 100 : 0,
      nextStep: '',
      projectLead: currentUser || 'Usuário',
      collaborators: [],
      updates: [],
      isRegulatoryContribution: false // Sem contribuição regulatória por padrão
    };

    onSaveTask(newTask);
    setQuickText('');
    setIsSavingQuick(false);
  };

  // ---------------------------------------------------------------------------
  // 3. FILTROS E LISTA PRINCIPAL (Somente em aberto na tela principal)
  // ---------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ActivityType>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');

  // Atividades em aberto (e concluídas mantidas por até 7 dias)
  const openTasks = useMemo(() => {
    const nowMs = Date.now();
    return tasks.filter(t => {
      if (t.deleted) return false;

      // Se a tarefa estiver concluída:
      if (t.status === 'Concluída') {
        // Só exibe se showInActivitiesUntil estiver no futuro (até 7 dias após conclusão)
        if (!t.showInActivitiesUntil) return false;
        const untilMs = new Date(t.showInActivitiesUntil).getTime();
        if (isNaN(untilMs) || untilMs <= nowMs) return false;
      }

      // Filtro de Grupo
      if (selectedGroupId !== 'all') {
        const grp = groups.find(g => g.id === selectedGroupId);
        if (grp) {
          const matchId = t.groupId === grp.id;
          const matchName = t.group === grp.name;
          const matchProject = grp.projectName && t.project === grp.projectName;
          if (!matchId && !matchName && !matchProject) return false;
        }
      }

      // Filtro de Busca
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match = 
          t.activity.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term) ||
          t.project?.toLowerCase().includes(term) ||
          t.group?.toLowerCase().includes(term) ||
          t.projectLead?.toLowerCase().includes(term);
        if (!match) return false;
      }

      // Filtro de Tipo
      if (typeFilter !== 'all') {
        const currentType = t.activityType || (t.isReport ? 'report' : 'general');
        if (currentType !== typeFilter) return false;
      }

      // Filtro de Prioridade
      if (priorityFilter !== 'all') {
        const currentPriority = t.priority || 'Sem prioridade';
        if (currentPriority !== priorityFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      // 1. Registros em aberto primeiro, concluídos (mantidos por 7 dias) por último
      if (a.status !== 'Concluída' && b.status === 'Concluída') return -1;
      if (a.status === 'Concluída' && b.status !== 'Concluída') return 1;

      // 2. Se ambos forem concluídos mantidos por 7 dias: mais recentemente concluídos primeiro
      if (a.status === 'Concluída' && b.status === 'Concluída') {
        const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return timeB - timeA;
      }

      // 3. Se ambos em aberto: Ordenação por Alta prioridade primeiro, depois por prazo mais próximo
      const priorityWeight: Record<Priority, number> = {
        'Alta': 1,
        'Urgente': 1,
        'Média': 2,
        'Baixa': 3,
        'Sem prioridade': 4
      };

      const pA = priorityWeight[a.priority || 'Sem prioridade'] || 4;
      const pB = priorityWeight[b.priority || 'Sem prioridade'] || 4;

      if (pA !== pB) return pA - pB;

      // Prazo mais próximo
      if (a.completionDate && b.completionDate) {
        return new Date(a.completionDate).getTime() - new Date(b.completionDate).getTime();
      }
      if (a.completionDate && !b.completionDate) return -1;
      if (!a.completionDate && b.completionDate) return 1;

      return 0;
    });
  }, [tasks, selectedGroupId, groups, searchTerm, typeFilter, priorityFilter]);

  // Contagem de abertas por grupo
  const openCountByGroup = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.deleted || t.status === 'Concluída') return;
      if (t.groupId) {
        map[t.groupId] = (map[t.groupId] || 0) + 1;
      } else if (t.group) {
        const found = groups.find(g => g.name === t.group);
        if (found) map[found.id] = (map[found.id] || 0) + 1;
      }
    });
    return map;
  }, [tasks, groups]);

  // Total de abertas
  const totalOpenCount = useMemo(() => {
    return tasks.filter(t => !t.deleted && t.status !== 'Concluída').length;
  }, [tasks]);

  // Modal de Conclusão de Atividade (7 dias vs imediato)
  const [completingTask, setCompletingTask] = useState<Task | null>(null);

  // ---------------------------------------------------------------------------
  // 4. CONCLUSÃO DE ATIVIDADES
  // ---------------------------------------------------------------------------
  const handleToggleComplete = (task: Task) => {
    // Se já estiver concluída, clicar no checkbox reabre a atividade diretamente
    if (task.status === 'Concluída') {
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const updatedTask: Task = {
        ...task,
        status: 'Em Andamento',
        progress: 50,
        showInActivitiesUntil: undefined,
        completionDisplayChoice: undefined,
        updates: [
          {
            id: `note_${Date.now()}_${Math.random()}`,
            date: now.toISOString(),
            user: currentUser || 'Usuário',
            note: `Atividade reaberta em ${dateStr}.`
          },
          ...(task.updates || [])
        ]
      };
      onSaveTask(updatedTask);
      return;
    }

    // Se estiver em aberto, apresenta o modal de escolha de exibição (7 dias vs imediato)
    setCompletingTask(task);
  };

  const handleConfirmCompletion = (choice: 'keep_7_days' | 'hide_immediately') => {
    if (!completingTask) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const todayStr = now.toISOString().split('T')[0];

    const displayUntil = choice === 'keep_7_days'
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    const noteText = choice === 'keep_7_days'
      ? `Atividade concluída em ${dateStr}. Mantida visível na lista por 7 dias.`
      : `Atividade concluída em ${dateStr}. Movida para o histórico imediatamente.`;

    const updatedTask: Task = {
      ...completingTask,
      status: 'Concluída',
      progress: 100,
      actualStartDate: completingTask.actualStartDate || todayStr,
      completionDate: completingTask.completionDate || todayStr,
      completedAt: now.toISOString(),
      showInActivitiesUntil: displayUntil,
      completionDisplayChoice: choice,
      updates: [
        {
          id: `note_${Date.now()}_${Math.random()}`,
          date: now.toISOString(),
          user: currentUser || 'Usuário',
          note: noteText
        },
        ...(completingTask.updates || [])
      ]
    };

    onSaveTask(updatedTask);
    setCompletingTask(null);
  };

  // ---------------------------------------------------------------------------
  // 5. EDIÇÃO INLINE RÁPIDA (Prazo, Prioridade, Contribuição, Título)
  // ---------------------------------------------------------------------------
  // Menu de Prazo inline
  const [activeDeadlineTaskId, setActiveDeadlineTaskId] = useState<string | null>(null);
  const [tempDeadlineValue, setTempDeadlineValue] = useState<string>('');

  // Menu de Prioridade inline
  const [activePriorityTaskId, setActivePriorityTaskId] = useState<string | null>(null);

  // Edição inline de Título
  const [editingTitleTaskId, setEditingTitleTaskId] = useState<string | null>(null);
  const [tempTitleValue, setTempTitleValue] = useState<string>('');

  // 3-dots Menu da linha
  const [activeRowMenuTaskId, setActiveRowMenuTaskId] = useState<string | null>(null);

  // Modal de Notas de Atualização
  const [notesModalTask, setNotesModalTask] = useState<Task | null>(null);

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleOutside = () => {
      setActivePriorityTaskId(null);
      setActiveRowMenuTaskId(null);
      setActiveGroupMenuId(null);
    };
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  // Alterar Prazo
  const handleSaveDeadline = (task: Task, newDate: string) => {
    const oldDeadline = task.completionDate;
    const historyEntry = {
      id: `dl_${Date.now()}`,
      previousDate: oldDeadline || 'Sem prazo',
      newDate: newDate || 'Sem prazo',
      previousDeadline: oldDeadline || 'Sem prazo',
      newDeadline: newDate || 'Sem prazo',
      changedBy: currentUser || 'Usuário',
      changedAt: new Date().toISOString(),
      reason: 'Alteração rápida de prazo na linha'
    };

    const updated: Task = {
      ...task,
      completionDate: newDate,
      deadlineHistory: [historyEntry, ...(task.deadlineHistory || [])]
    };

    onSaveTask(updated);
    setActiveDeadlineTaskId(null);
  };

  // Alterar Prioridade
  const handleSavePriority = (task: Task, newPriority: Priority) => {
    const updated: Task = {
      ...task,
      priority: newPriority
    };
    onSaveTask(updated);
    setActivePriorityTaskId(null);
  };

  // Alterar Contribuição Regulatória
  const handleToggleRegulatory = (task: Task) => {
    const current = Boolean(task.isRegulatoryContribution || task.generatesRegulatoryContent);
    const updated: Task = {
      ...task,
      isRegulatoryContribution: !current,
      generatesRegulatoryContent: !current,
      regulatoryStatus: !current ? 'pending' : undefined
    };
    onSaveTask(updated);
  };

  // Salvar Título inline
  const handleSaveInlineTitle = (task: Task) => {
    if (!tempTitleValue.trim()) {
      setEditingTitleTaskId(null);
      return;
    }
    const updated: Task = {
      ...task,
      activity: tempTitleValue.trim()
    };
    onSaveTask(updated);
    setEditingTitleTaskId(null);
  };

  // ---------------------------------------------------------------------------
  // 6. MENU SUPERIOR DIREITO (Histórico, Importação, Impressão, Exportação)
  // ---------------------------------------------------------------------------
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isRetroactiveImportOpen, setIsRetroactiveImportOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Atividades concluídas para o histórico
  const completedTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.deleted) return false;
      if (t.status !== 'Concluída') return false;

      if (selectedGroupId !== 'all') {
        const grp = groups.find(g => g.id === selectedGroupId);
        if (grp) {
          const matchId = t.groupId === grp.id;
          const matchName = t.group === grp.name;
          const matchProject = grp.projectName && t.project === grp.projectName;
          if (!matchId && !matchName && !matchProject) return false;
        }
      }
      return true;
    }).sort((a, b) => {
      const dateA = a.completionDate ? new Date(a.completionDate).getTime() : 0;
      const dateB = b.completionDate ? new Date(b.completionDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [tasks, selectedGroupId, groups]);

  // Exportar histórico para Excel
  const handleExportHistory = () => {
    const tasksToExport = completedTasks.length > 0 ? completedTasks : tasks.filter(t => !t.deleted);
    const exportData = tasksToExport.map(t => ({
      'ID': t.id,
      'Título': t.activity,
      'Tipo': t.activityType || (t.isReport ? 'Relatório' : 'Atividade'),
      'Grupo': t.group || 'Geral',
      'Projeto': t.project || 'Geral',
      'Status': t.status,
      'Prioridade': t.priority || 'Sem prioridade',
      'Prazo': t.completionDate || 'Sem prazo',
      'Responsável': t.projectLead,
      'Contribuição Regulatória': (t.isRegulatoryContribution || t.generatesRegulatoryContent) ? 'Sim' : 'Não',
      'Total de Notas': t.updates?.length || 0
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico');
    XLSX.writeFile(wb, `Historico_Atividades_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsHeaderMenuOpen(false);
  };

  // Imprimir Histórico
  const handlePrintHistory = (filterBySelectedGroup: boolean) => {
    setIsHeaderMenuOpen(false);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const listToPrint = filterBySelectedGroup ? completedTasks : tasks.filter(t => !t.deleted && t.status === 'Concluída');
    const groupTitle = filterBySelectedGroup ? (activeGroup?.name || 'Grupo Selecionado') : 'Todos os Grupos';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Histórico de Atividades - CTVacinas</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; }
            h1 { font-size: 20px; font-weight: 900; color: #0f172a; margin-bottom: 4px; text-transform: uppercase; }
            h2 { font-size: 14px; font-weight: 700; color: #0d9488; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
            th { text-align: left; padding: 8px; border-bottom: 2px solid #cbd5e1; font-weight: 800; text-transform: uppercase; font-size: 10px; color: #64748b; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; background: #f1f5f9; color: #475569; }
            .badge-done { background: #dcfce7; color: #15803d; }
            .badge-reg { background: #ccfbf1; color: #0f766e; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>CTVacinas — Relatório de Histórico</h1>
          <h2>${groupTitle} • Gerado em ${new Date().toLocaleDateString('pt-BR')} por ${currentUser}</h2>
          <table>
            <thead>
              <tr>
                <th>Atividade / Descrição</th>
                <th>Tipo</th>
                <th>Grupo / Projeto</th>
                <th>Responsável</th>
                <th>Prazo / Conclusão</th>
                <th>Regulatória</th>
              </tr>
            </thead>
            <tbody>
              ${listToPrint.map(t => `
                <tr>
                  <td><strong>${t.activity}</strong><br/><span style="color:#64748b;font-size:11px;">${t.description || ''}</span></td>
                  <td><span class="badge">${t.activityType || 'Geral'}</span></td>
                  <td>${t.group || 'Geral'}<br/><span style="color:#64748b;font-size:10px;">${t.project || ''}</span></td>
                  <td>${t.projectLead}</td>
                  <td>${t.completionDate ? formatDateBR(t.completionDate) : 'Sem data'}</td>
                  <td>${(t.isRegulatoryContribution || t.generatesRegulatoryContent) ? '<span class="badge badge-reg">Sim</span>' : 'Não'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Helper de cores de tipo
  const getTypeBadge = (type?: ActivityType, isReport?: boolean) => {
    const t = type || (isReport ? 'report' : 'general');
    switch (t) {
      case 'meeting':
        return { label: 'REUNIÃO', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Users size={11} /> };
      case 'report':
        return { label: 'RELATÓRIO', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200', icon: <FileText size={11} /> };
      case 'note':
        return { label: 'NOTA', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', icon: <StickyNote size={11} /> };
      case 'general':
      default:
        return { label: 'TAREFA', badgeClass: 'bg-teal-50 text-teal-800 border-teal-200', icon: <CheckCircle size={11} /> };
    }
  };

  // Helper de prioridades
  const getPriorityBadge = (p?: Priority) => {
    const priority = p || 'Sem prioridade';
    switch (priority) {
      case 'Alta':
      case 'Urgente':
        return { label: 'Alta', dot: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' };
      case 'Média':
        return { label: 'Média', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
      case 'Baixa':
        return { label: 'Baixa', dot: 'bg-sky-500', text: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' };
      case 'Sem prioridade':
      default:
        return { label: 'Sem prioridade', dot: 'bg-slate-300', text: 'text-slate-400', bg: 'bg-slate-100 border-slate-200' };
    }
  };

  const formatDateBR = (dateStr?: string) => {
    if (!dateStr) return 'Sem prazo';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  return (
    <div className="space-y-4">

      {/* MODAL DE IMPORTAÇÃO RETROATIVA */}
      <RetroactiveImportModal 
        isOpen={isRetroactiveImportOpen}
        onClose={() => setIsRetroactiveImportOpen(false)}
        groups={groups}
        projects={projects}
        defaultGroup={activeGroup?.name || groups[0]?.name}
        currentUser={currentUser}
        onImport={(importedTasks) => {
          if (onBatchImportTasks) {
            onBatchImportTasks(importedTasks);
          } else {
            importedTasks.forEach(t => onSaveTask(t));
          }
        }}
      />

      {/* MODAL DE NOTAS DE ATUALIZAÇÃO */}
      {notesModalTask && (
        <TaskNotesModal 
          isOpen={true}
          onClose={() => setNotesModalTask(null)}
          task={notesModalTask}
          currentUser={currentUser}
          onSaveTask={(updated: Task) => {
            onSaveTask(updated);
            setNotesModalTask(updated);
          }}
        />
      )}

      {/* MODAL DE CRIAR NOVO GRUPO */}
      {isNewGroupModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <header className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight">Criar Novo Grupo</h3>
                <p className="text-[11px] text-slate-400">Organize suas atividades rápidas por setor ou frente</p>
              </div>
              <button 
                onClick={() => setIsNewGroupModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X size={14} />
              </button>
            </header>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nome do Grupo *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Farmacovigilância, Produção, CQ..."
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Vínculo com Projeto (Opcional)
                </label>
                <select
                  value={newGroupProject}
                  onChange={e => setNewGroupProject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="">Sem vínculo direto com projeto</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-2">Cor do Grupo</label>
                <div className="flex items-center gap-2">
                  {['#0d9488', '#2563eb', '#7c3aed', '#e11d48', '#d97706', '#059669', '#475569'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewGroupColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${newGroupColor === c ? 'scale-125 ring-2 ring-slate-800 ring-offset-2' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewGroupModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm"
                >
                  Salvar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE RENOMEAR GRUPO */}
      {renamingGroup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <header className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight">Renomear Grupo</h3>
                <p className="text-[11px] text-slate-400">Atualiza o nome mantendo todos os registros e vínculos</p>
              </div>
              <button 
                type="button"
                onClick={() => setRenamingGroup(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X size={14} />
              </button>
            </header>

            <form onSubmit={handleSaveRenameGroup} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nome do Grupo *</label>
                <input 
                  type="text"
                  required
                  value={renameGroupName}
                  onChange={e => setRenameGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Vínculo com Projeto (Opcional)
                </label>
                <select
                  value={renameGroupProject}
                  onChange={e => setRenameGroupProject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="">Nenhum vínculo (Geral)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRenamingGroup(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!renameGroupName.trim()}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE GRUPO */}
      {deletingGroup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <header className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={18} />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Excluir Grupo</h3>
                  <p className="text-[11px] text-rose-100">{deletingGroup.name}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setDeletingGroup(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X size={14} />
              </button>
            </header>

            <div className="p-6 space-y-4">
              {tasksInDeletingGroup.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 font-medium">
                  Este grupo não possui atividades associadas. Tem certeza de que deseja excluí-lo permanentemente?
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1">
                    <p className="font-black text-amber-900">
                      Atenção: Este grupo possui {tasksInDeletingGroup.length} atividade(s) associada(s).
                    </p>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      Nenhuma atividade, histórico ou contribuição regulatória será excluída. Selecione o grupo de destino para transferir esses registros antes da exclusão:
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                      Transferir atividades para o grupo: *
                    </label>
                    <select
                      value={transferTargetGroupId}
                      onChange={e => setTransferTargetGroupId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    >
                      {groups.filter(g => g.id !== deletingGroup.id).map(g => (
                        <option key={g.id} value={g.id}>{g.name} {g.projectName ? `(${g.projectName})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingGroup(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteGroup}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm"
                >
                  {tasksInDeletingGroup.length > 0 ? 'Transferir e Excluir' : 'Confirmar Exclusão'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ESCOLHA DE CONCLUSÃO (7 DIAS VS IMEDIATO) */}
      {completingTask && (
        <TaskCompletionModal 
          isOpen={true}
          task={completingTask}
          onClose={() => setCompletingTask(null)}
          onConfirm={handleConfirmCompletion}
        />
      )}

      {/* DRAWER / MODAL DE HISTÓRICO CONCLUÍDO */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            <header className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-emerald-400" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Histórico de Concluídas</h3>
                  <p className="text-[11px] text-slate-400">
                    {completedTasks.length} registro(s) finalizado(s) em {activeGroup ? activeGroup.name : 'Todos os Grupos'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X size={16} />
              </button>
            </header>

            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-600">
                Visualizando registros concluídos
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintHistory(selectedGroupId !== 'all')}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer size={13} /> Imprimir
                </button>
                <button
                  type="button"
                  onClick={handleExportHistory}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs"
                >
                  <Download size={13} /> Exportar Excel
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
              {completedTasks.map(t => {
                const typeInfo = getTypeBadge(t.activityType, t.isReport);
                return (
                  <div key={t.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition flex items-start justify-between gap-3 shadow-2xs">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border flex items-center gap-1 ${typeInfo.badgeClass}`}>
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {t.group || 'Geral'} • {t.project || 'Geral'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 line-through opacity-80">{t.activity}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        Finalizado por {t.projectLead} {t.completionDate ? `• Data: ${formatDateBR(t.completionDate)}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {t.updates && t.updates.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setNotesModalTask(t)}
                          className="px-2 py-1 rounded-lg bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200 flex items-center gap-1 hover:bg-teal-100"
                          title="Ver notas de atualização"
                        >
                          <MessageSquare size={11} /> {t.updates.length}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(t)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
                        title="Reabrir atividade"
                      >
                        Reabrir
                      </button>
                    </div>
                  </div>
                );
              })}

              {completedTasks.length === 0 && (
                <div className="py-16 text-center text-slate-400">
                  <CheckCircle size={36} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">Nenhuma atividade concluída neste grupo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LAYOUT PRINCIPAL: LATERAL DE GRUPOS + ÁREA DE NOTAS RÁPIDAS (Imagem 3)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LATERAL INTERNA: GRUPOS (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-teal-600" />
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                Grupos de Atividades
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsNewGroupModalOpen(true)}
              className="p-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 transition"
              title="Criar novo grupo"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Lista de Grupos */}
          <div className="space-y-1.5">
            {/* Opção Todos */}
            <button
              type="button"
              onClick={() => setSelectedGroupId('all')}
              className={`w-full p-2.5 rounded-2xl text-left transition flex items-center justify-between ${
                selectedGroupId === 'all'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:bg-slate-50 font-bold'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                <span className="text-xs truncate">Todos os Grupos</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                selectedGroupId === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {totalOpenCount}
              </span>
            </button>

            {/* Grupos Individuais */}
            {groups.map(g => {
              const count = openCountByGroup[g.id] || 0;
              const isSelected = selectedGroupId === g.id;

              return (
                <div
                  key={g.id}
                  className={`w-full p-2.5 rounded-2xl text-left transition flex items-center justify-between group relative ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-xs font-black'
                      : 'text-slate-700 hover:bg-slate-50 font-bold'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedGroupId(g.id)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: g.color || '#0d9488' }} 
                    />
                    <div className="truncate">
                      <span className="text-xs block truncate">{g.name}</span>
                      {g.projectName && (
                        <span className={`text-[9px] block truncate ${
                          isSelected ? 'text-teal-100 font-semibold' : 'text-slate-400'
                        }`}>
                          {g.projectName}
                        </span>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {count}
                    </span>

                    {/* Menu de 3 pontos para opções do grupo */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGroupMenuId(activeGroupMenuId === g.id ? null : g.id);
                        }}
                        className={`p-1 rounded-lg transition ${
                          isSelected 
                            ? 'text-teal-100 hover:text-white hover:bg-teal-700/60' 
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                        }`}
                        title="Opções do grupo (renomear, excluir)"
                      >
                        <MoreVertical size={13} />
                      </button>

                      {activeGroupMenuId === g.id && (
                        <div 
                          onClick={e => e.stopPropagation()}
                          className="absolute right-0 top-7 z-50 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 text-xs animate-in fade-in zoom-in-95"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveGroupMenuId(null);
                              handleOpenRenameGroup(g);
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-slate-50 transition flex items-center gap-2 text-slate-700 font-bold"
                          >
                            <Edit2 size={13} className="text-teal-600" />
                            <span>Renomear grupo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveGroupMenuId(null);
                              handleOpenDeleteGroup(g);
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-rose-50 transition flex items-center gap-2 text-rose-600 font-bold"
                          >
                            <Trash2 size={13} />
                            <span>Excluir grupo</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botão de Rodapé da Lateral: Criar Grupo */}
          <button
            type="button"
            onClick={() => setIsNewGroupModalOpen(true)}
            className="w-full py-2.5 px-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-teal-400 hover:text-teal-700 transition text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> Novo Grupo
          </button>
        </div>

        {/* ÁREA PRINCIPAL: BLOCO DE NOTAS RÁPIDAS & REGISTROS EM ABERTO (lg:col-span-9) */}
        <div className="lg:col-span-9 space-y-4">
          
          {/* BARRA SUPERIOR: TÍTULO, GRUPO ATIVO, HISTÓRICO & MENU 3 PONTOS */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  Atividades
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black uppercase">
                  {openTasks.length} Abertas
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Grupo ativo: <strong className="text-slate-800">{activeGroup ? activeGroup.name : 'Todos os Grupos'}</strong>
                {activeGroup?.projectName && ` • Projeto: ${activeGroup.projectName}`}
              </p>
            </div>

            {/* Ações do canto superior direito (Histórico + Menu de 3 Pontos como na Imagem 3) */}
            <div className="flex items-center gap-2 relative self-end sm:self-center">
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-2xs"
              >
                <Clock size={14} /> Histórico
              </button>

              {/* Botão de 3 pontos discretos */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsHeaderMenuOpen(!isHeaderMenuOpen);
                  }}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition shadow-2xs"
                  title="Mais opções e importação"
                >
                  <MoreVertical size={16} />
                </button>

                {/* Dropdown do Menu de 3 Pontos */}
                {isHeaderMenuOpen && (
                  <div 
                    onClick={e => e.stopPropagation()}
                    className="absolute right-0 top-11 z-50 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 text-xs font-bold text-slate-700"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsRetroactiveImportOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-teal-50 hover:text-teal-800 transition flex items-center gap-2.5"
                    >
                      <Upload size={14} className="text-teal-600" />
                      <span>Importar por texto ou planilha</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintHistory(true)}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 transition flex items-center gap-2.5"
                    >
                      <Printer size={14} className="text-slate-500" />
                      <span>Imprimir histórico do grupo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintHistory(false)}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 transition flex items-center gap-2.5"
                    >
                      <Printer size={14} className="text-slate-500" />
                      <span>Imprimir histórico completo</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={handleExportHistory}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 transition flex items-center gap-2.5 text-slate-700"
                    >
                      <Download size={14} className="text-slate-500" />
                      <span>Exportar histórico (Excel)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CAIXA DE CRIAÇÃO RÁPIDA (Bloco de Notas Rápidas — Imagem 3) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles size={13} className="text-teal-600" />
                Registrar no Bloco de Notas Rápidas
              </span>

              {activeGroup && (
                <span 
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white"
                  style={{ backgroundColor: activeGroup.color || '#0d9488' }}
                >
                  {activeGroup.name}
                </span>
              )}
            </div>

            {/* Input de Texto Rápido */}
            <form onSubmit={handleQuickSave} className="space-y-3">
              <textarea
                value={quickText}
                onChange={e => setQuickText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleQuickSave();
                  }
                }}
                rows={2}
                placeholder={`O que precisa ser feito ou registrado em ${activeGroup ? activeGroup.name : 'Geral'}? Pressione Ctrl+Enter para salvar...`}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500 resize-none transition"
              />

              {/* Barra de Seleção de Tipo + Botão Salvar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                  <span className="text-[10px] font-black uppercase text-slate-400 mr-1">Tipo:</span>

                  <button
                    type="button"
                    onClick={() => setQuickType('note')}
                    className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                      quickType === 'note'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs font-black'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <StickyNote size={12} /> Nota
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickType('general')}
                    className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                      quickType === 'general'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-2xs font-black'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle size={12} /> Tarefa
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickType('meeting')}
                    className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                      quickType === 'meeting'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-black'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Users size={12} /> Reunião
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickType('report')}
                    className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                      quickType === 'report'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs font-black'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileText size={12} /> Relatório
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!quickText.trim() || isSavingQuick}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
                >
                  <Plus size={14} /> Salvar Imediatamente
                </button>
              </div>
            </form>
          </div>

          {/* BARRA DE PESQUISA E FILTROS RÁPIDOS DA LISTA */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Pesquisar registros abertos..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
                className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Tipos: Todos</option>
                <option value="general">Tarefa</option>
                <option value="note">Nota</option>
                <option value="meeting">Reunião</option>
                <option value="report">Relatório</option>
              </select>

              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value as any)}
                className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Prioridade: Todas</option>
                <option value="Alta">Alta prioridade</option>
                <option value="Média">Média prioridade</option>
                <option value="Baixa">Baixa prioridade</option>
                <option value="Sem prioridade">Sem prioridade</option>
              </select>
            </div>
          </div>

          {/* LISTA DE REGISTROS EM ABERTO (Linhas de Atividades Rápidas) */}
          <div className="space-y-2.5">
            {openTasks.map(task => {
              const typeInfo = getTypeBadge(task.activityType, task.isReport);
              const priorityInfo = getPriorityBadge(task.priority);
              const isRegulatory = Boolean(task.isRegulatoryContribution || task.generatesRegulatoryContent);
              const isEditingThisTitle = editingTitleTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border shadow-2xs transition p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 group relative ${
                    task.status === 'Concluída'
                      ? 'bg-emerald-50/40 border-emerald-200/70 hover:bg-emerald-50/60'
                      : 'bg-white border-slate-200/90 hover:shadow-xs hover:border-teal-200'
                  }`}
                >
                  {/* LADO ESQUERDO: CHECKBOX + TIPO + TÍTULO */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    
                    {/* Checkbox para Concluir / Reabrir */}
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      className={`mt-0.5 w-5 h-5 rounded-lg border-2 transition flex items-center justify-center shrink-0 ${
                        task.status === 'Concluída'
                          ? 'border-emerald-500 bg-emerald-500 text-white shadow-2xs'
                          : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 group/check'
                      }`}
                      title={task.status === 'Concluída' ? "Clique para reabrir atividade" : "Marcar como concluída"}
                    >
                      <Check size={12} className={task.status === 'Concluída' ? "text-white" : "text-emerald-600 opacity-0 group-hover/check:opacity-100 transition"} />
                    </button>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Tag de Tipo */}
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border flex items-center gap-1 ${typeInfo.badgeClass}`}>
                          {typeInfo.icon} {typeInfo.label}
                        </span>

                        {/* Tag de Concluída */}
                        {task.status === 'Concluída' && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Check size={10} /> Concluída (7 dias)
                          </span>
                        )}

                        {/* Tag de Grupo / Projeto */}
                        <span className="text-[10px] font-bold text-slate-400 truncate">
                          {task.group || 'Geral'} {task.project && task.project !== 'Geral' ? `• ${task.project}` : ''}
                        </span>
                      </div>

                      {/* Título com Edição Rápida */}
                      {!isEditingThisTitle ? (
                        <h4 
                          onClick={() => {
                            if (task.status !== 'Concluída') {
                              setEditingTitleTaskId(task.id);
                              setTempTitleValue(task.activity);
                            }
                          }}
                          className={`text-xs sm:text-sm font-bold transition leading-snug break-words ${
                            task.status === 'Concluída'
                              ? 'line-through text-slate-400 font-medium'
                              : 'text-slate-900 hover:text-teal-700 cursor-pointer'
                          }`}
                          title={task.status === 'Concluída' ? 'Atividade concluída' : 'Clique para editar o título'}
                        >
                          {task.activity}
                        </h4>
                      ) : (
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            autoFocus
                            value={tempTitleValue}
                            onChange={e => setTempTitleValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveInlineTitle(task);
                              if (e.key === 'Escape') setEditingTitleTaskId(null);
                            }}
                            className="w-full px-2 py-1 text-xs font-bold text-slate-900 border border-teal-500 rounded-lg outline-none bg-teal-50/20"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveInlineTitle(task)}
                            className="p-1 rounded-md bg-teal-600 text-white"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTitleTaskId(null)}
                            className="p-1 rounded-md bg-slate-200 text-slate-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* LADO DIREITO: PRAZO, PRIORIDADE, REGULATÓRIA, NOTAS, 3 PONTOS */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    
                    {/* 1. PRAZO EDITÁVEL */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeDeadlineTaskId === task.id) {
                            setActiveDeadlineTaskId(null);
                          } else {
                            setActiveDeadlineTaskId(task.id);
                            setTempDeadlineValue(task.completionDate || '');
                          }
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition flex items-center gap-1.5 ${
                          task.completionDate
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-slate-50 border-dashed border-slate-200 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Clique para definir ou alterar o prazo"
                      >
                        <CalendarIcon size={11} className={task.completionDate ? 'text-teal-600' : 'text-slate-400'} />
                        <span>{formatDateBR(task.completionDate)}</span>
                      </button>

                      {/* Popover de Prazo */}
                      {activeDeadlineTaskId === task.id && (
                        <div 
                          onClick={e => e.stopPropagation()}
                          className="absolute right-0 top-8 z-50 p-3 bg-white rounded-2xl shadow-xl border border-slate-200 w-56 space-y-2 animate-in fade-in"
                        >
                          <span className="text-[10px] font-black uppercase text-slate-500 block">Alterar Prazo</span>
                          <input
                            type="date"
                            value={tempDeadlineValue}
                            onChange={e => setTempDeadlineValue(e.target.value)}
                            className="w-full px-2 py-1 text-xs font-bold border border-slate-200 rounded-lg outline-none"
                          />
                          <div className="flex items-center gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSaveDeadline(task, tempDeadlineValue)}
                              className="flex-1 py-1 bg-teal-600 text-white rounded-lg text-[10px] font-bold hover:bg-teal-700"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveDeadline(task, '')}
                              className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200"
                            >
                              Sem prazo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. PRIORIDADE EDITÁVEL */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePriorityTaskId(activePriorityTaskId === task.id ? null : task.id);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition flex items-center gap-1.5 ${priorityInfo.bg} ${priorityInfo.text}`}
                        title="Clique para alterar a prioridade"
                      >
                        <span className={`w-2 h-2 rounded-full ${priorityInfo.dot}`} />
                        <span>{priorityInfo.label}</span>
                      </button>

                      {/* Dropdown de Prioridade */}
                      {activePriorityTaskId === task.id && (
                        <div 
                          onClick={e => e.stopPropagation()}
                          className="absolute right-0 top-8 z-50 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1 animate-in fade-in text-xs font-bold"
                        >
                          <button
                            type="button"
                            onClick={() => handleSavePriority(task, 'Alta')}
                            className="w-full px-3 py-1.5 text-left hover:bg-rose-50 text-rose-700 flex items-center gap-2"
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-500" /> Alta prioridade
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSavePriority(task, 'Média')}
                            className="w-full px-3 py-1.5 text-left hover:bg-amber-50 text-amber-700 flex items-center gap-2"
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-500" /> Média prioridade
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSavePriority(task, 'Baixa')}
                            className="w-full px-3 py-1.5 text-left hover:bg-sky-50 text-sky-700 flex items-center gap-2"
                          >
                            <span className="w-2 h-2 rounded-full bg-sky-500" /> Baixa prioridade
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSavePriority(task, 'Sem prioridade')}
                            className="w-full px-3 py-1.5 text-left hover:bg-slate-50 text-slate-500 flex items-center gap-2"
                          >
                            <span className="w-2 h-2 rounded-full bg-slate-300" /> Sem prioridade
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 3. CONTRIBUIÇÃO REGULATÓRIA EDITÁVEL */}
                    <button
                      type="button"
                      onClick={() => handleToggleRegulatory(task)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition flex items-center gap-1.5 ${
                        isRegulatory
                          ? 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
                      }`}
                      title="Clique para alternar Contribuição Regulatória (Sim / Não)"
                    >
                      {isRegulatory ? <ShieldCheck size={12} className="text-teal-600" /> : <ShieldAlert size={12} className="text-slate-400" />}
                      <span>Regulatória: {isRegulatory ? 'Sim' : 'Não'}</span>
                    </button>

                    {/* 4. NOTAS DE ATUALIZAÇÃO */}
                    <button
                      type="button"
                      onClick={() => setNotesModalTask(task)}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-bold border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:text-teal-800 text-slate-600 transition flex items-center gap-1.5"
                      title="Consultar e adicionar notas de atualização"
                    >
                      <MessageSquare size={12} className="text-teal-600" />
                      <span>{task.updates?.length || 0}</span>
                    </button>

                    {/* 5. MENU 3 PONTOS DA LINHA */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRowMenuTaskId(activeRowMenuTaskId === task.id ? null : task.id);
                        }}
                        className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
                        title="Ações do registro"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {activeRowMenuTaskId === task.id && (
                        <div 
                          onClick={e => e.stopPropagation()}
                          className="absolute right-0 top-8 z-50 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 animate-in fade-in text-xs font-bold text-slate-700"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveRowMenuTaskId(null);
                              onEdit(task);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-slate-50 transition flex items-center gap-2"
                          >
                            <Edit2 size={13} className="text-slate-400" /> Edição Completa
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveRowMenuTaskId(null);
                              setNotesModalTask(task);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-slate-50 transition flex items-center gap-2"
                          >
                            <MessageSquare size={13} className="text-teal-600" /> Adicionar Nota
                          </button>

                          <div className="my-1 border-t border-slate-100" />

                          <button
                            type="button"
                            onClick={() => {
                              setActiveRowMenuTaskId(null);
                              onDelete(task);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-rose-50 text-rose-600 transition flex items-center gap-2"
                          >
                            <Trash2 size={13} /> Excluir Registro
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}

            {openTasks.length === 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-2">
                <CheckCircle size={36} className="mx-auto text-emerald-500" />
                <h4 className="text-sm font-black uppercase text-slate-800">Tudo em dia!</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Nenhum registro em aberto neste grupo. Escreva uma nota rápida acima para adicionar uma nova demanda.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default TaskBoard;
