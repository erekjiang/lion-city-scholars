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

// Simple validation checks
function validateQuestion(q: Question, index: number, filename: string): string[] {
    const errors: string[] = [];

    // Check if correctAnswerIndex is valid
    if (q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length) {
        errors.push(`${filename} Q${index + 1}: Invalid correctAnswerIndex ${q.correctAnswerIndex} (options length: ${q.options.length})`);
    }

    // Check if explanation mentions the correct answer
    const correctAnswer = q.options[q.correctAnswerIndex];
    if (correctAnswer && !q.explanation.includes(correctAnswer.replace(/[^0-9]/g, ''))) {
        // Extract numbers from both
        const answerNum = correctAnswer.match(/\d+/);
        const explanationNums = q.explanation.match(/\d+/g);

        if (answerNum && explanationNums && !explanationNums.includes(answerNum[0])) {
            errors.push(`${filename} Q${index + 1}: Answer "${correctAnswer}" not found in explanation`);
        }
    }

    // Check for duplicate options
    const uniqueOptions = new Set(q.options);
    if (uniqueOptions.size !== q.options.length) {
        errors.push(`${filename} Q${index + 1}: Duplicate options found`);
    }

    // Check if question text is too short
    if (q.questionText.length < 10) {
        errors.push(`${filename} Q${index + 1}: Question text too short`);
    }

    return errors;
}

async function validateAllQuestions() {
    console.log('🔍 Validating all questions...\n');

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    let totalQuestions = 0;
    let totalErrors = 0;
    const allErrors: string[] = [];

    for (const file of files) {
        const filePath = path.join(DATA_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const questions: Question[] = JSON.parse(content);

        console.log(`📄 ${file}: ${questions.length} questions`);
        totalQuestions += questions.length;

        questions.forEach((q, idx) => {
            const errors = validateQuestion(q, idx, file);
            if (errors.length > 0) {
                allErrors.push(...errors);
                totalErrors += errors.length;
            }
        });
    }

    console.log(`\n✅ Total questions: ${totalQuestions}`);
    console.log(`❌ Total errors found: ${totalErrors}\n`);

    if (allErrors.length > 0) {
        console.log('📋 Errors:\n');
        allErrors.forEach(err => console.log(`  - ${err}`));
    } else {
        console.log('🎉 All questions passed validation!');
    }
}

validateAllQuestions().catch(console.error);
