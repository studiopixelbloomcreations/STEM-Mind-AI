import { getGeminiApiKey } from '../services/geminiLiveService';

const GEMINI_HARMONY_MODEL = import.meta.env.VITE_GEMINI_HARMONY_MODEL || 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const GEMINI_ORCHESTRATOR_PROMPT =
  'You are the Gemini Harmony Orchestrator for STEMMind AI. ' +
  'Every specialist agent is powered by Gemini, but each agent must stay in its own role. ' +
  'The platform teaches STEM to grade 9, grade 10, and grade 11 students. ' +
  'Prefer Sri Lankan school curriculum alignment when grade and subject are provided. ' +
  'Be accurate, concise, supportive, and age-appropriate.';

const AGENT_SYSTEM_PROMPTS = {
  curriculum:
    `${GEMINI_ORCHESTRATOR_PROMPT} You are the Curriculum Advisor Agent. Generate fresh syllabus-aligned STEM learning topics.`,
  teacher:
    `${GEMINI_ORCHESTRATOR_PROMPT} You are the Teacher AI Agent. Generate high-quality assessment questions and hints.`,
  difficulty:
    `${GEMINI_ORCHESTRATOR_PROMPT} You are the Difficulty AI Agent. Adapt challenge level from student performance evidence.`,
  explanation:
    `${GEMINI_ORCHESTRATOR_PROMPT} You are the Explainer AI Agent. Explain concepts clearly and diagnose wrong answers.`,
  examCoach:
    `${GEMINI_ORCHESTRATOR_PROMPT} You are the Exam Coach AI Agent. Give exam strategy, shortcuts, and common mistake warnings.`,
  motivator:
    `${GEMINI_ORCHESTRATOR_PROMPT} You are the Motivator AI Agent. Encourage students with specific, non-generic support.`,
  analytics:
    `${GEMINI_ORCHESTRATOR_PROMPT} You are the Analytics AI Agent. Detect learning patterns, strengths, weaknesses, and next actions.`,
  council:
    `${GEMINI_ORCHESTRATOR_PROMPT} You are the Council Leader Agent. Fuse Gemini specialist outputs into one polished learning payload.`,
  visualTeacher:
    `${GEMINI_ORCHESTRATOR_PROMPT} You are the Visual Teacher AI Agent. Create super-simple, engaging step-by-step visual lessons and friendly voice narration as if teaching a 10-year-old.`,
  stepExplainer:
    `${GEMINI_ORCHESTRATOR_PROMPT} You are the Step-by-Step Explainer AI Agent. Break wrong answers into super-simple visual, narrated repair steps as if teaching a 10-year-old.`,
  imageAnalyzer:
    `${GEMINI_ORCHESTRATOR_PROMPT} You are the Image Analyzer AI Agent. Analyze the actual uploaded or captured camera frame as current visual evidence before teaching from it.`,
};

const cleanJsonText = (text) => String(text || '').replace(/```json|```/g, '').trim();

const toGeminiParts = (message) => {
  if (Array.isArray(message.parts)) return message.parts;
  return [{ text: String(message.content || '') }];
};

/**
 * Executes a Gemini GenerateContent request for a specific Harmony agent role.
 */
async function callGeminiAgent(agentName, messages, responseFormat = null, temperature = 0.7) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Set VITE_GEMINI_API_KEY in Vercel or your local .env file.');
  }

  const body = {
    systemInstruction: {
      parts: [{ text: AGENT_SYSTEM_PROMPTS[agentName] || GEMINI_ORCHESTRATOR_PROMPT }],
    },
    contents: messages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: toGeminiParts(message),
    })),
    generationConfig: {
      temperature,
    },
  };

  if (responseFormat?.type === 'json_object') {
    body.generationConfig.responseMimeType = 'application/json';
  }

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${encodeURIComponent(GEMINI_HARMONY_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
    method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Harmony agent "${agentName}" failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error(`Gemini Harmony agent "${agentName}" returned an empty response.`);
  }

  return text;
}

