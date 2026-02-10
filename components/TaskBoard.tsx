
import React, { useMemo } from 'react';
import { Task, AppNotification, Status } from '../types';
import { 
  ArrowRight, 
  MessageSquare, 
  FileSignature, 
  Clock, 
  X,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  SlidersHorizontal,
  CheckCircle
} from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  currentUser: string | 'Todos';
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAssignReview: (taskId: string, reviewer: string) => void;
  onNotificationClick: (notification: AppNotification) => void;
  onClearSingleNotification: (notificationId: string) => void;
  onClearAllNotifications: () => void;
  notifications: AppNotification[];
  statusFilter: 'Todos' | Status;
  leadFilter: string;
  projectFilter: string;
  onStatusFilterChange: (status: 'Todos' | Status) => void;
  onLeadFilterChange: (lead: string) => void;
  onProjectFilterChange: (project: string) => void;
  uniqueLeads: string[];
  uniqueProjects: string[];
  dateFilterType: 'all' | 'requestDate' | 'completionDate';
  onDateFilterTypeChange: (type: 'all' | 'requestDate' | 'completionDate') => void;
  startDateFilter: string;
  onStartDateFilterChange: (date: string) => void;
  endDateFilter: string;
  onEndDateFilterChange: (date: string) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ 
  tasks, 
  currentUser, 
  onEdit, 
  onView,
  onDelete, 
  onAssignReview,
  onNotificationClick,
  onClearSingleNotification,
  onClearAllNotifications,
  notifications,
  statusFilter,
  leadFilter,
  projectFilter,
  onStatusFilterChange,
  onLeadFilterChange,
  onProjectFilterChange,
  uniqueLeads,
  uniqueProjects,
  dateFilterType,
  onDateFilterTypeChange,
  startDateFilter,
  onStartDateFilterChange,
  endDateFilter,
  onEndDateFilterChange
}) => {
  const activeTasks = tasks.filter(t => !t.deleted);
  const activeReviews = notifications.filter(n => n.userId === currentUser && !n.read && n.type === 'REVIEW_ASSIGNED');
  const isTeamView = currentUser === 'Visão Geral da Equipe';

  const sortedTasks = useMemo(() => {
    return [...activeTasks].sort((a, b) => {
        const aIsCompleted = a.status === 'Concluída';
        const bIsCompleted = b.status === 'Concluída';

        if (aIsCompleted !== bIsCompleted) {
            return aIsCompleted ? 1 : -1;
        }

        const dateA = a.completionDate ? new Date(a.completionDate + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.completionDate ? new Date(b.completionDate + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;
        
        if (dateA === dateB) return 0;

        return dateA - dateB;
    });
  }, [activeTasks]);


  const renderReportStageBadge = (task: Task) => {
    if (!task.isReport || !task.reportStage) return null;

    let text: string = task.reportStage;
    let className = 'bg-amber-50 text-amber-600 border-amber-100'; // Padrão para relatórios

    if (task.reportStage === 'Próximo Revisor') {
      if (currentUser === task.currentReviewer) {
        text = 'Revisão Solicitada';
        className = 'bg-amber-50 text-amber-600 border-amber-100'; // Âmbar para o revisor
      } else {
        text = 'Próximo Revisor';
        className = 'bg-emerald-50 text-emerald-600 border-emerald-100';
      }
    } else if (task.reportStage.includes('Concluído')) {
      className = 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }

    return (
      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${className}`}>
        {text}
      </span>
    );
  };
  
  const isCollaborator = (task: Task) => currentUser !== 'Todos' && task.collaborators?.includes(currentUser) && task.projectLead !== currentUser;


  return (
    <div className="space-y-6">
      {activeReviews.length > 0 && currentUser !== 'Todos' && (
        <div className="bg-[#1e293b] rounded-2xl p-6 shadow-lg animate-in slide-in-from-top duration-500 space-y-4">
           <div className="flex justify-between items-center">
             <div className="flex items-center gap-4">
                <button className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-2">
                   <FileSignature size={14} /> {activeReviews.length} RELATÓRIOS PARA VOCÊ ANALISAR
                </button>
                <button onClick={onClearAllNotifications} className="px-4 py-2 bg-white/10 text-slate-300 rounded-lg text-xs font-bold hover:bg-white/20 transition">Limpar Notificações</button>
             </div>
           </div>
           
           <div className="bg-[#0f172a] p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg"><FileSignature size={16}/></div>
                <div>
                  <h3 className="text-white font-bold text-sm">RELATÓRIOS PENDENTES PARA SUA REVISÃO</h3>
                  <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">Ação necessária em {activeReviews.length} documentos</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                 {activeReviews.map(notif => (
                   <div key={notif.id} className="bg-[#1e293b] p-3 rounded-lg flex items-center justify-between group">
                     <button onClick={() => onNotificationClick(notif)} className="flex-1 flex items-center justify-between pr-6 text-left">
                       <p className="text-slate-300 text-xs font-bold uppercase truncate">{notif.message}</p>
                       <ArrowRight size={16} className="text-amber-500 group-hover:translate-x-1 transition shrink-0" />
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); onClearSingleNotification(notif.id); }} className="p-1 text-slate-500 hover:text-white hover:bg-slate-700 rounded-full transition-colors" title="Limpar notificação"><X size={14} /></button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pr-4 self-center shrink-0">
              <SlidersHorizontal size={14}/> Filtros
          </h3>
          <div className="flex-1 min-w-[150px]">
              <label className="text-[9px] font-bold text-slate-500">Projeto</label>
              <select value={projectFilter} onChange={(e) => onProjectFilterChange(e.target.value)} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none">
                  {uniqueProjects.map(project => (<option key={project} value={project}>{project}</option>))}
              </select>
          </div>
          <div className="flex-1 min-w-[150px]">
              <label className="text-[9px] font-bold text-slate-500">Status</label>
              <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value as 'Todos' | Status)} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none">
                  <option value="Todos">Todos</option><option value="Planejada">Planejada</option><option value="Em Andamento">Em Andamento</option><option value="Concluída">Concluída</option><option value="Pausado">Pausado</option><option value="Não Aplicável">Não Aplicável</option>
              </select>
          </div>
          {isTeamView && (
            <div className="flex-1 min-w-[150px]">
                <label className="text-[9px] font-bold text-slate-500">Responsável</label>
                <select value={leadFilter} onChange={(e) => onLeadFilterChange(e.target.value)} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none">
                    {uniqueLeads.map(lead => (<option key={lead} value={lead}>{lead}</option>))}
                </select>
            </div>
          )}
          <div className="flex-1 min-w-[150px]">
              <label className="text-[9px] font-bold text-slate-500">Filtrar por Data</label>
              <select value={dateFilterType} onChange={(e) => onDateFilterTypeChange(e.target.value as any)} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none">
                  <option value="all">Não filtrar</option><option value="requestDate">Data de Solicitação</option><option value="completionDate">Data de Entrega</option>
              </select>
          </div>
          <div className="flex-1 min-w-[120px]">
              <label className="text-[9px] font-bold text-slate-500">De</label>
              <input type="date" value={startDateFilter} onChange={(e) => onStartDateFilterChange(e.target.value)} disabled={dateFilterType === 'all'} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none disabled:opacity-50"/>
          </div>
          <div className="flex-1 min-w-[120px]">
              <label className="text-[9px] font-bold text-slate-500">Até</label>
              <input type="date" value={endDateFilter} onChange={(e) => onEndDateFilterChange(e.target.value)} disabled={dateFilterType === 'all'} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none disabled:opacity-50"/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sortedTasks.map(task => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isCompleted = task.status === 'Concluída';
          const isOverdue = !isCompleted && task.completionDate && new Date(task.completionDate + 'T00:00:00') < today;
          
          let cardClasses = 'rounded-3xl border p-6 shadow-sm transition-all group flex flex-col h-full relative overflow-hidden';
          if (isCompleted) cardClasses += ' bg-slate-50 opacity-75 border-slate-200';
          else if (isOverdue) cardClasses += ' bg-white border-red-400 ring-2 ring-red-200';
          else cardClasses += ' bg-white border-slate-200 hover:shadow-xl hover:border-teal-100';

          return (
            <div key={task.id} className={cardClasses}>
              {isCompleted && (<div className="absolute top-4 right-4 bg-emerald-500 text-white rounded-full p-1.5 z-10 shadow-lg"><CheckCircle size={16} /></div>)}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${task.status === 'Concluída' ? 'bg-emerald-100 text-emerald-700' : task.status === 'Pausado' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{task.status}</span>
                  {renderReportStageBadge(task)}
                  {isCollaborator(task) && (<span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">Você é Colaborador</span>)}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onView(task)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition" title="Visualizar"><Eye size={16}/></button>
                  <button onClick={() => onEdit(task)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition" title="Editar"><Edit2 size={16}/></button>
                  <button onClick={() => onDelete(task)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition" title="Excluir"><Trash2 size={16}/></button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-1">{task.project}</p>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight uppercase">{task.activity}</h3>
                <p className="text-[10px] font-medium text-slate-500 mt-1 line-clamp-2">{task.description}</p>
              </div>

              <div className="space-y-1 mb-6">
                 <div className="flex justify-between items-end"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Avanço</span><span className="text-[10px] font-black text-slate-900">{task.progress}%</span></div>
                 <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full transition-all duration-700 ${task.progress === 100 ? 'bg-emerald-500' : 'bg-brand-primary'}`} style={{width: `${task.progress}%`}}></div></div>
              </div>

              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Líder</span>
                    <div className="flex items-center gap-2 mt-1">
                       <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-black uppercase">{task.projectLead[0]}</div>
                       <span className="text-[9px] font-bold text-slate-700 uppercase">{task.projectLead}</span>
                    </div>
                 </div>
                 {task.isReport && task.reportStage?.includes('Concluído') && task.completionDate && task.status === 'Concluída' ? (<div className="flex flex-col text-right"><span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Concluído em</span><span className="text-[9px] font-black text-emerald-600 uppercase mt-1">{new Date(task.completionDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span></div>) : task.reportStage === 'Próximo Revisor' && task.currentReviewer ? (<div className="flex flex-col text-right"><span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Revisão com</span><span className="text-[9px] font-black text-amber-600 uppercase mt-1">{task.currentReviewer}</span></div>) : null}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-auto">
                 <p className="text-[8px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-1.5 mb-1"><ArrowRight size={10} /> Próximo Passo</p>
                 <p className="text-[10px] font-bold text-slate-600 leading-tight italic">"{task.nextStep || 'Não definido'}"</p>
              </div>

              {!task.isReport && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                     {isOverdue ? <AlertTriangle size={12} /> : <Clock size={12} />}
                     <span className="text-[8px] font-bold uppercase">Prazo: {task.completionDate ? new Date(task.completionDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/D'}</span>
                  </div>
                  {task.updates.length > 0 && (<div className="flex items-center gap-1.5 text-brand-primary"><MessageSquare size={12} /><span className="text-[9px] font-black">{task.updates.length}</span></div>)}
                </div>
              )}
            </div>
          )
        })}
        {sortedTasks.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <AlertTriangle className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest italic">Nenhuma atividade encontrada para os filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskBoard;
