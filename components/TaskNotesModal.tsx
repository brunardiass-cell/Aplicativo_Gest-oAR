import React, { useState } from 'react';
import { Task, TaskNote } from '../types';
import { X, MessageSquare, Plus, Trash2, Edit2, Check, Clock, User, Calendar, AlertTriangle, Star, CheckCircle2 } from 'lucide-react';

interface TaskNotesModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onSaveTask: (updatedTask: Task) => void;
  currentUser: string;
}

export const TaskNotesModal: React.FC<TaskNotesModalProps> = ({
  isOpen,
  task,
  onClose,
  onSaveTask,
  currentUser
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingIsImportant, setEditingIsImportant] = useState(false);

  if (!isOpen || !task) return null;

  const notes = task.updates || [];

  const handleAddNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: TaskNote = {
      id: 'note_' + Math.random().toString(36).substring(2, 10),
      date: new Date().toISOString(),
      user: currentUser || 'Usuário',
      note: newNoteText.trim(),
      isImportant,
      acknowledgedBy: isImportant && currentUser ? [currentUser] : []
    };

    const updatedTask: Task = {
      ...task,
      updates: [newNote, ...notes]
    };

    onSaveTask(updatedTask);
    setNewNoteText('');
    setIsImportant(false);
  };

  const handleStartEdit = (note: TaskNote) => {
    setEditingNoteId(note.id);
    setEditingText(note.note);
    setEditingIsImportant(!!note.isImportant);
  };

  const handleSaveEdit = (noteId: string) => {
    if (!editingText.trim()) return;

    const updatedUpdates = notes.map(n => 
      n.id === noteId ? { ...n, note: editingText.trim(), isImportant: editingIsImportant } : n
    );

    const updatedTask: Task = {
      ...task,
      updates: updatedUpdates
    };

    onSaveTask(updatedTask);
    setEditingNoteId(null);
    setEditingText('');
  };

  const handleAcknowledgeNote = (noteId: string) => {
    const userToRecord = currentUser && currentUser !== 'Todos' ? currentUser : 'Usuário';
    const updatedUpdates = notes.map(n => {
      if (n.id !== noteId) return n;
      const currentAck = n.acknowledgedBy || [];
      const updatedAck = currentAck.includes(userToRecord) ? currentAck : [...currentAck, userToRecord];
      return {
        ...n,
        acknowledgedBy: updatedAck,
        acknowledgedAt: new Date().toISOString()
      };
    });

    const updatedTask: Task = {
      ...task,
      updates: updatedUpdates
    };

    onSaveTask(updatedTask);
  };

  const handleToggleImportance = (noteId: string) => {
    const updatedUpdates = notes.map(n => {
      if (n.id !== noteId) return n;
      const nextIsImportant = !n.isImportant;
      return {
        ...n,
        isImportant: nextIsImportant,
        acknowledgedBy: nextIsImportant && currentUser ? [currentUser] : []
      };
    });

    const updatedTask: Task = {
      ...task,
      updates: updatedUpdates
    };

    onSaveTask(updatedTask);
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedUpdates = notes.filter(n => n.id !== noteId);
    const updatedTask: Task = {
      ...task,
      updates: updatedUpdates
    };
    onSaveTask(updatedTask);
  };

  const formatNoteDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#008779] px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">
                Notas de Atualização
              </h3>
              <p className="text-[10px] font-bold text-teal-100 uppercase tracking-wider">
                {task.project} • {task.activity}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Quick Add Note Form */}
          <form onSubmit={handleAddNote} className={`space-y-3 p-4 rounded-2xl border transition-all ${
            isImportant ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300/30' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
                <Plus size={14} className="text-[#008779]" /> Nova Nota de Acompanhamento
              </label>
              <span className="text-[10px] font-bold text-slate-400">
                Registrado por: <strong className="text-slate-600">{currentUser}</strong>
              </span>
            </div>
            
            <textarea
              rows={3}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleAddNote();
                }
              }}
              placeholder="Digite sua nota ou atualização sobre o andamento desta atividade... (Ctrl+Enter para enviar)"
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#008779] focus:border-transparent transition resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-amber-300 rounded-xl cursor-pointer text-xs font-bold text-slate-700 transition select-none">
                <input
                  type="checkbox"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                />
                <span className="flex items-center gap-1 text-amber-700 font-bold">
                  <Star size={13} className={isImportant ? 'fill-amber-500 text-amber-500' : 'text-amber-500'} />
                  Destacar como Nota Importante
                </span>
              </label>

              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className={`px-5 py-2 disabled:opacity-40 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-sm hover:shadow active:scale-95 flex items-center gap-1.5 ${
                  isImportant ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#008779] hover:bg-[#007367]'
                }`}
              >
                <Plus size={15} /> Adicionar Nota
              </button>
            </div>
          </form>

          {/* Notes List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                Histórico de Notas ({notes.length})
              </h4>
            </div>

            {notes.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <MessageSquare size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-500">Nenhuma nota registrada até o momento.</p>
                <p className="text-[10px] text-slate-400 mt-1">Utilize o campo acima para adicionar a primeira nota.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => {
                  const isAckByMe = currentUser && note.acknowledgedBy && (note.acknowledgedBy.includes(currentUser) || note.acknowledgedBy.includes('Usuário'));
                  const isAnyAck = note.acknowledgedBy && note.acknowledgedBy.length > 0;

                  return (
                    <div
                      key={note.id}
                      className={`p-4 rounded-2xl border transition-all space-y-2.5 group relative ${
                        note.isImportant
                          ? 'bg-amber-50/50 border-amber-300 shadow-sm ring-1 ring-amber-300/40'
                          : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                      }`}
                    >
                      {/* Top Header of Note */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black uppercase ${
                            note.isImportant ? 'bg-amber-200 text-amber-900' : 'bg-teal-100 text-[#008779]'
                          }`}>
                            {(note.user || 'U').charAt(0)}
                          </div>
                          <span className="font-bold text-slate-800">{note.user}</span>
                          
                          {note.isImportant && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500 text-white shadow-2xs">
                              <Star size={10} className="fill-white" /> Nota Importante
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Clock size={12} /> {formatNoteDate(note.date)}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {editingNoteId !== note.id && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleImportance(note.id)}
                                  className={`p-1 rounded transition ${note.isImportant ? 'text-amber-600 hover:text-amber-800' : 'text-slate-400 hover:text-amber-500'}`}
                                  title={note.isImportant ? "Remover destaque" : "Destacar como importante"}
                                >
                                  <Star size={13} className={note.isImportant ? 'fill-amber-500' : ''} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(note)}
                                  className="p-1 text-slate-400 hover:text-[#008779] rounded transition"
                                  title="Editar nota"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                                  title="Excluir nota"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Note Body */}
                      {editingNoteId === note.id ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            rows={2}
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#008779] resize-none"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingIsImportant}
                                onChange={(e) => setEditingIsImportant(e.target.checked)}
                                className="rounded text-amber-600 focus:ring-amber-500 w-3 h-3"
                              />
                              <span>Destacar como importante</span>
                            </label>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNoteId(null);
                                  setEditingText('');
                                }}
                                className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(note.id)}
                                className="px-3 py-1 bg-[#008779] text-white rounded-lg text-xs font-bold hover:bg-[#007367] flex items-center gap-1"
                              >
                                <Check size={13} /> Salvar
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 pl-8">
                          <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                            {note.note}
                          </p>

                          {/* OK / Acknowledged Section for Important Notes */}
                          {note.isImportant && (
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/60">
                              {isAckByMe || isAnyAck ? (
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                  <CheckCircle2 size={13} className="text-emerald-600" />
                                  <span>
                                    Ciente por: {note.acknowledgedBy?.join(', ') || 'Confirmado'}
                                  </span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAcknowledgeNote(note.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs hover:shadow transition active:scale-95 animate-pulse"
                                  title="Clique para confirmar ciência desta nota e remover o destaque visual"
                                >
                                  <Check size={14} className="stroke-[3]" />
                                  OK, Entendido / Ciente
                                </button>
                              )}

                              {!isAckByMe && !isAnyAck && (
                                <span className="text-[10px] text-amber-700 font-medium italic">
                                  Clique em OK para remover o alerta na tabela
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-500">
          <span>Status atual: <strong className="text-slate-800">{task.status}</strong> ({task.progress}%)</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold uppercase text-[11px] tracking-wider transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