/**
 * Compatibility wrapper so the copied Harmony agent code keeps its original shape.
 */
async function callProvider(agentName, messages, responseFormat = null, temperature = 0.7) {
  return callGeminiAgent(agentName, messages, responseFormat, temperature);
}

/**
 * Generates five syllabus-aligned topic suggestions for the selected grade and subject.
 * The topics reference Sri Lankan government curriculum expectations without relying on static lists.
 */
export async function generateQuizTopic(subject, grade) {
  const provider = 'curriculum';
  const prompt = `You are a Sri Lankan curriculum advisor for STEMMind AI.
Generate a completely fresh set of 5 distinct, syllabus-aligned quiz topics for Grade ${grade} ${subject} using the Sri Lankan government school curriculum expectations.
The topics must be different from each other and should avoid repeating similar subtopics or phrasing. Use varied angles, examples, or applications that still fit the syllabus.
Return only a raw JSON object with this exact structure:
{
  "topics": [
    {
      "topic": "Specific topic name",
      "syllabusReference": "Short note on how it aligns with the Sri Lankan government syllabus",
      "whyRelevant": "One sentence explaining why this topic fits the selected grade and subject"
    },
    ... exactly 5 objects total
  ]
}
Do not include markdown formatting or extra explanations.`;

  const response = await callProvider(provider, [{ role: 'user', content: prompt }], { type: 'json_object' }, 0.95);

  try {
    const parsed = JSON.parse(cleanJsonText(response));
    const topics = Array.isArray(parsed.topics) ? parsed.topics : [];

    return topics.slice(0, 5).map((entry) => ({
      topic: entry.topic || 'General topic',
      syllabusReference: entry.syllabusReference || 'Sri Lankan government syllabus alignment',
      whyRelevant: entry.whyRelevant || 'AI-generated syllabus-aligned topic.'
    }));
  } catch {
    const fallbackLines = cleanJsonText(response).split('\n').map(line => line.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
    const fallbackTopics = fallbackLines.slice(0, 5);

    return fallbackTopics.map((topic, index) => ({
      topic: topic || `${subject} Fundamentals ${index + 1}`,
      syllabusReference: 'Sri Lankan government syllabus alignment',
      whyRelevant: 'AI-generated syllabus-aligned topic.'
    }));
  }
}

/**
 * 1. TEACHER AI: Generates educational question sets and quizzes.
 */
export async function runTeacherAgent(subject, topic, grade, difficulty) {
  const provider = 'teacher';
  const prompt = `You are the Teacher AI for STEMMind AI, a premium adaptive educational platform.
Generate a high-quality assessment quiz question for Grade ${grade} on the topic "${topic}" in the subject "${subject}" at a "${difficulty}" level.
The question must fit a professional STEM curriculum.
You must output a raw JSON object only. Do not wrap in markdown code blocks.
JSON Format:
{
  "question": "The question text",
  "questionType": "MCQ" | "True/False" | "Fill in the blank" | "Short Answer",
  "choices": ["choice A", "choice B", "choice C", "choice D"], // Null if not MCQ
  "correctAnswer": "The correct answer value",
  "hints": ["Hint 1", "Hint 2"]
}`;

  const response = await callProvider(provider, [{ role: 'user', content: prompt }], { type: 'json_object' }, 0.7);
  try {
    return JSON.parse(cleanJsonText(response));
  } catch {
    // If not JSON, parse text and build a basic representation
    return {
      question: response,
      questionType: "Short Answer",
      choices: null,
      correctAnswer: "Please review",
      hints: ["Pay close attention to key terms"]
    };
  }
}

/**
 * 2. DIFFICULTY AI: Evaluates current student stats and calculates adaptive offsets.
 */
export async function runDifficultyAgent(studentPerformance, currentDifficulty) {
  const provider = 'difficulty';
  const prompt = `You are the Difficulty AI. 
Review the student performance history: Correct answers: ${studentPerformance.correctCount}, Incorrect answers: ${studentPerformance.incorrectCount}, Average time: ${studentPerformance.avgTime}s.
Active difficulty: "${currentDifficulty}".
Recommend the next difficulty level ("easy", "medium", or "hard") and explain your decision.
Output JSON only:
{
  "recommendedDifficulty": "easy" | "medium" | "hard",
  "reason": "explanation of dynamic difficulty adjustment"
}`;

  const response = await callProvider(provider, [{ role: 'user', content: prompt }], { type: 'json_object' }, 0.35);
  try {
    return JSON.parse(cleanJsonText(response));
  } catch {
    return { recommendedDifficulty: currentDifficulty, reason: "Maintain current flow" };
  }
}

/**
 * 3. EXPLANATION AI: Simplifies concepts and provides "Explain Like I'm 10" (ELI10) toggles.
 */
export async function runExplanationAgent(question, correctAnswer, wrongAnswer, eli10 = false) {
  const provider = 'explanation';
  const modePrompt = eli10 ? "Explain like I am 10 years old, using simple, visual analogies." : "Provide a clear, formal academic explanation.";
  const prompt = `You are the Explanation AI.
Question: "${question}"
Correct Answer: "${correctAnswer}"
Student Answer: "${wrongAnswer}"
${modePrompt}
Explain why the correct answer is right and why the student's answer is incorrect.
Output plain explanation text.`;

  return await callProvider(provider, [{ role: 'user', content: prompt }]);
}

/**
 * 4. EXAM COACH AI: Delivers strategies, common mistakes, and time-saving shortcuts.
 */
export async function runExamCoachAgent(question, topic) {
  const provider = 'examCoach';
  const prompt = `You are the Exam Coach AI.
Topic: "${topic}"
Question: "${question}"
List 2-3 specific exam tips, common errors students make under time pressure, or calculation shortcuts for this type of problem.
Output plain tips text.`;

  return await callProvider(provider, [{ role: 'user', content: prompt }]);
}

/**
 * 5. MOTIVATOR AI: Celebrates progress and provides constructive reinforcement.
 */
export async function runMotivatorAgent(isCorrect, streakCount) {
  const provider = 'motivator';
  const prompt = `You are the Motivator AI.
The student answered the last question ${isCorrect ? 'CORRECTLY' : 'INCORRECTLY'}.
Current Answer Streak: ${streakCount}.
Generate a single-sentence encouraging, highly supportive statement to keep them engaged. Do not sound generic or robotic.
Output plain text.`;

  return await callProvider(provider, [{ role: 'user', content: prompt }]);
}

/**
 * 6. ANALYTICS AI: Detects patterns, strengths, and recommendations.
 */
export async function runAnalyticsAgent(history) {
  const provider = 'analytics';
  const prompt = `You are the Analytics AI.
Analyze the following quiz history records: ${JSON.stringify(history)}.
Determine the student's primary strengths, weaknesses, and a concrete study recommendation.
Output JSON only:
{
  "strengths": ["list of topic strengths"],
  "weaknesses": ["list of topic weaknesses"],
  "recommendations": ["study actions to take"]
}`;

  const response = await callProvider(provider, [{ role: 'user', content: prompt }], { type: 'json_object' }, 0.35);
  try {
    return JSON.parse(cleanJsonText(response));
  } catch {
    return { strengths: [], weaknesses: [], recommendations: ["Keep practicing regularly"] };
  }
}

/**
 * IMAGE ANALYZER AI: Reads the actual camera/upload frame before the Visual Teacher turns it into a lesson.
 */
export async function runImageAnalyzerAgent({
  base64Image,
  mimeType = 'image/jpeg',
  subject = 'STEM',
  topic = 'General worksheet analysis',
  grade = null,
}) {
  if (!base64Image) {
    throw new Error('Image Analyzer AI needs an image frame.');
  }

  const prompt = `You are the Gemini Image Analyzer AI for STEMMind AI.
Analyze the actual provided image frame, not generic examples.
Context:
- Subject: ${subject || 'STEM'}
- Topic: ${topic || 'General worksheet analysis'}
- Grade: ${grade || '9-11'}

Your job:
1. Describe what is actually visible in the frame.
2. Extract readable worksheet/text/math/science content if present.
3. If the frame contains an object instead of a worksheet, identify the object from the image evidence and connect it to STEM.
4. Do not invent text, answers, or objects that are not visible.
5. If the image is blurry, blocked, or unclear, say that clearly in warnings.

Return only a raw JSON object:
{
  "extractedText": "Readable text/math from the image, or a clear visible-object description if no text exists",
  "confidence": 0-100,
  "warnings": ["short warning strings"],
  "summary": "1-2 sentence understanding based on the actual image",
  "structuredSteps": [
    {
      "title": "Step or observation title",
      "explanation": "Teaching-ready explanation grounded in the image"
    }
  ]
}`;

  const response = await callProvider(
    'imageAnalyzer',
    [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
    { type: 'json_object' },
    0.25
  );

  const parsed = JSON.parse(cleanJsonText(response));
  const structuredSteps = Array.isArray(parsed.structuredSteps) ? parsed.structuredSteps : [];
  const warnings = Array.isArray(parsed.warnings) ? parsed.warnings.filter(Boolean) : [];

  return {
    extractedText: String(parsed.extractedText || '').trim(),
    confidence: Number.isFinite(Number(parsed.confidence))
      ? Math.max(0, Math.min(100, Number(parsed.confidence)))
      : 70,
    warnings,
    structuredSteps: structuredSteps.slice(0, 6).map((step, index) => ({
      title: step?.title || `Observation ${index + 1}`,
      explanation: step?.explanation || '',
    })),
    summary: String(parsed.summary || '').trim(),
    provider: `gemini-image-analyzer:${GEMINI_HARMONY_MODEL}`,
  };
}

// Gemini Harmony keeps the copied multi-agent council active. The original Harmony file is preserved separately.
export const HARMONY_SYSTEM_DISABLED = false;

/**
 * 7. COUNCIL LEADER AI (Fusion & Scoring Engine):
 * Collects and scores quality of outputs from all agents and merges them.
 */
export async function runHarmonyCouncil(subject, topic, grade, currentDifficulty, studentStats, lastQuizState = null) {
  const lastQuizContext = lastQuizState
    ? ` Previous quiz context for continuity: ${JSON.stringify(lastQuizState).slice(0, 1200)}`
    : '';

  if (HARMONY_SYSTEM_DISABLED) {
    try {
      console.log(`[Harmony Engine] Bypassing council for single Gemini query on ${topic} (${subject})`);
      const provider = 'council';
      const systemPrompt = `You are a professional STEM teacher generating a high-quality assessment quiz question for Grade ${grade} on the topic "${topic}" in the subject "${subject}" at a "${currentDifficulty}" level.${lastQuizContext}
Return a raw JSON object ONLY.
Format:
{
  "question": "The question text",
  "choices": ["choice A", "choice B", "choice C", "choice D"],
  "correctAnswer": "The correct answer value matching one choice exactly",
  "hints": ["Hint 1", "Hint 2"],
  "examTips": "Strategic advice for answering",
  "motivatorQuote": "An encouraging quote to motivate the student"
}`;

      const response = await callProvider(provider, [{ role: 'user', content: systemPrompt }], { type: 'json_object' }, 0.5);
      const cleanedResponse = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);

      return {
        subject,
        topic,
        grade,
        difficulty: currentDifficulty,
        diffReason: "Adaptive single-turn Gemini reasoning engine.",
        question: parsed.question,
        questionType: 'MCQ',
        choices: parsed.choices,
        correctAnswer: parsed.correctAnswer,
        hints: parsed.hints || ["Think carefully"],
        examTips: parsed.examTips || "Read the options thoroughly.",
        motivatorQuote: parsed.motivatorQuote || "You've got this, keep going!",
        confidenceScore: 98
      };
    } catch (e) {
      console.warn("Single Gemini generation failed, falling back to multi-agent council:", e);
    }
  }

  // Original Harmony multi-agent council system remains fully intact as a fallback:
  // 1. Difficulty agent adjusts difficulty
  let difficulty = currentDifficulty;
  let diffReason = `Starting Gemini Harmony assessment.${lastQuizContext}`;
  if (studentStats && studentStats.history && studentStats.history.length > 0) {
    try {
      const diffResult = await runDifficultyAgent(studentStats, currentDifficulty);
      difficulty = diffResult.recommendedDifficulty;
      diffReason = diffResult.reason;
    } catch (e) {
      console.warn("Difficulty agent failed, continuing with current difficulty", e);
    }
  }

  // 2. Teacher agent generates question
  const questionData = await runTeacherAgent(subject, topic, grade, difficulty);

  // 3. Exam Coach adds strategic advice
  let examTips;
  try {
    examTips = await runExamCoachAgent(questionData.question, topic);
  } catch {
    examTips = "Read the question carefully and eliminate obviously incorrect choices first.";
  }

  // 4. Motivator adds encouraging greeting
  let motivatorQuote;
  try {
    motivatorQuote = await runMotivatorAgent(true, studentStats?.streak || 0);
  } catch {
    motivatorQuote = "Let's work together to conquer this topic!";
  }

  // Confidence score evaluating suitability
  const confidenceScore = evaluateConfidence(questionData, grade);

  // Fuse everything into the finalized educational payload
  return {
    subject,
    topic,
    grade,
    difficulty,
    diffReason,
    question: questionData.question,
    questionType: questionData.questionType || 'MCQ',
    choices: questionData.choices,
    correctAnswer: questionData.correctAnswer,
    hints: questionData.hints || ["Use elimination"],
    examTips,
    motivatorQuote,
    confidenceScore
  };
}

/**
 * Evaluates the confidence score of the generated payload.
 */
function evaluateConfidence(questionData, grade) {
  let score = 100;
  if (![9, 10, 11].includes(Number(grade))) score -= 5;
  if (!questionData.question) score -= 30;
  if (questionData.questionType === 'MCQ' && (!questionData.choices || questionData.choices.length < 2)) score -= 30;
  if (!questionData.correctAnswer) score -= 20;
  if (!questionData.hints || questionData.hints.length === 0) score -= 10;
  return Math.max(10, score);
}

/**
 * Derive teachable question prompts from a vision-analyze payload.
 */
export function extractVisionTeachingQuestions(analysis = {}) {
  const extractedText = String(analysis.extractedText || '').trim();
  const summary = String(analysis.summary || '').trim();
  const numbered = extractedText
    .split(/\n(?=\s*\d+[.):/-]\s+)/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  if (numbered.length > 1) return numbered;

  const questionMarks = extractedText
    .split(/\n(?=[^\n]*\?)/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.includes('?'));
  if (questionMarks.length > 1) return questionMarks;

  const structuredSteps = Array.isArray(analysis.structuredSteps) ? analysis.structuredSteps : [];
  if (structuredSteps.length > 1) {
    return structuredSteps.map((step, index) => {
      const title = step?.title || `Problem ${index + 1}`;
      const explanation = step?.explanation || '';
      return `${title}${explanation ? `: ${explanation}` : ''}`.trim();
    });
  }

  if (extractedText) return [extractedText];
  if (summary) return [summary];
  return ['Work through this worksheet problem step by step.'];
}

export function visionTeachingAnswerFor(analysis = {}) {
  const summary = String(analysis.summary || '').trim();
  const steps = Array.isArray(analysis.structuredSteps) ? analysis.structuredSteps : [];
  if (summary) return summary;
  if (steps.length > 0) {
    const last = steps[steps.length - 1];
    return `${last?.title || 'Solution'}: ${last?.explanation || ''}`.trim();
  }
  return 'Use the structured solution from the worksheet analysis.';
}

/**
 * 8. VISUAL TEACHER AI: Generates step-by-step visual lessons and voice narratives.
 */
export async function runVisualTeacherAgent(question, correctAnswer, simplerMode = false) {
  const provider = 'visualTeacher';
  const simplicityPrompt = simplerMode 
    ? "Break this down like the student is 10 years old and still confused. Use tiny steps, real-world analogies, and playful visual cues."
    : "Break this down like the student is 10 years old. Use simple words, friendly analogies, and engaging visual cues.";

  const prompt = `You are the Visual Teacher AI.
Question: "${question}"
Correct Answer: "${correctAnswer}"

${simplicityPrompt}

Generate exactly 3 to 5 sequential steps to teach the student how to solve this. For each step, create:
1. "visual": An engaging HTML snippet (using inline CSS) that feels like a lively mini whiteboard: clear shapes, arrows, labels, color, progress, simple symbols, or equation blocks. Keep it clean and readable, not robotic. Do NOT include long paragraphs.
2. "speech": Friendly voice narration in very simple language, as if explaining to a 10-year-old. Keep it short and warm.

Output a raw JSON array of objects only. Do NOT wrap in markdown code blocks.
Format:
[
  {
    "visual": "<div style='font-size:24px; color:#8b5cf6; text-align:center; padding:10px;'>x^2 + 5x + 6 = 0</div>",
    "speech": "Let's start by looking at our quadratic equation. We need to find two numbers that multiply to six and add up to five."
  }
]`;

  const response = await callProvider(provider, [{ role: 'user', content: prompt }], null, 0.65);
  try {
    return JSON.parse(response.replace(/```json|```/g, '').trim());
  } catch (err) {
    console.error("Failed to parse visual teacher payload:", err, response);
    return [
      {
        visual: `<div style="font-size:20px; color:#ef4444; text-align:center;">Question: ${question}</div>`,
        speech: `Let's work through this question. The correct answer is ${correctAnswer}.`
      }
    ];
  }
}

/**
 * 9. STEP-BY-STEP EXPLANATION AI: Generates structured sequence of explanations for wrong answers.
 */
export async function runStepByStepExplanationAgent(question, correctAnswer, wrongAnswer, eli10 = false) {
  const provider = 'stepExplainer';
  const simplicityPrompt = eli10 
    ? "Explain like I am 10 years old and still confused, using super simple analogies and friendly visual symbols." 
    : "Explain like I am 10 years old, using clear steps, simple language, and engaging visual symbols.";

  const prompt = `You are the Explanation AI. The student answered incorrectly.
Question: "${question}"
Correct Answer: "${correctAnswer}"
Student's Answer: "${wrongAnswer}"

${simplicityPrompt}

Break the explanation down into 3 to 5 logical steps so the student can follow along easily. For each step, provide:
1. "visual": An engaging HTML snippet (using inline CSS) that represents a lively mini whiteboard. Use colored text, simple shapes, math expressions, symbols, arrows, or highlighted boxes. Keep it visual and minimal with no long paragraphs.
2. "caption": A text summary of this step that will remain on-screen for the student to read.
3. "speech": Friendly spoken voice narration in simple 10-year-old-level language.

Output a raw JSON array of objects only. Do NOT wrap in markdown code blocks.
Format:
[
  {
    "visual": "<div style='font-size:22px; color:#ef4444; text-align:center; padding:16px;'><span style='text-decoration:line-through;'>Student: wrong</span> → <span style='color:#10b981;'>Correct: right</span></div>",
    "caption": "Step 1: Understand the core numbers.",
    "speech": "First, let's look at the terms. The coefficient of the middle term is five, and the constant is six."
  }
]`;

  const response = await callProvider(provider, [{ role: 'user', content: prompt }], null, 0.65);
  try {
    return JSON.parse(response.replace(/```json|```/g, '').trim());
  } catch (err) {
    console.error("Failed to parse step-by-step explanation payload:", err, response);
    return [
      {
        visual: `<div style="font-size:20px; color:#ef4444; text-align:center;">Question: ${question}<br/><span style='color:#10b981;'>Answer: ${correctAnswer}</span></div>`,
        caption: `Incorrect answer. The correct value is ${correctAnswer}.`,
        speech: `Your answer was incorrect. Let's look at the correct solution which is ${correctAnswer}.`
      }
    ];
  }
}
