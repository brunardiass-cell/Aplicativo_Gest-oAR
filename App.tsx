
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Task, ViewMode, AppNotification, ActivityLog, Project, ActivityPlanTemplate, TeamMember, AppUser } from './types';
import { msalService, graphService } from './services/microsoftGraphService';
import UserSelectionView from './components/UserSelectionView';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import TaskModal from './components/TaskModal';
import TaskDetailsModal from './components/TaskDetailsModal';
import DeletionModal from './components/DeletionModal';
import ActivityLogView from './components/ActivityLogView';
import ProjectsManager from './components/ProjectsManager';
import AccessControl from './components/AccessControl';
import PasswordModal from './components/PasswordModal';
import { PlusCircle, Loader2, LogIn } from 'lucide-react';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activityPlans, setActivityPlans] = useState<ActivityPlanTemplate[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  
  const [view, setView] = useState<ViewMode>('dashboard');
  const [selectedProfile, setSelectedProfile] = useState<TeamMember | null>(null);
  const [isPasswordAuthenticated, setIsPasswordAuthenticated] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterMember, setFilterMember] = useState<string | 'Todos'>('Todos');
  
  const [isLoading, setIsLoading] = useState(true);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [isMsalAuthenticated, setIsMsalAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const saveTimeoutRef = useRef<number | null>(null);
  
  const isDataInitialized = useRef(false);

  const loadDataFromSharePoint = useCallback(async () => {
    if (isDataInitialized.current) return;
    
    setSyncStatus('syncing');
    
    try {
      const token = await msalService.getToken();
      if (!token) {
        console.log("Token não disponível, provavelmente redirecionando para login.");
        return;
      }
      
      const db = await graphService.getDb(token);
      setTasks(db.tasks || []);
      setProjects(db.projects || []);
      setTeamMembers(db.teamMembers || []);
      setActivityPlans(db.activityPlans || []);
      setLogs(db.logs || []);
      setAppUsers(db.appUsers || []);
      
      setSyncStatus('synced');
      isDataInitialized.current = true;
    } catch (error) {
      console.error(error);
      setSyncStatus('error');
      setAuthError('Falha ao carregar dados do SharePoint. Verifique sua conexão e permissões.');
    }
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        const account = await msalService.getAccount();
        if (account) {
          setIsMsalAuthenticated(true);
          await loadDataFromSharePoint();
        }
      } catch (error) {
        console.error(error);
        setAuthError('Falha ao inicializar a autenticação.');
        setSyncStatus('error');
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, [loadDataFromSharePoint]);

  const saveDataToSharePoint = useCallback(async () => {
    if (!isDataInitialized.current || !isMsalAuthenticated) return;

    setSyncStatus('syncing');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        const token = await msalService.getToken();
        if (!token) throw new Error('Não foi possível obter o token de acesso para salvar.');

        const db = { tasks, projects, teamMembers, activityPlans, logs, appUsers };
        await graphService.saveDb(token, db);
        setSyncStatus('synced');
      } catch (error) {
        console.error(error);
        setSyncStatus('error');
      }
    }, 2000); // Debounce de 2 segundos
  }, [tasks, projects, teamMembers, activityPlans, logs, appUsers, isMsalAuthenticated]);

  useEffect(() => {
    saveDataToSharePoint();
  }, [saveDataToSharePoint]);

  const hasFullAccess = useMemo(() => selectedProfile?.isLeader === true && isPasswordAuthenticated, [selectedProfile, isPasswordAuthenticated]);
  const canCreate = useMemo(() => selectedProfile?.id !== 'team_view_user' && isPasswordAuthenticated, [selectedProfile, isPasswordAuthenticated]);
  
  const handleProfileSelect = (user: TeamMember) => {
    setSelectedProfile(user);
    setFilterMember(user.name);
    if (!user.password) {
      setIsPasswordAuthenticated(true);
    } else {
      setIsPasswordAuthenticated(false);
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
      setPasswordError('Senha incorreta. Tente novamente.');
    }
  };

  const handlePasswordCancel = () => {
    setSelectedProfile(null);
    setIsPasswordAuthenticated(false);
    setPasswordError(null);
  };
  
  const handleSwitchProfile = () => {
    setSelectedProfile(null);
    setFilterMember('Todos');
    setIsPasswordAuthenticated(false);
  };

  const handleSaveTask = (task: Task) => {
    const isEditing = tasks.some(t => t.id === task.id);
    setTasks(prev => isEditing ? prev.map(t => t.id === task.id ? task : t) : [task, ...prev]);
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = (reason: string) => {
    if (!selectedTask) return;
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, deleted: true, deletionReason: reason, deletionDate: new Date().toISOString() } : t));
    setIsDeleteModalOpen(false);
    setSelectedTask(null);
  };

  const handleLogin = () => msalService.login();
  const handleLogout = () => {
    msalService.logout();
    setIsMsalAuthenticated(false);
    isDataInitialized.current = false;
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-slate-900 flex-col gap-4">
        <Loader2 size={48} className="animate-spin text-teal-600" />
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.5em]">
            {syncStatus === 'syncing' ? 'SINCRONIZANDO DADOS...' : 'INICIALIZANDO...'}
        </p>
      </div>
    );
  }

  if (!isMsalAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-100 flex-col gap-6 p-4 text-center">
        <h1 className="text-4xl font-black uppercase text-slate-900">Gestão <span className="text-teal-500">Regulatória</span></h1>
        <p className="text-slate-500 max-w-md">Para acessar o painel, por favor, autentique-se com sua conta Microsoft.</p>
        <button onClick={handleLogin} className="px-10 py-4 bg-teal-500 text-white rounded-full font-bold uppercase text-sm tracking-widest flex items-center gap-3 hover:bg-teal-600 shadow-lg shadow-teal-500/20 transition">
          <LogIn size={20}/> Entrar com Microsoft
        </button>
        {authError && <p className="text-red-500 text-xs font-bold mt-4">{authError}</p>}
      </div>
    );
  }

  if (!selectedProfile) {
    return <UserSelectionView tasks={tasks} onSelectUser={handleProfileSelect} onSelectTeamView={handleTeamViewSelect} onLogout={handleLogout} />;
  }

  if (selectedProfile.password && !isPasswordAuthenticated) {
    return <PasswordModal isOpen={true} onClose={handlePasswordCancel} onConfirm={handlePasswordConfirm} userName={selectedProfile.name} error={passwordError} />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar 
        currentView={view} 
        onViewChange={setView}
        onGoHome={() => setView('dashboard')}
        onSwitchProfile={handleSwitchProfile} 
        selectedProfile={selectedProfile}
        hasFullAccess={hasFullAccess}
        syncStatus={syncStatus}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 ml-64 p-10 max-w-[1600px]">
        <header className="flex justify-between items-start mb-12">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                    <h1 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {filterMember === 'Todos' ? 'Visão Geral da Equipe' : `Visão de ${selectedProfile.name}`} • CTVacinas
                    </h1>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-wide uppercase">
                    {view === 'dashboard' ? `Painel Executivo` : 
                     view === 'tasks' ? 'Atividades Regulatórias' : 
                     view === 'projects' ? 'Fluxos Estratégicos' : 
                     view === 'quality' ? 'Gestão de Acesso' : 'Rastreabilidade'}
                </h2>
            </div>
            
            <div className="flex items-center gap-4">
               {view === 'tasks' && canCreate && (
                 <button 
                  onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-black transition shadow-lg flex items-center gap-2"
                >
                  <PlusCircle size={16} /> Nova Atividade
                </button>
               )}
            </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 pb-20">
          {view === 'dashboard' && <Dashboard tasks={tasks} filteredUser={filterMember} notifications={notifications} onViewTaskDetails={(task) => { setSelectedTask(task); setIsDetailsOpen(true); }} />}
          
          {view === 'quality' && hasFullAccess && (
             <AccessControl 
                teamMembers={teamMembers}
                onUpdateTeamMembers={setTeamMembers}
             />
          )}

          {view === 'tasks' && (
            <TaskBoard 
              tasks={tasks.filter(t => !t.deleted && (filterMember === 'Todos' || t.projectLead === filterMember || t.collaborators.includes(filterMember)))} 
              currentUser={selectedProfile.name}
              onEdit={(task) => { setSelectedTask(task); setIsModalOpen(true); }} 
              onView={(task) => { setSelectedTask(task); setIsDetailsOpen(true); }}
              onDelete={(task) => { setSelectedTask(task); setIsDeleteModalOpen(true); }}
              notifications={notifications.filter(n => n.userId === selectedProfile.name)}
              onNotificationClick={(notif) => {
                const task = tasks.find(t => t.id === notif.refId);
                if (task) {
                  setSelectedTask(task);
                  setIsDetailsOpen(true);
                }
              }}
              onClearNotifications={() => setNotifications(notifs => notifs.filter(n => n.userId !== selectedProfile.name))}
              hasFullAccess={hasFullAccess}
            />
          )}

          {view === 'projects' && (
            <ProjectsManager
              projects={projects}
              onUpdateProjects={setProjects}
              activityPlans={activityPlans}
              onUpdateActivityPlans={setActivityPlans}
              onOpenDeletionModal={() => {}}
              teamMembers={teamMembers}
              hasFullAccess={hasFullAccess}
              canCreate={canCreate}
            />
          )}

          {view === 'traceability' && hasFullAccess && <ActivityLogView logs={logs} />}
        </div>

        {isModalOpen && (
          <TaskModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSaveTask}
            projects={Array.from(new Set(tasks.map(t => t.project)))}
            teamMembers={teamMembers}
            initialData={selectedTask}
          />
        )}

        {isDetailsOpen && selectedTask && (
          <TaskDetailsModal 
            task={selectedTask} 
            onClose={() => { setIsDetailsOpen(false); setSelectedTask(null); }} 
          />
        )}

        {isDeleteModalOpen && selectedTask && (
          <DeletionModal 
            itemName={selectedTask.activity} 
            onClose={() => { setIsDeleteModalOpen(false); setSelectedTask(null); }} 
            onConfirm={handleDeleteTask} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
