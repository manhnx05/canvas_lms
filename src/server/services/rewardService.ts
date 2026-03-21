import prisma from '../../shared/lib/prisma';

export const rewardService = {
  getRewards: async () => {
    return prisma.reward.findMany();
  }
};
