import { Router } from 'express';
import {
  getAssignments, getAssignmentById, createAssignment,
  submitAssignment, gradeAssignment, deleteAssignment
} from '../controllers/assignment.controller';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

const router = Router();

router.get('/', getAssignments);
router.get('/:id', getAssignmentById);
router.post('/', createAssignment);
router.post('/:id/submit', upload.single('file'), submitAssignment);
router.post('/:id/grade', gradeAssignment);
router.delete('/:id', deleteAssignment);

export default router;
