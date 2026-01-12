
import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { generateExecutiveReport } from '../services/geminiService';
import { X, Sparkles, FileDown, RefreshCw } from 'lucide-react';

interface ReportViewProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  userName: string;
}

const ReportView: React.FC<ReportViewProps> = ({ isOpen, onClose, tasks, userName }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    const result = await generateExecutiveReport(tasks, userName);
    setReport(result);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchReport();
    }
  }, [isOpen]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={20} />
          </div>
          <p className="text-slate-500 animate-pulse font-medium">Gemini analisando atividades...</p>
        </div>
      );
    }

    if (!report) return null;

    return (
      <div className="prose prose-slate max-w-none animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-normal bg-slate-50 p-6 rounded-xl border border-slate-100">
          {report}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col scale-in-center animate-in zoom-in-95 duration-300">
        <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-200">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Relatório Executivo IA</h2>
              <p className="text-xs text-slate-500 font-medium">Análise estratégica gerada pelo Google Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition">
            <X size={24} className="text-slate-400" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {renderContent()}
        </div>

        <footer className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <button 
            onClick={fetchReport} 
            disabled={loading}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-semibold disabled:opacity-50 transition"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar Análise
          </button>
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
