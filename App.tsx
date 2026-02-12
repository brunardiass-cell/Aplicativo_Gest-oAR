
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { AccountInfo } from "@azure/msal-browser";
import { Task, ViewMode, AppNotification, ActivityLog, Project, ActivityPlanTemplate, TeamMember, AppUser, SyncInfo, TaskNote, Status, MicroActivity, MicroActivityStatus } from './types';
import { DEFAULT_TEAM_MEMBERS, DEFAULT_APP_USERS } from './constants';
import UserSelectionView from './components/UserSelectionView';
import PasswordModal from './components/PasswordModal';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectsDashboard from './components/ProjectsDashboard';
import TaskBoard from './components/TaskBoard';
import ProjectTaskBoard from './components/ProjectTaskBoard';
import TaskModal from './components/TaskModal';
import TaskDetailsModal from './components/TaskDetailsModal';
import DeletionModal from './components/DeletionModal';
import ActivityLogView from './components/ActivityLogView';
import MonthlyReportModal from './components/MonthlyReportModal';
import ProjectsManager from './components/ProjectsManager';
import AccessControl from './components/AccessControl';
import { MicrosoftGraphService } from './services/microsoftGraphService';
import { PlusCircle, Loader2, Bell, FileText, ShieldCheck, ArrowRight, ShieldAlert, Activity, FolderKanban, ListTodo, GanttChartSquare, Workflow } from 'lucide-react';
import ProjectsVisualBoard from './components/ProjectsVisualBoard';

