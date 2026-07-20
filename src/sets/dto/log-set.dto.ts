import { IsIn, IsNumber, Min, Max, IsString, IsOptional } from 'class-validator';

export class LogSetDto {
  
  @IsString()
  exercise!: string;

  @IsNumber()
  @Min(1)
  weight!: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  reps!: number;


  @IsNumber()
  @Min(6)
  @Max(10)
  @IsOptional()
  rpe?: number;

  @IsIn(['working', 'warmup'])
  @IsOptional()
  setType?: 'working' | 'warmup';
}
