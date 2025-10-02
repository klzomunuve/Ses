import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import OpenAI from "openai";

const app = express();
app.use(bodyParser.json());

// Environment variables
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mybotverify";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

// Initialize OpenAI client
const client = new OpenAI({ apiKey: OPENAI_KEY });

// Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook verified!");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Handle incoming WhatsApp messages
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const message = entry?.messages?.[0];

    if (message) {
      const from = message.from; // User's WhatsApp number
      const text = message.text?.body;

      console.log(`💬 Received: "${text}" from ${from}`);

      // Ask GPT for a response
      const gptReply = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: text }],
      });

      const replyText =
        gptReply.choices[0]?.message?.content || "Sorry, I couldn’t generate a reply.";

      // Send reply back to WhatsApp
      await axios.post(
        "https://graph.facebook.com/v21.0/me/messages",
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: replyText },
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`🤖 Replied: "${replyText}"`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

// Start server
app.listen(10000, () => console.log("🚀 Server is running on port 10000"));
