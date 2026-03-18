import { Router } from 'express';
import { getAssignments, getAssignmentById, submitAssignment, gradeAssignment } from '../controllers/assignment.controller';

const router = Router();

router.get('/', getAssignments);
router.get('/:id', getAssignmentById);
router.post('/:id/submit', submitAssignment);
router.post('/:id/grade', gradeAssignment);

export default router;
