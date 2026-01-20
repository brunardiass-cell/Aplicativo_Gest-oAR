
import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { Task, ActivityLog, AppUser, AppConfig, ViewMode, DashboardStats, ProjectData, Person } from './types';
import { INITIAL_TASKS } from './constants';
import Sidebar from './components/Sidebar';
import SelectionView from './components/SelectionView';
import { Plus, FileText, ShieldCheck, Bell, Loader2, Search, Filter, Cloud, ShieldAlert, Database } from 'lucide-react';
import { MicrosoftGraphService } from './services/microsoftGraphService';

const DashboardOverview = lazy(() => import('./components/DashboardOverview'));
const TaskBoard = lazy(() => import('./components/TaskBoard'));
const ProjectsManager = lazy(() => import('./components/ProjectsManager'));
const PeopleManager = lazy(() => import('./components/PeopleManager'));
const ActivityLogView = lazy(() => import('./components/ActivityLogView'));
const AccessControl = lazy(() => import('./components/AccessControl'));
const TaskModal = lazy(() => import('./components/TaskModal'));
const TaskDetailsModal = lazy(() => import('./components/TaskDetailsModal'));
const DeletionModal = lazy(() => import('./components/DeletionModal'));
const ReportView = lazy(() => import('./components/ReportView'));

const LoadingFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Sincronizando com SharePoint...</p>
  </div>
);

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storageType, setStorageType] = useState<'offline' | 'onedrive' | 'sharepoint'>('offline');

  const initialConfig: AppConfig = {
    notificationEmail: 'graziella.lider@ctvacinas.br',
    people: [
      { id: '1', name: 'Graziella', email: 'graziella@ctvacinas.br', notificationsEnabled: true, active: true },
      { id: '2', name: 'Bruna', email: 'bruna@ctvacinas.br', notificationsEnabled: true, active: true },
      { id: '3', name: 'Ester', email: 'ester@ctvacinas.br', notificationsEnabled: true, active: true },
      { id: '4', name: 'Marjorie', email: 'marjorie@ctvacinas.br', notificationsEnabled: true, active: true },
      { id: '5', name: 'Ana Luiza', email: 'analuiza@ctvacinas.br', notificationsEnabled: true, active: true },
      { id: '6', name: 'Ana Terzian', email: 'anaterzian@ctvacinas.br', notificationsEnabled: true, active: true }
    ],
    projectsData: [],
    users: [{ username: 'Graziella', role: 'admin', passwordHash: 'admin', canViewAll: true }]
  };

  useEffect(() => {
    const initData = async () => {
      setIsSyncing(true);
      await MicrosoftGraphService.initialize();
      const token = await MicrosoftGraphService.getAccessToken();
      
      if (token) {
        const siteId = await MicrosoftGraphService.getSiteId();
        setStorageType(siteId ? 'sharepoint' : 'onedrive');
        
        const remoteData = await MicrosoftGraphService.loadDatabase();
        if (remoteData) {
          setTasks(remoteData.tasks || []);
          setConfig(remoteData.config || initialConfig);
          setIsSyncing(false);
          return;
        }
      }

      const savedTasks = localStorage.getItem('ar_tasks');
      const savedConfig = localStorage.getItem('ar_config');
      setTasks(savedTasks ? JSON.parse(savedTasks) : INITIAL_TASKS);
      setConfig(savedConfig ? JSON.parse(savedConfig) : initialConfig);
      setIsSyncing(false);
    };

    initData();
  }, []);

  useEffect(() => {
    if (tasks.length > 0 && config) {
      localStorage.setItem('ar_tasks', JSON.stringify(tasks));
      localStorage.setItem('ar_config', JSON.stringify(config));
      MicrosoftGraphService.saveDatabase(tasks, config);
    }
  }, [tasks, config]);

  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [selectedMember, setSelectedMember] = useState<string | 'Todos'>('Todos');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [projectFilter, setProjectFilter] = useState('Todos');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [viewingTask, setViewingTask] = useState<Task | undefined>(undefined);
  const [taskToDelete, setTaskToDelete] = useState<Task | undefined>(undefined);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const canEdit = isLoggedIn && currentUser?.role !== 'visitor';
  const hasGlobalView = currentUser?.role === 'admin' || currentUser?.canViewAll;

  const filteredTasks = useMemo(() => {
    const effectiveMember = hasGlobalView ? selectedMember : (currentUser?.username || 'Todos');
    return tasks.filter(t => {
      const matchesMember = effectiveMember === 'Todos' || t.projectLead === effectiveMember || t.collaborators.includes(effectiveMember);
      const matchesSearch = t.activity.toLowerCase().includes(searchTerm.toLowerCase()) || t.project.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' || t.status === statusFilter;
      const matchesProject = projectFilter === 'Todos' || t.project === projectFilter;
      return matchesMember && matchesSearch && matchesStatus && matchesProject;
    });
  }, [tasks, selectedMember, hasGlobalView, currentUser, searchTerm, statusFilter, projectFilter]);

  const stats: DashboardStats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'Concluída').length;
    const inExecution = filteredTasks.filter(t => t.status === 'Em Andamento').length;
    const blocked = filteredTasks.filter(t => t.status === 'Bloqueada').length;
    const avgProgress = total > 0 ? Math.round(filteredTasks.reduce((acc, curr) => acc + curr.progress, 0) / total) : 0;
    return { totalTasks: total, monthlyDeliveries: completed, inExecution, avgProgress, blockedCount: blocked };
  }, [filteredTasks]);

  const handleLogin = (user: AppUser | string) => {
    if (user === 'Todos') {
      const visitorUser: AppUser = { username: 'Visitante', role: 'visitor', passwordHash: '' };
      setCurrentUser(visitorUser);
      setIsLoggedIn(true);
      setSelectedMember('Todos');
    } else {
      const fullUser = config?.users.find(u => u.username === (user as AppUser).username) || (user as AppUser);
      setCurrentUser(fullUser);
      setIsLoggedIn(true);
      setSelectedMember(fullUser.canViewAll || fullUser.role === 'admin' ? 'Todos' : fullUser.username);
    }
    setViewMode('dashboard');
  };

  if (!config) return <LoadingFallback />;

  if (!isLoggedIn) {
    return <SelectionView onSelect={handleLogin} onLogin={handleLogin} users={config.users} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentView={viewMode} onViewChange={setViewMode} 
        selectedMember={selectedMember} onMemberChange={setSelectedMember}
        onGoHome={() => setViewMode('dashboard')} onLogout={() => { setIsLoggedIn(false); setViewMode('selection'); }}
        people={config.people} currentUser={currentUser}
        availableUsers={config.users.map(u => u.username)}
      />

      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <header className="bg-slate-900 text-white p-6 shadow-md flex justify-between items-center sticky top-0 z-40 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2 rounded-lg"><ShieldCheck size={28} className="text-white" /></div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase">{currentUser?.username}</h1>
              <div className="flex items-center gap-2">
                {storageType === 'sharepoint' && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                    <Cloud size={10} /> SharePoint CTVacinas Ativo
                  </div>
                )}
                {storageType === 'onedrive' && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-blue-400 uppercase tracking-widest bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">
                    <Database size={10} /> OneDrive Conectado
                  </div>
                )}
                {storageType === 'offline' && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-400/10 px-2 py-0.5 rounded border border-slate-400/20">
                    <Cloud size={10} /> Modo Local (Offline)
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
             <button onClick={() => setIsReportOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition text-xs font-black uppercase tracking-widest">
              <FileText size={16} /> Relatório IA
            </button>
            {canEdit && (
              <button onClick={() => { setEditingTask(undefined); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition shadow-lg font-black uppercase text-xs tracking-widest">
                <Plus size={18} /> Nova Tarefa
              </button>
            )}
          </div>
        </header>

        <div className="p-8 space-y-6 flex-1">
          <Suspense fallback={<LoadingFallback />}>
            {viewMode === 'dashboard' && <DashboardOverview stats={stats} tasks={filteredTasks} projects={config.projectsData} />}
            {viewMode === 'tasks' && <TaskBoard tasks={filteredTasks} canEdit={canEdit} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={(id) => setTaskToDelete(tasks.find(t => t.id === id))} onViewDetails={setViewingTask} />}
            {viewMode === 'projects' && <ProjectsManager projects={config.projectsData} tasks={tasks} people={config.people} canEdit={canEdit} onUpdate={(p) => setConfig({...config, projectsData: p})} onAddLog={() => {}} />}
            {viewMode === 'people' && <PeopleManager people={config.people} users={config.users} canEdit={currentUser?.role === 'admin'} onUpdate={(p, u) => setConfig({...config, people: p, users: u})} onAddLog={() => {}} />}
            {viewMode === 'access-control' && currentUser?.role === 'admin' && <AccessControl config={config} onUpdateConfig={setConfig} currentUser={currentUser} />}
          </Suspense>
        </div>
      </main>

      <Suspense fallback={null}>
        {isModalOpen && <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={(newTask) => {
          if (editingTask) setTasks(tasks.map(t => t.id === editingTask.id ? newTask : t));
          else setTasks([...tasks, newTask]);
          setIsModalOpen(false);
        }} initialData={editingTask} availableProjects={config.projectsData.map(p => p.name)} availablePeople={config.users.map(u => u.username)} />}
        {viewingTask && <TaskDetailsModal task={viewingTask} onClose={() => setViewingTask(undefined)} />}
        {taskToDelete && <DeletionModal taskName={taskToDelete.activity} onClose={() => setTaskToDelete(undefined)} onConfirm={(reason) => {
          setTasks(tasks.filter(t => t.id !== taskToDelete.id));
          setTaskToDelete(undefined);
        }} />}
        {isReportOpen && <ReportView isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} tasks={filteredTasks} userName={selectedMember} />}
      </Suspense>
    </div>
  );
};

export default App;
