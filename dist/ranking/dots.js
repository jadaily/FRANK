"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDots = calculateDots;
const errors_1 = require("../errors");
function calculateDots(weightKg, bodyweightKg, sex) {
    if (bodyweightKg <= 0) {
        throw new errors_1.BadRequestError('bodyweight must be positive');
    }
    const sexFactor = sex === 'male' ? 1 : 0.92;
    const ratio = weightKg / bodyweightKg;
    return Number((ratio * 100 * sexFactor).toFixed(1));
}
