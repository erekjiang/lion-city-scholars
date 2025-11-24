import { GoogleGenAI, Type } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Define types locally to avoid import issues in script
enum Subject {
    ENGLISH = "English",
    MATH = "Math",
    SCIENCE = "Science",
    CHINESE = "Chinese"
}

type Grade = 'Primary 3' | 'Primary 4';

interface Question {
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

// Configuration
const TARGET_QUESTIONS_PER_CATEGORY = process.env.TARGET_COUNT ? parseInt(process.env.TARGET_COUNT) : 1000;
const BATCH_SIZE = 20;
const OUTPUT_DIR = path.resolve(__dirname, '../public/data');
const DELAY_BETWEEN_BATCHES = 2000; // Reduced delay since we rotate models

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Prioritized Model List
const MODELS = [
    "gemini-3-pro-preview",             // Newest, High Performance
    "gemini-2.5-flash-preview-09-2025", // Fast, High Quality
    "gemini-2.5-flash-lite-preview-09-2025" // Economy / Fallback
];

// Initialize Gemini
const apiKey = process.env.API_KEY || process.env.VITE_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("Error: API_KEY, VITE_API_KEY, or GEMINI_API_KEY not found in .env.local");
    process.exit(1);
}
const genAI = new GoogleGenAI({ apiKey });

// Helper to delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Save on exit (Global handler not ideal for split files, handled per file now)
process.on('SIGINT', () => {
    console.log("\nScript interrupted. Exiting safely.");
    process.exit(0);
});

async function generateBatch(subject: Subject, grade: Grade, count: number): Promise<Question[]> {
    const prompt = `Generate ${count} distinct, challenging multiple-choice questions for Singapore Primary School ${grade} students for the subject: ${subject}.
  
  Format: JSON Array.
  Requirements:
  - Difficult questions suitable for top school exam papers.
  - 4 options per question.
  - Clear explanation.
  - JSON only, no markdown.
  `;

    let currentModelIndex = 0;

    // Try models in sequence until one works or all fail
    while (currentModelIndex < MODELS.length) {
        const modelName = MODELS[currentModelIndex];

        try {
            // console.log(`    Trying model: ${modelName}...`); 
            const response = await genAI.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                questionText: { type: Type.STRING },
                                options: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                },
                                correctAnswerIndex: { type: Type.INTEGER },
                                explanation: { type: Type.STRING }
                            },
                            required: ["questionText", "options", "correctAnswerIndex", "explanation"]
                        }
                    }
                }
            });

            const text = response.text;
            if (!text) throw new Error("Empty response");

            return JSON.parse(text) as Question[];

        } catch (error: any) {
            // Check for Rate Limit (429) or Overloaded (503)
            if (error.status === 429 || error.status === 503 || (error.message && error.message.includes('429'))) {
                console.warn(`    ⚠️  Model ${modelName} hit rate limit. Switching...`);
                currentModelIndex++;
            } else {
                // Other errors (e.g. bad request), log and return empty to retry outer loop
                console.error(`    ❌ Error with ${modelName}:`, error.message);
                return [];
            }
        }
    }

    console.error("    All models exhausted for this batch.");
    return [];
}

async function main() {
    const subjects = Object.values(Subject);
    const grades: Grade[] = ['Primary 3', 'Primary 4'];

    for (const grade of grades) {
        for (const subject of subjects) {
            const key = `${subject}_${grade}`;
            const filePath = path.join(OUTPUT_DIR, `${key}.json`);

            let currentQuestions: Question[] = [];

            // Load existing
            if (fs.existsSync(filePath)) {
                try {
                    currentQuestions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                } catch (e) {
                    console.log(`Starting empty for ${key}`);
                }
            }

            console.log(`Processing ${key}... Current count: ${currentQuestions.length}`);

            while (currentQuestions.length < TARGET_QUESTIONS_PER_CATEGORY) {
                const needed = TARGET_QUESTIONS_PER_CATEGORY - currentQuestions.length;
                const batchSize = Math.min(BATCH_SIZE, needed);

                console.log(`  Generating batch of ${batchSize} for ${key}...`);
                const newQuestions = await generateBatch(subject, grade, batchSize);

                if (newQuestions.length > 0) {
                    currentQuestions.push(...newQuestions);
                    // Save immediately to specific file
                    fs.writeFileSync(filePath, JSON.stringify(currentQuestions, null, 2));
                    console.log(`  Saved. Total: ${currentQuestions.length}/${TARGET_QUESTIONS_PER_CATEGORY}`);

                    // Successful batch delay
                    await delay(DELAY_BETWEEN_BATCHES);
                } else {
                    console.log("  Batch failed or empty. Retrying in 20s...");
                    await delay(20000); // Longer delay on failure
                }
            }
        }
    }
    console.log("Generation Complete!");
}

main();
