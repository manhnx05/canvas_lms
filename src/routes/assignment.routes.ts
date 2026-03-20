import { Router } from 'express';
import {
  getAssignments, getAssignmentById, createAssignment,
  submitAssignment, gradeAssignment, deleteAssignment
} from '../controllers/assignment.controller';

const router = Router();

router.get('/', getAssignments);
router.get('/:id', getAssignmentById);
router.post('/', createAssignment);
router.post('/:id/submit', submitAssignment);
router.post('/:id/grade', gradeAssignment);
router.delete('/:id', deleteAssignment);

export default router;
