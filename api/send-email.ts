// Vercel Serverless Function: /api/send-email
// Handles email notifications and auditing in Vercel deployments

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { to, subject, body: emailBody, sender, type, refId, refType, recipientName } = body;

    if (!to || typeof to !== 'string' || !to.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Endereço de e-mail de destino não fornecido ou vazio.' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to.trim())) {
      return res.status(400).json({ 
        success: false, 
        error: `Formato de e-mail inválido: "${to}".` 
      });
    }

    if (!subject || !emailBody) {
      return res.status(400).json({ 
        success: false, 
        error: 'Assunto e conteúdo do e-mail são obrigatórios.' 
      });
    }

    const effectiveSender = sender && sender.trim() ? sender.trim() : 'brunadias@ctvacinas.org';
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const nowIso = new Date().toISOString();

    const auditEntry = {
      id: messageId,
      type: type || 'GERAL',
      sender: effectiveSender,
      recipientEmail: to.trim(),
      recipientName: recipientName || '',
      subject: subject.trim(),
      content: emailBody,
      timestamp: nowIso,
      status: 'enviado',
      refId: refId || '',
      refType: refType || ''
    };

    return res.status(200).json({
      success: true,
      messageId,
      timestamp: nowIso,
      recipient: to.trim(),
      sender: effectiveSender,
      audit: auditEntry
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao processar envio de notificação.'
    });
  }
}
