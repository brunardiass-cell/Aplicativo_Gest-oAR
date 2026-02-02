
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, ViewMode, AppNotification, ActivityLog, Project, ActivityPlanTemplate, TeamMember, AccessUser } from './types';
import { DEFAULT_TEAM_MEMBERS, DEFAULT_ACTIVITY_PLANS, DEFAULT_ACCESS_USERS } from './constants';
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
import { MicrosoftGraphService } from './services/microsoftGraphService';
import { PlusCircle, Search, FileSignature, AlertCircle, FileText, BellOff, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [accessUsers, setAccessUsers] = useState<AccessUser[]>([]);
  const [activityPlans, setActivityPlans] = useState<ActivityPlanTemplate[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  
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

  const [isLoading, setIsLoading] = useState(true);
  const isInitialLoad = useRef(true);

  const saveDataToSharePoint = async (data: { tasks: Task[], projects: Project[], teamMembers: TeamMember[], accessUsers: AccessUser[], activityPlans: ActivityPlanTemplate[], notifications: AppNotification[], logs: ActivityLog[] }) => {
    await MicrosoftGraphService.saveToCloud(data);
  };

  useEffect(() => {
    const checkLogin = async () => {
      const account = await MicrosoftGraphService.getAccount();
      if (account) {
        handleLogin(true); // Attempt silent login
      } else {
        setIsLoading(false);
      }
    };
    checkLogin();
  }, []);

  useEffect(() => {
    if (isInitialLoad.current) {
      return;
    }
    const currentState = { tasks, projects, teamMembers, accessUsers, activityPlans, notifications, logs };
    saveDataToSharePoint(currentState);
  }, [tasks, projects, teamMembers, accessUsers, activityPlans, notifications, logs]);


  const handleLogin = async (isSilent = false) => {
    setIsLoading(true);
    const loginResult = isSilent 
      ? { success: true, account: await MicrosoftGraphService.getAccount() } 
      : await MicrosoftGraphService.login();

    if (loginResult.success && loginResult.account) {
      setCurrentUser(loginResult.account.name || 'Usuário');
      setFilterMember(loginResult.account.name || 'Usuário');

      const cloudData = await MicrosoftGraphService.loadFromCloud();
      
      if (cloudData) {
        setTasks(cloudData.tasks || []);
        setProjects(cloudData.projects || []);
        setTeamMembers(cloudData.teamMembers || DEFAULT_TEAM_MEMBERS);
        setAccessUsers(cloudData.accessUsers || DEFAULT_ACCESS_USERS);
        setActivityPlans(cloudData.activityPlans || DEFAULT_ACTIVITY_PLANS);
        setNotifications(cloudData.notifications || []);
        setLogs(cloudData.logs || []);
      } else {
        const initialState = {
            tasks: [],
            projects: [],
            teamMembers: DEFAULT_TEAM_MEMBERS,
            accessUsers: DEFAULT_ACCESS_USERS,
            activityPlans: DEFAULT_ACTIVITY_PLANS,
            notifications: [],
            logs: []
        };
        setTasks(initialState.tasks);
        setProjects(initialState.projects);
        setTeamMembers(initialState.teamMembers);
        setAccessUsers(initialState.accessUsers);
        setActivityPlans(initialState.activityPlans);
        setNotifications(initialState.notifications);
        setLogs(initialState.logs);
        await saveDataToSharePoint(initialState as any);
      }
      setView('dashboard');
      isInitialLoad.current = false;
    } else if (!isSilent) {
      // O erro já é tratado com um alerta dentro do microsoftGraphService
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await MicrosoftGraphService.logout();
    isInitialLoad.current = true;
    setCurrentUser('Todos');
    setView('selection');
    setTasks([]);
    setProjects([]);
    setTeamMembers([]);
    setAccessUsers([]);
    setActivityPlans([]);
    setNotifications([]);
    setLogs([]);
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

  const currentUserIsAdmin = useMemo(() => {
    return accessUsers.find(u => u.name === currentUser)?.role === 'admin' || false;
  }, [accessUsers, currentUser]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0f172a] text-white flex-col gap-4">
        <Loader2 size={48} className="animate-spin text-blue-500" />
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.5em]">CONECTANDO AO SHAREPOINT...</p>
      </div>
    );
  }

  if (view === 'selection') {
    return (
      <SelectionView onSelect={() => handleLogin(false)} />
    );
  }

  const projectNames = Array.from(new Set(tasks.map(t => t.project))).filter(p => p !== '');

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        onGoHome={() => setView('dashboard')}
        onLogout={handleLogout} 
        currentUser={{ username: currentUser, role: currentUserIsAdmin ? 'admin' : 'user' }}
        notificationCount={activeReviews.length}
      />
      
      <main className="flex-1 ml-64 p-10 max-w-[1600px]">
        <header className="flex justify-between items-start mb-12">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                Gestão Setorial • CTVacinas
              </h1>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">
              {view === 'dashboard' ? `ATIVIDADES • ${filterMember === 'Todos' ? 'TODA A EQUIPE' : filterMember}` : 
               view === 'tasks' ? 'Atividades Regulatórias' : 
               view === 'projects' ? 'Fluxos Estratégicos' : 
               view === 'quality' ? 'Gestão de Acesso' : 'Rastreabilidade'}
            </h2>
            
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {(view === 'dashboard' || view === 'tasks') && currentUser !== 'Todos' && activeReviews.length > 0 && (
                  <>
                      <button onClick={() => handleNotificationClick(activeReviews[0])} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-amber-500/20">
                          <FileSignature size={14} />
                          {activeReviews.length} Relatórios para você analisar
                      </button>
                      <button onClick={handleClearAllNotifications} className="flex items-center gap-2 px-4 py-2 bg-white/5 text-slate-400 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition">
                          <BellOff size={14} /> Limpar Notificações
                      </button>
                  </>
              )}
              {view === 'tasks' && (
                  <>
                      {currentUser !== 'Todos' && activeReviews.length === 0 && (
                          <div className="flex items-center gap-2 text-slate-500 italic text-[10px] font-bold uppercase tracking-widest">
                              <AlertCircle size={14} />
                              Você não tem relatórios para análise
                          </div>
                      )}
                      <button 
                          onClick={() => setIsReportOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition"
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
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-sm focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="Todos" className="bg-slate-900">Toda a Equipe</option>
                    {teamMembers.map(m => <option key={m.name} value={m.name} className="bg-slate-900">{m.name}</option>)}
                  </select>
              </div>
            )}
             {view === 'tasks' && (
               <>
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                      type="text"
                      placeholder="Buscar por nome ou projeto..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold outline-none shadow-sm focus:ring-2 focus:ring-blue-500 text-white"
                    />
                 </div>
                 <button 
                  onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
                  className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-500/20 flex items-center gap-2"
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
                accessUsers={accessUsers}
                onUpdateAccessUsers={setAccessUsers}
             />
          )}

          {view === 'traceability' && (
            <ActivityLogView logs={logs} tasks={tasks} onRestoreTask={handleRestoreTask} />
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