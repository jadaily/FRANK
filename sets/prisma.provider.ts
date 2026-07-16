import { PrismaService } from '../prisma/prisma.service';

export const PRISMA_PROVIDER = 'PRISMA_PROVIDER';

export const prismaProvider = {
  provide: PRISMA_PROVIDER,
  useFactory: (prisma: PrismaService) => ({
    saveSetLog: async (input: any) => prisma.setLog.create({ data: input }),
    saveRatingHistory: async (input: any) => prisma.ratingHistory.create({ data: input }),
  }),
  inject: [PrismaService],
};
