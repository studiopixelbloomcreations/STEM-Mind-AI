import { liveAsk } from './geminiLiveSession';

const GEMINI_ORCHESTRATOR_PROMPT =
  'You are the Gemini Live Harmony Orchestrator for STEMMind AI. ' +
  'Every specialist agent is powered by Gemini Live, but each agent must stay in its own role. ' +
  'The platform teaches STEM to grade 9, grade 10, and grade 11 students. ' +
  'Prefer Sri Lankan school curriculum alignment when grade and subject are provided. ' +
  'Be accurate, concise, supportive, and age-appropriate.';

const AGENT_SYSTEM_PROMPTS = {
  curriculum: `${GEMINI_ORCHESTRATOR_PROMPT} You are the Curriculum Advisor Agent. Generate fresh syllabus-aligned STEM learning topics.`,
  teacher: `${GEMINI_ORCHESTRATOR_PROMPT} You are the Teacher AI Agent. Generate high-quality assessment questions and hints.`,
  difficulty: `${GEMINI_ORCHESTRATOR_PROMPT} You are the Difficulty AI Agent. Adapt challenge level from student performance evidence.`,
  explanation: `${GEMINI_ORCHESTRATOR_PROMPT} You are the Explainer AI Agent. Explain concepts clearly and diagnose wrong answers.`,
  examCoach: `${GEMINI_ORCHESTRATOR_PROMPT} You are the Exam Coach AI Agent. Give exam strategy, shortcuts, and common mistake warnings.`,
  motivator: `${GEMINI_ORCHESTRATOR_PROMPT} You are the Motivator AI Agent. Encourage students with specific, non-generic support.`,
  analytics: `${GEMINI_ORCHESTRATOR_PROMPT} You are the Analytics AI Agent. Detect learning patterns, strengths, weaknesses, and next actions.`,
  visualTeacher: `${GEMINI_ORCHESTRATOR_PROMPT} You are the Visual Teacher AI Agent. Create super-simple, engaging step-by-step visual lessons and friendly voice narration as if teaching a 10-year-old.`,
  stepExplainer: `${GEMINI_ORCHESTRATOR_PROMPT} You are the Step-by-Step Explainer AI Agent. Break wrong answers into super-simple visual, narrated repair steps as if teaching a 10-year-old.`,
  imageAnalyzer: `${GEMINI_ORCHESTRATOR_PROMPT} You are the Image Analyzer AI Agent. Analyze the actual uploaded or captured camera frame as current visual evidence before teaching from it.`,
};

const cleanJsonText = (text) => String(text || '').replace(/```json|```/g, '').trim();

const extractJson = (text) => {
  const cleaned = cleanJsonText(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) return JSON.parse(objectMatch[0]);
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) return JSON.parse(arrayMatch[0]);
    throw new Error('Gemini Live did not return valid JSON.');
  }
};

async function callLiveAgent(agentName, prompt, { temperature = 0.7, json = false, images = [], timeoutMs = 45000 } = {}) {
  const systemInstruction = AGENT_SYSTEM_PROMPTS[agentName] || GEMINI_ORCHESTRATOR_PROMPT;
  const fullPrompt = json
    ? `${prompt}\n\nReturn ONLY valid JSON. Do not wrap it in markdown.`
    : prompt;

  const text = await liveAsk({
    systemInstruction,
    prompt: fullPrompt,
    images,
    modality: 'TEXT',
    temperature,
    timeoutMs,
  });

  if (!String(text || '').trim()) {
    throw new Error(`Gemini Live agent "${agentName}" returned an empty response.`);
  }
  return text;
}

export async function generateQuizTopic(subject, grade) {
  const prompt = `You are a Sri Lankan curriculum advisor for STEMMind AI.
Generate a completely fresh set of 5 distinct, syllabus-aligned quiz topics for Grade ${grade} ${subject} using the Sri Lankan government school curriculum expectations.
The topics must be different from each other and should avoid repeating similar subtopics or phrasing.
Return only a raw JSON object with this exact structure:
{
  "topics": [
    {
      "topic": "Specific topic name",
      "syllabusReference": "Short note on how it aligns with the Sri Lankan government syllabus",
      "whyRelevant": "One sentence explaining why this topic fits the selected grade and subject"
    }
  ]
}
Exactly 5 objects.`;

  const response = await callLiveAgent('curriculum', prompt, { json: true, temperature: 0.95 });
  try {
    const parsed = extractJson(response);
    const topics = Array.isArray(parsed.topics) ? parsed.topics : [];
    return topics.slice(0, 5).map((entry, index) => ({
      topic: entry.topic || `${subject} Topic ${index + 1}`,
      syllabusReference: entry.syllabusReference || 'Sri Lankan government syllabus alignment',
      whyRelevant: entry.whyRelevant || 'AI-generated syllabus-aligned topic.',
    }));
  } catch {
    return [
      {
        topic: `${subject} Fundamentals`,
        syllabusReference: 'Sri Lankan government syllabus alignment',
        whyRelevant: 'Fallback topic after a Live parse issue.',
      },
    ];
  }
}

