
import React, { useState, useMemo, useEffect } from 'react';
import { Task, Person, ProjectData, ViewMode, AppConfig, DashboardStats, ActivityLog, AppUser } from './types';
import { INITIAL_TASKS } from './constants';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import TaskBoard from './components/TaskBoard';
import TaskModal from './components/TaskModal';
import TaskDetailsModal from './components/TaskDetailsModal';
import DeletionModal from './components/DeletionModal';
import ReportView from './components/ReportView';
import SelectionView from './components/SelectionView';
import ProjectsManager from './components/ProjectsManager';
import PeopleManager from './components/PeopleManager';
import ActivityLogView from './components/ActivityLogView';
import AccessControl from './components/AccessControl';
import { Plus, FileText, ShieldCheck, Bell } from 'lucide-react';

const App: React.FC = () => {
  // Estado inicial carregado do LocalStorage ou constantes
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
    return saved ? JSON.parse(saved) : {
      notificationEmail: 'graziella.lider@empresa.com',
      people: [
        { id: '1', name: 'Graziella', email: 'graziella@ctvacinas.br', notificationsEnabled: true },
        { id: '2', name: 'Bruna', email: 'bruna@ctvacinas.br', notificationsEnabled: true },
        { id: '3', name: 'Ester', email: 'ester@ctvacinas.br', notificationsEnabled: true },
        { id: '4', name: 'Marjorie', email: 'marjorie@ctvacinas.br', notificationsEnabled: true },
        { id: '5', name: 'Ana Luiza', email: 'analuiza@ctvacinas.br', notificationsEnabled: true },
        { id: '6', name: 'Ana Terzian', email: 'anaterzian@ctvacinas.br', notificationsEnabled: true }
      ],
      projectsData: [
        { id: 'p1', name: 'Registro de Vacinas', status: 'Ativo', trackingChecklist: [], regulatoryChecklist: [] },
        { id: 'p2', name: 'Estudos de Estabilidade', status: 'Em Planejamento', trackingChecklist: [], regulatoryChecklist: [] },
        { id: 'p3', name: 'Dossiê Técnico', status: 'Ativo', trackingChecklist: [], regulatoryChecklist: [] }
      ],
      users: [
        { username: 'Graziella', role: 'admin', passwordHash: 'admin' }
      ]
    };
  });

  // Persistir dados sempre que houver mudança
  useEffect(() => { localStorage.setItem('ar_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('ar_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('ar_config', JSON.stringify(config)); }, [config]);

  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [selectedMember, setSelectedMember] = useState<string | 'Todos'>('Todos');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [viewingTask, setViewingTask] = useState<Task | undefined>(undefined);
  const [taskToDelete, setTaskToDelete] = useState<Task | undefined>(undefined);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const canEdit = currentUser?.role !== 'visitor';
  const isAdmin = currentUser?.role === 'admin';

  const memberTasks = useMemo(() => {
    if (selectedMember === 'Todos') return tasks;
    return tasks.filter(t => 
      t.projectLead === selectedMember || t.collaborators.includes(selectedMember)
    );
  }, [tasks, selectedMember]);

  const filteredTasks = useMemo(() => {
    return memberTasks.filter(t => {
      const matchesSearch = 
        t.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [memberTasks, searchTerm, statusFilter]);

  const stats: DashboardStats = useMemo(() => {
    const total = memberTasks.length;
    const completed = memberTasks.filter(t => t.status === 'Concluída').length;
    const inProgress = memberTasks.filter(t => t.status === 'Em Andamento').length;
    const blocked = memberTasks.filter(t => t.status === 'Bloqueada').length;
    const avgProgress = total > 0 
      ? Math.round(memberTasks.reduce((acc, curr) => acc + curr.progress, 0) / total) 
      : 0;
    return { totalLastMonth: total, completed, inProgress, blocked, avgProgress };
  }, [memberTasks]);

  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setSelectedMember(user.role === 'visitor' ? 'Todos' : user.username);
    setViewMode('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSelectedMember('Todos');
    setViewMode('selection');
  };

  const handleSaveTask = (newTask: Task) => {
    if (!canEdit) return;
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

    const newLog: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      taskId: taskToDelete.id,
      taskTitle: taskToDelete.activity,
      user: currentUser?.username || 'Sistema',
      timestamp: new Date().toISOString(),
      reason: reason,
      action: 'EXCLUSÃO'
    };

    setLogs(prev => [newLog, ...prev]);
    setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
    setTaskToDelete(undefined);
  };

  const nextPendingTask = useMemo(() => {
    return [...memberTasks]
      .filter(t => t.status !== 'Concluída' && t.nextStep)
      .sort((a, b) => new Date(a.completionDate).getTime() - new Date(b.completionDate).getTime())[0];
  }, [memberTasks]);

  if (!isLoggedIn) {
    return (
      <SelectionView 
        onSelect={(member) => {
          handleLogin({ username: member, role: 'visitor', passwordHash: '' });
        }}
        onLogin={handleLogin}
        people={config.people}
        users={config.users}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentView={viewMode} 
        onViewChange={setViewMode} 
        selectedMember={selectedMember} 
        onMemberChange={setSelectedMember}
        onGoHome={() => setViewMode('dashboard')}
        onLogout={handleLogout}
        people={config.people}
        currentUser={currentUser}
      />

      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <header className="bg-slate-900 text-white p-6 shadow-md flex justify-between items-center sticky top-0 z-40 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase">Assuntos Regulatórios CTVacinas</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">SISTEMA INTEGRADO DE GESTÃO</p>
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
          {nextPendingTask && viewMode === 'dashboard' && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-2 rounded-xl text-white"><Bell size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Próximo Prazo</p>
                  <p className="text-sm font-bold text-slate-900">{nextPendingTask.activity}: <span className="text-slate-600 font-medium">Prazo em {new Date(nextPendingTask.completionDate).toLocaleDateString('pt-BR')}</span></p>
                </div>
              </div>
              <button onClick={() => setViewingTask(nextPendingTask)} className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition text-xs font-black uppercase tracking-widest shadow-sm">Ver Detalhes</button>
            </div>
          )}

          {viewMode === 'dashboard' && <DashboardOverview stats={stats} tasks={filteredTasks} />}
          {viewMode === 'tasks' && (
            <TaskBoard 
              tasks={filteredTasks} 
              canEdit={canEdit}
              onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }}
              onDelete={(id) => setTaskToDelete(tasks.find(t => t.id === id))}
              onViewDetails={setViewingTask}
            />
          )}
          {viewMode === 'projects' && (
             <ProjectsManager 
              projects={config.projectsData} 
              tasks={tasks}
              canEdit={canEdit}
              onUpdate={(newProjects) => setConfig({ ...config, projectsData: newProjects })} 
            />
          )}
          {viewMode === 'people' && (
            <PeopleManager 
              people={config.people}
              canEdit={canEdit}
              onUpdate={(newPeople) => setConfig({ ...config, people: newPeople })}
            />
          )}
          {viewMode === 'logs' && isAdmin && (
            <ActivityLogView logs={logs} />
          )}
          {viewMode === 'access-control' && isAdmin && (
            <AccessControl 
              config={config} 
              onUpdateConfig={(newConfig) => setConfig(newConfig)} 
              currentUser={currentUser!}
            />
          )}
        </div>
      </main>

      {isModalOpen && canEdit && (
        <TaskModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveTask} 
          initialData={editingTask}
          availableProjects={config.projectsData.map(p => p.name)}
          availablePeople={config.people.map(p => p.name)}
        />
      )}
      {viewingTask && <TaskDetailsModal task={viewingTask} onClose={() => setViewingTask(undefined)} />}
      {taskToDelete && canEdit && (
        <DeletionModal 
          taskName={taskToDelete.activity} 
          onClose={() => setTaskToDelete(undefined)} 
          onConfirm={handleConfirmDeletion}
        />
      )}
      {isReportOpen && <ReportView isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} tasks={filteredTasks} userName={selectedMember} />}
    </div>
  );
};

export default App;
