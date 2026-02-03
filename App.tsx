
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { AccountInfo } from "@azure/msal-browser";
import { Task, ViewMode, AppNotification, ActivityLog, Project, ActivityPlanTemplate, TeamMember, AppUser, SyncInfo } from './types';
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

  const hasFullAccess = useMemo(() => !!(selectedProfile?.isLeader && isPasswordAuthenticated), [selectedProfile, isPasswordAuthenticated]);
  const canCreate = useMemo(() => isPasswordAuthenticated && selectedProfile?.id !== 'team_view_user', [isPasswordAuthenticated, selectedProfile]);

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
            <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
              Utilize suas credenciais institucionais para acessar o painel de controle e fluxos estratégicos.
            </p>

            <button 
              onClick={handleLogin} 
              className="mt-8 w-full bg-slate-900 text-white rounded-2xl p-3.5 flex items-center justify-center gap-4 hover:bg-black transition-colors shadow-lg shadow-slate-200 active:scale-[0.98]">
              <div className="bg-brand-primary p-2.5 rounded-lg">
                  <ArrowRight size={20} />
              </div>
              <div className="text-left flex-1">
                  <span className="font-bold text-sm uppercase tracking-wider">Entrar com Microsoft</span>
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Conta Corporativa @ctvacinas.org</p>
              </div>
            </button>
          </div>

          <div className="mt-8 flex justify-center items-center gap-2">
            <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
            <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
            <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
          </div>
          
          {authError && <p className="text-red-500 mt-6">{authError}</p>}
        </main>
      </div>
    );
  }

  if (isMsalAuthenticated && isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <main className="w-full max-w-md mx-auto text-center animate-in-slow">
            <div className="bg-white p-10 rounded-[2.5rem] border border-red-200/80 shadow-lg shadow-red-500/10">
                <div className="mb-6 inline-block bg-red-100 p-5 rounded-3xl">
                    <ShieldAlert size={36} className="text-red-500" strokeWidth={2.5}/>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                    Acesso Negado
                </h1>
                <p className="mt-4 text-sm text-slate-500">
                    A conta <span className="font-bold text-slate-700">{account?.username}</span> não tem permissão para acessar este sistema ou está inativa.
                </p>
                <p className="mt-2 text-xs text-slate-400">
                    Se isso for um erro, por favor, entre em contato com o administrador da plataforma.
                </p>
                <button 
                onClick={handleLogout} 
                className="mt-8 w-full bg-slate-800 text-white rounded-2xl p-4 font-bold uppercase text-xs tracking-widest hover:bg-black transition"
                >
                Tentar com outra conta
                </button>
            </div>
        </main>
      </div>
    );
  }
  
  if (isMsalAuthenticated && isAuthorized === null) {
      return <div className="flex h-screen w-screen items-center justify-center bg-brand-light"><Loader2 size={48} className="animate-spin text-brand-primary" /></div>;
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