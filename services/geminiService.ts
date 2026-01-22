
import { GoogleGenAI, Type } from "@google/genai";
import { AreaDireito } from "../types";
import { getSafeEnv } from "../lib/supabase";

/**
 * Inicializa o cliente Gemini usando a chave obtida do ambiente ou do LocalStorage.
 */
const getAiClient = () => {
  const apiKey = getSafeEnv('API_KEY');
  return new GoogleGenAI({ apiKey });
};

export const summarizeIntimacao = async (text: string): Promise<{ summary: string; prazo: string | null; acao: string | null }> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um assistente jurídico sênior. Analise o seguinte texto de uma publicação jurídica/intimação. 
      Extraia um resumo conciso do que aconteceu, identifique se há prazo processual (se sim, qual) e qual a providência a ser tomada.
      
      Texto: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Resumo do teor da publicação" },
            prazo: { type: Type.STRING, description: "Data ou prazo mencionado (ex: 15 dias), ou null se não houver" },
            acao: { type: Type.STRING, description: "Ação sugerida para o advogado, ou null se informativo" }
          },
          propertyOrdering: ["summary", "prazo", "acao"]
        }
      }
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) throw new Error("Sem resposta da IA");
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Erro ao sumarizar:", error);
    return { summary: "Erro: Processamento da IA indisponível. Verifique sua API KEY.", prazo: null, acao: null };
  }
};

export const generateDraft = async (
  area: AreaDireito,
  type: string,
  facts: string,
  arguments_text: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `Atue como um advogado especialista em Direito ${area}.
    Redija uma minuta de ${type} profissional e bem fundamentada.
    Fatos do caso: ${facts}
    Argumentos/Teses principais a utilizar: ${arguments_text}
    Estruture a peça com cabeçalho, fatos, direito e pedidos. Use linguagem jurídica formal e adequada.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a peça.";
  } catch (error) {
    console.error("Erro na geração de peça:", error);
    return "Erro de conexão com o Gemini. Certifique-se de que a API_KEY está configurada corretamente nas configurações.";
  }
};

export const researchJurisprudence = async (query: string): Promise<{ text: string; sources: { title: string; uri: string }[] }> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Pesquise jurisprudências recentes e teses jurídicas sobre: "${query}". 
      Cite tribunais superiores (STJ, STF, TST) quando aplicável. 
      Retorne um texto explicativo consolidando o entendimento atual.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const sources: { title: string; uri: string }[] = [];
    
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Fonte Web",
            uri: chunk.web.uri || "#"
          });
        }
      });
    }

    return { text, sources };
  } catch (error) {
    console.error("Erro na pesquisa:", error);
    return { text: "Erro ao realizar pesquisa. Verifique sua API KEY.", sources: [] };
  }
};

export const askThesisAI = async (thesisContent: string, question: string, history: {role: string, text: string}[]): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `Você é um assistente jurídico especializado. Contexto da tese: ${thesisContent}. Pergunta: ${question}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar uma resposta.";
  } catch (error) {
    console.error("Erro no Notebook IA:", error);
    return "Erro ao processar sua pergunta.";
  }
};

export const generateThesisContent = async (title: string, description: string, area: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `Escreva o conteúdo completo de uma tese jurídica: Título: ${title}, Área: ${area}, Descrição: ${description}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "Erro ao gerar conteúdo.";
  } catch (error) {
    console.error("Erro na geração de tese:", error);
    return "Erro ao gerar o conteúdo da tese.";
  }
};
