import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../public/data');
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('❌ No API key found');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const MODELS = [
    "gemini-2.5-flash-preview-09-2025",
    "gemini-2.5-flash-lite-preview-09-2025"
];

interface Question {
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

// Extract answer from explanation
function extractAnswerFromExplanation(explanation: string): string | null {
    const patterns = [
        /=\s*\$?(\d+\.?\d*)/g,
        /answer\s+is\s+\$?(\d+\.?\d*)/gi,
        /left\s+is\s+\$?(\d+\.?\d*)/gi,
    ];

    for (const pattern of patterns) {
        const matches = [...explanation.matchAll(pattern)];
        if (matches.length > 0) {
            return matches[matches.length - 1][1];
        }
    }
    return null;
}

// Check if answer is wrong
function isAnswerWrong(q: Question): boolean {
    const selectedAnswer = q.options[q.correctAnswerIndex];
    const answerFromExplanation = extractAnswerFromExplanation(q.explanation);

    if (answerFromExplanation) {
        const selectedNum = selectedAnswer.match(/\d+\.?\d*/);
        if (selectedNum) {
            const selected = parseFloat(selectedNum[0]);
            const explained = parseFloat(answerFromExplanation);
            return Math.abs(selected - explained) > 0.01;
        }
    }
    return false;
}

// Regenerate a question
async function regenerateQuestion(
    grade: string,
    originalQuestion: Question,
    modelIndex: number = 0
): Promise<Question | null> {
    if (modelIndex >= MODELS.length) {
        return null;
    }

    const model = genAI.getGenerativeModel({ model: MODELS[modelIndex] });

    const prompt = `Generate a ${grade} level Math question similar to this one:
"${originalQuestion.questionText}"

IMPORTANT REQUIREMENTS:
- Create a NEW question with different numbers
- Provide exactly 4 multiple choice options
- DOUBLE-CHECK your math calculation
- Make sure the correctAnswerIndex points to the CORRECT answer
- Include a clear step-by-step explanation showing the calculation

Return ONLY valid JSON in this exact format:
{
  "questionText": "...",
  "options": ["...", "...", "...", "..."],
  "correctAnswerIndex": 0,
  "explanation": "Step 1: ... Step 2: ... Final answer: ..."
}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error('No JSON found');
        }

        const question: Question = JSON.parse(jsonMatch[0]);

        // Validate the generated question
        if (isAnswerWrong(question)) {
            throw new Error('Generated question still has wrong answer');
        }

        return question;
    } catch (error: any) {
        if (error.message?.includes('429') || error.message?.includes('503')) {
            console.log(`    ⚠️  Rate limit, switching model...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return regenerateQuestion(grade, originalQuestion, modelIndex + 1);
        }

        console.error(`    ❌ Error:`, error.message);
        return null;
    }
}

async function fixMathQuestions() {
    console.log('🔧 Fixing incorrect math answers...\n');

    const mathFiles = [
        { file: 'Math_Primary 3.json', grade: 'Primary 3' },
        { file: 'Math_Primary 4.json', grade: 'Primary 4' }
    ];

    let fixed = 0;
    let failed = 0;

    for (const { file, grade } of mathFiles) {
        const filePath = path.join(DATA_DIR, file);
        const questions: Question[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        console.log(`\n📄 Processing ${file}`);

        let fileFixed = 0;

        for (let i = 0; i < questions.length; i++) {
            if (isAnswerWrong(questions[i])) {
                console.log(`  Q${i + 1}: Wrong answer detected`);
                console.log(`    Question: "${questions[i].questionText.substring(0, 60)}..."`);
                console.log(`    Regenerating...`);

                const newQuestion = await regenerateQuestion(grade, questions[i]);

                if (newQuestion) {
                    questions[i] = newQuestion;
                    console.log(`    ✅ Fixed`);
                    fixed++;
                    fileFixed++;
                } else {
                    console.log(`    ❌ Failed`);
                    failed++;
                }

                // Delay between questions
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (fileFixed > 0) {
            fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
            console.log(`  💾 Saved ${file} (${fileFixed} questions fixed)`);
        }
    }

    console.log(`\n✅ Fixed: ${fixed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`\n🎉 Done!`);
}

fixMathQuestions().catch(console.error);
