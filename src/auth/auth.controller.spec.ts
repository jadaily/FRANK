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
    let mockAuthService: any;
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
            },
        };

        mockJwtService = {
            sign: jest.fn().mockReturnValue('mock-jwt-token-string')
        };

        const authService = new AuthService(mockPrismaService, mockJwtService);
        authController = new AuthController(authService);
    });

    describe('POST /auth/register', () => {
        it('should successfully build a profile account and hash the password', async () => {
            const payload = {
                email: 'tester@frank.com',
                password: 'securePassword123',
                name: 'Frank Lifter',
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
            };

            await authController.register(accountSetup);
            const incorrectLoginAttempt = {email: accountSetup.email, password: 'attackerBadPassword' };
            await expect(authController.login(incorrectLoginAttempt)).rejects.toThrow(UnauthorizedException);
        });
    });
});