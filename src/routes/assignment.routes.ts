import { Router } from 'express';
import { getAssignments, getAssignmentById, submitAssignment, gradeAssignment, createAssignment } from '../controllers/assignment.controller';

const router = Router();

router.get('/', getAssignments);
router.get('/:id', getAssignmentById);
router.post('/:id/submit', submitAssignment);
router.post('/:id/grade', gradeAssignment);
router.post('/', createAssignment);

export default router;
