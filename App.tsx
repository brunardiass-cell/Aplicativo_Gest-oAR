
import React, { useState, useEffect, useMemo } from 'react';
import { Task, ViewMode, AppNotification, ActivityLog, Project, ActivityPlanTemplate, TeamMember } from './types';
import { DEFAULT_TEAM_MEMBERS, DEFAULT_ACTIVITY_PLANS } from './constants';
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
import PasswordModal from './components/PasswordModal';
import { PlusCircle, Search, FileSignature, AlertCircle, ShieldCheck, FileText, BellOff } from 'lucide-react';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('ar_tasks_v6');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('ar_projects_v6');
    return saved ? JSON.parse(saved) : [];
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('ar_team_members_v6');
    return saved ? JSON.parse(saved) : DEFAULT_TEAM_MEMBERS;
  });

  const [activityPlans, setActivityPlans] = useState<ActivityPlanTemplate[]>(() => {
    const saved = localStorage.getItem('ar_activity_plans_v6');
    return saved ? JSON.parse(saved) : DEFAULT_ACTIVITY_PLANS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('ar_notifications_v6');
    return saved ? JSON.parse(saved) : [];
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('ar_logs_v6');
    return saved ? JSON.parse(saved) : [];
  });

  const [view, setView] = useState<ViewMode>('selection');
  const [currentUser, setCurrentUser] = useState<string | 'Todos'>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMember, setFilterMember] = useState<string | 'Todos'>('Todos');
  
  const [isProjectItemDeletionModalOpen, setIsProjectItemDeletionModalOpen] = useState(false);
  const [projectItemToDelete, setProjectItemToDelete] = useState<{ type: 'macro' | 'micro', projectId: string; macroId: string; microId?: string; name: string } | null>(null);

  const [userToAuth, setUserToAuth] = useState<TeamMember | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('ar_tasks_v6', JSON.stringify(tasks));
    localStorage.setItem('ar_projects_v6', JSON.stringify(projects));
    localStorage.setItem('ar_team_members_v6', JSON.stringify(teamMembers));
    localStorage.setItem('ar_activity_plans_v6', JSON.stringify(activityPlans));
    localStorage.setItem('ar_notifications_v6', JSON.stringify(notifications));
    localStorage.setItem('ar_logs_v6', JSON.stringify(logs));
  }, [tasks, projects, teamMembers, activityPlans, notifications, logs]);

  const loginUser = (name: string | 'Todos') => {
    setCurrentUser(name);
    setFilterMember(name);
    setView('dashboard');
    setIsPasswordModalOpen(false);
    setUserToAuth(null);
  };

  const handleSelectUser = (memberOrAll: TeamMember | 'Todos') => {
    if (memberOrAll === 'Todos') {
      loginUser('Todos');
      return;
    }
    const member = memberOrAll;
    if (member.password) {
      setUserToAuth(member);
      setIsPasswordModalOpen(true);
    } else {
      loginUser(member.name);
    }
  };

  const handlePasswordConfirm = (password: string) => {
    if (userToAuth && password === userToAuth.password) {
      loginUser(userToAuth.name);
    } else {
      alert('Senha incorreta.');
    }
  };

  const handleSaveTask = (task: Task) => {
    const isEditing = tasks.some(t => t.id === task.id);
    const originalTask = tasks.find(t => t.id === task.id);

    if (originalTask && originalTask.reportStage === 'Próximo Revisor' && originalTask.currentReviewer) {
        const reviewerChanged = task.currentReviewer !== originalTask.currentReviewer;
        const stageChanged = task.reportStage !== 'Próximo Revisor';
        
        if (reviewerChanged || stageChanged) {
            setNotifications(prevNotifs => prevNotifs.map(n => 
                (n.refId === originalTask.id && n.userId === originalTask.currentReviewer && !n.read) 
                ? { ...n, read: true } 
                : n
            ));
        }
    }

    setTasks(prevTasks => isEditing ? prevTasks.map(t => t.id === task.id ? task : t) : [task, ...prevTasks]);
    
    const log: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      action: isEditing ? 'EDIÇÃO' : 'CRIAÇÃO',
      taskTitle: task.activity,
      user: currentUser,
      timestamp: new Date().toISOString(),
      reason: isEditing ? 'Atualização manual dos dados da atividade' : 'Nova atividade adicionada ao sistema'
    };
    setLogs(prevLogs => [log, ...prevLogs]);

    if (task.reportStage === 'Próximo Revisor' && task.currentReviewer && task.currentReviewer !== originalTask?.currentReviewer) {
      const newNotif: AppNotification = {
        id: Math.random().toString(36).substr(2, 9),
        userId: task.currentReviewer,
        message: `REVISÃO: ${task.activity} encaminhado para você.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'REVIEW_ASSIGNED',
        refId: task.id
      };
      setNotifications(prevNotifs => [newNotif, ...prevNotifs]);
    }

    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = (reason: string) => {
    if (!selectedTask) return;

    setTasks(tasks.map(t => 
      t.id === selectedTask.id ? { 
        ...t, 
        deleted: true, 
        deletionReason: reason, 
        deletionDate: new Date().toISOString() 
      } : t
    ));

    setNotifications(prev => prev.map(n => n.refId === selectedTask.id ? { ...n, read: true } : n));

    const log: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      action: 'EXCLUSÃO',
      taskTitle: selectedTask.activity,
      user: currentUser,
      timestamp: new Date().toISOString(),
      reason: reason
    };
    setLogs([log, ...logs]);
    
    setIsDeleteModalOpen(false);
    setSelectedTask(null);
  };

  const handleRestoreTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTasks(tasks.map(t => t.id === taskId ? { ...t, deleted: false } : t));

    const log: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      action: 'RESTAURAÇÃO',
      taskTitle: task.activity,
      user: currentUser,
      timestamp: new Date().toISOString(),
      reason: 'Atividade restaurada pelo módulo de rastreabilidade'
    };
    setLogs([log, ...logs]);
  };
  
  const handleOpenProjectItemDeletionModal = (item: { type: 'macro' | 'micro', projectId: string; macroId: string; microId?: string; name: string }) => {
    setProjectItemToDelete(item);
    setIsProjectItemDeletionModalOpen(true);
  };

  const handleConfirmProjectItemDeletion = (reason: string) => {
    if (!projectItemToDelete) return;

    const { type, projectId, macroId, microId, name } = projectItemToDelete;

    let updatedProjects = [...projects];
    const projectIndex = updatedProjects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) return;

    if (type === 'macro') {
        updatedProjects[projectIndex].macroActivities = updatedProjects[projectIndex].macroActivities.filter(m => m.id !== macroId);
    } else if (type === 'micro' && microId) {
        const macroIndex = updatedProjects[projectIndex].macroActivities.findIndex(m => m.id === macroId);
        if (macroIndex > -1) {
            updatedProjects[projectIndex].macroActivities[macroIndex].microActivities = updatedProjects[projectIndex].macroActivities[macroIndex].microActivities.filter(m => m.id !== microId);
        }
    }

    setProjects(updatedProjects);

    const log: ActivityLog = {
        id: Math.random().toString(36).substr(2, 9),
        action: 'EXCLUSÃO',
        taskTitle: `[${projects[projectIndex].name}] ${type === 'macro' ? 'Macro' : 'Micro'}: ${name}`,
        user: currentUser,
        timestamp: new Date().toISOString(),
        reason: reason
    };
    setLogs(prevLogs => [log, ...prevLogs]);

    setIsProjectItemDeletionModalOpen(false);
    setProjectItemToDelete(null);
  };

  const handleClearAllNotifications = () => {
    setNotifications(prev => prev.map(n => 
        (n.userId === currentUser && !n.read) ? { ...n, read: true } : n
    ));
  };

  const handleClearSingleNotification = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
    ));
  };
  
  const handleNotificationClick = (notification: AppNotification) => {
    const task = tasks.find(t => t.id === notification.refId);
    
    if (task) {
      handleClearSingleNotification(notification.id);
      setSelectedTask(task);
      setIsDetailsOpen(true);
    }
  };

  const onViewTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  const activeReviews = useMemo(() => {
    return notifications.filter(n => n.userId === currentUser && !n.read && n.type === 'REVIEW_ASSIGNED');
  }, [notifications, currentUser]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const memberMatch = filterMember === 'Todos' 
        || t.projectLead === filterMember 
        || t.collaborators.includes(filterMember)
        || t.currentReviewer === filterMember;
        
      const searchMatch = t.activity.toLowerCase().includes(searchTerm.toLowerCase()) || t.project.toLowerCase().includes(searchTerm.toLowerCase());
      return memberMatch && searchMatch;
    });
  }, [tasks, filterMember, searchTerm]);

  if (view === 'selection') {
    return (
      <>
        <SelectionView members={teamMembers} onSelect={handleSelectUser} />
        {isPasswordModalOpen && userToAuth && (
          <PasswordModal
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
            onConfirm={handlePasswordConfirm}
            userName={userToAuth.name}
          />
        )}
      </>
    );
  }

  const projectNames = Array.from(new Set(tasks.map(t => t.project))).filter(p => p !== '');

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        onGoHome={() => setView('selection')}
        onLogout={() => setView('selection')} 
        currentUser={{ username: currentUser, role: currentUser === 'Graziella' ? 'admin' : 'user' }}
        notificationCount={activeReviews.length}
      />
      
      <main className="flex-1 ml-64 p-10 max-w-[1600px]">
        <header className="flex justify-between items-start mb-12">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 bg-[#1a2b4e] rounded-full"></span>
              <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                Gestão Setorial • CTVacinas
              </h1>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
              {view === 'dashboard' ? `ATIVIDADES • ${filterMember === 'Todos' ? 'TODA A EQUIPE' : filterMember}` : 
               view === 'tasks' ? 'Atividades Regulatórias' : 
               view === 'projects' ? 'Fluxos Estratégicos' : 
               view === 'quality' ? 'Controle de Acesso' : 'Rastreabilidade'}
            </h2>
            
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {(view === 'dashboard' || view === 'tasks') && currentUser !== 'Todos' && activeReviews.length > 0 && (
                  <>
                      <button onClick={() => handleNotificationClick(activeReviews[0])} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-amber-200">
                          <FileSignature size={14} />
                          {activeReviews.length} Relatórios para você analisar
                      </button>
                      <button onClick={handleClearAllNotifications} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition">
                          <BellOff size={14} /> Limpar Notificações
                      </button>
                  </>
              )}
              {view === 'tasks' && (
                  <>
                      {currentUser !== 'Todos' && activeReviews.length === 0 && (
                          <div className="flex items-center gap-2 text-slate-400 italic text-[10px] font-bold uppercase tracking-widest">
                              <AlertCircle size={14} />
                              Você não tem relatórios para análise
                          </div>
                      )}
                      <button 
                          onClick={() => setIsReportOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition"
                      >
                          <FileText size={14} />
                          Emitir Relatório IA ({filterMember})
                      </button>
                  </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {(view === 'dashboard' || view === 'tasks') && (
              <div className="flex gap-2">
                  <select 
                    value={filterMember} 
                    onChange={e => setFilterMember(e.target.value)}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-sm focus:ring-2 focus:ring-[#1a2b4e] text-slate-900"
                  >
                    <option value="Todos">Toda a Equipe</option>
                    {teamMembers.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                  </select>
              </div>
            )}
             {view === 'tasks' && (
               <>
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="text"
                      placeholder="Buscar por nome ou projeto..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none shadow-sm focus:ring-2 focus:ring-[#1a2b4e] text-slate-900"
                    />
                 </div>
                 <button 
                  onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
                  className="px-8 py-3.5 bg-[#1a2b4e] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0f172a] transition shadow-xl flex items-center gap-2"
                >
                  <PlusCircle size={18} /> Nova Atividade
                </button>
               </>
             )}
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 pb-20">
          {view === 'dashboard' && <Dashboard tasks={tasks} filteredUser={filterMember} notifications={notifications} onViewTaskDetails={onViewTaskDetails} />}
          
          {view === 'tasks' && (
            <TaskBoard 
              tasks={filteredTasks} 
              currentUser={currentUser} 
              onEdit={(task) => { setSelectedTask(task); setIsModalOpen(true); }} 
              onView={(task) => { setSelectedTask(task); setIsDetailsOpen(true); }}
              onDelete={(task) => { setSelectedTask(task); setIsDeleteModalOpen(true); }}
              onAssignReview={() => {}}
              onNotificationClick={handleNotificationClick}
              onClearSingleNotification={handleClearSingleNotification}
              notifications={notifications}
            />
          )}

          {view === 'projects' && (
            <ProjectsManager
              projects={projects}
              onUpdateProjects={setProjects}
              activityPlans={activityPlans}
              onUpdateActivityPlans={setActivityPlans}
              onOpenDeletionModal={handleOpenProjectItemDeletionModal}
              teamMembers={teamMembers}
            />
          )}

          {view === 'quality' && (
             <AccessControl 
                teamMembers={teamMembers}
                onUpdateTeamMembers={setTeamMembers}
             />
          )}

          {view === 'traceability' && (
            <div className="space-y-10">
              <ActivityLogView logs={logs} />
              
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <header className="p-8 bg-red-50 border-b border-red-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-red-900 uppercase tracking-tighter">Atividades Excluídas Recentemente</h3>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Disponíveis para restauração por até 7 dias</p>
                  </div>
                </header>
                <div className="divide-y divide-slate-100">
                  {tasks.filter(t => t.deleted).map(task => (
                    <div key={task.id} className="p-8 flex items-center justify-between group hover:bg-red-50/10 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{task.activity}</h4>
                          <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-400 px-2 py-0.5 rounded">{task.project}</span>
                        </div>
                        <p className="text-xs text-red-600 font-medium">Motivo: {task.deletionReason}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Excluído em: {new Date(task.deletionDate!).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <button 
                        onClick={() => handleRestoreTask(task.id)}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition"
                      >
                        Restaurar Atividade
                      </button>
                    </div>
                  ))}
                  {tasks.filter(t => t.deleted).length === 0 && (
                    <p className="p-16 text-center text-slate-400 font-bold uppercase text-xs italic tracking-widest">Nenhuma atividade na lixeira.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {isModalOpen && (
          <TaskModal 
            isOpen={isModalOpen} 
            onClose={() => { setIsModalOpen(false); setSelectedTask(null); }} 
            onSave={handleSaveTask}
            initialData={selectedTask}
            projects={projectNames.length > 0 ? projectNames : ['Registro Vacinal', 'Biológicos', 'CTVacinas GERAL']}
            teamMembers={teamMembers}
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

        {isProjectItemDeletionModalOpen && projectItemToDelete && (
          <DeletionModal 
            itemName={projectItemToDelete.name}
            onClose={() => { setIsProjectItemDeletionModalOpen(false); setProjectItemToDelete(null); }}
            onConfirm={handleConfirmProjectItemDeletion}
          />
        )}

        {isReportOpen && (
          <ReportView 
            isOpen={isReportOpen} 
            onClose={() => setIsReportOpen(false)} 
            tasks={filteredTasks} 
            userName={filterMember} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
