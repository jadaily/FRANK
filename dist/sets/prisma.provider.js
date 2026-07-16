"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaProvider = exports.PRISMA_PROVIDER = void 0;
const prisma_service_1 = require("../prisma/prisma.service");
exports.PRISMA_PROVIDER = 'PRISMA_PROVIDER';
exports.prismaProvider = {
    provide: exports.PRISMA_PROVIDER,
    useFactory: (prisma) => ({
        saveSetLog: async (input) => prisma.setLog.create({ data: input }),
        saveRatingHistory: async (input) => prisma.ratingHistory.create({ data: input }),
    }),
    inject: [prisma_service_1.PrismaService],
};
