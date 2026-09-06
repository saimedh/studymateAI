import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'StudyMate AI', geminiKeyConfigured: !!process.env.GEMINI_API_KEY });
});

// Backend System and Sync Status Endpoint (Strictly server-side execution verification)
app.get('/api/system/status', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    executionEnvironment: 'backend-server',
    geminiFlashVision: 'gemini-3.8-flash',
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
    firestoreDatabaseId: 'ai-studio-studymateai-8272d6d6-84fd-42d1-a40b-28b92f956ed9',
    realtimeSyncEnabled: true,
    serverTimestamp: new Date().toISOString()
  });
});

// Lazy Google GenAI Client
let aiInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

// Resilient Gemini invoker with model fallback and exponential backoff
async function generateWithRetry(params: any, retries = 2, delayMs = 600) {
  const ai = getGenAI();
  const primaryModel = params.model || 'gemini-3.8-flash';
  const candidateModels = Array.from(new Set([
    primaryModel,
    'gemini-3.8-flash',
    'gemini-3.6-flash',
    'gemini-flash-latest'
  ]));

  let lastError: any = null;
  for (const modelToUse of candidateModels) {
    let currentDelay = delayMs;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await ai.models.generateContent({
          ...params,
          model: modelToUse
        });
      } catch (err: any) {
        lastError = err;
        const msg = err.message || '';
        const isCapacity =
          err.status === 503 ||
          msg.includes('503') ||
          msg.includes('high demand') ||
          err.status === 429 ||
          msg.includes('RESOURCE_EXHAUSTED');
        if (isCapacity && attempt < retries) {
          console.warn(`Gemini (${modelToUse}) transient capacity notice, retrying in ${currentDelay}ms...`);
          await new Promise(r => setTimeout(r, currentDelay));
          currentDelay *= 2;
          continue;
        }
        break;
      }
    }
  }
  throw lastError;
}

// Utility to clean markdown fences from LLM responses before JSON parsing
function parseCleanJSON<T>(rawText: string, fallback: T): T {
  try {
    let clean = rawText.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    return JSON.parse(clean);
  } catch (err) {
    console.error('Failed to parse JSON from AI response:', rawText, err);
    return fallback;
  }
}

