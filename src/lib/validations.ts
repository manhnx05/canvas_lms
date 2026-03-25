import { z } from 'zod';

// Common validations
export const uuidSchema = z.string().uuid('ID không hợp lệ');
export const emailSchema = z.string().email('Email không hợp lệ');
export const passwordSchema = z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự');

// Auth validations
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mật khẩu không được để trống')
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(100, 'Tên không được quá 100 ký tự'),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['student', 'teacher']).refine((val) => ['student', 'teacher'].includes(val), {
    message: 'Vai trò phải là student hoặc teacher'
  })
});

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  otp: z.string().length(6, 'OTP phải có 6 ký tự'),
  newPassword: passwordSchema
});

// Course validations
export const createCourseSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').max(200, 'Tiêu đề không được quá 200 ký tự'),
  description: z.string().max(1000, 'Mô tả không được quá 1000 ký tự').optional(),
  color: z.string().min(1, 'Màu sắc không được để trống'),
  icon: z.string().min(1, 'Icon không được để trống'),
  teacher: z.string().min(1, 'Tên giáo viên không được để trống').optional(),
  teacherId: uuidSchema.optional()
});

export const updateCourseSchema = createCourseSchema.partial();

export const enrollmentSchema = z.object({
  userId: uuidSchema,
  courseId: uuidSchema
});

// Assignment validations
export const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').max(200, 'Tiêu đề không được quá 200 ký tự'),
  description: z.string().max(2000, 'Mô tả không được quá 2000 ký tự').optional(),
  courseId: uuidSchema,
  courseName: z.string().min(1, 'Tên khóa học không được để trống'),
  dueDate: z.string().datetime('Ngày hết hạn không hợp lệ'),
  starsReward: z.number().int().min(0, 'Điểm thưởng phải >= 0').max(100, 'Điểm thưởng phải <= 100'),
  type: z.enum(['quiz', 'drawing', 'reading', 'writing']).refine((val) => ['quiz', 'drawing', 'reading', 'writing'].includes(val), {
    message: 'Loại bài tập không hợp lệ'
  }),
  questions: z.array(z.any()).optional() // Will be validated separately for quiz type
});

export const submitAssignmentSchema = z.object({
  assignmentId: uuidSchema,
  answers: z.record(z.string(), z.string()).optional(),
  timestamp: z.string().datetime().optional()
});

export const gradeAssignmentSchema = z.object({
  submissionId: uuidSchema,
  score: z.number().int().min(0, 'Điểm số phải >= 0').max(100, 'Điểm số phải <= 100'),
  aiFeedback: z.string().max(2000, 'Phản hồi không được quá 2000 ký tự').optional()
});

// AI validations
export const generateQuizSchema = z.object({
  topic: z.string().min(1, 'Chủ đề không được để trống').max(200, 'Chủ đề không được quá 200 ký tự'),
  numQuestions: z.number().int().min(1, 'Số câu hỏi phải >= 1').max(50, 'Số câu hỏi phải <= 50'),
  gradeLevel: z.string().min(1, 'Cấp độ không được để trống')
});

export const aiChatSchema = z.object({
  message: z.string().min(1, 'Tin nhắn không được để trống').max(1000, 'Tin nhắn không được quá 1000 ký tự'),
  context: z.any().optional(),
  studentName: z.string().max(100, 'Tên học sinh không được quá 100 ký tự').optional(),
  gradeLevel: z.string().optional()
});

// Conversation validations
export const createConversationSchema = z.object({
  subject: z.string().min(1, 'Chủ đề không được để trống').max(200, 'Chủ đề không được quá 200 ký tự').optional(),
  courseId: uuidSchema.optional(),
  participantIds: z.array(uuidSchema).min(1, 'Phải có ít nhất 1 người tham gia')
});

export const sendMessageSchema = z.object({
  conversationId: uuidSchema,
  content: z.string().min(1, 'Nội dung tin nhắn không được để trống').max(2000, 'Tin nhắn không được quá 2000 ký tự'),
  attachments: z.array(z.any()).optional()
});

// Exam validations
export const createExamSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').max(200, 'Tiêu đề không được quá 200 ký tự'),
  subject: z.enum(['math', 'physics', 'chemistry', 'biology', 'literature', 'history', 'geography']).refine((val) => ['math', 'physics', 'chemistry', 'biology', 'literature', 'history', 'geography'].includes(val), {
    message: 'Môn học không hợp lệ'
  }),
  grade: z.enum(['1', '2', '3', '4', '5']).refine((val) => ['1', '2', '3', '4', '5'].includes(val), {
    message: 'Lớp không hợp lệ'
  }),
  duration: z.number().int().min(5, 'Thời gian thi phải >= 5 phút').max(300, 'Thời gian thi phải <= 300 phút'),
  totalScore: z.number().int().min(1, 'Tổng điểm phải >= 1').max(100, 'Tổng điểm phải <= 100'),
  difficulty: z.enum(['easy', 'medium', 'hard']).refine((val) => ['easy', 'medium', 'hard'].includes(val), {
    message: 'Độ khó không hợp lệ'
  }),
  questions: z.array(z.object({
    id: z.string(),
    question: z.string().min(1, 'Câu hỏi không được để trống'),
    options: z.array(z.object({
      id: z.string(),
      text: z.string().min(1, 'Đáp án không được để trống')
    })).length(4, 'Phải có đúng 4 đáp án'),
    correctOptionId: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    explanation: z.string().optional()
  })).min(1, 'Phải có ít nhất 1 câu hỏi'),
  courseId: uuidSchema.optional()
});

// User validations
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(100, 'Tên không được quá 100 ký tự').optional(),
  avatar: z.string().url('URL avatar không hợp lệ').optional(),
  className: z.string().max(50, 'Tên lớp không được quá 50 ký tự').optional()
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(100, 'Tên không được quá 100 ký tự'),
  email: emailSchema,
  role: z.enum(['student', 'teacher']),
  className: z.string().max(50, 'Tên lớp không được quá 50 ký tự').optional(),
  avatar: z.string().url('URL avatar không hợp lệ').optional()
});

// Utility function to validate request body
export function validateRequestBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  return result.data;
}

// Utility function to validate UUID params
export function validateUUID(id: string, fieldName: string = 'ID'): string {
  const result = uuidSchema.safeParse(id);
  if (!result.success) {
    throw new Error(`${fieldName} không hợp lệ`);
  }
  return result.data;
}