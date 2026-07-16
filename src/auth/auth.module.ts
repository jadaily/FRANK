import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./jwt.strategy";
import { PrismaService } from "../prisma/prisma.service";

@Module({
    imports: [
        PassportModule.register({defaultStrategy: 'jwt'}),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'fallbackSecretChangeInProduction',
            signOptions: { expiresIn: '1d' },
        }),
    ],
    providers: [AuthService, JwtStrategy, PrismaService],
    controllers: [AuthController],
    exports: [PassportModule, JwtStrategy],
})
export class AuthModule {}
