
import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { Task, ActivityLog, AppUser, AppConfig, ViewMode, DashboardStats, ProjectData, Person } from './types';
import { INITIAL_TASKS } from './constants';
import Sidebar from './components/Sidebar';
import SelectionView from './components/SelectionView';
import { Plus, FileText, ShieldCheck, Bell, Loader2, Search, Filter } from 'lucide-react';
import { sendSimulatedEmail } from './services/emailService';

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
    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Carregando Módulo...</p>
  </div>
);

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('ar_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('ar_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('ar_config');
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

    if (!saved) return initialConfig;
    const parsed = JSON.parse(saved);
    
    // MIGRAÇÃO CRÍTICA: Garante que dados antigos não quebrem a aplicação (Solução para tela em branco)
    parsed.people = (parsed.people || []).map((p: any) => ({ 
      ...p, 
      active: p.active !== undefined ? p.active : true 
    }));

    parsed.projectsData = (parsed.projectsData || []).map((proj: any) => ({
      ...proj,
      trackingMacroTasks: proj.trackingMacroTasks || [],
      regulatoryMacroTasks: proj.regulatoryMacroTasks || [],
      norms: proj.norms || []
    }));

    return parsed;
  });

  useEffect(() => { localStorage.setItem('ar_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('ar_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('ar_config', JSON.stringify(config)); }, [config]);

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

  const canEdit = useMemo(() => {
    if (!isLoggedIn || !currentUser) return false;
    return currentUser.role !== 'visitor';
  }, [isLoggedIn, currentUser]);

  const hasGlobalView = useMemo(() => {
    return currentUser?.role === 'admin' || currentUser?.canViewAll || currentUser?.role === 'visitor';
  }, [currentUser]);

  const filteredTasks = useMemo(() => {
    const effectiveMember = hasGlobalView ? selectedMember : (currentUser?.username || 'Todos');
    
    return tasks.filter(t => {
      const matchesMember = effectiveMember === 'Todos' || t.projectLead === effectiveMember || t.collaborators.includes(effectiveMember);
      const matchesSearch = t.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.project.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' || t.status === statusFilter;
      const matchesProject = projectFilter === 'Todos' || t.project === projectFilter;
      
      return matchesMember && matchesSearch && matchesStatus && matchesProject;
    });
  }, [tasks, selectedMember, hasGlobalView, currentUser, searchTerm, statusFilter, projectFilter]);

  const stats: DashboardStats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'Concluída').length;
    const inProgress = filteredTasks.filter(t => t.status === 'Em Andamento').length;
    const blocked = filteredTasks.filter(t => t.status === 'Bloqueada').length;
    const avgProgress = total > 0 ? Math.round(filteredTasks.reduce((acc, curr) => acc + curr.progress, 0) / total) : 0;
    return { totalLastMonth: total, completed, inProgress, blocked, avgProgress };
  }, [filteredTasks]);

  const handleAddLog = (taskId: string, title: string, reason: string, action: 'EXCLUSÃO' | 'ALTERAÇÃO_STATUS' = 'EXCLUSÃO') => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      taskId: taskId,
      taskTitle: title,
      user: currentUser?.username || 'Sistema',
      timestamp: new Date().toISOString(),
      reason: reason,
      action: action
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleLogin = (user: AppUser | string) => {
    if (user === 'Todos') {
      const visitorUser: AppUser = { username: 'Visitante', role: 'visitor', passwordHash: '' };
      setCurrentUser(visitorUser);
      setIsLoggedIn(true);
      setSelectedMember('Todos');
    } else {
      const fullUser = config.users.find(u => u.username === (user as AppUser).username) || (user as AppUser);
      setCurrentUser(fullUser);
      setIsLoggedIn(true);
      setSelectedMember(fullUser.canViewAll || fullUser.role === 'admin' ? 'Todos' : fullUser.username);
    }
    setViewMode('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setViewMode('selection');
  };

  const handleSaveTask = (newTask: Task) => {
    if (!canEdit) return;
    
    // GATILHO DE E-MAIL: Se for uma nova tarefa ou edição e a opção de notificar início estiver ligada
    if (newTask.emailOnJoin) {
      const lead = config.people.find(p => p.name === newTask.projectLead);
      if (lead && lead.notificationsEnabled && lead.active) {
        sendSimulatedEmail(newTask, lead.email, 'JOIN');
      }
    }

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? newTask : t));
    } else {
      setTasks(prev => [newTask, ...prev]);
    }
    setIsModalOpen(false);
    setEditingTask(undefined);
  };

  const handleConfirmDeletion = (reason: string) => {
    if (!taskToDelete || !canEdit) return;
    handleAddLog(taskToDelete.id, taskToDelete.activity, reason);
    setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
    setTaskToDelete(undefined);
  };

  if (!isLoggedIn) {
    return <SelectionView onSelect={handleLogin} onLogin={handleLogin} people={config.people} users={config.users} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentView={viewMode} onViewChange={setViewMode} 
        selectedMember={selectedMember} onMemberChange={setSelectedMember}
        onGoHome={() => setViewMode('dashboard')} onLogout={handleLogout}
        people={config.people} currentUser={currentUser}
      />

      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <header className="bg-slate-900 text-white p-6 shadow-md flex justify-between items-center sticky top-0 z-40 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2 rounded-lg"><ShieldCheck size={28} className="text-white" /></div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase">{currentUser?.username}</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {currentUser?.role === 'admin' ? 'Administrador' : 'Membro da Equipe'}
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

        <div className="p-8 space-y-6 flex-1">
          <Suspense fallback={<LoadingFallback />}>
            {viewMode === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
                   <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar Projeto:</span>
                    <select 
                      value={projectFilter} 
                      onChange={(e) => setProjectFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none"
                    >
                      <option value="Todos">Todos Projetos</option>
                      {config.projectsData.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  {hasGlobalView && (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar Pessoa:</span>
                      <select 
                        value={selectedMember} 
                        onChange={(e) => setSelectedMember(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none"
                      >
                        <option value="Todos">Toda Equipe</option>
                        {config.people.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <DashboardOverview stats={stats} tasks={filteredTasks} projects={config.projectsData} />
              </div>
            )}
            {viewMode === 'tasks' && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome da atividade ou projeto..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                    />
                  </div>
                </div>
                <TaskBoard tasks={filteredTasks} canEdit={canEdit} onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDelete={(id) => setTaskToDelete(tasks.find(t => t.id === id))} onViewDetails={setViewingTask} />
              </div>
            )}
            {viewMode === 'projects' && (
              <ProjectsManager 
                projects={config.projectsData} 
                tasks={tasks} 
                people={config.people} 
                canEdit={canEdit} 
                onUpdate={(newProjects) => setConfig(prev => ({ ...prev, projectsData: newProjects }))} 
                onAddLog={handleAddLog}
              />
            )}
            {viewMode === 'people' && (
              <PeopleManager 
                people={config.people} 
                canEdit={canEdit} 
                onUpdate={(newPeople) => setConfig(prev => ({ ...prev, people: newPeople }))} 
                onAddLog={handleAddLog}
              />
            )}
            {viewMode === 'logs' && currentUser?.role === 'admin' && <ActivityLogView logs={logs} />}
            {viewMode === 'access-control' && currentUser?.role === 'admin' && (
              <AccessControl 
                config={config} 
                onUpdateConfig={(newConfig) => setConfig(newConfig)} 
                currentUser={currentUser!} 
              />
            )}
          </Suspense>
        </div>
      </main>

      <Suspense fallback={null}>
        {isModalOpen && canEdit && <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} initialData={editingTask} availableProjects={config.projectsData.map(p => p.name)} availablePeople={config.people.map(p => p.name)} />}
        {viewingTask && <TaskDetailsModal task={viewingTask} onClose={() => setViewingTask(undefined)} />}
        {taskToDelete && canEdit && <DeletionModal taskName={taskToDelete.activity} onClose={() => setTaskToDelete(undefined)} onConfirm={handleConfirmDeletion} />}
        {isReportOpen && <ReportView isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} tasks={filteredTasks} userName={selectedMember} />}
      </Suspense>
    </div>
  );
};

export default App;
