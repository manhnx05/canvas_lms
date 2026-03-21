import { Request, Response, NextFunction } from 'express';
import { rewardService } from '../services/rewardService';

export const getRewards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rewards = await rewardService.getRewards();
    res.json(rewards);
  } catch (error) {
    next(error);
  }
};