// -------------------------------------------------------------
// 1. AI TUTOR (Multi-turn conversational interaction with Gemini API)
// -------------------------------------------------------------
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { messages, mode = 'simple', studyMaterialText, materialName, subjectName, visionCategory } = req.body;
    const hasImage = !!req.body.imageInlineData?.data;

    let modeInstruction = '';
    switch (mode) {
      case 'simple':
        modeInstruction = 'Explain with high clarity, everyday relatable real-world analogies, and simple intuition as if teaching a bright beginner. Avoid unnecessary jargon.';
        break;
      case 'exam':
        modeInstruction = 'Deliver an exam-focused, rubric-driven explanation. Emphasize formal definitions, step-by-step derivations, marking scheme points, and common exam traps.';
        break;
      case 'deep':
        modeInstruction = 'Provide deep technical rigor: underlying mathematical formulations, algorithmic complexity, architectural trade-offs, and graduate-level conceptual depth.';
        break;
      case 'revision':
        modeInstruction = 'Deliver an ultra-concise, high-yield bulleted summary. Focus on formulas, key rules, and memory tricks for rapid 30-second review.';
        break;
      case 'feynman':
        modeInstruction = 'FEYNMAN TECHNIQUE SIMULATOR: The student is trying to explain this concept to you in their own words. Act as a curious, inquisitive novice student (smart 10-year-old). Do NOT give long lectures. Instead, highlight any unexplained jargon they use, ask "Why does that happen?", find missing logical steps, and ask for simpler everyday analogies until their explanation is bulletproof.';
        break;
      case 'debate':
        modeInstruction = 'ACADEMIC DEBATE PARTNER: Act as an intellectual sparring partner and devil\'s advocate. Respectfully challenge the student\'s assertions, test edge cases, probe architectural or mathematical trade-offs, and ask for justifications to prepare them for oral exams and defense.';
        break;
    }

    const visionInstruction = hasImage ? `
MULTIMODAL GEMINI FLASH VISION GUIDELINES:
The student has provided an image attachment for visual analysis (Category: ${(visionCategory || 'general').toUpperCase()}).
You must thoroughly analyze this image using Gemini Flash Vision:
1. DIAGRAMS & SCHEMATICS: If the image depicts a system diagram, flow chart, circuit schematic, anatomical diagram, or chemical pathway, identify each component, symbol, flow direction, and explain the overall architecture and behavior.
2. HANDWRITTEN NOTES: If the image contains handwritten notes, sketches, or lecture whiteboard captures, transcribe the text accurately, interpret any scribbles or abbreviations, and summarize the key educational insights with clean formatting.
3. FORMULAS & CALCULATIONS: If the image contains mathematical equations or scientific derivations, transcribe them in clean LaTeX/Markdown formatting, specify all variables and constants with appropriate physical units, check for algebraic errors in the student's work, and provide a clear step-by-step solution.
4. Format all equations cleanly and provide pedagogical explanations that reinforce understanding.
` : '';

    const systemPrompt = `You are StudyMate AI, an expert agentic collegiate tutor for ${subjectName || 'college subjects'}.
Mode: ${mode.toUpperCase()} (${modeInstruction})
${visionInstruction}
Grounding Rules:
${studyMaterialText ? `
CRITICAL STUDY MATERIAL GROUNDING:
The student has provided their lecture notes / study material (${materialName || 'Uploaded Notes'}):
"""
${studyMaterialText.slice(0, 15000)}
"""
1. PRIORITIZE the uploaded study material above all else.
2. If the user asks a question about the document and the answer CANNOT be found or inferred from the uploaded study material, state clearly: "I couldn't find this information in your uploaded study material." Then provide a general conceptual overview clearly marked as extra knowledge.
3. NEVER hallucinate or fabricate facts about the uploaded material.
` : 'Provide rigorous, pedagogically sound educational assistance.'}

Multi-turn Rules:
1. Maintain continuity with the prior conversational turns. Refer back to previously discussed concepts or examples when relevant.
2. At the very end of your response, after a horizontal rule (---), always provide a list of 3 relevant follow-up options under the header "**Suggested Next Steps:**" formatted as numbered bullet points.`;

    // Process and validate multi-turn conversation turns
    const rawMessages = Array.isArray(messages) ? messages : [];
    const contents: { role: 'user' | 'model'; parts: any[] }[] = [];

    for (let idx = 0; idx < rawMessages.length; idx++) {
      const msg = rawMessages[idx];
      if (!msg || !msg.content || typeof msg.content !== 'string' || !msg.content.trim()) continue;
      const role: 'user' | 'model' = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';

      // Ensure conversation begins with a user turn (ignore leading assistant greeting)
      if (contents.length === 0 && role === 'model') {
        continue;
      }

      // Check if this is the last user message and has attached image
      const isLastUserTurn = (role === 'user' && idx === rawMessages.length - 1);
      const parts: any[] = [{ text: msg.content.trim() }];

      if (isLastUserTurn && req.body.imageInlineData?.data) {
        parts.unshift({
          inlineData: {
            mimeType: req.body.imageInlineData.mimeType || 'image/jpeg',
            data: req.body.imageInlineData.data
          }
        });
      }

      // Merge consecutive turns of the same role to maintain strict alternation
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += '\n\n' + msg.content.trim();
        if (isLastUserTurn && req.body.imageInlineData?.data) {
          contents[contents.length - 1].parts.unshift({
            inlineData: {
              mimeType: req.body.imageInlineData.mimeType || 'image/jpeg',
              data: req.body.imageInlineData.data
            }
          });
        }
      } else {
        contents.push({
          role,
          parts
        });
      }
    }

    // Fallback if no user message was provided
    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Hello, please help guide my study session today.' }] });
    }

    const response = await generateWithRetry({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    const replyText = response.text || '';

    // Extract dynamic follow-up options if present
    const followUps: string[] = [];
    const splitSections = replyText.split(/\*\*Suggested Next Steps:\*\*|\*\*Next Steps:\*\*/i);
    if (splitSections.length > 1) {
      const followUpSection = splitSections[1];
      const lines = followUpSection.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        const cleaned = line.replace(/^\d+[\.\)]\s*|\*+\s*|-\s*/g, '').replace(/[*_"]/g, '').trim();
        if (cleaned && cleaned.length > 3 && cleaned.length < 120) {
          followUps.push(cleaned);
        }
      }
    }

    res.json({
      reply: replyText,
      suggestedFollowUps: followUps.slice(0, 4)
    });
  } catch (error: any) {
    console.error('AI Tutor error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate tutor response' });
  }
});

