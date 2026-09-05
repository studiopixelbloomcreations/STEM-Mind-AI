import {
  runHarmonyCouncil,
  runTeacherAgent,
  runExplanationAgent,
  runVisualTeacherAgent,
  runStepByStepExplanationAgent,
  generateQuizTopic,
  runMotivatorAgent,
  runAnalyticsAgent,
} from '../../harmony/geminiHarmonyEngine';

export interface QuizQuestionPayload {
  question: string;
  questionType: 'MCQ' | 'NUMERICAL' | 'SHORT_ANSWER';
  choices?: string[];
  correctAnswer: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  syllabusRef?: string;
  examTips?: string;
  motivator?: string;
}

export interface TeachingStep {
  visual: string;
  caption: string;
  speech: string;
}

export async function fetchTopicForSubject(subject: string, grade: number = 10): Promise<string> {
  try {
    const topic = await generateQuizTopic(subject, grade);
    return topic || `${subject} Core Concepts`;
  } catch (err) {
    console.warn('[Harmony API] Topic generation fallback:', err);
    return `${subject} Fundamental Principles`;
  }
}

export async function generateQuestionFromCouncil(
  subject: string,
  topic: string,
  grade: number = 10,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  studentStats = {}
): Promise<QuizQuestionPayload> {
  try {
    const result = await runHarmonyCouncil(subject, topic, grade, difficulty, studentStats);
    if (result && result.question) {
      return {
        question: result.question,
        questionType: (result.questionType as any) || (result.choices?.length ? 'MCQ' : 'NUMERICAL'),
        choices: result.choices || undefined,
        correctAnswer: String(result.correctAnswer || ''),
        hint: result.hint || 'Remember the fundamental conservation laws.',
        difficulty: result.difficulty || difficulty,
        syllabusRef: result.syllabusRef || `Grade ${grade} ${subject}`,
        examTips: result.examTips || 'Watch for unit conversions and negative signs.',
        motivator: result.motivator || 'Take your time and read the question carefully.',
      };
    }
  } catch (err) {
    console.warn('[Harmony API] Council question generation fallback:', err);
  }

  // Robust curriculum-grounded fallback
  const fallbackBank: Record<string, QuizQuestionPayload[]> = {
    Physics: [
      {
        question: "A stone is dropped from the top of a 45m high cliff. Taking g = 10 m/s², what is the speed of the stone just before striking the ground?",
        questionType: "NUMERICAL",
        correctAnswer: "30",
        hint: "Use v² = u² + 2as with u = 0, a = 10, s = 45.",
        difficulty: "medium",
        syllabusRef: "GCE O/L Physics — Motion under gravity",
        examTips: "Write the equation first, substitute with standard SI units, then evaluate.",
        motivator: "You have all the variables — plug into v² = u² + 2as."
      },
      {
        question: "What is the equivalent resistance of a 6Ω resistor and a 3Ω resistor connected in parallel?",
        questionType: "NUMERICAL",
        correctAnswer: "2",
        hint: "1/R = 1/R1 + 1/R2 = 1/6 + 1/3.",
        difficulty: "easy",
        syllabusRef: "Grade 10 Science — Electric Circuits",
        examTips: "Parallel resistance is always smaller than the smallest branch resistor.",
        motivator: "Check your answer: 2Ω is less than 3Ω, so it makes physical sense!"
      }
    ],
    Mathematics: [
      {
        question: "Solve for x: 2x² - 8x = 0. What is the non-zero root?",
        questionType: "NUMERICAL",
        correctAnswer: "4",
        hint: "Factor out 2x: 2x(x - 4) = 0.",
        difficulty: "easy",
        syllabusRef: "Grade 10 Mathematics — Quadratic Equations",
        examTips: "Never divide both sides by x, or you lose the x = 0 root.",
        motivator: "Factorization is the cleanest path here."
      },
      {
        question: "If log₁₀(x) = 3, what is the value of x?",
        questionType: "NUMERICAL",
        correctAnswer: "1000",
        hint: "Rewrite in index form: x = 10³.",
        difficulty: "easy",
        syllabusRef: "Grade 11 Mathematics — Logarithms",
        examTips: "Remember: log_b(a) = c means b^c = a.",
        motivator: "Index form unlocks the answer directly."
      }
    ],
    Chemistry: [
      {
        question: "What is the mass of 0.5 moles of Calcium Carbonate (CaCO₃)? (Ar: Ca=40, C=12, O=16)",
        questionType: "NUMERICAL",
        correctAnswer: "50",
        hint: "Molar mass of CaCO₃ = 40 + 12 + 3(16) = 100 g/mol.",
        difficulty: "medium",
        syllabusRef: "Grade 11 Science — Mole concept",
        examTips: "Mass = moles × molar mass.",
        motivator: "Half a mole is half of 100g."
      }
    ]
  };

  const subjectBank = fallbackBank[subject] || fallbackBank['Physics'];
  const picked = subjectBank[Math.floor(Math.random() * subjectBank.length)];
  return picked;
}

export async function explainWrongAnswer(
  question: string,
  correctAnswer: string,
  wrongAnswer: string,
  eli10: boolean = false
): Promise<TeachingStep[]> {
  try {
    const steps = await runStepByStepExplanationAgent(question, correctAnswer, wrongAnswer, eli10);
    if (Array.isArray(steps) && steps.length > 0) {
      return steps;
    }
  } catch (err) {
    console.warn('[Harmony API] Step explanation fallback:', err);
  }

  return [
    {
      visual: `<div class="p-4 rounded-lg bg-[#1C202B] text-center"><span class="text-[#FF5C6C] line-through">${wrongAnswer}</span> <span class="mx-2">→</span> <span class="text-[#3DD9A4] font-bold">${correctAnswer}</span></div>`,
      caption: "Step 1: Identify the discrepancy.",
      speech: `Let's take this step by step. The correct value is ${correctAnswer}. Let's see how we arrive there.`
    },
    {
      visual: `<div class="p-4 rounded-lg bg-[#1C202B] font-mono text-center text-[#FFC15E]">Applied Formula: Result = ${correctAnswer}</div>`,
      caption: "Step 2: Apply the governing principle.",
      speech: `Substitute the known values into the equation to compute the exact result of ${correctAnswer}.`
    }
  ];
}
