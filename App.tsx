
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, ViewMode, AppNotification, ActivityLog, Project, ActivityPlanTemplate, TeamMember, AppUser, SyncInfo } from './types';
import { DEFAULT_TEAM_MEMBERS } from './constants';
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
import { PlusCircle, Loader2, LogIn, Bell, FileText } from 'lucide-react';

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

  const isInitialLoad = useRef(true);
  const saveDataTimeout = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initAuth = async () => {
      const account = await MicrosoftGraphService.getAccount();
      if (account) {
        setIsMsalAuthenticated(true);
        loadDataFromSharePoint();
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);
  
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
        setAppUsers(cloudData.appUsers || []);
      } else {
        setTeamMembers(DEFAULT_TEAM_MEMBERS);
      }
      setLastSync({ status: 'synced', timestamp: new Date().toISOString(), user: 'Cloud' });
    } catch (error) {
      setAuthError("Falha ao carregar dados do SharePoint.");
      setLastSync({ status: 'error', timestamp: new Date().toISOString(), user: 'Cloud' });
    } finally {
      setIsLoading(false);
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

  const hasFullAccess = useMemo(() => !!(selectedProfile?.isLeader && isPasswordAuthenticated), [selectedProfile, isPasswordAuthenticated]);
  const canCreate = useMemo(() => isPasswordAuthenticated && selectedProfile?.id !== 'team_view_user', [isPasswordAuthenticated, selectedProfile]);

  const handleLogin = async () => {
    setIsLoading(true);
    setAuthError(null);
    const result = await MicrosoftGraphService.login();
    if (result.success) {
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
    const isEditing = tasks.some(t => t.id === task.id);
    setTasks(prev => isEditing ? prev.map(t => t.id === task.id ? task : t) : [{ ...task, id: `task_${Date.now()}` }, ...prev]);
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = (reason: string) => {
    if (!selectedTask) return;
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, deleted: true, deletionReason: reason, deletionDate: new Date().toISOString() } : t));
    setIsDeleteModalOpen(false);
    setSelectedTask(null);
  };

  const pendingReviewCount = useMemo(() => {
    const user = selectedProfile?.name;
    if (!user) return 0;
    return notifications.filter(n => (n.userId === user || filterMember === 'Todos') && !n.read && n.type === 'REVIEW_ASSIGNED').length;
  }, [notifications, selectedProfile, filterMember]);


  if (isLoading) {
    return <div className="flex h-screen w-screen items-center justify-center bg-brand-light"><Loader2 size={48} className="animate-spin text-brand-primary" /></div>;
  }
  
  if (!isMsalAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-light flex-col gap-6 p-4">
        <h1 className="text-4xl font-black uppercase text-slate-900">Gestão <span className="text-brand-primary">Regulatória</span></h1>
        <button onClick={handleLogin} className="px-10 py-4 bg-brand-primary text-white rounded-full font-bold uppercase text-sm tracking-widest flex items-center gap-3 hover:bg-brand-accent shadow-lg shadow-teal-500/20 transition">
          <LogIn size={20}/> Entrar com Microsoft
        </button>
        {authError && <p className="text-red-500 mt-4">{authError}</p>}
      </div>
    );
  }

  if (!selectedProfile) {
    return <UserSelectionView onSelectUser={handleProfileSelect} onSelectTeamView={handleTeamViewSelect} teamMembers={teamMembers} onLogout={handleLogout} />;
  }

  if (selectedProfile.password && !isPasswordAuthenticated) {
    return <PasswordModal isOpen={true} onConfirm={handlePasswordConfirm} onClose={handleSwitchProfile} userName={selectedProfile.name} error={passwordError}/>
  }
  
  return (
    <div className="flex min-h-screen bg-brand-light text-slate-800">
      <input type="file" ref={fileInputRef} onChange={handleLoadLocalBackup} accept=".json" className="hidden" />
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        onGoHome={() => setView('dashboard')}
        onSwitchProfile={handleSwitchProfile} 
        selectedProfile={selectedProfile}
        hasFullAccess={hasFullAccess}
        lastSync={lastSync}
        onLogout={handleLogout}
        onSaveBackup={handleSaveLocalBackup}
        onLoadBackup={() => fileInputRef.current?.click()}
      />
      
      <main className="flex-1 ml-64 p-10 max-w-[1600px]">
        <header className="flex justify-between items-start mb-12">
            <div className="flex-1">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                    {view === 'dashboard' ? `Painel Executivo` : 
                     view === 'tasks' ? 'Atividades Regulatórias' : 
                     view === 'projects' ? 'Fluxos Estratégicos' : 
                     view === 'quality' ? 'Gestão de Acesso' : 'Rastreabilidade'}
                </h1>
                <p className="text-sm font-bold text-brand-primary mt-1">
                  Visão de {selectedProfile.name}
                </p>
            </div>
            
            <div className="flex items-center gap-2">
               <button onClick={() => {}} className="relative p-3 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-100 transition">
                  <Bell size={20}/>
                  {pendingReviewCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{pendingReviewCount}</span>}
               </button>
               <button onClick={() => setIsReportModalOpen(true)} className="p-3 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-100 transition">
                  <FileText size={20}/>
               </button>
               {view === 'tasks' && canCreate && (
                 <button 
                  onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
                  className="ml-4 px-6 py-3.5 bg-slate-800 text-white rounded-full font-bold text-xs uppercase tracking-wider hover:bg-black transition shadow-lg flex items-center gap-2"
                >
                  <PlusCircle size={16} /> Nova Atividade
                </button>
               )}
            </div>
        </header>

        <div className="animation-in">
          {view === 'dashboard' && <Dashboard tasks={tasks} filteredUser={filterMember} notifications={notifications} onViewTaskDetails={(task) => { setSelectedTask(task); setIsDetailsOpen(true); }} />}
          {view === 'quality' && hasFullAccess && <AccessControl teamMembers={teamMembers} onUpdateTeamMembers={setTeamMembers} appUsers={appUsers} onUpdateAppUsers={setAppUsers} />}
          {view === 'tasks' && <TaskBoard tasks={tasks.filter(t => !t.deleted && (filterMember === 'Todos' || t.projectLead === filterMember || t.collaborators.includes(filterMember)))} currentUser={filterMember} onEdit={(task) => { setSelectedTask(task); setIsModalOpen(true); }} onView={(task) => { setSelectedTask(task); setIsDetailsOpen(true); }} onDelete={(task) => { setSelectedTask(task); setIsDeleteModalOpen(true); }} onAssignReview={() => {}} onNotificationClick={() => {}} onClearSingleNotification={() => {}} notifications={notifications.filter(n => n.userId === selectedProfile?.name)} />}
          {view === 'projects' && <ProjectsManager projects={projects} onUpdateProjects={setProjects} activityPlans={activityPlans} onUpdateActivityPlans={setActivityPlans} onOpenDeletionModal={() => {}} teamMembers={teamMembers} />}
          {view === 'traceability' && hasFullAccess && <ActivityLogView logs={logs} />}
        </div>

        {isModalOpen && <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} projects={Array.from(new Set(tasks.map(t => t.project)))} initialData={selectedTask} teamMembers={teamMembers} />}
        {isDetailsOpen && selectedTask && <TaskDetailsModal task={selectedTask} onClose={() => { setIsDetailsOpen(false); setSelectedTask(null); }} />}
        {isDeleteModalOpen && selectedTask && <DeletionModal itemName={selectedTask.activity} onClose={() => { setIsDeleteModalOpen(false); setSelectedTask(null); }} onConfirm={handleDeleteTask} />}
        {isReportModalOpen && <MonthlyReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} tasks={tasks} />}
      </main>
    </div>
  );
};

export default App;
