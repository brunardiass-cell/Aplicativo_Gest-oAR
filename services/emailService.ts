
import { Task, EmailAuditLog } from '../types';
import { MicrosoftGraphService } from './microsoftGraphService';

export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

const showToast = (title: string, message: string, isError: boolean = false) => {
  if (typeof document === 'undefined') return;
  const notification = document.createElement('div');
  notification.className = `fixed bottom-4 right-4 ${
    isError ? 'bg-rose-950 border-rose-700 text-white' : 'bg-slate-900 border-slate-700 text-white'
  } px-5 py-3.5 rounded-2xl shadow-2xl z-[300] animate-in slide-in-from-right duration-300 flex items-center gap-3 border`;
  
  notification.innerHTML = `
    <div class="${isError ? 'bg-rose-600' : 'bg-teal-600'} p-2 rounded-xl text-white shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    </div>
    <div>
      <p class="text-[10px] font-black uppercase tracking-widest ${isError ? 'text-rose-300' : 'text-teal-400'}">${title}</p>
      <p class="text-xs font-bold leading-snug">${message}</p>
    </div>
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.classList.add('animate-out', 'fade-out', 'slide-out-to-right');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
};

/**
 * Dispara e-mail para o Gestor na criação de um novo projeto.
 * Requisitos:
 * - Nome do projeto, responsável, link direto para o projeto
 * - Prevenir duplicatas se recarregar
 * - Não exibir sucesso se o e-mail não tiver sido disparado
 * - Informar erro com clareza se o e-mail for vazio ou inválido
 */
export const sendNewProjectEmail = async (
  projectId: string,
  projectName: string,
  responsibleName: string,
  managerEmail: string
): Promise<{ success: boolean; error?: string }> => {
  // 1. Validação estrita do e-mail do gestor
  if (!managerEmail || !managerEmail.trim()) {
    const errorMsg = 'E-mail do gestor não configurado. Por favor, defina o e-mail nas configurações do sistema.';
    showToast('Falha no Envio', errorMsg, true);
    return { success: false, error: errorMsg };
  }

  if (!validateEmail(managerEmail)) {
    const errorMsg = `O e-mail do gestor cadastrado ("${managerEmail}") possui formato inválido.`;
    showToast('E-mail Inválido', errorMsg, true);
    return { success: false, error: errorMsg };
  }

  // 2. Prevenção de duplicatas (mesmo projeto já notificado neste navegador/sessão)
  const sentKey = `sent_new_proj_email_${projectId}`;
  if (localStorage.getItem(sentKey)) {
    console.log(`[E-mail Gestor] Projeto ${projectId} já notificado anteriormente. Envio ignorado para evitar duplicidade.`);
    return { success: true };
  }

  const today = new Date().toLocaleDateString('pt-BR');
  const projectUrl = `${window.location.origin}?tab=projects&projectId=${encodeURIComponent(projectId)}`;
  const subject = `[AR CTVacinas] Novo Projeto Criado: ${projectName}`;
  const body = `Prezado(a) Membro do Comitê Gestor,\n\nInformamos que um novo projeto foi cadastrado no sistema CTVacinas no dia ${today}.\n\n• Projeto: ${projectName}\n• Responsável pelo Projeto: ${responsibleName || 'Não especificado'}\n• Acesso Direto: ${projectUrl}\n\nAtenciosamente,\nEquipe Assuntos Regulatórios - CTVacinas\nRemetente: brunadias@ctvacinas.org`;

  const sender = 'brunadias@ctvacinas.org';

  try {
    // 3. Disparo via endpoint /api/send-email (grava auditoria rastreável)
    const serverRes = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: managerEmail.trim(),
        sender,
        subject,
        body,
        type: 'NOVO_PROJETO',
        refId: projectId,
        refType: 'project',
        recipientName: 'Gestor CTVacinas'
      })
    }).then(r => r.json()).catch(err => ({ success: false, error: err.message }));

    // Tentativa também via Microsoft Graph caso conectado
    try {
      await MicrosoftGraphService.sendEmail(managerEmail.trim(), subject, body);
    } catch (e) {
      // continua com base no retorno do servidor
    }

    if (serverRes.success) {
      localStorage.setItem(sentKey, new Date().toISOString());
      showToast('Notificação ao Gestor', `E-mail enviado com sucesso para ${managerEmail}`);
      return { success: true };
    } else {
      const errText = serverRes.error || 'Falha ao processar envio de e-mail';
      showToast('Erro no Envio', errText, true);
      return { success: false, error: errText };
    }
  } catch (err: any) {
    const errorMsg = err.message || 'Erro de rede ao disparar notificação';
    showToast('Falha de Comunicação', errorMsg, true);
    return { success: false, error: errorMsg };
  }
};

/**
 * Configuração e disparo de alerta para Atividades Críticas
 * Requisitos:
 * - Antecedência: 1, 2, 7 ou X dias antes do prazo
 * - Notificação ao responsável regulatório da atividade (e-mail cadastrado no perfil)
 * - Remetente: brunadias@ctvacinas.org
 * - Prevenção de duplicidade
 * - Cancelamento se concluída
 * - Não permite agendamento sem prazo
 * - Auditoria rastreável
 */
export interface CriticalAlertOptions {
  activityId: string;
  activityTitle: string;
  projectName?: string;
  dueDate: string;
  leadDays: number;
  recipientEmail: string;
  recipientName: string;
  sender?: string;
  isTask?: boolean;
}

export const calculateAlertDate = (dueDate: string, leadDays: number): string | null => {
  if (!dueDate) return null;
  const d = new Date(dueDate + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() - leadDays);
  return d.toISOString().split('T')[0];
};

export const sendCriticalActivityAlert = async (
  options: CriticalAlertOptions
): Promise<{ success: boolean; error?: string; messageId?: string; sentAt?: string }> => {
  const {
    activityId,
    activityTitle,
    projectName,
    dueDate,
    leadDays,
    recipientEmail,
    recipientName,
    sender = 'brunadias@ctvacinas.org'
  } = options;

  // 1. Validação de prazo
  if (!dueDate || !dueDate.trim()) {
    return { success: false, error: 'A atividade não possui prazo de conclusão definido. Defina o prazo antes de configurar o alerta crítico.' };
  }

  // 2. Validação de e-mail de destino (do responsável regulatório cadastrado)
  if (!recipientEmail || !recipientEmail.trim() || !validateEmail(recipientEmail)) {
    return { success: false, error: `Endereço de e-mail regulatório inválido ou não cadastrado para o responsável ("${recipientEmail || 'Vazio'}").` };
  }

  // 3. Prevenção de envio duplicado para o mesmo prazo e antecedência
  const alertUniqueKey = `critical_alert_${activityId}_${dueDate}_${leadDays}d`;
  if (localStorage.getItem(alertUniqueKey)) {
    console.log(`[Alerta Crítico] Alerta para a atividade ${activityId} (${dueDate}, ${leadDays} dias) já foi disparado anteriormente.`);
    return { success: true, sentAt: localStorage.getItem(alertUniqueKey) || undefined };
  }

  const dueDateFormatted = dueDate.split('-').reverse().join('/');
  const subject = `[AR CTVacinas - ATIVIDADE CRÍTICA] Prazo em ${leadDays} dia(s): ${activityTitle}`;
  const body = `Prezado(a) ${recipientName || 'Responsável Regulatória'},\n\nEste é um alerta automático de ATIVIDADE CRÍTICA com prazo regulatório próximo.\n\n• Atividade: ${activityTitle}\n• Projeto: ${projectName || 'CTVacinas'}\n• Prazo Final de Entrega: ${dueDateFormatted}\n• Antecedência do Alerta: ${leadDays} dia(s)\n• Responsável Regulatória Notificada: ${recipientName} (${recipientEmail})\n\nPor favor, certifique-se de que as evidências, relatórios ou termos regulatórios necessários estejam devidamente elaborados e validados no sistema antes do encerramento do prazo.\n\nAtenciosamente,\nGestão Regulatória - CTVacinas\nRemetente: ${sender}`;

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipientEmail.trim(),
        sender,
        subject,
        body,
        type: 'ATIVIDADE_CRITICA',
        refId: activityId,
        refType: options.isTask ? 'task' : 'microactivity',
        recipientName
      })
    }).then(r => r.json()).catch(err => ({ success: false, error: err.message }));

    // Tenta disparar também via Microsoft Graph caso conectado
    try {
      await MicrosoftGraphService.sendEmail(recipientEmail.trim(), subject, body);
    } catch (e) {
      // mantem fluxo
    }

    if (res.success) {
      const nowIso = new Date().toISOString();
      localStorage.setItem(alertUniqueKey, nowIso);
      showToast('Alerta Crítico Ativado', `Notificação enviada para ${recipientName} (${recipientEmail})`);
      return { success: true, messageId: res.messageId, sentAt: nowIso };
    } else {
      const errText = res.error || 'Erro ao disparar e-mail de alerta crítico';
      showToast('Erro no Alerta', errText, true);
      return { success: false, error: errText };
    }
  } catch (err: any) {
    const errText = err.message || 'Falha de comunicação ao disparar alerta crítico';
    showToast('Falha no Alerta', errText, true);
    return { success: false, error: errText };
  }
};

/**
 * Função utilitária para registrar cancelamento de alerta futuro quando atividade for concluída
 */
export const cancelCriticalAlert = (activityId: string) => {
  console.log(`[Alerta Crítico] Alertas futuros cancelados para a atividade ${activityId} (atividade concluída).`);
  localStorage.setItem(`cancelled_critical_alert_${activityId}`, new Date().toISOString());
};