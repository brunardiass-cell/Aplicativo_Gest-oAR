
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { AccountInfo } from "@azure/msal-browser";
import { Task, ViewMode, AppNotification, ActivityLog, Project, ActivityPlanTemplate, TeamMember, AppUser, SyncInfo, TaskNote, Status } from './types';
import { DEFAULT_TEAM_MEMBERS, DEFAULT_APP_USERS } from './constants';
import UserSelectionView from './components/UserSelectionView';
import PasswordModal from './components/PasswordModal';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import TaskModal from './components/TaskModal';
import TaskDetailsModal from './components/TaskDetailsModal';
import DeletionModal from './components/DeletionModal';
import ActivityLogView from './components/ActivityLogView';
import MonthlyReportModal from './components/MonthlyReportModal';
import ProjectsManager from './components/ProjectsManager';
import AccessControl from './components/AccessControl';
import { MicrosoftGraphService } from './services/microsoftGraphService';
import { PlusCircle, Loader2, Bell, FileText, ShieldCheck, ArrowRight, ShieldAlert } from 'lucide-react';

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

  const [statusFilter, setStatusFilter] = useState<'Todos' | Status>('Todos');
  const [leadFilter, setLeadFilter] = useState<string>('Todos');

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
        setActivityPlans(cloudData.activityPlans || []);
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
      // Don't set isLoading to false here if user might be unauthorized
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
    
    if (isEditing && oldTask && selectedProfile) {
        const updates: TaskNote[] = taskToSave.updates ? [...taskToSave.updates] : [];
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
            createNote(`Etapa do relatório alterada para "${taskToSave.reportStage}".`);
        }
        if (oldTask.currentReviewer !== taskToSave.currentReviewer) {
            if (taskToSave.currentReviewer) {
                createNote(`Novo revisor atribuído: "${taskToSave.currentReviewer}".`);
            } else if (oldTask.currentReviewer) {
                createNote(`Revisor "${oldTask.currentReviewer}" foi removido.`);
            }
        }
        taskToSave.updates = updates;
    }
    
    const wasJustCompleted = 
      (taskToSave.status === 'Concluída' && oldTask?.status !== 'Concluída') ||
      (taskToSave.isReport && taskToSave.reportStage?.includes('Concluído') && !oldTask?.reportStage?.includes('Concluído'));

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

  const handleDeleteTask = (reason: string) => {
    if (!selectedTask) return;
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, deleted: true, deletionReason: reason, deletionDate: new Date().toISOString() } : t));
    setIsDeleteModalOpen(false);
    setSelectedTask(null);
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

  const pendingReviewCount = useMemo(() => {
    const user = selectedProfile?.name;
    if (!user || user === 'Visão Geral da Equipe') return 0;
    return notifications.filter(n => n.userId === user && !n.read && n.type === 'REVIEW_ASSIGNED').length;
  }, [notifications, selectedProfile]);

  const uniqueLeads = useMemo(() => {
    const leads = new Set(tasks.filter(t => !t.deleted).map(t => t.projectLead));
    return ['Todos', ...Array.from(leads).sort()];
  }, [tasks]);

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

      return memberMatch && statusMatch && leadMatch;
    });
  }, [tasks, filterMember, statusFilter, leadFilter]);


  if (isLoading) {
    return <div className="flex h-screen w-screen items-center justify-center bg-brand-light"><Loader2 size={48} className="animate-spin text-brand-primary" /></div>;
  }
  
  if (!isMsalAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans">
        <main className="w-full max-w-md mx-auto text-center animate-in-slow">
          
          <div className="mb-8 inline-block">
            <div className="bg-slate-100 p-5 rounded-3xl shadow-sm">
              <FileText size={36} className="text-brand-primary" strokeWidth={2.5}/>
            </div>
          </div>

          <h1 className="text-5xl font-black tracking-tighter">
            <span className="text-slate-900">GESTÃO</span>
            <span className="text-brand-primary"> REGULATÓRIA</span>
          </h1>

          <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500"/>
            Portal de Atividades • CTVacinas
          </p>

          <div className="mt-12 bg-slate-50/70 p-8 sm:p-10 rounded-[2.5rem] border border-slate-200/80 shadow-sm text-center">
            <h2 className="font-black text-slate-800 uppercase tracking-wider">Bem-vindo ao sistema</h2>
            {/* FIX: Completed the truncated JSX for the unauthenticated view. */}
            <p className="mt-2 text-slate-500 text-sm">Para continuar, autentique-se usando sua conta Microsoft corporativa.</p>
            <button
                onClick={handleLogin}
                className="mt-8 w-full flex items-center justify-center gap-3 bg-slate-800 text-white py-4 rounded-2xl font-bold uppercase text-sm tracking-widest hover:bg-black transition"
            >
                Entrar com Microsoft <ArrowRight size={16}/>
            </button>
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
            <div className="mb-8 inline-block">
                <div className="bg-red-100 p-5 rounded-3xl shadow-sm">
                    <ShieldAlert size={36} className="text-red-500" strokeWidth={2.5}/>
                </div>
            </div>
            <h1 className="text-3xl font-black text-slate-800">Acesso Negado</h1>
            <p className="mt-2 text-slate-500">Seu e-mail (<span className="font-bold">{account?.username}</span>) não está autorizado a acessar este sistema. Entre em contato com o administrador.</p>
            <button onClick={handleLogout} className="mt-8 bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm">Sair</button>
        </div>
      </div>
    );
  }
  
  if (!selectedProfile || !isPasswordAuthenticated) {
    if (!selectedProfile) {
      return (
        <UserSelectionView
          teamMembers={teamMembers}
          onSelectUser={handleProfileSelect}
          onSelectTeamView={handleTeamViewSelect}
          onLogout={handleLogout}
          currentUserRole={currentUserRole}
        />
      );
    }
    
    if (selectedProfile && !isPasswordAuthenticated) {
      return (
        <PasswordModal 
          isOpen={true} 
          onClose={handleSwitchProfile} 
          onConfirm={handlePasswordConfirm}
          userName={selectedProfile.name}
          error={passwordError}
        />
      );
    }
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <Sidebar
        currentView={view}
        onViewChange={setView}
        onGoHome={() => setView('dashboard')}
        onLogout={handleLogout}
        onSwitchProfile={handleSwitchProfile}
        selectedProfile={selectedProfile}
        hasFullAccess={hasFullAccess}
        lastSync={lastSync}
        onSaveBackup={handleSaveLocalBackup}
        onLoadBackup={() => fileInputRef.current?.click()}
      />
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
              <p className="text-sm font-bold text-slate-400">
                {selectedProfile?.name} - {selectedProfile?.role}
              </p>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Bell size={24} className="text-slate-400"/>
                    {pendingReviewCount > 0 && 
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">{pendingReviewCount}</span>
                    }
                </div>
                 <button onClick={() => setIsReportModalOpen(true)} className="p-3 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-100 transition">
                  <FileText size={20}/>
               </button>
                {canCreate && (
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-brand-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-brand-accent transition">
                        <PlusCircle size={16}/> Nova Atividade
                    </button>
                )}
            </div>
        </header>

        {view === 'dashboard' && <Dashboard tasks={tasksForBoard} projects={projects} filteredUser={filterMember} notifications={notifications} onViewTaskDetails={(task) => { setSelectedTask(task); setIsDetailsOpen(true); }} />}
        {view === 'tasks' && (
            <TaskBoard
              tasks={tasksForBoard}
              currentUser={selectedProfile?.name || 'Todos'}
              onEdit={(task) => { setSelectedTask(task); setIsModalOpen(true); }}
              onView={(task) => { setSelectedTask(task); setIsDetailsOpen(true); }}
              onDelete={(task) => { setSelectedTask(task); setIsDeleteModalOpen(true); }}
              onAssignReview={() => {}} // Placeholder
              notifications={notifications.filter(n => !n.read)}
              onNotificationClick={handleNotificationClick}
              onClearSingleNotification={handleClearSingleNotification}
              onClearAllNotifications={handleClearAllReviewNotifications}
              statusFilter={statusFilter}
              leadFilter={leadFilter}
              onStatusFilterChange={setStatusFilter}
              onLeadFilterChange={setLeadFilter}
              uniqueLeads={uniqueLeads}
            />
        )}
        {view === 'projects' && <ProjectsManager projects={projects} onUpdateProjects={setProjects} activityPlans={activityPlans} onUpdateActivityPlans={setActivityPlans} onOpenDeletionModal={()=>{}} teamMembers={teamMembers} currentUserRole={currentUserRole} />}
        {view === 'quality' && <AccessControl teamMembers={teamMembers} onUpdateTeamMembers={setTeamMembers} appUsers={appUsers} onUpdateAppUsers={setAppUsers} />}
        {view === 'traceability' && <ActivityLogView logs={logs} />}

      </main>
      
      {isModalOpen && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedTask(null); }}
          onSave={handleSaveTask}
          projects={projects.map(p => p.name)}
          initialData={selectedTask}
          teamMembers={teamMembers}
        />
      )}
      
      {isDetailsOpen && selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}
      
      {isDeleteModalOpen && selectedTask && (
        <DeletionModal
          itemName={selectedTask.activity}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteTask}
        />
      )}
      
      {isReportModalOpen && (
          <MonthlyReportModal
              isOpen={isReportModalOpen}
              onClose={() => setIsReportModalOpen(false)}
              tasks={tasks}
              filteredUser={filterMember}
          />
      )}
    </div>
  );
};
export default App;
