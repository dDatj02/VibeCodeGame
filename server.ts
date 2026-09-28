import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// POST /api/analyze-reply: Analyzes customer review vs player custom reply
app.post('/api/analyze-reply', async (req, res) => {
  try {
    const { reviewText, replyText, rating, aspect } = req.body;

    if (!reviewText || !replyText) {
      return res.status(400).json({
        error: 'Both reviewText and replyText are required.',
      });
    }

    if (!ai) {
      // Fallback if no API key is set
      return res.status(503).json({
        error: 'Gemini API is not configured on server.',
      });
    }

    const prompt = `You are a sentiment and customer service analysis engine for a Vietnamese smoothie shop tycoon game.
Analyze the shop owner's custom reply to a customer review.

Context:
Customer Review (${rating || 5} stars, aspect: ${aspect || 'general'}):
"${reviewText}"

Owner Custom Reply:
"${replyText}"

Evaluate the owner's response objectively and return ONLY valid JSON matching this exact schema:
{
  "sentiment": "positive" | "neutral" | "negative",
  "politeness": "high" | "medium" | "low",
  "empathy": "high" | "medium" | "low",
  "defensive": true | false,
  "toxicity": "low" | "medium" | "high"
}

Definitions:
- sentiment: "positive" if constructive, grateful, polite, apologetic or encouraging; "neutral" if standard/factual; "negative" if rude, hostile, dismissive, sarcastic, or blaming the customer.
- politeness: "high" (uses respectful Vietnamese words like Dạ, Cảm ơn, Xin lỗi, Quán, v.v.), "medium" (normal conversational tone), "low" (brusque, dismissive, insulting).
- empathy: "high" (acknowledges customer feeling/experience, offers remedy or understanding), "medium" (standard acknowledgment), "low" (ignores complaint, dismissive).
- defensive: true if the owner denies responsibility aggressively, makes excuses, or attacks the customer's taste/character.
- toxicity: "high" if swearing, heavy insults, threats, extreme hostility; "medium" if passive-aggressive, rude, belittling; "low" if civil and professional.

Return ONLY raw JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    // Validate fields
    const validSentiment = ['positive', 'neutral', 'negative'].includes(parsed.sentiment)
      ? parsed.sentiment
      : 'neutral';
    const validPoliteness = ['high', 'medium', 'low'].includes(parsed.politeness)
      ? parsed.politeness
      : 'medium';
    const validEmpathy = ['high', 'medium', 'low'].includes(parsed.empathy)
      ? parsed.empathy
      : 'medium';
    const validDefensive = typeof parsed.defensive === 'boolean' ? parsed.defensive : false;
    const validToxicity = ['low', 'medium', 'high'].includes(parsed.toxicity)
      ? parsed.toxicity
      : 'low';

    return res.json({
      sentiment: validSentiment,
      politeness: validPoliteness,
      empathy: validEmpathy,
      defensive: validDefensive,
      toxicity: validToxicity,
    });
  } catch (err: any) {
    console.error('Gemini analysis error:', err);
    return res.status(500).json({
      error: 'Failed to analyze reply with AI.',
      details: err?.message,
    });
  }
});

// Mount Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
