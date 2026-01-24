
import { GoogleGenAI, Type } from "@google/genai";
import { RiskReport, RiskLevel } from "../types";

// Initialize the Google GenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const RISK_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "Risk score from 1 to 10. 1 is safe, 10 is certain fraud." },
    reason: { type: Type.STRING, description: "Detailed explanation of why this score was given." },
    actions: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of immediate actions the user should take (e.g., 'Hang up immediately', 'Do not open your banking app')."
    },
    sentiment: {
      type: Type.OBJECT,
      properties: {
        primary: { type: Type.STRING, description: "Primary sentiment detected (e.g., Urgent, Threatening, Calm)." },
        intensity: { type: Type.NUMBER, description: "Intensity from 0 to 100." },
        scoreAdjustment: { type: Type.NUMBER, description: "Impact on the final 1-10 risk score." }
      },
      required: ["primary", "intensity", "scoreAdjustment"]
    },
    detections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          keyword: { type: Type.STRING },
          category: { type: Type.STRING }
        },
        required: ["keyword", "category"]
      }
    }
  },
  required: ["score", "reason", "actions", "detections", "sentiment"]
};

export async function analyzeTranscript(text: string): Promise<RiskReport> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following transcript of a phone call to detect potential fraud or scams.
      
      IMPORTANT:
      1. Provide a risk score from 1 to 10.
      2. Provide a detailed explanation in the 'reason' field.
      3. List practical, immediate actions for the user to take in the 'actions' field.
      
      Transcript: "${text}"`,
      config: {
        systemInstruction: "You are a world-class cybersecurity and fraud detection expert. You specialize in identifying social engineering, bank fraud, and urgent manipulation tactics. Evaluate the risk from 1 to 10 and suggest immediate defensive actions.",
        responseMimeType: "application/json",
        responseSchema: RISK_SCHEMA
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    let level = RiskLevel.LOW;
    if (data.score >= 8) level = RiskLevel.HIGH;
    else if (data.score >= 5) level = RiskLevel.MEDIUM;

    return {
      score: data.score,
      level,
      reason: data.reason,
      actions: data.actions,
      sentiment: data.sentiment,
      detections: data.detections.map((d: any) => ({ ...d, timestamp: Date.now() }))
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      score: 1,
      level: RiskLevel.LOW,
      reason: "Could not process the analysis.",
      actions: ["Stay calm", "Do not share sensitive data"],
      detections: []
    };
  }
}

export async function generateInterventionSpeech(reason: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a very short, authoritative security intervention message to warn the user about a scam based on this reason: ${reason}.`,
    });
    return response.text || "Warning: This call presents a high risk of fraud. Hang up immediately.";
  } catch (error) {
    return "SECURITY ALERT: Potential scam attempt detected.";
  }
}
