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

// Extract the answer mentioned in the explanation
function extractAnswerFromExplanation(explanation: string, options: string[]): number | null {
    // For each option, check if it's explicitly mentioned as correct in the explanation
    for (let i = 0; i < options.length; i++) {
        const option = options[i].trim();

        // Check for explicit mentions like "The answer is X" or "correct answer is X"
        const patterns = [
            new RegExp(`answer\\s+is\\s+${escapeRegex(option)}`, 'i'),
            new RegExp(`correct\\s+is\\s+${escapeRegex(option)}`, 'i'),
            new RegExp(`therefore\\s+${escapeRegex(option)}`, 'i'),
            new RegExp(`thus\\s+${escapeRegex(option)}`, 'i'),
            new RegExp(`so\\s+${escapeRegex(option)}`, 'i'),
        ];

        for (const pattern of patterns) {
            if (pattern.test(explanation)) {
                return i;
            }
        }
    }

    // For math questions, check if the final number matches
    const numbers = explanation.match(/=\s*\$?(\d+\.?\d*)/g);
    if (numbers && numbers.length > 0) {
        const lastNumber = numbers[numbers.length - 1].replace(/[=$\s]/g, '');

        for (let i = 0; i < options.length; i++) {
            const optionNum = options[i].match(/\d+\.?\d*/);
            if (optionNum && optionNum[0] === lastNumber) {
                return i;
            }
        }
    }

    return null;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Validate a question
function validateQuestion(q: Question, index: number, filename: string): string[] {
    const errors: string[] = [];

    // Check if correctAnswerIndex is valid
    if (q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length) {
        errors.push(
            `${filename} Q${index + 1}: Invalid correctAnswerIndex ${q.correctAnswerIndex}\n` +
            `  Question: "${q.questionText.substring(0, 80)}..."`
        );
        return errors;
    }

    // Try to extract the correct answer from explanation
    const suggestedIndex = extractAnswerFromExplanation(q.explanation, q.options);

    if (suggestedIndex !== null && suggestedIndex !== q.correctAnswerIndex) {
        errors.push(
            `${filename} Q${index + 1}: Answer mismatch!\n` +
            `  Question: "${q.questionText.substring(0, 80)}..."\n` +
            `  Selected: [${q.correctAnswerIndex}] "${q.options[q.correctAnswerIndex]}"\n` +
            `  Explanation suggests: [${suggestedIndex}] "${q.options[suggestedIndex]}"\n` +
            `  Explanation: "${q.explanation.substring(0, 100)}..."`
        );
    }

    // Check for duplicate options
    const uniqueOptions = new Set(q.options);
    if (uniqueOptions.size !== q.options.length) {
        errors.push(
            `${filename} Q${index + 1}: Duplicate options found\n` +
            `  Question: "${q.questionText.substring(0, 80)}..."`
        );
    }

    return errors;
}

async function validateAllSubjects() {
    console.log('🔍 Validating all subjects...\n');

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

    let totalQuestions = 0;
    let totalErrors = 0;
    const errorsByFile = new Map<string, string[]>();

    for (const file of files) {
        const filePath = path.join(DATA_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const questions: Question[] = JSON.parse(content);

        console.log(`📄 ${file}: ${questions.length} questions`);
        totalQuestions += questions.length;

        const fileErrors: string[] = [];

        questions.forEach((q, idx) => {
            const errors = validateQuestion(q, idx, file);
            if (errors.length > 0) {
                fileErrors.push(...errors);
                totalErrors += errors.length;
            }
        });

        if (fileErrors.length > 0) {
            errorsByFile.set(file, fileErrors);
        }
    }

    console.log(`\n✅ Total questions: ${totalQuestions}`);
    console.log(`❌ Total errors found: ${totalErrors}\n`);

    if (errorsByFile.size > 0) {
        console.log('📋 Errors by file:\n');

        for (const [file, errors] of errorsByFile.entries()) {
            console.log(`\n${'='.repeat(80)}`);
            console.log(`${file} - ${errors.length} errors`);
            console.log('='.repeat(80));
            errors.forEach(err => console.log(`\n${err}`));
        }

        // Summary
        console.log(`\n${'='.repeat(80)}`);
        console.log('SUMMARY');
        console.log('='.repeat(80));
        for (const [file, errors] of errorsByFile.entries()) {
            console.log(`${file}: ${errors.length} errors`);
        }
    } else {
        console.log('🎉 All questions passed validation!');
    }

    process.exit(totalErrors > 0 ? 1 : 0);
}

validateAllSubjects().catch(console.error);
