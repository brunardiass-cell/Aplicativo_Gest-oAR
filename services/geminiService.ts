
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Task } from "../types";

export const generateExecutiveReport = async (tasks: Task[], contextName: string): Promise<string> => {
  // FIX: Use `process.env.API_KEY` to initialize the GoogleGenAI client as per the coding guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentTasks = tasks.filter(t => new Date(t.requestDate) >= thirtyDaysAgo);

  const tasksSummary = recentTasks.map(t => ({
    projeto: t.project,
    atividade: t.activity,
    descricao: t.description,
    status: t.status,
    progresso: `${t.progress}%`,
    responsavel: t.projectLead,
    prioridade: t.priority
  }));

  const prompt = `
    Você é um consultor de gestão estratégica para o setor de Assuntos Regulatórios do CTVacinas.
    Analise as atividades do ÚLTIMO MÊS para o contexto: "${contextName}".
    
    Relatório baseado em ${recentTasks.length} atividades recentes.
    Dados: ${JSON.stringify(tasksSummary)}

    Gere um relatório executivo em Português com:
    1. Performance Geral (Destaques e conclusão).
    2. Análise de Risco (Alertas de prioridade e atrasos).
    3. Recomendações (Próximos passos estratégicos).

    Mantenha um tom profissional, direto e otimista.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Erro ao processar dados.";
  } catch (error) {
    return "Falha na conexão com a IA.";
  }
};