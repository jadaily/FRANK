import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Request, Patch } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthGuard } from "@nestjs/passport";
import { GetUser } from "./get-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { EXERCISE_KEYS } from "../ranking/exercise-config";
import { BadRequestError } from "../errors";

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly prisma: PrismaService,
    ) {}

    @Post('register')
    async register(@Body() RegisterDto: RegisterDto) {
        return this.authService.register(RegisterDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('weight')
    async updateWeight(@GetUser('userId') userId: string, @Body('bodyweightLbs') weight: number) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { bodyweightLbs: parseFloat(weight as any) },
            select: { bodyweightLbs: true, name: true }
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('hidden-exercises')
    async updateHiddenExercises(@GetUser('userId') userId: string, @Body('hiddenExercises') hiddenExercises: string[]) {
        const normalized = (hiddenExercises || []).map((exercise) => exercise.toLowerCase());
        for (const exercise of normalized) {
            if (!EXERCISE_KEYS.includes(exercise)) {
                throw new BadRequestError(`unsupported exercise: ${exercise}`);
            }
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { hiddenExercises: normalized },
            select: { hiddenExercises: true },
        });
    }
}