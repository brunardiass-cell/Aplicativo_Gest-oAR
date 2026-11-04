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
  TeamMember,
  Meeting,
  ViewMode,
  AppUser,
  RegulatoryStandard,
  MeetingAgendaItem,
  MeetingActionItem,
  MeetingAgendaFile,
  MeetingFileLink
} from '../types';
import { DEFAULT_TASK_GROUPS } from '../constants';
import { TaskNotesModal } from './TaskNotesModal';
import { RetroactiveImportModal } from './RetroactiveImportModal';
import { TaskCompletionModal } from './TaskCompletionModal';
import { CriticalAlertModal } from './CriticalAlertModal';
import { RegisterActionAsActivityModal } from './RegisterActionAsActivityModal';
import { sendCriticalActivityAlert, cancelCriticalAlert, calculateAlertDate } from '../services/emailService';
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
  UserCheck,
  Paperclip,
  Link as LinkIcon,
  BookOpen,
  Folder,
  ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface TaskBoardProps {
  tasks: Task[];
  projects?: Project[];
  teamMembers?: TeamMember[];
  appUsers?: AppUser[];
  regulatoryStandards?: RegulatoryStandard[];
  currentUser: string | 'Todos';
  selectedProfile?: TeamMember | null;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onDelete: (task: Task) => void;
  onSaveTask: (task: Task) => void;
  onBatchImportTasks?: (tasks: Task[]) => void;
  onAddMeeting?: (meeting: Meeting) => void;
  onNavigateTab?: (tab: ViewMode) => void;
  onConvertToActivity?: (
    projectId: string,
    macroActivityId: string,
    actionItem: MeetingActionItem,
    targetMicroId?: string,
    customMicroName?: string,
    assigneeOverride?: string,
    dueDateOverride?: string
  ) => any;
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
  teamMembers = [],
  appUsers = [],
  regulatoryStandards = [],
  currentUser,
  selectedProfile,
  onEdit,
  onView,
  onDelete,
  onSaveTask,
  onBatchImportTasks,
  onAddMeeting,
  onNavigateTab,
  onConvertToActivity,
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

  // Campos específicos para Relatório no salvamento rápido
  const [quickReportReviewer, setQuickReportReviewer] = useState('');
  const [quickReportInReview, setQuickReportInReview] = useState(true);

  // Campos específicos para Reunião no salvamento rápido (requisitos CTVacinas)
  const [quickMeetingRole, setQuickMeetingRole] = useState<'organizer' | 'participant' | 'recorder'>('organizer');
  const [quickMeetingProjectMode, setQuickMeetingProjectMode] = useState<'existing' | 'other'>('existing');
  const [quickMeetingProjectId, setQuickMeetingProjectId] = useState<string>('');
  const [quickMeetingCustomProject, setQuickMeetingCustomProject] = useState<string>('');
  const [quickMeetingResponsible, setQuickMeetingResponsible] = useState<string>('');
  const [quickMeetingParticipants, setQuickMeetingParticipants] = useState<string[]>([]);
  const [quickMeetingNewParticipant, setQuickMeetingNewParticipant] = useState<string>('');
  const [quickMeetingCallLink, setQuickMeetingCallLink] = useState<string>('');
  const [quickMeetingDate, setQuickMeetingDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [quickMeetingTime, setQuickMeetingTime] = useState<string>('10:00');
  const [quickMeetingFileLinks, setQuickMeetingFileLinks] = useState<MeetingFileLink[]>([]);
  const [quickMeetingNewLinkName, setQuickMeetingNewLinkName] = useState<string>('');
  const [quickMeetingNewLinkUrl, setQuickMeetingNewLinkUrl] = useState<string>('');
  const [quickMeetingAttachedFiles, setQuickMeetingAttachedFiles] = useState<MeetingAgendaFile[]>([]);
  const [quickMeetingLinkedStandards, setQuickMeetingLinkedStandards] = useState<string[]>([]);
  
  // Pautas e Encaminhamentos da Reunião Rápida
  const [quickMeetingPautas, setQuickMeetingPautas] = useState<Array<{
    id: string;
    title: string;
    linkedRegulatoryStandardIds?: string[];
    discussions?: string;
    decisions?: string;
    actionItems: Array<MeetingActionItem>;
  }>>([
    {
      id: 'pauta_init_1',
      title: 'Pauta Principal',
      linkedRegulatoryStandardIds: [],
      actionItems: []
    }
  ]);

  // Modal de registro de encaminhamento no projeto
  const [actionForRegisterModal, setActionForRegisterModal] = useState<{
    agendaId: string;
    action: MeetingActionItem;
  } | null>(null);

  // Popover placement detector (Evita que o popover abra para baixo forçando rolagem de tela)
  const [popoverPlacement, setPopoverPlacement] = useState<Record<string, 'up' | 'down'>>({});

  const handleOpenPopover = (id: string, e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement = spaceBelow < 240 && rect.top > 180 ? 'up' : 'down';
    setPopoverPlacement(prev => ({ ...prev, [id]: placement }));
  };

  // Identificar grupo ativo atual
  const activeGroup = useMemo(() => {
    if (selectedGroupId === 'all') return null;
    return groups.find(g => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  // Combined regulatory members and app users
  const regulatoryNames = useMemo(() => {
    const names = new Set<string>();
    teamMembers.forEach(tm => { if (tm.name) names.add(tm.name.trim()); });
    appUsers.forEach(au => { if (au.username) names.add(au.username.trim()); });
    return Array.from(names);
  }, [teamMembers, appUsers]);

  const handleAddFileLink = () => {
    const url = quickMeetingNewLinkUrl.trim();
    if (!url) return;
    const name = quickMeetingNewLinkName.trim() || 'Link do Documento';
    const newLink: MeetingFileLink = {
      id: 'link_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name,
      url: url.startsWith('http') ? url : `https://${url}`,
      addedAt: new Date().toISOString()
    };
    setQuickMeetingFileLinks(prev => [...prev, newLink]);
    setQuickMeetingNewLinkName('');
    setQuickMeetingNewLinkUrl('');
  };

  const handleRemoveFileLink = (linkId: string) => {
    setQuickMeetingFileLinks(prev => prev.filter(l => l.id !== linkId));
  };

  const handleAttachLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const sizeFormatted = file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

        const newFileObj: MeetingAgendaFile = {
          id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: file.name,
          size: sizeFormatted,
          type: file.type || file.name.split('.').pop() || 'documento',
          dataUrl: dataUrl
        };

        setQuickMeetingAttachedFiles(prev => [...prev, newFileObj]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveAttachedFile = (fileId: string) => {
    setQuickMeetingAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleAddQuickParticipant = (nameToAdd: string) => {
    const clean = nameToAdd.trim();
    if (!clean) return;
    if (!quickMeetingParticipants.includes(clean)) {
      setQuickMeetingParticipants(prev => [...prev, clean]);
    }
    setQuickMeetingNewParticipant('');
  };

  const handleRemoveQuickParticipant = (nameToRemove: string) => {
    setQuickMeetingParticipants(prev => prev.filter(p => p !== nameToRemove));
  };

  const handleAddQuickPauta = () => {
    const newPauta = {
      id: 'pauta_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: 'Pauta ' + (quickMeetingPautas.length + 1),
      linkedRegulatoryStandardIds: [],
      actionItems: []
    };
    setQuickMeetingPautas(prev => [...prev, newPauta]);
  };

  const handleRemoveQuickPauta = (pautaId: string) => {
    if (quickMeetingPautas.length <= 1) return;
    setQuickMeetingPautas(prev => prev.filter(p => p.id !== pautaId));
  };

  const handleAddQuickActionItem = (
    pautaId: string, 
    actionText: string, 
    resp: string, 
    dueDate: string, 
    destination: 'project' | 'task' | 'meeting_only'
  ) => {
    if (!actionText.trim()) return;
    const newAct: MeetingActionItem = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      action: actionText.trim(),
      responsible: resp.trim() || currentUser || 'Responsável',
      dueDate: dueDate || quickMeetingDate || new Date().toISOString().split('T')[0],
      status: 'Pendente',
      actionDestination: destination,
      convertedToTask: destination === 'task',
      convertedToActivity: destination === 'project'
    };

    setQuickMeetingPautas(prev => prev.map(p => {
      if (p.id === pautaId) {
        return {
          ...p,
          actionItems: [...p.actionItems, newAct]
        };
      }
      return p;
    }));

    // Se a opção for registrar nas atividades da nota rápida imediatamente:
    if (destination === 'task') {
      const targetGroup = activeGroup || groups[0] || { id: 'group_geral', name: 'Geral' };
      const projectAssociated = quickMeetingProjectMode === 'other'
        ? (quickMeetingCustomProject.trim() || 'Outros Projetos')
        : (projects.find(p => p.id === quickMeetingProjectId)?.name || targetGroup.projectName || 'Geral');

      const newTaskFromAction: Task = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        activity: actionText.trim(),
        description: `Encaminhamento de reunião: "${actionText.trim()}"`,
        project: projectAssociated,
        group: targetGroup.name,
        groupId: targetGroup.id,
        activityType: 'general',
        isReport: false,
        priority: 'Sem prioridade',
        status: 'Em Andamento',
        requestDate: new Date().toISOString().split('T')[0],
        plannedStartDate: new Date().toISOString().split('T')[0],
        completionDate: dueDate || quickMeetingDate || '',
        progress: 0,
        nextStep: '',
        projectLead: resp.trim() || currentUser || 'Responsável',
        collaborators: [],
        updates: [
          {
            id: `note_${Date.now()}`,
            date: new Date().toISOString(),
            user: currentUser || 'Usuário',
            note: 'Encaminhamento registrado via Notas Rápidas / Reunião.'
          }
        ],
        isRegulatoryContribution: false
      };
      onSaveTask(newTaskFromAction);
    }
  };

  const handleQuickSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickText.trim()) return;

    setIsSavingQuick(true);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const targetGroup = activeGroup || groups[0] || { id: 'group_geral', name: 'Geral' };

    // Determinar projeto associado
    let finalProjectId = targetGroup.projectName || 'geral';
    let finalProjectName = targetGroup.projectName || 'Geral';

    if (quickType === 'meeting') {
      if (quickMeetingProjectMode === 'other') {
        finalProjectId = 'outros';
        finalProjectName = quickMeetingCustomProject.trim() || 'Outros Projetos';
      } else if (quickMeetingProjectId) {
        const foundProj = projects.find(p => p.id === quickMeetingProjectId);
        if (foundProj) {
          finalProjectId = foundProj.id;
          finalProjectName = foundProj.name;
        }
      }
    }

    const isNote = quickType === 'note';
    const isMeeting = quickType === 'meeting';
    const isReport = quickType === 'report';

    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      activity: quickText.trim(),
      description: isMeeting 
        ? `Reunião: ${quickText.trim()} • Local/Link: ${quickMeetingCallLink || 'Presencial/MS Teams'}` 
        : `Criado via Notas Rápidas no grupo ${targetGroup.name}`,
      project: finalProjectName,
      group: targetGroup.name,
      groupId: targetGroup.id,
      activityType: quickType,
      isReport: isReport,
      reportReviewer: isReport ? (quickReportReviewer.trim() || undefined) : undefined,
      currentReviewer: isReport ? (quickReportReviewer.trim() || undefined) : undefined,
      reportStage: isReport ? (quickReportInReview ? 'Revisão Colaboradores' : 'Em Elaboração') : undefined,
      isMeetingOrganizer: isMeeting ? (quickMeetingRole === 'organizer') : undefined,
      priority: 'Sem prioridade',
      status: isNote ? 'Concluída' : 'Em Andamento',
      requestDate: todayStr,
      plannedStartDate: todayStr,
      completionDate: isMeeting ? (quickMeetingDate || todayStr) : '',
      completedAt: isNote ? now.toISOString() : undefined,
      showInActivitiesUntil: (isNote || isMeeting) ? sevenDaysFromNow : undefined,
      completionDisplayChoice: isNote ? 'keep_7_days' : undefined,
      progress: isNote ? 100 : 0,
      nextStep: '',
      projectLead: isMeeting && quickMeetingResponsible.trim() 
        ? quickMeetingResponsible.trim() 
        : (currentUser !== 'Todos' ? currentUser : (teamMembers[0]?.name || 'Usuário')),
      collaborators: isMeeting ? quickMeetingParticipants : [],
      updates: [],
      isRegulatoryContribution: isMeeting ? (quickMeetingLinkedStandards.length > 0) : false,
      fileLinks: isMeeting ? quickMeetingFileLinks : undefined,
      linkedRegulatoryStandardIds: isMeeting ? quickMeetingLinkedStandards : undefined
    };

    onSaveTask(newTask);

    // Se for reunião: SEMPRE salvar na central de reuniões, independente de ser ou não participante/organizador!
    if (isMeeting) {
      const moderatorName = quickMeetingResponsible.trim() || (currentUser !== 'Todos' ? currentUser : 'Usuário');
      const participantsList = quickMeetingParticipants.length > 0 
        ? quickMeetingParticipants 
        : [moderatorName];

      const mappedAgendaItems: MeetingAgendaItem[] = quickMeetingPautas.map((p, idx) => ({
        id: p.id || `agenda_${Date.now()}_${idx}`,
        title: p.title || quickText.trim(),
        discussions: p.discussions || '',
        decisions: p.decisions || '',
        linkedRegulatoryStandardIds: p.linkedRegulatoryStandardIds || [],
        actionItems: p.actionItems || [],
        attachedFiles: quickMeetingAttachedFiles,
        fileLinks: quickMeetingFileLinks,
        presentationLink: quickMeetingFileLinks[0]?.url || undefined,
        presentationUrl: quickMeetingFileLinks[0]?.url || undefined
      }));

      const newMeeting: Meeting = {
        id: `meeting_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: quickText.trim(),
        projectId: finalProjectId,
        projectName: finalProjectName,
        date: quickMeetingDate || todayStr,
        time: quickMeetingTime || '10:00',
        location: quickMeetingCallLink.trim() || 'MS Teams / CTVacinas',
        type: 'Alinhamento',
        status: 'Agendada',
        moderator: moderatorName,
        participants: participantsList,
        presentParticipants: [],
        absentParticipants: [],
        presentationLink: quickMeetingFileLinks[0]?.url || undefined,
        presentationUrl: quickMeetingFileLinks[0]?.url || undefined,
        linkedRegulatoryStandardIds: quickMeetingLinkedStandards,
        attachedFiles: quickMeetingAttachedFiles,
        fileLinks: quickMeetingFileLinks,
        agendaItems: mappedAgendaItems,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      if (onAddMeeting) {
        onAddMeeting(newMeeting);
      }

      // Se for organizador, navega opcionalmente para a aba reuniões
      if (quickMeetingRole === 'organizer' && onNavigateTab) {
        onNavigateTab('meetings');
      }
    }

    // Resetar campos
    setQuickText('');
    setQuickReportReviewer('');
    setQuickMeetingFileLinks([]);
    setQuickMeetingAttachedFiles([]);
    setQuickMeetingLinkedStandards([]);
    setQuickMeetingParticipants([]);
    setQuickMeetingCallLink('');
    setQuickMeetingPautas([
      {
        id: 'pauta_init_1',
        title: 'Pauta Principal',
        linkedRegulatoryStandardIds: [],
        actionItems: []
      }
    ]);
    setIsSavingQuick(false);
  };

  // ---------------------------------------------------------------------------
  // 3. FILTROS E LISTA PRINCIPAL (Somente em aberto na tela principal)
  // ---------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ActivityType>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');

  // Atividades em aberto (e notas/reuniões/concluídas mantidas por até 7 dias)
  const openTasks = useMemo(() => {
    const nowMs = Date.now();
    return tasks.filter(t => {
      if (t.deleted) return false;

      // Regra de exibição:
      // Se tiver showInActivitiesUntil definido (notas, reuniões ou tarefas mantidas por 7 dias):
      if (t.showInActivitiesUntil) {
        const untilMs = new Date(t.showInActivitiesUntil).getTime();
        if (!isNaN(untilMs) && untilMs <= nowMs) return false;
      } else if (t.status === 'Concluída') {
        // Tarefas concluídas normais sem regra de 7 dias não aparecem em Atividades
        return false;
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

    if (completingTask.isCritical) {
      cancelCriticalAlert(completingTask.id);
    }

    const updatedTask: Task = {
      ...completingTask,
      status: 'Concluída',
      progress: 100,
      actualStartDate: completingTask.actualStartDate || todayStr,
      completionDate: completingTask.completionDate || todayStr,
      completedAt: now.toISOString(),
      showInActivitiesUntil: displayUntil,
      completionDisplayChoice: choice,
      criticalAlertStatus: completingTask.isCritical ? 'cancelado' : completingTask.criticalAlertStatus,
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

  // Modal de Alerta Crítico (Item 1)
  const [isCriticalModalOpen, setIsCriticalModalOpen] = useState(false);
  const [selectedTaskForCritical, setSelectedTaskForCritical] = useState<Task | null>(null);

  const handleSaveCriticalAlert = async (config: {
    isCritical: boolean;
    leadDays: number;
    recipientEmail: string;
    recipientName: string;
  }) => {
    if (!selectedTaskForCritical) return;
    const scheduledDate = selectedTaskForCritical.completionDate 
      ? calculateAlertDate(selectedTaskForCritical.completionDate, config.leadDays) || undefined
      : undefined;

    const updated: Task = {
      ...selectedTaskForCritical,
      isCritical: config.isCritical,
      criticalAlertLeadDays: config.leadDays,
      criticalAlertRecipientEmail: config.recipientEmail,
      criticalAlertRecipientName: config.recipientName,
      criticalAlertScheduledFor: scheduledDate,
      criticalAlertStatus: 'agendado',
      criticalAlertError: undefined
    };

    onSaveTask(updated);

    if (selectedTaskForCritical.completionDate) {
      await sendCriticalActivityAlert({
        activityId: selectedTaskForCritical.id,
        activityTitle: selectedTaskForCritical.activity,
        projectName: selectedTaskForCritical.project || 'Atividades',
        dueDate: selectedTaskForCritical.completionDate,
        leadDays: config.leadDays,
        recipientEmail: config.recipientEmail,
        recipientName: config.recipientName,
        sender: 'brunadias@ctvacinas.org',
        isTask: true
      });
    }

    setIsCriticalModalOpen(false);
    setSelectedTaskForCritical(null);
  };

  const handleRemoveCriticalAlert = async () => {
    if (!selectedTaskForCritical) return;
    await cancelCriticalAlert(selectedTaskForCritical.id);
    const updated: Task = {
      ...selectedTaskForCritical,
      isCritical: false,
      criticalAlertStatus: 'cancelado'
    };
    onSaveTask(updated);
    setIsCriticalModalOpen(false);
    setSelectedTaskForCritical(null);
  };

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

    const scheduledDate = (task.isCritical && newDate)
      ? calculateAlertDate(newDate, task.criticalAlertLeadDays || 2) || undefined
      : (newDate ? task.criticalAlertScheduledFor : undefined);

    const updated: Task = {
      ...task,
      completionDate: newDate,
      criticalAlertScheduledFor: scheduledDate,
      deadlineHistory: [historyEntry, ...(task.deadlineHistory || [])]
    };

    if (task.isCritical && newDate && task.criticalAlertRecipientEmail) {
      sendCriticalActivityAlert({
        activityId: task.id,
        activityTitle: task.activity,
        projectName: task.project || 'Atividades',
        dueDate: newDate,
        leadDays: task.criticalAlertLeadDays || 2,
        recipientEmail: task.criticalAlertRecipientEmail,
        recipientName: task.criticalAlertRecipientName || '',
        sender: 'brunadias@ctvacinas.org',
        isTask: true
      });
    }

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

      {/* MODAL DE ALERTA CRÍTICO (Item 1) */}
      {isCriticalModalOpen && selectedTaskForCritical && (
        <CriticalAlertModal
          isOpen={isCriticalModalOpen}
          onClose={() => {
            setIsCriticalModalOpen(false);
            setSelectedTaskForCritical(null);
          }}
          activityTitle={selectedTaskForCritical.activity}
          projectName={selectedTaskForCritical.project || 'Atividades'}
          dueDate={selectedTaskForCritical.completionDate}
          isCritical={selectedTaskForCritical.isCritical}
          initialLeadDays={selectedTaskForCritical.criticalAlertLeadDays}
          initialRecipientEmail={selectedTaskForCritical.criticalAlertRecipientEmail}
          initialRecipientName={selectedTaskForCritical.criticalAlertRecipientName}
          alertScheduledFor={selectedTaskForCritical.criticalAlertScheduledFor}
          alertSentAt={selectedTaskForCritical.criticalAlertSentAt}
          alertStatus={selectedTaskForCritical.criticalAlertStatus}
          alertError={selectedTaskForCritical.criticalAlertError}
          teamMembers={teamMembers}
          appUsers={appUsers}
          onSave={handleSaveCriticalAlert}
          onRemoveCritical={handleRemoveCriticalAlert}
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
                  if (e.key === 'Enter') {
                    if (e.ctrlKey || e.metaKey) {
                      // Ctrl + Enter: insert newline without saving
                      e.preventDefault();
                      const target = e.currentTarget;
                      const start = target.selectionStart;
                      const end = target.selectionEnd;
                      const newText = quickText.substring(0, start) + '\n' + quickText.substring(end);
                      setQuickText(newText);
                    } else if (!e.shiftKey) {
                      // Enter alone: save immediately
                      e.preventDefault();
                      handleQuickSave();
                    }
                  }
                }}
                rows={2}
                placeholder={`O que precisa ser feito ou registrado em ${activeGroup ? activeGroup.name : 'Geral'}? Enter para salvar imediatamente • Ctrl+Enter para nova linha...`}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500 resize-none transition"
              />

              {/* Opções contextuais para Relatório */}
              {quickType === 'report' && (
                <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-200/80 flex flex-wrap items-center gap-3 text-xs animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-purple-900 font-bold">
                    <UserCheck size={14} className="text-purple-600 shrink-0" />
                    <span>Com quem está o relatório?</span>
                  </div>

                  <div className="flex-1 min-w-[200px] flex items-center gap-2">
                    <select
                      value={quickReportReviewer}
                      onChange={e => setQuickReportReviewer(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-purple-200 rounded-xl font-bold text-purple-950 outline-none text-xs"
                    >
                      <option value="">Selecione quem está com o relatório...</option>
                      {teamMembers.map(m => (
                        <option key={m.id || m.name} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-1.5 font-bold text-purple-900 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={quickReportInReview}
                      onChange={e => setQuickReportInReview(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Está em revisão por alguém</span>
                  </label>
                </div>
              )}

              {/* Opções completas para Reunião no Bloco de Notas */}
              {quickType === 'meeting' && (
                <div className="p-4 bg-blue-50/80 rounded-3xl border border-blue-200/90 space-y-4 text-xs animate-in fade-in">
                  
                  {/* Linha 1: Papel do Usuário + Projeto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                        <Users size={12} className="text-blue-600 shrink-0" />
                        <span>Seu Papel nesta Reunião</span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 bg-white/90 p-1 rounded-2xl border border-blue-200">
                        <button
                          type="button"
                          onClick={() => setQuickMeetingRole('organizer')}
                          className={`py-1.5 px-2 rounded-xl text-xs font-black transition text-center ${
                            quickMeetingRole === 'organizer' 
                              ? 'bg-blue-600 text-white shadow-2xs' 
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Organizador(a)
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickMeetingRole('participant')}
                          className={`py-1.5 px-2 rounded-xl text-xs font-black transition text-center ${
                            quickMeetingRole !== 'organizer' 
                              ? 'bg-slate-800 text-white shadow-2xs' 
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Participante / Registro
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                        <Folder size={12} className="text-blue-600 shrink-0" />
                        <span>Projeto Vinculado</span>
                      </label>
                      <div className="flex gap-1.5">
                        <select
                          value={quickMeetingProjectMode === 'other' ? 'outros' : (quickMeetingProjectId || (projects[0]?.id || ''))}
                          onChange={e => {
                            if (e.target.value === 'outros') {
                              setQuickMeetingProjectMode('other');
                              setQuickMeetingProjectId('outros');
                            } else {
                              setQuickMeetingProjectMode('existing');
                              setQuickMeetingProjectId(e.target.value);
                            }
                          }}
                          className="flex-1 p-2 bg-white border border-blue-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        >
                          <option value="">Selecione o projeto...</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                          <option value="outros">Outros Projetos / Não pertence aos meus projetos</option>
                        </select>
                      </div>

                      {quickMeetingProjectMode === 'other' && (
                        <input
                          type="text"
                          value={quickMeetingCustomProject}
                          onChange={e => setQuickMeetingCustomProject(e.target.value)}
                          placeholder="Digite o nome do projeto externo/outro projeto..."
                          className="w-full mt-1.5 p-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  </div>

                  {/* Linha 2: Responsável / Organizador (Livre ou Lista) + Data e Horário */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                        <UserCheck size={12} className="text-blue-600 shrink-0" />
                        <span>Responsável / Organizador</span>
                      </label>
                      <input
                        list="quick-meeting-resp-list"
                        type="text"
                        value={quickMeetingResponsible}
                        onChange={e => setQuickMeetingResponsible(e.target.value)}
                        placeholder={currentUser !== 'Todos' ? currentUser : 'Nome do responsável...'}
                        className="w-full p-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <datalist id="quick-meeting-resp-list">
                        {regulatoryNames.map(name => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                      <span className="text-[10px] text-blue-900/70 block">
                        Pode escolher da lista regulatória ou digitar qualquer nome.
                      </span>
                    </div>

                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                        <CalendarIcon size={12} className="text-blue-600 shrink-0" />
                        <span>Data da Reunião</span>
                      </label>
                      <input
                        type="date"
                        value={quickMeetingDate}
                        onChange={e => setQuickMeetingDate(e.target.value)}
                        className="w-full p-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                        <Clock size={12} className="text-blue-600 shrink-0" />
                        <span>Horário</span>
                      </label>
                      <input
                        type="time"
                        value={quickMeetingTime}
                        onChange={e => setQuickMeetingTime(e.target.value)}
                        className="w-full p-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Linha 3: Link da Reunião (Opcional quando não for organizador) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                      <LinkIcon size={12} className="text-blue-600 shrink-0" />
                      <span>Link da Chamada (Teams / Meet / Sala) {quickMeetingRole !== 'organizer' ? <strong className="text-blue-600 font-bold">(Opcional / Não obrigatório)</strong> : ''}</span>
                    </label>
                    <input
                      type="text"
                      value={quickMeetingCallLink}
                      onChange={e => setQuickMeetingCallLink(e.target.value)}
                      placeholder={quickMeetingRole !== 'organizer' ? "Opcional: link da chamada virtual se houver..." : "Link do MS Teams ou Google Meet..."}
                      className="w-full p-2 bg-white border border-blue-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Linha 4: Participantes (Qualquer nome ou lista) */}
                  <div className="space-y-2 bg-white/60 p-3 rounded-2xl border border-blue-200/80">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                        <Users size={12} className="text-blue-600 shrink-0" />
                        <span>Participantes & Convidados ({quickMeetingParticipants.length})</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const names = teamMembers.map(tm => tm.name);
                          setQuickMeetingParticipants(Array.from(new Set([...quickMeetingParticipants, ...names])));
                        }}
                        className="text-[10px] font-bold text-blue-700 hover:underline"
                      >
                        + Adicionar toda equipe regulatória
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        list="quick-meeting-part-list"
                        type="text"
                        value={quickMeetingNewParticipant}
                        onChange={e => setQuickMeetingNewParticipant(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddQuickParticipant(quickMeetingNewParticipant);
                          }
                        }}
                        placeholder="Digite qualquer nome ou escolha da lista..."
                        className="flex-1 p-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <datalist id="quick-meeting-part-list">
                        {regulatoryNames.map(name => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                      <button
                        type="button"
                        onClick={() => handleAddQuickParticipant(quickMeetingNewParticipant)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shrink-0"
                      >
                        + Adicionar
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {quickMeetingParticipants.map(part => (
                        <span 
                          key={part} 
                          className="px-2.5 py-1 bg-blue-100/90 text-blue-900 border border-blue-300 rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <span>{part}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuickParticipant(part)}
                            className="text-blue-700 hover:text-rose-600"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      {quickMeetingParticipants.length === 0 && (
                        <span className="text-[11px] text-blue-900/60 italic">Nenhum participante adicionado ainda.</span>
                      )}
                    </div>
                  </div>

                  {/* Linha 5: Links e Anexos de Arquivos (Mesmo quando não sou participante) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Links de Arquivos (SharePoint / OneDrive / Drive) */}
                    <div className="bg-white/90 p-3 rounded-2xl border border-blue-200 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                        <LinkIcon size={12} className="text-blue-600 shrink-0" />
                        <span>Links de Arquivos (SharePoint, OneDrive, Drive, URLs)</span>
                      </label>

                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={quickMeetingNewLinkName}
                          onChange={e => setQuickMeetingNewLinkName(e.target.value)}
                          placeholder="Título do documento (ex: Minuta de Acordo)..."
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                        />
                        <div className="flex gap-1.5">
                          <input
                            type="url"
                            value={quickMeetingNewLinkUrl}
                            onChange={e => setQuickMeetingNewLinkUrl(e.target.value)}
                            placeholder="https://ctvacinas.sharepoint.com/... ou link na nuvem"
                            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddFileLink}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shrink-0"
                          >
                            + Link
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        {quickMeetingFileLinks.map(link => (
                          <div key={link.id} className="p-1.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="font-bold text-blue-800 truncate flex items-center gap-1 hover:underline"
                            >
                              <ExternalLink size={11} className="shrink-0" />
                              <span className="truncate">{link.name}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveFileLink(link.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Anexar Arquivos Locais */}
                    <div className="bg-white/90 p-3 rounded-2xl border border-blue-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                          <Paperclip size={12} className="text-teal-600 shrink-0" />
                          <span>Anexar Arquivos do Computador</span>
                        </label>
                        <label className="cursor-pointer px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-[10px] flex items-center gap-1 transition shadow-2xs">
                          <Plus size={11} />
                          <span>Anexar</span>
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleAttachLocalFile}
                          />
                        </label>
                      </div>

                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {quickMeetingAttachedFiles.map(f => (
                          <div key={f.id} className="p-1.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
                            <span className="font-bold text-teal-900 truncate">{f.name} <span className="text-[10px] text-teal-600 font-normal">({f.size})</span></span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachedFile(f.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        {quickMeetingAttachedFiles.length === 0 && (
                          <p className="text-[11px] text-slate-400 italic py-2 text-center">Nenhum arquivo anexado ainda.</p>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Linha 6: Vincular Norma Regulatória */}
                  <div className="p-3 bg-white/90 rounded-2xl border border-blue-200 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                        <BookOpen size={12} className="text-indigo-600 shrink-0" />
                        <span>Vincular Norma Regulatória à Reunião</span>
                      </label>
                      <select
                        onChange={e => {
                          const val = e.target.value;
                          if (val && !quickMeetingLinkedStandards.includes(val)) {
                            setQuickMeetingLinkedStandards(prev => [...prev, val]);
                          }
                          e.target.value = '';
                        }}
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                      >
                        <option value="">+ Vincular Norma...</option>
                        {regulatoryStandards.map(std => (
                          <option key={std.id} value={std.id}>
                            [{std.type || 'Norma'}] {std.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {quickMeetingLinkedStandards.map(stdId => {
                        const std = regulatoryStandards.find(s => s.id === stdId);
                        if (!std) return null;
                        return (
                          <span key={stdId} className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-bold flex items-center gap-1.5">
                            <BookOpen size={11} className="text-indigo-600" />
                            <span><strong>[{std.type || 'Norma'}]</strong> {std.name}</span>
                            <button
                              type="button"
                              onClick={() => setQuickMeetingLinkedStandards(prev => prev.filter(id => id !== stdId))}
                              className="text-slate-400 hover:text-rose-600 ml-1"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        );
                      })}
                      {quickMeetingLinkedStandards.length === 0 && (
                        <span className="text-[11px] text-slate-400 italic">Nenhuma norma regulatória vinculada a esta reunião.</span>
                      )}
                    </div>
                  </div>

                  {/* Linha 7: Pautas e Encaminhamentos com 3 Opções Explícitas */}
                  <div className="space-y-3 pt-2 border-t border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5">
                        <Layers size={13} className="text-blue-600" />
                        Pautas e Encaminhamentos da Reunião
                      </span>
                      <button
                        type="button"
                        onClick={handleAddQuickPauta}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-2xs"
                      >
                        <Plus size={12} /> + Nova Pauta
                      </button>
                    </div>

                    <div className="space-y-3">
                      {quickMeetingPautas.map((pauta, pIdx) => (
                        <div key={pauta.id} className="p-3 bg-white rounded-2xl border border-blue-200/90 space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-900 font-black text-[11px] flex items-center justify-center shrink-0">
                                {pIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={pauta.title}
                                onChange={e => {
                                  const val = e.target.value;
                                  setQuickMeetingPautas(prev => prev.map(p => p.id === pauta.id ? { ...p, title: val } : p));
                                }}
                                placeholder="Título da Pauta..."
                                className="w-full text-xs font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none px-1 py-0.5"
                              />
                            </div>
                            {quickMeetingPautas.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveQuickPauta(pauta.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Remover Pauta"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>

                          {/* Lista de Encaminhamentos desta Pauta */}
                          <div className="space-y-1.5 pl-6">
                            {pauta.actionItems.map(act => (
                              <div key={act.id} className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-800 block">{act.action}</span>
                                  <span className="text-[10px] text-slate-500">
                                    Resp: <strong>{act.responsible}</strong> • Prazo: {act.dueDate ? act.dueDate.split('-').reverse().join('/') : 'Sem prazo'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {act.actionDestination === 'project' && (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                                      <FolderKanban size={10} /> No Projeto
                                    </span>
                                  )}
                                  {act.actionDestination === 'task' && (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
                                      <CheckCircle size={10} /> Em Atividades
                                    </span>
                                  )}
                                  {act.actionDestination === 'meeting_only' && (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                      <FileText size={10} /> Na Reunião
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuickMeetingPautas(prev => prev.map(p => {
                                        if (p.id === pauta.id) {
                                          return {
                                            ...p,
                                            actionItems: p.actionItems.filter(a => a.id !== act.id)
                                          };
                                        }
                                        return p;
                                      }));
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* Formulário para Adicionar Encaminhamento com as 3 Opções Explícitas */}
                            <div className="p-2.5 bg-slate-50/90 rounded-xl border border-dashed border-slate-300 space-y-2">
                              <span className="text-[10px] font-black uppercase text-slate-500 block">Novo Encaminhamento da Pauta</span>
                              <input
                                id={`quick-action-text-${pauta.id}`}
                                type="text"
                                placeholder="Ação / Encaminhamento deliberado..."
                                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                              />

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                  id={`quick-action-resp-${pauta.id}`}
                                  list="quick-meeting-resp-list"
                                  type="text"
                                  placeholder="Responsável (qualquer nome ou lista)..."
                                  className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                                />
                                <input
                                  id={`quick-action-date-${pauta.id}`}
                                  type="date"
                                  defaultValue={quickMeetingDate}
                                  className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                                />
                              </div>

                              {/* 3 OPÇÕES EXPLÍCITAS CONFORME SOLICITADO */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const textEl = document.getElementById(`quick-action-text-${pauta.id}`) as HTMLInputElement;
                                    const respEl = document.getElementById(`quick-action-resp-${pauta.id}`) as HTMLInputElement;
                                    const dateEl = document.getElementById(`quick-action-date-${pauta.id}`) as HTMLInputElement;
                                    const text = textEl?.value?.trim() || '';
                                    if (!text) return;
                                    const resp = respEl?.value?.trim() || currentUser || 'Responsável';
                                    const date = dateEl?.value || quickMeetingDate;

                                    const tempAction: MeetingActionItem = {
                                      id: 'act_' + Date.now(),
                                      action: text,
                                      responsible: resp,
                                      dueDate: date,
                                      status: 'Pendente',
                                      actionDestination: 'project'
                                    };

                                    setActionForRegisterModal({
                                      agendaId: pauta.id,
                                      action: tempAction
                                    });

                                    textEl.value = '';
                                  }}
                                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-2xs transition"
                                >
                                  <FolderKanban size={12} />
                                  <span>1. Registrar no Projeto</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const textEl = document.getElementById(`quick-action-text-${pauta.id}`) as HTMLInputElement;
                                    const respEl = document.getElementById(`quick-action-resp-${pauta.id}`) as HTMLInputElement;
                                    const dateEl = document.getElementById(`quick-action-date-${pauta.id}`) as HTMLInputElement;
                                    const text = textEl?.value?.trim() || '';
                                    if (!text) return;
                                    const resp = respEl?.value?.trim() || currentUser || 'Responsável';
                                    const date = dateEl?.value || quickMeetingDate;
                                    handleAddQuickActionItem(pauta.id, text, resp, date, 'task');
                                    textEl.value = '';
                                  }}
                                  className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-2xs transition"
                                >
                                  <CheckCircle size={12} />
                                  <span>2. Registrar nas Atividades</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const textEl = document.getElementById(`quick-action-text-${pauta.id}`) as HTMLInputElement;
                                    const respEl = document.getElementById(`quick-action-resp-${pauta.id}`) as HTMLInputElement;
                                    const dateEl = document.getElementById(`quick-action-date-${pauta.id}`) as HTMLInputElement;
                                    const text = textEl?.value?.trim() || '';
                                    if (!text) return;
                                    const resp = respEl?.value?.trim() || currentUser || 'Responsável';
                                    const date = dateEl?.value || quickMeetingDate;
                                    handleAddQuickActionItem(pauta.id, text, resp, date, 'meeting_only');
                                    textEl.value = '';
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-2xs transition ml-auto"
                                >
                                  <FileText size={12} />
                                  <span>3. Apenas Encaminhamento</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

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

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5">
                <span>
                  Atalhos: <strong className="text-slate-700 font-bold">Enter</strong> salva imediatamente • <strong className="text-slate-700 font-bold">Ctrl + Enter</strong> insere nova linha
                </span>
                <span>
                  Autor: <strong>{currentUser !== 'Todos' ? currentUser : 'Usuário'}</strong>
                </span>
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

                        {/* Tag de Relatório - Com quem está / Em revisão por */}
                        {(task.activityType === 'report' || task.isReport) && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                            <UserCheck size={10} className="text-purple-600" />
                            {task.reportReviewer || task.currentReviewer ? (
                              <>Em revisão por: <strong className="text-purple-900">{task.reportReviewer || task.currentReviewer}</strong></>
                            ) : (
                              <>Com: <strong className="text-purple-900">{task.projectLead || 'A definir'}</strong> (Em elaboração)</>
                            )}
                          </span>
                        )}

                        {/* Tag de Reunião - Papel na reunião */}
                        {task.activityType === 'meeting' && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <Users size={10} className="text-blue-600" />
                            {task.isMeetingOrganizer ? 'Organizador(a)' : 'Participante'}
                          </span>
                        )}
                      </div>

                      {/* Título com Edição Rápida */}
                      {!isEditingThisTitle ? (
                        <div className="flex flex-wrap items-center gap-2">
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
                          {task.isCritical && (
                            <span 
                              className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 shadow-2xs"
                              title={task.criticalAlertRecipientName ? `Alerta crítico configurado para ${task.criticalAlertRecipientName}` : 'Atividade marcada como crítica'}
                            >
                              <AlertTriangle size={11} className="text-amber-600 shrink-0" />
                              Crítica {task.criticalAlertLeadDays ? `(${task.criticalAlertLeadDays}d)` : ''}
                            </span>
                          )}
                        </div>
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
                    
                    {/* 1. PRAZO EDITÁVEL (Com Auto-flip para cima quando próximo ao rodapé) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPopover(`deadline_${task.id}`, e);
                          if (activeDeadlineTaskId === task.id) {
                            setActiveDeadlineTaskId(null);
                          } else {
                            setActiveDeadlineTaskId(task.id);
                            setTempDeadlineValue(task.completionDate || '');
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                          task.completionDate
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-slate-50 border-dashed border-slate-200 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Clique para definir ou alterar o prazo"
                      >
                        <CalendarIcon size={13} className={task.completionDate ? 'text-teal-600' : 'text-slate-400'} />
                        <span>{formatDateBR(task.completionDate)}</span>
                      </button>

                      {/* Popover de Prazo com Auto-Flip */}
                      {activeDeadlineTaskId === task.id && (
                        <div 
                          onClick={e => e.stopPropagation()}
                          className={`absolute right-0 z-50 p-3.5 bg-white rounded-2xl shadow-2xl border border-slate-200 w-64 space-y-2.5 animate-in fade-in ${
                            popoverPlacement[`deadline_${task.id}`] === 'up' ? 'bottom-full mb-2' : 'top-9'
                          }`}
                        >
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">Alterar Prazo</span>
                          <input
                            type="date"
                            value={tempDeadlineValue}
                            onChange={e => setTempDeadlineValue(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSaveDeadline(task, tempDeadlineValue)}
                              className="flex-1 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveDeadline(task, '')}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                            >
                              Sem prazo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. PRIORIDADE EDITÁVEL (Com Auto-flip) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPopover(`priority_${task.id}`, e);
                          setActivePriorityTaskId(activePriorityTaskId === task.id ? null : task.id);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${priorityInfo.bg} ${priorityInfo.text}`}
                        title="Clique para alterar a prioridade"
                      >
                        <span className={`w-2 h-2 rounded-full ${priorityInfo.dot}`} />
                        <span>{priorityInfo.label}</span>
                      </button>

                      {/* Dropdown de Prioridade com Auto-flip */}
                      {activePriorityTaskId === task.id && (
                        <div 
                          onClick={e => e.stopPropagation()}
                          className={`absolute right-0 z-50 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 animate-in fade-in text-xs font-bold ${
                            popoverPlacement[`priority_${task.id}`] === 'up' ? 'bottom-full mb-2' : 'top-9'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSavePriority(task, 'Alta')}
                            className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-rose-700 flex items-center gap-2"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Alta prioridade
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSavePriority(task, 'Média')}
                            className="w-full px-3.5 py-2 text-left hover:bg-amber-50 text-amber-700 flex items-center gap-2"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Média prioridade
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSavePriority(task, 'Baixa')}
                            className="w-full px-3.5 py-2 text-left hover:bg-sky-50 text-sky-700 flex items-center gap-2"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Baixa prioridade
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSavePriority(task, 'Sem prioridade')}
                            className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-500 flex items-center gap-2"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Sem prioridade
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 3. CONTRIBUIÇÃO REGULATÓRIA EDITÁVEL */}
                    <button
                      type="button"
                      onClick={() => handleToggleRegulatory(task)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                        isRegulatory
                          ? 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
                      }`}
                      title="Clique para alternar Contribuição Regulatória (Sim / Não)"
                    >
                      {isRegulatory ? <ShieldCheck size={13} className="text-teal-600" /> : <ShieldAlert size={13} className="text-slate-400" />}
                      <span>Regulatória: {isRegulatory ? 'Sim' : 'Não'}</span>
                    </button>

                    {/* 4. NOTAS DE ATUALIZAÇÃO */}
                    <button
                      type="button"
                      onClick={() => setNotesModalTask(task)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:text-teal-800 text-slate-600 transition flex items-center gap-1.5"
                      title="Consultar e adicionar notas de atualização"
                    >
                      <MessageSquare size={13} className="text-teal-600" />
                      <span>{task.updates?.length || 0}</span>
                    </button>

                    {/* 5. MENU 3 PONTOS DA LINHA (Com Auto-flip) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPopover(`row_${task.id}`, e);
                          setActiveRowMenuTaskId(activeRowMenuTaskId === task.id ? null : task.id);
                        }}
                        className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition border border-transparent hover:border-slate-200"
                        title="Ações do registro"
                      >
                        <MoreVertical size={15} />
                      </button>

                      {activeRowMenuTaskId === task.id && (
                        <div 
                          onClick={e => e.stopPropagation()}
                          className={`absolute right-0 z-50 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 animate-in fade-in text-xs font-bold text-slate-700 ${
                            popoverPlacement[`row_${task.id}`] === 'up' ? 'bottom-full mb-2' : 'top-9'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveRowMenuTaskId(null);
                              onEdit(task);
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-slate-50 transition flex items-center gap-2.5"
                          >
                            <Edit2 size={13} className="text-slate-400" /> Edição Completa
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveRowMenuTaskId(null);
                              setNotesModalTask(task);
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-slate-50 transition flex items-center gap-2.5"
                          >
                            <MessageSquare size={13} className="text-teal-600" /> Adicionar Nota
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveRowMenuTaskId(null);
                              setSelectedTaskForCritical(task);
                              setIsCriticalModalOpen(true);
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-amber-50 text-amber-700 transition flex items-center gap-2.5"
                          >
                            <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                            {task.isCritical ? 'Configurar Alerta Crítico' : 'Marcar como Crítica'}
                          </button>

                          <div className="my-1 border-t border-slate-100" />

                          <button
                            type="button"
                            onClick={() => {
                              setActiveRowMenuTaskId(null);
                              onDelete(task);
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-rose-600 transition flex items-center gap-2.5"
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

      {/* REGISTRO DE ENCAMINHAMENTO NO PROJETO VIA NOTAS RÁPIDAS */}
      {actionForRegisterModal && (
        <RegisterActionAsActivityModal
          isOpen={Boolean(actionForRegisterModal)}
          onClose={() => setActionForRegisterModal(null)}
          actionItem={actionForRegisterModal.action}
          agendaTitle={quickMeetingPautas.find(p => p.id === actionForRegisterModal.agendaId)?.title || 'Pauta da Reunião'}
          meetingTitle={quickText.trim() || 'Reunião'}
          defaultProjectId={quickMeetingProjectId}
          projects={projects}
          teamMembers={teamMembers}
          onConfirm={(data) => {
            if (onConvertToActivity) {
              onConvertToActivity(
                data.projectId,
                data.macroActivityId,
                actionForRegisterModal.action,
                data.targetMicroId,
                data.microName,
                data.assignee,
                data.dueDate
              );
            }
            setQuickMeetingPautas(prev => prev.map(p => {
              if (p.id === actionForRegisterModal.agendaId) {
                return {
                  ...p,
                  actionItems: [
                    ...p.actionItems,
                    {
                      ...actionForRegisterModal.action,
                      actionDestination: 'project',
                      convertedToActivity: true,
                      targetProjectId: data.projectId,
                      targetMacroId: data.macroActivityId,
                      targetMicroId: data.targetMicroId,
                      targetMicroName: data.microName
                    }
                  ]
                };
              }
              return p;
            }));
            setActionForRegisterModal(null);
          }}
        />
      )}

    </div>
  );
};

export default TaskBoard;
