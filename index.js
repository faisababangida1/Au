import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize Gemini with your verified API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `You are a highly intelligent Android automation agent. Respond ONLY with valid JSON.

To bypass free-tier limitations, break down complex multi-step tasks into up to 5 explicit sequential steps.
Use "click" or "type" for the step actions. 

Example 1: "Message Ali 'Hello' on WhatsApp"
{
  "action": "open_app",
  "target": "com.whatsapp",
  "step1_action": "click", "step1_value": "Search",
  "step2_action": "type", "step2_value": "Ali",
  "step3_action": "click", "step3_value": "Ali",
  "step4_action": "type", "step4_value": "Hello",
  "step5_action": "click", "step5_value": "Send"
}

Example 2: "Search for crypto news"
{
  "action": "open_app",
  "target": "com.android.chrome",
  "step1_action": "click", "step1_value": "Search or type web address",
  "step2_action": "type", "step2_value": "crypto news",
  "step3_action": "click", "step3_value": "Search"
}

If a task needs fewer steps, just omit the extra ones from the JSON.
For conversational questions, output: {"action": "speak", "speak_text": "your response here"}
ALWAYS return valid JSON without markdown.`;

app.get('/', (req, res) => {
    res.send('Android Agent Server is Running!');
});

app.post('/api/command', async (req, res) => {
    try {
        const userCommand = req.body.command || "Hello";
        console.log("Received command: " + userCommand);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const fullPrompt = systemInstruction + "\n\nUser Command: " + userCommand;
        
        const result = await model.generateContent(fullPrompt);
        const text = await result.response.text();
        
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        console.log("AI Response: " + cleanText);
        res.send(cleanText);

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
