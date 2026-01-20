
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { MicrosoftGraphService, AdminConsentError } from './services/microsoftGraphService';
import { Task, AppConfig, ViewMode, AppUser, ActivityLog, Person, ProjectData } from './types';
import Sidebar from './components/Sidebar';
import { Cloud, Loader2, ShieldCheck, ShieldAlert, LogOut, Eye } from 'lucide-react';
import { INITIAL_TASKS, TEAM_MEMBERS } from './constants';

// Lazy load components for code splitting
const SelectionView = lazy(() => import('./components/SelectionView'));
const DashboardOverview = lazy(() => import('./components/DashboardOverview'));
const TaskBoard = lazy(() => import('./components/TaskBoard'));
const ProjectsManager = lazy(() => import('./components/ProjectsManager'));
const PeopleManager = lazy(() => import('./components/PeopleManager'));
const ActivityLogView = lazy(() => import('./components/ActivityLogView'));
const AccessControl = lazy(() => import('./components/AccessControl'));

const ViewLoader: React.FC = () => (
  <div className="flex-1 flex items-center justify-center h-full">
    <div className="text-center">
      <Loader2 className="animate-spin mb-4 mx-auto text-indigo-500" size={48} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">CARREGANDO MÓDULO...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Inicializando...');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [view, setView] = useState<ViewMode>('selection');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  const startup = async () => {
    setLoading(true);
    setLoadingMessage('Inicializando conexão segura...');
    await MicrosoftGraphService.init();
    const account = await MicrosoftGraphService.getAccount();
    if (account) {
      setIsAuth(true);
      try {
        setLoadingMessage('Verificando permissões no SharePoint...');
        const access = await MicrosoftGraphService.checkAccess();
        setHasAccess(access);
        if (access) {
          setLoadingMessage('Carregando dados do projeto...');
          const data = await MicrosoftGraphService.load();
          if (data) {
            setTasks(data.tasks || []);
            setConfig(data.config || null);
            setActivityLogs(data.activityLogs || []);
          }
        }
      } catch (error) {
        if (error instanceof AdminConsentError) {
           setLoginError('Este aplicativo precisa de aprovação de um administrador de TI para acessar o SharePoint.');
           setIsAuth(false);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    startup();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setLoadingMessage('Aguardando autenticação Microsoft...');
    setLoginError(null);
    const result = await MicrosoftGraphService.login();
    
    if (result.success && result.account) {
      setIsAuth(true);
      try {
        setLoadingMessage('Verificando permissões no SharePoint...');
        const access = await MicrosoftGraphService.checkAccess();
        setHasAccess(access);
        if (access) {
          setLoadingMessage('Carregando dados do projeto...');
          const data = await MicrosoftGraphService.load();
          if (data) {
            setTasks(data.tasks || []);
            setConfig(data.config || null);
            setActivityLogs(data.activityLogs || []);
          }
        }
      } catch (error) {
        if (error instanceof AdminConsentError) {
          setLoginError('Este aplicativo precisa de aprovação. Por favor, solicite a um administrador de TI para conceder permissão ao "Gestão de Atividades PAR" no portal do Azure.');
          setIsAuth(false);
          setHasAccess(null);
        } else {
          setLoginError('Ocorreu um erro ao verificar as permissões do SharePoint. Tente novamente.');
          setIsAuth(false);
          setHasAccess(null);
        }
      }
    } else if (result.error && result.error !== 'cancelled') {
      setLoginError('Ocorreu uma falha durante a autenticação. Tente novamente.');
    }
    setLoading(false);
  };

  const handleGuestLogin = () => {
    setLoading(true);
    setLoadingMessage('Configurando ambiente de demonstração...');

    const guestPeople: Person[] = TEAM_MEMBERS.map(name => ({
      id: name.toLowerCase(),
      name: name,
      email: `${name.toLowerCase().replace(' ', '.')}@ctvacinas.com`,
      notificationsEnabled: false,
      active: true
    }));

    const guestProjects: ProjectData[] = [
      { id: 'p1', name: 'Expansão Q3', status: 'Ativo', trackingMacroTasks: [], regulatoryMacroTasks: [] },
      { id: 'p2', name: 'Marketing Interno', status: 'Ativo', trackingMacroTasks: [], regulatoryMacroTasks: [] }
    ];

    const guestConfig: AppConfig = {
      notificationEmail: 'visitante@email.com',
      people: guestPeople,
      projectsData: guestProjects,
      users: TEAM_MEMBERS.map(name => ({ username: name, role: 'user', passwordHash: 'protected' }))
    };

    const guestUser: AppUser = {
      username: 'Visitante',
      role: 'visitor',
      passwordHash: ''
    };
    
    setTasks(INITIAL_TASKS);
    setConfig(guestConfig);
    setCurrentUser(guestUser);
    setIsGuest(true);
    setIsAuth(true);
    setHasAccess(true);
    setView('dashboard');
    setLoading(false);
  };


  const handleLogout = async () => {
    if (isGuest) {
      setIsGuest(false);
      setIsAuth(false);
      setHasAccess(null);
      setCurrentUser(null);
      setView('selection');
      setTasks([]);
      setConfig(null);
    } else {
      await MicrosoftGraphService.logout();
      setIsAuth(false);
      setHasAccess(null);
      setCurrentUser(null);
      setView('selection');
    }
  };

  const handleSave = async (newTasks: Task[], newConfig: AppConfig, newLogs?: ActivityLog[]) => {
    const logsToSave = newLogs || activityLogs;
    if (isGuest) {
      setTasks(newTasks);
      setConfig(newConfig);
      setActivityLogs(logsToSave);
      return;
    }
    setTasks(newTasks);
    setConfig(newConfig);
    setActivityLogs(logsToSave);
    if (hasAccess) {
      await MicrosoftGraphService.save({ tasks: newTasks, config: newConfig, activityLogs: logsToSave });
    }
  };

  const handleUpdateConfig = (newConfig: AppConfig) => {
    handleSave(tasks, newConfig);
  };
  
  const handleProjectsUpdate = (newProjects: ProjectData[]) => {
    if (!config) return;
    const newConfig = { ...config, projectsData: newProjects };
    handleSave(tasks, newConfig);
  };

  const handlePeopleUpdate = (newPeople: Person[], newUsers: AppUser[]) => {
    if (!config) return;
    const newConfig = { ...config, people: newPeople, users: newUsers };
    handleSave(tasks, newConfig);
  };

  const handleAddLog = (itemId: string, itemTitle: string, reason: string) => {
    if (!currentUser) return;
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      taskId: itemId,
      taskTitle: itemTitle,
      user: currentUser.username,
      timestamp: new Date().toISOString(),
      reason: reason,
      action: 'EXCLUSÃO'
    };
    const newLogs = [newLog, ...activityLogs];
    handleSave(tasks, config!, newLogs);
  };

  if (loading) return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin mb-4" size={48} />
      <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{loadingMessage}</p>
    </div>
  );

  // Tela de Login Inicial
  if (!isAuth) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md w-full animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-indigo-200">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2 leading-none">Gestão PAR</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-10">Autenticação Corporativa SharePoint</p>
        
        {loginError ? (
          <div className="p-5 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-700 font-medium leading-relaxed mb-8">
            <p className="font-bold mb-2">Ação Necessária</p>
            {loginError}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8 text-left">
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              O primeiro passo é validar sua identidade Microsoft. Em seguida, o sistema verificará seu acesso ao site <b>regulatorios</b> do SharePoint.
            </p>
          </div>
        )}

        <button 
          onClick={handleLogin}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition shadow-xl active:scale-95"
        >
          Validar com Microsoft
        </button>

        <div className="my-6 border-t border-slate-100"></div>

        <button 
          onClick={handleGuestLogin}
          className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-indigo-600 transition flex items-center justify-center gap-2"
        >
          <Eye size={16} /> Visualizar App (sem salvar)
        </button>
      </div>
    </div>
  );

  // Tela de Acesso Negado (Autenticado mas sem permissão no Site)
  if (hasAccess === false) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md w-full animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Acesso Negado</h1>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">Sua conta não tem permissão no SharePoint</p>
        
        <div className="p-5 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-700 font-medium leading-relaxed mb-8">
          Você se autenticou com sucesso, mas não possui permissão de leitura/escrita no site <b>/sites/regulatorios</b>. Entre em contato com a liderança para solicitar acesso.
        </div>

        <button 
          onClick={handleLogout}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition flex items-center justify-center gap-3"
        >
          <LogOut size={18} /> Sair da Conta
        </button>
      </div>
    </div>
  );

  const headerTitleMap: Record<ViewMode, string> = {
    'dashboard': 'Painel Executivo',
    'tasks': 'Atividades',
    'projects': 'Gerenciador de Projetos',
    'people': 'Equipe',
    'logs': 'Auditoria',
    'access-control': 'Segurança e Acesso',
    'selection': 'Seleção de Perfil'
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
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
      />
      
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {isGuest && (
          <div className="bg-amber-500 text-white text-center p-2 text-xs font-black uppercase tracking-widest sticky top-0 z-50">
            Modo Visitante: As alterações não serão salvas.
          </div>
        )}
        <header className="bg-white border-b border-slate-200 p-8 flex justify-between items-center sticky top-0 z-40">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              {headerTitleMap[view] || 'Gestão PAR'}
            </h2>
            <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase tracking-widest mt-1">
              <Cloud size={12} className={isGuest ? '' : 'animate-pulse'} /> 
              {isGuest ? 'Modo Visitante (Dados Locais)' : 'SharePoint Online /regulatorios Conectado'}
            </div>
          </div>
          {currentUser && (
            <div className="flex items-center gap-4 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-200">
               <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                 {currentUser.username[0]}
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{currentUser.username}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {currentUser.role === 'admin' ? 'Administradora' : currentUser.role === 'user' ? 'Membro' : 'Visitante'}
                  </p>
               </div>
            </div>
          )}
        </header>

        <div className="p-8 flex-1">
          <Suspense fallback={<ViewLoader />}>
            {view === 'selection' && config?.users && (
              <SelectionView 
                onLogin={(u) => { setCurrentUser(u); setView('dashboard'); }} 
                users={config.users} 
                onSelect={() => {}}
              />
            )}
            
            {view === 'dashboard' && currentUser && (
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

            {view === 'tasks' && currentUser && (
              <TaskBoard 
                tasks={tasks} 
                canEdit={currentUser.role !== 'visitor'} 
                onEdit={() => {}} 
                onDelete={() => {}} 
                onViewDetails={() => {}} 
              />
            )}

            {view === 'projects' && currentUser && config && (
              <ProjectsManager 
                projects={config.projectsData}
                tasks={tasks}
                people={config.people}
                canEdit={currentUser.role === 'admin'}
                onUpdate={handleProjectsUpdate}
                onAddLog={handleAddLog}
              />
            )}

            {view === 'people' && currentUser && config && (
              <PeopleManager 
                people={config.people}
                users={config.users}
                canEdit={currentUser.role === 'admin'}
                onUpdate={handlePeopleUpdate}
                onAddLog={handleAddLog}
              />
            )}

            {view === 'logs' && currentUser && (
              <ActivityLogView logs={activityLogs} />
            )}

            {view === 'access-control' && currentUser && config && (
              <AccessControl 
                config={config}
                currentUser={currentUser}
                onUpdateConfig={handleUpdateConfig}
              />
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default App;
