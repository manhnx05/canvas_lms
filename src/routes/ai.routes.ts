import { Router } from 'express';
import { generateQuiz, evaluateSubmission } from '../controllers/ai.controller';

const router = Router();

router.post('/generate-quiz', generateQuiz);
router.post('/evaluate-submission', evaluateSubmission);

export default router;
