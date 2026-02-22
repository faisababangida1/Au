import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize Gemini with your verified API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// UPDATED BRAIN: Now includes instructions for clicking buttons
const systemInstruction = `You are an Android automation agent. You must respond with valid JSON.
When the user asks to open an app, set "action" to "open_app" and set "target" to the exact Android Package Name.

Common Packages:
- Gmail -> com.google.android.gm
- WhatsApp -> com.whatsapp
- YouTube -> com.google.android.youtube
- Chrome -> com.android.chrome

If the user asks to tap, click, or search after opening the app, include a "click_text" field with the exact word of the button to click.
Example: "Open YouTube and tap Search" -> {"action": "open_app", "target": "com.google.android.youtube", "click_text": "Search"}
ALWAYS return valid JSON without markdown.`;

app.get('/', (req, res) => {
    res.send('Android Agent Server is Running!');
});

app.post('/api/command', async (req, res) => {
    try {
        const userCommand = req.body.command || "Hello";
        console.log(`Received command: ${userCommand}`);

        // Using the confirmed working 2.5 model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const fullPrompt = systemInstruction + "\n\nUser Command: " + userCommand;
        
        const result = await model.generateContent(fullPrompt);
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
