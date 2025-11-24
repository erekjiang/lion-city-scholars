import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Question {
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

const DATA_DIR = path.join(__dirname, '../public/data');

// Extract numbers from text
function extractNumbers(text: string): number[] {
    const matches = text.match(/\d+\.?\d*/g);
    return matches ? matches.map(Number) : [];
}

// Extract the final answer from explanation
function extractAnswerFromExplanation(explanation: string): string | null {
    // Look for patterns like "= $33.70" or "= 33.70" or "answer is 33.70"
    const patterns = [
        /=\s*\$?(\d+\.?\d*)/g,
        /answer\s+is\s+\$?(\d+\.?\d*)/gi,
        /left\s+is\s+\$?(\d+\.?\d*)/gi,
        /total\s+is\s+\$?(\d+\.?\d*)/gi,
        /result\s+is\s+\$?(\d+\.?\d*)/gi,
    ];

    for (const pattern of patterns) {
        const matches = [...explanation.matchAll(pattern)];
        if (matches.length > 0) {
            // Get the last match (usually the final answer)
            return matches[matches.length - 1][1];
        }
    }

    return null;
}

// Validate a math question
function validateMathQuestion(q: Question, index: number): string[] {
    const errors: string[] = [];

    // Check if correctAnswerIndex is valid
    if (q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length) {
        errors.push(`Q${index + 1}: Invalid correctAnswerIndex ${q.correctAnswerIndex}`);
        return errors;
    }

    const selectedAnswer = q.options[q.correctAnswerIndex];
    const answerFromExplanation = extractAnswerFromExplanation(q.explanation);

    if (answerFromExplanation) {
        // Extract number from selected answer
        const selectedNum = selectedAnswer.match(/\d+\.?\d*/);

        if (selectedNum) {
            const selected = parseFloat(selectedNum[0]);
            const explained = parseFloat(answerFromExplanation);

            // Check if they match (with small tolerance for floating point)
            if (Math.abs(selected - explained) > 0.01) {
                errors.push(
                    `Q${index + 1}: Answer mismatch! ` +
                    `Selected: "${selectedAnswer}" (${selected}), ` +
                    `Explanation says: ${explained}\n` +
                    `  Question: "${q.questionText.substring(0, 80)}..."`
                );
            }
        }
    }

    return errors;
}

async function validateMathQuestions() {
    console.log('🔍 Validating Math questions...\n');

    const mathFiles = [
        'Math_Primary 3.json',
        'Math_Primary 4.json'
    ];

    let totalQuestions = 0;
    let totalErrors = 0;
    const allErrors: string[] = [];

    for (const file of mathFiles) {
        const filePath = path.join(DATA_DIR, file);

        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  ${file} not found, skipping...`);
            continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const questions: Question[] = JSON.parse(content);

        console.log(`📄 ${file}: ${questions.length} questions`);
        totalQuestions += questions.length;

        questions.forEach((q, idx) => {
            const errors = validateMathQuestion(q, idx);
            if (errors.length > 0) {
                allErrors.push(...errors);
                totalErrors += errors.length;
            }
        });
    }

    console.log(`\n✅ Total questions validated: ${totalQuestions}`);
    console.log(`❌ Errors found: ${totalErrors}\n`);

    if (allErrors.length > 0) {
        console.log('📋 Detailed Errors:\n');
        allErrors.forEach(err => console.log(`  ${err}\n`));
    } else {
        console.log('🎉 All math questions passed validation!');
    }

    // Return error count for exit code
    process.exit(totalErrors > 0 ? 1 : 0);
}

validateMathQuestions().catch(console.error);
