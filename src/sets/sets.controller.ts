import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LogSetDto } from './dto/log-set.dto';
import { SetsService } from './sets.service';
import { GetUser } from '../auth/get-user.decorator';

@Controller('sets')
export class SetsController {
  constructor(private readonly setsService: SetsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async logSet(@GetUser('userId') userId: string, @Body() input: LogSetDto) {
    return this.setsService.logSet(userId, input);
  }
}