// -------------------------------------------------------------
// 2. SMART SUMMARY (TL;DR, key concepts, definitions, formulas, mistakes)
// -------------------------------------------------------------
app.post('/api/ai/summarize', async (req: Request, res: Response) => {
  try {
    const { materialText, materialName, summaryType = 'detailed' } = req.body;
    if (!materialText) {
      return res.status(400).json({ error: 'Material text is required' });
    }

    const ai = getGenAI();
    const prompt = `Analyze the following study material ("${materialName || 'Study Material'}") and generate a comprehensive ${summaryType} study summary in valid JSON format.

Material:
"""
${materialText.slice(0, 20000)}
"""

You must respond with ONLY valid JSON with this exact structure:
{
  "tldr": "2-3 sentence executive overview",
  "keyConcepts": [
    { "title": "Concept Name", "explanation": "Clear explanation" }
  ],
  "definitions": [
    { "term": "Term", "definition": "Academic definition" }
  ],
  "importantFormulas": [
    { "name": "Formula Name", "formula": "LaTeX or plain text equation", "explanation": "What variables mean" }
  ],
  "importantExamples": [
    { "topic": "Concept", "example": "Concrete illustrative example" }
  ],
  "examImportantPoints": [
    "High-yield point 1",
    "High-yield point 2"
  ],
  "commonMistakes": [
    { "mistake": "What students get wrong", "correction": "How to get it right" }
  ]
}`;

    const response = await generateWithRetry({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const parsed = parseCleanJSON(response.text || '{}', {
      tldr: 'Study summary generated.',
      keyConcepts: [],
      definitions: [],
      importantFormulas: [],
      importantExamples: [],
      examImportantPoints: [],
      commonMistakes: []
    });

    res.json({ summary: { ...parsed, summaryType, generatedAt: new Date().toISOString() } });
  } catch (error: any) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate summary' });
  }
});

// -------------------------------------------------------------
// 3. QUIZ GENERATOR (MCQ, True/False, Short Answer, Difficulty)
// -------------------------------------------------------------
app.post('/api/ai/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { subjectName, topic, materialText, numQuestions = 5, difficulty = 'medium', questionType = 'mixed' } = req.body;

    const ai = getGenAI();
    const prompt = `You are an academic exam writer. Generate an adaptive quiz for university students studying ${subjectName}.
Topic: ${topic}
Target Difficulty: ${difficulty.toUpperCase()}
Number of Questions: ${numQuestions}
Requested Question Format: ${questionType.toUpperCase()} (options: MCQ, True/False, Short Answer, or a balanced mix)

${materialText ? `Base the questions primarily on this study material:
"""
${materialText.slice(0, 15000)}
"""` : ''}

CRITICAL RULES:
1. Every question must test deep conceptual understanding, calculation, or application—not trivial trivia.
2. For MCQ, provide exactly 4 distinct plausible options (A, B, C, D).
3. Do not give away the answer inside the question stem.
4. Provide a thorough, pedagogically clear explanation for why the correct answer is right and why distractors fail.

Respond ONLY with a JSON array of questions matching this schema:
[
  {
    "id": "q1",
    "question": "The question text...",
    "type": "mcq" | "true_false" | "short_answer",
    "options": ["Option A", "Option B", "Option C", "Option D"], // required for mcq and true_false
    "correctAnswer": "Exact text matching the correct option or model answer",
    "explanation": "Why this is correct...",
    "topic": "${topic}",
    "difficulty": "${difficulty}"
  }
]`;

    const response = await generateWithRetry({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const questions = parseCleanJSON(response.text || '[]', []);
    res.json({ questions });
  } catch (error: any) {
    console.error('Quiz Generator error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate quiz' });
  }
});

