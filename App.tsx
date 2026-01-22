
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Task, AppConfig, ViewMode, AppUser, ActivityLog, Person } from './types';
import Sidebar from './components/Sidebar';
import { Loader2, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { INITIAL_TASKS, TEAM_MEMBERS } from './constants';
import { MicrosoftGraphService } from './services/microsoftGraphService';

const SelectionView = lazy(() => import('./components/SelectionView'));
const DashboardOverview = lazy(() => import('./components/DashboardOverview'));
const TaskBoard = lazy(() => import('./components/TaskBoard'));
const ProjectsManager = lazy(() => import('./components/ProjectsManager'));
const ActivityLogView = lazy(() => import('./components/ActivityLogView'));
const AccessControl = lazy(() => import('./components/AccessControl'));

const STORAGE_KEY = 'gestao_par_db';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isCloudActive, setIsCloudActive] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [view, setView] = useState<ViewMode>('selection');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [msAccount, setMsAccount] = useState<any>(null);

  const initializeDefaultData = () => {
    const defaultPeople: Person[] = TEAM_MEMBERS.map(name => ({
      id: Math.random().toString(36).substring(2, 9),
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@ctvacinas.com`,
      notificationsEnabled: true,
      active: true
    }));

    return {
      tasks: INITIAL_TASKS,
      config: {
        notificationEmail: 'setor.ar@ctvacinas.com',
        people: defaultPeople,
        projectsData: [{ id: 'p1', name: 'Expansão Q3', status: 'Ativo', trackingMacroTasks: [], regulatoryMacroTasks: [], norms: [] }],
        users: [
          { username: 'Graziella', role: 'admin', passwordHash: 'admin', canViewAll: true },
          { username: 'Colaborador', role: 'user', passwordHash: '123456', canViewAll: false }
        ]
      },
      activityLogs: []
    };
  };

  const loadData = async (forceCloud = false) => {
    setLoading(true);
    try {
      const localData = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      
      const account = await MicrosoftGraphService.getAccount();
      setMsAccount(account);
      
      let cloudData = null;
      if (account || forceCloud) {
        setSyncing(true);
        cloudData = await MicrosoftGraphService.loadFromCloud();
        setSyncing(false);
      }

      const finalData = cloudData || localData || initializeDefaultData();

      setTasks(finalData.tasks || []);
      setConfig(finalData.config || initializeDefaultData().config);
      setActivityLogs(finalData.activityLogs || []);
      setIsCloudActive(!!cloudData);
      
      if (cloudData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalData));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (newTasks: Task[], newConfig: AppConfig, newLogs?: ActivityLog[]) => {
    setSyncing(true);
    const logs = newLogs || activityLogs;
    
    const dataToSave = {
      tasks: newTasks,
      config: newConfig,
      activityLogs: logs,
      lastUpdate: new Date().toISOString()
    };

    setTasks(newTasks);
    setConfig(newConfig);
    setActivityLogs(logs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

    if (msAccount) {
      const success = await MicrosoftGraphService.saveToCloud(dataToSave);
      setIsCloudActive(success);
    }
    
    setSyncing(false);
  };

  const handleMicrosoftLogin = async () => {
    const result = await MicrosoftGraphService.login();
    if (result.success) {
      setMsAccount(result.account);
      loadData(true);
    } else {
      alert("Falha na conexão com a conta Microsoft.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('selection');
  };

  if (loading) return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin mb-4" size={48} />
      <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Sincronizando Sistema...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {currentUser && (
        <Sidebar 
          currentView={view} 
          onViewChange={setView} 
          onLogout={handleLogout} 
          currentUser={currentUser} 
          people={config?.people || []} 
          selectedMember="Todos" 
          onMemberChange={() => {}} 
          onGoHome={() => setView('dashboard')} 
          availableUsers={config?.users.map(u => u.username) || []}
          isCloudActive={isCloudActive}
        />
      )}
      <main className={`flex-1 flex flex-col min-h-screen ${currentUser ? 'ml-64' : ''}`}>
        {currentUser && (
          <header className="bg-white border-b border-slate-200 p-8 flex justify-between items-center sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                  {view === 'dashboard' ? 'Painel Executivo' : 
                   view === 'tasks' ? 'Gestão de Atividades' :
                   view === 'projects' ? 'Fluxos e Projetos' : 'Configurações'}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isCloudActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {isCloudActive ? <Cloud size={12} /> : <CloudOff size={12} />}
                    {isCloudActive ? 'SharePoint Ativo' : 'Modo Offline'}
                  </div>
                  {syncing && <RefreshCw size={10} className="animate-spin text-indigo-500" />}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-200">
               <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs uppercase">{currentUser.username[0]}</div>
               <div className="text-left">
                 <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{currentUser.username}</p>
                 <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{currentUser.role}</p>
               </div>
            </div>
          </header>
        )}

        <div className="p-8 flex-1">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center h-full"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>}>
            {view === 'selection' && config?.users && (
              <SelectionView 
                onLogin={(u) => { setCurrentUser(u); setView('dashboard'); }} 
                users={config.users} 
                onSelect={() => {}} 
                msAccount={msAccount}
                onMsLogin={handleMicrosoftLogin}
                hasClientId={true}
              />
            )}
            
            {currentUser && (
              <>
                {view === 'dashboard' && (
                  <DashboardOverview 
                    stats={{ 
                      totalTasks: tasks.length, 
                      monthlyDeliveries: tasks.filter(t => t.status === 'Concluída').length, 
                      inExecution: tasks.filter(t => t.status === 'Em Andamento').length, 
                      avgProgress: tasks.length > 0 ? Math.round(tasks.reduce((a, b) => a + b.progress, 0) / tasks.length) : 0, 
                      blockedCount: tasks.filter(t => t.status === 'Bloqueada').length 
                    }} 
                    tasks={tasks} 
                    projects={config?.projectsData || []} 
                  />
                )}
                {view === 'tasks' && (
                  <TaskBoard tasks={tasks} canEdit={currentUser.role === 'admin'} onEdit={() => {}} onDelete={() => {}} onViewDetails={() => {}} />
                )}
                {view === 'projects' && config && (
                  <ProjectsManager 
                    projects={config.projectsData} tasks={tasks} people={config.people} 
                    canEdit={currentUser.role === 'admin'} 
                    onUpdate={(p) => handleSave(tasks, {...config, projectsData: p})} 
                    onAddLog={(id, title, reason) => {
                      const newLog: ActivityLog = { id: Math.random().toString(36).substring(2, 9), taskId: id, taskTitle: title, user: currentUser.username, timestamp: new Date().toISOString(), reason, action: 'EXCLUSÃO' };
                      handleSave(tasks, config, [newLog, ...activityLogs]);
                    }}
                  />
                )}
                {view === 'access-control' && config && (
                  <AccessControl config={config} currentUser={currentUser} onUpdateConfig={(c) => handleSave(tasks, c)} />
                )}
                {view === 'logs' && <ActivityLogView logs={activityLogs} />}
              </>
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default App;
