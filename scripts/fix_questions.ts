import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../public/data');
const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_API_KEY;

if (!API_KEY) {
    console.error('❌ No API key found in .env.local');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const MODELS = [
    "gemini-3-pro-preview",
    "gemini-2.5-flash-preview-09-2025",
    "gemini-2.5-flash-lite-preview-09-2025"
];

interface Question {
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

interface ErrorInfo {
    file: string;
    index: number;
    errors: string[];
    question: Question;
}

// Validation function
function validateQuestion(q: Question): string[] {
    const errors: string[] = [];

    if (q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length) {
        errors.push('Invalid correctAnswerIndex');
    }

    const uniqueOptions = new Set(q.options);
    if (uniqueOptions.size !== q.options.length) {
        errors.push('Duplicate options');
    }

    if (q.questionText.length < 10) {
        errors.push('Question text too short');
    }

    return errors;
}

// Find all problematic questions
function findProblematicQuestions(): ErrorInfo[] {
    const problematic: ErrorInfo[] = [];
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

    for (const file of files) {
        const filePath = path.join(DATA_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const questions: Question[] = JSON.parse(content);

        questions.forEach((q, idx) => {
            const errors = validateQuestion(q);
            if (errors.length > 0) {
                problematic.push({
                    file,
                    index: idx,
                    errors,
                    question: q
                });
            }
        });
    }

    return problematic;
}

// Extract subject and grade from filename
function parseFilename(filename: string): { subject: string; grade: string } {
    const match = filename.match(/(.+)_(Primary \d)\.json/);
    if (!match) throw new Error(`Invalid filename: ${filename}`);
    return { subject: match[1], grade: match[2] };
}

// Generate a replacement question
async function regenerateQuestion(
    subject: string,
    grade: string,
    originalQuestion: Question,
    modelIndex: number = 0
): Promise<Question | null> {
    if (modelIndex >= MODELS.length) {
        console.error('    ❌ All models exhausted');
        return null;
    }

    const model = genAI.getGenerativeModel({ model: MODELS[modelIndex] });

    const prompt = `Generate a ${grade} level ${subject} question similar to this one:
"${originalQuestion.questionText}"

Requirements:
- Create a NEW question (different numbers/context)
- Provide exactly 4 multiple choice options
- Indicate the correct answer index (0-3)
- Include a clear explanation

Return ONLY valid JSON in this exact format:
{
  "questionText": "...",
  "options": ["...", "...", "...", "..."],
  "correctAnswerIndex": 0,
  "explanation": "..."
}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const question: Question = JSON.parse(jsonMatch[0]);

        // Validate the generated question
        const errors = validateQuestion(question);
        if (errors.length > 0) {
            throw new Error(`Generated question has errors: ${errors.join(', ')}`);
        }

        return question;
    } catch (error: any) {
        if (error.message?.includes('429') || error.message?.includes('503')) {
            console.log(`    ⚠️  Model ${MODELS[modelIndex]} hit rate limit. Switching...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return regenerateQuestion(subject, grade, originalQuestion, modelIndex + 1);
        }

        console.error(`    ❌ Error with ${MODELS[modelIndex]}:`, error.message);
        return null;
    }
}

// Main regeneration process
async function regenerateProblematicQuestions() {
    console.log('🔍 Finding problematic questions...\n');

    const problematic = findProblematicQuestions();
    console.log(`Found ${problematic.length} problematic questions\n`);

    if (problematic.length === 0) {
        console.log('✅ No problematic questions found!');
        return;
    }

    // Group by file
    const byFile = new Map<string, ErrorInfo[]>();
    for (const item of problematic) {
        if (!byFile.has(item.file)) {
            byFile.set(item.file, []);
        }
        byFile.get(item.file)!.push(item);
    }

    let fixed = 0;
    let failed = 0;

    for (const [filename, items] of byFile.entries()) {
        console.log(`\n📄 Processing ${filename} (${items.length} errors)`);
        const { subject, grade } = parseFilename(filename);
        const filePath = path.join(DATA_DIR, filename);
        const questions: Question[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        for (const item of items) {
            console.log(`  Q${item.index + 1}: ${item.errors.join(', ')}`);
            console.log(`    Regenerating...`);

            const newQuestion = await regenerateQuestion(subject, grade, item.question);

            if (newQuestion) {
                questions[item.index] = newQuestion;
                console.log(`    ✅ Fixed`);
                fixed++;
            } else {
                console.log(`    ❌ Failed to regenerate`);
                failed++;
            }

            // Small delay between questions
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Save updated file
        fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
        console.log(`  💾 Saved ${filename}`);
    }

    console.log(`\n✅ Fixed: ${fixed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`\n🎉 Regeneration complete!`);
}

regenerateProblematicQuestions().catch(console.error);
