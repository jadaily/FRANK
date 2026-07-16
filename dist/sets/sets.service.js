"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetsService = void 0;
const common_1 = require("@nestjs/common");
const errors_1 = require("../errors");
const ranking_service_1 = require("../ranking/ranking.service");
const rm_calc_service_1 = require("../rm-calc/rm-calc.service");
const prisma_provider_1 = require("./prisma.provider");
let SetsService = class SetsService {
    constructor(rmCalcService = new rm_calc_service_1.RmCalcService(), rankingService = new ranking_service_1.RankingService(), prisma) {
        this.rmCalcService = rmCalcService;
        this.rankingService = rankingService;
        this.prisma = prisma;
    }
    async logSet(input) {
        if (!input?.userId) {
            throw new errors_1.BadRequestError('userId is required');
        }
        const rmResult = this.rmCalcService.calculateOneRepMax(input.weight, input.reps);
        const rankingResult = this.rankingService.calculateRating({
            weight: input.weight,
            reps: input.reps,
            sex: input.sex,
            bodyweightKg: input.bodyweightKg,
            exercise: input.exercise,
        }, 0);
        await this.prisma.saveSetLog({
            userId: input.userId,
            exercise: input.exercise,
            weight: input.weight,
            reps: input.reps,
            estimatedOneRepMax: rmResult.estimate,
        });
        await this.prisma.saveRatingHistory({
            userId: input.userId,
            exercise: input.exercise,
            rating: rankingResult.rating,
            delta: rankingResult.delta,
        });
        return {
            estimatedOneRepMax: rmResult.estimate,
            rating: rankingResult.rating,
            delta: rankingResult.delta,
            percentile: rankingResult.percentile,
            dots: rankingResult.dots,
            rankScore: rankingResult.rankScore,
            badgeRank: rankingResult.badgeRank,
            currentFormRank: rankingResult.currentFormRank,
            badgeProgressToNextRank: rankingResult.badgeProgressToNextRank,
            currentFormProgress: rankingResult.currentFormProgress,
            nextRankBoundary: rankingResult.nextRankBoundary,
            peakDots: rankingResult.peakDots,
            rollingAverageDots: rankingResult.rollingAverageDots,
            frankScore: rankingResult.frankScore,
            peakFrankScore: rankingResult.peakFrankScore,
            currentFrankScore: rankingResult.currentFrankScore,
            liftMultipliers: rankingResult.liftMultipliers,
        };
    }
};
exports.SetsService = SetsService;
exports.SetsService = SetsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(prisma_provider_1.PRISMA_PROVIDER)),
    __metadata("design:paramtypes", [rm_calc_service_1.RmCalcService,
        ranking_service_1.RankingService, Object])
], SetsService);
