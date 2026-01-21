
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { MicrosoftGraphService, AdminConsentError, ApiPermissionError } from './services/microsoftGraphService';
import { Task, AppConfig, ViewMode, AppUser, ActivityLog, Person, ProjectData } from './types';
import Sidebar from './components/Sidebar';
import { Cloud, Loader2, ShieldCheck, ShieldAlert, LogOut, Eye, Copy, CheckCircle, Info, ExternalLink, RefreshCw, UserCircle } from 'lucide-react';
import { INITIAL_TASKS, TEAM_MEMBERS } from './constants';

// Lazy load components
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
  const [authAccount, setAuthAccount] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [view, setView] = useState<ViewMode>('selection');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  const startup = async () => {
    setLoading(true);
    setLoadingMessage('Iniciando conexão segura...');
    await MicrosoftGraphService.init();
    const account = await MicrosoftGraphService.getAccount();
    if (account) {
      setAuthAccount(account);
      setIsAuth(true);
      try {
        const access = await MicrosoftGraphService.checkAccess();
        setHasAccess(access);
        if (access) {
          const data = await MicrosoftGraphService.load();
          if (data) {
            setTasks(data.tasks || []);
            setConfig(data.config || null);
            setActivityLogs(data.activityLogs || []);
          }
        }
      } catch (e: any) {
        setHasAccess(false);
      }
    }
    setLoading(false);
  };

  useEffect(() => { startup(); }, []);

  const handleLogin = async () => {
    setLoading(true);
    setLoadingMessage('Aguardando Microsoft...');
    const result = await MicrosoftGraphService.login();
    if (result.success && result.account) {
      setAuthAccount(result.account);
      setIsAuth(true);
      const access = await MicrosoftGraphService.checkAccess();
      setHasAccess(access);
      if (access) {
        const data = await MicrosoftGraphService.load();
        if (data) {
          setTasks(data.tasks || []);
          setConfig(data.config || null);
          setActivityLogs(data.activityLogs || []);
        }
      }
    } else if (result.error && result.error !== 'cancelled') {
      setLoginError(result.error);
    }
    setLoading(false);
  };

  const copyITInstructions = () => {
    const text = `SOLICITAÇÃO DE SUPORTE: Acesso de Convidado (E-mail Pessoal) no App PAR

A pasta do SharePoint está compartilhada, mas o acesso via Graph API está falhando para usuários externos (Gmail/Outlook).

AJUSTES NECESSÁRIOS NO AZURE AD:
1. No registro do App "Gestão de Atividades PAR":
2. Vá em "Autenticação" -> Verifique se "Tipos de conta com suporte" está como:
   "Contas em qualquer diretório organizacional e contas Microsoft pessoais (Multilocatário)".
3. Se estiver como "Somente este diretório", convidados externos com e-mail pessoal NÃO conseguirão autenticar no app.
4. Em "Permissões de API", garanta que Sites.ReadWrite.All e Files.ReadWrite sejam do tipo "Delegada".

ID do App: 609422c2-d648-4b50-b1fe-ca614b77ffb5`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleLogout = async () => {
    if (isGuest) {
      setIsGuest(false);
      setIsAuth(false);
      setHasAccess(null);
    } else {
      await MicrosoftGraphService.logout();
      setIsAuth(false);
      setHasAccess(null);
    }
    setCurrentUser(null);
    setView('selection');
    window.location.reload();
  };

  if (loading) return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin mb-4" size={48} />
      <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{loadingMessage}</p>
    </div>
  );

  if (!isAuth) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md w-full animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-indigo-200">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Gestão PAR</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-10">Acesso via SharePoint Online</p>
        
        {loginError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] text-red-600 font-bold mb-6 text-left">
            ERRO: {loginError}
          </div>
        )}

        <button 
          onClick={handleLogin}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition shadow-xl active:scale-95"
        >
          Entrar com Microsoft
        </button>
        <p className="mt-4 text-[9px] text-slate-400 uppercase font-black">Suporta e-mails corporativos e pessoais (convidados)</p>
      </div>
    </div>
  );

  if (isAuth && hasAccess === false) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-lg w-full">
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Acesso Restrito</h1>
        <div className="flex items-center justify-center gap-2 mb-8 bg-slate-50 py-2 px-4 rounded-xl border border-slate-100 inline-flex">
          <UserCircle size={16} className="text-indigo-500" />
          <span className="text-[10px] font-black text-slate-600 uppercase">{authAccount?.username || authAccount?.name}</span>
        </div>

        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-700 font-medium leading-relaxed mb-8 text-left">
          <p className="font-black text-[10px] uppercase mb-2">Por que não consigo entrar?</p>
          <ul className="list-disc list-inside space-y-2 text-[11px]">
            <li><b>E-mail Pessoal:</b> Se você usa Gmail/Outlook, o TI precisa configurar o App como "Multilocatário" no Azure AD.</li>
            <li><b>Permissão de Pasta:</b> Mesmo sendo convidado do site, o App precisa de permissão de API consentida pelo TI.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button 
            onClick={copyITInstructions}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition shadow-xl flex items-center justify-center gap-3 active:scale-95"
          >
            {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
            {copied ? 'Instruções Copiadas!' : 'Copiar Ticket para o TI'}
          </button>
          <button onClick={handleLogout} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600">Sair e Tentar outro E-mail</button>
        </div>
      </div>
    </div>
  );

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
        <header className="bg-white border-b border-slate-200 p-8 flex justify-between items-center sticky top-0 z-40">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              {view === 'dashboard' ? 'Painel Executivo' : view === 'tasks' ? 'Atividades' : 'Gestão PAR'}
            </h2>
            <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase tracking-widest mt-1">
              <Cloud size={12} className="animate-pulse" /> SharePoint Conectado
            </div>
          </div>
          {currentUser && (
            <div className="flex items-center gap-4 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-200">
               <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs uppercase">{currentUser.username[0]}</div>
               <div className="text-left">
                  <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{currentUser.username}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{currentUser.role === 'admin' ? 'Administrador' : 'Membro'}</p>
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
                projects={config.projectsData} tasks={tasks} people={config.people} 
                canEdit={currentUser.role === 'admin'} onUpdate={(p) => setConfig({...config, projectsData: p})} onAddLog={() => {}}
              />
            )}
            {view === 'access-control' && currentUser && config && (
              <AccessControl config={config} currentUser={currentUser} onUpdateConfig={setConfig} />
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default App;
