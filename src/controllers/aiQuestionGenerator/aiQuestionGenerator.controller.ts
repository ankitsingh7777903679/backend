import { Request, Response } from "express";
import { aiQuestionGeneratorService, PaperSectionConfig } from "../../services/aiQuestionGenerator/aiQuestionGenerator.service";
import { catchAsync } from "../../utils/catchAsync";
import { apiResponse } from "../../utils/apiResponse";

export const generateAiQuestions = catchAsync(async (req: Request, res: Response) => {
  const {
    mode = "quiz",
    topic,
    subject,
    targetClass,
    difficulty,
    questionFormat,
    bloomLevel,
    count,
    marksPerQuestion,
    apiKey,
    instituteName,
    paperTitle,
    timeAllowedMins,
    totalMarks,
    topicOrSyllabus,
    sections: rawSections,
  } = req.body;

  const file = req.file;

  // Mode 2: FULL EXAM PAPER BLUEPRINT GENERATOR
  if (mode === "full_paper") {
    let parsedSections: PaperSectionConfig[] = [];
    if (typeof rawSections === "string") {
      try {
        parsedSections = JSON.parse(rawSections);
      } catch {
        parsedSections = [];
      }
    } else if (Array.isArray(rawSections)) {
      parsedSections = rawSections;
    }

    const title = (paperTitle || topic || "FULL EXAM PAPER 2026").trim();

    const result = await aiQuestionGeneratorService.generateFullPaper({
      apiKey: apiKey?.trim() || undefined,
      instituteName: instituteName?.trim() || "EXCELLENCE COACHING INSTITUTE",
      paperTitle: title,
      subject: subject?.trim() || "Science",
      targetClass: targetClass?.trim() || "Class 10th CBSE",
      timeAllowedMins: parseInt(String(timeAllowedMins || 180), 10) || 180,
      totalMarks: parseInt(String(totalMarks || 80), 10) || 80,
      topicOrSyllabus: (topicOrSyllabus || topic || file?.originalname?.replace(/\.[^/.]+$/, "") || "Complete Syllabus").trim(),
      sections: parsedSections,
      fileBuffer: file?.buffer,
      fileMimeType: file?.mimetype,
      fileName: file?.originalname,
    });

    return res.json(
      apiResponse.success(
        {
          mode: "full_paper",
          paper: result.paper,
          isAiGenerated: result.isAiGenerated,
          errorMsg: result.errorMsg,
        },
        result.errorMsg || `Successfully generated full A4 question paper "${title}"`
      )
    );
  }

  // Mode 1: QUICK PRACTICE QUIZ GENERATOR
  const topicTitle = (topic || file?.originalname?.replace(/\.[^/.]+$/, "") || "Document Questions").trim();
  const numCount = Math.min(Math.max(parseInt(String(count || 10), 10) || 10, 1), 30);
  const numMarks = parseInt(String(marksPerQuestion || 4), 10) || 4;

  const result = await aiQuestionGeneratorService.generateQuestions({
    apiKey: apiKey?.trim() || undefined,
    topic: topicTitle,
    subject: subject?.trim() || "General Science & Mathematics",
    targetClass: targetClass?.trim() || "Class 10th / Competitive",
    difficulty: difficulty || "medium",
    questionFormat: questionFormat || "mcq",
    bloomLevel: bloomLevel || "understanding",
    count: numCount,
    marksPerQuestion: numMarks,
    fileBuffer: file?.buffer,
    fileMimeType: file?.mimetype,
    fileName: file?.originalname,
  });

  return res.json(
    apiResponse.success(
      {
        mode: "quiz",
        topic: topicTitle,
        subject,
        targetClass,
        difficulty,
        questionFormat: questionFormat || "mcq",
        bloomLevel: bloomLevel || "understanding",
        totalGenerated: result.questions.length,
        questions: result.questions,
        isAiGenerated: result.isAiGenerated,
        errorMsg: result.errorMsg,
      },
      result.errorMsg || `Successfully generated ${result.questions.length} questions for "${topicTitle}"`
    )
  );
});
