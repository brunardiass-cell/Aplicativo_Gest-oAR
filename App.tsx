
import React, { useState, useMemo, useEffect } from 'react';
import { Task, ActivityLog, AppUser, AppConfig, ViewMode, DashboardStats } from './types';
import { INITIAL_TASKS } from './constants';
import Sidebar from './components/Sidebar';
import SelectionView from './components/SelectionView';
import { Plus, FileText, ShieldCheck, Loader2, Search, Filter, XCircle } from 'lucide-react';
import { MicrosoftGraphService } from './services/microsoftGraphService';

import DashboardOverview from './components/DashboardOverview';
import TaskBoard from './components/TaskBoard';
import ProjectsManager from './components/ProjectsManager';
import PeopleManager from './components/PeopleManager';
import ActivityLogView from './components/ActivityLogView';
import AccessControl from './components/AccessControl';
import TaskModal from './components/TaskModal';
import TaskDetailsModal from './components/TaskDetailsModal';
import DeletionModal from './components/DeletionModal';
import ReportView from './components/ReportView';

const LoadingFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Iniciando Sistema PAR...</p>
  </div>
);

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMsConnected, setIsMsConnected] = useState(false);

  // Filtros
  const [selectedMember, setSelectedMember] = useState<string | 'Todos'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [projectFilter, setProjectFilter] = useState('Todos');

  const initialConfig: AppConfig = {
    notificationEmail: 'graziella.lider@ctvacinas.br',
    people: [{ id: '1', name: 'Graziella', email: 'graziella@ctvacinas.br', notificationsEnabled: true, active: true }],
    projectsData: [],
    users: [{ username: 'Graziella', role: 'admin', passwordHash: 'admin', canViewAll: true }]
  };

  useEffect(() => {
    const initData = async () => {
      try {
        setIsSyncing(true);
        await MicrosoftGraphService.initialize();
        const token = await MicrosoftGraphService.getAccessToken();
        
        if (token) {
          setIsMsConnected(true);
          const remoteData = await MicrosoftGraphService.loadDatabase();
          if (remoteData) {
            setTasks(remoteData.tasks || INITIAL_TASKS);
            setConfig(remoteData.config || initialConfig);
            setIsSyncing(false);
            return;
          }
        }
      } catch (err) { console.error("Erro na sincronização inicial:", err); }

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
      if (isMsConnected) MicrosoftGraphService.saveDatabase(tasks, config);
    }
  }, [tasks, config, isMsConnected]);

  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [viewingTask, setViewingTask] = useState<Task | undefined>(undefined);
  const [taskToDelete, setTaskToDelete] = useState<Task | undefined>(undefined);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const canEdit = isLoggedIn && currentUser?.role !== 'visitor';
  const isAdmin = isLoggedIn && currentUser?.role === 'admin';
  const hasGlobalView = isAdmin || currentUser?.canViewAll;

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
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyDeliveries = filteredTasks.filter(t => {
      if (t.status !== 'Concluída' || !t.completionDate) return false;
      const d = new Date(t.completionDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const inExecution = filteredTasks.filter(t => t.status === 'Em Andamento').length;
    const blockedCount = filteredTasks.filter(t => t.status === 'Bloqueada').length;
    const totalProgress = filteredTasks.reduce((acc, curr) => acc + curr.progress, 0);
    const avgProgress = filteredTasks.length > 0 ? Math.round(totalProgress / filteredTasks.length) : 0;

    return { totalTasks: filteredTasks.length, monthlyDeliveries, inExecution, avgProgress, blockedCount };
  }, [filteredTasks]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setViewMode('selection');
  };

  if (!config) return <LoadingFallback />;

  if (!isLoggedIn) {
    return (
      <SelectionView 
        onSelect={(m) => { setViewMode('dashboard'); setIsLoggedIn(true); }} // Visitante se necessário
        onLogin={(u) => { 
          setCurrentUser(u); 
          setIsLoggedIn(true); 
          setViewMode('dashboard');
          setSelectedMember(u.canViewAll ? 'Todos' : u.username);
        }} 
        users={config.users} 
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentView={viewMode} onViewChange={setViewMode} 
        selectedMember={selectedMember} onMemberChange={setSelectedMember}
        onGoHome={() => setViewMode('dashboard')} onLogout={handleLogout}
        people={config.people} currentUser={currentUser}
        availableUsers={config.users.map(u => u.username)}
      />

      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <header className="bg-slate-900 text-white p-6 shadow-md flex justify-between items-center sticky top-0 z-40 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-900/40"><ShieldCheck size={28} className="text-white" /></div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Gestão PAR</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Logado: {currentUser?.username} • {currentUser?.role === 'admin' ? 'Administradora' : 'Membro Equipe'}
              </p>
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

        {(viewMode === 'dashboard' || viewMode === 'tasks') && (
          <div className="px-8 pt-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl text-slate-400">
                <Filter size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Buscar atividade..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none">
                <option value="Todos">Todos Projetos</option>
                {config.projectsData.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
              {hasGlobalView && (
                <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none">
                  <option value="Todos">Toda Equipe</option>
                  {config.users.map(u => <option key={u.username} value={u.username}>{u.username}</option>)}
                </select>
              )}
              <button onClick={() => { setSelectedMember('Todos'); setProjectFilter('Todos'); setStatusFilter('Todos'); setSearchTerm(''); }} className="p-2 text-slate-400 hover:text-red-500 transition"><XCircle size={20}/></button>
            </div>
          </div>
        )}

        <div className="p-8 pt-4 space-y-6 flex-1">
          {viewMode === 'dashboard' && <DashboardOverview stats={stats} tasks={filteredTasks} projects={config.projectsData} />}
          {viewMode === 'tasks' && <TaskBoard tasks={filteredTasks} canEdit={canEdit} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={(id) => setTaskToDelete(tasks.find(t => t.id === id))} onViewDetails={setViewingTask} />}
          {viewMode === 'projects' && <ProjectsManager projects={config.projectsData} tasks={tasks} people={config.people} canEdit={canEdit} onUpdate={(p) => setConfig({...config, projectsData: p})} onAddLog={() => {}} />}
          {viewMode === 'people' && <PeopleManager people={config.people} users={config.users} canEdit={isAdmin} onUpdate={(p, u) => setConfig({...config, people: p, users: u})} onAddLog={() => {}} />}
          {viewMode === 'access-control' && isAdmin && <AccessControl config={config} onUpdateConfig={setConfig} currentUser={currentUser!} />}
          {viewMode === 'logs' && isAdmin && <ActivityLogView logs={logs} />}
        </div>
      </main>

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
    </div>
  );
};

export default App;
