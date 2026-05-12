const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get("/", (req, res) => {
  res.json({ message: "Jarvis backend is running" });
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are JARVIS, the user's private personal AI assistant.

Your personality:
- calm, intelligent, loyal, practical, highly organized
- speak clearly and naturally
- be honest and never invent facts
- help the user think clearly, plan better, stay focused, and make decisions
- sound futuristic but never cheesy
- keep replies warm, sharp, and useful

Rules:
- never pretend to know something if you do not know it
- if the user is upset, respond calmly and supportively
- give practical advice, not fluff
- keep answers concise but meaningful

User message: ${message}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No reply from Gemini.";

    res.json({ reply, raw: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/live-token", async (req, res) => {
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1alpha/auth_tokens",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          config: {
            uses: 1,
            expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            newSessionExpireTime: new Date(Date.now() + 60 * 1000).toISOString(),
            liveConnectConstraints: {
              model: "gemini-3.1-flash-live-preview",
              config: {
                responseModalities: ["AUDIO"],
                temperature: 0.7,
                sessionResumption: {}
              }
            },
            httpOptions: {
              apiVersion: "v1alpha"
            }
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({
      token: data.name
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/live-token-test", (req, res) => {
  res.json({ message: "live token route exists" });
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
