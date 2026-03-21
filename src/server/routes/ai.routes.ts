import { Router } from 'express';
import { generateQuiz, evaluateSubmission, chat } from '../controllers/ai.controller';

const router = Router();

router.post('/generate-quiz', generateQuiz);
router.post('/evaluate-submission', evaluateSubmission);
router.post('/chat', chat);

export default router;
