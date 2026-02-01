import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/gemini", async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body ?? {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt requerido" });
    }

    const apiKey = process.env.GEMINI_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Falta GEMINI_KEY" });
    }

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      ...(systemPrompt
        ? { systemInstruction: { parts: [{ text: systemPrompt }] } }
        : {})
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        error: "Gemini error",
        details: data
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return res.json({ text });
  } catch (e) {
    return res.status(500).json({ error: "Error servidor" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("API running on", port));
