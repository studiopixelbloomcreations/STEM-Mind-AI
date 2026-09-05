import {
  runHarmonyCouncil,
  runTeacherAgent,
  generateSingleSessionQuestion,
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

export interface SessionTeachingStep {
  stepNumber: number;
  title: string;
  visual: string;
  speech: string;
}

export interface SessionQuestion {
  id: string;
  question: string;
  questionType: 'MCQ' | 'NUMERICAL' | 'SHORT_ANSWER';
  choices?: string[];
  correctAnswer: string;
  hint: string;
  howToApproach: string;
  syllabusRef?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  teachingSteps: SessionTeachingStep[];
}

export interface TopicSuggestion {
  topic: string;
  syllabusReference: string;
  whyRelevant: string;
}

function reportHarmonyDegradation(agent: string, error: unknown) {
  console.error(
    `%c[HARMONY AGENT DEGRADATION] ${agent} failed! Fallback engaged. Check model status:`,
    'background: #FF5C6C; color: #FFFFFF; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
    error
  );
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ai-harmony-fallback-alert', {
        detail: {
          agent,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
        },
      })
    );
  }
}

export async function fetchTopicSuggestions(subject: string, grade: number = 10): Promise<TopicSuggestion[]> {
  try {
    const raw = await generateQuizTopic(subject, grade);
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((t: any, i: number) => ({
        topic: typeof t === 'string' ? t : t.topic || `${subject} Unit ${i + 1}`,
        syllabusReference: t.syllabusReference || `Sri Lankan NIE Syllabus — Grade ${grade} ${subject}`,
        whyRelevant: t.whyRelevant || `Core curricular focus for Grade ${grade}.`,
      }));
    }
  } catch (err) {
    reportHarmonyDegradation('Curriculum Topic Suggestions', err);
    console.warn('[Harmony API] Topic suggestions fallback:', err);
  }

  // Authentic Sri Lankan syllabus fallback topics
  const fallbackTopicsMap: Record<string, TopicSuggestion[]> = {
    Science: [
      { topic: 'Motion & Newton\'s Laws', syllabusReference: 'Unit 4 Mechanics', whyRelevant: 'Essential physics foundation for G.C.E. O/L.' },
      { topic: 'Chemical Bonding & Electronegativity', syllabusReference: 'Unit 7 Chemical Systems', whyRelevant: 'Determines reactivity and physical properties of materials.' },
      { topic: 'Cell Division: Mitosis and Meiosis', syllabusReference: 'Unit 3 Cellular Biology', whyRelevant: 'Underpins genetics and inheritance.' },
      { topic: 'Electric Current & Ohm\'s Law', syllabusReference: 'Unit 12 Current Electricity', whyRelevant: 'Core calculation unit in terminal exams.' },
      { topic: 'Acids, Bases, and pH Indicators', syllabusReference: 'Unit 9 Inorganic Chemistry', whyRelevant: 'Frequently tested in structured essay components.' },
    ],
    Mathematics: [
      { topic: 'Quadratic Equations & Roots', syllabusReference: 'Unit 14 Algebra', whyRelevant: 'Standard Part B paper problem solving.' },
      { topic: 'Theorem of Pythagoras & Riders', syllabusReference: 'Unit 18 Geometry', whyRelevant: 'High-mark geometric proofs in G.C.E. O/L.' },
      { topic: 'Logarithms & Indices', syllabusReference: 'Unit 6 Number Systems', whyRelevant: 'Computational speed requirement for exams.' },
      { topic: 'Trigonometric Ratios & Angles', syllabusReference: 'Unit 22 Applied Trigonometry', whyRelevant: 'Heights and distances word problems.' },
      { topic: 'Probability & Cumulative Frequencies', syllabusReference: 'Unit 26 Statistics', whyRelevant: 'Data analysis and structured probability trees.' },
    ],
  };

  return fallbackTopicsMap[subject] || [
    { topic: `${subject} Core Principles`, syllabusReference: `Grade ${grade} National Syllabus`, whyRelevant: 'Fundamental topic competency.' },
    { topic: `${subject} Applied Problem Solving`, syllabusReference: `Grade ${grade} National Syllabus`, whyRelevant: 'Higher-order conceptual analysis.' },
    { topic: `${subject} Theoretical Derivations`, syllabusReference: `Grade ${grade} National Syllabus`, whyRelevant: 'Essential definitions and laws.' },
    { topic: `${subject} Unit Systems & Analysis`, syllabusReference: `Grade ${grade} National Syllabus`, whyRelevant: 'Eliminates common marking scheme mark losses.' },
    { topic: `${subject} Review & Diagnostic Frontier`, syllabusReference: `Grade ${grade} National Syllabus`, whyRelevant: 'Identifies immediate revision requirements.' },
  ];
}

export async function fetchTopicForSubject(subject: string, grade: number = 10): Promise<string> {
  const suggestions = await fetchTopicSuggestions(subject, grade);
  return suggestions[0]?.topic || `${subject} Core Principles`;
}

