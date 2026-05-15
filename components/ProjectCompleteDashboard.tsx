
import React, { useMemo } from 'react';
import { Project, Task, MicroActivity, MacroActivity, TeamMember } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line
} from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  FileText, 
  ArrowRight,
  TrendingUp,
  LayoutDashboard,
  ListTodo,
  FolderKanban,
  GanttChartSquare,
  Workflow,
  ShieldAlert,
  Share2
} from 'lucide-react';

interface ProjectCompleteDashboardProps {
  project: Project;
  tasks: Task[];
  onViewChange: (view: any) => void;
  activeView: string;
  onShare: () => void;
  isAdmin: boolean;
  currentUser: TeamMember | null;
}

const ProjectCompleteDashboard: React.FC<ProjectCompleteDashboardProps> = ({ 
  project, 
  tasks, 
  onViewChange, 
  activeView,
  onShare,
  isAdmin,
  currentUser
}) => {
  const stats = useMemo(() => {
    let totalMicros = 0;
    let completedMicros = 0;
    let ongoingMicros = 0;
    let lateMicros = 0;
    const today = new Date();
    today.setHours(0,0,0,0);

    const phaseDistribution: Record<string, number> = {};
    const teamWorkload: Record<string, number> = {};
    const bottlenecks: { name: string; impact: 'Alto' | 'Médio' | 'Baixo' }[] = [];

    project.macroActivities.forEach(macro => {
      phaseDistribution[macro.phase] = (phaseDistribution[macro.phase] || 0) + macro.microActivities.length;
      
      macro.microActivities.forEach(micro => {
        totalMicros++;
        if (micro.status === 'Concluído e aprovado') completedMicros++;
        else if (micro.status === 'Em andamento') ongoingMicros++;
        
        if (micro.status !== 'Concluído e aprovado' && micro.dueDate && new Date(micro.dueDate + 'T00:00:00') < today) {
          lateMicros++;
          if (macro.prerequisites?.length) {
             bottlenecks.push({ name: micro.name, impact: 'Alto' });
          }
        }

        if (micro.assignee) {
          teamWorkload[micro.assignee] = (teamWorkload[micro.assignee] || 0) + 1;
        }
      });
    });

    const progress = totalMicros > 0 ? (completedMicros / totalMicros) * 100 : 0;

    return {
      progress,
      totalMicros,
      completedMicros,
      ongoingMicros,
      lateMicros,
      phaseData: Object.entries(phaseDistribution).map(([name, value]) => ({ name, value })),
      teamData: Object.entries(teamWorkload).map(([name, value]) => ({ name, value: (value / totalMicros) * 100 })),
      bottlenecks: bottlenecks.slice(0, 4)
    };
  }, [project]);

  const nextMilestone = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const macros = [...project.macroActivities].sort((a,b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    return macros.find(m => m.dueDate && new Date(m.dueDate + 'T00:00:00') >= today);
  }, [project]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projeto Atual</span>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{project.name}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                project.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}>{project.status}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button 
              onClick={onShare}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition"
            >
              <Share2 size={14} /> Compartilhar
            </button>
          )}
          <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-100 transition">
             <FileText size={18} />
          </button>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatItem label="Progresso Geral" value={`${Math.round(stats.progress)}%`} detail={`${stats.totalMicros} macroatividades no projeto`} progress={stats.progress} />
        <StatItem label="Em Andamento" value={stats.ongoingMicros} detail={`${Math.round((stats.ongoingMicros/stats.totalMicros)*100 || 0)}% do total`} icon={<Activity className="text-teal-500" />} />
        <StatItem label="Em Atraso" value={stats.lateMicros} detail={`${Math.round((stats.lateMicros/stats.totalMicros)*100 || 0)}% do total`} icon={<Clock className="text-red-500" />} />
        <StatItem label="Concluídas" value={stats.completedMicros} detail={`${Math.round((stats.completedMicros/stats.totalMicros)*100 || 0)}% do total`} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatItem label="Próximo Marco" value={nextMilestone?.name || '---'} detail={nextMilestone?.dueDate ? new Date(nextMilestone.dueDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data'} icon={<Clock className="text-slate-400" />} />
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Timeline & Phase Distribution */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm min-h-[300px]">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between">
                Linha do Tempo
                <span className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-200"></span><span className="text-[8px]">Planejado</span></span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span><span className="text-[8px]">Real</span></span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span><span className="text-[8px]">Atraso</span></span>
                </span>
             </h3>
             <div className="h-64 flex items-center justify-center text-slate-300 italic text-xs">
                {/* Simplified Gantt representation */}
                <ProjectGanttMirror project={project} />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm h-full">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Distribuição por Fase</h3>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={stats.phaseData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                                {stats.phaseData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-4">
                    {stats.phaseData.map((d, i) => (
                        <div key={d.name} className="flex items-center justify-between text-[10px] font-bold">
                            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></span> {d.name}</span>
                            <span className="text-slate-400">{d.value} ({Math.round((d.value/stats.totalMicros)*100)}%)</span>
                        </div>
                    ))}
                </div>
             </div>

             <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm h-full">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Gargalos do Projeto</h3>
                <div className="space-y-4">
                    {stats.bottlenecks.length > 0 ? stats.bottlenecks.map((b, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-700">{b.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                b.impact === 'Alto' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
                            }`}>{b.impact}</span>
                        </div>
                    )) : (
                        <div className="py-10 text-center text-slate-300 italic text-xs">Nenhum gargalo identificado</div>
                    )}
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Health, Alerts, Workload */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Saúde do Projeto</h3>
                <div className="flex flex-col items-center">
                    <div className="relative w-40 h-24 mb-4">
                        <svg viewBox="0 0 100 50" className="w-full">
                            <path d="M 10 45 A 35 35 0 0 1 90 45" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
                            <path d="M 10 45 A 35 35 0 0 1 90 45" fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${stats.progress * 1.25} 125`} />
                        </svg>
                        <div className="absolute inset-x-0 bottom-0 text-center">
                            <span className="text-3xl font-black text-slate-800">{Math.round(stats.progress)}</span>
                            <span className="text-[10px] text-slate-400 block font-bold leading-none">Saudável</span>
                        </div>
                    </div>
                    <div className="w-full space-y-3 mt-2">
                        <HealthBar label="Prazo" value={100 - (stats.lateMicros/stats.totalMicros*100 || 0)} color="bg-emerald-400" />
                        <HealthBar label="Risco" value={stats.lateMicros > 0 ? 70 : 100} color="bg-amber-400" />
                        <HealthBar label="Qualidade" value={95} color="bg-brand-primary" />
                    </div>
                </div>
           </div>

           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">Alertas <span className="text-[9px] text-brand-primary cursor-pointer">Ver todos</span></h3>
                <div className="space-y-3">
                    {stats.lateMicros > 0 && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-1">
                            <div className="flex items-center gap-2 text-red-600">
                                <ShieldAlert size={14} />
                                <span className="text-[10px] font-black uppercase">Entrega Atrasada</span>
                            </div>
                            <p className="text-[9px] text-red-500 font-bold">{stats.lateMicros} atividades estão com prazo vencido.</p>
                        </div>
                    )}
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 text-amber-600">
                             <AlertTriangle size={14} />
                             <span className="text-[10px] font-black uppercase">Pendência Regulatória</span>
                        </div>
                        <p className="text-[9px] text-amber-500 font-bold">Aguardando documentos de validação.</p>
                    </div>
                </div>
           </div>

           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">Carga da Equipe <span className="text-[9px] text-brand-primary cursor-pointer">Ver equipe</span></h3>
                <div className="space-y-4">
                    {stats.teamData.map((member, i) => (
                        <div key={member.name} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase border border-slate-200">
                                {member.name.charAt(0)}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between text-[9px] font-bold">
                                    <span className="text-slate-700">{member.name}</span>
                                    <span className="text-slate-400">{Math.round(member.value)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1">
                                    <div className="bg-teal-500 h-1 rounded-full" style={{width: `${member.value}%`}}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
           </div>
        </div>
      </div>

      {/* Visual Modes Selection */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Escolha o Modo de Visualização</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <ViewModeButton 
            active={activeView === 'management'} 
            onClick={() => onViewChange('management')} 
            icon={<LayoutDashboard size={20} />} 
            label="Lista" 
            sub="Gestão Detalhada" 
          />
          <ViewModeButton 
            active={activeView === 'kanban'} 
            onClick={() => onViewChange('kanban')} 
            icon={<FolderKanban size={20} />} 
            label="Kanban" 
            sub="Fluxo de Atividades" 
          />
          <ViewModeButton 
            active={activeView === 'visual'} 
            onClick={() => onViewChange('visual')} 
            icon={<Workflow size={20} />} 
            label="Modelo Visual" 
            sub="Fluxo do Projeto" 
          />
          <ViewModeButton 
            active={activeView === 'timeline'} 
            onClick={() => onViewChange('timeline')} 
            icon={<Clock size={20} />} 
            label="Timeline" 
            sub="Visão Temporal" 
          />
          <ViewModeButton 
            active={activeView === 'gantt'} 
            onClick={() => onViewChange('gantt')} 
            icon={<GanttChartSquare size={20} />} 
            label="Gantt" 
            sub="Cronograma Completo" 
          />
          <ViewModeButton 
            active={activeView === 'risk'} 
            onClick={() => onViewChange('risk')} 
            icon={<ShieldAlert size={20} />} 
            label="Riscos" 
            sub="Matriz e Impactos" 
          />
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, detail, icon, progress }: any) => (
  <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-lg transition-all">
    <div className="space-y-1">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h4>
      <p className="text-[9px] font-bold text-slate-400 truncate">{detail}</p>
    </div>
    {progress !== undefined && (
        <div className="mt-auto h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="bg-teal-500 h-full transition-all duration-1000" style={{width: `${progress}%`}}></div>
        </div>
    )}
    {icon && (
        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-100 transition-opacity transform group-hover:scale-110">
            {icon}
        </div>
    )}
  </div>
);

const HealthBar = ({ label, value, color }: any) => (
    <div className="w-full space-y-1">
        <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase">
            <span>{label}</span>
            <span>{Math.round(value)}/100</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className={`${color} h-full transition-all duration-1000`} style={{width: `${value}%`}}></div>
        </div>
    </div>
);

const ViewModeButton = ({ active, onClick, icon, label, sub }: any) => (
    <button 
        onClick={onClick}
        className={`flex flex-col p-4 rounded-3xl border-2 transition-all text-left gap-3 group ${
            active ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-100 hover:border-slate-300'
        }`}
    >
        <div className={`p-2 rounded-2xl transition-all ${
            active ? 'bg-teal-100 text-teal-600' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
        }`}>
            {icon}
        </div>
        <div>
            <p className={`text-[10px] font-black uppercase tracking-tight ${active ? 'text-teal-900' : 'text-slate-800'}`}>{label}</p>
            <p className="text-[8px] font-bold text-slate-400 leading-none mt-0.5">{sub}</p>
        </div>
    </button>
);

const ProjectGanttMirror = ({ project }: { project: Project }) => {
    return (
        <div className="w-full h-full p-2 space-y-2 overflow-hidden flex flex-col justify-center">
            {project.macroActivities.slice(0, 6).map((macro, i) => (
                <div key={macro.id} className="flex items-center gap-4 group">
                    <span className="text-[9px] font-bold text-slate-500 w-24 truncate">{macro.name}</span>
                    <div className="flex-1 h-3 bg-slate-50 rounded-full relative overflow-hidden">
                        <div 
                           className="absolute h-full bg-teal-400 rounded-full" 
                           style={{
                               width: `${20 + Math.random() * 60}%`,
                               left: `${i * 10}%`,
                               opacity: 0.2 + (i * 0.1)
                           }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProjectCompleteDashboard;
