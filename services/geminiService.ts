import { GoogleGenAI, Type } from "@google/genai";
import { AreaDireito } from "../types";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const summarizeIntimacao = async (text: string): Promise<{ summary: string; prazo: string | null; acao: string | null }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
          }
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("Sem resposta da IA");
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Erro ao sumarizar:", error);
    return { summary: "Erro ao processar resumo.", prazo: null, acao: null };
  }
};

export const generateDraft = async (
  area: AreaDireito,
  type: string,
  facts: string,
  arguments_text: string
): Promise<string> => {
  try {
    const prompt = `Atue como um advogado especialista em Direito ${area}.
    Redija uma minuta de ${type} profissional e bem fundamentada.
    
    Fatos do caso: ${facts}
    
    Argumentos/Teses principais a utilizar: ${arguments_text}
    
    Estruture a peça com cabeçalho, fatos, direito e pedidos. Use linguagem jurídica formal e adequada.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a peça.";
  } catch (error) {
    console.error("Erro na geração de peça:", error);
    return "Erro ao conectar com o serviço de IA.";
  }
};

export const researchJurisprudence = async (query: string): Promise<{ text: string; sources: { title: string; uri: string }[] }> => {
  try {
    // Using gemini-2.5-flash for search grounding as it's efficient for this mock
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    return { text: "Erro ao realizar pesquisa jurídica.", sources: [] };
  }
};

// --- New Notebook AI Functions ---

export const askThesisAI = async (thesisContent: string, question: string, history: {role: string, text: string}[]): Promise<string> => {
  try {
    const historyText = history.map(h => `${h.role === 'user' ? 'Usuário' : 'Assistente'}: ${h.text}`).join('\n');
    
    const prompt = `Você é um assistente jurídico especializado (Notebook AI). Seu objetivo é ajudar o advogado a analisar, melhorar ou entender a tese jurídica fornecida abaixo.
    
    CONTEXTO DA TESE:
    """
    ${thesisContent}
    """
    
    HISTÓRICO DA CONVERSA:
    ${historyText}
    
    PERGUNTA ATUAL DO USUÁRIO:
    ${question}
    
    Responda de forma direta, técnica e útil. Se for pedido para criticar, seja rigoroso juridicamente. Se for pedido resumo, seja didático.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar uma resposta.";
  } catch (error) {
    console.error("Erro no Notebook AI:", error);
    return "Erro ao processar sua pergunta. Verifique a conexão.";
  }
};

export const generateThesisContent = async (title: string, description: string, area: string): Promise<string> => {
  try {
    const prompt = `Escreva o conteúdo completo e detalhado de uma tese jurídica.
    
    Título: ${title}
    Área: ${area}
    Descrição/Resumo: ${description}
    
    O texto deve conter:
    1. Introdução fática e jurídica.
    2. Fundamentação legal (cite leis e artigos, mas não invente números de leis inexistentes).
    3. Citação de jurisprudência (simule o estilo de ementas reais).
    4. Conclusão lógica.
    
    Use linguagem jurídica culta e persuasiva.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Erro ao gerar conteúdo.";
  } catch (error) {
    console.error("Erro na geração de tese:", error);
    return "Erro ao gerar o conteúdo da tese.";
  }
};