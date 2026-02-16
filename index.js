import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/command', async (req, res) => {
    try {
        const { command } = req.body;
        
        if (!command) {
            return res.status(400).json({ error: "Missing command in request body." });
        }

        console.log(`Received command: ${command}`);

        // Configure AI to strictly return JSON
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-pro",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const systemPrompt = `
        You are the Brain of an Android mobile AI agent. 
        Your job is to take a user's natural language command and break it down into a strict JSON execution plan.
        An automation app (Tasker) will read this JSON and execute the physical steps blindly on the phone.
        
        You must output a pure JSON array containing step objects. Do not include any other text.
        
        Available actions:
        - "open_app": Opens an application (requires "target" to be the app name).
        - "search": Types a query into a search bar (requires "value").
        - "tap": Clicks a specific button or text on screen (requires "target").
        - "type": Inputs text into a selected field (requires "value").
        
        Example JSON Output:
        [
          { "action": "open_app", "target": "Gmail", "value": "" },
          { "action": "tap", "target": "Compose", "value": "" },
          { "action": "type", "target": "To", "value": "contact@example.com" }
        ]
        `;

        const result = await model.generateContent(`${systemPrompt}\n\nUser Command: ${command}`);
        const responseText = result.response.text();
        
        // Parse the JSON to ensure it is valid before sending it back
        const executionPlan = JSON.parse(responseText);

        res.status(200).json({ 
            success: true, 
            plan: executionPlan 
        });

    } catch (error) {
        console.error("Agent Error:", error);
        res.status(500).json({ 
            success: false, 
            error: "The agent encountered an error processing the command." 
        });
    }
});

// Health check endpoint for deployment monitoring
app.get('/', (req, res) => {
    res.send('Agent Orchestrator is online.');
});

// FIX: Binding explicitly to 0.0.0.0 so Railway can route traffic correctly
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Mobile Agent Brain is running on port ${PORT}`);
});
