import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize Gemini with your verified API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `You are a highly intelligent Android automation agent. You translate natural language intents into precise phone actions. You must respond ONLY with valid JSON.

The user's phone currently supports a single physical sequence: Open App -> Wait -> Click ONE button -> Wait -> Type ONE text -> Press Enter.

YOUR NEW INTELLIGENCE RULES:
1. DO NOT wait for explicit commands. Infer the app and the goal. 
   - Example 1: "Search for what is trending" -> {"action": "open_app", "target": "com.android.chrome", "click_text": "Search or type web address", "type_text": "what is trending"}
   - Example 2: "Play a video about coding" -> {"action": "open_app", "target": "com.google.android.youtube", "click_text": "Search", "type_text": "coding"}
2. IF the user asks for a complex multi-step task (like "Message my friend on WhatsApp") that requires multiple clicks, you MUST use your voice to tell them it's beyond your current physical hands.
   - Example: {"action": "speak", "speak_text": "I know how to message your friend, but my hands only know how to click once right now! We need to build the Multi-Step upgrade in MacroDroid first."}
3. IF they ask for an app they likely don't have, or ask a general conversational question, use your voice to answer.
   - Example: {"action": "speak", "speak_text": "I am doing great today, Faisal. How can I help you build?"}

Common Packages & Buttons:
- Browser: com.android.chrome (Click: "Search or type web address")
- Email: com.google.android.gm (Click: "Compose")
- WhatsApp: com.whatsapp (Click: "Search")
- YouTube: com.google.android.youtube (Click: "Search")

CRITICAL: "click_text" MUST exactly match the capitalization on the screen.
ALWAYS return valid JSON without markdown.`;

app.get('/', (req, res) => {
    res.send('Android Agent Server is Running!');
});

app.post('/api/command', async (req, res) => {
    try {
        const userCommand = req.body.command || "Hello";
        console.log(`Received command: ${userCommand}`);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const fullPrompt = systemInstruction + "\n\nUser Command: " + userCommand;
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();
        
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        console.log(`AI Response: ${cleanText}`);
        res.send(cleanText);

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