// -------------------------------------------------------------
// 4. ANSWER EVALUATOR (Evaluates student's conceptual answer)
// -------------------------------------------------------------
app.post('/api/ai/evaluate-answer', async (req: Request, res: Response) => {
  try {
    const { question, studentAnswer, expectedAnswerContext, topic } = req.body;

    if (!question || !studentAnswer) {
      return res.status(400).json({ error: 'Question and student answer are required' });
    }

    const ai = getGenAI();
    const prompt = `You are a fair, discerning university professor evaluating a student's answer.
Topic: ${topic || 'Academic'}
Question: "${question}"
Student's Submitted Answer: "${studentAnswer}"
${expectedAnswerContext ? `Reference Key / Context: "${expectedAnswerContext}"` : ''}

Evaluate the student's submission comprehensively. Return ONLY a JSON object:
{
  "score": 7, // integer 0 to 10
  "correctness": "correct" | "partially_correct" | "incorrect",
  "conceptualUnderstanding": "A 1-2 sentence assessment of their fundamental understanding",
  "whatYouDidWell": [
    "Specific point or definition the student got right"
  ],
  "missingPoints": [
    "Crucial elements, mathematical terms, or steps that were left out"
  ],
  "accuracyAnalysis": "Detailed constructive commentary on precision and terminology",
  "improvementSuggestions": [
    "Actionable tip to elevate this answer to 10/10"
  ],
  "modelAnswer": "The ideal, high-scoring university exam level answer to this question"
}`;

    const response = await generateWithRetry({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const evaluation = parseCleanJSON(response.text || '{}', {
      score: 5,
      correctness: 'partially_correct',
      conceptualUnderstanding: 'Evaluation completed.',
      whatYouDidWell: ['Addressed the question prompt'],
      missingPoints: ['Needs more technical elaboration'],
      accuracyAnalysis: 'Good initial attempt.',
      improvementSuggestions: ['Include formal definitions and key formulas.'],
      modelAnswer: 'A complete model answer would include all definitions and calculus derivations.'
    });

    res.json({ evaluation });
  } catch (error: any) {
    console.error('Answer evaluation error:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate answer' });
  }
});

// -------------------------------------------------------------
// 5. FLASHCARDS GENERATOR
// -------------------------------------------------------------
app.post('/api/ai/generate-flashcards', async (req: Request, res: Response) => {
  try {
    const { topic, materialText, count = 6, difficulty = 'medium' } = req.body;

    const ai = getGenAI();
    const prompt = `Generate ${count} high-impact active recall flashcards for college students studying: "${topic}".
${materialText ? `Based strictly on this study material:
"""
${materialText.slice(0, 15000)}
"""` : ''}

Requirements:
- Front: A direct, punchy question, prompt, or scenario that tests a key concept or formula.
- Back: A crisp, comprehensive explanation with the answer and key intuition (2-4 sentences).

Return ONLY a JSON array:
[
  {
    "topic": "${topic}",
    "front": "Front question...",
    "back": "Back explanation...",
    "difficulty": "${difficulty}",
    "status": "new",
    "reviewCount": 0
  }
]`;

    const response = await generateWithRetry({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const cards = parseCleanJSON(response.text || '[]', []);
    res.json({ cards });
  } catch (error: any) {
    console.error('Flashcards generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate flashcards' });
  }
});

// -------------------------------------------------------------
// 6. PERSONALIZED STUDY PLAN GENERATOR (Prioritizes weak topics)
// -------------------------------------------------------------
app.post('/api/ai/generate-study-plan', async (req: Request, res: Response) => {
  try {
    const { subjectName, examDate, dailyHours = 1.5, currentLevel = 'Intermediate', targetScore = '90%', weakTopics = [], topics = [] } = req.body;

    const ai = getGenAI();
    const prompt = `Create an intelligent, adaptive college study plan.
Subject: ${subjectName}
Exam Date: ${examDate}
Daily Available Hours: ${dailyHours} hours/day
Current Level: ${currentLevel}
Target Score: ${targetScore}
Student's Detected Weak Topics (PRIORITIZE THESE FIRST): ${JSON.stringify(weakTopics)}
All Course Topics: ${JSON.stringify(topics)}

Generate a day-by-day study schedule (5-7 days) prioritizing the student's weakest topics first with a mix of learning, quiz, practice, and revision activities.

Return ONLY a JSON array of days:
[
  {
    "dayNumber": 1,
    "dateStr": "Day 1",
    "title": "Title focusing on weak topic",
    "topic": "Topic Name",
    "isCompleted": false,
    "activities": [
      {
        "id": "act_1",
        "type": "learning" | "quiz" | "practice" | "revision",
        "durationMinutes": 35,
        "description": "Specific action item",
        "completed": false
      }
    ]
  }
]`;

    const response = await generateWithRetry({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const days = parseCleanJSON(response.text || '[]', []);
    res.json({ days });
  } catch (error: any) {
    console.error('Study plan error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate study plan' });
  }
});

// -------------------------------------------------------------
// 7. QUICK REVISION & EXAM PREPARATION
// -------------------------------------------------------------
app.post('/api/ai/quick-revision', async (req: Request, res: Response) => {
  try {
    const { subjectName, topics = [], materialText } = req.body;

    const ai = getGenAI();
    const prompt = `Generate a rapid 15-minute quick revision pack for ${subjectName}.
Topics: ${topics.join(', ')}
${materialText ? `Based on notes: """${materialText.slice(0, 10000)}"""` : ''}

Respond ONLY with valid JSON:
{
  "definitions": [
    { "term": "Term", "meaning": "Ultra concise meaning", "context": "Why it matters" }
  ],
  "formulas": [
    { "name": "Formula Name", "formula": "LaTeX / equation", "notes": "Variable units and notes" }
  ],
  "keyConcepts": [
    { "concept": "Concept Name", "breakdown": "3-sentence breakdown", "highYield": true }
  ],
  "frequentlyConfused": [
    { "conceptA": "A", "conceptB": "B", "difference": "Key distinction", "tip": "Mnemonic or heuristic" }
  ],
  "commonExamQuestions": [
    { "question": "Exam question...", "answerKey": "Bullet points needed for full marks", "weight": "5 marks" }
  ],
  "rapidQuiz": [
    {
      "id": "rq1",
      "question": "Question text...",
      "type": "mcq",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Explanation...",
      "topic": "${topics[0] || 'Core'}",
      "difficulty": "medium"
    }
  ]
}`;

    const response = await generateWithRetry({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const data = parseCleanJSON(response.text || '{}', {
      definitions: [],
      formulas: [],
      keyConcepts: [],
      frequentlyConfused: [],
      commonExamQuestions: [],
      rapidQuiz: []
    });

    res.json({ revisionData: { ...data, estimatedMinutes: 15, generatedAt: new Date().toISOString() } });
  } catch (error: any) {
    console.error('Quick revision error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate quick revision' });
  }
});

// -------------------------------------------------------------
// 8. ADAPTIVE STUDY SESSION STEP (Interactive loop)
// -------------------------------------------------------------
app.post('/api/ai/study-session-step', async (req: Request, res: Response) => {
  try {
    const { subjectName, topic, stepNumber, totalSteps = 5, previousAnswer, previousEvaluation, materialText } = req.body;

    const ai = getGenAI();
    const prompt = `You are conducting a live, adaptive one-on-one tutorial session with a college student.
Subject: ${subjectName}
Topic: ${topic}
Current Step: ${stepNumber} of ${totalSteps}
${materialText ? `Grounding: """${materialText.slice(0, 10000)}"""` : ''}

${previousEvaluation ? `
The student just answered previous step with a score of ${previousEvaluation.score}/10.
Mistakes noted: ${JSON.stringify(previousEvaluation.missingPoints)}
If the score was < 7, your task is to first clarify the mistake gently, then present a similar targeted reinforcement question.
If the score was >= 7, congratulate them and advance to the next deeper sub-concept.
` : `
This is the beginning of the topic. Introduce the concept clearly with high intuition and ask a foundational check question.
`}

Return ONLY a JSON object:
{
  "conceptTitle": "Concept Subtopic Name",
  "topic": "${topic}",
  "explanation": "Clear, engaging explanation with real-world intuition (2-3 paragraphs)",
  "keyTakeaway": "Single sentence high-yield summary",
  "question": "Thought-provoking question testing this concept for the student to answer",
  "sampleAnswerHint": "Subtle hint without revealing the entire answer"
}`;

    const response = await generateWithRetry({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const stepData = parseCleanJSON(response.text || '{}', {
      conceptTitle: topic,
      topic,
      explanation: `Let's dive into ${topic}.`,
      keyTakeaway: 'Mastering the core equation is critical.',
      question: `How does ${topic} affect network training?`,
      sampleAnswerHint: 'Think about gradient propagation.'
    });

    res.json({ step: stepData });
  } catch (error: any) {
    console.error('Study session step error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate study session step' });
  }
});

// -------------------------------------------------------------
// 9. PARSE MATERIAL (Handles uploaded documents or raw text)
// -------------------------------------------------------------
app.post('/api/ai/parse-material', async (req: Request, res: Response) => {
  try {
    const { filename, fileType, rawText, base64Data, mimeType } = req.body;

    const ai = getGenAI();

    let extractedText = rawText || '';

    // If multimodal file (image or PDF base64) is provided, pass to Gemini 2.5 Flash for transcription/extraction
    if (base64Data && (!extractedText || extractedText.length < 50)) {
      const response = await generateWithRetry({
        model: 'gemini-3.6-flash',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || (fileType === 'pdf' ? 'application/pdf' : 'image/jpeg'),
                  data: base64Data
                }
              },
              {
                text: 'Extract and transcribe all educational lecture content, formulas, definitions, headings, and diagrams from this study document cleanly in structured Markdown format. Retain mathematical equations and terminology accurately.'
              }
            ]
          }
        ]
      });
      extractedText = response.text || '';
    }

    if (!extractedText) {
      extractedText = `Transcribed notes for ${filename}.\nKey topics: Foundational concepts and lecture review.`;
    }

    // Identify covered topics
    const topicDetectPrompt = `Given this study document text, list the top 3-6 core academic topics covered as a simple JSON array of strings:
"""
${extractedText.slice(0, 5000)}
"""
Return ONLY a JSON array, e.g. ["Topic A", "Topic B"]`;

    const topicResp = await generateWithRetry({
      model: 'gemini-3.6-flash',
      contents: topicDetectPrompt,
      config: { responseMimeType: 'application/json' }
    });

    const topicsCovered = parseCleanJSON(topicResp.text || '[]', ['General Concepts']);

    res.json({ extractedText, topicsCovered });
  } catch (error: any) {
    console.error('Parse material error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse material' });
  }
});

