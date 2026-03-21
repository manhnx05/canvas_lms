import prisma from '../lib/prisma';

export const rewardService = {
  getRewards: async () => {
    return prisma.reward.findMany();
  }
};
