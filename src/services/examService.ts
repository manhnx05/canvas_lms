import prisma from '../lib/prisma';
import { generateExamWithAI, extractTextFromFile, ExamGenerationParams } from '../lib/exam.ai.service';
import * as path from 'path';
import * as fs from 'fs';
import { HttpError } from '../middleware/errorHandler';

export const examService = {
  getExams: async (query: any) => {
    const { courseId, subject, grade, createdBy, status } = query;
    const where: any = {};
    if (courseId) where.courseId = String(courseId);
    if (subject) where.subject = String(subject);
    if (grade) where.grade = String(grade);
    if (createdBy) where.createdBy = String(createdBy);
    if (status) where.status = String(status);

    return prisma.exam.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { sourceFiles: true },
    });
  },

  getExamById: async (id: string) => {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { sourceFiles: true, course: true },
    });
    if (!exam) throw new HttpError(404, 'Không tìm thấy đề thi');
    return exam;
  },

  createExam: async (data: any) => {
    const { title, subject, grade, duration, totalScore, difficulty, questions, courseId, createdBy, status } = data;
    return prisma.exam.create({
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
  },

  updateExam: async (id: string, data: any) => {
    const { title, subject, grade, duration, totalScore, difficulty, questions, courseId, status } = data;
    return prisma.exam.update({
      where: { id },
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
  },

  deleteExam: async (id: string) => {
    const files = await prisma.examFile.findMany({ where: { examId: id } });
    for (const f of files) {
      const filePath = path.join(process.cwd(), f.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    return prisma.exam.delete({ where: { id } });
  },

  downloadExam: async (id: string) => {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { sourceFiles: true },
    });
    if (!exam) throw new HttpError(404, 'Không tìm thấy đề thi');
    return exam;
  },

  uploadExamFile: async (file: any, examId: string) => {
    if (!file) throw new HttpError(400, 'Không có file được upload');
    return prisma.examFile.create({
      data: {
        name: file.originalname,
        size: file.size,
        type: 'textbook',
        url: file.path.replace(/\\/g, '/'),
        examId: examId || null,
      },
    });
  },

  deleteExamFile: async (fileId: string) => {
    const file = await prisma.examFile.findUnique({ where: { id: fileId } });
    if (!file) throw new HttpError(404, 'Không tìm thấy file');

    const filePath = path.join(process.cwd(), file.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return prisma.examFile.delete({ where: { id: fileId } });
  },

  generateExamAI: async (id: string, data: any) => {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { sourceFiles: true },
    });
    if (!exam) throw new HttpError(404, 'Không tìm thấy đề thi');

    const { nbCount = 6, thCount = 4, vdCount = 2, vdcCount = 1, fileIds, customTopic } = data;

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

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: { questions: questions as any },
    });

    return { exam: updatedExam, questions };
  },

  generateExamAIQuick: async (data: any) => {
    const {
      subject, grade, duration, totalScore, difficulty,
      nbCount = 6, thCount = 4, vdCount = 2, vdcCount = 1,
      customTopic, createdBy, title, courseId
    } = data;

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

    return { exam, questions };
  }
};
