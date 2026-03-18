import { Router } from 'express';
import { getRewards } from '../controllers/reward.controller';

const router = Router();

router.get('/', getRewards);

export default router;
