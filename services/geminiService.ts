import { GoogleGenerativeAI } from "@google/generative-ai";
import { GroundingSource } from "../types";


export interface PriceResult {
  price: number;
  sources: GroundingSource[];
  error?: string;
}


export const estimateProductPrice = async (productName: string): Promise<PriceResult> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    if (!apiKey) {
      console.warn("VITE_GEMINI_API_KEY não encontrada.");
      return { price: 0, sources: [] };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Initialize model with Google Search tool for real-time prices
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      tools: [
        {
          googleSearch: {},
        },
      ] as any,
    }, { apiVersion: 'v1beta' });

    const prompt = `Pesquise o preço médio atual do produto "${productName}" em supermercados no Brasil. 
    Dê prioridade aos preços praticados no Carrefour (mercado.carrefour.com.br), mas também considere outros grandes varejistas para comparação.
    Seja realista e conservador. Ignore promoções extremas ou preços de atacado.
    Retorne APENAS o valor numérico médio encontrado (ex: 15.90). Não use símbolo de moeda. Não escreva texto explicativo.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Improved price extraction
    const cleanText = text.replace(/[^\d.,]/g, '').replace(',', '.');
    const price = parseFloat(cleanText);

    // Extract grounding sources
    const sources: GroundingSource[] = [];
    const candidates = (response as any).candidates;
    if (candidates && candidates[0]?.groundingMetadata?.groundingChunks) {
      candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || 'Fonte de pesquisa',
            uri: chunk.web.uri
          });
        }
      });
    }

    return { 
      price: isNaN(price) ? 0 : price, 
      sources 
    };
  } catch (error: any) {
    console.error("Error estimating price for:", productName, error);
    
    // Check for quota error
    if (error?.status === 429 || error?.message?.includes('429')) {
        return { price: 0, sources: [], error: 'Cota de pesquisa excedida. Tente novamente em 1 minuto.' };
    }
    
    return { price: 0, sources: [] };
  }
};
