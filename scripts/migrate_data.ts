import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_FILE = path.resolve(__dirname, '../data/questions.json');
const OUTPUT_DIR = path.resolve(__dirname, '../public/data');

interface Question {
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read source file
if (fs.existsSync(SOURCE_FILE)) {
    console.log(`Reading from ${SOURCE_FILE}...`);
    try {
        const data = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf-8'));

        // Iterate over keys (e.g., "English_Primary 3")
        for (const key in data) {
            const questions = data[key];
            const outputFile = path.join(OUTPUT_DIR, `${key}.json`);

            fs.writeFileSync(outputFile, JSON.stringify(questions, null, 2));
            console.log(`Created ${outputFile} with ${questions.length} questions.`);
        }
        console.log("Migration complete!");
    } catch (e) {
        console.error("Error reading or parsing source file:", e);
    }
} else {
    console.error(`Source file not found: ${SOURCE_FILE}`);
}
