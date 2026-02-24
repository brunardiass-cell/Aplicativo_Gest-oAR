
import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface PreSaveConfirmationModalProps {
  isOpen: boolean;
  onConfirm: (choice: 'merge' | 'overwrite_user' | 'overwrite_server') => void;
  onCancel: () => void;
}

const PreSaveConfirmationModal: React.FC<PreSaveConfirmationModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-80 flex items-center justify-center z-50 animate-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center w-full">
        <ShieldAlert size={48} className="mx-auto text-red-500" />
        <h2 className="mt-4 text-2xl font-black text-slate-800">Erro de Sincronização</h2>
        <p className="mt-4 text-slate-600">
          Não foi possível salvar suas alterações. O sistema foi atualizado por outro usuário enquanto você trabalhava.
        </p>
        <p className="mt-2 font-bold text-slate-800">
          É necessário recarregar o sistema para obter a versão mais recente antes de tentar novamente.
        </p>
        
        <div className="mt-8">
          <button 
            onClick={() => onConfirm('overwrite_server')}
            className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white py-4 rounded-xl font-bold hover:bg-brand-accent transition-all shadow-lg"
          >
            <RefreshCw size={18} />
            Recarregar Sistema agora
          </button>
        </div>

        <button onClick={onCancel} className="mt-6 text-sm text-slate-400 hover:text-slate-600 transition-colors">
          Fechar e recarregar depois
        </button>
      </div>
    </div>
  );
};

export default PreSaveConfirmationModal;
