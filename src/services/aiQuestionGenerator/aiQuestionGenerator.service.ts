import { z } from "zod";

// Zod Schema for Structured Output Validation
export const GeneratedQuestionSchema = z.object({
  questionText: z.string().min(5),
  options: z.array(
    z.object({
      id: z.enum(["A", "B", "C", "D"]),
      text: z.string().min(1),
    })
  ).length(4),
  correctOption: z.enum(["A", "B", "C", "D"]),
  marks: z.number().default(4),
  explanation: z.string().default(""),
});

/**
 * Robust JSON Sanitizer and Repair Parser to handle raw LLM text output
 */
function safeParseJson<T = any>(text: string, startChar: "{" | "[", endChar: "}" | "]"): T | null {
  if (!text) return null;
  const jsonStart = text.indexOf(startChar);
  const jsonEnd = text.lastIndexOf(endChar);
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null;

  let rawJson = text.substring(jsonStart, jsonEnd + 1);

  // 1. Clean markdown code fences
  rawJson = rawJson.replace(/```json/gi, "").replace(/```/g, "");

  // 2. Direct parse attempt
  try {
    return JSON.parse(rawJson);
  } catch {
    // 3. Robust JSON repair for trailing commas, control characters, & unescaped line breaks
    try {
      const cleaned = rawJson
        .replace(/,\s*([}\]])/g, "$1") // Remove trailing commas before } or ]
        .replace(/[\u0000-\u001F]+/g, " "); // Replace illegal unescaped control characters

      return JSON.parse(cleaned);
    } catch (err: any) {
      console.warn("Safe JSON parse repair failed:", err?.message || err);
      return null;
    }
  }
}

export interface QuestionOutput {
  questionText: string;
  options: { id: "A" | "B" | "C" | "D"; text: string }[];
  correctOption: "A" | "B" | "C" | "D";
  marks: number;
  explanation: string;
}

export interface GenerateQuestionsInput {
  topic: string;
  subject?: string;
  targetClass?: string;
  difficulty?: "easy" | "medium" | "hard" | "competitive";
  questionFormat?: "mcq" | "assertion_reason" | "true_false" | "short_answer" | "mixed";
  bloomLevel?: "remembering" | "understanding" | "application" | "analysis";
  count?: number;
  marksPerQuestion?: number;
  fileBuffer?: Buffer;
  fileMimeType?: string;
  fileName?: string;
}

export interface GenerateQuestionsResult {
  questions: QuestionOutput[];
  isAiGenerated: boolean;
  errorMsg?: string;
}

// FULL EXAM PAPER BLUEPRINT TYPES
export interface PaperSectionConfig {
  sectionName: string; // e.g. "Section A", "Section B"
  questionType: "mcq" | "short_answer" | "long_answer" | "assertion_reason" | "case_study";
  totalQuestions: number; // e.g. 7
  attemptQuestions: number; // e.g. 5 (Attempt any 5 of 7)
  marksPerQuestion: number; // e.g. 2 Marks
  instructions?: string;
}

export interface FullPaperOutputQuestion {
  questionNumber: number;
  questionText: string;
  marks: number;
  questionType: string;
  options?: { id: "A" | "B" | "C" | "D"; text: string }[];
  orQuestionText?: string;
  correctOption?: string;
  modelAnswer: string;
  explanation: string;
}

export interface FullPaperSectionOutput {
  sectionName: string;
  instructions: string;
  questions: FullPaperOutputQuestion[];
}

export interface FullPaperOutput {
  instituteName: string;
  paperTitle: string;
  subject: string;
  targetClass: string;
  timeAllowed: string;
  totalMarks: number;
  generalInstructions: string[];
  sections: FullPaperSectionOutput[];
}

export interface GenerateFullPaperInput {
  apiKey?: string;
  instituteName?: string;
  paperTitle: string;
  subject: string;
  targetClass: string;
  timeAllowedMins?: number;
  totalMarks?: number;
  topicOrSyllabus?: string;
  sections: PaperSectionConfig[];
  fileBuffer?: Buffer;
  fileMimeType?: string;
  fileName?: string;
}

export interface GenerateFullPaperResult {
  paper: FullPaperOutput;
  isAiGenerated: boolean;
  errorMsg?: string;
}

