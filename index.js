import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// The "Brain" instructions - Now capable of finding Package Names
const systemInstruction = `You are an Android automation agent. You must respond with valid JSON.
When the user asks to open an app, set "action" to "open_app" and set "target" to the exact Android Package Name.

Common Package Names (Use these exactly):
- "Open Gmail" -> "target": "com.google.android.gm"
- "Open WhatsApp" -> "target": "com.whatsapp"
- "Open YouTube" -> "target": "com.google.android.youtube"
- "Open Settings" -> "target": "com.android.settings"
- "Open Chrome" -> "target": "com.android.chrome"
- "Open Calculator" -> "target": "com.android.calculator2" (or similar)
- "Open Phone" -> "target": "com.android.dialer"
- "Open Camera" -> "target": "com.android.camera"

If you don't know the exact package, guess the most common one (e.g., com.instagram.android).
ALWAYS return valid JSON. Do not add markdown formatting like \`\`\`json.`;

app.get('/', (req, res) => {
    res.send('Android Agent Server is Running!');
});

app.post('/api/command', async (req, res) => {
    try {
        const userCommand = req.body.command || "Hello";
        console.log(`Received command: ${userCommand}`);

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction
        });

        const result = await model.generateContent(userCommand);
        const response = await result.response;
        const text = response.text();

        // Clean up the text to ensure it's valid JSON
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
