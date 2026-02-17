import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import cors from 'cors';

console.log("1. Booting up Agent Brain...");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

console.log("2. Environment variables loaded.");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/command', async (req, res) => {
    try {
        const { command } = req.body;
        if (!command) return res.status(400).json({ error: "Missing command." });

        console.log(`Processing command: ${command}`);

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-pro",
            generationConfig: { responseMimeType: "application/json" }
        });

        const systemPrompt = `
        You are the Brain of an Android mobile AI agent. 
        Convert the user command into a strict JSON execution plan array.
        Available actions: "open_app", "search", "tap", "type".
        Output ONLY valid JSON. Example: [{"action": "open_app", "target": "Gmail", "value": ""}]
        `;

        const result = await model.generateContent(`${systemPrompt}\n\nCommand: ${command}`);
        const executionPlan = JSON.parse(result.response.text());

        res.status(200).json({ success: true, plan: executionPlan });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/', (req, res) => {
    res.status(200).send('Agent Brain Online');
});

// Force port to be a number so Railway doesn't get confused
const port = parseInt(process.env.PORT) || 3000;

app.listen(port, "0.0.0.0", () => {
    console.log(`3. 🚀 SUCCESS: Server is listening on port ${port} at 0.0.0.0`);
});
