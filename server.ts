import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional writing assistant. Generate high-quality, articulate, and cohesive text based on the user's prompt. Do not include markdown formatting like markdown code blocks unless explicitly requested, just output plain text or basic paragraph structure.",
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error generating text:", error);
      res.status(500).json({ error: error.message || "Failed to generate text" });
    }
  });

  app.post("/api/iterate", async (req, res) => {
    try {
      const { fullText, selectedText, instruction } = req.body;
      if (!fullText || !selectedText || !instruction) {
        return res.status(400).json({ error: "fullText, selectedText, and instruction are required" });
      }

      const prompt = `You are a professional writing editor. The user has provided a full document, a selected text block from that document, and an instruction on how to edit or rewrite the selected text.
Your task is to follow the instruction and provide the *new, rewritten version of the selected text*. 
ONLY return the revised text that should replace the selected text. Do not return the entire document. Do not include markdown formatting or explanations, just the raw text.

DOCUMENT CONTEXT:
${fullText}

SELECTED TEXT TO EDIT:
${selectedText}

INSTRUCTION:
${instruction}

REVISED TEXT:`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error iterating text:", error);
      res.status(500).json({ error: error.message || "Failed to iterate text" });
    }
  });

  app.post("/api/proactive-suggestions", async (req, res) => {
    try {
      const { fullText } = req.body;
      if (!fullText || fullText.trim().length < 50) {
        return res.json({ suggestions: [] });
      }

      const prompt = `You are a proactive, constructive writing assistant. Read the provided draft and provide up to 3 highly actionable, specific suggestions to improve it.
Your suggestions should identify specific phrasing, sentences, or short paragraphs that could be improved, and propose a better alternative.

DRAFT:
${fullText}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                targetText: {
                  type: Type.STRING,
                  description: "The exact substring from the draft that you are suggesting to change. MUST be an exact match.",
                },
                suggestion: {
                  type: Type.STRING,
                  description: "The proposed replacement text.",
                },
                reason: {
                  type: Type.STRING,
                  description: "A short reason (1 sentence) for this change.",
                },
              },
              required: ["targetText", "suggestion", "reason"],
            },
          },
        },
      });

      let suggestions = [];
      try {
        if (response.text) {
           suggestions = JSON.parse(response.text);
        }
      } catch (e) {
        console.error("Failed to parse suggestions", e);
      }

      // Filter out suggestions where targetText isn't actually in the fullText to avoid UI issues
      suggestions = suggestions.filter((s: any) => fullText.includes(s.targetText));

      res.json({ suggestions });
    } catch (error: any) {
      console.error("Error generating suggestions:", error);
      res.status(500).json({ error: error.message || "Failed to generate suggestions" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
