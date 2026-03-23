import prisma from '@/src/lib/prisma';

export const rewardService = {
  getRewards: async () => {
    return prisma.reward.findMany();
  }
};
