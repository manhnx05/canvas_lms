import { Request, Response } from 'express';
import { createRequire } from 'module';
import prisma from '../lib/prisma';
import { generateExamWithAI, extractTextFromFile, ExamGenerationParams } from '../lib/exam.ai.service';
import * as path from 'path';
import * as fs from 'fs';

// GET /api/exams?courseId=xxx&subject=yyy&grade=zzz&createdBy=uid
export const getExams = async (req: Request, res: Response) => {
  try {
    const { courseId, subject, grade, createdBy, status } = req.query;
    const where: any = {};
    if (courseId) where.courseId = String(courseId);
    if (subject) where.subject = String(subject);
    if (grade) where.grade = String(grade);
    if (createdBy) where.createdBy = String(createdBy);
    if (status) where.status = String(status);

    const exams = await prisma.exam.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { sourceFiles: true },
    });
    res.json(exams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi lấy danh sách đề thi' });
  }
};

// GET /api/exams/:id
export const getExamById = async (req: Request, res: Response) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: { sourceFiles: true, course: true },
    });
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy đề thi' });
  }
};

// POST /api/exams  body: { title, subject, grade, duration, totalScore, difficulty, questions, courseId, createdBy, status }
export const createExam = async (req: Request, res: Response) => {
  try {
    const { title, subject, grade, duration, totalScore, difficulty, questions, courseId, createdBy, status } = req.body;
    const exam = await prisma.exam.create({
      data: {
        title,
        subject,
        grade,
        duration: parseInt(duration) || 45,
        totalScore: parseInt(totalScore) || 10,
        difficulty: difficulty || 'medium',
        questions: questions || [],
        courseId: courseId || null,
        createdBy,
        status: status || 'draft',
      },
    });
    res.status(201).json(exam);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi tạo đề thi' });
  }
};

// PUT /api/exams/:id
export const updateExam = async (req: Request, res: Response) => {
  try {
    const { title, subject, grade, duration, totalScore, difficulty, questions, courseId, status } = req.body;
    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(subject && { subject }),
        ...(grade && { grade }),
        ...(duration && { duration: parseInt(duration) }),
        ...(totalScore && { totalScore: parseInt(totalScore) }),
        ...(difficulty && { difficulty }),
        ...(questions !== undefined && { questions }),
        ...(courseId !== undefined && { courseId }),
        ...(status && { status }),
      },
    });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi cập nhật đề thi' });
  }
};

// DELETE /api/exams/:id
export const deleteExam = async (req: Request, res: Response) => {
  try {
    // Also delete associated files from disk
    const files = await prisma.examFile.findMany({ where: { examId: req.params.id } });
    for (const f of files) {
      const filePath = path.join(process.cwd(), f.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await prisma.exam.delete({ where: { id: req.params.id } });
    res.json({ message: 'Xóa đề thi thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xóa đề thi' });
  }
};

// GET /api/exams/:id/download  — returns full exam data for client-side export
export const downloadExam = async (req: Request, res: Response) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: { sourceFiles: true },
    });
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tải đề thi' });
  }
};

// POST /api/exams/upload-file  (multipart/form-data, field: file, optional: examId)
export const uploadExamFile = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: 'Không có file được upload' });

    const { examId } = req.body;
    const examFile = await prisma.examFile.create({
      data: {
        name: file.originalname,
        size: file.size,
        type: 'textbook',
        url: file.path.replace(/\\/g, '/'),
        examId: examId || null,
      },
    });
    res.status(201).json(examFile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi upload file' });
  }
};

// DELETE /api/exams/files/:fileId
export const deleteExamFile = async (req: Request, res: Response) => {
  try {
    const file = await prisma.examFile.findUnique({ where: { id: req.params.fileId } });
    if (!file) return res.status(404).json({ error: 'Không tìm thấy file' });

    const filePath = path.join(process.cwd(), file.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.examFile.delete({ where: { id: req.params.fileId } });
    res.json({ message: 'Xóa file thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xóa file' });
  }
};

// POST /api/exams/:id/generate-ai
// body: { nbCount, thCount, vdCount, vdcCount, fileIds?, customTopic? }
export const generateExamAI = async (req: Request, res: Response) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: { sourceFiles: true },
    });
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });

    const { nbCount = 6, thCount = 4, vdCount = 2, vdcCount = 1, fileIds, customTopic } = req.body;

    // Extract text from uploaded files
    let fileContents = '';
    const filesToProcess = fileIds
      ? exam.sourceFiles.filter(f => fileIds.includes(f.id))
      : exam.sourceFiles;

    for (const f of filesToProcess) {
      const filePath = path.join(process.cwd(), f.url);
      const text = await extractTextFromFile(filePath);
      if (text) fileContents += `\n[${f.name}]:\n${text}\n`;
    }

    const params: ExamGenerationParams = {
      subject: exam.subject,
      grade: exam.grade,
      duration: exam.duration,
      totalScore: exam.totalScore,
      difficulty: exam.difficulty,
      nbCount: parseInt(nbCount),
      thCount: parseInt(thCount),
      vdCount: parseInt(vdCount),
      vdcCount: parseInt(vdcCount),
      fileContents: fileContents || undefined,
      customTopic: customTopic || undefined,
    };

    const questions = await generateExamWithAI(params);

    // Save questions back to exam
    const updatedExam = await prisma.exam.update({
      where: { id: req.params.id },
      data: { questions: questions as any },
    });

    res.json({ exam: updatedExam, questions });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Lỗi tạo đề bằng AI' });
  }
};

// POST /api/exams/generate-ai-quick
// body: { subject, grade, duration, totalScore, difficulty, nbCount, thCount, vdCount, vdcCount, customTopic, createdBy, title }
export const generateExamAIQuick = async (req: Request, res: Response) => {
  try {
    const {
      subject, grade, duration, totalScore, difficulty,
      nbCount = 6, thCount = 4, vdCount = 2, vdcCount = 1,
      customTopic, createdBy, title, courseId
    } = req.body;

    const params: ExamGenerationParams = {
      subject, grade,
      duration: parseInt(duration) || 45,
      totalScore: parseInt(totalScore) || 10,
      difficulty: difficulty || 'medium',
      nbCount: parseInt(nbCount),
      thCount: parseInt(thCount),
      vdCount: parseInt(vdCount),
      vdcCount: parseInt(vdcCount),
      customTopic,
    };

    const questions = await generateExamWithAI(params);

    const exam = await prisma.exam.create({
      data: {
        title: title || `Đề thi ${subject} lớp ${grade}`,
        subject, grade,
        duration: params.duration,
        totalScore: params.totalScore,
        difficulty: params.difficulty,
        questions: questions as any,
        createdBy: createdBy || '',
        courseId: courseId || null,
        status: 'draft',
      },
    });

    res.status(201).json({ exam, questions });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Lỗi tạo đề bằng AI' });
  }
};
