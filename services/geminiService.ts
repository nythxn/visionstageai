
import { GoogleGenAI } from "@google/genai";

export const stageRoom = async (
  base64Image: string,
  prompt: string,
  mimeType: string = "image/jpeg"
): Promise<string> => {
  // Defensive check for the API key to prevent a blank screen/crash
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : null;
  
  if (!apiKey) {
    throw new Error("API_KEY is missing. Please configure it in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey as string });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: mimeType,
            },
          },
          {
            text: `${prompt}. 

Strict Requirements:
1. The output must be a single hyper-realistic photo optimized for high-end real estate marketing.
2. Maintain strict visual consistency with the established brand aesthetic defined in the prompt.
3. If the room has clutter or existing furniture, virtually de-clutter it first before applying the new staging.
4. Do not change architectural elements: Windows, doors, structural walls, and fireplace shapes must remain identical to the original image.
5. Ensure professional architectural photography lighting (HDR look, soft shadows, warm highlights).`,
          },
        ],
      },
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data returned from AI.");
  } catch (error) {
    console.error("Gemini Staging Error:", error);
    throw error;
  }
};