export type AugmentedMicroActivity = MicroActivity & {
  projectId: string;
  projectName: string;
  macroId: string;
  macroName: string;
};

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activityPlans, setActivityPlans] = useState<ActivityPlanTemplate[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [lastSync, setLastSync] = useState<SyncInfo | null>(null);
  
  const [view, setView] = useState<ViewMode>('dashboard');
  const [isMsalAuthenticated, setIsMsalAuthenticated] = useState(false);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<TeamMember | null>(null);
  const [isPasswordAuthenticated, setIsPasswordAuthenticated] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterMember, setFilterMember] = useState<string | 'Todos'>('Todos');
  
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Filters for Sector Tasks
  const [statusFilter, setStatusFilter] = useState<'Todos' | Status>('Todos');
  const [leadFilter, setLeadFilter] = useState<string>('Todos');
  const [projectFilter, setProjectFilter] = useState<string>('Todos');
  const [dateFilterType, setDateFilterType] = useState<'all' | 'requestDate' | 'completionDate'>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  // Tabs
  const [dashboardView, setDashboardView] = useState<'activities' | 'projects'>('activities');
  const [taskViewTab, setTaskViewTab] = useState<'sector' | 'projects'>('sector');
  const [projectManagerViewTab, setProjectManagerViewTab] = useState<'management' | 'visual'>('management');
  const [initialProjectId, setInitialProjectId] = useState<string | null>(null);

  // Filters for Project Tasks (MicroActivities)
  const [projTask_projectFilter, setProjTask_projectFilter] = useState('Todos');
  const [projTask_statusFilter, setProjTask_statusFilter] = useState<'Todos' | MicroActivityStatus>('Todos');
  const [projTask_assigneeFilter, setProjTask_assigneeFilter] = useState('Todos');
  const [projTask_dateFilterType, setProjTask_dateFilterType] = useState<'all' | 'dueDate'>('all');
  const [projTask_startDateFilter, setProjTask_startDateFilter] = useState('');
  const [projTask_endDateFilter, setProjTask_endDateFilter] = useState('');


  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'task' | 'project' | 'macro' | 'micro';
    name: string;
    ids: { taskId?: string; projectId?: string; macroId?: string; microId?: string };
  } | null>(null);

  const isInitialLoad = useRef(true);
  const saveDataTimeout = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initAuth = async () => {
      const acc = await MicrosoftGraphService.getAccount();
      if (acc) {
        setAccount(acc);
        setIsMsalAuthenticated(true);
        loadDataFromSharePoint();
      } else {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (isMsalAuthenticated && account && appUsers.length > 0 && isAuthorized === null) {
      const userEmail = account.username.toLowerCase();
      const authorizedUser = appUsers.find(
        (user) => user.email.toLowerCase() === userEmail && user.status === 'active'
      );
      setIsAuthorized(!!authorizedUser);
      if (!authorizedUser) {
        setIsLoading(false);
      }
    }
  }, [isMsalAuthenticated, account, appUsers, isAuthorized]);
  
  const loadDataFromSharePoint = async () => {
    setIsLoading(true);
    try {
      const cloudData = await MicrosoftGraphService.loadFromCloud();
      if (cloudData) {
        setTasks(cloudData.tasks || []);
        setProjects(cloudData.projects || []);
        setTeamMembers(cloudData.teamMembers || DEFAULT_TEAM_MEMBERS);
        
        const loadedPlans = cloudData.activityPlans || [];
        const migratedPlans = loadedPlans.map((plan: any) => {
            if (plan.macroActivities.length > 0 && typeof plan.macroActivities[0] === 'string') {
                const defaultPhase = (plan.phases && plan.phases.length > 0) ? plan.phases[0] : 'Fase Padrão';
                return {
                    ...plan,
                    macroActivities: (plan.macroActivities as string[]).map(macroName => ({
                        name: macroName,
                        phase: defaultPhase
                    }))
                };
            }
            return plan;
        });
        setActivityPlans(migratedPlans);
        
        setNotifications(cloudData.notifications || []);
        setLogs(cloudData.logs || []);
        setAppUsers(cloudData.appUsers || DEFAULT_APP_USERS);
      } else {
        setTeamMembers(DEFAULT_TEAM_MEMBERS);
        setAppUsers(DEFAULT_APP_USERS);
      }
      setLastSync({ status: 'synced', timestamp: new Date().toISOString(), user: 'Cloud' });
    } catch (error) {
      setAuthError("Falha ao carregar dados do SharePoint.");
      setLastSync({ status: 'error', timestamp: new Date().toISOString(), user: 'Cloud' });
    } finally {
      if (isAuthorized !== false) {
        setIsLoading(false);
      }
      isInitialLoad.current = false;
    }
  };

  useEffect(() => {
    if (isInitialLoad.current) return;
    if (saveDataTimeout.current) clearTimeout(saveDataTimeout.current);
    
    saveDataTimeout.current = window.setTimeout(async () => {
      setLastSync(prev => ({ ...(prev || { timestamp: '', user: '' }), status: 'syncing' }));
      const dataToSave = { tasks, projects, teamMembers, activityPlans, notifications, logs, appUsers };
      const success = await MicrosoftGraphService.saveToCloud(dataToSave);
      setLastSync(prev => ({
        ...(prev || { user: 'System' }),
        status: success ? 'synced' : 'error',
        timestamp: new Date().toISOString(),
      }));
    }, 2000);
  }, [tasks, projects, teamMembers, activityPlans, notifications, logs, appUsers]);

  const currentUserRole = useMemo(() => {
    if (!account || !appUsers.length) return null;
    const userEmail = account.username.toLowerCase();
    return appUsers.find(u => u.email.toLowerCase() === userEmail)?.role || null;
  }, [account, appUsers]);

  const hasFullAccess = useMemo(() => currentUserRole === 'admin', [currentUserRole]);
  const canCreate = useMemo(() => {
    if(selectedProfile?.id === 'team_view_user' && currentUserRole !== 'admin') {
        return false;
    }
    return isPasswordAuthenticated;
  }, [isPasswordAuthenticated, selectedProfile, currentUserRole]);

  const handleLogin = async () => {
    setIsLoading(true);
    setAuthError(null);
    const result = await MicrosoftGraphService.login();
    if (result.success && result.account) {
      setAccount(result.account);
      setIsMsalAuthenticated(true);
      await loadDataFromSharePoint();
    } else {
      if (result.error) {
        setAuthError("Falha no login com a Microsoft.");
      }
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    await MicrosoftGraphService.logout();
    setIsMsalAuthenticated(false);
    setSelectedProfile(null);
    setIsPasswordAuthenticated(false);
    setAccount(null);
    setIsAuthorized(null);
  };
  
  const handleSaveLocalBackup = () => {
    const dataToSave = { tasks, projects, teamMembers, activityPlans, notifications, logs, appUsers };
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'db.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadLocalBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result;
          if (typeof content === 'string') {
            const data = JSON.parse(content);
            setTasks(data.tasks || []);
            setProjects(data.projects || []);
            setTeamMembers(data.teamMembers || DEFAULT_TEAM_MEMBERS);
            setActivityPlans(data.activityPlans || []);
            setNotifications(data.notifications || []);
            setLogs(data.logs || []);
            setAppUsers(data.appUsers || []);
            alert("Backup local carregado com sucesso! Os dados serão sincronizados com a nuvem.");
          }
        } catch (error) {
          alert("Erro ao ler o arquivo de backup. Verifique se o arquivo é válido.");
        }
      };
      reader.readAsText(file);
    }
     if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleProfileSelect = (user: TeamMember) => {
    setSelectedProfile(user);
    setFilterMember(user.name);
    setLeadFilter('Todos');
    if (!user.password) {
      setIsPasswordAuthenticated(true);
    }
  };

  const handleTeamViewSelect = () => {
    const teamViewerProfile: TeamMember = { id: 'team_view_user', name: 'Visão Geral da Equipe', role: 'Visualizador', isLeader: false };
    setSelectedProfile(teamViewerProfile);
    setFilterMember('Todos');
    setIsPasswordAuthenticated(true);
  };
  
  const handlePasswordConfirm = (password: string) => {
    if (password === selectedProfile?.password) {
      setIsPasswordAuthenticated(true);
      setPasswordError(null);
    } else {
      setPasswordError('Senha incorreta.');
    }
  };

  const handleSwitchProfile = () => {
    setSelectedProfile(null);
    setIsPasswordAuthenticated(false);
    setPasswordError(null);
  };

  const handleSaveTask = (task: Task) => {
    const isEditing = !!task.id && tasks.some(t => t.id === task.id);
    const taskToSave = { ...task };
    
    if (!isEditing) {
        taskToSave.id = `task_${Date.now()}`;
    }

    const oldTask = isEditing ? tasks.find(t => t.id === task.id) : null;
    
    if (isEditing && oldTask) {
        const updates: TaskNote[] = taskToSave.updates ? [...taskToSave.updates] : [];
        if(selectedProfile) {
            const createNote = (noteText: string) => {
                updates.unshift({
                    id: `note_${Date.now()}_${Math.random()}`,
                    date: new Date().toISOString(),
                    user: selectedProfile.name,
                    note: noteText,
                });
            };

            if (oldTask.status !== taskToSave.status) {
                createNote(`Status alterado de "${oldTask.status}" para "${taskToSave.status}".`);
            }
            if (oldTask.reportStage !== taskToSave.reportStage) {
                createNote(`Etapa do fluxo de revisão alterada para "${taskToSave.reportStage}".`);
            }
            if (oldTask.currentReviewer !== taskToSave.currentReviewer) {
                if (taskToSave.currentReviewer) {
                    createNote(`Novo revisor atribuído: "${taskToSave.currentReviewer}".`);
                } else if (oldTask.currentReviewer) {
                    createNote(`Revisor "${oldTask.currentReviewer}" foi removido.`);
                }
                taskToSave.completedCollaborators = []; // Limpa o status de conclusão se o revisor mudar
            }
            if (oldTask.isReport && !taskToSave.isReport) {
                createNote('Fluxo de revisão desativado.');
                taskToSave.completedCollaborators = []; // Limpa o status se o fluxo for desativado
            }
        }
        taskToSave.updates = updates;

        if (oldTask.isReport && !taskToSave.isReport) {
            taskToSave.currentReviewer = undefined;
            taskToSave.reportStage = 'Em Elaboração';
        }
    }
    
    const wasJustCompleted = (taskToSave.status === 'Concluída' && oldTask?.status !== 'Concluída');

    if (wasJustCompleted) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      taskToSave.completionDate = `${year}-${month}-${day}`;
    }

    if (
      taskToSave.isReport &&
      taskToSave.reportStage === 'Próximo Revisor' &&
      taskToSave.currentReviewer &&
      (!oldTask || oldTask.currentReviewer !== taskToSave.currentReviewer || oldTask.reportStage !== 'Próximo Revisor')
    ) {
      const newNotification: AppNotification = {
        id: `notif_${Date.now()}`,
        userId: taskToSave.currentReviewer,
        message: `Revisão: ${taskToSave.activity}`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'REVIEW_ASSIGNED',
        refId: taskToSave.id,
      };
      setNotifications(prev => [...prev, newNotification]);
    }

    setTasks(prev => isEditing ? prev.map(t => t.id === taskToSave.id ? taskToSave : t) : [taskToSave, ...prev]);
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleCompleteCollaboration = (taskId: string) => {
    if (!selectedProfile) return;
    const collaboratorName = selectedProfile.name;

    setTasks(currentTasks => currentTasks.map(task => {
        if (task.id === taskId) {
            const completed = task.completedCollaborators || [];
            if (!completed.includes(collaboratorName)) {
                const newNote: TaskNote = {
                    id: `note_collab_${Date.now()}`,
                    date: new Date().toISOString(),
                    user: collaboratorName,
                    note: 'Colaboração/Revisão finalizada.'
                };
                return {
                    ...task,
                    completedCollaborators: [...completed, collaboratorName],
                    updates: [newNote, ...task.updates]
                };
            }
        }
        return task;
    }));
  };

  const handleOpenDeleteItemModal = (item: { type: 'task' | 'project' | 'macro' | 'micro', ids: { taskId?: string; projectId?: string; macroId?: string; microId?: string; }, name: string }) => {
    setDeleteTarget({
      type: item.type,
      name: item.name,
      ids: item.ids,
    });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeletion = (reason: string) => {
    if (!deleteTarget || !selectedProfile) return;
    
    const { type, ids } = deleteTarget;
    let refId: string | undefined;
    let refType: 'task' | 'project' | undefined;

    if (type === 'task' && ids.taskId) {
        refId = ids.taskId;
        refType = 'task';
    } else if (type === 'project' && ids.projectId) {
        refId = ids.projectId;
        refType = 'project';
    }

    const newLog: ActivityLog = {
      id: `log_${Date.now()}`,
      action: 'EXCLUSÃO',
      taskTitle: deleteTarget.name,
      user: selectedProfile.name,
      timestamp: new Date().toISOString(),
      reason: reason,
      refId: refId,
      refType: refType,
    };
    setLogs(prev => [newLog, ...prev]);


    if (type === 'task' && ids.taskId) {
      setTasks(prev => prev.map(t =>
        t.id === ids.taskId ? { ...t, deleted: true, deletionReason: reason, deletionDate: new Date().toISOString() } : t
      ));
    } else if (type === 'project' && ids.projectId) {
       setProjects(prev => prev.map(p =>
        p.id === ids.projectId ? { ...p, deleted: true, deletionReason: reason, deletionDate: new Date().toISOString() } : p
      ));
    } else if (type === 'macro' && ids.projectId && ids.macroId) {
      setProjects(prev => prev.map(p =>
        p.id === ids.projectId
          ? { ...p, macroActivities: p.macroActivities.filter(m => m.id !== ids.macroId) }
          : p
      ));
    } else if (type === 'micro' && ids.projectId && ids.macroId && ids.microId) {
      setProjects(prev => prev.map(p => {
        if (p.id !== ids.projectId) return p;
        return {
          ...p,
          macroActivities: p.macroActivities.map(m => {
            if (m.id !== ids.macroId) return m;
            return {
              ...m,
              microActivities: m.microActivities.filter(mi => mi.id !== ids.microId)
            };
          })
        };
      }));
    }

    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const handleRestoreItem = (refId: string, refType: 'task' | 'project') => {
    if (!selectedProfile) return;

    let itemName = '';
    if (refType === 'task') {
      const taskToRestore = tasks.find(t => t.id === refId);
      if (taskToRestore) {
        itemName = taskToRestore.activity;
        setTasks(prev => prev.map(t => t.id === refId ? { ...t, deleted: false, deletionReason: undefined, deletionDate: undefined } : t));
      }
    } else if (refType === 'project') {
      const projectToRestore = projects.find(p => p.id === refId);
      if (projectToRestore) {
        itemName = projectToRestore.name;
        setProjects(prev => prev.map(p => p.id === refId ? { ...p, deleted: false, deletionReason: undefined, deletionDate: undefined } : p));
      }
    }

    const newLog: ActivityLog = {
      id: `log_${Date.now()}`,
      action: 'RESTAURAÇÃO',
      taskTitle: itemName,
      user: selectedProfile.name,
      timestamp: new Date().toISOString(),
      reason: 'Item restaurado via painel de auditoria.',
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleClearLog = (logId: string) => {
    if (confirm('Tem certeza que deseja remover este registro de log permanentemente?')) {
      setLogs(prev => prev.filter(log => log.id !== logId));
    }
  };

  const handleClearAllLogs = () => {
    if (confirm('ATENÇÃO: Isso removerá TODOS os registros de auditoria permanentemente. Deseja continuar?')) {
      setLogs([]);
    }
  };


  const handleNotificationClick = (notification: AppNotification) => {
    const task = tasks.find(t => t.id === notification.refId);
    if (task) {
      setSelectedTask(task);
      setIsDetailsOpen(true);
      setNotifications(current => current.map(n => n.id === notification.id ? { ...n, read: true } : n));
    }
  };
  
  const handleClearSingleNotification = (notificationId: string) => {
    setNotifications(current => current.map(n => n.id === notificationId ? { ...n, read: true } : n));
  };

  const handleClearAllReviewNotifications = () => {
    if (!selectedProfile) return;
    setNotifications(current => current.map(n => 
      (n.userId === selectedProfile.name && n.type === 'REVIEW_ASSIGNED') ? { ...n, read: true } : n
    ));
  };
  
  const handleNavigateToProject = (projectId: string) => {
    setInitialProjectId(projectId);
    setView('projects');
    setProjectManagerViewTab('visual');
  };

  const pendingReviewCount = useMemo(() => {
    const user = selectedProfile?.name;
    if (!user || user === 'Visão Geral da Equipe') return 0;
    return notifications.filter(n => n.userId === user && !n.read && n.type === 'REVIEW_ASSIGNED').length;
  }, [notifications, selectedProfile]);

  const activeProjects = useMemo(() => projects.filter(p => !p.deleted), [projects]);

  const uniqueLeads = useMemo(() => {
    const leads = new Set(tasks.filter(t => !t.deleted).map(t => t.projectLead));
    return ['Todos', ...Array.from(leads).sort()];
  }, [tasks]);

  const uniqueProjects = useMemo(() => {
    const projectsList = new Set(activeProjects.map(p => p.name));
    return ['Todos', 'Geral', ...Array.from(projectsList).sort()];
  }, [activeProjects]);

  const tasksForBoard = useMemo(() => {
    return tasks.filter(t => {
      if (t.deleted) return false;

      const memberMatch =
        filterMember === 'Todos' ||
        t.projectLead === filterMember ||
        (Array.isArray(t.collaborators) && t.collaborators.includes(filterMember)) ||
        t.currentReviewer === filterMember;

      const statusMatch = statusFilter === 'Todos' || t.status === statusFilter;
      const leadMatch = leadFilter === 'Todos' || t.projectLead === leadFilter;
      const projectMatch = projectFilter === 'Todos' || t.project === projectFilter;

      const dateFilterMatch = (() => {
        if (dateFilterType === 'all' || (!startDateFilter && !endDateFilter)) {
          return true;
        }

        const dateField = dateFilterType === 'requestDate' ? t.requestDate : t.completionDate;
        if (!dateField) return false;

        const taskDate = new Date(dateField + 'T00:00:00');
        
        const start = startDateFilter ? new Date(startDateFilter + 'T00:00:00') : null;
        const end = endDateFilter ? new Date(endDateFilter + 'T00:00:00') : null;

        if (start && taskDate < start) return false;
        if (end && taskDate > end) return false;
        
        return true;
      })();

      return memberMatch && statusMatch && leadMatch && projectMatch && dateFilterMatch;
    });
  }, [tasks, filterMember, statusFilter, leadFilter, projectFilter, dateFilterType, startDateFilter, endDateFilter]);
  
  const allMicroTasksForUser = useMemo(() => {
    if (!selectedProfile) return [];
    
    const userIsTeamView = selectedProfile.name === 'Visão Geral da Equipe';

    const relevantProjects = projects.filter(p => 
      !p.deleted && 
      (userIsTeamView || p.responsible === selectedProfile.name || p.team?.includes(selectedProfile.name))
    );
    
    const allMicroTasks: AugmentedMicroActivity[] = [];
    for (const project of relevantProjects) {
        for (const macro of project.macroActivities) {
            for (const micro of macro.microActivities) {
                allMicroTasks.push({
                    ...micro,
                    projectId: project.id,
                    projectName: project.name,
                    macroId: macro.id,
                    macroName: macro.name,
                });
            }
        }
    }
    return allMicroTasks;
  }, [projects, selectedProfile]);

  const microTasksForBoard = useMemo(() => {
    return allMicroTasksForUser.filter(micro => {
        const projectMatch = projTask_projectFilter === 'Todos' || micro.projectName === projTask_projectFilter;
        const statusMatch = projTask_statusFilter === 'Todos' || micro.status === projTask_statusFilter;
        const assigneeMatch = projTask_assigneeFilter === 'Todos' || micro.assignee === projTask_assigneeFilter;
        
        const dateFilterMatch = (() => {
            if (projTask_dateFilterType === 'all' || (!projTask_startDateFilter && !projTask_endDateFilter)) return true;
            if (!micro.dueDate) return false;
            
            const taskDate = new Date(micro.dueDate + 'T00:00:00');
            const start = projTask_startDateFilter ? new Date(projTask_startDateFilter + 'T00:00:00') : null;
            const end = projTask_endDateFilter ? new Date(projTask_endDateFilter + 'T00:00:00') : null;

            if (start && taskDate < start) return false;
            if (end && taskDate > end) return false;
            
            return true;
        })();

        return projectMatch && statusMatch && assigneeMatch && dateFilterMatch;
    });
  }, [allMicroTasksForUser, projTask_projectFilter, projTask_statusFilter, projTask_assigneeFilter, projTask_dateFilterType, projTask_startDateFilter, projTask_endDateFilter]);
  
  const uniqueProjectsForMicroTasks = useMemo(() => ['Todos', ...Array.from(new Set(allMicroTasksForUser.map(m => m.projectName)))], [allMicroTasksForUser]);
  const uniqueAssigneesForMicroTasks = useMemo(() => ['Todos', ...Array.from(new Set(allMicroTasksForUser.map(m => m.assignee)))], [allMicroTasksForUser]);


  if (isLoading) {
    return <div className="flex h-screen w-screen items-center justify-center bg-brand-light"><Loader2 size={48} className="animate-spin text-brand-primary" /></div>;
  }
  
  if (!isMsalAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans">
        <main className="w-full max-w-md mx-auto text-center animate-in-slow">
          <div className="mb-8 inline-block"><div className="bg-slate-100 p-5 rounded-3xl shadow-sm"><FileText size={36} className="text-brand-primary" strokeWidth={2.5}/></div></div>
          <h1 className="text-5xl font-black tracking-tighter"><span className="text-slate-900">GESTÃO</span><span className="text-brand-primary"> REGULATÓRIA</span></h1>
          <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2"><ShieldCheck size={14} className="text-emerald-500"/>Portal de Atividades • CTVacinas</p>
          <div className="mt-12 bg-slate-50/70 p-8 sm:p-10 rounded-[2.5rem] border border-slate-200/80 shadow-sm text-center">
            <h2 className="font-black text-slate-800 uppercase tracking-wider">Bem-vindo ao sistema</h2>
            <p className="mt-2 text-slate-500 text-sm">Para continuar, autentique-se usando sua conta Microsoft corporativa.</p>
            <button onClick={handleLogin} className="mt-8 w-full flex items-center justify-center gap-3 bg-slate-800 text-white py-4 rounded-2xl font-bold uppercase text-sm tracking-widest hover:bg-black transition">Entrar com Microsoft <ArrowRight size={16}/></button>
            {authError && <p className="mt-4 text-sm text-red-500">{authError}</p>}
          </div>
        </main>
      </div>
    );
  }
  
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans text-center">
        <div className="w-full max-w-md mx-auto">
            <div className="mb-8 inline-block"><div className="bg-red-100 p-5 rounded-3xl shadow-sm"><ShieldAlert size={36} className="text-red-500" strokeWidth={2.5}/></div></div>
            <h1 className="text-3xl font-black text-slate-800">Acesso Negado</h1>
            <p className="mt-2 text-slate-500">Seu e-mail (<span className="font-bold">{account?.username}</span>) não está autorizado a acessar este sistema. Entre em contato com o administrador.</p>
            <button onClick={handleLogout} className="mt-8 bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm">Sair</button>
        </div>
      </div>
    );
  }
  
  if (!selectedProfile || !isPasswordAuthenticated) {
    if (!selectedProfile) {
      return (<UserSelectionView teamMembers={teamMembers} onSelectUser={handleProfileSelect} onSelectTeamView={handleTeamViewSelect} onLogout={handleLogout} currentUserRole={currentUserRole}/>);
    }
    if (selectedProfile && !isPasswordAuthenticated) {
      return (<PasswordModal isOpen={true} onClose={handleSwitchProfile} onConfirm={handlePasswordConfirm} userName={selectedProfile.name} error={passwordError}/>);
    }
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <Sidebar currentView={view} onViewChange={setView} onGoHome={() => setView('dashboard')} onLogout={handleLogout} onSwitchProfile={handleSwitchProfile} selectedProfile={selectedProfile} hasFullAccess={hasFullAccess} lastSync={lastSync} onSaveBackup={handleSaveLocalBackup} onLoadBackup={() => fileInputRef.current?.click()}/>
      <input type="file" ref={fileInputRef} onChange={handleLoadLocalBackup} accept=".json" className="hidden" />

      <main className="flex-1 p-10 overflow-y-auto ml-64">
        <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                {view === 'dashboard' && 'Dashboard'}
                {view === 'tasks' && 'Painel de Atividades'}
                {view === 'projects' && 'Gerenciador de Projetos'}
                {view === 'quality' && 'Controle de Acesso'}
                {view === 'traceability' && 'Auditoria'}
              </h1>
              <p className="text-sm font-bold text-slate-400">{selectedProfile?.name} - {selectedProfile?.role}</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Bell size={24} className="text-slate-400"/>
                    {pendingReviewCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">{pendingReviewCount}</span>}
                </div>
                {view === 'tasks' && (
                  <>
                    <button onClick={() => setIsReportModalOpen(true)} className="p-3 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-100 transition"><FileText size={20}/></button>
                    {canCreate && (<button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-brand-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-brand-accent transition"><PlusCircle size={16}/> Nova Atividade</button>)}
                  </>
                )}
            </div>
        </header>

        {view === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex gap-2 w-fit">
              <button onClick={() => setDashboardView('activities')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${dashboardView === 'activities' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Activity size={14} /> Dashboard de Atividades</button>
              <button onClick={() => setDashboardView('projects')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${dashboardView === 'projects' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><FolderKanban size={14} /> Dashboard de Projetos</button>
            </div>
            {dashboardView === 'activities' ? (<Dashboard tasks={tasks} projects={activeProjects} filteredUser={filterMember} notifications={notifications} onViewTaskDetails={(task) => { setSelectedTask(task); setIsDetailsOpen(true); }} />) : (<ProjectsDashboard projects={activeProjects} tasks={tasks} filteredUser={filterMember} onNavigateToProject={handleNavigateToProject}/>)}
          </div>
        )}
        {view === 'tasks' && (
          <div className="space-y-6">
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex gap-2 w-fit">
              <button onClick={() => setTaskViewTab('sector')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${taskViewTab === 'sector' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><ListTodo size={14} /> Painel Setorial</button>
              <button onClick={() => setTaskViewTab('projects')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${taskViewTab === 'projects' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><FolderKanban size={14} /> Painel de Projetos</button>
            </div>
            
            {taskViewTab === 'sector' ? (
              <TaskBoard tasks={tasksForBoard} currentUser={selectedProfile?.name || 'Todos'} onEdit={(task) => { setSelectedTask(task); setIsModalOpen(true); }} onView={(task) => { setSelectedTask(task); setIsDetailsOpen(true); }} onDelete={(task) => {handleOpenDeleteItemModal({ type: 'task', name: task.activity, ids: { taskId: task.id } });}} onAssignReview={() => {}} notifications={notifications.filter(n => !n.read)} onNotificationClick={handleNotificationClick} onClearSingleNotification={handleClearSingleNotification} onClearAllNotifications={handleClearAllReviewNotifications} statusFilter={statusFilter} leadFilter={leadFilter} onStatusFilterChange={setStatusFilter} onLeadFilterChange={setLeadFilter} uniqueLeads={uniqueLeads} projectFilter={projectFilter} onProjectFilterChange={setProjectFilter} uniqueProjects={uniqueProjects} dateFilterType={dateFilterType} onDateFilterTypeChange={setDateFilterType} startDateFilter={startDateFilter} onStartDateFilterChange={setStartDateFilter} endDateFilter={endDateFilter} onEndDateFilterChange={setEndDateFilter} onCompleteCollaboration={handleCompleteCollaboration} />
            ) : (
              <ProjectTaskBoard 
                microTasks={microTasksForBoard} 
                onNavigateToProject={handleNavigateToProject}
                projectFilter={projTask_projectFilter}
                onProjectFilterChange={setProjTask_projectFilter}
                uniqueProjects={uniqueProjectsForMicroTasks}
                statusFilter={projTask_statusFilter}
                onStatusFilterChange={setProjTask_statusFilter}
                assigneeFilter={projTask_assigneeFilter}
                onAssigneeFilterChange={setProjTask_assigneeFilter}
                uniqueAssignees={uniqueAssigneesForMicroTasks}
                dateFilterType={projTask_dateFilterType}
                onDateFilterTypeChange={setProjTask_dateFilterType}
                startDateFilter={projTask_startDateFilter}
                onStartDateFilterChange={setProjTask_startDateFilter}
                endDateFilter={projTask_endDateFilter}
                onEndDateFilterChange={setProjTask_endDateFilter}
              />
            )}
          </div>
        )}
        {view === 'projects' && (
          <div className="space-y-6">
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex gap-2 w-fit">
              <button onClick={() => setProjectManagerViewTab('management')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${projectManagerViewTab === 'management' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><GanttChartSquare size={14} /> Gerenciamento</button>
              <button onClick={() => setProjectManagerViewTab('visual')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${projectManagerViewTab === 'visual' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Workflow size={14} /> Modelo Visual</button>
            </div>
            {projectManagerViewTab === 'management' ? (
              <ProjectsManager projects={activeProjects} onUpdateProjects={setProjects} activityPlans={activityPlans} onUpdateActivityPlans={setActivityPlans} onOpenDeletionModal={(item) => handleOpenDeleteItemModal(item as any)} teamMembers={teamMembers} currentUserRole={currentUserRole} initialProjectId={initialProjectId} />
            ) : (
              <ProjectsVisualBoard projects={activeProjects} onUpdateProjects={setProjects} initialProjectId={initialProjectId} onClearInitialProjectId={() => setInitialProjectId(null)} />
            )}
          </div>
        )}
        {view === 'quality' && <AccessControl teamMembers={teamMembers} onUpdateTeamMembers={setTeamMembers} appUsers={appUsers} onUpdateAppUsers={setAppUsers} />}
        {view === 'traceability' && <ActivityLogView logs={logs} onRestoreItem={handleRestoreItem} onClearLog={handleClearLog} onClearAllLogs={handleClearAllLogs} />}
      </main>
      
      {isModalOpen && (<TaskModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedTask(null); }} onSave={handleSaveTask} projects={['Geral', ...activeProjects.map(p => p.name)]} initialData={selectedTask} teamMembers={teamMembers} hasFullAccess={hasFullAccess}/>)}
      {isDetailsOpen && selectedTask && (<TaskDetailsModal task={selectedTask} onClose={() => setIsDetailsOpen(false)}/>)}
      {isDeleteModalOpen && deleteTarget && (<DeletionModal itemName={deleteTarget.name} onClose={() => { setIsDeleteModalOpen(false); setDeleteTarget(null); }} onConfirm={handleConfirmDeletion}/>)}
      {isReportModalOpen && (<MonthlyReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} tasks={tasksForBoard} filteredUser={filterMember} filters={{dateFilterType, startDateFilter, endDateFilter, projectFilter, statusFilter, leadFilter}}/>)}
    </div>
  );
};
export default App;