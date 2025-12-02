import { GoogleGenAI } from "@google/genai";
import { GoldPrice, PriceHistoryPoint } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMarketInsights = async (
  currentPrice: GoldPrice,
  history: PriceHistoryPoint[]
): Promise<string> => {
  try {
    const historyString = history
      .map((h) => `${h.date}: ৳${h.price.toFixed(2)}`)
      .join("\n");

    const prompt = `
      You are a senior financial analyst for Auro, a premium gold investment platform in Bangladesh.
      
      Current Market Data (in BDT/Taka):
      - Buy Price: ৳${currentPrice.buy.toFixed(2)} / gram
      - Sell Price: ৳${currentPrice.sell.toFixed(2)} / gram
      - Trend: ${currentPrice.trend}
      
      Recent Price History (Last few days):
      ${historyString}
      
      Please provide a concise, professional market analysis (max 150 words). 
      Focus on whether now is a good time to buy or sell based on the trend. 
      Use a sophisticated, reassuring tone suitable for high-net-worth individuals.
      Format the output with Markdown. Use bolding for key figures.
      Remember to use the ৳ symbol for prices in your response.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Market analysis currently unavailable.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Our AI market analyst is currently analyzing high-frequency data. Please check back in a moment.";
  }
};