// -------------------------------------------------------------
// 10. MULTIMODAL VISION SOLVER (Handwritten Notes & Diagrams)
// -------------------------------------------------------------
app.post('/api/ai/vision-solve', async (req: Request, res: Response) => {
  try {
    const { base64Data, mimeType = 'image/jpeg', promptText, subjectName } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: 'Base64 image data is required' });
    }

    const ai = getGenAI();
    const systemPrompt = `You are an elite academic STEM professor and vision analyst specializing in ${subjectName || 'college engineering & science'}.
Your task is to analyze photos of handwritten notes, whiteboard sketches, textbook diagrams, and mathematical calculations.
Analyze what is shown carefully, extract all handwritten or printed text and equations, explain the visual or diagram components, provide a rigorous step-by-step solution or breakdown, and formulate a similar practice problem.

Return ONLY a JSON object matching this schema:
{
  "title": "Clear descriptive title of the diagram/problem",
  "transcription": "Exact transcription of formulas, text, and labels visible in the image",
  "diagramBreakdown": "Clear explanation of what the diagram, schematic, or visual representation depicts",
  "stepByStepSolution": [
    { "step": 1, "title": "Step title", "explanation": "Detailed mathematical or conceptual step" }
  ],
  "finalAnswer": "The concise final answer or key conclusion",
  "commonTraps": [
    "Mistake students frequently make when solving this problem or interpreting this diagram"
  ],
  "practiceProblem": {
    "question": "A closely related follow-up practice problem testing the same principle",
    "hint": "Pedagogical hint"
  }
}`;

    const userPrompt = promptText || 'Analyze this handwritten note or diagram. Transcribe the formulas, explain the concept, and provide a full step-by-step solution.';

    const response = await generateWithRetry({
      model: 'gemini-3.8-flash',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            },
            {
              text: `${systemPrompt}\n\nStudent Request: ${userPrompt}`
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = parseCleanJSON(response.text || '{}', {
      title: 'Visual Problem Analysis',
      transcription: 'Formulas and notes extracted from the image.',
      diagramBreakdown: 'Diagram analyzed.',
      stepByStepSolution: [
        { step: 1, title: 'Analysis', explanation: 'Breakdown of the handwritten elements.' }
      ],
      finalAnswer: 'Derived result from visual notes.',
      commonTraps: ['Pay close attention to sign conventions and unit conversions.'],
      practiceProblem: {
        question: 'Try solving the problem with inverted initial conditions.',
        hint: 'Review the conservation laws discussed in step 1.'
      }
    });

    res.json({ analysis: parsed });
  } catch (error: any) {
    console.error('Vision solve error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze diagram or handwritten notes' });
  }
});

