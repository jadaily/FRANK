"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const log_set_dto_1 = require("./log-set.dto");
describe('LogSetDto validation', () => {
    it('accepts a well-formed set payload', async () => {
        const dto = new log_set_dto_1.LogSetDto();
        dto.userId = 'user-1';
        dto.exercise = 'squat';
        dto.weight = 225;
        dto.reps = 5;
        dto.sex = 'male';
        dto.bodyweightKg = 82.5;
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors).toHaveLength(0);
    });
    it('rejects invalid values', async () => {
        const dto = new log_set_dto_1.LogSetDto();
        dto.userId = '';
        dto.exercise = 'rowing';
        dto.weight = 0;
        dto.reps = 0;
        dto.sex = 'other';
        dto.bodyweightKg = 0;
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
});
