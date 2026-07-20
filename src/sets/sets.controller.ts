import { Body, Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LogSetDto } from './dto/log-set.dto';
import { SetsService } from './sets.service';
import { GetUser } from '../auth/get-user.decorator';
import { EXERCISES } from '../ranking/exercise-config';

@Controller('sets')
export class SetsController {
  constructor(private readonly setsService: SetsService) {}

  @Get('exercises')
  async listExercises() {
    return {
      exercises: EXERCISES.map((exercise) => ({
        exercise: exercise.key,
        displayName: exercise.displayName,
        category: exercise.category,
      })),
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async logSet(@GetUser('userId') userId: string, @Body() input: LogSetDto) {
    return this.setsService.logSet(userId, input);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('dashboard')
  async getDashboard(@GetUser('userId') userId: string) {
    return this.setsService.getDashboard(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('history')
  async getHistory(@GetUser('userId') userId: string, @Query('exercise') exercise?: string) {
    return this.setsService.getHistory(userId, exercise);
  }
}
