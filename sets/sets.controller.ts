import { Body, Controller, Post } from '@nestjs/common';
import { LogSetDto } from './dto/log-set.dto';
import { SetsService } from './sets.service';

@Controller('sets')
export class SetsController {
  constructor(private readonly setsService: SetsService) {}

  @Post()
  async logSet(@Body() input: LogSetDto) {
    return this.setsService.logSet(input);
  }
}
