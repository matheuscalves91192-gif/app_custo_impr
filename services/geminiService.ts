
import { GoogleGenAI, Type } from "@google/genai";
import { DbEntry, SimilarityRequest, SimilarityResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getSimilarityEstimate = async (
  request: SimilarityRequest,
  database: DbEntry[]
): Promise<SimilarityResponse> => {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `Você é um especialista em precificação de impressão 3D. 
  Sua tarefa é analisar uma base de dados de peças já produzidas e estimar o valor de um NOVO pedido baseado em SIMILARIDADE.
  
  REGRAS:
  1. Identifique as 3 a 5 peças mais similares na base de dados fornecida.
  2. Considere Tipo, Peso, Tamanho e Material.
  3. Calcule a média dos valores dessas peças.
  4. Se o novo pedido for maior/mais pesado que as similares, ajuste o valor proporcionalmente para cima.
  5. Valor Mínimo = Média calculada.
  6. Valor Máximo = Média + (entre 15% e 25%, dependendo da complexidade).
  7. Se o cliente NÃO possui STL, adicione um custo de setup/modelagem na justificativa.`;

  const prompt = `
  BASE DE DADOS (Peças anteriores):
  ${JSON.stringify(database, null, 2)}

  NOVO PEDIDO DO CLIENTE:
  - Tipo: ${request.tipo}
  - Tamanho: ${request.tamanho_cm} cm
  - Peso: ${request.peso_g} g
  - Material: ${request.material}
  - Possui STL: ${request.possuiSTL ? 'Sim' : 'Não'}

  Retorne o resultado estritamente em JSON.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          valorMin: { type: Type.NUMBER },
          valorMax: { type: Type.NUMBER },
          peçasSimilaresEncontradas: { type: Type.INTEGER },
          justificativa: { type: Type.STRING },
          detalhesTecnicos: { type: Type.STRING }
        },
        required: ["valorMin", "valorMax", "peçasSimilaresEncontradas", "justificativa", "detalhesTecnicos"]
      }
    }
  });

  return JSON.parse(response.text);
};

// Mantendo a função antiga para compatibilidade se necessário
export const estimatePrintParams = async (description: string): Promise<any> => {
  const model = "gemini-3-flash-preview";
  const prompt = `Estime peso(g) e tempo(h) para: "${description}". Retorne JSON {estimatedWeight, estimatedTime, reasoning}.`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text);
};
