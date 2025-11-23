import { GoogleGenAI, Type } from "@google/genai";
import { Question, Subject, Grade } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDailyQuestions = async (subject: Subject, grade: Grade): Promise<Question[]> => {
  const modelName = "gemini-2.5-flash";
  
  // Refined prompts for Singapore Top School Exam Standard (P3/P4)
  // Emphasizing Application, Heuristics, and Context over simple recall.
  let contextPrompt = "";
  switch (subject) {
    case Subject.ENGLISH:
      contextPrompt = grade === 'Primary 3' 
        ? "Generate challenging grammar questions (focus on tenses, prepositions, connectors) and vocabulary questions based on Singapore Primary 3 top school exam papers. Include tricky synthesis logic." 
        : "Generate high-difficulty grammar and vocabulary questions suitable for Singapore Primary 4 weighted assessments. Focus on phrasal verbs, subject-verb agreement, and complex synthesis rules.";
      break;
    case Subject.MATH:
      contextPrompt = grade === 'Primary 3'
        ? "Generate 'Problem Sum' style multiple choice questions. Focus on two-step word problems involving addition, subtraction, multiplication, and division. Include challenging money, length, and mass application questions."
        : "Generate challenging 'Heuristic' style word problems formatted as MCQs. Focus on factors/multiples, fractions, geometry (finding unknown angles), and logic questions common in Primary 4 SA1/SA2 papers.";
      break;
    case Subject.SCIENCE:
      contextPrompt = grade === 'Primary 3'
        ? "Focus on 'Application of Concepts' rather than definitions. Create scenarios involving classification of materials, plants vs fungi, and magnet strength experiments. Questions should require analyzing a situation."
        : "Focus on process skills: inferring, analyzing, and evaluating. Create questions based on experimental setups (Light, Heat, Matter, Cycles). Ask what happens if variables change. Mimic Section A of Singapore Science Exam papers.";
      break;
    case Subject.CHINESE:
      contextPrompt = `Generate challenging multiple choice questions for ${grade} Higher Chinese standard. Focus on: 1. Distinguishing similar-looking characters (形似字). 2. Choosing the correct vocabulary in context (词语搭配). 3. Hanyu Pinyin for tricky characters.`;
      break;
  }

  const prompt = `Act as a strict Singapore Primary School teacher setting a test paper.
  Generate 10 challenging multiple-choice questions for ${grade} students for the subject: ${subject}. 
  
  Specific Requirements:
  - ${contextPrompt}
  - The questions must be tricky and test deep understanding, similar to 'Section A' of a top school exam paper.
  - Options should be plausible distractors, not obvious wrong answers.
  - Return the result as a strict JSON array.`;

  try {
    const response = await ai.models.generateContent({
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
              correctAnswerIndex: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
              explanation: { type: Type.STRING, description: "A detailed explanation for the student, including why the other options are wrong if applicable." }
            },
            required: ["questionText", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Cleanup: Remove any markdown code blocks that might have slipped through
    // This ensures JSON.parse doesn't fail if the model adds ```json fences
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text) as Question[];
  } catch (error) {
    console.error("Error generating questions:", error);
    // Fallback in case of API error to prevent app crash
    return [
      {
        questionText: "Which planet is known as the Red Planet? (API Error Fallback)",
        options: ["Earth", "Mars", "Jupiter", "Venus"],
        correctAnswerIndex: 1,
        explanation: "Mars appears red due to iron oxide on its surface."
      }
    ];
  }
};