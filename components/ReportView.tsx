import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { X, FileText, FileDown } from 'lucide-react';

interface ReportViewProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  userName: string;
}

const ReportView: React.FC<ReportViewProps> = ({ isOpen, onClose, tasks, userName }) => {
  const [report, setReport] = useState<string | null>(null);

  const generateSimpleReport = (tasksToReport: Task[], contextName: string): string => {
    const reportDate = new Date().toLocaleDateString('pt-BR');
    let reportText = `RELATÓRIO DE ATIVIDADES - ${contextName}\n`;
    reportText += `Gerado em: ${reportDate}\n\n`;
    reportText += `Este relatório resume um total de ${tasksToReport.length} atividades.\n`;
    reportText += '==================================================\n\n';

    tasksToReport.forEach(task => {
      reportText += `ATIVIDADE: ${task.activity.toUpperCase()}\n`;
      reportText += `----------------------------------------\n`;
      reportText += `  - Projeto:    ${task.project}\n`;
      reportText += `  - Status:     ${task.status} (${task.progress}%)\n`;
      reportText += `  - Prioridade: ${task.priority}\n`;
      reportText += `  - Prazo:      ${task.completionDate ? new Date(task.completionDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/D'}\n`;
      reportText += `  - Líder:      ${task.projectLead}\n`;
      reportText += `  - Próximo Passo: ${task.nextStep || 'Não definido.'}\n\n`;
    });
    
    return reportText;
  };

  useEffect(() => {
    if (isOpen) {
      const simpleReport = generateSimpleReport(tasks, userName);
      setReport(simpleReport);
    }
  }, [isOpen, tasks, userName]);

  const renderContent = () => {
    if (!report) return null;

    return (
      <div className="prose prose-slate max-w-none animate-in fade-in slide-in-from-bottom-2 duration-500">
        <pre className="whitespace-pre-wrap text-slate-700 leading-relaxed font-mono bg-slate-50 p-6 rounded-xl border border-slate-100 text-sm">
          {report}
        </pre>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col scale-in-center animate-in zoom-in-95 duration-300">
        <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg text-white shadow-lg">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Relatório de Atividades</h2>
              <p className="text-xs text-slate-500 font-medium">Resumo das atividades para impressão</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition">
            <X size={24} className="text-slate-400" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {renderContent()}
        </div>

        <footer className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center">
          <div className="flex gap-3">
            <button 
              className="px-5 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition flex items-center gap-2 text-sm font-semibold shadow-sm"
              onClick={() => window.print()}
            >
              <FileDown size={18} />
              Imprimir
            </button>
            <button 
              onClick={onClose}
              className="px-8 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition shadow-lg text-sm font-semibold"
            >
              Fechar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ReportView;