import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Authentication Flow (Login & Register)', () => {
    let authController: AuthController;
    let mockJwtService: any
    let mockPrismaService: any;
    let userDatabase: any[] = [];

    beforeEach(async () => {
        userDatabase = [];

        mockPrismaService = {
            user: {
                findUnique : jest.fn().mockImplementation(({ where }) => {
                    return userDatabase.find(u => u.email === where.email) || null;
                }),
                create: jest.fn().mockImplementation(({ data }) => {
                    const newUser = { id: `id-${Date.now()}`, ...data };
                    userDatabase.push(newUser);
                    return newUser;
                }),
                update: jest.fn().mockImplementation(({ where, data }) => {
                    const userIndex = userDatabase.findIndex(u => u.id === where.id);
                    if (userIndex > -1) {
                        userDatabase[userIndex] = {...userDatabase[userIndex], ...data};
                        return userDatabase[userIndex];
                    }
                    return null;
                }),
            },
        };

        mockJwtService = {
            sign: jest.fn().mockReturnValue('mock-jwt-token-string')
        };

        const authService = new AuthService(mockPrismaService, mockJwtService);
        authController = new AuthController(authService, mockPrismaService as any);
    });

    describe('POST /auth/register', () => {
        it('should successfully build a profile account and hash the password', async () => {
            const payload = {
                email: 'tester@frank.com',
                password: 'securePassword123',
                name: 'Frank Lifter',
                sex: 'male' as const,
                bodyweightLbs: 82.5,
            };

            const result = await authController.register(payload);

            expect(result).toBeDefined();
            expect(result.email).toBe(payload.email);
            expect(result.name).toBe(payload.name);
            expect((result as any).password).toBeUndefined();

            const storedRecord = userDatabase[0];
            expect(storedRecord.password).not.toBe(payload.password);

            const isPasswordEncrypted = await bcrypt.compare(payload.password, storedRecord.password);
            expect(isPasswordEncrypted).toBe(true);
        });

        it('should throw a ConflictException error when using a duplicate email address', async () => {
            const duplicatePayload = {
                email: 'clash@strength.com',
                password: 'password888',
                name: 'Gym Member',
                sex: 'male' as const,
                bodyweightLbs: 80,
            };

            await authController.register(duplicatePayload);

            await expect(authController.register(duplicatePayload)).rejects.toThrow(ConflictException);
        });
    });

    describe('POST /auth/login', () => {
        it('should grant access tokens upon typing correct credentials', async () => {
            const registrationInfo = {
                email: 'active-user@frank.com',
                password: 'mySecretPassword9',
                name: 'Max Squat',
                sex: 'male' as const,
                bodyweightLbs: 90,
            };

            await authController.register(registrationInfo);

            const loginPayload = {email: registrationInfo.email, password: registrationInfo.password};
            const response = await authController.login(loginPayload);

            expect(response).toBeDefined();
            expect(response.access_token).toBe('mock-jwt-token-string');
            expect(response.user.email).toBe(registrationInfo.email);
        });

        it('should throw an UnauthorizedException if authentication credentials match fails', async () => {
            const accountSetup = {
                email: 'wrong-pass@frank.com',
                password: 'correctPasswordString',
                name: 'John Daily',
                sex: 'male' as const,
                bodyweightLbs: 75,
            };

            await authController.register(accountSetup);
            const incorrectLoginAttempt = {email: accountSetup.email, password: 'attackerBadPassword' };
            await expect(authController.login(incorrectLoginAttempt)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('PATCH /auth/weight', () => {
        it('should successfully patch bodyweight updates across database rows', async () => {
            const accountSetup = {
                email: 'change0weight@frank.com',
                password: 'password123',
                name: 'Weight Tracker',
                sex: 'female' as const,
                bodyweightLbs: 65,
            };

            const userRecord = await authController.register(accountSetup);
            const updateResult = await authController.updateWeight(userRecord.id, 62.5);

            expect(updateResult).toBeDefined();
            expect(userDatabase[0].bodyweightLbs).toBe(62.5);
        });
    });

    describe('PATCH /auth/hidden-exercises', () => {
        it('should persist a valid, normalized list of hidden exercises', async () => {
            const accountSetup = {
                email: 'hide-exercises@frank.com',
                password: 'password123',
                name: 'Picky Lifter',
                sex: 'male' as const,
                bodyweightLbs: 180,
            };

            const userRecord = await authController.register(accountSetup);
            const updateResult = await authController.updateHiddenExercises(userRecord.id, ['DEADLIFT', 'lat pulldown']);

            expect(updateResult.hiddenExercises).toEqual(['deadlift', 'lat pulldown']);
            expect(userDatabase[0].hiddenExercises).toEqual(['deadlift', 'lat pulldown']);
        });

        it('should reject an exercise key that is not in the registry', async () => {
            const accountSetup = {
                email: 'bad-exercise@frank.com',
                password: 'password123',
                name: 'Confused Lifter',
                sex: 'male' as const,
                bodyweightLbs: 180,
            };

            const userRecord = await authController.register(accountSetup);

            await expect(authController.updateHiddenExercises(userRecord.id, ['rowing'])).rejects.toThrow('unsupported exercise');
        });
    });
});