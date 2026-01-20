
import React, { useState, useEffect, useMemo } from 'react';
import { MicrosoftGraphService } from './services/microsoftGraphService';
import { Task, AppConfig, ViewMode } from './types';
import Sidebar from './components/Sidebar';
import SelectionView from './components/SelectionView';
import DashboardOverview from './components/DashboardOverview';
import TaskBoard from './components/TaskBoard';
import { Cloud, Loader2, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [view, setView] = useState<ViewMode>('selection');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const startup = async () => {
      await MicrosoftGraphService.init();
      const account = await MicrosoftGraphService.getAccount();
      if (account) {
        setIsAuth(true);
        const data = await MicrosoftGraphService.load();
        if (data) {
          setTasks(data.tasks || []);
          setConfig(data.config || null);
        }
      }
      setLoading(false);
    };
    startup();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    const account = await MicrosoftGraphService.login();
    if (account) {
      setIsAuth(true);
      const data = await MicrosoftGraphService.load();
      if (data) {
        setTasks(data.tasks || []);
        setConfig(data.config || null);
      }
    }
    setLoading(false);
  };

  const handleSave = async (newTasks: Task[], newConfig: AppConfig) => {
    setTasks(newTasks);
    setConfig(newConfig);
    await MicrosoftGraphService.save({ tasks: newTasks, config: newConfig });
  };

  if (loading) return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin mb-4" size={48} />
      <p className="text-xs font-black uppercase tracking-widest opacity-50">Sincronizando SharePoint...</p>
    </div>
  );

  if (!isAuth) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-sm w-full">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Gestão PAR</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-10">Autenticação Corporativa</p>
        <button 
          onClick={handleLogin}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition shadow-xl"
        >
          Entrar com Microsoft
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        onLogout={() => { MicrosoftGraphService.logout(); setIsAuth(false); }}
        currentUser={user}
        people={config?.people || []}
        selectedMember="Todos"
        onMemberChange={() => {}}
        onGoHome={() => setView('dashboard')}
        availableUsers={config?.users.map(u => u.username) || []}
      />
      
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              {view === 'dashboard' ? 'Painel Executivo' : 'Atividades'}
            </h2>
            <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
              <Cloud size={12} /> SharePoint Online Conectado
            </div>
          </div>
        </header>

        {view === 'selection' && <SelectionView onSelect={() => setView('dashboard')} onLogin={(u) => { setUser(u); setView('dashboard'); }} users={config?.users || []} />}
        {view === 'dashboard' && <DashboardOverview stats={{ totalTasks: tasks.length, monthlyDeliveries: 0, inExecution: 0, avgProgress: 0, blockedCount: 0 }} tasks={tasks} projects={config?.projectsData || []} />}
        {view === 'tasks' && <TaskBoard tasks={tasks} canEdit={true} onEdit={() => {}} onDelete={() => {}} onViewDetails={() => {}} />}
      </main>
    </div>
  );
};

export default App;
