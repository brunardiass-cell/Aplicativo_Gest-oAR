import React, { useMemo } from 'react';
import { Project, Task } from '../types';
import { FolderKanban, Activity, PauseCircle, AlertTriangle, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ProjectsDashboardProps {
  projects: Project[];
  tasks: Task[];
  filteredUser: string | 'Todos';
  onNavigateToProject: (projectId: string) => void;
}

const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({ projects, tasks, filteredUser, onNavigateToProject }) => {

  const userProjects = useMemo(() => {
    if (filteredUser === 'Todos') return projects;
    return projects.filter(p => p.responsible === filteredUser || p.team?.includes(filteredUser));
  }, [projects, filteredUser]);

  const projectStats = useMemo(() => {
    const projectIds = new Set(userProjects.map(p => p.id));
    const relevantTasks = tasks.filter(t => !t.deleted && projectIds.has(t.id));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      active: userProjects.filter(p => p.status === 'Ativo').length,
      paused: userProjects.filter(p => p.status === 'Suspenso').length,
      totalTasks: relevantTasks.length,
      lateTasks: relevantTasks.filter(t => t.completionDate && new Date(t.completionDate + 'T00:00:00') < today && t.status !== 'Concluída').length,
    };
  }, [userProjects, tasks]);

  const microActivityStats = useMemo(() => {
    const stats = { ongoing: 0, completed: 0, overdue: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    userProjects.forEach(p => {
        p.macroActivities.forEach(ma => {
            ma.microActivities.forEach(mi => {
                // FIX: Corrected status check to match MicroActivityStatus type
                if (mi.status === 'Concluído e aprovado') {
                    stats.completed++;
                // FIX: Corrected status check to match MicroActivityStatus type
                } else if (mi.status === 'Em andamento') {
                    stats.ongoing++;
                }
                
                // FIX: Corrected status check to match MicroActivityStatus type
                if (mi.dueDate && new Date(mi.dueDate + 'T00:00:00') < today && mi.status !== 'Concluído e aprovado') {
                    stats.overdue++;
                }
            });
        });
    });
    return stats;
  }, [userProjects]);

  const microStatusChartData = useMemo(() => [
      { name: 'Concluídas', value: microActivityStats.completed, color: '#10b981' },
      { name: 'Em Andamento', value: microActivityStats.ongoing, color: '#2dd4bf' },
      { name: 'Vencidas', value: microActivityStats.overdue, color: '#f43f5e' },
  ], [microActivityStats]);

  const overdueMicroActivities = useMemo(() => {
    const overdue: (any & { projectName: string, macroName: string, projectId: string })[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    userProjects.forEach(p => {
      p.macroActivities.forEach(ma => {
        ma.microActivities.forEach(mi => {
          // FIX: Corrected status check to match MicroActivityStatus type
          if (mi.dueDate && new Date(mi.dueDate + 'T00:00:00') < today && mi.status !== 'Concluído e aprovado') {
            overdue.push({ ...mi, projectName: p.name, macroName: ma.name, projectId: p.id });
          }
        });
      });
    });
    return overdue.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [userProjects]);

  const upcomingMicroActivities = useMemo(() => {
    const upcoming: (any & { projectName: string, macroName: string, projectId: string })[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    userProjects.forEach(p => {
        p.macroActivities.forEach(ma => {
            ma.microActivities.forEach(mi => {
                // FIX: Corrected status check to match MicroActivityStatus type
                if (mi.dueDate && new Date(mi.dueDate + 'T00:00:00') >= today && mi.status !== 'Concluído e aprovado') {
                    upcoming.push({ ...mi, projectName: p.name, macroName: ma.name, projectId: p.id });
                }
            });
        });
    });
    return upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);
  }, [userProjects]);

  const calculateProjectProgress = (project: Project) => {
    const totalMacros = project.macroActivities.length;
    if (totalMacros === 0) return 0;
    const completedMacros = project.macroActivities.filter(ma => 
      ma.microActivities.length > 0 && 
      ma.microActivities.every(mi => mi.status === 'Concluído e aprovado')
    ).length;
    return Math.round((completedMacros / totalMacros) * 100);
  };

  const projectsProgressData = useMemo(() => {
    return userProjects.map(p => ({
      name: p.name.length > 25 ? p.name.substring(0, 25) + '...' : p.name,
      fullName: p.name,
      progress: calculateProjectProgress(p),
    })).sort((a, b) => b.progress - a.progress);
  }, [userProjects]);

  const avgProgress = useMemo(() => {
    if (userProjects.length === 0) return 0;
    const total = userProjects.reduce((acc, p) => acc + calculateProjectProgress(p), 0);
    return Math.round(total / userProjects.length);
  }, [userProjects]);

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Projetos Ativos" value={projectStats.active} icon={<Activity size={20}/>} color="bg-emerald-600" />
        <StatCard label="Progresso Médio Geral" value={`${avgProgress}%`} icon={<FolderKanban size={20}/>} color="bg-brand-primary" />
        <StatCard label="Atividades Concluídas" value={microActivityStats.completed} icon={<CheckCircle size={20}/>} color="bg-teal-700" />
        <StatCard label="Atividades Atrasadas" value={microActivityStats.overdue} icon={<AlertTriangle size={20}/>} color="bg-red-600" />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upcoming Microactivities */}
        <div className="lg:col-span-7 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Prazos Próximos de Microatividades (Top 5)</h3>
           <div className="space-y-4">
             {upcomingMicroActivities.length > 0 ? upcomingMicroActivities.map(micro => (
               <button 
                 key={micro.id} 
                 onClick={() => onNavigateToProject(micro.projectId)}
                 className="w-full text-left p-4 bg-slate-50 border border-slate-100 hover:border-slate-300 hover:bg-slate-100/50 transition rounded-2xl flex items-center justify-between group"
               >
                 <div>
                   <p className="text-xs font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{micro.name}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{micro.projectName} • {micro.macroName}</p>
                 </div>
                 <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase shrink-0">
                   {new Date(micro.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                 </div>
               </button>
             )) : <p className="text-center text-slate-400 text-xs py-10 italic">Nenhum prazo próximo.</p>}
           </div>
        </div>

        {/* Project Alerts and At-Risk */}
        <div className="lg:col-span-5 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col justify-between">
           <div>
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Alertas e Notificações de Projetos</h3>
             <div className="space-y-4">
               <div className="p-4 bg-red-50/70 border border-red-100 rounded-2xl flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-red-100 text-red-600 rounded-xl"><AlertTriangle size={16}/></div>
                   <div>
                     <p className="text-xs font-black text-slate-800 uppercase">Microatividades Vencidas</p>
                     <p className="text-[10px] font-bold text-slate-400">Total acumulado que necessita de atenção</p>
                   </div>
                 </div>
                 <span className="text-xl font-black text-red-600 pr-2">{microActivityStats.overdue}</span>
               </div>

               <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><PauseCircle size={16}/></div>
                   <div>
                     <p className="text-xs font-black text-slate-800 uppercase">Projetos Suspensos</p>
                     <p className="text-[10px] font-bold text-slate-400">Projetos com cronograma pausado</p>
                   </div>
                 </div>
                 <span className="text-xl font-black text-amber-600 pr-2">{projectStats.paused}</span>
               </div>
             </div>
           </div>

           {userProjects.length > 0 && (
             <div className="pt-6 border-t border-slate-100 mt-6 flex justify-end">
               <button 
                 onClick={() => onNavigateToProject(userProjects[0].id)}
                 className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
               >
                 Acessar Visão de Projetos <ArrowRight size={14} />
               </button>
             </div>
           )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Project Progress Bar Chart */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Progresso Individual por Projeto (%)</h3>
          <div className="h-[300px]">
            {projectsProgressData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectsProgressData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} width={120} stroke="#64748b" />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Progresso']}
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} 
                    cursor={{fill: 'rgba(0,0,0,0.02)'}} 
                  />
                  <Bar dataKey="progress" fill="#2dd4bf" radius={[0, 8, 8, 0]} barSize={20}>
                    {projectsProgressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.progress === 100 ? '#10b981' : '#2dd4bf'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-400 text-xs italic uppercase font-bold tracking-widest">Nenhum projeto cadastrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Microactivity Distribution Pie Chart */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Distribuição Geral de Microatividades</h3>
          <div className="h-[300px] flex items-center justify-center">
            {microStatusChartData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={microStatusChartData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={75} 
                    labelLine={true} 
                    label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {microStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-xs italic uppercase font-bold tracking-widest">Sem atividades planejadas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
    <div className={`p-2.5 rounded-xl ${color} text-white shadow-md`}>{icon}</div>
    <div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h3>
    </div>
  </div>
);

export default ProjectsDashboard;