
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { MicrosoftGraphService } from './services/microsoftGraphService';
import { Task, AppConfig, ViewMode, AppUser, ActivityLog, Person } from './types';
import Sidebar from './components/Sidebar';
import { Cloud, Loader2, ShieldCheck, ShieldAlert, Info, UserCircle, Lock } from 'lucide-react';
import { INITIAL_TASKS, TEAM_MEMBERS } from './constants';

const SelectionView = lazy(() => import('./components/SelectionView'));
const DashboardOverview = lazy(() => import('./components/DashboardOverview'));
const ProjectsManager = lazy(() => import('./components/ProjectsManager'));
const AccessControl = lazy(() => import('./components/AccessControl'));

const App: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [authAccount, setAuthAccount] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [view, setView] = useState<ViewMode>('selection');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

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
        users: [{ username: 'Admin', role: 'admin', passwordHash: 'admin123', canViewAll: true }]
      },
      activityLogs: []
    };
  };

  const startup = async () => {
    setLoading(true);
    await MicrosoftGraphService.init();
    const account = await MicrosoftGraphService.getAccount();
    if (account) {
      setAuthAccount(account);
      setIsAuth(true);
      const access = await MicrosoftGraphService.checkAccess();
      setHasAccess(access);
      if (access) {
        let data = await MicrosoftGraphService.load();
        if (!data) {
          data = initializeDefaultData();
          await MicrosoftGraphService.save(data);
        }
        setTasks(data.tasks || []);
        setConfig(data.config || null);
        setActivityLogs(data.activityLogs || []);
      }
    }
    setLoading(false);
  };

  useEffect(() => { startup(); }, []);

  const handleLogin = async () => {
    setLoading(true);
    const result = await MicrosoftGraphService.login();
    if (result.success && result.account) {
      setAuthAccount(result.account);
      setIsAuth(true);
      const access = await MicrosoftGraphService.checkAccess();
      setHasAccess(access);
      if (access) {
        let data = await MicrosoftGraphService.load();
        if (!data) {
          data = initializeDefaultData();
          await MicrosoftGraphService.save(data);
        }
        setTasks(data.tasks || []);
        setConfig(data.config || null);
        setActivityLogs(data.activityLogs || []);
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await MicrosoftGraphService.logout();
    setIsAuth(false);
    setHasAccess(null);
    setCurrentUser(null);
    setView('selection');
  };

  const handleSave = async (newTasks: Task[], newConfig: AppConfig, newLogs?: ActivityLog[]) => {
    setTasks(newTasks);
    setConfig(newConfig);
    const logs = newLogs || activityLogs;
    setActivityLogs(logs);
    if (hasAccess) {
      await MicrosoftGraphService.save({ tasks: newTasks, config: newConfig, activityLogs: logs });
    }
  };

  if (loading) return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin mb-4" size={48} />
      <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Sincronizando com SharePoint Institucional...</p>
    </div>
  );

  if (!isAuth) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md w-full">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Gestão PAR</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">Login Institucional SharePoint</p>
        
        <button onClick={handleLogin} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition shadow-xl active:scale-95 mb-6">Entrar com Microsoft</button>
        
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-left">
          <div className="flex items-center gap-2 mb-2 text-blue-700">
            <Info size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Aviso de Segurança</span>
          </div>
          <p className="text-[10px] text-blue-600 leading-relaxed">
            Ao entrar, a Microsoft enviará um alerta para o seu e-mail. Isso é <b>normal</b> e acontece porque você está autorizando o aplicativo a salvar o banco de dados na pasta <b>Sistema</b> do site institucional. Nós não acessamos seus e-mails privados.
          </p>
        </div>
      </div>
    </div>
  );

  if (isAuth && hasAccess === false) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-lg w-full">
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Acesso Não Localizado</h1>
        <div className="flex items-center justify-center gap-2 mb-8 bg-slate-50 py-2 px-4 rounded-xl border border-slate-100 inline-flex">
          <UserCircle size={16} className="text-indigo-500" />
          <span className="text-[10px] font-black text-slate-600 uppercase">{authAccount?.username}</span>
        </div>
        <p className="text-xs text-slate-500 mb-8 leading-relaxed">Não conseguimos acessar o site <b>regulatorios</b> com esta conta. Verifique se o seu e-mail tem permissão de edição no SharePoint da instituição.</p>
        <button onClick={handleLogout} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition">Tentar com outra conta</button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentView={view} onViewChange={setView} onLogout={handleLogout} currentUser={currentUser} 
        people={config?.people || []} selectedMember="Todos" onMemberChange={() => {}} onGoHome={() => setView('dashboard')} availableUsers={config?.users.map(u => u.username) || []}
      />
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 p-8 flex justify-between items-center sticky top-0 z-40">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{view === 'dashboard' ? 'Painel Executivo' : 'Gestão PAR'}</h2>
            <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase tracking-widest mt-1"><Cloud size={12} className="animate-pulse" /> Sincronizado: /Sistema (Institucional)</div>
          </div>
          {currentUser && (
            <div className="flex items-center gap-4 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-200">
               <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs uppercase">{currentUser.username[0]}</div>
               <div className="text-left"><p className="text-[10px] font-black text-slate-900 uppercase leading-none">{currentUser.username}</p></div>
            </div>
          )}
        </header>
        <div className="p-8 flex-1">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center h-full"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>}>
            {view === 'selection' && config?.users && (
              <SelectionView onLogin={(u) => { setCurrentUser(u); setView('dashboard'); }} users={config.users} onSelect={() => {}} />
            )}
            {view === 'dashboard' && currentUser && (
              <DashboardOverview 
                stats={{ 
                  totalTasks: tasks.length, monthlyDeliveries: tasks.filter(t => t.status === 'Concluída').length, inExecution: tasks.filter(t => t.status === 'Em Andamento').length, 
                  avgProgress: tasks.length > 0 ? Math.round(tasks.reduce((a, b) => a + b.progress, 0) / tasks.length) : 0, blockedCount: tasks.filter(t => t.status === 'Bloqueada').length 
                }} 
                tasks={tasks} projects={config?.projectsData || []} 
              />
            )}
            {view === 'projects' && currentUser && config && (
              <ProjectsManager 
                projects={config.projectsData} tasks={tasks} people={config.people} 
                canEdit={currentUser.role === 'admin'} onUpdate={(p) => handleSave(tasks, {...config, projectsData: p})} onAddLog={() => {}}
              />
            )}
            {view === 'access-control' && currentUser && config && (
              <AccessControl config={config} currentUser={currentUser} onUpdateConfig={(c) => handleSave(tasks, c)} />
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default App;
