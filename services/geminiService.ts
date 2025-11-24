import { Question, Subject, Grade } from "../types";
export const generateDailyQuestions = async (subject: Subject, grade: Grade): Promise<Question[]> => {
  const key = `${subject}_${grade}`;

  try {
    // Fetch from public/data folder
    const response = await fetch(`/data/${key}.json`);

    if (!response.ok) {
      throw new Error(`Failed to fetch questions for ${key}`);
    }

    const questions: Question[] = await response.json();

    if (!questions || questions.length === 0) {
      throw new Error("Empty question set");
    }

    // Shuffle and pick 10 (or fewer if not enough)
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);

  } catch (error) {
    console.warn(`Error loading questions for ${key}:`, error);
    return [{
      questionText: `No questions available for ${subject} (${grade}) yet!`,
      options: ["Check back later", "Generate more data", "Contact support", "Try another subject"],
      correctAnswerIndex: 0,
      explanation: "The question bank for this subject and grade is currently empty or could not be loaded."
    }];
  }
};
