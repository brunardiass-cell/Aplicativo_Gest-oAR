
import React, { useMemo } from 'react';
import { Project, Task } from '../types';
import { FolderKanban, Activity, PauseCircle, AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

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
                if (mi.status === 'Concluída') {
                    stats.completed++;
                } else if (mi.status === 'Em Andamento') {
                    stats.ongoing++;
                }
                
                if (mi.dueDate && new Date(mi.dueDate + 'T00:00:00') < today && mi.status !== 'Concluída') {
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
          if (mi.dueDate && new Date(mi.dueDate + 'T00:00:00') < today && mi.status !== 'Concluída') {
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
                if (mi.dueDate && new Date(mi.dueDate + 'T00:00:00') >= today && mi.status !== 'Concluída') {
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
    const completedMacros = project.macroActivities.filter(ma => ma.status === 'Concluída').length;
    return Math.round((completedMacros / totalMacros) * 100);
  };

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Projetos Ativos" value={projectStats.active} icon={<Activity size={20}/>} color="bg-emerald-600" />
        <StatCard label="Projetos Suspensos" value={projectStats.paused} icon={<PauseCircle size={20}/>} color="bg-amber-600" />
        <StatCard label="Total de Atividades" value={projectStats.totalTasks} icon={<FolderKanban size={20}/>} color="bg-teal-700" />
        <StatCard label="Atividades Atrasadas" value={projectStats.lateTasks} icon={<AlertTriangle size={20}/>} color="bg-red-600" />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Status dos Projetos (baseado em Macroatividades)</h3>
                <div className="space-y-5 max-h-[250px] overflow-y-auto custom-scrollbar pr-4">
                    {userProjects.length > 0 ? userProjects.map(project => {
                    const progress = calculateProjectProgress(project);
                    const totalMacros = project.macroActivities.length;
                    const completedMacros = project.macroActivities.filter(m => m.status === 'Concluída').length;

                    return (
                        <div key={project.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{project.name}</p>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            project.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' :
                            project.status === 'Suspenso' ? 'bg-amber-100 text-amber-700' :
                            project.status === 'Concluído' ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-500'
                            }`}>{project.status}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-primary" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-slate-400">{completedMacros} de {totalMacros} macroatividades concluídas</span>
                            <span className="text-xs font-black text-brand-primary">{progress}%</span>
                        </div>
                        </div>
                    );
                    }) : <p className="text-center text-slate-400 text-xs py-20 italic">Nenhum projeto associado a este perfil.</p>}
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Status das Microatividades</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={microStatusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {microStatusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
            </div>
        </div>
        
        <div className="lg:col-span-5 space-y-6">
            <div className="bg-red-50 p-8 rounded-[2rem] border border-red-200">
                <h3 className="text-xs font-black text-red-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <AlertTriangle size={14}/> Microatividades Vencidas
                </h3>
                <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                    {overdueMicroActivities.length > 0 ? overdueMicroActivities.map(micro => (
                        <button key={micro.id} onClick={() => onNavigateToProject(micro.projectId)} className="w-full text-left p-4 bg-white border border-red-200 rounded-2xl group hover:bg-red-100/50 transition">
                            <div className="flex justify-between items-center">
                                <div>
                                <p className="text-xs font-bold text-slate-800">{micro.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">{micro.projectName} / {micro.macroName}</p>
                                </div>
                                <ArrowRight size={16} className="text-red-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <p className="text-right text-[9px] font-bold text-red-600 mt-2">
                                Venceu em: {new Date(micro.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>
                        </button>
                    )) : <p className="text-center text-red-800/60 text-xs py-10 italic">Nenhuma microatividade vencida!</p>}
                </div>
            </div>

            <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-200">
                <h3 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Clock size={14}/> Prazos Próximos (Top 5)
                </h3>
                <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-2">
                    {upcomingMicroActivities.length > 0 ? upcomingMicroActivities.map(micro => (
                        <button key={micro.id} onClick={() => onNavigateToProject(micro.projectId)} className="w-full text-left p-4 bg-white border border-amber-200 rounded-2xl group hover:bg-amber-100/50 transition">
                           <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-slate-800">{micro.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{micro.projectName} / {micro.macroName}</p>
                                </div>
                                <ArrowRight size={16} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <p className="text-right text-[9px] font-bold text-amber-700 mt-2">
                                Prazo: {new Date(micro.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>
                        </button>
                    )) : <p className="text-center text-amber-800/60 text-xs py-10 italic">Nenhum prazo relevante nos próximos dias.</p>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}>{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
    </div>
  </div>
);

export default ProjectsDashboard;
