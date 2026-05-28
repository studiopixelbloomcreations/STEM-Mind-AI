import { getProviderKey } from '../config/config';

// Base API endpoints and model specifications for our multi-agent council
const PROVIDERS = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'google/gemini-2.5-flash',
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: 'open-mixtral-8x22b',
  },
  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
  },
  huggingface: {
    url: 'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct/v1/chat/completions',
    model: 'meta-llama/Meta-Llama-3-8B-Instruct',
  }
};

/**
 * Executes a chat completion request to a specific provider.
 */
async function callProvider(provider, messages, responseFormat = null, temperature = 0.7) {
  const apiKey = getProviderKey(provider);
  if (!apiKey) {
    throw new Error(`API key for provider "${provider}" is not configured.`);
  }

  const config = PROVIDERS[provider];
  const headers = {
    'Content-Type': 'application/json',
  };

  // Add auth headers based on provider specification
  if (provider === 'huggingface' || provider === 'mistral' || provider === 'groq' || provider === 'deepseek') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (provider === 'openrouter') {
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'STEMMind AI';
  }

  const body = {
    model: config.model,
    messages: messages,
    temperature: temperature,
  };

  if (responseFormat) {
    body['response_format'] = responseFormat;
  }

  const response = await fetch(config.url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Provider ${provider} failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Simple routing helper to select an available active provider.
 * Follows a defined list of preferences or falls back gracefully.
 */
function getActiveProvider(exclude = []) {
  const preferences = ['groq', 'openrouter', 'mistral', 'deepseek', 'huggingface'];
  for (const provider of preferences) {
    if (!exclude.includes(provider) && getProviderKey(provider)) {
      return provider;
    }
  }
  // Try any active key
  for (const provider of preferences) {
    if (getProviderKey(provider)) {
      return provider;
    }
  }
  throw new Error('No active API keys found in VITE_PI_MODEL_API_KEYS_JSON. Please verify env vars.');
}

/**
 * Generates five syllabus-aligned topic suggestions for the selected grade and subject.
 * The topics reference Sri Lankan government curriculum expectations without relying on static lists.
 */
export async function generateQuizTopic(subject, grade) {
  const provider = getActiveProvider();
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

  const response = await callProvider(provider, [{ role: 'user', content: prompt }], null, 0.95);

  try {
    const parsed = JSON.parse(response.replace(/```json|```/g, '').trim());
    const topics = Array.isArray(parsed.topics) ? parsed.topics : [];

    return topics.slice(0, 5).map((entry) => ({
      topic: entry.topic || 'General topic',
      syllabusReference: entry.syllabusReference || 'Sri Lankan government syllabus alignment',
      whyRelevant: entry.whyRelevant || 'AI-generated syllabus-aligned topic.'
    }));
  } catch (err) {
    const fallbackLines = response.replace(/```json|```/g, '').trim().split('\n').map(line => line.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
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
  const provider = getActiveProvider();
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

  const response = await callProvider(provider, [{ role: 'user', content: prompt }]);
  try {
    return JSON.parse(response.replace(/```json|```/g, '').trim());
  } catch (err) {
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
  const provider = getActiveProvider();
  const prompt = `You are the Difficulty AI. 
Review the student performance history: Correct answers: ${studentPerformance.correctCount}, Incorrect answers: ${studentPerformance.incorrectCount}, Average time: ${studentPerformance.avgTime}s.
Active difficulty: "${currentDifficulty}".
Recommend the next difficulty level ("easy", "medium", or "hard") and explain your decision.
Output JSON only:
{
  "recommendedDifficulty": "easy" | "medium" | "hard",
  "reason": "explanation of dynamic difficulty adjustment"
}`;

  const response = await callProvider(provider, [{ role: 'user', content: prompt }]);
  try {
    return JSON.parse(response.replace(/```json|```/g, '').trim());
  } catch (err) {
    return { recommendedDifficulty: currentDifficulty, reason: "Maintain current flow" };
  }
}

/**
 * 3. EXPLANATION AI: Simplifies concepts and provides "Explain Like I'm 10" (ELI10) toggles.
 */
export async function runExplanationAgent(question, correctAnswer, wrongAnswer, eli10 = false) {
  const provider = getActiveProvider();
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
  const provider = getActiveProvider();
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
  const provider = getActiveProvider();
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
  const provider = getActiveProvider();
  const prompt = `You are the Analytics AI.
Analyze the following quiz history records: ${JSON.stringify(history)}.
Determine the student's primary strengths, weaknesses, and a concrete study recommendation.
Output JSON only:
{
  "strengths": ["list of topic strengths"],
  "weaknesses": ["list of topic weaknesses"],
  "recommendations": ["study actions to take"]
}`;

  const response = await callProvider(provider, [{ role: 'user', content: prompt }]);
  try {
    return JSON.parse(response.replace(/```json|```/g, '').trim());
  } catch (err) {
    return { strengths: [], weaknesses: [], recommendations: ["Keep practicing regularly"] };
  }
}

/**
 * 7. COUNCIL LEADER AI (Fusion & Scoring Engine):
 * Collects and scores quality of outputs from all agents and merges them.
 */
export async function runHarmonyCouncil(subject, topic, grade, currentDifficulty, studentStats, lastQuizState = null) {
  // 1. Difficulty agent adjusts difficulty
  let difficulty = currentDifficulty;
  let diffReason = "Starting topic assessment.";
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
  let examTips = "";
  try {
    examTips = await runExamCoachAgent(questionData.question, topic);
  } catch (e) {
    examTips = "Read the question carefully and eliminate obviously incorrect choices first.";
  }

  // 4. Motivator adds encouraging greeting
  let motivatorQuote = "";
  try {
    motivatorQuote = await runMotivatorAgent(true, studentStats?.streak || 0);
  } catch (e) {
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
  if (!questionData.question) score -= 30;
  if (questionData.questionType === 'MCQ' && (!questionData.choices || questionData.choices.length < 2)) score -= 30;
  if (!questionData.correctAnswer) score -= 20;
  if (!questionData.hints || questionData.hints.length === 0) score -= 10;
  return Math.max(10, score);
}

/**
 * 8. VISUAL TEACHER AI: Generates step-by-step visual lessons and voice narratives.
 */
export async function runVisualTeacherAgent(question, correctAnswer, simplerMode = false) {
  const provider = getActiveProvider();
  const simplicityPrompt = simplerMode 
    ? "Break this down even further with extremely simple real-world analogies, drawing basic pictures using HTML symbols or icons, like explaining to a 5-year-old child."
    : "Break this down into easy mathematical steps with high-fidelity visual diagrams (HTML styled mathematical boxes, equations, colored steps).";

  const prompt = `You are the Visual Teacher AI.
Question: "${question}"
Correct Answer: "${correctAnswer}"

${simplicityPrompt}

Generate exactly 3 to 5 sequential steps to teach the student how to solve this. For each step, create:
1. "visual": A beautifully styled HTML snippet (using inline CSS) that represents a live diagram, formula, math box, or step-by-step progress visually. Do NOT include paragraphs of text or captions here. Keep it to math expressions, colored text, symbols, or blocks.
2. "speech": What you will explain using voice narration (friendly, direct, clear explanation).

Output a raw JSON array of objects only. Do NOT wrap in markdown code blocks.
Format:
[
  {
    "visual": "<div style='font-size:24px; color:#8b5cf6; text-align:center; padding:10px;'>x^2 + 5x + 6 = 0</div>",
    "speech": "Let's start by looking at our quadratic equation. We need to find two numbers that multiply to six and add up to five."
  }
]`;

  const response = await callProvider(provider, [{ role: 'user', content: prompt }]);
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
  const provider = getActiveProvider();
  const simplicityPrompt = eli10 
    ? "Explain like I am 10 years old, using super simple analogies and basic visual symbols." 
    : "Provide a clear, high-quality step-by-step academic breakdown with professional visual diagrams.";

  const prompt = `You are the Explanation AI. The student answered incorrectly.
Question: "${question}"
Correct Answer: "${correctAnswer}"
Student's Answer: "${wrongAnswer}"

${simplicityPrompt}

Break the explanation down into 3 to 5 logical steps so the student can follow along easily. For each step, provide:
1. "visual": A beautifully styled HTML snippet (using inline CSS) that represents a live diagram, formula, math box, or step-by-step progress visually. Use colored text, math expressions, symbols, arrows, or highlighted boxes. Keep it visual and minimal — no long paragraphs.
2. "caption": A text summary of this step that will remain on-screen for the student to read.
3. "speech": The friendly spoken voice narration explaining this step in detail.

Output a raw JSON array of objects only. Do NOT wrap in markdown code blocks.
Format:
[
  {
    "visual": "<div style='font-size:22px; color:#ef4444; text-align:center; padding:16px;'><span style='text-decoration:line-through;'>Student: wrong</span> → <span style='color:#10b981;'>Correct: right</span></div>",
    "caption": "Step 1: Understand the core numbers.",
    "speech": "First, let's look at the terms. The coefficient of the middle term is five, and the constant is six."
  }
]`;

  const response = await callProvider(provider, [{ role: 'user', content: prompt }]);
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

