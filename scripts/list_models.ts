import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.API_KEY || process.env.VITE_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API key found");
    process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey });

async function list() {
    try {
        const response = await genAI.models.list();
        // The response might be an object with a models property or an array
        // Let's print whatever we get to inspect
        console.log(JSON.stringify(response, null, 2));
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

list();
