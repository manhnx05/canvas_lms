import { Router } from 'express';
import multer from 'multer';
import * as path from 'path';
import fs from 'fs';
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  downloadExam,
  uploadExamFile,
  deleteExamFile,
  generateExamAI,
  generateExamAIQuick
} from '../controllers/exam.controller';

const router = Router();

// Cấu hình Multer để upload tài liệu vào thư mục uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/', getExams);
router.get('/:id', getExamById);
router.post('/', createExam);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);

router.get('/:id/download', downloadExam);

// AI Generate
router.post('/:id/generate-ai', generateExamAI);
router.post('/generate-ai-quick', generateExamAIQuick);

// Upload
router.post('/upload-file', upload.single('file'), uploadExamFile);
router.delete('/files/:fileId', deleteExamFile);

export default router;
