// workers/openai.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

/**
 * Generate an AI-powered reply using OpenAI
 * @param {string} message - The user message from WhatsApp
 * @returns {Promise<string>} - The AI-generated reply
 */
export async function getAIResponse(message) {
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful WhatsApp assistant." },
        { role: "user", content: message },
      ],
    });

    return completion.choices[0].message.content || "Sorry, I couldn’t generate a response.";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "⚠️ Sorry, I had trouble processing that.";
  }
}
