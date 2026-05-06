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
    
    // Using Gemini 2.0 Flash as confirmed by diagnostic tests for this key
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash"
    }, { apiVersion: 'v1beta' });

    const prompt = `Você é um assistente de compras. Pesquise o preço médio atual do produto: "${productName}" em supermercados brasileiros (foco Carrefour).
    Responda APENAS o valor numérico, usando ponto como separador decimal.
    Exemplo de resposta: 24.90
    Se não encontrar, estime baseado no valor de mercado.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Robust price extraction (finds first number with decimals)
    const matches = text.match(/\d+[.,]\d+/);
    let price = 0;
    
    if (matches) {
        price = parseFloat(matches[0].replace(',', '.'));
    } else {
        // Fallback for integers
        const intMatches = text.match(/\d+/);
        if (intMatches) price = parseFloat(intMatches[0]);
    }

    return { 
      price: price || 0, 
      sources: [] 
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