export async function runTeacherAgent(subject, topic, grade, difficulty) {
  const prompt = `Generate a high-quality assessment quiz question for Grade ${grade} on the topic "${topic}" in the subject "${subject}" at a "${difficulty}" level.
JSON Format:
{
  "question": "The question text",
  "questionType": "MCQ" | "True/False" | "Fill in the blank" | "Short Answer",
  "choices": ["choice A", "choice B", "choice C", "choice D"],
  "correctAnswer": "The correct answer value",
  "hints": ["Hint 1", "Hint 2"]
}
If the type is not MCQ, set choices to null.`;

  const response = await callLiveAgent('teacher', prompt, { json: true, temperature: 0.7 });
  try {
    return extractJson(response);
  } catch {
    return {
      question: response,
      questionType: 'Short Answer',
      choices: null,
      correctAnswer: 'Please review',
      hints: ['Pay close attention to key terms'],
    };
  }
}

export async function runDifficultyAgent(studentPerformance, currentDifficulty) {
  const prompt = `Review the student performance history:
Correct answers: ${studentPerformance.correctCount ?? 0}
Incorrect answers: ${studentPerformance.incorrectCount ?? 0}
Average time: ${studentPerformance.avgTime ?? 0}s
Recent attempts: ${JSON.stringify(studentPerformance.history || []).slice(0, 1800)}
Active difficulty: "${currentDifficulty}".
Recommend the next difficulty level.
Output JSON only:
{
  "recommendedDifficulty": "easy" | "medium" | "hard",
  "reason": "explanation of dynamic difficulty adjustment"
}`;

  const response = await callLiveAgent('difficulty', prompt, { json: true, temperature: 0.35 });
  try {
    return extractJson(response);
  } catch {
    return { recommendedDifficulty: currentDifficulty, reason: 'Maintain current flow' };
  }
}

export async function runExplanationAgent(question, correctAnswer, wrongAnswer, eli10 = false) {
  const modePrompt = eli10
    ? 'Explain like I am 10 years old, using simple, visual analogies.'
    : 'Provide a clear, formal academic explanation.';
  const prompt = `Question: "${question}"
Correct Answer: "${correctAnswer}"
Student Answer: "${wrongAnswer}"
${modePrompt}
Explain why the correct answer is right and why the student's answer is incorrect.
Output plain explanation text.`;
  return callLiveAgent('explanation', prompt, { temperature: 0.5 });
}

export async function runExamCoachAgent(question, topic) {
  const prompt = `Topic: "${topic}"
Question: "${question}"
List 2-3 specific exam tips, common errors students make under time pressure, or calculation shortcuts for this type of problem.
Output plain tips text.`;
  return callLiveAgent('examCoach', prompt, { temperature: 0.5 });
}

export async function runMotivatorAgent(isCorrect, streakCount) {
  const prompt = `The student answered the last question ${isCorrect ? 'CORRECTLY' : 'INCORRECTLY'}.
Current Answer Streak: ${streakCount}.
Generate a single-sentence encouraging, highly supportive statement to keep them engaged. Do not sound generic or robotic.
Output plain text.`;
  return callLiveAgent('motivator', prompt, { temperature: 0.8 });
}

export async function runAnalyticsAgent(history) {
  const prompt = `Analyze the following quiz history records: ${JSON.stringify(history)}.
Determine the student's primary strengths, weaknesses, and a concrete study recommendation.
Output JSON only:
{
  "strengths": ["list of topic strengths"],
  "weaknesses": ["list of topic weaknesses"],
  "recommendations": ["study actions to take"]
}`;
  const response = await callLiveAgent('analytics', prompt, { json: true, temperature: 0.35 });
  try {
    return extractJson(response);
  } catch {
    return { strengths: [], weaknesses: [], recommendations: ['Keep practicing regularly'] };
  }
}

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

  const prompt = `Analyze the actual provided image frame, not generic examples.
Context:
- Subject: ${subject || 'STEM'}
- Topic: ${topic || 'General worksheet analysis'}
- Grade: ${grade || '9-11'}

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
    { "title": "Step or observation title", "explanation": "Teaching-ready explanation grounded in the image" }
  ]
}`;

  const response = await callLiveAgent('imageAnalyzer', prompt, {
    json: true,
    temperature: 0.25,
    timeoutMs: 60000,
    images: [{ mimeType, data: base64Image }],
  });

  const parsed = extractJson(response);
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
    provider: 'gemini-live-image-analyzer',
  };
}