// -------------------------------------------------------------
// 11. AI CHEAT SHEET & HIGH-YIELD FORMULA GENERATOR
// -------------------------------------------------------------
app.post('/api/ai/generate-cheatsheet', async (req: Request, res: Response) => {
  try {
    const { subjectName, topic, materialText } = req.body;

    const ai = getGenAI();
    const prompt = `You are a university exam prep specialist. Create a 1-page high-yield formula & cheat sheet card for students preparing for exams in "${subjectName || 'University Subject'}".
Topic: ${topic || 'Core Curriculum'}
${materialText ? `Grounding Material:\n"""\n${materialText.slice(0, 15000)}\n"""` : ''}

Generate a condensed, high-yield cheat sheet with essential formulas, mnemonics, exam traps, and rapid decision frameworks.

Return ONLY a JSON object matching this schema:
{
  "title": "${topic || subjectName} High-Yield Formula & Cheat Sheet",
  "topic": "${topic || subjectName}",
  "keyFormulas": [
    {
      "name": "Formula Name",
      "formula": "LaTeX or clean plaintext equation (e.g. E = mc^2)",
      "units": "Units of each variable",
      "notes": "When to apply and critical assumptions"
    }
  ],
  "coreConcepts": [
    {
      "title": "Concept or Law",
      "summary": "2-sentence high-yield summary",
      "mnemonic": "Helpful memory trick or acronym (optional)"
    }
  ],
  "examTraps": [
    {
      "trap": "What examiners try to trick students with",
      "howToAvoid": "The exact check to prevent losing marks"
    }
  ],
  "decisionTree": [
    {
      "scenario": "When you see problem type X in the exam...",
      "recommendedApproach": "Use method Y first, then check boundary condition Z"
    }
  ],
  "highYieldPoints": [
    "Crucial test-day fact 1",
    "Crucial test-day fact 2",
    "Crucial test-day fact 3"
  ]
}`;

    const response = await generateWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = parseCleanJSON(response.text || '{}', {
      title: `${topic || 'Subject'} Cheat Sheet`,
      topic: topic || 'Foundations',
      keyFormulas: [],
      coreConcepts: [],
      examTraps: [],
      decisionTree: [],
      highYieldPoints: []
    });

    res.json({
      cheatSheet: {
        ...parsed,
        id: 'cs_' + Date.now(),
        subjectName,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Cheat sheet error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate cheat sheet' });
  }
});

// -------------------------------------------------------------
// 12. KNOWLEDGE GRAPH TOPIC MAP GENERATOR
// -------------------------------------------------------------
app.post('/api/ai/knowledge-graph', async (req: Request, res: Response) => {
  try {
    const { subjectName, topics = [] } = req.body;

    const ai = getGenAI();
    const prompt = `You are a university curriculum designer for ${subjectName}.
Given these course topics: ${JSON.stringify(topics)}

Generate a structured prerequisite knowledge graph mapping how concepts depend on each other (from foundational to intermediate to advanced).

Return ONLY a JSON array of knowledge nodes:
[
  {
    "id": "node_1",
    "name": "Topic Name",
    "prerequisites": ["node_id_of_prerequisite"], // empty array for foundational topics
    "description": "One sentence summary of this concept",
    "difficulty": "foundational" | "intermediate" | "advanced",
    "estimatedHours": 3
  }
]`;

    const response = await generateWithRetry({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const nodes = parseCleanJSON(response.text || '[]', []);
    res.json({ nodes });
  } catch (error: any) {
    console.error('Knowledge graph error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate knowledge graph' });
  }
});

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Express server unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error', details: err?.message || String(err) });
  }
});

// -------------------------------------------------------------
// Vite middleware for Dev / Static serving for Prod
// -------------------------------------------------------------
async function startServer() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`StudyMate AI server active on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Fatal error during startServer:', error);
    process.exit(1);
  }
}

startServer();
