
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Task } from "../types";

// Explicit declaration of process for TypeScript compiler in browser environment
declare const process: {
  env: {
    API_KEY: string;
  };
};

export const generateExecutiveReport = async (tasks: Task[], contextName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const tasksSummary = tasks.map(t => ({
    projeto: t.project,
    atividade: t.activity,
    descricao: t.description,
    status: t.status,
    progresso: `${t.progress}%`,
    responsavel: t.projectLead,
    prioridade: t.priority
  }));

  const prompt = `
    Você é um consultor de gestão estratégica auxiliando Graziella, a líder do setor.
    Sua tarefa é analisar a lista de atividades referente APENAS AO ÚLTIMO MÊS para o contexto: "${contextName}".
    
    Analise os seguintes dados e gere um relatório executivo de ALTA PERFORMANCE em Português.
    
    Considere:
    - O impacto das descrições detalhadas nas metas do setor.
    - Se o contexto for individual, destaque a evolução mensal da pessoa.
    - Se for geral, aponte a produtividade coletiva dos últimos 30 dias.

    O relatório deve ser dividido em:
    1. Performance do Mês (Destaques positivos).
    2. Alertas de Risco (O que ficou para trás ou está bloqueado).
    3. Insights Estratégicos (Próximos passos baseados na carga atual).

    Dados das Atividades do Último Mês:
    ${JSON.stringify(tasksSummary, null, 2)}
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar o relatório no momento.";
  } catch (error) {
    console.error("Erro ao gerar relatório com Gemini:", error);
    return "Ocorreu um erro ao conectar com a inteligência artificial. Verifique sua conexão e tente novamente.";
  }
};