export async function runHarmonyCouncil(subject, topic, grade, currentDifficulty, studentStats) {
  let difficulty = currentDifficulty;
  let diffReason = 'Starting Gemini Live Harmony assessment.';
  const history = studentStats?.history || [];

  if (history.length > 0) {
    try {
      const performance = {
        history,
        correctCount: studentStats.correctCount ?? history.filter((item) => item.correct).length,
        incorrectCount: studentStats.incorrectCount ?? history.filter((item) => !item.correct).length,
        avgTime: studentStats.avgTime ?? 0,
      };
      const diffResult = await runDifficultyAgent(performance, currentDifficulty);
      difficulty = diffResult.recommendedDifficulty || currentDifficulty;
      diffReason = diffResult.reason || diffReason;
    } catch (error) {
      console.warn('Difficulty agent failed, continuing with current difficulty', error);
    }
  }

  const questionData = await runTeacherAgent(subject, topic, grade, difficulty);

  const [examTips, motivatorQuote] = await Promise.all([
    runExamCoachAgent(questionData.question, topic).catch(
      () => 'Read the question carefully and eliminate obviously incorrect choices first.'
    ),
    runMotivatorAgent(true, studentStats?.streak || 0).catch(
      () => "Let's work together to conquer this topic!"
    ),
  ]);

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
    hints: questionData.hints || ['Use elimination'],
    examTips,
    motivatorQuote,
    confidenceScore: evaluateConfidence(questionData, grade),
  };
}

function evaluateConfidence(questionData, grade) {
  let score = 100;
  if (![9, 10, 11].includes(Number(grade))) score -= 5;
  if (!questionData.question) score -= 30;
  if (questionData.questionType === 'MCQ' && (!questionData.choices || questionData.choices.length < 2)) score -= 30;
  if (!questionData.correctAnswer) score -= 20;
  if (!questionData.hints || questionData.hints.length === 0) score -= 10;
  return Math.max(10, score);
}

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

export async function runVisualTeacherAgent(question, correctAnswer, simplerMode = false) {
  const simplicityPrompt = simplerMode
    ? 'Break this down like the student is 10 years old and still confused. Use tiny steps, real-world analogies, and playful visual cues.'
    : 'Break this down like the student is 10 years old. Use simple words, friendly analogies, and engaging visual cues.';

  const prompt = `Question: "${question}"
Correct Answer: "${correctAnswer}"
${simplicityPrompt}

Generate exactly 3 to 5 sequential steps to teach the student how to solve this. For each step, create:
1. "visual": An engaging HTML snippet (using inline CSS) that feels like a lively mini whiteboard. Allowed tags: div, span, p, strong, em, br. No scripts.
2. "speech": Friendly voice narration in very simple language. Keep it short and warm.

Output a raw JSON array of objects only.`;

  const response = await callLiveAgent('visualTeacher', prompt, { json: true, temperature: 0.65 });
  try {
    const parsed = extractJson(response);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [
      {
        visual: `<div style="font-size:20px; color:#ef4444; text-align:center;">Question: ${question}</div>`,
        speech: `Let's work through this question. The correct answer is ${correctAnswer}.`,
      },
    ];
  }
}

export async function runStepByStepExplanationAgent(question, correctAnswer, wrongAnswer, eli10 = false) {
  const simplicityPrompt = eli10
    ? 'Explain like I am 10 years old and still confused, using super simple analogies and friendly visual symbols.'
    : 'Explain like I am 10 years old, using clear steps, simple language, and engaging visual symbols.';

  const prompt = `The student answered incorrectly.
Question: "${question}"
Correct Answer: "${correctAnswer}"
Student's Answer: "${wrongAnswer}"
${simplicityPrompt}

Break the explanation down into 3 to 5 logical steps. For each step, provide:
1. "visual": An engaging HTML snippet using only div/span/p/strong/em/br and inline CSS.
2. "caption": A text summary of this step.
3. "speech": Friendly spoken voice narration.

Output a raw JSON array of objects only.`;

  const response = await callLiveAgent('stepExplainer', prompt, { json: true, temperature: 0.65 });
  try {
    const parsed = extractJson(response);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [
      {
        visual: `<div style="font-size:20px; color:#ef4444; text-align:center;">Question: ${question}<br/><span style="color:#10b981;">Answer: ${correctAnswer}</span></div>`,
        caption: `Incorrect answer. The correct value is ${correctAnswer}.`,
        speech: `Your answer was incorrect. Let's look at the correct solution which is ${correctAnswer}.`,
      },
    ];
  }
}