export const aiQuestionGeneratorService = {
  /**
   * Main Question Generation Flow
   */
  generateQuestions: async (input: GenerateQuestionsInput & { apiKey?: string }): Promise<GenerateQuestionsResult> => {
    const {
      apiKey: customApiKey,
      topic,
      subject = "General Science & Mathematics",
      targetClass = "Class 10th / Competitive",
      difficulty = "medium",
      questionFormat = "mcq",
      bloomLevel = "understanding",
      count = 10,
      marksPerQuestion = 4,
      fileBuffer,
      fileMimeType,
      fileName,
    } = input;

    const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY;

    const apiKey = customApiKey || envKey;

    if (apiKey) {
      try {
        const { questions, lastError } = await aiQuestionGeneratorService.callLlmPipeline({
          apiKey,
          topic,
          subject,
          targetClass,
          difficulty,
          questionFormat,
          bloomLevel,
          count,
          marksPerQuestion,
          fileBuffer,
          fileMimeType,
          fileName,
        });

        if (questions && questions.length > 0) {
          return { questions, isAiGenerated: true };
        }

        if (lastError) {
          const fallbackQs = aiQuestionGeneratorService.fallbackQuestionGenerator(
            topic,
            subject,
            difficulty,
            questionFormat,
            count,
            marksPerQuestion
          );
          return {
            questions: fallbackQs,
            isAiGenerated: false,
            errorMsg: lastError,
          };
        }
      } catch (err: any) {
        console.warn("AI LLM call failed, falling back to smart question generator:", err?.message || err);
      }
    }

    const fallbackQs = aiQuestionGeneratorService.fallbackQuestionGenerator(
      topic,
      subject,
      difficulty,
      questionFormat,
      count,
      marksPerQuestion
    );
    return {
      questions: fallbackQs,
      isAiGenerated: false,
      errorMsg: !apiKey ? "No Gemini API Key provided. Showing fallback questions." : undefined,
    };
  },

  /**
   * FULL EXAM PAPER BLUEPRINT GENERATOR (Sections A, B, C, D, Choice Rules, Short/Long Ans)
   */
  generateFullPaper: async (input: GenerateFullPaperInput): Promise<GenerateFullPaperResult> => {
    const {
      apiKey: customApiKey,
      instituteName = "EXCELLENCE COACHING INSTITUTE",
      paperTitle = "FULL SYLLABUS EXAMINATION 2026",
      subject = "Science",
      targetClass = "Class 10th CBSE",
      timeAllowedMins = 180,
      totalMarks = 80,
      topicOrSyllabus = "Complete Syllabus",
      sections = [],
      fileBuffer,
      fileMimeType,
      fileName,
    } = input;

    const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY;
    const apiKey = customApiKey || envKey;

    // Use default blueprint sections if empty
    const paperSections: PaperSectionConfig[] = sections.length > 0 ? sections : [
      { sectionName: "Section A", questionType: "mcq", totalQuestions: 10, attemptQuestions: 10, marksPerQuestion: 1, instructions: "All questions are compulsory MCQs." },
      { sectionName: "Section B", questionType: "short_answer", totalQuestions: 6, attemptQuestions: 5, marksPerQuestion: 2, instructions: "Attempt any 5 out of 6 questions." },
      { sectionName: "Section C", questionType: "short_answer", totalQuestions: 5, attemptQuestions: 4, marksPerQuestion: 3, instructions: "Attempt any 4 out of 5 questions." },
      { sectionName: "Section D", questionType: "long_answer", totalQuestions: 3, attemptQuestions: 3, marksPerQuestion: 5, instructions: "Long answer questions with internal choices." },
    ];

    if (apiKey) {
      try {
        const { paper, lastError } = await aiQuestionGeneratorService.callFullPaperLlmPipeline({
          apiKey,
          instituteName,
          paperTitle,
          subject,
          targetClass,
          timeAllowedMins,
          totalMarks,
          topicOrSyllabus,
          sections: paperSections,
          fileBuffer,
          fileMimeType,
          fileName,
        });

        if (paper && paper.sections && paper.sections.length > 0) {
          return { paper, isAiGenerated: true };
        }

        if (lastError) {
          const fallbackPaper = aiQuestionGeneratorService.fallbackFullPaperGenerator(
            instituteName,
            paperTitle,
            subject,
            targetClass,
            timeAllowedMins,
            totalMarks,
            topicOrSyllabus,
            paperSections
          );
          return { paper: fallbackPaper, isAiGenerated: false, errorMsg: lastError };
        }
      } catch (err: any) {
        console.warn("Full Paper LLM call failed, falling back to smart blueprint generator:", err?.message || err);
      }
    }

    const fallbackPaper = aiQuestionGeneratorService.fallbackFullPaperGenerator(
      instituteName,
      paperTitle,
      subject,
      targetClass,
      timeAllowedMins,
      totalMarks,
      topicOrSyllabus,
      paperSections
    );

    return {
      paper: fallbackPaper,
      isAiGenerated: false,
      errorMsg: !apiKey ? "No Gemini API Key provided. Showing fallback full exam paper blueprint." : undefined,
    };
  },

  /**
   * LLM Pipeline for Full Exam Paper Generation
   */
  callFullPaperLlmPipeline: async (params: {
    apiKey: string;
    instituteName: string;
    paperTitle: string;
    subject: string;
    targetClass: string;
    timeAllowedMins: number;
    totalMarks: number;
    topicOrSyllabus: string;
    sections: PaperSectionConfig[];
    fileBuffer?: Buffer;
    fileMimeType?: string;
    fileName?: string;
  }): Promise<{ paper?: FullPaperOutput; lastError?: string }> => {
    const {
      apiKey,
      instituteName,
      paperTitle,
      subject,
      targetClass,
      timeAllowedMins,
      totalMarks,
      topicOrSyllabus,
      sections,
      fileBuffer,
      fileMimeType,
      fileName,
    } = params;

    const sectionSpec = sections
      .map(
        (s, idx) =>
          `Section ${idx + 1}: "${s.sectionName}" — Type: ${s.questionType.toUpperCase()}, Total Questions: ${s.totalQuestions}, Must Attempt: ${s.attemptQuestions}, Marks/Question: ${s.marksPerQuestion} Marks. Instructions: "${s.instructions || `Attempt any ${s.attemptQuestions} of ${s.totalQuestions}`}"`
      )
      .join("\n");

    const prompt = `You are an expert Academic Question Paper Setter for Indian Board & Coaching Institute Examinations (CBSE, ICSE, NEET, JEE).
Generate a complete, official A4 Full Question Paper based on this exact blueprint:

INSTITUTE: ${instituteName}
EXAM TITLE: ${paperTitle}
SUBJECT: ${subject}
TARGET CLASS: ${targetClass}
TIME ALLOWED: ${Math.floor(timeAllowedMins / 60)} Hours ${timeAllowedMins % 60 ? `${timeAllowedMins % 60} Mins` : ""}
TOTAL MARKS: ${totalMarks} Marks
SYLLABUS / TOPIC: ${topicOrSyllabus}

SECTION BLUEPRINT:
${sectionSpec}

CRITICAL RULES FOR FULL EXAM PAPER:
1. Provide a generalInstructions array (e.g. ["1. All questions are compulsory.", "2. The question paper consists of ${sections.length} sections.", "3. Section A contains MCQs of 1 mark each.", ...]).
2. Generate ALL sections as specified.
3. For Section A (MCQs), provide 4 options ("A", "B", "C", "D") and correctOption.
4. For Short & Long Answer Sections:
   - Respect Choice Rules (e.g. if Total = 7 and Attempt = 5, output 7 questions in the section with instruction "Attempt any 5 questions").
   - Provide an optional "orQuestionText" for internal choice (e.g. "Q14. Define Ohm's Law. OR State Joule's Law of Heating.").
5. Provide a detailed "modelAnswer" and "explanation" for every question.
6. Return ONLY valid JSON object matching this exact structure:
{
  "instituteName": "${instituteName}",
  "paperTitle": "${paperTitle}",
  "subject": "${subject}",
  "targetClass": "${targetClass}",
  "timeAllowed": "${Math.floor(timeAllowedMins / 60)} Hours",
  "totalMarks": ${totalMarks},
  "generalInstructions": [
    "1. Read all instructions carefully.",
    "2. Question paper consists of ${sections.length} Sections."
  ],
  "sections": [
    {
      "sectionName": "Section A",
      "instructions": "All questions are compulsory MCQs.",
      "questions": [
        {
          "questionNumber": 1,
          "questionText": "What is the SI unit of electric current?",
          "marks": 1,
          "questionType": "mcq",
          "options": [
            { "id": "A", "text": "Volt" },
            { "id": "B", "text": "Ampere" },
            { "id": "C", "text": "Ohm" },
            { "id": "D", "text": "Watt" }
          ],
          "correctOption": "B",
          "modelAnswer": "Option (B) Ampere",
          "explanation": "Ampere (A) is the SI unit of electric current."
        }
      ]
    }
  ]
}`;

    const modelsToTry = ["gemini-3.5-flash"];
    let lastError: string | undefined;

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      for (const modelName of modelsToTry) {
        try {
          const contentsPayload: any[] = [prompt];
          if (fileBuffer && fileMimeType) {
            contentsPayload.push({
              inlineData: {
                data: fileBuffer.toString("base64"),
                mimeType: fileMimeType,
              },
            });
          }

          const response = await ai.models.generateContent({
            model: modelName,
            contents: contentsPayload,
            config: {
              responseMimeType: "application/json",
              temperature: 0.3,
              maxOutputTokens: 8192,
            },
          });

          const text = response.text || "";
          const parsed = safeParseJson<FullPaperOutput>(text, "{", "}");
          if (parsed && Array.isArray(parsed.sections)) {
            return { paper: parsed };
          }
        } catch (modelErr: any) {
          const msg = modelErr?.message || String(modelErr);
          if (msg.includes("suspended") || msg.includes("Permission denied") || msg.includes("403")) {
            lastError = "Google Gemini API Key has been suspended or is invalid.";
            break;
          } else {
            lastError = `Gemini API Error: ${msg}`;
          }
        }
      }
    } catch (e: any) {
      lastError = `Gemini API Init Error: ${e?.message || e}`;
    }

    return { lastError };
  },

  /**
   * LangChain & Gemini Multimodal LLM Pipeline Implementation for Single Quiz
   */
  callLlmPipeline: async (params: {
    apiKey: string;
    topic: string;
    subject: string;
    targetClass: string;
    difficulty: string;
    questionFormat: string;
    bloomLevel: string;
    count: number;
    marksPerQuestion: number;
    fileBuffer?: Buffer;
    fileMimeType?: string;
    fileName?: string;
  }): Promise<{ questions: QuestionOutput[]; lastError?: string }> => {
    const {
      apiKey,
      topic,
      subject,
      targetClass,
      difficulty,
      questionFormat,
      bloomLevel,
      count,
      marksPerQuestion,
      fileBuffer,
      fileMimeType,
      fileName,
    } = params;

    let formatGuideline = "";
    if (questionFormat === "assertion_reason") {
      formatGuideline = `Format: ASSERTION & REASON QUESTIONS (NEET/JEE pattern).
Each question MUST state:
"Assertion (A): [Statement]"
"Reason (R): [Statement]"
Options MUST be:
A) Both (A) and (R) are true and (R) is the correct explanation of (A)
B) Both (A) and (R) are true but (R) is NOT the correct explanation of (A)
C) (A) is true but (R) is false
D) (A) is false but (R) is true`;
    } else if (questionFormat === "true_false") {
      formatGuideline = `Format: TRUE / FALSE & CONCEPT STATEMENT EVALUATION.
Options MUST be:
A) True
B) False
C) Partially True under specific constraints
D) Statement is logically invalid / ambiguous`;
    } else if (questionFormat === "short_answer") {
      formatGuideline = `Format: SHORT CONCEPTUAL / DEFINTION QUESTIONS.
Question asks for definition, formula, or concept.
Options MUST contain 1 exact ideal model answer and 3 common student misconceptions.`;
    } else {
      formatGuideline = `Format: MULTIPLE CHOICE QUESTIONS (MCQs) with 4 options A, B, C, D and exactly 1 correct option.`;
    }

    let documentContextPrompt = "";
    if (fileBuffer && fileMimeType) {
      documentContextPrompt = `CRITICAL INSTRUCTION: Analyze the attached file ("${fileName || "Uploaded Document"}"). Generate questions STRICTLY based on the concepts, definitions, formulas, tables, and problems present in this attached file!`;
    }

    const prompt = `You are a master academic question paper setter for Indian Coaching Institutes (NEET, JEE, CBSE Class 8-12, BCA, SSC).
Generate exactly ${count} questions for the topic: "${topic || "Uploaded Document Concepts"}".
Subject: ${subject}
Target Grade/Level: ${targetClass}
Difficulty Level: ${difficulty} (Easy, Medium, Hard, or Competitive)
Cognitive Level (Bloom's Taxonomy): ${bloomLevel} (remembering, understanding, application, analysis)
Marks per question: ${marksPerQuestion}

${formatGuideline}
${documentContextPrompt}

CRITICAL RULES:
1. Every question MUST have exactly 4 options labeled "A", "B", "C", and "D".
2. Ensure only ONE option is correct. "correctOption" MUST be one of "A", "B", "C", "D".
3. Provide a clear, educational step-by-step "explanation" for why that option is correct.
4. Output MUST be valid JSON array of objects matching this exact structure:
[
  {
    "questionText": "What is the SI unit of force?",
    "options": [
      { "id": "A", "text": "Joule" },
      { "id": "B", "text": "Newton" },
      { "id": "C", "text": "Pascal" },
      { "id": "D", "text": "Watt" }
    ],
    "correctOption": "B",
    "marks": ${marksPerQuestion},
    "explanation": "Newton (N) is the SI unit of force, named after Sir Isaac Newton (1 N = 1 kg·m/s²)."
  }
]`;

    const modelsToTry = ["gemini-3.5-flash"];
    let lastError: string | undefined;

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      for (const modelName of modelsToTry) {
        try {
          const contentsPayload: any[] = [prompt];
          if (fileBuffer && fileMimeType) {
            contentsPayload.push({
              inlineData: {
                data: fileBuffer.toString("base64"),
                mimeType: fileMimeType,
              },
            });
          }

          const response = await ai.models.generateContent({
            model: modelName,
            contents: contentsPayload,
            config: {
              responseMimeType: "application/json",
              temperature: 0.4,
              maxOutputTokens: 8192,
            },
          });

          const text = response.text || "";
          const parsed = safeParseJson<any[]>(text, "[", "]");
          if (Array.isArray(parsed) && parsed.length > 0) {
            const mapped = parsed.map((q: any) => ({
              questionText: q.questionText || `Question about ${topic}`,
              options: Array.isArray(q.options) && q.options.length === 4
                ? q.options
                : [
                    { id: "A", text: q.options?.[0]?.text || "Option A" },
                    { id: "B", text: q.options?.[1]?.text || "Option B" },
                    { id: "C", text: q.options?.[2]?.text || "Option C" },
                    { id: "D", text: q.options?.[3]?.text || "Option D" },
                  ],
              correctOption: (["A", "B", "C", "D"].includes(q.correctOption) ? q.correctOption : "A") as "A" | "B" | "C" | "D",
              marks: typeof q.marks === "number" ? q.marks : marksPerQuestion,
              explanation: q.explanation || `Correct answer is option ${q.correctOption}.`,
            }));
            return { questions: mapped };
          }
        } catch (modelErr: any) {
          const msg = modelErr?.message || String(modelErr);
          if (msg.includes("suspended") || msg.includes("Permission denied") || msg.includes("CONSUMER_SUSPENDED") || msg.includes("403")) {
            lastError = "Google Gemini API Key has been suspended or is invalid. Please get a new free API Key from Google AI Studio.";
            break;
          } else {
            lastError = `Gemini API Error: ${msg}`;
          }
        }
      }
    } catch (e: any) {
      lastError = `Gemini API Init Error: ${e?.message || e}`;
    }

    return { questions: [], lastError };
  },

  /**
   * Fallback Full Exam Paper Generator
   */
  fallbackFullPaperGenerator: (
    instituteName: string,
    paperTitle: string,
    subject: string,
    targetClass: string,
    timeAllowedMins: number,
    totalMarks: number,
    topicOrSyllabus: string,
    sections: PaperSectionConfig[]
  ): FullPaperOutput => {
    let globalQNum = 1;

    const sectionOutputs: FullPaperSectionOutput[] = sections.map((sec) => {
      const qList: FullPaperOutputQuestion[] = [];
      for (let i = 0; i < sec.totalQuestions; i++) {
        const qNum = globalQNum++;

        if (sec.questionType === "mcq" || sec.questionType === "assertion_reason") {
          qList.push({
            questionNumber: qNum,
            questionText: `Q${qNum}. Which of the following fundamental principles best defines ${topicOrSyllabus} in ${subject}?`,
            marks: sec.marksPerQuestion,
            questionType: sec.questionType,
            options: [
              { id: "A", text: `Conservation of energy and total system momentum` },
              { id: "B", text: `Direct scalar proportionality under ambient room temperature` },
              { id: "C", text: `Exponential decay factor over time interval t` },
              { id: "D", text: `Universal steady-state equilibrium condition` },
            ],
            correctOption: "A",
            modelAnswer: "Option (A)",
            explanation: `Conservation laws govern physical stability and total energy balance in ${subject}.`,
          });
        } else if (sec.questionType === "long_answer") {
          qList.push({
            questionNumber: qNum,
            questionText: `Q${qNum} (A). State and prove the core mathematical theorem governing ${topicOrSyllabus}. Derive the expressions for boundary limits.`,
            orQuestionText: `OR\nQ${qNum} (B). Explain the practical engineering application of ${topicOrSyllabus} with a neat labeled schematic diagram.`,
            marks: sec.marksPerQuestion,
            questionType: sec.questionType,
            modelAnswer: `(A) State theorem statement. Step 1: Set up vector integral equations. Step 2: Apply boundary limits to prove LHS = RHS.\n(B) Draw schematic diagram and describe 3 core components.`,
            explanation: `Full credit is awarded for step-by-step mathematical proof or labeled diagram with explanation.`,
          });
        } else {
          // Short Answer / Case Study
          qList.push({
            questionNumber: qNum,
            questionText: `Q${qNum}. Define ${topicOrSyllabus} in ${subject}. Write its standard SI units and dimensional formula.`,
            marks: sec.marksPerQuestion,
            questionType: sec.questionType,
            modelAnswer: `${topicOrSyllabus} is defined as the rate of physical change per unit area. SI Unit: Newton/meter² (Pascal). Dimensional Formula: [M¹ L⁻¹ T⁻²].`,
            explanation: `1 mark for correct definition, 0.5 mark for SI unit, 0.5 mark for dimensional formula.`,
          });
        }
      }

      return {
        sectionName: sec.sectionName,
        instructions: sec.instructions || `Attempt ${sec.attemptQuestions} of ${sec.totalQuestions} questions. (${sec.totalQuestions * sec.marksPerQuestion} Marks)`,
        questions: qList,
      };
    });

    return {
      instituteName,
      paperTitle,
      subject,
      targetClass,
      timeAllowed: `${Math.floor(timeAllowedMins / 60)} Hours ${timeAllowedMins % 60 ? `${timeAllowedMins % 60} Mins` : ""}`,
      totalMarks,
      generalInstructions: [
        `1. All questions in Section A are compulsory.`,
        `2. The question paper consists of ${sections.length} Sections: ${sections.map((s) => s.sectionName).join(", ")}.`,
        `3. Read instructions for each Section carefully regarding internal choices ("Attempt any N out of M").`,
        `4. Use of scientific calculators is not permitted.`,
      ],
      sections: sectionOutputs,
    };
  },

  /**
   * Smart Academic Fallback Question Generator
   */
  fallbackQuestionGenerator: (
    topic: string,
    subject: string,
    difficulty: string,
    questionFormat: string = "mcq",
    count: number,
    marks: number
  ): QuestionOutput[] => {
    const questions: QuestionOutput[] = [];
    const topicTitle = topic.trim() || "Core Concepts";

    if (questionFormat === "assertion_reason") {
      for (let i = 0; i < count; i++) {
        questions.push({
          questionText: `Q${i + 1}: Assertion (A): In ${subject}, ${topicTitle} satisfies total conservation laws.\nReason (R): Energy cannot be created or destroyed, only transformed in closed systems.`,
          options: [
            { id: "A", text: "Both (A) and (R) are true and (R) is the correct explanation of (A)" },
            { id: "B", text: "Both (A) and (R) are true but (R) is NOT the correct explanation of (A)" },
            { id: "C", text: "(A) is true but (R) is false" },
            { id: "D", text: "(A) is false but (R) is true" },
          ],
          correctOption: "A",
          marks,
          explanation: `Both statements are scientifically correct for ${topicTitle}, and Reason (R) provides the direct causal physical law behind Assertion (A).`,
        });
      }
      return questions;
    }

    if (questionFormat === "true_false") {
      for (let i = 0; i < count; i++) {
        questions.push({
          questionText: `Q${i + 1}: Evaluate Statement: Under standard ambient conditions in ${subject}, ${topicTitle} exhibits linear scalar proportionality.`,
          options: [
            { id: "A", text: "True" },
            { id: "B", text: "False" },
            { id: "C", text: "Partially True under specific temperature limits" },
            { id: "D", text: "Logically Invalid / Ambiguous" },
          ],
          correctOption: "A",
          marks,
          explanation: `In standard curriculum physics/mathematics, ${topicTitle} obeys linear proportionality in non-extreme baseline states.`,
        });
      }
      return questions;
    }

    const templates = [
      {
        q: `Which of the following fundamental principles best defines "${topicTitle}" in ${subject}?`,
        opts: [
          `Conservation of energy and momentum applicable to ${topicTitle}`,
          `Direct proportional relationship between applied stress and resulting strain`,
          `Continuous transformation of potential state to dynamic kinetic output`,
          `Universal equilibrium condition in closed thermo-physical systems`,
        ],
        correct: "A" as const,
        exp: `In ${subject}, ${topicTitle} is fundamentally governed by conservation laws ensuring system stability and total energy balance.`,
      },
      {
        q: `What is the primary standard metric or quantitative parameter associated with "${topicTitle}"?`,
        opts: [
          `Magnitude measured in Standard International (SI) units`,
          `Dimensionless constant coefficient dependent on ambient temperature`,
          `Exponential decay factor over time interval t`,
          `Logarithmic scale factor relative to reference baseline`,
        ],
        correct: "B" as const,
        exp: `Quantitative measurements of ${topicTitle} rely on standardized dimensional coefficients under controlled reference conditions.`,
      },
      {
        q: `When evaluating "${topicTitle}" under ${difficulty.toUpperCase()} difficulty scenarios, which assumption MUST hold true?`,
        opts: [
          `Frictionless and non-resistive boundary environment`,
          `System remains in non-isolated steady state state equilibrium`,
          `Ideal gas behaviors and incompressible fluid dynamics`,
          `Linear superposition of constituent force vectors`,
        ],
        correct: "D" as const,
        exp: `Superposition principles allow complex multi-variable problems in ${topicTitle} to be decomposed into independent vector components.`,
      },
      {
        q: `Which common misconception regarding "${topicTitle}" should students avoid during competitive examinations?`,
        opts: [
          `Assuming rate of change is independent of time duration`,
          `Confusing scalar magnitudes with vector directionality`,
          `Neglecting initial state boundary conditions`,
          `All of the above statements are critical misconceptions to avoid`,
        ],
        correct: "D" as const,
        exp: `All three listed choices represent frequent error traps in competitive exams when solving ${topicTitle} problems.`,
      },
      {
        q: `In practical application of "${topicTitle}", what happens if the input parameter is doubled while keeping other variables constant?`,
        opts: [
          `The resulting output quadruples due to quadratic scaling`,
          `The output doubles linearly proportional to input`,
          `The output decreases by 50% inversely`,
          `The output remains unchanged due to saturation limit`,
        ],
        correct: "A" as const,
        exp: `Quadratic relationships ($E \\propto x^2$) dictate that doubling input yields a fourfold output response in ${topicTitle}.`,
      },
    ];

    for (let i = 0; i < count; i++) {
      const tmpl = templates[i % templates.length];
      questions.push({
        questionText: `Q${i + 1}: ${tmpl.q}`,
        options: [
          { id: "A", text: tmpl.opts[0] },
          { id: "B", text: tmpl.opts[1] },
          { id: "C", text: tmpl.opts[2] },
          { id: "D", text: tmpl.opts[3] },
        ],
        correctOption: tmpl.correct,
        marks,
        explanation: tmpl.exp,
      });
    }

    return questions;
  },
};
