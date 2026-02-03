
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, ViewMode, AppNotification, ActivityLog, Project, ActivityPlanTemplate, TeamMember, AppUser, SyncInfo } from './types';
import { DEFAULT_TEAM_MEMBERS, DEFAULT_ACTIVITY_PLANS, ADMIN_WHITELIST } from './constants';
import SelectionView from './components/SelectionView';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import TaskModal from './components/TaskModal';
import TaskDetailsModal from './components/TaskDetailsModal';
import DeletionModal from './components/DeletionModal';
import ActivityLogView from './components/ActivityLogView';
import ReportView from './components/ReportView';
import ProjectsManager from './components/ProjectsManager';
import AccessControl from './components/AccessControl';
import { MicrosoftGraphService } from './services/microsoftGraphService';
import { PlusCircle, Loader2, ShieldAlert, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activityPlans, setActivityPlans] = useState<ActivityPlanTemplate[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [lastSync, setLastSync] = useState<SyncInfo | null>(null);
  
  const [view, setView] = useState<ViewMode>('selection');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm] = useState('');
  const [filterMember, setFilterMember] = useState<string | 'Todos'>('Todos');
  
  const [isLoading, setIsLoading] = useState(true);
  const isInitialLoad = useRef(true);

  const hasFullAccess = useMemo(() => currentUser?.role === 'admin', [currentUser]);

  const saveDataToSharePoint = async () => {
    if (isInitialLoad.current || !currentUser) return;

    setLastSync((prev: SyncInfo | null) => prev ? { ...prev, status: 'syncing' } : { timestamp: new Date().toISOString(), user: currentUser.username, status: 'syncing' });
    
    const dataToSave = { tasks, projects, teamMembers, activityPlans, notifications, logs, appUsers };
    const success = await MicrosoftGraphService.saveToCloud(dataToSave);
    
    if (success) {
      setLastSync({
        timestamp: new Date().toISOString(),
        user: currentUser.username,
        status: 'synced'
      });
    } else {
      setLastSync((prev: SyncInfo | null) => prev ? { ...prev, status: 'error' } : null);
    }
  };

  const handleDownloadBackup = () => {
    const backupData = {
      tasks,
      projects,
      teamMembers,
      activityPlans,
      notifications,
      logs,
      appUsers,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_reguladores_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm("Atenção: Restaurar um backup irá sobrescrever todos os dados atuais do sistema. Deseja continuar?")) {
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (!data.tasks || !data.projects || !data.appUsers) {
          throw new Error("Formato de backup inválido.");
        }

        setTasks(data.tasks || []);
        setProjects(data.projects || []);
        setTeamMembers(data.teamMembers || DEFAULT_TEAM_MEMBERS);
        setActivityPlans(data.activityPlans || DEFAULT_ACTIVITY_PLANS);
        setNotifications(data.notifications || []);
        setLogs(data.logs || []);
        setAppUsers(data.appUsers || []);
        
        alert("Backup restaurado com sucesso! O sistema irá sincronizar com a nuvem em breve.");
      } catch (err) {
        console.error("Erro ao restaurar backup:", err);
        alert("Falha ao restaurar backup: O arquivo selecionado não é válido.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  useEffect(() => {
    const checkLogin = async () => {
      const account = await MicrosoftGraphService.getAccount();
      if (account) {
        handleLogin(true);
      } else {
        setIsLoading(false);
      }
    };
    checkLogin();
  }, []);

  useEffect(() => {
    if (isInitialLoad.current || !currentUser) return;
    
    const timeoutId = setTimeout(() => {
      saveDataToSharePoint();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [tasks, projects, teamMembers, activityPlans, notifications, logs, appUsers]);

  const handleLogin = async (isSilent = false) => {
    setIsLoading(true);
    const loginResult = isSilent 
      ? { success: true, account: await MicrosoftGraphService.getAccount() } 
      : await MicrosoftGraphService.login();

    if (loginResult.success && loginResult.account) {
      try {
        const cloudData = await MicrosoftGraphService.loadFromCloud();
        
        const email = loginResult.account.username.toLowerCase();
        const existingUsers = cloudData?.appUsers || [];
        const userRecord = existingUsers.find((u: AppUser) => u.email.toLowerCase() === email);
        const isDefaultAdmin = ADMIN_WHITELIST.map(e => e.toLowerCase()).includes(email);

        if (cloudData) {
          setTasks(cloudData.tasks || []);
          setProjects(cloudData.projects || []);
          setTeamMembers(cloudData.teamMembers || DEFAULT_TEAM_MEMBERS);
          setActivityPlans(cloudData.activityPlans || DEFAULT_ACTIVITY_PLANS);
          setNotifications(cloudData.notifications || []);
          setLogs(cloudData.logs || []);
          setAppUsers(existingUsers);
          
          setLastSync({
            timestamp: new Date().toISOString(),
            user: loginResult.account.name || email,
            status: 'synced'
          });
        } else {
          setTeamMembers(DEFAULT_TEAM_MEMBERS);
          setActivityPlans(DEFAULT_ACTIVITY_PLANS);
        }

        if (userRecord) {
          if (isDefaultAdmin && (userRecord.role !== 'admin' || userRecord.status !== 'active')) {
            const updatedUser: AppUser = { ...userRecord, role: 'admin', status: 'active' };
            setAppUsers(prev => prev.map(u => u.id === userRecord.id ? updatedUser : u));
            setCurrentUser(updatedUser);
            setFilterMember('Todos');
            setView('dashboard');
          } else if (userRecord.status === 'active') {
            setCurrentUser(userRecord);
            setFilterMember(userRecord.role === 'admin' ? 'Todos' : userRecord.username);
            setView('dashboard');
          } else if (userRecord.status === 'pending') {
            setView('unauthorized');
          } else {
            alert("Sua conta está bloqueada.");
            handleLogout();
          }
        } else {
          const newUser: AppUser = {
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            username: loginResult.account.name || 'Novo Usuário',
            email: email,
            role: (existingUsers.length === 0 || isDefaultAdmin) ? 'admin' : 'user',
            status: (existingUsers.length === 0 || isDefaultAdmin) ? 'active' : 'pending',
            joinedAt: new Date().toISOString()
          };
          
          setAppUsers(prev => [...prev, newUser]);
          
          if (newUser.status === 'active') {
            setCurrentUser(newUser);
            setFilterMember(newUser.role === 'admin' ? 'Todos' : newUser.username);
            setView('dashboard');
          } else {
            setView('unauthorized');
          }
        }
        
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 1000);
      } catch (e) {
        console.error("Falha ao inicializar app com dados da nuvem:", e);
        alert("Erro de sincronização. O sistema não pôde carregar os dados do SharePoint.");
      }
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    isInitialLoad.current = true;
    await MicrosoftGraphService.logout();
    setCurrentUser(null);
    setLastSync(null);
    setView('selection');
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

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-slate-900 flex-col gap-4">
        <Loader2 size={48} className="animate-spin text-blue-600" />
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.5em]">CARREGANDO DADOS DA NUVEM...</p>
      </div>
    );
  }

  if (view === 'unauthorized') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-white">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
           <div className="inline-block p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100 shadow-xl mb-4">
              <ShieldAlert size={56} className="text-amber-500" />
           </div>
           <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Acesso Pendente</h1>
           <p className="text-slate-500 font-medium">Seu cadastro foi realizado com sucesso, mas ainda precisa ser aprovado pela gestão.</p>
           <button onClick={handleLogout} className="flex items-center gap-2 mx-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest">
              <LogOut size={18}/> Sair da Conta
           </button>
        </div>
      </div>
    );
  }

  if (view === 'selection') {
    return <SelectionView onSelect={() => handleLogin(false)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        onGoHome={() => setView('dashboard')}
        onLogout={handleLogout} 
        currentUser={currentUser}
        notificationCount={0}
        lastSync={lastSync}
        onRetrySync={saveDataToSharePoint}
        onDownloadBackup={handleDownloadBackup}
        onRestoreBackup={handleRestoreBackup}
      />
      
      <main className="flex-1 ml-64 p-10 max-w-[1600px]">
        <header className="flex justify-between items-start mb-12">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                    <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        {hasFullAccess ? 'Administrador' : 'Colaborador'} • CTVacinas
                    </h1>
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                    {view === 'dashboard' ? `Painel Executivo` : 
                     view === 'tasks' ? 'Atividades Regulatórias' : 
                     view === 'projects' ? 'Fluxos Estratégicos' : 
                     view === 'quality' ? 'Gestão de Acesso' : 'Rastreabilidade'}
                </h2>
            </div>
            
            <div className="flex items-center gap-4">
               {view === 'tasks' && hasFullAccess && (
                 <button 
                  onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
                  className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-100 flex items-center gap-2"
                >
                  <PlusCircle size={18} /> Nova Atividade
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
                appUsers={appUsers}
                onUpdateAppUsers={setAppUsers}
             />
          )}

          {view === 'tasks' && (
            <TaskBoard 
              tasks={tasks.filter(t => !t.deleted && (searchTerm === '' || t.activity.toLowerCase().includes(searchTerm.toLowerCase())))} 
              currentUser={currentUser?.username || ''} 
              onEdit={(task) => { setSelectedTask(task); setIsModalOpen(true); }} 
              onView={(task) => { setSelectedTask(task); setIsDetailsOpen(true); }}
              onDelete={(task) => { setSelectedTask(task); setIsDeleteModalOpen(true); }}
              onAssignReview={() => {}}
              onNotificationClick={() => {}}
              onClearSingleNotification={() => {}}
              notifications={notifications}
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