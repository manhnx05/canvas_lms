import prisma from '@/src/lib/prisma';

export const rewardService = {
  getRewards: async () => {
    return prisma.reward.findMany();
  },
  getPoints: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stars: true }
    });
    return user?.stars || 0;
  }
};