/**
 * Concurrently generates all 5 questions for a session upfront in parallel (Section 1.3 & Section 6).
 * Pre-generates each question's:
 * - Hint content
 * - "How to approach this" general technique note
 * - Step-by-step deconstructed whiteboard teaching derivations (visual + voice narration)
 */
export async function generateFullSessionConcurrently(
  subject: string,
  topic: string,
  grade: number = 10,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  onProgress?: (completed: number, total: number) => void
): Promise<SessionQuestion[]> {
  const TOTAL_QUESTIONS = 5;
  let completedCount = 0;

  const generateSingleWorker = async (questionIndex: number): Promise<SessionQuestion> => {
    try {
      // 16-second timeout guard per parallel request
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Question generation timed out after 16s')), 16000)
      );

      const workerPromise = generateSingleSessionQuestion(subject, topic, grade, difficulty, questionIndex);
      const raw = await Promise.race([workerPromise, timeoutPromise]);

      if (raw && raw.question) {
        completedCount += 1;
        onProgress?.(completedCount, TOTAL_QUESTIONS);

        return {
          id: `q-${questionIndex}-${Date.now()}`,
          question: raw.question,
          questionType: 'MCQ',
          choices: Array.isArray(raw.choices) && raw.choices.length >= 2 ? raw.choices : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: String(raw.correctAnswer || (raw.choices && raw.choices[0]) || 'Option A'),
          hint: raw.hint || 'Review the given conditions and eliminate options that contradict the governing law.',
          howToApproach: raw.howToApproach || 'Identify the known variables first, write down the applicable relationship or formula, and verify units before calculating.',
          syllabusRef: raw.syllabusRef || `Grade ${grade} ${subject} — ${topic}`,
          difficulty: raw.difficulty || difficulty,
          teachingSteps: Array.isArray(raw.teachingSteps) && raw.teachingSteps.length > 0
            ? raw.teachingSteps.map((s: any, idx: number) => ({
                stepNumber: s.stepNumber || idx + 1,
                title: s.title || `Step ${idx + 1}: Analyze the Concept`,
                visual: s.visual || `<div style="padding:14px; text-align:center; font-family:monospace; font-weight:bold;">${raw.question}</div>`,
                speech: s.speech || `In this step, we observe the key conditions given in the problem.`,
              }))
            : [
                {
                  stepNumber: 1,
                  title: 'Identify the Given Information',
                  visual: `<div style="padding:14px; border:1px solid #38bdf8; border-radius:8px; text-align:center;">Read the problem parameters carefully.</div>`,
                  speech: `Let us begin by identifying what the question has given us, and what quantity we are asked to find.`,
                },
                {
                  stepNumber: 2,
                  title: 'Apply the Governing Formula',
                  visual: `<div style="padding:14px; border:1px solid #34d399; border-radius:8px; text-align:center;">Substitute standard SI units into the formula.</div>`,
                  speech: `Now, we choose the formula connecting these variables and substitute our known numbers with great care.`,
                },
                {
                  stepNumber: 3,
                  title: 'Verify the Final Derivation',
                  visual: `<div style="padding:14px; border:1px solid #fbbf24; border-radius:8px; text-align:center;">Result verified: ${raw.correctAnswer || 'Correct Solution'}</div>`,
                  speech: `Finally, calculate the numerical result and verify that the magnitude makes physical sense.`,
                },
              ],
        };
      }
      throw new Error('Malformed payload');
    } catch (err) {
      reportHarmonyDegradation(`Question #${questionIndex} Worker`, err);
      // Section 0 Core Principle: Never substitute fake content on total failure
      throw err;
    }
  };

  // Launch all 5 workers in parallel with a micro-stagger to avoid burst quota limits
  try {
    const promises = Array.from({ length: TOTAL_QUESTIONS }, async (_, i) => {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, i * 200));
      }
      return generateSingleWorker(i + 1);
    });
    return await Promise.all(promises);
  } catch (err: any) {
    throw new Error(
      `We're having trouble reaching NexLearn's AI right now — please try again in a moment.`
    );
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
    reportHarmonyDegradation('Council Question Generator', err);
    console.warn('[Harmony API] Council question generation failed:', err);
    throw err;
  }

  throw new Error(`AI Council was unable to formulate question for ${subject} — ${topic}. Please retry.`);
}

export async function explainWrongAnswer(
  question: string,
  correctAnswer: string,
  wrongAnswer: string,
  eli10 = false
): Promise<TeachingStep[]> {
  try {
    const steps = await runStepByStepExplanationAgent(question, correctAnswer, wrongAnswer, eli10);
    if (Array.isArray(steps) && steps.length > 0) {
      return steps.map((s) => ({
        visual: s.visual || `<div style="font-size:18px; text-align:center;">${question}</div>`,
        caption: s.caption || 'Analyze the relationship.',
        speech: s.speech || `The correct answer is ${correctAnswer}.`,
      }));
    }
  } catch (err) {
    reportHarmonyDegradation('Step-by-Step Explanation Agent', err);
    throw err;
  }

  return [];
}
