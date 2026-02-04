
import { Task, Person } from '../types';

/**
 * Nota Técnica: Para disparar e-mails reais de um navegador, 
 * é necessário um serviço de terceiros (como EmailJS, SendGrid ou um backend próprio).
 * Esta função simula o trigger e prepara o objeto de envio.
 */
export const sendSimulatedEmail = (task: Task, recipientEmail: string, type: 'JOIN' | 'DEADLINE') => {
  const subject = type === 'JOIN' 
    ? `[AR CTVacinas] Nova Atribuição: ${task.activity}`
    : `[AR CTVacinas] Alerta de Prazo: ${task.activity}`;

  const body = `
    Olá,
    
    Você foi vinculado(a) à atividade: ${task.activity}
    Projeto: ${task.project}
    Prazo Final: ${new Date(task.completionDate).toLocaleDateString('pt-BR')}
    Prioridade: ${task.priority}
    
    Descrição: ${task.description}
    Próximo Passo: ${task.nextStep}
    
    Acesse o painel para atualizar o progresso.
  `;

  // Simulação no Console para Auditoria
  console.log(`%c📧 E-MAIL DISPARADO PARA: ${recipientEmail}`, "color: #0d9488; font-weight: bold; font-size: 12px;");
  console.log(`Assunto: ${subject}`);
  console.log(`Corpo: ${body}`);

  // Feedback Visual (Pode ser substituído por um Toast no futuro)
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-[200] animate-in slide-in-from-right duration-300 flex items-center gap-3 border border-slate-700';
  notification.innerHTML = `
    <div class="bg-brand-primary p-2 rounded-lg">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
    </div>
    <div>
      <p class="text-[10px] font-black uppercase tracking-widest text-teal-400">Notificação Enviada</p>
      <p class="text-xs font-bold">E-mail de atribuição enviado para ${recipientEmail}</p>
    </div>
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.classList.add('animate-out', 'fade-out', 'slide-out-to-right');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
};